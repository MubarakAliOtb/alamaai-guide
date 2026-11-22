/* دليل المعلم الألمعي — ملف الخدمة: العمل بلا إنترنت (v97؛ v104: المهلة على الصفحة كاملة، والطلب المسبق). للنسخة العامة وحدها (GitHub Pages)؛ نسخة Claude لا تحمله.
   ما يُحفظ: الصفحة نفسها وخطوطها وأيقوناتها عند التثبيت، ثم كل ما يُفتح من ملفات الموقع ومكتبات التصدير (cdnjs و jsDelivr) عند أول طلب،
   وما يطلبه المعلم صراحة من بطاقة «العمل بلا إنترنت» (رسالة keep من الصفحة: دروس صفوفه، ثم الدليل والحلول البصرية والمقاطع).
   - الصفحة وبياناتها (دروس الصفوف، وفهرس البحث، وفصول الدليل، وقائمة الملفات): الأحدث من الشبكة أولًا، والمحفوظ إن غابت الشبكة أو لم يكتمل وصول الملف كله
     خلال ثلاث ثوانٍ (v104: كانت المهلة على أول الاستجابة لا على جسمها، فيعلق المعلم على الشبكة البطيئة بعد كل نشرة). والجديد يُحفظ في الخلفية فيظهر في الزيارة التالية.
     ولا يُعاد حفظ ملف لم يتغير (ETag نفسه). وطلب الصفحة يبدأ مع تشغيل ملف الخدمة (navigation preload) حيث يتاح.
   - الخطوط والصور والمكتبات: المحفوظ أولًا، ويُحدَّث في الخلفية.
   - المقاطع: تُجاب طلبات المدى (Range) من الملف المحفوظ كاملًا إن وُجد، وإلا فمن الشبكة.
   - لا تُعترض: الحقائب التدريبية وملفات الدروس PDF (كبيرة، وتُنزَّل إلى الجهاز عند طلبها)، ولا أي موقع آخر، ولا أي طلب غير GET.
   اسم المخزن ثابت (alm-v1) فلا يضيع المحفوظ عند تحديث هذا الملف؛ يتغير الاسم فقط إن تغيّرت بنية المحفوظ. لا يُحفظ فيه شيء من بيانات المعلم ولا طلابه. */
'use strict';
const SW_VER = '114';
const CACHE = 'alm-v1';
const ROOT = new URL('./', self.location).pathname;
const CDN = ['https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'];
const CORE = ['./', 'offline.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'fonts/AlmSansArabic-Regular.woff2', 'fonts/AlmSansArabic-Bold.woff2', 'fonts/hafs.woff2', 'fonts/amiri-sym.woff2',
  'm2/logo.svg', 'fonts/m2d-alm-400.woff2', 'fonts/m2d-alm-700.woff2'];
const FRESH = /^(?:ls\/s\d\.json|data\/search\.json|data\/parts\/\d+\.html|offline\.json)$/;
const SKIP = /^(?:vsc\/kits\/|ls\/f\d\/|sw\.js$)/;
const WAIT = 3000;

/* مفتاح الحفظ لملف من الموقع: بلا استعلام، و x/index.html هو x/ */
const keyOf = u => { let p = u.pathname; if (p.endsWith('/index.html')) p = p.slice(0, -10); return u.origin + p; };
const inSite = u => u.origin === self.location.origin && u.pathname.startsWith(ROOT);
const good = r => !!r && r.status === 200 && (r.type === 'basic' || r.type === 'cors');
/* إجابة جاءت بعد تحويل (redirect) لا تصلح جوابًا لطلب تصفح؛ فتُحفظ نسخة نظيفة منها */
const clean = async r => r.redirected ? new Response(await r.blob(), { status: r.status, statusText: r.statusText, headers: r.headers }) : r;
const store = (c, key, r) => clean(r).then(x => c.put(key, x)).catch(() => {});

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(async p => {
      try { const u = new URL(p, self.location); const r = await fetch(u.href, { cache: 'no-cache' }); if (good(r)) await store(c, keyOf(u), r); } catch (_) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    try { if (self.registration.navigationPreload) await self.registration.navigationPreload.enable(); } catch (_) {}
    const ks = await caches.keys();
    await Promise.all(ks.filter(k => k.startsWith('alm-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* صفحة لم تُحفظ والشبكة غائبة: إشعار قصير بدل خطأ المتصفح. تعيد المحاولة وحدها حين يعود الاتصال، وزرّها يفتح الدليل في النافذة كلها (قد تكون داخل إطار «الحلول البصرية») */
const OFFLINE_PAGE = '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>بلا إنترنت</title>' +
  '<body style="font-family:system-ui,sans-serif;background:#EEF4FF;color:#0D1B3D;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center;line-height:1.9">' +
  '<div><h1 style="font-size:22px;margin:0 0 8px">لا اتصال بالإنترنت</h1><p style="margin:0 0 14px">هذه الصفحة لم تُحفظ على جهازك بعد. افتحها مرة وأنت متصل، أو جهّزها من «عن الأداة» في الدليل. وستُفتح وحدها حين يعود الاتصال.</p>' +
  '<p style="margin:0;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" onclick="location.reload()" style="font:inherit;font-weight:700;background:#0D1B3D;color:#fff;border:0;border-radius:999px;padding:10px 22px;min-height:44px;cursor:pointer">أعد المحاولة</button>' +
  '<a href="./" target="_top" style="display:inline-block;background:#fff;color:#0D1B3D;border:1.5px solid #0D1B3D;border-radius:999px;padding:8px 22px;min-height:26px;text-decoration:none;font-weight:700">افتح الدليل</a></p></div>' +
  '<script>addEventListener("online",function(){location.reload()})<\/script></body></html>';
const offlinePage = () => new Response(OFFLINE_PAGE.replace('href="./"', 'href="' + ROOT + '"'), { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

/* الأحدث أولًا: الشبكة، ثم المحفوظ إن غابت أو لم يكتمل وصول الملف كله خلال WAIT.
   v104: الطلب يبدأ قبل البحث في المخزن (والطلب المسبق للتصفح إن وُجد)، والسباق على جسم الاستجابة كله لا على رؤوسها،
   فلا يعلق المعلم على شبكة بطيئة وعنده نسخة محفوظة؛ والملف الذي لم يتغير (ETag نفسه) لا يُكتب في المخزن من جديد. */
const sameTag = (a, b) => { const x = a && a.headers.get('ETag'), y = b && b.headers.get('ETag'); return !!x && x === y; };
async function fresh(e, req, u) {
  const key = keyOf(u);
  const pre = req.mode === 'navigate' && e.preloadResponse ? e.preloadResponse.catch(() => null) : null;
  const res = (pre ? pre.then(r => r || fetch(req)) : fetch(req));
  res.catch(() => {});
  const c = await caches.open(CACHE);
  const hit = await c.match(key, { ignoreVary: true });
  if (!hit) {
    try { const r = await res; if (good(r)) e.waitUntil(store(c, key, r.clone())); return r; }
    catch (_) { return req.mode === 'navigate' ? offlinePage() : Response.error(); }
  }
  const full = res.then(async r => {
    if (!good(r)) return r;
    const body = await r.arrayBuffer();
    const x = new Response(body, { status: r.status, statusText: r.statusText, headers: r.headers });
    if (!sameTag(hit, x)) e.waitUntil(c.put(key, x.clone()).catch(() => {}));
    return x;
  });
  let timer = 0;
  const late = new Promise(ok => { timer = setTimeout(() => ok(null), WAIT); });
  try {
    const r = await Promise.race([full, late]);
    clearTimeout(timer);
    if (r && r.ok) return r;
    if (!r) e.waitUntil(full.catch(() => {}));     // لم يكتمل الملف في المهلة: يُعرض المحفوظ، ويكتمل الجديد في الخلفية للزيارة التالية
    return hit;
  } catch (_) { clearTimeout(timer); return hit; }
}

/* المحفوظ أولًا، ويُحدَّث في الخلفية (ملفات الموقع)؛ ومكتبات التصدير ثابتة الإصدار فلا تُحدَّث */
async function stale(e, req, key, renew) {
  const c = await caches.open(CACHE);
  const hit = await c.match(key, { ignoreVary: true });
  const pull = () => fetch(req).then(r => { if (good(r)) e.waitUntil(store(c, key, r.clone())); return r; });
  if (hit) { if (renew) e.waitUntil(pull().catch(() => {})); return hit; }
  try { return await pull(); } catch (_) { return Response.error(); }
}

/* طلب مدى (المقاطع): من الملف المحفوظ كاملًا إن وُجد */
async function ranged(req, u) {
  const c = await caches.open(CACHE);
  const hit = await c.match(keyOf(u), { ignoreVary: true });
  if (!hit) return fetch(req);
  const buf = await hit.arrayBuffer(), size = buf.byteLength;
  const type = hit.headers.get('Content-Type') || 'application/octet-stream';
  const m = /^bytes=(\d*)-(\d*)$/.exec((req.headers.get('range') || '').trim());
  if (!m || (m[1] === '' && m[2] === '')) return new Response(buf, { status: 200, headers: { 'Content-Type': type, 'Content-Length': String(size), 'Accept-Ranges': 'bytes' } });
  const a = m[1] === '' ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const b = m[1] !== '' && m[2] !== '' ? Math.min(size - 1, Number(m[2])) : size - 1;
  if (a >= size || a > b) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
  return new Response(buf.slice(a, b + 1), { status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': type, 'Content-Range': 'bytes ' + a + '-' + b + '/' + size, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  let u; try { u = new URL(req.url); } catch (_) { return; }
  if (inSite(u)) {
    const p = u.pathname.slice(ROOT.length);
    if (SKIP.test(p)) return;
    if (req.headers.has('range')) { e.respondWith(ranged(req, u)); return; }
    if (req.mode === 'navigate' || FRESH.test(p)) { e.respondWith(fresh(e, req, u)); return; }
    e.respondWith(stale(e, req, keyOf(u), true));
    return;
  }
  if (CDN.indexOf(u.origin) >= 0) e.respondWith(stale(e, req, u.href, false));
});

/* رسائل الصفحة:
   {t:'ver'} → رقم هذا الملف.
   {t:'keep', id, urls:[…]} → يحفظ القائمة (ملفات الموقع ومكتبات التصدير فقط)، ويرسل التقدم {t:'keep', id, done, total, bytes, fail} ثم {…, end:true}.
   {t:'has', id, urls:[…]} → أيها محفوظ؟ {t:'has', id, have:[true|false…]}.
   {t:'drop', id} → يحذف المحفوظ كله إلا الصفحة وخطوطها وأيقوناتها (CORE)، فتبقى تفتح بلا إنترنت. */
const allowed = s => { try { const u = new URL(s, self.location); if (inSite(u)) return SKIP.test(u.pathname.slice(ROOT.length)) ? null : u; return CDN.indexOf(u.origin) >= 0 ? u : null; } catch (_) { return null; } };
const keyFor = u => inSite(u) ? keyOf(u) : u.href;
async function keep(reply, id, urls) {
  const c = await caches.open(CACHE);
  const list = urls.map(allowed);
  const total = list.length; let done = 0, bytes = 0, i = 0; const fail = [];
  const one = async () => {
    while (i < list.length) {
      const k = i++, u = list[k];
      try {
        if (!u) throw new Error('not allowed');
        const r = await fetch(u.href, inSite(u) ? { cache: 'no-cache' } : { mode: 'cors', credentials: 'omit' });
        if (!good(r)) throw new Error('status ' + (r && r.status));
        const body = await r.clone().arrayBuffer(); bytes += body.byteLength;
        await c.put(keyFor(u), await clean(r));
      } catch (_) { fail.push(urls[k]); }
      done++; reply({ t: 'keep', id, done, total, bytes, fail: fail.length });
    }
  };
  await Promise.all([one(), one(), one(), one()]);
  reply({ t: 'keep', id, done, total, bytes, fail: fail.length, failed: fail.slice(0, 12), end: true });
}
self.addEventListener('message', e => {
  const d = e.data || {}, port = e.ports && e.ports[0];
  const reply = m => { try { if (port) port.postMessage(m); else if (e.source) e.source.postMessage(m); } catch (_) {} };
  if (d.t === 'ver') { reply({ t: 'ver', ver: SW_VER, cache: CACHE }); return; }
  if (d.t === 'keep' && Array.isArray(d.urls)) { e.waitUntil(keep(reply, d.id, d.urls.slice(0, 600)).catch(() => reply({ t: 'keep', id: d.id, end: true, error: true }))); return; }
  if (d.t === 'has' && Array.isArray(d.urls)) {
    e.waitUntil((async () => { const c = await caches.open(CACHE); const have = await Promise.all(d.urls.slice(0, 600).map(async s => { const u = allowed(s); return !!(u && await c.match(keyFor(u), { ignoreVary: true })); })); reply({ t: 'has', id: d.id, have }); })());
    return;
  }
  if (d.t === 'drop') {
    /* الصفحة وخطوطها وأيقوناتها (CORE) تبقى: الحذف لا يحتاج إلى الشبكة، ولا يترك المعلم بلا صفحة إن حذف وهو منقطع */
    e.waitUntil((async () => {
      const c = await caches.open(CACHE);
      const stay = new Set(CORE.map(p => keyOf(new URL(p, self.location))));
      const all = await c.keys();
      await Promise.all(all.filter(r => !stay.has(r.url)).map(r => c.delete(r)));
      reply({ t: 'drop', id: d.id, end: true });
    })().catch(() => reply({ t: 'drop', id: d.id, end: true, error: true })));
  }
});
