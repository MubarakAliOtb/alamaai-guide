
/* ============ v132: نظام الصور الموحّد (m2/band.js) — للحلول البصرية وهندسة تجربة التعلّم ============
   يقيس رأس الصفحة المصوَّر (.bnd-top) الظاهر، فيرفعه إلى تحت الشريط العلوي (--bnd-up)، ويبدّل الشريط:
   شفاف في أول الصفحة (bnd-hd-clear)، نيلي ما دامت الصورة تحته (bnd-hd-tint)، وكما هو بعدها. نظيره في الدليل alSec و alHdr.
   BX_SYNC() يعيد القياس: تناديه الصفحة بعد تبديل العرض أو الدور أو المقاس. */
(function(){
  if(window.BX_SYNC)return;
  var D=document.documentElement,T=null,B=0,cur=null,raf=0,ro=null;
  function hdr(){
    if(!T)return;
    if(!B){if(D.classList.contains('bnd-hd')){D.classList.remove('bnd-hd');T.classList.remove('bnd-hd-clear','bnd-hd-tint')}return}
    var y=window.pageYOffset||0,past=y>=B-T.offsetHeight;
    D.classList.add('bnd-hd');T.classList.toggle('bnd-hd-clear',!past&&y<=4);T.classList.toggle('bnd-hd-tint',!past&&y>4)}
  function sync(){
    if(!T)T=document.querySelector('body>header.top');
    if(!T)return;
    var a=document.querySelectorAll('.bnd-top'),el=null,i;
    for(i=0;i<a.length;i++){if(a[i].offsetParent!==null){el=a[i];break}}
    if(!el){B=0;cur=null;hdr();return}
    /* البعد الطبيعي عن أعلى الصفحة: يُقاس والرفع ملغى */
    el.style.setProperty('--bnd-up','0px');
    var up=Math.max(0,Math.round(el.getBoundingClientRect().top+(window.pageYOffset||0)));
    el.style.setProperty('--bnd-up',up+'px');
    B=Math.round(el.offsetHeight);
    if(cur!==el){cur=el;if('ResizeObserver' in window){if(!ro)ro=new ResizeObserver(function(){if(cur)B=Math.round(cur.offsetHeight);hdr()});else ro.disconnect();ro.observe(el)}}
    hdr()}
  window.addEventListener('scroll',function(){if(raf)return;raf=requestAnimationFrame(function(){raf=0;hdr()})},{passive:true});
  window.addEventListener('resize',sync);
  window.addEventListener('hashchange',function(){setTimeout(sync,0)});
  window.addEventListener('load',sync);
  document.addEventListener('vsc:role',function(){setTimeout(sync,0)});
  window.BX_SYNC=sync;
  if(document.readyState!=='loading')sync();else document.addEventListener('DOMContentLoaded',sync);
})();
