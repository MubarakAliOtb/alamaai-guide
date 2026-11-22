# ينتج نسخة «نموذج 2» من كل ملف تحضير مصوّر: ls/fN/m2/<id>.pdf، بتبديل ألوان النموذج 1 بألوان النموذج 2 (البنية نفسها).
import pikepdf, glob, os
def h(c): return tuple(int(c[i:i+2], 16) / 255 for i in (1, 3, 5))
FILL = {'#D5E0F2': '#FFF0C4', '#0D1B3D': '#1A1A2E', '#4A5878': '#4A4A5E', '#1D4ED8': '#2D4FCB', '#0B7C70': '#13806A', '#2563EB': '#2D4FCB',
        '#DCE7FF': '#FFC93C', '#EEF4FF': '#FFF6E5', '#B54E00': '#B23A1E', '#14B8A6': '#2EC4A0', '#FF7A1A': '#FF7A5C', '#B9CDFB': '#E6DCC8'}
STROKE = dict(FILL, **{'#D5E0F2': '#1A1A2E', '#DCE7FF': '#1A1A2E', '#B9CDFB': '#1A1A2E', '#2563EB': '#4D7CFE'})
def key(ops): return '#%02X%02X%02X' % tuple(round(float(x) * 255) for x in ops)
n = 0
for f in sorted(glob.glob('ls/f[6-9]/*.pdf')):
    out = os.path.join(os.path.dirname(f), 'm2', os.path.basename(f)); os.makedirs(os.path.dirname(out), exist_ok=True)
    pdf = pikepdf.open(f)
    for page in pdf.pages:
        new = []
        for operands, op in pikepdf.parse_content_stream(page):
            o = str(op)
            if o in ('rg', 'RG') and len(operands) == 3:
                tbl = FILL if o == 'rg' else STROKE
                k = key(operands)
                if k in tbl: operands = [pikepdf.Object.parse(b'%.4f' % v) for v in h(tbl[k])]
            new.append((operands, op))
        page.Contents = pdf.make_stream(pikepdf.unparse_content_stream(new))
    pdf.save(out, compress_streams=True, object_stream_mode=pikepdf.ObjectStreamMode.generate); n += 1
print('recolored', n)
