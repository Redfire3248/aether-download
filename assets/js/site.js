// Aether's website: what every page shares (the bar, themes, the reveals, moving between pages, the latest
// version from GitHub) and the small moving pictures that show each app. Plain JavaScript, no libraries.
(function () {
  'use strict';
  const root = document.documentElement;
  root.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const REPO = 'Redfire3248/aether-download';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rand = (a, b) => a + Math.random() * (b - a);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const ICONS = 'assets/icons.svg';
  const ic = (name, cls = '') => `<svg class="ic ${cls}" aria-hidden="true"><use href="${ICONS}#${name}"/></svg>`;
  // runs fn(true) when el comes on screen and fn(false) when it leaves, so nothing animates out of sight
  const whenSeen = (el, fn, margin = '80px') => { let on = false; new IntersectionObserver((e) => { const v = e[0].isIntersecting; if (v !== on) { on = v; fn(v); } }, { rootMargin: margin }).observe(el); };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------------------------------------------------------------- themes: the real ones from Aether
  const THEMES = [
    // name, pixel, dark, bg, text, muted, accent, accent2, pink, on-accent
    ['Aether', 0, 1, '#05070f', '#e9edff', '#9ba5c9', '#3d8bff', '#3fe3ff', '#a77bff', '#031021'],
    ['Aether Night', 0, 1, '#0b0e1a', '#d7dcf0', '#8a93b5', '#7859f7', '#3ff3c8', '#ff7eb6', '#ffffff'],
    ['Nebula', 0, 1, '#120b22', '#ebe1ff', '#a08cc8', '#ff5cc8', '#8f7bff', '#ff7ad9', '#120b22'],
    ['Paper', 0, 0, '#f2f2f0', '#1f1f1f', '#56564f', '#2f6fed', '#c2410c', '#c2255c', '#ffffff'],
    ['Pixel Arcade', 1, 1, '#14152a', '#f4f4f4', '#a3bccc', '#ef7d57', '#a7f070', '#c46c7c', '#1a1c2c'],
    ['Pixel Game Boy', 1, 1, '#0f380f', '#c4e36a', '#a9c77a', '#9bbc0f', '#c4e36a', '#8bac0f', '#0f380f']
  ];
  (function themes() {
    const btn = $('#theme-btn'), menu = $('#theme-menu'), KEY = 'aether-site-theme', meta = $('meta[name="theme-color"]');
    const apply = (i, quiet) => {
      const [, px, dark, bg, text, muted, accent, accent2, pink, on] = THEMES[i];
      Object.entries({ bg, text, muted, accent, accent2, pink, 'on-accent': on }).forEach(([k, v]) => root.style.setProperty('--' + k, v));
      if (px) root.dataset.style = 'pixel'; else delete root.dataset.style;
      root.dataset.mode = dark ? 'dark' : 'light';
      if (meta) meta.content = bg;
      $$('.tm-row', menu || document).forEach((r) => r.setAttribute('aria-pressed', +r.dataset.i === i));
      if (btn) btn.title = 'Theme: ' + THEMES[i][0];
      if (!quiet) dispatchEvent(new Event('aether-theme'));
    };
    let saved = 0; try { saved = Math.max(0, THEMES.findIndex((t) => t[0] === localStorage.getItem(KEY))); } catch { /* the first theme */ }
    apply(saved, true);
    if (!btn || !menu) return;
    const row = ([name, px, , bg, , , ac, ac2, pk], i) => `<button type="button" class="tm-row" data-i="${i}" aria-pressed="${i === saved}"><span class="tm-sw" style="background:${bg}"><i style="background:${ac}"></i><i style="background:${ac2}"></i><i style="background:${pk}"></i></span>${name}</button>`;
    const group = (title, px) => `<p class="tm-h">${title}</p>${THEMES.map((t, i) => (!!t[1] === px ? row(t, i) : '')).join('')}`;
    menu.innerHTML = group('Smooth', false) + group('Pixel', true);
    const rows = $$('.tm-row', menu);
    const open = (on) => { menu.hidden = !on; btn.setAttribute('aria-expanded', on); if (on) (rows.find((r) => r.getAttribute('aria-pressed') === 'true') || rows[0]).focus({ preventScroll: true }); };
    btn.addEventListener('click', () => open(menu.hidden));
    menu.addEventListener('click', (e) => { const r = e.target.closest('.tm-row'); if (!r) return; apply(+r.dataset.i); try { localStorage.setItem(KEY, THEMES[+r.dataset.i][0]); } catch { /* lasts for this visit */ } });
    menu.addEventListener('keydown', (e) => { const k = rows.indexOf(document.activeElement), step = { ArrowDown: 1, ArrowUp: -1 }[e.key]; if (step) { e.preventDefault(); rows[(k + step + rows.length) % rows.length].focus(); } });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) { open(false); btn.focus(); } });
    addEventListener('pointerdown', (e) => { if (!menu.hidden && !e.target.closest('.theme-pick')) open(false); });
  })();

  // ---------------------------------------------------------------- the bar: it turns into a floating pill as you scroll
  (function nav() {
    const bar = $('.nav'), prog = $('.progress i'), menuBtn = $('#nav-menu'), panel = $('#nav-panel');
    let ticking = false, max = 1;
    const measure = () => { max = Math.max(1, root.scrollHeight - innerHeight); };
    const run = () => { ticking = false; const y = scrollY; bar && bar.classList.toggle('scrolled', y > 30); if (prog) prog.style.transform = `scaleX(${Math.min(1, y / max)})`; };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', () => { measure(); run(); }); new ResizeObserver(() => { measure(); run(); }).observe(document.body); measure(); run();
    if (!menuBtn || !panel) return;
    const open = (on) => { panel.hidden = !on; menuBtn.setAttribute('aria-expanded', on); menuBtn.querySelector('use').setAttribute('href', `${ICONS}#${on ? 'close' : 'menu'}`); if (on) { const a = panel.querySelector('a'); if (a) a.focus({ preventScroll: true }); } };
    menuBtn.addEventListener('click', () => open(panel.hidden));
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { open(false); menuBtn.focus(); } });
    addEventListener('pointerdown', (e) => { if (!panel.hidden && !e.target.closest('#nav-panel, #nav-menu')) open(false); });
    matchMedia('(min-width: 901px)').addEventListener('change', (m) => { if (m.matches) open(false); });
  })();

  // ---------------------------------------------------------------- moving between the pages: a soft fade (the browser's own view transition when it has one)
  (function transitions() {
    if (still || 'CSSViewTransitionRule' in window) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]'); if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !/\.html$|\/$/.test(url.pathname)) return;
      e.preventDefault(); root.classList.add('leaving'); setTimeout(() => { location.href = url.href; }, 230);
    });
    addEventListener('pageshow', () => root.classList.remove('leaving'));
  })();

  // ---------------------------------------------------------------- headings come up word by word; other things rise in
  $$('.split').forEach((h) => {
    const words = [];
    h.childNodes.forEach((n) => { const g = n.nodeType === 1 && n.classList.contains('g'); (n.textContent || '').split(/\s+/).filter(Boolean).forEach((w) => words.push([w, g])); });
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    h.innerHTML = words.map(([w, g], i) => `<span class="w${g ? ' grad-w' : ''}" aria-hidden="true"><i style="--n:${i}">${esc(w)}</i></span>`).join(' ');
  });
  const seen = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); seen.unobserve(e.target); } }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.split, [data-r], [data-in]').forEach((el) => seen.observe(el));
  // CSS animations stop while they are off the screen
  const pause = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle('paused', !e.isIntersecting); });
  $$('.card, .ticker, .rails, .gm-hero-logo, .stage').forEach((el) => pause.observe(el));

  // ---------------------------------------------------------------- the light on each card follows the mouse; some cards lean towards it
  if (fine && !still) {
    // (once a frame, and only the card under the mouse)
    $$('.card').forEach((c) => { let r = null, ex = 0, ey = 0, on = false;
      c.addEventListener('pointerenter', () => { r = null; });
      c.addEventListener('pointermove', (e) => { ex = e.clientX; ey = e.clientY; if (on) return; on = true; requestAnimationFrame(() => { on = false; r = c.getBoundingClientRect(); c.style.setProperty('--mx', ex - r.left + 'px'); c.style.setProperty('--my', ey - r.top + 'px'); }); }); });
    $$('[data-tilt]').forEach((c) => {
      const max = +c.dataset.tilt || 5;
      c.classList.add('tilt');
      c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; c.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg) translateY(-4px)`; });
      c.addEventListener('pointerleave', () => { c.style.transform = ''; });
    });
    // buttons lean towards the mouse
    $$('.magnet').forEach((b) => {
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) * .2, y = (e.clientY - r.top - r.height / 2) * .32; if (root.dataset.style === 'pixel') { x = Math.round(x / 3) * 3; y = Math.round(y / 3) * 3; } b.style.transform = `translate(${x}px, ${y}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  // ---------------------------------------------------------------- things tied to scrolling: parallax, the window that lies flat, the spreading windows
  (function scrolly() {
    if (still) return;
    const par = $$('[data-par]'), shows = $$('.showcase'), stage = $('.stage');
    if (!par.length && !shows.length && !stage) return;
    let ticking = false;
    const run = () => {
      ticking = false; const vh = innerHeight;
      // (all the reading first, then all the writing: reading after a write makes the browser lay the page out again)
      const parR = par.map((el) => el.parentElement.getBoundingClientRect()), showR = shows.map((s) => s.getBoundingClientRect()), stageR = stage && stage.getBoundingClientRect();
      par.forEach((el, i) => { const r = parR[i]; if (r.bottom < -200 || r.top > vh + 200) return; const c = (r.top + r.height / 2 - vh / 2); el.style.transform = `translate3d(0, ${(c * -(+el.dataset.par)).toFixed(1)}px, 0)`; });
      shows.forEach((s2, i) => { const r = showR[i]; const p = Math.max(0, Math.min(1, (r.top - vh * .2) / (vh * .6))); s2.style.setProperty('--p', p.toFixed(3)); });
      if (stage) { const r = stageR; const p = Math.max(0, Math.min(1, 1 - (r.top + r.height * .3) / vh)); stage.style.setProperty('--p', p.toFixed(3)); }
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
    addEventListener('resize', run); run();
    if (stage && fine) {
      const inner = $('.stage-in', stage);
      let sx = 0, sy = 0, sOn = false;
      addEventListener('pointermove', (e) => { sx = e.clientX / innerWidth - .5; sy = e.clientY / innerHeight - .5; if (!sOn) { sOn = true; requestAnimationFrame(() => { sOn = false; inner.style.transform = `rotateY(${(sx * 6).toFixed(2)}deg) rotateX(${(-sy * 4).toFixed(2)}deg)`; }); } }, { passive: true });
    }
  })();

  // ---------------------------------------------------------------- the word that keeps changing in the home headline
  (function rotor() {
    const box = $('#rotor'); if (!box) return;
    const WORDS = (box.dataset.words || 'anything.').split('|');
    const col = (k) => (k < .5 ? `color-mix(in srgb, var(--a2) ${k * 200 | 0}%, var(--a1))` : `color-mix(in srgb, var(--a3) ${(k - .5) * 200 | 0}%, var(--a2))`);
    const show = (w) => { box.innerHTML = '<span>' + [...w].map((c, k) => `<span class="ch" style="animation-delay:${k * 30}ms;color:${col(k / Math.max(1, w.length - 1))}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`).join('') + '</span>'; fit(); };
    const fit = () => { const s = box.firstElementChild; if (s) box.style.width = s.offsetWidth + 'px'; };
    addEventListener('resize', fit); if (document.fonts) document.fonts.ready.then(fit);
    show(WORDS[0]); if (still) return; let i = 0;
    setInterval(() => { if (!document.hidden) { i = (i + 1) % WORDS.length; show(WORDS[i]); } }, 2400);
  })();

  // ---------------------------------------------------------------- the product windows, drawn in HTML
  const CODE_PY = [
    [['c', '# a coin that spins, then a score']],
    [['k', 'class '], ['f', 'Coin'], ['', ':']],
    [['', '    '], ['k', 'def '], ['f', '__init__'], ['', '(self, x, y):']],
    [['', '        self.x, self.y = x, y']],
    [['', '        self.spin = '], ['n', '0']],
    [['', '']],
    [['k', 'def '], ['f', 'score'], ['', '(coins):']],
    [['', '    '], ['k', 'return '], ['f', 'sum'], ['', '('], ['n', '10'], ['', ' '], ['k', 'for '], ['', '_ '], ['k', 'in '], ['', 'coins)']],
    [['', '']],
    [['f', 'print'], ['', '('], ['s', 'f"Score: {score([Coin(1, 2)] * 3)}"'], ['', ')']]
  ];
  const flatten = (lines) => lines.flatMap((l, i) => [...l.flatMap(([c, t]) => [...t].map((ch) => [c, ch])), ...(i < lines.length - 1 ? [['', '\n']] : [])]);
  const paintCode = (el, flat, n, cursor = true) => {
    let out = '', cur = null;
    for (let i = 0; i < n; i++) { const [c, ch] = flat[i]; if (c !== cur) { if (cur) out += '</span>'; if (c) out += `<span class="${c}">`; cur = c; } out += ch === '<' ? '&lt;' : ch === '&' ? '&amp;' : ch; }
    if (cur) out += '</span>'; el.innerHTML = out + (cursor ? '<span class="cur"></span>' : '');
  };
  const MOCKS = {
    editor: () => `<div class="mk mk-ed" aria-hidden="true">
      <div class="mk-bar"><i></i><i></i><i></i><b><img src="assets/logo-64.png" alt="">Aether</b><span class="mk-pill">${ic('spark')}AI ready</span></div>
      <div class="mk-body">
        <div class="mk-act">${ic('pdf', 'on')}${ic('git')}${ic('bug')}${ic('spark')}${ic('chip')}${ic('phone')}${ic('puzzle')}</div>
        <div class="mk-tree"><p>${ic('chevron')}coin-rush</p><p class="in"><i style="background:#3fe3ff"></i>assets</p><p class="in sel"><i style="background:#ffd34b"></i>coins.py</p><p class="in"><i style="background:#c792ff"></i>game.aes</p><p class="in"><i style="background:#7ef0a8"></i>level.scene</p><p class="in"><i style="background:#ff8a65"></i>README.md</p></div>
        <div class="mk-main">
          <div class="mk-tabs"><span class="on"><i></i>coins.py</span><span><i style="background:#c792ff"></i>game.aes</span></div>
          <div class="mk-code"><div class="mk-ln">${Array.from({ length: 12 }, (_, i) => i + 1).join('\n')}</div><pre class="mk-typed"></pre></div>
          <div class="mk-term"><div class="t-h"><b>Terminal</b><span>Problems</span><span>Output</span></div><div class="t-out"></div></div>
        </div>
        <div class="mk-ai"><div class="ai-h">${ic('spark')}AI<small>Local</small></div><div class="bub me">Explain score()</div><div class="bub ai">It gives <code>10</code> points for each coin and adds them up.</div><div class="bub me">Add a test for it</div><div class="bub ai">Made <code>test_coins.py</code>. Apply?</div><div class="ai-in">Ask about your code${ic('arrow')}</div></div>
      </div></div>`,
    game: () => `<div class="mk mk-game" aria-hidden="true">
      <div class="mk-bar"><i></i><i></i><i></i><b><img src="assets/game-maker-logo-64.png" alt="">Ore Rush</b></div>
      <div class="mk-tool"><span class="play-b">${ic('play')}Play</span><span class="tabs-r"><span class="on">Home</span><span>Model</span><span>Script</span><span>Test</span><span>Game</span></span></div>
      <div style="position:relative"><canvas width="320" height="180"></canvas><div class="hud"><span>Coins 0</span><span>Level 1</span></div></div></div>`,
    script: () => `<div class="mk mk-script" aria-hidden="true">
      <div class="mk-bar"><i></i><i></i><i></i><b><img src="img/aether-script.png" alt="">ball.aes</b></div>
      <div class="mk-body"><pre><span class="f">win</span> = <span class="f">Window</span>(<span class="s">"Ball"</span>, <span class="n">400</span>, <span class="n">300</span>)
<span class="f">g</span> = win.<span class="f">canvas</span>()
x = <span class="n">50</span>
<span class="k">func</span> <span class="f">frame</span>(dt):
  x = (x + <span class="n">120</span> * dt) % g.width
  g.<span class="f">clear</span>(<span class="s">"#101420"</span>)
  g.<span class="f">circle</span>(x, g.height / <span class="n">2</span>, <span class="n">20</span>, <span class="s">"#5cf"</span>)
win.<span class="f">on_frame</span>(frame)</pre>
      <div class="run"><div class="mini-win"><div class="mw-bar"><img src="img/aether-script.png" alt="">Ball<span>live</span></div><canvas width="200" height="150"></canvas></div></div></div></div>`
  };
  const mount = (kind) => {
    const tmp = document.createElement('div'); tmp.innerHTML = MOCKS[kind](); const mk = tmp.firstElementChild;
    if (kind === 'editor') runEditor(mk); else if (kind === 'game') runGame($('canvas', mk), 'platform', mk); else runBall($('canvas', mk));
    return mk;
  };
  $$('[data-mock]').forEach((host) => {
    const kind = host.dataset.mock, tmp = document.createElement('div'); tmp.innerHTML = MOCKS[kind]();
    const mk = tmp.firstElementChild; [...host.classList].forEach((c) => c !== 'mock-host' && mk.classList.add(c)); host.replaceWith(mk);
    if (kind === 'editor') runEditor(mk); else if (kind === 'game') runGame($('canvas', mk), 'platform', mk); else runBall($('canvas', mk));
  });

  // real pictures of the apps (assets/shots): until a picture is there, the window shows the app drawn in HTML
  // (data-fallback) or a clean "picture coming" card
  $$('.device').forEach((d) => {
    const img = $('.device-view > img', d); if (!img) return;
    const missing = () => {
      if (d.classList.contains('empty') || d.classList.contains('mocked')) return;
      const kind = d.dataset.fallback;
      if (kind && MOCKS[kind]) { d.classList.add('mocked'); img.hidden = true; $('.device-view', d).prepend(mount(kind)); } else d.classList.add('empty');
    };
    img.addEventListener('error', missing);
    if (img.complete && !img.naturalWidth) missing();
  });

  function runEditor(mk) {
    const el = $('.mk-typed', mk), out = $('.t-out', mk), bubs = $$('.bub', mk), flat = flatten(CODE_PY);
    let alive = false, token = 0;
    const show = () => { paintCode(el, flat, flat.length, false); out.innerHTML = '<p><span class="pr">coin-rush&gt;</span> python coins.py</p><p class="ok">Score: 30</p>'; bubs.forEach((b) => b.classList.add('show')); };
    if (still) { show(); return; }
    const play = async (my) => {
      while (alive && my === token) {
        out.innerHTML = '<p><span class="pr">coin-rush&gt;</span> </p>'; bubs.forEach((b) => b.classList.remove('show'));
        for (let n = 0; n <= flat.length; n++) { if (!alive || my !== token) return; paintCode(el, flat, n); await sleep(flat[n] && flat[n][1] === '\n' ? 120 : rand(18, 52)); }
        await sleep(400); out.innerHTML = '<p><span class="pr">coin-rush&gt;</span> python coins.py</p>'; await sleep(500);
        out.innerHTML += '<p class="ok">Score: 30</p>';
        for (const b of bubs) { await sleep(900); if (!alive || my !== token) return; b.classList.add('show'); }
        await sleep(3800);
      }
    };
    whenSeen(mk, (v) => { alive = v; if (v) play(++token); });
  }

  // a tiny game drawn at a low size and scaled up: a platformer, a top-down walk or a first-person maze
  function runGame(cv, mode, watch) {
    if (!cv) return;
    const g = cv.getContext('2d'), W = cv.width, H = cv.height;
    const P = { sky1: '#1a0f3a', sky2: '#3b1a6b', hill: '#2a1652', hill2: '#3d1f73', ground: '#5b2a9c', top: '#c084fc', coin: '#ffd34b', player: '#3fe3ff', eye: '#081020', star: '#f5d0fe' };
    const stars = Array.from({ length: 40 }, () => [Math.random() * W, Math.random() * H * .6, Math.random()]);
    const coins = Array.from({ length: 6 }, (_, i) => ({ x: 140 + i * 90, y: 0, got: false }));
    let cam = 0, py = 0, vy = 0, score = 0, t = 0, last = 0, alive = false;
    const ground = (x) => (Math.floor(x / 64) % 5 === 3 ? 136 : 150) - (Math.floor(x / 64) % 7 === 5 ? 22 : 0);
    const hud = watch && $('.hud span', watch);
    function platform(dt) {
      t += dt; cam += 70 * dt;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, P.sky1); sky.addColorStop(1, P.sky2); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      for (const [x, y, k] of stars) { g.fillStyle = P.star; g.globalAlpha = .3 + .7 * Math.abs(Math.sin(t * 2 + k * 9)); g.fillRect(((x - cam * .1 * k) % W + W) % W | 0, y | 0, 1, 1); }
      g.globalAlpha = 1;
      for (const [col, sp, base, amp] of [[P.hill, .25, 110, 22], [P.hill2, .5, 124, 16]]) { g.fillStyle = col; g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 4) g.lineTo(x, base - Math.abs(Math.sin((x + cam * sp) / 47)) * amp - Math.sin((x + cam * sp) / 19) * 4); g.lineTo(W, H); g.fill(); }
      for (let sx = -((cam) % 16); sx < W; sx += 16) { const wx = sx + cam, gy = ground(wx); g.fillStyle = P.ground; g.fillRect(Math.round(sx), gy, 16, H - gy); g.fillStyle = P.top; g.fillRect(Math.round(sx), gy, 16, 3); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(Math.round(sx) + 15, gy + 3, 1, H - gy); }
      const px = 70, wx = cam + px, gy = ground(wx + 6) - 12;
      vy += 900 * dt; py += vy * dt; if (py > gy) { py = gy; vy = 0; }
      const ahead = ground(wx + 26) - 12; if ((ahead < py - 2 || Math.random() < .006) && py >= gy - .5) vy = -300;
      for (const c of coins) { if (c.x < cam - 20) { c.x += 540; c.got = false; } const cx = c.x - cam, cy = ground(c.x) - 34 + Math.sin(t * 3 + c.x) * 3; c.y = cy; if (!c.got && Math.abs(cx - px - 6) < 10 && Math.abs(cy - py - 6) < 14) { c.got = true; score++; if (hud) hud.textContent = 'Coins ' + score; } if (c.got) continue; const w = Math.max(1, Math.abs(Math.cos(t * 4 + c.x)) * 8); g.fillStyle = P.coin; g.fillRect(Math.round(cx - w / 2), Math.round(cy - 4), Math.round(w), 8); g.fillStyle = '#fff6c2'; g.fillRect(Math.round(cx - w / 2), Math.round(cy - 4), 1, 3); }
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(px, ground(wx + 6) - 1, 12, 2);
      g.fillStyle = P.player; g.fillRect(px, Math.round(py), 12, 12); g.fillStyle = '#b9f6ff'; g.fillRect(px, Math.round(py), 12, 3); g.fillStyle = P.eye; g.fillRect(px + 7, Math.round(py) + 4, 2, 3); g.fillRect(px + 10, Math.round(py) + 4, 1, 3);
    }
    const trees = Array.from({ length: 14 }, () => [rand(10, W - 10), rand(10, H - 10)]);
    let hx = W / 2, hy = H / 2, ang = 0;
    function topdown(dt) {
      t += dt; ang += Math.sin(t * .7) * dt * 1.6; hx += Math.cos(ang) * 40 * dt; hy += Math.sin(ang) * 40 * dt;
      if (hx < 12 || hx > W - 12) { ang = Math.PI - ang; hx = Math.max(12, Math.min(W - 12, hx)); } if (hy < 12 || hy > H - 12) { ang = -ang; hy = Math.max(12, Math.min(H - 12, hy)); }
      g.fillStyle = '#1d3b2a'; g.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16) for (let x = 0; x < W; x += 16) if ((x * 7 + y * 13) % 5 === 0) { g.fillStyle = '#244a34'; g.fillRect(x, y, 16, 16); }
      g.fillStyle = '#6b5a3a'; g.fillRect(0, H / 2 - 10, W, 20);
      for (const [x, y] of trees) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x - 6, y + 4, 14, 5); g.fillStyle = '#3f8f4f'; g.fillRect(x - 7, y - 9, 14, 14); g.fillStyle = '#62c46f'; g.fillRect(x - 7, y - 9, 14, 4); }
      for (let i = 0; i < 4; i++) { const cx = (i * 83 + 40) % W, cy = (i * 47 + 30) % H, w = Math.max(1, Math.abs(Math.cos(t * 4 + i)) * 7); g.fillStyle = P.coin; g.fillRect(cx - w / 2, cy - 3, w, 7); }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(hx - 5, hy + 4, 11, 3);
      g.fillStyle = '#ffb38a'; g.fillRect(hx - 5, hy - 6, 10, 10); g.fillStyle = '#3fe3ff'; g.fillRect(hx - 5, hy - 1, 10, 5); g.fillStyle = '#081020'; g.fillRect(hx - 2 + Math.cos(ang) * 2, hy - 4, 1, 2); g.fillRect(hx + 2 + Math.cos(ang) * 2, hy - 4, 1, 2);
    }
    const MAP = ['#########', '#.......#', '#.##.#..#', '#.#..#.##', '#...##..#', '##.....##', '#..#.#..#', '#.......#', '#########'];
    const wall = (x, y) => (MAP[y | 0] || '#')[x | 0] !== '.';
    let ex = 1.5, ey = 1.5, ea = 0;
    function fps(dt) {
      t += dt; ea += dt * .45; const nx = ex + Math.cos(ea) * dt * .9, ny = ey + Math.sin(ea) * dt * .9; if (!wall(nx, ny)) { ex = nx; ey = ny; } else ea += 1.2;
      const sky = g.createLinearGradient(0, 0, 0, H / 2); sky.addColorStop(0, '#1a0f3a'); sky.addColorStop(1, '#4c1d95'); g.fillStyle = sky; g.fillRect(0, 0, W, H / 2);
      const fl = g.createLinearGradient(0, H / 2, 0, H); fl.addColorStop(0, '#1b1030'); fl.addColorStop(1, '#3b2160'); g.fillStyle = fl; g.fillRect(0, H / 2, W, H / 2);
      for (let c = 0; c < W; c += 2) {
        const ra = ea + Math.atan((c / W - .5) * 1.2); let d = 0, hit = 0, side = 0; const sx = Math.cos(ra), sy = Math.sin(ra);
        while (d < 12) { d += .02; const x = ex + sx * d, y = ey + sy * d; if (wall(x, y)) { hit = 1; side = Math.abs(x - Math.round(x)) < Math.abs(y - Math.round(y)) ? 1 : 0; break; } }
        if (!hit) continue; const cd = d * Math.cos(ra - ea), h = Math.min(H, H / cd * .9), sh = Math.max(.15, 1 - cd / 8) * (side ? .75 : 1);
        const tex = ((ex + sx * d) * 8 + (ey + sy * d) * 8) | 0;
        g.fillStyle = `rgb(${(124 + (tex % 2) * 20) * sh | 0},${(58 + (tex % 2) * 10) * sh | 0},${237 * sh | 0})`; g.fillRect(c, (H - h) / 2, 2, h);
      }
      g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(W / 2 - 4, H / 2, 9, 1); g.fillRect(W / 2, H / 2 - 4, 1, 9);
    }
    const step = { platform, topdown, fps }[mode];
    const loop = (now) => { if (!alive) return; const dt = Math.min(.05, (now - last) / 1000 || .016); last = now; step(dt); requestAnimationFrame(loop); };
    step(.016); for (let i = 0; i < 30; i++) step(.016);
    if (still) return;
    whenSeen(watch || cv, (v) => { alive = v; if (v) { last = performance.now(); requestAnimationFrame(loop); } });
  }
  // the Aether Script example's own ball, moving just as the code says
  function runBall(cv) {
    if (!cv) return; const g = cv.getContext('2d'), W = cv.width, H = cv.height; let x = 50, last = 0, alive = false;
    const draw = () => { g.fillStyle = '#101420'; g.fillRect(0, 0, W, H); g.fillStyle = '#55ccff'; g.shadowColor = '#55ccff'; g.shadowBlur = 16; g.beginPath(); g.arc(x, H / 2, 15, 0, 7); g.fill(); g.shadowBlur = 0; };
    const loop = (now) => { if (!alive) return; const dt = Math.min(.05, (now - last) / 1000); last = now; x = (x + 90 * dt) % W; draw(); requestAnimationFrame(loop); };
    draw(); if (still) return;
    whenSeen(cv, (v) => { alive = v; if (v) { last = performance.now(); requestAnimationFrame(loop); } });
  }
  $$('canvas[data-game]').forEach((cv) => runGame(cv, cv.dataset.game, cv.closest('.card')));

  // ---------------------------------------------------------------- small moving pictures in the feature tiles
  // AI: a local model and a cloud model answer side by side
  $$('[data-ai-demo]').forEach((box) => {
    const bubs = $$('.bub', box); if (still) { bubs.forEach((b) => b.classList.add('show')); return; }
    let alive = false, token = 0;
    const play = async (my) => { while (alive && my === token) { bubs.forEach((b) => b.classList.remove('show')); for (const b of bubs) { await sleep(800); if (!alive || my !== token) return; b.classList.add('show'); } await sleep(3500); } };
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });
  // the debugger steps through the lines
  $$('[data-dbg]').forEach((box) => {
    const lines = $$('.l', box), vars = $$('.dbg-vars b', box), STEPS = [[1, ['0', '[]']], [2, ['0', '[]']], [3, ['10', '[]']], [2, ['10', '[1]']], [3, ['20', '[1]']], [4, ['20', '[1, 2]']]];
    let k = 0, timer = 0;
    const go = () => { const [at, vs] = STEPS[k]; lines.forEach((l, i) => l.classList.toggle('at', i === at)); vs.forEach((v, i) => { if (vars[i].textContent !== v) { vars[i].textContent = v; vars[i].classList.add('ch'); setTimeout(() => vars[i].classList.remove('ch'), 600); } }); k = (k + 1) % STEPS.length; timer = setTimeout(go, 1100); };
    if (still) { lines[3].classList.add('at'); return; }
    whenSeen(box, (v) => { clearTimeout(timer); if (v) go(); });
  });
  // the terminal types commands
  $$('[data-term]').forEach((box) => {
    const SCRIPT = [['$ ', 'git status'], ['', 'On branch main', 'dim'], ['', 'nothing to commit, working tree clean', 'ok'], ['$ ', 'python coins.py'], ['', 'Score: 30', 'ok'], ['$ ', 'curl parrot.live'], ['', '(a dancing parrot, in colour)', 'dim']];
    let alive = false, token = 0;
    const play = async (my) => {
      while (alive && my === token) {
        box.innerHTML = '';
        for (const [pr, text, cls] of SCRIPT) {
          const p = document.createElement('p'); box.appendChild(p);
          if (pr) { p.innerHTML = `<span class="pr">${pr}</span>`; for (const ch of text) { if (!alive || my !== token) return; p.append(ch); await sleep(rand(30, 70)); } await sleep(300); }
          else { p.className = cls || ''; p.textContent = text; await sleep(250); }
          while (box.children.length > 6) box.firstElementChild.remove();
        }
        await sleep(2600);
      }
    };
    if (still) { box.innerHTML = SCRIPT.slice(0, 5).map(([pr, t, c]) => `<p class="${c || ''}">${pr ? `<span class="pr">${pr}</span>` : ''}${esc(t)}</p>`).join(''); return; }
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });
  // the PDF's words being changed in place
  $$('[data-pdf]').forEach((el) => {
    const WORDS = ['Quarterly report', 'Yearly report', 'Final report'];
    let alive = false, token = 0;
    const play = async (my) => { let i = 0; while (alive && my === token) { const from = WORDS[i], to = WORDS[(i + 1) % WORDS.length]; for (let n = from.length; n >= 0; n--) { if (!alive || my !== token) return; el.innerHTML = esc(from.slice(0, n)) + '<span class="cur"></span>'; await sleep(40); } for (let n = 0; n <= to.length; n++) { if (!alive || my !== token) return; el.innerHTML = esc(to.slice(0, n)) + '<span class="cur"></span>'; await sleep(70); } i = (i + 1) % WORDS.length; await sleep(1800); } };
    if (still) return;
    whenSeen(el, (v) => { alive = v; if (v) play(++token); });
  });
  // apps: the phone fills in, then the files come out
  $$('[data-apps]').forEach((box) => {
    const parts = [...$$('.ph-row', box), ...$$('.app-file', box)]; let alive = false, token = 0;
    if (still) { parts.forEach((p) => p.classList.add('on')); return; }
    const play = async (my) => { while (alive && my === token) { parts.forEach((p) => p.classList.remove('on')); for (const p of parts) { await sleep(450); if (!alive || my !== token) return; p.classList.add('on'); } await sleep(3000); } };
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });
  // pixel art that paints itself
  $$('[data-paint]').forEach((el) => {
    const ART = ['..KK......KK..', '.KOOK....KOOK.', '.KOOOKKKKOOOK.', '.KOOOOOOOOOOK.', 'KOOOOOOOOOOOOK', 'KOOWKOOOOWKOOK', 'KOOKKOOOOKKOOK', 'KOOOOOPPOOOOOK', '.KOOOOOOOOOOK.', '.KOOKKKKKKOOK.', '..KOOOOOOOOK..', '...KKKKKKKK...'];
    const COL = { K: '#111019', O: '#f0a24a', W: '#ffffff', P: '#ff7fa8' };
    const cells = ART.join('').split('').map((c) => { const i = document.createElement('i'); if (c !== '.') i.style.setProperty('--c', COL[c]); i.dataset.c = c; el.appendChild(i); return i; });
    const order = cells.filter((c) => c.dataset.c !== '.').sort(() => Math.random() - .5);
    let k = 0, timer = 0;
    const tick = () => { if (k < order.length) { order[k++].classList.add('on'); timer = setTimeout(tick, 18); } else timer = setTimeout(() => { cells.forEach((c) => c.classList.remove('on')); k = 0; timer = setTimeout(tick, 500); }, 2600); };
    if (still) { order.forEach((c) => c.classList.add('on')); return; }
    whenSeen(el, (v) => { clearTimeout(timer); if (v) tick(); });
  });
  // sound bars and a piano roll
  $$('[data-eq]').forEach((el) => { el.innerHTML = Array.from({ length: 24 }, () => `<i style="--t:${rand(.45, 1.1).toFixed(2)};--d:${rand(0, 1).toFixed(2)}"></i>`).join(''); });
  $$('[data-roll]').forEach((el) => {
    const notes = [[0, 2, 1], [1, 4, 1], [2, 6, 2], [4, 3, 1], [5, 5, 1], [6, 7, 2], [8, 2, 1], [9, 4, 1], [10, 1, 2], [12, 6, 1], [13, 3, 1], [14, 5, 2]];
    el.innerHTML = notes.map(([x, y, w]) => `<i style="left:${x * 6.25 + .5}%;top:${y * 15 + 6}px;width:calc(${w * 6.25}% - 4px)"></i>`).join('') + '<span class="ph"></span>';
  });
  // GUI Studio: a menu put together part by part
  $$('[data-gui]').forEach((box) => {
    const parts = $$('.gui-menu > *', box), sel = $('.gui-sel', box); let alive = false, token = 0;
    const select = (el) => { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); Object.assign(sel.style, { left: r.left - b.left - 4 + 'px', top: r.top - b.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px', opacity: 1 }); };
    if (still) { parts.forEach((p) => p.classList.add('on')); sel.style.opacity = 0; return; }
    const play = async (my) => { while (alive && my === token) { parts.forEach((p) => p.classList.remove('on')); sel.style.opacity = 0; for (const p of parts) { await sleep(650); if (!alive || my !== token) return; p.classList.add('on'); await sleep(80); select(p); } await sleep(2600); } };
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });
  // AI pictures: noise that settles into a picture in four steps
  $$('canvas[data-gen]').forEach((cv) => {
    const g = cv.getContext('2d'), W = cv.width, H = cv.height, label = cv.parentElement.querySelector('.prompt b');
    const pic = document.createElement('canvas'); pic.width = W; pic.height = H; const q = pic.getContext('2d');
    // the finished picture: a castle on a hill at sunset
    const sky = q.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#2a1060'); sky.addColorStop(.55, '#d23fc8'); sky.addColorStop(1, '#ffb38a'); q.fillStyle = sky; q.fillRect(0, 0, W, H);
    q.fillStyle = '#ffe0a8'; q.beginPath(); q.arc(W * .7, H * .52, W * .12, 0, 7); q.fill();
    q.fillStyle = '#3b1a6b'; q.beginPath(); q.moveTo(0, H); for (let x = 0; x <= W; x += 4) q.lineTo(x, H * .7 - Math.sin(x / 23) * 10 - Math.sin(x / 9) * 3); q.lineTo(W, H); q.fill();
    q.fillStyle = '#1a0b33'; q.fillRect(W * .28, H * .44, W * .2, H * .3); q.fillRect(W * .24, H * .36, W * .07, H * .38); q.fillRect(W * .45, H * .36, W * .07, H * .38);
    for (let i = 0; i < 5; i++) { q.fillRect(W * .24 + i * 4 * W / 200, H * .33, W * .02, H * .04); }
    q.fillStyle = '#ffd34b'; q.fillRect(W * .36, H * .52, W * .03, H * .05); q.fillStyle = '#12062a'; q.beginPath(); q.moveTo(0, H); for (let x = 0; x <= W; x += 4) q.lineTo(x, H * .86 - Math.sin(x / 31 + 2) * 8); q.lineTo(W, H); q.fill();
    const img = q.getImageData(0, 0, W, H), noise = g.createImageData(W, H), N = new Uint8ClampedArray(W * H * 3).map(() => Math.random() * 255);
    let k = 0, timer = 0;
    const draw = (mix) => { const d = noise.data, s = img.data; for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { d[i] = N[j] + (s[i] - N[j]) * mix; d[i + 1] = N[j + 1] + (s[i + 1] - N[j + 1]) * mix; d[i + 2] = N[j + 2] + (s[i + 2] - N[j + 2]) * mix; d[i + 3] = 255; } g.putImageData(noise, 0, 0); };
    const tick = () => { k++; if (k > 4) { k = 0; N.forEach((_, i) => (N[i] = Math.random() * 255)); } draw([0, .35, .62, .85, 1][k]); if (label) label.textContent = k ? `step ${k}/4` : 'starting'; timer = setTimeout(tick, k === 4 ? 2600 : 700); };
    if (still) { draw(1); if (label) label.textContent = 'done'; return; }
    draw(0); whenSeen(cv, (v) => { clearTimeout(timer); if (v) tick(); });
  });
  // Claude building a game through Aether's tools
  $$('[data-mcp]').forEach((box) => {
    const SCRIPT = [['u', '> add a coin to level 1 and test it'], ['t', '  aether.read_scene  level1.scene'], ['t', '  aether.edit_scene  + Coin at (420, 180)'], ['ok', '  checked: the scene is valid'], ['t', '  aether.play  keys: right, jump'], ['ok', '  played headless: coin picked up, score 1'], ['dim', '  Done. Level 1 has a new coin.']];
    let alive = false, token = 0;
    const play = async (my) => { while (alive && my === token) { box.innerHTML = ''; for (const [c, t] of SCRIPT) { await sleep(c === 'u' ? 300 : 700); if (!alive || my !== token) return; const p = document.createElement('p'); p.className = c; p.textContent = t; box.appendChild(p); } await sleep(3200); } };
    if (still) { box.innerHTML = SCRIPT.map(([c, t]) => `<p class="${c}">${esc(t)}</p>`).join(''); return; }
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });

  // ---------------------------------------------------------------- lines that draw themselves need their own length
  $$('.draw, .arch .edge').forEach((p) => { try { p.style.setProperty('--len', Math.ceil(p.getTotalLength())); } catch { /* not drawn */ } });

  // ---------------------------------------------------------------- Aether Lab
  // embers rising behind the headline
  $$('[data-embers]').forEach((box) => { if (still) return; box.innerHTML = Array.from({ length: innerWidth < 700 ? 14 : 30 }, () => `<i style="left:${rand(0, 100).toFixed(1)}%;--dx:${rand(-60, 60).toFixed(0)}px;animation-duration:${rand(6, 14).toFixed(1)}s;animation-delay:${rand(-14, 0).toFixed(1)}s;width:${rand(2, 5).toFixed(1)}px;height:${rand(2, 5).toFixed(1)}px"></i>`).join(''); });
  // the task board: a card moves along, column by column (smoothly, from where it was to where it lands)
  $$('[data-board]').forEach((box) => {
    const cols = $$('.col', box), card = $('.task.moving', box); if (!card || still) return;
    let k = cols.findIndex((c) => c.contains(card)), timer = 0;
    const move = () => {
      const from = card.getBoundingClientRect(); k = (k + 1) % cols.length; cols[k].insertBefore(card, cols[k].children[1] || null);
      const to = card.getBoundingClientRect();
      card.animate([{ transform: `translate(${from.left - to.left}px, ${from.top - to.top}px) rotate(-2deg)` }, { transform: 'translate(0, 0) rotate(0)' }], { duration: 700, easing: 'cubic-bezier(.2,.8,.2,1)' });
      const s = $('small b', card); if (s) s.textContent = ['To do', 'In progress', 'In review', 'Done'][k];
      timer = setTimeout(move, k === cols.length - 1 ? 2600 : 1700);
    };
    whenSeen(box, (v) => { clearTimeout(timer); if (v) timer = setTimeout(move, 1200); });
  });
  // the architecture canvas: a light runs along each link
  $$('[data-arch]').forEach((svg) => {
    const edges = $$('.edge', svg), dots = edges.map(() => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); c.setAttribute('r', 3.5); c.setAttribute('class', 'pulse'); c.style.opacity = 0; svg.appendChild(c); return c; });
    if (still) return; let alive = false, t0 = 0;
    const loop = (now) => { if (!alive) return; edges.forEach((e, i) => { const L = e.getTotalLength(), k = ((now - t0) / 2200 + i * .37) % 1, pt = e.getPointAtLength(L * k); dots[i].setAttribute('cx', pt.x); dots[i].setAttribute('cy', pt.y); dots[i].style.opacity = now - t0 > 1600 ? Math.sin(k * Math.PI) : 0; }); requestAnimationFrame(loop); };
    whenSeen(svg, (v) => { alive = v; if (v) { if (!t0) t0 = performance.now(); requestAnimationFrame(loop); } });
  });
  // reviewing an agent's change: the lines come in, then Accept
  $$('[data-diff]').forEach((box) => {
    const lines = $$('.dl', box), acc = $('.acc', box), st = $('.state', box); let alive = false, token = 0;
    if (still) { lines.forEach((l) => l.classList.add('on')); st.classList.add('on'); return; }
    const play = async (my) => { while (alive && my === token) { lines.forEach((l) => l.classList.remove('on')); st.classList.remove('on'); for (const l of lines) { await sleep(260); if (!alive || my !== token) return; l.classList.add('on'); } await sleep(1100); acc.classList.add('hit'); await sleep(260); acc.classList.remove('hit'); st.classList.add('on'); await sleep(3000); } };
    whenSeen(box, (v) => { alive = v; if (v) play(++token); });
  });

  // ---------------------------------------------------------------- the tour: the words go by and the picture keeps up
  (function tour() {
    const steps = $$('.tstep'), imgs = $$('.tour-pin .frame-view img'), name = $('.tour-pin .tour-name'); if (!steps.length) return;
    const go = (i) => { imgs.forEach((im, k) => im.classList.toggle('on', k === i)); steps.forEach((s, k) => s.classList.toggle('on', k === i)); if (name) name.textContent = steps[i].dataset.name || ''; };
    const ob = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) go(steps.indexOf(e.target)); }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => ob.observe(s));
  })();

  // ---------------------------------------------------------------- pick your Aether (tabs)
  (function pick() {
    const tabs = $$('.pick-tab'); if (!tabs.length) return;
    const sel = (t, focus) => { tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; const p = document.getElementById(x.getAttribute('aria-controls')); p.hidden = !on; p.classList.toggle('show', on); }); if (focus) t.focus(); };
    tabs.forEach((t, i) => { t.addEventListener('click', () => sel(t)); t.addEventListener('keydown', (e) => { const d = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length], true); } }); });
  })();

  // ---------------------------------------------------------------- code tabs (Aether Script page)
  $$('.code-tabs').forEach((bar) => {
    const tabs = $$('[role=tab]', bar);
    const sel = (t, focus) => { tabs.forEach((x) => { const on = x === t; x.setAttribute('aria-selected', on); x.tabIndex = on ? 0 : -1; document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); if (focus) t.focus(); };
    tabs.forEach((t, i) => { t.addEventListener('click', () => sel(t)); t.addEventListener('keydown', (e) => { const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (d) { e.preventDefault(); sel(tabs[(i + d + tabs.length) % tabs.length], true); } }); });
  });

  // ---------------------------------------------------------------- the Marketplace, right now
  (async function market() {
    const r1 = $('#rail1'), r2 = $('#rail2'); if (!r1) return;
    const chip = (x) => { const p = x.preview; return `<span class="mchip"${p ? ` style="background:${esc(p.panel)};color:${esc(p.text)};border-color:${esc(p.border)}"` : ''}><i${p ? ` style="background:${esc(p.accent)}"` : ''}></i>${esc(x.name)}</span>`; };
    let list = ['Word Count', 'Colour Swatches', 'Pet Pack', 'Focus Timer', 'JSON Tools', 'Regex Lab', 'Text Tools', 'Git Line', 'Quick Insert', 'HTML Quick'].map((name) => ({ name }));
    const fill = () => { const half = Math.ceil(list.length / 2), a = list.slice(0, half).map(chip).join(''), b = list.slice(half).map(chip).join('') || a; r1.innerHTML = a + a + a + a; r2.innerHTML = b + b + b + b; };
    fill();
    try { const j = await (await fetch('https://raw.githubusercontent.com/Redfire3248/aether-marketplace/main/index.json')).json(); if (j.extensions && j.extensions.length) { list = j.extensions; fill(); } } catch { /* the short list */ }
  })();

  // ---------------------------------------------------------------- the apps' installers: assets/apps.json
  // (written by make-installers when a version is out: version, date, size, installed size, file and SHA-256 of each)
  const MB = (b) => `${(b / 1048576).toFixed(b < 104857600 ? 1 : 0)} MB`;
  const DL = 'https://github.com/Redfire3248/aether-download/releases/download/';
  (async function apps() {
    let all; try { all = await (await fetch('assets/apps.json', { cache: 'no-store' })).json(); } catch { return; }
    const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const ae = all.AetherApp;
    if (ae) { $$('.dl-version').forEach((e) => (e.textContent = 'Version ' + ae.version)); $$('.dl-size').forEach((e) => (e.textContent = ' · ' + MB(ae.size))); $$('[data-f="reldate"]').forEach((e) => (e.textContent = day(ae.date))); }
    $$('[data-app]').forEach((card) => {
      const a = all[card.dataset.app]; if (!a) return;
      const url = DL + a.tag + '/' + a.file;
      const set = (f, v) => card.querySelectorAll(`[data-f="${f}"]`).forEach((e) => (e.textContent = v));
      set('version', a.version); set('date', day(a.date)); set('size', MB(a.size)); set('installed', MB(a.installed)); set('file', a.file); set('sha256', a.sha256);
      const soon = card.querySelector('[data-soon]');
      if (soon) { // its first version is out: the button becomes a download
        const link = document.createElement('a'); link.className = 'btn get-btn magnet'; link.href = url;
        link.innerHTML = `${ic('download')}Download ${esc(a.name)}<small>${MB(a.size)}</small>`; soon.replaceWith(link);
        const badge = card.querySelector('[data-f="badge"]'); if (badge) { badge.textContent = 'New'; badge.classList.remove('soon'); }
      } else card.querySelectorAll('a[data-file]').forEach((l) => (l.href = url));
      const secs = (ms) => (ms < 1000 ? (ms / 1000).toFixed(2) : (ms / 1000).toFixed(1)) + ' s';
      if (a.boot) { set('boot', secs(a.boot.again)); set('bootfirst', secs(a.boot.first)); }
      if (a.features) { const has = card.querySelector('[data-f="has"]'); if (has) has.innerHTML = a.features.map((x) => `<li>${esc(x)}</li>`).join(''); }
    });
    // the start-up times, as bars
    const boot = $('#boot');
    if (boot) {
      const rows = [['AetherApp', 'Aether', 'c-ae', 'assets/logo-64.png'], ['AetherGameMaker', 'Aether Game Maker', 'c-gm', 'assets/game-maker-logo-64.png'], ['AetherLab', 'Aether Lab', 'c-lab', 'assets/lab-logo-64.png']].filter(([k]) => all[k] && all[k].boot);
      const top = Math.max(...rows.map(([k]) => all[k].boot.first));
      const secs = (ms) => (ms < 1000 ? (ms / 1000).toFixed(2) : (ms / 1000).toFixed(1)) + ' s';
      boot.querySelector('.boot-rows').innerHTML = rows.map(([k, name, c, logo]) => { const b = all[k].boot; return `<div class="boot-row ${c}"><div class="boot-name"><img src="${logo}" alt="" width="28" height="28">${esc(name)}</div><div class="boot-bars"><div class="boot-bar again" style="--w:${Math.max(2, b.again / top * 80).toFixed(1)}%"><i></i><b>${secs(b.again)}</b></div><div class="boot-bar first" style="--w:${(b.first / top * 80).toFixed(1)}%"><i></i><b>${secs(b.first)}</b></div></div></div>`; }).join('');
      const how = all._boot; if (how) boot.querySelector('.boot-how').textContent = `Measured on ${day(how.measured)} on an ${how.pc}. ${how.how}`;
    }
    const gm = all.AetherGameMaker; if (gm) $$('a.dl-gm').forEach((l) => (l.href = DL + gm.tag + '/' + gm.file));
    if (ae) $$('a.dl-main').forEach((l) => (l.href = DL + ae.tag + '/' + ae.file));
    const lab = all.AetherLab; if (lab) $$('a.dl-lab').forEach((l) => (l.href = DL + lab.tag + '/' + lab.file));
  })();

  // the GitHub releases, for Aether Script's tools (one request, kept for ten minutes)
  const releases = (async () => {
    const KEY = 'aether-releases';
    try { const c = JSON.parse(sessionStorage.getItem(KEY)); if (c && Date.now() - c.at < 6e5 && c.list.length) return c.list; } catch { /* fetch them */ }
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=30`); if (!r.ok) throw new Error(r.status);
    const list = (await r.json()).filter((x) => !x.draft).map((x) => ({ tag_name: x.tag_name, assets: (x.assets || []).map((a) => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url })) }));
    try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), list })); } catch { /* no cache */ }
    return list;
  })();
  releases.catch(() => {});

  // ---------------------------------------------------------------- Aether Script's tools: the newest ones
  (async function scriptTools() {
    const links = $$('[data-aes]'); if (!links.length) return;
    let rel; try { rel = (await releases).find((x) => /^aether-script/.test(x.tag_name)); } catch { return; }
    if (!rel) return;
    const TEST = { vsix: /\.vsix$/i, exe: /Setup\.exe$/i, js: /^aes\.js$/i, cmd: /^aes\.cmd$/i };
    links.forEach((a) => { const asset = rel.assets.find((x) => TEST[a.dataset.aes].test(x.name)); if (asset) { a.href = asset.browser_download_url; const s = a.querySelector('small'); if (s) s.textContent = asset.size > 1048576 ? (asset.size / 1048576).toFixed(1) + ' MB' : Math.round(asset.size / 1024) + ' KB'; } });
  })();
})();
