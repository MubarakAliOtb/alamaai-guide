/* ============ v131: القراءة المركّزة في صفحات الأجزاء (m2/pg.js) ============
   الجزء كان صفحة واحدة من عشرات الشاشات. صار:
     #part-N   فهرس الجزء: أقسامه صفوفًا، لكل قسم سؤاله وزمن قراءته وعلامة إنجازه
     #pN-sM    قسم واحد وحده، وعناوينه الفرعية مطوية تُفتح بضغطة، وتحته «السابق/التالي»
   ولا يُحذف من النص شيء: «عرض الجزء كله في صفحة واحدة» يعيد العرض القديم ويُحفظ الاختيار (dms:pg).
   يُحقن بعد kb.js داخل السكربت الرئيسي (m2/build.py)، ويستدعي route() الدالتين pgApply و pgLand. */
const PG_WPM=170, PG_FOLD_W=450;                         /* كلمات الدقيقة لقراءة متأنية، وأقل طول يُطوى */
let pgBackY={}, pgQ=null;
const pgPref=()=>{const p=store.get('pg',null);return p&&typeof p==='object'?p:{}};
const pgWords=el=>((el&&el.textContent)||'').trim().split(/\s+/).filter(Boolean).length;
const pgMin=w=>Math.max(1,Math.round(w/PG_WPM));
const pgMinT=m=>m===1?'دقيقة واحدة':m===2?'دقيقتان':m<=10?ar(m)+' دقائق':ar(m)+' دقيقة';
const pgSecT=n=>n===1?'قسم واحد':n===2?'قسمان':n<=10?ar(n)+' أقسام':ar(n)+' قسمًا';
const pgView=pi=>{const r=document.getElementById('part'+pi);return r&&r.closest('.view')};
function pgAcc(id){try{return FD_ACC.find(a=>a.sec===id&&a.st&&a.st.length>1)||null}catch(e){return null}}
function pgGist(sec,acc){if(acc)return acc.st[0];
  const p=[...sec.children].find(c=>c.tagName==='P'&&!c.className&&c.textContent.trim().length>40);if(!p)return '';
  let t=p.textContent.trim().replace(/\s+/g,' ');const m=t.match(/^(.{40,150}?[.؟!:])(\s|$)/);t=m?m[1]:t.slice(0,130)+(t.length>130?'…':'');return t}

/* ---------- تهيئة الجزء مرة واحدة: الفهرس، وشريط القسم، وطيّ العناوين الفرعية، والتنقل بين الأقسام ---------- */
function pgSetup(pi){const root=document.getElementById('part'+pi);if(!root||root.dataset.pg)return;const L=SECS[pi]||[];const secs=L.map(s=>document.getElementById(s.id)).filter(Boolean);
  if(!secs.length)return;root.dataset.pg='1';const info=secs.map(s=>({w:pgWords(s)}));const N=secs.length;
  secs.forEach((sec,i)=>{const acc=pgAcc(sec.id),I=info[i];I.acc=acc;I.gist=pgGist(sec,acc);I.min=pgMin(I.w);
    /* 1) العناوين الفرعية المباشرة تصير مطويات: العنوان في الملخص، وما تحته إلى العنوان التالي في جسمها */
    const heads=[...sec.children].filter(c=>c.tagName==='H3');
    if(heads.length>=2&&I.w>=PG_FOLD_W){I.fold=heads.length;heads.forEach(h=>{const d=document.createElement('details');d.className='pg-sub';const sm=document.createElement('summary');const b=document.createElement('div');b.className='pg-sub-b';
        h.before(d);sm.appendChild(h);d.appendChild(sm);d.appendChild(b);let n=d.nextSibling;
        while(n&&!(n.nodeType===1&&(n.tagName==='H3'||n.classList.contains('sec-end')||n.classList.contains('pg-sub')))){const nx=n.nextSibling;b.appendChild(n);n=nx}})}
    /* 2) شريط أعلى القسم: العودة إلى الفهرس، والموضع، وفتح الكل */
    const top=document.createElement('div');top.className='pg-top no-m2';
    top.innerHTML=`<a class="pg-back" href="#part-${pi}"><span>فهرس الجزء</span></a><span class="pg-pos">${ar(i+1)} من ${ar(N)} · ${pgMinT(I.min)}</span>${I.fold?`<button type="button" class="pg-all" data-pg="fold" aria-pressed="false">فتح الكل</button>`:''}`;
    sec.prepend(top);
    /* 3) الفكرة في سطر، من بطاقات الموضوع نفسها (الجزء الرابع يبدأ كل قسم فيه ببطاقة تعريف، فلا تُكرَّر) */
    if(acc&&pi!==5&&acc.st[1]){const g=document.createElement('p');g.className='pg-gist no-m2';g.innerHTML=`<b>الفكرة في سطر</b>${esc(acc.st[1])}`;
      const after=$('.kb-secw',sec)||$('h2',sec);if(after)after.after(g)}
    /* 4) السابق والتالي تحت القسم */
    const nav=document.createElement('nav');nav.className='pg-nav no-m2';nav.setAttribute('aria-label','التنقل بين أقسام الجزء');
    const pv=i>0?`<a class="prev" href="#${L[i-1].id}"><small>القسم السابق</small><b>${L[i-1].t}</b></a>`:`<a class="prev" href="#part-${pi}"><small>رجوع</small><b>فهرس الجزء</b></a>`;
    const nx=i<N-1?`<a class="next" href="#${L[i+1].id}"><small>القسم التالي · ${pgMinT(pgMin(info[i+1].w))}</small><b>${L[i+1].t}</b></a>`
      :(pi<PARTS.length-1?`<a class="next" href="#part-${pi+1}"><small>أنهيت أقسام هذا الجزء · التالي</small><b>${esc(shortT(pi+1))}</b></a>`:`<a class="next" href="#guide"><small>أنهيت الدليل</small><b>صفحة «الدليل»</b></a>`);
    nav.innerHTML=pv+nx;sec.appendChild(nav)});
  /* 5) الفهرس: بعد رأس الجزء وخلاصته */
  const tot=info.reduce((a,b)=>a+b.min,0);const idx=document.createElement('nav');idx.className='pg-index no-m2';idx.id='pgIdx'+pi;idx.setAttribute('aria-label','أقسام هذا الجزء');
  idx.innerHTML=`<div class="pg-ih"><p class="pg-it" role="heading" aria-level="2">أقسام هذا الجزء</p><span class="pg-im"></span></div>
    <ol class="pg-list">${L.map((s,i)=>`<li><a class="pg-row" href="#${s.id}" data-r="${s.id}"><span class="pg-n" aria-hidden="true"><i>${ar(i+1)}</i>${ic('i-check')}</span><span class="pg-rt"><b>${s.t}</b>${info[i].gist?`<small>${esc(info[i].gist)}</small>`:''}</span><span class="pg-rm">${pgMinT(info[i].min)}${info[i].acc?'<em>بطاقات</em>':''}</span></a></li>`).join('')}</ol>
    <div class="pg-if"><button type="button" class="btn ghost sm pg-mode" data-pg="mode"></button><span class="pg-tot">الجزء كله: نحو ${pgMinT(tot)} قراءة</span></div>`;
  const hero=$('.part-hero',root),bf=$('.bf-in',root);(bf||hero||secs[0]).after(idx);if(!bf&&!hero)secs[0].before(idx);
  /* مقدمة الجزء («كيف تقرأ هذا الجزء» ونحوها) تُطوى فوق الفهرس، وتُفتح في عرض الجزء كله */
  const si=$('.sec-intro',root);if(si&&si.parentNode===root){const d=document.createElement('details');d.className='pg-intro';const hd=$('h2,h3',si);const sm=document.createElement('summary');
    sm.innerHTML=`<span>${esc(hd?hd.textContent.trim():'مقدمة الجزء')}</span>`;if(hd)hd.hidden=true;while(si.firstChild)d.appendChild(si.firstChild);d.prepend(sm);si.appendChild(d);idx.before(si)}
  /* 6) «بعد هذا الجزء تستطيع أن»: تُطوى في الشاشات الضيقة ليظهر الفهرس أقرب */
  const can=hero&&$('.can-box',hero),ul=can&&$('.can-list',can),hd=can&&can.firstElementChild;
  if(can&&ul&&hd&&hd!==ul){const d=document.createElement('details');d.className='pg-can';const sm=document.createElement('summary');sm.innerHTML=`<span>${esc(hd.textContent.trim())}</span><em>${ar(ul.children.length)}</em>`;
    hd.hidden=true;ul.before(d);d.appendChild(sm);d.appendChild(ul);d.open=window.matchMedia('(min-width:1001px)').matches}
  root.addEventListener('click',e=>{const b=e.target.closest('[data-pg]');
    if(b&&b.dataset.pg==='mode'){const p=pgPref();p.all=!p.all;store.set('pg',p);pgApply(pi,null);const y=idx.getBoundingClientRect().top+window.pageYOffset-90;window.scrollTo(0,Math.max(0,y));toast(p.all?'الجزء كله في صفحة واحدة':'قسم واحد كل مرة');return}
    if(b&&b.dataset.pg==='fold'){const sec=b.closest('.sec'),open=b.getAttribute('aria-pressed')!=='true';pgFold(sec,open);const p=pgPref();p.open=open;store.set('pg',p);return}
    const row=e.target.closest('.pg-row');if(row)pgBackY[pi]=window.pageYOffset;
    if(e.target.closest('[data-done]'))setTimeout(()=>pgSync(pi),0)});
  /* المطوية التي تُفتح بيد القارئ تُبقي زر «افتح الكل» صادقًا */
  root.addEventListener('toggle',e=>{const d=e.target;if(!d.classList||!d.classList.contains('pg-sub'))return;const sec=d.closest('.sec'),b=sec&&$('.pg-all',sec);if(!b)return;
    const all=$$('.pg-sub',sec).every(x=>x.open);b.setAttribute('aria-pressed',all);b.textContent=all?'طيّ الكل':'فتح الكل'},true)}
function pgFold(sec,open){if(!sec)return;$$('.pg-sub',sec).forEach(d=>{d.open=!!open});const b=$('.pg-all',sec);if(b){b.setAttribute('aria-pressed',!!open);b.textContent=open?'طيّ الكل':'فتح الكل'}}
function pgSync(pi){const idx=document.getElementById('pgIdx'+pi);if(!idx)return;const done=store.get('done',[]),L=SECS[pi]||[];let n=0;
  $$('.pg-row',idx).forEach(a=>{const on=done.includes(a.dataset.r);if(on)n++;a.classList.toggle('done',on);a.setAttribute('aria-label',a.querySelector('b').textContent+(on?' (أنهيته)':''))});
  $('.pg-im',idx).textContent=n?`أنهيت ${ar(n)} من ${ar(L.length)}`:pgSecT(L.length);
  $('.pg-mode',idx).textContent=pgPref().all?'عرض قسم واحد كل مرة':'عرض الجزء كله في صفحة واحدة'}

/* ---------- تطبيق العرض: فهرس، أو قسم واحد، أو الجزء كله ---------- */
function pgApply(pi,sid){const root=document.getElementById('part'+pi),V=pgView(pi);if(!root||!V||!root.dataset.pg)return;const L=SECS[pi]||[],P=pgPref();
  const cur=sid&&L.some(s=>s.id===sid)?sid:null;const mode=P.all?'all':cur?'one':'index';V.dataset.pgm=mode;
  L.forEach(s=>{const el=document.getElementById(s.id);if(!el)return;el.hidden=mode==='index'||(mode==='one'&&s.id!==cur);
    if(!el.hidden&&$('.pg-sub',el))pgFold(el,mode==='all'||!!P.open)});
  const it=$('.pg-intro',root);if(it)it.open=mode==='all';
  if(mode==='one'){$$('#rail'+pi+' a').forEach(a=>a.classList.toggle('cur',a.dataset.r===cur));store.set('last',{part:pi,sec:cur})}
  pgSync(pi);
  if(mode==='index'&&pgBackY[pi]!=null){const y=pgBackY[pi];pgBackY[pi]=null;setTimeout(()=>window.scrollTo(0,y),0)}}
/* بعد فتح رابط قسم: في عرض القسم الواحد يبدأ من أعلاه، وفي عرض الجزء كله يُمرَّر إليه؛ ونتيجة البحث تفتح موضع الكلمة */
function pgLand(pi,sid){const el=document.getElementById(sid);if(!el)return;const V=pgView(pi);
  if(V&&V.dataset.pgm==='all')el.scrollIntoView();else window.scrollTo(0,0);
  const q=pgQ;pgQ=null;if(!q||Date.now()-q.t>4000)return;const W=q.w;if(!W.length)return;
  const hit=[...el.querySelectorAll('p,li,td,th,h3,h4,dd,dt,blockquote,figcaption')].find(x=>{const t=normQ(x.textContent||'');return W.every(w=>t.includes(w))})
    ||[...el.querySelectorAll('.pg-sub')].find(x=>{const t=normQ(x.textContent||'');return W.every(w=>t.includes(w))});
  if(!hit)return;for(let d=hit.closest('details');d;d=d.parentElement&&d.parentElement.closest('details'))d.open=true;
  const tgt=hit.matches('.pg-sub')?hit.querySelector('summary'):hit;
  setTimeout(()=>{const y=tgt.getBoundingClientRect().top+window.pageYOffset-(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--al-top'))||63)-24;
    window.scrollTo({top:Math.max(0,y),behavior:'auto'});tgt.classList.add('pg-hit');setTimeout(()=>tgt.classList.remove('pg-hit'),2600)},60)}
/* نتيجة بحث ضُغطت: تُحفظ كلماتها لحظة، ليُفتح موضعها داخل القسم المطوي */
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('#sRes a[href]');if(!a)return;const inp=document.getElementById('sInput');
  const w=inp?normQ(inp.value||'').split(/\s+/).filter(x=>x.length>1):[];if(w.length)pgQ={w,t:Date.now()}},true);
/* الطباعة من المتصفح: المطويات كلها مفتوحة في الورق، ثم تعود كما كانت */
let pgPrint=null;
window.addEventListener('beforeprint',()=>{pgPrint=$$('.view:not([hidden]) details.pg-sub:not([open]), .view:not([hidden]) details.pg-can:not([open]), .view:not([hidden]) details.pg-intro:not([open])');pgPrint.forEach(d=>{d.open=true})});
window.addEventListener('afterprint',()=>{(pgPrint||[]).forEach(d=>{d.open=false});pgPrint=null});
{const I3=initPart;initPart=function(pi){const r=I3.apply(this,arguments);try{pgSetup(pi)}catch(e){try{console.error('pg',e)}catch(x){}}return r}}
