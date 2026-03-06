-- ============================================================
-- NOKTURNE — Supabase Setup SQL (v2 — Reddit-style Forum)
-- Run this in Supabase → SQL Editor
-- ============================================================


-- ──────────────────────────────────────────────
-- 1. FORUM_POSTS — add new columns
-- ──────────────────────────────────────────────
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS username   text NOT NULL DEFAULT 'Unknown',
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS content    text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS title      text NOT NULL DEFAULT 'Untitled',
  ADD COLUMN IF NOT EXISTS category   text NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS upvotes    integer NOT NULL DEFAULT 0;


-- ──────────────────────────────────────────────
-- 2. COMMENTS — threaded replies per post
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username    text NOT NULL DEFAULT 'Unknown',
  avatar_url  text,
  content     text NOT NULL DEFAULT '',
  upvotes     integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);


-- ──────────────────────────────────────────────
-- 3. VOTES — tracks who voted on what (no double-voting)
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS votes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL,   -- post id or comment id
  value       integer NOT NULL CHECK (value IN (1, -1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_id)
);


-- ──────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ──────────────────────────────────────────────

-- forum_posts
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read posts" ON forum_posts;
DROP POLICY IF EXISTS "Users can insert own posts"         ON forum_posts;
DROP POLICY IF EXISTS "Users can delete own posts"         ON forum_posts;
DROP POLICY IF EXISTS "Users can update own posts"         ON forum_posts;

CREATE POLICY "Authenticated users can read posts"
  ON forum_posts FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own posts"
  ON forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON forum_posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON forum_posts FOR DELETE USING (auth.uid() = user_id);

-- Allow authenticated users to update upvotes (voting by others)
CREATE POLICY "Authenticated users can update upvotes on posts"
  ON forum_posts FOR UPDATE USING (auth.role() = 'authenticated');


-- comments
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read comments"
  ON comments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own comments"
  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update comment upvotes"
  ON comments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE USING (auth.uid() = user_id);


-- votes
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all votes"
  ON votes FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own votes"
  ON votes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE USING (auth.uid() = user_id);


-- ──────────────────────────────────────────────
-- 5. REALTIME
-- ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE forum_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;


-- ──────────────────────────────────────────────
-- 6. INDEXES (performance)
-- ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_forum_posts_category   ON forum_posts (category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON forum_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_id       ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_target      ON votes (user_id, target_id);
