'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { Bookmark } from '@/lib/types'

interface UseRealtimeBookmarksOptions {
  userId: string
  onInsert: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
}

/**
 * Real-time bookmark sync using two strategies:
 * 1. Supabase Realtime WebSocket (instant, when network allows)
 * 2. Polling fallback every 3 seconds (works on all networks)
 *
 * Both run simultaneously — polling catches anything WebSocket misses.
 */
export function useRealtimeBookmarks({
  userId,
  onInsert,
  onDelete,
}: UseRealtimeBookmarksOptions) {
  const onInsertRef = useRef(onInsert)
  const onDeleteRef = useRef(onDelete)
  const userIdRef = useRef(userId)
  const knownIdsRef = useRef<Set<string>>(new Set())
  const realtimeConnectedRef = useRef(false)

  useEffect(() => {
    onInsertRef.current = onInsert
    onDeleteRef.current = onDelete
    userIdRef.current = userId
  })

  // ── Strategy 1: Supabase Realtime WebSocket ──────────────────────────
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('bookmarks-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' },
        (payload) => {
          realtimeConnectedRef.current = true
          if (payload.eventType === 'INSERT') {
            const bookmark = payload.new as Bookmark
            if (bookmark.user_id === userIdRef.current) {
              knownIdsRef.current.add(bookmark.id)
              onInsertRef.current(bookmark)
            }
          }
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as Partial<Bookmark>
            if (deleted.id) onDeleteRef.current(deleted.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] WebSocket status:', status)
        if (status === 'SUBSCRIBED') realtimeConnectedRef.current = true
      })

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Strategy 2: Polling fallback every 3 seconds ─────────────────────
  // Compares current DB state against known IDs to detect changes
  useEffect(() => {
    const supabase = createClient()
    let lastKnownIds = new Set<string>()
    let isFirstRun = true

    const poll = async () => {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userIdRef.current)
        .order('created_at', { ascending: false })

      if (error || !data) return

      const currentIds = new Set(data.map((b: Bookmark) => b.id))

      if (isFirstRun) {
        // Seed known IDs on first run — don't fire events
        lastKnownIds = currentIds
        isFirstRun = false
        return
      }

      // Detect INSERTs — IDs in current but not in last
      for (const bookmark of data as Bookmark[]) {
        if (!lastKnownIds.has(bookmark.id)) {
          console.log('[Polling] Detected new bookmark:', bookmark.id)
          onInsertRef.current(bookmark)
        }
      }

      // Detect DELETEs — IDs in last but not in current
      lastKnownIds.forEach((id) => {
        if (!currentIds.has(id)) {
          console.log('[Polling] Detected deleted bookmark:', id)
          onDeleteRef.current(id)
        }
      })

      lastKnownIds = currentIds
    }

    // Poll every 3 seconds
    const interval = setInterval(poll, 3000)
    poll() // Run immediately

    return () => clearInterval(interval)
  }, [])
}
