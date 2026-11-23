/* «التحكم من الجوال»: زر في شريط العرض يفتح رمز الربط. ملف صغير يُحمَّل مع الصفحة (ES5)،
   والباقي (التشفير والوسيط ورمز QR) في remote/screen.js لا يُجلب إلا حين يضغط المعلم الزر، أو حين تكون في هذه النافذة جلسة قائمة. */
(function () {
  'use strict';
  if (!window.almShow || !document.addEventListener) return;
  var ICON = '<svg class="lx-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>';
  var CSS = '#lsOv .rc-tb{position:relative}#lsOv .rc-tb .rc-dot{position:absolute;top:5px;inset-inline-end:5px;width:9px;height:9px;border-radius:50%;background:transparent;box-shadow:0 0 0 2px transparent;pointer-events:none}' +
    '#lsOv .rc-tb[data-st="wait"] .rc-dot{background:#F59E0B;box-shadow:0 0 0 2px #FFFFFF;animation:rcPulse 1.4s ease-in-out infinite}' +
    '#lsOv .rc-tb[data-st="on"] .rc-dot{background:#10B981;box-shadow:0 0 0 2px #FFFFFF}#lsOv .rc-tb[data-st="lost"] .rc-dot{background:#F59E0B;box-shadow:0 0 0 2px #FFFFFF}' +
    '@keyframes rcPulse{50%{opacity:.35}}@media (prefers-reduced-motion:reduce){#lsOv .rc-tb .rc-dot{animation:none!important}}';
  var st = 'off', loading = null;

  function addCss() { if (document.getElementById('rcBootCss')) return; var s = document.createElement('style'); s.id = 'rcBootCss'; s.textContent = CSS; document.head.appendChild(s); }
  function paint() { var b = document.querySelector('#lsOv .rc-tb'); if (!b) return; b.setAttribute('data-st', st); b.setAttribute('aria-label', st === 'on' ? 'الجوال متصل: التحكم من الجوال' : 'تحكّم من الجوال'); }
  function inject() {
    var tools = document.querySelector('#lsOv .lx .lx-tools'); if (!tools || tools.querySelector('.rc-tb')) return;
    addCss();
    var b = document.createElement('button'); b.type = 'button'; b.className = 'lx-tb rc-tb'; b.setAttribute('data-rc', 'open'); b.title = 'تحكّم من الجوال';
    b.innerHTML = ICON + '<i class="rc-dot"></i>';
    var ref = tools.querySelector('[data-ls="tch"]') || tools.querySelector('[data-ls="over"]') || tools.lastElementChild;
    tools.insertBefore(b, ref);
    paint();
  }
  function load() {
    if (window.almRC) return Promise.resolve(window.almRC);
    if (loading) return loading;
    loading = new Promise(function (ok, no) {
      if (!('noModule' in HTMLScriptElement.prototype)) { no(new Error('old')); return; }
      var s = document.createElement('script'); s.type = 'module'; s.src = 'remote/screen.js';
      var t = setTimeout(function () { no(new Error('timeout')); }, 15000);
      s.onload = function () { clearTimeout(t); window.almRC ? ok(window.almRC) : no(new Error('old')); };
      s.onerror = function () { clearTimeout(t); no(new Error('net')); };
      document.head.appendChild(s);
    });
    loading.catch(function () { loading = null; });
    return loading;
  }
  function say(m) { try { window.almShow.say(m); } catch (e) {} }

  /* واجهة صغيرة تستعملها الوحدة لتلوين الزر */
  window.almRCBoot = { set: function (s) { st = s; paint(); }, inject: inject };

  /* بعد كل رسم للعرض (open) وإغلاقه (close) وتغيّر المؤقت أو «من يجيب؟» (change)؛ الحدث من جسر almShow في index.html */
  document.addEventListener('alm:show', function (e) {
    var t = e.detail && e.detail.t, api = window.almRC;
    try { if (t === 'open') { inject(); if (api) api.rendered(); } else if (api) { if (t === 'close') api.closed(); else api.changed(); } } catch (x) {}
  });

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-rc="open"]') : null; if (!t) return;
    e.preventDefault();
    t.setAttribute('aria-busy', 'true');
    load().then(function (api) { t.removeAttribute('aria-busy'); api.toggle(); }, function (err) {
      t.removeAttribute('aria-busy');
      say(err && err.message === 'old' ? 'متصفح هذه الشاشة لا يدعم التحكم من الجوال. افتح الدليل في متصفح أحدث (Chrome أو Edge أو Safari).' : 'التحكم من الجوال يحتاج اتصالًا بالإنترنت. تحقّق من الاتصال ثم أعد المحاولة.');
    });
  });

  /* جلسة قائمة في هذه النافذة (بعد إعادة تحميل الصفحة): يُستأنف الاتصال بالجوال نفسه */
  try { if (sessionStorage.getItem('alm:rc')) load().catch(function () {}); } catch (e) {}
})();
