# يبني خطوطًا صغيرة ترسم الأرقام العربية المشرقية (٠-٩) والفارسية (۰-۹) وعلامات ٪ ٫ ٬ بأشكال الأرقام الإنجليزية.
# تُحمَّل في نموذج 2 وحده بعد خطوط الصفحة بنطاق unicode-range، فتظهر كل الأرقام إنجليزية دون تغيير النص نفسه.
from fontTools.ttLib import TTFont
from fontTools import subset
import copy
SRC = {'alm-400': 'fonts/AlmSansArabic-Regular.woff2', 'alm-700': 'fonts/AlmSansArabic-Bold.woff2',
       'mik-400': 'fonts/Mikhak-DS1-Regular.woff2', 'mik-700': 'fonts/Mikhak-DS1-Bold.woff2',
       'mik-800': 'fonts/Mikhak-DS1-ExtraBold.woff2', 'mik-900': 'fonts/Mikhak-DS1-Black.woff2'}
for name, path in SRC.items():
    f = TTFont(path); cm = f.getBestCmap()
    keep = [ord(str(i)) for i in range(10)] + [ord('%'), ord('.'), ord(',')]
    opts = subset.Options(); opts.layout_features = []; opts.name_IDs = ['*']; opts.notdef_outline = True; opts.flavor = 'woff2'; opts.hinting = False
    sub = subset.Subsetter(opts); sub.populate(unicodes=keep); sub.subset(f)
    cmap = {ord(str(i)): f.getBestCmap()[ord(str(i))] for i in range(10)}
    base = f.getBestCmap()
    extra = {}
    for i in range(10):
        extra[0x660 + i] = base[ord(str(i))]; extra[0x6F0 + i] = base[ord(str(i))]
    extra[0x66A] = base[ord('%')]; extra[0x66B] = base[ord('.')]; extra[0x66C] = base[ord(',')]
    for t in f['cmap'].tables:
        if t.isUnicode(): t.cmap.update(extra)
    for rec in f['name'].names:
        if rec.nameID in (1, 4, 16):
            try: rec.string = 'M2 Digits ' + name
            except Exception: pass
    out = f'fonts/m2d-{name}.woff2'; f.flavor = 'woff2'; f.save(out); print(out)
