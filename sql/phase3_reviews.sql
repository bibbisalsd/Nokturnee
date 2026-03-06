-- Plugin reviews table (run in Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS plugin_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id uuid REFERENCES plugins(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  author_reply text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plugin_id, user_id)
);

ALTER TABLE plugin_reviews ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plugin_reviews' AND policyname='read reviews') THEN
    CREATE POLICY "read reviews" ON plugin_reviews FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plugin_reviews' AND policyname='insert own review') THEN
    CREATE POLICY "insert own review" ON plugin_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plugin_reviews' AND policyname='update author reply') THEN
    CREATE POLICY "update author reply" ON plugin_reviews FOR UPDATE USING (
      auth.uid() = (SELECT user_id FROM plugins WHERE id = plugin_id)
    );
  END IF;
END $$;

-- Add columns if missing
ALTER TABLE plugins ADD COLUMN IF NOT EXISTS file_type text DEFAULT 'plugin';
ALTER TABLE plugins ADD COLUMN IF NOT EXISTS avg_rating numeric(3,1) DEFAULT 0;

-- forum_comments table
CREATE TABLE IF NOT EXISTS forum_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES forum_posts(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='forum_comments' AND policyname='read comments') THEN
    CREATE POLICY "read comments" ON forum_comments FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='forum_comments' AND policyname='insert comment') THEN
    CREATE POLICY "insert comment" ON forum_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Add reply_count to forum_posts if missing
ALTER TABLE forum_posts ADD COLUMN IF NOT EXISTS reply_count int DEFAULT 0;
