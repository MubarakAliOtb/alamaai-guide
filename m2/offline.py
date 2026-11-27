# يحدّث offline.json (قائمة ما يُحفظ للعمل بلا إنترنت وأحجامه) بعد إضافة ملفات النموذج 2.
import json, os, glob
d = json.load(open('offline.json', encoding='utf-8'))
# التصميم البسيط: خط واحد (Alm Sans) بأرقامه الإنجليزية، وشعاره، وأيقونات البلاطات، وصور الأقسام،
# وأغلفة المقاطع (vid/m2/*.webp للنهار و*-d.webp لليل) لأنها تظهر في المنشورات قبل تشغيل المقطع
# أيقونات الشعار بأسماء جديدة حتى تجلبها المتصفحات من جديد بدل صورة الشعار القديم المحفوظة عندها
add = sorted(glob.glob('fonts/m2d-alm-*.woff2')) + ['m2/logo.svg', 'm2/logo.png', 'm2/lv3-s.webp', 'm2/fav-32.png', 'm2/fav-192.png', 'm2/touch-180.png', 'm2/app-192.png', 'm2/app-512.png', 'remote/boot.js'] + sorted(glob.glob('m2/img/*.webp')) + sorted(glob.glob('vid/m2/*.webp'))
core = d['groups']['core']['u']
# ما لم يعد يُستعمل منذ النمط البسيط: خط ميخك وأرقامه، وأيقونات النمط السابق، ومجلد الشخصيات
OLD = lambda u: u.startswith(('fonts/Mikhak-', 'fonts/m2d-mik-', 'm2/char/')) or u == 'm2/lv3-m2.webp'
core[:] = [u for u in core if not OLD(u) and u not in ('img/lv3e.webp', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png') and (not u.startswith('m2/img/') or os.path.exists(u))]
for f in add:
    if f not in core: core.append(f)
# «المقاطع القصيرة»: مقاطع التصميم الحالي وحدها (vid/m2)؛ مقاطع النموذج السابق في vid/ لا تُستعمل
d['groups']['vid']['u'] = sorted(glob.glob('vid/m2/*.mp4'))
# v132: صور «الحلول البصرية» الجديدة ورمز QR لرابط شاشة الحصة، وصفحة «هندسة تجربة التعلّم» (مختبر الجزء الثامن عشر) مع فصول الدليل
for k, fs in (('vsc', ['vsc/img/vx-hero.webp', 'vsc/img/class.webp', 'vsc/img/dome.webp', 'remote/qr.js']), ('guide', ['lxd/', 'lxd/img/door.webp'])):
    for f in fs:
        if f not in d['groups'][k]['u']: d['groups'][k]['u'].append(f)
CDN = {'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js': 198689, 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js': 97630, 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js': 477529}
def sz(u):
    if u in CDN: return CDN[u]
    f = fp(u); return os.path.getsize(f) if os.path.exists(f) else 0
def fp(u): return 'index.html' if u == './' else (u + 'index.html' if u.endswith('/') else u)
for g in d['groups'].values():
    g['n'] = len(g['u']); g['b'] = sum(sz(u) for u in g['u'])
d['v'] = 117
json.dump(d, open('offline.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print({k: (g['n'], g['b']) for k, g in d['groups'].items()})
