// The moving sky behind each page's headline: an aurora drawn by the graphics card, with specks of light that
// drift up and move out of the mouse's way. It only runs while the headline is on screen and the tab is open,
// draws one still frame when the visitor asked for less motion, and leaves the CSS glow in place without WebGL.
(function () {
  'use strict';
  const cv = document.querySelector('.hero-gl');
  if (!cv) return;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power', preserveDrawingBuffer: false });
  if (!gl) return;

  const VS_SKY = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
  const FS_SKY = `precision mediump float;
uniform vec2 res; uniform float t; uniform vec3 c1, c2, c3, bg; uniform vec2 mouse; uniform float light; uniform vec4 rip[4];
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for (int i = 0; i < 5; i++) { v += a * n(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / res; float asp = res.x / res.y; vec2 p = vec2((uv.x - .5) * asp, uv.y - .5);
  // rings from the visitor's clicks: each one pushes the light outwards as it passes
  float ripple = 0.;
  for (int i = 0; i < 4; i++) {
    vec4 r = rip[i];
    if (r.w > 0.) {
      vec2 d = p - vec2((r.x - .5) * asp, r.y - .5); float l = length(d), R = r.z * .75;
      float ring = exp(-pow((l - R) * 11., 2.)) * exp(-r.z * 1.7) * r.w;
      p += d / (l + .001) * ring * .06; ripple += ring;
    }
  }
  float tt = t * .045;
  vec2 q = vec2(fbm(p * 1.4 + vec2(0., tt)), fbm(p * 1.4 + vec2(5.2, -tt * .8)));
  float f = fbm(p * 1.8 + q * 2.2 + vec2(tt * .6, -tt * .3));
  // curtains of light that wave across the top half
  float wave = .3 + .09 * sin(p.x * 2.1 + tt * 3. + f * 4.) + .06 * sin(p.x * 5.3 - tt * 4.);
  float band = exp(-pow((p.y - wave) * 3.4, 2.)) * (.6 + .9 * f);
  float rays = pow(n(vec2(p.x * 14. + f * 3., tt * 2.)), 3.) * smoothstep(-.1, .35, p.y - wave + .2) * band;
  vec3 col = mix(c1, c2, smoothstep(.25, .75, f + p.x * .25));
  col = mix(col, c3, smoothstep(.5, .9, q.x + p.y * .3));
  float glow = band * 1.1 + rays * 1.6 + pow(f, 3.) * .5;
  // a soft light where the mouse is
  vec2 m = vec2((mouse.x - .5) * asp, mouse.y - .5);
  glow += .35 * exp(-length(p - m) * 3.2);
  glow += ripple * .45;
  glow *= smoothstep(-.75, .1, p.y) * (1. - .25 * length(uv - vec2(.5, .6)));
  vec3 outc = light > .5 ? mix(bg, col, clamp(glow * .45, 0., .55)) : bg + col * glow * .5;
  gl_FragColor = vec4(outc, 1.);
}`;
  const VS_DOT = `precision mediump float; attribute vec3 s; uniform float t; uniform vec2 res; uniform vec2 mouse; uniform float px; varying float a; varying float k; uniform vec4 rip[4];
void main(){
  float sp = .25 + s.z * .9;
  vec2 pos = vec2(fract(s.x + sin(t * .05 + s.y * 9.) * .03), fract(s.y + t * .006 * sp));
  vec2 d = (pos - mouse) * vec2(res.x / res.y, 1.); float l = length(d);
  pos += normalize(d + 1e-4) / vec2(res.x / res.y, 1.) * .07 * exp(-l * 9.);
  float boost = 0.;
  for (int i = 0; i < 4; i++) {
    vec4 r = rip[i];
    if (r.w > 0.) {
      vec2 e = (pos - r.xy) * vec2(res.x / res.y, 1.); float m = length(e), R = r.z * .75;
      float ring = exp(-pow((m - R) * 9., 2.)) * exp(-r.z * 1.5) * r.w;
      pos += normalize(e + 1e-4) / vec2(res.x / res.y, 1.) * ring * .05; boost += ring;
    }
  }
  gl_Position = vec4(pos * 2. - 1., 0., 1.);
  gl_PointSize = (1. + s.z * s.z * 3.2) * px * (1. + boost * 1.5);
  a = (.35 + .65 * (.5 + .5 * sin(t * (1. + s.z * 2.) + s.x * 60.))) * smoothstep(0., .25, pos.y) * smoothstep(1., .7, pos.y) * (1. + boost * 2.);
  k = s.z;
}`;
  const FS_DOT = `precision mediump float; varying float a; varying float k; uniform vec3 c2, c3; uniform float light;
void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); float g = smoothstep(.5, 0., r); g *= g;
  vec3 c = mix(c2, c3, k) + (light > .5 ? vec3(0.) : vec3(.35)); gl_FragColor = vec4(c * g * a, g * a); }`;

  const prog = (vs, fs) => {
    const p = gl.createProgram();
    for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
      const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      gl.attachShader(p, s);
    }
    gl.linkProgram(p); return p;
  };
  let sky, dots;
  try { sky = prog(VS_SKY, FS_SKY); dots = prog(VS_DOT, FS_DOT); } catch (e) { console.warn('Aether sky:', e.message); return; }

  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const small = innerWidth < 700, N = small ? 260 : 700;
  const seeds = new Float32Array(N * 3); for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
  const dotBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf); gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);
  const U = (p, n) => gl.getUniformLocation(p, n);
  const su = { res: U(sky, 'res'), t: U(sky, 't'), c1: U(sky, 'c1'), c2: U(sky, 'c2'), c3: U(sky, 'c3'), bg: U(sky, 'bg'), mouse: U(sky, 'mouse'), light: U(sky, 'light'), rip: U(sky, 'rip') };
  const du = { res: U(dots, 'res'), t: U(dots, 't'), mouse: U(dots, 'mouse'), px: U(dots, 'px'), c2: U(dots, 'c2'), c3: U(dots, 'c3'), light: U(dots, 'light'), rip: U(dots, 'rip') };
  const aSky = gl.getAttribLocation(sky, 'p'), aDot = gl.getAttribLocation(dots, 's');

  // the colours come from the page (so each product and each theme gets its own sky)
  let col = {};
  const rgb = (v) => {
    const c = document.createElement('canvas').getContext('2d'); c.fillStyle = '#000'; c.fillStyle = v.trim() || '#000';
    const h = c.fillStyle; if (h[0] === '#') return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
    const m = h.match(/[\d.]+/g) || [0, 0, 0]; return m.slice(0, 3).map((x) => +x / 255);
  };
  const readColours = () => {
    const s = getComputedStyle(document.body);
    col = { c1: rgb(s.getPropertyValue('--a1')), c2: rgb(s.getPropertyValue('--a2')), c3: rgb(s.getPropertyValue('--a3')), bg: rgb(s.getPropertyValue('--bg')), light: document.documentElement.dataset.mode === 'light' ? 1 : 0 };
  };
  readColours();
  addEventListener('aether-theme', () => { readColours(); if (!running) frame(performance.now()); });

  let W = 0, H = 0, dpr = 1;
  const size = () => {
    dpr = Math.min(devicePixelRatio || 1, 2) * (small ? .55 : .65); // the sky is soft, so fewer pixels look the same and cost far less
    const r = cv.getBoundingClientRect(); W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H);
  };
  new ResizeObserver(() => { size(); if (!running) frame(performance.now()); }).observe(cv);

  let mx = .5, my = .62, tx = .5, ty = .62;
  addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); tx = (e.clientX - r.left) / r.width; ty = 1 - (e.clientY - r.top) / r.height; }, { passive: true });

  const rips = [];
  const ripData = new Float32Array(16);
  addEventListener('aether-ripple', (e) => {
    if (still) return;
    const r = cv.getBoundingClientRect(), x = (e.detail.x - r.left) / r.width, y = 1 - (e.detail.y - r.top) / r.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;
    rips.push({ x, y, t: performance.now() }); if (rips.length > 4) rips.shift();
  });
  const fillRips = (now) => {
    for (let i = rips.length - 1; i >= 0; i--) if (now - rips[i].t > 2600) rips.splice(i, 1);
    ripData.fill(0);
    rips.forEach((r, i) => { ripData.set([r.x, r.y, (now - r.t) / 1000, 1], i * 4); });
  };

  const t0 = performance.now() - 20000 * Math.random();
  function frame(now) {
    const t = still ? 12 : (now - t0) / 1000;
    mx += (tx - mx) * .05; my += (ty - my) * .05;
    fillRips(now);
    gl.disable(gl.BLEND);
    gl.useProgram(sky);
    gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(aSky); gl.vertexAttribPointer(aSky, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(su.res, W, H); gl.uniform1f(su.t, t); gl.uniform2f(su.mouse, mx, my); gl.uniform1f(su.light, col.light);
    gl.uniform3fv(su.c1, col.c1); gl.uniform3fv(su.c2, col.c2); gl.uniform3fv(su.c3, col.c3); gl.uniform3fv(su.bg, col.bg); gl.uniform4fv(su.rip, ripData);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.disableVertexAttribArray(aSky);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, col.light ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.useProgram(dots);
    gl.bindBuffer(gl.ARRAY_BUFFER, dotBuf); gl.enableVertexAttribArray(aDot); gl.vertexAttribPointer(aDot, 3, gl.FLOAT, false, 0, 0);
    gl.uniform2f(du.res, W, H); gl.uniform1f(du.t, t); gl.uniform2f(du.mouse, mx, my); gl.uniform1f(du.px, dpr * 1.6); gl.uniform1f(du.light, col.light);
    gl.uniform3fv(du.c2, col.c2); gl.uniform3fv(du.c3, col.c3); gl.uniform4fv(du.rip, ripData);
    gl.drawArrays(gl.POINTS, 0, N);
    gl.disableVertexAttribArray(aDot);
  }

  let running = false, onScreen = true;
  const loop = (now) => { if (!running) return; frame(now); requestAnimationFrame(loop); };
  const update = () => {
    const go = onScreen && !document.hidden && !still;
    if (go && !running) { running = true; requestAnimationFrame(loop); } else if (!go) running = false;
  };
  new IntersectionObserver((e) => { onScreen = e[0].isIntersecting; update(); }).observe(cv);
  document.addEventListener('visibilitychange', update);
  size(); frame(performance.now()); update();
  document.documentElement.classList.add('gl-on');
})();
