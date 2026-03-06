-- ============================================================
-- NOKTURNE — Private Changelog SQL
-- Run in Supabase SQL Editor
-- ============================================================
-- NOTE: The existing `changelogs` table in phase4.sql is scoped
-- to per-plugin versioning. This is a separate bot_changelog table
-- for operator-wide announcements and update entries.
-- ============================================================


-- 1. BOT_CHANGELOG — Operator posts entries here
CREATE TABLE IF NOT EXISTS bot_changelog (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author        text NOT NULL DEFAULT 'bxserkk',
  version       text NOT NULL,                    -- e.g. "v2.4.1"
  title         text NOT NULL,
  body          text NOT NULL,                    -- markdown
  type          text NOT NULL DEFAULT 'update'    -- update | feature | hotfix | announcement | maintenance
                CHECK (type IN ('update','feature','hotfix','announcement','maintenance')),
  comment_count int DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE bot_changelog ENABLE ROW LEVEL SECURITY;

-- Members can read all entries
CREATE POLICY "members read changelog"
  ON bot_changelog FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins/mods can post entries
CREATE POLICY "admin insert changelog"
  ON bot_changelog FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Admins/mods can delete entries
CREATE POLICY "admin delete changelog"
  ON bot_changelog FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

-- Allow updating comment_count
CREATE POLICY "auth update changelog"
  ON bot_changelog FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_bot_changelog_created ON bot_changelog (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_changelog_type    ON bot_changelog (type);


-- 2. CHANGELOG_REACTIONS — Aggregated counts per entry per emoji
-- Stores the total count so reads are fast (no GROUP BY needed)
CREATE TABLE IF NOT EXISTS changelog_reactions (
  entry_id   uuid REFERENCES bot_changelog(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  count      int  NOT NULL DEFAULT 0,
  PRIMARY KEY (entry_id, emoji)
);

ALTER TABLE changelog_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read reactions"
  ON changelog_reactions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "members insert reactions"
  ON changelog_reactions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "members update reactions"
  ON changelog_reactions FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "members delete reactions"
  ON changelog_reactions FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_cl_reactions_entry ON changelog_reactions (entry_id);


-- 3. CHANGELOG_REACTIONS_USERS — Tracks which user reacted with which emoji
-- Prevents double-reacting and allows un-reacting
CREATE TABLE IF NOT EXISTS changelog_reactions_users (
  entry_id   uuid REFERENCES bot_changelog(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (entry_id, user_id, emoji)
);

ALTER TABLE changelog_reactions_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own reactions"
  ON changelog_reactions_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "insert own reaction"
  ON changelog_reactions_users FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete own reaction"
  ON changelog_reactions_users FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_cl_react_users_entry  ON changelog_reactions_users (entry_id);
CREATE INDEX IF NOT EXISTS idx_cl_react_users_user   ON changelog_reactions_users (user_id);


-- 4. CHANGELOG_COMMENTS — Thread per entry
CREATE TABLE IF NOT EXISTS changelog_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id   uuid REFERENCES bot_changelog(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username   text NOT NULL,
  body       text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE changelog_comments ENABLE ROW LEVEL SECURITY;

-- Members can read all comments
CREATE POLICY "members read comments"
  ON changelog_comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Members can post comments
CREATE POLICY "members insert comment"
  ON changelog_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Members delete own; admins delete any
CREATE POLICY "owner delete comment"
  ON changelog_comments FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'moderator')
    )
  );

CREATE INDEX IF NOT EXISTS idx_cl_comments_entry    ON changelog_comments (entry_id);
CREATE INDEX IF NOT EXISTS idx_cl_comments_created  ON changelog_comments (created_at ASC);


-- ============================================================
-- OPTIONAL: Seed one entry to test the UI
-- Uncomment and run after tables are created
-- ============================================================

-- INSERT INTO bot_changelog (user_id, author, version, title, body, type)
-- VALUES (
--   auth.uid(),
--   'bxserkk',
--   'v1.0.0',
--   'Initial Release',
--   E'## Welcome to Nokturne\n\nThe bot is live. Here''s what''s included in the first build:\n\n- **AimAssist** module — adaptive targeting\n- **BoostManager** — intelligent boost collection\n- **SpeedBoost** — aerial speed optimization\n\nMore modules dropping soon. React below if you''re in.',
--   'announcement'
-- );
