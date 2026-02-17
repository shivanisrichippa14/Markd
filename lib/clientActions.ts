/**
 * Client-side bookmark actions.
 *
 * We use the browser Supabase client here instead of Server Actions
 * because Server Actions run on the Node.js server which cannot reach
 * Supabase on restricted networks. The browser can always reach Supabase.
 *
 * Security is still enforced via Supabase RLS policies — users can only
 * insert/delete their own rows regardless of which client calls it.
 */
import { createClient } from './supabaseClient'
import { isValidUrl, sanitizeTitle, normalizeUrl, getFaviconUrl } from './validators'
import type { ActionResult, BookmarkCategory } from './types'

export async function addBookmarkClient(
  title: string,
  url: string,
  category: BookmarkCategory
): Promise<ActionResult> {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'You must be logged in.' }
  }

  const cleanUrl = normalizeUrl(url.trim())
  const cleanTitle = sanitizeTitle(title.trim())

  if (!cleanTitle) return { success: false, error: 'Title is required.' }
  if (!isValidUrl(cleanUrl)) return { success: false, error: 'Please enter a valid URL (e.g. https://example.com).' }

  const favicon_url = getFaviconUrl(cleanUrl)

  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: session.user.id,
      title: cleanTitle,
      url: cleanUrl,
      favicon_url,
      category: category || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: 'Failed to save bookmark. Please try again.' }
  }

  return { success: true, data }
}

export async function deleteBookmarkClient(id: string): Promise<ActionResult> {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) return { success: false, error: 'You must be logged in.' }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id)

  if (error) {
    return { success: false, error: 'Failed to delete bookmark.' }
  }

  return { success: true }
}
