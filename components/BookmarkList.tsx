'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRealtimeBookmarks } from '@/hooks/useRealtimeBookmarks'
import { BookmarkCard } from './BookmarkCard'
import { SearchBar } from './SearchBar'
import { CategoryFilter } from './CategoryFilter'
import { SortDropdown } from './SortDropdown'
import type { Bookmark, BookmarkCategory, SortOption } from '@/lib/types'

interface BookmarkListProps {
  initialBookmarks: Bookmark[]
  userId: string
  onBookmarkDeleted: (id: string) => void
}

export function BookmarkList({ initialBookmarks, userId, onBookmarkDeleted }: BookmarkListProps) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<BookmarkCategory>('')
  const [sort, setSort] = useState<SortOption>('newest')

  // Realtime: handle INSERT from another tab
  const handleRealtimeInsert = useCallback((_bookmark: Bookmark) => {
    // Parent (DashboardClient) owns the bookmarks array.
    // Realtime inserts from THIS tab are already handled by onBookmarkAdded.
    // For other tabs, the parent would need a ref — for now the realtime
    // hook on the parent handles cross-tab sync via the subscription.
  }, [])

  // Realtime: handle DELETE from another tab  
  const handleRealtimeDelete = useCallback((id: string) => {
    onBookmarkDeleted(id)
  }, [onBookmarkDeleted])

  useRealtimeBookmarks({ userId, onInsert: handleRealtimeInsert, onDelete: handleRealtimeDelete })

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    initialBookmarks.forEach(b => {
      const cat = b.category || ''
      counts[cat] = (counts[cat] ?? 0) + 1
    })
    return counts
  }, [initialBookmarks])

  // Filter + search + sort
  const filtered = useMemo(() => {
    let result = [...initialBookmarks]
    if (category) result = result.filter(b => b.category === category)
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
      )
    }
    switch (sort) {
      case 'newest': result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break
      case 'oldest': result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break
      case 'alphabetical': result.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase())); break
    }
    return result
  }, [initialBookmarks, search, category, sort])

  const isFiltering = search.trim() !== '' || category !== ''

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
            Your bookmarks
          </h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {isFiltering ? `Showing ${filtered.length} of ${initialBookmarks.length}` : `${initialBookmarks.length} saved`}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} />
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {initialBookmarks.length > 0 && (
        <div className="mb-5">
          <CategoryFilter value={category} onChange={setCategory} counts={categoryCounts} />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
          {filtered.map(bookmark => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onBookmarkDeleted} />
          ))}
        </div>
      ) : (
        <EmptyState
          hasBookmarks={initialBookmarks.length > 0}
          isFiltering={isFiltering}
          onClearFilters={() => { setSearch(''); setCategory('') }}
        />
      )}
    </div>
  )
}

function EmptyState({ hasBookmarks, isFiltering, onClearFilters }: {
  hasBookmarks: boolean; isFiltering: boolean; onClearFilters: () => void
}) {
  if (isFiltering && hasBookmarks) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="text-4xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
          No matches found
        </h3>
        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Try adjusting your search or filters.</p>
        <button onClick={onClearFilters} className="px-5 py-2.5 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
          Clear filters
        </button>
      </div>
    )
  }
  return (
    <div className="text-center py-20 animate-fade-in">
      <div className="w-24 h-24 rounded-2xl mx-auto mb-6 flex items-center justify-center"
        style={{ background: 'var(--accent-subtle)' }}>
        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--accent)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
        No bookmarks yet
      </h3>
      <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
        Click <strong style={{ color: 'var(--accent)' }}>Add bookmark</strong> above to save your first link.
      </p>
    </div>
  )
}
