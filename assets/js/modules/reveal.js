/**
 * NOKTURNE — Scroll Reveal & Performance Bars Module
 */

export function initReveal() {
  /* ── Scroll reveal ── */
  const reveals = document.querySelectorAll('.reveal');

  if (!reveals.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Slight stagger based on DOM order within parent
          const siblings = Array.from(entry.target.parentElement?.querySelectorAll('.reveal') || []);
          const idx = siblings.indexOf(entry.target);
          const delay = parseFloat(entry.target.dataset.delay || (idx * 0.07).toFixed(2));
          entry.target.style.transitionDelay = `${delay}s`;
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.06, rootMargin: '0px 0px -24px 0px' }
  );

  reveals.forEach(el => observer.observe(el));
}

export function initPerfBars() {
  /* ── Animate performance bars when visible ── */
  const bars = document.querySelectorAll('.perf-bar__fill');
  if (!bars.length) return;

  const barObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('animated'), 200);
          barObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  bars.forEach(bar => barObserver.observe(bar));
}
