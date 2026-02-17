'use client'

import { useState } from 'react'
import { deleteBookmarkClient } from '@/lib/clientActions'
import toast from 'react-hot-toast'
import type { Bookmark } from '@/lib/types'

interface BookmarkCardProps {
  bookmark: Bookmark
  onDelete: (id: string) => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Work:          { bg: '#dbeafe', text: '#1d4ed8' },
  Personal:      { bg: '#f0fdf4', text: '#16a34a' },
  Learning:      { bg: '#fef9c3', text: '#ca8a04' },
  Entertainment: { bg: '#fdf4ff', text: '#a21caf' },
  Shopping:      { bg: '#fff7ed', text: '#c2410c' },
  News:          { bg: '#f8fafc', text: '#475569' },
  Social:        { bg: '#fce7f3', text: '#be185d' },
  Other:         { bg: '#f5f5f5', text: '#525252' },
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getHostname(url: string): string {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return url }
}

export function BookmarkCard({ bookmark, onDelete }: BookmarkCardProps) {
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [imgError, setImgError] = useState(false)

  const categoryColors = bookmark.category ? CATEGORY_COLORS[bookmark.category] : null

  const handleDelete = async () => {
    // Optimistic: remove from UI immediately
    onDelete(bookmark.id)
    setDeleting(true)
    const result = await deleteBookmarkClient(bookmark.id)
    if (!result.success) {
      toast.error(result.error ?? 'Failed to delete bookmark.')
    } else {
      toast.success('Bookmark deleted.')
    }
    setDeleting(false)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      setCopied(true)
      toast.success('URL copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy URL.')
    }
  }

  return (
    <div className="bookmark-card group rounded-2xl border p-5 flex flex-col gap-4 relative"
      style={{
        background: 'var(--bg-card)',
        borderColor: 'var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        opacity: deleting ? 0.5 : 1,
        transition: 'opacity 0.2s ease, transform 0.15s ease, box-shadow 0.15s ease',
      }}>

      {/* Top: favicon + title + delete */}
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
          style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)' }}>
          {bookmark.favicon_url && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bookmark.favicon_url} alt="" className="w-5 h-5 object-contain" onError={() => setImgError(true)} />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm leading-tight truncate"
            style={{ color: 'var(--text-primary)', fontFamily: 'Syne, sans-serif' }} title={bookmark.title}>
            {bookmark.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }} title={bookmark.url}>
            {getHostname(bookmark.url)}
          </p>
        </div>

        <button onClick={handleDelete} disabled={deleting} aria-label="Delete"
          className="opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--danger-subtle)', color: 'var(--danger)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Category + date */}
      <div className="flex items-center gap-2 flex-wrap">
        {bookmark.category && categoryColors && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: categoryColors.bg, color: categoryColors.text }}>
            {bookmark.category}
          </span>
        )}
        <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
          {formatDate(bookmark.created_at)}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
        <button onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center"
          style={{
            background: 'var(--bg-subtle)',
            color: copied ? 'var(--success)' : 'var(--text-secondary)',
            border: `1px solid ${copied ? 'var(--success)' : 'var(--border)'}`,
          }}>
          {copied ? (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>Copied!</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>Copy URL</>
          )}
        </button>

        <a href={bookmark.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-1 justify-center no-underline"
          style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent)'; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--accent-subtle)'; (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open
        </a>
      </div>
    </div>
  )
}
