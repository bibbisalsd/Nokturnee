/**
 * NOKTURNE — Hero Canvas Module
 * Renders an animated grid + particle network on canvas.
 */

export function initHeroCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles, animId;

  const COLOR_VIOLET = 'rgba(155, 48, 255,';
  const COLOR_CYAN   = 'rgba(0, 240, 255,';

  /* ── Resize ── */
  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    initParticles();
  };

  /* ── Particles ── */
  const COUNT = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 22000));

  const initParticles = () => {
    particles = Array.from({ length: COUNT }, () => ({
      x:    Math.random() * W,
      y:    Math.random() * H,
      vx:   (Math.random() - 0.5) * 0.35,
      vy:   (Math.random() - 0.5) * 0.35,
      r:    Math.random() * 1.5 + 0.5,
      cyan: Math.random() > 0.7,
    }));
  };

  /* ── Draw grid ── */
  const drawGrid = () => {
    const step = 56;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(155,48,255,0.045)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += step) {
      ctx.moveTo(x, 0); ctx.lineTo(x, H);
    }
    for (let y = 0; y < H; y += step) {
      ctx.moveTo(0, y); ctx.lineTo(W, y);
    }
    ctx.stroke();

    // Cross dots at intersections (sparse)
    ctx.fillStyle = 'rgba(155,48,255,0.08)';
    for (let x = 0; x < W; x += step) {
      for (let y = 0; y < H; y += step) {
        if ((x / step + y / step) % 3 === 0) {
          ctx.fillRect(x - 0.5, y - 0.5, 1, 1);
        }
      }
    }
  };

  /* ── Draw connections ── */
  const LINK_DIST = 130;
  const drawLinks = () => {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          const alpha = (1 - d / LINK_DIST) * 0.18;
          const col   = particles[i].cyan ? COLOR_CYAN : COLOR_VIOLET;
          ctx.beginPath();
          ctx.strokeStyle = col + alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  };

  /* ── Draw particles ── */
  const drawParticles = () => {
    particles.forEach(p => {
      const col = p.cyan ? COLOR_CYAN : COLOR_VIOLET;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = col + '0.7)';
      ctx.fill();

      // Glow halo
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
      grad.addColorStop(0, col + '0.15)');
      grad.addColorStop(1, col + '0)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 6, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    });
  };

  /* ── Update positions ── */
  const update = () => {
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    });
  };

  /* ── Loop ── */
  const loop = () => {
    ctx.clearRect(0, 0, W, H);
    drawGrid();
    drawLinks();
    drawParticles();
    update();
    animId = requestAnimationFrame(loop);
  };

  /* ── Init ── */
  resize();
  loop();

  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);

  // Pause when off-screen
  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) {
      if (!animId) loop();
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  io.observe(canvas);
}
