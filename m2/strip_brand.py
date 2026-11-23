# يحذف من التحاضير المصوّرة ما يدل على الدليل، حذفًا حقيقيًّا لا تغطية، حتى يطبعها المعلم ويستعملها كما هي:
# ١) ترويسة صفحات التحضير والتكملة: سطر «المادة · الصف · الفصل الدراسي»، وسطر «التحضير الكتابي · عنوان الحصة»،
#    و«دليل المعلم الألمعي»، والخط الملوّن تحتها. يبقى الجدول في موضعه، فيصير أعلى الصفحة هامشًا عاديًّا.
# ٢) تذييل صفحات البطاقات: السطر «دليل المعلم الألمعي · الصف … · عنوان الحصة · بطاقات الحصة» كله
#    (وكان في بعض الصفحات يتراكب مع تعليق البطاقة السفلى). تُحذف أوامر رسم نصه وحدها، ويبقى ما سواها.
# يعمل على الأصل (ls/fN/*.pdf) ونسخ التصميم الحالي (ls/fN/m2/*.pdf)، ويتحقق من كل صفحة: لا يبقى اسم الدليل،
# وما خارج المنطقتين المحذوفتين مطابق للأصل بكسله، وما جاور التذييل من نص البطاقات باقٍ كما هو.
import pymupdf, pikepdf, unicodedata, re, glob, os, sys, io, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rtl_pdfs import mul, widths, adv

N = lambda t: unicodedata.normalize('NFKC', t)
BRAND = re.compile(r'األلمعي|الألمعي|ألمعي')
K = 48 / 72  # دقة المقارنة بالبكسل


def rspans(page):
    return [sp for b in page.get_text('rawdict')['blocks'] for l in b.get('lines', []) for sp in l['spans']]


def txt(sp):
    return N(''.join(c['c'] for c in sp['chars']))


def hlines(page, W):
    """الخطوط الأفقية الطويلة في أعلى الصفحة: (y، السُّمك، x0، x1)."""
    out = []
    for d in page.get_drawings():
        for it in d['items']:
            if it[0] == 'l' and abs(it[1].y - it[2].y) < .3 and abs(it[2].x - it[1].x) > W * .5 and 54 < it[1].y < 72:
                out.append((round(it[1].y, 2), d.get('width') or 1, min(it[1].x, it[2].x), max(it[1].x, it[2].x)))
    return sorted(set(out))


def header_info(page, sps):
    """نص الترويسة (أعلى ٥٦ نقطة) والخط الملوّن تحتها، إن كان فيها اسم الدليل."""
    top = [sp for sp in sps if sp['bbox'][3] <= 56]
    if not any(BRAND.search(txt(sp)) for sp in top): return None
    W = page.rect.width
    tcut = max(sp['bbox'][3] for sp in top) + 1
    rest = [sp['bbox'][1] for sp in sps if sp['bbox'][3] > 56]
    if rest and min(rest) <= tcut + .2: raise RuntimeError('content too close to header text: %.2f' % min(rest))
    rules = [r for r in hlines(page, W) if r[1] >= 1]
    if not rules: raise RuntimeError('header rule not found')
    ry, rw, x0, x1 = rules[0]
    rr = pymupdf.Rect(x0 - 1.5, ry - rw / 2 - .35, x1 + 1.5, ry + rw / 2 + .35)
    # لا رسم آخر داخل مستطيل الخط إلا الخط نفسه
    for d in page.get_drawings():
        r = d['rect']
        if rr.contains(r) and not (abs(r.y0 - ry) < .3 and abs(r.y1 - ry) < .3): raise RuntimeError('other drawing inside the rule box')
    return {'tcut': tcut, 'rule': rr, 'mask': max(tcut, rr.y1)}


def footer_info(page, sps):
    """سطر التذييل الذي فيه اسم الدليل: خط أساسه وامتداده."""
    fs = [sp for sp in sps if 765 <= sp['bbox'][1] <= 795 and 7 <= sp['size'] <= 9 and BRAND.search(txt(sp))]
    if not fs: return None
    base = statistics.median(c['origin'][1] for sp in fs for c in sp['chars'])
    # أجزاء السطر نفسه: على خط الأساس نفسه، ومتصلة بما فيه اسم الدليل (لا تعليق بطاقة بعيد على الخط نفسه)
    line = list(fs); grow = True
    while grow:
        grow = False; x0 = min(sp['bbox'][0] for sp in line); x1 = max(sp['bbox'][2] for sp in line)
        for sp in sps:
            if sp in line or not 7 <= sp['size'] <= 9 or not sp['chars']: continue
            if abs(statistics.median(c['origin'][1] for c in sp['chars']) - base) < .35 and sp['bbox'][2] > x0 - 4 and sp['bbox'][0] < x1 + 4:
                line.append(sp); grow = True
    return {'base': base, 'x0': min(sp['bbox'][0] for sp in line), 'x1': max(sp['bbox'][2] for sp in line),
            'y0': min(sp['bbox'][1] for sp in line), 'y1': max(sp['bbox'][3] for sp in line),
            'text': ' '.join(txt(sp) for sp in line)}


def textops(page):
    """كل أمر رسم نص (Tj/TJ): رقمه في المحتوى، وخط أساسه وامتداده الأفقي في إحداثيات الصفحة."""
    fonts = {k: widths(v) for k, v in page.Resources.get('/Font', {}).items()}
    ops = pikepdf.parse_content_stream(page); out = []
    ctm, stack = (1, 0, 0, 1, 0, 0), []
    ts = {'fs': 0, 'tc': 0, 'tw': 0, 'th': 1, 'tl': 0, 'font': None}; tm = lm = (1, 0, 0, 1, 0, 0); blk = -1
    for i, (o_, op) in enumerate(ops):
        o = str(op)
        if o == 'q': stack.append(ctm)
        elif o == 'Q': ctm = stack.pop() if stack else ctm
        elif o == 'cm': ctm = mul(tuple(float(x) for x in o_), ctm)
        elif o == 'BT': tm = lm = (1, 0, 0, 1, 0, 0); blk += 1
        elif o == 'Tf': ts['font'] = str(o_[0]); ts['fs'] = float(o_[1])
        elif o == 'Tc': ts['tc'] = float(o_[0])
        elif o == 'Tw': ts['tw'] = float(o_[0])
        elif o == 'Tz': ts['th'] = float(o_[0]) / 100
        elif o == 'TL': ts['tl'] = float(o_[0])
        elif o in ('Td', 'TD'):
            tx, ty = float(o_[0]), float(o_[1])
            if o == 'TD': ts['tl'] = -ty
            lm = mul((1, 0, 0, 1, tx, ty), lm); tm = lm
        elif o == 'Tm': lm = tm = tuple(float(x) for x in o_)
        elif o == 'T*': lm = mul((1, 0, 0, 1, 0, -ts['tl']), lm); tm = lm
        elif o in ("'", '"'): raise RuntimeError('unsupported text operator')
        elif o in ('Tj', 'TJ'):
            fw = fonts.get(ts['font']); w = 0.0
            if fw:
                if o == 'Tj': w = adv(o_[0], fw, ts)
                else:
                    for el in o_[0]:
                        w += adv(el, fw, ts) if isinstance(el, pikepdf.String) else -float(el) / 1000 * ts['fs'] * ts['th']
            m = mul(tm, ctm); x0 = m[4]; x1 = m[4] + w * m[0]
            out.append({'i': i, 'b': blk, 'y': m[5], 'x0': min(x0, x1), 'x1': max(x0, x1), 'ok': bool(fw) and abs(m[1]) < 1e-6 and abs(m[2]) < 1e-6})
            tm = mul((1, 0, 0, 1, w, 0), tm)
    return ops, out


def drop_footers(data, plan):
    pdf = pikepdf.open(io.BytesIO(data))
    for pi, F in plan.items():
        page = pdf.pages[pi]; H = float(page.MediaBox[3]); yb = H - F['base']
        ops, tos = textops(page)
        inx = lambda t: t['x1'] > F['x0'] - 1.5 and t['x0'] < F['x1'] + 1.5
        main = [t for t in tos if abs(t['y'] - yb) < .35 and inx(t)]
        if not main: raise RuntimeError('footer text not found on page %d' % (pi + 1))
        # كتل نص التذييل كلها: فيها السطر نفسه، وحركاته (التشكيل) بإزاحة رأسية صغيرة وعرض صفري
        bs = {t['b'] for t in main}; kill = set()
        for t in tos:
            if t['b'] not in bs: continue
            if t in main or (t['x1'] - t['x0'] < 1 and abs(t['y'] - yb) < 4 and inx(t)): kill.add(t['i'])
            else: raise RuntimeError('footer block holds other text on page %d' % (pi + 1))
        if any(not t['ok'] for t in tos if t['i'] in kill): raise RuntimeError('footer text not measurable on page %d' % (pi + 1))
        # كتلة فيها حركات وحدها قرب التذييل (لا يُعرف أهي منه أم من تعليق بطاقة): تُراجَع باليد
        for b in {t['b'] for t in tos} - bs:
            tb = [t for t in tos if t['b'] == b]
            if all(t['x1'] - t['x0'] < 1 for t in tb) and any(abs(t['y'] - yb) < 4 and inx(t) for t in tb):
                raise RuntimeError('separate mark block near the footer on page %d' % (pi + 1))
        page.Contents = pdf.make_stream(pikepdf.unparse_content_stream([it for i, it in enumerate(ops) if i not in kill]))
    out = io.BytesIO(); pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    return out.getvalue()


def strip(path):
    src = open(path, 'rb').read(); doc = pymupdf.open(stream=src, filetype='pdf')
    heads, foots = {}, {}
    for pi, page in enumerate(doc):
        sps = rspans(page)
        h = header_info(page, sps); f = footer_info(page, sps)
        if f: foots[pi] = f
        if h:
            heads[pi] = h; W = page.rect.width
            page.add_redact_annot(pymupdf.Rect(0, 0, W, h['tcut']))  # نص الترويسة
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE, text=pymupdf.PDF_REDACT_TEXT_REMOVE)
            page.add_redact_annot(h['rule'])  # الخط الملوّن وحده، بلا مساس بأي نص
            page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_COVERED, text=pymupdf.PDF_REDACT_TEXT_NONE)
    if not heads and not foots: return None
    data = doc.tobytes(garbage=3, deflate=True); doc.close()
    if foots: data = drop_footers(data, foots)
    check(src, data, heads, foots)
    return data, len(heads), len(foots)


def check(src, data, heads, foots):
    a = pymupdf.open(stream=src, filetype='pdf'); b = pymupdf.open(stream=data, filetype='pdf')
    if len(a) != len(b): raise RuntimeError('page count changed')
    for pi in range(len(a)):
        pa, pb = a[pi], b[pi]; sb = rspans(pb)
        if any(BRAND.search(txt(sp)) for sp in sb): raise RuntimeError('brand left on page %d' % (pi + 1))
        rows = []
        if pi in heads:
            H = heads[pi]
            if any(sp['bbox'][3] <= H['tcut'] for sp in sb): raise RuntimeError('header text left on page %d' % (pi + 1))
            if any(abs(r[0] - (H['rule'].y0 + H['rule'].y1) / 2) < .3 for r in hlines(pb, pb.rect.width)): raise RuntimeError('header rule left on page %d' % (pi + 1))
            rows.append((0, int(H['mask'] * K) + 2))
        if pi in foots:
            F = foots[pi]
            infoot = lambda sp: abs(statistics.median(c['origin'][1] for c in sp['chars']) - F['base']) < .35 and sp['bbox'][2] > F['x0'] - 1 and sp['bbox'][0] < F['x1'] + 1
            if any(sp['chars'] and infoot(sp) for sp in sb): raise RuntimeError('footer left on page %d' % (pi + 1))
            # نص البطاقات المجاور للتذييل (إن وُجد) باقٍ بنصه وموضعه؛ ولا تدخل المقارنةَ حركاتُ التذييل نفسه (قطع من حرف أو حرفين داخل سطره)
            mark = lambda sp: len(sp['chars']) <= 3 and sp['bbox'][0] >= F['x0'] - 1 and sp['bbox'][2] <= F['x1'] + 1 and sp['bbox'][1] >= F['y0'] - 4 and sp['bbox'][3] <= F['y1'] + 4
            near = lambda sps: sorted((round(sp['bbox'][0], 1), round(sp['bbox'][1], 1), txt(sp)) for sp in sps
                                      if sp['chars'] and sp['bbox'][3] > F['y0'] - 12 and sp['bbox'][1] < F['y1'] + 12 and not infoot(sp) and not mark(sp))
            if near(rspans(pa)) != near(sb): raise RuntimeError('text near the footer changed on page %d' % (pi + 1))
            r0, r1 = int((F['y0'] - 1) * K) - 1, int((F['y1'] + 1) * K) + 2; rows.append((r0, r1))
            # إن لم يكن في منطقة التذييل غيرُه في الأصل، فلا يبقى فيها بعد الحذف أي أثر (ولا حركة)
            zone = pymupdf.Rect(F['x0'] - 2, F['y0'] - 1, F['x1'] + 2, F['y1'] + 1)
            alone = not any(pymupdf.Rect(sp['bbox']).intersects(zone) and not infoot(sp) and not mark(sp) for sp in rspans(pa) if sp['chars']) \
                and not any(d['rect'].intersects(zone) for d in pa.get_drawings())
            if alone:
                z = pb.get_pixmap(dpi=96, clip=zone)
                if any(v != 255 for v in z.samples): raise RuntimeError('footer trace left on page %d' % (pi + 1))
        ia = pa.get_pixmap(dpi=48); ib = pb.get_pixmap(dpi=48)
        if (ia.width, ia.height) != (ib.width, ib.height): raise RuntimeError('page size changed')
        ma, mb, st = ia.samples_mv, ib.samples_mv, ia.stride
        for y in range(ia.height):
            if any(r0 <= y <= r1 for r0, r1 in rows): continue
            if ma[y * st:(y + 1) * st] != mb[y * st:(y + 1) * st]: raise RuntimeError('page %d changed outside the stripped areas (row %d)' % (pi + 1, y))


if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob('ls/f[6-9]/*.pdf') + glob.glob('ls/f[6-9]/m2/*.pdf'))
    th = tf = n = 0
    for f in files:
        r = strip(f)
        if not r: continue
        data, h, ft = r; tmp = f + '.tmp'; open(tmp, 'wb').write(data); os.replace(tmp, f); th += h; tf += ft; n += 1
    print('files', n, 'header pages', th, 'card footers', tf)
