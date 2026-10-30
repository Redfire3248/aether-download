(function () {
  'use strict';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REPO = 'Redfire3248/aether-download';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const visible = (el, fn) => { let on = false; new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v !== on) { on = v; fn(v); } }, { threshold: .12 }).observe(el); return () => on; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  // ---- the sky: stars, and in the pixel themes a pixel-art aurora drawn very small and scaled up
  let aurora = { a: hex('#7859f7'), b: hex('#3ff3c8'), c: hex('#ff7eb6'), bg: hex('#0b0e1a') };
  let pixelSky = false, paintSky = () => {}, fitWord = () => {};
  (function sky() {
    const ac = $('#aurora'), g = ac.getContext('2d', { alpha: false }), W = 160, H = 90; ac.width = W; ac.height = H;
    const im = g.createImageData(W, H), d = im.data;
    const sc = $('#stars'), s = sc.getContext('2d'); let SW = 0, SH = 0, dots = [], mx = 0, my = 0, tx = 0, ty = 0;
    // one canvas pixel per CSS pixel: the stars are whole pixels, so a sharp screen gains nothing from more
    const size = () => { SW = innerWidth; SH = innerHeight; sc.width = SW; sc.height = SH; dots = Array.from({ length: Math.round(SW * SH / 9000) }, () => ({ x: rand(0, SW), y: rand(0, SH), z: rand(.2, 1), p: rand(0, 6) })); };
    addEventListener('resize', size); size();
    addEventListener('pointermove', (e) => { tx = e.clientX / SW - .5; ty = e.clientY / SH - .5; }, { passive: true });
    const LEVELS = 10;
    const rowWave = new Float64Array(H), colMid = new Float64Array(W);
    let last = 0;
    const frame = (t) => {
      if (t - last < 66) return; last = t; // the sky moves slowly: 15 frames a second is plenty
      if (pixelSky) aurorify(t);
      stars(t);
    };
    const aurorify = (t) => {
      const q = t * .00016, scroll = Math.min(1, scrollY / (innerHeight * 3));
      // the parts that depend only on the row or only on the column are worked out once each
      for (let y = 0; y < H; y++) rowWave[y] = Math.sin(y / H * 4 + q * 3) * 1.4 + q * 7;
      for (let x = 0; x < W; x++) colMid[x] = .42 + Math.sin(x / W * 3 + q * 4) * .2 - scroll * .25;
      for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) {
        const u = x / W, v = y / H;
        const n = Math.sin(u * 5 + rowWave[y]) + Math.sin(u * 9 - q * 5 + v * 3) * .6;
        const band = Math.exp(-((v - colMid[x]) ** 2) * 14);
        // pixel look: the light comes in steps, with a dither pattern between them
        let k = Math.max(0, (n + 1.6) / 3.2) * band; k = Math.floor(k * LEVELS + ((x + y) % 2 ? .35 : -.05)) / LEVELS; k = Math.max(0, Math.min(1, k)) * .3;
        const c = n > .25 ? aurora.c : n > -.4 ? aurora.a : aurora.b;
        d[i] = aurora.bg[0] + (c[0] - aurora.bg[0]) * k; d[i + 1] = aurora.bg[1] + (c[1] - aurora.bg[1]) * k; d[i + 2] = aurora.bg[2] + (c[2] - aurora.bg[2]) * k; d[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
    };
    const stars = (t) => {
      mx += (tx - mx) * .08; my += (ty - my) * .08;
      s.clearRect(0, 0, SW, SH); s.fillStyle = '#fff';
      for (const p of dots) {
        const x = ((p.x + t * .003 * p.z - mx * p.z * 40) % SW + SW) % SW, y = ((p.y - scrollY * p.z * .12 - my * p.z * 40) % SH + SH) % SH;
        s.globalAlpha = (.2 + .6 * p.z) * (.7 + .3 * Math.sin(t * .0016 + p.p)); const r = p.z > .7 ? 2 : 1; s.fillRect(x | 0, y | 0, r, r);
      }
    };
    paintSky = () => { last = -1e9; frame(performance.now()); };
    const loop = (t) => { if (document.hidden) return; requestAnimationFrame(loop); frame(t); };
    if (still) paintSky(); else { requestAnimationFrame(loop); document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(loop); }); }
  })();

  // ---- the language logos: in a pixel theme each one is drawn at 12 x 12 pixels and blown up, as Aether does
  const pixelLogo = {};
  function pixelLogos(on) {
    for (const im of $$('.tick-track img')) {
      const src = im.dataset.src || (im.dataset.src = im.getAttribute('src'));
      if (!on) { im.src = src; continue; }
      if (!pixelLogo[src]) pixelLogo[src] = new Promise((done) => {
        const raw = new Image();
        raw.onload = () => {
          try {
            const N = /aether-/.test(src) ? 9 : 12, c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = N;
            const w = raw.naturalWidth || 128, h = raw.naturalHeight || 128, k = Math.min(N / w, N / h);
            g.imageSmoothingQuality = 'high'; g.drawImage(raw, (N - w * k) / 2, (N - h * k) / 2, w * k, h * k); done(c.toDataURL());
          } catch { done(src); }
        };
        raw.onerror = () => done(src); raw.src = src;
      });
      pixelLogo[src].then((px) => { if (document.documentElement.dataset.style === 'pixel') im.src = px; });
    }
  }

  // ---- themes: the real ones from Aether. A pixel theme turns the whole page pixel, as it does in the app
  (function themes() {
    const LIST = [
      ['Aether Night', 0, 1, '#0b0e1a', '#0e1222', '#1d2440', '#d7dcf0', '#7d86a8', '#7859f7', '#3ff3c8', '#ff7eb6', '#ffffff'],
      ['Nebula', 0, 1, '#120b22', '#170f2b', '#2c1f4d', '#ebe1ff', '#a08cc8', '#ff5cc8', '#8f7bff', '#ff7ad9', '#120b22'],
      ['Aurora', 0, 1, '#07151a', '#0a1b21', '#16323c', '#d3f2ee', '#7fa9a6', '#2de0a7', '#5ab8ff', '#5ab8ff', '#04130f'],
      ['Ember', 0, 1, '#140e0b', '#19120e', '#33241b', '#f3e3d6', '#b08f7a', '#ff7a45', '#ffc24b', '#ff7a45', '#1a0d06'],
      ['Synthwave Sunset', 0, 1, '#170b2b', '#1d0f36', '#3a1f63', '#f7e7ff', '#b493d6', '#d13387', '#ffd319', '#ff3ea5', '#ffffff'],
      ['Neon City', 0, 1, '#07070d', '#0b0b14', '#1e1e2e', '#e9f1ff', '#8a93b8', '#fcee0a', '#00f0ff', '#ff2a6d', '#0a0a12'],
      ['Deep Ocean', 0, 1, '#04101c', '#061626', '#11304d', '#d2e9ff', '#7aa2c4', '#00b4ff', '#00e5c8', '#f28779', '#021018'],
      ['Midnight Forest', 0, 1, '#0b130f', '#0f1913', '#1f3427', '#dbefdf', '#8fb39a', '#7ccf6b', '#e3c26f', '#ed8796', '#0b130f'],
      ['Twilight Rose', 0, 1, '#16141f', '#1b1826', '#302b45', '#e0def4', '#9a96b6', '#eb6f92', '#f6c177', '#eb6f92', '#16141f'],
      ['Sakura', 0, 0, '#fbf1f4', '#fdf6f8', '#efd5df', '#3b2a33', '#836674', '#ce3f71', '#6b8afd', '#c2185b', '#ffffff'],
      ['Lavender', 0, 0, '#f1eefb', '#f6f3fd', '#ddd5f3', '#2a2540', '#6c6589', '#7c4dff', '#00a3a3', '#be185d', '#ffffff'],
      ['Paper', 0, 0, '#f2f2f0', '#f7f7f5', '#e0e0db', '#222222', '#6b6b66', '#2f6fed', '#e8590c', '#c2255c', '#ffffff'],
      ['Pixel Arcade', 1, 1, '#14152a', '#1a1c2c', '#566c86', '#f4f4f4', '#94b0c2', '#ef7d57', '#a7f070', '#c46c7c', '#1a1c2c'],
      ['Pixel Game Boy', 1, 1, '#0f380f', '#183f18', '#4f7f1f', '#c4e36a', '#c5d687', '#9bbc0f', '#c4e36a', '#9bbc0f', '#0f380f'],
      ['Pixel NES', 1, 1, '#0d0d1a', '#1a1a2e', '#5050a0', '#fcfcfc', '#bcbcbc', '#f83800', '#3cbcfc', '#f878f8', '#000000'],
      ['Pixel PICO-8', 1, 1, '#000000', '#1d2b53', '#5f574f', '#fff1e8', '#c2c3c7', '#ff004d', '#29adff', '#ff004d', '#000000'],
      ['Pixel Dungeon', 1, 1, '#1b1410', '#261c16', '#6b4f36', '#e8d5b0', '#b0956f', '#d9822b', '#7fbf5f', '#cd6155', '#1b1410'],
      ['Pixel Ocean', 1, 1, '#06141f', '#0a2233', '#2a6f97', '#d8f3ff', '#89c2d9', '#2ec4b6', '#ffd166', '#ef476f', '#06141f'],
      ['Pixel Forest', 1, 1, '#0e1a12', '#15261a', '#3f6b45', '#dff5d0', '#9cc58f', '#8fd14f', '#f2c14e', '#e05d5d', '#0e1a12'],
      ['Pixel Lava', 1, 1, '#1a0d0d', '#241010', '#8c2f1a', '#ffe9c7', '#e0a070', '#ff6a00', '#ffd23f', '#ff2f2f', '#1a0d0d'],
      ['Pixel Royal', 1, 1, '#170d24', '#1f1230', '#6a3fa0', '#fff2d6', '#c9a8e8', '#ffcc33', '#ff5fa2', '#ffcc33', '#170d24'],
      ['Pixel 1-Bit', 1, 1, '#000000', '#000000', '#ffffff', '#ffffff', '#bbbbbb', '#ffffff', '#ffffff', '#ffffff', '#000000'],
      ['Pixel Candy', 1, 0, '#fff0f6', '#ffe3ee', '#f4a6c8', '#4a2040', '#8a5a7a', '#c5486f', '#7b61ff', '#bf466b', '#ffffff'],
      ['Pixel Snow', 1, 0, '#e9f1f7', '#f2f7fb', '#5a7894', '#1b2a3a', '#4f6880', '#2b74d8', '#e0457b', '#cc3f70', '#ffffff']
    ];
    const root = document.documentElement, btn = $('#theme-btn'), menu = $('#theme-menu'), dot = $('.theme-dot'), KEY = 'aether-site-theme', meta = $('meta[name="theme-color"]');
    const row = ([name, px, , bg, , , tx, , ac, ac2, pk], i) => `<button type="button" class="tm-row${px ? ' px' : ''}" data-i="${i}" aria-pressed="false"><span class="tm-sw" style="background:${bg}"><i style="background:${ac}"></i><i style="background:${ac2}"></i><i style="background:${pk}"></i></span><span style="--tx:${tx}">${name}</span></button>`;
    const group = (title, px) => `<p class="tm-h">${title}</p><div class="tm-list">${LIST.map((t, i) => (!!t[1] === px ? row(t, i) : '')).join('')}</div>`;
    menu.innerHTML = group('Pixel', true) + group('Smooth', false);
    const rows = $$('.tm-row', menu);
    const apply = (i) => {
      const [name, px, dark, bg, panel, line, text, muted, accent, accent2, pink, on] = LIST[i];
      Object.entries({ bg, panel, line, text, muted, accent, accent2, pink, 'on-accent': on }).forEach(([k, v]) => root.style.setProperty('--' + k, v));
      if (px) root.dataset.style = 'pixel'; else delete root.dataset.style;
      root.dataset.mode = dark ? 'dark' : 'light'; meta.content = bg; pixelSky = !!px; dot.style.background = accent;
      pixelLogos(!!px);
      aurora = { a: hex(accent), b: hex(accent2), c: hex(pink), bg: hex(bg) }; paintSky();
      rows.forEach((r) => r.setAttribute('aria-pressed', +r.dataset.i === i));
      btn.title = 'Theme: ' + name;
      fitWord(); if (px && document.fonts) document.fonts.load('40px "Jersey 15"').then(() => fitWord());
    };
    const open = (on) => { menu.hidden = !on; btn.setAttribute('aria-expanded', on); if (on) (rows.find((r) => r.getAttribute('aria-pressed') === 'true') || rows[0]).focus({ preventScroll: true }); };
    btn.addEventListener('click', () => open(menu.hidden));
    menu.addEventListener('click', (e) => { const r = e.target.closest('.tm-row'); if (!r) return; apply(+r.dataset.i); try { localStorage.setItem(KEY, LIST[+r.dataset.i][0]); } catch { /* the choice lasts for this visit */ } });
    menu.addEventListener('keydown', (e) => { const k = rows.indexOf(document.activeElement), step = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (step) { e.preventDefault(); rows[(k + step + rows.length) % rows.length].focus(); } });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
    addEventListener('pointerdown', (e) => { if (!menu.hidden && !e.target.closest('.theme-pick')) open(false); });
    let saved = 0; try { saved = Math.max(0, LIST.findIndex((t) => t[0] === localStorage.getItem(KEY))); } catch { /* no saved theme */ }
    apply(saved);
  })();

  // ---- CSS animations stop while they are off the screen
  const pause = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle('paused', !e.isIntersecting); });
  $$('.btn.magnet, .ticker, .tile, .rails, .get-card').forEach((el) => pause.observe(el));

  // ---- the spotlight follows the mouse, softly
  (function spot() {
    const el = $('#spot'); if (still || !fine) { el.hidden = true; return; }
    let x = innerWidth / 2, y = 200, cx = x, cy = y;
    // it only moves while it is catching up with the mouse
    let moving = false;
    const go = () => { cx += (x - cx) * .1; cy += (y - cy) * .1; el.style.transform = `translate(${cx}px, ${cy}px)`; moving = Math.abs(x - cx) + Math.abs(y - cy) > .5; if (moving) requestAnimationFrame(go); };
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (!moving) { moving = true; requestAnimationFrame(go); } }, { passive: true });
    go();
  })();

  // ---- things tied to scrolling: the progress line, the bar, the three windows
  (function scroll() {
    const bar = $('#bar'), top = $('#top'), fan = $('#fan'); let ticking = false, max = 0, fanTop = 0;
    // where things are only changes when the window does, so scrolling never has to measure the page
    const measure = () => { max = document.documentElement.scrollHeight - innerHeight; let t = 0; for (let e = fan; e; e = e.offsetParent) t += e.offsetTop; fanTop = t; };
    const run = () => {
      ticking = false; const y = scrollY;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      top.classList.toggle('solid', y > 40);
      if (!still) { const p = Math.max(0, Math.min(1, 1 - (fanTop - y - 60) / (innerHeight * .8))); fan.style.setProperty('--p', p.toFixed(3)); }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    const again = () => { measure(); run(); };
    addEventListener('resize', again); new ResizeObserver(again).observe(document.body); again();
  })();

  // ---- the word that keeps changing in the headline
  (function rotor() {
    const box = $('#rotor'), WORDS = ['everything.', 'code.', 'games.', 'pixel art.', 'circuits.', 'apps.', 'sound.'];
    if (still) return; let i = 0;
    // each letter takes its own colour along the word
    const col = (k) => (k < .5 ? `color-mix(in srgb, var(--accent2) ${k * 200 | 0}%, var(--accent))` : `color-mix(in srgb, var(--pink) ${(k - .5) * 200 | 0}%, var(--accent2))`);
    fitWord = () => { const s = box.firstElementChild; if (s) box.style.width = s.offsetWidth + 'px'; };
    const show = (w) => { box.innerHTML = '<span>' + [...w].map((c, k) => `<span class="ch" style="animation-delay:${k * 28}ms;color:${col(k / Math.max(1, w.length - 1))}">${c === ' ' ? '&nbsp;' : c}</span>`).join('') + '</span>'; fitWord(); };
    addEventListener('resize', fitWord); if (document.fonts) document.fonts.ready.then(fitWord);
    show(WORDS[0]); setInterval(() => { if (!document.hidden) { i = (i + 1) % WORDS.length; show(WORDS[i]); } }, 2300);
  })();

  // ---- the button leans towards the mouse
  $$('.magnet').forEach((b) => {
    if (still || !fine) return;
    b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
  $$('.dl-link').forEach((a) => a.addEventListener('click', () => $('#get').scrollIntoView()));

  // ---- headings come up word by word
  $$('.split').forEach((h) => { h.setAttribute('aria-label', h.textContent); h.innerHTML = h.textContent.split(' ').map((w, i) => `<span class="w" aria-hidden="true"><i style="--n:${i}">${w}</i></span>`).join(' '); });
  const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }, { threshold: .2 });
  $$('.split, .tile').forEach((el, i) => { if (el.classList.contains('tile')) el.style.setProperty('--n', i % 3); io.observe(el); });

  // ---- the tour: the words go by and the window keeps up
  (function story() {
    const STOPS = [
      ['Code', 'code', 'Write in any language', 'Colours, suggestions and a terminal that understand your language. One key runs it.', 'An Aether Script program in the code editor'],
      ['Game Engine', 'engine', 'Make a real game', 'Paint levels, add behaviours and play right there. Export to Windows, Android or the web.', 'A lava cave level in the game engine'],
      ['App Maker', 'apps', 'Build a phone app', 'Put a screen together from parts and write what they do. One click makes the .apk.', 'A quiz app running in the App Maker'],
      ['Arduino', 'arduino', 'Circuits with no board', 'Wire up parts on a breadboard, write the sketch and watch it run.', 'An LED circuit being simulated beside its code'],
      ['PDF', 'pdf', 'Change any PDF', 'Click a line and type over it, in the same font and colour. Scanned pages too.', 'The PDF editor with every line ready to edit']
    ];
    const steps = $('#story-steps'), view = $('.win-view'), name = $('#story-name');
    const imgs = STOPS.map(([, f], i) => { const im = new Image(); im.src = `img/${f}.webp`; im.alt = STOPS[i][4]; im.width = 1600; im.height = 850; if (!i) im.className = 'on'; view.appendChild(im); return im; });
    steps.innerHTML = STOPS.map(([, f, t, p, alt], i) => `<article class="step${i ? '' : ' on'}" data-i="${i}"><span class="no">0${i + 1}</span><h3>${t}</h3><p>${p}</p><img src="img/${f}.webp" alt="${alt}" width="1600" height="850" loading="lazy"></article>`).join('');
    const go = (i) => { imgs.forEach((im, k) => im.classList.toggle('on', k === i)); $$('.step').forEach((s, k) => s.classList.toggle('on', k === i)); name.textContent = STOPS[i][0]; };
    const ob = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) go(+e.target.dataset.i); }, { rootMargin: '-45% 0px -45% 0px' });
    $$('.step').forEach((s) => ob.observe(s));
  })();

  // ---- a little game you can play: jump over the blocks
  (function game() {
    const c = $('#game'), g = c.getContext('2d'), W = c.width, H = c.height, FLOOR = H - 26;
    let y = 0, vy = 0, x = 60, blocks = [], speed = 2.3, t = 0, score = 0, best = 0, dead = 0, on = false, coins = [];
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const jump = () => { if (dead) { reset(); return; } if (y === 0) vy = 7.4; };
    const reset = () => { blocks = []; coins = []; speed = 2.3; score = 0; dead = 0; y = 0; vy = 0; };
    c.addEventListener('pointerdown', (e) => { e.preventDefault(); jump(); });
    addEventListener('keydown', (e) => { if (e.code === 'Space' && on && document.activeElement === document.body && c.getBoundingClientRect().top < innerHeight * .7 && c.getBoundingClientRect().bottom > 80) { e.preventDefault(); jump(); } });
    const auto = () => { const b = blocks.find((q) => q.x > x - 8); if (b && b.x - x < 46 + speed * 6 && y === 0 && !touched) jump(); };
    let touched = false; c.addEventListener('pointerdown', () => { touched = true; });
    const frame = () => {
      if (on) requestAnimationFrame(frame); t++;
      const A = css('--accent'), B = css('--accent2'), P = css('--pink');
      g.clearRect(0, 0, W, H);
      for (let i = 0; i < 18; i++) { g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(((i * 53 - t * .5) % W + W) % W, 16 + (i * 37) % 60, 2, 2); }
      g.fillStyle = A; g.fillRect(0, FLOOR, W, 3);
      for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(((i * 40 - t * speed) % W + W) % W, FLOOR + 8, 16, 3); }
      if (!dead) {
        if (!touched) auto();
        if (y > 0 || vy > 0) { y += vy; vy -= .34; if (y <= 0) { y = 0; vy = 0; } }
        if (!blocks.length || blocks[blocks.length - 1].x < W - rand(110, 210)) { blocks.push({ x: W + 10, h: 14 + (Math.random() * 3 | 0) * 7 }); if (Math.random() < .6) coins.push({ x: W + rand(50, 90), y: rand(26, 58) }); }
        for (const b of blocks) b.x -= speed; for (const k of coins) k.x -= speed;
        blocks = blocks.filter((b) => { if (b.x < -14) { score++; return false; } return true; });
        coins = coins.filter((k) => { if (Math.abs(k.x - x - 7) < 14 && Math.abs(FLOOR - y - 14 - k.y) < 16) { score += 2; return false; } return k.x > -8; });
        if (t % 300 === 0) speed = Math.min(5, speed + .25);
        if (blocks.some((b) => x + 12 > b.x && x < b.x + 12 && y < b.h - 1)) { dead = 1; best = Math.max(best, score); if (!touched) setTimeout(reset, 900); }
      }
      g.fillStyle = P; for (const b of blocks) g.fillRect(b.x | 0, FLOOR - b.h, 12, b.h);
      g.fillStyle = '#ffd479'; for (const k of coins) g.fillRect(k.x | 0, k.y | 0, 7, 7);
      // the player: a small pixel hero
      const py = FLOOR - 16 - y | 0, step = y === 0 ? ((t >> 3) & 1) : 0;
      g.fillStyle = B; g.fillRect(x, py, 14, 12); g.fillStyle = '#10101c'; g.fillRect(x + 9, py + 3, 3, 3);
      g.fillStyle = B; g.fillRect(x + 1 + step * 2, py + 12, 4, 4); g.fillRect(x + 9 - step * 2, py + 12, 4, 4);
      g.fillStyle = '#fff'; g.font = '13px monospace'; g.textAlign = 'right'; g.fillText(String(score).padStart(3, '0') + (best ? '  best ' + best : ''), W - 10, 20);
      if (dead && touched) { g.textAlign = 'center'; g.fillText('tap to play again', W / 2, 60); }
    };
    visible(c, (v) => { on = v; if (v && !still) requestAnimationFrame(frame); }); if (still) frame();
  })();

  // ---- code that types itself, then runs
  (function typer() {
    const el = $('#typer'), LINES = [
      [['k', 'class '], ['f', 'Cat'], ['', ':']],
      [['', '  '], ['k', 'func '], ['f', 'speak'], ['', '():']],
      [['', '    '], ['k', 'return '], ['s', '"Meow!"']],
      [['', '']],
      [['f', 'print'], ['', '(Cat().speak())']],
      [['o', '> run']], [['s', 'Meow!']]
    ];
    const flat = LINES.flatMap((l, i) => [...l.flatMap(([c, t]) => [...t].map((ch) => [c, ch])), ...(i < LINES.length - 1 ? [['', '\n']] : [])]);
    const esc = (c) => (c === '<' ? '&lt;' : c === '&' ? '&amp;' : c);
    let n = 0, timer = 0;
    const paint = () => { let out = '', cur = null; for (let i = 0; i < n; i++) { const [c, ch] = flat[i]; if (c !== cur) { if (cur) out += '</span>'; if (c) out += `<span class="${c}">`; cur = c; } out += esc(ch); } if (cur) out += '</span>'; el.innerHTML = out + '<span class="cur"></span>'; };
    const step = () => { n++; paint(); timer = setTimeout(step, n >= flat.length ? 0 : rand(26, 74)); if (n >= flat.length) { clearTimeout(timer); timer = setTimeout(() => { n = 0; step(); }, 3200); } };
    if (still) { n = flat.length; paint(); return; }
    visible(el, (v) => { clearTimeout(timer); if (v) step(); });
  })();

  // ---- pixel art that paints itself
  (function paint() {
    const el = $('#paint'), ART = ['..KK......KK..', '.KOOK....KOOK.', '.KOOOKKKKOOOK.', '.KOOOOOOOOOOK.', 'KOOOOOOOOOOOOK', 'KOOWKOOOOWKOOK', 'KOOKKOOOOKKOOK', 'KOOOOOPPOOOOOK', '.KOOOOOOOOOOK.', '.KOOKKKKKKOOK.', '..KOOOOOOOOK..', '...KKKKKKKK...'];
    const COL = { K: '#111019', O: '#f0a24a', W: '#ffffff', P: '#ff7fa8' };
    const cells = ART.join('').split('').map((c) => { const i = document.createElement('i'); if (c !== '.') i.style.setProperty('--c', COL[c]); i.dataset.c = c; el.appendChild(i); return i; });
    const order = cells.filter((c) => c.dataset.c !== '.').sort(() => Math.random() - .5);
    let k = 0, timer = 0;
    const tick = () => { if (k < order.length) { order[k++].classList.add('on'); timer = setTimeout(tick, 16); } else timer = setTimeout(() => { cells.forEach((c) => c.classList.remove('on')); k = 0; timer = setTimeout(tick, 500); }, 2600); };
    if (still) { order.forEach((c) => c.classList.add('on')); return; }
    visible(el, (v) => { clearTimeout(timer); if (v) tick(); });
  })();

  // ---- sound bars
  $('#eq').innerHTML = Array.from({ length: 22 }, () => `<i style="--t:${rand(.45, 1.1).toFixed(2)};--d:${rand(0, 1).toFixed(2)}"></i>`).join('');

  // ---- a PDF line being retyped
  (function edit() {
    const el = $('#edit'), WORDS = ['Dear Sam,', 'Dear Maya,', 'Thank you!'];
    if (still) { el.textContent = WORDS[0]; return; }
    let w = 0, n = 0, back = false, timer = 0;
    const go = () => { const s = WORDS[w]; n += back ? -1 : 1; el.textContent = s.slice(0, n); if (!back && n === s.length) { back = true; timer = setTimeout(go, 1700); return; } if (back && n === 0) { back = false; w = (w + 1) % WORDS.length; } timer = setTimeout(go, back ? 34 : 86); };
    visible(el, (v) => { clearTimeout(timer); if (v) go(); });
  })();

  // ---- the soft light on each tile
  $$('.tile').forEach((c) => c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));

  // ---- the Marketplace, right now
  (async function market() {
    const r1 = $('#rail1'), r2 = $('#rail2');
    const chip = (x) => { const p = x.preview, px = (x.tags || []).includes('pixel'); return `<span class="chip${px ? ' px' : ''}"${p ? ` style="background:${p.panel};color:${p.text};border-color:${p.border}"` : ''}><i${p ? ` style="background:${p.accent}"` : ''}></i>${String(x.name).replace(/[<>&]/g, '')}</span>`; };
    let list = ['Word Count', 'Colour Swatches', 'Pet Pack', 'Focus Timer', 'JSON Tools', 'Regex Lab', 'Text Tools', 'Git Line', 'Quick Insert', 'HTML Quick'].map((name) => ({ name }));
    try {
      const j = await (await fetch('https://raw.githubusercontent.com/Redfire3248/aether-marketplace/main/index.json')).json();
      if (j.extensions && j.extensions.length) { list = j.extensions; $$('.market-count').forEach((b) => (b.textContent = list.length)); }
    } catch { /* the short list */ }
    const half = Math.ceil(list.length / 2), a = list.slice(0, half).map(chip).join(''), b = list.slice(half).map(chip).join('') || a;
    r1.innerHTML = a + a + a + a; r2.innerHTML = b + b + b + b;
  })();

  // ---- the newest version: its number and size
  (async function version() {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`); if (!r.ok) return;
      const j = await r.json(), v = String(j.tag_name || '').replace(/^v/, ''), a = (j.assets || []).find((x) => /\.exe$/i.test(x.name));
      if (v) $$('.dl-version').forEach((e) => (e.textContent = 'Version ' + v));
      if (a) $$('.dl-size').forEach((e) => (e.textContent = ` · ${Math.round(a.size / 1048576)} MB`));
    } catch { /* the words already there */ }
  })();

  // ---- how many times Aether was downloaded: live from GitHub, or the count saved each day in downloads.json
  (async function downloads() {
    let n = 0;
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=100`); if (!r.ok) throw new Error(r.status);
      for (const rel of await r.json()) for (const a of rel.assets || []) n += a.download_count || 0;
    } catch {
      try { n = (await (await fetch('downloads.json', { cache: 'no-store' })).json()).total || 0; } catch { /* no count yet */ }
    }
    if (n > 0) $$('.dl-count').forEach((e) => (e.textContent = ` · ${n.toLocaleString('en')} download${n === 1 ? '' : 's'}`));
  })();

})();
