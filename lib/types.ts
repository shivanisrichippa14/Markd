export type BookmarkCategory =
  | 'Work'
  | 'Personal'
  | 'Learning'
  | 'Entertainment'
  | 'Shopping'
  | 'News'
  | 'Social'
  | 'Other'
  | ''

export interface Bookmark {
  id: string
  user_id: string
  title: string
  url: string
  favicon_url: string | null
  category: BookmarkCategory
  created_at: string
}

export interface AddBookmarkInput {
  title: string
  url: string
  category?: BookmarkCategory
}

export type SortOption = 'newest' | 'oldest' | 'alphabetical'

export interface BookmarkFilters {
  search: string
  category: BookmarkCategory
  sort: SortOption
}

export interface ActionResult {
  success: boolean
  error?: string
  data?: Bookmark
}
