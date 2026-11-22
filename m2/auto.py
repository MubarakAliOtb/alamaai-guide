# يولّد m2-auto.css: يمرّ على كل قواعد الأنماط في index.html، ويأخذ كل تصريح فيه لون مكتوب من ألوان النموذج 1
# (أو تدرّج)، ويكتب له قاعدة مقابلة تحت html[data-model="2"] بألوان النموذج 2. النص فوق الألوان الملونة حبر دائمًا.
import re, pathlib, tinycss2
R = pathlib.Path(__file__).resolve().parent.parent
import sys
PAGE = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'm2/m2-auto.css'
src = (R / PAGE).read_text(encoding='utf-8')
src = re.sub(r'<!--m2:start-->.*?<!--m2:end-->', '', src, flags=re.S)
RAW = PAGE.endswith('.css'); NOPREFIX = len(sys.argv) > 3 and sys.argv[3] == 'noprefix'
CSS = src if RAW else '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', src, re.S))

INK = '#1E1B4B'
# نموذج 2 البسيط: نيلي للنصوص والأسطح الداكنة، وبنفسجي للإجراء الرئيسي، ونعناعي للتمييز، ودرجاتها الفاتحة للأسطح
FILL = {  # خلفيات وحدود وتعبئة
 '#0D1B3D': INK, '#0A1530': INK, '#16264D': INK, '#1E3A8A': INK, '#16306F': INK, '#1B3A86': INK, '#1B2D5C': INK, '#13111A': INK, '#1D1A2B': INK, '#22345F': '#2A2660',
 '#334A7A': '#5B5880', '#4A5878': '#5B5880',
 '#2563EB': '#6D28D9', '#1D4ED8': '#5B21B6',
 '#14B8A6': '#34D399', '#0B7C70': '#047857', '#0F766E': '#047857', '#5EEAD4': '#6EE7B7', '#5FD3C5': '#6EE7B7',
 '#FF7A1A': '#34D399', '#B54E00': '#047857', '#C2410C': '#047857', '#FFB26B': '#A7F3D0', '#FFB37A': '#A7F3D0', '#FFB466': '#A7F3D0', '#F2B84B': '#6EE7B7', '#E9C46A': '#6EE7B7',
 '#EEF4FF': '#F7F6FB', '#F1F5FF': '#F7F6FB', '#DCE7FF': '#EDE9FE', '#B9CDFB': '#DDD6FE', '#8DB0F7': '#A78BFA', '#A9BCE6': '#C4B5FD', '#B9C8EA': '#E7E5F2', '#C9D6F2': '#E7E5F2', '#C9D6F5': '#E7E5F2', '#9DB0DA': '#A6A3C2',
 '#E7F8F5': '#ECFDF5', '#C6EFE9': '#D1FAE5', '#FFF3E8': '#ECFDF5', '#FFE1C7': '#D1FAE5',
 '#B9C9E8': '#D4D1E6', '#D5E0F2': '#E7E5F2', '#AEBBD6': '#C9C6DD', '#8E9BB5': '#8C89AB', '#9AA6BF': '#8C89AB', '#8DA0C8': '#8C89AB', '#6B80AD': '#6E6B8F', '#C9D3E6': '#E7E5F2',
}
TEXT = {  # لون النص: درجات تقرأ على الفاتح، والفاتحة منها للنص فوق النيلي
 '#0D1B3D': INK, '#0A1530': INK, '#16264D': INK, '#1E3A8A': INK, '#1D1A2B': INK, '#22345F': INK, '#16306F': INK,
 '#334A7A': '#5B5880', '#4A5878': '#5B5880', '#6B80AD': '#6E6B8F',
 '#2563EB': '#6D28D9', '#1D4ED8': '#5B21B6',
 '#14B8A6': '#047857', '#0B7C70': '#047857', '#0F766E': '#047857',
 '#FF7A1A': '#047857', '#B54E00': '#047857', '#C2410C': '#047857',
 '#FFB26B': '#6EE7B7', '#FFB37A': '#6EE7B7', '#FFB466': '#6EE7B7', '#5FD3C5': '#6EE7B7', '#5EEAD4': '#6EE7B7', '#8DB0F7': '#C4B5FD', '#B9CDFB': '#DDD6FE',
 '#DCE7FF': '#F5F3FF', '#EEF4FF': '#F5F3FF', '#C9D6F2': '#D4D1E6', '#AEBBD6': '#C9C6DD', '#B9C9E8': '#C9C6DD',
}
MID = {'#34D399', '#6EE7B7', '#A7F3D0', '#A78BFA', '#C4B5FD', '#DDD6FE', '#EDE9FE', '#D1FAE5'}  # ألوان النص فوقها نيلي
COLPROPS = {'background', 'background-color', 'background-image', 'border', 'border-color', 'border-top', 'border-bottom', 'border-left', 'border-right',
            'border-inline-start', 'border-inline-end', 'border-block-start', 'border-block-end', 'border-top-color', 'border-bottom-color', 'border-inline-start-color',
            'outline', 'outline-color', 'fill', 'stroke', 'caret-color', 'accent-color', 'text-decoration-color', 'column-rule', 'box-shadow', 'text-shadow', 'color', '--door', '--c', '--k', '--bg', '--fg', '--accent', '--tone', '--col'}
HEX = re.compile(r'#[0-9A-Fa-f]{6}\b')
GRAD = re.compile(r'(?:repeating-)?(?:linear|radial|conic)-gradient\((?:[^()]|\([^()]*\))*\)')

def norm(h): return h.upper()
def mapval(prop, val):
    table = TEXT if prop == 'color' else FILL
    changed = False
    if prop in ('background', 'background-image') and GRAD.search(val):
        def flat(m):
            hs = HEX.findall(m.group(0))
            if not hs: return m.group(0)
            c = FILL.get(norm(hs[0]), hs[0])
            return f'linear-gradient({c},{c})'
        nv = GRAD.sub(flat, val)
        if nv != val: val, changed = nv, True
    def sub(m):
        nonlocal changed
        h = norm(m.group(0)); n = table.get(h)
        if n and n.upper() != h: changed = True; return n
        return m.group(0)
    val = HEX.sub(sub, val)
    if prop in ('box-shadow',) and 'rgba(13,27,61' in val.replace(' ', ''):
        val = re.sub(r'rgba\(\s*13\s*,\s*27\s*,\s*61\s*,\s*([0-9.]+)\s*\)', lambda m: f'rgba(30,27,75,{m.group(1)})', val); changed = True
    return val, changed

def sel_prefix(sel):
    out = []
    for part in sel.split(','):
        p = part.strip()
        if not p or 'data-theme="dark"' in p or "data-theme='dark'" in p or 'data-model' in p: continue
        p = re.sub(r':root:not\(\[data-theme="light"\]\)', ':root', p)
        if NOPREFIX: out.append(p); continue
        if p.startswith(':root'): p = 'html[data-model="2"]' + p[5:]
        elif p.startswith('html'): p = 'html[data-model="2"]' + p[4:]
        else: p = 'html[data-model="2"] ' + p
        out.append(p)
    return ', '.join(out)

rules_out = []
def walk(rules, media=None):
    for r in rules:
        if r.type == 'qualified-rule':
            sel = tinycss2.serialize(r.prelude).strip()
            decls = tinycss2.parse_declaration_list(r.content, skip_whitespace=True, skip_comments=True)
            new = []; fills = {}; color_decl = None
            for d in decls:
                if d.type != 'declaration': continue
                prop = d.lower_name; val = tinycss2.serialize(d.value).strip()
                if prop not in COLPROPS and not prop.startswith('--'): continue
                if prop.startswith('--') and not HEX.search(val) and not GRAD.search(val): continue
                nv, ch = mapval(prop, val)
                if prop in ('background', 'background-color'):
                    hs = HEX.findall(nv); fills['bg'] = norm(hs[0]) if hs else None
                if prop == 'color': color_decl = (val, nv)
                if ch: new.append((prop, nv, d.important))
            # النص الأبيض فوق لون متوسط يصير حبرًا
            if fills.get('bg') in MID and color_decl and re.search(r'#fff\b|#ffffff\b|\bwhite\b', color_decl[0], re.I):
                new = [x for x in new if x[0] != 'color'] + [('color', INK, True)]
            if not new: continue
            ps = sel_prefix(sel)
            if not ps: continue
            body = ';'.join(f'{p}:{v}' + ('!important' if imp else '') for p, v, imp in new)
            rules_out.append((media, f'{ps}{{{body}}}'))
        elif r.type == 'at-rule':
            kw = r.lower_at_keyword
            pre = tinycss2.serialize(r.prelude).strip()
            if kw == 'media':
                if 'prefers-color-scheme' in pre and 'dark' in pre: continue
                if r.content: walk(tinycss2.parse_rule_list(r.content, skip_whitespace=True, skip_comments=True), pre if not media else media + ' and ' + pre)
            elif kw == 'supports' and r.content:
                walk(tinycss2.parse_rule_list(r.content, skip_whitespace=True, skip_comments=True), media)

walk(tinycss2.parse_stylesheet(CSS, skip_whitespace=True, skip_comments=True))
out = ['/* مولَّد آليًّا من أنماط index.html بالأداة m2/auto.py: لا يُعدَّل باليد. */']
cur = None
for media, rule in rules_out:
    if media != cur:
        if cur is not None: out.append('}')
        if media is not None: out.append(f'@media {media}{{')
        cur = media
    out.append(rule)
if cur is not None: out.append('}')

# الأنماط المكتوبة داخل الوسوم والقوالب
inline = [] if RAW else sorted(set(m for m in re.findall(r'(?:background|color|border-color|fill|stroke)\s*:\s*#[0-9A-Fa-f]{6}', src)))
for decl in inline:
    prop, h = [x.strip() for x in decl.split(':')]
    n = (TEXT if prop == 'color' else FILL).get(norm(h))
    if not n or n.upper() == norm(h): continue
    out.append(f'html[data-model="2"] [style*="{prop}:{h}"]{{{prop}:{n}!important}}')
svg = []
for h0, n0 in ({} if RAW else FILL).items():
    if n0.upper() == h0: continue
    for a in ('fill', 'stroke', 'stop-color'):
        svg.append(f'html[data-model="2"] [{a}="{h0}" i]{{{a}:{n0}}}')
out += svg
(R / OUT).write_text('\n'.join(out) + '\n', encoding='utf-8')
print(len(rules_out), 'rules;', sum(len(x) for x in out), 'bytes')
