/* ---------- قوالب جديدة (v132): تسعة أشكال تحمل معناها في هيئتها ----------
   تُضاف إلى TPL بالواجهة نفسها (n، ic، need، when، why، f، draw)، فتعمل في النماذج والمُنشئ والمختبر والاستوديو وشاشة الحصة بلا تعديل فيها.
   الرسم على لوحة عرضها 1200: المحتوى بين x=60 و x=1140، ومن y0 إلى B. القراءة من اليمين. s.G(k) مجموعة الكشف المتدرج.
   معها جداول المختبر: LANS (ما يُخفى في نسخة الطالب)، LPT (أين توضع النقاط)، ELAB (نشاط التفصيل)، و NEEDS (أي حاجة يخدمها القالب). */
var FL=[34,31,28,25,23,21,19,17];
TPL.ladder={n:'السلّم',ic:'flag',need:['parts','order'],when:'حين يرتقي المتعلم درجة بعد درجة: مراتب، أو مستويات إتقان، أو خطوات تدبّر.',why:'الصعود يُرى قبل أن يُقرأ: الموضع الأعلى يقول «هذا أرقى»، فيحمل الشكل الترتيب عن الذاكرة.',
 f:[['items','الدرجات من الأولى إلى الأعلى','p2',6,['الدرجة','شرح قصير (اختياري)']]],
 draw:function(s,d,y0,B){var p=s.p,it=(d.items||[]).slice(0,6),n=Math.max(it.length,1),sw=1080/n,head=Math.min(128,(B-y0)*.24),sh=(B-y0-head)/n,u=vU(s);
  it.forEach(function(r,i){s.G(i+1);var x=1140-(i+1)*sw,top=B-(i+1)*sh,cx=x+sw/2;
   s.rect(x+5,top,sw-10,B-top,vT(s,i),14);s.rect(x+5,top,sw-10,16,vC(s,i),8);
   s.circ(x+sw-34,top+8,24*u,p.bg,vC(s,i),5);s.box(vn(s,i+1),x+sw-34,top+8,40*u,40*u,[Math.round(26*u)],{w:700});
   s.box(r[0],cx-10,top-head/2+4,sw-66,head-16,[38,34,30,27,24,21,19,17],{w:700});
   if(r[1])s.box(r[1],cx,top+16+(B-top-16)/2,sw-30,Math.min(B-top-28,sh*2.2),[28,26,24,22,20,18,16,15],{lh:1.4})})}};
TPL.balance={n:'الميزان',ic:'contrast',need:['decide','diff'],when:'حين يوازن الدرس بين أمرين: محمود ومذموم، أو خياران في معضلة.',why:'الكفتان تضعان الطرفين أمام العين معًا، فتصير الموازنة مقارنة تُرى لا فقرتين تُحفظان.',
 f:[['a','الكفة الأولى','t'],['la','ما في الكفة الأولى','l',4],['b','الكفة الثانية','t'],['lb','ما في الكفة الثانية','l',4],['verdict','الترجيح أو القرار (اختياري)','t']],
 draw:function(s,d,y0,B){var p=s.p,by=y0+26,pt=y0+92,vh=d.verdict?112:0,ph=B-pt-vh-(vh?26:0),w=470;
  s.line(325,by,875,by,p.ink,8);s.line(600,by-18,600,B-(vh?vh:0),p.ink,8);s.circ(600,by,16,p.c[0]);
  [[875,640,d.a,d.la,0],[325,90,d.b,d.lb,1]].forEach(function(q){var cx=q[0],x=q[1],i=q[4],ls=(q[3]||[]).slice(0,4);
   s.G(0);s.line(cx,by,cx-150,pt,p.ln,5);s.line(cx,by,cx+150,pt,p.ln,5);
   s.rect(x,pt,w,ph,p.pan,28);s.rect(x,pt,w,78,vC(s,i),28);s.box(q[2]||'',x+w/2,pt+39,w-36,66,[40,36,32,28,25,22],{w:700,f:vON(s,i)});
   s.G(i+1);if(ls.length)s.box(ls.join('\n'),x+w/2,pt+78+(ph-78)/2,w-44,ph-102,[34,31,28,26,24,22,20,18],{lh:1.65})});
  if(d.verdict){s.G(3);s.rect(250,B-vh,700,vh,p.c[3],28);s.box(d.verdict,600,B-vh/2,650,vh-18,[36,33,30,27,24,22,20],{w:700,f:p.on[3]})}}};
TPL.iceberg={n:'جبل الجليد',ic:'layers',need:['parts','cause'],when:'حين يكون للظاهر باطن يحمله: سلوك وراءه دافع، أو عمل ظاهر وعمل قلبي.',why:'ما فوق الماء قليل وما تحته أكبر: الشكل نفسه يقول إن الخفي هو الأصل، قبل أي شرح.',
 f:[['a','عنوان ما يظهر','t'],['la','ما يظهر','l',4],['b','عنوان ما يخفى','t'],['lb','ما يخفى','l',5]],
 draw:function(s,d,y0,B){var p=s.p,H=B-y0,yw=y0+H*.38,cx=850,la=(d.la||[]).slice(0,4),lb=(d.lb||[]).slice(0,5);
  s.path('M'+cx+' '+vR(y0+6)+'L'+(cx+178)+' '+vR(yw)+'L'+(cx-178)+' '+vR(yw)+'Z',p.t[0],p.c[0],5);
  s.path('M'+(cx-178)+' '+vR(yw)+'L'+(cx+178)+' '+vR(yw)+'L'+(cx+286)+' '+vR(yw+(B-yw)*.5)+'L'+(cx+130)+' '+vR(B)+'L'+(cx-190)+' '+vR(B)+'L'+(cx-300)+' '+vR(yw+(B-yw)*.46)+'Z',p.c[3]);
  s.line(60,yw,1140,yw,p.c[1],6,'18 12');
  s.box(d.a||'',cx,yw-52,250,84,[34,30,27,24,21,19],{w:700});
  s.box(d.b||'',cx,yw+(B-yw)*.46,420,(B-yw)*.5,[44,40,36,32,28,24],{w:700,f:p.on[3]});
  s.G(1);if(la.length){s.line(cx-190,(y0+yw)/2+16,540,(y0+yw)/2+16,p.ln,5);s.circ(540,(y0+yw)/2+16,7,p.ln);s.box(la.join('\n'),520,(y0+yw)/2+10,460,yw-y0-26,FL,{a:'s',lh:1.6})}
  s.G(2);if(lb.length){s.line(cx-312,(yw+B)/2,500,(yw+B)/2,p.ln,5);s.circ(500,(yw+B)/2,7,p.ln);s.box(lb.join('\n'),480,(yw+B)/2,420,B-yw-34,[36,33,30,27,25,23,21,19],{a:'s',lh:1.65,w:700})}}};
TPL.roots={n:'الجذور والثمار',ic:'bulb',need:['cause','parts'],when:'حين تسأل: على ماذا يقوم هذا؟ وماذا يثمر؟ أدلة وآثار، أو أسباب ونتائج.',why:'الجذر يسند والثمرة تظهر: التشبيه المألوف يربط الدليل بأثره في صورة واحدة يسهل استدعاؤها.',
 f:[['fruits','الثمار','l',4],['trunk','الجذع','t'],['roots','الجذور','l',4]],
 draw:function(s,d,y0,B){var p=s.p,H=B-y0,fr=(d.fruits||[]).slice(0,4),ro=(d.roots||[]).slice(0,4),fh=H*.27,th=H*.2,ty=y0+fh+H*.085,gy=ty+th+H*.075,rh=B-gy-H*.045,L=s.ltr,u=vU(s);
  function row(a,y,h,tint,g0,up){var n=Math.max(a.length,1),g=18,w=(1080-(n-1)*g)/n;a.forEach(function(t,i){s.G(g0+i+1);var x=1140-w-i*(w+g),cx=x+w/2;
    s.line(cx,up?y+h:y,600+(cx-600)*.16,up?ty:ty+th,p.ln,5);s.rect(x,y,w,h,tint?vT(s,i):p.bg,24,tint?null:vC(s,i),tint?0:4);s.rect(x+w-24,y+20,7,h-40,vC(s,i),3.5);s.box(t,cx-6,y+h/2,w-56,h-14,[34,31,28,25,23,21,19,17],{w:700})})}
  s.G(0);s.line(60,gy,1140,gy,p.c[1],6,'18 12');
  s.box(L?'Fruits':'الثمار',1090,y0+fh+H*.045,110,38*u,[Math.round(24*u)],{f:p.mut,w:700});s.box(L?'Roots':'الجذور',1090,gy+H*.04,110,38*u,[Math.round(24*u)],{f:p.mut,w:700});
  row(fr,y0,fh,true,0,true);row(ro,gy+H*.075,rh-H*.03,false,fr.length,false);
  s.G(0);s.rect(360,ty,480,th,p.c[3],26);s.box(d.trunk||d.title||'',600,ty+th/2,440,th-14,[40,36,32,28,25,22],{w:700,f:p.on[3]})}};
TPL.mind={n:'الخريطة الذهنية',ic:'brain',need:['recall','class'],when:'حين تلخّص درسًا أو وحدة في صفحة: فكرة في المركز وفروع حولها.',why:'المركز يثبّت الفكرة الكبرى، والفروع تقطّع التفاصيل إلى وحدات قليلة يحملها الذهن معًا.',
 f:[['center','الفكرة في المركز','t'],['items','الفروع','p2',6,['الفرع','كلمات تحته، مفصولة بفاصلة']]],
 draw:function(s,d,y0,B){var p=s.p,it=(d.items||[]).slice(0,6),n=it.length,nr=Math.ceil(n/2),nl=n-nr,cy=y0+(B-y0)/2,cw=330,ch=Math.min(230,(B-y0)*.42),bw=336,ph=70;
  function side(arr,right,g0){var m=Math.max(arr.length,1),sl=(B-y0)/m;arr.forEach(function(r,i){s.G(g0+i+1);var k=g0+i,yc=y0+i*sl+sl/2,x=right?1140-bw:60,ex=right?600+cw/2:600-cw/2,bx=right?x:x+bw,py=yc-Math.min(sl,250)/2+ph/2+6,mx=(ex+bx)/2;
    s.path('M'+vR(ex)+' '+vR(cy+(yc-cy)*.22)+'C'+vR(mx)+' '+vR(cy+(yc-cy)*.22)+' '+vR(mx)+' '+vR(py)+' '+vR(bx)+' '+vR(py),null,vC(s,k),6);
    s.rect(x,py-ph/2,bw,ph,vC(s,k),ph/2);s.box(r[0],x+bw/2,py,bw-40,ph-10,[36,33,30,27,24,21,19],{w:700,f:vON(s,k)});
    var ls=vsplit(r[1]).slice(0,5),bh=Math.min(sl,250)-ph-22;if(ls.length&&bh>30)s.box(ls.join(s.ltr?', ':'، '),x+bw/2,py+ph/2+8+bh/2,bw-18,bh,[29,27,25,23,21,19,17,15],{lh:1.5})})}
  side(it.slice(0,nr),true,0);side(it.slice(nr),false,nr);
  s.G(0);s.rect(600-cw/2,cy-ch/2,cw,ch,p.c[3],40);s.box(d.center||d.title||'',600,cy,cw-44,ch-30,[46,42,38,34,30,26,23],{w:700,f:p.on[3]})}};
TPL.path={n:'مسار الرحلة',ic:'map',need:['time','order'],when:'حين ينتقل الحدث من مكان إلى مكان: رحلة، أو هجرة، أو مراحل طريق.',why:'الطريق يربط كل محطة بما قبلها وما بعدها، فيُستدعى الحدث مع موضعه من الرحلة.',
 f:[['items','المحطات بالترتيب','p2',6,['المحطة','ما حدث فيها']]],
 draw:function(s,d,y0,B){var p=s.p,it=(d.items||[]).slice(0,6),n=Math.max(it.length,1),per=n<=3?n:Math.ceil(n/2),rows=Math.ceil(n/per),rh=(B-y0)/rows,sl=1080/per,u=vU(s),pts=[];
  it.forEach(function(r,i){var ro=Math.floor(i/per),c=i%per,cx=ro%2===0?1140-sl*(c+.5):60+sl*(c+.5);pts.push([cx,y0+ro*rh+rh-58,ro])});
  var dd='';pts.forEach(function(q,i){if(!i){dd='M'+vR(q[0])+' '+vR(q[1]);return}var a=pts[i-1];if(a[2]===q[2])dd+='L'+vR(q[0])+' '+vR(q[1]);else{var ex=a[2]%2===0?a[0]-sl*.42:a[0]+sl*.42;dd+='L'+vR(ex)+' '+vR(a[1])+'C'+vR(ex+(a[2]%2===0?-70:70))+' '+vR(a[1])+' '+vR(ex+(a[2]%2===0?-70:70))+' '+vR(q[1])+' '+vR(ex)+' '+vR(q[1])+'L'+vR(q[0])+' '+vR(q[1])}});
  s.G(0);if(n>1){s.path(dd,null,p.t[3],30);s.path(dd,null,p.bg,4,'16 14')}
  it.forEach(function(r,i){s.G(i+1);var q=pts[i],cw=Math.min(sl-22,400),top=y0+q[2]*rh+6,ch=q[1]-36-top,x=Math.max(60,Math.min(1140-cw,q[0]-cw/2));
   s.rect(x,top,cw,ch,p.pan,22);s.rect(x+cw-22,top+18,7,ch-36,vC(s,i),3.5);
   if(r[1]){s.box(r[0],x+cw/2-6,top+ch*.27,cw-54,ch*.42,[36,33,30,27,24,21,19],{w:700,f:p.c[0]});s.box(r[1],x+cw/2-6,top+ch*.69,cw-50,ch*.5,[29,27,25,23,21,19,17,15],{lh:1.4})}
   else s.box(r[0],x+cw/2-6,top+ch/2,cw-54,ch-16,[38,34,30,27,24,21],{w:700,f:p.c[0]});
   s.circ(q[0],q[1],26*u,i===n-1?p.c[1]:vC(s,i===0?0:3),p.bg,6);s.box(vn(s,i+1),q[0],q[1],44*u,44*u,[Math.round(27*u)],{w:700,f:i===n-1?p.on[1]:p.on[0]})})}};
TPL.nest={n:'دوائر الأثر',ic:'target',need:['parts','class'],when:'حين يتسع الأثر من دائرة إلى أوسع: من النفس إلى الأسرة إلى المجتمع.',why:'الاحتواء يُرى: الدائرة الصغرى داخل الكبرى تقول «هذا جزء من هذا» بلا كلمات.',
 f:[['items','الدوائر من الداخل إلى الخارج','p2',4,['الدائرة','ما فيها']]],
 draw:function(s,d,y0,B){var p=s.p,it=(d.items||[]).slice(0,4),n=Math.max(it.length,1),R=Math.min((B-y0)/2-6,300),cx=1140-R-6,by=y0+(B-y0)/2+R,band=2*R/n,rh=(B-y0)/n,FILL=[p.c[0],p.t[0],p.t[1],p.t[3]],ON=[p.on[0],p.ink,p.ink,p.ink];
  for(var i=n-1;i>=0;i--){s.G(i+1);var r=R*(i+1)/n;s.circ(cx,by-r,r,FILL[i]||p.pan,i?p.c[i%4]:null,i?4:0);
   s.box(it[i]&&it[i][0]||'',cx,i?by-2*r+band/2+4:by-r,i?Math.min(2*Math.sqrt(Math.max(r*r-Math.pow(r-band*.62,2),0))-18,2*r-30):2*r-28,i?band-16:2*r*.62,[36,33,30,27,24,21,19,17],{w:700,f:ON[i]||p.ink})}
  it.forEach(function(q,i){s.G(i+1);var cy=y0+i*rh+rh/2,x=cx-R-52;s.circ(x,cy,13,FILL[i]||p.pan,p.c[i%4],4);
   if(q[1]){s.box(q[0],x-30,cy-rh*.2,x-110,rh*.34,[34,31,28,25,22,20],{w:700,a:'s',f:p.c[0]});s.box(q[1],x-30,cy+rh*.2,x-110,rh*.44,[29,27,25,23,21,19,17],{a:'s',lh:1.45})}else s.box(q[0],x-30,cy,x-110,rh-16,[36,33,30,27,24,21],{w:700,a:'s'})})}};
TPL.equation={n:'المعادلة',ic:'plus',need:['parts','cause'],when:'حين يجتمع شرطان أو ركنان فيتحقق أمر: هذا مع هذا يساوي ذاك.',why:'علامتا الجمع والتساوي يعرفهما كل متعلم: تختصران «لا بد منهما معًا» في نظرة.',
 f:[['parts','الأطراف','l',4],['result','الناتج','t'],['note','سطر تحت الناتج (اختياري)','t']],
 draw:function(s,d,y0,B){var p=s.p,pa=(d.parts||[]).slice(0,4),n=Math.max(pa.length,1),g=92,w=(1080-(n-1)*g)/n,H=B-y0,ph=H*.36,ry=y0+ph+H*.2,rh=B-ry-(d.note?H*.1:0),u=vU(s);
  pa.forEach(function(t,i){s.G(i+1);var x=1140-w-i*(w+g);s.rect(x,y0,w,ph,vT(s,i),28);s.rect(x+w-26,y0+24,8,ph-48,vC(s,i),4);s.box(t,x+w/2-6,y0+ph/2,w-64,ph-18,[42,38,34,30,27,24,21,19],{w:700});
   if(i<n-1){s.G(0);s.circ(x-g/2,y0+ph/2,30*u,p.c[3]);s.box('+',x-g/2,y0+ph/2-2,50*u,50*u,[Math.round(44*u)],{w:700,f:p.on[3]})}});
  s.G(0);s.circ(600,y0+ph+H*.1,30*u,p.c[1]);s.box('=',600,y0+ph+H*.1-3,50*u,50*u,[Math.round(44*u)],{w:700,f:p.on[1]});
  s.G(n+1);s.rect(200,ry,800,rh,p.c[0],32);s.box(d.result||'',600,ry+rh/2,740,rh-20,[56,50,44,40,36,32,28,24],{w:700,f:p.on[0]});
  if(d.note)s.box(d.note,600,B-H*.04,1000,H*.085,[30,27,25,23,21,19],{f:p.mut})}};
TPL.triangle={n:'المثلث',ic:'compass',need:['parts','recall'],when:'حين يقوم الشيء على ثلاثة لا يستغني عن واحد منها: أركان، أو حكم ودليل وحكمة.',why:'ثلاث زوايا تسند بعضها: لو سقطت واحدة لم يبق مثلث، فيُفهم التلازم من الشكل.',
 f:[['items','الزوايا: الرأس ثم اليمنى ثم اليسرى','p2',3,['الزاوية','شرح قصير (اختياري)']],['center','ما في الوسط (اختياري)','t']],
 draw:function(s,d,y0,B){var p=s.p,it=(d.items||[]).slice(0,3),H=B-y0,cw=380,ch=Math.min(168,H*.3),P=[[600,y0+ch/2],[1140-cw/2,B-ch/2],[60+cw/2,B-ch/2]];
  s.G(0);s.path('M'+P[0][0]+' '+vR(P[0][1])+'L'+P[1][0]+' '+vR(P[1][1])+'L'+P[2][0]+' '+vR(P[2][1])+'Z',p.pan,p.ln,8);
  if(d.center)s.box(d.center,600,y0+H*.6,300,H*.2,[46,42,38,34,30,26],{w:700,f:p.c[0]});
  it.forEach(function(r,i){s.G(i+1);var x=P[i][0]-cw/2,y=P[i][1]-ch/2;s.rect(x,y,cw,ch,vC(s,i),28);
   if(r[1]){s.box(r[0],P[i][0],y+ch*.3,cw-36,ch*.44,[40,36,32,28,25,22],{w:700,f:vON(s,i)});s.box(r[1],P[i][0],y+ch*.7,cw-32,ch*.46,[27,25,23,21,19,17,15],{f:vON(s,i),lh:1.35})}
   else s.box(r[0],P[i][0],P[i][1],cw-36,ch-16,[42,38,34,30,27,24],{w:700,f:vON(s,i)})})}};
/* جداول المختبر للقوالب الجديدة */
LANS.ladder={items:[0,1]};LANS.balance={la:0,lb:0};LANS.iceberg={la:0,lb:0};LANS.roots={fruits:0,roots:0};LANS.mind={items:[1]};LANS.path={items:[0,1]};LANS.nest={items:[1]};LANS.equation={parts:0};LANS.triangle={items:[1]};
LPT.ladder=['items',0];LPT.balance=['la',-1];LPT.iceberg=['lb',-1];LPT.roots=['fruits',-1];LPT.mind=['items',0];LPT.path=['items',0];LPT.nest=['items',0];LPT.equation=['parts',-1];LPT.triangle=['items',0];
ELAB.ladder='اخلط الدرجات واطلب ترتيبها صعودًا، ثم مثالًا من الحياة لكل درجة.';ELAB.balance='أعطهم مواقف جديدة يضعونها في الكفة المناسبة، ثم يعلّلون الترجيح.';ELAB.iceberg='اذكر سلوكًا ظاهرًا واطلب ما تحته، ثم العكس.';ELAB.roots='احذف جذرًا واسأل: أي ثمرة تتأثر؟ ولماذا؟';ELAB.mind='أعطهم المركز والفروع فارغة يملؤونها والكتاب مغلق، ثم يطابقون.';ELAB.path='احذف محطة واطلب تحديد موضعها وما يتغير لو لم تقع.';ELAB.nest='اطلب مثالًا من حياة الطالب لكل دائرة.';ELAB.equation='احذف طرفًا واسأل: ماذا يبقى من الناتج؟ ولماذا لا يكفي الباقي؟';ELAB.triangle='غطِّ زاوية واسأل: ماذا يختل لو غابت؟';
NEEDS.forEach(function(x){var add={diff:['balance'],order:['ladder','path'],cause:['roots','iceberg'],class:['mind'],decide:['balance'],time:['path'],parts:['ladder','triangle','nest','equation','iceberg'],recall:['mind'],cycle:[]}[x.k]||[];x.a=(x.a||[]).concat(add.filter(function(k){return x.t.indexOf(k)<0&&(x.a||[]).indexOf(k)<0}))});
/* بطاقات القص وأسئلة القياس للقوالب الجديدة */
(function(){var C0=labCards,Q0=labQs;
labCards=function(t,d){var c=[],how='',pa=function(k,j){return (d[k]||[]).map(function(r){return Array.isArray(r)?r[j]:r})};
  if(t==='balance'||t==='iceberg'){c=pa('la').concat(pa('lb'));how='صنّف كل بطاقة: «'+(d.a||'الأول')+'» أم «'+(d.b||'الثاني')+'»؟'}
  else if(t==='roots'){c=pa('fruits').concat(pa('roots'));how='افرز البطاقات: جذر يسند «'+(d.trunk||'الجذع')+'» أم ثمرة له؟'}
  else if(t==='mind'||t==='nest'){(d.items||[]).forEach(function(r){vsplit(r[1]).forEach(function(x){c.push(x)})});how='ضع كل بطاقة تحت موضعها: '+pa('items',0).filter(Boolean).join('، ')+'.'}
  else if(t==='equation'){c=pa('parts');if(d.result)c.push(d.result);how='ركّب المعادلة: أي البطاقات أطراف؟ وأيها الناتج؟'}
  else if(t==='triangle'){(d.items||[]).forEach(function(r){if(r[0]&&r[1]){c.push(r[0]);c.push(r[1])}});how='طابق كل زاوية بشرحها.'}
  else if(t==='ladder'||t==='path'){c=pa('items',0);how=t==='ladder'?'رتّب الدرجات من الأولى إلى الأعلى، ثم طابق بالأصل.':'رتّب المحطات بترتيب الرحلة، ثم طابق بالأصل.'}
  else return C0(t,d);
  return {how:how,cards:c.filter(function(x){return x&&!/^[\s….\-_]+$/.test(x)}).slice(0,20)}};
labQs=function(t,d){var it=d.items||[],f=function(i){return it[i]&&it[i][0]},mid=Math.floor(it.length/2);
  if(t==='ladder')return [f(mid)?'ما الدرجة التي تعلو «'+f(mid)+'»؟':'رتّب درجتين من الدرس.','اذكر مثالًا من حياتك للدرجة الأولى، ومثالًا للأعلى.','ما الذي ينقل صاحبه من درجة إلى التي فوقها؟'];
  if(t==='balance')return ['موقف جديد: في أي كفة تضعه؟ ولماذا؟','ما الذي يفرّق بين «'+(d.a||'الأول')+'» و«'+(d.b||'الثاني')+'» في جملة واحدة؟','متى يتحول أحدهما إلى الآخر؟'];
  if(t==='iceberg')return ['اذكر شيئًا يظهر، وما الذي يحمله من تحت السطح.','لماذا كان ما تحت الماء أكبر؟','ماذا يحدث للظاهر لو اختل الباطن؟'];
  if(t==='roots')return ['أي جذر لو قُطع سقطت الشجرة؟ ولماذا؟','اربط ثمرة واحدة بالجذر الذي يغذّيها.','اذكر ثمرة أخرى تراها في حياتك.'];
  if(t==='mind')return ['ارسم الخريطة من الذاكرة: المركز والفروع فقط.',f(0)?'اذكر ثلاثة أشياء تحت «'+f(0)+'».':'اذكر ما تحت أحد الفروع.','أي فرعين بينهما علاقة؟ اشرحها.'];
  if(t==='path')return [f(mid)?'ماذا سبق «'+f(mid)+'» مباشرة؟ وماذا تلاها؟':'رتّب محطتين من الرحلة.','أي محطة كانت نقطة التحول؟ ولماذا؟','ماذا نتعلم من محطة واحدة تختارها؟'];
  if(t==='nest')return ['اذكر أثرًا في الدائرة الصغرى، وكيف يتسع إلى التي بعدها.','مثال من حياتك لكل دائرة.','ماذا يحدث للدوائر الواسعة لو غابت الصغرى؟'];
  if(t==='equation')return ['ماذا يبقى من الناتج لو غاب أحد الأطراف؟','لماذا لا يكفي طرف واحد؟','اكتب مثالًا تحقق فيه الأطراف كلها، ومثالًا نقص فيه طرف.'];
  if(t==='triangle')return ['ماذا يختل لو غابت إحدى الزوايا؟','اشرح العلاقة بين زاويتين منها.','أي الزوايا تراها الأصل؟ علّل.'];
  return Q0(t,d)};
})();
