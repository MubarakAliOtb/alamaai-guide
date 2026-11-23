/* «التحكم من الجوال» — صفحة الجوال، تُفتح من رمز الربط على شاشة العرض: remote/#<رقم الجلسة>.<المفتاح العام للشاشة>
   يحفظ الجوال مفتاحه لكل جلسة (alm:rc:p، آخر أربع جلسات)، فإن أُعيد فتح الصفحة عاد إلى الشاشة نفسها بلا مسح جديد. */
import * as RC from './rc.js';

const $ = id => document.getElementById(id);
const H = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PKEY = 'alm:rc:p';
const LETTERS = 'أبجدهوزح';
const P_ = {
  next: 'M15 6l-6 6 6 6', prev: 'M9 6l6 6-6 6', pause: 'M8 5v14M16 5v14', reset: 'M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4',
  hand: 'M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8a8 8 0 0 0 16 0v-3a2 2 0 0 0-4 0',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z', lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  unlock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 7.5-2', key: 'M15 7a4 4 0 1 1-3.9 4.9L4 12v3h3v3h3v-2.5M15 7h.01', check: 'M5 12l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6L6 18', phone: 'M8 2.5h8A2.5 2.5 0 0 1 18.5 5v14a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 19V5A2.5 2.5 0 0 1 8 2.5zM11 18.5h2',
  spin: 'M12 3a9 9 0 1 0 9 9', warn: 'M12 3.5l9.5 17h-19zM12 10v4.5M12 17.5h.01', screen: 'M3 5h18v12H3zM8 21h8M12 17v4',
  unlink: 'M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1', back: 'M9 14l-4-4 4-4M5 10h9a5 5 0 0 1 0 10h-3'
};
const ic = k => k === 'play' ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>'
  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${P_[k] || ''}"/></svg>`;
const fmt = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
/* نص الشاشة: الآيات بخط المصحف (كما في العرض)، و**الغامق**، وفواصل الأسطر */
function rich(t) {
  t = String(t || ''); const e = H(t);
  const out = !/﴿/.test(t) && /[ٱۡ۟-ۭ]/.test(t.replace(/«[^»]*»/g, ''))
    ? '<span class="q">' + e + '</span>'
    : e.replace(/(﴿[^﴾]*﴾|«[^»]*[ٰٱۡ۟-ۭ][^»]*»)/g, '<span class="q">$1</span>');
  return out.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
}

let P = null, toastT = 0, helloT = 0, wake = null, hiddenAt = 0;

/* ---------- البدء ---------- */
function parseHash() {
  let h = ''; try { h = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { return null; }
  const m = /^([a-z2-9]{10,24})\.([A-Za-z0-9_-]{80,100})$/.exec(h);
  if (!m) return null;
  let pub; try { pub = RC.unb64u(m[2]); } catch (e) { return null; }
  return RC.pubOk(pub) ? { sid: m[1], spub: pub } : null;
}
async function keysFor(sid) {
  let all = {}; try { all = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; } catch (e) {}
  const o = all[sid];
  if (o && o.k && o.n) { try { return { ecdh: await RC.ecdhLoad(o.k), nsk: RC.unhex(o.n) }; } catch (e) {} }
  const ecdh = await RC.ecdhNew(), nsk = RC.nostrKey();
  all[sid] = { k: await RC.ecdhSave(ecdh), n: RC.hex(nsk), t: Date.now() };
  const now = Date.now();
  Object.keys(all).sort((a, b) => (all[b].t || 0) - (all[a].t || 0)).forEach((k, i) => { if (i >= 4 || now - (all[k].t || 0) > 3 * 864e5) delete all[k]; });
  try { localStorage.setItem(PKEY, JSON.stringify(all)); } catch (e) {}
  return { ecdh, nsk };
}
function forget(sid) { try { const all = JSON.parse(localStorage.getItem(PKEY) || '{}') || {}; delete all[sid]; localStorage.setItem(PKEY, JSON.stringify(all)); } catch (e) {} }
function devName() {
  const u = navigator.userAgent || '';
  if (/iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1)) return 'iPad';
  if (/iPhone/.test(u)) return 'iPhone';
  if (/Android/.test(u)) return 'جوال Android';
  return 'جوال';
}

async function start() {
  staticIcons();
  if (!RC.supported()) return msg('bad', 'warn', 'هذا المتصفح لا يدعم التحكم بالعرض', 'افتح الرابط في Safari أو Chrome بإصدار حديث.');
  const h = parseHash();
  if (!h) return msg('bad', 'phone', 'افتح هذه الصفحة من رمز الربط', 'على شاشة العرض اضغط زر «تحكّم من الجوال» في شريط العرض، ثم امسح الرمز الذي يظهر بكاميرا جوالك.');
  let k; try { k = await keysFor(h.sid); } catch (e) { return msg('bad', 'warn', 'تعذّر تجهيز الاتصال', 'أعد تحميل الصفحة، أو امسح الرمز من جديد.'); }
  const key = await RC.deriveKey(k.ecdh.priv, h.spub, h.sid, h.spub, k.ecdh.pub);
  P = { sid: h.sid, ecdh: k.ecdh, nsk: k.nsk, key, p: RC.pidOf(k.ecdh.pub), topic: await RC.topicOf(h.sid), rx: new RC.Receiver(),
    st: null, stAt: 0, deck: null, notes: null, paired: false, seen: 0, okAt: 0, helloAt: 0, tries: 0, end: '',
    q: 0, opt: null, syncAt: 0, more: false, moreKey: '', tm: null, rg: null, lastRe: 0 };
  P.bus = new RC.Bus({ topic: P.topic, nsk: P.nsk, onMsg: onRaw, onStatus: paintNet });
  P.direct = RC.Direct.ok() ? new RC.Direct({ onMsg: t => onRaw(t, 'dc'), onChange: paintNet, signal: b => P.tx.send(b, { relay: true }) }) : null;
  P.tx = new RC.Sender({ key, f: 'p', p: P.p, bus: P.bus, direct: P.direct });
  P.bus.start();
  msg('wait', 'spin', 'يتصل بشاشة العرض…', 'لحظات، ويظهر هنا ما على الشاشة.');
  rehello();
  setInterval(tick, 500);
}

/* ---------- التحية: المفتاح العام ظاهر، ومعه رسالة مختومة ---------- */
function rehello() { if (!P || P.end) return; P.helloAt = Date.now(); P.tries = 0; P.helloing = true; hello(); }
async function hello() {
  clearTimeout(helloT);
  if (!P || P.end || P.okAt >= P.helloAt) { if (P) P.helloing = false; return; }
  /* عشر دقائق بلا رد: يتوقف الجوال ويعرض زر «أعد المحاولة» (لا يستهلك الوسيط بلا فائدة) */
  const el = Date.now() - P.helloAt;
  if (el > 600000) {
    P.helloing = false;
    msg('bad', 'unlink', P.paired ? 'انقطع الاتصال بالشاشة' : 'لم تستجب الشاشة', 'قد يكون العرض أُغلق على الشاشة أو انقطع اتصالها. افتح العرض ثم اضغط «أعد المحاولة»، أو امسح رمزًا جديدًا.', [['retry', 'أعد المحاولة', 'pri']]);
    P.end = 'gone';
    return;
  }
  P.tries++;
  try {
    const env = await RC.pack(P.key, 'h', P.p, P.tx.ep, ++P.tx.i, { t: 'hi', d: devName() }, { k: RC.b64u(P.ecdh.pub) });
    /* أول محاولتين بالطريق المعتاد، ثم بالطريقين معًا (قد تحجب شبكة الشاشة أحدهما) */
    P.bus.send(env, P.tries > 2 || P.tx.via === 'ntfy' ? 'both' : '');
  } catch (e) {}
  if (!P.paired && P.tries === 4) msg('wait', 'spin', 'لم تستجب الشاشة بعد…', 'تأكد أن العرض مفتوح على الشاشة وأن رمز الربط ما زال ظاهرًا، وأن الجهازين متصلان بالإنترنت. سيستمر الجوال في المحاولة.');
  helloT = setTimeout(hello, el < 15000 ? 3000 : el < 120000 ? 8000 : 30000);
}

/* ---------- الاستقبال ---------- */
async function onRaw(text, via) {
  if (!P) return;
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (!m || m.v !== 1 || m.t !== 'e' || m.f !== 's' || m.p !== P.p) return;
  const b = await P.rx.take(P.key, m);
  if (!b) return;
  P.seen = Date.now(); P.stale = false; if (via !== 'dc') P.tx.via = via;
  if (P.end === 'gone') P.end = '';   /* عادت الشاشة بعد توقف المحاولات */
  /* أي رسالة مختومة من الشاشة (غير الرفض) تعني أن الربط قائم */
  if (b.t !== 'busy' && b.t !== 'bye' && P.okAt < P.helloAt) { P.okAt = Date.now(); P.helloing = false; clearTimeout(helloT); }
  if (b.t === 'ok') { P.okAt = Date.now(); clearTimeout(helloT); P.paired = true; P.end = ''; keepAwake(); if (!P.st) msg('wait', 'spin', 'تم الربط', 'يصل الآن ما على الشاشة…'); }
  else if (b.t === 'st') { P.paired = true; state(b); }
  else if (b.t === 'busy') { if (!P.paired) { P.end = 'busy'; clearTimeout(helloT); msg('bad', 'unlink', 'الشاشة مربوطة بجوال آخر', 'على الشاشة اضغط زر الجوال في شريط العرض ثم «ربط جوال آخر»، وامسح الرمز الجديد.', [['retry', 'حاول مجددًا', '']]); } }
  else if (b.t === 'bye') { end('انتهى الاتصال بالشاشة', 'أنهى المعلم الاتصال من شاشة العرض. لربط جديد اضغط زر الجوال في شريط العرض وامسح الرمز.'); }
  else if (b.t === 'of') { if (P.direct) P.direct.onOffer(b); }
  else if (b.t === 'hb') { if (b.on === false && P.st && P.st.on) askSync(true); }
  paintNet();
}
function end(t, d) {
  P.end = 'bye'; clearTimeout(helloT);
  try { if (P.direct) P.direct.close(); P.bus.stop(); } catch (e) {}
  forget(P.sid); releaseWake();
  msg('bad', 'unlink', t, d);
}
function askSync(now) { if (!P || !P.paired) return; if (!now && Date.now() - P.syncAt < 2500) return; P.syncAt = Date.now(); P.tx.send({ t: 'sync' }); }
function state(b) {
  if (b.dk) P.deck = { id: b.id, v: b.dv, l: b.dk };
  if (b.nt) P.notes = { k: b.id + '|' + b.n, v: b.nv, d: b.nt };
  P.st = b; P.stAt = Date.now();
  const ack = +b.ack || 0;
  if (P.opt && ack >= P.opt.q) P.opt = null;
  /* المؤقتان: تُعتمد قيمة الشاشة ما لم يكن للمعلم ضغطة عليهما لم تُنفَّذ بعد */
  const tm = b.tm; if (ack >= (P.tmQ || 0)) P.tm = tm ? { rem: +tm.rem || 0, at: P.stAt, run: !!tm.run, over: !!tm.over } : null;
  const rg = b.it && b.it.rg; if (ack >= (P.rgQ || 0) || !rg) P.rg = rg ? { rem: +rg.rem || 0, at: P.stAt, run: !!rg.run, s: +rg.s || 60 } : null;
  if (b.id && b.dv && !(P.deck && P.deck.id === b.id && P.deck.v === b.dv)) askSync();
  else if (b.on && b.nv && !(P.notes && P.notes.k === b.id + '|' + b.n && P.notes.v === b.nv)) askSync();
  render();
}

/* ---------- الأوامر ---------- */
function cmd(c, opt) {
  if (!P || !P.paired) return;
  c.t = 'c'; c.q = ++P.q;
  if (opt) P.opt = Object.assign({}, P.opt && P.opt.at && Date.now() - P.opt.at < 5000 ? P.opt : {}, opt, { q: c.q, at: Date.now() });
  P.tx.send(c);
  try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) {}
  render();
}
/* ما يظهر = آخر حالة من الشاشة، وفوقها ما ضغطه المعلم ولم يصل تأكيده بعد */
function view() {
  const s = P.st; if (!s) return null;
  const o = P.opt || {};
  const v = Object.assign({}, s, { n: o.n || s.n, it: s.it ? Object.assign({}, s.it) : null });
  if (v.it) { if (o.r != null) v.it.r = o.r; if (o.v) v.it.v = o.v; if (o.d) v.it.d = o.d; if (o.h != null) v.it.h = o.h; }
  return v;
}
const tmNow = t => !t ? 0 : t.run ? t.rem - (Date.now() - t.at) / 1000 : t.rem;
function act(a, el) {
  const v = P && view(); if (!v && !['retry', 'sheetx'].includes(a)) return;
  const w = v && v.it;
  switch (a) {
    case 'next': if (v.n < v.N) cmd({ c: 'go', n: v.n + 1 }, { n: v.n + 1 }); break;
    case 'prev': if (v.n > 1) cmd({ c: 'go', n: v.n - 1 }, { n: v.n - 1 }); break;
    case 'go': { const n = +el.dataset.n; closeSheet(); if (n && n !== v.n) cmd({ c: 'go', n }, { n }); break; }
    case 'rev': if (w && w.rv && w.r < w.rv.length) cmd({ c: 'rev', r: w.r + 1 }, { r: w.r + 1 }); break;
    case 'revall': if (w && w.rv) cmd({ c: 'rev', r: w.rv.length }, { r: w.rv.length }); break;
    case 'vote': case 'unvote': {
      const i = +el.dataset.i; if (!w || !w.v) break;
      const nv = w.v.slice(); nv[i] = Math.max(0, (nv[i] || 0) + (a === 'vote' ? 1 : -1));
      cmd({ c: a, i }, { v: nv }); break;
    }
    case 'step': { const i = +el.dataset.i; if (!w || !w.d) break; const nd = w.d.slice(); nd[i] = !nd[i]; cmd({ c: 'step', i, d: nd[i] }, { d: nd }); break; }
    case 'key': if (w && !w.h) cmd({ c: 'key' }, { h: true }); break;
    case 'tmr': if (P.tm) { const run = !P.tm.run; P.tm = { rem: tmNow(P.tm), at: Date.now(), run, over: false }; P.tmQ = P.q + 1; cmd({ c: 'tmr', run }); } break;
    case 'treset': P.tmQ = P.q + 1; cmd({ c: 'treset' }); break;
    case 'ring': if (P.rg) { const run = !P.rg.run, r = tmNow(P.rg); P.rg = { rem: r <= 0 && run ? P.rg.s : Math.max(0, r), at: Date.now(), run, s: P.rg.s }; P.rgQ = P.q + 1; cmd({ c: 'ring' }); } break;
    case 'pick': cmd({ c: 'pick' }); break;
    case 'pickx': cmd({ c: 'pickx' }); break;
    case 'play': cmd({ c: 'play' }); break;
    case 'back': cmd({ c: 'back' }); break;
    case 'open': cmd({ c: 'open' }); toast('يُفتح العرض على الشاشة…'); break;
    case 'list': openSheet(); break;
    case 'sheetx': closeSheet(); break;
    case 'more': P.more = !P.more; render(); break;
    case 'retry': if (P) { P.end = ''; P.bus.poke(); msg('wait', 'spin', 'يتصل بشاشة العرض…', 'لحظات، ويظهر هنا ما على الشاشة.'); rehello(); } break;
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a]'); if (!t || t.disabled) return;
  e.preventDefault(); act(t.dataset.a, t);
});
document.addEventListener('pointerdown', () => keepAwake(), { passive: true });

/* ---------- العرض ---------- */
function msg(k, icon, t, p, acts) {
  const app = $('app'); app.dataset.v = 'msg';
  $('live').hidden = true; $('dock').hidden = true; closeSheet();
  const m = $('msg'); m.hidden = false; m.dataset.k = k;
  setHTML($('msgIc'), ic(icon)); $('msgT').textContent = t; $('msgP').textContent = p || '';
  setHTML($('msgA'), (acts || []).map(a => `<button type="button" class="btn ${a[2] || ''}" data-a="${a[0]}">${H(a[1])}</button>`).join(''));
  paintNet();
}
function setHTML(el, h) { if (el._h !== h) { el._h = h; el.innerHTML = h; } }
function staticIcons() {
  $('pkb').innerHTML = ic('hand') + '<span>من يجيب؟</span>';
  $('lsb').innerHTML = ic('grid') + '<span>الشاشات</span>';
  $('notesS').innerHTML = ic('user') + '<span>للمعلم</span>';
  document.querySelector('[data-a="treset"]').innerHTML = ic('reset');
  $('sheetX').innerHTML = ic('close');
}
function render() {
  if (!P || P.end) return;
  const v = view();
  if (!v) return;
  const app = $('app');
  $('lsn').textContent = v.ttl || 'دليل المعلم الألمعي'; $('lsn').title = v.sub || '';
  if (!v.on) {
    /* العرض مغلق على الشاشة */
    const acts = v.id ? [['open', 'افتح العرض', 'pri']] : [];
    msg('off', 'screen', 'العرض مغلق على الشاشة', v.id ? `آخر درس: ${v.ttl || ''}. افتحه من هنا فيظهر على الشاشة من حيث توقفت.` : 'افتح العرض على الشاشة، فيظهر هنا.', acts);
    return;
  }
  app.dataset.v = 'live'; $('msg').hidden = true; $('live').hidden = false; $('dock').hidden = false;
  const deck = P.deck && P.deck.id === v.id ? P.deck.l : null;
  const pend = P.opt && P.opt.n && P.opt.n !== P.st.n;
  const now = $('now'); now.classList.toggle('pend', !!pend);
  const sc = v.sc || {};
  const kk = pend && deck ? (deck[v.n - 1] || [])[0] : sc.k;
  const tt = pend && deck ? (deck[v.n - 1] || [])[1] : sc.t;
  $('kind').textContent = kk || 'شاشة';
  $('count').textContent = v.n + ' / ' + v.N; $('count').setAttribute('aria-label', `الشاشة ${v.n} من ${v.N}`);
  $('title').textContent = tt || '';
  const stg = $('stage'); stg.hidden = pend || !sc.st || sc.st === sc.k; stg.textContent = sc.st ? 'المرحلة: ' + sc.st : '';
  const mk = v.id + '|' + v.n; if (P.moreKey !== mk) { P.moreKey = mk; P.more = false; }
  const txt = $('txt'), long = (sc.x || '').length > 260;
  setHTML(txt, pend ? '' : rich(sc.x)); txt.classList.toggle('clip', !pend && long && !P.more);
  const more = $('more'); more.hidden = pend || !long; more.textContent = P.more ? 'اختصر النص' : 'اقرأ النص كاملًا';
  const sk = $('skill'); sk.hidden = pend || !sc.sk; sk.textContent = sc.sk ? 'مهارة التفكير: ' + sc.sk : '';
  const keys = $('keys'); keys.hidden = !(v.keys && v.keys.length);
  setHTML(keys, (v.keys || []).map(k => `<span class="${k[1] ? 'on' : ''}">${ic(k[1] ? 'unlock' : 'lock')}${H(k[0])}</span>`).join(''));
  setHTML($('it'), pend ? '' : itHTML(v));
  const pk = $('pick'); pk.hidden = !v.pk;
  if (v.pk) setHTML(pk, `<span><small>على الشاشة الآن</small><b>${H(v.pk)}</b></span><button type="button" class="btn" data-a="pickx">إخفاء</button>`);
  /* المؤقت */
  const tmr = $('timer'); tmr.hidden = !P.tm;
  if (P.tm) { $('tmn').textContent = v.tm ? `مؤقت المرحلة · ${v.tm.nm}${v.tm.mn ? ' · ' + v.tm.mn + ' د' : ''}` : 'مؤقت المرحلة'; paintTimers(); }
  /* درج المعلم */
  notes(v);
  /* التنقل: تحت كل زر نوع الشاشة التي يذهب إليها */
  const nx = $('next'), pv = $('prev');
  const kd = n => deck && deck[n - 1] ? deck[n - 1][0] : '';
  nx.disabled = v.n >= v.N; pv.disabled = v.n <= 1;
  setHTML(nx, `<span>التالي${!nx.disabled && kd(v.n + 1) ? `<small>${H(kd(v.n + 1))}</small>` : (nx.disabled ? '<small>آخر شاشة</small>' : '')}</span>${ic('next')}`);
  setHTML(pv, `${ic('prev')}<span>السابق${!pv.disabled && kd(v.n - 1) ? `<small>${H(kd(v.n - 1))}</small>` : ''}</span>`);
  nx.setAttribute('aria-label', nx.disabled ? 'التالي: هذه آخر شاشة' : 'الشاشة التالية'); pv.setAttribute('aria-label', 'الشاشة السابقة');
  if (!$('sheet').hidden) drawDeck();
  paintNet();
}
function itHTML(v) {
  const w = v.it; let h = '';
  if (v.act) h += `<div class="it-h"><b>أدوات الحصة مفتوحة على الشاشة</b></div><div class="row"><button type="button" class="btn" data-a="back">${ic('back')}عودة إلى العرض</button></div>`;
  if (!w) return h;
  if (w.rg && P.rg) h += `<div class="it-h"><b>مؤقت النشاط</b><small>${w.rg.s} ث</small></div><div class="ring"><b id="rgv">${fmt(tmNow(P.rg))}</b><button type="button" class="btn ${P.rg.run ? '' : 'pri'}" data-a="ring">${P.rg.run ? ic('pause') + 'إيقاف' : ic('play') + (P.rg.rem <= 0 ? 'من جديد' : 'ابدأ العدّ')}</button></div>`;
  if (w.ty === 'vote' && w.o) {
    const tot = (w.v || []).reduce((a, b) => a + b, 0), mx = Math.max(1, ...(w.v || [0]));
    h += `<div class="it-h"><b>التصويت</b><small>${tot ? 'المجموع: ' + tot : 'المس + لكل يد مرفوعة'}</small></div><div class="votes">` +
      w.o.map((o, i) => { const c = (w.v || [])[i] || 0; return `<div class="vo ${c === mx && c > 0 ? 'lead' : ''}" style="--p:${tot ? Math.round(c / tot * 100) : 0}%"><i>${LETTERS[i] || i + 1}</i><span>${H(o)}</span><b>${c}</b><button type="button" data-a="unvote" data-i="${i}" ${c ? '' : 'disabled'} aria-label="أنقص صوتًا من ${H(o)}">−</button><button type="button" class="plus" data-a="vote" data-i="${i}" aria-label="أضف صوتًا إلى ${H(o)}">+</button></div>`; }).join('') + '</div>';
  }
  if (w.rv && w.rv.length) {
    const n = w.rv.length, r = Math.min(n, w.r || 0);
    h += `${w.ty === 'vote' ? '<div style="height:12px"></div>' : ''}<div class="it-h"><b>${w.ty === 'vote' ? 'ماذا بعد التصويت؟' : 'الكشف'}</b><small>${r ? `كُشف ${r} من ${n}` : 'لم يُكشف شيء بعد'}</small></div>` +
      `<ol class="parts">${w.rv.map((p, i) => `<li class="${i < r ? 'done' : i === r ? 'next' : ''}"><i>${i < r ? ic('check') : i + 1}</i><span>${rich(p)}</span></li>`).join('')}</ol>` +
      (r < n ? `<div class="row"><button type="button" class="btn pri" data-a="rev">${ic('eye')}${r ? `اكشف التالي (${r + 1} من ${n})` : (n > 1 ? `اكشف الأول (1 من ${n})` : 'اكشف')}</button>${n > 1 && n - r > 1 ? '<button type="button" class="btn" data-a="revall">اكشف الكل</button>' : ''}</div>` : '') +
      `<p class="priv">${ic('eye')}<span>${r < n ? 'تراها هنا وحدك قبل أن تكشفها على الشاشة.' : 'كُشف كل شيء على الشاشة.'}</span></p>`;
  }
  if (w.ty === 'steps' && w.s) {
    const dn = (w.d || []).filter(Boolean).length;
    h += `<div class="it-h"><b>الخطوات</b><small>${dn} من ${w.s.length}</small></div><div class="steps">` +
      w.s.map((s, i) => `<button type="button" class="st ${w.d && w.d[i] ? 'done' : ''}" data-a="step" data-i="${i}" aria-pressed="${!!(w.d && w.d[i])}"><i>${w.d && w.d[i] ? ic('check') : i + 1}</i><span>${H(s)}</span></button>`).join('') + '</div>';
  }
  if (w.ty === 'key' && w.k) h += `${w.rv && w.rv.length ? '<div style="height:12px"></div>' : ''}<button type="button" class="keyb ${w.h ? 'got' : ''}" data-a="key" ${w.h ? 'disabled' : ''}>${ic(w.h ? 'unlock' : 'key')}<span><small>${w.h ? 'حصل الصف على مفتاح' : 'امنح الصف مفتاح'}</small><b>${H(w.k)}</b></span></button>`;
  if (w.ty === 'play' && !v.act) h += `<div class="it-h"><b>نشاط تفاعلي</b>${w.pt ? `<small>${H(w.pt)}</small>` : ''}</div><div class="row"><button type="button" class="btn pri" data-a="play">${ic('play')}ابدأ النشاط على الشاشة</button></div>`;
  return h;
}
function notes(v) {
  const el = $('notes'), nb = $('nb');
  const d = P.notes && P.notes.k === v.id + '|' + v.n ? P.notes.d : null;
  if (!d) { el.hidden = true; return; }
  const row = (t, p, c) => p ? `<div class="nr ${c || ''}"><b>${H(t)}</b><p>${rich(p)}</p></div>` : '';
  const html = (d.h ? `<div class="nr hd"><b>${H(d.h[0])}</b>${d.h[1] ? `<p>${H(d.h[1])}</p>` : ''}</div>` : '') +
    row('ملاحظتي لهذه الشاشة', d.my, 'my') + (d.r || []).map(x => row(x[0], x[1])).join('') +
    row('التمايز: دعم', (d.df || [])[0]) + row('التمايز: إثراء', (d.df || [])[1]);
  el.hidden = !html;
  if (nb.dataset.k !== P.notes.k + P.notes.v) { nb.dataset.k = P.notes.k + P.notes.v; nb.innerHTML = html; }
}
function paintTimers() {
  if (!P) return;
  const t = P.tm, tmr = $('timer');
  if (t && !tmr.hidden) {
    const r = tmNow(t);
    $('tmv').textContent = fmt(r);
    tmr.classList.toggle('run', t.run); tmr.classList.toggle('over', t.run && r <= 0);
    const b = $('tmb'); const want = t.run ? 'pause' : 'play';
    if (b.dataset.i !== want) { b.dataset.i = want; b.innerHTML = ic(want); b.setAttribute('aria-label', t.run ? 'أوقف مؤقت المرحلة' : 'شغّل مؤقت المرحلة'); }
  }
  const g = $('rgv'); if (g && P.rg) g.textContent = fmt(tmNow(P.rg));
}
/* ---------- قائمة الشاشات ---------- */
function drawDeck() {
  const v = view(); const deck = P.deck && v && P.deck.id === v.id ? P.deck.l : [];
  $('deck').innerHTML = deck.map((x, i) => `<li><button type="button" data-a="go" data-n="${i + 1}" class="${i + 1 === v.n ? 'cur' : ''}" ${i + 1 === v.n ? 'aria-current="true"' : ''}><i>${i + 1}</i><span><small>${H(x[0])}</small><b>${H(x[1])}</b></span></button></li>`).join('');
}
function openSheet() {
  if (!P || !P.st) return;
  if (!P.deck || P.deck.id !== P.st.id) askSync(true);
  drawDeck(); $('sheet').hidden = false;
  const c = $('deck').querySelector('.cur'); if (c) { c.scrollIntoView({ block: 'center' }); try { c.focus({ preventScroll: true }); } catch (e) {} }
}
function closeSheet() { const s = $('sheet'); if (s && !s.hidden) { s.hidden = true; const b = $('lsb'); if (b && !$('live').hidden) try { b.focus({ preventScroll: true }); } catch (e) {} } }
$('sheet').addEventListener('click', e => { if (e.target === e.currentTarget) closeSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

/* ---------- الحالة والاتصال ---------- */
function paintNet() {
  const el = $('net'); if (!el || !P) return;
  const dc = !!(P.direct && P.direct.isOpen);
  const alive = dc || (!P.stale && Date.now() - P.seen < (P.tx.via === 'ntfy' ? 330000 : 60000));
  let k = 'wait', t = 'يتصل…', lab = 'يتصل بشاشة العرض';
  if (P.end) { k = 'bad'; t = 'غير متصل'; lab = t; }
  else if (!navigator.onLine && !dc) { k = 'bad'; t = 'لا إنترنت'; lab = 'الجوال غير متصل بالإنترنت'; }
  else if (P.paired && alive) { k = 'on'; t = dc ? 'مباشر' : 'متصل'; lab = dc ? 'متصل بالشاشة مباشرة عبر الشبكة المحلية' : 'متصل بالشاشة عبر الإنترنت'; }
  else if (P.paired) { k = 'wait'; t = 'يعيد الاتصال…'; lab = P.stale ? 'لم يصل آخر أمر إلى الشاشة، والجوال يعيد الاتصال' : 'لم يصل من الشاشة شيء منذ دقيقة، والجوال يعيد المحاولة'; }
  if (el.dataset.k !== k) el.dataset.k = k;
  const tt = $('netT'); if (tt.textContent !== t) tt.textContent = t;
  el.setAttribute('aria-label', lab); el.title = lab;
}
function tick() {
  if (!P || P.end) return;
  paintTimers();
  const now = Date.now();
  if (P.opt && now - P.opt.at > 5000) { P.opt = null; P.stale = true; render(); toast('لم يصل الأمر إلى الشاشة بعد. تحقّق من الاتصال.'); askSync(true); P.bus.poke(); }
  if (P.paired) {
    const dc = P.direct && P.direct.isOpen;
    /* سكتت الشاشة (دقيقة، أو خمس دقائق عبر ntfy): تحية جديدة كل عشرين ثانية حتى ترد */
    const quiet = P.tx.via === 'ntfy' ? 330000 : 60000;
    if (!dc && !P.helloing && now - P.seen > quiet && now - P.lastRe > 20000) { P.lastRe = now; P.bus.poke(); rehello(); }
    if (now - P.tx.last > (dc ? 15000 : P.bus.slow() ? 160000 : 45000)) P.tx.send({ t: 'hb' }, dc ? null : { pref: 'nostr' });
  }
  paintNet();
}
async function keepAwake() {
  if (!P || !P.paired || P.end || wake || document.hidden || !('wakeLock' in navigator)) return;
  try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch (e) { wake = null; }
}
function releaseWake() { try { if (wake) wake.release(); } catch (e) {} wake = null; }
function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('show'), 2800); }
/* عودة الجوال من الخلفية أو من قفل الشاشة: يعود الاتصال وتُطلب الحالة من جديد */
document.addEventListener('visibilitychange', () => {
  if (!P || (P.end && P.end !== 'gone')) return;
  if (P.end === 'gone' && !document.hidden) { act('retry'); return; }
  if (document.hidden) { hiddenAt = Date.now(); return; }
  if (hiddenAt && Date.now() - hiddenAt > 20000) P.bus.refresh(); else P.bus.poke();
  keepAwake();
  if (Date.now() - hiddenAt > 4000 || Date.now() - P.seen > 15000) rehello();
});
window.addEventListener('online', () => { if (P && P.end === 'gone') act('retry'); else if (P && !P.end) { P.bus.poke(); rehello(); } paintNet(); });
window.addEventListener('offline', paintNet);
window.addEventListener('hashchange', () => location.reload());

start();
