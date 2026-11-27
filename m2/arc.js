/* ================= v133: ألعاب الآركيد من المنهج (m2/arc.js) =================
   أربع ألعاب سريعة على شاشة الصف، كلها من بنك أسئلة المنهج نفسه (FD_CUP عبر gmScope/gmClosed) وبنطاق الألعاب الأخرى نفسه:
   ١) شُهُب المعرفة (meteor): الخيارات تهبط شُهُبًا؛ المس الصحيح قبل أن يبلغ الأرض.
   ٢) رحلة البوم (boat): بوابات بالخيارات تقترب من البوم؛ وجّهه إلى البوابة الصحيحة (لمسًا أو بالأسهم). من تراث الغوص في الكويت.
   ٣) حصن اليقين (fort): عبارات تقترب من الحصن؛ فنّد الخاطئة باللمس، ودع الصحيحة تبلغ السور فتُثبَّت. على منهج «اكتشف الخطأ».
   ٤) شدّ الحبل (tug): فريقان، لكل فريق نصف الشاشة وأسئلته؛ كل جواب صحيح يشدّ الحبل خطوة، والخطأ يوقف الفريق ثانيتين.
   الضوابط: لا آية ولا حديث ولا نص منقول يتحرك أو يُلمس ليُردّ في الألعاب الثلاث المتحركة (تُستبعد أسئلة الرسم العثماني وما في خياراته نص بين علامتين)،
   ولا يُزرع خطأ في عبارة فيها نص منقول؛ وفي «شدّ الحبل» تُعرض الخيارات كما في «مبارزة السبورة». ما أُخطئ فيه يعود في «المراجعة السريعة».
   الحالة في الذاكرة (gmRun)، وأفضل نتيجة للصف كله تُحفظ لكل لعبة وصف (TK.gm.acBest). */
const AC_ALL=/جميع ما سبق|كل ما سبق|لا شيء مما سبق|جميع ما ذكر|كل ما ذكر/;
const AC_IDS=['meteor','boat','fort','tug'];
const AC_NAME={meteor:'شُهُب المعرفة',boat:'رحلة البوم',fort:'حصن اليقين',tug:'شدّ الحبل'};
const acClean=q=>!q.qr&&!AC_SCR_T(q.q,true)&&!q.o.some(o=>PL_SCR.test(String(o.t)))&&q.o.every(o=>String(o.t).length<=56);
function AC_SCR_T(t,gapOnly){t=String(t||'');return gapOnly?(PL_SCR.test(t)&&PL_GAP.test(t)):PL_SCR.test(t)}
/* الألعاب المتحركة تعرض جزءًا من الخيارات: فلا سؤال يتوقف على خياراته كلها ("ما عدا"، "جميع ما سبق") */
function acMotionPool(){return gmClosed(gmScope()).filter(q=>acClean(q)&&(q.tf||(!PL_OPTDEP.test(q.q)&&!q.o.some(o=>AC_ALL.test(String(o.t))))))}
function acTake(q,k){if(q.tf)return {...q,o:q.o.slice()};const r=q.o.find(o=>o.ok),w=tkShuffle(q.o.filter(o=>!o.ok)).slice(0,k-1);return {...q,o:tkShuffle([r,...w])}}
function acNext(R){if(!R.pool.length)R.pool=tkShuffle(R.all);return R.pool.pop()}
const acS=()=>{const G=gmS();if(![1,2].includes(+G.acn))G.acn=1;if(![10,15,20].includes(+G.acr))G.acr=10;if(![1,2,3].includes(+G.acs))G.acs=1;if(![60,90,120].includes(+G.act))G.act=90;if(!G.acBest||typeof G.acBest!=='object')G.acBest={};return G};
const acPts=R=>10+5*Math.min(R.combo,4);
const acHearts=R=>R.nt>1?'':`<span class="ac-lives" aria-label="المحاولات الباقية: ${bgN(R.lives)}">${[0,1,2].map(i=>`<i class="${i<R.lives?'on':''}"></i>`).join('')}</span>`;
const acScore=(R,turnOn)=>`<div class="gm-score">${R.sc.map((s,i)=>`<span class="gm-sc${turnOn&&!R.over&&R.nt>1&&R.turn===i?' on':''}" style="${gmTS(i)}"><i class="gm-dot"></i>${R.nt>1?esc(gmTeam(i)):'رصيد الصف'}<b>${bgN(s)}</b></span>`).join('')}${acHearts(R)}${R.combo>1?`<span class="ac-combo">سلسلة ×${bgN(R.combo)}</span>`:''}</div>`;
const acPauseBtn=R=>`<button class="tk-ib" data-tk="acpause" title="${R.paused?'تابع':'إيقاف مؤقت'} (المسافة)" aria-pressed="${!!R.paused}">${tkSvg(R.paused?'M7 5v14l12-7z':'M8 5v14M16 5v14')}</button>`;

/* ---------- المحرك المشترك: حلقة الرسم، والإيقاف، والعدّ التنازلي، والنهاية ---------- */
const AC={id:'',raf:0,last:0,ro:null};
function acLoop(ts){const R=gmRun[AC.id];if(!R||R.over||!document.getElementById('acArena')){AC.raf=0;return}
  const dt=Math.min(.05,AC.last?(ts-AC.last)/1000:0);AC.last=ts;
  if(!R.paused){if(R.cd>0){R.cd-=dt;acCd(R)}else{R.t+=dt;AC_G[AC.id].tick(R,dt)}}
  AC.raf=requestAnimationFrame(acLoop)}
function acRun(id){AC.id=id;AC.last=0;if(!AC.raf)AC.raf=requestAnimationFrame(acLoop)}
function acStop(){if(AC.raf)cancelAnimationFrame(AC.raf);AC.raf=0;if(AC.ro){AC.ro.disconnect();AC.ro=null}}
function acCd(R){const el=document.getElementById('acCd');if(!el)return;const n=Math.ceil(R.cd);if(R.cd<=0){el.hidden=true;return}el.hidden=false;const s=n>=1?bgN(n):'';if(el.textContent!==s){el.textContent=s;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}}
/* موضع أفقي لا يخرج بالعنصر عن حافتي الساحة */
function acX(R,el,x){const w=el._w||(el._w=el.offsetWidth)||100;return Math.max(w/2+8,Math.min(R.W-w/2-8,x*R.W))}
function acSize(R){const A=document.getElementById('acArena');if(!A)return;const b=A.getBoundingClientRect();R.W=b.width||800;R.H=b.height||500}
function acMount(id){const R=gmRun[id],A=document.getElementById('acArena');if(!R||!A)return;acSize(R);
  if('ResizeObserver' in window){AC.ro&&AC.ro.disconnect();AC.ro=new ResizeObserver(()=>{acSize(R);AC_G[id].layout&&AC_G[id].layout(R)});AC.ro.observe(A)}
  AC_G[id].mount(R,A);A.addEventListener('click',e=>{if(R.over||R.paused||R.cd>0)return;AC_G[id].click(R,e)});acCd(R);acRun(id)}
function acPause(R,on){if(!R||R.over)return;R.paused=on==null?!R.paused:on;const A=document.getElementById('acArena');if(A)A.classList.toggle('paused',R.paused);const p=document.getElementById('acPause');if(p)p.hidden=!R.paused;
  const b=document.querySelector('#gmStage [data-tk="acpause"]');if(b){b.setAttribute('aria-pressed',String(R.paused));b.innerHTML=tkSvg(R.paused?'M7 5v14l12-7z':'M8 5v14M16 5v14');b.title=R.paused?'تابع (المسافة)':'إيقاف مؤقت (المسافة)'}}
/* لافتة قصيرة وسط الساحة (صواب، خطأ، تصويب) */
function acToast(html,cls,ms){const A=document.getElementById('acArena');if(!A)return;let t=A.querySelector('.ac-toast');if(!t){t=document.createElement('div');t.className='ac-toast';t.setAttribute('role','status');A.appendChild(t)}
  t.className='ac-toast '+(cls||'');t.innerHTML=html;clearTimeout(t._h);t._h=setTimeout(()=>{t.classList.add('out')},ms||1400)}
function acHud(R){const S=document.querySelector('#gmStage .tk-stbar .gm-score');if(S)S.outerHTML=acScore(R,true)}
function acRight(R,q,team){const p=acPts(R);R.combo++;R.ok++;R.sc[R.nt>1?team:0]+=p;gmSnd(1);acHud(R);return p}
function acWrong(R,q){R.combo=0;R.bad++;plMiss(R,q);if(R.nt===1)R.lives=Math.max(0,R.lives-1);gmSnd(0);acHud(R)}
function acEnd(R){if(R.over)return;R.over=true;acStop();const G=TK.gm,key=AC.id+':'+G.g;if(R.nt===1&&R.sc[0]>(+G.acBest[key]||0)){R.best=true;G.acBest[key]=R.sc[0];tkSave()}gmSnd(2);tkRe()}
function acOver(R,again){const G=TK.gm,tot=R.ok+R.bad,mx=Math.max(...R.sc),w=R.sc.indexOf(mx),tie=R.nt>1&&R.sc.filter(s=>s===mx).length>1,best=+G.acBest[AC.id+':'+G.g]||0;
  const head=R.id==='tug'?(R.tw<0?'تعادل: الحبل في المنتصف':'فاز '+esc(gmTeam(R.tw))+(Math.abs(R.pos)>=AC_TUGN?' بشدّ الحبل إلى جهته':' والحبل في جهته')):R.nt>1?(tie?'تعادل':'فاز '+esc(gmTeam(w))):(R.best?'رقم جديد للصف':'انتهت الجولة');
  return `<div class="gm-win ac-win" style="${gmTS(R.id==='tug'?Math.max(0,R.tw):R.nt>1?w:0)}"><small>${esc(AC_NAME[AC.id])}</small><b>${head}</b>
    <div class="ac-stats">${R.nt>1?R.sc.map((s,i)=>`<span><b>${bgN(s)}</b>${esc(gmTeam(i))}</span>`).join(''):`<span><b>${bgN(R.sc[0])}</b>رصيد الصف</span><span><b>${bgN(best)}</b>أفضل نتيجة</span>`}${tot?`<span><b>${bgN(Math.round(R.ok/tot*100))}٪</b>دقة الإجابة</span>`:''}${R.maxc>1?`<span><b>${bgN(R.maxc)}</b>أطول سلسلة</span>`:''}</div>
    <div class="tk-row-btns"><button class="tk-btn pri big" data-tk="${again}">${tkI('reset')}جولة أخرى</button></div></div>${gmMissHTML(R.miss)}`}
function acBase(id,nt,all){return {id,nt,sc:Array(nt).fill(0),all,pool:[],turn:0,combo:0,maxc:0,ok:0,bad:0,lives:3,miss:[],over:false,paused:false,cd:3.2,t:0,k:0}}
function acStage(id,R,scene){return `<div class="tk-stage gm-stage ac-stage no-m2" id="gmStage"><div class="tk-stbar">${acScore(R,true)}${gmTools(acPauseBtn(R))}</div>
  ${R.over?acOver(R,'acagain'):`<div class="ac-arena ac-${id}${R.paused?' paused':''}" id="acArena" tabindex="-1">${scene}<div class="ac-cd" id="acCd" aria-live="polite" hidden></div><div class="ac-pause" id="acPause"${R.paused?'':' hidden'}><b>متوقفة مؤقتًا</b><button class="tk-btn pri big" data-tk="acpause">${tkI('play')}تابع</button></div></div>`}</div>`}
/* إعدادات مشتركة لصفحة كل لعبة قبل البدء */
function acSetup(id,P,opts,rules){const G=acS();
  return `<section class="tk-card">${gmBar()}<div class="tk-bar">${opts.includes('n')?plTeamsSeg('acn',[[1,'الصف كله'],[2,'فريقان بالتناوب']],G.acn):''}${opts.includes('r')?`<div class="tk-lb">عدد الأسئلة${tkSeg('acr',[[10,'١٠'],[15,'١٥'],[20,'٢٠']],G.acr)}</div>`:''}${opts.includes('t')?`<div class="tk-lb">مدة الشدّ${tkSeg('act',[[60,'دقيقة'],[90,'دقيقة ونصف'],[120,'دقيقتان']],G.act)}</div>`:''}${opts.includes('s')?`<div class="tk-lb">السرعة${tkSeg('acs',[[1,'هادئة'],[2,'متوسطة'],[3,'سريعة']],G.acs)}</div>`:''}</div>
    ${(opts.includes('n')&&+G.acn>1)||id==='tug'?gmTeamsHTML(2):''}${gmPoolTip(P.length,id==='tug'?12:8)}
    ${G.acBest[id+':'+G.g]?`<p class="tk-tip ac-best">أفضل نتيجة لصفك في هذه اللعبة: <b>${bgN(G.acBest[id+':'+G.g])}</b>. هل يتجاوزها اليوم؟</p>`:''}
    <div class="tk-row-btns"><button class="tk-btn pri big" data-tk="acstart"${P.length>=2?'':' disabled'}>${tkI('play')}ابدأ اللعب</button></div></section>${gmRules(rules)}`}
/* صفحة اللعبة في «أدواتي»: الإعداد، ثم الساحة، ثم النتيجة */
function acPage(id,pool,opts,rules){return {
  render(M){gmDeep(id);acS();const R=gmRun[id];if(R){M.innerHTML=acStage(id,R,R.over?'':AC_G[id].scene(R));if(!R.over)acMount(id);return}
    acStop();M.innerHTML=acSetup(id,pool(),opts,rules)},
  leave(){const R=gmRun[id];if(R&&!R.over)R.paused=true;acStop()},
  act(a,t){const G=TK.gm;if(gmAct(id,a,t))return;const R=gmRun[id];
    if(a==='acn'||a==='acr'||a==='acs'||a==='act'){G[a]=+t.dataset.v;tkSave();tkRe();return}
    if(a==='acstart'||a==='acagain'){const all=pool();if(all.length<2)return;const nt=id==='tug'?2:(a==='acagain'&&R?R.nt:(opts.includes('n')?+G.acn:1));const R2=acBase(id,nt,all);R2.n=+G.acr;R2.lv=+G.acs;if(a==='acagain'&&R){R2.n=R.n;R2.lv=R.lv}AC_G[id].init(R2,G);gmRun[id]=R2;acStop();tkRe();try{const S=$('#gmStage');if(S&&!document.body.classList.contains('tk-pres'))S.scrollIntoView({block:'start',behavior:'instant'})}catch(e){}return}
    if(a==='acpause'){acPause(R);return}},
  input(n,t,e){gmInput(n,t,e)}}}
/* المسافة توقف وتتابع، والأسهم توجّه البوم؛ في الصفحة الجارية وحدها */
document.addEventListener('keydown',e=>{if(!AC_IDS.includes(typeof tkCur==='string'?tkCur:''))return;const R=gmRun[tkCur];if(!R||R.over)return;const tg=e.target;if(tg&&/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName))return;
  if(e.key===' '&&!(tg&&tg.tagName==='BUTTON')){e.preventDefault();acPause(R);return}
  if(e.key==='Escape'&&!R.paused){acPause(R,true);return}
  if(AC_G[tkCur].key&&!R.paused&&R.cd<=0)AC_G[tkCur].key(R,e)});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&AC_IDS.includes(typeof tkCur==='string'?tkCur:'')){const R=gmRun[tkCur];if(R&&!R.over&&R.cd<=0)acPause(R,true)}});

const AC_G={};
/* ---------- ١) شُهُب المعرفة ---------- */
AC_G.meteor={
  init(R){R.q=null;R.drops=[];R.ph='new';R.wait=0},
  scene(R){return `<div class="ac-sky" aria-hidden="true"></div><div class="ac-q" id="acQ"></div><div class="ac-ground" aria-hidden="true"></div><div class="ac-layer" id="acL"></div>`},
  mount(R){this.paintQ(R);const L=document.getElementById('acL');R.drops.forEach((d,i)=>{d.el=this.el(d,i);L.appendChild(d.el)});this.layout(R)},
  el(d,i){const b=document.createElement('button');b.type='button';b.className='ac-drop'+(d.st!=='fall'?' '+d.st:'');b.dataset.ac=i;b.innerHTML=`<span>${gmQ(d.t)}</span>`;return b},
  paintQ(R){const Q=document.getElementById('acQ');if(!Q)return;const q=R.q;Q.innerHTML=q?`<small>${R.nt>1?`<b style="${gmTS(R.turn)}" class="ac-turn"><i class="gm-dot"></i>${esc(gmTeam(R.turn))}</b> · `:''}السؤال ${bgN(R.k)} من ${bgN(R.n)} · ${esc(q.src)}</small><p>${gmQ(q.q)}</p>`:''},
  newQ(R){if(R.k>=R.n||(R.nt===1&&R.lives<=0)){acEnd(R);return}R.k++;if(R.k>1)R.turn=(R.turn+1)%R.nt;const q=acTake(acNext(R),4);R.q=q;R.ph='play';
    const n=q.o.length,lanes=tkShuffle([...Array(n).keys()]);const v=[.065,.088,.115][R.lv-1]*(1+Math.min(.6,R.ok*.03));
    R.drops=q.o.map((o,j)=>({t:o.t,ok:o.ok,x:(lanes[j]+.5)/n+(Math.random()-.5)*.24/n,y:-.04-j*.1-Math.random()*.06,v:v*(.9+Math.random()*.2),st:'fall'}));
    this.paintQ(R);const L=document.getElementById('acL');if(L){L.innerHTML='';R.drops.forEach((d,i)=>{d.el=this.el(d,i);L.appendChild(d.el)})}this.layout(R)},
  layout(R){const Q=document.getElementById('acQ');R.top=Q&&R.H?Math.min(.45,(Q.offsetTop+Q.offsetHeight+10)/R.H):.25;R.drops.forEach(d=>{if(d.el)d.el._w=0;this.pos(R,d)})},
  pos(R,d){if(!d.el)return;d.el.style.visibility=d.y<0?'hidden':'';const y=R.top+(.86-R.top)*Math.max(0,d.y);d.el.style.transform=`translate(${acX(R,d.el,d.x)}px,${y*R.H}px) translate(-50%,-50%)`},
  tick(R,dt){if(R.ph==='new'){this.newQ(R);return}
    if(R.ph==='wait'){R.wait-=dt;if(R.wait<=0)R.ph='new';return}
    R.drops.forEach(d=>{if(d.st==='fall'){d.y+=d.v*dt;this.pos(R,d);if(d.y>=1){if(d.ok){this.miss(R,d)}else{d.st='gone';d.el&&d.el.classList.add('gone')}}}})},
  end(R,ms){R.ph='wait';R.wait=ms;R.drops.forEach(d=>{if(d.st==='fall'){d.st=d.ok?'show':'gone';d.el&&d.el.classList.add(d.st)}})},
  miss(R,d){acWrong(R,R.q);d.st='show';acToast(`فات الصحيح: <b>${gmQ(d.t)}</b>`,'no',1600);this.end(R,1.7)},
  click(R,e){const b=e.target.closest('.ac-drop');if(!b||R.ph!=='play')return;const d=R.drops[+b.dataset.ac];if(!d||d.st!=='fall')return;
    if(d.ok){d.st='hit';b.classList.add('hit');const p=acRight(R,R.q,R.turn);R.maxc=Math.max(R.maxc,R.combo);acToast(`+${bgN(p)}`,'ok',700);this.end(R,.8)}
    else{d.st='bad';b.classList.add('bad');acWrong(R,R.q);const r=R.drops.find(x=>x.ok);acToast(`الصحيح: <b>${gmQ(r.t)}</b>`,'no',1600);this.end(R,1.7)}}};

/* ---------- ٢) رحلة البوم ---------- */
const AC_BOAT='<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M8 58h104l-14 20H24z" fill="rgb(255,255,255)"/><path d="M14 58h92" stroke="rgb(30,27,75)" stroke-width="3"/><path d="M60 8v50" stroke="rgb(255,255,255)" stroke-width="4"/><path d="M62 12q34 18 30 42H62z" fill="rgb(52,211,153)"/><path d="M58 18q-26 14-24 36h24z" fill="rgb(237,233,254)"/><circle cx="40" cy="68" r="3" fill="rgb(109,40,217)"/><circle cx="60" cy="68" r="3" fill="rgb(109,40,217)"/><circle cx="80" cy="68" r="3" fill="rgb(109,40,217)"/></svg>';
AC_G.boat={
  init(R){R.x=.5;R.tx=.5;R.g=null;R.ph='new';R.wait=0;R.pearls=0},
  scene(R){return `<div class="ac-sea" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div><div class="ac-q" id="acQ"></div><div class="ac-layer" id="acL"></div><div class="ac-dhow" id="acBoat">${AC_BOAT}</div><span class="ac-pearls" id="acPe" aria-label="اللآلئ">${bgN(R.pearls)}</span>`},
  mount(R){AC_G.meteor.paintQ.call(this,R);if(R.g)this.gate(R);this.layout(R)},
  paintQ:AC_G.meteor.paintQ,
  gate(R){const L=document.getElementById('acL');if(!L||!R.g)return;const g=R.g;L.innerHTML=`<div class="ac-gate" id="acGate">${g.q.o.map((o,j)=>`<button type="button" class="ac-buoy${g.st&&o.ok?' ok':''}${g.st==='bad'&&j===g.lane?' bad':''}" data-ac="${j}" style="width:${100/g.q.o.length}%"><span>${gmQ(o.t)}</span></button>`).join('')}</div>`},
  layout(R){const Q=document.getElementById('acQ');R.top=Q&&R.H?Math.min(.42,(Q.offsetTop+Q.offsetHeight+8)/R.H):.24;this.pos(R)},
  pos(R){const B=document.getElementById('acBoat'),G=document.getElementById('acGate');if(B)B.style.transform=`translate(${R.x*R.W}px,0) translate(-50%,0)`;if(G&&R.g){const y=R.top+(.66-R.top)*R.g.y;G.style.transform=`translateY(${y*R.H}px)`}},
  newQ(R){if(R.k>=R.n||(R.nt===1&&R.lives<=0)){acEnd(R);return}R.k++;if(R.k>1)R.turn=(R.turn+1)%R.nt;const q=acTake(acNext(R),3);R.q=q;
    const dur=[11,8.5,6.5][R.lv-1]*Math.max(.62,1-R.ok*.025);R.g={q,y:0,v:1/dur,st:'',lane:-1};R.ph='play';this.paintQ(R);this.gate(R);this.layout(R)},
  laneX(R,j){return (j+.5)/R.g.q.o.length},
  tick(R,dt){const d=R.tx-R.x;if(Math.abs(d)>.002){R.x+=Math.sign(d)*Math.min(Math.abs(d),2.2*dt)}
    if(R.ph==='new'){this.newQ(R);return}
    if(R.ph==='wait'){R.wait-=dt;R.g.y+=R.g.v*dt*.6;this.pos(R);if(R.wait<=0){R.ph='new'}return}
    R.g.y+=R.g.v*dt;this.pos(R);if(R.g.y>=1)this.judge(R)},
  judge(R){const g=R.g,n=g.q.o.length,j=Math.max(0,Math.min(n-1,Math.floor(R.x*n)));g.lane=j;const ok=g.q.o[j].ok;
    if(ok){g.st='ok';const p=acRight(R,g.q,R.turn);R.maxc=Math.max(R.maxc,R.combo);R.pearls++;const pe=document.getElementById('acPe');if(pe){pe.textContent=bgN(R.pearls);pe.classList.remove('pop');void pe.offsetWidth;pe.classList.add('pop')}acToast(`لؤلؤة! +${bgN(p)}`,'ok',800)}
    else{g.st='bad';acWrong(R,g.q);const r=g.q.o.find(o=>o.ok);acToast(`البوابة الصحيحة: <b>${gmQ(r.t)}</b>`,'no',1700);const B=document.getElementById('acBoat');if(B){B.classList.remove('rock');void B.offsetWidth;B.classList.add('rock')}}
    this.gate(R);this.pos(R);R.ph='wait';R.wait=ok?.9:1.8},
  steer(R,j){if(!R.g||R.ph!=='play')return;R.tx=this.laneX(R,Math.max(0,Math.min(R.g.q.o.length-1,j)))},
  click(R,e){if(!R.g||R.ph!=='play')return;const A=document.getElementById('acArena'),b=A.getBoundingClientRect();const n=R.g.q.o.length;const x=(e.clientX-b.left)/b.width;this.steer(R,Math.floor(x*n))},
  key(R,e){if(!R.g||R.ph!=='play')return;const n=R.g.q.o.length,cur=Math.max(0,Math.min(n-1,Math.floor(R.tx*n)));
    if(e.key==='ArrowLeft'){e.preventDefault();this.steer(R,cur-1)}else if(e.key==='ArrowRight'){e.preventDefault();this.steer(R,cur+1)}
    else if(/^[1-4١-٤]$/.test(e.key)){const k='1234'.indexOf(e.key)>=0?'1234'.indexOf(e.key):'١٢٣٤'.indexOf(e.key);this.steer(R,n-1-k)}}};

/* ---------- ٣) حصن اليقين ---------- */
/* العبارة: صواب وخطأ من البنك، أو سؤال وجواب معروض (صحيح، أو خيار خاطئ من خياراته). لا نص منقول في عبارة تتحرك */
function acFortPool(){return spPool().filter(x=>!PL_SCR.test(String(x.q))&&!x.o.some(o=>PL_SCR.test(String(o.t))))}
function acFortBuild(all,n){const A=tkShuffle(all).slice(0,n),half=Math.round(A.length/2);let k=0;
  return A.map(x=>{if(x.tf)return {...x,bad:x.bad,shown:''};const b=k++<half&&x.o.some(o=>!o.ok);const w=tkShuffle(x.o.filter(o=>!o.ok));return {...x,bad:b,shown:b?w[0].t:plRight(x)}})}
AC_G.fort={
  init(R){R.items=acFortBuild(R.all,R.n);R.live=[];R.next=0;R.spawn=.4;R.col=0;R.wall=0},
  scene(R){return `<div class="ac-fsky" aria-hidden="true"></div><div class="ac-flead"><b>فنّد الخاطئ قبل أن يبلغ السور، ودع الصحيح يُثبَّت.</b><small id="acFn"></small></div><div class="ac-layer" id="acL"></div><div class="ac-wall" id="acWall" aria-hidden="true">${Array.from({length:12},(_,i)=>`<i class="${i<R.wall?'on':''}"></i>`).join('')}</div>`},
  mount(R){const L=document.getElementById('acL');R.live.forEach(c=>{c.el=this.el(c);L.appendChild(c.el)});this.cnt(R);this.layout(R)},
  cnt(R){const n=document.getElementById('acFn');if(n)n.textContent=`العبارة ${bgN(Math.min(R.next,R.items.length))} من ${bgN(R.items.length)}`},
  el(c){const it=c.it,b=document.createElement('button');b.type='button';b.className='ac-claim'+(c.st?' '+c.st:'');
    b.innerHTML=it.tf?`<span class="ac-ct">${gmQ(it.q)}</span>`:`<small>${gmQ(it.q)}</small><span class="ac-ct">${gmQ(it.shown)}</span>`;b._c=c;return b},
  layout(R){R.live.forEach(c=>{if(c.el)c.el._w=0;this.pos(R,c)})},
  pos(R,c){if(!c.el)return;const y=.17+(.78-.17)*c.y;c.el.style.transform=`translate(${acX(R,c.el,R.W<640?.5:c.x)}px,${y*R.H}px) translate(-50%,-50%)`},
  tick(R,dt){R.spawn-=dt;const busy=R.live.filter(c=>!c.st).length;
    if(R.spawn<=0&&busy<2&&R.next<R.items.length){const it=R.items[R.next++];R.col=1-R.col;const c={it,x:R.col?.72:.28,y:0,v:1/[18,14,10.5][R.lv-1],st:''};R.live.push(c);const L=document.getElementById('acL');c.el=this.el(c);L&&L.appendChild(c.el);this.pos(R,c);this.cnt(R);R.spawn=[7,5.5,4][R.lv-1]}
    R.live.forEach(c=>{if(c.st){c.out-=dt;if(c.out<=0&&c.el){c.el.remove();c.el=null}return}c.y+=c.v*dt;this.pos(R,c);if(c.y>=1)this.reach(R,c)});
    R.live=R.live.filter(c=>c.el||!c.st);
    if(R.nt===1&&R.lives<=0||(R.next>=R.items.length&&!R.live.some(c=>!c.st)&&!R.live.length))acEnd(R)},
  done(c,st){c.st=st;c.out=1.1;c.el&&c.el.classList.add(st)},
  fix(it){return it.tf?(it.why?gmQ(it.why):'العبارة خاطئة'):`الصواب: <b>${gmQ(plRight(it))}</b>`},
  brick(R){R.wall=Math.min(12,R.wall+1);const W=document.getElementById('acWall');if(W){const i=W.children[R.wall-1];i&&i.classList.add('on')}},
  reach(R,c){const it=c.it;if(it.bad){acWrong(R,it);this.done(c,'breach');acToast(`بلغت السور عبارة خاطئة. ${this.fix(it)}`,'no',2600)}
    else{R.sc[0]+=5;R.ok++;this.brick(R);acHud(R);this.done(c,'kept');gmSnd(1);acToast('ثبتت عبارة صحيحة +٥','ok',800)}},
  click(R,e){const b=e.target.closest('.ac-claim');if(!b||!b._c||b._c.st)return;const c=b._c,it=c.it;
    if(it.bad){const p=acRight(R,it,0);R.maxc=Math.max(R.maxc,R.combo);this.done(c,'refuted');acToast(`فُنِّدت +${bgN(p)}. ${this.fix(it)}`,'ok',2200)}
    else{R.combo=0;R.bad++;R.sc[0]=Math.max(0,R.sc[0]-5);plMiss(R,it);gmSnd(0);acHud(R);this.done(c,'wrongly');acToast('هذه عبارة صحيحة؛ لا تُفنَّد. −٥','no',1700)}}};

/* ---------- ٤) شدّ الحبل ---------- */
const AC_TUGN=6;
AC_G.tug={
  init(R,G){R.T=+G.act;R.left=R.T;R.pos=0;R.h=[0,1].map(s=>({q:null,lock:0,pick:-1,flash:0,pool:[]}));R.h.forEach((h,s)=>this.draw(R,s));R.cd=3.2},
  draw(R,s){const h=R.h[s];if(!h.pool.length)h.pool=tkShuffle(R.all);let q=h.pool.pop();const o=R.h[1-s]&&R.h[1-s].q;if(o&&q&&q.q===o.q&&h.pool.length)q=h.pool.pop();
    /* ما يتوقف على خياراته كلها يُعرض بخياراته كلها؛ وغيره بأربعة منها على الأكثر */
    h.q=q.tf||PL_OPTDEP.test(q.q)||q.o.some(x=>AC_ALL.test(String(x.t)))?{...q,o:q.tf?q.o:tkShuffle(q.o)}:acTake(q,4);h.pick=-1},
  half(R,s){const h=R.h[s],q=h.q;return `<section class="ac-half${h.lock>0?' lock':''}" style="${gmTS(s)}" data-s="${s}" aria-label="${esc(gmTeam(s))}"><header><span class="gm-turn"><i class="gm-dot"></i>${esc(gmTeam(s))}</span><b>${bgN(R.sc[s])}</b></header>
    <p class="ac-hq">${gmQ(q.q)}</p><div class="ac-hopts">${q.o.map((o,j)=>`<button type="button" class="gm-opt${h.pick===j?' no':''}" data-ac="${j}"${h.lock>0?' disabled':''}><i>${GM_L[j]}</i><span>${plAns(q,o.t)}</span></button>`).join('')}</div>
    <p class="ac-hlock" aria-live="polite">${h.lock>0?`انتظروا ${bgN(Math.ceil(h.lock))} ث`:''}</p></section>`},
  scene(R){return `<div class="ac-rope" aria-hidden="true"><span class="ac-end e0" style="${gmTS(0)}"></span><i class="ac-line"></i><span class="ac-knot" id="acKnot"></span><span class="ac-end e1" style="${gmTS(1)}"></span></div><div class="ac-clock" id="acClk"></div><div class="ac-halves" id="acHv">${this.half(R,0)}${this.half(R,1)}</div>`},
  mount(R){this.knot(R);this.clk(R)},
  layout(R){this.knot(R)},
  /* الفريق الأول يمينًا (أول النصفين في الاتجاه من اليمين)، فالشدّ نحوه إلى اليمين */
  knot(R){const k=document.getElementById('acKnot');if(k)k.style.left=(50+R.pos/AC_TUGN*42)+'%'},
  clk(R){const c=document.getElementById('acClk');if(c){const s=Math.max(0,Math.ceil(R.left));c.textContent=bgN(Math.floor(s/60))+':'+bgN(s%60).padStart(2,bgN(0));c.classList.toggle('low',s<=10)}},
  re(R,s){const el=document.querySelector(`#acHv .ac-half[data-s="${s}"]`);if(el)el.outerHTML=this.half(R,s)},
  tick(R,dt){R.left-=dt;this.clk(R);R.h.forEach((h,s)=>{if(h.lock>0){const was=Math.ceil(h.lock);h.lock-=dt;if(h.lock<=0){h.lock=0;this.draw(R,s);this.re(R,s)}else if(Math.ceil(h.lock)!==was){const p=document.querySelector(`#acHv .ac-half[data-s="${s}"] .ac-hlock`);if(p)p.textContent=`انتظروا ${bgN(Math.ceil(h.lock))} ث`}}});
    if(R.left<=0||Math.abs(R.pos)>=AC_TUGN){R.tw=R.pos>0?0:R.pos<0?1:-1;acEnd(R)}},
  click(R,e){const b=e.target.closest('.ac-half .gm-opt');if(!b||b.disabled)return;const s=+b.closest('.ac-half').dataset.s,h=R.h[s],j=+b.dataset.ac;if(h.lock>0)return;const o=h.q.o[j];if(!o)return;
    if(o.ok){R.sc[s]++;R.ok++;R.pos+=s===0?1:-1;gmSnd(1);this.knot(R);const k=document.getElementById('acKnot');if(k){k.classList.remove('tug');void k.offsetWidth;k.classList.add('tug')}this.draw(R,s);this.re(R,s);acHud(R)}
    else{R.bad++;plMiss(R,h.q);h.pick=j;h.lock=2.5;gmSnd(0);this.re(R,s)}}};

/* ---------- التسجيل في «أدواتي» ---------- */
TK_PAGES.meteor=acPage('meteor',acMotionPool,['n','r','s'],['تهبط خيارات السؤال شُهُبًا من السماء، ولكل شهاب جواب.','المس الشهاب الصحيح قبل أن يبلغ الأرض: نقاطه تزيد مع كل إصابة متتالية.','إن لمستم خطأً أو فات الصحيحُ الأرضَ انكشف الصواب، وذهبت محاولة من ثلاث (في «الصف كله»).','في «فريقان بالتناوب» لكل فريق سؤال بالدور، ولا تنفد المحاولات. والسرعة تزيد كلما أحسنتم.']);
TK_PAGES.boat=acPage('boat',acMotionPool,['n','r','s'],['يبحر البوم نحو صفّ من البوابات، على كل بوابة جواب.','المس جهة البوابة الصحيحة (أو استعمل السهمين) ليتجه البوم إليها قبل أن يبلغها.','البوابة الصحيحة لؤلؤة ونقاط، والخاطئة صخرة تُذهب محاولة (في «الصف كله»).','اقرؤوا السؤال بصوت واحد، وتشاوروا، ثم يوجّه طالب واحد البوم.']);
TK_PAGES.fort=acPage('fort',acFortPool,['r','s'],['تقترب عبارات من الدرس من سور الحصن: بعضها صحيح وبعضها فيه خطأ.','فنّدوا العبارة الخاطئة بلمسها قبل أن تبلغ السور، فيظهر الصواب.','العبارة الصحيحة لا تُلمس: دعوها تبلغ السور فتُثبَّت حجرًا فيه. ومن فنّد صحيحة خسر خمس نقاط.','إن بلغت السورَ عبارةٌ خاطئة انثلم وذهبت محاولة من ثلاث. ولا تتحرك في اللعبة آية ولا حديث.']);
TK_PAGES.tug=acPage('tug',()=>gmClosed(gmScope()),['t'],['فريقان أمام الشاشة: لكل فريق نصفها وأسئلته الخاصة، ويُجاب في الوقت نفسه.','كل جواب صحيح يشدّ الحبل خطوة نحو الفريق، ويأتي سؤال جديد فورًا.','الجواب الخاطئ يوقف الفريق ثانيتين ونصفًا، فالدقة قبل السرعة.','يفوز من يبلغ الحبل جهته (ست خطوات) أو يكون الحبل في جهته حين ينتهي الوقت.']);
try{Object.assign(TK_GART,{meteor:'M4 4l7 7M7 3l5 5M3 8l5 5M15 13a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',boat:'M3 16h18l-3 4H6zM12 3v13M13 4q6 4 5 11h-5zM11 6q-5 3-4 9h4',fort:'M4 21V9h3v3h3V9h4v3h3V9h3v12zM10 21v-5h4v5M4 9V6M20 9V6',tug:'M2 12h20M8 12l-2-3M8 12l-2 3M16 12l2-3M16 12l2 3M12 9v6'})}catch(e){}
/* مقبض للفحص الآلي في المتصفح (الحالة الجارية وحدها، بلا بيانات المعلم) */
try{window.ALM_AC={run:gmRun,g:AC_G}}catch(e){}
