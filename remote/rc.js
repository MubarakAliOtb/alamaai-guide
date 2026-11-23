/* «التحكم من الجوال» — النواة المشتركة بين شاشة العرض (remote/screen.js) والجوال (remote/remote.js).
   - المفاتيح والتشفير: ECDH (P-256) بين الجهازين، ثم مفتاح AES-GCM لا يعرفه غيرهما. كل رسالة مختومة، ومعها رقم تسلسلي يمنع إعادة إرسالها.
   - الوسيط: مرحّلات Nostr العامة (رسائل عابرة من النوع 25050 لا تُحفظ)، وntfy.sh احتياطًا إن لم يتصل منها شيء.
     الوسيط لا يرى إلا نصًّا مشفّرًا ووسمًا عشوائيًّا.
   - الاتصال المباشر: WebRTC بين الجهازين حين تسمح الشبكة، فتمر الأوامر بلا وسيط؛ وإن انقطع عادت إلى الوسيط بلا توقف.
   وحدة ES تعمل في المتصفحات الحديثة (BigInt وWebCrypto). */
import { schnorr } from './secp.js';

const te = new TextEncoder(), td = new TextDecoder();
const SUB = () => crypto.subtle;

export const RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.primal.net', 'wss://offchain.pub', 'wss://nostr.mom'];
export const NTFY = 'https://ntfy.sh';
export const STUN = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun.cloudflare.com:3478'] }];
const KIND = 25050;            /* نطاق الرسائل العابرة 20000–29999: يمررها المرحّل ولا يحفظها */
const MAX = { dc: 16000, nostr: 8000, ntfy: 1400 };   /* أقصى حجم لجزء الرسالة قبل التشفير (بايت) */

/* إعدادات الاختبار فقط: مرحّلات محلية، أو إيقاف المباشر (dms:rcCfg = {"relays":[…],"ntfy":"…","p2p":false}) */
export function cfg() { try { return JSON.parse(localStorage.getItem('dms:rcCfg') || 'null') || {}; } catch (e) { return {}; } }

/* ---------- أدوات صغيرة ---------- */
export const b64u = u8 => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export const unb64u = s => { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
export const hex = u8 => Array.from(u8, b => b.toString(16).padStart(2, '0')).join('');
export const unhex = h => { const u = new Uint8Array(h.length >> 1); for (let i = 0; i < u.length; i++) u[i] = parseInt(h.substr(i * 2, 2), 16); return u; };
const rand = n => crypto.getRandomValues(new Uint8Array(n));
const cat = (...a) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let k = 0; for (const x of a) { o.set(x, k); k += x.length; } return o; };
const sha256 = async u8 => new Uint8Array(await SUB().digest('SHA-256', u8));

/* هل يدعم هذا المتصفح ما تحتاجه الميزة؟ */
export const supported = () => !!(window.crypto && crypto.subtle && window.WebSocket && typeof BigInt === 'function' && window.TextEncoder);

/* رقم الجلسة: 14 حرفًا (70 بتًا) بلا حروف تلتبس */
export function newSid() { const A = 'abcdefghijkmnpqrstuvwxyz23456789'; let s = ''; for (const b of rand(14)) s += A[b & 31]; return s; }
export const sidOk = s => /^[a-z2-9]{10,24}$/.test(String(s || ''));
/* الوسم على الوسيط مشتق من رقم الجلسة، فلا يظهر الرقم نفسه */
export async function topicOf(sid) { return 'alm' + hex(await sha256(te.encode('alm-rc|' + sid))).slice(0, 40); }

/* ---------- مفاتيح ECDH ---------- */
const EC = { name: 'ECDH', namedCurve: 'P-256' };
export async function ecdhNew() { const k = await SUB().generateKey(EC, true, ['deriveBits']); return { priv: k.privateKey, pub: new Uint8Array(await SUB().exportKey('raw', k.publicKey)) }; }
export async function ecdhSave(k) { return { d: await SUB().exportKey('jwk', k.priv), p: b64u(k.pub) }; }
export async function ecdhLoad(o) { return { priv: await SUB().importKey('jwk', o.d, EC, true, ['deriveBits']), pub: unb64u(o.p) }; }
export const pubOk = raw => raw instanceof Uint8Array && raw.length === 65 && raw[0] === 4;
/* معرّف الجوال القصير في رأس كل رسالة: 16 حرفًا من الإحداثي x لمفتاحه العام */
export const pidOf = raw => b64u(raw.subarray(1, 13));
/* المفتاح المشترك: SHA-256 لسرّ ECDH مع رقم الجلسة والمفتاحين العامّين، فيُربط المفتاح بهذه الجلسة وهذين الجهازين */
export async function deriveKey(myPriv, peerRaw, sid, screenRaw, phoneRaw) {
  const peer = await SUB().importKey('raw', peerRaw, EC, false, []);
  const bits = new Uint8Array(await SUB().deriveBits({ name: 'ECDH', public: peer }, myPriv, 256));
  const k = await sha256(cat(te.encode('alm-rc-v1|' + sid + '|'), screenRaw, phoneRaw, bits));
  return SUB().importKey('raw', k, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
/* مفتاح توقيع رسائل Nostr: عشوائي لكل جهاز في كل جلسة، لا علاقة له بالتشفير */
export const nostrKey = () => schnorr.keygen().secretKey;

/* ---------- الختم والفتح ----------
   الظرف: {v:1, t:'e', f, p, iv, ct} — f المرسِل (s الشاشة، p الجوال، h تحية الجوال الأولى)، p معرّف الجوال.
   f وp داخلان في التوثيق (AAD)، فلا تُقلب رسالة من اتجاه إلى آخر. والمحتوى {e: بداية جلسة المرسِل, i: تسلسل, b: الرسالة}. */
const AAD = (f, p) => te.encode('alm-rc1|' + f + '|' + p);
export async function pack(key, f, p, e, i, b, extra) {
  const iv = rand(12);
  const ct = new Uint8Array(await SUB().encrypt({ name: 'AES-GCM', iv, additionalData: AAD(f, p) }, key, te.encode(JSON.stringify({ e, i, b }))));
  return JSON.stringify(Object.assign({ v: 1, t: 'e', f, p }, extra || {}, { iv: b64u(iv), ct: b64u(ct) }));
}
export async function unpack(key, env) {
  try {
    const pt = await SUB().decrypt({ name: 'AES-GCM', iv: unb64u(env.iv), additionalData: AAD(env.f, env.p) }, key, unb64u(env.ct));
    const o = JSON.parse(td.decode(pt));
    return o && typeof o === 'object' && o.b && typeof o.b === 'object' ? o : null;
  } catch (e) { return null; }
}

/* منع الإعادة: يُقبل كل رقم مرة واحدة ضمن نافذة، وبداية جلسة أحدث تفتح نافذة جديدة */
export class Seen {
  constructor() { this.ep = 0; this.hi = -1; this.set = new Set(); }
  ok(ep, i) {
    if (!Number.isFinite(ep) || !Number.isFinite(i) || ep < this.ep) return false;
    if (ep > this.ep) { this.ep = ep; this.hi = -1; this.set = new Set(); }
    if (i <= this.hi - 512 || this.set.has(i)) return false;
    this.set.add(i); if (i > this.hi) this.hi = i;
    if (this.set.size > 1200) for (const x of this.set) if (x <= this.hi - 512) this.set.delete(x);
    return true;
  }
}

/* تقطيع نص JSON طويل بحسب حجمه بالبايت، بلا قطع زوج بدلي (surrogate) */
export function chunk(s, max) {
  const out = []; let start = 0, bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i); let n = c < 0x80 ? 1 : c < 0x800 ? 2 : 3, w = 1;
    if (c >= 0xD800 && c <= 0xDBFF && i + 1 < s.length) { n = 4; w = 2; }
    if (bytes + n > max && i > start) { out.push(s.slice(start, i)); start = i; bytes = 0; }
    bytes += n; i += w - 1;
  }
  out.push(s.slice(start));
  return out;
}

/* المستقبِل: يفتح الظرف، ويتحقق من التسلسل، ويجمع الأجزاء */
export class Receiver {
  constructor() { this.seen = new Seen(); this.parts = new Map(); }
  async take(key, env) {
    const o = await unpack(key, env);
    if (!o || !this.seen.ok(+o.e, +o.i)) return null;
    const b = o.b;
    if (b.t !== 'ck') return b;
    const n = +b.n, i = +b.i, now = Date.now();
    if (!(n > 1 && n <= 64 && i >= 0 && i < n)) return null;
    let p = this.parts.get(b.k);
    if (!p) { p = { n, got: new Array(n), c: 0, ts: now }; this.parts.set(b.k, p); }
    if (p.got[i] == null) { p.got[i] = String(b.d); p.c++; }
    for (const [k, v] of this.parts) if (now - v.ts > 30000) this.parts.delete(k);
    if (p.c < p.n) return null;
    this.parts.delete(b.k);
    try { const x = JSON.parse(p.got.join('')); return x && typeof x === 'object' ? x : null; } catch (e) { return null; }
  }
}

/* المرسِل: يختم ويقطّع، ويختار الطريق: المباشر إن كان مفتوحًا، وإلا الوسيط الذي جاءت منه آخر رسالة من الطرف الآخر */
export class Sender {
  constructor(o) { this.key = o.key; this.f = o.f; this.p = o.p; this.bus = o.bus; this.direct = o.direct || null; this.ep = Date.now(); this.i = 0; this.q = Promise.resolve(); this.via = ''; this.last = 0; }
  send(body, opt) { const job = () => this._send(body, opt || {}).catch(() => 0); return (this.q = this.q.then(job, job)); }
  async _send(body, opt) {
    const dc = !opt.relay && this.direct && this.direct.isOpen;
    /* الطرف الآخر يكتب عبر ntfy (لا تصله مرحّلات Nostr): نكتب إليه عبر الطريقين حتى تعود رسائله عبر Nostr */
    const pref = opt.pref || (this.via === 'ntfy' ? 'both' : '');
    const s = JSON.stringify(body);
    const ch = chunk(s, dc ? MAX.dc : this.bus.max(pref));
    const k = this.ep.toString(36) + '.' + (this.i + 1);
    const bodies = ch.length === 1 ? [body] : ch.map((d, i) => ({ t: 'ck', k, i, n: ch.length, d }));
    let sent = 0;
    for (const b of bodies) {
      const env = await pack(this.key, this.f, this.p, this.ep, ++this.i, b);
      if (dc) { if (this.direct.send(env)) { sent++; continue; } return this._send(body, Object.assign({}, opt, { relay: true })); }
      sent += await this.bus.send(env, pref);
    }
    if (sent) this.last = Date.now();
    return sent;
  }
}

/* ---------- الوسيط: مرحّلات Nostr، وntfy احتياطًا ---------- */
class Relay {
  constructor(bus, url) { this.bus = bus; this.url = url; this.ws = null; this.ready = false; this.fails = 0; this.bad = 0; this.off = false; this.dead = false; this.sub = 'a' + hex(rand(4)); this.t = 0; }
  open() {
    if (this.off || this.dead) return;
    let ws; try { ws = new WebSocket(this.url); } catch (e) { this.retry(); return; }
    this.ws = ws; this.ready = false;
    const to = setTimeout(() => { if (ws.readyState !== 1) try { ws.close(); } catch (e) {} }, 9000);
    let rt = 0;
    ws.onopen = () => {
      clearTimeout(to);
      ws.send(JSON.stringify(['REQ', this.sub, { kinds: [KIND], '#t': [this.bus.topic], since: Math.floor(Date.now() / 1000) - 60 }]));
      rt = setTimeout(() => this.up(ws), 2500);   /* مرحّل لا يرسل EOSE: نعدّه جاهزًا بعد لحظة */
    };
    ws.onmessage = e => this.msg(ws, e.data);
    ws.onclose = () => { clearTimeout(to); clearTimeout(rt); if (this.ws !== ws) return; this.ws = null; const was = this.ready; this.ready = false; if (was) this.bus.status(); this.retry(); };
    ws.onerror = () => {};
  }
  up(ws) { if (this.ws === ws && ws.readyState === 1 && !this.ready) { this.ready = true; this.fails = 0; this.bus.status(); } }
  msg(ws, data) {
    let m; try { m = JSON.parse(data); } catch (e) { return; }
    if (!Array.isArray(m)) return;
    if (m[0] === 'EVENT' && m[1] === this.sub && m[2]) { this.bus.event(m[2]); return; }
    if (m[0] === 'EOSE' && m[1] === this.sub) { this.up(ws); return; }
    if (m[0] === 'CLOSED' && m[1] === this.sub) { this.ready = false; this.dead = true; this.bus.status(); try { ws.close(); } catch (e) {} return; }
    if (m[0] === 'OK' && m[2] === false && !/rate-limit|duplicate/i.test(String(m[3] || ''))) {
      if (++this.bad >= 3) { this.dead = true; this.ready = false; this.bus.status(); try { ws.close(); } catch (e) {} }
    }
  }
  retry() { if (this.off || this.dead) return; clearTimeout(this.t); const d = Math.min(30000, 1000 * Math.pow(2, Math.min(5, this.fails++))); this.t = setTimeout(() => this.open(), d + Math.random() * 500); }
  /* بعد عودة الجهاز من الخلفية: يُعاد الاتصال فورًا بدل انتظار المهلة */
  poke() { if (this.off || this.dead || this.ws) return; clearTimeout(this.t); this.fails = 0; this.open(); }
  /* بعد نوم طويل قد يبدو الاتصال مفتوحًا وهو ميت: يُغلق ويُفتح من جديد */
  refresh() {
    if (this.off || this.dead) return;
    const ws = this.ws; this.ws = null; this.ready = false;
    if (ws) { ws.onclose = ws.onmessage = ws.onopen = null; try { ws.close(); } catch (e) {} }
    clearTimeout(this.t); this.fails = 0; this.open();
  }
  send(ev) { if (this.ready && this.ws && this.ws.readyState === 1) { try { this.ws.send(JSON.stringify(['EVENT', ev])); return true; } catch (e) {} } return false; }
  close() { this.off = true; clearTimeout(this.t); const ws = this.ws; this.ws = null; this.ready = false; if (ws) try { ws.close(); } catch (e) {} }
}

export class Bus {
  /* o: {topic, nsk, onMsg(text, via), onStatus()} */
  constructor(o) {
    Object.assign(this, o);
    const c = cfg();
    this.urls = Array.isArray(c.relays) ? c.relays : RELAYS;
    this.nbase = typeof c.ntfy === 'string' ? c.ntfy : NTFY;
    this.npub = hex(schnorr.getPublicKey(this.nsk));
    this.rs = []; this.seen = new Set(); this.seenQ = []; this.es = null; this.nOk = false; this.stopped = false; this.q = Promise.resolve();
  }
  start() { this.t0 = Date.now(); this.rs = this.urls.map(u => new Relay(this, u)); this.rs.forEach(r => r.open()); this.nOpen(); }
  stop() { this.stopped = true; this.rs.forEach(r => r.close()); if (this.es) try { this.es.close(); } catch (e) {} this.es = null; this.nOk = false; }
  poke() { if (this.stopped) return; this.rs.forEach(r => r.poke()); if (!this.es || this.es.readyState === 2) this.nOpen(); }
  refresh() { if (this.stopped) return; this.rs.forEach(r => r.refresh()); this.nOk = false; this.nOpen(); this.status(); }
  status() { if (this.onStatus) try { this.onStatus(); } catch (e) {} }
  nostrReady() { return this.rs.filter(r => r.ready).length; }
  state() { return { nostr: this.nostrReady(), ntfy: this.nOk }; }
  max(pref) { return pref === 'ntfy' || pref === 'both' || !this.nostrReady() ? MAX.ntfy : MAX.nostr; }
  mark(id) { this.seen.add(id); this.seenQ.push(id); if (this.seenQ.length > 800) this.seen.delete(this.seenQ.shift()); }
  event(ev) {
    if (!ev || typeof ev.content !== 'string' || typeof ev.id !== 'string' || ev.pubkey === this.npub || ev.kind !== KIND) return;
    if (this.seen.has(ev.id)) return;
    this.mark(ev.id);
    try { this.onMsg(ev.content, 'nostr'); } catch (e) {}
  }
  /* pref: '' (الأفضل المتاح) أو 'ntfy' أو 'both'. ترجع عدد ما وصل إليه من مرحّلات */
  send(content, pref) { const job = () => this._send(content, pref); return (this.q = this.q.then(job, job)); }
  /* في الثواني الأولى بعد البدء تُنتظر المرحّلات قليلًا قبل اللجوء إلى ntfy (حصته اليومية محدودة)،
     إلا إن أخفقت كلها مرة على الأقل (شبكة تحجبها) فلا انتظار */
  async warm() {
    while (!this.stopped && !this.nostrReady() && Date.now() - this.t0 < 7000 && !this.rs.every(r => r.dead || r.fails > 0)) await new Promise(r => setTimeout(r, 150));
  }
  /* لا يصل إلا ntfy: نبضات أقل، فحصته اليومية لكل شبكة محدودة */
  slow() { return !this.nostrReady(); }
  async _send(content, pref) {
    if (this.stopped) return 0;
    if (pref !== 'ntfy' && !this.nostrReady()) await this.warm();
    const nr = this.nostrReady();
    if (pref === 'both') return (nr ? await this.nostr(content) : 0) + await this.ntfy(content);
    if (pref === 'ntfy' || !nr) { const n = await this.ntfy(content); return n || (nr ? this.nostr(content) : 0); }
    return this.nostr(content);   /* '' و'nostr' */
  }
  async nostr(content) {
    try {
      const created_at = Math.floor(Date.now() / 1000), tags = [['t', this.topic]];
      const id = hex(await sha256(te.encode(JSON.stringify([0, this.npub, created_at, KIND, tags, content]))));
      const sig = hex(await schnorr.signAsync(unhex(id), this.nsk));
      this.mark(id);
      const ev = { id, pubkey: this.npub, created_at, kind: KIND, tags, content, sig };
      let n = 0; this.rs.forEach(r => { if (r.send(ev)) n++; });
      return n;
    } catch (e) { return 0; }
  }
  nOpen() {
    if (!this.nbase || typeof EventSource === 'undefined' || this.stopped) return;
    if (this.es) try { this.es.close(); } catch (e) {}
    const es = new EventSource(this.nbase + '/' + this.topic + '/sse'); this.es = es;
    es.onopen = () => { if (!this.nOk) { this.nOk = true; this.status(); } };
    es.onerror = () => { if (this.nOk) { this.nOk = false; this.status(); } };
    es.onmessage = e => {
      let d; try { d = JSON.parse(e.data); } catch (_) { return; }
      if (!d || d.event !== 'message' || typeof d.message !== 'string') return;
      if (d.id) { if (this.seen.has('n:' + d.id)) return; this.mark('n:' + d.id); }
      try { this.onMsg(d.message, 'ntfy'); } catch (_) {}
    };
  }
  async ntfy(content) {
    if (!this.nbase || this.stopped) return 0;
    /* مهلة 8 ثوانٍ: طلب معلّق لا يحبس ما بعده من رسائل */
    const ac = typeof AbortController === 'function' ? new AbortController() : null, to = ac ? setTimeout(() => ac.abort(), 8000) : 0;
    try {
      const r = await fetch(this.nbase + '/' + this.topic + '?cache=no&firebase=no', { method: 'POST', body: content, mode: 'cors', credentials: 'omit', cache: 'no-store', signal: ac ? ac.signal : undefined });
      clearTimeout(to);
      if (!r.ok) return 0;
      try { const j = await r.json(); if (j && j.id) this.mark('n:' + j.id); } catch (e) {}
      return 1;
    } catch (e) { clearTimeout(to); return 0; }
  }
}

/* ---------- الاتصال المباشر (WebRTC) ----------
   الشاشة تعرض (of) والجوال يجيب (an) عبر الوسيط مختومين، ثم قناة بيانات بينهما. نبضة كل 4 ثوانٍ، ومن سكت 12 ثانية أُغلق. */
function gathered(pc, ms) {
  return new Promise(res => {
    if (pc.iceGatheringState === 'complete') return res();
    const t = setTimeout(res, ms);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}
export class Direct {
  /* o: {onMsg(text), onChange(), signal(body)} */
  constructor(o) { Object.assign(this, o); this.pc = null; this.dc = null; this.gen = 0; this.isOpen = false; this.rx = 0; this.hb = 0; this.dt = 0; }
  static ok() { return typeof RTCPeerConnection === 'function' && cfg().p2p !== false; }
  reset() {
    clearInterval(this.hb); clearTimeout(this.dt); this.hb = 0;
    const was = this.isOpen; this.isOpen = false;
    if (this.dc) { this.dc.onopen = this.dc.onclose = this.dc.onmessage = null; try { this.dc.close(); } catch (e) {} }
    if (this.pc) { this.pc.onconnectionstatechange = this.pc.oniceconnectionstatechange = this.pc.ondatachannel = null; try { this.pc.close(); } catch (e) {} }
    this.pc = this.dc = null;
    return was;
  }
  close() { if (this.reset() && this.onChange) this.onChange(); }
  mk() {
    const pc = new RTCPeerConnection({ iceServers: STUN });
    const watch = () => {
      if (this.pc !== pc) return;
      const s = pc.connectionState || pc.iceConnectionState;
      clearTimeout(this.dt);
      if (s === 'failed' || s === 'closed') this.close();
      else if (s === 'disconnected') this.dt = setTimeout(() => { if (this.pc === pc) this.close(); }, 4000);
    };
    pc.onconnectionstatechange = watch; pc.oniceconnectionstatechange = watch;
    return (this.pc = pc);
  }
  wire(dc) {
    this.dc = dc;
    const opened = () => {
      if (this.dc !== dc || this.isOpen) return;
      this.isOpen = true; this.rx = Date.now();
      clearInterval(this.hb);
      this.hb = setInterval(() => {
        if (Date.now() - this.rx > 12000) { this.close(); return; }
        try { if (dc.readyState === 'open') dc.send('{"t":"hb"}'); } catch (e) {}
      }, 4000);
      if (this.onChange) this.onChange();
    };
    dc.onopen = opened;
    if (dc.readyState === 'open') opened();
    dc.onclose = () => { if (this.dc === dc) this.close(); };
    dc.onmessage = e => { this.rx = Date.now(); if (typeof e.data === 'string' && e.data !== '{"t":"hb"}') try { this.onMsg(e.data); } catch (_) {} };
  }
  /* الشاشة */
  async offer() {
    this.close();
    const g = ++this.gen, pc = this.mk();
    this.wire(pc.createDataChannel('rc', { ordered: true }));
    try {
      await pc.setLocalDescription(await pc.createOffer());
      await gathered(pc, 3000);
      if (g !== this.gen || this.pc !== pc) return;
      this.signal({ t: 'of', g, sdp: pc.localDescription.sdp });
      setTimeout(() => { if (this.pc === pc && !this.isOpen) this.close(); }, 15000);
    } catch (e) { if (this.pc === pc) this.close(); }
  }
  async onAnswer(b) {
    const pc = this.pc;
    if (!pc || b.g !== this.gen || pc.signalingState !== 'have-local-offer') return;
    try { await pc.setRemoteDescription({ type: 'answer', sdp: String(b.sdp) }); } catch (e) { if (this.pc === pc) this.close(); }
  }
  /* الجوال */
  async onOffer(b) {
    this.close();
    const pc = this.mk(); this.gen = +b.g || 0;
    pc.ondatachannel = e => { if (this.pc === pc) this.wire(e.channel); };
    try {
      await pc.setRemoteDescription({ type: 'offer', sdp: String(b.sdp) });
      await pc.setLocalDescription(await pc.createAnswer());
      await gathered(pc, 3000);
      if (this.pc !== pc) return;
      this.signal({ t: 'an', g: this.gen, sdp: pc.localDescription.sdp });
      setTimeout(() => { if (this.pc === pc && !this.isOpen) this.close(); }, 15000);
    } catch (e) { if (this.pc === pc) this.close(); }
  }
  send(text) { if (this.isOpen && this.dc && this.dc.readyState === 'open') { try { this.dc.send(text); return true; } catch (e) {} } return false; }
}
