/**
 * NOKTURNE — Navbar Module
 * Handles scroll state, active link tracking, and mobile menu.
 */

export function initNavbar() {
  const navbar    = document.querySelector('.navbar');
  const toggle    = document.getElementById('navToggle');
  const mobileNav = document.getElementById('mobileNav');
  const links     = document.querySelectorAll('.navbar__link');

  if (!navbar) return;

  /* ── Scroll state ── */
  let lastScroll = 0;
  const onScroll = () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    lastScroll = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Active link on scroll ── */
  const sections = Array.from(
    document.querySelectorAll('section[id], div[id]')
  ).filter(s => s.id);

  const updateActive = () => {
    const y = window.scrollY + 80;
    let current = '';
    sections.forEach(s => {
      if (s.offsetTop <= y) current = s.id;
    });
    links.forEach(a => {
      const href = a.getAttribute('href')?.replace('#', '');
      a.classList.toggle('active', href === current);
    });
  };
  window.addEventListener('scroll', updateActive, { passive: true });

  /* ── Mobile menu ── */
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    // Close on link click
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('open') &&
          !mobileNav.contains(e.target) &&
          !toggle.contains(e.target)) {
        mobileNav.classList.remove('open');
        toggle.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }
}
