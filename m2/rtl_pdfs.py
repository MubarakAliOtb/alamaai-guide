# محاذاة النصوص من اليمين في التحاضير الكتابية للنظام الحالي (ls/fN/m2/*.pdf)، بعد recolor_pdfs.py وpdf_digits.py.
# كل سطر في خلية جدول كان في الوسط أو إلى اليسار يُزاح إلى يمين خليته بالهامش نفسه الذي في الأسطر اليمنى،
# وتذييل الصفحة الذي في اليسار يُنقل إلى اليمين. لا يتغير نص ولا خط: يُلفّ كل سطر بإزاحة أفقية (cm) فقط.
# لا يُمسّ ما ليس في خلية (كالأرقام داخل الدوائر)، ولا سطر يشاركه في كتلته النصية سطر آخر.
import pikepdf, pymupdf, glob, sys, statistics

def mul(m, n):
    a, b, c, d, e, f = m; A, B, C, D, E, F = n
    return (a * A + b * C, a * B + b * D, c * A + d * C, c * B + d * D, e * A + f * C + E, e * B + f * D + F)

def widths(font):
    if str(font.get('/Subtype')) == '/Type0':
        df = font.DescendantFonts[0]; dw = float(df.get('/DW', 1000)); W = {}; arr = list(df.get('/W', [])); i = 0
        while i < len(arr):
            c = int(arr[i]); nxt = arr[i + 1]
            if isinstance(nxt, pikepdf.Array):
                for k, w in enumerate(nxt): W[c + k] = float(w)
                i += 2
            else:
                for k in range(c, int(nxt) + 1): W[k] = float(arr[i + 2])
                i += 3
        return 2, W, dw
    fc = int(font.get('/FirstChar', 0))
    return 1, {fc + k: float(w) for k, w in enumerate(font.get('/Widths', []))}, 0.0

def adv(s, fw, ts):
    n, W, dw = fw; b = bytes(s)
    codes = [b[i] * 256 + b[i + 1] for i in range(0, len(b) - 1, 2)] if n == 2 else list(b)
    tot = 0.0
    for c in codes:
        tot += (W.get(c, dw) / 1000 * ts['fs'] + ts['tc'] + (ts['tw'] if n == 1 and c == 32 else 0)) * ts['th']
    return tot

def portions(page):
    """كل أمر عرض نص: موضعه وعرضه في إحداثيات الصفحة، ورقم كتلته BT."""
    fonts = {k: widths(v) for k, v in page.Resources.get('/Font', {}).items()}
    ops = pikepdf.parse_content_stream(page)
    out, blocks = [], []
    ctm, stack = (1, 0, 0, 1, 0, 0), []
    ts = {'fs': 0, 'tc': 0, 'tw': 0, 'th': 1, 'tl': 0, 'font': None}
    art = []  # نوع المحتوى المعلَّم (Artifact/Pagination أو غيره)
    tm = lm = (1, 0, 0, 1, 0, 0); bi = -1
    for i, (o_, op) in enumerate(ops):
        o = str(op)
        if o == 'q': stack.append(ctm)
        elif o == 'Q': ctm = stack.pop() if stack else ctm
        elif o == 'cm': ctm = mul(tuple(float(x) for x in o_), ctm)
        elif o in ('BDC', 'BMC'):
            tag = str(o_[0]); pag = False
            if o == 'BDC' and isinstance(o_[1], pikepdf.Dictionary): pag = str(o_[1].get('/Type', '')) == '/Pagination'
            art.append((tag, pag))
        elif o == 'EMC': art and art.pop()
        elif o == 'BT': tm = lm = (1, 0, 0, 1, 0, 0); bi = len(blocks); blocks.append({'start': i, 'end': None, 'ctm': ctm, 'por': []})
        elif o == 'ET':
            if bi >= 0: blocks[bi]['end'] = i
            bi = -1
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
        elif o in ('Tj', 'TJ') and bi >= 0:
            fw = fonts.get(ts['font'])
            if not fw: blocks[bi]['bad'] = True; continue
            w = 0.0
            if o == 'Tj': w = adv(o_[0], fw, ts)
            else:
                for el in o_[0]:
                    if isinstance(el, pikepdf.String): w += adv(el, fw, ts)
                    else: w -= float(el) / 1000 * ts['fs'] * ts['th']
            m = mul(tm, ctm)
            if abs(m[1]) > 1e-6 or abs(m[2]) > 1e-6: blocks[bi]['bad'] = True
            x0 = m[4]; x1 = m[4] + w * m[0]; y = m[5]
            p = {'x0': min(x0, x1), 'x1': max(x0, x1), 'y': y, 'blk': bi, 'pag': any(pg for _, pg in art), 'art': any(t == '/Artifact' for t, _ in art)}
            out.append(p); blocks[bi]['por'].append(p)
            tm = mul((1, 0, 0, 1, w, 0), tm)
    return ops, out, blocks

def vsegs(doc_page, H):
    segs = []
    for dr in doc_page.get_drawings():
        for it in dr['items']:
            if it[0] == 'l':
                p1, p2 = it[1], it[2]
                if abs(p1.x - p2.x) < .4 and abs(p1.y - p2.y) > 3: segs.append((p1.x, H - max(p1.y, p2.y), H - min(p1.y, p2.y)))
            elif it[0] == 're':
                r = it[1]
                if r.height > 3:
                    if r.width < 1.6: segs.append(((r.x0 + r.x1) / 2, H - r.y1, H - r.y0))
                    else: segs += [(r.x0, H - r.y1, H - r.y0), (r.x1, H - r.y1, H - r.y0)]
    return segs

def cell_of(p, segs):
    L = [x for x, a, b in segs if a - 1 <= p['y'] <= b + 1 and x <= p['x0'] + .6]
    R = [x for x, a, b in segs if a - 1 <= p['y'] <= b + 1 and x >= p['x1'] - .6]
    return (round(max(L), 2), round(min(R), 2)) if L and R else None

def fix(path, dry=False):
    pdf = pikepdf.open(path, allow_overwriting_input=True); doc = pymupdf.open(path); moved = skipped = 0
    for pi, page in enumerate(pdf.pages):
        H = float(page.MediaBox[3]); Wd = float(page.MediaBox[2])
        ops, por, blocks = portions(page)
        if not por: continue
        segs = vsegs(doc[pi], H)
        # الكتلة النصية سطر واحد بحركاته (التشكيل يُرسم بإزاحة رأسية صغيرة داخل الكتلة نفسها)
        lines = {}
        for b, B in enumerate(blocks):
            P = B['por']
            if not P: continue
            main = [q for q in P if q['x1'] - q['x0'] > .5] or P
            base = statistics.median(q['y'] for q in main)
            B['multi'] = any(abs(q['y'] - base) > 3 for q in P if q['x1'] - q['x0'] > 6) or any(abs(q['y'] - base) > 16 for q in P)
            B['x0'] = min(q['x0'] for q in P); B['x1'] = max(q['x1'] for q in P)
            B['pag'] = any(q['pag'] for q in P); art = any(q['art'] for q in P)
            c = None if art else cell_of({'x0': B['x0'], 'x1': B['x1'], 'y': base}, segs)
            key = ('cell', c, round(base * 2) / 2) if c else ('free', round(base * 2) / 2)
            lines.setdefault(key, []).append(b)
        gaps = [k[1][1] - max(blocks[b]['x1'] for b in v) for k, v in lines.items() if k[0] == 'cell']
        near = [g for g in gaps if 1 < g < 12]
        pad = statistics.median(near) if near else 5.4
        shifts = {}
        for k, v in lines.items():
            x0 = min(blocks[b]['x0'] for b in v); x1 = max(blocks[b]['x1'] for b in v)
            if k[0] == 'cell':
                L, R = k[1]; gR = R - x1; gL = x0 - L
                if gR <= pad + 1.2: continue
                if abs(gL - gR) <= 2.2 or gL <= pad + 1.2: dx = (R - pad) - x1
                else: continue
            else:
                # تذييل الصفحة في اليسار (محتوى ترقيم الصفحات أسفلها) يُنقل إلى اليمين
                if not all(blocks[b]['pag'] for b in v) or k[1] > H * .14 or x0 > Wd * .35 or x1 > Wd * .6: continue
                dx = (Wd - x0) - x1
            if any(blocks[b].get('bad') or blocks[b]['multi'] for b in v): skipped += 1; continue
            for b in v: shifts[b] = dx
        if not shifts: continue
        new = []; starts = {blocks[b]['start']: b for b in shifts}; ends = {blocks[b]['end']: b for b in shifts}
        for i, item in enumerate(ops):
            if i in starts:
                b = starts[i]; a = blocks[b]['ctm'][0] or 1
                new.append(([], pikepdf.Operator('q')))
                new.append(([1, 0, 0, 1, pikepdf.Object.parse(b'%.3f' % (shifts[b] / a)), 0], pikepdf.Operator('cm')))
            new.append(item)
            if i in ends: new.append(([], pikepdf.Operator('Q')))
        moved += len(shifts)
        if not dry: page.Contents = pdf.make_stream(pikepdf.unparse_content_stream(new))
    if not dry and moved: pdf.save(path)
    return moved, skipped

if __name__ == '__main__':
    files = sys.argv[1:] or sorted(glob.glob('ls/f[6-9]/m2/*.pdf'))
    tm = ts = 0
    for f in files:
        m, s = fix(f); tm += m; ts += s
    print('files', len(files), 'moved blocks', tm, 'skipped lines', ts)
