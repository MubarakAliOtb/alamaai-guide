/* محرّك مقاطع نموذج 2
   مشاهد مسطّحة بحدّ داكن وظل صلب إلى أسفل اليسار، تُرسم لحظةً لحظة بالدالة render(t)
   فتُصوَّر إطارًا إطارًا (30 إطارًا في الثانية، 8 ثوانٍ، 1200×900). المقطع يتلاشى في آخره
   ليعود إلى الخلفية الفارغة فيتكرر بلا قفزة. */
const NS = 'http://www.w3.org/2000/svg', INK = '#1A1A2E', DUR = 8, FO = 7.35;
const C = { blue: '#4D7CFE', mint: '#2EC4A0', yel: '#FFC93C', coral: '#FF7A5C', lav: '#B9A6FF', sky: '#5CC8FF', pink: '#FF8FCF',
  cream: '#FFF6E5', white: '#FFFFFF', bink: '#2D4FCB', soft: '#FFE9B0', water: '#BDE9FF', mute: '#4A4A5E' };
const S = document.getElementById('S');
let R = S, ITEMS = [], HOOKS = [];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, d) => clamp((t - a) / d, 0, 1);
const E = {
  out: p => 1 - Math.pow(1 - p, 3),
  in: p => p * p,
  inout: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
  back: p => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
  bounce: p => { const n = 7.5625, d = 2.75; if (p < 1 / d) return n * p * p; if (p < 2 / d) return n * (p -= 1.5 / d) * p + .75;
    if (p < 2.5 / d) return n * (p -= 2.25 / d) * p + .9375; return n * (p -= 2.625 / d) * p + .984375; }
};

function el(tag, a, p) { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); (p || R).appendChild(e); return e; }
function G(p, a) { return el('g', a || {}, p); }
function hook(fn) { HOOKS.push(fn); }

/* يسجّل حركة دخول لعنصر: pop تكبير بارتداد، popb تكبير من القاعدة، grow نمو رأسي من القاعدة،
   drop سقوط بارتداد، up صعود مع ظهور، slide انزلاق أفقي، fade ظهور، draw رسم الخط */
function add(node, at, dur, anim, o) {
  const it = Object.assign({ node, at, dur: dur || .55, anim: anim || 'pop' }, o || {});
  node.style.transformBox = 'fill-box';
  node.style.transformOrigin = it.origin || (it.anim === 'grow' || it.anim === 'popb' ? 'center bottom' : 'center');
  if (it.anim === 'draw') { const L = node.getTotalLength(); node.style.strokeDasharray = L + ' ' + (L + 2); node._L = L; }
  ITEMS.push(it); return node;
}

function txt(x, y, s, size, o) {
  o = o || {}; const lines = String(s).split('\n'), lh = size * (o.lh || 1.16); const g = G(o.parent);
  lines.forEach((ln, i) => { const t = el('text', { x, y: y + (i - (lines.length - 1) / 2) * lh + size * (o.dy == null ? .06 : o.dy), 'font-size': size,
    'text-anchor': o.anchor || 'middle', 'font-weight': o.w || 900, fill: o.fill || INK }, g); if (o.dir) t.style.direction = o.dir; t.textContent = ln; });
  return g;
}
/* عرض النص بعد تحميل الخط */
function tw(s, size, w) { let m = 0; String(s).split('\n').forEach(ln => { const t = el('text', { x: -2000, y: -2000, 'font-size': size, 'font-weight': w || 900 }, S); t.textContent = ln; m = Math.max(m, t.getComputedTextLength()); t.remove(); }); return m; }

function rrect(p, x, y, w, h, r, fill, sw, extra) { return el('rect', Object.assign({ x, y, width: w, height: h, rx: r, fill, stroke: INK, 'stroke-width': sw == null ? 6 : sw }, extra || {}), p); }
/* صندوق منحنٍ بظل صلب */
function box(o) {
  const g = G(o.parent); const r = o.r == null ? 24 : o.r, sh = o.sh == null ? 12 : o.sh;
  if (sh) el('rect', { x: o.x - sh, y: o.y + sh, width: o.w, height: o.h, rx: r, fill: INK }, g);
  g.main = rrect(g, o.x, o.y, o.w, o.h, r, o.fill || C.white, o.sw, o.dash ? { 'stroke-dasharray': o.dash } : null);
  if (o.label != null) txt(o.x + o.w / 2, o.y + o.h / 2 + (o.ty || 0), o.label, o.size || 40, { parent: g, fill: o.tf, w: o.w8 });
  if (o.at != null) add(g, o.at, o.dur, o.anim || 'pop', o.opt);
  return g;
}
function disc(o) {
  const g = G(o.parent), sh = o.sh == null ? 9 : o.sh;
  if (sh) el('circle', { cx: o.cx - sh, cy: o.cy + sh, r: o.r, fill: INK }, g);
  g.main = el('circle', { cx: o.cx, cy: o.cy, r: o.r, fill: o.fill || C.white, stroke: INK, 'stroke-width': o.sw || 6 }, g);
  if (o.label != null) txt(o.cx, o.cy + (o.ty || 0), o.label, o.size || 40, { parent: g, fill: o.tf });
  if (o.icon) icon(g, o.icon, o.cx, o.cy, o.isz || o.r * 1.15, o.ic);
  if (o.at != null) add(g, o.at, o.dur, o.anim || 'pop', o.opt);
  return g;
}
/* شارة: نص مع أيقونة اختيارية في جهة البداية (اليمين) */
function chip(x, y, label, o) {
  o = o || {}; const size = o.size || 40, h = o.h || Math.round(size * 2.2), pad = o.pad || size * .9, ic = o.icon ? h * .78 : 0;
  const w = Math.max(o.minW || 0, tw(label, size, o.w8) + pad * 2 + (ic ? ic + size * .2 : 0));
  const g = G(o.parent), sh = o.sh == null ? 10 : o.sh, X = x - w / 2, Y = y - h / 2;
  if (sh) el('rect', { x: X - sh, y: Y + sh, width: w, height: h, rx: o.r == null ? h / 2 : o.r, fill: INK }, g);
  g.main = rrect(g, X, Y, w, h, o.r == null ? h / 2 : o.r, o.fill || C.white, o.sw);
  let tx = x;
  if (ic) { const icx = X + w - h / 2 - (o.r === 0 ? 4 : 0); el('circle', { cx: icx, cy: y, r: ic / 2, fill: C.white, stroke: INK, 'stroke-width': 5 }, g);
    icon(g, o.icon, icx, y, ic * .78, o.ic); tx = X + (w - h) / 2 + pad * .25; }
  txt(tx, y, label, size, { parent: g, fill: o.tf, w: o.w8 });
  g.w = w; g.h = h; g.x0 = X; g.x1 = X + w; g.y0 = Y; g.y1 = Y + h;
  if (o.at != null) add(g, o.at, o.dur, o.anim || 'pop', o.opt);
  return g;
}
function path(d, o) {
  o = o || {}; const p = el('path', { d, fill: o.fill || 'none', stroke: o.stroke || INK, 'stroke-width': o.sw || 7, 'stroke-linecap': o.cap || 'round', 'stroke-linejoin': 'round' }, o.parent);
  if (o.dash) p.setAttribute('stroke-dasharray', o.dash);
  if (o.at != null) add(p, o.at, o.dur || .6, o.anim || 'draw', o.opt);
  return p;
}
/* سهم شيفرون يشير إلى اليسار، والأول مسطّح الطرف الأيمن */
function chev(x, y, w, h, fill, label, size, at, first, parent) {
  const t = h / 2.6, d = first ? `M${x + w} ${y}H${x + t}L${x} ${y + h / 2}L${x + t} ${y + h}H${x + w}Z`
    : `M${x + w} ${y}L${x + w - t} ${y + h / 2}L${x + w} ${y + h}H${x + t}L${x} ${y + h / 2}L${x + t} ${y}Z`;
  const g = G(parent); el('path', { d, fill: INK, transform: 'translate(-11,11)' }, g);
  g.main = el('path', { d, fill, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
  txt(x + w / 2 + (first ? t / 3 : -t / 6), y + h / 2, label, size || 40, { parent: g });
  g.cx = x + w / 2 + (first ? t / 3 : -t / 6);
  if (at != null) add(g, at, .55, 'pop');
  return g;
}
function sparkle(x, y, s, fill, at, parent) {
  const k = s * .2, d = `M${x} ${y - s}C${x + k} ${y - k} ${x + k} ${y - k} ${x + s} ${y}C${x + k} ${y + k} ${x + k} ${y + k} ${x} ${y + s}C${x - k} ${y + k} ${x - k} ${y + k} ${x - s} ${y}C${x - k} ${y - k} ${x - k} ${y - k} ${x} ${y - s}Z`;
  const g = G(parent); el('path', { d, fill, stroke: INK, 'stroke-width': Math.max(4, s * .16), 'stroke-linejoin': 'round' }, g);
  if (at != null) add(g, at, .5, 'pop', { bob: 5, per: 2.6 });
  return g;
}
function plus(x, y, s, at) { const g = G(); el('path', { d: `M${x - s} ${y}h${2 * s}M${x} ${y - s}v${2 * s}`, stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, g); if (at != null) add(g, at, .4, 'pop'); return g; }
function dot(x, y, r, fill, at) { return disc({ cx: x, cy: y, r, fill, sh: 0, sw: 5, at }); }
/* زخرفة الزوايا */
function deco(spots) {
  (spots || [[1112, 92, 's', C.white], [88, 92, 'd', C.pink], [1112, 808, 'p'], [88, 808, 's', C.yel]]).forEach(([x, y, k, f], i) => {
    const at = .15 + i * .1;
    if (k === 's') sparkle(x, y, 24, f, at); else if (k === 'd') dot(x, y, 13, f, at); else plus(x, y, 15, at);
  });
}
/* شريط التعليق السفلي */
function caption(parts, at, o) {
  o = o || {}; const size = o.size || 38, y = o.y || 818; if (typeof parts === 'string') parts = [[parts, INK]];
  const full = parts.map(p => p[0]).join(''), w = tw(full, size, 800) + size * 1.6, h = size * 1.9;
  const g = G(); el('rect', { x: 600 - w / 2 - 8, y: y - h / 2 + 8, width: w, height: h, rx: h / 2, fill: INK }, g);
  rrect(g, 600 - w / 2, y - h / 2, w, h, h / 2, o.fill || C.white, 5);
  const t = el('text', { x: 600, y: y + size * .06, 'font-size': size, 'text-anchor': 'middle', 'font-weight': 800, fill: INK }, g);
  parts.forEach(([s, f]) => { const sp = el('tspan', { fill: f || INK }, t); sp.textContent = s; });
  add(g, at, .6, 'up'); return g;
}
/* نقاط تسري على مسار: rev تعكس الاتجاه */
function travel(p, o) {
  const L = p.getTotalLength(), n = o.n || 1, dots = [];
  for (let k = 0; k < n; k++) dots.push(el('circle', { r: o.r || 13, fill: o.fill || C.white, stroke: INK, 'stroke-width': o.sw || 5, opacity: 0 }, o.parent));
  hook(t => dots.forEach((d, k) => {
    if (t < o.start || (o.until && t > o.until)) { d.setAttribute('opacity', 0); return; }
    let q = ((t - o.start) / o.period + k / n + (o.ph || 0)) % 1; if (o.rev) q = 1 - q;
    const pt = p.getPointAtLength(q * L); d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y);
    const e = o.rev ? 1 - q : q; d.setAttribute('opacity', Math.min(1, e / .08, (1 - e) / .08));
  }));
}
/* نبضة تكبير دورية حول مركز */
function pulse(g, cx, cy, start, period, amp, delay) {
  hook(t => { let s = 1; if (t >= start) { const dt = (t - start - (delay || 0) + period * 10) % period; s = 1 + (amp || .07) * Math.max(0, 1 - dt / .32) * (t >= start + (delay || 0) ? 1 : 0); }
    g.setAttribute('transform', `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`); });
}
/* تموّج دائري يخرج من مركز */
function ripple(cx, cy, r0, r1, start, period, color, parent) {
  const c = el('circle', { cx, cy, r: r0, fill: 'none', stroke: color || C.yel, 'stroke-width': 12, opacity: 0 }, parent);
  hook(t => { if (t < start) { c.setAttribute('opacity', 0); return; } const q = ((t - start) % period) / period;
    c.setAttribute('r', r0 + (r1 - r0) * E.out(q)); c.setAttribute('opacity', (1 - q) * .85); });
  return c;
}
function arcPt(cx, cy, r, a) { const t = a * Math.PI / 180; return [cx + r * Math.sin(t), cy - r * Math.cos(t)]; }
function arcPath(cx, cy, ro, ri, a0, a1) {
  const L = a1 - a0 > 180 ? 1 : 0, [x0, y0] = arcPt(cx, cy, ro, a0), [x1, y1] = arcPt(cx, cy, ro, a1), [x2, y2] = arcPt(cx, cy, ri, a1), [x3, y3] = arcPt(cx, cy, ri, a0);
  return `M${x0} ${y0}A${ro} ${ro} 0 ${L} 1 ${x1} ${y1}L${x2} ${y2}A${ri} ${ri} 0 ${L} 0 ${x3} ${y3}Z`;
}
/* منحنى ناعم يمر بالنقاط */
function spline(P) {
  let d = `M${P[0][0]} ${P[0][1]}`;
  for (let i = 0; i < P.length - 1; i++) { const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
    d += `C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`; }
  return d;
}
function lenAt(p, x, y) { const L = p.getTotalLength(); let best = 0, bd = 1e9; for (let s = 0; s <= L; s += 2) { const q = p.getPointAtLength(s), d = (q.x - x) ** 2 + (q.y - y) ** 2; if (d < bd) { bd = d; best = s; } } return best; }

/* أيقونات مسطّحة في مربع 100×100 حول المركز */
const IC = {
  bolt: g => el('path', { d: 'M12 -46L-26 6H2L-12 46L28 -8H0Z', fill: C.yel }, g),
  heart: g => el('path', { d: 'M0 38C-58 2 -46 -44 0 -16C46 -44 58 2 0 38Z', fill: C.coral }, g),
  link: g => { el('rect', { x: -46, y: -18, width: 56, height: 36, rx: 18, fill: 'none' }, g); el('rect', { x: -10, y: -18, width: 56, height: 36, rx: 18, fill: 'none' }, g); },
  bulb: g => { el('path', { d: 'M-16 22C-16 8 -32 2 -32 -16A32 32 0 1 1 32 -16C32 2 16 8 16 22Z', fill: C.yel }, g); el('rect', { x: -14, y: 26, width: 28, height: 16, rx: 6, fill: C.white }, g); },
  lines: g => { el('rect', { x: -40, y: -34, width: 80, height: 68, rx: 12, fill: C.white }, g); ['M28 -14H-24', 'M28 2H-24', 'M28 18H-4'].forEach(d => el('path', { d, fill: 'none' }, g)); },
  image: g => { el('rect', { x: -42, y: -32, width: 84, height: 64, rx: 12, fill: C.white }, g); el('path', { d: 'M-42 22L-14 -6L6 14L18 4L42 26', fill: 'none' }, g); el('circle', { cx: 18, cy: -14, r: 8, fill: C.yel }, g); },
  sound: g => { el('path', { d: 'M-40 -14H-22L0 -32V32L-22 14H-40Z', fill: C.white }, g); el('path', { d: 'M14 -16Q26 0 14 16M24 -30Q46 0 24 30', fill: 'none' }, g); },
  eye: g => { el('path', { d: 'M-46 0Q0 -44 46 0Q0 44 -46 0Z', fill: C.white }, g); el('circle', { cx: 0, cy: 0, r: 16, fill: C.blue }, g); el('circle', { cx: 0, cy: 0, r: 6, fill: INK, stroke: 'none' }, g); },
  target: g => { el('circle', { r: 42, fill: C.white }, g); el('circle', { r: 27, fill: C.coral }, g); el('circle', { r: 11, fill: C.white }, g); },
  cube: g => { el('path', { d: 'M0 -40L36 -20V20L0 40L-36 20V-20Z', fill: C.lav }, g); el('path', { d: 'M-36 -20L0 0L36 -20M0 0V40', fill: 'none' }, g); },
  flask: g => { el('path', { d: 'M-12 -40H12M-8 -40V-12L-34 32Q-36 40 -26 40H26Q36 40 34 32L8 -12V-40', fill: C.white }, g); el('path', { d: 'M-24 18H24L32 34Q32 38 26 38H-26Q-32 38 -32 34Z', fill: C.mint }, g); },
  check: g => { el('circle', { r: 40, fill: C.mint }, g); el('path', { d: 'M-18 0L-4 14L20 -12', fill: 'none' }, g); },
  question: g => { el('path', { d: 'M-16 -14Q-16 -38 4 -38Q22 -38 22 -20Q22 -8 4 2V14', fill: 'none' }, g); el('circle', { cx: 4, cy: 32, r: 5, fill: INK, stroke: 'none' }, g); },
  list: g => { el('rect', { x: -34, y: -40, width: 68, height: 80, rx: 10, fill: C.white }, g); el('rect', { x: -14, y: -48, width: 28, height: 16, rx: 6, fill: C.yel }, g); ['M22 -12H-8', 'M22 6H-8', 'M22 24H-8'].forEach(d => el('path', { d, fill: 'none' }, g)); [-12, 6, 24].forEach(y => el('circle', { cx: -20, cy: y, r: 4, fill: INK, stroke: 'none' }, g)); },
  search: g => { el('circle', { cx: -8, cy: -8, r: 26, fill: C.white }, g); el('path', { d: 'M12 12L38 38', fill: 'none', 'stroke-width': 12 }, g); },
  chat: g => { el('path', { d: 'M-40 -30H40V18H-6L-26 36V18H-40Z', fill: C.white }, g); [-18, 0, 18].forEach(x => el('circle', { cx: x, cy: -6, r: 5, fill: INK, stroke: 'none' }, g)); },
  loop: g => { el('path', { d: 'M30 -10A32 32 0 1 0 22 22', fill: 'none' }, g); el('path', { d: 'M18 -26L32 -8L44 -26', fill: 'none' }, g); },
  star: g => el('path', { d: 'M0 -44L13 -14L44 -12L20 8L28 40L0 22L-28 40L-20 8L-44 -12L-13 -14Z', fill: C.yel }, g)
};
function icon(p, name, cx, cy, size, o) {
  const s = size / 100, g = G(p, { transform: `translate(${cx} ${cy}) scale(${s})`, stroke: INK, 'stroke-width': (o && o.sw) || 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  IC[name](g); return g;
}

function bg() {
  el('rect', { x: 0, y: 0, width: 1200, height: 900, fill: C.cream }, S);
  const g = G(S, { opacity: .1 }); for (let y = 30; y < 900; y += 40) for (let x = 30; x < 1200; x += 40) el('circle', { cx: x, cy: y, r: 2.4, fill: INK }, g);
}

function render(t) {
  for (const it of ITEMS) {
    const n = it.node, p = prog(t, it.at, it.dur);
    if (it.anim === 'draw') { n.style.strokeDashoffset = n._L * (1 - E.out(p)); n.style.opacity = p > 0 ? 1 : 0; continue; }
    let s = 1, sx = 1, sy = 1, tx = 0, ty = 0, op = 1, rot = 0;
    switch (it.anim) {
      case 'pop': case 'popb': s = p <= 0 ? 0 : E.back(p); op = p <= 0 ? 0 : 1; break;
      case 'up': ty = 46 * (1 - E.out(p)); op = E.out(p); break;
      case 'down': ty = -46 * (1 - E.out(p)); op = E.out(p); break;
      case 'drop': ty = -(it.dy || 620) * (1 - E.bounce(p)); op = p <= 0 ? 0 : 1; break;
      case 'grow': sy = p <= 0 ? 0 : E.back(p); op = p <= 0 ? 0 : 1; break;
      case 'slide': tx = (it.dx || 120) * (1 - E.out(p)); op = E.out(p); break;
      case 'fade': op = p; break;
      case 'spin': s = p <= 0 ? 0 : E.back(p); rot = -120 * (1 - E.out(p)); op = p <= 0 ? 0 : 1; break;
    }
    if (it.bob && p >= 1) ty += it.bob * Math.sin(2 * Math.PI * (t - it.at - it.dur) / (it.per || 2.4) + (it.ph || 0));
    n.style.opacity = op;
    n.style.transform = `translate(${tx}px,${ty}px) rotate(${rot}deg) scale(${s * sx},${s * sy})`;
  }
  for (const f of HOOKS) f(t);
  R.style.opacity = t > FO ? Math.max(0, 1 - (t - FO) / (DUR - FO - .05)) : 1;
}
window.render = render; window.SCENES = {};
