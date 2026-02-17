# Markd — Smart Bookmark Manager

A production-ready, full-stack bookmark management app built with Next.js 14 (App Router), Supabase, and TypeScript. Features real-time sync, Google OAuth, categories, search, sorting, dark mode, and optimistic UI updates.

---

## ✨ Features

- **Google OAuth** — one-click sign-in via Supabase Auth
- **Private bookmarks** — enforced via Supabase Row Level Security (RLS)
- **Real-time sync** — Supabase Realtime Postgres changes; open two tabs and watch them sync instantly
- **Auto favicon** — fetches website favicon automatically on add
- **Categories** — tag bookmarks (Work, Personal, Learning, etc.)
- **Search** — instant client-side search by title or URL
- **Sort** — newest, oldest, or alphabetical
- **Dark / Light mode** — persisted in localStorage
- **Optimistic UI** — deletes are instant; no waiting for server
- **Skeleton loading** — professional loading states
- **Copy URL** — one-click clipboard copy
- **Open in tab** — direct link to bookmark
- **Empty states** — helpful prompts when no bookmarks

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Auth | Supabase Auth + Google OAuth |
| Database | Supabase Postgres |
| Realtime | Supabase Realtime |
| Styling | Tailwind CSS + CSS Variables |
| Notifications | react-hot-toast |
| Deployment | Vercel |

---

## 📁 Project Structure

```
smart-bookmark-app/
├── app/
│   ├── layout.tsx              # Root layout with Toaster
│   ├── page.tsx                # Redirect root → /dashboard or /login
│   ├── login/page.tsx          # Google OAuth login page
│   ├── dashboard/
│   │   ├── page.tsx            # Server Component — fetches initial bookmarks
│   │   ├── loading.tsx         # Skeleton UI
│   │   └── error.tsx           # Error boundary
│   └── auth/callback/route.ts  # OAuth callback handler
│
├── components/
│   ├── Navbar.tsx              # Top navigation with user info & sign-out
│   ├── AddBookmarkForm.tsx     # Collapsible form with server action
│   ├── BookmarkList.tsx        # Client component with realtime + filtering
│   ├── BookmarkCard.tsx        # Individual bookmark card
│   ├── SearchBar.tsx           # Search input
│   ├── CategoryFilter.tsx      # Category pill filters
│   ├── SortDropdown.tsx        # Sort selector
│   └── ThemeToggle.tsx         # Dark/light mode toggle
│
├── lib/
│   ├── supabaseClient.ts       # Browser Supabase client
│   ├── supabaseServer.ts       # Server Supabase client (cookies)
│   ├── serverActions.ts        # addBookmark + deleteBookmark
│   ├── validators.ts           # URL validation, sanitization, favicon
│   └── types.ts                # TypeScript types
│
├── hooks/
│   └── useRealtimeBookmarks.ts # Supabase Realtime subscription
│
├── middleware.ts               # Route protection (auth guard)
└── styles/globals.css          # CSS variables + global styles
```

---

## 🗄️ Supabase Setup

### 1. Create a Supabase Project

Go to [supabase.com](https://supabase.com) → New Project.

### 2. Run this SQL in the Supabase SQL Editor

```sql
-- ============================================
-- TABLE: bookmarks
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  favicon_url TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx  ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON bookmarks(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only INSERT bookmarks for themselves
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only DELETE their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REALTIME — enable for the bookmarks table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
```

### 3. Enable Google OAuth in Supabase

1. Go to **Authentication → Providers → Google**
2. Enable Google OAuth
3. Add your **Google Client ID** and **Client Secret** (from [Google Cloud Console](https://console.cloud.google.com))
4. Add authorized redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`

### 4. Configure allowed redirect URLs

In Supabase → **Authentication → URL Configuration**:
- Site URL: `https://your-domain.vercel.app`
- Redirect URLs: `https://your-domain.vercel.app/auth/callback`

For local dev, also add: `http://localhost:3000/auth/callback`

---

## ⚙️ Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **Never** use the `service_role` key in the client. The anon key + RLS is all you need.

---

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open in browser
open http://localhost:3000
```

---

## 🔐 Security Architecture

### Row Level Security (RLS)

RLS is enabled on the `bookmarks` table. Every query is automatically scoped to the authenticated user:

```sql
-- auth.uid() returns the JWT user ID — Supabase injects this automatically
USING (auth.uid() = user_id)
```

This means:
- Even if a user guesses another user's bookmark ID, the query returns nothing
- The service role key is never exposed to the client
- Server Actions double-check `user_id = user.id` for defence-in-depth

### Input Sanitization

- Titles are HTML-escaped server-side to prevent XSS
- URLs are validated to `http://` or `https://` scheme only
- Max title length: 200 characters

---

## ⚡ Real-Time Architecture

Real-time updates use Supabase's Postgres Replication pipeline:

```
Postgres WAL → Supabase Realtime → WebSocket → Client
```

Implementation in `hooks/useRealtimeBookmarks.ts`:

```typescript
supabase
  .channel(`bookmarks:${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'bookmarks',
    filter: `user_id=eq.${userId}`,  // Only receive own events
  }, (payload) => {
    onInsert(payload.new as Bookmark)
  })
  .on('postgres_changes', { event: 'DELETE', ... }, ...)
  .subscribe()
```

Key design decisions:
- **Filtered by `user_id`** — users only receive their own events
- **Deduplication** — realtime INSERT is deduplicated against optimistic updates
- **Cleanup on unmount** — `supabase.removeChannel(channel)` prevents memory leaks
- **Stable refs** — callbacks stored in refs so the subscription never needs to resubscribe

---

## 🌐 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/smart-bookmark-app.git
git push -u origin main
```

### 2. Import to Vercel

1. Go to [vercel.com](https://vercel.com) → Import Project
2. Select your GitHub repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Click **Deploy**

### 3. Update Supabase redirect URLs

After deployment, add your Vercel URL to Supabase:
- Site URL: `https://your-app.vercel.app`
- Redirect URL: `https://your-app.vercel.app/auth/callback`

---

## 🧠 Architecture Decisions

| Decision | Reason |
|----------|--------|
| App Router Server Components | Better performance, streaming, no client bundle for static data |
| Server Actions for mutations | Type-safe, no API routes needed, integrated with `useTransition` |
| Client component for BookmarkList | Required for realtime subscription and interactive state |
| CSS variables for theming | Dark mode without Tailwind's `dark:` class repetition; simpler |
| Google S2 favicon service | No server-side scraping needed, fast, reliable |
| Optimistic deletes | Perceived performance — UX feels instant |

---

## 🐛 Challenges & Solutions

### Challenge 1: Session not refreshing after OAuth redirect
**Solution**: Middleware calls `supabase.auth.getUser()` on every request. This triggers token refresh via `setAll` on cookies, keeping the session alive across Server Components.

### Challenge 2: Realtime events duplicating with optimistic updates
**Solution**: Before inserting a realtime INSERT event into state, we check `prev.some(b => b.id === newBookmark.id)`. Since the optimistic update happens before realtime fires, duplicates are cleanly skipped.

### Challenge 3: Dark mode flash on page load (FOUC)
**Solution**: Inline `<script>` in `<head>` reads `localStorage` and applies `.dark` class to `<html>` before React hydrates, preventing the flash.

### Challenge 4: Server Actions with `useTransition`
**Solution**: Wrapped server action calls in `startTransition`. This keeps the UI interactive during the pending state and enables the `isPending` flag for loading UI without extra state.

---

## 📄 License

MIT
