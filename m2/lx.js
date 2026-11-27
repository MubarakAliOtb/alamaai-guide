/* ============ v132: مختبر هندسة تجربة التعلّم — دورة كاملة (m2/lx.js) ============
   يُحقن في lxd/index.html مكان سكربت المختبر. بياناته (التقنيات، الحاجات، الحدود، الروبرك، الأمثلة) من نص الجزء الثامن عشر (lxData).
   أربع مراحل على الحصة الواحدة: أصمّم (لوحة التجربة على القالب الرسمي) ← أشغّل (مؤقّت المنحنى حقلًا حقلًا) ← أقيس (الزمن الفعلي،
   والمؤشرات، وصوت المتعلم، والروبرك) ← أحسّن (ما تقوله البيانات، وقرار الدورة الثانية، وملف الأداء).
   ما يكتبه المعلم يبقى في متصفحه: lxd.lab.v2 = {v:2, cur, list:[حصة…]}؛ والحصة هي بنية v1 نفسها ومعها حقول الدورة
   (id, cyc, root, runs, act, ind, voice, by, plan). لوحة v1 المحفوظة تُرحَّل أول مرة. لا اسم طالب ولا درجة: المؤشرات أعداد مجمَّعة. */
(function(){
'use strict';
const D=JSON.parse(document.getElementById('lxData').textContent);
const K1='lxd.lab.v1',K2='lxd.lab.v2',AR='٠١٢٣٤٥٦٧٨٩';
const $=(s,r)=>(r||document).querySelector(s),$$=(s,r)=>Array.prototype.slice.call((r||document).querySelectorAll(s));
const ar=n=>String(n).replace(/\d/g,d=>AR[d]);
const arf=n=>ar(n).replace('.','٫');
const lat=s=>String(s).replace(/[٠-٩]/g,d=>AR.indexOf(d)).replace('٫','.');
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const SUBJ={isl:'التربية الإسلامية',qrn:'القرآن الكريم'},SIZE={m:'مصغّرة (٤–٦)',f:'كاملة (١٦)'};
const GR=['السادس','السابع','الثامن','التاسع'],LV=['التحليل','التقويم','الإبداع'],ORD=['الأول','الثاني','الثالث','الرابع','الخامس'];
const REF={2:['lx-p4c','المثالان المحلولان'],3:['lx-p4b','خمس عشرة تقنية'],4:['lx-p3','الحاجات والقرارات'],5:['lx-p2','ناتج الارتقاء'],7:['lx-p5','الروبرك وصوت المتعلم'],8:['lx-p4a','حدود التصميم الملزمة'],9:['lx-p6','المعلم المصمم']};
const PHASES=[['design','أصمّم','لوحة التجربة على القالب الرسمي'],['run','أشغّل','مؤقّت المنحنى حقلًا حقلًا'],['measure','أقيس','الزمن والمؤشرات وصوت المتعلم'],['improve','أحسّن','قرار الدورة الثانية وملف الأداء']];
const STEPS=[[1,'بيانات الحصة'],[2,'منحنى الحصة على القالب الرسمي'],[3,'التقنيات'],[4,'حاجات الشعبة وقرارات التصميم'],[5,'الارتقاء والقيمة والختام'],[6,'المراجعة المتباعدة'],[8,'الحدود الملزمة قبل الطباعة']];
/* أدوات الدليل التي تنفّذ التقنية في الحصة: [الاسم، الرابط] */
const G='../index.html#tk/',V='../vsc/index.html#';
const TOOL={1:[['عجلة الأسئلة السابرة',G+'probe']],2:[['عروض الدروس',G+'decks']],3:[['التقويم اللحظي',G+'live'],['شبكة الاستدعاء',G+'grid']],4:[['شاشة الحصة: اكشف وتوقّع',V+'class'],['الخط الزمني',G+'timeline']],
  5:[['مثال على الشاشة: فاتتني صلاة العيد',V+'k=x.fq-eid-missed.reveal']],6:[['عجلة الأسئلة السابرة',G+'probe']],7:[['بطاقات المواقف',G+'cases']],9:[['الخط الزمني',G+'timeline'],['مثال على الشاشة: طريق الهجرة',V+'k=x.sr-hijra-path.reveal']],
  11:[['مثبّت الحفظ',G+'hifzd']],12:[['مثال على الشاشة: بنية القلم ١–٧',V+'k=x.qh-qalam-map.reveal'],['خريطة الدرس',G+'lmap']],13:[['مصحّح التلاوة',G+'tajw']],14:[['جرّة الإنجاز',G+'jar']],15:[['المراجعة السريعة',G+'review'],['شاشة الحصة: من الذاكرة',V+'class']]};
const VQ=['ما أقوى لحظة؟','أين تُهت؟','ماذا ستفعل؟'];
const LADDER=[['منفِّذ','يطبق نموذجًا جاهزًا كما هو'],['مكيِّف','يعدّل الزمن والتجميع لشعبته'],['مصمم','يبني لوحة ومنحنى لدرس جديد ويختبرهما'],['باحث','يجمع بيانات (صوت المتعلم وبطاقة الملاحظة) ويعدّل في دورة ثانية'],['ملهِم','يقدّم ورشة ويُدرج نموذجه في الدليل بعد مراجعة الأقران']];
const root=$('#labView');
const FORM=D.limits.filter(l=>l.t==='القالب')[0]||D.limits[1];
const ic=n=>'<svg class="lx-ic" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'+({play:'<path d="M7 5v14l11-7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',next:'<path d="M15 6l-6 6 6 6"/>',prev:'<path d="M9 6l6 6-6 6"/>',plus:'<path d="M12 5v14M5 12h14"/>',minus:'<path d="M5 12h14"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',chev:'<path d="M6 9l6 6 6-6"/>',out:'<path d="M14 5h5v5M19 5l-8 8M11 6H6v12h12v-5"/>',flag:'<path d="M6 21V4h11l-2 4 2 4H6"/>',check:'<path d="M5 12l5 5 9-10"/>'})[n]+'</svg>';
let DB,S,PH='design',OPEN=1,RUN=null,TICK=null;

/* ---------- الحصص المحفوظة ---------- */
const uid=()=>'L'+Date.now().toString(36)+Math.floor(Math.random()*1e5).toString(36);
function fill(s){
  if(!s.id)s.id=uid();if(!s.at)s.at=Date.now();if(!s.cyc)s.cyc=1;if(!s.root)s.root=s.id;if(!Array.isArray(s.runs))s.runs=[];if(!Array.isArray(s.act))s.act=[];
  if(!s.ind||typeof s.ind!=='object')s.ind={};if(!s.voice||typeof s.voice!=='object')s.voice={n:0,peak:[],lost:[],next:''};
  ['peak','lost'].forEach(k=>{if(!Array.isArray(s.voice[k]))s.voice[k]=[]});if(s.voice.next==null)s.voice.next='';if(!s.voice.n)s.voice.n=0;
  if(!s.by)s.by='self';if(!s.plan||typeof s.plan!=='object')s.plan={keep:'',change:'',when:''};if(s.lim==null)s.lim=[];if(s.needs==null)s.needs=[];if(s.src==null)s.src='';return s}
function fromPreset(p,keep){
  return fill({v:1,subj:p.subj,grade:p.grade,title:keep?p.title:'',period:keep?p.period:'',mins:40,size:'m',
    segs:p.segs.map(s=>({n:keep?s.n:s.n.split(':')[0],what:keep?s.what:'',m40:s.m40,m45:s.m45,nt:s.nt||''})),
    peak:p.segs.findIndex(s=>s.peak),techs:[],needs:[],rise:'',riseLv:0,value:'',mazhar:'',vseg:0,exit:['','',''],pledge:'',date:'',rub:[0,0,0,0,0],lim:[],src:keep?p.id:''})}
const blank=subj=>fromPreset(D.presets.find(p=>p.subj===subj),false);
function valid(s){return !!(s&&s.v===1&&SUBJ[s.subj]&&Array.isArray(s.segs)&&s.segs.length&&Array.isArray(s.techs)&&Array.isArray(s.exit)&&Array.isArray(s.rub))}
function loadDB(){
  try{const d=JSON.parse(localStorage.getItem(K2));if(d&&d.v===2&&Array.isArray(d.list)){d.list=d.list.filter(valid);if(d.list.length){d.list.forEach(fill);if(!d.list.some(x=>x.id===d.cur))d.cur=d.list[0].id;return d}}}catch(e){}
  let one=null;try{const s=JSON.parse(localStorage.getItem(K1));if(valid(s))one=fill(Object.assign(blank(s.subj),s))}catch(e){}
  if(!one)one=blank('isl');return {v:2,cur:one.id,list:[one]}}
function save(){S.at=Date.now();try{localStorage.setItem(K2,JSON.stringify(DB))}catch(e){}}
function pick(id){const l=DB.list.find(x=>x.id===id);if(l){S=l;DB.cur=l.id}}
const mk=()=>'m'+S.mins;
const total=()=>S.segs.reduce((a,s)=>a+(+s[mk()]||0),0);
const tech=n=>D.techs[n-1];
const techMin=n=>{const t=tech(n).t;return t?t[S.mins===40?0:1]:0};
const isBlank=l=>!l.title.trim()&&!l.techs.length&&!l.needs.length&&!l.runs.length&&!l.rise.trim()&&!l.value.trim()&&l.cyc===1&&l.segs.every(s=>!s.what.trim());
function addLesson(l){if(isBlank(S)){DB.list[DB.list.indexOf(S)]=l}else DB.list.push(l);pick(l.id)}
const cardsN=n=>n===1?'بطاقة واحدة':n===2?'بطاقتان':n<=10?ar(n)+' بطاقات':ar(n)+' بطاقة';
const nameOf=l=>(l.title||'حصة بلا عنوان')+(l.period?' · '+l.period:'')+(l.cyc>1?' · الدورة '+ar(l.cyc):'');

/* ---------- الفحوص: كل فحص قاعدة من نص الجزء، ورقم خطوته في التصميم (s) ---------- */
function checks(){
  const c=[],k=mk(),tot=total(),last=S.segs.length-1;
  c.push(S.title.trim()?{s:1,ok:true,t:'عنوان الدرس مكتوب'}:{s:1,ok:null,t:'اكتب عنوان الدرس كما في خطة التوزيع'});
  c.push(tot===S.mins?{s:2,ok:true,t:'مجموع الحقول '+ar(tot)+' دقيقة من '+ar(S.mins)}
    :{s:2,ok:false,t:'مجموع الحقول '+ar(tot)+' دقيقة والحصة '+ar(S.mins)+': '+(tot>S.mins?'احذف ':'أضف ')+ar(Math.abs(tot-S.mins))});
  if(S.subj==='qrn'){
    const mn=D.qmin[S.mins],low=S.segs.slice(0,5).filter((s,i)=>(+s[k]||0)<mn[i]).map(s=>s.n);
    c.push(low.length?{s:2,ok:false,t:'نزل عن حدّه في القالب: '+low.join('، ')}:{s:2,ok:true,t:'أقسام حصة القرآن عند حدودها أو فوقها'});
  }
  c.push(S.peak>=0&&S.peak<=last?{s:2,ok:true,t:'الذروة في: '+S.segs[S.peak].n}:{s:2,ok:false,t:'حدّد حقل الذروة'});
  const nt=S.techs.length;
  c.push(nt>5?{s:3,ok:false,t:ar(nt)+' تقنيات في حصة واحدة، وثلاث إلى خمس تكفي'}:nt<3?{s:3,ok:null,t:'اختر ثلاث تقنيات إلى خمس (المختار '+ar(nt)+')'}:{s:3,ok:true,t:ar(nt)+' تقنيات مختارة'});
  const over=S.segs.filter((s,i)=>S.techs.filter(t=>t.seg===i).reduce((a,t)=>a+techMin(t.n),0)>(+s[k]||0)).map(s=>s.n);
  if(over.length)c.push({s:3,ok:false,t:'تقنيات تتجاوز زمن حقلها: '+over.join('، ')});
  c.push(S.needs.length?{s:4,ok:true,t:ar(S.needs.length)+' من حاجات الشعبة لها قرار ومؤشر'}:{s:4,ok:null,t:'اختر ما يغلب على شعبتك من الحاجات'});
  c.push(S.rise.trim()?{s:5,ok:true,t:'ناتج الارتقاء مكتوب ('+LV[S.riseLv]+')'}:{s:5,ok:null,t:'اكتب ناتج الارتقاء'});
  if(S.value.trim()){
    c.push(S.vseg!==last?{s:5,ok:true,t:'القيمة تُستخرج في: '+S.segs[Math.min(S.vseg,last)].n}:{s:5,ok:false,t:'القيمة مؤجلة إلى آخر الحصة؛ استخرجها في التمهيد أو أحد المحاور'});
    const m=S.mazhar.trim();
    c.push(!m?{s:5,ok:null,t:'اكتب المظهر السلوكي بصيغة المصدر'}:/^ي/.test(m)?{s:5,ok:false,t:'المظهر يبدو فعلًا مضارعًا؛ اكتبه بصيغة المصدر'}:{s:5,ok:true,t:'المظهر السلوكي مكتوب'});
  }else c.push({s:5,ok:null,t:'اكتب القيمة ومظهرها السلوكي'});
  const ex=S.exit.filter(x=>x.trim()).length;
  c.push({s:5,ok:ex===3&&S.pledge.trim()?true:null,t:'بطاقة الخروج: '+ar(ex)+' من ٣ أسئلة'+(S.pledge.trim()?'، والعهد مكتوب':'، وبلا عهد')});
  c.push(/^\d{4}-\d{2}-\d{2}$/.test(S.date)?{s:6,ok:true,t:'مواعيد المراجعة المتباعدة محسوبة'}:{s:6,ok:null,t:'اختر تاريخ الحصة لتخرج مواعيد المراجعة'});
  c.push(S.lim.length>=D.limits.length?{s:8,ok:true,t:'روجعت الحدود الملزمة كلها'}:{s:8,ok:null,t:'راجع الحدود الملزمة: '+ar(S.lim.length)+' من '+ar(D.limits.length)});
  return c;
}
function stepState(){const st={};checks().forEach(x=>{const v=x.ok===true?2:x.ok===false?0:1;st[x.s]=st[x.s]==null?v:Math.min(st[x.s],v)});return st}
function reviewDates(){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(S.date))return [];
  const p=S.date.split('-').map(Number),f=new Intl.DateTimeFormat('ar-u-nu-arab-ca-gregory',{weekday:'long',day:'numeric',month:'long'});
  return [1,3,7,30].map(d=>({d:d,t:f.format(new Date(p[0],p[1]-1,p[2]+d))}));
}
function rubTotal(l){l=l||S;return l.rub.reduce((a,b)=>a+b,0)}
function rubTarget(){
  if(S.rub.indexOf(0)>=0)return '';
  let i=0;S.rub.forEach((v,j)=>{if(v<S.rub[i])i=j});
  return S.rub[i]>=4?'':'أولوية التحسين: '+D.rubric[i].dim+' — المستوى التالي: «'+D.rubric[i].lv[S.rub[i]]+'»';
}

/* ---------- عناصر الواجهة ---------- */
const opt=(v,t,sel)=>'<option value="'+esc(v)+'"'+(sel?' selected':'')+'>'+esc(t)+'</option>';
const fld=(l,inner,cls)=>'<label class="lb-f'+(cls?' '+cls:'')+'"><span>'+l+'</span>'+inner+'</label>';
const ref=k=>REF[k]?'<a class="lb-ref" href="#'+REF[k][0]+'">في الدليل: '+REF[k][1]+'</a>':'';
const segOpts=(sel,none)=>(none?opt(-1,none,sel<0):'')+S.segs.map((s,i)=>opt(i,s.n,i===sel)).join('');
const tools=n=>TOOL[n]?'<p class="lx-tools"><b>أداة تنفّذها:</b> '+TOOL[n].map(x=>'<a href="'+x[1]+'" target="_blank" rel="noopener">'+esc(x[0])+ic('out')+'</a>').join('')+'</p>':'';
const indLabel=t=>t.ind||t.both||'';
const STEP={
1:()=>'<div class="lb-row">'
  +fld('المادة','<select data-k="subj">'+Object.keys(SUBJ).map(k=>opt(k,SUBJ[k],S.subj===k)).join('')+'</select>')
  +fld('الصف','<select data-k="grade">'+GR.map(g=>opt(g,g,S.grade===g)).join('')+'</select>')
  +fld('زمن الحصة','<select data-k="mins">'+opt(40,'٤٠ دقيقة',S.mins===40)+opt(45,'٤٥ دقيقة',S.mins===45)+'</select>')
  +fld('الشعبة','<select data-k="size">'+Object.keys(SIZE).map(k=>opt(k,SIZE[k],S.size===k)).join('')+'</select>')+'</div><div class="lb-row">'
  +fld('عنوان الدرس','<input type="text" data-k="title" value="'+esc(S.title)+'" placeholder="كما في خطة التوزيع">','w2')
  +fld('الحصة','<input type="text" data-k="period" value="'+esc(S.period)+'" placeholder="١ من ٢">')+'</div>',
2:()=>'<p class="lb-hint">وزّع الدقائق على حقول القالب، وحدّد الذروة. نسخة الأربعين تحذف التكرار لا الذروة. '+ref(2)+'</p>'
  +'<div class="lb-bar" id="lbBar"></div><div class="lb-segs">'+S.segs.map((s,i)=>'<div class="lb-seg"><input type="text" data-seg="'+i+'" data-f="n" value="'+esc(s.n)+'" aria-label="اسم الحقل">'
    +'<label class="lb-min"><input type="number" inputmode="numeric" min="0" max="60" data-seg="'+i+'" data-f="m" value="'+(+s[mk()]||0)+'" aria-label="دقائق '+esc(s.n)+'"><span>د</span></label>'
    +'<label class="lb-pk"><input type="radio" name="peak" value="'+i+'"'+(S.peak===i?' checked':'')+'><span>الذروة</span></label>'
    +(S.subj==='isl'&&i>0&&i<S.segs.length-1&&S.segs.length>3?'<button type="button" class="lb-x" data-act="delseg" data-i="'+i+'" aria-label="احذف '+esc(s.n)+'">×</button>':'<span class="lb-x0"></span>')
    +'<textarea data-seg="'+i+'" data-f="what" rows="2" placeholder="ما يجري في هذا الحقل">'+esc(s.what)+'</textarea></div>').join('')+'</div>'
  +(S.subj==='isl'&&S.segs.length<6?'<button type="button" class="btn ghost sm" data-act="addseg">أضف محورًا</button>':''),
3:()=>'<p class="lb-hint">ثلاث إلى خمس تكفي: واحدة للافتتاح وواحدة للذروة وواحدة للختام. '+ref(3)+' <b id="techOut"></b></p><div class="lb-techs">'
  +D.techs.map(t=>{const on=S.techs.find(x=>x.n===t.n),mn=t.t?ar(techMin(t.n))+' د':'خارج الحصة';
    return '<div class="lb-tech'+(on?' on':'')+'"><label><input type="checkbox" data-tech="'+t.n+'"'+(on?' checked':'')+'><b>'+esc(t.name)+'</b><em>'+esc(t.basis)+'</em><span class="lb-chip">'+mn+'</span><span class="lb-chip">'+esc(t.modes[S.size==='m'?0:1])+'</span></label>'
      +(on?'<div class="lb-td"><p>'+esc(t.how)+'</p>'+(t.both?'<p><b>الضابط والمؤشر:</b> '+esc(t.both)+'</p>':'<p><b>الضابط:</b> '+esc(t.ctl)+' · <b>المؤشر:</b> '+esc(t.ind)+'</p>')+tools(t.n)
        +(t.t?fld('حقلها في القالب','<select data-tseg="'+t.n+'">'+segOpts(on.seg,'لم يُحدَّد')+'</select>'):'<p class="lb-hint">'+esc(t.tt)+'</p>')+'</div>':'')+'</div>'}).join('')+'</div>',
4:()=>'<p class="lb-hint">اختر ما يغلب على شعبتك؛ يدخل قراره ومؤشره في اللوحة، ويُرصد مؤشره في «أقيس». '+ref(4)+'</p><div class="lb-needs">'
  +D.needs.map((n,i)=>'<label class="lb-need"><input type="checkbox" data-need="'+i+'"'+(S.needs.indexOf(i)>=0?' checked':'')+'><span><b>'+esc(n.t)+'</b> '+esc(n.dec)+'<small>مثال: '+esc(n[S.subj])+' · يُرصد: '+esc(n.ind)+'</small></span></label>').join('')+'</div>',
5:()=>'<p class="lb-hint">ناتج الارتقاء يُكتب في «تكملة التحضير» ولا يُخلط بمؤشرات القالب الرسمية. '+ref(5)+'</p><div class="lb-row">'
  +fld('ناتج الارتقاء','<textarea data-k="rise" rows="2" placeholder="ناتج إضافي للموهوبين">'+esc(S.rise)+'</textarea>','w2')
  +fld('مستواه','<select data-k="riseLv">'+LV.map((l,i)=>opt(i,l,S.riseLv===i)).join('')+'</select>')+'</div><div class="lb-row">'
  +fld('القيمة','<input type="text" data-k="value" value="'+esc(S.value)+'" placeholder="كما في النموذج الرسمي">')
  +fld('مظهرها السلوكي بصيغة المصدر','<input type="text" data-k="mazhar" value="'+esc(S.mazhar)+'" placeholder="الحرص على…">','w2')
  +fld('تُستخرج في','<select data-k="vseg">'+segOpts(S.vseg)+'</select>')+'</div><div class="lb-row">'
  +[0,1,2].map(i=>fld('سؤال الخروج '+ar(i+1),'<input type="text" data-exit="'+i+'" value="'+esc(S.exit[i])+'">')).join('')
  +fld('العهد السلوكي','<input type="text" data-k="pledge" value="'+esc(S.pledge)+'" placeholder="عهد يختاره الطالب ويتابعه">','w2')+'</div>',
6:()=>'<div class="lb-row">'+fld('تاريخ الحصة','<input type="date" data-k="date" value="'+esc(S.date)+'">')+'<p class="lb-out w2" id="dateOut"></p></div>',
8:()=>'<p class="lb-hint">راجع كل حدّ وأثره في التصميم. '+ref(8)+' <b id="limOut"></b></p><div class="lb-lims">'
  +D.limits.map((l,i)=>'<label class="lb-need"><input type="checkbox" data-lim="'+i+'"'+(S.lim.indexOf(i)>=0?' checked':'')+'><span><b>'+esc(l.t)+'</b> '+esc(l.eff)+'<small>'+esc(l.src)+'</small></span></label>').join('')+'</div>'
};
const RUB=()=>'<div class="lb-rub">'+D.rubric.map((d,i)=>'<fieldset><legend>'+esc(d.dim)+'</legend>'+d.lv.map((l,j)=>'<label><input type="radio" name="rub'+i+'" value="'+(j+1)+'"'+(S.rub[i]===j+1?' checked':'')+'><span><b>'+ar(j+1)+'</b> '+esc(l)+'</span></label>').join('')+'</fieldset>').join('')+'</div><p class="lb-out" id="rubOut"></p>';
const COL=['var(--navy-900)','var(--blue-500)','var(--blue-800)','var(--navy-600)'];
function bar(cur){
  const k=mk();
  return S.segs.map((s,i)=>(+s[k]||0)?'<span'+(cur===i?' class="cur"':'')+' style="flex:'+s[k]+' 1 0;background:'+(i===S.peak?'var(--orange-500)':COL[i%COL.length])+';color:'+(i===S.peak?'rgb(30,27,75)':'#fff')+'" title="'+esc(s.n)+'">'+ar(s[k])+'</span>':'').join('');
}
function msg(t){const m=$('#lbMsg',root);if(m){m.textContent=t;clearTimeout(msg.t);msg.t=setTimeout(()=>{m.textContent=''},6000)}}

/* ---------- الهيكل: الرأس المصوَّر، والحصص، والمراحل ---------- */
function shell(){
  root.innerHTML='<header class="bnd bnd-top lx-top"><span class="bnd-m"><video src="../vid/m2/lx-door.mp4" poster="img/door.webp" muted loop playsinline preload="none" aria-hidden="true" tabindex="-1" data-lxm></video></span><span class="bnd-veil"></span>'
    +'<div class="bnd-in"><p class="bnd-k">دليل المعلم الألمعي · الجزء الثامن عشر</p><h1>مختبر هندسة تجربة التعلّم</h1>'
    +'<p>صمّم الحصة تجربةً داخل القالب الرسمي، ثم شغّلها بمؤقّت منحناها، وقِس أثرها بصوت المتعلم، وحسّنها في دورة ثانية. ما تكتبه يبقى في متصفحك وحده.</p>'
    +'</div></header>'
    +'<nav class="lx-tabs" id="lxTabs" aria-label="مراحل العمل">'+PHASES.map((p,i)=>'<a href="#lab'+(i?'/'+p[0]:'')+'" data-ph="'+p[0]+'" title="'+p[2]+'"><b>'+ar(i+1)+'</b><span>'+p[1]+'</span></a>').join('')+'</nav>'
    +'<div class="lx-les" id="lxLes"></div><div id="lxBody"></div><p class="lb-msg" id="lbMsg" role="status"></p>'
    +'<section class="lb-sheet" id="lbSheet" aria-label="ورقة الطباعة"></section><input type="file" id="lbFile" accept="application/json,.json" hidden>';
  if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)){const v=$('[data-lxm]',root);try{v.muted=true;const p=v.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
}
function lessons(){
  const a=DB.list;
  $('#lxLes',root).innerHTML='<div class="lx-lrow"><b>حصصي</b>'+a.map(l=>'<button type="button" class="lx-l'+(l.id===S.id?' on':'')+'" data-act="pick" data-id="'+l.id+'" aria-pressed="'+(l.id===S.id)+'">'+esc(nameOf(l))+'</button>').join('')
    +'<button type="button" class="btn ghost sm" data-act="new">'+ic('plus')+' حصة جديدة</button>'+(DB.list.length>1?'<button type="button" class="btn ghost sm" data-act="del">احذف هذه الحصة</button>':'')+'</div>'
    +(PH==='design'?'<div class="lx-lrow lx-pre"><span>أو ابدأ من مثال محلول:</span>'+D.presets.map(p=>'<button type="button" class="btn ghost sm" data-act="preset" data-id="'+p.id+'">'+esc(p.name)+'</button>').join('')+'</div>':'');
}
function phaseMarks(){$$('[data-ph]',root).forEach(a=>{if(a.dataset.ph===PH)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')})}
function body(){
  lessons();
  const b=$('#lxBody',root);b.innerHTML=({design:vDesign,run:vRun,measure:vMeasure,improve:vImprove})[PH]();
  $('#lbSheet',root).hidden=PH!=='design';
  phaseMarks();refresh();if(window.BX_SYNC)window.BX_SYNC();
}
function drawAll(){body()}
/* بعد تبديل المرحلة: يبدأ جسمها من تحت شريط المراحل اللاصق */
function toBody(){const b=$('.lx-top',root),t=$('body>header.top');if(!b)return;window.scrollTo({top:Math.max(0,Math.round(b.getBoundingClientRect().bottom+window.pageYOffset-(t?t.offsetHeight:0))),behavior:'instant'})}
const nextBtn=(ph,t,pri)=>'<p class="lx-next"><a class="btn'+(pri?' accent':'')+'" href="#lab/'+ph+'">'+t+' '+ic('next')+'</a></p>';

/* ---------- ١ أصمّم ---------- */
function vDesign(){
  const st=stepState();
  return '<div class="lb-grid"><div class="lb-main">'+STEPS.map((x,i)=>{const k=x[0],o=OPEN===k,v=st[k];
      return '<section class="lb-card lx-step'+(o?' open':'')+'" data-step="'+k+'"><h3><button type="button" class="lx-sth" data-act="step" data-k="'+k+'" aria-expanded="'+o+'"><i>'+ar(i+1)+'</i><span>'+x[1]+'</span><em class="lx-dot '+(v===2?'ok':v===0?'bad':'soft')+'" data-dot="'+k+'"></em>'+ic('chev')+'</button></h3><div class="lx-stb"'+(o?'':' hidden')+'>'+STEP[k]()+'</div></section>'}).join('')
    +nextBtn('run','اللوحة جاهزة: إلى التشغيل',1)+'</div>'
    +'<aside class="lb-side" aria-label="حالة اللوحة"><h4>حالة اللوحة</h4><ul id="lbChecks"></ul><div class="lb-btns"><button type="button" class="btn ghost sm" data-act="show">اعرض اللوحة</button>'
    +'<button type="button" class="btn ghost sm" data-act="print">اطبع</button><button type="button" class="btn ghost sm" data-act="copy">انسخ نصًّا</button>'
    +'<button type="button" class="btn ghost sm" data-act="export">صدّر</button><button type="button" class="btn ghost sm" data-act="import">استورد</button></div></aside></div>'
    +'<section class="bnd bnd-band lx-band"><span class="bnd-m"><img src="../m2/img/nb.webp" alt="" width="1600" height="727" loading="lazy" decoding="async"></span><span class="bnd-veil"></span><div class="bnd-in"><h2>لوحة تجربة الحصة كما تُطبع</h2>'
    +'<p>ورقة واحدة على A4 تجمع المنحنى والتقنيات والقيمة والختام، وتتحدّث وأنت تكتب.</p><button type="button" class="bnd-btn" data-act="print">اطبع اللوحة</button></div></section>';
}
function draw(k){const el=$('[data-step="'+k+'"] .lx-stb',root);if(el)el.innerHTML=STEP[k]()}

/* ---------- ٢ أشغّل ---------- */
function segTechs(i){return S.techs.filter(x=>x.seg===i&&tech(x.n).t)}
function vRun(){
  const k=mk(),last=S.runs[S.runs.length-1],off=S.techs.filter(x=>x.seg<0||x.seg>=S.segs.length||!tech(x.n).t);
  return '<section class="bnd bnd-band lx-band lx-first"><span class="bnd-m"><img src="../m2/img/classroom.webp" alt="" width="1600" height="640" decoding="async"></span><span class="bnd-veil"></span><div class="bnd-in"><h2>شغّل الحصة بمؤقّت منحناها</h2>'
    +'<p>شاشة واحدة أمامك أثناء الحصة: الحقل الجاري ودقائقه، وتقنيته بضابطها، وعدّاد لمؤشرها، وزر يفتح أداتها. تنتقل أنت بين الحقول، والمؤقّت ينبّه ولا يقرّر.</p>'
    +'<button type="button" class="bnd-btn bnd-solid" data-act="run">'+ic('play')+' ابدأ الحصة ('+ar(total())+' د)</button></div></section>'
    +'<h2 class="lx-h">مسار الحصة</h2><div class="lb-bar">'+bar()+'</div><ol class="lx-plan">'+S.segs.map((s,i)=>'<li'+(i===S.peak?' class="pk"':'')+'><div class="lx-pt"><b>'+esc(s.n)+'</b>'+(i===S.peak?'<i>الذروة</i>':'')+'<span>'+((+s[k]||0)?ar(s[k])+' د':esc(s.nt||'٠ د'))+'</span></div>'
      +(s.what.trim()?'<p>'+esc(s.what)+'</p>':'')+segTechs(i).map(x=>'<p class="lx-tq"><b>'+esc(tech(x.n).name)+'</b> · '+ar(techMin(x.n))+' د</p>').join('')
      +(S.value.trim()&&S.vseg===i?'<p class="lx-tq"><b>القيمة تُستخرج هنا:</b> '+esc(S.value)+'</p>':'')+'</li>').join('')+'</ol>'
    +(off.length?'<p class="lb-hint">تقنيات خارج الحصة أو بلا حقل: '+off.map(x=>esc(tech(x.n).name)).join('، ')+'.</p>':'')
    +(last?'<p class="lb-out">آخر تشغيل: '+esc(last.d)+' · '+arf(last.tot)+' دقيقة فعلية من '+ar(last.plan)+'.</p>':'')
    +nextBtn('measure','بعد الحصة: إلى القياس');
}
function runStart(){
  if(RUN)return;const k=mk();
  let seq=S.segs.map((s,i)=>i).filter(i=>(+S.segs[i][k]||0)>0);if(!seq.length)seq=S.segs.map((s,i)=>i);
  RUN={seq:seq,p:0,i:seq[0],on:false,used:S.segs.map(()=>0),left:(+S.segs[seq[0]][k]||0)*60,ind:{},exit:false,last:Date.now()};
  S.techs.forEach(x=>{RUN.ind['t'+x.n]=0});
  const o=document.createElement('div');o.className='lx-run lb-run';o.id='lxRun';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','تشغيل الحصة');
  document.body.appendChild(o);document.body.classList.add('lx-run-on');runInert(true);
  {const m=$('#lbMsg',root);if(m){clearTimeout(msg.t);m.textContent=''}}
  o.addEventListener('click',runClick);document.addEventListener('keydown',runKey);
  document.addEventListener('visibilitychange',runVis);window.addEventListener('beforeunload',runLeave);
  runWake();runDraw();TICK=setInterval(runTick,500);
}
const mmss=n=>{const a=Math.abs(n);return (n<0?'+':'')+ar(Math.floor(a/60))+':'+ar(('0'+a%60).slice(-2))};
/* الزمن يُحسب من ساعة الجهاز، فلا يتأخر إن خُنق المؤقّت واللسان في الخلفية (عند فتح أداة في لسان آخر) */
function runTick(){if(!RUN)return;const now=Date.now();if(!RUN.on){RUN.last=now;return}const d=Math.floor((now-RUN.last)/1000);if(d<1)return;RUN.last+=d*1000;RUN.left-=d;RUN.used[RUN.i]+=d;runClock()}
function runWake(){try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>{if(RUN)RUN.wl=w;else w.release()}).catch(()=>{})}catch(e){}}
function runVis(){if(RUN&&document.visibilityState==='visible'){runTick();runWake()}}
function runLeave(e){if(RUN&&RUN.used.reduce((a,b)=>a+b,0)>=60){e.preventDefault();e.returnValue=''}}
function runClock(){
  const o=$('#lxRun');if(!o||!RUN)return;const k=mk(),plan=(+S.segs[RUN.i][k]||0)*60,used=RUN.used.reduce((a,b)=>a+b,0);
  const c=$('[data-rl]',o);if(c){c.textContent=mmss(RUN.left);c.parentNode.classList.toggle('over',RUN.left<0);c.parentNode.classList.toggle('low',RUN.left>=0&&RUN.left<=60)}
  const t=$('[data-rt]',o);if(t)t.textContent=mmss(used)+' من '+ar(S.mins)+':'+ar('00');
  const p=$('[data-rp]',o);if(p)p.style.width=Math.max(0,Math.min(100,plan?100*(plan-Math.max(RUN.left,0))/plan:100))+'%';
}
/* الحقول التابعة للحقل الجاري: ما لا دقائق له بعده (وقبل أول حقل)، يُعرض محتواه معه */
function runTail(p){const a=RUN.seq[p],b=p+1<RUN.seq.length?RUN.seq[p+1]:S.segs.length,o=[];if(p===0)for(let j=0;j<a;j++)o.push(j);for(let j=a+1;j<b;j++)o.push(j);return o}
function runSegHTML(j,own){
  const s=S.segs[j],T=segTechs(j);
  return (own?'':'<p class="lx-sub">'+esc(s.n)+(s.nt?' · '+esc(s.nt):'')+'</p>')
    +(s.what.trim()?'<div class="lx-what"><h3>ما يجري</h3><p>'+esc(s.what)+'</p></div>':'')
    +(S.value.trim()&&S.vseg===j?'<div class="lx-what lx-val"><h3>القيمة تُستخرج هنا</h3><p>'+esc(S.value)+(S.mazhar.trim()?' — '+esc(S.mazhar):'')+'</p></div>':'')
    +T.map(x=>{const t=tech(x.n),key='t'+x.n;return '<article class="lx-tc"><h3>'+esc(t.name)+' <em>'+esc(t.basis)+' · '+ar(techMin(t.n))+' د</em></h3><p>'+esc(t.how)+'</p>'+(t.ctl?'<p class="lx-ctl"><b>الضابط:</b> '+esc(t.ctl)+'</p>':'')
      +'<div class="lx-cnt"><span>'+esc(indLabel(t))+'</span><button type="button" data-r="dec" data-key="'+key+'" aria-label="أنقص: '+esc(t.name)+'">'+ic('minus')+'</button><b data-cv="'+key+'">'+ar(RUN.ind[key]||0)+'</b><button type="button" data-r="inc" data-key="'+key+'" aria-label="زد: '+esc(t.name)+'">'+ic('plus')+'</button></div>'+tools(t.n)+'</article>'}).join('');
}
function runDraw(){
  const o=$('#lxRun');if(!o||!RUN)return;const k=mk(),p=RUN.p,n=RUN.seq.length,i=RUN.i,s=S.segs[i],last=p===n-1,nx=last?null:S.segs[RUN.seq[p+1]],ex=S.exit.filter(x=>x.trim());
  const fa=document.activeElement&&o.contains(document.activeElement)?document.activeElement:null,fr=fa?fa.getAttribute('data-r'):'toggle',fk=fa?fa.getAttribute('data-key'):null;
  const refocus=()=>{const el=o.querySelector('[data-r="'+fr+'"]'+(fk?'[data-key="'+fk+'"]':'')+':not([disabled])')||o.querySelector('[data-r="toggle"],[data-r="exit"]');if(el)try{el.focus({preventScroll:true})}catch(e){}};
  if(RUN.exit){o.innerHTML='<div class="lx-exit"><p class="lx-ek">بطاقة الخروج</p><ol>'+ex.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+(S.pledge.trim()?'<p class="lx-ep"><b>عهدي:</b> '+esc(S.pledge)+'</p>':'')+'<button type="button" class="btn ghost" data-r="exit">'+ic('prev')+' عُد إلى لوحة المعلم</button></div>';refocus();return}
  const body=runSegHTML(i,true)+runTail(p).map(j=>runSegHTML(j,false)).join('');
  o.classList.toggle('stu',!!RUN.stu);
  o.innerHTML='<div class="lx-rbar"><button type="button" class="btn ghost sm" data-r="close">'+ic('x')+' أغلق</button><div class="lx-rt"><b>'+esc(S.title||'حصة بلا عنوان')+'</b><span data-rt></span></div><button type="button" class="btn ghost sm" data-r="end">'+ic('flag')+' أنهِ الحصة</button></div>'
    +'<div class="lb-bar lx-rarc">'+bar(i)+'</div>'
    +'<div class="lx-rmain"><section class="lx-now"><p class="lx-rk">الحقل '+ar(p+1)+' من '+ar(n)+(i===S.peak?' <i>الذروة</i>':'')+'</p><h2>'+esc(s.n)+'</h2>'
      +'<div class="lx-clock"><b data-rl></b><span>من '+ar(+s[k]||0)+' د</span></div><div class="lx-prog"><u data-rp></u></div>'
      +'<div class="lx-rc"><button type="button" class="btn accent lx-go" data-r="toggle">'+(RUN.on?ic('pause')+' أوقف مؤقتًا':ic('play')+(RUN.used[i]?' استمر':' ابدأ الحقل'))+'</button>'
      +'<button type="button" class="btn ghost" data-r="next"'+(last?' disabled':'')+'>الحقل التالي '+ic('next')+'</button><button type="button" class="btn ghost" data-r="prev"'+(p?'':' disabled')+'>'+ic('prev')+' السابق</button><button type="button" class="btn ghost" data-r="plus">'+ic('plus')+' دقيقة</button><button type="button" class="btn ghost" data-r="stu" aria-pressed="'+(!!RUN.stu)+'">'+(RUN.stu?'لوحة المعلم':'عرض للطلبة')+'</button></div>'
      +(nx?'<p class="lx-nx">بعده: '+esc(nx.n)+' · '+ar(+nx[k]||0)+' د</p>':'<p class="lx-nx">هذا آخر حقل في الحصة.</p>')+'</section>'
    +'<section class="lx-do">'+body
      +(last&&ex.length?'<div class="lx-what"><h3>بطاقة الخروج</h3><ol>'+ex.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>'+(S.pledge.trim()?'<p><b>العهد:</b> '+esc(S.pledge)+'</p>':'')+'<button type="button" class="btn ghost sm" data-r="exit">اعرضها للطلبة على الشاشة</button></div>':'')
      +(!body&&!(last&&ex.length)?'<p class="lb-hint">لم يُكتب لهذا الحقل وصف ولا تقنية في لوحة التصميم.</p>':'')+'</section></div>';
  runClock();refocus();
}
function runInert(on){[$('body>header.top'),root,$('#guideView')].forEach(el=>{if(el)el.inert=on})}
function runGo(p){const k=mk();RUN.p=p;RUN.i=RUN.seq[p];RUN.left=(+S.segs[RUN.i][k]||0)*60-RUN.used[RUN.i];runDraw()}
function runClick(e){
  const b=e.target.closest('[data-r]');if(!b||!RUN)return;const a=b.dataset.r;
  if(a==='toggle'){runTick();RUN.on=!RUN.on;RUN.last=Date.now();runDraw()}
  else if(a==='next'){if(RUN.p<RUN.seq.length-1){runTick();const was=RUN.on;RUN.on=true;if(!was)RUN.last=Date.now();runGo(RUN.p+1)}}
  else if(a==='prev'){if(RUN.p>0){runTick();runGo(RUN.p-1)}}
  else if(a==='plus'){RUN.left+=60;runClock()}
  else if(a==='inc'||a==='dec'){const key=b.dataset.key;RUN.ind[key]=Math.max(0,(RUN.ind[key]||0)+(a==='inc'?1:-1));const c=$('[data-cv="'+key+'"]',$('#lxRun'));if(c)c.textContent=ar(RUN.ind[key])}
  else if(a==='exit'){RUN.exit=!RUN.exit;runDraw()}
  else if(a==='stu'){RUN.stu=!RUN.stu;runDraw()}
  else if(a==='end'){runTick();runStop(true)}
  else if(a==='close'){const used=RUN.used.reduce((x,y)=>x+y,0);if(used<60||window.confirm('تُغلق شاشة التشغيل ولا يُحفظ زمن هذه الحصة. أتغلقها؟'))runStop(false)}
}
function runKey(e){if(!RUN)return;if(e.key==='Escape'&&RUN.exit){RUN.exit=false;runDraw()}else if(e.key===' '&&!RUN.exit&&!/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)){e.preventDefault();runTick();RUN.on=!RUN.on;RUN.last=Date.now();runDraw()}}
function runStop(keep){
  if(!RUN)return;clearInterval(TICK);TICK=null;const R=RUN;RUN=null;try{if(R.wl)R.wl.release()}catch(e){}
  document.removeEventListener('keydown',runKey);document.removeEventListener('visibilitychange',runVis);window.removeEventListener('beforeunload',runLeave);const o=$('#lxRun');if(o)o.remove();document.body.classList.remove('lx-run-on');runInert(false);
  if(keep){const used=R.used.reduce((a,b)=>a+b,0),act=R.used.map(x=>Math.round(x/6)/10),dt=new Intl.DateTimeFormat('ar-u-nu-arab-ca-gregory',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
    S.runs.push({d:dt,at:Date.now(),act:act,plan:total(),tot:Math.round(used/6)/10});S.runs=S.runs.slice(-5);S.act=act.slice();
    Object.keys(R.ind).forEach(k=>{if(R.ind[k])S.ind[k]=String(R.ind[k])});save();location.hash='#lab/measure';if(PH==='measure')body();msg('حُفظ زمن الحصة ومؤشراتها. أكمل القياس بصوت المتعلم.')}
  else if(PH==='run'){body();const rb=$('[data-act="run"]',root);if(rb)try{rb.focus({preventScroll:true})}catch(e){}}
}

/* ---------- ٣ أقيس ---------- */
function tally(kind,i){const v=S.voice[kind][i]||0,q=VQ[kind==='peak'?0:1],n=esc(S.segs[i].n);return '<div class="lx-tal"><em>'+q+'</em><button type="button" data-act="tal" data-kind="'+kind+'" data-i="'+i+'" data-d="-1" aria-label="أنقص: '+q+' '+n+'">'+ic('minus')+'</button><b>'+ar(v)+'</b><button type="button" data-act="tal" data-kind="'+kind+'" data-i="'+i+'" data-d="1" aria-label="زد: '+q+' '+n+'">'+ic('plus')+'</button></div>'}
function vMeasure(){
  const k=mk(),inds=S.techs.map(x=>tech(x.n)).filter(t=>indLabel(t));
  return '<p class="lb-hint lx-lead">القياس لتحسين التصميم لا لتقدير الطلبة: المؤشرات أعداد مجمَّعة بلا أسماء، ولا تُحوَّل إلى درجات. '+ref(7)+'</p>'
    +'<section class="lb-card"><h3><i>١</i>الزمن: المخطط والفعلي</h3><p class="lb-hint">يُملأ من شاشة التشغيل، أو اكتب الدقائق الفعلية بيدك.</p><div class="lx-tbl"><div class="lx-tr lx-th"><span>الحقل</span><span>المخطط</span><span>الفعلي</span><span>الفرق</span></div>'
      +S.segs.map((s,i)=>{const p=+s[k]||0,a=S.act[i];return '<div class="lx-tr'+(i===S.peak?' pk':'')+'"><span>'+esc(s.n)+(i===S.peak?' <i>الذروة</i>':'')+'</span><span>'+ar(p)+'</span><span><input type="number" inputmode="decimal" min="0" max="90" step="0.5" data-actseg="'+i+'" value="'+(a==null||a===''?'':a)+'" aria-label="الدقائق الفعلية: '+esc(s.n)+'"></span><span data-df="'+i+'"></span></div>'}).join('')+'</div></section>'
    +'<section class="lb-card"><h3><i>٢</i>مؤشرات التقنيات والقرارات</h3>'+(inds.length||S.needs.length?'<div class="lx-inds">'
      +inds.map(t=>fld(esc(t.name)+' <small>'+esc(indLabel(t))+'</small>','<input type="text" data-ind="t'+t.n+'" value="'+esc(S.ind['t'+t.n]||'')+'" placeholder="ما رصدته">')).join('')
      +S.needs.map(i=>fld(esc(D.needs[i].t)+' <small>'+esc(D.needs[i].ind)+'</small>','<input type="text" data-ind="n'+i+'" value="'+esc(S.ind['n'+i]||'')+'" placeholder="ما رصدته">')).join('')+'</div>'
      :'<p class="lb-hint">اختر تقنيات وحاجات في «أصمّم» لتظهر مؤشراتها هنا.</p>')+'</section>'
    +'<section class="lb-card"><h3><i>٣</i>صوت المتعلم</h3><p class="lb-hint">بطاقة بلا اسم من ثلاثة أسئلة في آخر الحصة. اجمع البطاقات، ثم عُدّ كل جواب على الحقل الذي وقع فيه.</p>'
      +'<div class="lb-btns"><button type="button" class="btn ghost sm" data-act="pvoice">اطبع بطاقات صوت المتعلم</button></div>'
      +'<div class="lb-row">'+fld('عدد البطاقات المجموعة','<input type="number" inputmode="numeric" min="0" max="60" data-vn value="'+(S.voice.n||'')+'">')+'</div>'
      +'<div class="lx-tbl lx-v"><div class="lx-tr lx-th"><span>الحقل</span><span>'+VQ[0]+'</span><span>'+VQ[1]+'</span></div>'
      +S.segs.map((s,i)=>'<div class="lx-tr'+(i===S.peak?' pk':'')+'"><span>'+esc(s.n)+(i===S.peak?' <i>الذروة</i>':'')+'</span><span>'+tally('peak',i)+'</span><span>'+tally('lost',i)+'</span></div>').join('')+'</div>'
      +fld(VQ[2]+' <small>أبرز ما كتبوه، بلا أسماء</small>','<textarea data-vnext rows="2" placeholder="مثال: أحافظ على سنة مخالفة الطريق يوم العيد">'+esc(S.voice.next)+'</textarea>')+'</section>'
    +'<section class="lb-card"><h3><i>٤</i>روبرك جودة التجربة</h3><p class="lb-hint">يملؤه المعلم أو زميل زائر: قدّر كل بعد من ١ إلى ٤.</p><div class="lb-row">'+fld('من قدّر؟','<select data-k="by">'+opt('self','المعلم نفسه',S.by==='self')+opt('peer','زميل زائر',S.by==='peer')+'</select>')+'</div>'+RUB()+'</section>'
    +nextBtn('improve','إلى التحسين',1);
}

/* ---------- ٤ أحسّن ---------- */
function argmax(a){let m=0,j=-1;(a||[]).forEach((v,i)=>{if((+v||0)>m){m=+v;j=i}});return j}
function insights(l){
  l=l||S;const k='m'+l.mins,o=[],pk=argmax(l.voice.peak),ls=argmax(l.voice.lost),nm=i=>l.segs[i]?l.segs[i].n:'';
  l.segs.forEach((s,i)=>{const a=l.act[i];if(a==null||a==='')return;const d=Math.round((+a-(+s[k]||0))*10)/10;if(Math.abs(d)>=2)o.push({k:'time',t:'«'+s.n+'» '+(d>0?'زاد ':'نقص ')+arf(Math.abs(d))+' د عن المخطط'+(i===l.peak&&d<0?'، وهو حقل الذروة: نسخة الأربعين تحذف التكرار لا الذروة.':'.')})});
  if(pk>=0)o.push(pk===l.peak?{k:'peak',ok:true,t:'أقوى لحظة عند الطلبة وقعت في الذروة التي صمّمتها: «'+nm(pk)+'» ('+cardsN(l.voice.peak[pk])+').'}:{k:'peak',t:'أقوى لحظة عند الطلبة وقعت في «'+nm(pk)+'» ('+cardsN(l.voice.peak[pk])+')، والذروة المصمَّمة في «'+nm(l.peak)+'».'});
  if(ls>=0)o.push({k:'lost',t:'أكثر موضع تاه فيه الطلبة: «'+nm(ls)+'» ('+cardsN(l.voice.lost[ls])+(l.voice.n?' من '+ar(l.voice.n):'')+').'});
  if(l.rub.indexOf(0)<0){let i=0;l.rub.forEach((v,j)=>{if(v<l.rub[i])i=j});o.push({k:'rub',ok:l.rub[i]>=4,t:'جودة التجربة '+ar(rubTotal(l))+' من ٢٠'+(l.rub[i]>=4?'.':'؛ أضعف الأبعاد «'+D.rubric[i].dim+'»، ومستواه التالي: «'+D.rubric[i].lv[l.rub[i]]+'».')})}
  return o}
function family(){return DB.list.filter(l=>l.root===S.root).sort((a,b)=>a.cyc-b.cyc)}
function level(){
  /* شواهد من المختبر نفسه: دورة ثانية بُنيت على بيانات (باحث)، أو حصة من بناء المعلم شُغّلت أو قيست (مصمم)، أو مثال عُدّل أو شُغّل (مكيِّف) */
  const has=l=>l.runs.length>0||l.voice.n>0||l.rub.indexOf(0)<0;
  if(DB.list.some(l=>l.cyc>1&&DB.list.some(r=>r.root===l.root&&r.cyc<l.cyc&&has(r))))return 3;
  if(DB.list.some(l=>!l.src&&l.title.trim()&&l.techs.length>=3&&has(l)))return 2;
  if(DB.list.some(l=>l.techs.length||l.needs.length||has(l)))return 1;return 0}
function vImprove(){
  const ins=insights(),fam=family(),lv=level();
  return '<section class="lb-card"><h3><i>١</i>ما تقوله بيانات هذه الحصة</h3>'+(ins.length?'<ul class="lx-ins">'+ins.map(x=>'<li class="'+(x.ok?'ok':'')+'">'+esc(x.t)+'</li>').join('')+'</ul>':'<p class="lb-hint">لا بيانات بعد: شغّل الحصة، واجمع بطاقات صوت المتعلم، وقدّر الروبرك في «أقيس».</p>')
      +'<p class="lb-hint">هذه قراءة آلية للأعداد التي أدخلتها، لا حكم على الحصة: القرار لك. <span class="tag sug">مقترح</span></p></section>'
    +'<section class="lb-card"><h3><i>٢</i>قرار الدورة التالية</h3><p class="lb-hint">المعلم المصمم يختبر فرضية في صفه ثم يعدّل في دورة ثانية. '+ref(9)+'</p><div class="lb-row">'
      +fld('ما أُبقيه','<textarea data-plan="keep" rows="2" placeholder="ما نجح وأكرره كما هو">'+esc(S.plan.keep)+'</textarea>','w2')
      +fld('ما أغيّره','<textarea data-plan="change" rows="2" placeholder="تغيير واحد أو اثنان، لا أكثر">'+esc(S.plan.change)+'</textarea>','w2')+'</div><div class="lb-row">'
      +fld('أجرّبه في','<input type="text" data-plan="when" value="'+esc(S.plan.when)+'" placeholder="الشعبة أو الحصة التالية">','w2')+'</div>'
      +'<div class="lb-btns"><button type="button" class="btn accent sm" data-act="cycle">ابدأ الدورة '+ar(S.cyc+1)+' من هذه الحصة</button></div></section>'
    +'<section class="lb-card"><h3><i>٣</i>ملف الأداء</h3><p class="lb-hint">دورات هذه الحصة جنبًا إلى جنب: شاهد على التطوير يدخل ملف أدلة الأداء.</p><div class="lx-tbl lx-f"><div class="lx-tr lx-th"><span>الدورة</span><span>آخر تشغيل</span><span>جودة التجربة</span><span>أقوى لحظة</span><span>التغيير</span></div>'
      +fam.map(l=>{const pk=argmax(l.voice.peak),r=l.runs[l.runs.length-1];return '<div class="lx-tr'+(l.id===S.id?' pk':'')+'"><span data-l="الدورة">'+ar(l.cyc)+'</span><span data-l="آخر تشغيل">'+(r?esc(r.d):'—')+'</span><span data-l="جودة التجربة">'+(l.rub.indexOf(0)<0?ar(rubTotal(l))+' من ٢٠':'—')+'</span><span data-l="أقوى لحظة">'+(pk>=0?esc(l.segs[pk].n)+(pk===l.peak?' (الذروة)':''):'—')+'</span><span data-l="التغيير">'+(esc(l.plan.change)||'—')+'</span></div>'}).join('')+'</div>'
      +'<div class="lb-btns"><button type="button" class="btn ghost sm" data-act="pfile">اطبع ملف الأداء</button><button type="button" class="btn ghost sm" data-act="cfile">انسخ نصًّا</button><a class="btn ghost sm" href="../index.html#tk/proof" target="_blank" rel="noopener">ملف أدلة الأداء في الدليل '+ic('out')+'</a></div></section>'
    +'<section class="lb-card"><h3><i>٤</i>سلّم نضج «المعلم المصمم» <span class="tag sug">مقترح</span></h3><p class="lb-hint">موضعك التقريبي مما حُفظ في هذا المتصفح، لا تقويمًا رسميًّا. '+ref(9)+'</p><ol class="lx-lad">'
      +LADDER.map((x,i)=>'<li class="'+(i===lv?'on':i<lv?'done':'')+'"'+(i===lv?' aria-current="true"':'')+'><b>'+ar(i+1)+' '+x[0]+'</b><span>'+x[1]+'</span>'+(i===lv?'<em>موضعك التقريبي</em>':'')+'</li>').join('')+'</ol></section>';
}

/* ---------- الأوراق المطبوعة: لوحة التجربة، وبطاقات صوت المتعلم، وملف الأداء ---------- */
function techLine(x){const t=tech(x.n);return '<div class="tq"><b>'+esc(t.name)+'</b> <em>'+esc(t.basis)+'</em>'+(t.t?' · '+ar(techMin(t.n))+' د':'')+' · '+esc(t.modes[S.size==='m'?0:1])
  +'<br>'+(t.both?esc(t.both):'الضابط: '+esc(t.ctl)+' · المؤشر: '+esc(t.ind))+'</div>'}
const headText=()=>[SUBJ[S.subj],'الصف '+S.grade,S.title||'عنوان الدرس',S.period?'الحصة '+S.period:'',ar(S.mins)+' دقيقة','شعبة '+SIZE[S.size]].filter(Boolean).join(' · ');
const headLine=()=>esc(headText());
function sheet(){
  const k=mk(),dts=reviewDates(),out=S.techs.filter(x=>x.seg<0||x.seg>=S.segs.length||!tech(x.n).t),ex=S.exit.filter(x=>x.trim()),last=S.segs.length-1;
  const box=(h,b)=>'<div class="bx"><h5>'+h+'</h5>'+b+'</div>',dash='<span class="mt">—</span>';
  return '<div class="sh-top"><div><small>هندسة تجربة التعلّم'+(S.cyc>1?' · الدورة '+ar(S.cyc):'')+'</small><h2>لوحة تجربة الحصة</h2></div><p>'+headLine()+'</p></div>'
    +'<div class="lb-bar">'+bar()+'</div>'
    +'<table><thead><tr><th>حقل القالب</th><th>ما يجري، والتقنية بضابطها ومؤشرها</th><th>د</th></tr></thead><tbody>'
    +S.segs.map((s,i)=>'<tr'+(i===S.peak?' class="pk"':'')+'><th>'+esc(s.n)+(i===S.peak?'<i>الذروة</i>':'')+'</th><td>'+(esc(s.what)||dash)
      +S.techs.filter(x=>x.seg===i&&tech(x.n).t).map(techLine).join('')+'</td><td class="mn">'+((+s[k]||0)?ar(s[k]):esc(s.nt||'٠'))+'</td></tr>').join('')
    +'</tbody><tfoot><tr><th colspan="2">المجموع</th><td class="mn">'+ar(total())+'</td></tr></tfoot></table>'
    +(out.length?box('تقنيات خارج الحصة أو بلا حقل',out.map(techLine).join('')):'')
    +'<div class="sh-grid">'+box('ناتج الارتقاء · '+LV[S.riseLv],'<p>'+(esc(S.rise)||dash)+'</p>')
    +box('القيمة ومظهرها','<p>'+(esc(S.value)||dash)+(S.mazhar.trim()?' — '+esc(S.mazhar):'')+'</p>'+(S.value.trim()?'<p class="sm">تُستخرج في: '+esc(S.segs[Math.min(S.vseg,last)].n)+'</p>':''))
    +box('بطاقة الخروج والعهد',(ex.length?'<ol>'+ex.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>':'<p>'+dash+'</p>')+(S.pledge.trim()?'<p class="sm">العهد: '+esc(S.pledge)+'</p>':''))
    +box('المراجعة المتباعدة',dts.length?'<ul>'+dts.map(x=>'<li>'+esc(x.t)+'</li>').join('')+'</ul>':'<p>بعد يوم، فثلاثة أيام، فأسبوع، فشهر</p>')+'</div>'
    +(S.needs.length?box('قرارات التصميم ومؤشراتها','<ul>'+S.needs.map(i=>D.needs[i]).map(n=>'<li><b>'+esc(n.t)+':</b> '+esc(n.dec)+' — يُرصد: '+esc(n.ind)+'</li>').join('')+'</ul>'):'')
    +(S.rub.indexOf(0)<0?box('جودة التجربة · '+ar(rubTotal())+' من ٢٠','<p>'+D.rubric.map((d,i)=>esc(d.dim)+' '+ar(S.rub[i])).join(' · ')+'</p>'+(rubTarget()?'<p class="sm">'+esc(rubTarget())+'</p>':'')):'')
    +'<p class="sh-foot">'+esc(FORM.t)+': '+esc(FORM.eff)+'.</p>';
}
function voiceSheet(){
  const card='<div class="vc"><small>بطاقة بلا اسم</small>'+VQ.map(q=>'<p>'+q+'</p><i></i><i></i>').join('')+'</div>';
  return '<div class="sh-top"><div><small>هندسة تجربة التعلّم</small><h2>صوت المتعلم</h2></div><p>تُقص وتوزَّع في آخر الحصة، وتُجمع بلا أسماء.</p></div><div class="vcs">'+card+card+card+card+card+card+'</div>';
}
function fileSheet(){
  const fam=family(),box=(h,b)=>'<div class="bx"><h5>'+h+'</h5>'+b+'</div>';
  return '<div class="sh-top"><div><small>هندسة تجربة التعلّم</small><h2>ملف أداء: دورات الحصة</h2></div><p>'+headLine()+'</p></div>'
    +fam.map(l=>{const k='m'+l.mins,ins=insights(l),r=l.runs[l.runs.length-1],iv=Object.keys(l.ind).filter(x=>String(l.ind[x]).trim());
      return box('الدورة '+ar(l.cyc)+(r?' · '+esc(r.d):''),'<table><thead><tr><th>الحقل</th><th>المخطط</th><th>الفعلي</th><th>أقوى لحظة</th><th>أين تاهوا</th></tr></thead><tbody>'
        +l.segs.map((s,i)=>'<tr'+(i===l.peak?' class="pk"':'')+'><th>'+esc(s.n)+(i===l.peak?'<i>الذروة</i>':'')+'</th><td class="mn">'+ar(+s[k]||0)+'</td><td class="mn">'+(l.act[i]==null||l.act[i]===''?'—':arf(l.act[i]))+'</td><td class="mn">'+ar(l.voice.peak[i]||0)+'</td><td class="mn">'+ar(l.voice.lost[i]||0)+'</td></tr>').join('')+'</tbody></table>'
        +(iv.length?'<p class="sm"><b>المؤشرات:</b> '+iv.map(x=>{const t=x.charAt(0)==='t'?D.techs[+x.slice(1)-1]:null,n=x.charAt(0)==='n'?D.needs[+x.slice(1)]:null;return esc((t?t.name:n?n.t:x)+': '+l.ind[x])}).join(' · ')+'</p>':'')
        +(l.voice.next.trim()?'<p class="sm"><b>ماذا سيفعلون:</b> '+esc(l.voice.next)+'</p>':'')
        +(ins.length?'<ul>'+ins.map(x=>'<li>'+esc(x.t)+'</li>').join('')+'</ul>':'')
        +(l.plan.keep.trim()||l.plan.change.trim()?'<p><b>القرار:</b> '+(l.plan.keep.trim()?'أُبقي: '+esc(l.plan.keep)+'. ':'')+(l.plan.change.trim()?'أغيّر: '+esc(l.plan.change)+'. ':'')+(l.plan.when.trim()?'أجرّبه في: '+esc(l.plan.when)+'.':'')+'</p>':''))}).join('')
    +'<p class="sh-foot">الأعداد مجمَّعة بلا أسماء، وتُرصد لتحسين التصميم ولا تُحوَّل إلى درجات.</p>';
}
function fileText(){
  const L=['ملف أداء: دورات الحصة',headText(),''];
  family().forEach(l=>{const r=l.runs[l.runs.length-1];L.push('الدورة '+ar(l.cyc)+(r?' — '+r.d:''));insights(l).forEach(x=>L.push('   • '+x.t));
    if(l.voice.next.trim())L.push('   ماذا سيفعلون: '+l.voice.next.trim());if(l.plan.keep.trim())L.push('   أُبقي: '+l.plan.keep.trim());if(l.plan.change.trim())L.push('   أغيّر: '+l.plan.change.trim());if(l.plan.when.trim())L.push('   أجرّبه في: '+l.plan.when.trim());L.push('')});
  return L.join('\n');
}
function sheetText(){
  const k=mk(),L=[],dts=reviewDates(),tl=x=>{const t=tech(x.n);return '   • '+t.name+' ('+t.basis+')'+(t.t?' — '+ar(techMin(t.n))+' د':'')+' — '+(t.both||('الضابط: '+t.ctl+'؛ المؤشر: '+t.ind))};
  L.push('لوحة تجربة الحصة',[SUBJ[S.subj],'الصف '+S.grade,S.title,S.period?'الحصة '+S.period:'',ar(S.mins)+' دقيقة','شعبة '+SIZE[S.size]].filter(Boolean).join(' · '),'');
  S.segs.forEach((s,i)=>{L.push(s.n+(i===S.peak?' (الذروة)':'')+' — '+((+s[k]||0)?ar(s[k])+' د':(s.nt||'٠')));if(s.what.trim())L.push('   '+s.what.trim());S.techs.filter(x=>x.seg===i&&tech(x.n).t).forEach(x=>L.push(tl(x)))});
  const out=S.techs.filter(x=>x.seg<0||x.seg>=S.segs.length||!tech(x.n).t);if(out.length){L.push('','خارج الحصة أو بلا حقل:');out.forEach(x=>L.push(tl(x)))}
  L.push('','ناتج الارتقاء ('+LV[S.riseLv]+'): '+S.rise.trim(),'القيمة: '+S.value.trim()+(S.mazhar.trim()?' — المظهر: '+S.mazhar.trim():''));
  S.exit.filter(x=>x.trim()).forEach((x,i)=>L.push('سؤال الخروج '+ar(i+1)+': '+x.trim()));
  if(S.pledge.trim())L.push('العهد: '+S.pledge.trim());
  if(dts.length)L.push('المراجعة المتباعدة: '+dts.map(x=>x.t).join('، '));
  S.needs.forEach(i=>{const n=D.needs[i];L.push('قرار ('+n.t+'): '+n.dec+' — يُرصد: '+n.ind)});
  if(S.rub.indexOf(0)<0)L.push('جودة التجربة: '+ar(rubTotal())+' من ٢٠');
  return L.join('\n');
}
function printOut(html,title){
  const sh=$('#lbSheet',root),was=sh.hidden,old=sh.innerHTML,t0=document.title;sh.hidden=false;if(html!=null)sh.innerHTML=html;
  const back=()=>{window.removeEventListener('afterprint',back);document.title=t0;if(html!=null)sh.innerHTML=old;sh.hidden=was};
  window.addEventListener('afterprint',back);
  try{document.title=title;window.print()}catch(err){msg('الطباعة غير متاحة في هذه النافذة؛ افتح المختبر من موقع الدليل.');back()}
  setTimeout(()=>{if(document.title===title)back()},60000);
}
function copy(tx,ok){const no=()=>msg('تعذّر النسخ من هذه النافذة.');try{navigator.clipboard.writeText(tx).then(()=>msg(ok),no)}catch(err){no()}}

/* ---------- التحديث الخفيف بعد كل إدخال ---------- */
function refresh(){
  save();
  const b=$('#lbBar',root);if(b)b.innerHTML=bar();
  const cl=$('#lbChecks',root);
  if(cl){const cs=checks(),st={};cl.innerHTML=cs.map(c=>'<li class="'+(c.ok===true?'ok':c.ok===false?'bad':'soft')+'"><button type="button" data-act="goto" data-k="'+c.s+'">'+esc(c.t)+'</button></li>').join('');
    cs.forEach(x=>{const v=x.ok===true?2:x.ok===false?0:1;st[x.s]=st[x.s]==null?v:Math.min(st[x.s],v)});
    $$('[data-dot]',root).forEach(d=>{const v=st[+d.dataset.dot];d.className='lx-dot '+(v===2?'ok':v===0?'bad':'soft')})}
  const used=S.techs.reduce((a,t)=>a+techMin(t.n),0);
  const to=$('#techOut',root);if(to)to.textContent=S.techs.length?'المختار '+ar(S.techs.length)+'، ودقائقها داخل الحصة '+ar(used):'';
  const dts=reviewDates(),dOut=$('#dateOut',root);
  if(dOut)dOut.textContent=dts.length?dts.map(x=>'بعد '+ar(x.d)+(x.d===1?' يوم':x.d<11?' أيام':' يومًا')+': '+x.t).join(' · '):'اختر تاريخ الحصة تخرج مواعيد المراجعة: بعد يوم، فثلاثة أيام، فأسبوع، فشهر.';
  const r=$('#rubOut',root);if(r)r.textContent=S.rub.indexOf(0)>=0?'قدّر الأبعاد الخمسة ليظهر المجموع.':'المجموع '+ar(rubTotal())+' من ٢٠. '+rubTarget();
  const l=$('#limOut',root);if(l)l.textContent='روجع '+ar(S.lim.length)+' من '+ar(D.limits.length);
  const k=mk();$$('[data-df]',root).forEach(el=>{const i=+el.dataset.df,a=S.act[i];if(a==null||a===''){el.textContent='—';el.className='';return}const d=Math.round((+a-(+S.segs[i][k]||0))*10)/10;el.textContent=d>0?'زاد '+arf(d):d<0?'نقص '+arf(-d):'مطابق';el.className=Math.abs(d)>=2?'off':''});
  if(PH==='design')$('#lbSheet',root).innerHTML=sheet();
}

/* ---------- الأحداث ---------- */
function reindex(fn){S.peak=fn(S.peak,-1);S.vseg=Math.max(0,fn(S.vseg,0));S.techs.forEach(t=>{t.seg=fn(t.seg,-1)})}
function onInput(e){
  const t=e.target,d=t.dataset,chg=e.type==='change';
  if(t.id==='lbFile'){if(chg&&t.files[0])readFile(t.files[0]);return}
  if(d.k){
    if(d.k==='subj'){if(t.value!==S.subj){const keep={id:S.id,root:S.root,cyc:S.cyc,grade:S.grade,title:S.title,period:S.period,mins:S.mins,size:S.size},i=DB.list.indexOf(S);S=Object.assign(blank(t.value),keep);DB.list[i]=S}drawAll();return}
    if(d.k==='mins'){S.mins=+t.value;drawAll();return}
    if(d.k==='size'){S.size=t.value;draw(3);refresh();return}
    S[d.k]=(d.k==='riseLv'||d.k==='vseg')?+t.value:t.value;
    if((d.k==='title'||d.k==='period')&&chg)lessons();
  }else if(d.seg!=null){
    const s=S.segs[+d.seg];
    if(d.f==='m')s[mk()]=Math.max(0,Math.min(60,parseInt(lat(t.value),10)||0));else s[d.f]=t.value;
    if(d.f==='n'&&chg){draw(3);draw(5)}
  }else if(t.name==='peak'){S.peak=+t.value}
  else if(d.tech){const n=+d.tech,i=S.techs.findIndex(x=>x.n===n);if(t.checked&&i<0)S.techs.push({n:n,seg:-1});if(!t.checked&&i>=0)S.techs.splice(i,1);draw(3)}
  else if(d.tseg){const x=S.techs.find(x=>x.n===+d.tseg);if(x)x.seg=+t.value}
  else if(d.need!=null||d.lim!=null){const a=d.need!=null?S.needs:S.lim,v=+(d.need!=null?d.need:d.lim),i=a.indexOf(v);if(t.checked&&i<0)a.push(v);if(!t.checked&&i>=0)a.splice(i,1);a.sort((x,y)=>x-y)}
  else if(d.exit!=null){S.exit[+d.exit]=t.value}
  else if(/^rub\d$/.test(t.name||'')){S.rub[+t.name.slice(3)]=+t.value}
  else if(d.actseg!=null){const v=lat(t.value).replace(',','.');S.act[+d.actseg]=v===''?'':Math.max(0,Math.min(90,parseFloat(v)||0))}
  else if(d.ind){S.ind[d.ind]=t.value}
  else if(d.vn!=null){S.voice.n=Math.max(0,Math.min(60,parseInt(lat(t.value),10)||0))}
  else if(d.vnext!=null){S.voice.next=t.value}
  else if(d.plan){S.plan[d.plan]=t.value}
  else return;
  refresh();
}
function onClick(e){
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
  if(a==='step'||a==='goto'){const k=+b.dataset.k;OPEN=a==='step'&&OPEN===k?0:k;$$('.lx-step',root).forEach(s=>{const o=+s.dataset.step===OPEN;s.classList.toggle('open',o);$('.lx-stb',s).hidden=!o;$('.lx-sth',s).setAttribute('aria-expanded',String(o))});refresh();
    if(a==='goto'){const el=$('[data-step="'+k+'"]',root);if(el){const y=el.getBoundingClientRect().top+window.pageYOffset-76;window.scrollTo({top:y,behavior:'smooth'})}}}
  else if(a==='pick'){pick(b.dataset.id);save();drawAll()}
  else if(a==='preset'){addLesson(fromPreset(D.presets.find(p=>p.id===b.dataset.id),true));OPEN=2;save();if(PH!=='design')location.hash='#lab';drawAll();msg('حُمّل المثال حصةً جديدة؛ عدّله على درسك.')}
  else if(a==='new'){if(!isBlank(S))addLesson(blank(S.subj));OPEN=1;save();if(PH!=='design')location.hash='#lab';drawAll();msg('حصة جديدة فارغة: ابدأ ببياناتها.')}
  else if(a==='del'){if(DB.list.length<2||!window.confirm('تُحذف هذه الحصة وقياساتها من هذا المتصفح. أتحذفها؟'))return;DB.list=DB.list.filter(x=>x!==S);pick(DB.list[0].id);save();drawAll()}
  else if(a==='addseg'){const at=S.segs.length-1,n=S.segs.filter(s=>/^المحور/.test(s.n)).length;S.segs.splice(at,0,{n:'المحور '+(ORD[n]||ar(n+1)),what:'',m40:0,m45:0,nt:''});reindex((v,x)=>v>=at?v+1:v);[S.act,S.voice.peak,S.voice.lost].forEach(arr=>{if(arr.length>at)arr.splice(at,0,arr===S.act?'':0)});body()}
  else if(a==='delseg'){const i=+b.dataset.i;S.segs.splice(i,1);reindex((v,x)=>v===i?x:v>i?v-1:v);[S.act,S.voice.peak,S.voice.lost].forEach(arr=>{if(arr.length>i)arr.splice(i,1)});body()}
  else if(a==='show'){$('#lbSheet',root).scrollIntoView({behavior:'smooth',block:'start'})}
  else if(a==='print'){printOut(null,'لوحة تجربة الحصة'+(S.title?' — '+S.title:''))}
  else if(a==='pvoice'){printOut(voiceSheet(),'بطاقات صوت المتعلم')}
  else if(a==='pfile'){printOut(fileSheet(),'ملف أداء'+(S.title?' — '+S.title:''))}
  else if(a==='copy'){copy(sheetText(),'نُسخ نص اللوحة.')}
  else if(a==='cfile'){copy(fileText(),'نُسخ نص ملف الأداء.')}
  else if(a==='export'){try{const u=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'})),l=document.createElement('a');l.href=u;l.download='لوحة-تجربة-الحصة.json';document.body.appendChild(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);msg('صُدّر ملف الحصة.')}catch(err){msg('تعذّر التصدير من هذه النافذة.')}}
  else if(a==='import'){$('#lbFile',root).click()}
  else if(a==='run'){runStart()}
  else if(a==='tal'){const arr=S.voice[b.dataset.kind],i=+b.dataset.i;arr[i]=Math.max(0,(arr[i]||0)+(+b.dataset.d));b.parentNode.querySelector('b').textContent=ar(arr[i]);save()}
  else if(a==='cycle'){const l=JSON.parse(JSON.stringify(S));l.id=uid();l.cyc=S.cyc+1;l.root=S.root;l.at=Date.now();l.runs=[];l.act=[];l.ind={};l.voice={n:0,peak:[],lost:[],next:''};l.rub=[0,0,0,0,0];l.plan={keep:'',change:'',when:''};l.date='';l.src='';
    DB.list.push(l);pick(l.id);OPEN=2;save();location.hash='#lab';drawAll();msg('هذه الدورة '+ar(l.cyc)+': اللوحة نفسها بلا قياسات. عدّل ما قررت تغييره ثم شغّلها.')}
}
function readFile(f){const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!valid(s))throw 0;const l=fill(Object.assign(blank(s.subj),s));if(DB.list.some(x=>x.id===l.id)){l.id=uid();l.root=l.id}addLesson(l);save();drawAll();msg('استُوردت الحصة.')}catch(err){msg('الملف ليس حصة صالحة من هذا المختبر.')}};r.readAsText(f)}

/* ---------- المسار: #lab و #lab/run و #lab/measure و #lab/improve للمختبر، و#guide أو معرّف قسم للدليل ---------- */
function route(){
  const h=location.hash.slice(1),g=h==='guide'||/^lx-/.test(h),v=g?'guide':'lab',ph=(h.split('/')[1]||'design');
  document.documentElement.setAttribute('data-view',v);
  root.hidden=g;$('#guideView').hidden=!g;
  $$('.lb-nav a[data-view]').forEach(a=>{const on=a.dataset.view===v;a.classList.toggle('on',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});
  if(g){if(/^lx-/.test(h)){const el=document.getElementById(h);if(el)el.scrollIntoView({behavior:'instant',block:'start'})}else window.scrollTo({top:0,behavior:'instant'})}
  else{const np=PHASES.some(p=>p[0]===ph)?ph:'design';if(np!==PH){PH=np;body();if(window.BX_SYNC)window.BX_SYNC();toBody()}}
  if(window.BX_SYNC)window.BX_SYNC();
}
DB=loadDB();pick(DB.cur);
{const h=location.hash.slice(1).split('/');if(h[0]==='lab'&&PHASES.some(p=>p[0]===h[1]))PH=h[1]}
root.addEventListener('input',onInput);root.addEventListener('change',onInput);root.addEventListener('click',onClick);
shell();drawAll();window.addEventListener('hashchange',route);route();
})();
