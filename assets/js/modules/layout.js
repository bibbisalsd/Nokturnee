/**
 * NOKTURNE — Shared Navbar + Footer
 * NTC balance + role badge displayed in top-right at all times
 */

const SUPABASE_URL = 'https://mmovqnaeozhzzeazrgdm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CPoq9v6zAGVfRH4scFbxcA_gMRX4FJs';

export function renderNavbar(root = '', activePage = '') {
  const pages = [
    { href: `${root}pages/market.html`,   label: 'Market',   key: 'market'   },
    { href: `${root}pages/forum.html`,    label: 'Forum',    key: 'forum'    },
    { href: `${root}pages/pricing.html`,  label: 'Pricing',  key: 'pricing'  },
    { href: `${root}pages/coins.html`,    label: 'NTC',      key: 'coins'    },
    { href: `${root}pages/features.html`, label: 'Features', key: 'features' },
    { href: `${root}pages/discord.html`,  label: 'Discord',  key: 'discord'  },
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
          <span class="navbar__role-badge" id="navRoleBadge" style="display:none;"></span>
          <a href="${root}pages/profile.html" class="navbar__avatar-wrap" id="navAvatarWrap" style="display:none;">
            <img id="navAvatar" src="" alt="avatar" class="navbar__avatar" />
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

  // Load user info async
  loadNavUserInfo(root);
}

async function loadNavUserInfo(root) {
  try {
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const userId = session.user.id;
    const avatar = session.user.user_metadata?.avatar_url || '';

    // Load wallet + role in parallel
    const [walletRes, roleRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId).single(),
    ]);

    const balance = walletRes.data?.balance ?? 0;
    const role = roleRes.data?.role || 'guest';

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
    if (avatarWrap && avatarImg && avatar) {
      avatarImg.src = avatar;
      avatarWrap.style.display = 'flex';
    }
  } catch(e) {}
}

export function renderFooter(root = '') {
  const footerHTML = `
  <footer class="footer" role="contentinfo">
    <div class="footer__inner">
      <div class="footer__brand">NOKTURNE</div>
      <nav class="footer__links" aria-label="Footer navigation">
        <a href="${root}pages/features.html" class="footer__link">Features</a>
        <a href="${root}pages/pricing.html"  class="footer__link">Pricing</a>
        <a href="${root}pages/market.html"   class="footer__link">Market</a>
        <a href="${root}pages/forum.html"    class="footer__link">Forum</a>
        <a href="${root}pages/discord.html"  class="footer__link">Discord</a>
      </nav>
      <div class="footer__copy">© <span id="year"></span> Nokturne. All rights reserved.</div>
    </div>
  </footer>`;
  document.body.insertAdjacentHTML('beforeend', footerHTML);
  const yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
}
