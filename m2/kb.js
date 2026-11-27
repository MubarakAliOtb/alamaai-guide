/* ================= v130: «بطاقات الدليل» — المحرك والواجهة =================
   كل موضوع في الدليل (حساب في FD_ACC له قسم pN-sM) يُفتح مجموعةَ بطاقات تُسحب أفقيًّا: #k-<id>.
   البطاقات تُبنى من بيانات الدليل نفسها (st: السؤال والفكرة والفعل، ومنشورات FD_POSTS بوسم قوة سندها وملاحظتها العلمية)،
   ويزيد عليها KB_X (m2/kb-data.js) مثالًا قريبًا وتفاعلًا وتطبيقًا في المادتين. وبطاقات البحوث KB_R مكتوبة كاملة.
   وصفحة «الدليل» (#guide) تعرض الموضوعات: بحث فوري، ثم مختارات، ثم تبويب الأبواب وبلاطات كل جزء. الحالة في dms:kb (done وplan وdoor).
   الأصناف كلها تبدأ بـkb- أو kbc- أو kbh- أو kbt/kbf/kbp/kbg، وتتجنب kb-top وkb-h وkb-t وkb-d وkb-sum وkb-mini وkb-grid (لوحة المهام في أدواتي). */
const KB_RM={};KB_R.forEach(r=>{KB_RM[r.id]=r});
const KB_DOORN=['الإطار','العلم','الصنعة','الأثر','المعلّم','الآفاق','أوراقٌ تُفكِّر','القيم','الملاحق'];
/* صورة الغلاف بحسب الباب (صور الأقسام نفسها، بلا أشخاص)، وللجزء صورته إن خُصّ */
const KB_PH=['map','al-glow-700','al-lessons-900','al-tools-900','al-reading-600','al-rocket-900','nb','al-today-900','brief'];
const KB_PHP={1:'al-guide-900',8:'home',9:'home',13:'lab'};
const kbSt=()=>{const s=store.get('kb',{})||{};return {done:s.done||{},plan:s.plan||{},door:s.door||0}};
const kbSave=s=>store.set('kb',s);
const kbRM=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}};
/* للبحث: بلا تشكيل ولا تطويل (0x64B–0x652 و0x670 و0x640)، والهمزات والتاء المربوطة والألف المقصورة موحّدة */
const kbNorm=s=>{let o='';for(const ch of String(s||'')){const c=ch.charCodeAt(0);if((c>=0x64B&&c<=0x652)||c===0x670||c===0x640)continue;o+=ch}
  return o.replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase()};
const kbIc=n=>`<svg class="ic" aria-hidden="true"><use href="#${n}"/></svg>`;
const kbNum=(n,a,b,c,d)=>n===1?a:n===2?b:n+' '+(n<=10?c:d);
const kbCnt=n=>kbNum(n,'بطاقة واحدة','بطاقتان','بطاقات','بطاقة');
const kbTop=n=>kbNum(n,'موضوع واحد','موضوعان','موضوعات','موضوعًا');
const kbStp=n=>kbNum(n,'خطوة واحدة','خطوتان','خطوات','خطوة');
const kbV=(v,u)=>ar(String(v))+(u==null||u==='%'?'٪':u);
const kbMin=n=>{const m=Math.max(2,Math.round(n/3));return m===2?'دقيقتين':m+(m<=10?' دقائق':' دقيقة')};
const kbName=id=>KB_RM[id]?KB_RM[id].n:(FD_A[id]?FD_A[id].n:'');
const kbDoorOf=pi=>TOC.doors.findIndex(d=>d.parts.indexOf(pi)>-1);
let KB_BY=null,kbD=null,kbI=-1,kbIO=null,kbW={},kbBackY=null,kbFrom='',kbBound=false,kbQv='';

/* الموضوعات بحسب الجزء: كل حساب له قصة (st) وقسم في جزء منشور */
function kbTopics(){if(KB_BY)return KB_BY;KB_BY={};
  FD_ACC.forEach(a=>{const m=/^p(\d+)-s(\d+)$/.exec(a.sec||'');if(!m||!a.st||a.st.length<3)return;const i=+m[1];if(!LIVE.has(i))return;(KB_BY[i]=KB_BY[i]||[]).push(a)});
  Object.keys(KB_BY).forEach(i=>KB_BY[i].sort((x,y)=>(+x.sec.split('-s')[1])-(+y.sec.split('-s')[1])));
  return KB_BY}
function kbAll(){const BY=kbTopics();let all=[];Object.keys(BY).map(Number).sort((a,b)=>a-b).forEach(i=>{all=all.concat(BY[i])});return all}

/* ---------- بناء مجموعة البطاقات ---------- */
/* أداة التصنيف المكتوبة في قسم الموضوع من الدليل ([data-sorter] في الأجزاء المضمّنة في الصفحة): تُؤخذ كما هي */
const KB_SRT={};
function kbSorter(sec){if(sec in KB_SRT)return KB_SRT[sec];let d=null;
  try{const s=document.getElementById(sec),el=s&&s.querySelector('[data-sorter]');if(el){const j=JSON.parse(el.getAttribute('data-sorter'));if(j&&j.q&&j.bins&&j.bins.length>1&&j.items&&j.items.length)d={t:'sort',q:j.q,bins:j.bins,items:j.items,done:'النص الكامل لهذه الأداة وسياقها في القسم.'}}}catch(e){}
  return KB_SRT[sec]=d}
const kbPlain=s=>kbNorm(String(s||'').replace(/<[^>]+>/g,' ')).replace(/[«»"'.،؛:؟!()\[\]]/g,'').replace(/\s+/g,' ').trim();
/* اختبار من المنشورات هو عنصر من أداة التصنيف نفسها: يكفي ظهوره فيها */
function kbDupQuiz(p,S){if(!S||p.k!=='quiz')return false;const t=kbPlain(p.t).slice(0,10),b=kbPlain(p.b);
  if(t.length>=8&&kbPlain(S.q).indexOf(t)===0)return true;
  return b.length>6&&S.items.some(it=>{const x=kbPlain(it[0]);return x.length>6&&(x.indexOf(b)>-1||b.indexOf(x)>-1)})}
const kbHasAct=a=>!!((KB_X[a.id]&&KB_X[a.id].act)||kbSorter(a.sec)||FD_POSTS.some(p=>p.a===a.id&&p.k==='quiz'));
/* منشورات الموضوع: ما فيه ملاحظة علمية لا يُحذف، ثم التفاعلي؛ وتُعرض بترتيبها في الدليل */
function kbPosts(id,cap,S){const all=FD_POSTS.filter(p=>p.a===id&&p.k!=='tmr'&&!kbDupQuiz(p,S));
  const pr={quiz:0,dilemma:1,dd:2,try:3,idea:4,tool:5,stat:6,quote:7},w=p=>(p.cv?-10:0)+(pr[p.k]==null?9:pr[p.k]);
  return all.map((p,i)=>[p,i]).sort((a,b)=>w(a[0])-w(b[0])||a[1]-b[1]).slice(0,cap).sort((a,b)=>a[1]-b[1]).map(x=>x[0])}
function kbDeck(id){
  const R=KB_RM[id];
  if(R)return {id,r:R,n:R.n,tag:R.tag,who:R.who,q:R.q,ic:'ai-'+R.ic,ph:R.ph,sec:R.sec,secT:R.secT,rel:R.rel,cards:[{t:'cover'}].concat(R.cards,[{t:'end'}])};
  const a=FD_A[id];if(!a||!a.st||a.st.length<3||!/^p\d+-s\d+$/.test(a.sec||''))return null;
  const x=KB_X[id]||{},pi=+a.sec.slice(1).split('-')[0],P=PARTS[pi];if(!P||!LIVE.has(pi))return null;
  const tmr=FD_POSTS.find(p=>p.a===id&&p.k==='tmr'),di=kbDoorOf(pi),S=kbSorter(a.sec),rich=!!(x.like||x.ie);
  const cards=[{t:'cover'},{t:'idea',k:'الفكرة',h:a.st[1],fig:x.fig,dg:!x.fig&&typeof FD_DG!=='undefined'&&FD_DG[id]?id:''}];
  if(x.like)cards.push({t:'like',k:'بمثال قريب',h:x.like[0],p:x.like[1]});
  if(x.act)cards.push(Object.assign({k:'جرّب بنفسك'},x.act));else if(S)cards.push(Object.assign({k:'جرّب بنفسك'},S));
  if(tmr)cards.push({t:'post',p:tmr});else if(x.steps)cards.push({t:'steps',k:'الخطوات',items:x.steps});
  if(x.ie)cards.push(Object.assign({t:'app',sub:'ie'},x.ie));
  if(x.qr)cards.push(Object.assign({t:'app',sub:'qr'},x.qr));
  /* المثرّى لا يزيد على 13 بطاقة: ثلاثة منشورات إن كان في آخره أداة التصنيف، وأربعة إن لم تكن */
  const ps=kbPosts(id,rich?(x.act&&S?3:4):6,S);
  ps.filter(p=>p.k!=='quiz').forEach(p=>cards.push({t:'post',p}));
  ps.filter(p=>p.k==='quiz').forEach(p=>cards.push({t:'post',p}));
  if(x.act&&S)cards.push(Object.assign({k:'اختبر نفسك'},S));
  cards.push({t:'do',k:'خطوتك الأولى',h:a.st[2]});
  cards.push({t:'end'});
  const ph=KB_PHP[pi]||KB_PH[di];
  return {id,a,n:a.n,tag:P.label+' · '+shortT(pi),who:a.who,q:a.st[0],ic:a.ic?'ai-'+a.ic:'ai-cards',ph:ph?'m2/img/'+ph+'.webp':'',sec:a.sec,rel:x.rel,part:pi,cards}}
function kbNext(D){if(D.r)return null;const all=kbAll(),k=all.findIndex(a=>a.id===D.id);return k>-1&&k<all.length-1?all[k+1]:null}

/* ---------- المخططات الصغيرة (تتحرك عند ظهور البطاقة) ---------- */
function kbFig(f){if(!f)return '';
  if(f[0]==='hub'){const L=f[2],P=L.length===3?[[250,46],[70,46],[160,158]]:[[250,42],[70,42],[250,150],[70,150]];
    return `<figure class="kb-fig"><svg viewBox="0 0 320 190" role="img" aria-label="${esc(f[1]+': '+L.join('، '))}">${P.slice(0,L.length).map((p,i)=>`<line class="kbg-l" style="--d:${i}" x1="160" y1="96" x2="${p[0]}" y2="${p[1]}"/>`).join('')}<circle class="kbg-c" cx="160" cy="96" r="40"/><text class="kbg-ct${f[1].length>7?' sm':''}" x="160" y="101">${f[1]}</text>${P.slice(0,L.length).map((p,i)=>`<g class="kbg-s" style="--d:${i}"><rect x="${p[0]-48}" y="${p[1]-18}" width="96" height="36" rx="18"/><text x="${p[0]}" y="${p[1]+5}">${L[i]}</text></g>`).join('')}</svg></figure>`}
  if(f[0]==='two'){const w=f[3].split(' ');
    return `<figure class="kb-fig"><svg viewBox="0 0 320 170" role="img" aria-label="${esc(f[1]+' و'+f[2]+': '+f[3])}"><path class="kbg-l" style="--d:0" d="M196 46 C150 46 130 85 100 85"/><path class="kbg-l" style="--d:1" d="M196 124 C150 124 130 85 100 85"/><g class="kbg-s" style="--d:0"><rect x="196" y="26" width="104" height="40" rx="20"/><text x="248" y="51">${f[1]}</text></g><g class="kbg-s" style="--d:1"><rect x="196" y="104" width="104" height="40" rx="20"/><text x="248" y="129">${f[2]}</text></g><circle class="kbg-c" cx="60" cy="85" r="40"/><text class="kbg-ct sm" x="60" y="80">${w.slice(0,2).join(' ')}</text><text class="kbg-ct sm" x="60" y="98">${w.slice(2).join(' ')}</text></svg></figure>`}
  if(f[0]==='flow')return `<figure class="kb-fig"><ol class="kbg-flow${f[1].length>5?' g3':' gn'}" style="--n:${f[1].length}">${f[1].map((t,i)=>`<li style="--d:${i}"><i>${i+1}</i><span>${t}</span></li>`).join('')}</ol></figure>`;
  if(f[0]==='stack')return `<figure class="kb-fig"><ol class="kbg-stack" reversed>${f[1].map((t,i)=>`<li style="--d:${f[1].length-1-i}"><span>${t}</span></li>`).join('')}</ol></figure>`;
  if(f[0]==='grid'){const C=f[1],Rw=f[2],M=f[3];
    return `<figure class="kb-fig"><div class="kbg-grid" role="img" aria-label="${esc(f[4])}"><b></b>${C.map(c=>`<b>${c}</b>`).join('')}${Rw.map((r,ri)=>`<b class="rw">${r}</b>`+C.map((c,ci)=>`<i class="${M[ri+'-'+ci]||''}"></i>`).join('')).join('')}</div><figcaption>${f[4]}</figcaption></figure>`}
  return ''}
/* مسارح «بدّل وانظر» */
const KB_CUP0='اضغط العنصر ليدخل الكأس، واضغطه ثانية ليخرج.';
const KB_STAGE={
  slide:()=>`<div class="sl"><i class="sl-deco"></i><div class="sl-ay"><span></span><span class="w"></span><span></span></div><div class="sl-ay l2"><span></span><span></span></div><em class="sl-mean">المعنى</em><div class="sl-para"><span></span><span></span><span></span></div><b class="sl-say">${kbIc('ai-mic')}يُقال باللسان</b></div>`,
  dots:()=>`<div class="dg">${'<i></i>'.repeat(12)}</div>`};

/* ---------- بطاقة واحدة ---------- */
function kbQuizHTML(p){const ans=fdPrefs.q?fdPrefs.q[p.id]:null;const done=ans!=null;
  return `<div class="kb-quiz">${p.o.map((o,j)=>`<button data-kb="qz" data-j="${j}" ${done?'disabled':''} class="${done?(j===p.c?'ok':(j===ans?'bad':'')):''}">${o}</button>`).join('')}</div><p class="kb-fb${done?(ans===p.c?' ok':' no'):''}"${done?'':' hidden'}>${done?(ans===p.c?'<b>أصبت.</b> ':'<b>ليس تمامًا.</b> ')+p.x:''}</p>`}
function kbCard(D,c,i,n,st){let h='',extra='',style='',foot='';const K=t=>`<p class="kb-k">${t}</p>`;
  switch(c.t){
  case 'cover':
    h=`<p class="kb-k">${esc(D.tag)}</p><span class="kb-ic">${kbIc(D.ic)}</span><h1>${esc(D.n)}</h1><p class="kb-q">${D.q}</p><p class="kb-meta">${D.who?esc(D.who)+' · ':''}${kbCnt(n-2)} · نحو ${kbMin(n-2)}</p><p class="kb-hint">اسحب، أو اضغط «التالي»${kbIc('i-arrow')}</p>`;
    if(D.ph){extra=' ph';style=` style="--kbph:url('${D.ph}')"`}break;
  case 'idea':h=K(c.k||'الفكرة')+kbFig(c.fig)+(c.dg?`<figure class="kb-dg">${FD_DG[c.dg]()}</figure>`:'')+`<h2 class="kb-hd">${c.h}</h2>`+(c.p?`<p class="kb-p">${c.p}</p>`:'');break;
  case 'like':h=K(c.k)+`<span class="kb-bulb">${kbIc('ai-bulb')}</span><h2 class="kb-hd sm">${c.h}</h2><p class="kb-p">${c.p}</p>`;break;
  case 'note':h=K(c.k)+`<h2 class="kb-hd sm">${c.h}</h2><p class="kb-p">${c.p}</p>`;break;
  case 'src':h=K(c.k)+`<p class="kb-ref">${c.ref}</p>`+(c.p?`<p class="kb-p sm">${c.p}</p>`:'');break;
  case 'steps':h=K(c.k)+`<ol class="kb-steps">${c.items.map((s,j)=>`<li style="--d:${j}"><b>${s[0]}</b>${s[1]?`<span>${s[1]}</span>`:''}</li>`).join('')}</ol>`;break;
  case 'app':h=`<p class="kb-k">${kbIc(c.sub==='qr'?'ai-mushaf':'i-book')}${c.sub==='qr'?'في القرآن الكريم':'في التربية الإسلامية'}${c.mine?'<em>مقترح</em>':''}</p><p class="kb-l">${c.l}</p><div class="kb-no"><small>بدل</small><p>${c.no}</p></div><button class="kb-rev" data-kb="rev" aria-expanded="false">اكشف البديل${kbIc('i-arrow')}</button><div class="kb-yes" hidden><small>جرّب</small><p>${c.yes}</p></div>`;break;
  case 'do':{const key=D.id+':do',on=!!st.plan[key];
    h=K(c.k)+`<h2 class="kb-hd" data-plant>${c.h}</h2><button class="kb-plan${on?' on':''}" data-kb="plan" data-pid="${key}" aria-pressed="${on}">${kbIc('i-check')}<span>${on?'في خطتي':'أضفها إلى خطتي'}</span></button>`;break}
  case 'pick':h=K(c.k)+`<h2 class="kb-hd sm">${c.h}</h2><div class="kb-opts">${c.opts.map((o,j)=>{const key=D.id+':p'+j,on=!!st.plan[key];return `<button class="kb-opt${on?' on':''}" data-kb="plan" data-pid="${key}" aria-pressed="${on}"><i>${kbIc('i-check')}</i><span data-plant>${o}</span></button>`}).join('')}</div>`;break;
  case 'post':{const p=c.p,kd=FD_KIND[p.k]||['فكرة'];h=K(kd[0]);
    if(p.k==='stat')h+=`<div class="kb-num">${p.s}</div><h2 class="kb-hd sm">${p.t}</h2>`;
    else if(p.k==='quote')h+=`<blockquote class="kb-quote">${p.t}</blockquote>`;
    else h+=`<h2 class="kb-hd sm">${p.t}</h2>`;
    if(p.k==='dd'&&p.dd)h+=`<div class="kb-dd"><div class="y"><b>افعل</b>${p.dd[0]}</div><div class="n"><b>لا تفعل</b>${p.dd[1]}</div></div>`;
    if(p.b)h+=`<div class="kb-body">${p.b}</div>`;
    if(p.k==='quiz'&&p.o)h+=kbQuizHTML(p);
    if(p.cv)h+=`<div class="kb-cv"><b>ملاحظة علمية</b>${p.cv} <a href="#refs">المراجع</a></div>`;
    if(p.ev&&FD_EVL[p.ev])foot=`<button class="kb-src kb-ev" data-kb="ev" data-evk="${p.ev}">قوة السند: ${FD_EVL[p.ev][0]}</button>`;break}
  case 'sort':h=K(c.k||'جرّب بنفسك')+`<p class="kb-qs">${esc(c.q)}</p><div class="kb-w kb-sort"><div class="kb-sc"><span class="kb-sn"></span><p class="kb-si"></p></div><div class="kb-bins">${c.bins.map((b,j)=>`<button data-kb="bin" data-j="${j}">${esc(b)}</button>`).join('')}</div><p class="kb-fb" aria-live="polite" hidden></p><div class="kb-res" hidden></div></div>`;break;
  case 'order':h=K(c.k||'جرّب بنفسك')+`<p class="kb-qs">${c.q}</p><div class="kb-w kb-order"><ol class="kb-seq" aria-label="ترتيبك"></ol><div class="kb-pool"></div><p class="kb-fb" aria-live="polite" hidden></p></div>`;break;
  case 'cup':h=K(c.k||'جرّب بنفسك')+`<p class="kb-qs">${c.q}</p><div class="kb-w kb-cup"><div class="kb-cupv"><ul class="kb-spill" aria-label="ما فاض"></ul><div class="kb-glass"><ul class="kb-slots" aria-label="ما في الكأس"></ul></div></div><div class="kb-chips">${c.items.map((it,j)=>`<button data-kb="cup" data-j="${j}" aria-pressed="false">${it[0]}</button>`).join('')}</div><p class="kb-fb" aria-live="polite">${KB_CUP0}</p></div>`;break;
  case 'tog':h=K(c.k||'جرّب بنفسك')+`<p class="kb-qs">${c.q}</p><div class="kb-w kb-tog"><div class="kb-stage ${c.stage}" aria-hidden="true">${KB_STAGE[c.stage]()}</div><p class="kb-cap" aria-live="polite">${c.base}</p><div class="kb-tg">${c.toggles.map((t,j)=>`<button data-kb="tog" data-j="${j}" aria-pressed="false"><small>${t[0]}</small><b>${t[1]}</b></button>`).join('')}</div><p class="kb-fb" aria-live="polite" hidden></p></div>`;break;
  case 'guess':h=K(c.k||gzF('خمّن أولًا','خمّني أولًا'))+`<p class="kb-qs">${c.q}</p><div class="kb-w kb-guess"><output class="kb-gv">${kbV(50,c.unit||'')}</output><input type="range" min="0" max="100" step="1" value="50" aria-label="تخمينك" data-kbr><button class="btn accent" data-kb="guess">اكشف الجواب</button><div class="kb-ga" hidden><div class="kb-gbar"><i></i><b></b><em></em></div><p class="kb-gt"></p><p class="kb-p sm">${c.after||''}</p></div></div>`;break;
  case 'bars':h=K(c.k)+`<h2 class="kb-hd sm">${c.h}</h2><ul class="kb-barsl">${c.rows.map((r,j)=>`<li style="--w:${Math.round(r[1]/(r[2]||100)*100)}%;--d:${j}"><span>${r[0]}</span><b>${kbV(r[1],c.unit)}</b><i></i></li>`).join('')}${c.zero?`<li class="z" style="--w:0%;--d:${c.rows.length}"><span>${c.zero}</span><b>${ar(0)}</b><i></i></li>`:''}</ul>${c.p?`<p class="kb-p sm">${c.p}</p>`:''}`;break;
  case 'build':h=K(c.k||'جرّب بنفسك')+`<p class="kb-qs">${c.q}</p><div class="kb-w kb-build"><p class="kb-prompt" data-gz="0"><span class="pt" data-j="0" hidden>${c.parts[0][1]} </span><span class="base">${c.base}</span>${c.parts.slice(1).map((p,j)=>`<span class="pt" data-j="${j+1}" hidden> ${p[1]}</span>`).join('')}</p><div class="kb-meter" aria-hidden="true"><i></i></div><div class="kb-tg">${c.parts.map((p,j)=>`<button data-kb="bld" data-j="${j}" aria-pressed="false"><b>${p[0]}</b></button>`).join('')}</div><p class="kb-fb" aria-live="polite" hidden></p></div>`;break;
  case 'end':{const nx=kbNext(D),rel=D.rel&&(KB_RM[D.rel]||FD_A[D.rel])?D.rel:'';
    h=`<span class="kb-done">${kbIc('i-check')}</span><h2 class="kb-hd">أتممت «${esc(D.n)}»</h2><p class="kb-p" id="kbEndP"></p><div class="kb-endb">${D.sec?`<a class="btn accent" href="#${D.sec}">${D.r?'في الدليل: '+esc(D.secT||''):'اقرأ القسم كاملًا'}</a>`:''}${rel?`<a class="btn" href="#k-${rel}">${D.r?'بطاقات: ':'من البحوث: '}${esc(kbName(rel))}</a>`:''}${nx?`<a class="btn" href="#k-${nx.id}">التالي: ${esc(nx.n)}</a>`:''}<a class="btn ghost" href="#guide">كل الموضوعات</a></div>`;break}
  }
  if(c.src||c.srcFull)foot=`<p class="kb-src">${esc(c.srcFull||((D.r?'الدراسة، ':'')+c.src))}</p>`;
  return `<section class="kb-card kbc-${c.t}${extra}" data-i="${i}"${style} aria-label="بطاقة ${i+1} من ${n}">${h}${foot}</section>`}

/* ---------- فتح الموضوع ---------- */
function kbOpen(id){const V=$('#kb');if(!V)return;const D=kbDeck(id);
  if(!D){location.replace('#guide');return}
  kbD=D;kbI=-1;kbW={};const n=D.cards.length,st=kbSt();
  V.innerHTML=`<div class="kb-head"><a class="kb-x" href="#${kbFrom||'guide'}" aria-label="إغلاق البطاقات">${kbIc('i-x')}</a><div class="kb-ttl"><small>${esc(D.tag)}</small><b>${esc(D.n)}</b></div><span class="kb-count" id="kbCount" aria-live="polite"></span></div>
<div class="kb-bars" id="kbBars" aria-hidden="true">${D.cards.map(()=>'<i></i>').join('')}</div>
<div class="kb-track" id="kbTrack" tabindex="0" aria-label="بطاقات ${esc(D.n)}">${D.cards.map((c,i)=>kbCard(D,c,i,n,st)).join('')}</div>
<div class="kb-nav"><button class="btn kb-prev" data-kb="prev">السابق</button><button class="btn accent kb-next" data-kb="next">التالي</button></div>`;
  kbBind();
  const T=$('#kbTrack'),cards=$$('.kb-card',T);
  if(kbIO){kbIO.disconnect();kbIO=null}
  if('IntersectionObserver' in window){kbIO=new IntersectionObserver(es=>{es.forEach(e=>{if(!e.isIntersecting)return;const i=+e.target.dataset.i;if(e.intersectionRatio>=.2){e.target.classList.add('on');kbInit(i,e.target)}if(e.intersectionRatio>=.6)kbAt(i)})},{root:T,threshold:[.2,.6]});cards.forEach(c=>kbIO.observe(c))}
  else cards.forEach((c,i)=>{c.classList.add('on');kbInit(i,c)});
  kbAt(0);window.scrollTo(0,0);try{alSec();alHdr()}catch(e){}}
function kbCards(){return $$('#kbTrack .kb-card')}
function kbAt(i){if(!kbD||i===kbI)return;const first=kbI<0;kbI=i;const n=kbD.cards.length,cards=kbCards();
  $$('#kbBars i').forEach((b,j)=>b.classList.toggle('on',j<=i));
  const C=$('#kbCount');if(C)C.textContent=(i+1)+' من '+n;
  if(cards[i]){cards[i].classList.add('on');kbInit(i,cards[i])}
  const pv=$('#kb .kb-prev'),nx=$('#kb .kb-next');if(pv)pv.disabled=i===0;if(nx)nx.hidden=i===n-1;
  /* بطاقة أقصر من التي قبلها: يعود أعلى الصفحة فلا يبقى القارئ تحت آخرها */
  if(!first&&window.pageYOffset>8)window.scrollTo({top:0,behavior:kbRM()?'auto':'smooth'});
  if(i===n-1)kbFinish()}
function kbGo(i){const cards=kbCards(),T=$('#kbTrack');if(!T||i<0||i>=cards.length)return;
  T.scrollBy({left:cards[i].getBoundingClientRect().left-T.getBoundingClientRect().left,behavior:kbRM()?'auto':'smooth'});
  if(!kbIO)kbAt(i)}
function kbFinish(){const st=kbSt();st.done[kbD.id]=1;kbSave(st);
  const mine=Object.keys(st.plan).filter(k=>k.indexOf(kbD.id+':')===0).length;
  const p=$('#kbEndP');if(p)p.textContent=mine?'وفي خطتك منه '+kbStp(mine)+'، تجدها في صفحة «الدليل».':'ما بقي منه إلا أن يُجرَّب في حصة.'}

/* ---------- تهيئة التفاعل عند ظهور البطاقة ---------- */
function kbInit(i,el){if(kbW[i])return;const c=kbD.cards[i],w=kbW[i]={};const W=$('.kb-w',el);if(!W)return;
  if(c.t==='sort'){w.i=0;w.ok=0;kbSortShow(W,c,w)}
  else if(c.t==='order'){w.next=0;let o=c.items.map((t,j)=>j);for(let k=o.length-1;k>0;k--){const r=Math.floor(Math.random()*(k+1));const x=o[k];o[k]=o[r];o[r]=x}
    if(o.every((v,k)=>v===k)){const x=o[0];o[0]=o[1];o[1]=x}
    $('.kb-pool',W).innerHTML=o.map(j=>`<button data-kb="ord" data-j="${j}">${c.items[j]}</button>`).join('')}
  else if(c.t==='cup'){w.sel=[]}
  else if(c.t==='tog'){w.on={};w.seen={}}
  else if(c.t==='build'){w.on={}}}
function kbSortShow(W,c,w){const it=c.items[w.i];w.lock=false;$('.kb-sn',W).textContent=(w.i+1)+' من '+c.items.length;
  const si=$('.kb-si',W);si.textContent=it[0];si.classList.remove('in');void si.offsetWidth;si.classList.add('in');
  $('.kb-sc',W).hidden=false;$('.kb-bins',W).hidden=false;$('.kb-res',W).hidden=true;
  $$('.kb-bins button',W).forEach(b=>{b.disabled=false;b.className=''});const fb=$('.kb-fb',W);fb.hidden=true;fb.innerHTML=''}
function kbSortPick(W,c,w,j){if(w.lock)return;w.lock=true;const it=c.items[w.i],ok=j===it[1];if(ok)w.ok++;
  $$('.kb-bins button',W).forEach((b,x)=>{b.disabled=true;if(x===it[1])b.classList.add('ok');else if(x===j)b.classList.add('bad')});
  const fb=$('.kb-fb',W),last=w.i===c.items.length-1;fb.hidden=false;fb.className='kb-fb '+(ok?'ok':'no');
  fb.innerHTML=`<span><b>${ok?'أصبت.':'ليس تمامًا.'}</b> ${esc(it[2]||'')}</span><button class="kb-nx" data-kb="snext">${last?'النتيجة':'العنصر التالي'}</button>`;
  const nb=$('.kb-nx',fb);if(nb)try{nb.focus({preventScroll:true})}catch(e){}}
function kbSortNext(W,c,w){if(w.i<c.items.length-1){w.i++;kbSortShow(W,c,w);return}
  $('.kb-sc',W).hidden=true;$('.kb-bins',W).hidden=true;$('.kb-fb',W).hidden=true;const r=$('.kb-res',W);r.hidden=false;
  r.innerHTML=`<div class="kb-score"><b>${w.ok}</b><span>من ${c.items.length}</span></div><p>${esc(c.done||'')}</p><button class="kb-nx ghost" data-kb="sagain">أعد المحاولة</button>`}
function kbCupDraw(W,c,w,added){const cap=c.cap||4,inn=w.sel.slice(0,cap),out=w.sel.slice(cap);
  $('.kb-slots',W).innerHTML=inn.map(j=>`<li class="${c.items[j][1]}${j===added?' new':''}">${c.items[j][0]}${c.items[j][1]==='x'?'<small>دخيل</small>':''}</li>`).join('');
  $('.kb-spill',W).innerHTML=out.map(j=>`<li>${c.items[j][0]}</li>`).join('');
  $$('.kb-chips button',W).forEach(b=>{const j=+b.dataset.j,on=w.sel.indexOf(j)>-1;b.setAttribute('aria-pressed',on);b.className=on?c.items[j][1]:''});
  const fb=$('.kb-fb',W);$('.kb-glass',W).classList.toggle('over',w.sel.length>cap);if(!w.sel.length){fb.className='kb-fb';fb.textContent=KB_CUP0;return}
  const ne=c.items.filter(x=>x[1]==='e').length,he=w.sel.filter(j=>c.items[j][1]==='e').length,hx=w.sel.length-he;
  let k='more',t=c.more;if(w.sel.length>cap){k='no';t=c.over}else if(hx){k='no';t=c.bad}else if(he===ne){k='ok';t=c.ok}
  fb.className='kb-fb '+k;fb.innerHTML=(k==='ok'?'<b>أحسنت.</b> ':'')+t}
function kbTogDraw(W,c,w,last){const S=$('.kb-stage',W);c.toggles.forEach((t,j)=>S.classList.toggle(t[2],!!w.on[j]));
  $$('.kb-tg button',W).forEach((b,j)=>b.setAttribute('aria-pressed',!!w.on[j]));
  let cap=c.base;const on=c.toggles.map((t,j)=>w.on[j]?j:-1).filter(j=>j>-1);
  if(on.length){const j=w.on[last]?last:on[on.length-1];cap=c.toggles[j][3]}
  if(c.clash){const a=c.toggles.findIndex(t=>t[2]===c.clash[0]),b2=c.toggles.findIndex(t=>t[2]===c.clash[1]);if(w.on[a]&&w.on[b2])cap=c.clash[2]}
  $('.kb-cap',W).textContent=cap;
  if(Object.keys(w.seen).length===c.toggles.length){const fb=$('.kb-fb',W);fb.hidden=false;fb.className='kb-fb ok';fb.innerHTML=c.done}}
function kbBuildDraw(W,c,w){const n=c.parts.length,on=c.parts.map((p,j)=>!!w.on[j]);
  $$('.kb-prompt .pt',W).forEach(s=>{s.hidden=!on[+s.dataset.j]});$('.kb-prompt .base',W).classList.toggle('off',on[1]);
  $$('.kb-tg button',W).forEach((b,j)=>b.setAttribute('aria-pressed',on[j]));const k=on.filter(Boolean).length;
  $('.kb-meter i',W).style.width=Math.round(k/n*100)+'%';const fb=$('.kb-fb',W);
  if(k===n){fb.hidden=false;fb.className='kb-fb ok';fb.innerHTML=c.done}else fb.hidden=true}
function kbGuess(W,c){const inp=$('input',W),g=+inp.value,a=c.a,d=Math.abs(g-a);inp.disabled=true;$('[data-kb="guess"]',W).hidden=true;
  const A=$('.kb-ga',W);A.hidden=false;const bar=$('.kb-gbar',W);bar.style.setProperty('--g',g+'%');bar.style.setProperty('--a',a+'%');
  $('.kb-gbar b',W).textContent=kbV(a,c.unit||'');$('.kb-gbar em',W).textContent='تخمينك '+kbV(g,c.unit||'');
  $('.kb-gt',W).textContent=d<=3?'قريب جدًّا من الواقع.':(g<a?'الواقع أعلى مما توقعت بنحو '+Math.round(d)+' نقطة.':'الواقع أقل مما توقعت بنحو '+Math.round(d)+' نقطة.');
  const out=$('.kb-gv',W);out.classList.add('real');
  if(kbRM()){out.textContent=kbV(a,c.unit||'');bar.classList.add('go');return}
  const t0=performance.now(),tick=t=>{const f=Math.min(1,(t-t0)/900),v=g+(a-g)*(1-Math.pow(1-f,3));out.textContent=kbV(f<1?Math.round(v):a,c.unit||'');if(f<1)requestAnimationFrame(tick)};
  requestAnimationFrame(()=>{bar.classList.add('go');requestAnimationFrame(tick)})}
function kbPlanToggle(b){const st=kbSt(),key=b.dataset.pid;const src=b.querySelector('[data-plant]')||b.parentNode.querySelector('[data-plant]');
  if(st.plan[key])delete st.plan[key];else st.plan[key]={t:src?src.textContent.trim():'',n:kbD.n,id:kbD.id};
  kbSave(st);const on=!!st.plan[key];b.classList.toggle('on',on);b.setAttribute('aria-pressed',on);
  if(b.classList.contains('kb-plan'))b.querySelector('span').textContent=on?'في خطتي':'أضفها إلى خطتي';
  toast(on?'أُضيفت إلى خطتك في صفحة «الدليل»':'أُزيلت من خطتك')}
function kbEvSheet(cur){fdOpenSheet('قوة السند',`<p class="hint">يصف الوسم قوة السند وراء البطاقة، لا قيمة الفكرة. وما دون «بحث قوي» يُجرَّب ويُرصد أثره.</p><div class="ev-list">${['R','N','S','P','E'].map(k=>`<div class="ev-it${k===cur?' cur':''}"><span class="p-ev ${FD_EVL[k][1]}">${FD_EVL[k][0]}</span><p>${FD_EVL[k][2]}</p></div>`).join('')}</div>`,'')}

/* ما يظهر بعد الضغطة (نتيجة، بديل، جواب) يبقى فوق شريط «السابق/التالي»: في الشاشات القصيرة تطول البطاقة فتنزل نتيجتها تحته */
const KB_SEE={rev:'.kb-yes',qz:'.kb-fb',bin:'.kb-fb',snext:'.kb-res',ord:'.kb-fb',bld:'.kb-fb',tog:'.kb-fb',guess:'.kb-ga'};
function kbSee(card,a){const sel=KB_SEE[a];if(!sel||!card.isConnected)return;const els=$$(sel,card).filter(e=>!e.hidden&&e.offsetParent),el=els[els.length-1];if(!el)return;
  const nav=$('#kb .kb-nav'),lim=(nav?nav.getBoundingClientRect().top:innerHeight)-10,r=el.getBoundingClientRect();
  const top=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--al-top'))||63)+8;
  let d=r.bottom-lim;if(d<=0)return;d=Math.min(d,Math.max(0,r.top-top));if(d>0)window.scrollBy({top:d,behavior:kbRM()?'auto':'smooth'})}

/* ---------- الأحداث ---------- */
function kbBind(){if(kbBound)return;kbBound=true;const V=$('[data-view="kb"]');
  V.addEventListener('click',e=>{const b=e.target.closest('[data-kb]');if(!b||!kbD)return;const a=b.dataset.kb;
    if(a==='next'){kbGo(kbI+1);return}if(a==='prev'){kbGo(kbI-1);return}
    const card=b.closest('.kb-card');if(!card)return;const i=+card.dataset.i,c=kbD.cards[i],w=kbW[i]||(kbW[i]={}),W=$('.kb-w',card),j=+b.dataset.j;
    if(a==='rev'){const y=$('.kb-yes',card);y.hidden=false;b.setAttribute('aria-expanded','true');b.hidden=true;card.classList.add('rev');return}
    if(a==='plan'){kbPlanToggle(b);return}
    if(a==='ev'){kbEvSheet(b.dataset.evk);return}
    if(a==='qz'){const p=c.p;if(!p||!fdPrefs.q||fdPrefs.q[p.id]!=null)return;fdPrefs.q[p.id]=j;try{fdSave()}catch(x){}
      const box=b.closest('.kb-quiz'),fb=box.nextElementSibling;$$('button',box).forEach((x,k)=>{x.disabled=true;if(k===p.c)x.classList.add('ok');else if(k===j)x.classList.add('bad')});
      fb.hidden=false;fb.className='kb-fb '+(j===p.c?'ok':'no');fb.innerHTML=(j===p.c?'<b>أصبت.</b> ':'<b>ليس تمامًا.</b> ')+p.x;return}
    if(a==='bin'){kbSortPick(W,c,w,j);return}if(a==='snext'){kbSortNext(W,c,w);return}if(a==='sagain'){w.i=0;w.ok=0;kbSortShow(W,c,w);return}
    if(a==='ord'){const fb=$('.kb-fb',W);if(j===w.next){w.next++;const li=document.createElement('li');li.textContent=c.items[j];$('.kb-seq',W).appendChild(li);b.remove();
        if(w.next===c.items.length){fb.hidden=false;fb.className='kb-fb ok';fb.innerHTML='<b>أحسنت.</b> '+(c.done||'');$('.kb-pool',W).hidden=true}else fb.hidden=true}
      else{b.classList.remove('shake');void b.offsetWidth;b.classList.add('shake');fb.hidden=false;fb.className='kb-fb no';fb.textContent='ليست هذه بعد. ما الذي يسبقها؟'}return}
    if(a==='cup'){const k=w.sel.indexOf(j);if(k>-1)w.sel.splice(k,1);else w.sel.push(j);kbCupDraw(W,c,w,k>-1?-1:j);return}
    if(a==='tog'){w.on[j]=!w.on[j];w.seen[j]=1;kbTogDraw(W,c,w,j);return}
    if(a==='bld'){w.on[j]=!w.on[j];kbBuildDraw(W,c,w);return}
    if(a==='guess'){kbGuess(W,c);return}});
  /* بالالتقاط: زر الترتيب يُزال من الصفحة عند ضغطه، فتُعرف بطاقته قبل ذلك؛ والفحص بعد أن يرسم المعالج نتيجته */
  V.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-kb]'),card=b&&b.closest('.kb-card');if(card&&kbD){const a=b.dataset.kb;requestAnimationFrame(()=>kbSee(card,a))}},true);
  V.addEventListener('input',e=>{const r=e.target;if(!r.hasAttribute||!r.hasAttribute('data-kbr')||!kbD)return;const card=r.closest('.kb-card'),c=kbD.cards[+card.dataset.i];$('.kb-gv',card).textContent=kbV(r.value,c.unit||'')});
  document.addEventListener('keydown',e=>{if(V.hidden||!kbD||e.altKey||e.ctrlKey||e.metaKey||e.defaultPrevented)return;const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;
    const sh=document.getElementById('fdSheet'),sr=document.getElementById('search');if((sh&&!sh.hidden)||(sr&&!sr.hidden))return;
    if(e.key==='ArrowLeft'){e.preventDefault();kbGo(kbI+1)}else if(e.key==='ArrowRight'){e.preventDefault();kbGo(kbI-1)}})}
/* من أين فُتحت البطاقات: «إغلاق» يعود إلى المكان نفسه (صفحة «الدليل» بموضع التمرير، أو الجزء، أو القسم) */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="#k-"]');if(!a||a.closest('[data-view="kb"]'))return;
  const sec=a.classList.contains('kb-secl')?a.closest('section[id]'):null,part=a.closest('article[id^="part"]');
  kbFrom=sec?sec.id:part?'part-'+part.id.slice(4):a.closest('[data-view="home"]')?'guide':'';
  kbBackY=kbFrom==='guide'?window.pageYOffset:null},true);
window.addEventListener('hashchange',()=>{const h=(location.hash||'').slice(1);if(h.indexOf('k-')===0)return;
  kbD=null;if(kbIO){kbIO.disconnect();kbIO=null}kbFrom='';if(h!=='guide')kbBackY=null});

/* ---------- صفحة «الدليل»: البحث والمختارات والأبواب والبلاطات ---------- */
function kbTile(a,st,lab){const done=st.done[a.id];
  return `<a class="kbt${done?' done':''}" href="#k-${a.id}"><span class="kbt-ic">${fdIc(a)}</span><b>${esc(a.n)}</b>${lab?`<small class="l">${esc(lab)}</small>`:''}${kbHasAct(a)?'<small>تفاعلية</small>':''}${done?`<i class="kbt-ok" role="img" aria-label="أتممتها">${kbIc('i-check')}</i>`:''}</a>`}
function kbRTile(r,st){const done=st.done[r.id];return `<a class="kbt${done?' done':''}" href="#k-${r.id}"><span class="kbt-ic">${kbIc('ai-'+r.ic)}</span><b>${esc(r.n)}</b><small>${esc(r.tag)}</small>${done?`<i class="kbt-ok" role="img" aria-label="أتممتها">${kbIc('i-check')}</i>`:''}</a>`}
function kbDoor(di){const st=kbSt(),BY=kbTopics(),d=TOC.doors[di];if(!d)return;
  $$('#kbTabs [data-kbdoor]').forEach(b=>b.setAttribute('aria-selected',+b.dataset.kbdoor===di));
  /* باب أجزاؤه كثيرة ولكل جزء موضوع (الملاحق): شبكة واحدة، وعلى كل بلاطة اسم ملحقها */
  if(d.parts.length>=6){const T=[];d.parts.forEach(pi=>(BY[pi]||[]).forEach(a=>T.push([a,PARTS[pi].label])));
    $('#kbList').innerHTML=`<section class="kbp"><header><span class="kbp-n">${esc(d.label)}</span><h3>${esc(d.name)}</h3><div class="kbp-m"><span>${kbTop(T.length)}</span><a href="#map">الخريطة كاملة${kbIc('i-arrow')}</a></div></header><div class="kbp-g">${T.map(x=>kbTile(x[0],st,x[1])).join('')}</div></section>`;return}
  $('#kbList').innerHTML=d.parts.map(pi=>{const P=PARTS[pi],T=BY[pi]||[],S=(typeof SUM!=='undefined'&&SUM[pi])||null;if(!P)return '';
    let tiles='',last='';
    T.forEach(a=>{if(pi===5&&FD_AX[a.ax]){const ax=FD_AX[a.ax][0];if(ax!==last){tiles+=`<h4 class="kbp-ax">${esc(ax)}</h4>`;last=ax}}tiles+=kbTile(a,st)});
    const dn=T.filter(a=>st.done[a.id]).length;
    return `<section class="kbp"><header><span class="kbp-n">${esc(P.label)}</span><h3>${esc(P.title.split(':')[0])}</h3>${S&&S.q?`<p>${S.q}</p>`:''}<div class="kbp-m">${T.length?`<span>${dn?'أتممت '+dn+' من '+T.length:kbTop(T.length)}</span>`:''}<a href="#part-${pi}">الجزء كاملًا${kbIc('i-arrow')}</a></div></header>${T.length?`<div class="kbp-g">${tiles}</div>`:''}</section>`}).join('')}
function kbFind(q){kbQv=q;const nq=kbNorm(q).trim(),R=$('#kbRes');if(!R)return;
  if(!nq){R.hidden=true;R.innerHTML='';return}
  const st=kbSt(),hay=a=>{const x=KB_X[a.id]||{};return kbNorm(a.n+' '+String(a.h||'').replace(/_/g,' ')+' '+a.st.join(' ')+' '+(a.who||'')+' '+(x.like?x.like[0]:''))};
  const hit=kbAll().filter(a=>hay(a).indexOf(nq)>-1).slice(0,12);
  const rh=KB_R.filter(r=>kbNorm(r.n+' '+r.q+' '+r.who+' '+r.tag).indexOf(nq)>-1);
  R.hidden=false;R.innerHTML=(hit.length+rh.length?`<div class="kbp-g">${rh.map(r=>kbRTile(r,st)).join('')}${hit.map(a=>kbTile(a,st)).join('')}</div>`:'<p class="kbh-none">لا موضوع بهذه الكلمة في البطاقات.</p>')+`<button type="button" class="kbh-full" data-kbfull>ابحث في نص الدليل كله${kbIc('i-arrow')}</button>`}
function kbHub(){const F=$('#kbFeat');if(!F)return;const st=kbSt(),all=kbAll();
  F.innerHTML=KB_FEAT.map(id=>{const D=kbDeck(id);if(!D)return '';const done=st.done[id];
    return `<a class="kbf${D.r?' r':''}${done?' done':''}" href="#k-${id}"><small>${esc(D.r?D.tag:(D.who||shortT(D.part)))}${D.r&&!done?'<em>جديد</em>':''}</small><span class="kbf-ic">${kbIc(D.ic)}</span><b>${esc(D.n)}</b><p>${D.q}</p><i>${done?kbIc('i-check')+'أتممتها':kbCnt(D.cards.length-2)+(D.r||kbHasAct(D.a)?' · تفاعلية':'')}</i></a>`}).join('');
  const tot=KB_R.length+all.length,dn=KB_R.filter(r=>st.done[r.id]).length+all.filter(a=>st.done[a.id]).length;
  $('#kbProg').innerHTML=`<span>${dn?'أتممت '+dn+' من '+kbTop(tot):kbTop(tot)+' في بطاقات، وكل موضوع يفتح صفحته في الدليل'}</span><div class="kbh-pb"><i style="width:${tot?Math.round(dn/tot*100):0}%"></i></div>`;
  const pk=Object.keys(st.plan),PL=$('#kbPlan');PL.hidden=!pk.length;
  PL.innerHTML=pk.length?`<h3>خطتي<small>${kbStp(pk.length)} من البطاقات. اضغط العلامة عند التنفيذ.</small></h3><ul>${pk.map(k=>{const p=st.plan[k];return `<li><button type="button" data-kbdel="${esc(k)}" aria-label="نُفّذت: تُزال من الخطة">${kbIc('i-check')}</button><div><p>${esc(p.t)}</p><a href="#k-${esc(p.id)}">${esc(p.n)}</a></div></li>`}).join('')}</ul>`:'';
  const cur=Math.min(st.door||0,TOC.doors.length-1);
  $('#kbTabs').innerHTML=TOC.doors.map((d,i)=>`<button type="button" role="tab" aria-selected="${i===cur}" data-kbdoor="${i}">${KB_DOORN[i]||esc(d.name)}</button>`).join('');
  kbDoor(cur);const Q=$('#kbQ');if(Q&&Q.value!==kbQv)Q.value=kbQv;if(kbQv)kbFind(kbQv);
  if(!kbHub.bound){kbHub.bound=true;const H=$('[data-view="home"]');
    H.addEventListener('click',e=>{const t=e.target.closest('[data-kbdoor],[data-kbrand],[data-kbdel],[data-kbfull],#kbNeedT');if(!t)return;
      if(t.id==='kbNeedT'){const w=$('#needWrap'),open=w.hidden;w.hidden=!open;t.setAttribute('aria-expanded',open);return}
      if(t.hasAttribute('data-kbfull')){openSearch(kbQv.trim());return}
      if(t.hasAttribute('data-kbdoor')){const s=kbSt();s.door=+t.dataset.kbdoor;kbSave(s);kbDoor(s.door);const TB=$('#kbTabs');
        try{TB.scrollBy({left:t.getBoundingClientRect().left+t.offsetWidth/2-(TB.getBoundingClientRect().left+TB.clientWidth/2),behavior:kbRM()?'auto':'smooth'})}catch(x){}
        const y=TB.getBoundingClientRect().top;if(y<60||y>innerHeight*.6)try{window.scrollTo({top:window.pageYOffset+$('#kbList').getBoundingClientRect().top-TB.offsetHeight-(parseFloat(getComputedStyle(TB).top)||63)-4,behavior:kbRM()?'auto':'smooth'})}catch(x){}
        return}
      if(t.hasAttribute('data-kbdel')){const s=kbSt();delete s.plan[t.dataset.kbdel];kbSave(s);kbHub();toast('أحسنت. أُزيلت من خطتك');return}
      if(t.hasAttribute('data-kbrand')){const s=kbSt(),ids=KB_R.map(r=>r.id).concat(kbAll().map(a=>a.id));
        const left=ids.filter(id=>!s.done[id]),pool=left.length?left:ids;kbFrom='guide';kbBackY=window.pageYOffset;location.hash='#k-'+pool[Math.floor(Math.random()*pool.length)]}});
    const Q2=$('#kbQ');if(Q2){Q2.addEventListener('input',()=>kbFind(Q2.value));Q2.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const one=$$('#kbRes .kbt');if(one.length===1)one[0].click();else if(Q2.value.trim())openSearch(Q2.value.trim())}})}
    if(typeof A9_PANELS!=='undefined')A9_PANELS.push([tl=>tl.id==='kbTabs',()=>document.getElementById('kbList')])}
  try{a9Init($('#kbTabs'))}catch(e){}
  if(kbBackY!=null){const y=kbBackY;kbBackY=null;setTimeout(()=>window.scrollTo(0,y),0)}}
{const G2=renderHome;renderHome=function(){const r=G2.apply(this,arguments);try{kbHub()}catch(e){if(window.console)console.error(e)}return r}}

/* ---------- صفحات الأجزاء: شريط «بطاقات هذا الجزء» ورابط عند كل قسم له بطاقات ---------- */
function kbStrip(pi){const root=document.getElementById('part'+pi);if(!root||root.dataset.kb)return;const T=kbTopics()[pi]||[];if(!T.length)return;root.dataset.kb='1';
  /* شريط مطوي أعلى الجزء: سطر واحد، ويفتح بلاطات موضوعاته */
  const d=document.createElement('details');d.className='kb-strip no-m2';
  d.innerHTML=`<summary><b>بطاقات هذا الجزء</b><span>${kbTop(T.length)}: الفكرة والتطبيق في دقائق، قبل النص الكامل</span></summary><div>${T.map(a=>`<a href="#k-${a.id}">${fdIc(a)}<span>${esc(a.n)}</span></a>`).join('')}</div>`;
  root.prepend(d);
  const seen={};T.forEach(a=>{if(seen[a.sec])return;seen[a.sec]=1;const s=document.getElementById(a.sec),h2=s&&$('h2',s);if(!h2||$('.kb-secl',s))return;
    const same=T.filter(b=>b.sec===a.sec);const l=document.createElement('p');l.className='kb-secw no-m2';
    l.innerHTML=same.map(b=>`<a class="kb-secl" href="#k-${b.id}">${kbIc('ai-cards')}<span>${same.length>1?'بطاقات: '+esc(b.n):'بطاقات هذا القسم'}</span></a>`).join('');h2.after(l)})}
{const I2=initPart;initPart=function(pi){const r=I2.apply(this,arguments);try{kbStrip(pi)}catch(e){}return r}}
