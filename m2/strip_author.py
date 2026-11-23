# يحذف من الملفات التي يطبعها المعلمون ما يحمل اسم معدّ الدليل أو يحيل إلى مؤلفاته، حذفًا حقيقيًّا على مستوى الحرف
# (m2/textedit.py)، ويتحقق أن ما سواه مطابق للأصل بكسله:
#   lessons: التحاضير المصوّرة (ls/fN/*.pdf وls/fN/m2/*.pdf): المرجع الأخير «على بصيرة»: … (الفصل ن) في فقرة مراجع المعلم،
#            مع الفاصلة المنقوطة قبله. يبقى ما قبله في السطر في موضعه (السطر من اليمين، والمحذوف في طرفه الأيسر).
#   kits:    حقائب الحلول البصرية (vsc/kits/*.pdf): سطر «إعداد وتصميم…» وتوقيع الشعار بجانبه في كل صفحة وفي الغلاف والشهادة،
#            والإحالات داخل النص (العتيبي، ٢٠٢٦أ/ب) ويُسدّ مكانها، ومدخلا المرجعين في قائمة المراجع وتُرفع المداخل التالية،
#            والمؤلف في خصائص الملف. والعروض (k*-deck.pdf) كذلك: سطر الإعداد، والشعار في الغلاف والفواصل، والإحالة.
import pikepdf, pymupdf, unicodedata, re, glob, os, sys, io, statistics, hashlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import textedit as T

N = lambda t: unicodedata.normalize('NFKC', t)
WORD = r'ب[\sصريى]{2,5}ة'  # «بصيرة» (قد تتبدّل حروفها المتلاصقة في ترتيب العرض)
BASEERA = re.compile(r'(على|عىل|علي)\s*' + WORD)
ALA_END = re.compile(r'[«»"“”]\s*(على|عىل|علي)\s*$')
WORD_START = re.compile(r'^\s*' + WORD)
NAME = re.compile(r'ال\s*ع\s*ت\s*ي?\s*ي?\s*ب\s*ي?(?!\s*ا\s*ت)')  # العتيبي (لا «العتبات»)
DIG = re.compile(r'[0-9٠-٩]')
PAREN = set('()[]﴾﴿')
SEMI = set('؛;')
SP = lambda c: not N(c['c']).strip()


def plines(page):
    """أسطر الصفحة: تُضم قطع السطر الواحد التي يفصلها pymupdf (كالأرقام والنص اللاتيني) إن اتصلت على خط الأساس نفسه."""
    frags = []
    for b in page.get_text('rawdict')['blocks']:
        for l in b.get('lines', []):
            ch = [c for sp in l['spans'] for c in sp['chars']]
            if ch: frags.append({'bbox': pymupdf.Rect(l['bbox']), 'base': statistics.median(c['origin'][1] for c in ch),
                                 'chars': ch, 'size': max(sp['size'] for sp in l['spans'])})
    frags.sort(key=lambda F: (round(F['base'], 1), F['bbox'].x0)); out = []
    for F in frags:
        G = out[-1] if out else None
        if G and abs(G['base'] - F['base']) < .5 and -1 < F['bbox'].x0 - G['bbox'].x1 < 1.5:
            G['bbox'] |= F['bbox']; G['chars'] += F['chars']; G['size'] = max(G['size'], F['size'])
        else: out.append(dict(F, chars=list(F['chars'])))
    for L in out:
        vis = sorted(L['chars'], key=lambda c: (-c['bbox'][0], -c['bbox'][2])); s = ''; idx = []
        for k, c in enumerate(vis):
            t = N(c['c']); s += t; idx += [k] * len(t)
        L.update(vis=vis, s=s, idx=idx)
    return out


def band(M, L, x0=None, x1=None, pad=2.5):
    """حروف النموذج في سطر pymupdf L، وبين x0 وx1 إن حُدّدا (بلا هامش)، وإلا السطر كله."""
    yb = M.H - L['base']
    if x0 is None: x0, x1 = L['bbox'].x0 - .6, L['bbox'].x1 + .6
    return M.glyphs_in(x0, x1, yb - pad, yb + pad)


def span(vis, ks):
    return min(vis[k]['bbox'][0] for k in ks) - .05, max(vis[k]['bbox'][2] for k in ks) + .05


def below(lines, L, k=1.9):
    """السطر الذي يلي L في العمود نفسه."""
    h = L['bbox'].height; best = None
    for M2 in lines:
        r = M2['bbox']
        if r.y0 < L['bbox'].y1 - 1 or r.y0 > L['bbox'].y1 + k * h: continue
        ov = min(r.x1, L['bbox'].x1) - max(r.x0, L['bbox'].x0)
        if ov < .4 * min(r.width, L['bbox'].width): continue
        if best is None or r.y0 < best['bbox'].y0: best = M2
    return best


def above(lines, L, k=1.9):
    h = L['bbox'].height; best = None
    for M2 in lines:
        r = M2['bbox']
        if r.y1 > L['bbox'].y0 + 1 or r.y1 < L['bbox'].y0 - k * h: continue
        ov = min(r.x1, L['bbox'].x1) - max(r.x0, L['bbox'].x0)
        if ov < .4 * min(r.width, L['bbox'].width): continue
        if best is None or r.y1 > best['bbox'].y1: best = M2
    return best


# ===================== التحاضير: «على بصيرة» =====================
GUIL = set('«»"“”')


def glyph_of(M, L, c):
    """حرف النموذج المقابل لحرف pymupdf c في السطر L."""
    ks = band(M, L, c['bbox'][0] - .05, c['bbox'][2] + .05)
    ks = [k for k in ks if abs(M.runs[k[0]]['glyphs'][k[1]]['x0'] - c['origin'][0]) < .25]
    if not ks: raise RuntimeError('glyph not found for ' + repr(c['c']))
    return ks[0]


def put_period(M, E, L, dot, line, vis, upto):
    """نقطة آخر الجملة: تُكتب يسار آخر حرف باقٍ في السطر (بالخط نفسه)."""
    keep = [c for k, c in enumerate(vis) if k < upto and not SP(c)]
    if not keep: raise RuntimeError('nothing left to end with a period')
    last = keep[-1]; g = glyph_of(M, L, last); src = dot
    r = M.runs[src[0]]; w = r['glyphs'][src[1]]['a'] * r['sx']
    E.insert_glyph(src, M.runs[g[0]]['glyphs'][g[1]]['x0'] - w, g)


def lesson_page(M, page, log):
    lines = plines(page); E = T.Edit(M); touched = []; done = set()
    for L in lines:
        if id(L) in done: continue
        mt = BASEERA.search(L['s']); split = False
        if not (mt and 'ص' in mt.group(0) and 'ر' in mt.group(0)):
            mt = ALA_END.search(L['s']); nx = below(lines, L) if mt else None
            w = WORD_START.search(nx['s']) if nx else None
            if not (w and 'ص' in w.group(0) and 'ر' in w.group(0)): continue
            split = True  # «على» في آخر السطر و«بصيرة» في أول الذي يليه
        vis = L['vis']; cs = L['idx'][mt.start(1) if split else mt.start()]
        j = nonsp(vis, cs - 1, -1); op = N(vis[j]['c']) if j is not None else ''
        rows = [L]; done.add(id(L)); line = band(M, L)
        if op in PAREN:
            # (ب) إحالة بين قوسين: «(على بصيرة: …)»
            c = next((k for k in range(cs + 1, len(vis)) if N(vis[k]['c']) in PAREN), None)
            first = nonsp(vis, j - 1, -1) is None  # القوس أول السطر (يمينه)
            if c is not None:
                ks = list(range(j, c + 1)); d = nonsp(vis, c + 1, 1)
                if first and d is not None and N(vis[d]['c']) in '.۔':  # «(…). الأدوات» في أول السطر: النقطة تنتقل إلى آخر السطر السابق
                    ks += list(range(c + 1, d + 1)); e2 = d + 1
                    while e2 < len(vis) and SP(vis[e2]): ks.append(e2); e2 += 1
                    dot = glyph_of(M, L, vis[d]); P = above(lines, L)
                    if not P: raise RuntimeError('no line above for the period')
                    put_period(M, E, P, dot, band(M, P), P['vis'], len(P['vis'])); rows.append(P)
                elif j - 1 >= 0 and SP(vis[j - 1]): ks.append(j - 1)
                elif c + 1 < len(vis) and SP(vis[c + 1]): ks.append(c + 1)
                E.close_gap_rtl(line, set(band(M, L, *span(vis, ks))))
            else:  # تنكسر الإحالة: بقيتها و«).» في أول السطر التالي
                ks = list(range(j, len(vis))) + ([j - 1] if j - 1 >= 0 and SP(vis[j - 1]) else [])
                E.delete(band(M, L, *span(vis, ks)))
                Q = below(lines, L)
                if not Q: raise RuntimeError('citation continues but no next line')
                qv = Q['vis']; c2 = next((k for k, ch in enumerate(qv) if N(ch['c']) in PAREN), None)
                if c2 is None: raise RuntimeError('closing paren not found on the next line')
                ks2 = list(range(0, c2 + 1)); d = nonsp(qv, c2 + 1, 1)
                if d is not None and N(qv[d]['c']) in '.۔':
                    ks2 += list(range(c2 + 1, d + 1)); e2 = d + 1
                    while e2 < len(qv) and SP(qv[e2]): ks2.append(e2); e2 += 1
                    put_period(M, E, L, glyph_of(M, Q, qv[d]), line, vis, min(ks))
                E.close_gap_rtl(band(M, Q), set(band(M, Q, *span(qv, ks2)))); rows.append(Q); done.add(id(Q))
            touched += rows; log.append('cite: ' + L['s'][max(0, mt.start() - 30):][:80]); continue
        if op not in GUIL: raise RuntimeError('unexpected text before the item: ' + L['s'][:80])
        # (أ) مرجع في قائمة مراجع المعلم: «على بصيرة»: … (الفصل ن)
        k = nonsp(vis, j - 1, -1); sep = N(vis[k]['c']) if k is not None else ''
        # أين ينتهي؟ أول «؛» بعد رقم الفصل في السطر نفسه (إن كان بعده مرجع آخر)
        seen = False; end = None
        for q in range(cs, len(vis)):
            ch = N(vis[q]['c'])
            if DIG.match(ch): seen = True
            elif seen and ch in SEMI: end = q; break
        if end is not None:  # أول المراجع أو وسطها: المرجع و«؛» بعده ومسافة
            ks = list(range(j, end + 1)) + ([end + 1] if end + 1 < len(vis) and SP(vis[end + 1]) else [])
            E.close_gap_rtl(line, set(band(M, L, *span(vis, ks))))
            touched += rows; log.append('first: ' + L['s'][:80]); continue
        if sep in SEMI:  # آخر المراجع: من «؛» قبله إلى آخر السطر
            item = vis[cs:]; E.delete(band(M, L, L['bbox'].x0 - .05, vis[k]['bbox'][2] + .05))
        elif k is None:  # يبدأ المرجع السطرَ: «؛» في آخر السطر السابق
            P = above(lines, L)
            if not P: raise RuntimeError('item starts a line without a line above')
            pv = [c for c in P['vis'] if not SP(c)]
            if not pv or N(pv[-1]['c']) not in SEMI: raise RuntimeError('no separator before the item')
            E.delete(band(M, P, pv[-1]['bbox'][0] - .05, pv[-1]['bbox'][2] + .05)); rows.append(P)
            E.delete(line); item = vis
        else:
            raise RuntimeError('unexpected text before the item: ' + L['s'][:80])
        ended = bool(DIG.search(N(''.join(c['c'] for c in item))))
        cur = L; n = 0
        while not ended:
            nx = below(lines, cur)
            if not nx or n >= 3: raise RuntimeError('item end not found')
            E.delete(band(M, nx)); rows.append(nx); done.add(id(nx)); n += 1; cur = nx
            ended = bool(DIG.search(nx['s']))
        touched += rows; log.append('last: ' + L['s'][-70:])
    if touched: E.apply()
    return touched


# ===================== الحقائب =====================
def find_name(L):
    """مدى الإحالة في السطر بترتيب العرض (من اليمين): بداية الاسم وحتى حرف السنة (أ/ب) إن وُجد."""
    m = NAME.search(L['s'])
    if not m: return None
    s0 = L['idx'][m.start()]; s1 = L['idx'][m.end() - 1]
    vis = L['vis']; j = s1 + 1
    while j < len(vis) and SP(vis[j]): j += 1
    if j < len(vis) and N(vis[j]['c']) in '،,': j += 1
    while j < len(vis) and SP(vis[j]): j += 1
    k = j
    while k < len(vis) and DIG.match(N(vis[k]['c'])): k += 1
    if k == j: return None  # ليست إحالة (لا سنة بعد الاسم)
    if k < len(vis) and N(vis[k]['c']) in 'أاب': k += 1
    return s0, k - 1


def nonsp(vis, j, step):
    while 0 <= j < len(vis) and SP(vis[j]): j += step
    return j if 0 <= j < len(vis) else None


def kit_page(M, page, log, logo_hashes, deck=False):
    lines = plines(page); E = T.Edit(M); rows = []; regions = []; done = set()
    doc = page.parent
    # ١) سطر الإعداد والتوقيع بجانبه
    credits = [L for L in lines if 'إعداد وتصميم' in L['s'] or ('إعداد' in L['s'] and NAME.search(L['s']) and 'مبارك' in L['s'])]
    for L in credits:
        E.delete(band(M, L)); rows.append(L); done.add(id(L)); log.append('credit: ' + L['s'][:70])
    # الصور الصغيرة: توقيع الشعار (بصمته معروفة، أو صغيرة بجانب سطر الإعداد)
    for info in page.get_image_info(hashes=True, xrefs=True):
        r = pymupdf.Rect(info['bbox'])
        if r.width > 70 or r.height > 70: continue
        cy = (r.y0 + r.y1) / 2
        near = any((abs(cy - (L['bbox'].y0 + L['bbox'].y1) / 2) < 25 and -90 < L['bbox'].x0 - r.x1 < 40) or  # بجانب سطر الإعداد
                   (abs(cy - (L['bbox'].y0 + L['bbox'].y1) / 2) < 40 and r.x1 < page.rect.width * .3)  # أو في طرف السطر نفسه الأيسر (الغلاف)
                   for L in credits)
        known = info.get('digest') and info['digest'].hex() in logo_hashes
        if near or known:
            if near and info.get('digest'): logo_hashes.add(info['digest'].hex())
            ops = M.image_draws((r.x0, M.H - r.y1, r.x1, M.H - r.y0))
            if not ops: raise RuntimeError('logo draw not found')
            for i in ops: E.drop_op(i)
            regions.append(r); log.append('logo at %s' % [round(v) for v in r])
    # ٢) مدخلا المرجعين في قائمة المراجع: يُحذفان وتُرفع المداخل التالية
    refs = [L for L in lines if NAME.search(L['s']) and ('منصة رقمية' in L['s'] or 'حقيبة تدريبية' in L['s'])]
    if refs:
        refs.sort(key=lambda L: L['bbox'].y0)
        for L in refs: E.delete(band(M, L)); rows.append(L); done.add(id(L)); log.append('ref: ' + L['s'][:70])
        top = refs[0]['bbox'].y0; bot = refs[-1]['bbox'].y1
        nxt = [L for L in lines if L['bbox'].y0 > bot - .5 and L['bbox'].y1 < 795 and id(L) not in done]
        if nxt:
            gap = min(L['bbox'].y0 for L in nxt) - top
            ylo, yhi = M.H - 795, M.H - bot  # إحداثيات PDF للمنطقة التي تُرفع
            moved = set()
            for ri, r in enumerate(M.runs):
                if ylo < r['y'] < yhi: moved.add(r['b'])
            for b in moved:
                ys = [r['y'] for r in M.runs if r['b'] == b]
                if not all(ylo < y < yhi for y in ys): raise RuntimeError('text block crosses the moved region')
                E.move_block(b, gap)
            regions.append(pymupdf.Rect(0, top - 2, page.rect.width, 795)); log.append('moved %d blocks up by %.1f' % (len(moved), gap))
    # ٣) الإحالات داخل النص
    for L in lines:
        if id(L) in done or not NAME.search(L['s']): continue
        f = find_name(L)
        if not f:
            if 'مبارك' in L['s']: raise RuntimeError('name without year: ' + L['s'][:60])
            continue
        vis = L['vis']; s0, s1 = f
        rest = [c for k, c in enumerate(vis) if (k < s0 or k > s1) and not SP(c)]
        if all(N(c['c']) in PAREN | set('.،,؛;') for c in rest):
            # الإحالة وحدها في سطرها (منكسرة على ثلاثة أسطر في صناديق الاقتباس): يُحذف سطرها، و«(» في آخر السطر قبلها،
            # وسطر «).» بعدها؛ والنقطة التي ظهرت في أول السطر قبلها (يمينه) بدل آخره تُحذف ويُسدّ مكانها.
            E.delete(band(M, L)); rows.append(L); done.add(id(L)); P = above(lines, L)
            if P and id(P) not in done:
                pv = P['vis']; lj = nonsp(pv, len(pv) - 1, -1)
                if lj is not None and N(pv[lj]['c']) in PAREN:
                    ks = [lj] + ([lj - 1] if lj - 1 >= 0 and SP(pv[lj - 1]) else [])
                    E.delete(band(M, P, *span(pv, ks)))
                rj = nonsp(pv, 0, 1)
                if rj is not None and N(pv[rj]['c']) in '.۔':
                    ks = [rj]; e2 = rj + 1
                    while e2 < len(pv) and SP(pv[e2]): ks.append(e2); e2 += 1
                    E.close_gap_rtl(band(M, P), set(band(M, P, *span(pv, ks))))
                rows.append(P)
            Q = below(lines, L)
            if Q and id(Q) not in done and all(N(c['c']) in PAREN | set('.،,') for c in Q['vis'] if not SP(c)):
                E.delete(band(M, Q)); rows.append(Q); done.add(id(Q))
            log.append('cite-box: ' + (P['s'][:60] if P else '') + ' | ' + L['s'])
            continue
        r_ = nonsp(vis, s0 - 1, -1); l_ = nonsp(vis, s1 + 1, 1)
        rc = N(vis[r_]['c']) if r_ is not None else ''; lc = N(vis[l_]['c']) if l_ is not None else ''
        if lc in SEMI:  # أولى المراجع في القوس أو وسطها: الإحالة والفاصلة المنقوطة بعدها ومسافة
            ks = list(range(s0, l_ + 1)) + ([l_ + 1] if l_ + 1 < len(vis) and SP(vis[l_ + 1]) else [])
        elif rc in SEMI and lc in PAREN:  # آخرها: الفاصلة المنقوطة قبلها والمسافة والإحالة
            ks = list(range(r_, s1 + 1))
        elif rc in PAREN and (lc in PAREN or l_ is None):  # إحالة وحدها: القوسان وما بينهما ومسافة واحدة
            end = l_ if lc in PAREN else s1
            ks = list(range(r_, end + 1))
            if r_ - 1 >= 0 and SP(vis[r_ - 1]): ks.append(r_ - 1)
            elif end + 1 < len(vis) and SP(vis[end + 1]): ks.append(end + 1)
        else:
            raise RuntimeError('unexpected citation shape: ' + L['s'][:80])
        lo, hi = span(vis, ks); line = band(M, L)
        E.close_gap_rtl(line, set(band(M, L, lo, hi))); rows.append(L); done.add(id(L))
        left = [c for k, c in enumerate(vis) if k not in ks and not SP(c)]
        if left and all(N(c['c']) in '.،,؛;' for c in left): E.delete(line)  # لم يبق إلا علامة ترقيم
        log.append('cite: ' + L['s'][:90])
    if rows or regions: E.apply()
    return rows, regions


# ===================== التحقق =====================
def check(src, data, edits, pat):
    a = pymupdf.open(stream=src, filetype='pdf'); b = pymupdf.open(stream=data, filetype='pdf')
    if len(a) != len(b): raise RuntimeError('page count changed')
    for pi in range(len(a)):
        pa, pb = a[pi], b[pi]
        tb = N(pb.get_text())
        if pat.search(tb): raise RuntimeError('pattern left on page %d: %s' % (pi + 1, pat.search(tb).group(0)))
        rows, regions = edits.get(pi, ([], []))
        K = 48 / 72; ia = pa.get_pixmap(dpi=48); ib = pb.get_pixmap(dpi=48); st = ia.stride
        mask = [(int((L['bbox'].y0 - 3) * K) - 1, int((L['bbox'].y1 + 3) * K) + 1) for L in rows] + \
               [(int((r.y0 - 2) * K) - 1, int((r.y1 + 2) * K) + 1) for r in regions]
        for y in range(ia.height):
            if any(r0 <= y <= r1 for r0, r1 in mask): continue
            if ia.samples_mv[y * st:(y + 1) * st] != ib.samples_mv[y * st:(y + 1) * st]:
                raise RuntimeError('page %d changed outside the edited lines (row %d)' % (pi + 1, y))


def run_pdf(path, fn, pat, **kw):
    src = open(path, 'rb').read(); pdf = pikepdf.open(io.BytesIO(src)); doc = pymupdf.open(stream=src, filetype='pdf')
    edits = {}; log = []
    for pi, page in enumerate(doc):
        M = T.Model(pdf, pdf.pages[pi]); r = fn(M, page, log, **kw)
        rows, regions = r if isinstance(r, tuple) else (r, [])
        if rows or regions: edits[pi] = (rows, regions)
    if not edits and not kw.get('meta'): return None
    if kw.get('meta'):
        if '/Author' in pdf.docinfo: del pdf.docinfo['/Author']
        with pdf.open_metadata(set_pikepdf_as_editor=False) as meta:
            if 'dc:creator' in meta: del meta['dc:creator']
    out = io.BytesIO(); pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate)
    data = out.getvalue(); check(src, data, edits, pat)
    return data, edits, log


def save(path, data):
    tmp = path + '.tmp'; open(tmp, 'wb').write(data); os.replace(tmp, path)


LOGO_DIMS = ((300, 310), (134, 139))  # صورة التوقيع في الكتيّبات (300×310) وفي العروض (134×139)


def is_logo(x, dims=LOGO_DIMS, depth=0):
    """صورة التوقيع بأبعادها المعروفة، أو نموذج (Form) ليس فيه إلا رسمها."""
    st = str(x.get('/Subtype'))
    if st == '/Image': return (int(x.get('/Width', 0)), int(x.get('/Height', 0))) in dims
    if st != '/Form' or depth > 2: return False
    inner = dict(x.get('/Resources', {}).get('/XObject', {})); imgs = 0
    for o_, op in pikepdf.parse_content_stream(x):
        o = str(op)
        if o in ('Tj', 'TJ', "'", '"', 'BI', 'S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*', 'sh'): return False
        if o == 'Do':
            y = inner.get(str(o_[0]))
            if y is None or not is_logo(y, dims, depth + 1): return False
            imgs += 1
    return imgs > 0


def drop_logo_draws(path, dims=LOGO_DIMS):
    """يحذف كل رسم لصورة التوقيع بقي في المحتوى — كالتوقيع الذي يضعه قالب العرض في زاوية كل شريحة ولا نصّ بجواره —
    مع غلافه (q cm … Q وعلامة Artifact) إن لم يكن فيه غيره. ويُتحقق أن الصفحة لم تتغير إلا داخل موضع التوقيع."""
    src = open(path, 'rb').read(); pdf = pikepdf.open(io.BytesIO(src)); a = pymupdf.open(stream=src, filetype='pdf')
    owners = [(pi, p, p.Resources) for pi, p in enumerate(pdf.pages)] + \
             [(None, o, o.get('/Resources')) for o in pdf.objects if isinstance(o, pikepdf.Stream) and o.get('/Subtype') == '/Form']
    boxes = {}; n = 0
    for pi, owner, res in owners:
        xo = res.get('/XObject') if isinstance(res, pikepdf.Dictionary) else None
        names = {k for k, v in xo.items() if is_logo(v, dims)} if isinstance(xo, pikepdf.Dictionary) else set()
        if not names: continue
        ops = list(pikepdf.parse_content_stream(owner)); drop = set()
        for i, (o_, op) in enumerate(ops):
            if str(op) != 'Do' or str(o_[0]) not in names: continue
            lo = hi = i
            if 2 <= i < len(ops) - 1 and str(ops[i - 1][1]) == 'cm' and str(ops[i - 2][1]) == 'q' and str(ops[i + 1][1]) == 'Q':
                lo, hi = i - 2, i + 1
                if lo >= 1 and hi < len(ops) - 1 and str(ops[lo - 1][1]) == 'BMC' and str(ops[hi + 1][1]) == 'EMC': lo, hi = lo - 1, hi + 1
            drop.update(range(lo, hi + 1)); n += 1
        if not drop: continue
        data = pikepdf.unparse_content_stream([x for j, x in enumerate(ops) if j not in drop])
        if pi is None: owner.write(data)
        else:
            owner.obj.Contents = pdf.make_stream(data)
            xr = {v.objgen[0] for v in xo.values() if is_logo(v, dims) and v.is_indirect}
            boxes[pi] = [pymupdf.Rect(im['bbox']) for im in a[pi].get_image_info(xrefs=True) if im['xref'] in xr]
    if not n: return 0
    out = io.BytesIO(); pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate); data = out.getvalue()
    b = pymupdf.open(stream=data, filetype='pdf'); K = 72 / 72
    for i in range(len(a)):
        ia, ib = a[i].get_pixmap(dpi=72), b[i].get_pixmap(dpi=72)
        if ia.samples == ib.samples: continue
        if i not in boxes or not boxes[i]: raise RuntimeError('page %d changed without a signature draw' % (i + 1))
        allowed = [((r.x0 - 1.5) * K, (r.y0 - 1.5) * K, (r.x1 + 1.5) * K, (r.y1 + 1.5) * K) for r in boxes[i]]
        st, nc = ia.stride, ia.n
        for y in range(ia.height):
            ra, rb = ia.samples_mv[y * st:(y + 1) * st], ib.samples_mv[y * st:(y + 1) * st]
            if ra == rb: continue
            for x in range(ia.width):
                if ra[x * nc:(x + 1) * nc] != rb[x * nc:(x + 1) * nc] and not any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in allowed):
                    raise RuntimeError('page %d changed outside the signature box at (%d,%d)' % (i + 1, x, y))
    save(path, data); return n


def drop_unused_images(path, dims=LOGO_DIMS):
    """بعد حذف رسم التوقيع: يُحذف من الموارد كل مدخل يشير إلى صورة التوقيع (بأبعادها المعروفة، أو نموذج ليس فيه
    إلا هي) ولم يعد يرسمه شيء في الملف، حتى لا يبقى الشعار مخبوءًا فيه. ويُتحقق أن الصفحات تُرسم كما كانت تمامًا."""
    src = open(path, 'rb').read(); pdf = pikepdf.open(io.BytesIO(src)); n = 0
    logo = lambda x: is_logo(x, dims)
    # ما يُرسم من كل قاموس موارد: محتوى صاحبه (صفحة أو نموذج)، ومعه النماذج التي ليس لها موارد فترث موارده
    def used(stream, res, depth=0):
        names = set(); xo = dict(res.get('/XObject', {})) if res is not None else {}
        try: ops = pikepdf.parse_content_stream(stream)
        except Exception: return names
        for o_, op in ops:
            if str(op) == 'Do':
                nm = str(o_[0]); names.add(nm); x = xo.get(nm)
                if x is not None and x.get('/Subtype') == '/Form' and '/Resources' not in x and depth < 4: names |= used(x, res, depth + 1)
        return names
    groups = {}
    for page in pdf.pages:
        res = page.Resources; xo = res.get('/XObject')
        if not isinstance(xo, pikepdf.Dictionary): continue
        key = ('o', xo.objgen) if xo.is_indirect else (('o', res.objgen) if res.is_indirect else ('p', page.objgen))
        g = groups.setdefault(key, [xo, set()]); g[1] |= used(page, res)
    for obj in pdf.objects:
        if isinstance(obj, pikepdf.Stream) and (obj.get('/Subtype') == '/Form' or obj.get('/PatternType') == 1):
            res = obj.get('/Resources'); xo = res.get('/XObject') if isinstance(res, pikepdf.Dictionary) else None
            if not isinstance(xo, pikepdf.Dictionary): continue
            # نموذج يشارك الصفحات قاموس مواردها نفسه (كما يفعل LibreOffice) يدخل في مجموعتها لا في مجموعة مستقلة
            key = ('o', xo.objgen) if xo.is_indirect else (('o', res.objgen) if res.is_indirect else ('f', obj.objgen))
            g = groups.setdefault(key, [xo, set()]); g[1] |= used(obj, res)
    for xo, u in groups.values():
        for nm in list(xo.keys()):
            if nm not in u and logo(xo[nm]): del xo[nm]; n += 1
    out = io.BytesIO(); pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate); data = out.getvalue()
    a = pymupdf.open(stream=src, filetype='pdf'); b = pymupdf.open(stream=data, filetype='pdf')
    for i in range(len(a)):  # فرق التقريب ±1 مقبول (حذف صورة لها قناع يغيّر طريقة تركيب الصفحة في المحرّك)
        x, y = a[i].get_pixmap(dpi=40).samples, b[i].get_pixmap(dpi=40).samples
        if x != y and max(abs(p - q) for p, q in zip(x, y)) > 2: raise RuntimeError('render changed: %s p%d' % (path, i + 1))
    save(path, data); return n


def clean_deck_pptx(path):
    """العرض بصيغة PowerPoint (ملف .pptx محفوظًا نصَّ base64 في سطر واحد، يفكّه الموقع عند التنزيل):
    يحذف صورة التوقيع من القوالب (slideLayout) ومعها علاقتها وملف الوسائط، وسطر «إعداد وتصميم» من الغلاف،
    والإحالة (العتيبي، …) من الاستشهاد، واسم المؤلف من خصائص الملف. ويُتحقق أن الحزمة سليمة وأن عدد الشرائح لم يتغير."""
    import base64, hashlib, posixpath, zipfile
    from lxml import etree
    raw = open(path).read(); data = base64.b64decode(re.sub(r'\s+', '', raw))
    zin = zipfile.ZipFile(io.BytesIO(data)); infos = zin.infolist(); parts = {i.filename: zin.read(i.filename) for i in infos}
    rels_path = lambda p: posixpath.join(posixpath.dirname(p), '_rels', posixpath.basename(p) + '.rels')
    REL = re.compile(r'<Relationship\b[^>]*/>')
    def rels(p):
        rp = rels_path(p)
        if rp not in parts: return {}
        out = {}
        for m in REL.finditer(parts[rp].decode()):
            a = dict(re.findall(r'(\w+)="([^"]*)"', m.group(0)))
            if a.get('TargetMode') == 'External': continue
            tg = a['Target']; out[a['Id']] = tg.lstrip('/') if tg.startswith('/') else posixpath.normpath(posixpath.join(posixpath.dirname(p), tg))
        return out
    md5 = lambda b: hashlib.md5(b).hexdigest()
    xml_parts = [n for n in parts if re.match(r'ppt/(slides|slideLayouts|slideMasters)/[^/]+\.xml$', n)]
    PIC = r'<p:pic\b[^>]*>(?:(?!</p:pic>).)*?%s(?:(?!</p:pic>).)*?</p:pic>'
    sig = set()  # بصمات صور التوقيع: الصور التي يسمّيها وصفها «signature»
    for n in xml_parts:
        R = rels(n)
        for pic in re.findall(PIC % r'descr="[^"]*signature[^"]*"', parts[n].decode(), re.S):
            rid = re.search(r'r:embed="([^"]+)"', pic)
            if rid and R.get(rid.group(1)) in parts: sig.add(md5(parts[R[rid.group(1)]]))
    sig_media = {m for m in parts if m.startswith('ppt/media/') and md5(parts[m]) in sig}
    stats = {'pictures': 0, 'credit': 0, 'citations': 0}
    for n in xml_parts:
        R = rels(n); ids = [i for i, t in R.items() if t in sig_media]
        t = parts[n].decode()
        if ids:
            alt = '|'.join(map(re.escape, ids))
            t, k = re.subn(PIC % (r'r:embed="(?:%s)"' % alt), '', t, flags=re.S); stats['pictures'] += k
            rp = rels_path(n); parts[rp] = REL.sub(lambda m: '' if re.search(r'Id="(?:%s)"' % alt, m.group(0)) else m.group(0), parts[rp].decode()).encode()
        t, k = re.subn(r'<p:sp>(?:(?!</p:sp>).)*?إعداد وتصميم(?:(?!</p:sp>).)*?</p:sp>', '', t, flags=re.S); stats['credit'] += k
        t, k = re.subn(r'\s*\(ال\s*عتيبي،\s*[٠-٩0-9]{4}[أ-ي]?\)', '', t); stats['citations'] += k
        parts[n] = t.encode()
    used = set()  # ما زالت علاقةٌ ما تشير إليه من الوسائط
    for p in parts:
        if p.endswith('.rels'):
            owner = posixpath.join(posixpath.dirname(posixpath.dirname(p)), posixpath.basename(p)[:-5])
            used |= set(rels(owner).values())
    for m in sig_media:
        if m not in used: del parts[m]
    c = parts['docProps/core.xml'].decode()
    c = re.sub(r'<dc:creator>[^<]*</dc:creator>', '<dc:creator></dc:creator>', c)
    c = re.sub(r'<cp:lastModifiedBy>[^<]*</cp:lastModifiedBy>', '<cp:lastModifiedBy></cp:lastModifiedBy>', c)
    parts['docProps/core.xml'] = c.encode()
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w') as zo:
        for i in infos:
            if i.filename in parts: zo.writestr(i, parts[i.filename], compress_type=i.compress_type)
    new = out.getvalue()
    # تحقق: الحزمة تُفتح، وكل XML سليم، ولا علاقة تشير إلى ملف مفقود، ولا اسم ولا توقيع، وعدد الشرائح كما كان
    z = zipfile.ZipFile(io.BytesIO(new)); assert z.testzip() is None
    for n in z.namelist():
        if n.endswith('.xml') or n.endswith('.rels'): etree.fromstring(z.read(n))
    for p in z.namelist():
        if p.endswith('.rels'):
            owner = posixpath.join(posixpath.dirname(posixpath.dirname(p)), posixpath.basename(p)[:-5])
            for t in rels(owner).values():
                if t not in z.namelist(): raise RuntimeError('broken relationship %s -> %s' % (p, t))
    for n in z.namelist():
        if n.endswith('.xml'):
            body = z.read(n).decode()
            for rid in set(re.findall(r'r:(?:embed|id|link)="([^"]+)"', body)):
                if rid not in rels(n): raise RuntimeError('dangling %s in %s' % (rid, n))
            if re.search(r'مبارك|ال\s*ع\s*ت\s*ي\s*ب\s*ي|ألمعي|األلمعي|بصيرة|signature|claude\.ai', body): raise RuntimeError('name left in ' + n)
    if any(md5(z.read(m)) in sig for m in z.namelist() if m.startswith('ppt/media/')): raise RuntimeError('signature media left')
    from pptx import Presentation
    before, after = len(Presentation(io.BytesIO(data)).slides), len(Presentation(io.BytesIO(new)).slides)
    if before != after: raise RuntimeError('slide count changed %d -> %d' % (before, after))
    save(path, base64.b64encode(new))
    stats['media removed'] = len(sig_media); stats['slides'] = after
    return stats


if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if what in ('all', 'lessons'):
        n = t = 0
        for f in sorted(glob.glob('ls/f[6-9]/*.pdf') + glob.glob('ls/f[6-9]/m2/*.pdf')):
            r = run_pdf(f, lambda M, p, log: lesson_page(M, p, log), BASEERA)
            if r: save(f, r[0]); n += 1; t += len(r[2])
        print('lessons: files', n, 'references removed', t)
    if what in ('all', 'kits'):
        KIT = re.compile(r'مبارك|ال\s*ع\s*ت\s*ي\s*ي?\s*ب|ألمعي|األلمعي|claude\.ai/artifact')
        hashes = set()
        for f in sorted(glob.glob('vsc/kits/*.pdf')):
            r = run_pdf(f, lambda M, p, log, **k: kit_page(M, p, log, hashes), KIT, meta=True)
            save(f, r[0]); d = drop_logo_draws(f); u = drop_unused_images(f)
            print(f, 'pages edited', len(r[1]), 'edits', len(r[2]), '| corner signatures', d, '| hidden signature entries', u)
