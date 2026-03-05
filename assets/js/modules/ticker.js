/**
 * NOKTURNE — Clipboard Module
 * Wires all copy buttons on the page.
 */

export function initClipboard() {
  const copyPairs = [
    { btnId: 'copyHandle',  statusId: 'copyStatus',  text: '@bxserkk' },
    { btnId: 'copyHandle2', statusId: 'copyStatus2', text: '@bxserkk' },
  ];

  copyPairs.forEach(({ btnId, statusId, text }) => {
    const btn    = document.getElementById(btnId);
    const status = document.getElementById(statusId);
    if (!btn) return;

    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        flash(status, 'COPIED ✓', 'var(--cyan)');
      } catch {
        flash(status, 'FAILED', 'var(--red-alert)');
      }
    });
  });

  function flash(el, msg, color) {
    if (!el) return;
    const orig  = el.textContent;
    const origC = el.style.color;
    el.textContent  = msg;
    el.style.color  = color;
    setTimeout(() => {
      el.textContent = orig;
      el.style.color = origC;
    }, 1800);
  }
}


/**
 * NOKTURNE — Ticker Module
 * Duplicates ticker content so scroll loops seamlessly.
 */
export function initTickers() {
  document.querySelectorAll('.ticker-track').forEach(track => {
    // Clone children once to fill second half (for seamless loop)
    const kids = Array.from(track.children);
    kids.forEach(k => track.appendChild(k.cloneNode(true)));
  });
}
