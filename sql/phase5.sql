-- ============================================================
-- NOKTURNE — Phase 5 SQL: Referrals, Access Tiers, Versioning
-- Run in Supabase SQL Editor
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- FEATURE 4: REFERRAL TRACKING
-- referral_code already added to profiles in phase4.sql
-- This adds the tracking table and NTC payout trigger
-- ────────────────────────────────────────────────────────────

-- Ensure referral_code exists on profiles (safe to re-run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text DEFAULT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON profiles (referral_code) WHERE referral_code IS NOT NULL;

-- referrals table (already in phase4.sql, safe to re-run)
CREATE TABLE IF NOT EXISTS referrals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id   uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type         text NOT NULL DEFAULT 'license', -- 'license' | 'ntc_purchase'
  reward_ntc   numeric(10,2) DEFAULT 50,        -- NTC rewarded to referrer
  status       text NOT NULL DEFAULT 'pending', -- 'pending' | 'paid'
  created_at   timestamptz DEFAULT now(),
  paid_at      timestamptz,
  UNIQUE(referee_id)                            -- one referrer per referee
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

CREATE POLICY "insert referral"
  ON referrals FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "admin update referral"
  ON referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee  ON referrals (referee_id);


-- ────────────────────────────────────────────────────────────
-- FEATURE 5: TIME-BASED ACCESS TIERS
-- Add expiry and grace period columns to profiles (or user_roles)
-- ────────────────────────────────────────────────────────────

-- Add access expiry to user_roles table
-- (roles already drive access logic — expiry lives here)
ALTER TABLE user_roles
  ADD COLUMN IF NOT EXISTS access_expires_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grace_notified_at  timestamptz DEFAULT NULL; -- when 3-day warning was sent

CREATE INDEX IF NOT EXISTS idx_user_roles_expires ON user_roles (access_expires_at)
  WHERE access_expires_at IS NOT NULL;

-- ────────────────────────────────────────────────────────────
-- FEATURE 6: PLUGIN/MODULE VERSIONING
-- Extend the existing changelogs table to support bot modules
-- (modules are static in modules.html so we track by slug)
-- ────────────────────────────────────────────────────────────

-- Extend existing changelogs table with new columns
ALTER TABLE changelogs
  ADD COLUMN IF NOT EXISTS title       text,
  ADD COLUMN IF NOT EXISTS type        text DEFAULT 'patch'   -- 'major' | 'minor' | 'patch' | 'hotfix'
                           CHECK (type IN ('major','minor','patch','hotfix')),
  ADD COLUMN IF NOT EXISTS module_slug text,                   -- for bot modules e.g. 'bot-a', 'boost-timer'
  ADD COLUMN IF NOT EXISTS is_breaking boolean DEFAULT false;

-- Allow null plugin_id so module changelogs don't need a plugin row
ALTER TABLE changelogs ALTER COLUMN plugin_id DROP NOT NULL;

-- Drop existing narrow RLS and replace with broader policies
DROP POLICY IF EXISTS "read changelogs"  ON changelogs;
DROP POLICY IF EXISTS "insert changelog" ON changelogs;
DROP POLICY IF EXISTS "delete changelog" ON changelogs;

CREATE POLICY "members read changelogs"
  ON changelogs FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin insert changelog"
  ON changelogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );

CREATE POLICY "admin delete changelog"
  ON changelogs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('admin','moderator')
    )
  );

CREATE INDEX IF NOT EXISTS idx_changelogs_module ON changelogs (module_slug)
  WHERE module_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_changelogs_created ON changelogs (created_at DESC);


-- ────────────────────────────────────────────────────────────
-- EDGE FUNCTION: auto-downgrade expired roles
-- Deploy this as a Supabase Edge Function (pg_cron approach)
-- OR run it as a scheduled edge function called nightly
-- ────────────────────────────────────────────────────────────
-- Paste the function below into Supabase → Edge Functions as
-- "check-access-expiry" and schedule it daily via pg_cron:
--
--   SELECT cron.schedule(
--     'check-access-expiry',
--     '0 2 * * *',   -- runs at 02:00 UTC daily
--     $$
--       SELECT net.http_post(
--         url := 'https://<your-project>.supabase.co/functions/v1/check-access-expiry',
--         headers := '{"Authorization": "Bearer <service_role_key>"}'::jsonb
--       );
--     $$
--   );
--
-- The actual TypeScript edge function is in:
--   supabase/functions/check-access-expiry/index.ts
-- (included in this zip)
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- SEED: set a test expiry for manual testing
-- Replace <your-user-id> with a real UUID from auth.users
-- ────────────────────────────────────────────────────────────
-- UPDATE user_roles
-- SET access_expires_at = now() + interval '30 days'
-- WHERE user_id = '<your-user-id>';
