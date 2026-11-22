/* نموذجا التصميم: «نموذج 1» (الافتراضي) و«نموذج 2». الاختيار محفوظ في المتصفح (alm:model).
   يُحمَّل في رأس الصفحة قبل رسمها، فلا يومض النموذج الآخر. في النموذج 2 لا يوجد وضع داكن. */
(function () {
  var R = document.documentElement, K = 'alm:model';
  function saved() { try { return localStorage.getItem(K) === '2' ? '2' : '1'; } catch (e) { return '1'; } }
  function userTheme() { try { var t = JSON.parse(localStorage.getItem('dms:theme') || 'null'); return t === 'dark' || t === 'light' ? t : ''; } catch (e) { return ''; } }
  var forcing = false;
  function forceLight() { if (R.getAttribute('data-model') === '2' && R.getAttribute('data-theme') !== 'light') { forcing = true; R.setAttribute('data-theme', 'light'); forcing = false; } }
  function setMeta(m) {
    var ms = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < ms.length; i++) {
      if (!ms[i].hasAttribute('data-m1')) ms[i].setAttribute('data-m1', ms[i].getAttribute('content') || '');
      ms[i].setAttribute('content', m === '2' ? '#FFFFFF' : ms[i].getAttribute('data-m1'));
    }
  }
  function apply(m, user) {
    R.setAttribute('data-model', m);
    if (m === '2') forceLight();
    else { var t = userTheme(); if (t) R.setAttribute('data-theme', t); else R.removeAttribute('data-theme'); }
    setMeta(m);
    var bs = document.querySelectorAll('[data-m2set]');
    for (var i = 0; i < bs.length; i++) bs[i].setAttribute('aria-pressed', String(bs[i].getAttribute('data-m2set') === m));
    if (m === '2') M2Tag.start(); else M2Tag.stop();
    try { window.dispatchEvent(new CustomEvent('almmodel', { detail: { model: m, user: !!user } })); } catch (e) {}
  }
  var M2MAP = {'#0D1B3D':'#1A1A2E','#0A1530':'#1A1A2E','#16264D':'#1A1A2E','#1E3A8A':'#1A1A2E','#334A7A':'#4A4A5E','#4A5878':'#4A4A5E','#4D5B7C':'#4A4A5E',
    '#2563EB':'#4D7CFE','#1D4ED8':'#2D4FCB','#14B8A6':'#2EC4A0','#0B7C70':'#13806A','#5EEAD4':'#6FDCC0','#5FD3C5':'#6FDCC0',
    '#FF7A1A':'#FF7A5C','#FFB37A':'#FFC93C','#FFB26B':'#FFC93C','#B54E00':'#B23A1E','#EEF4FF':'#FFF6E5','#DCE7FF':'#E3EBFF','#D5E0F5':'#E6DCC8','#D5E0F2':'#E6DCC8','#B9C9E8':'#D8D2C4','#8DB0F7':'#93AEFF'};
  window.m2c = function (h) { if (R.getAttribute('data-model') !== '2') return h; return M2MAP[String(h).toUpperCase()] || h; };
  window.almModel = function () { return R.getAttribute('data-model') === '2' ? 2 : 1; };
  window.almSetModel = function (m) {
    m = String(m) === '2' ? '2' : '1';
    try { localStorage.setItem(K, m); } catch (e) {}
    apply(m, true);
  };
  new MutationObserver(function () { if (!forcing) forceLight(); }).observe(R, { attributes: true, attributeFilter: ['data-theme'] });

  /* وسم البطاقات: كل صندوق منحنٍ بحدّ وخلفية فاتحة يأخذ في النموذج 2 حدًّا أسود وظلًّا صلبًا،
     والصناديق داخل صناديق، أو داخل عمود القراءة، تأخذ الحدّ وحده بلا ظل. الورق المطبوع خارج ذلك. */
  var M2Tag = (function () {
    var on = false, mo = null, queue = [], sched = false;
    var SEL = 'input,textarea,select,div,section,article,li,details,label,a,figure,aside,form,dl,fieldset,nav,ul,ol,blockquote,output,summary';
    var SKIP = '.sheet,.ps,.nbp,[class*="nbx"],.m2-switch,header.top,.no-m2,svg,dialog.no-m2,.tb-bar,.tb-seg';
    function rgb(s) { var m = /rgba?\(([^)]+)\)/.exec(s || ''); if (!m) return null; var p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
    function L(c) { function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); }
    function check(el) {
      if (el.__m2 || !el.getAttribute) return; el.__m2 = 1;
      if (el.closest && el.closest(SKIP)) return;
      if (el.classList.contains('article') || el.classList.contains('view') || el.tagName === 'MAIN') return;
      var cs = getComputedStyle(el);
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) { if ((parseFloat(cs.borderTopWidth) || 0) >= 1 && cs.borderTopStyle !== 'none' && !/^(checkbox|radio|range|color|file)$/.test(el.type)) el.setAttribute('data-m2c', 'field'); return; }
      var rad = parseFloat(cs.borderTopLeftRadius) || 0; if (rad < 10) return;
      var bw = parseFloat(cs.borderTopWidth) || 0, bs = cs.borderTopStyle, hasBd = bw >= 1 && bs !== 'none';
      var bg = rgb(cs.backgroundColor), hasBg = bg && bg.a > 0.5;
      var dark = hasBg && L(bg) < 0.2;
      if (hasBg && !dark && L(bg) < 0.8) { var fc = rgb(cs.color); if (fc && L(fc) > 0.75) el.setAttribute('data-m2ink', ''); }
      var ondark = el.parentElement && el.parentElement.closest('[data-m2c="dark"],[data-m2c="ondark"]');
      if (dark && !ondark) { el.setAttribute('data-m2c', 'dark'); return; }
      if (!hasBd && !(hasBg && cs.boxShadow !== 'none')) return;
      if (!hasBg && bs !== 'solid' && bs !== 'dashed') return;
      if (ondark) { el.setAttribute('data-m2c', 'ondark'); return; }
      var h = el.offsetHeight || 0;
      if (rad >= 900 || (h && rad >= h / 2 - 1)) { el.setAttribute('data-m2c', 'pill'); return; }
      var nested = el.parentElement && el.parentElement.closest('[data-m2c="card"],[data-m2c="flat"]');
      var inRead = el.closest('.article');
      el.setAttribute('data-m2c', (nested || inRead) ? 'flat' : 'card');
    }
    function scan(root) {
      if (root.nodeType !== 1) return;
      if (root.matches && root.matches(SEL)) check(root);
      var ns = root.querySelectorAll ? root.querySelectorAll(SEL) : [];
      for (var i = 0; i < ns.length; i++) check(ns[i]);
    }
    function flush() { sched = false; var q = queue; queue = []; for (var i = 0; i < q.length; i++) scan(q[i]); }
    function push(n) { queue.push(n); if (!sched) { sched = true; (window.requestAnimationFrame || setTimeout)(flush); } }
    return {
      start: function () {
        if (on) return; on = true;
        var go = function () { if (!on) return; push(document.body); mo = new MutationObserver(function (ms) { for (var i = 0; i < ms.length; i++) for (var j = 0; j < ms[i].addedNodes.length; j++) push(ms[i].addedNodes[j]); }); mo.observe(document.body, { childList: true, subtree: true }); };
        if (document.body) go(); else document.addEventListener('DOMContentLoaded', go, { once: true });
      },
      stop: function () { on = false; if (mo) { mo.disconnect(); mo = null; } }
    };
  })();

  apply(saved(), false);
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('[data-m2set]') : null;
    if (!b) return;
    e.preventDefault();
    var m = b.getAttribute('data-m2set');
    if (m !== (R.getAttribute('data-model') || '1')) { almSetModel(m); if (typeof window.toast === 'function') window.toast(m === '2' ? 'فُعِّل النموذج 2' : 'فُعِّل النموذج 1'); }
  });
  document.addEventListener('DOMContentLoaded', function () { apply(R.getAttribute('data-model') || '1', false); });
})();
