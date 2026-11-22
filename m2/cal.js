/* ===== نموذج 2: «خريطة العام الدراسي» رزنامةً شهرية (عشر صفحات من سبتمبر إلى يونيو) ===== */
const NB_CAL_TY={start:['#EDE9FE','بداية'],exam:['#C4B5FD','امتحانات'],hol:['#A7F3D0','إجازة'],comp:['#DDD6FE','مسابقات'],nat:['#D1FAE5','عطلة رسمية'],res:['#D4D1E6','نتائج']};
const NB_CAL_EV=[['2026-09-06','2026-09-06','بدء دوام العاملين','start'],['2026-09-14','2026-09-14','بدء دوام المتعلمين','start'],
 ['2026-10-18','2026-10-22','تلاوة القرآن: التصفيات الأولية','comp'],['2026-11-22','2026-11-30','حفظ الحديث: التصفيات الأولية','comp'],
 ['2026-12-20','2026-12-28','امتحان نهاية الفصل الأول','exam'],['2027-01-24','2027-02-04','إجازة منتصف العام','hol'],
 ['2027-02-07','2027-02-07','بدء الفصل الثاني · اجتماع أولياء الأمور الثاني','start'],['2027-02-25','2027-02-25','العيد الوطني','nat'],['2027-02-26','2027-02-26','عيد التحرير','nat'],
 ['2027-03-01','2027-03-08','إجازة خاصة (آخر رمضان)','hol'],['2027-03-21','2027-03-25','نهائيات التلاوة','comp'],['2027-04-04','2027-04-08','تصفيات حفظ القرآن','comp'],
 ['2027-04-18','2027-04-22','نهائيات الحديث','comp'],['2027-04-25','2027-04-29','نهائيات حفظ القرآن','comp'],['2027-05-23','2027-05-31','امتحان نهاية الفصل الثاني','exam'],
 ['2027-06-02','2027-06-03','استخراج النتائج وبطاقات الدرجات','res'],['2027-06-20','2027-06-27','امتحان الدور الثاني','exam']];
const NB_CAL_M=[
 {n:'سبتمبر',y:2026,m:8,c:'#F5F3FF',a:'school',sub:'الفصل الدراسي الأول · بداية العام',v:['تقدير العلم والعلماء','الإيمان بالكتب السماوية (منزلة القرآن الكريم) · أسباب نزول القرآن الكريم'],
  no:['بداية العام: اللقاء التنويري لأولياء أمور المستجدين (ص119)']},
 {n:'أكتوبر',y:2026,m:9,c:'#F5F3FF',a:'book',sub:'الفصل الدراسي الأول',v:['تقدير العلم والعلماء','الإيمان بالكتب السماوية · أسباب نزول القرآن الكريم'],
  no:['شهر من البداية: لا قيد لمتعلم جديد بعده (م21)','الأسبوع 6: نهاية القسم الأول من الأعمال: رصد في سجل الطالب، وتقرير «سهل»، واجتماع أولياء الأمور الأول (ص116، 119)']},
 {n:'نوفمبر',y:2026,m:10,c:'#F5F3FF',a:'bulb',sub:'الفصل الدراسي الأول',v:['الصحبة الصالحة','الهجرة النبوية: صحبة أبي بكر الصديق رضي الله عنه'],no:[]},
 {n:'ديسمبر',y:2026,m:11,c:'#F5F3FF',a:'exam',sub:'الفصل الدراسي الأول · الامتحانات',v:['العمل التطوعي','صلاة التطوع: من نافلة العبادة إلى نافلة الخدمة · خلق الأمانة'],
  no:['قبل الامتحانات: إدخال الدرجات ومراجعتها واعتمادها (ص64)','خارج الجدول: اختبار القرآن الكريم الشفوي، والشفهي يسبق التحريري (ص115، 121)']},
 {n:'يناير',y:2027,m:0,c:'#F5F3FF',a:'tent',sub:'نتائج الفصل الأول · إجازة منتصف العام',v:['الولاء للوطن',''],
  no:['بعد اعتماد النتيجة: إخطار ولي الأمر خلال أسبوعين إذا قلّت النسبة عن 90% أو الإثراء عن 75، وخطة رعاية علاجية (م40)','نهاية الفصل: رصد درجة الإنجاز في الأنشطة (م35)، والتقرير الفصلي للمكتب (م65)']},
 {n:'فبراير',y:2027,m:1,c:'#F5F3FF',a:'kuwait',sub:'الفصل الدراسي الثاني',v:['الولاء للوطن',''],no:['الفصل الثاني: فتح باب الترشيح للقبول عبر منصة موهوب (م17)']},
 {n:'مارس',y:2027,m:2,c:'#F5F3FF',a:'lantern',sub:'الفصل الدراسي الثاني',v:['بر الوالدين وصلة الرحم · التسامح والعفو',''],
  no:['الأسبوع 6: نهاية القسم الأول من أعمال الفصل الثاني، واجتماع أولياء الأمور الثالث (ص119)','جائزة عبدالله المطوع رحمه الله لحفظ القرآن الكريم للمعلمين: في الفصل الثاني مساءً']},
 {n:'أبريل',y:2027,m:3,c:'#F5F3FF',a:'trophy',sub:'الفصل الدراسي الثاني · النهائيات',v:['المحافظة على الممتلكات العامة · ترشيد الاستهلاك',''],no:[]},
 {n:'مايو',y:2027,m:4,c:'#F5F3FF',a:'kite',sub:'الفصل الدراسي الثاني · الامتحانات',v:['احترام القوانين · محاربة الغش',''],no:[]},
 {n:'يونيو',y:2027,m:5,c:'#F5F3FF',a:'sun',sub:'النتائج والدور الثاني',v:['',''],
  no:['قبل العطلة: البتّ في استمرار القيد، وقرار الاستبعاد قبل العطلة الصيفية (م40، 41)','1/7: بدء العطلة الصيفية للهيئة التعليمية بنهاية الدوام']}];
const NB_CAL_W1=new Date(2026,8,13); /* الأسبوع الأول من خطة التوزيع (الأحد)، ثلاثة عشر أسبوعًا حتى 6 ديسمبر */
function nbCalArt(a){const K='stroke="#6D28D9" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
 const sp=(x,y,s,c)=>`<path d="M${x} ${y-s}C${x+s*.18} ${y-s*.18} ${x+s*.18} ${y-s*.18} ${x+s} ${y}C${x+s*.18} ${y+s*.18} ${x+s*.18} ${y+s*.18} ${x} ${y+s}C${x-s*.18} ${y+s*.18} ${x-s*.18} ${y+s*.18} ${x-s} ${y}C${x-s*.18} ${y-s*.18} ${x-s*.18} ${y-s*.18} ${x} ${y-s}Z" fill="${c}" ${K}/>`;
 const deco='';
 const A={
  school:`<rect x="120" y="48" width="78" height="92" rx="20" fill="#DDD6FE" ${K}/><path d="M120 80h78M146 48v-10a8 8 0 0 1 8-8h10a8 8 0 0 1 8 8v10" ${K} fill="none"/><rect x="138" y="96" width="42" height="30" rx="8" fill="#FFFFFF" ${K}/><g transform="rotate(-30 230 95)"><rect x="222" y="40" width="18" height="96" rx="3" fill="#A7F3D0" ${K}/><path d="M222 136l9 18 9-18z" fill="#FFFFFF" ${K}/><rect x="222" y="40" width="18" height="12" fill="#C4B5FD" ${K}/></g>`,
  book:`<path d="M150 58c-22-10-46-10-66-2v84c20-8 44-8 66 2z" fill="#fff" ${K}/><path d="M150 58c22-10 46-10 66-2v84c-20-8-44-8-66 2z" fill="#fff" ${K}/><path d="M98 76c14-4 28-4 40 0M98 94c14-4 28-4 40 0M162 76c12-4 26-4 40 0M162 94c12-4 26-4 40 0" ${K} fill="none"/>`+sp(150,34,14,'#A7F3D0'),
  bulb:`<circle cx="160" cy="76" r="34" fill="#A7F3D0" ${K}/><rect x="146" y="108" width="28" height="22" rx="5" fill="#fff" ${K}/><path d="M150 118h20M160 30v-12M118 46l-9-9M202 46l9-9M112 82H98M208 82h14" ${K} fill="none"/><path d="M152 92l8-12 8 12" ${K} fill="none"/>`,
  exam:`<rect x="104" y="36" width="76" height="104" rx="8" fill="#fff" ${K}/><path d="M118 60h48M118 78h48M118 96h30" ${K} fill="none"/><circle cx="160" cy="118" r="14" fill="#34D399" ${K}/><path d="M153 118l5 5 9-10" ${K} fill="none"/><circle cx="222" cy="92" r="30" fill="#FFFFFF" ${K}/><path d="M222 74v18l12 8" ${K} fill="none"/>`,
  tent:`<path d="M90 140l60-96 60 96z" fill="#C4B5FD" ${K}/><path d="M150 44v96M132 140l18-34 18 34" ${K} fill="#FFFFFF"/><path d="M234 40a22 22 0 1 0 14 38 18 18 0 1 1-14-38z" fill="#A7F3D0" ${K}/>`+sp(200,30,7,'#fff')+sp(268,88,6,'#fff'),
  kuwait:`<path d="M96 40v104" ${K} fill="none"/><path d="M96 44h120v66H96z" fill="#fff" ${K}/><path d="M96 44h120v22H122z" fill="#007A3D" stroke="none"/><path d="M96 88h120v22H96z" fill="#CE1126" stroke="none"/><path d="M96 44l26 22v22l-26 22z" fill="#111111" stroke="none"/><path d="M96 44h120v66H96z" fill="none" ${K}/><path d="M240 144V60" ${K} fill="none"/><circle cx="240" cy="70" r="16" fill="#DDD6FE" ${K}/><circle cx="240" cy="104" r="9" fill="#DDD6FE" ${K}/><path d="M240 40v14" ${K} fill="none"/>`,
  lantern:`<path d="M160 22v12" ${K} fill="none"/><path d="M140 46h40l-6-12h-28z" fill="#A7F3D0" ${K}/><path d="M136 46h48l10 46-10 40h-48l-10-40z" fill="#A7F3D0" ${K}/><path d="M146 58h28l6 34-6 30h-28l-6-30z" fill="#FFFFFF" ${K}/><path d="M140 132h40l-8 12h-24z" fill="#A7F3D0" ${K}/><path d="M236 40a24 24 0 1 0 16 42 20 20 0 1 1-16-42z" fill="#fff" ${K}/>`,
  trophy:`<path d="M126 40h68v34a34 34 0 0 1-68 0z" fill="#A7F3D0" ${K}/><path d="M126 50h-16a16 16 0 0 0 18 26M194 50h16a16 16 0 0 1-18 26M160 108v16M138 140h44" ${K} fill="none"/><rect x="146" y="124" width="28" height="12" rx="3" fill="#fff" ${K}/><circle cx="236" cy="104" r="10" fill="#34D399" ${K}/><path d="M236 114v30" ${K} fill="none"/>`,
  kite:`<path d="M168 26l38 46-38 46-38-46z" fill="#C4B5FD" ${K}/><path d="M168 26v92M130 72h76" ${K} fill="none"/><path d="M168 118c-6 10 6 16 0 26" ${K} fill="none"/><g transform="rotate(30 238 96)"><rect x="230" y="50" width="16" height="80" rx="3" fill="#A7F3D0" ${K}/><path d="M230 130l8 16 8-16z" fill="#FFFFFF" ${K}/></g>`,
  mushaf:`<path d="M108 146l84-58M192 146l-84-58" ${K} fill="none"/><path d="M100 146h28M172 146h28" ${K} fill="none"/><path d="M150 92c-20-12-44-12-62-4V40c18-8 42-8 62 4z" fill="#fff" ${K}/><path d="M150 92c20-12 44-12 62-4V40c-18-8-42-8-62 4z" fill="#fff" ${K}/><path d="M102 56c12-4 24-4 36 0M102 70c12-4 24-4 36 0M162 56c12-4 24-4 36 0M162 70c12-4 24-4 36 0" ${K} fill="none"/>`+sp(232,40,10,'#A7F3D0'),
  sun:`<circle cx="150" cy="70" r="30" fill="#A7F3D0" ${K}/><path d="M150 26v-10M150 124v10M106 70H94M206 70h12M119 39l-8-8M181 39l8-8M119 101l-8 8M181 101l8 8" ${K} fill="none"/><path d="M196 118a44 30 0 0 1 88 0z" fill="#C4B5FD" ${K}/><path d="M240 118v28" ${K} fill="none"/>`};
 return `<svg class="cal-art" viewBox="0 0 300 170" aria-hidden="true">${deco}${A[a]||''}</svg>`}
function nbCalDay(d){const z=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}`}
NB_R.cal=o=>{const M=NB_CAL_M[o.m],first=new Date(M.y,M.m,1),days=new Date(M.y,M.m+1,0).getDate(),off=first.getDay(),rows=Math.ceil((off+days)/7);
 const evOf=s=>NB_CAL_EV.find(e=>s>=e[0]&&s<=e[1]);const used=new Set();let cells='';
 for(let i=0;i<rows*7;i++){const dn=i-off+1;if(dn<1||dn>days){cells+='<div class="cal-d out"></div>';continue}
  const dt=new Date(M.y,M.m,dn),s=nbCalDay(dt),wd=dt.getDay(),we=wd===5||wd===6,e=evOf(s);
  const skip=e&&e[3]==='exam'&&we;const show=e&&!skip&&(s===e[0]||dn===1||wd===0||(i%7===0));if(e&&!skip)used.add(e[3]);
  let wk='';if(wd===0){const n=Math.round((dt-NB_CAL_W1)/604800000)+1;if(n>=1&&n<=13)wk=`<i class="cal-wk">الأسبوع ${n}</i>`}
  cells+=`<div class="cal-d${we?' we':''}${e&&!skip?' ev':''}"${e&&!skip?` style="background:${NB_CAL_TY[e[3]][0]}"`:''}><b>${dn}</b>${wk}${show?`<span>${nbE(e[2])}</span>`:''}</div>`}
 const no=M.no.concat(['كل شهر: اجتماع لجنة رعاية الموهوبين مرة على الأقل (م53)']);
 const leg=Object.keys(NB_CAL_TY).filter(k=>used.has(k)).map(k=>`<span><i style="background:${NB_CAL_TY[k][0]}"></i>${NB_CAL_TY[k][1]}</span>`).join('');
 return `<div class="cal-top" style="background:${M.c}"><div class="cal-txt"><span class="cal-yr">${M.y}</span><h2 class="cal-mn">${M.n}</h2><p class="cal-sub">${M.sub}</p></div>${nbCalArt(M.a)}</div>
 <div class="cal-wd">${['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'].map(x=>`<span>${x}</span>`).join('')}</div>
 <div class="cal-g" style="grid-auto-rows:${rows>5?16.5:19.5}mm">${cells}</div>
 ${leg?`<div class="cal-leg">${leg}<span class="cal-leg-we"><i></i>عطلة نهاية الأسبوع</span></div>`:''}
 <div class="cal-ft"><div class="cal-box cal-v"><h4>قيمة الشهر</h4>${M.v[0]?`<p class="cal-val">${M.v[0]}</p>${M.v[1]?`<p>${M.v[1]}</p>`:''}`:'<p>اختر قيمة تختم بها العام مع طلابك.</p>'}</div>
 <div class="cal-box"><h4>مواعيد هذا الشهر بلا يوم محدد</h4><ul class="nb-ul">${no.map(x=>`<li>${x}</li>`).join('')}</ul></div>
 <div class="cal-box"><h4>ملاحظاتي</h4><div class="nb-lines">${nbRows(4,i=>nbB('cal.'+o.m+'.'+i,'…'))}</div></div></div>`};
