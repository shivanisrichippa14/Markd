'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './supabaseServer'
import { isValidUrl, sanitizeTitle, normalizeUrl, getFaviconUrl } from './validators'
import type { ActionResult, BookmarkCategory } from './types'

/**
 * Server Action: Add a new bookmark for the authenticated user.
 * Uses getSession() (cookie-only) to avoid network calls to Supabase auth endpoint.
 */
export async function addBookmark(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()

  // getSession reads from cookie — no network call needed
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'You must be logged in to add bookmarks.' }
  }

  const user = session.user

  // Extract and normalise inputs
  const rawTitle = formData.get('title')?.toString() ?? ''
  const rawUrl = formData.get('url')?.toString() ?? ''
  const category = (formData.get('category')?.toString() ?? '') as BookmarkCategory

  const url = normalizeUrl(rawUrl)
  const title = sanitizeTitle(rawTitle)

  // Server-side validation
  if (!title || title.length < 1) {
    return { success: false, error: 'Title is required.' }
  }

  if (!isValidUrl(url)) {
    return { success: false, error: 'Please enter a valid URL (e.g. https://example.com).' }
  }

  // Auto-derive the favicon URL
  const favicon_url = getFaviconUrl(url)

  // Insert the bookmark — RLS ensures user_id matches auth.uid()
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      title,
      url,
      favicon_url,
      category: category || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[addBookmark] DB error:', error.message)
    return { success: false, error: 'Failed to save bookmark. Please try again.' }
  }

  revalidatePath('/dashboard')
  return { success: true, data }
}

/**
 * Server Action: Delete a bookmark by ID.
 * RLS guarantees users can only delete their own records.
 */
export async function deleteBookmark(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { success: false, error: 'You must be logged in.' }
  }

  if (!id || typeof id !== 'string') {
    return { success: false, error: 'Invalid bookmark ID.' }
  }

  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id) // Extra safety check on top of RLS

  if (error) {
    console.error('[deleteBookmark] DB error:', error.message)
    return { success: false, error: 'Failed to delete bookmark.' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
