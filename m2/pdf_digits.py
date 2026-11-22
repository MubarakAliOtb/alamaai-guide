# في نسخ التحاضير المصوّرة لنموذج 2 (ls/fN/m2/*.pdf): تُرسم الأرقام المشرقية بأشكال الأرقام الإنجليزية.
# يُستبدل شكل كل رقم داخل خط Alm Sans المضمَّن في الملف بشكل الرقم الإنجليزي من الخط نفسه، بعرض موحّد قريب من عرضه الأصلي،
# فلا يتغيّر تخطيط الصفحة إلا بأجزاء من النقطة. خط المصحف لا يُمسّ. النص المستخرج يبقى كما هو.
import pikepdf, re, io, sys, glob
from fontTools.ttLib import TTFont
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

SRC = {False: TTFont('fonts/AlmSansArabic-Regular.woff2'), True: TTFont('fonts/AlmSansArabic-Bold.woff2')}
def src_info(bold):
    t = SRC[bold]; cm = t.getBestCmap(); gs = t.getGlyphSet()
    W = round(sum(t['hmtx'][cm[0x660 + i]][0] for i in range(10)) / 10)
    return t, cm, gs, W
INFO = {b: src_info(b) for b in (False, True)}

def parse_tounicode(stream):
    data = stream.read_bytes().decode('latin-1'); m = {}
    for blk in re.findall(r'beginbfchar(.*?)endbfchar', data, re.S):
        for a, b in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>', blk): m[int(a, 16)] = b
    for blk in re.findall(r'beginbfrange(.*?)endbfrange', data, re.S):
        for a, b, c in re.findall(r'<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(<[0-9A-Fa-f]+>|\[[^\]]*\])', blk):
            a, b = int(a, 16), int(b, 16)
            if c.startswith('<'):
                v = int(c[1:-1], 16)
                for k in range(a, b + 1): m[k] = '%04X' % (v + k - a)
            else:
                vs = re.findall(r'<([0-9A-Fa-f]+)>', c)
                for k, v in zip(range(a, b + 1), vs): m[k] = v
    out = {}
    for k, v in m.items():
        if len(v) == 4:
            u = int(v, 16)
            if 0x660 <= u <= 0x669: out[k] = u - 0x660
            elif 0x6F0 <= u <= 0x6F9: out[k] = u - 0x6F0
    return out

def draw_digit(tt, gname, d, bold, upm):
    """يرسم الرقم الإنجليزي d مكان الشكل gname بعرض الشكل الأصلي نفسه، فلا يتحرك شيء في الصفحة."""
    t, cm, gs, _ = INFO[bold]
    scale_upm = upm / t['head'].unitsPerEm
    Wn = tt['hmtx'][gname][0]                      # عرض الرقم المشرقي الأصلي داخل الخط المضمَّن
    W = Wn / scale_upm
    g = gs[cm[ord(str(d))]]; bp = BoundsPen(gs); g.draw(bp); x0, y0, x1, y1 = bp.bounds
    ink = (x1 - x0)
    sx = min(1.0, (W * 0.9) / ink)
    off = (W - ink * sx) / 2 - x0 * sx
    pen = TTGlyphPen(None)
    g.draw(TransformPen(pen, (sx * scale_upm, 0, 0, scale_upm, off * scale_upm, 0)))
    gl = pen.glyph(); tt['glyf'][gname] = gl; gl.recalcBounds(tt['glyf'])
    tt['hmtx'][gname] = (Wn, getattr(gl, 'xMin', 0))
    return None

def fix_font(pdf, font, done):
    if font.objgen in done: return 0
    done.add(font.objgen)
    base = str(font.get('/BaseFont', ''))
    if 'AlmSans' not in base or '/ToUnicode' not in font: return 0
    bold = 'Bold' in base
    codes = parse_tounicode(font.ToUnicode)
    if not codes: return 0
    cid = font.get('/Subtype') == '/Type0'
    desc = font.DescendantFonts[0] if cid else font
    ff = desc.FontDescriptor.FontFile2
    tt = TTFont(io.BytesIO(ff.read_bytes()))
    upm = tt['head'].unitsPerEm
    order = tt.getGlyphOrder()
    if cid:
        m = desc.get('/CIDToGIDMap')
        if m is None or (isinstance(m, pikepdf.Name) and m == '/Identity'): c2g = lambda c: c
        else:
            raw = m.read_bytes(); c2g = lambda c: (raw[2 * c] << 8) | raw[2 * c + 1]
    else:
        sub = None
        for t in tt['cmap'].tables:
            if (t.platformID, t.platEncID) in ((3, 0), (1, 0), (3, 1)): sub = t; break
        def c2g(c):
            if sub is None: return None
            n = sub.cmap.get(c) or sub.cmap.get(0xF000 + c)
            return order.index(n) if n in order else None
    changed = {}
    for code, d in codes.items():
        gid = c2g(code)
        if gid is None or gid >= len(order): continue
        gname = order[gid]
        draw_digit(tt, gname, d, bold, upm)
        changed[code] = None
    if not changed: return 0
    buf = io.BytesIO(); tt.save(buf); data = buf.getvalue()
    ff.write(data); ff.Length1 = len(data)
    if all(v is None for v in changed.values()): return len(changed)
    if cid:
        W = desc.get('/W'); wm = {}
        if W is not None:
            arr = list(W); i = 0
            while i < len(arr):
                c = int(arr[i])
                if isinstance(arr[i + 1], pikepdf.Array):
                    for j, w in enumerate(arr[i + 1]): wm[c + j] = float(w)
                    i += 2
                else:
                    for k in range(c, int(arr[i + 1]) + 1): wm[k] = float(arr[i + 2])
                    i += 3
        for code, w in changed.items(): wm[code] = w
        out = []
        for c in sorted(wm): out += [c, pikepdf.Array([round(wm[c], 2)])]
        desc.W = pikepdf.Array(out)
    else:
        fc = int(font.FirstChar); ws = list(font.Widths)
        for code, w in changed.items():
            if 0 <= code - fc < len(ws): ws[code - fc] = round(w, 2)
        font.Widths = pikepdf.Array(ws)
    return len(changed)

def run(path):
    pdf = pikepdf.open(path, allow_overwriting_input=True); done = set(); n = 0
    for pg in pdf.pages:
        for k, f in pg.Resources.get('/Font', {}).items(): n += fix_font(pdf, f, done)
    pdf.save(path); return n

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob('ls/f[6-9]/m2/*.pdf'))
    tot = 0
    for f in files: tot += run(f)
    print('files', len(files), 'digit glyphs', tot)
