#!/usr/bin/env python3
# «فحص الاتساق» (v131): يمنع رجوع التعارض إلى نص الدليل.
#   python3 m2/check.py          يفحص ويطبع الملخص، ويخرج بـ1 إن وُجدت صيغة محظورة أو رابط مكسور
#   python3 m2/check.py --list   يطبع معه مواضع «قائمة المراقبة» بسياقها
# يُشغَّل في آخر m2/build.py. ما يفحصه: index.html (خارج طبقة التصميم) و data/parts/*.html،
# ومنذ v132 صفحتا «الحلول البصرية» و«هندسة تجربة التعلّم» (vsc/index.html و lxd/index.html) في الصيغ وقائمة المراقبة،
# وأن فهرس بحث المنصة VS_IDX في index.html مطابق لصفحاتها (يولّده m2/vsidx.py).
# القواعد ثلاثة أنواع:
#   RULES  صيغة تعارض ما اعتمده الدليل: البناء يفشل حتى تُصحَّح (أو تُضاف قرينتها في unless).
#   WATCH  ادعاء شائع يُذكر في الدليل نفيًا أو بحدوده: يُعدّ ولا يُفشل، ليراجَع عند كل إضافة.
#   LINKS  كل رابط داخلي إلى قسم أو جزء، وكل قسم تشير إليه بيانات البطاقات، يجب أن يكون موجودًا.
import re, sys, glob, html, pathlib, subprocess
R = pathlib.Path(__file__).resolve().parent.parent
LIST = '--list' in sys.argv

RULES = [
    ('ماير: اسم المبدأ', r'مبدأ التكرار', None,
     'الاسم المعتمد «تجنّب الزيادة» (redundancy): لا يُكتب على الشاشة ما يُقال. و«التماسك» (coherence) مبدأ آخر: حذف ما لا يخدم.'),
    ('مدى الانتباه', r'أقصى شرح متصل|فلا يتجاوز الشرح المتصل ربع ساعة', None,
     'رقم الدقائق قاعدة عملية لا حدّ علمي (Bradbury, 2016)؛ والمسنود هو تقطيع الشرح.'),
    ('الذاكرة العاملة', r'7\s*±\s*2|٧\s*±\s*٢|سبعة? (?:وحدات|عناصر)', r'Miller|ميلر|تاريخي|عناصر دخيلة',
     'السعة المعتمدة «نحو أربع وحدات» (Cowan, 2001)؛ و«سبع ± 2» رقم تاريخي يُذكر منسوبًا إلى ميلر.'),
    ('عدد النظريات', r'إحدى عشرة نظرية(?! ونموذجًا)', None,
     '«إحدى عشرة نظرية ونموذجًا»: بلوم وجانييه و UbD وكيركباتريك و UDL والتفكير التصميمي أطر ونماذج لا نظريات.'),
    ('ترتيب المؤلفين', r'Schneider\s*(?:&amp;|&|و)\s*Dane', None, 'في قائمة المراجع: Dane & Schneider (1998).'),
    ('ترتيب المؤلفين', r'Reeves\s*(?:&amp;|&|و)\s*McKenney', None, 'في قائمة المراجع: McKenney & Reeves (2019).'),
    ('دراسة مسحوبة', r'Wang\s*(?:&amp;|&|و)\s*Fan\b', r'سُحب|مسحوب|retract',
     'التحليل البعدي لـ Wang & Fan (2025) عن ChatGPT مسحوب: لا يُستشهد به إلا مع ذكر سحبه.'),
]
WATCH = [
    ('أنماط التعلم', r'أنماط التعلّ?م|نمط التعلّ?م|طالب بصري', 'تُذكر نفيًا: لا دليل على نفع مطابقة التدريس للنمط (Pashler et al., 2008).'),
    ('هرم التعلم', r'هرم التعلّ?م|مخروط الخبرة', 'لا يُستعمل بنسبه، ولا يُنسب إلى Dale.'),
    ('خرافات الدماغ', r'النصف الأيمن|الدماغ الأيمن|عُشر دماغ', 'خرافات عصبية (Dekker et al., 2012): تُذكر نفيًا.'),
    ('عقلية النمو', r'عقلية النمو', 'أثر تدخلاتها صغير ومشروط (Sisk et al., 2018): لا تُقدَّم «مفتاح التفوق».'),
    ('الكمالية', r'الكمالية', 'ليست سمة جوهرية للموهوب: لا فرق دالًّا في مخاوفها (Stricker et al., 2020).'),
    ('دقائق الشرح', r'ربع ساعة|١٢–١٥ دقيقة|12–15 دقيقة', 'تُذكر قاعدة عملية لا حدًّا علميًّا.'),
]


def load(path):
    s = (R / path).read_text(encoding='utf-8')
    if path in ('index.html',) + SAT:
        a = s.find('<!--m2:end-->')
        s = s[a:] if a > -1 else s
    return re.sub(r'data:image/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+', '', s)


SAT = ('vsc/index.html', 'lxd/index.html')   # الصفحتان التابعتان: تُفحص صيغهما، وروابط الأقسام للدليل وحده
FILES = ['index.html'] + sorted(str(p.relative_to(R)) for p in (R / 'data/parts').glob('*.html')) + list(SAT)
SRC = {f: load(f) for f in FILES}
GUIDE = {f: s for f, s in SRC.items() if f not in SAT}


def near(s, a, b, w=70):
    t = re.sub(r'<[^>]+>', ' ', s[max(0, a - w):b + w])
    return html.unescape(re.sub(r'\s+', ' ', t)).strip()


def sec_of(s, pos):
    m = None
    for m in re.finditer(r'id="(p\d+-s\d+)"', s[:pos]):
        pass
    return m.group(1) if m else '-'


bad = 0
print('فحص الاتساق: %d ملفًا' % len(FILES))
for name, pat, unless, msg in RULES:
    hits = []
    for f, s in SRC.items():
        for m in re.finditer(pat, s):
            if unless and re.search(unless, s[max(0, m.start() - 220):m.end() + 220]):
                continue
            hits.append((f, sec_of(s, m.start()), near(s, m.start(), m.end())))
    if hits:
        bad += len(hits)
        print('  ✗ %s: %d موضعًا. %s' % (name, len(hits), msg))
        for f, sec, t in hits[:12]:
            print('      [%s | %s] …%s…' % (f, sec, t))

# الروابط الداخلية
ALL = '\n'.join(GUIDE.values())
secs = set(re.findall(r'<section[^>]*\bid="(p\d+-s\d+)"', ALL))
# الأجزاء: ما في index.html، وما يُحمَّل عند الطلب من data/parts/N.html
parts = {int(x) for x in re.findall(r'id="part(\d+)"', ALL)} | {int(pathlib.Path(f).stem) for f in FILES if f.startswith('data/parts/')}
broken = []
for f, s in GUIDE.items():
    # مجموعات البطاقات (#k-…) تُبنى عند التشغيل، ففحصها في اختبارات المتصفح لا هنا
    for m in re.finditer(r'href=\\?["\']#((?:p\d+-s\d+)|(?:part-\d+))\\?["\']', s):
        h = m.group(1)
        ok = (int(h[5:]) in parts) if h.startswith('part-') else (h in secs)
        if not ok:
            broken.append((f, sec_of(s, m.start()), h))
for m in re.finditer(r"sec:'(p\d+-s\d+)'", SRC['index.html']):
    if m.group(1) not in secs:
        broken.append(('index.html', 'بيانات البطاقات', m.group(1)))
if broken:
    bad += len(broken)
    print('  ✗ روابط داخلية بلا هدف: %d' % len(broken))
    for f, sec, h in broken[:20]:
        print('      [%s | %s] #%s' % (f, sec, h))

print('  أقسام %d، أجزاء %d' % (len(secs), len(parts)))
# فهرس بحث «الحلول البصرية» في الدليل: يجب أن يطابق صفحات المنصة
if subprocess.run([sys.executable, str(R / 'm2' / 'vsidx.py'), '--check'], capture_output=True).returncode:
    bad += 1
    print('  ✗ فهرس VS_IDX لا يطابق صفحات «الحلول البصرية»: شغّل python3 m2/vsidx.py ثم أعد البناء.')
for name, pat, msg in WATCH:
    hits = [(f, sec_of(s, m.start()), near(s, m.start(), m.end())) for f, s in SRC.items() for m in re.finditer(pat, s)]
    print('  ◦ مراقبة «%s»: %d موضعًا. %s' % (name, len(hits), msg))
    if LIST:
        for f, sec, t in hits:
            print('      [%s | %s] …%s…' % (f, sec, t))
if bad:
    print('فحص الاتساق: %d مخالفة. صحّحها ثم أعد البناء.' % bad)
    sys.exit(1)
print('فحص الاتساق: لا مخالفات.')
