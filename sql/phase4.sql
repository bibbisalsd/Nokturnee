-- ============================================================
-- NOKTURNE Phase 4 SQL — Run in Supabase SQL Editor
-- ============================================================

-- 1. CHANGELOGS TABLE
CREATE TABLE IF NOT EXISTS changelogs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id  bigint REFERENCES plugins(id) ON DELETE CASCADE,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  version    text NOT NULL,
  notes      text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read changelogs"  ON changelogs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "insert changelog" ON changelogs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete changelog" ON changelogs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_changelogs_plugin ON changelogs (plugin_id);

-- 2. REPORTS TABLE
CREATE TABLE IF NOT EXISTS reports (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id        bigint REFERENCES plugins(id) ON DELETE CASCADE,
  reporter_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason           text NOT NULL,
  plugin_title     text,
  seller_username  text,
  created_at       timestamptz DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "insert report"   ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "admin read reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator'))
);
CREATE POLICY "admin delete reports" ON reports FOR DELETE USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin','moderator'))
);

-- 3. REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL, -- 'license' | 'ntc_purchase'
  reward_ntc   numeric(10,2) DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  UNIQUE(referee_id)
);
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);
CREATE POLICY "insert referral"    ON referrals FOR INSERT WITH CHECK (auth.uid() = referrer_id);

-- 4. NEW COLUMNS
ALTER TABLE plugins  ADD COLUMN IF NOT EXISTS max_downloads int DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles (referral_code) WHERE referral_code IS NOT NULL;

-- 5. ALLOW AUTHENTICATED USERS TO UPDATE THEIR OWN PLUGIN DESCRIPTION
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='plugins' AND policyname='owner update plugin') THEN
    CREATE POLICY "owner update plugin" ON plugins FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
