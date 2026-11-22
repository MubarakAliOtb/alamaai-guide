/* مشاهد المقاطع التسعة عشر بنموذج 2. كل مشهد يبني عناصره ويحدد لحظة دخول كل منها،
   والمحتوى مطابق لما يصفه الدليل لكل مقطع (FD_CLIP وFD_DG في index.html). */
function mix(a, b, p) { const h = s => [1, 3, 5].map(i => parseInt(s.slice(i, i + 2), 16)), A = h(a), B = h(b);
  return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * p).toString(16).padStart(2, '0')).join(''); }
function setT(g, s) { g.setAttribute('transform', s); }
/* كرة تقفز بين نقاط في أوقات محددة: P نقاط، T0 بداية أول قفزة، hop مدة القفزة، H ارتفاعها */
function hopper(P, T0, hop, H, o) {
  o = o || {}; const g = G(), r = o.r || 24;
  el('circle', { cx: -6, cy: 6, r, fill: INK }, g); el('circle', { r, fill: o.fill || C.sky, stroke: INK, 'stroke-width': 6 }, g); el('circle', { cx: -r * .32, cy: -r * .32, r: r * .27, fill: C.white }, g);
  const appear = o.appear == null ? T0 - .35 : o.appear, pause = o.pause || 0;
  hook(t => {
    if (t < appear) { g.setAttribute('opacity', 0); return; } g.setAttribute('opacity', 1);
    let x, y, s = 1;
    if (t < T0) { [x, y] = P[0]; s = E.back(prog(t, appear, .3)); }
    else { const seg = hop + pause, k = Math.floor((t - T0) / seg);
      if (k >= P.length - 1) [x, y] = P[P.length - 1];
      else { const p = clamp((t - T0 - k * seg) / hop, 0, 1), [x0, y0] = P[k], [x1, y1] = P[k + 1];
        x = lerp(x0, x1, E.inout(p)); y = lerp(y0, y1, p) - 4 * H * p * (1 - p); } }
    setT(g, `translate(${x} ${y}) scale(${s})`);
  });
  return g;
}

/* 1 الدماغ: مركز التعلّم وأبعاده الأربعة */
SCENES.brain = () => {
  const cx = 600, cy = 400, N = [['الجسد', 600, 132, C.mint, 'bolt'], ['العلاقة', 948, 400, C.blue, 'link'], ['المعنى', 600, 668, C.lav, 'bulb'], ['الانفعال', 252, 400, C.coral, 'heart']];
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 704, 'p'], [90, 704, 's', C.yel]]);
  const LG = G();
  const P = N.map(([, x, y], i) => path(`M${cx} ${cy}L${x} ${y}`, { sw: 8, at: .8 + i * .12, dur: .45, parent: LG }));
  ripple(cx, cy, 138, 250, 3.3, 1.3, C.yel, LG);
  const core = G(); disc({ cx, cy, r: 138, fill: C.yel, label: 'التعلّم', size: 66, at: .3, dur: .6, sh: 14, parent: core });
  pulse(core, cx, cy, 2.0, 1.3, .07, 1.3);
  N.forEach(([l, x, y, f, ic], i) => chip(x, y, l, { fill: f, icon: ic, size: 46, h: 104, at: 1.15 + i * .14, minW: 270 }));
  P.forEach(p => travel(p, { start: 2.0, period: 1.3, rev: true, r: 14, parent: LG }));
  caption('التعلّم فعل الدماغ كله', 2.4);
};

/* 2 العبء: كأس الذاكرة العاملة تمتلئ بأربع وحدات ثم يفيض العبء الدخيل */
SCENES.load = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 808, 'p'], [90, 808, 's', C.yel]]);
  path('M70 742H1130', { sw: 6, at: .1, dur: .6 });
  box({ x: 425, y: 690, w: 350, h: 34, r: 17, fill: C.yel, sh: 8, at: .2, dur: .5 });
  const gl = 'M430 262L770 262L722 690L478 690Z';
  add(el('path', { d: gl, fill: C.water }), .25, .5, 'fade');
  [[C.mint, 'وحدة 1'], [C.blue, 'وحدة 2'], [C.yel, 'وحدة 3'], [C.lav, 'وحدة 4']].forEach(([f, l], i) =>
    box({ x: 500, y: 585 - i * 103, w: 200, h: 95, r: 18, fill: f, label: l, size: 38, sh: 0, at: .7 + i * .55, dur: .8, anim: 'drop', opt: { dy: 660 } }));
  const fr = G(); el('path', { d: gl, fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' }, fr);
  el('path', { d: 'M736 304L708 640', fill: 'none', stroke: C.white, 'stroke-width': 10, 'stroke-linecap': 'round' }, fr);
  rrect(fr, 416, 250, 368, 22, 11, C.white, 6); add(fr, .25, .5, 'fade');
  const L1 = G(); txt(985, 372, 'الذاكرة العاملة', 46, { parent: L1 }); txt(985, 434, 'نحو 4 وحدات', 38, { parent: L1, fill: C.bink, w: 800 }); add(L1, 2.9, .6, 'slide', { dx: 60 });
  chip(205, 360, 'عبء دخيل', { fill: C.coral, size: 44, h: 96, at: 4.3 });
  const L2 = G(); txt(205, 446, 'يفيض عن الكأس', 34, { parent: L2, w: 800 }); add(L2, 4.45, .5, 'up');
  [[3.2, 560, 330], [3.75, 590, 255], [4.3, 620, 180]].forEach(([t0, x0, xl]) => {
    const r = 30, g = G(); el('circle', { cx: -7, cy: 7, r, fill: INK }, g); el('circle', { r, fill: C.coral, stroke: INK, 'stroke-width': 6 }, g); const hl = el('circle', { r: 7, fill: C.white }, g);
    const yT = 276 - r, yF = 742 - r - 3;
    hook(t => { const u = t - t0; let x = x0, y = -80;
      if (u < 0) { g.setAttribute('opacity', 0); return; } g.setAttribute('opacity', 1);
      if (u < .42) y = lerp(-80, yT, E.in(u / .42));
      else if (u < .5) y = yT;
      else if (u < .82) { x = lerp(x0, 405, E.in((u - .5) / .32)); y = yT; }
      else if (u < 1.3) { const p = (u - .82) / .48; x = lerp(405, xl + 36, p); y = lerp(yT, yF, E.in(p)); }
      else if (u < 1.62) { const p = (u - 1.3) / .32; x = lerp(xl + 36, xl + 8, p); y = yF - 50 * 4 * p * (1 - p); }
      else if (u < 1.8) { const p = (u - 1.62) / .18; x = lerp(xl + 8, xl, p); y = yF - 12 * 4 * p * (1 - p); }
      else { x = xl; y = yF; }
      const a = 5 * Math.PI / 4 + (x - x0) / r; hl.setAttribute('cx', 11 * Math.cos(a)); hl.setAttribute('cy', 11 * Math.sin(a));
      setT(g, `translate(${x} ${y})`); });
  });
};

/* 3 الترميز الثنائي: نظام لفظي ونظام صوري يلتقيان في طريقين للاستدعاء */
SCENES.dual = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 704, 'p'], [90, 704, 's', C.yel]]);
  const LG = G(), tx = 300, ty = 400;
  const A = chip(915, 230, 'نظام لفظي', { fill: C.blue, icon: 'lines', size: 46, h: 112, at: .35, minW: 340 });
  const B = chip(915, 570, 'نظام صوري', { fill: C.mint, icon: 'image', size: 46, h: 112, at: .6, minW: 340 });
  const core = G(); box({ x: tx - 175, y: ty - 88, w: 350, h: 176, r: 88, fill: C.yel, label: 'طريقان\nللاستدعاء', size: 46, sh: 12, at: 1.9, parent: core });
  const P = [[A, 230], [B, 570]].map(([c, y], i) => path(`M${c.x0} ${y}C${c.x0 - 170} ${y} ${tx + 340} ${ty} ${tx + 175} ${ty}`, { sw: 9, at: 1.25 + i * .18, dur: .6, parent: LG }));
  P.forEach(p => travel(p, { start: 2.4, period: 1.4, r: 15, parent: LG }));
  pulse(core, tx, ty, 2.4, 1.4, .07, 1.4);
  caption('ما رُمِّز فيهما معًا له طريقان للاستدعاء', 2.8);
};

/* 4 التقارب: ثماني عشرة نقطة متساوية البعد تصير مجموعتين حين يتسع الفراغ */
SCENES.gestalt = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 808, 'p'], [90, 808, 's', C.yel]]);
  const cols = [300, 420, 540, 660, 780, 900], rows = [212, 332, 452], dots = [];
  [[150, 510], [690, 1050]].forEach(([x0, x1], i) => { const g = G(); rrect(g, x0, 146, x1 - x0, 372, 42, 'none', 6, { 'stroke-dasharray': '20 14' }); add(g, 3.1 + i * .15, .5, 'pop'); });
  cols.forEach((x, ci) => { const o = G(); rows.forEach((y, ri) => { const d = disc({ cx: x, cy: y, r: 42, fill: C.white, sh: 8, parent: o, at: .3 + (ci + ri) * .07, dur: .45 }); dots.push([d.main, ci]); });
    hook(t => setT(o, `translate(${(ci < 3 ? -90 : 90) * E.inout(prog(t, 1.9, 1.0))} 0)`)); });
  hook(t => { const p = prog(t, 2.75, .45); dots.forEach(([c, ci]) => c.setAttribute('fill', mix(C.white, ci < 3 ? C.coral : C.blue, p))); });
  const ar = G(); el('path', { d: 'M532 332H668M556 308L532 332L556 356M644 308L668 332L644 356', fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, ar); add(ar, 2.95, .45, 'pop');
  const T1 = G(); txt(600, 640, 'الفراغ يفصل، والتقارب يجمع', 54, { parent: T1 }); add(T1, 3.5, .6, 'up');
  const T2 = G(); txt(600, 716, 'العين تقرّر المجموعة قبل أن يقرأ العقل', 36, { parent: T2, fill: C.bink, w: 800 }); add(T2, 3.8, .6, 'up');
};

/* 5 الجرس: حلقة الأربعين دقيقة بمراحلها السبع */
SCENES.bell = () => {
  const cx = 412, cy = 408, ro = 272, ri = 166, T0 = 1.0, T1 = 5.0, tm = m => T0 + (m / 40) * (T1 - T0);
  const SEG = [['دخول', 4, C.mint], ['مثير', 3, C.yel], ['استكشاف', 11, C.blue], ['بناء', 9, C.coral], ['تطبيق', 7, C.lav], ['تذكرة', 4, C.pink], ['إغلاق', 2, C.sky]];
  deco([[1112, 808, 'p'], [88, 808, 's', C.yel]]);
  const base = G(); el('circle', { cx: cx - 12, cy: cy + 12, r: ro, fill: INK }, base); el('circle', { cx, cy, r: ro, fill: C.white, stroke: INK, 'stroke-width': 7 }, base); el('circle', { cx, cy, r: ri, fill: C.cream, stroke: INK, 'stroke-width': 7 }, base);
  add(base, .2, .6, 'pop');
  let acc = 0; const st = SEG.map(s => { const a = acc; acc += s[1]; return a; });
  const segs = SEG.map(([, , f]) => el('path', { fill: f, stroke: INK, 'stroke-width': 6, 'stroke-linejoin': 'round' }));
  SEG.forEach(([, m], i) => { const [x, y] = arcPt(cx, cy, (ro + ri) / 2, (st[i] + m / 2) * 9), g = G(); txt(x, y, String(m), m < 3 ? 36 : 46, { parent: g }); add(g, tm(st[i] + m), .4, 'pop'); });
  const ctr = el('text', { x: cx, y: cy - 14, 'font-size': 126, 'text-anchor': 'middle', 'font-weight': 900, fill: INK }); ctr.textContent = '0'; add(ctr, .5, .5, 'pop');
  const cg = G(); txt(cx, cy + 72, 'دقيقة', 42, { parent: cg, w: 800 }); add(cg, .6, .5, 'pop');
  hook(t => { const pr = 40 * prog(t, T0, T1 - T0); SEG.forEach(([, m], i) => { const a0 = st[i], a1 = Math.min(a0 + m, pr); segs[i].setAttribute('d', a1 > a0 + .02 ? arcPath(cx, cy, ro, ri, a0 * 9, a1 * 9) : 'M0 0'); }); ctr.textContent = String(Math.round(pr)); });
  SEG.forEach(([l, m, f], i) => { const y = 170 + i * 80, g = G();
    el('rect', { x: 1065, y: y - 15, width: 44, height: 44, rx: 12, fill: INK }, g); rrect(g, 1072, y - 22, 44, 44, 12, f, 5);
    txt(1046, y, l, 40, { parent: g, anchor: 'start' });
    rrect(g, 772, y - 26, 88, 52, 26, C.white, 5); txt(816, y, String(m), 34, { parent: g });
    add(g, tm(st[i]), .45, 'slide', { dx: 70 }); });
  caption('مراحل بأزمنة محسوبة', 5.3);
};

/* 6 السؤال: سلّم من ست درجات يصعد من «يتذكّر» إلى «يبدع» */
SCENES.ask = () => {
  const L = ['يتذكّر', 'يفهم', 'يطبّق', 'يحلّل', 'يقوّم', 'يبدع'], F = [C.white, C.white, C.white, C.coral, C.coral, C.yel];
  const w = 150, gap = 10, base = 676, X = i => 1105 - w - i * (w + gap), H = i => 92 + i * 72, TOP = i => base - H(i);
  deco([[1110, 96, 's', C.white], [640, 140, 'd', C.pink], [1110, 330, 'p']]);
  path(`M100 ${base + 3}H1130`, { sw: 6, at: .15, dur: .6 });
  L.forEach((l, i) => { const g = box({ x: X(i), y: TOP(i), w, h: H(i), r: 16, fill: F[i], sh: 10 }); txt(X(i) + w / 2, TOP(i) + 44, l, 36, { parent: g }); add(g, .35 + i * .28, .6, 'grow');
    disc({ cx: X(i) + w / 2, cy: base + 46, r: 24, fill: C.white, label: String(i + 1), size: 30, sh: 5, sw: 5, at: .45 + i * .28 }); });
  const P = L.map((_, i) => [X(i) + w / 2, TOP(i) - 30]), T0 = 2.55, hop = .42;
  hopper(P, T0, hop, 72, { r: 26, appear: 2.2 });
  const [px, py] = P[5]; [[-70, -40, 18, C.yel], [62, -72, 16, C.yel], [-10, -100, 22, C.white]].forEach(([dx, dy, s, f], j) => sparkle(px + dx, py + dy, s, f, T0 + 5 * hop + .05 + j * .08));
  chip(px + 182, py + 4, 'ارتقاء', { fill: C.yel, size: 38, h: 76, at: T0 + 5 * hop + .25 });
  caption([['الرابعة والخامسة', C.bink], [' محور الحصة، والسادسة ارتقاء', INK]], 2.0);
};

/* 7 ماير: قناتا السمع والبصر تصبّان في انتقاء فتنظيم فدمج */
SCENES.mayer = () => {
  deco([[90, 96, 'd', C.pink], [400, 150, 's', C.white], [1110, 704, 'p'], [90, 704, 's', C.yel]]);
  const y = 430, h = 160, w = 330, t = h / 2.6, step = w - t + 16, xs = [0, 1, 2].map(i => 1100 - w - i * step), LG = G();
  chip(1000, 170, 'سمع', { fill: C.white, icon: 'sound', size: 44, h: 100, at: .35, minW: 210 });
  chip(716, 170, 'بصر', { fill: C.white, icon: 'eye', size: 44, h: 100, at: .55, minW: 210 });
  const P = [path(`M1000 220C1000 330 965 330 965 ${y}`, { sw: 8, at: 1.0, dur: .5, parent: LG }), path(`M716 220C716 330 880 330 880 ${y}`, { sw: 8, at: 1.1, dur: .5, parent: LG })];
  const CH = [['انتقاء', C.coral], ['تنظيم', C.blue], ['دمج', C.mint]].map(([l, f], i) => { const o = G(); chev(xs[i], y, w, h, f, l, 48, 1.5 + i * .3, i === 0, o); return o; });
  P.forEach(p => travel(p, { start: 2.2, period: 1.5, r: 14, parent: LG }));
  CH.forEach((o, i) => hook(tt => { let dy = 0; const s0 = 3.7 + i * .28; if (tt >= s0) dy = -18 * Math.sin(Math.PI * clamp(((tt - s0) % 1.5) / .32, 0, 1)); setT(o, `translate(0 ${dy})`); }));
  caption('بقناتين محدودتي السعة: سمع وبصر', 2.6);
};

/* 8 التفكير التصميمي: خمس مراحل متتابعة */
SCENES.dt = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 704, 'p'], [90, 704, 's', C.yel]]);
  const L = [['تعاطف', C.coral, 'heart'], ['تحديد', C.yel, 'target'], ['توليد', C.mint, 'bulb'], ['نموذج', C.blue, 'cube'], ['اختبار', C.lav, 'flask']];
  const w = 232, h = 160, y = 430, t = h / 2.6, step = w - t + 14, X = i => 1090 - w - i * step;
  const CH = L.map(([l, f], i) => { const o = G(); return [o, chev(X(i), y, w, h, f, l, 40, .5 + i * .3, i === 0, o)]; });
  L.forEach(([, , ic], i) => disc({ cx: CH[i][1].cx, cy: 298, r: 54, fill: C.white, icon: ic, isz: 66, sh: 7, at: .7 + i * .3 }));
  const P = CH.map(([, g]) => [g.cx, y - 24]), T0 = 2.9, hop = .5, pause = .1;
  hopper(P, T0, hop, 58, { r: 22, fill: C.white, appear: 2.6, pause });
  CH.forEach(([o], i) => { const land = i === 0 ? 2.6 : T0 + (i - 1) * (hop + pause) + hop; hook(tt => setT(o, `translate(0 ${10 * Math.sin(Math.PI * prog(tt, land, .28))})`)); });
  caption('مع مستفيد حقيقي، للوسائل لا للأحكام', 2.4);
};

/* 9 الفهم بالتصميم: النتيجة ثم الدليل ثم الخبرات، والتنفيذ بالعكس */
SCENES.ubd = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink]]);
  const w = 340, h = 170, y = 300, t = h / 2.6, step = w - t + 18, X = i => 1080 - w - i * step;
  const CH = [['النتيجة', C.yel], ['الدليل', C.mint], ['الخبرات', C.blue]].map(([l, f], i) => chev(X(i), y, w, h, f, l, 50, .4 + i * .35, i === 0));
  CH.forEach((g, i) => disc({ cx: g.cx, cy: 220, r: 34, fill: C.white, label: String(i + 1), size: 38, sh: 6, at: .55 + i * .35 }));
  const arrow = (x0, x1, yy, label, fill, at) => { const dir = Math.sign(x1 - x0);
    path(`M${x0} ${yy}H${x1}`, { sw: 8, at, dur: .8 });
    const hd = G(); el('path', { d: `M${x1 - dir * 30} ${yy - 22}L${x1} ${yy}L${x1 - dir * 30} ${yy + 22}`, fill: 'none', stroke: INK, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, hd); add(hd, at + .65, .3, 'pop');
    chip(600, yy, label, { fill, size: 40, h: 80, at: at + .25 }); };
  arrow(1050, 150, 585, 'التخطيط', C.coral, 2.0);
  arrow(150, 1050, 700, 'التنفيذ', C.white, 3.2);
  caption('خطّط بعكس ترتيب التنفيذ', 4.4);
};

/* 10 جانييه: تسعة أعمدة متصاعدة والرابع مميَّز */
SCENES.gagne = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 330, 'p']]);
  const w = 82, gap = 26, base = 670, X = i => 1073 - i * w - (i - 1) * gap, H = i => 62 + (i - 1) * 52;
  path(`M100 ${base + 3}H1100`, { sw: 6, at: .15, dur: .6 });
  for (let i = 1; i <= 9; i++) { const hi = i === 4, o = G();
    box({ x: X(i), y: base - H(i), w, h: H(i), r: 14, fill: hi ? C.coral : C.blue, sh: 9, parent: o, at: .35 + (i - 1) * .2, dur: .6, anim: 'grow' });
    disc({ cx: X(i) + w / 2, cy: base + 46, r: 25, fill: hi ? C.yel : C.white, label: String(i), size: 30, sh: 5, sw: 5, at: .45 + (i - 1) * .2 });
    if (hi) hook(t => setT(o, `translate(0 ${-18 * Math.sin(Math.PI * prog(t, 2.6, .5))})`)); }
  const sx = X(4) + w / 2, sy = base - H(4) - 66, st = G(); icon(st, 'star', sx, sy, 80); add(st, 2.75, .55, 'spin', { bob: 6, per: 2.2 });
  sparkle(sx - 60, sy - 36, 14, C.white, 2.95); sparkle(sx + 58, sy - 48, 12, C.yel, 3.05);
  caption('تسعة أحداث تقابل تسع عمليات في الدماغ', 3.2);
};

/* 11 بلوم: أربع وعشرون خلية ترتفع منها خلية واحدة */
SCENES.bloom = () => {
  deco([[90, 96, 'd', C.pink], [1110, 808, 'p'], [90, 808, 's', C.yel]]);
  const cw = 118, ch = 92, g = 14, x0 = 1010, y0 = 218, cell = (r, c) => [x0 - (c + 1) * cw - c * g, y0 + r * (ch + g)];
  const H1 = G(); txt(700, 148, 'العملية: تذكّر … إبداع', 38, { parent: H1, w: 800 });
  el('path', { d: 'M470 148H330M356 126L330 148L356 170', fill: 'none', stroke: INK, 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, H1); add(H1, .3, .5, 'down');
  const H2 = G(); txt(1098, 420, 'نوع\nالمعرفة', 34, { parent: H2, w: 800 }); add(H2, .45, .5, 'slide', { dx: 40 });
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { if (c === 4 && r === 1) continue; const [x, y] = cell(r, c); box({ x, y, w: cw, h: ch, r: 14, fill: C.white, sh: 7, sw: 5, at: .55 + (r + c) * .09, dur: .45 }); }
  const [hx, hy] = cell(1, 4), slot = G(), liftO = G(), lift = G(liftO);
  rrect(slot, hx, hy, cw, ch, 14, C.cream, 4, { 'stroke-dasharray': '10 8' }); add(slot, .55 + 5 * .09, .45, 'pop');
  const shd = el('rect', { x: hx - 7, y: hy + 7, width: cw, height: ch, rx: 14, fill: INK }, lift), top = rrect(lift, hx, hy, cw, ch, 14, C.white, 5); const star = G(lift); icon(star, 'star', hx + cw / 2, hy + ch / 2, 58); add(star, 2.9, .5, 'spin');
  add(lift, .55 + 5 * .09, .45, 'pop');
  hook(t => { const p = E.back(prog(t, 2.5, .6)); setT(liftO, `translate(${8 * p} ${-30 * p})`); shd.setAttribute('x', hx - 7 - 9 * p); shd.setAttribute('y', hy + 7 + 14 * p); top.setAttribute('fill', mix(C.white, C.yel, clamp(p, 0, 1))); });
  sparkle(hx - 26, hy - 60, 14, C.white, 3.1);
  caption('6 عمليات × 4 أنواع = 24 خلية', 3.3, { size: 42 });
};

/* 12 التصميم الشامل: ثلاثة طرق تلتقي عند هدف واحد */
SCENES.udl = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 808, 'p'], [90, 808, 's', C.yel]]);
  const tx = 300, ty = 400, LG = G(), TG = G(), tg = G(TG);
  el('circle', { cx: tx - 12, cy: ty + 12, r: 165, fill: INK }, tg); [[165, C.white], [116, C.sky], [70, C.white], [30, C.coral]].forEach(([r, f]) => el('circle', { cx: tx, cy: ty, r, fill: f, stroke: INK, 'stroke-width': 7 }, tg)); add(tg, .3, .6, 'pop');
  const lab = G(); txt(tx, 640, 'هدف واحد', 48, { parent: lab }); add(lab, .6, .5, 'up');
  const P = [['انخراط', 190, C.coral], ['تمثيل', 400, C.yel], ['تعبير', 610, C.mint]];
  const ch = P.map(([l, y, f], i) => chip(940, y, l, { fill: f, size: 46, h: 104, at: .8 + i * .2, minW: 280 }));
  P.map(([, y], i) => path(`M${ch[i].x0} ${y}C${ch[i].x0 - 200} ${y} ${tx + 360} ${ty} ${tx + 165} ${ty}`, { sw: 9, at: 1.4 + i * .18, dur: .6, parent: LG }))
    .forEach(p => travel(p, { start: 2.2, period: 1.4, r: 15, parent: LG }));
  pulse(TG, tx, ty, 2.2, 1.4, .06, 1.4);
  const dart = G(), dg = G(dart); el('path', { d: 'M0 0L120 0', stroke: INK, 'stroke-width': 9, 'stroke-linecap': 'round' }, dg);
  el('path', { d: 'M0 0L26 -12L26 12Z', fill: INK, stroke: INK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, dg);
  el('path', { d: 'M96 0L124 -22L136 -22L116 0L136 22L124 22Z', fill: C.coral, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, dg);
  const sx = 790, sy = 40, ex = tx + 5, ey = ty - 4, ang = Math.atan2(-(ey - sy), -(ex - sx)) * 180 / Math.PI;
  hook(t => { if (t < 4.35) { dart.setAttribute('opacity', 0); return; } dart.setAttribute('opacity', 1); const p = E.in(prog(t, 4.35, .38));
    const w = t > 4.73 ? 7 * Math.exp(-(t - 4.73) * 5) * Math.sin((t - 4.73) * 40) : 0;
    setT(dart, `translate(${lerp(sx, ex, p)} ${lerp(sy, ey, p)}) rotate(${ang + w})`); });
  caption('ثلاثة طرق تلتقي عند هدف واحد', 3.0);
};

/* 13 كيركباتريك: أربعة مستويات تُبنى من القاعدة */
SCENES.kirk = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 330, 'p'], [90, 330, 's', C.yel]]);
  const base = 690, h = 94, gap = 12;
  path(`M150 ${base + 8}H1050`, { sw: 8, at: .15, dur: .6 });
  [['رد الفعل', 760, C.mint], ['التعلّم', 620, C.blue], ['السلوك', 480, C.yel], ['النتائج', 340, C.coral]].forEach(([l, w, f], k) => {
    const y = base - (k + 1) * h - k * gap, x = 600 - w / 2, g = box({ x, y, w, h, r: 20, fill: f, label: l, size: 46, sh: 10 });
    disc({ parent: g, cx: x + w - 50, cy: y + h / 2, r: 27, fill: C.white, label: String(k + 1), size: 30, sh: 0, sw: 5 });
    add(g, .4 + k * .55, .8, 'drop', { dy: 720 }); });
  caption('كل مستوى لا يُستدل به على ما فوقه', 2.9);
};

/* 14 السلسلة: سبع خطوات من المعيار بنصه إلى ثلاثة أنشطة */
SCENES.chain = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [90, 808, 's', C.yel], [1110, 808, 'p']]);
  const L = ['المعيار بنصه', 'المؤشرات كلها', 'القيمة والمهارة', 'الدليل أولًا', 'السؤال الأساسي', 'ناتج الارتقاء', 'ثلاثة أنشطة'], x = 600, Y = i => 96 + i * 98, LG = G();
  let lastChip;
  L.forEach((l, i) => { const right = i % 2 === 1, last = i === 6, at = .4 + i * .42, size = 38, wch = tw(l, size) + size * 1.8;
    if (i < 6) path(`M${x} ${Y(i)}V${Y(i + 1)}`, { sw: 8, at: at + .2, dur: .32, parent: LG });
    disc({ cx: x, cy: Y(i), r: 36, fill: last ? C.yel : C.white, label: String(i + 1), size: 34, sh: 6, at });
    const c = chip(right ? x + 66 + wch / 2 : x - 66 - wch / 2, Y(i), l, { fill: last ? C.coral : C.white, size, h: 74, sh: 8 }); add(c, at + .12, .5, 'slide', { dx: right ? -60 : 60 });
    if (last) lastChip = c; });
  [[C.blue, 14], [C.mint, 0], [C.lav, -14]].forEach(([f, rot], k) => { const cx = lastChip.x0 - 52 - k * 40, cy = Y(6), o = G(); setT(o, `rotate(${rot} ${cx} ${cy + 40})`);
    const g = G(o); el('rect', { x: cx - 30 - 6, y: cy - 40 + 6, width: 60, height: 80, rx: 10, fill: INK }, g); rrect(g, cx - 30, cy - 40, 60, 80, 10, f, 5);
    ['M14 -18H-14', 'M14 -2H-14', 'M14 14H-4'].forEach(d => el('path', { d, transform: `translate(${cx} ${cy})`, stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, g));
    add(g, 3.55 + k * .14, .45, 'pop'); });
  caption('سبع خطوات متتابعة', 3.9);
};

/* 15 دفتر التحضير: الترويسة والأعمدة الأربعة وخانة الارتقاء */
SCENES.daftar = () => {
  const X0 = 150, X1 = 1050, Y0 = 114, Y1 = 744, cw = 205, D = 22;
  box({ x: X0, y: Y0, w: X1 - X0, h: Y1 - Y0, r: 28, fill: C.white, sh: 14, at: .2, dur: .6 });
  const rg = G(); for (let i = 0; i < 9; i++) rrect(rg, 221 + i * 92.5, Y0 - 22, 18, 44, 9, C.yel, 5); add(rg, .45, .5, 'pop');
  box({ x: 190, y: 136 + D, w: 820, h: 92, r: 18, fill: C.coral, label: 'الترويسة', size: 46, sh: 0, sw: 5, at: .8, anim: 'down' });
  ['المعايير', 'المحتوى', 'الإجراءات', 'التقييم'].forEach((c, i) => box({ x: 1010 - (i + 1) * cw + 6, y: 248 + D, w: cw - 12, h: 78, r: 14, fill: C.yel, label: c, size: 36, sh: 0, sw: 5, at: 1.3 + i * .2 }));
  const wl = G(); for (let i = 0; i < 4; i++) for (let k = 0; k < 5; k++) { const x = 1010 - (i + 1) * cw; el('path', { d: `M${x + 26} ${364 + D + k * 40}H${x + cw - 26}`, stroke: INK, 'stroke-width': 3, opacity: .16, 'stroke-linecap': 'round' }, wl); }
  add(wl, 2.0, .5, 'fade');
  for (let i = 1; i < 4; i++) path(`M${1010 - i * cw} ${338 + D}V${560 + D}`, { sw: 5, at: 1.95 + i * .08, dur: .4 });
  ['القيمة', 'الطرق', 'المصادر', 'الواجب'].forEach((c, i) => box({ x: 1010 - (i + 1) * cw + 6, y: 574 + D, w: cw - 12, h: 106, r: 14, fill: C.lav, label: c, size: 36, sh: 0, sw: 5, at: 2.5 + i * .18 }));
  box({ x: 828, y: 398 + D, w: 164, h: 92, r: 18, fill: C.soft, label: '+ ارتقاء', size: 34, sh: 0, sw: 5, dash: '12 9', at: 3.5, dur: .6 });
  sparkle(1000, 388 + D, 18, C.yel, 3.75);
  caption('لا تحذف حقلًا · لا تضف عمودًا', 4.2, { fill: C.coral });
};

/* 16 الحوار: حوض السمك، ستة يتحاورون وعشرة يراقبون */
SCENES.dialog = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink], [1110, 704, 'p'], [90, 704, 's', C.yel]]);
  const cx = 600, cy = 400, rad = a => a * Math.PI / 180;
  const bowl = G(); el('circle', { cx: cx - 12, cy: cy + 12, r: 192, fill: INK }, bowl); el('circle', { cx, cy, r: 192, fill: C.water, stroke: INK, 'stroke-width': 7 }, bowl);
  [[-118, -122], [52, 128]].forEach(([dx, dy]) => el('path', { d: `M${cx + dx} ${cy + dy}q17 -12 34 0t34 0t34 0`, fill: 'none', stroke: C.white, 'stroke-width': 7, 'stroke-linecap': 'round' }, bowl));
  add(bowl, .3, .6, 'pop');
  const inner = [0, 1, 2, 3, 4, 5].map(k => { const a = rad(k * 60 - 90); return [cx + 112 * Math.cos(a), cy + 112 * Math.sin(a)]; });
  inner.forEach(([x, y], k) => disc({ cx: x, cy: y, r: 44, fill: C.coral, sh: 6, at: .8 + k * .12 }));
  for (let k = 0; k < 10; k++) { const a = rad(k * 36 - 72), x = cx + 305 * Math.cos(a), y = cy + 305 * Math.sin(a), g = disc({ cx: x, cy: y, r: 42, fill: C.white, sh: 7 });
    const ux = (cx - x) / 305, uy = (cy - y) / 305, e = G(g, { transform: `translate(${x} ${y}) scale(.5)`, stroke: INK, 'stroke-width': 8, 'stroke-linejoin': 'round' });
    el('path', { d: 'M-46 0Q0 -40 46 0Q0 40 -46 0Z', fill: C.white }, e); el('circle', { cx: 13 * ux, cy: 13 * uy, r: 15, fill: C.blue }, e);
    add(g, 1.7 + k * .08, .45, 'pop'); }
  [0, 3, 1, 4, 2, 5].forEach((k, j) => { const [x, y] = inner[k], s0 = 2.2 + j * .78, b = G(), bx = x + (x >= cx ? 34 : -34), by = y - 62;
    el('path', { d: `M${bx - 40} ${by - 26}H${bx + 40}V${by + 18}H${bx + 10}L${bx - 4} ${by + 34}V${by + 18}H${bx - 40}Z`, fill: C.white, stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, b);
    [-18, 0, 18].forEach(d => el('circle', { cx: bx + d, cy: by - 4, r: 5, fill: INK }, b));
    b.style.transformBox = 'fill-box'; b.style.transformOrigin = 'center bottom';
    hook(t => { const s = t < s0 ? 0 : t < s0 + .72 ? E.back(prog(t, s0, .25)) : 1 - E.in(prog(t, s0 + .72, .18)); b.style.transform = `scale(${Math.max(0, s)})`; b.style.opacity = s > 0 ? 1 : 0; }); });
  caption('حوض السمك: 6 يتحاورون و10 يراقبون', 2.9);
};

/* 17 المشروع: خمس محطات من السؤال القائد إلى التأمل */
SCENES.proj = () => {
  deco([[1110, 96, 's', C.white], [90, 96, 'd', C.pink]]);
  const SP = [[1010, 590], [790, 330], [600, 590], [410, 330], [190, 590]];
  const L = ['السؤال القائد', 'الخطة', 'البحث والبناء', 'العرض والمناقشة', 'التأمل'], IC_ = ['question', 'list', 'search', 'chat', 'loop'];
  const d = spline([[1160, 548], ...SP, [40, 548]]);
  path(d, { sw: 52, at: .3, dur: 1.4 }); path(d, { sw: 38, stroke: C.white, at: .3, dur: 1.4 });
  const mid = path(d, { sw: 5, stroke: C.yel, dash: '18 18', cap: 'butt' }); add(mid, 1.6, .5, 'fade');
  const guide = path(d, { sw: 1, stroke: 'none' }), Ls = SP.map(([x, y]) => lenAt(guide, x, y));
  const T = [2.0, 2.95, 3.9, 4.85, 5.8], move = .7;
  SP.forEach(([x, y], i) => { const o = G(); disc({ cx: x, cy: y, r: 62, fill: i === 4 ? C.yel : C.white, icon: IC_[i], isz: 72, sh: 9, parent: o, at: .9 + i * .15 });
    disc({ cx: x + 48, cy: y - 48, r: 22, fill: C.coral, label: String(i + 1), size: 26, sh: 0, sw: 5, parent: o, at: 1.05 + i * .15 });
    hook(t => setT(o, `translate(0 ${-14 * Math.sin(Math.PI * prog(t, T[i], .3))})`));
    chip(x, y > 400 ? y + 104 : y - 104, L[i], { fill: i === 4 ? C.coral : C.white, size: 34, h: 68, sh: 7, at: T[i] + .05 }); });
  const ball = G(); el('circle', { cx: -6, cy: 6, r: 20, fill: INK }, ball); el('circle', { r: 20, fill: C.coral, stroke: INK, 'stroke-width': 6 }, ball);
  hook(t => { if (t < T[0] - .25) { ball.setAttribute('opacity', 0); return; } ball.setAttribute('opacity', 1); let s = Ls[0];
    for (let i = 0; i < 4; i++) { const a = T[i] + .25, p = prog(t, a, move); if (t >= a) s = lerp(Ls[i], Ls[i + 1], E.inout(p)); }
    const q = guide.getPointAtLength(s); setT(ball, `translate(${q.x} ${q.y - 78}) scale(${E.back(prog(t, T[0] - .25, .3))})`); });
  caption('خمس مراحل داخل القاعة', 1.2);
};

/* 18 المسافة والحرف: كلما بعُد القارئ كبُر الحرف */
SCENES.distance = () => {
  deco([[1112, 92, 's', C.white], [88, 92, 'd', C.pink]]);
  chip(600, 92, 'كلما بعُد القارئ كبُر الحرف', { fill: C.yel, size: 44, h: 92, at: .3 });
  const cv = document.createElement('canvas').getContext('2d'); cv.font = '900 200px Mikhak'; const m = cv.measureText('أ'), inkH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const COL = [[930, 3, 2.8, '2.8', C.mint, 2.2], [600, 6, 6.0, '6.0', C.sky, 3.3], [270, 9, 9.1, '9.1', C.pink, 4.4]], bot = 528;
  path('M1130 690H80', { sw: 6, at: 1.0, dur: .7 });
  COL.forEach(([x, dm, cm, lab, f, ta], i) => {
    box({ x: x - 132, y: 196, w: 264, h: 370, r: 24, fill: C.white, sh: 12, at: .6 + i * .15 });
    const px = cm * 26, fs = px / inkH * 200, g = G(), tt = el('text', { x: x - 14, y: bot - m.actualBoundingBoxDescent * fs / 200, 'font-size': fs, 'text-anchor': 'middle', 'font-weight': 900, fill: INK }, g);
    tt.style.dominantBaseline = 'alphabetic'; tt.textContent = 'أ'; add(g, ta, .6, 'popb');
    const dx = x + 62, dim = G(); el('path', { d: `M${dx} ${bot}V${bot - px}M${dx - 12} ${bot}H${dx + 12}M${dx - 12} ${bot - px}H${dx + 12}`, stroke: INK, 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none' }, dim); add(dim, ta + .25, .4, 'grow');
    chip(x, 196, `${lab} سم`, { fill: f, size: 34, h: 66, sh: 7, at: ta + .3 });
    path(`M${x} 676V704`, { sw: 6, at: 1.4, dur: .2 });
    const dl = G(); txt(x, 742, `${dm} م`, 36, { parent: dl }); add(dl, ta, .4, 'pop'); });
  const eye = G(), eg = G(eye); el('circle', { cx: -7, cy: 7, r: 40, fill: INK }, eg); el('circle', { r: 40, fill: C.white, stroke: INK, 'stroke-width': 6 }, eg); icon(eg, 'eye', 0, 0, 56);
  const stops = [[1.6, 1080], [2.2, 930], [2.75, 930], [3.3, 600], [3.85, 600], [4.4, 270]];
  hook(t => { if (t < 1.6) { eye.setAttribute('opacity', 0); return; } eye.setAttribute('opacity', 1); let x = 1080;
    for (let i = 0; i < stops.length - 1; i++) { const [a, xa] = stops[i], [b, xb] = stops[i + 1]; if (t >= a) x = lerp(xa, xb, E.inout(prog(t, a, b - a))); }
    setT(eye, `translate(${x} 640) scale(${E.back(prog(t, 1.6, .3))})`); });
  caption('أدنى ارتفاع للحرف بحسب مسافة القراءة', 5.2);
};

/* 19 المنحنى: لا عارٍ ولا مزدحم */
SCENES.ucurve = () => {
  deco([[1112, 92, 's', C.white], [88, 92, 'd', C.pink]]);
  chip(600, 92, 'الجدار: لا عارٍ ولا مزدحم', { fill: C.yel, size: 44, h: 92, at: .3 });
  path('M150 700H1050', { sw: 6, at: .5, dur: .6 });
  const cd = 'M190 690C330 272 870 272 1010 690', crv = path(cd, { sw: 10, at: .9, dur: 1.1 }), L = crv.getTotalLength();
  const at = q => { const p = crv.getPointAtLength(q * L); return [p.x, p.y]; };
  const qs = [.9, .5, .1], pts = qs.map(at), X = [944, 600, 256];
  const TH = [[944, 'عارٍ', 2.15], [600, 'متوازن', 3.2], [256, 'مزدحم', 4.25]];
  TH.forEach(([x, lab, ta], i) => {
    path(`M${x} 300V${pts[i][1] - 16}`, { sw: 4, dash: '10 10', at: ta, dur: .3, anim: 'fade' });
    const g = box({ x: x - 118, y: 150, w: 236, h: 150, r: 18, fill: C.white, sh: 9 });
    if (i === 1) { const cs = [[C.blue, 0, 0], [C.mint, 1, 0], [C.yel, 0, 1], [C.coral, 1, 1]]; cs.forEach(([f, c, r]) => rrect(g, x + 8 + c * 52, 172 + r * 56, 44, 46, 8, f, 4));
      rrect(g, x - 104, 168, 100, 114, 12, C.soft, 4, { 'stroke-dasharray': '9 7' }); txt(x - 54, 210, '20–50%', 22, { parent: g, w: 800, dir: 'ltr' }); txt(x - 54, 244, 'خالٍ', 24, { parent: g }); }
    if (i === 2) { const F = [C.blue, C.mint, C.yel, C.coral, C.lav, C.pink, C.sky]; let n = 0; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) rrect(g, x - 106 + c * 42 + (r % 2) * 6, 162 + r * 42, 40, 40, 6, F[n++ % 7], 4); }
    if (i === 0) el('circle', { cx: x, cy: 225, r: 5, fill: INK }, g);
    add(g, ta, .5, 'pop');
    disc({ cx: pts[i][0], cy: pts[i][1], r: 14, fill: i === 1 ? C.mint : C.white, sh: 0, sw: 5, at: ta });
    const lb = G(); txt(x, 744, lab, 38, { parent: lb }); add(lb, ta, .4, 'pop'); });
  sparkle(748, 168, 16, C.yel, 3.45);
  const mk = G(); el('circle', { cx: -6, cy: 6, r: 24, fill: INK }, mk); el('circle', { r: 24, fill: C.coral, stroke: INK, 'stroke-width': 6 }, mk);
  hook(t => { if (t < 1.85) { mk.setAttribute('opacity', 0); return; } mk.setAttribute('opacity', 1);
    let q = lerp(1, 0, E.inout(prog(t, 2.0, 2.4))); if (t > 4.5) q = lerp(0, .5, E.inout(prog(t, 4.5, .8)));
    const [x, y] = at(q); setT(mk, `translate(${x} ${y - 34}) scale(${E.back(prog(t, 1.85, .3))})`); });
  caption('متوازن: اترك 20–50% من الجدار خاليًا', 5.3);
};
