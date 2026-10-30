(function () {
  'use strict';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REPO = 'Redfire3248/aether-download';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const visible = (el, fn) => { let on = false; new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v !== on) { on = v; fn(v); } }, { threshold: .12 }).observe(el); return () => on; };
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  // ---- the sky: a pixel-art aurora drawn very small and scaled up, with stars over it
  let aurora = { a: hex('#8b6cff'), b: hex('#3ff3c8'), c: hex('#ff5fa2'), bg: hex('#08070f') };
  (function sky() {
    const ac = $('#aurora'), g = ac.getContext('2d', { alpha: false }), W = 96, H = 54; ac.width = W; ac.height = H;
    const im = g.createImageData(W, H), d = im.data;
    const sc = $('#stars'), s = sc.getContext('2d'); let SW = 0, SH = 0, dots = [], mx = 0, my = 0, tx = 0, ty = 0;
    const size = () => { const k = Math.min(devicePixelRatio || 1, 2); SW = innerWidth; SH = innerHeight; sc.width = SW * k; sc.height = SH * k; s.setTransform(k, 0, 0, k, 0, 0); dots = Array.from({ length: Math.round(SW * SH / 9000) }, () => ({ x: rand(0, SW), y: rand(0, SH), z: rand(.2, 1), p: rand(0, 6) })); };
    addEventListener('resize', size); size();
    addEventListener('pointermove', (e) => { tx = e.clientX / SW - .5; ty = e.clientY / SH - .5; }, { passive: true });
    const LEVELS = 7;
    let last = 0;
    const draw = (t) => {
      if (document.hidden) return;
      requestAnimationFrame(draw);
      if (t - last < 66) return; last = t; // the aurora moves slowly: 15 frames a second is plenty
      const q = t * .00016, scroll = Math.min(1, scrollY / (innerHeight * 3));
      for (let y = 0, i = 0; y < H; y++) for (let x = 0; x < W; x++, i += 4) {
        const u = x / W, v = y / H;
        const n = Math.sin(u * 5 + q * 7 + Math.sin(v * 4 + q * 3) * 1.4) + Math.sin(u * 9 - q * 5 + v * 3) * .6;
        const band = Math.exp(-((v - (.42 + Math.sin(u * 3 + q * 4) * .2 - scroll * .25)) ** 2) * 14);
        // pixel look: the light comes in steps, with a dither pattern between them
        let k = Math.max(0, (n + 1.6) / 3.2) * band; k = Math.floor(k * LEVELS + ((x + y) % 2 ? .35 : -.05)) / LEVELS; k = Math.max(0, Math.min(1, k)) * .5;
        const c = n > .25 ? aurora.c : n > -.4 ? aurora.a : aurora.b;
        d[i] = aurora.bg[0] + (c[0] - aurora.bg[0]) * k; d[i + 1] = aurora.bg[1] + (c[1] - aurora.bg[1]) * k; d[i + 2] = aurora.bg[2] + (c[2] - aurora.bg[2]) * k; d[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      mx += (tx - mx) * .08; my += (ty - my) * .08;
      s.clearRect(0, 0, SW, SH); s.fillStyle = '#fff';
      for (const p of dots) {
        const x = ((p.x + t * .003 * p.z - mx * p.z * 40) % SW + SW) % SW, y = ((p.y - scrollY * p.z * .12 - my * p.z * 40) % SH + SH) % SH;
        s.globalAlpha = (.2 + .6 * p.z) * (.7 + .3 * Math.sin(t * .0016 + p.p)); const r = p.z > .7 ? 2 : 1; s.fillRect(x | 0, y | 0, r, r);
      }
    };
    if (still) { draw(0); } else { requestAnimationFrame(draw); document.addEventListener('visibilitychange', () => { if (!document.hidden) requestAnimationFrame(draw); }); }
  })();

  // ---- the spotlight follows the mouse, softly
  (function spot() {
    const el = $('#spot'); if (still || !fine) { el.hidden = true; return; }
    let x = innerWidth / 2, y = 200, cx = x, cy = y;
    addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    (function go() { cx += (x - cx) * .1; cy += (y - cy) * .1; el.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(go); })();
  })();

  // ---- things tied to scrolling: the progress line, the bar, the three windows
  (function scroll() {
    const bar = $('#bar'), top = $('#top'), fan = $('#fan'); let ticking = false;
    const run = () => {
      ticking = false; const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      top.classList.toggle('solid', y > 40);
      if (!still) { const r = fan.getBoundingClientRect(), p = Math.max(0, Math.min(1, 1 - (r.top - 60) / (innerHeight * .8))); fan.style.setProperty('--p', p.toFixed(3)); }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run); run();
  })();

  // ---- the word that keeps changing in the headline
  (function rotor() {
    const box = $('#rotor'), WORDS = ['everything.', 'code.', 'games.', 'pixel art.', 'circuits.', 'apps.', 'sound.'];
    if (still) return; let i = 0;
    const show = (w) => { box.innerHTML = '<span>' + [...w].map((c, k) => `<span class="ch" style="animation-delay:${k * 28}ms">${c === ' ' ? '&nbsp;' : c}</span>`).join('') + '</span>'; };
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

  // ---- try a theme: the whole page changes
  (function themes() {
    const LIST = [
      ['Aether Night', 0, '#08070f', '#121024', '#2a2650', '#f1efff', '#a7a2cf', '#8b6cff', '#3ff3c8', '#ff5fa2', '#ffffff'],
      ['Pixel Arcade', 1, '#14152a', '#1a1c2c', '#3a4466', '#f4f4f4', '#94b0c2', '#ef7d57', '#a7f070', '#73eff7', '#1a1c2c'],
      ['Pixel Vapor', 1, '#130f2e', '#1a1540', '#443a8a', '#f4f0ff', '#b3a9e0', '#ff71ce', '#01cdfe', '#05ffa1', '#2a0520'],
      ['Neon Tide', 0, '#07101c', '#0b1626', '#1f3857', '#e6f4ff', '#8fb0c9', '#22e0d0', '#ff5fb0', '#ffd166', '#03201e'],
      ['Cyber Noir', 0, '#0a0a0c', '#111114', '#34343c', '#f2f2ee', '#a9a9a4', '#f5e400', '#00e5ff', '#ff6e8a', '#141400'],
      ['Blood Moon', 0, '#120809', '#1a0c0e', '#4a2226', '#fbeaea', '#c99fa2', '#ff4d5e', '#ffb35c', '#ff9fa8', '#2a0407'],
      ['Forest Night', 0, '#0e1512', '#121c17', '#26392f', '#dfeee4', '#97b3a2', '#7fdbb6', '#e8c35a', '#9fd3ff', '#06241c'],
      ['Pixel Amber', 1, '#120c02', '#1a1205', '#4a3814', '#ffe6b0', '#c9a86b', '#ffb000', '#ffd466', '#ff9f4d', '#1f1400'],
      ['Paper', 0, '#f4efe6', '#ece5d8', '#d6cbb8', '#2b2722', '#615848', '#a3366d', '#1f5f99', '#a84a22', '#ffffff'],
      ['Mint Cream', 0, '#eef6f1', '#e3efe8', '#c2d6ca', '#1b2a24', '#4f6459', '#0c6e52', '#7a3fa6', '#a84a0c', '#ffffff']
    ];
    const box = $('#swatches'), root = document.documentElement;
    box.innerHTML = LIST.map(([n, px, bg, , , tx, , ac], i) => `<button type="button" role="radio" aria-checked="${!i}" class="sw${px ? ' px' : ''}" data-i="${i}" style="background:${bg};color:${tx};--a:${ac}">${n}</button>`).join('');
    box.addEventListener('click', (e) => {
      const b = e.target.closest('.sw'); if (!b) return;
      const [, , bg, panel, line, text, muted, accent, accent2, pink, on] = LIST[+b.dataset.i];
      Object.entries({ bg, panel, line, text, muted, accent, accent2, pink, 'on-accent': on }).forEach(([k, v]) => root.style.setProperty('--' + k, v));
      aurora = { a: hex(accent), b: hex(accent2), c: hex(pink), bg: hex(bg) };
      $$('.sw', box).forEach((s) => s.setAttribute('aria-checked', s === b));
    });
  })();

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

  // ---- the cat: it walks along the bottom, and you can pick it up and throw it, like in Aether
  (function buddy() {
    const el = $('#buddy'), W = 80, H = 60; if (still) { el.hidden = true; return; }
    let x = 40, y = -80, vx = 0, vy = 0, held = false, dir = 1, frame = 0, walk = 0, rest = 120, lastX = 0, lastY = 0, grabX = 0, grabY = 0;
    const floor = () => innerHeight - H - 6;
    const heart = () => { const h = document.createElement('i'); h.className = 'heart'; h.style.left = x + W / 2 + rand(-16, 10) + 'px'; h.style.top = y + 'px'; document.body.appendChild(h); setTimeout(() => h.remove(), 1000); };
    el.addEventListener('pointerdown', (e) => { held = true; el.classList.add('held'); el.setPointerCapture(e.pointerId); grabX = e.clientX - x; grabY = e.clientY - y; lastX = e.clientX; lastY = e.clientY; vx = vy = 0; heart(); });
    el.addEventListener('pointermove', (e) => { if (!held) return; x = e.clientX - grabX; y = e.clientY - grabY; vx = (e.clientX - lastX) * .9; vy = (e.clientY - lastY) * .9; lastX = e.clientX; lastY = e.clientY; });
    const drop = () => { held = false; el.classList.remove('held'); };
    el.addEventListener('pointerup', drop); el.addEventListener('pointercancel', drop);
    let t = 0;
    (function go() {
      requestAnimationFrame(go); t++;
      if (!held) {
        const F = floor();
        if (y < F || vy < 0) { vy += .7; x += vx; y += vy; vx *= .995; if (x < 0 || x > innerWidth - W) { vx = -vx * .7; x = Math.max(0, Math.min(innerWidth - W, x)); } if (y >= F) { y = F; if (vy > 7) { vy = -vy * .42; vx *= .7; } else { vy = 0; vx = 0; } } } else {
          y = F;
          if (rest > 0) { rest--; if (!rest) { walk = rand(120, 380) | 0; dir = x < 120 ? 1 : x > innerWidth - 200 ? -1 : Math.random() < .5 ? 1 : -1; } } else { x += dir * 1.1; walk--; if (t % 6 === 0) frame = (frame + 1) % 8; if (walk <= 0 || x < 4 || x > innerWidth - W - 4) { walk = 0; rest = rand(100, 340) | 0; frame = 0; } }
        }
      } else if (t % 6 === 0) frame = (frame + 1) % 8;
      if (vx > .5) dir = 1; else if (vx < -.5) dir = -1;
      el.style.backgroundPositionX = -frame * W + 'px';
      el.style.transform = `translate(${x | 0}px, ${y | 0}px) scaleX(${dir})`;
    })();
  })();
})();
