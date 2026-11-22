# يحدّث offline.json (قائمة ما يُحفظ للعمل بلا إنترنت وأحجامه) بعد إضافة ملفات النموذج 2.
import json, os, glob
d = json.load(open('offline.json', encoding='utf-8'))
add = sorted(glob.glob('fonts/Mikhak-DS1-*.woff2')) + sorted(glob.glob('fonts/m2d-*.woff2')) + ['m2/logo.svg', 'm2/logo.png', 'm2/lv3-m2.webp'] + sorted(glob.glob('m2/char/*.webp'))
core = d['groups']['core']['u']
for f in add:
    if f not in core: core.append(f)
CDN = {'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js': 198689, 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js': 97630, 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js': 477529}
def sz(u):
    if u in CDN: return CDN[u]
    f = fp(u); return os.path.getsize(f) if os.path.exists(f) else 0
def fp(u): return 'index.html' if u == './' else (u + 'index.html' if u.endswith('/') else u)
for g in d['groups'].values():
    g['n'] = len(g['u']); g['b'] = sum(sz(u) for u in g['u'])
d['v'] = 112
json.dump(d, open('offline.json', 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print({k: (g['n'], g['b']) for k, g in d['groups'].items()})
