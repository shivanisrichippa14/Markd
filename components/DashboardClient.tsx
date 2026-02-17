'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRealtimeBookmarks } from '@/hooks/useRealtimeBookmarks'
import { Navbar } from './Navbar'
import { BookmarkList } from './BookmarkList'
import { AddBookmarkForm } from './AddBookmarkForm'
import type { Bookmark } from '@/lib/types'
// We use a minimal user shape for the Navbar — no need for the full User type

interface DashboardClientProps {
  userId: string
  userEmail: string
  userName: string
  userAvatar: string
}

export function DashboardClient({ userId, userEmail, userName, userAvatar }: DashboardClientProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)

  const user = {
    id: userId,
    email: userEmail,
    user_metadata: { full_name: userName, avatar_url: userAvatar },
  }

  // Initial load from Supabase
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[DashboardClient] load error:', error.message)
        setBookmarks((data as Bookmark[]) ?? [])
        setLoading(false)
      })
  }, [userId])

  // Called by Realtime INSERT — handles BOTH same-tab and cross-tab inserts
  const handleRealtimeInsert = useCallback((newBookmark: Bookmark) => {
    setBookmarks(prev => {
      // Deduplicate — same-tab optimistic update may have already added it
      if (prev.some(b => b.id === newBookmark.id)) return prev
      return [newBookmark, ...prev]
    })
  }, [])

  // Called by Realtime DELETE — handles cross-tab deletes
  const handleRealtimeDelete = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  // Single realtime subscription at the top level
  useRealtimeBookmarks({
    userId,
    onInsert: handleRealtimeInsert,
    onDelete: handleRealtimeDelete,
  })

  // Called by AddBookmarkForm for instant optimistic update in THIS tab
  // The realtime event will also fire and be deduped — no double-add
  const handleBookmarkAdded = useCallback((newBookmark: Bookmark) => {
    setBookmarks(prev => {
      if (prev.some(b => b.id === newBookmark.id)) return prev
      return [newBookmark, ...prev]
    })
  }, [])

  // Called by BookmarkCard for instant optimistic delete in THIS tab
  const handleBookmarkDeleted = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Navbar user={user} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-2xl border mb-8 skeleton" style={{ height: 64, borderColor: 'var(--border)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border skeleton" style={{ height: 180, borderColor: 'var(--border)' }} />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar user={user} />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddBookmarkForm onBookmarkAdded={handleBookmarkAdded} />
        <BookmarkList
          initialBookmarks={bookmarks}
          userId={userId}
          onBookmarkDeleted={handleBookmarkDeleted}
        />
      </main>
    </div>
  )
}
