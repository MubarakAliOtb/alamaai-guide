# يولّد m2-auto.css: يمرّ على كل قواعد الأنماط في index.html، ويأخذ كل تصريح فيه لون مكتوب من ألوان النموذج 1
# (أو تدرّج)، ويكتب له قاعدة مقابلة تحت html[data-model="2"] بألوان النموذج 2. النص فوق الألوان الملونة حبر دائمًا.
import re, pathlib, tinycss2
R = pathlib.Path(__file__).resolve().parent.parent
import sys
PAGE = sys.argv[1] if len(sys.argv) > 1 else 'index.html'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'm2/m2-auto.css'
src = (R / PAGE).read_text(encoding='utf-8')
src = re.sub(r'<!--m2:start-->.*?<!--m2:end-->', '', src, flags=re.S)
CSS = '\n'.join(re.findall(r'<style[^>]*>(.*?)</style>', src, re.S))

INK = '#1A1A2E'
FILL = {  # خلفيات وحدود وتعبئة
 '#0D1B3D': INK, '#0A1530': INK, '#16264D': INK, '#22345F': '#33334D', '#1E3A8A': INK, '#16306F': INK, '#1B3A86': INK, '#1B2D5C': INK, '#13111A': INK, '#1D1A2B': INK,
 '#334A7A': '#4A4A5E', '#4A5878': '#4A4A5E',
 '#2563EB': '#4D7CFE', '#1D4ED8': '#4D7CFE',
 '#14B8A6': '#2EC4A0', '#0B7C70': '#2EC4A0', '#0F766E': '#2EC4A0', '#5EEAD4': '#6FDCC0', '#5FD3C5': '#6FDCC0',
 '#FF7A1A': '#FF7A5C', '#FFB26B': '#FFD66B', '#B54E00': '#FF7A5C', '#FFB37A': '#FFD66B', '#FFB466': '#FFD66B', '#C2410C': '#FF7A5C', '#F2B84B': '#FFC93C', '#E9C46A': '#FFC93C',
 '#EEF4FF': '#FFF6E5', '#F1F5FF': '#FFF6E5', '#DCE7FF': '#E3EBFF', '#B9CDFB': '#C9D7FF', '#8DB0F7': '#93AEFF', '#A9BCE6': '#C9D7FF', '#B9C8EA': '#E6DCC8', '#C9D6F2': '#E6DCC8', '#C9D6F5': '#E6DCC8', '#9DB0DA': '#B8B2A6',
 '#E7F8F5': '#DDF6EE', '#C6EFE9': '#C4F0E3', '#FFF3E8': '#FFF0C4', '#FFE1C7': '#FFE7A3',
 '#B9C9E8': '#B8B2A6', '#D5E0F2': '#E6DCC8', '#AEBBD6': '#B8B2A6', '#8E9BB5': '#8A8578', '#9AA6BF': '#8A8578', '#8DA0C8': '#8A8578', '#6B80AD': '#6B6B7E', '#C9D3E6': '#E6DCC8',
}
TEXT = {  # لون النص: درجات تقرأ على الفاتح
 '#0D1B3D': INK, '#0A1530': INK, '#16264D': INK, '#1E3A8A': INK, '#1D1A2B': INK, '#22345F': INK, '#16306F': INK,
 '#334A7A': '#4A4A5E', '#4A5878': '#4A4A5E', '#6B80AD': '#5A5A6E',
 '#2563EB': '#2D4FCB', '#1D4ED8': '#2D4FCB',
 '#14B8A6': '#13806A', '#0B7C70': '#13806A', '#0F766E': '#13806A',
 '#FF7A1A': '#B23A1E', '#B54E00': '#B23A1E', '#C2410C': '#B23A1E',
 '#FFB26B': '#FFC93C', '#FFB37A': '#FFC93C', '#FFB466': '#FFC93C', '#5FD3C5': '#6FDCC0', '#5EEAD4': '#6FDCC0', '#8DB0F7': '#93AEFF', '#B9CDFB': '#C9D7FF',
 '#DCE7FF': '#FFF6E5', '#EEF4FF': '#FFF6E5', '#C9D6F2': '#E6DCC8', '#AEBBD6': '#D8D2C4', '#B9C9E8': '#D8D2C4',
}
MID = {'#4D7CFE', '#2EC4A0', '#FFC93C', '#FFD66B', '#FF7A5C', '#6FDCC0', '#93AEFF', '#C9D7FF'}  # ألوان النص فوقها حبر
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
        val = re.sub(r'rgba\(\s*13\s*,\s*27\s*,\s*61\s*,\s*([0-9.]+)\s*\)', lambda m: f'rgba(26,26,46,{m.group(1)})', val); changed = True
    return val, changed

def sel_prefix(sel):
    out = []
    for part in sel.split(','):
        p = part.strip()
        if not p or 'data-theme="dark"' in p or "data-theme='dark'" in p or 'data-model' in p: continue
        p = re.sub(r':root:not\(\[data-theme="light"\]\)', ':root', p)
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
inline = sorted(set(m for m in re.findall(r'(?:background|color|border-color|fill|stroke)\s*:\s*#[0-9A-Fa-f]{6}', src)))
for decl in inline:
    prop, h = [x.strip() for x in decl.split(':')]
    n = (TEXT if prop == 'color' else FILL).get(norm(h))
    if not n or n.upper() == norm(h): continue
    out.append(f'html[data-model="2"] [style*="{prop}:{h}"]{{{prop}:{n}!important}}')
svg = []
for h0, n0 in FILL.items():
    if n0.upper() == h0: continue
    for a in ('fill', 'stroke', 'stop-color'):
        svg.append(f'html[data-model="2"] [{a}="{h0}" i]{{{a}:{n0}}}')
out += svg
(R / OUT).write_text('\n'.join(out) + '\n', encoding='utf-8')
print(len(rules_out), 'rules;', sum(len(x) for x in out), 'bytes')
