(function () {
  'use strict';
  document.documentElement.classList.add('js');
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const REPO = 'Redfire3248/aether-download';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // the sky: slow drifting stars that lean away from the mouse
  (function sky() {
    const c = $('#sky'), g = c.getContext('2d');
    let W = 0, H = 0, stars = [], mx = 0, my = 0, tx = 0, ty = 0;
    const size = () => {
      const d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
      c.width = W * d; c.height = H * d; g.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.round(W * H / 11000) }, () => ({ x: Math.random() * W, y: Math.random() * H, z: .2 + Math.random() * .8, c: ['#ffffff', '#7c5cff', '#3ff3c8', '#ff5fa2'][Math.random() < .7 ? 0 : 1 + Math.floor(Math.random() * 3)] }));
    };
    const draw = (t) => {
      g.clearRect(0, 0, W, H);
      mx += (tx - mx) * .04; my += (ty - my) * .04;
      for (const s of stars) {
        const x = ((s.x + t * .004 * s.z + mx * s.z * 18) % W + W) % W, y = ((s.y + my * s.z * 18) % H + H) % H;
        g.globalAlpha = (.25 + .55 * s.z) * (.75 + .25 * Math.sin(t * .001 + s.x));
        g.fillStyle = s.c; const r = Math.round(s.z * 2) || 1; g.fillRect(Math.round(x), Math.round(y), r, r);
      }
      if (!still && !document.hidden) requestAnimationFrame(draw);
    };
    addEventListener('resize', size); size();
    addEventListener('pointermove', (e) => { tx = e.clientX / W - .5; ty = e.clientY / H - .5; }, { passive: true });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && !still) requestAnimationFrame(draw); });
    draw(0);
  })();

  // the window leans towards the mouse
  (function tilt() {
    const st = $('#stage'), w = $('#window');
    if (still || !st || !matchMedia('(hover: hover)').matches) return;
    st.addEventListener('pointermove', (e) => { const r = st.getBoundingClientRect(); w.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 8 + 'deg'); w.style.setProperty('--rx', (.5 - (e.clientY - r.top) / r.height) * 6 + 2 + 'deg'); });
    st.addEventListener('pointerleave', () => { w.style.removeProperty('--ry'); w.style.removeProperty('--rx'); });
  })();

  // the tour of the app
  (function tour() {
    const STOPS = [
      ['Code', 'code', 'Write in any language', 'Colours, suggestions and a terminal, with your language understood. Press one key and your program runs.', 'Aether showing an Aether Script program in the code editor'],
      ['Game Engine', 'engine', 'Make a real game', 'Paint levels, add behaviours, and play it right there. Then export to Windows, Android or the web.', 'The game engine with a lava cave level open'],
      ['App Maker', 'apps', 'Make a phone app', 'Put a screen together from parts, write what they do, and try it on the phone. One click makes the .apk or .exe.', 'The App Maker running a quiz app on a phone preview'],
      ['Arduino', 'arduino', 'Circuits with no board', 'Wire up parts on a breadboard, write the sketch and watch it run in the simulator.', 'The Arduino tool simulating an LED circuit beside its code'],
      ['PDF', 'pdf', 'Change any PDF', 'Click a line and type over it, in the same font and colour. Scanned pages work too.', 'The PDF editor with every line of a document ready to edit'],
      ['Marketplace', 'market', 'Add what you like', 'Single themes, tools and more pets, each one click away.', 'The Aether Marketplace inside Aether']
    ];
    const tabs = $('.tabs'), img = $('#tour-img'), title = $('#tour-title'), text = $('#tour-text'), box = $('.tour');
    const TIME = 6000; let at = 0, timer = 0, paused = false, seen = false;
    box.style.setProperty('--tour-time', TIME + 'ms');
    STOPS.forEach(([n, f]) => { new Image().src = `img/${f}.webp`; });
    const btns = STOPS.map(([name], i) => { const b = document.createElement('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.innerHTML = '<i></i>'; b.prepend(name); b.onclick = () => { paused = true; box.classList.add('paused'); clearTimeout(timer); show(i); }; tabs.appendChild(b); return b; });
    function show(i) {
      at = i; const s = STOPS[i];
      btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
      img.classList.add('out');
      setTimeout(() => { img.src = `img/${s[1]}.webp`; img.alt = s[4]; img.classList.remove('out'); title.textContent = s[2]; text.textContent = s[3]; }, still ? 0 : 220);
      clearTimeout(timer);
      if (!paused && !still && seen) timer = setTimeout(() => show((at + 1) % STOPS.length), TIME);
    }
    tabs.addEventListener('keydown', (e) => { const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0; if (!d) return; e.preventDefault(); const n = (at + d + STOPS.length) % STOPS.length; btns[n].focus(); btns[n].click(); });
    show(0);
    new IntersectionObserver((es) => { const v = es[0].isIntersecting; if (v && !seen) { seen = true; show(0); } if (!v) { clearTimeout(timer); timer = 0; } else if (!paused && !timer) show(at); }, { threshold: .3 }).observe(box);
  })();

  // things appear as you reach them, and numbers count up
  (function reveal() {
    const count = (b) => { const to = +b.dataset.count; if (!to || still) return; const t0 = performance.now(); const go = (t) => { const k = Math.min(1, (t - t0) / 1100); b.textContent = Math.round(to * (1 - (1 - k) ** 3)); if (k < 1) requestAnimationFrame(go); }; requestAnimationFrame(go); };
    const io = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); $$('[data-count]', e.target).forEach(count); io.unobserve(e.target); } }, { threshold: .15 });
    $$('.reveal').forEach((el) => io.observe(el));
  })();

  // the top button downloads, and shows the steps for what comes next
  $$('.dl-link').forEach((a) => a.addEventListener('click', () => $('#get').scrollIntoView()));

  // a soft light follows the mouse over the cards
  $$('.card').forEach((c) => c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));

  // the Marketplace: what is in it right now
  (async function market() {
    const track = $('#track');
    const chip = (x) => `<span class="chip">${x.colors && x.colors.length ? `<i>${x.colors.slice(0, 4).map((c) => `<b style="background:${/^#[0-9a-f]{6}$/i.test(c) ? c : '#333'}"></b>`).join('')}</i>` : ''}${String(x.name).replace(/[<>&]/g, '')}</span>`;
    let list = ['Word Count', 'Colour Swatches', 'Pet Pack', 'Focus Timer', 'JSON Tools', 'Regex Lab', 'Text Tools', 'Git Line'].map((name) => ({ name }));
    try {
      const j = await (await fetch('https://raw.githubusercontent.com/Redfire3248/aether-marketplace/main/index.json')).json();
      if (j.extensions && j.extensions.length) { list = j.extensions; for (const b of $$('.market-count')) { b.textContent = list.length; b.dataset.count = list.length; } }
    } catch { /* the short list above */ }
    const html = list.map(chip).join(''); track.innerHTML = html + html;
  })();

  // the newest version: its number and size
  (async function version() {
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`); if (!r.ok) return;
      const j = await r.json();
      const v = String(j.tag_name || '').replace(/^v/, ''), a = (j.assets || []).find((x) => /\.exe$/i.test(x.name));
      if (v) $$('.dl-version').forEach((e) => (e.textContent = 'Version ' + v));
      if (a) $$('.dl-size').forEach((e) => (e.textContent = ` · ${Math.round(a.size / 1048576)} MB`));
    } catch { /* the words already there */ }
  })();
})();
