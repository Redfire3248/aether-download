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

    // the stars: drawn once into a small picture that repeats, on a far and a near layer. The graphics card moves
    // and twinkles them, so nothing is redrawn while the page sits still. Two tile sizes, so the repeats never line up.
    const box = $('#stars'), LAYERS = [{ z: .45, tile: 448, share: .625, size: 1, alpha: [.32, .62] }, { z: .85, tile: 320, share: .375, size: 2, alpha: [.62, .8] }];
    LAYERS.forEach((L, i) => {
      L.el = box.children[i];
      const t = document.createElement('canvas'), q = t.getContext('2d'); t.width = t.height = L.tile; q.fillStyle = '#fff';
      for (let n = Math.round(L.tile * L.tile / 9000 * L.share); n--;) { q.globalAlpha = rand(...L.alpha); q.fillRect(rand(0, L.tile) | 0, rand(0, L.tile) | 0, L.size, L.size); }
      L.el.style.backgroundImage = `url(${t.toDataURL()})`; L.el.style.backgroundSize = `${L.tile}px`;
      L.el.style.left = -L.tile + 'px'; L.el.style.setProperty('--tile', L.tile + 'px');
      L.el.style.animationDuration = `${(L.tile / (3 * L.z)).toFixed(0)}s, ${3 + i * 1.7}s`; // they drift 3 px a second at full depth
    });
    // big enough to cover the window wherever the drift, the scroll and the mouse have moved it
    const size = () => { for (const L of LAYERS) { L.el.style.width = innerWidth + L.tile + 80 + 'px'; L.el.style.height = innerHeight + L.tile + 80 + 'px'; } };
    addEventListener('resize', size); size();
    let ticking = false;
    const place = () => { ticking = false; for (const L of LAYERS) L.el.style.translate = `0 ${-((scrollY * L.z * .12) % L.tile).toFixed(1)}px`; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(place); } }, { passive: true }); place();
    addEventListener('pointermove', (e) => { box.style.translate = `${(.5 - e.clientX / innerWidth) * 26}px ${(.5 - e.clientY / innerHeight) * 26}px`; }, { passive: true });

    // the pixel aurora: each sine is split into a part for the column (worked out once) and one for the row (once a frame)
    const LEVELS = 10;
    const col = (f) => Float64Array.from({ length: W }, (_, x) => f(x / W));
    const S5 = col((u) => Math.sin(u * 5)), C5 = col((u) => Math.cos(u * 5)), S9 = col((u) => Math.sin(u * 9)), C9 = col((u) => Math.cos(u * 9));
    const colMid = new Float64Array(W);
    const aurorify = (t) => {
      const q = t * .00016, scroll = Math.min(1, scrollY / (innerHeight * 3));
      for (let x = 0; x < W; x++) colMid[x] = .42 + Math.sin(x / W * 3 + q * 4) * .2 - scroll * .25;
      for (let y = 0, i = 0; y < H; y++) {
        const v = y / H, a = Math.sin(v * 4 + q * 3) * 1.4 + q * 7, b = v * 3 - q * 5, sa = Math.sin(a), ca = Math.cos(a), sb = Math.sin(b) * .6, cb = Math.cos(b) * .6;
        for (let x = 0; x < W; x++, i += 4) {
          const n = S5[x] * ca + C5[x] * sa + S9[x] * cb + C9[x] * sb; // sin(5u + a) + .6 sin(9u + b)
          const band = Math.exp(-((v - colMid[x]) ** 2) * 14);
          // pixel look: the light comes in steps, with a dither pattern between them
          let k = Math.max(0, (n + 1.6) / 3.2) * band; k = Math.floor(k * LEVELS + ((x + y) % 2 ? .35 : -.05)) / LEVELS; k = Math.max(0, Math.min(1, k)) * .3;
          const c = n > .25 ? aurora.c : n > -.4 ? aurora.a : aurora.b;
          d[i] = aurora.bg[0] + (c[0] - aurora.bg[0]) * k; d[i + 1] = aurora.bg[1] + (c[1] - aurora.bg[1]) * k; d[i + 2] = aurora.bg[2] + (c[2] - aurora.bg[2]) * k; d[i + 3] = 255;
        }
      }
      g.putImageData(im, 0, 0);
    };
    // it moves slowly: 10 frames a second is plenty, and it only runs in a pixel theme
    let running = false, last = 0;
    const loop = (t) => { if (!pixelSky || document.hidden) { running = false; return; } requestAnimationFrame(loop); if (t - last >= 100) { last = t; aurorify(t); } };
    const start = () => { if (!running && pixelSky && !still && !document.hidden) { running = true; requestAnimationFrame(loop); } };
    paintSky = () => { if (pixelSky) aurorify(performance.now()); start(); };
    document.addEventListener('visibilitychange', start);
  })();

  // ---- themes: the real ones from Aether. A pixel theme turns the whole page pixel, as it does in the app
  (function themes() {
    const LIST = [
      ['Aether Night', 0, 1, '#0b0e1a', '#0e1222', '#1d2440', '#d7dcf0', '#7d86a8', '#7859f7', '#3ff3c8', '#ff7eb6', '#ffffff'],
      ['Nebula', 0, 1, '#120b22', '#170f2b', '#2c1f4d', '#ebe1ff', '#a08cc8', '#ff5cc8', '#8f7bff', '#ff7ad9', '#120b22'],
      ['Paper', 0, 0, '#f2f2f0', '#f7f7f5', '#e0e0db', '#222222', '#6b6b66', '#2f6fed', '#e8590c', '#c2255c', '#ffffff'],
      ['Pixel Arcade', 1, 1, '#14152a', '#1a1c2c', '#566c86', '#f4f4f4', '#94b0c2', '#ef7d57', '#a7f070', '#c46c7c', '#1a1c2c'],
      ['Pixel Game Boy', 1, 1, '#0f380f', '#183f18', '#4f7f1f', '#c4e36a', '#c5d687', '#9bbc0f', '#c4e36a', '#9bbc0f', '#0f380f'],
    ];
    const root = document.documentElement, btn = $('#theme-btn'), menu = $('#theme-menu'), dot = $('.theme-dot'), KEY = 'aether-site-theme', meta = $('meta[name="theme-color"]');
    const row = ([name, px, , bg, , , tx, , ac, ac2, pk], i) => `<button type="button" class="tm-row${px ? ' px' : ''}" data-i="${i}" aria-pressed="false"><span class="tm-sw" style="background:${bg}"><i style="background:${ac}"></i><i style="background:${ac2}"></i><i style="background:${pk}"></i></span><span style="--tx:${tx}">${name}</span></button>`;
    const group = (title, px) => `<p class="tm-h">${title}</p><div class="tm-list">${LIST.map((t, i) => (!!t[1] === px ? row(t, i) : '')).join('')}</div>`;
    menu.innerHTML = group('Smooth', false) + group('Pixel', true);
    const rows = $$('.tm-row', menu);
    const apply = (i) => {
      const [name, px, dark, bg, panel, line, text, muted, accent, accent2, pink, on] = LIST[i];
      Object.entries({ bg, panel, line, text, muted, accent, accent2, pink, 'on-accent': on }).forEach(([k, v]) => root.style.setProperty('--' + k, v));
      if (px) root.dataset.style = 'pixel'; else delete root.dataset.style;
      root.dataset.mode = dark ? 'dark' : 'light'; meta.content = bg; pixelSky = !!px; dot.style.background = accent;
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
      if (j.extensions && j.extensions.length) list = j.extensions;
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
