// ============================================================
// NOKTURNE — check-access-expiry Edge Function
// Runs daily via pg_cron. Does two things:
//   1. Fires a 3-day warning notification to members expiring soon
//   2. Downgrades any roles that have actually expired
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL        = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const now      = new Date();
  const results  = { warned: 0, downgraded: 0, errors: [] as string[] };

  // ── 1. WARN members expiring in the next 3 days ──────────────
  const warnWindow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: expiringSoon, error: warnErr } = await supabase
    .from('user_roles')
    .select('user_id, role, access_expires_at')
    .not('access_expires_at', 'is', null)
    .lte('access_expires_at', warnWindow.toISOString())
    .gt('access_expires_at', now.toISOString())   // not yet expired
    .is('grace_notified_at', null);               // haven't warned yet

  if (warnErr) {
    results.errors.push('warn query: ' + warnErr.message);
  } else if (expiringSoon && expiringSoon.length > 0) {
    for (const row of expiringSoon) {
      const expiresAt  = new Date(row.access_expires_at);
      const daysLeft   = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const expiryStr  = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Send notification
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id:   row.user_id,
        type:      'access_expiring',
        title:     `Access expires in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        body:      `Your Nokturne ${row.role} access expires on ${expiryStr}. Renew via Discord to keep your slot.`,
        link_type: 'profile',
        link_id:   null,
      });

      if (notifErr) {
        results.errors.push(`notif for ${row.user_id}: ${notifErr.message}`);
        continue;
      }

      // Mark as warned so we don't spam
      await supabase
        .from('user_roles')
        .update({ grace_notified_at: now.toISOString() })
        .eq('user_id', row.user_id);

      results.warned++;
    }
  }

  // ── 2. DOWNGRADE expired members ──────────────────────────────
  const { data: expired, error: expErr } = await supabase
    .from('user_roles')
    .select('user_id, role')
    .not('access_expires_at', 'is', null)
    .lte('access_expires_at', now.toISOString())
    .neq('role', 'guest')      // don't re-downgrade guests
    .neq('role', 'admin')      // never downgrade admins
    .neq('role', 'moderator'); // never downgrade mods

  if (expErr) {
    results.errors.push('expired query: ' + expErr.message);
  } else if (expired && expired.length > 0) {
    for (const row of expired) {
      // Downgrade to guest
      const { error: downErr } = await supabase
        .from('user_roles')
        .update({
          role:               'guest',
          access_expires_at:  null,
          grace_notified_at:  null,
        })
        .eq('user_id', row.user_id);

      if (downErr) {
        results.errors.push(`downgrade ${row.user_id}: ${downErr.message}`);
        continue;
      }

      // Send expiry notification
      await supabase.from('notifications').insert({
        user_id:   row.user_id,
        type:      'access_expired',
        title:     'Your access has expired',
        body:      'Your Nokturne membership has ended. DM @bxserkk on Discord to renew.',
        link_type: 'discord',
        link_id:   null,
      });

      results.downgraded++;
    }
  }

  return new Response(JSON.stringify({ ok: true, ...results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
