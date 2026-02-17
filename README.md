# Markd — Smart Bookmark Manager

A full-stack bookmark manager built with Next.js 14 (App Router), Supabase, and TypeScript. Deployed at **[markd-zypt.vercel.app](https://markd-zypt.vercel.app)**.

---

## Features

- **Google OAuth only** — no email/password, one-click sign-in
- **Private bookmarks** — Row Level Security ensures users only ever see their own data
- **Real-time sync** — add a bookmark in one tab, it appears in another instantly
- **Categories** — tag bookmarks as Work, Personal, Learning, etc.
- **Search & sort** — instant client-side search, sort by newest/oldest/alphabetical
- **Auto favicon** — fetches website icons automatically
- **Dark / Light mode** — persisted across sessions
- **Optimistic UI** — adds and deletes feel instant before server confirms

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Auth | Supabase Auth + Google OAuth |
| Database | Supabase Postgres + RLS |
| Real-time | Supabase Realtime + polling fallback |
| Styling | Tailwind CSS + CSS variables |
| Deployment | Vercel |

---

## Project Structure

```
├── app/
│   ├── page.tsx                  # Redirects to /dashboard or /login
│   ├── login/page.tsx            # Google OAuth login
│   ├── dashboard/page.tsx        # Protected dashboard (server component)
│   └── auth/callback/page.tsx   # OAuth callback handler (client-side)
├── components/
│   ├── DashboardClient.tsx       # Owns bookmark state + realtime subscription
│   ├── AddBookmarkForm.tsx       # Add bookmark form
│   ├── BookmarkList.tsx          # Search, filter, sort
│   ├── BookmarkCard.tsx          # Individual card with delete
│   └── Navbar.tsx                # Google profile photo + sign out
├── hooks/
│   └── useRealtimeBookmarks.ts  # WebSocket + polling fallback
├── lib/
│   ├── supabaseClient.ts         # Browser client (singleton, cookie storage)
│   ├── supabaseServer.ts         # Server client
│   ├── clientActions.ts          # Browser-side add/delete (bypasses server)
│   └── validators.ts             # URL validation, XSS sanitization
└── middleware.ts                 # Route protection
```

---

## Database Schema

```sql
CREATE TABLE bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  favicon_url TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"   ON bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON bookmarks FOR DELETE USING (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
ALTER TABLE bookmarks REPLICA IDENTITY FULL;
```

---

## Problems I Ran Into and How I Solved Them

### 1. PKCE OAuth flow failing — "code verifier not found in storage"

**Problem:** After clicking "Continue with Google" and being redirected back, the app showed "Sign-in failed: PKCE code verifier not found in storage." The PKCE flow stores a `code_verifier` in localStorage before redirecting to Google, but a full-page navigation (`window.location.href`) caused the browser to lose it.

**Solution:** Two changes fixed this:
1. Switched the Supabase browser client to use **`document.cookie`** instead of localStorage for the PKCE verifier — cookies survive full redirects.
2. Used `skipBrowserRedirect: true` in `signInWithOAuth` to get the OAuth URL first, then navigated manually. This gave us control over when the redirect happened.

```typescript
const { data } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { skipBrowserRedirect: true, redirectTo: `${origin}/auth/callback` }
})
window.location.href = data.url  // Navigate after verifier is stored
```

---

### 2. Server can't reach Supabase — `ConnectTimeoutError`

**Problem:** The Next.js server (running locally and on certain networks) couldn't reach `supabase.co` on port 443. This caused `getUser()`, `exchangeCodeForSession()`, and all server-side Supabase calls to timeout after 10 seconds, making every page load slow or broken.

**Solution:** Moved everything that required a Supabase network call to the **browser side**:
- OAuth callback: made it a client component so `exchangeCodeForSession` runs in the browser (which can always reach Supabase)
- Dashboard data fetching: moved to a `useEffect` in a client component
- Add/delete actions: replaced Server Actions with `clientActions.ts` that call Supabase directly from the browser
- Auth checks: switched from `getUser()` (network call) to `getSession()` (reads cookie, no network needed)

---

### 3. Real-time WebSocket blocked — `Status: TIMED_OUT`

**Problem:** Supabase Realtime uses WebSockets (`wss://`). On restricted networks (corporate WiFi, certain ISPs), the WebSocket connection timed out immediately, meaning cross-tab sync didn't work.

**Solution:** Implemented a **dual-strategy approach** in `useRealtimeBookmarks.ts`:

```typescript
// Strategy 1: WebSocket (instant when available)
supabase.channel('bookmarks-realtime')
  .on('postgres_changes', { event: '*', table: 'bookmarks' }, handler)
  .subscribe()

// Strategy 2: Polling every 3 seconds (works everywhere)
setInterval(async () => {
  const { data } = await supabase.from('bookmarks').select('*').eq('user_id', userId)
  // Compare against lastKnownIds — fire onInsert/onDelete for any differences
}, 3000)
```

Both run simultaneously. WebSocket fires instantly when it works; polling catches anything it misses. This guarantees cross-tab sync on every network.

---

### 4. TypeScript strict mode failing on Vercel but not locally

**Problem:** Local `npm run dev` passed, but Vercel's production build failed with TypeScript errors:
- `'cookiesToSet' implicitly has an 'any' type` in `supabaseServer.ts` and `middleware.ts`
- `Conversion of type '...' to type 'User' may be a mistake` in `DashboardClient.tsx`
- `Set<string> can only be iterated through when using --downlevelIteration flag`

**Solution:**
1. Added explicit `CookieOptions` type annotation to `cookiesToSet` parameters
2. Replaced the `as User` cast with a minimal inline interface that only includes the fields actually used
3. Replaced `for...of` on `Set` with `Object.keys().forEach()` to avoid ES2015 iteration requirements

---

### 5. Bookmarks not appearing immediately after adding

**Problem:** Clicking "Save bookmark" saved to Supabase but the new card didn't appear in the list — only after a page refresh.

**Root cause:** `AddBookmarkForm` and `BookmarkList` each had their own isolated state with no way to communicate.

**Solution:** Lifted state up to `DashboardClient` which owns the `bookmarks[]` array. `AddBookmarkForm` receives an `onBookmarkAdded` callback and calls it with the new bookmark immediately after save. Deduplication ensures the realtime event doesn't double-add it:

```typescript
const handleBookmarkAdded = (newBookmark: Bookmark) => {
  setBookmarks(prev => {
    if (prev.some(b => b.id === newBookmark.id)) return prev  // dedupe
    return [newBookmark, ...prev]
  })
}
```

---

## Local Setup

```bash
git clone https://github.com/shivanisrichippa14/Markd.git
cd Markd
npm install

# Create .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=your_url" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key" >> .env.local

npm run dev
```

---

## Security

- **RLS policies** enforce `auth.uid() = user_id` on every query — no user can read or delete another user's bookmarks even with direct API access
- **PKCE flow** for OAuth — authorization codes can't be intercepted
- **URL validation** restricts to `http://https://` only
- **Title sanitization** prevents XSS
- **Anon key only** exposed to client — service role key never used
