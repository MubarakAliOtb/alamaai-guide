# يدمج طبقة «نموذج 2» في صفحات الموقع بين علامتين، ويضع مبدّل النموذجين في الشريط العلوي للصفحة الرئيسة. يُعاد تشغيله بعد كل تعديل.
import re, pathlib, subprocess, sys
M = pathlib.Path(__file__).resolve().parent; R = M.parent
PAGES = [('index.html', ''), ('vsc/index.html', '../'), ('lxd/index.html', '../')]
core_css = (M / 'm2.css').read_text(encoding='utf-8'); js = (M / 'm2.js').read_text(encoding='utf-8')
sw = '<div class="m2-switch" role="group" aria-label="نموذج التصميم"><button type="button" data-m2set="1" aria-pressed="true"><span class="m2-w">نموذج&nbsp;</span>1</button><button type="button" data-m2set="2" aria-pressed="false"><span class="m2-w">نموذج&nbsp;</span>2</button></div>\n    '
for page, up in PAGES:
    p = R / page
    if not p.exists(): continue
    out = f'm2/auto-{page.replace("/", "-").replace(".html", "")}.css'
    subprocess.run([sys.executable, str(M / 'auto.py'), page, out], check=True)
    css = (R / out).read_text(encoding='utf-8') + core_css
    if up: css = css.replace('url("fonts/', f'url("{up}fonts/').replace('url("m2/', f'url("{up}m2/')
    s = p.read_text(encoding='utf-8')
    block = f'<!--m2:start--><style id="m2Css">\n{css}</style>\n<script id="m2Js">\n{js}</script><!--m2:end-->\n'
    if '<!--m2:start-->' in s: s = re.sub(r'<!--m2:start-->.*?<!--m2:end-->\n', lambda m: block, s, count=1, flags=re.S)
    else: i = s.index('</head>'); s = s[:i] + block + s[i:]
    if page == 'index.html':
        anchor = '<button class="theme-btn" id="themeBtn"'
        if 'class="m2-switch"' in s: s = re.sub(r'<div class="m2-switch".*?</div>\n    ', lambda m: sw, s, count=1, flags=re.S)
        else: s = s.replace(anchor, sw + anchor, 1)
    p.write_text(s, encoding='utf-8'); print('built', page, len(s.encode()))
