'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { Bookmark } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeBookmarksOptions {
  userId: string
  onInsert: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

/**
 * Hook: Subscribes to real-time Postgres changes for the bookmarks table.
 * Filters events by user_id so users only receive their own updates.
 * Handles cleanup on unmount to prevent memory leaks.
 */
export function useRealtimeBookmarks({
  userId,
  onInsert,
  onDelete,
}: UseRealtimeBookmarksOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const onInsertRef = useRef(onInsert)
  const onDeleteRef = useRef(onDelete)

  // Keep refs current without re-subscribing
  useEffect(() => {
    onInsertRef.current = onInsert
    onDeleteRef.current = onDelete
  })

  const subscribe = useCallback(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`bookmarks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsertRef.current(payload.new as Bookmark)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onDeleteRef.current((payload.old as Bookmark).id)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    const cleanup = subscribe()
    return cleanup
  }, [subscribe])
}
