# يحذف سطر «جمع وتطوير: أ. مبارك علي العتيبي» من ملفات التحاضير المصوّرة (ls/f6 … ls/f9) حذفًا حقيقيًّا لا تغطية.
import pymupdf, unicodedata, glob, re, sys, os
N = lambda t: unicodedata.normalize('NFKC', t)
tot = 0
for f in sorted(glob.glob('ls/f[6-9]/*.pdf')):
    d = pymupdf.open(f); hits = 0
    for pg in d:
        spans = [(sp, N(sp['text'])) for b in pg.get_text('dict')['blocks'] for l in b.get('lines', []) for sp in l['spans']]
        rows = [sp['bbox'] for sp, t in spans if 'مبارك علي' in t]
        for sp, t in spans:
            bb = sp['bbox']
            same = any(abs(bb[1] - r[1]) < 3 for r in rows)
            if 'مبارك علي' in t or (same and re.fullmatch(r'\s*(جمع وتطوير\s*:?|جمع|وتطوير\s*:?\s*(أ\s*\.)?)\s*', t)):
                pg.add_redact_annot(pymupdf.Rect(bb), fill=False); hits += 1
        if rows: pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE, text=pymupdf.PDF_REDACT_TEXT_REMOVE)
    if hits:
        tmp = f + '.tmp'; d.save(tmp, garbage=3, deflate=True); d.close(); os.replace(tmp, f); tot += hits
    else: d.close()
print('removed spans:', tot)
