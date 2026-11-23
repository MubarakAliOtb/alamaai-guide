/* «التحكم من الجوال» — جهة شاشة العرض. يحمّلها remote/boot.js عند الحاجة.
   - رمز الربط: رابط صفحة الجوال ومعه رقم الجلسة والمفتاح العام للشاشة. أول جوال يمسحه يُربط، ومن جاء بعده يُرفض.
   - الحالة: الشاشة الحالية وتفاعلها والمؤقت وملاحظات المعلم تُرسل إلى الجوال كلما تغيّرت (وتُفحص كل ثانية فيصل ما يفعله المعلم على الشاشة نفسها).
   - الأوامر: تُنفَّذ بالضغط على أزرار العرض نفسها (data-ls)، فتعمل كما لو ضغطها المعلم بيده.
   حالة العرض وتنفيذ الأوامر من جسر almShow في index.html (شيفرة الصفحة داخل نطاق مغلق).
   الجلسة محفوظة في sessionStorage لهذه النافذة وحدها (alm:rc)، فتستمر بعد إعادة تحميل الصفحة وتنتهي بإغلاقها. */
import * as RC from './rc.js';
import { qrcode } from './qr.js';

const SKEY = 'alm:rc';
const CANON = 'https://mubarakaliotb.github.io/alamaai-guide/remote/';
const boot = () => window.almRCBoot || { set() {}, inject() {} };
let S = null;                 /* الجلسة */
let ui = false;               /* لوحة الربط مفتوحة؟ */
let lastId = '', pushT = 0, tickT = 0, p2pT = 0, p2pN = 0, idleT = 0;

const H = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const cut = (s, n) => { s = String(s == null ? '' : s).trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const hash = s => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
const int = (v, a, b) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(a, Math.min(b, v)) : a; };
const curLx = () => document.querySelector('#lsOv .lx[data-id]');
const SHOW = () => window.almShow;
function say(m) { try { SHOW().say(m); } catch (e) {} }

/* ---------- الجلسة ---------- */
async function create() {
  const sid = RC.newSid();
  S = { sid, ecdh: await RC.ecdhNew(), nsk: RC.nostrKey(), topic: await RC.topicOf(sid), peer: null, intr: new Map(), last: {}, lastIntr: 0 };
  connect(); await save();
}
async function restore() {
  let o = null; try { o = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) {}
  if (!o || !RC.sidOk(o.sid)) return false;
  try {
    S = { sid: o.sid, ecdh: await RC.ecdhLoad(o.k), nsk: RC.unhex(o.n), topic: await RC.topicOf(o.sid), peer: null, intr: new Map(), last: {}, lastIntr: 0 };
    lastId = o.lastId || '';
    connect();
    if (o.peer && o.peer.k) {
      const raw = RC.unb64u(o.peer.k);
      if (RC.pubOk(raw)) { await pair(raw, o.peer.d || '', await RC.deriveKey(S.ecdh.priv, raw, S.sid, S.ecdh.pub, raw), null); push(true); }
    }
    return true;
  } catch (e) { try { sessionStorage.removeItem(SKEY); } catch (_) {} stopAll(S); S = null; return false; }
}
async function save() {
  if (!S) return;
  try { sessionStorage.setItem(SKEY, JSON.stringify({ sid: S.sid, k: await RC.ecdhSave(S.ecdh), n: RC.hex(S.nsk), peer: S.peer ? { k: RC.b64u(S.peer.raw), d: S.peer.dev } : null, lastId })); } catch (e) {}
}
function connect() {
  S.bus = new RC.Bus({ topic: S.topic, nsk: S.nsk, onMsg: onRaw, onStatus: paint });
  S.direct = RC.Direct.ok() ? new RC.Direct({ onMsg: t => onRaw(t, 'dc'), onChange: onDirect, signal: b => { if (S && S.peer) S.peer.tx.send(b, { relay: true }); } }) : null;
  S.bus.start();
  clearInterval(tickT); tickT = setInterval(tick, 1000);
  paint();
}
async function pair(raw, dev, key, rx) {
  const p = RC.pidOf(raw);
  S.peer = { raw, p, key, dev: cut(dev, 40), rx: rx || new RC.Receiver(), tx: new RC.Sender({ key, f: 's', p, bus: S.bus, direct: S.direct }), seen: 0 };
  S.last = {};
  await save();
}
function stopAll(s) { if (!s) return; try { if (s.direct) s.direct.close(); } catch (e) {} try { if (s.bus) s.bus.stop(); } catch (e) {} }
/* إنهاء الجلسة كلها؛ bye: يُبلَّغ الجوال المربوط أولًا */
function end(bye) {
  const s = S; if (!s) return; S = null;
  clearInterval(tickT); clearTimeout(p2pT); clearTimeout(idleT); clearTimeout(pushT);
  try { sessionStorage.removeItem(SKEY); } catch (e) {}
  if (bye && s.peer) s.peer.tx.send({ t: 'bye' }).then(() => setTimeout(() => stopAll(s), 1500)); else stopAll(s);
  paint();
}

/* ---------- الاستقبال ---------- */
async function onRaw(text, via) {
  if (!S) return;
  let m; try { m = JSON.parse(text); } catch (e) { return; }
  if (!m || m.v !== 1 || m.t !== 'e' || typeof m.p !== 'string') return;
  if (m.f === 'h') return hello(m, via);
  if (m.f !== 'p' || !S.peer || m.p !== S.peer.p) return;
  const b = await S.peer.rx.take(S.peer.key, m);
  if (!b || !S || !S.peer) return;
  saw(via);
  if (b.t === 'c') { try { run(b); } catch (e) {} S.peer.ack = Math.max(S.peer.ack || 0, +b.q || 0); push(false); }
  else if (b.t === 'sync') { S.last = {}; push(true); }
  else if (b.t === 'an') { if (S.direct) S.direct.onAnswer(b); }
  else if (b.t === 'hi') welcome();
  else if (b.t === 'bye') { S.peer = null; S.last = {}; if (S.direct) S.direct.close(); save(); say('فصل الجوال الاتصال بالعرض'); paint(); }
}
/* الجوال حاضر: قناة مباشرة مفتوحة، أو وصل منه شيء قريبًا (ونبضاته عبر ntfy متباعدة) */
function alive() { const P = S && S.peer; return !!P && ((S.direct && S.direct.isOpen) || Date.now() - P.seen < (P.tx.via === 'ntfy' ? 330000 : 120000)); }
function saw(via) { const P = S.peer; P.seen = Date.now(); if (via !== 'dc') P.tx.via = via; paint(); }
/* تحية جوال: مفتاحه العام ظاهر، ومعه رسالة مختومة بالمفتاح المشترك تثبت أنه يملك المفتاح الخاص المقابل */
async function hello(m, via) {
  let raw; try { raw = RC.unb64u(m.k); } catch (e) { return; }
  if (!RC.pubOk(raw) || RC.pidOf(raw) !== m.p) return;
  if (S.peer && S.peer.p === m.p) {
    const b = await S.peer.rx.take(S.peer.key, m);
    if (b && b.t === 'hi' && S && S.peer) { saw(via); welcome(); }
    return;
  }
  let x = S.intr.get(m.p);
  if (!x) { x = { key: await RC.deriveKey(S.ecdh.priv, raw, S.sid, S.ecdh.pub, raw), rx: new RC.Receiver() }; if (S.intr.size > 24) S.intr.clear(); S.intr.set(m.p, x); }
  const b = await x.rx.take(x.key, m);
  if (!b || b.t !== 'hi' || !S) return;
  /* تحيتان من الجوال نفسه وصلتا معًا: الأولى ربطته، فالثانية ترحيب لا رفض */
  if (S.peer && S.peer.p === m.p) { saw(via); welcome(); return; }
  if (!S.peer) {
    S.intr.delete(m.p);
    await pair(raw, String(b.d || ''), x.key, x.rx);
    saw(via); welcome();
    if (ui) closePanel(true);
    say('تم ربط الجوال: تحكّم بالعرض منه الآن');
    return;
  }
  /* جوال آخر والعرض مربوط: يُرفض برسالة مختومة لا يقرؤها غيره */
  const tx = new RC.Sender({ key: x.key, f: 's', p: m.p, bus: S.bus }); tx.via = via;
  tx.send({ t: 'busy' });
  const now = Date.now();
  if (now - S.lastIntr > 15000) { S.lastIntr = now; say('جهاز آخر حاول الاتصال بالعرض وتم رفضه'); }
}
function welcome() {
  if (!S || !S.peer) return;
  S.peer.tx.send({ t: 'ok', d: S.peer.dev });
  S.last = {}; push(true);
  p2pN = 0; clearTimeout(p2pT);
  if (S.direct && !S.direct.isOpen) p2pT = setTimeout(p2p, 700);
}

/* ---------- الاتصال المباشر: محاولة، ثم إعادة بمهلة متزايدة ما دام الجوال مربوطًا ---------- */
function p2p() {
  clearTimeout(p2pT);
  if (!S || !S.peer || !S.direct || S.direct.isOpen) return;
  S.direct.offer();
  p2pT = setTimeout(() => { p2pN++; p2p(); }, [20000, 45000, 90000, 180000][Math.min(p2pN, 3)]);
}
function onDirect() {
  paint();
  if (!S || !S.direct) return;
  if (S.direct.isOpen) { clearTimeout(p2pT); p2pN = 0; push(true); }
  else if (S.peer) { clearTimeout(p2pT); p2pT = setTimeout(p2p, 5000); }
}

/* ---------- الحالة المرسلة إلى الجوال ---------- */
function collect() {
  const c = SHOW().state(lastId);
  if (c.st.on && c.st.id && c.st.id !== lastId) { lastId = c.st.id; save(); }
  return c;
}
/* يُرسل ما تغيّر فقط؛ وقائمة الشاشات والملاحظات حين تتغير أو يطلبها الجوال */
let pushF = false;
function push(force) {
  clearTimeout(pushT);
  pushF = pushF || !!force;
  pushT = setTimeout(() => {
    force = pushF; pushF = false;
    if (!S || !S.peer) return;
    let c; try { c = collect(); } catch (e) { return; }
    const st = c.st;
    st.ack = S.peer.ack || 0;   /* آخر أمر نُفِّذ: يعرف به الجوال أن ضغطته وصلت */
    /* المؤقت الجاري لا يُعدّ تغيّرًا كل ثانية: الجوال يعدّ وحده من آخر قيمة وصلته */
    const nm = JSON.parse(JSON.stringify(st));
    if (nm.tm && nm.tm.run) nm.tm.rem = 0;
    if (nm.it && nm.it.rg && nm.it.rg.run) nm.it.rg.rem = 0;
    const sig = hash(JSON.stringify(nm));
    const dk = st.id + '|' + st.dv, nk = st.id + '|' + st.n + '|' + st.nv;
    const needDeck = !!st.id && S.last.deck !== dk, needNotes = !!st.nv && S.last.notes !== nk;
    if (!force && !needDeck && !needNotes && sig === S.last.sig) return;
    if (c.deck && (force || needDeck)) { st.dk = c.deck; S.last.deck = dk; }
    if (c.notes && (force || needNotes)) { st.nt = c.notes; S.last.notes = nk; }
    S.last.sig = sig;
    S.peer.tx.send(st);
  }, pushF ? 0 : 40);
}
function tick() {
  if (!S) return;
  if (S.peer) {
    push(false);
    const P = S.peer, idle = Date.now() - P.tx.last;
    /* نبضة دورية؛ وعبر Nostr دائمًا إن أمكن، فيعود الطرفان إليه بعد أي لجوء مؤقت إلى ntfy */
    const dc = S.direct && S.direct.isOpen;
    if (idle > (dc ? 15000 : S.bus.slow() ? 150000 : 25000)) P.tx.send({ t: 'hb', on: !!curLx() }, dc ? null : { pref: 'nostr' });
  }
  paint();
}

/* ---------- تنفيذ الأوامر (بأزرار العرض نفسها، عبر الجسر) ---------- */
function run(c) { if (c.c === 'open') SHOW().reopen(lastId); else SHOW().run(c); }

/* ---------- لوحة الربط ---------- */
function linkUrl() {
  const base = /^https?:$/.test(location.protocol) ? new URL('remote/', location.href).href : CANON;
  return base + '#' + S.sid + '.' + RC.b64u(S.ecdh.pub);
}
function qrSvg(url) {
  const q = qrcode(0, 'M'); q.addData(url); q.make();
  const n = q.getModuleCount(), z = 4, W = n + z * 2; let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + z) + ' ' + (r + z) + 'h1v1h-1z';
  return `<svg viewBox="0 0 ${W} ${W}" role="img" aria-label="رمز ربط الجوال بالعرض" shape-rendering="crispEdges"><rect width="${W}" height="${W}" fill="#FFFFFF"/><path d="${d}" fill="#1E1B4B"/></svg>`;
}
function netText() {
  if (!S) return '';
  const b = S.bus ? S.bus.state() : { nostr: 0, ntfy: false };
  if (S.peer) {
    if (S.direct && S.direct.isOpen) return 'متصل مباشرة عبر الشبكة المحلية';
    return alive() ? 'متصل عبر الإنترنت' : 'لم يصل من الجوال شيء منذ مدة';
  }
  return b.nostr || b.ntfy ? 'بانتظار الجوال…' : 'يجهّز الاتصال…';
}
function card() {
  if (!S) return '';
  if (!S.peer) {
    const url = linkUrl();
    return `<div class="rc-card" role="dialog" aria-modal="true" aria-labelledby="rcT">
  <header><b id="rcT">تحكّم بالعرض من جوالك</b><button type="button" class="rc-x" data-rc="close" aria-label="أغلق">${X_IC}</button></header>
  <div class="rc-in"><div class="rc-qr" data-rc-url="${H(url)}">${qrSvg(url)}</div>
   <div class="rc-side"><ol class="rc-steps"><li>افتح كاميرا الجوال ووجّهها إلى الرمز.</li><li>اضغط الرابط الذي يظهر فوقه.</li><li>تنقّل بين الشاشات، واكشف الإجابات، وشغّل المؤقت من جوالك.</li></ol>
    <p class="rc-st" data-k="wait"><i></i><span data-rc-net>${H(netText())}</span></p>
    <p class="rc-note">يُربط أول جوال يمسح الرمز وحده، والاتصال مشفّر بين الجهازين.</p></div></div></div>`;
  }
  const live = (S.direct && S.direct.isOpen) || alive();
  return `<div class="rc-card rc-sm" role="dialog" aria-modal="true" aria-labelledby="rcT">
  <header><b id="rcT">التحكم من الجوال</b><button type="button" class="rc-x" data-rc="close" aria-label="أغلق">${X_IC}</button></header>
  <div class="rc-on"><p class="rc-st" data-k="${live ? 'on' : 'lost'}"><i></i><span data-rc-net>${H(netText())}</span></p>
   ${S.peer.dev ? `<p class="rc-dev">الجهاز: ${H(S.peer.dev)}</p>` : ''}
   <div class="rc-acts"><button type="button" class="rc-b rc-pri" data-rc="close">متابعة العرض</button><button type="button" class="rc-b" data-rc="new">ربط جوال آخر</button><button type="button" class="rc-b rc-warn" data-rc="end">إنهاء الاتصال</button></div></div></div>`;
}
const X_IC = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
function css() {
  if (document.getElementById('rcCss')) return;
  const s = document.createElement('style'); s.id = 'rcCss';
  s.textContent = `#lsOv .rc-pan{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:16px;background:rgba(20,18,58,.5);direction:rtl;font-family:"Alm Sans Arabic",Tahoma,sans-serif;color:#1E1B4B}
#lsOv .rc-pan .rc-card{background:#FFFFFF;color:#1E1B4B;border:1px solid #E7E5F2;border-radius:22px;box-shadow:0 30px 70px rgba(20,18,58,.3);width:min(820px,100%);max-height:calc(100vh - 32px);overflow:auto;text-align:start}
#lsOv .rc-pan .rc-card.rc-sm{width:min(520px,100%)}
#lsOv .rc-pan header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 24px;border-bottom:1px solid #E7E5F2}
#lsOv .rc-pan header b{font-size:clamp(20px,1.6vw,26px);font-weight:700;color:#1E1B4B}
#lsOv .rc-pan .rc-x{display:grid;place-items:center;width:44px;height:44px;border-radius:50%;border:1px solid #D4D1E6;background:#FFFFFF;color:#1E1B4B;cursor:pointer;padding:0}
#lsOv .rc-pan .rc-x:hover{background:#F5F3FF}
#lsOv .rc-pan .rc-in{display:flex;gap:28px;align-items:center;padding:24px}
#lsOv .rc-pan .rc-qr{flex:none;width:min(340px,42vw,52vh);padding:10px;border:1px solid #E7E5F2;border-radius:18px;background:#FFFFFF}
#lsOv .rc-pan .rc-qr svg{display:block;width:100%;height:auto}
#lsOv .rc-pan .rc-side{flex:1;min-width:0}
#lsOv .rc-pan .rc-steps{list-style:none;margin:0 0 18px;padding:0;counter-reset:rc;display:grid;gap:12px}
#lsOv .rc-pan .rc-steps li{counter-increment:rc;display:flex;gap:12px;align-items:flex-start;font-size:clamp(17px,1.25vw,21px);line-height:1.7;color:#1E1B4B}
#lsOv .rc-pan .rc-steps li::before{content:counter(rc);flex:none;display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#EDE9FE;color:#5B21B6;font-weight:700;font-size:16px;margin-top:2px}
#lsOv .rc-pan .rc-st{display:flex;align-items:center;gap:10px;margin:0 0 10px;font-size:clamp(16px,1.15vw,19px);font-weight:700;color:#1E1B4B}
#lsOv .rc-pan .rc-st i{flex:none;width:12px;height:12px;border-radius:50%;background:#F59E0B}
#lsOv .rc-pan .rc-st[data-k="wait"] i{animation:rcPulse 1.4s ease-in-out infinite}
#lsOv .rc-pan .rc-st[data-k="on"] i{background:#10B981}
#lsOv .rc-pan .rc-note,#lsOv .rc-pan .rc-dev{margin:0;font-size:15px;line-height:1.7;color:#5B5880}
#lsOv .rc-pan .rc-on{padding:22px 24px}
#lsOv .rc-pan .rc-dev{margin-bottom:16px}
#lsOv .rc-pan .rc-acts{display:flex;flex-wrap:wrap;gap:10px}
#lsOv .rc-pan .rc-b{font:inherit;font-size:16px;font-weight:700;min-height:46px;padding:0 20px;border-radius:999px;border:1.5px solid #D4D1E6;background:#FFFFFF;color:#1E1B4B;cursor:pointer}
#lsOv .rc-pan .rc-b:hover{background:#F5F3FF}
#lsOv .rc-pan .rc-b.rc-pri{background:#6D28D9;border-color:#6D28D9;color:#FFFFFF}
#lsOv .rc-pan .rc-b.rc-pri:hover{background:#5B21B6}
#lsOv .rc-pan .rc-b.rc-warn{color:#B42318;border-color:#F3C5C0}
#lsOv .rc-pan :is(button):focus-visible{outline:3px solid #6D28D9;outline-offset:2px}
@media (max-width:640px),(max-aspect-ratio:3/4){#lsOv .rc-pan .rc-in{flex-direction:column;align-items:stretch}#lsOv .rc-pan .rc-qr{width:min(300px,100%);margin:0 auto}}
@media (prefers-reduced-motion:reduce){#lsOv .rc-pan .rc-st i{animation:none!important}}`;
  document.head.appendChild(s);
}
function panelEl() { return document.querySelector('#lsOv .rc-pan'); }
function drawPanel() {
  const ov = document.getElementById('lsOv'); if (!ui || !ov || !S) return;
  css();
  let el = panelEl();
  const fresh = !el;
  if (!el) { el = document.createElement('div'); el.className = 'rc-pan'; }
  el.innerHTML = card();
  if (el.parentNode !== ov) ov.appendChild(el);
  el.inert = false;
  if (fresh) { const x = el.querySelector('.rc-x'); if (x) try { x.focus({ preventScroll: true }); } catch (e) {} }
}
function openPanel() {
  if (!curLx()) return;
  ui = true; clearTimeout(idleT); drawPanel(); paint();
}
function closePanel(quiet) {
  ui = false; const el = panelEl();
  const inside = !!(el && el.contains(document.activeElement));
  if (el) el.remove();
  if (!quiet || inside) { const b = document.querySelector('#lsOv .rc-tb'); if (b) try { b.focus({ preventScroll: true }); } catch (e) {} }
  /* جلسة لم يُربط بها جوال تُغلق بعد دقيقتين من إغلاق اللوحة */
  clearTimeout(idleT);
  if (S && !S.peer) idleT = setTimeout(() => { if (S && !S.peer && !ui) end(false); }, 120000);
  paint();
}
function paint() {
  let st = 'off';
  if (S) st = !S.peer ? 'wait' : ((S.direct && S.direct.isOpen) || alive() ? 'on' : 'lost');
  boot().set(st);
  if (!ui) return;
  const el = panelEl();
  if (!el || !S) return;
  /* انتقلت اللوحة من «بانتظار الجوال» إلى «متصل» أو العكس: تُرسم من جديد */
  const paired = !!el.querySelector('.rc-on');
  if (paired !== !!S.peer) { drawPanel(); return; }
  const n = el.querySelector('[data-rc-net]'); if (n) { const t = netText(); if (n.textContent !== t) n.textContent = t; }
  const p = el.querySelector('.rc-st'); if (p && S.peer) p.dataset.k = (S.direct && S.direct.isOpen) || alive() ? 'on' : 'lost';
}

document.addEventListener('click', e => {
  const t = e.target && e.target.closest ? e.target.closest('#lsOv [data-rc]') : null; if (!t) return;
  const a = t.dataset.rc; if (a === 'open') return;   /* زر الشريط يعالجه boot.js */
  e.preventDefault(); e.stopPropagation();
  if (a === 'close') closePanel(false);
  else if (a === 'end') { end(true); closePanel(true); say('انتهى الاتصال بالجوال'); }
  else if (a === 'new') { end(true); create().then(() => { ui = true; drawPanel(); paint(); }); }
});
/* الضغط خارج البطاقة يغلق اللوحة */
document.addEventListener('pointerdown', e => { if (ui && e.target && e.target.classList && e.target.classList.contains('rc-pan')) closePanel(false); });
window.addEventListener('keydown', e => {
  if (!ui) return;
  if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); closePanel(false); return; }
  if (e.key === 'Tab') {
    const el = panelEl(); if (!el) return;
    const f = [...el.querySelectorAll('button')]; if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (i < 0 || (e.shiftKey && i === 0) || (!e.shiftKey && i === f.length - 1)) { e.preventDefault(); e.stopImmediatePropagation(); f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i < 0 || i === f.length - 1 ? 0 : i + 1)].focus(); }
  }
}, true);
/* عودة النافذة إلى الواجهة: يُعاد الاتصال بالمرحّلات فورًا */
let hidAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hidAt = Date.now(); return; }
  if (S && S.bus) { if (hidAt && Date.now() - hidAt > 20000) S.bus.refresh(); else S.bus.poke(); }
});
window.addEventListener('online', () => { if (S && S.bus) S.bus.poke(); });

/* استئناف جلسة هذه النافذة؛ والزر ينتظر انتهاءه فلا تُنشأ جلسة ثانية فوقها */
const ready = restore().catch(() => false);
window.almRC = {
  async toggle() {
    if (!RC.supported()) { say('متصفح هذه الشاشة لا يدعم التحكم من الجوال. افتح الدليل في متصفح أحدث.'); return; }
    await ready;
    if (ui) { closePanel(false); return; }
    if (!S) await create();
    openPanel();
  },
  rendered() { boot().inject(); if (ui) drawPanel(); paint(); if (S && S.peer) push(false); },
  /* تغيّر المؤقت أو «من يجيب؟»: يصل الجوال فورًا لا بعد ثانية */
  changed() { if (S && S.peer) push(false); },
  closed() {
    if (ui) { ui = false; clearTimeout(idleT); if (S && !S.peer) idleT = setTimeout(() => { if (S && !S.peer && !ui) end(false); }, 120000); }
    if (S && S.peer) push(true);
    paint();
  }
};
ready.then(ok => { if (!ok && !S) paint(); });
