# تحرير نص ملفات PDF على مستوى الحرف، بلا إعادة رسم ولا تغطية: يُحذف حرف من أمر رسم النص نفسه (TJ)،
# ويُزاح ما قبله في السطر ليسدّ الفراغ، ويبقى ما سواه كما هو. تستعمله m2/strip_author.py.
#   Model(pdf, page): أوامر رسم النص في الصفحة، ولكل حرف رمزه وموضعه في الصفحة (x0، x1، خط الأساس y).
#   Edit: يجمع ما يُحذف من حروف وما يُزاح منها أفقيًّا، وما يُحذف من رسوم الصور (Do)، وما يُزاح رأسيًّا من كتل النص.
# الإحداثيات بنظام PDF (y من الأسفل)؛ والدوال التي تقرأ pymupdf تحوّل إليه.
import pikepdf, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from rtl_pdfs import mul, widths

I6 = (1, 0, 0, 1, 0, 0)


class Model:
    def __init__(self, pdf, page):
        self.pdf, self.page = pdf, page
        mb = [float(v) for v in page.MediaBox]
        if mb[0] or mb[1]: raise RuntimeError('MediaBox origin is not 0,0')
        self.W, self.H = mb[2], mb[3]
        res = page.Resources
        self.fonts = {k: widths(v) for k, v in res.get('/Font', {}).items()}
        self.xobj = dict(res.get('/XObject', {}))
        self.ops = list(pikepdf.parse_content_stream(page))
        self.runs, self.dos, self.blocks = [], [], {}
        self._parse()

    def _parse(self):
        ctm, stack = I6, []
        ts = {'fs': 0.0, 'tc': 0.0, 'tw': 0.0, 'th': 1.0, 'tl': 0.0, 'font': None, 'rise': 0.0}
        tm = lm = I6; blk = -1
        for i, (o_, op) in enumerate(self.ops):
            o = str(op)
            if o == 'q': stack.append(ctm)
            elif o == 'Q': ctm = stack.pop() if stack else ctm
            elif o == 'cm': ctm = mul(tuple(float(x) for x in o_), ctm)
            elif o == 'BT':
                tm = lm = I6; blk += 1; self.blocks[blk] = {'start': i, 'end': None, 'ctm': ctm}
            elif o == 'ET':
                if blk in self.blocks: self.blocks[blk]['end'] = i
            elif o == 'Tf': ts['font'] = str(o_[0]); ts['fs'] = float(o_[1])
            elif o == 'Tc': ts['tc'] = float(o_[0])
            elif o == 'Tw': ts['tw'] = float(o_[0])
            elif o == 'Tz': ts['th'] = float(o_[0]) / 100
            elif o == 'TL': ts['tl'] = float(o_[0])
            elif o == 'Ts': ts['rise'] = float(o_[0])
            elif o in ('Td', 'TD'):
                tx, ty = float(o_[0]), float(o_[1])
                if o == 'TD': ts['tl'] = -ty
                lm = mul((1, 0, 0, 1, tx, ty), lm); tm = lm
            elif o == 'Tm': lm = tm = tuple(float(x) for x in o_)
            elif o == 'T*': lm = mul((1, 0, 0, 1, 0, -ts['tl']), lm); tm = lm
            elif o in ("'", '"'): raise RuntimeError('unsupported text operator ' + o)
            elif o == 'Do': self.dos.append({'i': i, 'name': str(o_[0]), 'ctm': ctm})
            elif o in ('Tj', 'TJ'):
                fw = self.fonts.get(ts['font'])
                if not fw: raise RuntimeError('font without widths: %s' % ts['font'])
                n, Wd, dw = fw; m = mul(tm, ctm)
                rot = abs(m[1]) > 1e-6  # نص مدوّر: لا يُحرَّر (يُتجاوز في البحث). والميل (المائل الصناعي) لا يغيّر مواضع الحروف على السطر
                pen = 0.0; gl = []
                for el in ([o_[0]] if o == 'Tj' else list(o_[0])):
                    if isinstance(el, pikepdf.String):
                        b = bytes(el)
                        codes = [b[j] * 256 + b[j + 1] for j in range(0, len(b) - 1, 2)] if n == 2 else list(b)
                        for c in codes:
                            a = (Wd.get(c, dw) / 1000 * ts['fs'] + ts['tc'] + (ts['tw'] if n == 1 and c == 32 else 0)) * ts['th']
                            gl.append({'code': c, 'p': pen, 'a': a, 'x0': m[4] + pen * m[0], 'x1': m[4] + (pen + a) * m[0]}); pen += a
                    else:
                        pen += -float(el) / 1000 * ts['fs'] * ts['th']
                self.runs.append({'i': i, 'b': blk, 'n': n, 'fs': ts['fs'], 'th': ts['th'], 'tc': ts['tc'], 'font': ts['font'], 'tm': tm,
                                  'sx': m[0], 'y': m[5] + ts['rise'] * m[3], 'x': m[4], 'end': pen, 'glyphs': gl, 'rise': ts['rise'], 'rot': rot})
                tm = mul((1, 0, 0, 1, pen, 0), tm)

    # ---- البحث ----
    def glyphs_in(self, x0, x1, ylo, yhi, mark_extra=3.5):
        """الحروف التي يقع منتصفها بين x0 وx1، وخط أساسها بين ylo وyhi (إحداثيات PDF).
        والحركات (عرضها صفر، تُرسم بخط أساس مرفوع أو منخفض) يُتّسع لها رأسيًّا بـ mark_extra."""
        out = []
        for ri, r in enumerate(self.runs):
            if r['rot'] or not (ylo - mark_extra <= r['y'] <= yhi + mark_extra): continue
            inband = ylo <= r['y'] <= yhi
            for gi, g in enumerate(r['glyphs']):
                if not inband and g['x1'] - g['x0'] > .3: continue
                c = (g['x0'] + g['x1']) / 2
                if x0 <= c <= x1: out.append((ri, gi))
        return out

    def image_draws(self, rect, tol=1.0):
        """أوامر Do التي ترسم صورة يطابق موضعها المستطيل rect=(x0, y0, x1, y1) بإحداثيات PDF:
        صورة مباشرة، أو نموذج (Form) ليس فيه إلا صور وإحداها في ذلك الموضع."""
        def box(m):
            a, b, c, d, e, f = m; xs = [e, e + a, e + c, e + a + c]; ys = [f, f + b, f + d, f + b + d]
            return (min(xs), min(ys), max(xs), max(ys))
        hit = lambda r: all(abs(r[k] - rect[k]) <= tol for k in range(4))
        out = []
        for d in self.dos:
            xo = self.xobj.get(d['name'])
            if xo is None: continue
            st = str(xo.get('/Subtype'))
            if st == '/Image':
                if hit(box(d['ctm'])): out.append(d['i'])
            elif st == '/Form':
                fm = tuple(float(v) for v in xo.get('/Matrix', [1, 0, 0, 1, 0, 0])); base = mul(fm, d['ctm'])
                inner = dict(xo.get('/Resources', {}).get('/XObject', {})); ctm, stack, imgs, other = base, [], [], False
                for o_, op in pikepdf.parse_content_stream(xo):
                    o = str(op)
                    if o == 'q': stack.append(ctm)
                    elif o == 'Q': ctm = stack.pop() if stack else ctm
                    elif o == 'cm': ctm = mul(tuple(float(x) for x in o_), ctm)
                    elif o == 'Do':
                        ix = inner.get(str(o_[0]))
                        if ix is not None and str(ix.get('/Subtype')) == '/Image': imgs.append(box(ctm))
                        else: other = True
                    elif o in ('Tj', 'TJ', "'", '"', 'BI'): other = True
                if imgs and not other and any(hit(r) for r in imgs): out.append(d['i'])
        return out


class Edit:
    def __init__(self, model):
        self.m = model; self.dele = set(); self.dx = {}; self.dropops = set(); self.dy = {}; self.ins = {}

    def delete(self, keys): self.dele.update(keys)

    def shift(self, keys, dx):
        for k in keys:
            if k not in self.dele: self.dx[k] = self.dx.get(k, 0.0) + dx

    def close_gap_rtl(self, line_keys, gone):
        """سطر من اليمين إلى اليسار: كل حرف باقٍ يقع يسار مقطع محذوف يُزاح يمينًا بعرض ذلك المقطع،
        فيبقى طرف السطر الأيمن في مكانه ولا يبقى فراغ. line_keys: حروف السطر كله؛ gone: المحذوف منها."""
        R = self.m.runs; G = lambda k: R[k[0]]['glyphs'][k[1]]; gone = set(gone)
        segs = []; cur = None
        for k in sorted(line_keys, key=lambda k: (G(k)['x0'], G(k)['x1'])):
            g = G(k)
            if k in gone:
                cur = [g['x0'], g['x1']] if cur is None else [cur[0], max(cur[1], g['x1'])]
            elif g['x1'] - g['x0'] > 0.05 and cur is not None:  # الحركات (عرضها صفر) لا تقطع المقطع
                segs.append(cur); cur = None
        if cur is not None: segs.append(cur)
        self.delete(gone)
        for k in line_keys:
            if k in gone: continue
            w = sum(s1 - s0 for s0, s1 in segs if s0 >= G(k)['x1'] - 0.05)
            if w: self.shift([k], w)
        return segs

    def drop_op(self, i): self.dropops.add(i)

    def insert_glyph(self, src, x, after_key):
        """يضيف الحرف src=(run, glyph) بخطه وحجمه ولونه في موضع x من سطر الحرف after_key (يُكتب بعد كتلته، داخل q/Q)."""
        m = self.m; r = m.runs[src[0]]; g = r['glyphs'][src[1]]; t = m.runs[after_key[0]]
        a, b, c, d, e, f = m.blocks[t['b']]['ctm']; tm = list(r['tm']); sa, _, _, sd, _, _ = m.blocks[r['b']]['ctm']
        tm[0] = tm[0] * sa / a; tm[3] = tm[3] * sd / d  # الحجم نفسه في الصفحة ولو اختلفت مصفوفة الكتلة
        # موضع أصل الحرف في الصفحة (x، خط أساس السطر الهدف) ← إحداثيات النص في مصفوفة الكتلة
        ux = (x - e) / a if abs(a) > 1e-9 else 0; uy = (t['y'] - f) / d if abs(d) > 1e-9 else 0
        code = g['code'].to_bytes(2, 'big') if r['n'] == 2 else bytes([g['code']])
        P = lambda v: pikepdf.Object.parse(b'%.4f' % v)
        ops = [([], pikepdf.Operator('q')), ([], pikepdf.Operator('BT')),
               ([pikepdf.Name(r['font']), P(r['fs'])], pikepdf.Operator('Tf')),
               ([P(r['tc'])], pikepdf.Operator('Tc')), ([P(r['th'] * 100)], pikepdf.Operator('Tz')),
               ([P(tm[0]), P(tm[1]), P(tm[2]), P(tm[3]), P(ux), P(uy)], pikepdf.Operator('Tm')),
               ([pikepdf.Array([pikepdf.String(code)])], pikepdf.Operator('TJ')),
               ([], pikepdf.Operator('ET')), ([], pikepdf.Operator('Q'))]
        self.ins.setdefault(m.blocks[t['b']]['end'], []).extend(ops)

    def move_block(self, b, dy): self.dy[b] = self.dy.get(b, 0.0) + dy

    def check_marks(self):
        """لا تبقى حركة فوق موضع حرف محذوف (ولا تبقى حركة حرفٍ أُزيح في مكانها)."""
        m = self.m; segs = []
        for (ri, gi) in self.dele:
            r = m.runs[ri]; g = r['glyphs'][gi]
            if g['x1'] - g['x0'] > .3: segs.append((g['x0'], g['x1'], r['y']))
        for ri, r in enumerate(m.runs):
            if r['rot']: continue
            for gi, g in enumerate(r['glyphs']):
                if g['x1'] - g['x0'] > .3 or (ri, gi) in self.dele: continue
                c = (g['x0'] + g['x1']) / 2
                for x0, x1, y in segs:
                    if x0 + .05 < c < x1 - .05 and abs(r['y'] - y) < 7: raise RuntimeError('a mark would be left over deleted text')
        moved = {}
        for (ri, gi), dx in self.dx.items(): moved.setdefault(round(m.runs[ri]['y']), []).append((m.runs[ri]['glyphs'][gi], dx))
        for ri, r in enumerate(m.runs):
            if r['rot']: continue
            for gi, g in enumerate(r['glyphs']):
                if g['x1'] - g['x0'] > .3 or (ri, gi) in self.dele or (ri, gi) in self.dx: continue
                c = (g['x0'] + g['x1']) / 2
                for y, lst in moved.items():
                    if abs(r['y'] - y) < 7 and any(b['x0'] < c < b['x1'] and dx for b, dx in lst if b['x1'] - b['x0'] > .3):
                        raise RuntimeError('a mark would stay while its letter moves')

    def apply(self):
        self.check_marks()
        m = self.m; byrun = {}
        for (ri, gi) in self.dele | set(self.dx): byrun.setdefault(ri, None)
        newops = {}
        for ri in byrun:
            r = m.runs[ri]; newpos = []
            if r['rot']: raise RuntimeError('edit touches rotated text')
            for gi, g in enumerate(r['glyphs']):
                if (ri, gi) in self.dele: newpos.append(None)
                else: newpos.append(g['p'] + self.dx.get((ri, gi), 0.0) / r['sx'])
            newops[r['i']] = rebuild(r, newpos)
        starts = {m.blocks[b]['start']: b for b in self.dy}; ends = {m.blocks[b]['end']: b for b in self.dy}
        out = []
        for i, item in enumerate(m.ops):
            if i in self.dropops: continue
            if i in starts:
                b = starts[i]; a, _, _, d, _, _ = m.blocks[b]['ctm']
                out.append(([], pikepdf.Operator('q')))
                out.append(([1, 0, 0, 1, 0, pikepdf.Object.parse(b'%.4f' % (self.dy[b] / d))], pikepdf.Operator('cm')))
            out.append((newops[i], pikepdf.Operator('TJ')) if i in newops else item)
            if i in ends: out.append(([], pikepdf.Operator('Q')))
            if i in self.ins: out.extend(self.ins[i])
        m.page.Contents = m.pdf.make_stream(pikepdf.unparse_content_stream(out))


def rebuild(run, newpos):
    """مصفوفة TJ جديدة: كل حرف باقٍ في موضعه الجديد، والقلم ينتهي حيث كان، فلا يتأثر ما بعده."""
    k = -1000.0 / (run['fs'] * run['th']); arr = []; pen = 0.0; buf = bytearray()
    num = lambda v: pikepdf.Object.parse(b'%.4f' % v)
    def flush():
        nonlocal buf
        if buf: arr.append(pikepdf.String(bytes(buf))); buf = bytearray()
    for g, p in zip(run['glyphs'], newpos):
        if p is None: continue
        if abs(p - pen) > 1e-5: flush(); arr.append(num((p - pen) * k))
        buf += g['code'].to_bytes(2, 'big') if run['n'] == 2 else bytes([g['code']])
        pen = p + g['a']
    flush()
    if abs(run['end'] - pen) > 1e-5: arr.append(num((run['end'] - pen) * k))
    return [pikepdf.Array(arr)]
