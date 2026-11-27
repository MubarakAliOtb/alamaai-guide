/* ============ v132: شاشة الحصة — الوسيلة نشاطًا على الشاشة (m2/vx-play.js) ============
   يُحقن بعد vx-tpl.js داخل نطاق سكربت الصفحة، فيستعمل TPL و LANS و vizScene و labVar و labQs و stGroups و lshuf و mmss و store …
   المصدر src: {t القالب، d المحتوى، pal الألوان، id رقم النموذج إن كان من النماذج}.
   ثمانية أنشطة تُشتق من الوسيلة نفسها: لا يُكتب لها محتوى ثانٍ، ولا يظهر منها إلا ما يصلح للقالب (kxModes).
   لا أسماء ولا نتائج محفوظة: عدّاد «من أول محاولة» يعيش في الجلسة وحدها، ويُحفظ على الجهاز آخر ما شُغّل فقط (kx.recent).
   لا شيء فيها يتوقف على هاتف الطالب: تعمل كاملة على الشاشة الواحدة، والرابط والرمز للأجهزة المأذون بها وللمذاكرة. */
var KX=null,KXM={},KXL=null;
var KX_M={
 reveal:{n:'اكشف وتوقّع',ic:'eye',w:'أول الشرح',d:'تُكشف الوسيلة جزءًا جزءًا، ويتوقع الطلبة كل جزء قبل ظهوره.',ds:'اكشفها جزءًا جزءًا، وتوقّع كل جزء قبل أن تراه.'},
 fill:{n:'أكمل الناقص',ic:'pencil',w:'بعد الشرح',d:'خانة بعد خانة: يختارون ما يكملها، أو يستحضرونه بلا خيارات.',ds:'أكمل الخانات واحدة واحدة، بخيارات أو من ذاكرتك.'},
 order:{n:'رتّب',ic:'rows',w:'بعد الشرح',d:'البنود مخلوطة: ما الأول؟ ثم ما التالي؟',ds:'البنود مخلوطة: رتّبها واحدًا بعد واحد.'},
 sort:{n:'صنّف',ic:'grid',w:'بعد الشرح',d:'بطاقة بعد بطاقة: إلى أي خانة تنتمي؟',ds:'بطاقة بعد بطاقة: ضعها في خانتها.'},
 spot:{n:'اكتشف الخطأ',ic:'search',w:'مراجعة',d:'بندان تبادلا موضعيهما. من يجدهما ويعلّل؟',ds:'بندان في غير موضعهما: جدهما وعلّل.'},
 teach:{n:'اشرح لزميلك',ic:'user',w:'آخر الحصة',d:'ثنائيات بمؤقّت: دقيقة لكل زميل، وسؤال يبدأ بـ«لماذا».',ds:'اشرحها بصوتك دقيقة واحدة لزميل أو لأحد من أهلك.'},
 memory:{n:'من الذاكرة',ic:'brain',w:'أول الحصة التالية',d:'تُعرض ثوانيَ ثم تختفي: يرسمها كل طالب في دفتره، ثم يقارن ويصحّح.',ds:'انظر إليها ثوانيَ، ثم ارسمها من ذاكرتك وقارن.'},
 ask:{n:'ثلاثة أسئلة',ic:'q',w:'تذكرة خروج',d:'أسئلة ختام مشتقة من الوسيلة، سؤالًا سؤالًا.',ds:'ثلاثة أسئلة تختبر بها فهمك.'}};
/* القوالب التي ترتيب بنودها هو المعنى، ومجموعة كشف البند رقمه + ١ */
var KX_ORD={steps:['ما الخطوة الأولى؟','ما الخطوة التالية؟'],timeline:['ما الحدث الأول؟','ما الحدث التالي؟'],ladder:['ما الدرجة الأولى؟','ما الدرجة التي تعلوها؟'],path:['ما المحطة الأولى؟','ما المحطة التالية؟'],cycle:['بمَ تبدأ الدورة؟','ما الذي يأتي بعده؟'],pyramid:['ما الذي في القمة؟','ما الذي تحته مباشرة؟'],layers:['ما الطبقة العليا؟','ما الطبقة التي تحتها؟']};
var KX_BOX={la:function(d){return d.a},lb:function(d){return d.b},mid:function(){return 'المشترك'},causes:function(){return 'الأسباب'},effects:function(){return 'النتائج'},feats:function(){return 'الخصائص'},ex:function(){return 'الأمثلة'},non:function(){return 'ليس مثالًا'},fruits:function(){return 'الثمار'},roots:function(){return 'الجذور'},parts:function(){return 'أطراف المعادلة'}};
function kxS(){return document.body.dataset.role==='student'}
function kxT(a,b){return kxS()?b:a}

/* ---------- ما يُشتق من الوسيلة ---------- */
/* الخانات التي تُخفى في «أكمل الناقص»: تفصيل كل بند (والعنوان يبقى دليلًا)، أو البند نفسه إن لم يكن له تفصيل */
function kxSlots(t,d){var A=LANS[t]||{},out=[];
  Object.keys(A).forEach(function(k){var v=d[k],cols=A[k];if(!Array.isArray(v))return;
    v.forEach(function(r,i){
      if(Array.isArray(r)){var cs=(cols.length>1&&cols[0]===0)?cols.slice(1):cols,any=0;
        cs.forEach(function(j){if(!r[j])return;var cue=j>0&&r[0]?String(r[0]):'';if(t==='compare'){var side=(j===1?d.a:d.b)||'';cue=cue&&side?cue+' · '+side:(cue||side)}out.push({k:k,i:i,j:j,a:String(r[j]),cue:cue});any=1});
        if(!any&&r[0]&&cols.indexOf(0)>=0)out.push({k:k,i:i,j:0,a:String(r[0]),cue:''})}
      else if(r)out.push({k:k,i:i,j:-1,a:String(r),cue:KX_BOX[k]?String(KX_BOX[k](d)||''):''})})});
  return out}
function kxSet(d,s,val){if(s.j<0)d[s.k][s.i]=val;else d[s.k][s.i][s.j]=val}
function kxCk(c){return c.k+':'+c.i+':'+c.j+':'+(c.q==null?'':c.q)}
/* خانات التصنيف وبطاقاتها: من قسمين إلى أربعة */
function kxCats(t,d){var c=[],cards=[];
  function L(k,ci){(d[k]||[]).forEach(function(x,i){if(x)cards.push({x:String(x),c:ci,k:k,i:i,j:-1})})}
  if(t==='compare'){c=[d.a,d.b];(d.rows||[]).forEach(function(r,i){if(r&&r[1]&&r[2]&&r[1]!==r[2]){cards.push({x:String(r[1]),c:0,k:'rows',i:i,j:1,cue:r[0]||''});cards.push({x:String(r[2]),c:1,k:'rows',i:i,j:2,cue:r[0]||''})}})}
  else if(t==='venn'){c=[d.a,'كلاهما',d.b];L('la',0);L('mid',1);L('lb',2)}
  else if(t==='balance'||t==='iceberg'){c=[d.a,d.b];L('la',0);L('lb',1)}
  else if(t==='roots'){c=['الثمار','الجذور'];L('fruits',0);L('roots',1)}
  else if(t==='cause'){c=['سبب','نتيجة'];L('causes',0);L('effects',1)}
  else if(t==='frayer'){c=['مثال','ليس مثالًا'];L('ex',0);L('non',1)}
  else if(t==='cols'||t==='tree'||t==='mind'||t==='nest'){(d.items||[]).forEach(function(r,i){if(!r||!r[0])return;var ci=c.length;c.push(r[0]);vsplit(r[1]).forEach(function(x,q){cards.push({x:String(x),c:ci,k:'items',i:i,j:1,q:q})})})}
  else if(t==='triangle'){(d.items||[]).forEach(function(r,i){if(r&&r[0]&&r[1]){c.push(r[0]);cards.push({x:String(r[1]),c:c.length-1,k:'items',i:i,j:1})}})}
  /* بطاقة يصح نصها في أكثر من خانة لا تُسأل */
  var seen={};cards.forEach(function(x){(seen[x.x]=seen[x.x]||{})[x.c]=1});
  cards=cards.filter(function(x){return Object.keys(seen[x.x]).length===1});
  return {c:c.map(function(x){return String(x||'—')}),cards:cards}}
function kxModes(src){var t=src.t,d=src.d,a=[],it=(d.items||[]);
  try{if(stGroups(vizScene(t,d,src.pal)).length>1)a.push('reveal')}catch(e){}
  if(kxSlots(t,d).length>=2)a.push('fill');
  if(KX_ORD[t]&&it.length>=3&&it.every(function(r){return r&&(r[0]||r[1])}))a.push('order');
  var c=kxCats(t,d);if(c.c.length>=2&&c.c.length<=4&&c.cards.length>=3)a.push('sort');
  try{if(labVar(t,d,'swap',1).n)a.push('spot')}catch(e){}
  a.push('teach','memory');
  try{if(labQs(t,d).length)a.push('ask')}catch(e){}
  return a}
function kxChoices(sl,all,seed){var same=[],oth=[],seen={};seen[sl.a]=1;
  all.forEach(function(x){if(seen[x.a])return;seen[x.a]=1;(x.k===sl.k&&x.j===sl.j?same:oth).push(x.a)});
  return lshuf([sl.a].concat(lshuf(same,seed).concat(lshuf(oth,seed+3)).slice(0,3)),seed+7)}

/* ---------- المسرح واللوحة ---------- */
function kxStage(scene,opt){KX.stage.innerHTML=scene.svg(KX.src.d.title||'','vz kx-svg',opt||null);return $('svg',KX.stage)}
function kxFull(d){return kxStage(vizScene(KX.src.t,d||KX.src.d,KX.src.pal))}
function kxPanel(h){var a=document.activeElement,key=a&&KX.panel.contains(a)?(a.dataset.a?'[data-a="'+a.dataset.a+'"]':a.dataset.kx?'[data-kx="'+a.dataset.kx+'"]':''):'';
  KX.panel.innerHTML=h;KX.panel.scrollTop=0;
  var f=key&&$(key,KX.panel);if(!f)f=$('.kx-big',KX.panel)||$('button:not([disabled])',KX.panel);
  if(f&&(key||KX.kbd)){try{f.focus({preventScroll:true})}catch(e){}}}
function kxSay(t){var l=KX&&$('[data-kxlive]',KX.el);if(l){l.textContent='';setTimeout(function(){if(l)l.textContent=t},30)}}
function kxNo(b){if(!b)return;b.classList.remove('kx-no');void b.offsetWidth;b.classList.add('kx-no');kxSay('ليست هذه. جرّب غيرها.')}
function kxGhosts(svg,sc,gs){var NS='http://www.w3.org/2000/svg',W=sc.W;
  gs.forEach(function(g){var x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
    $$('[data-g="'+g+'"]',svg).forEach(function(e){var b;try{b=e.getBBox()}catch(_){return}if(!b||(!b.width&&!b.height))return;var bx=b.x;if(sc.ltr&&e.tagName.toLowerCase()==='path')bx=W-(b.x+b.width);
      x1=Math.min(x1,bx);y1=Math.min(y1,b.y);x2=Math.max(x2,bx+b.width);y2=Math.max(y2,b.y+b.height)});
    if(x2<x1)return;var r=document.createElementNS(NS,'rect');r.setAttribute('x',vR(x1-4));r.setAttribute('y',vR(y1-4));r.setAttribute('width',vR(x2-x1+8));r.setAttribute('height',vR(y2-y1+8));r.setAttribute('rx','18');r.setAttribute('class','kx-ghost');r.setAttribute('data-ghost',g);svg.appendChild(r)})}
function kxPaintG(svg,gs,on){gs.forEach(function(g){var v=!!on[g];$$('[data-g="'+g+'"]',svg).forEach(function(e){e.setAttribute('class',v?'':'hid')});var gh=$('[data-ghost="'+g+'"]',svg);if(gh)gh.setAttribute('class','kx-ghost'+(v?' off':''))})}
/* الخانة الجارية: علامة «؟» داخل إطار منقّط */
function kxMark(svg){var NS='http://www.w3.org/2000/svg';
  $$('text',svg).forEach(function(e){if(e.textContent!=='؟')return;var b;try{b=e.getBBox()}catch(_){return}
    var w=Math.max(b.width+80,140),h=b.height+26,r=document.createElementNS(NS,'rect');
    r.setAttribute('x',vR(b.x+b.width/2-w/2));r.setAttribute('y',vR(b.y-13));r.setAttribute('width',vR(w));r.setAttribute('height',vR(h));r.setAttribute('rx','16');r.setAttribute('class','kx-cur');
    e.parentNode.insertBefore(r,e);e.setAttribute('class','kx-qm')})}
function kxTimer(box,secs,done){var n=secs,tot=secs,T;box.innerHTML='<div class="kx-tm" role="timer"><b class="num" data-tn></b><i><u></u></i></div>';
  function p(){var b=$('[data-tn]',box),u=$('u',box);if(!b)return;b.textContent=mmss(Math.max(n,0));u.style.width=Math.max(0,Math.min(100,100*n/tot))+'%';box.firstChild.classList.toggle('low',n<=10)}
  p();T=setInterval(function(){n--;if(n<=0){n=0;p();clearInterval(T);if(done)done();return}p()},1000);KX.timers.push(T);
  return {add:function(k){n+=k;if(n>tot)tot=n;p()},stop:function(){clearInterval(T)}}}
function kxClear(){if(!KX)return;KX.timers.forEach(function(t){clearInterval(t)});KX.timers=[]}
function kxActs(again){return '<div class="kx-acts">'+(again?'<button class="btn btn-accent" type="button" data-a="again">'+ic('refresh')+' '+again+'</button>':'')+'<button class="btn btn-soft" type="button" data-kx="modes">'+ic('shuffle')+' نشاط آخر</button></div>'}
function kxEnd(msg,again){var t=KX.src.t,nx=!kxS()&&ELAB[t]?'<p class="kx-nxt"><b>نشاط يتبعها بلا شاشة:</b> '+esc(ELAB[t])+'</p>':'';
  kxPanel('<p class="kx-done">'+ic('check')+' '+msg+'</p>'+nx+kxActs(again||'أعدها بترتيب جديد'));kxSay(msg)}

/* ---------- الأنشطة ---------- */
KXM.reveal=function(){var S=KX.src,sc=vizScene(S.t,S.d,S.pal),gs=stGroups(sc),n=gs.length,on={},ord=[],svg=kxStage(sc,{reveal:1});
  kxGhosts(svg,sc,gs);
  function paint(){var k=ord.length;kxPaintG(svg,gs,on);
    if(k>=n){kxEnd(kxT('اكتملت الوسيلة أمامهم.','اكتملت الوسيلة أمامك.'),'أخفِها وابدأ من جديد');return}
    kxPanel('<p class="kx-step num">كُشف '+arn(k)+' من '+arn(n)+'</p><p class="kx-q">'+(k?kxT('توقّعوا: ما الذي في الخانة التالية؟','توقّع: ما الذي في الخانة التالية؟'):kxT('قبل الكشف: ما الذي تتوقعون أن يكون في أول خانة؟','قبل الكشف: ما الذي تتوقع أن يكون في أول خانة؟'))+'</p>'
      +'<div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="next">'+ic('next')+' اكشف التالي</button><button class="btn btn-soft" type="button" data-a="prev"'+(k?'':' disabled')+'>'+ic('prev')+' أخفِ الأخير</button><button class="btn btn-soft" type="button" data-a="all">'+ic('eye')+' اكشف الكل</button></div>'
      +'<p class="note">المس أي خانة منقّطة لتكشفها هي. ومن لوحة المفاتيح: المسافة للتالي.</p>')}
  function show(g){if(on[g])return;on[g]=1;ord.push(g);paint()}
  function act(a){if(a==='next'){for(var i=0;i<n;i++)if(!on[gs[i]]){show(gs[i]);break}}else if(a==='prev'){var g=ord.pop();if(g!=null){delete on[g];paint()}}else if(a==='all'){gs.forEach(function(g){if(!on[g]){on[g]=1;ord.push(g)}});paint()}else if(a==='again'){on={};ord=[];paint()}}
  KX.h=function(e){var gh=e.target.closest('[data-ghost]'),a=e.target.closest('[data-a]');if(gh){show(+gh.getAttribute('data-ghost'));return}if(a)act(a.dataset.a)};
  KX.k=function(e){if(e.key===' '||e.key==='ArrowLeft'){e.preventDefault();act('next')}else if(e.key==='ArrowRight'){e.preventDefault();act('prev')}};
  paint()};

KXM.order=function(){var S=KX.src,t=S.t,it=S.d.items||[],n=it.length,sc=vizScene(t,S.d,S.pal),gs=stGroups(sc),svg=kxStage(sc,{reveal:1}),on={},nx=0,miss=0,first=0,P=KX_ORD[t]||KX_ORD.steps;
  var lab=it.map(function(r,i){return {i:i,x:String((t==='timeline'?(r[1]||r[0]):(r[0]||r[1]))||'')}}),pool=lshuf(lab,KX.seed);
  kxGhosts(svg,sc,gs);
  function paint(){if(nx>=n){gs.forEach(function(g){on[g]=1})}kxPaintG(svg,gs,on);
    if(nx>=n){kxEnd('رُتّبت كلها: '+arn(first)+' من '+arn(n)+' من أول محاولة.');return}
    kxPanel('<p class="kx-step num">في موضعه '+arn(nx)+' من '+arn(n)+'</p><p class="kx-q">'+(nx?P[1]:P[0])+'</p><div class="kx-ch">'+pool.filter(function(l){return l.i>=nx}).map(function(l){return '<button class="kx-opt" type="button" data-c="'+l.i+'">'+esc(l.x)+'</button>'}).join('')+'</div>')}
  KX.h=function(e){var b=e.target.closest('[data-c]'),a=e.target.closest('[data-a]');if(a&&a.dataset.a==='again'){KX.seed+=17;kxRun('order');return}if(!b)return;var i=+b.dataset.c;
    if(i===nx||lab[i].x===lab[nx].x){on[nx+1]=1;if(!miss)first++;miss=0;nx++;paint()}
    else{miss++;kxNo(b);if(miss>=2){var r=$('[data-c="'+nx+'"]',KX.panel);if(r)r.classList.add('kx-hint')}}};
  paint()};

KXM.fill=function(){var S=KX.src,t=S.t,all=kxSlots(t,S.d),pick=all,n,cur=0,miss=0,first=0,mem=KX.mem?1:0,shown=0,ch=[];
  if(all.length>8)pick=lshuf(all.map(function(x,i){return i}),KX.seed).slice(0,8).sort(function(a,b){return a-b}).map(function(i){return all[i]});
  n=pick.length;
  function draw(){var d=clone(S.d);pick.forEach(function(s,i){if(i>=cur)kxSet(d,s,i===cur?'؟':'…')});kxMark(kxFull(d))}
  function paint(){if(cur>=n){kxFull();kxEnd('اكتملت الوسيلة: '+arn(first)+' من '+arn(n)+(mem?' عرفتها من الذاكرة.':' من أول محاولة.'));return}
    draw();var s=pick[cur];ch=kxChoices(s,all,KX.seed+cur);
    var can=ch.length>=2,h='<p class="kx-step num">الخانة '+arn(cur+1)+' من '+arn(n)+'</p><p class="kx-q">ما الذي يكمل الخانة التي فيها «؟»</p>'+(s.cue?'<p class="kx-cue">'+esc(s.cue)+'</p>':'');
    if(mem||!can)h+=shown?'<div class="kx-ans">'+esc(s.a)+'</div><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="ok">'+ic('check')+' '+kxT('عرفوها','عرفتها')+'</button><button class="btn btn-soft" type="button" data-a="no">'+kxT('لم يعرفوها بعد','لم أعرفها بعد')+'</button></div>'
      :'<p class="note">'+kxT('يستحضرونها من الذاكرة، أو يقولها كل طالب لزميله، ثم تكشف.','استحضرها من ذاكرتك، وقلها بصوتك، ثم اكشف.')+'</p><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="show">'+ic('eye')+' اكشف الإجابة</button></div>';
    else h+='<div class="kx-ch">'+ch.map(function(x,i){return '<button class="kx-opt" type="button" data-c="'+i+'">'+esc(x)+'</button>'}).join('')+'</div>';
    if(can)h+='<button class="btn btn-ghost btn-sm kx-tog" type="button" data-a="mem" aria-pressed="'+(!!mem)+'">'+ic('brain')+' '+(mem?'عُد إلى الخيارات':'أصعب: بلا خيارات، من الذاكرة')+'</button>';
    kxPanel(h)}
  KX.h=function(e){var b=e.target.closest('[data-c]'),a=e.target.closest('[data-a]'),s=pick[cur];
    if(b&&s){if(ch[+b.dataset.c]===s.a){if(!miss)first++;miss=0;cur++;shown=0;paint()}else{miss++;kxNo(b);if(miss>=2)$$('[data-c]',KX.panel).forEach(function(x){if(ch[+x.dataset.c]===s.a)x.classList.add('kx-hint')})}return}
    if(!a)return;a=a.dataset.a;
    if(a==='mem'){mem=mem?0:1;KX.mem=mem;shown=0;paint()}else if(a==='show'){shown=1;paint()}else if(a==='ok'||a==='no'){if(a==='ok')first++;cur++;shown=0;miss=0;paint()}else if(a==='again'){KX.seed+=17;kxRun('fill')}};
  KX.k=function(e){var i='1234'.indexOf(e.key),b=i>=0&&$('[data-c="'+i+'"]',KX.panel);if(b){e.preventDefault();b.click()}};
  paint()};

KXM.sort=function(){var S=KX.src,t=S.t,C=kxCats(t,S.d),cards=lshuf(C.cards,KX.seed).slice(0,10),n=cards.length,cur=0,miss=0,first=0,done={},play={};
  cards.forEach(function(c){play[kxCk(c)]=1});
  function draw(){var d=clone(S.d),lists={};
    C.cards.forEach(function(c){var key=kxCk(c),hid=play[key]&&!done[key];
      if(c.q!=null){var lk=c.k+':'+c.i;(lists[lk]=lists[lk]||{c:c,a:[]});if(!hid)lists[lk].a.push(c.x)}
      else if(hid)kxSet(d,c,'…')});
    Object.keys(lists).forEach(function(lk){var L=lists[lk];d[L.c.k][L.c.i][1]=L.a.length?L.a.join('، '):'…'});
    kxFull(d)}
  function paint(){if(cur>=n){kxFull();kxEnd('صُنّفت كلها: '+arn(first)+' من '+arn(n)+' من أول محاولة.');return}
    draw();var c=cards[cur];
    kxPanel('<p class="kx-step num">البطاقة '+arn(cur+1)+' من '+arn(n)+'</p><div class="kx-card">'+(c.cue?'<small>'+esc(c.cue)+'</small>':'')+'<b>'+esc(c.x)+'</b></div><p class="kx-q">إلى أي خانة تنتمي؟</p><div class="kx-ch kx-cats">'+C.c.map(function(x,i){return '<button class="kx-opt" type="button" data-c="'+i+'">'+esc(x)+'</button>'}).join('')+'</div>')}
  KX.h=function(e){var b=e.target.closest('[data-c]'),a=e.target.closest('[data-a]'),c=cards[cur];if(a&&a.dataset.a==='again'){KX.seed+=17;kxRun('sort');return}if(!b||!c)return;
    if(+b.dataset.c===c.c){done[kxCk(c)]=1;if(!miss)first++;miss=0;cur++;paint()}
    else{miss++;kxNo(b);if(miss>=2){var r=$('[data-c="'+c.c+'"]',KX.panel);if(r)r.classList.add('kx-hint')}}};
  KX.k=function(e){var i='1234'.indexOf(e.key),b=i>=0&&$('[data-c="'+i+'"]',KX.panel);if(b){e.preventDefault();b.click()}};
  paint()};

KXM.spot=function(){var S=KX.src,v=labVar(S.t,S.d,'swap',KX.seed),open=0;
  function paint(){
    if(open){kxFull();kxPanel('<p class="kx-done">'+ic('check')+' '+esc(v.key)+'</p><p class="kx-q">'+kxT('اسألهم: كيف عرفتم؟ وما الصواب؟','كيف عرفت؟ وما الصواب؟')+'</p>'+kxActs('خطأ آخر'))}
    else{kxFull(v.d);kxPanel('<p class="kx-q">في هذه الوسيلة بندان تبادلا موضعيهما.</p><p class="note">'+kxT('دقيقة للبحث بالعين، ثم يشير طالب إلى البندين ويعلّل.','ابحث بعينيك عن البندين، وقل لماذا لا يصحّان هكذا.')+'</p><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="show">'+ic('eye')+' اكشف الخطأ</button></div>')}}
  KX.h=function(e){var a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='show'){open=1;paint()}else if(a.dataset.a==='again'){KX.seed++;kxRun('spot')}};
  paint()};

KXM.memory=function(){var S=KX.src,secs=+store.get('kx.sec',20)||20,step=0,tm=null;
  function paint(){kxClear();
    if(step===0){KX.stage.innerHTML='<div class="kx-cover">'+ic('brain')+'<b>الوسيلة مخفية الآن</b><span>'+kxT('جهّزوا الدفاتر والأقلام.','جهّز دفترك وقلمك.')+'</span></div>';
      kxPanel('<p class="kx-q">'+kxT('ستظهر الوسيلة ثوانيَ ثم تختفي، ويرسمها كل طالب في دفتره من ذاكرته.','ستظهر الوسيلة ثوانيَ ثم تختفي، وترسمها في دفترك من ذاكرتك.')+'</p><div class="field"><span class="flabel">مدة العرض</span><div class="seg" role="group" data-sec>'+[10,20,30,45].map(function(x){return '<button type="button" data-v="'+x+'" aria-pressed="'+(x===secs)+'">'+arn(x)+' ث</button>'}).join('')+'</div></div><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="go">'+ic('play')+' اعرضها</button></div>')}
    else if(step===1){kxFull();kxPanel('<p class="kx-q">'+kxT('انظروا جيدًا: ما العنوان؟ كم خانة؟ وماذا في كل خانة؟','انظر جيدًا: ما العنوان؟ كم خانة؟ وماذا في كل خانة؟')+'</p><div data-tm></div><div class="kx-acts"><button class="btn btn-soft" type="button" data-a="hide">'+ic('next')+' أخفِها الآن</button></div>');
      kxTimer($('[data-tm]',KX.panel),secs,function(){step=2;paint()})}
    else if(step===2){kxFull(labVar(S.t,S.d,'blank',1).d);kxPanel('<p class="kx-q">'+kxT('ارسموها الآن من الذاكرة على الهيكل الفارغ، بلا كتاب.','ارسمها الآن من ذاكرتك على الهيكل الفارغ، بلا كتاب.')+'</p><div data-tm></div><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="rev">'+ic('eye')+' اكشف وقارن</button><button class="btn btn-soft" type="button" data-a="plus">'+ic('plus')+' دقيقة أخرى</button></div>');
      tm=kxTimer($('[data-tm]',KX.panel),180,function(){kxSay('انتهى الوقت')})}
    else{kxFull();kxPanel('<p class="kx-done">'+ic('check')+' '+kxT('قارنوا بالأصل، وصحّحوا بلون آخر.','قارن بالأصل، وصحّح بلون آخر.')+'</p><p class="kx-q">'+kxT('ما الخانة التي نسيها أكثرنا؟ نعود إليها الآن.','ما الذي نسيته؟ عُد إليه في كتابك، وأعد الرسم غدًا.')+'</p>'+kxActs('أعدها'))}}
  KX.h=function(e){var v=e.target.closest('[data-sec] [data-v]'),a=e.target.closest('[data-a]');if(v){secs=+v.dataset.v;store.set('kx.sec',secs);paint();return}if(!a)return;a=a.dataset.a;
    if(a==='go'){step=1;paint()}else if(a==='hide'){step=2;paint()}else if(a==='plus'){if(tm)tm.add(60)}else if(a==='rev'){step=3;paint()}else if(a==='again'){step=0;paint()}};
  paint()};

KXM.teach=function(){var S=KX.src,step=0,run=0,st=kxS();
  var R=st?[['اشرحها بصوتك','اشرح الوسيلة دقيقة واحدة لزميل أو لأحد من أهلك، بلا قراءة حرفية.'],['سؤال «لماذا؟»','اطلب ممن سمعك سؤالًا يبدأ بـ«لماذا»، وأجب عنه من الوسيلة.']]
    :[['الأول يشرح','يشرح الأول الوسيلة لزميله دقيقة واحدة بلا قراءة حرفية، ثم يسأله الثاني سؤالًا يبدأ بـ«لماذا».'],['تبادلا الدورين','يشرح الثاني هذه المرة، ويبدأ من حيث تعثّر زميله.']];
  function paint(){kxClear();run=0;kxFull();
    if(step<2)kxPanel('<p class="kx-step num">الجولة '+arn(step+1)+' من '+arn(2)+'</p><p class="kx-q">'+R[step][0]+'</p><p class="kx-cue">'+R[step][1]+'</p><div data-tm></div><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="go">'+ic('play')+' ابدأ الدقيقة</button><button class="btn btn-soft" type="button" data-a="skip">'+ic('next')+' التالي</button></div>');
    else{var qs=[];try{qs=labQs(S.t,S.d)}catch(e){}
      kxPanel('<p class="kx-done">'+ic('check')+' '+kxT('ما الذي صعب شرحه؟ نعود إليه معًا.','ما الذي صعب عليك شرحه؟ عُد إليه في كتابك.')+'</p>'+(qs.length?'<p class="kx-nxt"><b>أسئلة تصلح بعدها:</b></p><ul class="kx-qs">'+qs.map(function(q){return '<li>'+esc(q)+'</li>'}).join('')+'</ul>':'')+kxActs('أعد الجولتين'))}}
  KX.h=function(e){var a=e.target.closest('[data-a]');if(!a)return;a=a.dataset.a;
    if(a==='go'&&!run){run=1;var b=$('[data-a="go"]',KX.panel);if(b)b.disabled=true;kxTimer($('[data-tm]',KX.panel),60,function(){kxSay('انتهت الدقيقة');step++;paint()})}
    else if(a==='skip'){step++;paint()}else if(a==='again'){step=0;paint()}};
  paint()};

KXM.ask=function(){var S=KX.src,qs=labQs(S.t,S.d),i=0,vis=0,blank=labVar(S.t,S.d,'blank',1).d;blank.sub='';
  function paint(){if(vis||i>=qs.length)kxFull();else kxFull(blank);
    if(i>=qs.length){kxPanel('<p class="kx-done">'+ic('check')+' '+kxT('انتهت الأسئلة. طابقوا إجاباتكم بالوسيلة.','انتهت الأسئلة. طابق إجاباتك بالوسيلة.')+'</p>'+kxActs('أعد الأسئلة'));return}
    kxPanel('<p class="kx-step num">السؤال '+arn(i+1)+' من '+arn(qs.length)+'</p><p class="kx-q">'+esc(qs[i])+'</p><p class="note">'+kxT('يجيب كل طالب في دفتره أو على ورقة صغيرة بلا اسم، ثم نناقش إجابتين.','أجب في دفترك أولًا، ثم طابق بالوسيلة.')+'</p><div class="kx-acts"><button class="btn btn-accent kx-big" type="button" data-a="next">'+ic('next')+' '+(i<qs.length-1?'السؤال التالي':'أنهينا')+'</button><button class="btn btn-soft" type="button" data-a="vis" aria-pressed="'+(!!vis)+'">'+ic('eye')+' '+(vis?'أخفِ الوسيلة':'أظهر الوسيلة')+'</button></div>')}
  KX.h=function(e){var a=e.target.closest('[data-a]');if(!a)return;a=a.dataset.a;if(a==='next'){i++;vis=0;paint()}else if(a==='vis'){vis=vis?0:1;paint()}else if(a==='again'){i=0;vis=0;paint()}};
  paint()};

/* ---------- اختيار النشاط ---------- */
function kxActList(ms,attr){var st=kxS();return '<div class="kx-list">'+ms.map(function(m){var M=KX_M[m];return '<button class="kx-act" type="button" '+attr+'="'+m+'"><span class="kx-ai">'+ic(M.ic)+'</span><span class="kx-at"><b>'+M.n+'</b><span>'+(st?M.ds:M.d)+'</span></span><i>'+M.w+'</i></button>'}).join('')+'</div>'}
function kxPick(){kxClear();KX.mode='';KX.h=null;KX.k=null;$('[data-kxn]',KX.el).textContent='اختر النشاط';kxFull();
  kxPanel('<p class="kx-q">'+kxT('ماذا تريد من الوسيلة الآن؟','كيف تريد أن تذاكر بها؟')+'</p>'+kxActList(kxModes(KX.src),'data-kxgo'))}
function kxRun(mode){if(!KX)return;var ms=kxModes(KX.src);if(!mode||ms.indexOf(mode)<0||!KXM[mode]){kxPick();return}
  kxClear();KX.mode=mode;KX.h=null;KX.k=null;$('[data-kxn]',KX.el).textContent=KX_M[mode].n;
  try{KXM[mode]()}catch(e){kxFull();kxPanel('<p class="kx-q">تعذّر تشغيل هذا النشاط على هذه الوسيلة.</p>'+kxActs(''))}
  kxRemember(mode)}
function kxRemember(m){var S=KX.src,a=store.get('kx.recent',[])||[],key=S.id||(S.t+'|'+(S.d.title||''));
  a=a.filter(function(x){return x&&x.key!==key});a.unshift({key:key,id:S.id||'',t:S.t,pal:S.pal,title:S.d.title||TPL[S.t].n,m:m,d:S.id?null:S.d,ts:Date.now()});
  store.set('kx.recent',a.slice(0,6));try{document.dispatchEvent(new CustomEvent('vx:recent'))}catch(e){}}

/* ---------- فتح الشاشة وإغلاقها ---------- */
function kxKey(e){if(!KX)return;KX.kbd=1;if(e.key==='Escape'){e.preventDefault();if($('.kx-pop'))kxPopClose();else kxClose();return}if($('.kx-pop'))return;var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;if(KX.k)KX.k(e)}
function kxOpen(src,mode,o){if(!src||!TPL[src.t]||!src.d)return;if(KX)kxClose(1);o=o||{};
  src={t:src.t,d:clone(src.d),pal:PALS[src.pal]?src.pal:'lab',id:src.id||''};
  var el=document.createElement('div'),full=!!(el.requestFullscreen&&document.fullscreenEnabled);
  el.className='kx';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','شاشة الحصة: '+(src.d.title||TPL[src.t].n));
  el.innerHTML='<div class="kx-bar"><button class="btn btn-ghost btn-sm" type="button" data-kx="close">'+ic('x')+' أغلق</button><div class="kx-ttl"><b>'+esc(src.d.title||TPL[src.t].n)+'</b><span data-kxn></span></div>'
    +'<div class="kx-tools"><button class="btn btn-soft btn-sm" type="button" data-kx="modes" aria-label="نشاط آخر">'+ic('shuffle')+'<span> نشاط آخر</span></button><button class="btn btn-soft btn-sm" type="button" data-kx="share" aria-label="'+kxT('رابط للطلبة','رابط الوسيلة')+'">'+ic('link')+'<span> '+kxT('رابط للطلبة','رابط الوسيلة')+'</span></button>'+(full?'<button class="btn btn-soft btn-sm" type="button" data-kx="full" aria-label="ملء الشاشة">'+ic('zoom')+'<span> ملء الشاشة</span></button>':'')+'</div></div>'
    +'<div class="kx-body"><div class="kx-stage" data-kxs></div><div class="kx-side" data-kxp></div></div><p class="kx-live" aria-live="polite" data-kxlive></p>';
  document.body.appendChild(el);document.body.classList.add('kx-on');
  KX={el:el,src:src,stage:$('[data-kxs]',el),panel:$('[data-kxp]',el),timers:[],last:document.activeElement,seed:(Date.now()%90000)+1,mode:'',link:!!o.link,hist:0,mem:0,kbd:0};
  el.addEventListener('click',function(e){if(!KX)return;var b=e.target.closest('[data-kx]'),g=e.target.closest('[data-kxgo]');
    if(b){b=b.dataset.kx;if(b==='close')kxClose();else if(b==='modes')kxPick();else if(b==='share')kxShare(KX.src,KX.mode);else if(b==='full'){try{if(document.fullscreenElement)document.exitFullscreen();else el.requestFullscreen()}catch(_){}}return}
    if(g){kxRun(g.dataset.kxgo);return}
    if(KX.h)KX.h(e)});
  document.addEventListener('keydown',kxKey);
  if(!o.link){try{history.pushState({kx:1},'');KX.hist=1}catch(e){}}
  var me=KX;FONTS.then(function(){if(KX===me)kxRun(mode||'')});
  try{$('[data-kx="close"]',el).focus({preventScroll:true})}catch(e){}}
function kxClose(quiet){if(!KX)return;var k=KX;kxClear();kxPopClose();KX=null;document.removeEventListener('keydown',kxKey);
  try{if(document.fullscreenElement)document.exitFullscreen()}catch(e){}
  if(k.el.parentNode)k.el.parentNode.removeChild(k.el);document.body.classList.remove('kx-on');
  if(k.link){try{history.replaceState(null,'',location.href.split('#')[0]+'#class')}catch(e){}show('class')}
  else if(k.hist&&!quiet){try{history.back()}catch(e){}}
  if(k.last&&k.last.focus&&document.contains(k.last)){try{k.last.focus({preventScroll:true})}catch(e){}}}
window.addEventListener('popstate',function(){if(KX&&KX.hist){KX.hist=0;kxClose(1)}});

/* ---------- الرابط والرمز: الوسيلة ونشاطها في العنوان نفسه، بلا خادم ---------- */
function kxB64(u8){var s='',i;for(i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
function kxUnB64(s){s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';var b=atob(s),u=new Uint8Array(b.length),i;for(i=0;i<b.length;i++)u[i]=b.charCodeAt(i);return u}
function kxPipe(u8,T,fmt){var st=new Blob([u8]).stream().pipeThrough(new T(fmt));return new Response(st).arrayBuffer().then(function(b){return new Uint8Array(b)})}
function kxLink(src,mode){var base=location.href.split('#')[0],m=mode&&KX_M[mode]?mode:'';
  if(src.id&&EXI[src.id]&&JSON.stringify(EXI[src.id].d)===JSON.stringify(src.d))return Promise.resolve(base+'#k=x.'+src.id+(m?'.'+m:''));
  var raw=new TextEncoder().encode(JSON.stringify({t:src.t,p:src.pal,m:m,d:src.d}));
  if(typeof CompressionStream==='function')return kxPipe(raw,CompressionStream,'deflate-raw').then(function(z){return base+'#k=z.'+kxB64(z)}).catch(function(){return base+'#k=j.'+kxB64(raw)});
  return Promise.resolve(base+'#k=j.'+kxB64(raw))}
function kxParse(h){var m=/^#?k=([xzj])\.(.+)$/.exec(h||'');if(!m)return Promise.resolve(null);
  function obj(u8){var o=JSON.parse(new TextDecoder().decode(u8));if(!o||!TPL[o.t]||!o.d||typeof o.d!=='object')return null;return {src:{t:o.t,d:o.d,pal:o.p},mode:o.m||''}}
  try{
    if(m[1]==='x'){var p=m[2].split('.'),e=EXI[p[0]];return Promise.resolve(e?{src:{t:e.t,d:e.d,pal:'lab',id:e.id},mode:p[1]||''}:null)}
    if(m[1]==='j')return Promise.resolve(obj(kxUnB64(m[2])));
    if(typeof DecompressionStream!=='function')return Promise.resolve(null);
    return kxPipe(kxUnB64(m[2]),DecompressionStream,'deflate-raw').then(obj).catch(function(){return null})
  }catch(e){return Promise.resolve(null)}}
function kxFromHash(){if(!/^#k=/.test(location.hash))return;kxParse(location.hash).then(function(r){if(!r){toast('هذا الرابط لا يفتح وسيلة. اطلب رابطًا جديدًا.');try{history.replaceState(null,'',location.href.split('#')[0]+'#class')}catch(e){}show('class');return}kxOpen(r.src,r.mode,{link:1})})}
window.addEventListener('hashchange',kxFromHash);
function kxPopClose(){var p=$('.kx-pop');if(p&&p.parentNode){p.parentNode.removeChild(p);document.removeEventListener('keydown',kxPopKey)}}
function kxPopKey(e){if(e.key==='Escape'&&!KX){e.preventDefault();kxPopClose()}}
function kxQR(url,box){
  import(new URL('../remote/qr.js',location.href).href).then(function(M){var q;try{q=M.qrcode(0,'M');q.addData(url,'Byte');q.make()}catch(e){box.innerHTML='<p class="note">الوسيلة أكبر من أن يحملها رمز واحد. استعمل الرابط.</p>';return}
    var n=q.getModuleCount(),d='',r,c;for(r=0;r<n;r++)for(c=0;c<n;c++)if(q.isDark(r,c))d+='M'+(c+2)+' '+(r+2)+'h1v1h-1z';
    box.innerHTML='<svg viewBox="0 0 '+(n+4)+' '+(n+4)+'" role="img" aria-label="رمز يفتح الوسيلة" shape-rendering="crispEdges"><rect width="'+(n+4)+'" height="'+(n+4)+'" fill="#FFFFFF"/><path d="'+d+'" fill="#1E1B4B"/></svg>'}).catch(function(){box.hidden=true})}
function kxShare(src,mode){kxPopClose();var p=document.createElement('div');p.className='kx-pop';p.setAttribute('role','dialog');p.setAttribute('aria-modal','true');p.setAttribute('aria-label','رابط الوسيلة');
  p.innerHTML='<div class="kx-popbox"><div class="kx-poph"><b>'+kxT('رابط للطلبة','رابط الوسيلة')+'</b><button class="icon-btn" type="button" data-kxpop="x" aria-label="إغلاق">'+ic('x')+'</button></div><p class="note">'+kxT('يفتح الوسيلة نفسها'+(mode&&KX_M[mode]?' على نشاط «'+KX_M[mode].n+'»':'')+' في أي جهاز. للأجهزة المأذون بها وللمذاكرة في البيت؛ والنشاط كله يعمل على هذه الشاشة بلا أجهزة الطلبة.','يفتح الوسيلة نفسها في أي جهاز: احفظه لتذاكر بها لاحقًا.')+'</p><div class="kx-qr" data-qr><p class="note">يُجهَّز الرمز…</p></div><input class="in kx-url" readonly dir="ltr" aria-label="الرابط" data-url><div class="row"><button class="btn btn-accent" type="button" data-kxpop="copy">'+ic('copy')+' انسخ الرابط</button></div></div>';
  document.body.appendChild(p);document.addEventListener('keydown',kxPopKey);
  p.addEventListener('click',function(e){var b=e.target.closest('[data-kxpop]');if(e.target===p||(b&&b.dataset.kxpop==='x')){kxPopClose();return}if(b&&b.dataset.kxpop==='copy')copyText($('[data-url]',p).value,'نُسخ الرابط')});
  kxLink(src,mode).then(function(u){if(!p.parentNode)return;$('[data-url]',p).value=u;kxQR(u,$('[data-qr]',p))});
  try{$('[data-kxpop="copy"]',p).focus()}catch(e){}}

/* ---------- ورقة الاختيار قبل الشاشة ---------- */
function kxLaunch(src){if(!src||!TPL[src.t])return;KXL={t:src.t,d:clone(src.d),pal:PALS[src.pal]?src.pal:'lab',id:src.id||''};var e=src.id&&EXI[src.id];
  openSheet(src.d.title||TPL[src.t].n,'<div class="vzwrap kx-prev">'+vizSVG(src.t,src.d,KXL.pal)+'</div>'
    +'<p class="kx-chips"><span class="chip chip-teal">'+TPL[src.t].n+'</span>'+(e?' <span class="chip">'+esc(sjn(e.s))+'</span>'+(e.g?' <span class="chip">الصف '+GRN[e.g]+'</span>':''):'')+'</p>'
    +(e&&e.src?'<p class="vx-src">'+ic('book')+' <b>المصدر:</b> '+esc(vxAr(e.src))+'</p>':'')
    +'<p class="kx-lead"><b>'+kxT('اختر النشاط الذي يناسب لحظة الحصة','اختر كيف تذاكر بها')+'</b></p>'+kxActList(kxModes(KXL),'data-kxopen')
    +'<div class="row"><button class="btn btn-soft btn-sm" type="button" data-kxshare>'+ic('link')+' '+kxT('رابط ورمز للطلبة','رابط الوسيلة')+'</button><button class="btn btn-soft btn-sm" type="button" data-kxedit>'+ic('pencil')+' عدّلها في المُنشئ</button></div>')}
