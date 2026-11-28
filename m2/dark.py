# يولّد الوضع الليلي لطبقة التصميم: m2/dark-<الصفحة>.css
# يمرّ على أنماط الصفحة الأساسية وعلى طبقة التصميم الفاتحة (auto + m2.css)، ويكتب لكل تصريح فيه لون مكتوب
# قاعدة مقابلة تحت html[data-model="2"][data-theme="dark"] بألوان الليل. ما يُبنى على المتغيرات يتبع رموز الليل في m2.css.
# الورق والطباعة والشاشة الذكية خارج ذلك: تبقى فاتحة.
import re, sys, pathlib, tinycss2, importlib.util
M = pathlib.Path(__file__).resolve().parent; R = M.parent
PAGE, LIGHT, OUT = sys.argv[1], sys.argv[2], sys.argv[3]

spec = importlib.util.spec_from_file_location('auto_tables', M / 'auto_tables.py'); A = importlib.util.module_from_spec(spec); spec.loader.exec_module(A)

DF = {  # التعبئة والحدود: من ألوان التصميم الفاتح إلى الليل
 '#FFFFFF': '#17162E', '#F7F6FB': '#121128', '#F5F3FF': '#1E1A3F', '#EDE9FE': '#2A2357', '#DDD6FE': '#3B3176', '#C4B5FD': '#4C3F94', '#A78BFA': '#6D5BC9',
 '#6D28D9': '#7C3AED', '#5B21B6': '#8B5CF6', '#4C1D95': '#6D28D9',
 '#1E1B4B': '#26244A', '#2A2660': '#2E2B57', '#14123A': '#0E0D1F', '#3B3775': '#3A3762',
 '#5B5880': '#6E6A9C', '#6E6B8F': '#8B87B5', '#E7E5F2': '#2A2848', '#D4D1E6': '#3A3762', '#C9C6DD': '#45426E', '#A6A3C2': '#5E5A8A', '#8C89AB': '#7A76A6',
 '#34D399': '#34D399', '#6EE7B7': '#2FB386', '#A7F3D0': '#1F5E4B', '#D1FAE5': '#143B30', '#ECFDF5': '#0F2A23', '#047857': '#059669',
}
DT = {  # لون النص
 '#1E1B4B': '#ECEAFB', '#5B5880': '#B4B0D6', '#6E6B8F': '#9894C0', '#8C89AB': '#9894C0', '#A6A3C2': '#9894C0', '#2A2660': '#D4D1E6', '#14123A': '#ECEAFB',
 '#6D28D9': '#A78BFA', '#5B21B6': '#C4B5FD', '#4C1D95': '#C4B5FD', '#047857': '#6EE7B7', '#065F46': '#6EE7B7',
}
COLPROPS = A.COLPROPS | {'border-right-color', 'border-left-color', 'border-block-color', 'border-inline-color', 'border-inline-end-color', 'outline-color'}
# رموز الليل المكتوبة باليد في m2.css هي المرجع: كتلة الرموز في :root لا يُولَّد لها مقابل (وإلا غلبت المكتوبة لأنها بعدها)،
# وما يعيد تعريفه مكوّن (مثل .bag) من هذه الرموز يأخذ قيمتها الليلية نفسها لا تقديرًا بالسطوع؛ عدا --white لأنه يُستعمل خلفيةً هناك.
_m2 = (M / 'm2.css').read_text(encoding='utf-8')
_i = _m2.find('html[data-model="2"][data-theme="dark"]{\n  color-scheme:dark;')
TOK = dict(re.findall(r'(--[a-z0-9-]+):\s*([^;]+);', _m2[_i:_m2.find('}', _i)])) if _i >= 0 else {}
TOK.pop('--white', None)
ROOT_DARK = 'html[data-model="2"][data-theme="dark"]'
HEX = re.compile(r'#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b')
PAPER = re.compile(r'\.ps(?![\w-])|\.ps-|\.sheet(?![\w-])|\.sheet-|#fdPrint|\.nbp(?![\w])|\.nbp-|\.nb-|\.nbc-|\.nbx(?![\w-])|\.cal-|\.pc-|\.tk-pdfbox|\.lx(?![\w-])|\.ls-cut|\.lm-|\.bqpdf|\.prn-|\.lb-sheet|\.sjp(?![\w])|\.sjp-|@page')
BGP = {'background', 'background-color', 'background-image', 'fill'}
FILLVAR = {'--navy-900': 'var(--s-ink-bg)', '--blue-800': '#4C3F94', '--blue-600': '#7C3AED', '--teal-700': '#047857', '--orange-700': '#047857'}
TINT = re.compile(r'var\(--(?:teal-50|teal-100|orange-50|orange-100|blue-50|blue-100|grad-wash|hl)\)')

def full(h):
    h = h.upper()
    return '#' + ''.join(c * 2 for c in h[1:]) if len(h) == 4 else h

def lum(h):
    h = full(h); r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= .03928 else ((c + .055) / 1.055) ** 2.4
    return .2126 * f(r) + .7152 * f(g) + .0722 * f(b)

def dark_hex(h, text):
    h = full(h); t = DT if text else DF
    if h in t: return t[h]
    L = lum(h)
    if text: return '#ECEAFB' if L < .06 else ('#B4B0D6' if L < .18 else None)
    if L > .9: return '#17162E'
    if L > .78: return '#1E1C3A'
    return None

def mapval(prop, val, base):
    text = prop == 'color'
    ch = False
    if base:  # ألوان الصفحة الأساسية: أولًا إلى التصميم الفاتح كما في auto.py
        v2, c2 = A.mapval(prop, val); val = v2
    def sub(m):
        nonlocal ch
        n = dark_hex(m.group(0), text)
        if n and n != full(m.group(0)): ch = True; return n
        return m.group(0)
    val = HEX.sub(sub, val)
    if re.search(r'\bwhite\b', val) and not text:
        val = re.sub(r'\bwhite\b', '#17162E', val); ch = True
    nv = re.sub(r'rgba\(\s*(30\s*,\s*27\s*,\s*75|13\s*,\s*27\s*,\s*61)\s*,\s*([0-9.]+)\s*\)', lambda m: 'rgba(0,0,0,%.2f)' % min(.6, float(m.group(2)) * 2.5), val)
    if nv != val: val, ch = nv, True
    if prop in BGP and not base:
        nv = re.sub(r'var\(--s-pri\)', 'var(--s-pri-bg)', val); nv = re.sub(r'var\(--s-pri-h\)', 'var(--s-pri-bg-h)', nv); nv = re.sub(r'var\(--s-ink\)', 'var(--s-ink-bg)', nv)
        if nv != val: val, ch = nv, True
    if prop in BGP:  # رموز يفتح لونها في الليل لأنها نصّ في الغالب؛ إن كانت تعبئة أخذت قيمة تعبئة داكنة يُقرأ عليها النص الأبيض
        nv = re.sub(r'var\((--(?:navy-900|blue-800|blue-600|teal-700|orange-700))\)', lambda m: FILLVAR[m.group(1)], val)
        if nv != val: val, ch = nv, True
    return val, ch

def split_top(sel):
    """يقسم قائمة المحددات عند الفواصل العليا فقط، لا داخل :is() و:where() و:not()"""
    parts, depth, cur = [], 0, ''
    for ch in sel:
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        if ch == ',' and depth == 0: parts.append(cur); cur = ''
        else: cur += ch
    parts.append(cur)
    return parts

PAPER_IN = ':not(:where(.ps,.sheet,.nbp,#fdPrint,.tk-pdfbox,.lx,.lb-sheet) *)'  # ما داخل الورق يبقى بألوان النهار (بلا وزن إضافي للمحدد)

def guard(p):
    """يضيف شرط «ليس داخل الورق» إلى العنصر الأخير قبل أي عنصر زائف (::before ونحوه)"""
    depth, cut = 0, None
    for i, ch in enumerate(p):
        if ch in '([': depth += 1
        elif ch in ')]': depth -= 1
        elif depth == 0 and ch == ':' and (p[i:i + 2] == '::' or re.match(r':(before|after|first-line|first-letter)\b', p[i:])) and (i == 0 or p[i - 1] != ':'):
            cut = i; break
    return p + PAPER_IN if cut is None else p[:cut] + PAPER_IN + p[cut:]

def dsel(sel, base):
    out = []
    for part in split_top(sel):
        p = part.strip()
        if not p or PAPER.search(p) or 'data-theme' in p: continue
        if base:
            if 'data-model' in p: continue
            p = re.sub(r':root:not\(\[data-theme="light"\]\)', ':root', p)
            if p.startswith(':root'): p = 'html[data-model="2"][data-theme="dark"]' + p[5:]
            elif p.startswith('html'): p = 'html[data-model="2"][data-theme="dark"]' + p[4:]
            else: p = 'html[data-model="2"][data-theme="dark"] ' + p
        else:
            if not p.startswith('html[data-model="2"]'): continue
            rest = p[len('html[data-model="2"]'):]
            if rest.strip() == '': continue  # كتلة الرموز: لليل رموزه في m2.css
            p = 'html[data-model="2"][data-theme="dark"]' + rest
        if p != ROOT_DARK: p = guard(p)
        out.append(p)
    return ', '.join(out)

def walk(rules, base, out, media=None):
    for r in rules:
        if r.type == 'qualified-rule':
            sel = tinycss2.serialize(r.prelude).strip()
            decls = tinycss2.parse_declaration_list(r.content, skip_whitespace=True, skip_comments=True)
            ps = dsel(sel, base)
            if not ps: continue
            # لون نص مكتوب في style مع خلفية مكتوبة معه (درجات السلّم وأمثالها): صُمِّما معًا، فيبقيان كما في النهار
            if '[style*="color:' in sel: ps = ps.replace(PAPER_IN, PAPER_IN + ':not([style*="background"])')
            new = []
            for d in decls:
                if d.type != 'declaration': continue
                prop = d.lower_name; val = tinycss2.serialize(d.value).strip()
                if prop not in COLPROPS and not prop.startswith('--'): continue
                if prop.startswith('--'):
                    if ps == ROOT_DARK: continue  # رموز :root لليل مكتوبة في m2.css
                    if not HEX.search(val) and 'rgba' not in val: continue
                    if prop in TOK: new.append((prop, TOK[prop], d.important)); continue
                nv, ch = mapval(prop, val, base)
                if ch: new.append((prop, nv, d.important))
            # نص كحلي على صبغة فاتحة في القاعدة نفسها: الصبغة تصير داكنة في الليل، فيصير النص فاتحًا
            ds = [d for d in decls if d.type == 'declaration']
            bgv = ' '.join(tinycss2.serialize(d.value) for d in ds if d.lower_name in ('background', 'background-color'))
            if TINT.search(bgv):
                for d in ds:
                    if d.lower_name == 'color' and 'var(--navy-900)' in tinycss2.serialize(d.value):
                        new = [x for x in new if x[0] != 'color'] + [('color', 'var(--s-ink)', d.important)]
            if not new: continue
            out.append((media, ps + '{' + ';'.join(f'{p}:{v}' + ('!important' if i else '') for p, v, i in new) + '}'))
        elif r.type == 'at-rule' and r.content:
            kw = r.lower_at_keyword; pre = tinycss2.serialize(r.prelude).strip()
            if kw == 'media':
                if 'print' in pre or ('prefers-color-scheme' in pre): continue
                walk(tinycss2.parse_rule_list(r.content, skip_whitespace=True, skip_comments=True), base, out, pre if not media else media + ' and ' + pre)
            elif kw == 'supports':
                walk(tinycss2.parse_rule_list(r.content, skip_whitespace=True, skip_comments=True), base, out, media)

src = (R / PAGE).read_text(encoding='utf-8'); src = re.sub(r'<!--m2:start-->.*?<!--m2:end-->', '', src, flags=re.S)
base_css = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', src, re.S))
light_css = (R / LIGHT).read_text(encoding='utf-8') if (R / LIGHT).exists() else LIGHT
out = []
walk(tinycss2.parse_stylesheet(base_css, skip_whitespace=True, skip_comments=True), True, out)
walk(tinycss2.parse_stylesheet(light_css, skip_whitespace=True, skip_comments=True), False, out)
lines = ['/* مولَّد آليًّا بالأداة m2/dark.py: الوضع الليلي لألوان الصفحة المكتوبة. لا يُعدَّل باليد. */']
cur = None
for media, rule in out:
    if media != cur:
        if cur is not None: lines.append('}')
        if media is not None: lines.append(f'@media {media}{{')
        cur = media
    lines.append(rule)
if cur is not None: lines.append('}')
(R / OUT).write_text('\n'.join(lines) + '\n', encoding='utf-8')
print(OUT, len(out), 'rules')
