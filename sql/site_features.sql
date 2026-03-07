-- ============================================================
-- NOKTURNE — Site Features Table
-- Stores the feature set displayed on the Features page.
-- Admins can add, remove, and reorder features.
-- Run this in Supabase → SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS site_features (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  icon        text NOT NULL DEFAULT 'NEW',
  name        text NOT NULL,
  description text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE site_features ENABLE ROW LEVEL SECURITY;

-- Anyone can read features (public page)
CREATE POLICY "Anyone can read features"
  ON site_features FOR SELECT USING (true);

-- Only admins/moderators can insert
CREATE POLICY "Admins can insert features"
  ON site_features FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Only admins/moderators can update (reorder, edit)
CREATE POLICY "Admins can update features"
  ON site_features FOR UPDATE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Only admins/moderators can delete
CREATE POLICY "Admins can delete features"
  ON site_features FOR DELETE USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- Index for ordering
CREATE INDEX IF NOT EXISTS idx_site_features_sort ON site_features (sort_order ASC);

-- Seed with default features
INSERT INTO site_features (icon, name, description, sort_order) VALUES
  ('BOT', '4 Separate Bots', 'Bot-A, Bot-B, Bot-C, and Bot-D — each built for distinct functions and independently configurable.', 0),
  ('PY',  'Python Plugin API', 'Fully supported Python plugin API with coroutine safety, hot-reload, and a complete reference included with access.', 1),
  ('FRM', 'Advanced Forums & Roles', 'Access to an advanced forum layout with special roles and exclusive sections for premium users.', 2),
  ('$',   'Currency System', 'An in-platform currency used to purchase plugins, unlock rewards — and yes, you can withdraw it directly to your bank.', 3),
  ('EAC', 'EAC Bypass', 'Built-in bypass layer ensuring uninterrupted operation. Updated within 48h of any relevant patch.', 4),
  ('SEC', 'HWID Auth', 'Individually compiled binaries bound to your hardware ID. No shared links, no public repos.', 5);
