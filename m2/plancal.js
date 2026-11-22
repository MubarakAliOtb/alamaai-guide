/* ===== نموذج 2: خطة توزيع الدروس بنمط التقويم (أسابيع الفصل الأول في أشهرها، والدروس بألوان مجالاتها) ===== */
const NB_PC_DOM={ع:'#4D7CFE',ف:'#2EC4A0',ح:'#FFC93C',س:'#FF7A5C',ت:'#FF8FCF',ث:'#B9A6FF',ل:'#5CC8FF',م:'#E6DCC8'};
const NB_PC_MON=[['سبتمبر','#FFC93C',[0,1,2]],['أكتوبر','#5CC8FF',[3,4,5,6]],['نوفمبر','#2EC4A0',[7,8,9,10,11]],['ديسمبر','#FF7A5C',[12]]];
function nbPlanCal(o,kind){const g=o.g,isI=kind==='i',W=isI?nbWeekI(g):nbWeekQ(g).map(x=>[x]),DN=isI?NB_DI:NB_DQ,used=new Set();
 const cell=x=>{used.add(x.d);const meta=[];if(isI){if(x.of>1)meta.push(`${x.j} من ${x.of}`);if(x.p)meta.push('ص '+x.p);if(x.h)meta.push('الحديث: '+nbE(x.h))}else{if(x.part)meta.push('الجزء '+x.part);if(x.s)meta.push(x.s);if(x.p)meta.push('ص '+x.p)}
  return `<div class="pc-l" style="background:${NB_PC_DOM[x.d]||'#E6DCC8'}"><small>${DN[x.d]||''}${x.u?' · الوحدة '+NB_UN[x.u]:''}</small><b>${nbE(nbLsn(x))}</b>${meta.length?`<em>${meta.join(' · ')}</em>`:''}${!isI&&x.s&&x.d==='ح'?'<i class="pc-hz">حفظ</i>':''}</div>`};
 let rows='';NB_PC_MON.forEach(([mn,mc,ws])=>{rows+=`<div class="pc-mo"><span style="background:${mc}">${mn}</span><i></i></div>`;
  ws.forEach(w=>{rows+=`<div class="pc-row"><div class="pc-wk"><b>الأسبوع ${w+1}</b><small>${NB_WD[w]}</small></div><div class="pc-ls">${(W[w]||[]).map(cell).join('')}</div><div class="pc-x"><small>التنفيذ</small>${nbF(`${isI?'pi':'pq'}.${g}.${w}.cal`,'…')}</div></div>`})});
 const leg=Object.keys(DN).filter(k=>used.has(k)&&k!=='م').map(k=>`<span><i style="background:${NB_PC_DOM[k]}"></i>${DN[k]}</span>`).join('');
 const T=isI?'خطة منهج التربية الإسلامية':'خطة منهج القرآن الكريم',S=isI?'الفصل الدراسي الأول · 26 حصة (حصتان أسبوعيًا)':'الفصل الدراسي الأول · 13 حصة (حصة أسبوعيًا)';
 return `<div class="pc-top" style="background:${isI?'#4D7CFE':'#2EC4A0'}"><div class="pc-txt"><span class="cal-yr">${nbGS(g)}</span><h2 class="pc-mn">${T}</h2><p class="cal-sub">${S}</p></div>${nbCalArt(isI?'book':'mushaf')}</div>
 <div class="cal-leg pc-leg">${leg}</div><div class="pc-b">${rows}</div>
 <p class="nb-ref">المجموع الكلي لعدد الحصص في الفصل الدراسي الأول للعام الدراسي ${nbE(NB.t.year)}: ${isI?26:13} حصة. <b>معتمدة من إدارة التوجيه الفني للتربية الإسلامية بتاريخ ${NB_APPR[isI?'i':'q'][g]}.</b> خطة توزيع المنهج قابلة للتعديل بحسب المستجدات والعطل والإجازات الرسمية، ولا يُضاف إليها أو يُلغى منها إلا بالرجوع إلى الإدارة العامة للتوجيه والبحوث والمناهج.</p>`}
/* (يُضاف الغلاف بعد تعريف NB_R.planQ في الصفحة) */
