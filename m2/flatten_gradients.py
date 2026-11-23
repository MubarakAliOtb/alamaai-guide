# التدرجات اللونية في الحقائب (ملفات PDF وعروض PowerPoint) تصير ألوانًا مسطّحة كما في نظام التصميم الحالي:
# - أنماط التظليل في PDF: الداكنة الشعاعية (خلفيات الأغلفة) ← النيلي #1E1B4B، والخطية الملوّنة (أشرطة الرؤوس) ← البنفسجي #6D28D9،
#   والفاتحة (رؤوس البطاقات) ← #F7F6FB.
# - صور الخلفيات المتدرجة (الغلاف والفواصل والخلفية الفاتحة للعروض، وشرائط البطاقات الفاتحة): لون مسطّح واحد،
#   مع الإبقاء على الخطوط الدقيقة المرسومة فوق التدرج (دوائر الزخرفة)؛ وأمثلة الشرائح التي يشرحها المحتوى لا تُمسّ.
import sys, io, os, re, glob, zlib, base64, zipfile
import numpy as np, pikepdf
from pikepdf import PdfImage
from PIL import Image, ImageFilter

INK, PURPLE, LIGHT = (0x1E, 0x1B, 0x4B), (0x6D, 0x28, 0xD9), (0xF7, 0xF6, 0xFB)
def lum(c): return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255

def stops(fn, out):
    t = int(fn.get('/FunctionType', -1))
    if t == 2: out += [tuple(round(float(x) * 255) for x in fn.C0), tuple(round(float(x) * 255) for x in fn.C1)]
    elif t == 3:
        for f in fn.Functions: stops(f, out)
    return out

def flat_shading(sh):
    fn = sh.get('/Function')
    if fn is None: return None
    cs = stops(fn, [])
    if not cs or len(set(cs)) < 2: return None
    if min(lum(c) for c in cs) > 0.8: col = LIGHT
    elif int(sh.get('/ShadingType', 2)) == 3: col = INK
    else: col = PURPLE
    v = [pikepdf.Object.parse(b'%.4f' % (x / 255)) for x in col]
    sh.Function = pikepdf.Dictionary({'/FunctionType': 2, '/Domain': pikepdf.Array([0, 1]), '/C0': pikepdf.Array(v), '/C1': pikepdf.Array(v), '/N': 1})
    return col

def smooth(im):
    g = im.convert('L'); w = 256; h = max(3, round(256 * g.height / g.width))
    a = np.asarray(g.resize((w, h)), float)
    if a.shape[0] < 3: return 0.0, float(a.std())
    lap = np.abs(a[1:-1, 1:-1] * 4 - a[:-2, 1:-1] - a[2:, 1:-1] - a[1:-1, :-2] - a[1:-1, 2:])
    return float(np.percentile(lap, 95)), float(np.asarray(im.convert('L').resize((64, max(1, round(64 * im.height / im.width)))), float).std())

def is_wash(im):
    """صورة خلفية متدرجة: ناعمة بلا تفاصيل، وتتغير درجتها فعلًا."""
    p95, sd = smooth(im); W, H = im.size
    sm_ = im.convert('RGB').resize((64, max(1, round(64 * H / W))))
    if min(sm_.size) > 4: sm_ = sm_.filter(ImageFilter.GaussianBlur(3))   # التدرج يبقى بعد التنعيم، والنص الصغير يزول
    rgb = np.asarray(sm_, float).reshape(-1, 3)
    spread = float(np.ptp(rgb, 0).max())
    full = np.asarray(im.convert('RGB').resize((128, max(1, round(128 * H / W)))), int).reshape(-1, 3)
    neutral = (full.max(1) - full.min(1)).max() < 8          # قناع رمادي (ظل أو حواف صورة)، لا خلفية ملوّنة
    white = (full.min(1) >= 250).mean() > 0.4                 # صورة بيضاء عليها محتوى (مثال شريحة)
    return p95 <= 6 and spread >= 6 and not neutral and not white and (W >= 300 or H >= 300 or min(W, H) == 1)

def flatten_image(im):
    rgb = im.convert('RGB'); a = np.asarray(rgb, float)
    col = INK if lum(a.reshape(-1, 3).mean(0)) < 0.45 else LIGHT
    if min(rgb.size) > 8:
        blur = np.asarray(rgb.filter(ImageFilter.GaussianBlur(5)), float)
        det = a - blur; det[np.abs(det).max(2) < 4] = 0   # التدرج يتغير ببطء فيزول، والخطوط الدقيقة تبقى فوق اللون المسطّح
        out = np.array(col, float) + det
    else:
        out = np.broadcast_to(np.array(col, float), a.shape).copy()
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8), 'RGB'), col

def run_pdf(path):
    pdf = pikepdf.open(path, allow_overwriting_input=True); n_sh = n_im = 0; seen = set()
    res = [p.Resources for p in pdf.pages] + [o.get('/Resources') for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Form']
    for r in res:
        if not isinstance(r, pikepdf.Dictionary): continue
        shs = [v.get('/Shading') for v in r.get('/Pattern', {}).values()] + list(r.get('/Shading', {}).values())
        for sh in shs:
            if sh is None: continue
            key = sh.objgen if sh.is_indirect else id(sh)
            if sh.is_indirect and key in seen: continue
            seen.add(key)
            if flat_shading(sh): n_sh += 1
    sm = {o.get('/SMask').objgen for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/SMask') is not None}
    for o in list(pdf.objects):
        if not (isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Image') or o.objgen in sm or '/SMask' in o: continue
        try: im = PdfImage(o).as_pil_image()
        except Exception: continue
        if not is_wash(im): continue
        new, _ = flatten_image(im)
        if str(o.get('/Filter')) == '/DCTDecode':
            b = io.BytesIO(); new.save(b, 'JPEG', quality=92); o.write(b.getvalue(), filter=pikepdf.Name('/DCTDecode'))
        else:
            o.write(zlib.compress(new.tobytes(), 9), filter=pikepdf.Name('/FlateDecode'))
            if '/DecodeParms' in o: del o['/DecodeParms']
        o.ColorSpace = pikepdf.Name('/DeviceRGB'); o.BitsPerComponent = 8
        if '/Decode' in o: del o['/Decode']
        n_im += 1
    pdf.save(path, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    return {'shadings': n_sh, 'images': n_im}

def run_pptx(path):
    raw = open(path).read(); data = base64.b64decode(re.sub(r'\s+', '', raw))
    zin = zipfile.ZipFile(io.BytesIO(data)); infos = zin.infolist(); parts = {i.filename: zin.read(i.filename) for i in infos}; n = 0
    for k in list(parts):
        if not (k.startswith('ppt/media/') and k.lower().endswith(('.png', '.jpg', '.jpeg'))): continue
        im = Image.open(io.BytesIO(parts[k]))
        if 'A' in im.getbands() or not is_wash(im): continue
        new, _ = flatten_image(im); b = io.BytesIO()
        new.save(b, 'PNG' if k.lower().endswith('.png') else 'JPEG', **({} if k.lower().endswith('.png') else {'quality': 92}))
        parts[k] = b.getvalue(); n += 1
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w') as zo:
        for i in infos: zo.writestr(i, parts[i.filename], compress_type=i.compress_type)
    tmp = path + '.tmp'; open(tmp, 'wb').write(base64.b64encode(out.getvalue())); os.replace(tmp, path)
    return {'images': n}

if __name__ == '__main__':
    for f in sorted(glob.glob('vsc/kits/*.pdf')): print(f, run_pdf(f), flush=True)
    for f in sorted(glob.glob('vsc/kits/*.pptx.txt')): print(f, run_pptx(f), flush=True)
