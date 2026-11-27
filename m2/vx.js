/* ============ v132: «الحلول البصرية» للمادتين — الفهرس والنماذج وشاشة الحصة والرئيسية (m2/vx.js) ============
   يُحقن آخرًا (بعد vx-tpl.js و vx-play.js) وقبل تهيئة الصفحة، فيعيد تعريف المعرض وورقة النموذج، ويضيف أداة «شاشة الحصة».
   مصادر الوسيلة لزر التشغيل (data-kxl): ex:رقم النموذج · my:b آخر ما في المُنشئ · my:p:ترتيب مشروع المختبر · rc:ترتيب آخر ما شُغّل. */
function vxAr(s){return String(s==null?'':s).replace(/\d/g,function(d){return AR[d]})}
function vxMeta(e){return [sjn(e.s),TPL[e.t].n,e.g?'الصف '+GRN[e.g]:''].filter(Boolean).join(' · ')}
function vxSrc(k){var p=String(k||'').split(':'),e,b,r;
  if(p[0]==='ex'){e=EXI[p[1]];return e?{t:e.t,d:clone(e.d),pal:'lab',id:e.id}:null}
  if(p[0]==='my'&&p[1]==='b'){b=store.get('builder',null);return b&&TPL[b.t]&&b.d?{t:b.t,d:clone(b.d),pal:b.pal||'lab'}:null}
  if(p[0]==='my'&&p[1]==='p'){b=(store.get('projects',[])||[])[+p[2]];return b&&b.build&&TPL[b.build.t]&&b.build.d?{t:b.build.t,d:clone(b.build.d),pal:b.build.pal||'lab'}:null}
  if(p[0]==='rc'){r=(store.get('kx.recent',[])||[])[+p[1]];if(!r)return null;if(r.id&&EXI[r.id])return vxSrc('ex:'+r.id);return r.d&&TPL[r.t]?{t:r.t,d:clone(r.d),pal:r.pal||'lab'}:null}
  return null}
function vxPaint(f){if(f._p)return;f._p=1;var s=vxSrc(f.dataset.th);if(s)FONTS.then(function(){f.innerHTML=vizSVG(s.t,s.d,s.pal)})}
var VX_IO=null;try{VX_IO=new IntersectionObserver(function(en){en.forEach(function(x){if(x.isIntersecting){vxPaint(x.target);VX_IO.unobserve(x.target)}})},{rootMargin:'300px'})}catch(e){}
function vxWatch(root){$$('[data-th]',root).forEach(function(f){if(f._p)return;if(VX_IO)VX_IO.observe(f);else vxPaint(f)})}

/* ---------- قائمة النماذج: للمعرض (تكبير وتعديل وتشغيل) ولشاشة الحصة (تشغيل) ---------- */
function vxList(el,kind){var cls=kind==='class',K=cls?'kls':'gal2',st=store.get(K,null)||{sj:'all',dom:'all',g:0,t:'all',q:''},tm=null;
  el.innerHTML='<div class="vx-filters">'
    +'<div class="field"><span class="flabel">المادة</span><div class="seg" role="group" data-fs><button type="button" data-v="all">الكل</button><button type="button" data-v="isl">'+SUBJ2.isl+'</button><button type="button" data-v="qrn">'+SUBJ2.qrn+'</button></div></div>'
    +'<div class="field"><span class="flabel">الصف</span><div class="seg" role="group" data-fg><button type="button" data-v="0">الكل</button>'+[6,7,8,9].map(function(g){return '<button type="button" data-v="'+g+'">'+GRN[g]+'</button>'}).join('')+'</div></div>'
    +'<div class="field vx-wide"><span class="flabel">المجال</span><div class="seg scrollseg" role="group" data-fd></div></div>'
    +(cls?'':'<div class="field"><label class="flabel" for="galT">القالب</label><select class="in sel" id="galT" data-ft><option value="all">كل القوالب</option>'+Object.keys(TPL).map(function(k){return '<option value="'+k+'">'+TPL[k].n+'</option>'}).join('')+'</select></div>')
    +'<div class="field"><label class="flabel" for="vxq-'+K+'">بحث في النماذج</label><input class="in" id="vxq-'+K+'" type="search" data-fq placeholder="مثال: العيد، الإدغام، الهجرة" autocomplete="off"></div></div>'
    +(cls?'<div data-mine></div>':'')
    +'<p class="note" data-count aria-live="polite"></p><div class="gal'+(cls?' vx-klist':'')+'" data-list></div>';
  function doms(){return Object.keys(SJ).filter(function(k){return st.sj==='all'||SJS[k]===st.sj||SJS[k]===''})}
  function hay(e){if(!e._h)e._h=norm(e.d.title+' '+sjn(e.s)+' '+TPL[e.t].n+' '+vizText(e.t,e.d));return e._h}
  function card(e){return '<figure class="gx"><button class="vzb" type="button" '+(cls?'data-kxl="ex:'+e.id+'"':'data-exopen="'+e.id+'"')+' data-th="ex:'+e.id+'" aria-label="'+(cls?'شغّل: ':'كبّر النموذج: ')+esc(e.d.title)+'"></button><figcaption><b>'+esc(e.d.title)+'</b><span>'+esc(vxMeta(e))+'</span></figcaption>'
    +(cls?'':'<div class="row vx-cr"><button class="btn btn-soft btn-sm" type="button" data-kxl="ex:'+e.id+'">'+ic('play')+' شغّل</button><button class="btn btn-soft btn-sm" type="button" data-build="'+e.id+'">'+ic('pencil')+' عدّل</button></div>')+'</figure>'}
  function mine(){var box=$('[data-mine]',el);if(!box)return;var a=[],b=store.get('builder',null),pr=store.get('projects',[])||[];
    if(b&&TPL[b.t]&&b.d&&b.d.title)a.push(['my:b',b.d.title,'آخر ما في المُنشئ · '+TPL[b.t].n]);
    pr.forEach(function(p,i){if(p&&p.build&&TPL[p.build.t]&&p.build.d&&p.build.d.title)a.push(['my:p:'+i,p.build.d.title,'من مشاريع المختبر · '+TPL[p.build.t].n])});
    a=a.slice(0,6);box.hidden=!a.length;
    box.innerHTML=a.length?'<h2 class="vx-h">وسائلي</h2><div class="gal vx-mine vx-klist">'+a.map(function(x){return '<figure class="gx"><button class="vzb" type="button" data-kxl="'+x[0]+'" data-th="'+x[0]+'" aria-label="شغّل: '+esc(x[1])+'"></button><figcaption><b>'+esc(x[1])+'</b><span>'+esc(x[2])+'</span></figcaption></figure>'}).join('')+'</div><h2 class="vx-h">نماذج المادتين</h2>':''}
  function draw(){var D=doms();if(st.dom!=='all'&&D.indexOf(st.dom)<0)st.dom='all';
    $$('[data-fs] button',el).forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.v===st.sj))});
    $$('[data-fg] button',el).forEach(function(b){b.setAttribute('aria-pressed',String(+b.dataset.v===+st.g))});
    $('[data-fd]',el).innerHTML='<button type="button" data-v="all" aria-pressed="'+(st.dom==='all')+'">كل المجالات</button>'+D.map(function(k){return '<button type="button" data-v="'+k+'" aria-pressed="'+(st.dom===k)+'">'+esc(SJ[k])+'</button>'}).join('');
    var ft=$('[data-ft]',el);if(ft)ft.value=st.t;var fq=$('[data-fq]',el);if(fq&&fq.value!==st.q&&document.activeElement!==fq)fq.value=st.q||'';
    var q=norm(st.q||'').trim().split(/\s+/).filter(Boolean),g=+st.g;
    var a=EX.filter(function(e){if(st.dom!=='all'?e.s!==st.dom:D.indexOf(e.s)<0)return false;if(g&&e.g&&e.g!==g)return false;if(!cls&&st.t!=='all'&&e.t!==st.t)return false;if(q.length){var h=hay(e);return q.every(function(w){return h.indexOf(w)>=0})}return true});
    if(g)a=a.filter(function(e){return e.g===g}).concat(a.filter(function(e){return !e.g}));
    $('[data-count]',el).textContent=a.length?(a.length===1?'نموذج واحد. ':a.length===2?'نموذجان. ':arn(a.length)+(a.length>10?' نموذجًا. ':' نماذج. '))+(cls?'اضغط النموذج لتختار نشاطه.':'اضغط النموذج لتكبيره، أو شغّله، أو عدّله.'):'لا نموذج بهذا الاختيار. وسّع المجال أو الصف، أو غيّر كلمة البحث.';
    $('[data-list]',el).innerHTML=a.map(card).join('');mine();vxWatch(el)}
  function save(){store.set(K,st)}
  el.addEventListener('click',function(e){var b;
    if((b=e.target.closest('[data-fs] button'))){st.sj=b.dataset.v;save();draw()}
    else if((b=e.target.closest('[data-fg] button'))){st.g=+b.dataset.v;save();draw()}
    else if((b=e.target.closest('[data-fd] button'))){st.dom=b.dataset.v;save();draw()}});
  el.addEventListener('change',function(e){if(e.target.matches('[data-ft]')){st.t=e.target.value;save();draw()}});
  el.addEventListener('input',function(e){if(!e.target.matches('[data-fq]'))return;st.q=e.target.value;clearTimeout(tm);tm=setTimeout(function(){save();draw()},180)});
  el._load=function(){var g=store.get('gal',null);if(g&&!cls){st={sj:'all',dom:SJ[g.s]?g.s:'all',g:0,t:TPL[g.t]?g.t:'all',q:''};store.set('gal',null);save()}draw()};
  document.addEventListener('vsc:role',function(){if(el.offsetParent!==null)draw()});
  document.addEventListener('vx:recent',function(){if(cls)mine()});
  el._load()}
TOOLS.gallery=function(el){vxList(el,'gallery')};
TOOLS.klass=function(el){vxList(el,'class')};

/* ورقة النموذج في المعرض: مصدره وصفّه، وزر التشغيل قبل التعديل */
exSheet=function(e){openSheet(e.d.title,'<div class="vzzoom" data-zoombox>'+vizSVG(e.t,e.d,'lab')+'</div><div class="row zoomrow"><button class="btn btn-soft btn-sm" type="button" data-zoom aria-pressed="false">'+ic('zoom')+' كبّر النموذج</button></div>'
  +'<p><span class="chip">'+esc(sjn(e.s))+'</span> <span class="chip chip-teal">'+TPL[e.t].n+'</span>'+(e.g?' <span class="chip">الصف '+GRN[e.g]+'</span>':'')+'</p>'
  +(e.src?'<p class="vx-src">'+ic('book')+' <b>المصدر:</b> '+esc(vxAr(e.src))+'</p>':'')
  +'<div class="row"><button class="btn btn-accent" type="button" data-kxl="ex:'+e.id+'">'+ic('play')+' '+kxT('شغّلها في الحصة','ذاكر بها')+'</button><button class="btn btn-soft" type="button" data-build="'+e.id+'">'+ic('pencil')+' عدّلها في المُنشئ</button></div>'
  +'<p><b>متى أستعمل هذا القالب؟</b> '+TPL[e.t].when+'</p><p><b>لماذا يوافق الدماغ؟</b> '+TPL[e.t].why+'</p>')};

/* زر التشغيل في المُنشئ حيثما رُكّب (الأدوات والمختبر) */
(function(){var M0=mountBuilder;
mountBuilder=function(el,get,set,opt){var api=M0(el,get,set,opt),row=$('.bside .row',el);
  if(row){var b=document.createElement('button');b.type='button';b.className='btn btn-accent';b.innerHTML=ic('play')+' <span class="only-teacher">شغّلها في الحصة</span><span class="only-student">ذاكر بها</span>';
    b.addEventListener('click',function(){var s=get();if(s&&TPL[s.t]&&s.d)kxLaunch({t:s.t,d:s.d,pal:s.pal})});row.insertBefore(b,row.firstChild)}
  return api}})();

/* ---------- نقرات التشغيل في الصفحة كلها ---------- */
document.addEventListener('click',function(e){if(e.target.closest('.kx'))return;var b;
  if((b=e.target.closest('[data-kxl]'))){var s=vxSrc(b.dataset.kxl);if(!s){toast('تعذّر فتح هذه الوسيلة على هذا الجهاز.');return}if(!sheet.hidden)closeSheet();if(b.dataset.kxm)kxOpen(s,b.dataset.kxm);else kxLaunch(s);return}
  if((b=e.target.closest('[data-kxopen]'))){if(!KXL)return;var m=b.dataset.kxopen,src=KXL;closeSheet();kxOpen(src,m);return}
  if(e.target.closest('[data-kxshare]')){if(KXL)kxShare(KXL,'');return}
  if(e.target.closest('[data-kxedit]')){if(!KXL)return;var x=KXL;closeSheet();openBuilder({t:x.t,d:clone(x.d),pal:x.pal})}});

/* ---------- الرئيسية: ست وسائل للشاشة، وآخر ما شُغّل ---------- */
var VX_FEAT=['fq-eid-sifa','tj-noon-flow','aq-iman-tree','sr-hijra-path','fq-jumua-eid','aq-arkan-ibada'];
function vxRecent(){var box=$('[data-vxrecent]');if(!box)return;var a=(store.get('kx.recent',[])||[]).slice(0,3).map(function(r,i){return r&&TPL[r.t]&&(r.id?EXI[r.id]:r.d)?[i,r]:null}).filter(Boolean);
  box.hidden=!a.length;if(!a.length){box.innerHTML='';return}
  box.innerHTML='<div class="vx-recent"><b>'+kxT('عُد إلى ما شغّلته','عُد إلى ما ذاكرت به')+'</b><div class="row">'+a.map(function(x){var r=x[1];return '<button class="btn btn-soft btn-sm" type="button" data-kxl="rc:'+x[0]+'"'+(KX_M[r.m]?' data-kxm="'+r.m+'"':'')+'>'+ic('play')+' '+esc(r.title)+(KX_M[r.m]?' · '+KX_M[r.m].n:'')+'</button>'}).join('')+'</div></div>'}
VINIT.push(function(v){
  var f=$('[data-vxfeat]',v);if(f&&!f._i){f._i=1;f.innerHTML=VX_FEAT.map(function(id){var e=EXI[id];return e?'<figure class="gx"><button class="vzb" type="button" data-kxl="ex:'+id+'" data-th="ex:'+id+'" aria-label="شغّل: '+esc(e.d.title)+'"></button><figcaption><b>'+esc(e.d.title)+'</b><span>'+esc(vxMeta(e))+'</span></figcaption></figure>':''}).join('');vxWatch(f)}
  if($('[data-vxrecent]',v))vxRecent();
  var w=$('[data-vxwhy]',v);if(w&&!w._i){w._i=1;w.innerHTML=labWhy(6)}
  /* المقطع المتحرك في البطل: يعمل وحده ما لم يطلب الجهاز تقليل الحركة */
  if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches))$$('video[data-vxm]',v).forEach(function(x){try{x.muted=true;var p=x.play();if(p&&p.catch)p.catch(function(){})}catch(e){}});
  if(window.BX_SYNC)setTimeout(window.BX_SYNC,0)});
document.addEventListener('vx:recent',vxRecent);
document.addEventListener('vsc:role',function(){vxRecent()});

/* ما يضيفه البحث إلى نص الصفحتين */
SX.gallery=function(){return EX.map(function(e){return e.d.title+' ('+TPL[e.t].n+'، '+sjn(e.s)+')'}).join(' · ')};
SX['class']=function(){return 'أنشطة الشاشة: '+Object.keys(KX_M).map(function(k){return KX_M[k].n}).join('، ')+' · '+EX.map(function(e){return e.d.title}).join(' · ')};
/* رابط مشاركة في العنوان: يُفتح بعد تهيئة الصفحة */
setTimeout(kxFromHash,0);
