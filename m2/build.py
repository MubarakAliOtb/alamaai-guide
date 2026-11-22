# يدمج طبقة التصميم في صفحات الموقع بين علامتين، ويثبّت data-model="2" في وسم <html> فلا يظهر التصميم الأساسي القديم لحظة التحميل.
# التصميم واحد منذ إلغاء النموذج السابق: لا مبدّل في الشريط العلوي ولا في قائمة «المزيد». يُعاد تشغيله بعد كل تعديل.
import re, pathlib, subprocess, sys
M = pathlib.Path(__file__).resolve().parent; R = M.parent
PAGES = [('index.html', ''), ('vsc/index.html', '../'), ('lxd/index.html', '../')]
subprocess.run([sys.executable, str(M / 'nb.py')], check=True)
core_css = (M / 'm2.css').read_text(encoding='utf-8'); js = (M / 'm2.js').read_text(encoding='utf-8')
import json as _json
nb_in = (M / 'nb-inapp.css').read_text(encoding='utf-8'); nb_ex = (M / 'nb-export.css').read_text(encoding='utf-8')
for page, up in PAGES:
    p = R / page
    if not p.exists(): continue
    out = f'm2/auto-{page.replace("/", "-").replace(".html", "")}.css'
    subprocess.run([sys.executable, str(M / 'auto.py'), page, out], check=True)
    css = (R / out).read_text(encoding='utf-8') + core_css + (nb_in if page == 'index.html' else '')
    # الوضع الليلي: قواعد مولَّدة لكل لون مكتوب في الصفحة وفي الطبقة الفاتحة (m2/dark.py)
    light = M / ('_light-' + page.replace('/', '-').replace('.html', '') + '.css'); light.write_text(css, encoding='utf-8')
    dk = f'm2/dark-{page.replace("/", "-").replace(".html", "")}.css'
    subprocess.run([sys.executable, str(M / 'dark.py'), page, str(light.relative_to(R)), dk], check=True); light.unlink()
    css += (R / dk).read_text(encoding='utf-8')
    if up: css = css.replace('url("fonts/', f'url("{up}fonts/').replace('url("m2/', f'url("{up}m2/').replace('url("vid/', f'url("{up}vid/')
    js_p = js.replace("var M2_BASE = '';", f"var M2_BASE = '{up}';")
    if page == 'index.html': js_p += '\nwindow.NB_PCSS_M2 = ' + _json.dumps(nb_ex, ensure_ascii=False).replace('</', '<\\/') + ';\n'
    s = p.read_text(encoding='utf-8')
    block = f'<!--m2:start--><style id="m2Css">\n{css}</style>\n<script id="m2Js">\n{js_p}</script><!--m2:end-->\n'
    if '<!--m2:start-->' in s: s = re.sub(r'<!--m2:start-->.*?<!--m2:end-->\n', lambda m: block, s, count=1, flags=re.S)
    else: i = s.index('</head>'); s = s[:i] + block + s[i:]
    # النموذج الوحيد: data-model="2" ثابت في وسم الصفحة، ومبدّل النموذجين يُزال إن وُجد
    s = re.sub(r'<html(?![^>]*data-model)([^>]*)>', r'<html\1 data-model="2">', s, count=1)
    s = re.sub(r'<div class="m2-switch" role="group".*?</div>\n    ', '', s, count=1, flags=re.S)
    s = re.sub(r'<div class="m2-menu-sw".*?</span></div>', '', s, count=1, flags=re.S)
    p.write_text(s, encoding='utf-8'); print('built', page, len(s.encode()))
