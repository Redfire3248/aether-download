// Little effects that answer the visitor: a ring and sparks where they click (the sky behind the headline ripples
// too, see aurora.js), a ripple inside buttons, a soft light that follows the mouse over the background, and cards
// that lean towards the mouse. Nothing runs for visitors who asked for less motion.
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const root = document.documentElement;
  const fine = matchMedia('(pointer: fine)').matches;
  const css = (n) => getComputedStyle(document.body).getPropertyValue(n).trim();
  const pixel = () => root.dataset.style === 'pixel';
  const light = () => root.dataset.mode === 'light';

  // ---------------------------------------------------------------- rings and sparks, drawn on one canvas over the page
  const cv = document.createElement('canvas');
  cv.className = 'fx-canvas'; cv.setAttribute('aria-hidden', 'true');
  document.body.appendChild(cv);
  const g = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);

  let colours = [];
  const readColours = () => { colours = [css('--a1'), css('--a2'), css('--a3')].filter(Boolean); };
  readColours(); addEventListener('aether-theme', () => setTimeout(readColours, 30));

  const rings = [], sparks = [];
  let running = false;
  const draw = (now) => {
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = light() ? 'source-over' : 'lighter';
    for (let i = rings.length - 1; i >= 0; i--) {
      const r = rings[i], k = (now - r.t) / r.life;
      if (k >= 1) { rings.splice(i, 1); continue; }
      const e = 1 - Math.pow(1 - k, 3), rad = r.from + (r.to - r.from) * e;
      g.globalAlpha = (1 - k) * (1 - k) * r.a;
      g.strokeStyle = r.c; g.lineWidth = r.w * (1 - k) + .6;
      if (pixel()) g.strokeRect(r.x - rad, r.y - rad, rad * 2, rad * 2);
      else { g.beginPath(); g.arc(r.x, r.y, rad, 0, Math.PI * 2); g.stroke(); }
    }
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i], k = (now - s.t) / s.life;
      if (k >= 1) { sparks.splice(i, 1); continue; }
      s.vx *= .94; s.vy = s.vy * .94 + .06; s.x += s.vx; s.y += s.vy;
      g.globalAlpha = 1 - k; g.fillStyle = s.c;
      const z = s.z * (1 - k * .6);
      if (pixel()) g.fillRect(Math.round(s.x - z), Math.round(s.y - z), z * 2, z * 2);
      else {
        // a short streak in the direction it flies
        g.beginPath(); g.lineCap = 'round'; g.strokeStyle = s.c; g.lineWidth = z;
        g.moveTo(s.x, s.y); g.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2); g.stroke();
      }
    }
    g.globalAlpha = 1;
    if (rings.length || sparks.length) requestAnimationFrame(draw); else { running = false; g.clearRect(0, 0, W, H); }
  };
  const go = () => { if (!running) { running = true; requestAnimationFrame(draw); } };

  addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const x = e.clientX, y = e.clientY, now = performance.now();
    const c = (i) => colours[i % colours.length] || '#3fe3ff';
    rings.push({ x, y, t: now, life: 750, from: 4, to: 90, w: 2.4, c: c(1), a: .9 });
    rings.push({ x, y, t: now + 70, life: 950, from: 2, to: 150, w: 1.2, c: c(0), a: .55 });
    const n = e.pointerType === 'touch' ? 8 : 12;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + Math.random() * .5, sp = 3 + Math.random() * 4.5;
      sparks.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1, t: now, life: 520 + Math.random() * 380, z: 1.4 + Math.random() * 1.6, c: c(i) });
    }
    go();
    // the sky behind the headline ripples from here
    dispatchEvent(new CustomEvent('aether-ripple', { detail: { x, y } }));
  }, { passive: true });

  // ---------------------------------------------------------------- a ripple inside whatever was pressed
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn, .icon-btn, .os-file, .rel-file, .pick-tab, .nav-links a, .nav-panel a, .tm-row, .code-tabs button, .get-sum summary');
    if (!b || b.getAttribute('aria-disabled') === 'true') return;
    const r = b.getBoundingClientRect(), d = Math.hypot(Math.max(e.clientX - r.left, r.right - e.clientX), Math.max(e.clientY - r.top, r.bottom - e.clientY)) * 2;
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative';
    b.classList.add('fx-host');
    const s = document.createElement('span');
    s.className = 'fx-rip';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }, { passive: true });

  if (!fine) return; // the rest follows a mouse

  // ---------------------------------------------------------------- a soft light that follows the mouse over the background
  const spot = document.createElement('div');
  spot.className = 'fx-spot'; spot.setAttribute('aria-hidden', 'true');
  document.body.appendChild(spot);
  // the header's grid lights up around the mouse: a small piece of brighter grid that moves with it
  const hero = document.querySelector('.hero'), grid = document.querySelector('.hero-grid');
  let glow = null, heroTop = 0, heroLeft = 0;
  const place = () => { if (!hero) return; const r = hero.getBoundingClientRect(); heroTop = r.top + scrollY; heroLeft = r.left + scrollX; };
  if (grid) { glow = document.createElement('i'); glow.className = 'grid-glow'; glow.setAttribute('aria-hidden', 'true'); grid.appendChild(glow); place(); addEventListener('resize', place); addEventListener('load', place); }
  let sx = innerWidth / 2, sy = innerHeight / 3, tx = sx, ty = sy, moving = false;
  const follow = () => {
    sx += (tx - sx) * .12; sy += (ty - sy) * .12;
    spot.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    if (glow) {
      // where the mouse is on the header, and the grid lines lined up with the ones under it (64 px apart)
      const hx = sx + scrollX - heroLeft - 220, hy = sy + scrollY - heroTop - 220;
      glow.style.transform = `translate3d(${hx.toFixed(1)}px, ${hy.toFixed(1)}px, 0)`;
      glow.style.backgroundPosition = `${(-hx % 64).toFixed(1)}px ${(-hy % 64).toFixed(1)}px`;
    }
    if (Math.abs(tx - sx) + Math.abs(ty - sy) > .5) requestAnimationFrame(follow); else moving = false;
  };
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; spot.classList.add('on'); if (!moving) { moving = true; requestAnimationFrame(follow); } }, { passive: true });
  document.addEventListener('pointerleave', () => spot.classList.remove('on'));

  // ---------------------------------------------------------------- cards lean towards the mouse
  const lean = '.get, .fam, .know-i, .steps li, .os, .stat, .rel';
  document.querySelectorAll(lean).forEach((c) => {
    if (c.hasAttribute('data-tilt')) return;
    let done = 0;
    c.addEventListener('pointerenter', () => { clearTimeout(done); c.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1), opacity 1s, filter 1s'; });
    c.addEventListener('pointermove', (e) => {
      if (c.matches('[data-r]:not(.in)')) return;
      const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      const max = r.width > 500 ? 3 : 5;
      c.style.transform = `perspective(1100px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-3px)`;
    });
    c.addEventListener('pointerleave', () => {
      c.style.transition = 'transform .7s cubic-bezier(.2,.8,.2,1), opacity 1s, filter 1s'; c.style.transform = '';
      done = setTimeout(() => { c.style.transition = ''; }, 720);
    });
  });
})();
