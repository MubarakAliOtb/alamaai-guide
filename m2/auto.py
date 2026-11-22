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

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from auto_tables import INK, FILL, TEXT, MID, COLPROPS, HEX, GRAD, norm, mapval

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
