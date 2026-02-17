-- ============================================
-- Smart Bookmark App — Supabase SQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- TABLE: bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  favicon_url TEXT,
  category    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx    ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_created_at_idx ON bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS bookmarks_category_idx   ON bookmarks(category);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- SELECT: Users can only read their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON bookmarks
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: Users can only insert bookmarks for themselves
CREATE POLICY "Users can insert own bookmarks"
  ON bookmarks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
  ON bookmarks
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- REALTIME
-- Enable Postgres replication for the table
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;

-- ============================================
-- VERIFICATION (run after setup)
-- ============================================

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'bookmarks';

-- Check policies
-- SELECT * FROM pg_policies WHERE tablename = 'bookmarks';
