# ينتج نسخة «نموذج 2» من كل ملف تحضير مصوّر: ls/fN/m2/<id>.pdf، بتبديل ألوان النموذج 1 بألوان النموذج 2 (البنية نفسها).
import pikepdf, glob, os
def h(c): return tuple(int(c[i:i+2], 16) / 255 for i in (1, 3, 5))
# النموذج 2 البسيط: النيلي للنص، والبنفسجي للعناوين والروابط، والنعناعي (بدرجته الداكنة للنص) للتمييز، وصبغات فاتحة للخلفيات والخطوط
FILL = {'#0D1B3D': '#1E1B4B', '#4A5878': '#5B5880', '#1D4ED8': '#6D28D9', '#2563EB': '#6D28D9', '#0B7C70': '#047857', '#B54E00': '#5B21B6',
        '#EEF4FF': '#F7F6FB', '#DCE7FF': '#EDE9FE', '#D5E0F2': '#E7E5F2', '#B9CDFB': '#DDD6FE', '#14B8A6': '#34D399', '#FF7A1A': '#34D399'}
STROKE = dict(FILL)
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
