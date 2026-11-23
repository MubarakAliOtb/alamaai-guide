# يبني lxd/lxd-part18.pdf (نسخة A4 من الجزء الثامن عشر) بنظام التصميم الحالي، من صفحة الدليل في lxd/index.html نفسها:
# غلاف بالنيلي وشعار الدليل، ثم صفحات الجزء كما تظهر في الموقع (خط Alm Sans والأرقام 0–9 والنيلي والبنفسجي والنعناعي)،
# ورأس جارٍ ورقم صفحة على كل صفحة بعد الغلاف. يلزمه خادم محلي للمستودع في المنفذ 8765.
import io, os, sys, base64, subprocess
import pymupdf, pikepdf
from playwright.sync_api import sync_playwright
from fontTools.ttLib import TTFont

BASE = 'http://127.0.0.1:8765/'
OUT = 'lxd/lxd-part18.pdf'
TITLE = 'هندسة تجربة التعلّم — الجزء الثامن عشر من «دليل المعلم الألمعي»'
RUN = 'دليل المعلم الألمعي · الجزء الثامن عشر: هندسة تجربة التعلّم'

def ttf(woff2, out):
    f = TTFont(woff2); f.flavor = None; f.save(out); return out

PRINT_CSS = '''
@page{size:A4;margin:22mm 15mm 18mm}
html,body{background:#fff!important}
.top,header.top,nav.top{display:none!important}
html[data-model="2"] :where(header.lb-head)::before{display:none!important}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
'''

def cover_html(logo_svg):
    return f'''<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><style>
@font-face{{font-family:Alm;src:url('{BASE}fonts/AlmSansArabic-Regular.woff2');font-weight:400}}
@font-face{{font-family:Alm;src:url('{BASE}fonts/AlmSansArabic-Bold.woff2');font-weight:700}}
@font-face{{font-family:AlmD;src:url('{BASE}fonts/m2d-alm-400.woff2');font-weight:400;unicode-range:U+0660-0669}}
@page{{size:A4;margin:0}}*{{margin:0;padding:0;box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
body{{width:210mm;height:297mm;background:#1E1B4B;color:#fff;font-family:AlmD,Alm,sans-serif;position:relative;overflow:hidden}}
.dots{{position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.07) 1.6px,transparent 2.2px);background-size:9mm 9mm}}
.c1{{position:absolute;width:150mm;height:150mm;border-radius:50%;background:#2A2660;left:-55mm;top:-50mm}}
.c2{{position:absolute;width:70mm;height:70mm;border-radius:50%;background:#34D399;opacity:.9;left:22mm;top:58mm}}
.c3{{position:absolute;width:40mm;height:40mm;border-radius:12mm;background:#A78BFA;left:70mm;top:28mm;transform:rotate(12deg)}}
.in{{position:absolute;right:20mm;left:20mm;bottom:28mm}}
.logo{{display:flex;align-items:center;gap:4mm;font-weight:700;font-size:15pt;margin-bottom:22mm}}
.logo svg{{width:15mm;height:15mm}}
.logo small{{display:block;font-weight:400;font-size:10pt;color:#C9C5EA}}
.tag{{display:inline-block;background:#34D399;color:#14123A;font-weight:700;font-size:12pt;padding:2.2mm 6mm;border-radius:99px;margin-bottom:7mm}}
h1{{font-size:44pt;line-height:1.2;margin-bottom:7mm}}
p{{font-size:13pt;line-height:1.75;color:#DDD9F5;max-width:150mm}}
.rule{{height:1.4mm;width:60mm;background:#34D399;border-radius:1mm;margin:12mm 0 7mm}}
.by{{font-size:11pt;color:#C9C5EA;line-height:1.8}}.by b{{color:#fff}}
</style></head><body><div class="dots"></div><div class="c1"></div><div class="c3"></div><div class="c2"></div>
<div class="in"><div class="logo">{logo_svg}<div>دليل المعلم الألمعي<small>التربية الإسلامية والقرآن الكريم للموهوبين</small></div></div>
<div class="tag">الجزء الثامن عشر</div><h1>هندسة تجربة التعلّم</h1>
<p>هذا الجزء يعلّم معلم التربية الإسلامية والقرآن الكريم أن يصمّم الحصة تجربةً يعيشها المتعلم الموهوب داخل القالب الرسمي، لا بديلًا عنه.</p>
<div class="rule"></div><div class="by">جمع وتطوير: <b>أ. مبارك علي العتيبي</b><br>مدرسة الموهوبين المتوسطة بنين 1 · دولة الكويت · نوفمبر 2026</div></div></body></html>'''

def main():
    logo = open('m2/logo.svg', encoding='utf-8').read()
    init = "try{localStorage.setItem('dms:theme',JSON.stringify('light'))}catch(e){}"
    with sync_playwright() as p:
        b = p.chromium.launch(); c = b.new_context(viewport={'width': 1100, 'height': 900}, service_workers='block'); c.add_init_script(init)
        pg = c.new_page(); pg.goto(BASE + 'lxd/index.html#guide', wait_until='networkidle'); pg.wait_for_timeout(1500)
        assert pg.evaluate("document.documentElement.dataset.view") == 'guide'
        pg.add_style_tag(content=PRINT_CSS); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(600)
        body = pg.pdf(prefer_css_page_size=True, print_background=True)
        cv = c.new_page(); cv.set_content(cover_html(logo), wait_until='networkidle'); cv.evaluate('document.fonts.ready'); cv.wait_for_timeout(400)
        cover = cv.pdf(prefer_css_page_size=True, print_background=True)
        b.close()
    doc = pymupdf.open(stream=cover, filetype='pdf'); doc.insert_pdf(pymupdf.open(stream=body, filetype='pdf'))
    os.makedirs('/tmp/lxdpdf', exist_ok=True)
    reg = ttf('fonts/AlmSansArabic-Regular.woff2', '/tmp/lxdpdf/alm.ttf')
    css = f"@font-face{{font-family:alm;src:url({reg})}} *{{font-family:alm;color:#5B5880;font-size:8.5pt}} p{{margin:0}}"
    arch = pymupdf.Archive('/tmp/lxdpdf')
    for i in range(1, len(doc)):
        pgp = doc[i]; W, H = pgp.rect.width, pgp.rect.height
        pgp.insert_htmlbox(pymupdf.Rect(42, 26, W - 42, 46), f'<p dir="rtl" style="text-align:right">{RUN}</p>', css=css, archive=arch)
        pgp.draw_line(pymupdf.Point(42, 48), pymupdf.Point(W - 42, 48), color=(0.906, 0.898, 0.949), width=0.8)
        pgp.insert_htmlbox(pymupdf.Rect(W / 2 - 40, H - 34, W / 2 + 40, H - 18), f'<p style="text-align:center">{i + 1}</p>', css=css, archive=arch)
    doc.set_metadata({'title': TITLE, 'author': 'مبارك علي العتيبي', 'subject': 'تصميم تجارب التعلّم في التربية الإسلامية والقرآن الكريم للموهوبين', 'creator': 'دليل المعلم الألمعي', 'producer': ''})
    data = doc.tobytes(garbage=4, deflate=True)
    tmp = OUT + '.tmp'; open(tmp, 'wb').write(data); os.replace(tmp, OUT)
    print(OUT, len(doc), 'pages', len(data), 'bytes')

if __name__ == '__main__':
    main()
