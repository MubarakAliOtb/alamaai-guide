# نقل عروض PowerPoint في الحقائب (vsc/kits/k*-deck.pptx.txt: ملف .pptx محفوظ نص base64) إلى نظام التصميم الحالي:
# ألوان السمة والشرائح والتدرجات بجدول m2/auto_tables.py (النص بجدول TEXT على الشرائح الفاتحة، وبجدول FILL على الداكنة)،
# وتعبئة الشكل الفاتحة تحت نص أبيض تأخذ الدرجة الداكنة، والصور البيانية بالخريطة نفسها المستعملة في ملفات PDF،
# والأرقام المشرقية في النص إلى 0–9، والخط إلى Tahoma كما في ملف PowerPoint الذي يصدّره الدليل.
import sys, io, os, re, base64, zipfile, posixpath
import numpy as np, pymupdf
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import recolor_kits as R

FONT = 'Tahoma'
DIG = str.maketrans('٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789')

def m(tbl, h):
    n = R.look(tbl, '#' + h.upper())
    return n[1:] if n else h.upper()

def slide_dark(pdf_page):
    pix = pdf_page.get_pixmap(dpi=12); a = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)[:, :, :3] / 255
    return float((0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]).mean()) < 0.45

def run(path, pdf_path):
    raw = open(path).read(); data = base64.b64decode(re.sub(r'\s+', '', raw))
    zin = zipfile.ZipFile(io.BytesIO(data)); infos = zin.infolist(); parts = {i.filename: zin.read(i.filename) for i in infos}
    th = parts['ppt/theme/theme1.xml'].decode()
    scheme = dict(re.findall(r'<a:(dk1|lt1|dk2|lt2|accent\d|hlink|folHlink)><a:srgbClr val="([0-9A-Fa-f]{6})"', th))
    scheme.update({'tx1': scheme.get('dk1'), 'bg1': scheme.get('lt1'), 'tx2': scheme.get('dk2'), 'bg2': scheme.get('lt2')})
    th = re.sub(r'(<a:(?:dk1|lt1|dk2|lt2|accent\d|hlink|folHlink)><a:srgbClr val=")([0-9A-Fa-f]{6})', lambda q: q.group(1) + m(R.FILL, q.group(2)), th)
    th = re.sub(r'typeface="Greta Arabic[^"]*"', f'typeface="{FONT}"', th)
    parts['ppt/theme/theme1.xml'] = th.encode()
    doc = pymupdf.open(pdf_path); st = {'slides': 0, 'text': 0, 'fill': 0, 'dark': 0, 'digits': 0, 'images': 0, 'fonts': 0}
    def fix_xml(t, dark):
        # النص: كل solidFill داخل خصائص الحرف
        def rpr(q):
            blk = q.group(0)
            def col(c):
                tag, val = c.group(1), c.group(2)
                h = scheme.get(val) if tag == 'schemeClr' else val
                if not h: return c.group(0)
                st['text'] += 1
                return f'<a:srgbClr val="{m(R.FILL if dark else R.TEXT, h)}"'
            blk = re.sub(r'<a:(schemeClr|srgbClr) val="([^"]+)"', col, blk)
            if 'Greta Arabic' in blk:
                bold = re.search(r'typeface="Greta Arabic[^"]*Bold', blk) is not None
                blk = re.sub(r'typeface="Greta Arabic[^"]*"', f'typeface="{FONT}"', blk); st['fonts'] += 1
                if bold and ' b="' not in blk.split('>')[0]: blk = re.sub(r'^<a:(rPr|defRPr|endParaRPr)', r'<a:\1 b="1"', blk)
            else:  # العناوين بخط السمة العريض (majorFont): يبقى عرضها عريضًا بعد تبديل الخط
                szm = re.search(r'sz="(\d+)"', blk.split('>')[0])
                if szm and int(szm.group(1)) >= 2800 and 'typeface=' not in blk and ' b="' not in blk.split('>')[0]:
                    blk = re.sub(r'^<a:(rPr|defRPr|endParaRPr)', r'<a:\1 b="1"', blk)
            return blk
        t = re.sub(r'<a:(?:rPr|defRPr|endParaRPr)\b[^>]*?(?:/>|>.*?</a:(?:rPr|defRPr|endParaRPr)>)', rpr, t, flags=re.S)
        # الأشكال: تعبئة فاتحة تحت نص أبيض ← الدرجة الداكنة
        def sp(q):
            blk = q.group(0)
            white = re.search(r'<a:rPr[^>]*>(?:(?!</a:rPr>).)*<a:srgbClr val="FFFFFF"', blk, re.S)
            def fill(c):
                h = c.group(2); nh = m(R.FILL, h); st['fill'] += 1
                if white and ('#' + nh) in R.DARK: nh = R.DARK['#' + nh][1:]; st['dark'] += 1
                return c.group(1) + nh
            sppr = re.search(r'<p:spPr>.*?</p:spPr>', blk, re.S)
            if sppr:
                body = sppr.group(0)
                body2 = re.sub(r'(<a:solidFill><a:srgbClr val=")([0-9A-Fa-f]{6})', fill, body)
                def sch(c):
                    h = scheme.get(c.group(1))
                    if not h: return c.group(0)
                    nh = m(R.FILL, h)
                    if white and ('#' + nh) in R.DARK: st['dark'] += 1; return f'<a:solidFill><a:srgbClr val="{R.DARK["#" + nh][1:]}"'
                    return c.group(0)
                body2 = re.sub(r'<a:solidFill><a:schemeClr val="([^"]+)"', sch, body2)
                blk = blk.replace(body, body2)
            return blk
        t = re.sub(r'<p:sp>.*?</p:sp>', sp, t, flags=re.S)
        # ما بقي من الألوان الصريحة (الحدود والتدرجات والخلفيات)
        t = re.sub(r'(<a:srgbClr val=")([0-9A-Fa-f]{6})', lambda q: q.group(1) + m(R.FILL, q.group(2)), t)
        # الأرقام
        def tt(q):
            s = q.group(2); s2 = s.translate(DIG)
            if s2 != s: st['digits'] += 1
            return q.group(1) + s2 + q.group(3)
        t = re.sub(r'(<a:t>)([^<]*)(</a:t>)', tt, t)
        return t
    names = [n for n in parts if re.match(r'ppt/slides/slide\d+\.xml$', n)]
    for n in names:
        k = int(re.search(r'(\d+)', n.split('/')[-1]).group(1)) - 1
        parts[n] = fix_xml(parts[n].decode(), slide_dark(doc[k])).encode(); st['slides'] += 1
    for n in parts:
        if re.match(r'ppt/(slideLayouts|slideMasters|notesSlides|notesMasters)/[^/]+\.xml$', n):
            parts[n] = fix_xml(parts[n].decode(), False).encode()
    for n in list(parts):
        if n.startswith('ppt/media/') and n.lower().endswith(('.png', '.jpg', '.jpeg')):
            im = Image.open(io.BytesIO(parts[n]))
            if not R.is_graphic(im): continue
            alpha = im.getchannel('A') if 'A' in im.getbands() else None
            out = Image.fromarray(R.remap_pixels(np.asarray(im.convert('RGB'))), 'RGB')
            buf = io.BytesIO()
            if n.lower().endswith('.png'):
                if alpha is not None: out.putalpha(alpha)
                out.save(buf, 'PNG', optimize=True)
            else: out.save(buf, 'JPEG', quality=92)
            parts[n] = buf.getvalue(); st['images'] += 1
    left = [h for n in parts if n.endswith('.xml') for h in re.findall(r'srgbClr val="([0-9A-Fa-f]{6})"', parts[n].decode('utf-8', 'ignore')) if '#' + h.upper() in R.FILL]
    if left: raise RuntimeError('old colors left: %s' % sorted(set(left))[:8])
    out = io.BytesIO()
    with zipfile.ZipFile(out, 'w') as zo:
        for i in infos: zo.writestr(i, parts[i.filename], compress_type=i.compress_type)
    new = out.getvalue()
    from pptx import Presentation
    if len(Presentation(io.BytesIO(new)).slides) != len(Presentation(io.BytesIO(data)).slides): raise RuntimeError('slide count changed')
    tmp = path + '.tmp'; open(tmp, 'wb').write(base64.b64encode(new)); os.replace(tmp, path)
    return st

if __name__ == '__main__':
    for k in ('k1', 'k2', 'k3'):
        print(k, run(f'vsc/kits/{k}-deck.pptx.txt', f'/tmp/kits/orig/{k}-deck.pdf' if len(sys.argv) < 2 else sys.argv[1].replace('KK', k)))
