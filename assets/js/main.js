/**
 * NOKTURNE — Main Entry Point
 * Bootstraps all JS modules after DOM is ready.
 */

import { initNavbar }   from './modules/navbar.js';
import { initHeroCanvas } from './modules/canvas.js';
import { initFaq }      from './modules/faq.js';
import { initReveal, initPerfBars } from './modules/reveal.js';
import { initClipboard, initTickers } from './modules/ticker.js';

const boot = () => {
  /* ── Year ── */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Modules ── */
  initNavbar();
  initHeroCanvas();
  initTickers();
  initReveal();
  initPerfBars();
  initFaq();
  initClipboard();

  console.log('%c NOKTURNE ', 'background:#9B30FF;color:#fff;font-weight:bold;padding:4px 8px;');
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
