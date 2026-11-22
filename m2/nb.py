# يبني أنماط «دفتر المعلم» في نموذج 2: نسخة للصفحة داخل الدليل (تحت html[data-model="2"])، ونسخة لملف الدفتر المنزّل.
import subprocess, sys, pathlib, re
M = pathlib.Path(__file__).resolve().parent; R = M.parent
s = (R / 'index.html').read_text(encoding='utf-8'); i = s.index('const NB_PCSS=`') + 15; j = s.index('`', i)
(M / 'nb-src.css').write_text(s[i:j], encoding='utf-8')
subprocess.run([sys.executable, str(M / 'auto.py'), 'm2/nb-src.css', 'm2/nb-auto-raw.css', 'noprefix'], check=True)
subprocess.run([sys.executable, str(M / 'auto.py'), 'm2/nb-src.css', 'm2/nb-auto-pre.css'], check=True)
hand = (M / 'nb-hand.css').read_text(encoding='utf-8')
def prefix(css):
    out = []
    for sel, body in re.findall(r'([^{}]+)\{([^}]*)\}', css):
        sels = ', '.join('html[data-model="2"] ' + x.strip() for x in sel.split(','))
        out.append(f'{sels}{{{body}}}')
    return '\n'.join(out)
raw = (M / 'nb-auto-raw.css').read_text(encoding='utf-8') + hand
pre = (M / 'nb-auto-pre.css').read_text(encoding='utf-8') + prefix(hand)
(M / 'nb-export.css').write_text(raw, encoding='utf-8'); (M / 'nb-inapp.css').write_text(pre, encoding='utf-8')
print('nb css', len(raw), len(pre))
