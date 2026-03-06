/**
 * NOKTURNE — Shared Navbar + Footer
 * NTC balance + role badge + notification bell
 */

const SUPABASE_URL = 'https://mmovqnaeozhzzeazrgdm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CPoq9v6zAGVfRH4scFbxcA_gMRX4FJs';

export function renderNavbar(root = '', activePage = '') {
  const pages = [
    { href: `${root}pages/features.html`,  label: 'Features',  key: 'features'  },
    { href: `${root}pages/forum.html`,     label: 'Community', key: 'forum'     },
    { href: `${root}pages/changelog.html`, label: 'Updates',   key: 'changelog' },
    { href: `${root}pages/pricing.html`,   label: 'Purchase',  key: 'pricing'   },
    { href: `${root}pages/discord.html`,   label: 'Discord',   key: 'discord'   },
  ];

  const navLinks = pages.map(p =>
    `<a href="${p.href}" class="navbar__link${activePage === p.key ? ' active' : ''}">${p.label}</a>`
  ).join('\n        ');

  const mobileLinks = pages.map(p =>
    `<a href="${p.href}" class="mobile-nav__link">${p.label}</a>`
  ).join('\n    ');

  const navHTML = `
  <header class="navbar" role="banner">
    <div class="navbar__inner">
      <a href="${root}index.html" class="navbar__brand" aria-label="Nokturne Home">
        <img src="${root}assets/images/nokturne-banner.png" alt="Nokturne" class="navbar__logo" />
      </a>
      <nav class="navbar__links" aria-label="Primary navigation">
        ${navLinks}
      </nav>
      <div class="navbar__actions">
        <div class="navbar__user-info" id="navUserInfo">
          <div class="navbar__ntc" id="navNtc" style="display:none;">
            <span class="navbar__ntc-icon">◈</span>
            <span id="navNtcBal">0</span>
            <span class="navbar__ntc-label">NTC</span>
          </div>
          <div class="navbar__bell-wrap" id="navBellWrap" style="display:none;position:relative;">
            <button class="navbar__bell" id="navBellBtn" aria-label="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span class="navbar__bell-badge" id="navBellBadge" style="display:none;">0</span>
            </button>
            <div class="navbar__notif-dropdown" id="navNotifDropdown">
              <div class="notif-dropdown__hd">
                <span>Notifications</span>
                <button class="notif-mark-read" id="navMarkRead">Mark all read</button>
              </div>
              <div class="notif-dropdown__list" id="navNotifList">
                <div class="notif-empty">No notifications</div>
              </div>
            </div>
          </div>
          <span class="navbar__role-badge" id="navRoleBadge" style="display:none;"></span>
          <a href="${root}pages/login.html" class="navbar__discord-login" id="navLoginBtn">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0;"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.036.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
            Login with Discord
          </a>
          <a href="${root}pages/profile.html" class="navbar__avatar-wrap" id="navAvatarWrap" style="display:none;">
            <div class="navbar__avatar-placeholder" id="navAvatarPlaceholder">◈</div>
            <img id="navAvatar" src="" alt="avatar" class="navbar__avatar" style="display:none;" />
          </a>
        </div>
        <button class="navbar__toggle" id="navToggle" aria-label="Toggle navigation" aria-expanded="false" aria-controls="mobileNav">
          <span></span><span></span><span></span>
        </button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav" id="mobileNav" aria-label="Mobile navigation">
    ${mobileLinks}
  </nav>`;

  document.body.insertAdjacentHTML('afterbegin', navHTML);
  loadNavUserInfo(root);
}

async function loadNavUserInfo(root) {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const loginBtn = document.getElementById('navLoginBtn');
    if (loginBtn) loginBtn.style.display = 'none';
    const userId = session.user.id;
    const avatar = session.user.user_metadata?.avatar_url || '';

    const [walletRes, roleRes, notifRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
      supabase.from('notifications').select('*').eq('user_id', userId).eq('is_read', false).order('created_at', { ascending: false }).limit(20),
    ]);

    const balance = walletRes.data?.balance ?? 0;
    const role = roleRes.data?.role || 'guest';
    const notifs = notifRes.data || [];

    // NTC
    const ntcEl = document.getElementById('navNtc');
    const ntcBal = document.getElementById('navNtcBal');
    if (ntcEl && ntcBal) { ntcBal.textContent = balance; ntcEl.style.display = 'flex'; }

    // Role badge
    const roleEl = document.getElementById('navRoleBadge');
    if (roleEl) {
      const roleMap = {
        admin:     { label: 'Admin',     cls: 'role-admin'     },
        moderator: { label: 'Mod',       cls: 'role-mod'       },
        premium:   { label: 'Premium',   cls: 'role-premium'   },
        member:    { label: 'Member',    cls: 'role-member'    },
        guest:     { label: 'Guest',     cls: 'role-guest'     },
      };
      const r = roleMap[role] || roleMap.guest;
      roleEl.textContent = r.label;
      roleEl.className = `navbar__role-badge ${r.cls}`;
      roleEl.style.display = 'inline-block';
    }

    // Avatar
    const avatarWrap = document.getElementById('navAvatarWrap');
    const avatarImg = document.getElementById('navAvatar');
    const avatarPlaceholder = document.getElementById('navAvatarPlaceholder');
    if (avatarWrap) {
      avatarWrap.style.display = 'flex';
      if (avatar && avatarImg) {
        avatarImg.src = avatar;
        avatarImg.style.display = 'block';
        if (avatarPlaceholder) avatarPlaceholder.style.display = 'none';
      }
    }

    // Bell
    const bellWrap = document.getElementById('navBellWrap');
    if (bellWrap) { bellWrap.style.display = 'flex'; }
    const badge = document.getElementById('navBellBadge');
    if (badge && notifs.length > 0) {
      badge.textContent = notifs.length > 9 ? '9+' : notifs.length;
      badge.style.display = 'flex';
    }

    // Notification list
    const notifList = document.getElementById('navNotifList');
    if (notifList && notifs.length > 0) {
      notifList.innerHTML = notifs.map(n => `
        <div class="notif-item">
          <div class="notif-item__title">${escHtml(n.title || '')}</div>
          <div class="notif-item__body">${escHtml(n.body || '')}</div>
          <div class="notif-item__time">${timeAgo(n.created_at)}</div>
        </div>`).join('');
    }

    // Bell toggle
    const bellBtn = document.getElementById('navBellBtn');
    const dropdown = document.getElementById('navNotifDropdown');
    if (bellBtn && dropdown) {
      bellBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    // Mark all read
    const markRead = document.getElementById('navMarkRead');
    if (markRead) {
      markRead.addEventListener('click', async () => {
        await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
        if (badge) badge.style.display = 'none';
        if (notifList) notifList.innerHTML = '<div class="notif-empty">No notifications</div>';
      });
    }
  } catch(e) { console.error('Nav user info error:', e); }
}

function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60) return s + 's ago';
  if (s < 3600) return Math.floor(s/60) + 'm ago';
  if (s < 86400) return Math.floor(s/3600) + 'h ago';
  return Math.floor(s/86400) + 'd ago';
}

export function renderFooter(root = '') {
  const footerHTML = `
  <footer class="footer" role="contentinfo">
    <div class="footer__inner">
      <div class="footer__brand">NOKTURNE</div>
      <nav class="footer__links" aria-label="Footer navigation">
        <a href="${root}pages/features.html" class="footer__link">Features</a>
        <a href="${root}pages/pricing.html"  class="footer__link">Purchase</a>
        <a href="${root}pages/forum.html"    class="footer__link">Community</a>
        <a href="${root}pages/discord.html"  class="footer__link">Discord</a>
      </nav>
      <div class="footer__copy">© <span id="year"></span> Nokturne. All rights reserved.</div>
    </div>
  </footer>`;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
}
