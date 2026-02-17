'use client'

import type { BookmarkCategory } from '@/lib/types'

const ALL_CATEGORIES: BookmarkCategory[] = [
  '',
  'Work',
  'Personal',
  'Learning',
  'Entertainment',
  'Shopping',
  'News',
  'Social',
  'Other',
]

const CATEGORY_ICONS: Record<string, string> = {
  '': '🔖',
  Work: '💼',
  Personal: '👤',
  Learning: '📚',
  Entertainment: '🎬',
  Shopping: '🛍️',
  News: '📰',
  Social: '💬',
  Other: '📌',
}

interface CategoryFilterProps {
  value: BookmarkCategory
  onChange: (value: BookmarkCategory) => void
  counts: Record<string, number>
}

export function CategoryFilter({ value, onChange, counts }: CategoryFilterProps) {
  const availableCategories = ALL_CATEGORIES.filter(
    (cat) => cat === '' || (counts[cat] ?? 0) > 0
  )

  if (availableCategories.length <= 1) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {availableCategories.map((cat) => {
        const isActive = value === cat
        const count = cat === '' ? Object.values(counts).reduce((a, b) => a + b, 0) : (counts[cat] ?? 0)

        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0"
            style={
              isActive
                ? {
                    background: 'var(--accent)',
                    color: '#fff',
                    border: '1px solid var(--accent)',
                  }
                : {
                    background: 'var(--bg-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }
            }
          >
            <span className="text-xs">{CATEGORY_ICONS[cat]}</span>
            <span>{cat === '' ? 'All' : cat}</span>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full ml-0.5"
              style={{
                background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-subtle)',
                color: isActive ? '#fff' : 'var(--text-muted)',
              }}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
