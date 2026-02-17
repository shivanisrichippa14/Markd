'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { Bookmark } from '@/lib/types'

interface UseRealtimeBookmarksOptions {
  userId: string
  onInsert: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

export function useRealtimeBookmarks({
  userId,
  onInsert,
  onDelete,
}: UseRealtimeBookmarksOptions) {
  const onInsertRef = useRef(onInsert)
  const onDeleteRef = useRef(onDelete)
  const userIdRef = useRef(userId)

  useEffect(() => {
    onInsertRef.current = onInsert
    onDeleteRef.current = onDelete
    userIdRef.current = userId
  })

  useEffect(() => {
    const supabase = createClient()

    console.log('[Realtime] Setting up subscription for user:', userId)

    const channel = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          console.log('[Realtime] Event received:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            const bookmark = payload.new as Bookmark
            if (bookmark.user_id === userIdRef.current) {
              console.log('[Realtime] INSERT for current user, updating state')
              onInsertRef.current(bookmark)
            }
          }

          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Partial<Bookmark>
            if (deleted.id) {
              console.log('[Realtime] DELETE received, id:', deleted.id)
              onDeleteRef.current(deleted.id)
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log('[Realtime] Status:', status, err ?? '')
      })

    return () => {
      console.log('[Realtime] Cleaning up subscription')
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
