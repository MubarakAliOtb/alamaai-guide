# نقل ملفات PDF في حقائب الحلول البصرية (vsc/kits/) إلى نظام التصميم الحالي بجداول m2/auto_tables.py نفسها:
# - ألوان المتجهات: لون النص بجدول TEXT، والتعبئة والحدود بجدول FILL.
# - إن وقع نص أبيض على تعبئة صار لونها فاتحًا (النعناعي ودرجاته)، تُعطى تلك التعبئة الدرجة الداكنة حتى يبقى النص مقروءًا.
# - التدرجات (أنماط التظليل) تُحوَّل ألوان محطاتها.
# - الصور البيانية (خلفيات، أمثلة مرسومة بألوان النموذج القديم) تُحوَّل ألوانها بكثافة متدرجة؛ والصور الفوتوغرافية لا تُمسّ.
# - الأرقام المشرقية تُرسم بأشكال 0–9 (m2/pdf_digits.py).
import sys, io, os, glob, re, zlib
import numpy as np, pikepdf, pymupdf
from pikepdf import PdfImage
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from auto_tables import FILL as F0, TEXT as T0, MID, INK
import pdf_digits

EXTRA = {'#F7FAFF': '#F7F6FB', '#8FA3C8': '#8C89AB', '#6B7FA8': '#6E6B8F', '#E8650A': '#047857', '#0B9C8D': '#10B981'}
FILL = {**F0, **EXTRA}
TEXT = {**T0, **{k: v for k, v in EXTRA.items()}}
TEXT.update({'#C6EFE9': '#D1FAE5', '#E7F8F5': '#ECFDF5', '#FFE1C7': '#D1FAE5', '#FFF3E8': '#ECFDF5', '#F7FAFF': '#F7F6FB', '#B9C9E8': '#C9C6DD'}); TEXT.setdefault('#5FD3C5', '#6EE7B7'); TEXT.setdefault('#D5E0F2', '#E7E5F2'); TEXT.setdefault('#8FA3C8', '#8C89AB')
DARK = {'#34D399': '#047857', '#6EE7B7': '#047857', '#A7F3D0': '#047857', '#D1FAE5': '#047857', '#ECFDF5': '#047857',
        '#A78BFA': '#6D28D9', '#C4B5FD': '#6D28D9', '#DDD6FE': '#6D28D9', '#EDE9FE': '#6D28D9'}
MIDX = set(MID) | {'#ECFDF5', '#F5F3FF', '#F7F6FB'}

def rgb(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))
def hexof(vals): return '#%02X%02X%02X' % tuple(max(0, min(255, round(float(v) * 255))) for v in vals)
KEYS = {}
for tbl in (FILL, TEXT):
    for k in tbl: KEYS[k] = rgb(k)
def look(tbl, h):
    if h in tbl: return tbl[h]
    r = rgb(h)
    for k, kr in KEYS.items():
        if k in tbl and max(abs(a - b) for a, b in zip(r, kr)) <= 2: return tbl[k]
    return None
def ops3(h): return [pikepdf.Object.parse(b'%.4f' % (c / 255)) for c in rgb(h)]

PAINT_F = {'f', 'F', 'f*', 'B', 'B*', 'b', 'b*'}
PAINT_S = {'S', 's', 'B', 'B*', 'b', 'b*'}
SHOW = {'Tj', 'TJ', "'", '"'}
PATH = {'m', 'l', 'c', 'v', 'y', 're', 'h'}

def mat(a, b): return [a[0]*b[0]+a[1]*b[2], a[0]*b[1]+a[1]*b[3], a[2]*b[0]+a[3]*b[2], a[2]*b[1]+a[3]*b[3], a[4]*b[0]+a[5]*b[2]+b[4], a[4]*b[1]+a[5]*b[3]+b[5]]
def apply(m, x, y): return (m[0]*x + m[2]*y + m[4], m[1]*x + m[3]*y + m[5])

def text_origins(ops):
    """موضع بداية النص (بإحداثيات الصفحة) عند كل أمر عرض نص."""
    ctm = [1, 0, 0, 1, 0, 0]; stack = []; tm = [1, 0, 0, 1, 0, 0]; tlm = list(tm); lead = 0; pos = {}
    for i, (o_, op) in enumerate(ops):
        o = str(op)
        if o == 'q': stack.append(ctm)
        elif o == 'Q' and stack: ctm = stack.pop()
        elif o == 'cm': ctm = mat([float(x) for x in o_], ctm)
        elif o == 'BT': tm = [1, 0, 0, 1, 0, 0]; tlm = list(tm)
        elif o == 'Tm': tm = [float(x) for x in o_]; tlm = list(tm)
        elif o in ('Td', 'TD'):
            tx, ty = float(o_[0]), float(o_[1]); tlm = mat([1, 0, 0, 1, tx, ty], tlm); tm = list(tlm)
            if o == 'TD': lead = -ty
        elif o == 'TL': lead = float(o_[0])
        elif o == 'T*': tlm = mat([1, 0, 0, 1, 0, -lead], tlm); tm = list(tlm)
        elif o in SHOW: m = mat(tm, ctm); pos[i] = (m[4], m[5], abs(m[3]) or abs(m[0]))
    return pos

def recolor_stream(ops, white_pts=None, bg=None):
    """ops: قائمة (operands, op). white_pts: مراكز النصوص البيضاء بإحداثيات الصفحة (أو None للنماذج).
    bg(x, y, size): سطوع الخلفية الأصلية عند موضع النص (0–1)، ليُختار لون النص الفاتح على الخلفيات الداكنة."""
    n = len(ops); out = list(ops); stats = {'text': 0, 'fill': 0, 'stroke': 0, 'dark': 0, 'ondark': 0}
    use = {}; first = {}
    pend = None
    for i, (o_, op) in enumerate(ops):
        o = str(op)
        if o == 'rg': pend = i
        elif pend is not None and o in SHOW: use.setdefault(pend, 'text'); first.setdefault(pend, i); pend = None
        elif pend is not None and o in PAINT_F: use.setdefault(pend, 'fill'); pend = None
    pos = text_origins(ops) if bg else {}
    for i, (o_, op) in enumerate(ops):
        o = str(op)
        if o in ('rg', 'RG') and len(o_) == 3:
            h = hexof(o_)
            tbl = TEXT if (o == 'rg' and use.get(i) == 'text') else FILL
            if tbl is TEXT and bg and first.get(i) in pos:
                x, y, sz = pos[first[i]]
                if bg(x, y, sz) < 0.42: tbl = FILL; stats['ondark'] += 1
            nh = look(tbl, h)
            if nh and nh != h: out[i] = (ops3(nh), op); stats['text' if tbl is TEXT else ('fill' if o == 'rg' else 'stroke')] += 1
    if not white_pts: return out, stats
    # 2) تباين: تعبئة فاتحة تحت نص أبيض ← الدرجة الداكنة
    ctm = [1, 0, 0, 1, 0, 0]; stack = []; cur = None; path_start = None; pts = []; fills = []
    for i, (o_, op) in enumerate(out):
        o = str(op)
        if o == 'q': stack.append((ctm, cur))
        elif o == 'Q' and stack: ctm, cur = stack.pop()
        elif o == 'cm': ctm = mat([float(x) for x in o_], ctm)
        elif o == 'rg' and len(o_) == 3: cur = hexof(o_)
        elif o in PATH:
            if path_start is None: path_start = i; pts = []
            v = [float(x) for x in o_]
            if o == 're':
                x, y, w, h = v; pts += [apply(ctm, x, y), apply(ctm, x + w, y + h)]
            else:
                for k in range(0, len(v) - 1, 2): pts.append(apply(ctm, v[k], v[k + 1]))
        elif o in PAINT_F or o in ('S', 's', 'n', 'W', 'W*'):
            if o in PAINT_F and pts and path_start is not None:
                xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
                fills.append((path_start, i, min(xs), min(ys), max(xs), max(ys), cur))
            if o not in ('W', 'W*'): path_start = None; pts = []
    inserts = {}; mark = set()
    for px, py in white_pts:   # أصغر تعبئة تحت النص الأبيض هي خلفيته المباشرة
        best = None
        for k, (a, b, x0, y0, x1, y1, c) in enumerate(fills):
            if x0 <= px <= x1 and y0 <= py <= y1 and (x1 - x0) > 3 and (y1 - y0) > 3:
                ar = (x1 - x0) * (y1 - y0)
                if best is None or ar < best[0]: best = (ar, k)
        if best: mark.add(best[1])
    for k in sorted(mark):
        a, b, *_, c = fills[k]
        if c in DARK:
            inserts.setdefault(a, []).append((ops3(DARK[c]), pikepdf.Operator('rg')))
            inserts.setdefault(b + 1, []).append((ops3(c), pikepdf.Operator('rg'))); stats['dark'] += 1
    if inserts:
        res = []
        for i, x in enumerate(out):
            res += inserts.get(i, []); res.append(x)
        res += inserts.get(len(out), [])
        out = res
    return out, stats

def white_points(page):
    H = page.rect.height; pts = []
    for b in page.get_text('dict')['blocks']:
        for l in b.get('lines', []):
            for s in l['spans']:
                if s['color'] == 0xFFFFFF and s['text'].strip():
                    x0, y0, x1, y1 = s['bbox']; pts.append(((x0 + x1) / 2, H - (y0 + y1) / 2))
    return pts

def recolor_function(fn, seen):
    if fn is None or fn.objgen in seen and fn.is_indirect: return 0
    if fn.is_indirect: seen.add(fn.objgen)
    n = 0; t = int(fn.get('/FunctionType', -1))
    if t == 2:
        for key in ('/C0', '/C1'):
            if key in fn and len(fn[key]) == 3:
                nh = look(FILL, hexof(fn[key]))
                if nh: fn[key] = pikepdf.Array([pikepdf.Object.parse(b'%.4f' % (c / 255)) for c in rgb(nh)]); n += 1
    elif t == 3:
        for sub in fn.Functions: n += recolor_function(sub, seen)
    return n

# صور: خريطة ألوان متدرجة (لوحة قديمة ← جديدة) مع ألوان محايدة ثابتة
PAL_OLD = np.array([rgb(k) for k in FILL], float); PAL_NEW = np.array([rgb(v) for v in FILL.values()], float)
NEUTRAL = np.array([(255, 255, 255), (0, 0, 0), (128, 128, 128), (200, 200, 200), (60, 60, 60)], float)
def remap_pixels(a):
    sh = a.shape; x = a.reshape(-1, 3).astype(float); out = np.empty_like(x)
    for s in range(0, len(x), 200000):
        c = x[s:s + 200000]
        d = np.sqrt(((c[:, None, :] - PAL_OLD[None]) ** 2).sum(2))
        dn = np.sqrt(((c[:, None, :] - NEUTRAL[None]) ** 2).sum(2))
        w = np.exp(-(d / 34.0) ** 2); wn = np.exp(-(dn / 34.0) ** 2).sum(1)
        delta = (w[:, :, None] * (PAL_NEW - PAL_OLD)[None]).sum(1) / (w.sum(1) + wn + 1e-6)[:, None]
        out[s:s + 200000] = c + delta
    return np.clip(out, 0, 255).reshape(sh).astype(np.uint8)

def is_graphic(im):
    a = np.asarray(im.convert('RGB').resize((96, 96)), float).reshape(-1, 3)
    nw = a[a.min(1) < 235]
    if len(nw) < 50: return False
    d = np.sqrt(((nw[:, None, :] - PAL_OLD[None]) ** 2).sum(2)).min(1)
    return (d < 30).mean() >= 0.6

def recolor_images(pdf):
    n = 0; sm = {o.get('/SMask').objgen for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/SMask') is not None}
    for o in list(pdf.objects):
        if not (isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Image') or o.objgen in sm: continue
        if o.get('/ImageMask') or int(o.get('/BitsPerComponent', 8)) != 8: continue
        try: im = PdfImage(o).as_pil_image()
        except Exception: continue
        if im.mode not in ('RGB', 'L', 'P', 'RGBA', 'CMYK') or not is_graphic(im): continue
        rgbim = im.convert('RGB'); a = remap_pixels(np.asarray(rgbim))
        new = Image.fromarray(a, 'RGB')
        if str(o.get('/Filter')) == '/DCTDecode':
            buf = io.BytesIO(); new.save(buf, 'JPEG', quality=92); o.write(buf.getvalue(), filter=pikepdf.Name('/DCTDecode'))
        else:
            o.write(zlib.compress(new.tobytes(), 9), filter=pikepdf.Name('/FlateDecode'))
            if '/DecodeParms' in o: del o['/DecodeParms']
        o.ColorSpace = pikepdf.Name('/DeviceRGB'); o.BitsPerComponent = 8
        for k in ('/Decode',):
            if k in o: del o[k]
        n += 1
    return n

def run(path, out=None):
    src = open(path, 'rb').read(); pdf = pikepdf.open(io.BytesIO(src)); doc = pymupdf.open(stream=src, filetype='pdf')
    tot = {'text': 0, 'fill': 0, 'stroke': 0, 'dark': 0, 'ondark': 0, 'shading': 0}
    done = set()
    for pi, page in enumerate(pdf.pages):
        ops = list(pikepdf.parse_content_stream(page))
        pix = doc[pi].get_pixmap(dpi=36); H = doc[pi].rect.height; K = 36 / 72
        arr = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3].astype(float) / 255
        def bg(x, y, sz, arr=arr, H=H, K=K):
            cx, cy = int(x * K), int((H - y - sz * 0.35) * K); r = max(1, int(sz * K * 0.6))
            win = arr[max(0, cy - r):cy + r + 1, max(0, cx - r):cx + 3 * r + 1]
            if win.size == 0: return 1.0
            lum = (0.2126 * win[..., 0] + 0.7152 * win[..., 1] + 0.0722 * win[..., 2]).ravel()
            return float(np.percentile(lum, 50))
        new, st = recolor_stream(ops, white_points(doc[pi]), bg)
        page.obj.Contents = pdf.make_stream(pikepdf.unparse_content_stream(new))
        for k in st: tot[k] += st[k]
    for o in pdf.objects:
        if isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Form':
            ops = list(pikepdf.parse_content_stream(o)); new, st = recolor_stream(ops)
            o.write(pikepdf.unparse_content_stream(new))
            for k in st: tot[k] += st[k]
    seen = set()
    for o in pdf.objects:
        if isinstance(o, pikepdf.Dictionary) and '/Resources' in o or isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Form':
            pass
    def pats(res):
        if not isinstance(res, pikepdf.Dictionary): return []
        return list(res.get('/Pattern', {}).values())
    allres = [p.Resources for p in pdf.pages] + [o.get('/Resources') for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Form']
    for res in allres:
        for pat in pats(res):
            sh = pat.get('/Shading')
            if sh is not None: tot['shading'] += recolor_function(sh.get('/Function'), seen)
            if pat.get('/PatternType') == 1:
                ops = list(pikepdf.parse_content_stream(pat)); new, st = recolor_stream(ops); pat.write(pikepdf.unparse_content_stream(new))
    for res in allres:
        if isinstance(res, pikepdf.Dictionary):
            for sh in res.get('/Shading', {}).values(): tot['shading'] += recolor_function(sh.get('/Function'), seen)
    tot['images'] = recolor_images(pdf)
    buf = io.BytesIO(); pdf.save(buf, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    dst = out or path; tmp = dst + '.tmp'; open(tmp, 'wb').write(buf.getvalue()); os.replace(tmp, dst)
    tot['digits'] = pdf_digits.run(dst)
    return tot

if __name__ == '__main__':
    for f in sys.argv[1:] or sorted(glob.glob('vsc/kits/*.pdf')):
        print(f, run(f), flush=True)
