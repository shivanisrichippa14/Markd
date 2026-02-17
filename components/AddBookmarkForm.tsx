'use client'

import { useRef, useState } from 'react'
import { addBookmarkClient } from '@/lib/clientActions'
import toast from 'react-hot-toast'
import type { Bookmark, BookmarkCategory } from '@/lib/types'

const CATEGORIES: BookmarkCategory[] = [
  '', 'Work', 'Personal', 'Learning', 'Entertainment', 'Shopping', 'News', 'Social', 'Other',
]

interface AddBookmarkFormProps {
  onBookmarkAdded: (bookmark: Bookmark) => void
}

export function AddBookmarkForm({ onBookmarkAdded }: AddBookmarkFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const title = data.get('title')?.toString().trim() ?? ''
    const url = data.get('url')?.toString().trim() ?? ''
    const category = (data.get('category')?.toString() ?? '') as BookmarkCategory

    if (!title) { toast.error('Please enter a title.'); return }
    if (!url) { toast.error('Please enter a URL.'); return }

    setLoading(true)
    const result = await addBookmarkClient(title, url, category)
    setLoading(false)

    if (result.success && result.data) {
      toast.success('Bookmark saved!')
      formRef.current?.reset()
      setIsExpanded(false)
      // Instantly push the new bookmark into the parent's state
      onBookmarkAdded(result.data)
    } else {
      toast.error(result.error ?? 'Failed to save bookmark.')
    }
  }

  return (
    <div className="rounded-2xl border mb-8 overflow-hidden"
      style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>

      <button type="button" onClick={() => setIsExpanded(v => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
        style={{ color: 'var(--text-primary)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-subtle)' }}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              style={{ color: 'var(--accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>Add bookmark</span>
        </div>
        <svg className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <form ref={formRef} onSubmit={handleSubmit} className="px-6 pb-6 animate-slide-up">
          <div className="border-t mb-5" style={{ borderColor: 'var(--border)' }} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Title</label>
              <input name="title" type="text" required placeholder="My awesome link" maxLength={200}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>URL</label>
              <input name="url" type="text" required placeholder="https://example.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-subtle)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Category <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
              </label>
              <select name="category"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
                style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat === '' ? 'No category' : cat}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 mt-4">
            <button type="button" onClick={() => { formRef.current?.reset(); setIsExpanded(false) }}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ color: 'var(--text-secondary)', background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
              style={{ background: 'var(--accent)' }}>
              {loading ? (
                <><div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />Saving...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>Save bookmark</>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
