/* ================= v134: سجلّا الإنجاز (m2/sj.js) =================
   «سجل إنجاز المعلم» (#tk/folio) و«سجل إنجاز المتعلمين» (#tk/sfolio): كل إنجاز صفحة A4 تُحرَّر في مكانها:
   قسم وتاريخ وعنوان، وصور من واحدة إلى ست تُرتَّب تلقائيًّا بحسب عددها واتجاهها، وتقرير تحتها أو صور فقط، وملفات مرفقة.
   التخزين: النص في tk.v1 تحت TK.sj={t:{…},s:{…}} فتشمله النسخة الشاملة؛ والصور والمرفقات في IndexedDB (alm-media) بمفاتيح
     sj:p:<صورة> و sj:t:<مصغّرتها> و sj:f:<مرفق> و sj:logo:<السجل>، وتُنقل بنسخة ZIP من داخل السجل (sjExport و sjImport).
   الصفحة: {id,t,d,c,sz,only,tpl,txt,sub,ph:[{id,w,h,z,fit,pos,cap}],at:[{id,n,z,y}],ck,cn,st:[أسماء],lvl,res,pf,ts}
   الطباعة: غلاف وفهرس وصفحات بمقاس A4 عبر #fdPrint؛ والتقرير الطويل يصغر خطه درجة ثم يكتمل في صفحة تالية (sjFit).
   v135: ملف PDF مباشر (sjPdf): المستند نفسه (sjDoc) تُرسم أوراقه صورًا وتُجمع في ملف عبر tkPdf، للسجل المعروض كله أو لصفحة واحدة.
   لا يُرفع شيء من الجهاز. window.ALM_SJ مقبض للفحص الآلي. */
const SJ={t:{id:'folio',name:'سجل إنجاز المعلم',cats:[['train','دورات وورش حضرتها','grow'],['give','دورات وورش قدّمتها','grow'],['lesson','دروس نموذجية وتبادل زيارات','teach'],['media','وسائل وإنتاج تعليمي','teach'],['act','أنشطة وفعاليات','init'],['comp','مسابقات','init'],['init','مبادرات ومشاريع','init'],['gift','رعاية الموهوبين','gift'],['team','لجان وفرق عمل','init'],['comm','شراكة مع أولياء الأمور والمجتمع','part'],['honor','شكر وتكريم','grow'],['write','بحوث ومؤلفات','grow'],['other','أخرى','init']],
   ph:'عنوان الإنجاز، مثل: ورشة في تصميم الوسائل التعليمية',rep:'اكتب التقرير هنا: ما الذي تم؟ ولمن؟ وما أثره؟',skel:'الهدف: \nما تم: \nالمستفيدون: \nالأثر: '},
  s:{id:'sfolio',name:'سجل إنجاز المتعلمين',cats:[['proj','مشاريع'],['research','بحوث وتقارير'],['invent','ابتكارات واختراعات'],['comp','مسابقات'],['quran','حفظ وتلاوة'],['talk','عروض وإلقاء'],['work','أعمال مميّزة'],['init','مبادرات وتطوّع'],['act','أنشطة وفعاليات'],['honor','تكريم وشهادات'],['other','أخرى']],
   ph:'عنوان الإنجاز، مثل: مشروع مجسّم لمناسك الحج',rep:'اكتب التقرير هنا: فكرة العمل، وما أنجزه المتعلم، وما تعلّمه منه.',skel:'فكرة العمل: \nما أنجزه: \nما تعلّمه: \nما يميّزه: '}};
const SJ_LVL=['','الصف','المدرسة','المنطقة التعليمية','الدولة','خليجي أو دولي'];
const SJ_H={s:80,m:112,l:150,o:218};   /* ارتفاع مساحة الصور بوحدة الورقة (العرض ١٨٦) */
const SJ_I={img:'M4 5h16v14H4zM4 15l4.5-4.5 4 4L15 12l5 5M9 9.5h.01',clip:'M20 11.5l-8.1 8.1a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8',copy:'M9 9h11v11H9zM5 15H4V4h11v1',swap:'M4 8h13l-3-3M20 16H7l3 3',fit:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',pos:'M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4'};
const sjI=(n,cls)=>tkSvg(SJ_I[n]||TK_P[n]||'',cls==null?'ic':cls);
/* قوالب ترتيب الصور: [أعمدة بالحصص، صفوف بالحصص، خلايا [بداية العمود، امتداده، بداية الصف، امتداده]]. الأولى في كل عدد هي الأشيع. */
const SJ_TPL={1:[[[1],[1],[[0,1,0,1]]]],
 2:[[[1,1],[1],[[0,1,0,1],[1,1,0,1]]],[[1],[1,1],[[0,1,0,1],[0,1,1,1]]],[[3,2],[1],[[0,1,0,1],[1,1,0,1]]]],
 3:[[[3,2],[1,1],[[0,1,0,2],[1,1,0,1],[1,1,1,1]]],[[1,1],[3,2],[[0,2,0,1],[0,1,1,1],[1,1,1,1]]],[[1,1,1],[1],[[0,1,0,1],[1,1,0,1],[2,1,0,1]]],[[1],[1,1,1],[[0,1,0,1],[0,1,1,1],[0,1,2,1]]]],
 4:[[[1,1],[1,1],[[0,1,0,1],[1,1,0,1],[0,1,1,1],[1,1,1,1]]],[[1,1,1],[2,1],[[0,3,0,1],[0,1,1,1],[1,1,1,1],[2,1,1,1]]],[[2,1],[1,1,1],[[0,1,0,3],[1,1,0,1],[1,1,1,1],[1,1,2,1]]],[[1,1,1,1],[1],[[0,1,0,1],[1,1,0,1],[2,1,0,1],[3,1,0,1]]]],
 5:[[[1,1,1,1,1,1],[1,1],[[0,3,0,1],[3,3,0,1],[0,2,1,1],[2,2,1,1],[4,2,1,1]]],[[2,1,1],[1,1],[[0,1,0,2],[1,1,0,1],[2,1,0,1],[1,1,1,1],[2,1,1,1]]],[[1,1,1,1,1,1],[1,1],[[0,2,0,1],[2,2,0,1],[4,2,0,1],[0,3,1,1],[3,3,1,1]]],[[1,1],[2,1,1],[[0,2,0,1],[0,1,1,1],[1,1,1,1],[0,1,2,1],[1,1,2,1]]]],
 6:[[[1,1,1],[1,1],[[0,1,0,1],[1,1,0,1],[2,1,0,1],[0,1,1,1],[1,1,1,1],[2,1,1,1]]],[[1,1],[1,1,1],[[0,1,0,1],[1,1,0,1],[0,1,1,1],[1,1,1,1],[0,1,2,1],[1,1,2,1]]],[[1,1,1],[1,1,1],[[0,2,0,2],[2,1,0,1],[2,1,1,1],[0,1,2,1],[1,1,2,1],[2,1,2,1]]]]};
let sjSel=-1,sjCur='',sjPv=false,sjWork='',sjNewCat=false,sjStuOpen=null,sjFitT=null,sjGrowT=null;
const sjFlt={t:{c:'',y:'',q:''},s:{c:'',y:'',q:'',ck:'',st:''}};
const sjNorm=v=>{try{return almNorm(v)}catch(e){return String(v||'').toLowerCase()}};
/* ---------- الحالة ---------- */
function sjS(k){const F=x9O('sj');let R=F[k];if(!R||typeof R!=='object'||Array.isArray(R))R=F[k]={};
  if(!Array.isArray(R.pages))R.pages=[];
  if(R.pages.some(p=>!p||typeof p!=='object'||!p.id))R.pages=R.pages.filter(p=>p&&typeof p==='object'&&p.id);
  R.pages.forEach(p=>{if(!Array.isArray(p.ph))p.ph=[];if(!Array.isArray(p.at))p.at=[];if(!Array.isArray(p.st))p.st=[]});
  if(!R.ini){R.ini=1;const O=F[k==='t'?'s':'t'];if(O&&typeof O==='object')['name','job','school','org'].forEach(f=>{if(!R[f]&&typeof O[f]==='string')R[f]=O[f]});
    try{bgLoad();if(BG){if(!R.name&&BG.teacher)R.name=String(BG.teacher).slice(0,80);if(!R.school&&BG.school)R.school=String(BG.school).slice(0,80)}}catch(e){}}
  return R}
const sjTouch=(R,p)=>{const n=Date.now();if(p)p.ts=n;R.mod=n;tkSave()};
const sjSorted=R=>R.pages.slice().sort((a,b)=>String(b.d||'').localeCompare(String(a.d||''))||(b.ts||0)-(a.ts||0));
const sjCat=(k,c)=>{if(!c)return '';if(c[0]==='*')return c.slice(1);const x=SJ[k].cats.find(x=>x[0]===c);return x?x[1]:''};
function sjCats(k,R){const L=SJ[k].cats.map(x=>[x[0],x[1]]);const seen=new Set();R.pages.forEach(p=>{if(p.c&&p.c[0]==='*'&&!seen.has(p.c)){seen.add(p.c);L.splice(L.length-1,0,[p.c,p.c.slice(1)])}});return L}
const sjD=iso=>{const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(iso||'');return m?new Date(+m[1],+m[2]-1,+m[3],12):null};
const sjFmt=(loc,iso)=>{const d=sjD(iso);if(!d)return '';try{return new Intl.DateTimeFormat(loc,{day:'numeric',month:'long',year:'numeric'}).format(d)}catch(e){return ''}};
const sjDate=iso=>sjFmt('ar-EG-u-nu-latn',iso)||String(iso||'');
const sjHij=iso=>sjFmt('ar-SA-u-ca-islamic-umalqura-nu-latn',iso);
const sjYear=iso=>{const m=/^(\d{4})-(\d{2})/.exec(iso||'');if(!m)return '';const a=+m[2]>=9?+m[1]:+m[1]-1;return a+'/'+(a+1)};
const sjCnt=(n,one,two,few,many)=>n===1?one:n===2?two:(n>=3&&n<=10?n+' '+few:n+' '+many);
const sjSize=b=>b>=1048576?(Math.round(b/104857.6)/10)+' م.ب':Math.max(1,Math.round(b/1024))+' ك.ب';
const sjBlank=p=>!String(p.t||'').trim()&&!String(p.txt||'').trim()&&!String(p.sub||'').trim()&&!p.ph.length&&!p.at.length&&!p.st.length&&!String(p.res||'').trim();
const sjPid=()=>{const a=tkArgs[0]||'';return a.startsWith('p-')?a.slice(2):''};
const sjOn=(k,p)=>tkCur===SJ[k].id&&(p?sjPid()===p.id:!sjPid());
/* عناوين الصور للعرض: blob: حيث تسمح به سياسة الصفحة (خفيف ولا يُعاد فكّه عند كل رسم)، وإلا data: كسائر مرفقات الجهاز */
const sjUrls=new Map(),sjUrlP=new Map();let sjPrnUrls=[];
const sjBlobOk=new Promise(res=>{try{const u=URL.createObjectURL(new Blob([Uint8Array.from(atob('R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='),c=>c.charCodeAt(0))],{type:'image/gif'})),i=new Image(),end=v=>{try{URL.revokeObjectURL(u)}catch(e){}res(v)};i.onload=()=>end(true);i.onerror=()=>end(false);i.src=u;setTimeout(()=>end(false),2500)}catch(e){res(false)}});
/* الحفظ في مخزن المرفقات: Blob كما هو، وحيث يرفضه المتصفح (جلسة خاصة في Safari) يُحفظ محتواه ArrayBuffer مع نوعه */
const sjBuf=b=>b.arrayBuffer?b.arrayBuffer():new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsArrayBuffer(b)});
async function sjPut(key,blob){if(await mdPut(key,blob))return true;try{const b=await sjBuf(blob);return !!(await mdTx('readwrite',st=>{st.put({t:blob.type||'',b},key)}))}catch(e){return false}}
const sjGet=key=>mdTx('readonly',st=>st.get(key)).then(r=>r instanceof Blob?r:(r&&r.b instanceof ArrayBuffer?new Blob([r.b],{type:r.t||''}):null));
const sjFree=u=>{if(u&&u.startsWith('blob:'))try{URL.revokeObjectURL(u)}catch(e){}};
function sjUrl(key){if(sjUrlP.has(key))return sjUrlP.get(key);const pr=(async()=>{const ok=await sjBlobOk,b=await sjGet(key);let u='';if(b)u=ok?URL.createObjectURL(b):await mdData(b);if(sjUrlP.get(key)===pr)sjUrls.set(key,u);else sjFree(u);return u})();sjUrlP.set(key,pr);return pr}
const sjDropUrls=pre=>{[...sjUrlP.keys()].forEach(x=>{if(x.startsWith(pre)){sjFree(sjUrls.get(x));sjUrls.delete(x);sjUrlP.delete(x)}})};
const sjPrnFree=()=>{sjPrnUrls.forEach(sjFree);sjPrnUrls=[]};
function sjNewPage(k,R,o){const p=Object.assign({id:tkUid(),t:'',d:tkToday(),c:SJ[k].cats[0][0],sz:'m',only:0,man:0,tpl:0,txt:'',sub:'',ph:[],at:[],st:[],ck:'',cn:'',lvl:'',res:'',pf:'',ts:Date.now()},o||{});R.pages.push(p);R.mod=p.ts;tkSave();return p}
function sjDelPage(R,p){p.ph.forEach(x=>{mdDel('sj:p:'+x.id);mdDel('sj:t:'+x.id)});p.at.forEach(a=>mdDel('sj:f:'+a.id));R.pages=R.pages.filter(x=>x!==p);R.mod=Date.now();tkSave()}
function sjFiltered(k,R){const F=sjFlt[k],q=F.q?sjNorm(F.q):'';return sjSorted(R).filter(p=>(!q||sjNorm([p.t,p.sub,p.txt,p.res,p.st.join(' ')].join(' ')).includes(q))&&(!F.c||p.c===F.c)&&(!F.y||sjYear(p.d)===F.y)&&(k!=='s'||((!F.ck||p.ck===F.ck)&&(!F.st||p.st.includes(F.st)))))}
/* إعادة الرسم مع إبقاء التركيز ومكان المؤشر */
function sjRe(){const a=document.activeElement,q9=v=>String(v).replace(/["\\]/g,'\\$&');let q='',s0=null,s1=null;
  if(a&&a.closest&&a.closest('#tkMain')){const d=a.dataset;q=a.id?'#'+a.id:d.tki?`[data-tki="${d.tki}"]${d.f?`[data-f="${d.f}"]`:''}`:d.tk?`[data-tk="${d.tk}"]${d.v!=null?`[data-v="${d.v}"]`:''}${d.i!=null?`[data-i="${d.i}"]`:''}${d.d!=null?`[data-d="${d.d}"]`:''}${d.c!=null?`[data-c="${q9(d.c)}"]`:''}${d.n!=null?`[data-n="${q9(d.n)}"]`:''}${d.id!=null?`[data-id="${q9(d.id)}"]`:''}`:'';
    try{if(/^(TEXTAREA|INPUT)$/.test(a.tagName)&&a.selectionStart!=null){s0=a.selectionStart;s1=a.selectionEnd}}catch(e){}}
  tkRe();if(!q)return;const b=document.querySelector('#tkMain '+q);if(!b)return;try{b.focus({preventScroll:true});if(s0!=null)b.setSelectionRange(s0,s1)}catch(e){}}
/* ---------- ترتيب الصور ---------- */
const sjTracks=(fr,total,g)=>{const s=fr.reduce((a,b)=>a+b,0),free=total-g*(fr.length-1);return fr.map(f=>free*f/s)};
function sjCellsOf(T,W,H){const g=2.4,cw=sjTracks(T[0],W,g),rh=sjTracks(T[1],H,g),sum=(a,i,n)=>a.slice(i,i+n).reduce((x,y)=>x+y,0)+g*(n-1);
  return T[2].map(c=>{const w=sum(cw,c[0],c[1]),h=sum(rh,c[2],c[3]);return {r:w/h,a:w*h}})}
/* خسارة الخلية: ما يُقصّ من الصورة حين تملأ خلية بنسبة غير نسبتها، موزونًا بمساحة الخلية؛ والشريط النحيل يُعاقَب */
const sjCellLoss=(c,x)=>{const rp=x&&x.w&&x.h?x.w/x.h:1.4;let l=x&&x.fit?0.08:1-Math.min(c.r/rp,rp/c.r);if(c.r>2.9||c.r<.36)l+=.25;return l*c.a};
function sjLoss(T,ph,W,H){const C=sjCellsOf(T,W,H);let L=0,A=0;C.forEach((c,i)=>{L+=sjCellLoss(c,ph[i]);A+=c.a});return L/A}
function sjTplOf(ph,tpl,H){const n=Math.min(6,ph.length),L=SJ_TPL[n]||[];if(!L.length)return null;
  if(tpl>0&&L[tpl-1])return {T:L[tpl-1],i:tpl-1,n:L.length};let b=0,bl=9;L.forEach((T,i)=>{const l=sjLoss(T,ph,186,H)+i*.004;if(l<bl){bl=l;b=i}});return {T:L[b],i:b,n:L.length}}
const sjAreaH=p=>p.only&&p.ph.length?SJ_H.o:(SJ_H[p.sz]||SJ_H.m);
/* عند إضافة الصور: توضع كل صورة في الخلية الأقرب إلى اتجاهها (طولية أو عرضية)، ما لم يرتّبها المعلم بيده (p.man) */
function sjArrange(p){const n=Math.min(6,p.ph.length),L=SJ_TPL[n]||[];if(n<2||p.man)return;const H=sjAreaH(p),ph=p.ph.slice(0,n);let best=null,bl=1e9;
  const walk=(a,k,cb)=>{if(k===n){cb(a);return}for(let i=k;i<n;i++){[a[k],a[i]]=[a[i],a[k]];walk(a,k+1,cb);[a[k],a[i]]=[a[i],a[k]]}};
  L.forEach((T,ti)=>{const C=sjCellsOf(T,186,H),A=C.reduce((x,c)=>x+c.a,0),M=C.map(c=>ph.map(x=>sjCellLoss(c,x)));
    walk(ph.map((_,i)=>i),0,a=>{let l=0,mv=0;for(let i=0;i<n;i++){l+=M[i][a[i]];mv+=Math.abs(a[i]-i)}l=l/A+ti*.004+mv*.0004;if(l<bl){bl=l;best=a.slice()}})});
  if(best)p.ph=best.map(i=>ph[i]).concat(p.ph.slice(n))}
/* صورة لا تشبه خليتها (شهادة طولية في مساحة عرضية): تُعرض كاملة بدل أن يُقصّ أكثر من نصفها، وللمعلم أن يملأ بها الإطار */
function sjAutoFit(p){const n=Math.min(6,p.ph.length);if(!n)return;const H=sjAreaH(p),tp=sjTplOf(p.ph,p.tpl,H);if(!tp)return;const C=sjCellsOf(tp.T,186,H),lim=n===1?.45:.72;
  p.ph.slice(0,n).forEach((x,i)=>{if(x.fit!=null||!x.w||!x.h)return;const rp=x.w/x.h;x.fit=1-Math.min(C[i].r/rp,rp/C[i].r)>lim?1:0;x.af=1})}
/* ما قرّره sjAutoFit (af) يُعاد تقديره كلما تغيّر التخطيط؛ وما اختاره المعلم بيده يبقى */
function sjReFit(p){p.ph.forEach(x=>{if(x.af){delete x.fit;delete x.af}});sjAutoFit(p)}
/* ---------- الورقة: تحرير (edit) أو ثابتة للمعاينة والطباعة والمصغّرات (fix) ---------- */
const sjWhen=(R,p)=>`<span>${esc(sjDate(p.d))}</span>${R.hij&&sjHij(p.d)?`<small>${esc(sjHij(p.d))}</small>`:''}`;
const sjFoot=(k,R,p,no)=>`<span>${esc([SJ[k].name,R.name,R.school].filter(Boolean).join(' · '))}</span><span class="sjp-ft-e">${esc(sjYear(p.d))}${no?`<b>${no}</b>`:''}</span>`;
function sjWho(k,p,ed){if(k!=='s')return '';const n=p.st.join('، '),c=p.cn||'';
  const sub=n||c?`<p class="sjp-sub">${esc(n)}${n&&c?' — ':''}${esc(c)}</p>`:(ed?'<p class="sjp-sub">اختر أصحاب الإنجاز من «بيانات الصفحة».</p>':'');
  const ch=[p.lvl?`<span class="sjp-chip"><b>المستوى:</b> ${esc(p.lvl)}</span>`:'',String(p.res||'').trim()?`<span class="sjp-chip"><b>النتيجة:</b> ${esc(p.res)}</span>`:''].join('');
  return sub+(ch?`<div class="sjp-chips">${ch}</div>`:'')}
function sjSheet(k,R,p,o){o=o||{};const S=SJ[k],ed=o.mode==='edit',part=o.part||null,cont=!!(part&&part.cont),last=!part||part.last!==false;
  const ph=cont?[]:(o.ph||p.ph).slice(0,6),onlyM=!!(p.only&&ph.length),txt=part?String(part.txt||''):(onlyM?'':String(p.txt||''));
  const showRep=ed?!onlyM:!!txt.trim(),only=ph.length>0&&!showRep,H=only?SJ_H.o:(SJ_H[p.sz]||SJ_H.m);
  const tp=ph.length?sjTplOf(ph,ph.length===p.ph.length?p.tpl:0,H):null,hT=o.thumb?'div':'h2',hR=o.thumb?'div':'h3';
  const mm=tp&&o.print?sjCellsOf(tp.T,186,H):null;
  const cells=tp?ph.map((x,i)=>{const c=tp.T[2][i],key=(o.thumb?'sj:t:':'sj:p:')+x.id,u=o.print?'':(sjUrls.get(key)||'');
    const st=`grid-column:${c[0]+1}/span ${c[1]};grid-row:${c[2]+1}/span ${c[3]}`,cls='sjp-ph'+(x.fit?' fit':'')+(x.pos&&!x.fit?' p'+x.pos:'')+(ed&&o.sel===i?' sel':'');
    const im=o.meas?'':`<img ${u?`src="${u}"`:`data-sjk="${key}"`}${mm?` data-box="${[Math.sqrt(mm[i].a*mm[i].r).toFixed(1),Math.sqrt(mm[i].a/mm[i].r).toFixed(1),x.w||0,x.h||0,x.fit?1:0].join(',')}"`:''} alt="${esc(x.cap||('صورة '+(i+1)))}">`,cap=x.cap&&!o.thumb?`<span class="sjp-cap">${esc(x.cap)}</span>`:'';
    return ed?`<button type="button" class="${cls}" style="${st}" data-tk="sjsel" data-i="${i}" aria-pressed="${o.sel===i}">${im}${cap}</button>`:`<figure class="${cls}" style="${st}">${im}${cap}</figure>`}).join(''):'';
  const grid=tp?`<div class="sjp-photos" style="grid-template-columns:${tp.T[0].map(f=>`minmax(0,${f}fr)`).join(' ')};grid-template-rows:${tp.T[1].map(f=>`minmax(0,${f}fr)`).join(' ')};--h:${H}">${cells}</div>`:'';
  const busy=sjWork==='ph';
  const drop=ed&&!ph.length?`<button type="button" class="sjp-drop" data-tk="sjadd" style="--h:62">${sjI('img','')}<span>${busy?'تُجهَّز الصور…':'أضف صورًا: من واحدة إلى 6'}</span><small>من المعرض أو الكاميرا، أو اسحبها إلى هنا. تُرتَّب تلقائيًّا بحسب عددها واتجاهها.</small></button>`:'';
  const x=ed&&o.sel>=0?ph[o.sel]:null;
  const pb=(a,v,on,l)=>`<button type="button" data-tk="${a}" data-v="${v}" aria-pressed="${on}">${l}</button>`;
  const bar=ed&&ph.length?`<div class="sjp-bar"><button type="button" class="sjp-b pri" data-tk="sjadd"${ph.length>=6||busy?' disabled':''}>${sjI('plus','')}${busy?'تُجهَّز الصور…':`أضف صورة (${ph.length}/6)`}</button>${ph.length>1&&tp.n>1?`<button type="button" class="sjp-b" data-tk="sjtpl">${sjI('swap','')}بدّل الترتيب</button>`:''}${p.only?'':`<i>مساحة الصور:</i><span class="sjp-seg" role="group" aria-label="مساحة الصور">${pb('sjsz','s',p.sz==='s','صغيرة')}${pb('sjsz','m',p.sz!=='s'&&p.sz!=='l','متوسطة')}${pb('sjsz','l',p.sz==='l','كبيرة')}</span>`}<button type="button" class="sjp-b" data-tk="sjonly" aria-pressed="${!!p.only}">صور فقط</button></div>${x?`<div class="sjp-bar"><i>الصورة ${o.sel+1}:</i><button type="button" class="sjp-b" data-tk="sjmv" data-d="-1"${o.sel<1?' disabled':''}>قدّمها</button><button type="button" class="sjp-b" data-tk="sjmv" data-d="1"${o.sel>=ph.length-1?' disabled':''}>أخّرها</button><button type="button" class="sjp-b" data-tk="sjfit">${sjI('fit','')}${x.fit?'املأ بها الإطار':'أظهرها كاملة'}</button>${x.fit?'':`<button type="button" class="sjp-b" data-tk="sjpos">${sjI('pos','')}${['القص من الوسط','القص من الأعلى','القص من الأسفل'][x.pos||0]}</button>`}<button type="button" class="sjp-b warn" data-tk="sjphx">${sjI('trash','')}احذفها</button></div><div class="sjp-bar"><input class="sjp-capin" data-tki="sjcap" maxlength="80" value="${esc(x.cap||'')}" placeholder="تعليق يظهر على الصورة (اختياري)" aria-label="تعليق الصورة ${o.sel+1}"></div>`:'<p class="sjp-hint">المس صورة لتقديمها أو تأخيرها، أو لتعليق عليها أو حذفها.</p>'}`:'';
  const logo=R.logo&&!o.thumb&&!cont?(o.meas?'<i class="sjp-logo sjp-logo-ph"></i>':`<img class="sjp-logo" ${!o.print&&sjUrls.get('sj:logo:'+k)?`src="${sjUrls.get('sj:logo:'+k)}"`:`data-sjk="sj:logo:${k}"`} alt="">`):'';
  const title=ed?`<textarea class="sjp-title" rows="1" data-tki="sjf" data-f="t" data-grow maxlength="120" placeholder="${esc(S.ph)}" aria-label="عنوان الصفحة">${esc(p.t||'')}</textarea>`:`<${hT} class="sjp-title">${esc(p.t||'بلا عنوان')}${cont&&!part.att?' <small>(تابع)</small>':''}</${hT}>`;
  const sub=cont?'':k==='t'?(ed?`<input class="sjp-sub" data-tki="sjf" data-f="sub" maxlength="160" value="${esc(p.sub||'')}" placeholder="سطر تعريفي (اختياري): الجهة أو المكان، ودورك فيه" aria-label="سطر تعريفي">`:(String(p.sub||'').trim()?`<p class="sjp-sub">${esc(p.sub)}</p>`:'')):`<div data-sjwho>${sjWho(k,p,ed)}</div>`;
  const head=`<header class="sjp-hd"><div><span class="sjp-cat">${cont&&part.att?'التقرير المرفق':esc(sjCat(k,p.c)||S.name)}</span>${title}${sub}</div><div class="sjp-when">${logo}<span data-sjwhen style="display:contents">${cont?'':sjWhen(R,p)}</span></div></header>`;
  const rep=showRep?`<section class="sjp-rep"><${hR} class="sjp-rh">${cont&&!part.att?'تابع التقرير':'التقرير'}</${hR}>${ed?`<textarea class="sjp-txt" data-tki="sjf" data-f="txt" data-grow maxlength="6000" placeholder="${esc(S.rep)}" aria-label="نص التقرير">\n${esc(p.txt||'')}</textarea>${String(p.txt||'').trim()?'':`<div class="sjp-bar"><button type="button" class="sjp-b" data-tk="sjskel">${sjI('note','')}أدرج عناصر مقترحة</button></div>`}`:`<div class="sjp-txt">${esc(txt)}</div>`}</section>`:'';
  const att=p.at.length&&last&&!o.thumb?`<div class="sjp-att">${sjI('clip','')}<span>${p.at.length>1?'المرفقات:':'المرفق:'}</span>${p.at.map(a=>`<b><bdi>${esc(a.n)}</bdi></b>`).join('<span>·</span>')}</div>`:'';
  return `<article class="ps sjp sjp-${ed?'edit':'fix'}${only?' sjp-only':''}${part&&part.fs?' sjp-fs'+part.fs:''}${cont?' sjp-cont':''}"${ed?' aria-label="صفحة السجل"':''}><div class="sjp-c"><div class="sjp-in">${head}<div class="sjp-body">${grid}${drop}${bar}${rep}${att}</div><footer class="sjp-ft"${ed?' data-sjft':''}>${sjFoot(k,R,p,o.no)}</footer></div></div></article>`}
/* في تخطيط «صور فقط»: التقرير المكتوب ورقة ثانية تُطبع بعد الصور */
function sjSheet2(k,p){const S=SJ[k];return `<article class="ps sjp sjp-edit sjp-cont sjp-two" aria-label="التقرير المرفق"><div class="sjp-c"><div class="sjp-in"><header class="sjp-hd"><div><span class="sjp-cat">التقرير المرفق</span><div class="sjp-title" data-sjt2>${esc(p.t||'بلا عنوان')}</div></div></header><div class="sjp-body"><section class="sjp-rep"><h3 class="sjp-rh">التقرير</h3><textarea class="sjp-txt" data-tki="sjf" data-f="txt" data-grow maxlength="6000" placeholder="${esc(S.rep)}" aria-label="نص التقرير المرفق">\n${esc(p.txt||'')}</textarea>${String(p.txt||'').trim()?'':`<div class="sjp-bar"><button type="button" class="sjp-b" data-tk="sjskel">${sjI('note','')}أدرج عناصر مقترحة</button></div>`}</section><p class="sjp-hint">يُطبع هذا التقرير في صفحة تالية للصور. اتركه فارغًا إن اكتفيت بالصور أو بملف مرفق.</p></div></div></div></article>`}
function sjCover(k,R,L){const F=sjFlt[k],who=k==='s'?F.st:'',cns=k==='s'&&(F.st||F.ck)?[...new Set(L.map(p=>p.cn).filter(Boolean))]:[],cls=cns.length===1?cns[0]:'';
  const title=k==='t'?'سجل الإنجاز':who?'سجل إنجاز المتعلم':'سجل إنجاز المتعلمين';
  const l1=k==='t'?(R.name||''):(who||cls),l2=k==='t'?(R.job||''):[who?cls:'',R.name?'المعلم: '+R.name:'',R.job||''].filter(Boolean).join(' · ');
  const nums=[[L.length,'الإنجازات'],[new Set(L.map(p=>p.c)).size,'الأقسام'],[L.reduce((a,p)=>a+p.ph.length,0),'الصور']];
  return `<section class="ps sjp sjp-fix sjp-cover"><div class="sjp-c"><div class="sjp-in"><i class="sjp-mark"></i><div class="sjp-cv-top">${R.logo?`<img class="sjp-logo" data-sjk="sj:logo:${k}" alt="">`:''}${R.org?`<span>${esc(R.org)}</span>`:''}${R.school?`<b>${esc(R.school)}</b>`:''}</div>
   <div class="sjp-cv-mid"><span class="sjp-cat">العام الدراسي ${esc(R.year||F.y||sjYear(tkToday()))}${F.c&&sjCat(k,F.c)?' · '+esc(sjCat(k,F.c)):''}</span><h1>${title}</h1><hr>${l1?`<p class="sjp-cv-name">${esc(l1)}</p>`:''}${l2?`<p class="sjp-cv-job">${esc(l2)}</p>`:''}</div>
   <div class="sjp-cv-nums">${nums.map(([n,l])=>`<div><b>${n}</b><span>${l}</span></div>`).join('')}</div></div></div></section>`}
/* الفهرس أوراق ثابتة كسائر الصفحات: تُقاس صفوفه خارج الشاشة وتُوزَّع على ما يلزم من أوراق، وعنوان القسم لا يبقى وحده آخر الورقة */
function sjIndex(k,R,rows){const S=SJ[k],sec=R.po!=='d',trs=[];let lastC=null;
  rows.forEach((r,i)=>{const p=r.p;if(sec&&p.c!==lastC){lastC=p.c;trs.push([1,`<tr class="sec"><td colspan="4">${esc(sjCat(k,p.c)||'بلا قسم')}</td></tr>`])}
    trs.push([0,`<tr><td>${i+1}</td><td>${esc(p.t||'بلا عنوان')}${k==='s'&&p.st.length?`<br><small>${esc(p.st.join('، '))}</small>`:''}</td><td>${esc(sjDate(p.d))}</td><td>${r.no}</td></tr>`])});
  const foot=esc([S.name,R.name,R.school].filter(Boolean).join(' · '));
  const sheet=(body,i,n)=>`<section class="ps sjp sjp-fix sjp-index"><div class="sjp-c"><div class="sjp-in"><header class="sjp-hd"><div><span class="sjp-cat">${S.name}</span><h2 class="sjp-title">الفهرس${i?' <small>(تابع)</small>':''}</h2></div></header><div class="sjp-body"><table class="sjp-idx"><thead><tr><th>م</th><th>الإنجاز</th><th>التاريخ</th><th>الصفحة</th></tr></thead><tbody>${body}</tbody></table></div><footer class="sjp-ft"><span>${foot}</span><span class="sjp-ft-e">${n>1?`الفهرس ${i+1} من ${n}`:'الفهرس'}</span></footer></div></div></section>`;
  const m=sjMeasEl();m.innerHTML=sheet(trs.map(t=>t[1]).join(''),0,1);
  const body=m.querySelector('.sjp-body'),th=m.querySelector('thead'),avail=body.clientHeight-(th?th.offsetHeight:0)-6,hs=[...m.querySelectorAll('tbody tr')].map(tr=>tr.offsetHeight);m.innerHTML='';
  const groups=[[]];let used=0;
  trs.forEach((t,i)=>{let g=groups[groups.length-1];const need=(hs[i]||0)+(t[0]&&trs[i+1]?(hs[i+1]||0):0);if(g.length&&used+need>avail){g=[];groups.push(g);used=0}g.push(t[1]);used+=hs[i]||0});
  return groups.map((g,i)=>sheet(g.join(''),i,groups.length)).join('')}
function sjOrder(k,R,pages){const L=pages.slice(),byD=(a,b)=>String(a.d||'').localeCompare(String(b.d||''))||(a.ts||0)-(b.ts||0);if(R.po==='d')return L.sort(byD);
  const ord=SJ[k].cats.map(c=>c[0]),rank=c=>{const i=ord.indexOf(c);return i<0?ord.length-1.5:i};
  return L.sort((a,b)=>rank(a.c)-rank(b.c)||String(a.c||'').localeCompare(String(b.c||''),'ar')||byD(a,b))}
/* ---------- اتّساع التقرير: يُقاس على ورقة ثابتة خارج الشاشة بعرض ١٨٦ مم ---------- */
function sjMeasEl(){let m=document.getElementById('sjMeas');if(!m){m=document.createElement('div');m.id='sjMeas';m.setAttribute('aria-hidden','true');document.body.appendChild(m)}return m}
function sjFit(k,R,p,ph){const txt=String(p.txt||'').trim();ph=ph||p.ph;if(!txt)return [{txt:'',fs:0,cont:false,last:true}];
  const m=sjMeasEl();
  /* يُترك سطر احتياط: فرق التفاف كلمة بين الشاشة والطابعة لا يقصّ سطرًا */
  const mount=(cont,fs)=>{m.innerHTML=sjSheet(k,R,p,{mode:'fix',meas:1,ph,part:{txt:'س',fs,cont,att:cont,last:true}});const b=m.querySelector('.sjp-txt');if(b){b._s=(parseFloat(getComputedStyle(b).lineHeight)||27)*.85;b.textContent='';b._i=b.appendChild(document.createElement('div'))}return b};
  const fits=(b,t)=>{if(!b)return false;b._i.textContent=t;return b._i.offsetHeight<=b.clientHeight-b._s};
  const out=[];let rest=txt,cont=false,guard=0,box=null;
  if(p.only&&ph.length){out.push({txt:'',fs:0,cont:false});cont=true}
  while(rest&&guard++<14){let fs=-1;for(const f of [0,1]){box=mount(cont,f);if(fits(box,rest)){fs=f;break}}
    if(fs>=0){out.push({txt:rest,fs,cont});rest='';break}
    box=mount(cont,0);const T=rest.split(/(\s+)/);let lo=1,hi=T.length,best=0;
    while(lo<=hi){const mid=(lo+hi)>>1;if(fits(box,T.slice(0,mid).join(''))){best=mid;lo=mid+1}else hi=mid-1}
    if(!cont&&ph.length&&best<Math.min(T.length,36)){out.push({txt:'',fs:0,cont:false});cont=true;continue}
    if(best<1)best=Math.min(T.length,60);
    let head=T.slice(0,best).join('');const nl=head.lastIndexOf('\n');if(nl>head.length*.6)head=head.slice(0,nl);
    out.push({txt:head.replace(/\s+$/,''),fs:0,cont});rest=rest.slice(head.length).replace(/^\s+/,'');cont=true}
  if(rest&&out.length)out[out.length-1].txt+=' '+rest;
  m.innerHTML='';let first=true;out.forEach((x,i)=>{x.last=i===out.length-1;if(x.txt){x.att=x.cont&&first;first=false}});return out.length?out:[{txt,fs:1,cont:false,last:true}]}
function sjFitNote(k,p){const el=document.getElementById('sjFit');if(!el||sjCur!==p.id)return;let parts;try{parts=sjFit(k,sjS(k),p,p.ph)}catch(e){return}
  const txt=String(p.txt||'').trim(),n=parts.filter(x=>x.cont).length,nx=n===1?'صفحة تالية':n===2?'صفحتين تاليتين':n+' صفحات تالية';let msg='',warn=false;
  if(p.only&&p.ph.length)msg=txt?`يُطبع التقرير المرفق في ${nx} للصور.`:'';
  else if(n&&!parts[0].txt)msg=`لا تتّسع مساحة التقرير لنصّه مع الصور: يُطبع في ${nx}، وتملأ الصور صفحتها.${p.sz!=='s'?' صغّر مساحة الصور إن أردتهما في صفحة واحدة.':''}`;
  else if(n){warn=true;msg=`التقرير أطول من مساحته: يكتمل عند الطباعة في ${nx}.${p.ph.length&&p.sz!=='s'?' صغّر مساحة الصور إن أردته في صفحة واحدة.':''}`}
  else if(parts[0].fs)msg='يُطبع التقرير بخط أصغر درجة ليتّسع في الصفحة.';
  else if(p.ph.length&&!txt)msg='بلا تقرير تملأ الصور الصفحة عند الطباعة: انظر «معاينة».';
  el.className='sj-fit'+(warn?' warn':'');el.innerHTML=msg?sjI(warn?'flag':'check')+`<span>${msg}</span>`:''}
const sjFitSoon=(k,p)=>{clearTimeout(sjFitT);sjFitT=setTimeout(()=>sjFitNote(k,p),450)};
/* ---------- الصور والملفات ---------- */
const sjGrow=t=>{t.style.height='auto';t.style.height=(t.scrollHeight+2)+'px'};
function sjFill(root){root.querySelectorAll('img[data-sjk]').forEach(im=>{const key=im.dataset.sjk;im.removeAttribute('data-sjk');
  const miss=()=>{if(!im.isConnected)return;const f=im.closest('.sjp-ph');if(f)f.classList.add('miss');else im.remove()};
  sjUrl(key).then(u=>u||!key.startsWith('sj:t:')?[u,key]:sjUrl('sj:p:'+key.slice(5)).then(v=>[v,'sj:p:'+key.slice(5)])).then(([u,kk])=>{if(!im.isConnected)return;if(!u){miss();return}
    if(u.startsWith('blob:'))im.onerror=()=>{im.onerror=null;sjGet(kk).then(b=>b?mdData(b):'').then(d=>{if(d){sjUrls.set(kk,d);im.src=d}else miss()})};
    im.src=u})})}
function sjPick(accept,multi,cb){const i=document.createElement('input');i.type='file';if(accept)i.accept=accept;i.multiple=!!multi;i.onchange=()=>{const f=[...(i.files||[])];if(f.length)cb(f)};i.click()}
async function sjImg(file,o){o=o||{};const u=await mdData(file);if(!u)return null;
  const img=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=u});if(!img||!img.naturalWidth)return null;
  const mk=(max,q)=>new Promise(res=>{try{const s=Math.min(1,max/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(img.naturalWidth*s));c.height=Math.max(1,Math.round(img.naturalHeight*s));const x=c.getContext('2d');
    if(!o.png){x.fillStyle='rgb(255,255,255)';x.fillRect(0,0,c.width,c.height)}x.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>res(b?{b,w:c.width,h:c.height}:null),o.png?'image/png':'image/jpeg',q)}catch(e){res(null)}});
  const F=await mk(o.max||1600,o.q||.84);if(!F)return null;const T=o.thumb?await mk(420,.74):null;return {blob:F.b,thumb:T?T.b:null,w:F.w,h:F.h}}
async function sjAddPhotos(k,p,files){if(sjWork){toast('انتظر حتى ينتهي التجهيز الجاري');return}const room=6-p.ph.length;if(room<=0){toast('في الصفحة 6 صور، وهو الحد الأعلى');return}
  const imgs=files.filter(f=>/^image\//.test(f.type||'')||/\.(jpe?g|png|webp|gif|heic|heif|bmp)$/i.test(f.name||''));if(!imgs.length){toast('اختر ملفات صور');return}
  sjWork='ph';if(sjOn(k,p))sjRe();let ok=0,bad=0,full=false;
  for(const f of imgs.slice(0,room)){if(f.size>40e6){bad++;continue}const r=await sjImg(f,{thumb:1});if(!r){bad++;continue}const id=tkUid();
    if(!(await sjPut('sj:p:'+id,r.blob))){full=true;break}await sjPut('sj:t:'+id,r.thumb||r.blob);p.ph.push({id,w:r.w,h:r.h,z:r.blob.size});ok++}
  sjWork='';if(ok){p.tpl=0;p.ph.forEach(x=>{if(x.af){delete x.fit;delete x.af}});sjArrange(p);sjAutoFit(p);sjSel=-1;sjTouch(sjS(k),p);try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{})}catch(e){}}
  if(tkCur===SJ[k].id)sjRe();
  toast(full?'تعذّر حفظ الصورة على هذا الجهاز: التخزين ممتلئ أو غير متاح':bad?(ok?`أُضيف ${ok}، وتعذّرت قراءة ${bad}: جرّب صيغة JPG أو PNG`:'تعذّرت قراءة الصورة: جرّب صيغة JPG أو PNG'):imgs.length>room?`أُضيفت ${ok} فقط: الحد 6 صور في الصفحة`:ok===1?'أُضيفت الصورة':ok===2?'أُضيفت صورتان':`أُضيفت ${ok} صور`)}
/* ---------- ZIP بلا ضغط: يُكتب ويُقرأ هنا بلا مكتبة، فيعمل بلا إنترنت ---------- */
const SJ_CRC=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let i=0;i<8;i++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const sjCrc=u=>{let c=0xFFFFFFFF;for(let i=0;i<u.length;i++)c=SJ_CRC[(c^u[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
async function sjZip(files){const enc=new TextEncoder(),parts=[],cen=[],d=new Date();let off=0,cs=0;
  const dt=((d.getFullYear()-1980)<<9)|((d.getMonth()+1)<<5)|d.getDate(),tm=(d.getHours()<<11)|(d.getMinutes()<<5)|(d.getSeconds()>>1);
  for(const f of files){const nm=enc.encode(f.name),sz=f.blob.size,crc=sjCrc(new Uint8Array(await sjBuf(f.blob)));
    const h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint16(10,tm,true);h.setUint16(12,dt,true);h.setUint32(14,crc,true);h.setUint32(18,sz,true);h.setUint32(22,sz,true);h.setUint16(26,nm.length,true);
    const c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint16(12,tm,true);c.setUint16(14,dt,true);c.setUint32(16,crc,true);c.setUint32(20,sz,true);c.setUint32(24,sz,true);c.setUint16(28,nm.length,true);c.setUint32(42,off,true);
    parts.push(h.buffer,nm,f.blob);cen.push(c.buffer,nm);off+=30+nm.length+sz;cs+=46+nm.length}
  const e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,cs,true);e.setUint32(16,off,true);
  return new Blob([...parts,...cen,e.buffer],{type:'application/zip'})}
async function sjUnzip(file){const n=file.size,tail=new DataView(await sjBuf(file.slice(Math.max(0,n-66000))));let q=-1;
  for(let i=tail.byteLength-22;i>=0;i--)if(tail.getUint32(i,true)===0x06054b50){q=i;break}
  if(q<0)throw new Error('zip');const cnt=tail.getUint16(q+10,true),cs=tail.getUint32(q+12,true),co=tail.getUint32(q+16,true);
  const cd=new DataView(await sjBuf(file.slice(co,co+cs))),dec=new TextDecoder(),ent=Object.create(null);let o=0;
  for(let i=0;i<cnt&&o+46<=cd.byteLength;i++){if(cd.getUint32(o,true)!==0x02014b50)break;const nl=cd.getUint16(o+28,true),xl=cd.getUint16(o+30,true),cl=cd.getUint16(o+32,true);
    ent[dec.decode(new Uint8Array(cd.buffer,o+46,nl))]={m:cd.getUint16(o+10,true),sz:cd.getUint32(o+20,true),lo:cd.getUint32(o+42,true)};o+=46+nl+xl+cl}
  const get=async name=>{const e=ent[name];if(!e)return null;const lh=new DataView(await sjBuf(file.slice(e.lo,e.lo+30)));if(lh.byteLength<30||lh.getUint32(0,true)!==0x04034b50)return null;
    const st=e.lo+30+lh.getUint16(26,true)+lh.getUint16(28,true),raw=file.slice(st,st+e.sz);if(e.m===0)return raw;
    if(e.m===8&&typeof DecompressionStream==='function')return await new Response(raw.stream().pipeThrough(new DecompressionStream('deflate-raw'))).blob();return null};
  return {names:Object.keys(ent),get}}
const SJ_INFO=['name','job','school','org','year'];
async function sjExport(k){if(sjWork)return;const S=SJ[k],R=sjS(k);if(!R.pages.length){toast('السجل فارغ');return}sjWork='exp';if(sjOn(k))sjRe();
  try{const files=[];let miss=0;
    for(const p of R.pages){for(const x of p.ph){const b=await sjGet('sj:p:'+x.id);if(!b){miss++;continue}files.push({name:'photos/'+x.id+'.jpg',blob:b});const t=await sjGet('sj:t:'+x.id);if(t)files.push({name:'thumbs/'+x.id+'.jpg',blob:t})}
      for(const a of p.at){const b=await sjGet('sj:f:'+a.id);if(b)files.push({name:'files/'+a.id,blob:b});else miss++}}
    if(R.logo){const b=await sjGet('sj:logo:'+k);if(b)files.push({name:'logo',blob:b})}
    const info={};SJ_INFO.concat(['po','pc','pi','hij','logo']).forEach(f=>{if(R[f]!=null)info[f]=R[f]});
    const data={app:'alm-sj',v:1,kind:k,at:new Date().toISOString(),info,pages:R.pages};
    files.unshift({name:'record.json',blob:new Blob([JSON.stringify(data)],{type:'application/json'})},{name:'README.txt',blob:new Blob(['\ufeff'+S.name+' — نسخة كاملة بصورها ومرفقاتها ('+tkToday()+').\r\nلاستعادتها: افتح «دليل المعلم الألمعي» ← أدواتي ← '+S.name+' ← «استعد نسخة»، واختر هذا الملف كما هو.\r\nالصور في مجلد photos، والمرفقات في مجلد files بأسمائها المسجّلة في record.json.\r\n'],{type:'text/plain'})});
    const z=await sjZip(files);R.exp=Date.now();tkSave();nbSaveFile(z,S.name.replace(/\s+/g,'-')+'_'+tkToday()+'.zip',miss?'نُزّلت النسخة، وينقصها '+sjCnt(miss,'ملف واحد ليس','ملفان ليسا','ملفات ليست','ملفًا ليس')+' على هذا الجهاز':'نُزّلت النسخة بصورها: احفظها في مكان آمن')}
  catch(e){console.error(e);toast('تعذّر تجهيز النسخة')}
  sjWork='';if(sjOn(k))sjRe()}
const sjId=v=>typeof v==='string'&&/^[a-z0-9]{6,24}$/.test(v)?v:'';
function sjClean(p){if(!p||typeof p!=='object'||!sjId(p.id))return null;const s=(v,n)=>String(v==null?'':v).slice(0,n);
  return {id:p.id,t:s(p.t,120),d:/^\d{4}-\d{2}-\d{2}$/.test(p.d||'')?p.d:tkToday(),c:typeof p.c==='string'&&(p.c[0]==='*'?p.c.length>1:/^[a-z]{2,12}$/.test(p.c))?s(p.c,42):'other',sz:['s','m','l'].includes(p.sz)?p.sz:'m',only:p.only?1:0,man:p.man?1:0,tpl:Math.max(0,Math.min(6,+p.tpl||0)),txt:s(p.txt,6000),sub:s(p.sub,160),
    ph:(Array.isArray(p.ph)?p.ph:[]).filter(x=>x&&sjId(x.id)).slice(0,6).map(x=>Object.assign({id:x.id,w:+x.w||0,h:+x.h||0,z:+x.z||0,fit:x.fit?1:0,pos:[0,1,2].includes(+x.pos)?+x.pos:0,cap:s(x.cap,80)},x.af?{af:1}:{})),
    at:(Array.isArray(p.at)?p.at:[]).filter(a=>a&&sjId(a.id)).slice(0,5).map(a=>({id:a.id,n:s(a.n,120),z:+a.z||0,y:s(a.y,80)})),
    ck:s(p.ck,40),cn:s(p.cn,60),st:(Array.isArray(p.st)?p.st:[]).slice(0,12).map(n=>s(n,60)).filter(Boolean),lvl:SJ_LVL.includes(p.lvl)?p.lvl:'',res:s(p.res,60),pf:sjId(p.pf),ts:+p.ts||Date.now()}}
async function sjImport(k,file){if(sjWork||!file)return;const S=SJ[k];let z,D=null,pre='';
  try{z=await sjUnzip(file);const jn=z.names.find(n=>/(^|\/)record\.json$/.test(n));if(jn){pre=jn.slice(0,jn.length-11);const b=await z.get(jn);D=b?JSON.parse(new TextDecoder().decode(await sjBuf(b)).replace(/^\ufeff/,'')):null}}catch(e){D=null}
  if(!D||D.app!=='alm-sj'||!Array.isArray(D.pages)){toast('الملف ليس نسخة من سجل الإنجاز. اختر ملف ‎.zip‎ الذي نزّلته من هنا.');return}
  if(D.kind!==k){toast('هذه نسخة من «'+SJ[D.kind==='t'?'t':'s'].name+'»: استعدها من صفحته');return}
  sjWork='imp';if(sjOn(k))sjRe();let add=0,upd=0;
  try{const R=sjS(k);
    for(const p0 of D.pages){const p=sjClean(p0);if(!p)continue;
      for(const x of p.ph){const b=await z.get(pre+'photos/'+x.id+'.jpg');if(!b)continue;await sjPut('sj:p:'+x.id,new Blob([b],{type:'image/jpeg'}));const t=await z.get(pre+'thumbs/'+x.id+'.jpg');await sjPut('sj:t:'+x.id,new Blob([t||b],{type:'image/jpeg'}))}
      for(const a of p.at){const b=await z.get(pre+'files/'+a.id);if(b)await sjPut('sj:f:'+a.id,new Blob([b],{type:a.y||''}))}
      const i=R.pages.findIndex(q=>q.id===p.id);
      if(i>=0){const old=R.pages[i];old.ph.forEach(x=>{if(!p.ph.some(y=>y.id===x.id)){mdDel('sj:p:'+x.id);mdDel('sj:t:'+x.id)}});old.at.forEach(a=>{if(!p.at.some(y=>y.id===a.id))mdDel('sj:f:'+a.id)});R.pages[i]=p;upd++}else{R.pages.push(p);add++}}
    const I=D.info&&typeof D.info==='object'?D.info:{};SJ_INFO.forEach(f=>{if(!R[f]&&typeof I[f]==='string')R[f]=I[f].slice(0,100)});
    if(!R.logo&&I.logo){const b=await z.get(pre+'logo');if(b&&await sjPut('sj:logo:'+k,new Blob([b],{type:'image/png'})))R.logo=1}
    R.mod=Date.now();R.exp=R.mod;tkSave()}
  catch(e){console.error(e);toast('تعذّرت استعادة النسخة كاملة: تحقق من مساحة الجهاز');sjWork='';if(sjOn(k))sjRe();return}
  sjWork='';sjDropUrls('sj:');if(tkCur===S.id)sjRe();toast(add||upd?`استُعيدت النسخة: ${add?sjCnt(add,'صفحة جديدة','صفحتان جديدتان','صفحات جديدة','صفحة جديدة'):''}${add&&upd?'، و':''}${upd?'حُدّثت '+sjCnt(upd,'صفحة','صفحتان','صفحات','صفحة'):''}`:'لا صفحات في هذه النسخة')}
/* ---------- الطباعة ---------- */
/* المستند: غلاف وفهرس وأوراق، بصور بلا عناوين بعد (data-sjk)، يأخذه مسار الطباعة ومسار PDF */
async function sjDoc(k,pages,o){const S=SJ[k],R0=sjS(k),L=o.single?pages.slice():sjOrder(k,R0,pages),blobs={};
  for(const p of L)for(const x of p.ph){const b=await sjGet('sj:p:'+x.id);if(b)blobs['sj:p:'+x.id]=b}
  let R=R0;if(R0.logo){const b=await sjGet('sj:logo:'+k);if(b)blobs['sj:logo:'+k]=b;else R=Object.assign({},R0,{logo:0})}
  let no=0,html='';const rows=[];
  for(const p of L){const ph=p.ph.filter(x=>blobs['sj:p:'+x.id]),parts=sjFit(k,R,p,ph);rows.push({p,no:no+1});parts.forEach(pt=>{no++;html+=sjSheet(k,R,p,{mode:'fix',print:1,ph,part:pt,no})})}
  const front=o.single?'':((R.pc!==0?sjCover(k,R,L):'')+(R.pi!==0&&L.length>1?sjIndex(k,R,rows):''));
  return {html:front+html,blobs,title:o.single?(L[0].t||S.name):[k==='s'&&sjFlt.s.st?'سجل إنجاز المتعلم':S.name,k==='s'?sjFlt.s.st:R.name].filter(Boolean).join(' — ')}}
async function sjPrint(k,pages,o){o=o||{};if(sjWork)return;if(!pages.length){toast('لا صفحات للطباعة');return}const S=SJ[k];sjWork='print';if(tkCur===S.id)sjRe();
  try{const D=await sjDoc(k,pages,o);await sjPrintGo(D.html,D.blobs,D.title)}
  catch(e){console.error(e);toast('تعذّر تجهيز الطباعة')}
  sjWork='';if(tkCur===S.id)sjRe()}
/* خلية الصورة في ملف PDF: الرسّام (html2canvas) لا يعرف object-fit، فتُقصّ الصورة بنسبة خليتها وموضع قصّها، أو تُحتوى على خلفية الخلية، قبل رسمها */
async function sjCrop(b,cw,ch,fit,pos,ok){if(!(cw>0&&ch>0))return null;let src='';
  try{src=ok?URL.createObjectURL(b):await mdData(b);const img=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});if(!img||!img.naturalWidth)return null;
    const iw=img.naturalWidth,ih=img.naturalHeight,c=document.createElement('canvas'),x=c.getContext('2d');let W=cw*2,H=ch*2;
    const up=fit?Math.min(W/iw,H/ih):Math.max(W/iw,H/ih);if(up>1){W/=up;H/=up}W=Math.max(1,Math.round(W));H=Math.max(1,Math.round(H));c.width=W;c.height=H;x.imageSmoothingQuality='high';
    if(fit){const z=Math.min(W/iw,H/ih),dw=iw*z,dh=ih*z;x.fillStyle='rgb(247,246,251)';x.fillRect(0,0,W,H);x.drawImage(img,(W-dw)/2,(H-dh)/2,dw,dh)}
    else{const z=Math.max(W/iw,H/ih),sw=W/z,sh=H/z;x.drawImage(img,(iw-sw)/2,pos===1?0:pos===2?ih-sh:(ih-sh)/2,sw,sh,0,0,W,H)}
    const out=await new Promise(res=>c.toBlob(res,'image/jpeg',.9));c.width=c.height=0;return out}
  catch(e){return null}finally{sjFree(src)}}
/* ملف PDF مباشر: الأوراق نفسها تُرسم صورًا وتُجمع في ملف (tkPdf)، لمن لا يعرف «حفظ PDF» من نافذة الطباعة، وحيث لا تُفتح النافذة.
   اسم الملف يدل على ما فيه: عنوان الصفحة، أو اسم السجل ومعه المتعلم أو الصف أو القسم المعروض ثم التاريخ */
function sjFile(t){return String(t||'').replace(/[\\/:*?"<>|«»“”·\u200e\u200f]/g,' ').trim().replace(/\s+/g,'-').slice(0,48)}
async function sjPdf(k,pages,o){o=o||{};if(sjWork){toast('انتظر حتى ينتهي التجهيز الجاري');return}if(!pages.length){toast('لا صفحات في الملف');return}
  const S=SJ[k],F=sjFlt[k],made=[],ov=tkPdfOv();sjWork='pdf';ov.msg('تُجهَّز الأوراق…');ov.bar(.01);if(tkCur===S.id)sjRe();
  try{const D=await sjDoc(k,pages,o),ok=await sjBlobOk,m=sjMeasEl();m.innerHTML=D.html;const imgs=[...m.querySelectorAll('img[data-sjk]')];let n=0;
    for(const im of imgs){const b=D.blobs[im.dataset.sjk],fig=im.closest('.sjp-ph');im.removeAttribute('data-sjk');im.removeAttribute('data-box');n++;if(!b){im.remove();continue}let out=b;
      if(fig){const r=fig.getBoundingClientRect(),cl=fig.classList;out=(await sjCrop(b,r.width,r.height,cl.contains('fit'),cl.contains('p1')?1:cl.contains('p2')?2:0,ok))||b;cl.remove('fit','p1','p2')}
      if(ok){const u=URL.createObjectURL(out);made.push(u);im.src=u}else im.src=await mdData(out);
      ov.msg('تُجهَّز الصور: '+n+' من '+imgs.length);ov.bar(.01+.04*n/imgs.length)}
    const html=m.innerHTML,sheets=m.querySelectorAll('.ps').length;m.innerHTML='';
    const cns=k==='s'&&!o.single&&F.ck&&!F.st?[...new Set(pages.map(p=>p.cn).filter(Boolean))]:[];
    const name=(o.single?[sjFile(D.title)||sjFile(S.name)]:[sjFile(k==='s'&&F.st?'سجل إنجاز المتعلم':S.name),sjFile(k==='s'&&F.st?F.st:cns.length===1?cns[0]:''),sjFile(F.c?sjCat(k,F.c):''),tkToday()]).filter(Boolean).join('_')+'.pdf';
    await tkPdf(html,name,{title:D.title,scale:sheets>12?1.8:2,q:.88,solo:true,err:'تعذّر تجهيز ملف PDF. تحقّق من اتصال الإنترنت وأعد المحاولة، أو استعمل زر «اطبع».'})}
  catch(e){console.error(e);toast('تعذّر تجهيز ملف PDF. أعد المحاولة، أو استعمل زر «اطبع».')}
  ov.close();made.forEach(sjFree);sjWork='';if(tkCur===S.id)sjRe()}
/* صورة الطباعة: تُصغَّر إلى ما تحتاجه خليتها عند ٢٠٠ نقطة في البوصة، فيخفّ ملف PDF ولا تتغير الصورة المحفوظة */
async function sjLean(b,box,ok){const v=String(box||'').split(',').map(Number),cw=v[0],ch=v[1],iw=v[2],ih=v[3];if(!(cw>0&&ch>0&&iw>0&&ih>0))return b;
  const need=Math.round((v[4]?Math.min(cw,ch*iw/ih):Math.max(cw,ch*iw/ih))/25.4*200);if(need>=iw*.8)return b;
  let src='';try{src=ok?URL.createObjectURL(b):await mdData(b);const img=await new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src});if(!img)return b;
    const c=document.createElement('canvas');c.width=need;c.height=Math.max(1,Math.round(need*ih/iw));const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,c.width,c.height);
    const out=await new Promise(res=>c.toBlob(res,'image/jpeg',.86));c.width=c.height=0;return out||b}
  catch(e){return b}finally{sjFree(src)}}
async function sjPrintGo(html,blobs,title){let el=document.getElementById('fdPrint');if(!el){el=document.createElement('div');el.id='fdPrint';document.body.appendChild(el)}
  sjPrnFree();el.className='';el.innerHTML=html;const imgs=[...el.querySelectorAll('img[data-sjk]')],ok=await sjBlobOk,t0=Date.now();
  let n=0;for(const im of imgs){let b=blobs[im.dataset.sjk];if(!b){im.remove();continue}if(im.dataset.box)b=await sjLean(b,im.dataset.box,ok);
    if(ok){const u=URL.createObjectURL(b);sjPrnUrls.push(u);im.src=u}else im.src=await mdData(b);
    if(im.decode&&Date.now()-t0<20000+imgs.length*500)try{await im.decode()}catch(e){if(ok){im.src=await mdData(b);try{await im.decode()}catch(_){}}}
    if(++n%10===0&&imgs.length>14)toast('تُجهَّز صور الطباعة: '+n+' من '+imgs.length)}
  if(!el.querySelector('.sjp'))return;   /* غادر المعلم الأداة أثناء التجهيز */
  document.body.classList.add('fd-printing');const done=()=>{document.body.classList.remove('fd-printing');window.removeEventListener('afterprint',done)};window.addEventListener('afterprint',done);
  await new Promise(r=>setTimeout(r,80));almPrintWith(String(title||'سجل الإنجاز').slice(0,100),()=>window.print());setTimeout(done,1500)}
/* ---------- صفحة السجل: الفهرس المصوّر ---------- */
function sjHome(k,R,M){const S=SJ[k],F=sjFlt[k];if(sjCur){sjDropUrls('sj:p:');sjCur=''}sjSel=-1;sjPv=false;sjNewCat=false;
  if(!sjWork&&R.pages.some(sjBlank)){R.pages.filter(sjBlank).forEach(p=>sjDelPage(R,p))}
  const all=sjSorted(R),cats=sjCats(k,R).filter(([c])=>all.some(p=>p.c===c)),years=[...new Set(all.map(p=>sjYear(p.d)).filter(Boolean))].sort().reverse();
  if(F.c&&!cats.some(c=>c[0]===F.c))F.c='';if(F.y&&!years.includes(F.y))F.y='';
  let cls=[],stu=[];if(k==='s'){const m=new Map();all.forEach(p=>{if(p.ck)m.set(p.ck,p.cn||'صف')});cls=[...m];if(F.ck&&!m.has(F.ck))F.ck='';stu=[...new Set(all.reduce((a,p)=>a.concat(p.st),[]))].sort((a,b)=>a.localeCompare(b,'ar'));if(F.st&&!stu.includes(F.st))F.st=''}
  const L=sjFiltered(k,R),nPh=all.reduce((a,p)=>a+p.ph.length,0),nAt=all.reduce((a,p)=>a+p.at.length,0),size=all.reduce((a,p)=>a+p.ph.reduce((x,y)=>x+(y.z||0),0)+p.at.reduce((x,y)=>x+(y.z||0),0),0);
  const chip=(c,l,n)=>`<button class="x9-chip${F.c===c?' on':''}" data-tk="sjfc" data-c="${esc(c)}" aria-pressed="${F.c===c}">${esc(l)} (${n})</button>`;
  const inf=(f,l,ph,mx)=>`<label class="tk-lb">${l}<input class="tk-in" data-tki="sjinfo" data-f="${f}" maxlength="${mx||80}" value="${esc(R[f]||'')}" placeholder="${esc(ph||'')}"></label>`;
  const stale=all.length&&(!R.exp||(R.mod||0)>R.exp+1000);
  const card=p=>`<a class="sj-card" href="#tk/${S.id}/p-${p.id}"><div class="sj-mini" aria-hidden="true">${sjSheet(k,R,p,{mode:'fix',thumb:1})}</div><b>${esc(p.t||'بلا عنوان')}</b><small>${esc(sjDate(p.d))}${p.at.length?sjI('clip'):''}</small>${k==='s'&&p.st.length?`<small>${esc(p.st.join('، '))}</small>`:''}</a>`;
  M.innerHTML=`<div class="sj-top"><p class="sj-stats">${all.length?`<b>${sjCnt(all.length,'صفحة واحدة','صفحتان','صفحات','صفحة')}</b> · ${sjCnt(nPh,'صورة واحدة','صورتان','صور','صورة')}${nAt?' · '+sjCnt(nAt,'مرفق واحد','مرفقان','مرفقات','مرفقًا'):''}${size?' · نحو '+sjSize(size)+' على جهازك':''}`:'كل إنجاز صفحة: عنوان وتاريخ، وصور حتى 6، وتقرير تحتها أو ملف مرفق.'}</p>
    <div class="tk-row-btns"><button class="tk-btn pri" data-tk="sjnew">${tkI('plus')}صفحة جديدة</button><button class="tk-btn" data-tk="sjpdf"${L.length&&!sjWork?'':' disabled'}>${tkI('dl')}${sjWork==='pdf'?'يُجهَّز الملف…':'نزّل PDF'}</button><button class="tk-btn" data-tk="sjprint"${L.length&&!sjWork?'':' disabled'}>${tkI('print')}${sjWork==='print'?'يُجهَّز السجل…':'اطبع'}</button></div></div>
   ${all.length?`<div class="sj-filters">${all.length>7||F.q?`<input class="tk-in sj-q" type="search" data-tki="sjq" value="${esc(F.q)}" placeholder="ابحث في العناوين والتقارير" aria-label="ابحث في السجل" autocomplete="off" enterkeyhint="search">`:''}<div class="x9-chips">${chip('','الكل',all.length)}${cats.map(([c,l])=>chip(c,l,all.filter(p=>p.c===c).length)).join('')}</div>${years.length>1?tkSel('sjfy',[['','كل الأعوام']].concat(years.map(y=>[y,y])),F.y,'aria-label="العام الدراسي"'):''}${cls.length>1?tkSel('sjfk',[['','كل الصفوف']].concat(cls),F.ck,'aria-label="الصف"'):''}${stu.length?tkSel('sjfs',[['','كل المتعلمين']].concat(stu.map(n=>[n,n])),F.st,'aria-label="سجل متعلم بعينه"'):''}</div>
    <div class="sj-grid"><button class="sj-add" data-tk="sjnew">${tkI('plus')}<span>صفحة جديدة</span></button>${L.map(card).join('')}</div>${L.length?'':'<p class="tk-tip">لا صفحات بهذه التصفية.</p>'}
    ${F.c||F.y||F.q||F.ck||F.st?`<p class="tk-tip">ملف PDF والطباعة يأخذان المعروض وحده: ${sjCnt(L.length,'صفحة واحدة','صفحتان','صفحات','صفحة')}${k==='s'&&F.st?'، وغلافها باسم «'+esc(F.st)+'»':''}.</p>`:''}`
   :`<div class="tk-empty"><b>${k==='t'?'ابدأ سجلّك بأول صفحة':'ابدأ سجلّ طلابك بأول صفحة'}</b><span>${k==='t'?'ورشة قدّمتها، أو دورة حضرتها، أو مبادرة، أو تكريم: صوّرها واكتب عنها سطرين، والسجل يرتّبها ويطبعها ملفًا واحدًا بغلاف وفهرس.':'مشروع، أو بحث، أو مسابقة، أو عمل مميّز: صوّره وانسبه إلى أصحابه، والسجل يرتّبه بالصف والمتعلم، ويطبع لكل متعلم سجلّه.'}</span><button class="tk-btn pri big" data-tk="sjnew">${tkI('plus')}صفحة جديدة</button><button class="tk-btn" data-tk="sjimp"${sjWork?' disabled':''}>${tkI('ul')}${sjWork==='imp'?'تُستعاد النسخة…':'استعد نسخة محفوظة'}</button></div>`}
   <section class="tk-card"><div class="tk-card-h"><h3>${tkI('edit')}الغلاف والتذييل وخيارات الطباعة</h3></div>
    <div class="sj-form">${inf('name',k==='t'?'اسمك كما يظهر على الغلاف':'اسم المعلم')}${inf('job','المسمى والمادة','مثل: معلم التربية الإسلامية')}${inf('school','المدرسة')}${inf('org','سطر أعلى الغلاف','مثل: وزارة التربية · المنطقة التعليمية',100)}${inf('year','العام الدراسي على الغلاف',sjYear(tkToday()),20)}</div>
    <div class="sj-logo">${R.logo?`<img data-sjk="sj:logo:${k}" alt="الشعار">`:''}<button class="tk-btn sm" data-tk="sjlogo">${sjI('img')}${R.logo?'بدّل الشعار':'أضف شعار المدرسة'}</button>${R.logo?`<button class="tk-btn sm" data-tk="sjlogox">${tkI('trash')}أزله</button>`:''}</div>
    <div class="tk-row-btns"><label class="tk-ck"><input type="checkbox" data-tki="sjopt" data-f="pc"${R.pc!==0?' checked':''}>غلاف</label><label class="tk-ck"><input type="checkbox" data-tki="sjopt" data-f="pi"${R.pi!==0?' checked':''}>فهرس</label><label class="tk-ck"><input type="checkbox" data-tki="sjopt" data-f="hij"${R.hij?' checked':''}>التاريخ الهجري مع الميلادي</label>
     <span class="tk-seg sm" role="group" aria-label="ترتيب الصفحات عند الطباعة"><button data-tk="sjpo" data-v="c" aria-pressed="${R.po!=='d'}">رتّب بالأقسام</button><button data-tk="sjpo" data-v="d" aria-pressed="${R.po==='d'}">رتّب بالتاريخ</button></span></div>
    <p class="tk-tip">يظهر الاسم والمدرسة في تذييل كل صفحة. والتاريخ الهجري بتقويم أم القرى، وقد يختلف يومًا عن الرؤية.</p></section>
   ${k==='s'?`<p class="x9-note">في مدارس الموهوبين: نتاج المتعلم ملك له ويُنسب إليه، ولا يُعرض لدى جهة خارجية إلا بموافقة رئيس المكتب وموافقة ولي الأمر الكتابية (مادة 52). <a href="#p2-s5">اقرأه في الدليل</a>. وصوّر العمل نفسه، واجعل ظهور المتعلمين في الصور بما تجيزه مدرستك. وهذا سجلّك أنت لتوثيق إنجازاتهم، وليس الملف التراكمي الرسمي.</p>`:`<p class="tk-tip">السجل يحفظ الصور والتقارير نفسها. أما فهرس الشواهد على بنود تقييم الأداء فمكانه <a href="#tk/proof">ملف أدلة الأداء</a>، وتضيف إليه أي صفحة من هنا بزر واحد.</p>`}
   <section class="tk-card"><div class="tk-card-h"><h3>${tkSvg('M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8')}نسخة السجل بصوره</h3><div class="tk-row-btns"><button class="tk-btn" data-tk="sjexp"${all.length&&!sjWork?'':' disabled'}>${tkI('dl')}${sjWork==='exp'?'تُجهَّز النسخة…':'نزّل نسخة بالصور'}</button><button class="tk-btn" data-tk="sjimp"${sjWork?' disabled':''}>${tkI('ul')}${sjWork==='imp'?'تُستعاد النسخة…':'استعد نسخة'}</button></div></div>
    <p class="tk-tip">${stale?'<b>في السجل ما لم يُنسخ بعد.</b> ':''}«النسخة الاحتياطية الشاملة» تحفظ نصوص السجل وحدها. أما الصور والمرفقات فتُحفظ في هذه النسخة: ملف واحد تستعيده على هذا الجهاز أو غيره، وتعود به صفحاتك قابلة للتحرير. وملف PDF للعرض والإرسال لا للاستعادة.</p></section>
   <p class="tk-priv">${tkI('lock')}<span>النصوص والصور والمرفقات على جهازك وحده، لا يُرفع منها شيء.</span></p>`;
  sjFill(M)}
/* ---------- صفحة التحرير ---------- */
function sjEditor(k,R,p,M){const S=SJ[k],fresh=sjCur!==p.id;if(fresh){sjDropUrls('sj:p:');sjCur=p.id;sjSel=-1;sjPv=false;sjNewCat=false;sjStuOpen=null}if(sjSel>=p.ph.length)sjSel=-1;
  const L=sjSorted(R),i=L.findIndex(x=>x.id===p.id),prev=L[i-1],next=L[i+1],cats=sjCats(k,R);let stu='';
  let more='';
  if(k==='s'){const C=tkClasses(),inC=p.ck&&C.some(c=>c.k===p.ck)?tkStudents(p.ck).map(s=>s.name):[],names=inC.concat(p.st.filter(n=>!inC.includes(n))),open=sjStuOpen==null?!p.st.length:sjStuOpen;
    const copt=[['','بلا صف']].concat(C.map(c=>[c.k,c.name]));if(p.ck&&!C.some(c=>c.k===p.ck))copt.push([p.ck,p.cn||'صف سابق']);
    stu=`<label class="tk-lb">الصف${tkSel('sjck',copt,p.ck||'')}</label>
     <details class="sj-stu"${open?' open':''}><summary>أصحاب الإنجاز: ${p.st.length?esc(p.st.join('، ')):'لم تختر بعد'}</summary>${names.length?`<div class="x9-chips">${names.map(n=>`<button class="x9-chip${p.st.includes(n)?' on':''}" data-tk="sjst" data-n="${esc(n)}" aria-pressed="${p.st.includes(n)}">${esc(n)}</button>`).join('')}</div>`:''}
      <div class="tk-bar"><label class="tk-lb tk-grow">${names.length?'اسم ليس في القائمة':'اسم المتعلم'}<input class="tk-in" id="sjStNew" maxlength="60" autocomplete="off"></label><button class="tk-btn" data-tk="sjstadd">${tkI('plus')}أضفه</button></div>${C.length?'':'<p class="tk-tip">أضف صفوفك في <a href="#bag">حقيبة الصف</a> فتختار طلابك بلمسة.</p>'}</details>`;
    more=`<section class="tk-card"><div class="tk-card-h"><h3>${tkI('flag')}المستوى والنتيجة</h3></div><div class="tk-bar"><label class="tk-lb tk-grow">على مستوى${tkSel('sjlvl',SJ_LVL.map(x=>[x,x||'—']),p.lvl||'')}</label><label class="tk-lb tk-grow">النتيجة أو المركز<input class="tk-in" data-tki="sjf" data-f="res" maxlength="60" value="${esc(p.res||'')}" placeholder="مثل: المركز الأول"></label></div></section>`}
  const linked=k==='t'&&p.pf&&pfS().items.some(x=>x.id===p.pf);
  let sheet;if(sjPv){let no=0;sheet=sjFit(k,R,p,p.ph).map(pt=>sjSheet(k,R,p,{mode:'fix',part:pt,no:++no})).join('')}else sheet=sjSheet(k,R,p,{mode:'edit',sel:sjSel})+(p.only&&p.ph.length?sjSheet2(k,p):'');
  M.innerHTML=`<div class="sj-edit"><div class="sj-nav"><a class="tk-btn sm" href="#tk/${S.id}">${tkI('back')}السجل</a><span class="sj-pos">صفحة ${i+1} من ${L.length}</span>${prev?`<a class="tk-ib" href="#tk/${S.id}/p-${prev.id}" aria-label="الصفحة الأحدث" title="الصفحة الأحدث">${tkI('back')}</a>`:''}${next?`<a class="tk-ib" href="#tk/${S.id}/p-${next.id}" aria-label="الصفحة الأقدم" title="الصفحة الأقدم">${tkI('next')}</a>`:''}<span class="sj-sp"></span>
     <button class="tk-btn sm${sjPv?' on':''}" data-tk="sjpv" aria-pressed="${sjPv}">${tkI('eye')}${sjPv?'عُد إلى التحرير':'معاينة'}</button><span class="sj-acts"><button class="tk-btn sm" data-tk="sjpdf1"${sjWork?' disabled':''}>${tkI('dl')}${sjWork==='pdf'?'يُجهَّز الملف…':'نزّل الصفحة PDF'}</button><button class="tk-btn sm" data-tk="sjprint1"${sjWork?' disabled':''}>${tkI('print')}${sjWork==='print'?'تُجهَّز…':'اطبع الصفحة'}</button></span></div>
    <section class="tk-card sj-data"><div class="tk-card-h"><h3>${tkI('edit')}بيانات الصفحة</h3></div><div class="tk-bar"><label class="tk-lb tk-grow">القسم${tkSel('sjc',cats.concat([['+','قسم جديد…']]),sjNewCat?'+':p.c)}</label><label class="tk-lb">التاريخ<input class="tk-in" type="date" data-tki="sjf" data-f="d" value="${esc(p.d||'')}" max="2100-12-31"></label></div>
     ${sjNewCat?`<div class="tk-bar"><label class="tk-lb tk-grow">اسم القسم الجديد<input class="tk-in" id="sjCatNew" maxlength="40" autocomplete="off"></label><button class="tk-btn" data-tk="sjcatok">اعتمده</button></div>`:''}${stu}</section>
    <div class="sj-stage">${sheet}${sjPv?'<p class="tk-tip">هكذا تخرج الصفحة مطبوعةً وفي ملف PDF. عُد إلى التحرير لتغيّر فيها.</p>':'<p class="sj-fit" id="sjFit" role="status"></p>'}</div>
    <div class="sj-more">${more}<section class="tk-card"><div class="tk-card-h"><h3>${sjI('clip')}التقرير المرفق والملفات</h3></div>${p.at.length?`<ul class="sj-att">${p.at.map(a=>`<li><span><bdi>${esc(a.n)}</bdi><small>${sjSize(a.z||0)}</small></span><button class="tk-ib" data-tk="sjattdl" data-id="${a.id}" aria-label="نزّل ${esc(a.n)}" title="نزّله">${tkI('dl')}</button><button class="tk-ib" data-tk="sjattx" data-id="${a.id}" aria-label="احذف ${esc(a.n)}" title="احذفه">${tkI('trash')}</button></li>`).join('')}</ul>`:''}
      <div class="tk-row-btns"><button class="tk-btn" data-tk="sjatt"${p.at.length>=5||sjWork?' disabled':''}>${tkI('plus')}${sjWork==='at'?'يُحفظ الملف…':'أرفق ملفًا'}</button></div>
      <p class="tk-tip">ملف التقرير كما هو: PDF أو Word أو صورة، حتى 20 ميغابايت. يُذكر اسمه أسفل الصفحة، ويُحفظ الملف نفسه مع نسخة السجل. وإن كان تقريرك ورقة مصوّرة فأضفها صورةً واختر «صور فقط».</p></section>
     <section class="tk-card"><div class="tk-row-btns"><button class="tk-btn" data-tk="sjdup">${sjI('copy')}صفحة مشابهة</button>${k==='t'?`<button class="tk-btn${linked?' on':''}" data-tk="sjproof">${tkI('check')}${linked?'في ملف أدلة الأداء':'أضفها إلى ملف أدلة الأداء'}</button>`:''}<button class="tk-btn warn" data-tk="sjrm">${tkI('trash')}احذف الصفحة</button></div>
      <p class="tk-tip">يُحفظ ما تكتبه تلقائيًّا على جهازك.</p></section></div></div>`;
  sjFill(M);requestAnimationFrame(()=>M.querySelectorAll('[data-grow]').forEach(sjGrow));
  const sh=M.querySelector('.sjp-edit');
  if(sh){const over=on=>{const z=sh.querySelector('.sjp-drop,.sjp-photos');if(z)z.classList.toggle('over',on)};
    sh.addEventListener('dragover',e=>{if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){e.preventDefault();over(true)}});
    sh.addEventListener('dragleave',e=>{if(!sh.contains(e.relatedTarget))over(false)});
    sh.addEventListener('drop',e=>{const fs=e.dataTransfer&&e.dataTransfer.files;if(fs&&fs.length){e.preventDefault();over(false);sjAddPhotos(k,p,[...fs])}});
    sh.addEventListener('paste',e=>{const fs=[...((e.clipboardData&&e.clipboardData.files)||[])].filter(f=>/^image\//.test(f.type));if(fs.length){e.preventDefault();sjAddPhotos(k,p,fs)}})}
  const d=M.querySelector('.sj-stu');if(d)d.addEventListener('toggle',()=>{sjStuOpen=d.open});
  if(fresh&&sjBlank(p)&&!(k==='s'&&sjStuOpen)){try{if(matchMedia('(hover:hover) and (pointer:fine)').matches){const b=M.querySelector('textarea.sjp-title');if(b)b.focus({preventScroll:true})}}catch(e){}}
  if(!sjPv)sjFitNote(k,p)}
window.addEventListener('resize',()=>{if(!sjCur)return;clearTimeout(sjGrowT);sjGrowT=setTimeout(()=>document.querySelectorAll('#tkMain [data-grow]').forEach(sjGrow),160)});
const sjTool=k=>({render(M,args){const R=sjS(k),a=(args&&args[0])||'',pid=a.startsWith('p-')?a.slice(2):'',p=pid?R.pages.find(x=>x.id===pid):null,root=M.closest('.tk');
   if(pid&&!p){location.replace('#tk/'+SJ[k].id);return}if(root)root.classList.toggle('sj-ed',!!p);if(p)sjEditor(k,R,p,M);else sjHome(k,R,M)},
 act(a,t){const S=SJ[k],R=sjS(k),F=sjFlt[k];
  if(a==='sjnew'){if(R.pages.length>=600){toast('بلغ السجل 600 صفحة: نزّل نسخة منه وابدأ سجلًّا جديدًا');return}const c=F.c||R.lc||S.cats[0][0],ck=k==='s'?(F.ck||R.lk||''):'',cl=ck?tkClass(ck):null;const p=sjNewPage(k,R,{c,ck:cl?ck:'',cn:cl?cl.name:''});location.hash='#tk/'+S.id+'/p-'+p.id;return}
  if(a==='sjfc'){F.c=t.dataset.c||'';sjRe();return}
  if(a==='sjprint'){sjPrint(k,sjFiltered(k,R));return}
  if(a==='sjpdf'){sjPdf(k,sjFiltered(k,R));return}
  if(a==='sjexp'){sjExport(k);return}
  if(a==='sjimp'){sjPick('.zip,application/zip,application/x-zip-compressed',false,fs=>sjImport(k,fs[0]));return}
  if(a==='sjpo'){R.po=t.dataset.v==='d'?'d':'c';tkSave();sjRe();return}
  if(a==='sjlogo'){sjPick('image/*',false,async fs=>{const r=await sjImg(fs[0],{max:700,png:1});if(!r||!(await sjPut('sj:logo:'+k,r.blob))){toast('تعذّرت قراءة الشعار: جرّب صورة PNG أو JPG');return}sjDropUrls('sj:logo:'+k);R.logo=1;sjTouch(R);if(sjOn(k))sjRe();toast('أُضيف الشعار إلى الغلاف ورأس الصفحات')});return}
  if(a==='sjlogox'){mdDel('sj:logo:'+k);sjDropUrls('sj:logo:'+k);R.logo=0;sjTouch(R);sjRe();return}
  const p=R.pages.find(x=>x.id===sjPid());if(!p)return;const x=p.ph[sjSel];
  if(a==='sjpv'){sjPv=!sjPv;sjSel=-1;sjRe();return}
  if(a==='sjprint1'){sjPrint(k,[p],{single:1});return}
  if(a==='sjpdf1'){sjPdf(k,[p],{single:1});return}
  if(a==='sjadd'){if(p.ph.length>=6){toast('في الصفحة 6 صور، وهو الحد الأعلى');return}sjPick('image/*',true,fs=>sjAddPhotos(k,p,fs));return}
  if(a==='sjsel'){const i=+t.dataset.i;sjSel=sjSel===i?-1:i;sjRe();return}
  if(a==='sjtpl'){const tp=sjTplOf(p.ph,p.tpl,sjAreaH(p));if(!tp||tp.n<2)return;p.tpl=((tp.i+1)%tp.n)+1;sjReFit(p);sjTouch(R,p);sjRe();return}
  if(a==='sjmv'){const j=sjSel+(+t.dataset.d);if(!x||j<0||j>=p.ph.length)return;p.ph.splice(sjSel,1);p.ph.splice(j,0,x);sjSel=j;p.man=1;sjReFit(p);sjTouch(R,p);sjRe();return}
  if(a==='sjfit'){if(!x)return;x.fit=x.fit?0:1;delete x.af;sjTouch(R,p);sjRe();return}
  if(a==='sjpos'){if(!x)return;x.pos=((x.pos||0)+1)%3;sjTouch(R,p);sjRe();return}
  if(a==='sjphx'){if(!x||!tkSure(t,'اضغط ثانيةً للحذف'))return;p.ph.splice(sjSel,1);mdDel('sj:p:'+x.id);mdDel('sj:t:'+x.id);sjDropUrls('sj:p:'+x.id);sjDropUrls('sj:t:'+x.id);sjSel=-1;p.tpl=0;if(p.ph.length<2)p.man=0;sjReFit(p);sjTouch(R,p);sjRe();return}
  if(a==='sjonly'){p.only=p.only?0:1;sjSel=-1;sjReFit(p);sjTouch(R,p);sjRe();return}
  if(a==='sjsz'){p.sz=['s','m','l'].includes(t.dataset.v)?t.dataset.v:'m';sjReFit(p);sjTouch(R,p);sjRe();return}
  if(a==='sjskel'){if(String(p.txt||'').trim())return;p.txt=S.skel;sjTouch(R,p);tkRe();const b=$('#tkMain textarea.sjp-txt');if(b)try{b.focus();const n=b.value.indexOf('\n');b.setSelectionRange(n<0?b.value.length:n,n<0?b.value.length:n)}catch(e){}return}
  if(a==='sjcatok'){const el=$('#sjCatNew'),n=((el&&el.value)||'').trim().replace(/\s+/g,' ').slice(0,40);if(!n){toast('اكتب اسم القسم');return}const ex=sjCats(k,R).find(c=>c[1]===n);p.c=ex?ex[0]:'*'+n;R.lc=p.c;sjNewCat=false;sjTouch(R,p);sjRe();return}
  if(a==='sjst'){const n=t.dataset.n,i=p.st.indexOf(n);if(i>=0)p.st.splice(i,1);else{if(p.st.length>=12){toast('حتى 12 اسمًا في الصفحة الواحدة');return}p.st.push(n)}sjStuOpen=true;sjTouch(R,p);sjRe();return}
  if(a==='sjstadd'){const el=$('#sjStNew'),n=((el&&el.value)||'').trim().replace(/\s+/g,' ').slice(0,60);if(!n){toast('اكتب الاسم');return}if(p.st.length>=12&&!p.st.includes(n)){toast('حتى 12 اسمًا في الصفحة الواحدة');return}if(!p.st.includes(n))p.st.push(n);sjStuOpen=true;sjTouch(R,p);sjRe();return}
  if(a==='sjatt'){if(p.at.length>=5){toast('حتى 5 مرفقات للصفحة');return}sjPick('.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.rtf,image/*',false,async fs=>{const f=fs[0];if(f.size>20e6){toast('الملف أكبر من 20 ميغابايت: اضغطه أو قسّمه');return}
     sjWork='at';if(sjOn(k,p))sjRe();const id=tkUid(),ok=await sjPut('sj:f:'+id,f);sjWork='';if(ok){p.at.push({id,n:String(f.name||'ملف').slice(0,120),z:f.size,y:String(f.type||'').slice(0,80)});sjTouch(sjS(k),p)}if(sjOn(k,p))sjRe();toast(ok?'أُرفق الملف، وهو محفوظ على جهازك':'تعذّر حفظ الملف على هذا الجهاز')});return}
  if(a==='sjattdl'){const at=p.at.find(z=>z.id===t.dataset.id);if(at)sjGet('sj:f:'+at.id).then(b=>{if(b)nbSaveFile(b,at.n,'نُزّل المرفق');else toast('المرفق ليس على هذا الجهاز: استعد نسخة السجل التي تحويه')});return}
  if(a==='sjattx'){if(!tkSure(t,'اضغط ثانيةً للحذف'))return;p.at=p.at.filter(z=>z.id!==t.dataset.id);mdDel('sj:f:'+t.dataset.id);sjTouch(R,p);sjRe();return}
  if(a==='sjdup'){const q=sjNewPage(k,R,{c:p.c,sub:p.sub||'',ck:p.ck||'',cn:p.cn||'',st:p.st.slice(),lvl:p.lvl||'',sz:p.sz||'m',only:p.only?1:0});location.hash='#tk/'+S.id+'/p-'+q.id;toast('صفحة جديدة بالقسم نفسه وبياناته');return}
  if(a==='sjrm'){if(!tkSure(t,'اضغط ثانيةً لحذف الصفحة وصورها'))return;sjDelPage(R,p);location.hash='#tk/'+S.id;toast('حُذفت الصفحة');return}
  if(a==='sjproof'){const P=pfS();if(p.pf&&P.items.some(z=>z.id===p.pf)){toast('هذه الصفحة في ملف أدلة الأداء من قبل');return}if(!String(p.t||'').trim()){toast('اكتب عنوان الصفحة أولًا');return}
    const id=tkUid();P.items.push({id,t:String(p.t).slice(0,100),c:(S.cats.find(c=>c[0]===p.c)||[])[2]||'init',d:p.d||tkToday(),n:String(p.txt||'').replace(/\s+/g,' ').trim().slice(0,300),r:'سجل إنجاز المعلم'});p.pf=id;sjTouch(R,p);sjRe();toast('أُضيفت إلى ملف أدلة الأداء')}},
 input(n,t,e){const R=sjS(k),F=sjFlt[k],ch=e&&e.type==='change';
  if(n==='sjinfo'){const f=t.dataset.f;if(SJ_INFO.includes(f)){R[f]=t.value.slice(0,+t.maxLength||100);sjTouch(R)}return}
  if(n==='sjopt'){if(!ch)return;const f=t.dataset.f;if(f==='hij')R.hij=t.checked?1:0;else if(f==='pc'||f==='pi')R[f]=t.checked?1:0;sjTouch(R);if(f==='hij')sjRe();return}
  if(n==='sjq'){F.q=t.value.slice(0,60);clearTimeout(sjFitT);sjFitT=setTimeout(()=>{if(sjOn(k))sjRe()},240);return}
  if(n==='sjfy'||n==='sjfk'||n==='sjfs'){if(!ch)return;F[{sjfy:'y',sjfk:'ck',sjfs:'st'}[n]]=t.value;sjRe();return}
  const p=R.pages.find(x=>x.id===sjPid());if(!p)return;
  if(n==='sjc'){if(!ch)return;if(t.value==='+'){sjNewCat=true;tkRe();const b=$('#sjCatNew');if(b)b.focus();return}sjNewCat=false;p.c=t.value;R.lc=p.c;sjTouch(R,p);sjRe();return}
  if(n==='sjck'){if(!ch)return;const c=t.value?tkClass(t.value):null;p.ck=c?t.value:'';p.cn=c?c.name:'';R.lk=p.ck;sjStuOpen=true;sjTouch(R,p);sjRe();return}
  if(n==='sjlvl'){if(!ch)return;p.lvl=SJ_LVL.includes(t.value)?t.value:'';sjTouch(R,p);sjRe();return}
  if(n==='sjcap'){const x=p.ph[sjSel];if(!x)return;x.cap=t.value.slice(0,80);sjTouch(R,p);const b=$('#tkMain .sjp-ph.sel');if(b){let c=b.querySelector('.sjp-cap');if(x.cap){if(!c){c=document.createElement('span');c.className='sjp-cap';b.appendChild(c)}c.textContent=x.cap}else if(c)c.remove()}return}
  if(n==='sjf'){const f=t.dataset.f;if(!['t','sub','txt','res','d'].includes(f))return;
    if(f==='d'){if(!/^\d{4}-\d{2}-\d{2}$/.test(t.value))return;p.d=t.value}else p[f]=t.value.slice(0,+t.maxLength||200);
    sjTouch(R,p);if(t.dataset.grow!=null)sjGrow(t);
    if(f==='d'){const w=$('#tkMain .sjp-edit [data-sjwhen]'),ft=$('#tkMain .sjp-edit [data-sjft]');if(w)w.innerHTML=sjWhen(R,p);if(ft)ft.innerHTML=sjFoot(k,R,p)}
    if(f==='res'){const w=$('#tkMain .sjp-edit [data-sjwho]');if(w)w.innerHTML=sjWho(k,p,true)}
    if(f==='t'){const b=$('#tkMain [data-sjt2]');if(b)b.textContent=p.t||'بلا عنوان'}
    if(f==='t'||f==='txt'){if(f==='txt'){const b=$('#tkMain [data-tk="sjskel"]');if(b&&p.txt.trim())b.parentElement.remove()}sjFitSoon(k,p)}}},
 key(e){const t=e.target;if(!t||!t.classList)return;
  if(e.key==='Enter'&&t.classList.contains('sjp-title')){e.preventDefault();const b=$('#tkMain input.sjp-sub')||$('#tkMain textarea.sjp-txt');if(b)b.focus();return}
  if(e.key==='Enter'&&(t.id==='sjStNew'||t.id==='sjCatNew')){e.preventDefault();this.act(t.id==='sjStNew'?'sjstadd':'sjcatok',t);return}
  if(e.key==='Escape'&&sjSel>=0&&!/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)){sjSel=-1;sjRe()}},
 leave(){sjDropUrls('sj:');sjCur='';sjSel=-1;sjPv=false;sjNewCat=false;clearTimeout(sjFitT);const m=document.getElementById('sjMeas');if(m)m.remove();const f=document.getElementById('fdPrint');if(f&&f.querySelector('.sjp'))f.innerHTML='';sjPrnFree()}});
TK_PAGES.folio=sjTool('t');TK_PAGES.sfolio=sjTool('s');
window.ALM_SJ={S:sjS,fit:sjFit,tpl:sjTplOf,arrange:sjArrange,zip:sjZip,unzip:sjUnzip,sheet:sjSheet,flt:sjFlt,cls:()=>tkClasses()};
