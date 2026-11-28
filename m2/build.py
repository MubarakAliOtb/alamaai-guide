# يدمج طبقة التصميم في صفحات الموقع بين علامتين، ويثبّت data-model="2" في وسم <html> فلا يظهر التصميم الأساسي القديم لحظة التحميل.
# التصميم واحد منذ إلغاء النموذج السابق: لا مبدّل في الشريط العلوي ولا في قائمة «المزيد». يُعاد تشغيله بعد كل تعديل.
import re, pathlib, subprocess, sys
M = pathlib.Path(__file__).resolve().parent; R = M.parent
PAGES = [('index.html', ''), ('vsc/index.html', '../'), ('lxd/index.html', '../')]
subprocess.run([sys.executable, str(M / 'nb.py')], check=True)
core_css = (M / 'm2.css').read_text(encoding='utf-8'); js = (M / 'm2.js').read_text(encoding='utf-8')
import json as _json
nb_in = (M / 'nb-inapp.css').read_text(encoding='utf-8'); nb_ex = (M / 'nb-export.css').read_text(encoding='utf-8')
# «بطاقات الدليل» (v130): أنماطها kb.css، ومحتواها ومحركها kb-data.js و kb.js يُحقنان داخل السكربت الرئيسي في index.html وحدها
kb_css = (M / 'kb.css').read_text(encoding='utf-8'); kb_js = (M / 'kb-data.js').read_text(encoding='utf-8') + '\n' + (M / 'kb.js').read_text(encoding='utf-8')
# «القراءة المركّزة» (v131): فهرس الجزء وقسم واحد كل مرة. pg.js يُحقن بعد kb.js في الموضع نفسه، وpg.css بعد kb.css
kb_css += (M / 'pg.css').read_text(encoding='utf-8'); kb_js += '\n' + (M / 'pg.js').read_text(encoding='utf-8')
# «ألعاب الآركيد» (v133): أربع ألعاب سريعة من المنهج، تُحقن بين /*arc:start*/…/*arc:end*/ بعد ألعاب «اكتشف الخطأ» في index.html
arc_css = (M / 'arc.css').read_text(encoding='utf-8'); arc_js = (M / 'arc.js').read_text(encoding='utf-8')
# «سجلّا الإنجاز» (v134): سجل إنجاز المعلم وسجل إنجاز المتعلمين، يُحقنان بين /*sj:start*/…/*sj:end*/ بعد أدوات «بعد الحصة» في index.html
sj_css = (M / 'sj.css').read_text(encoding='utf-8'); sj_js = (M / 'sj.js').read_text(encoding='utf-8')
# «الحلول البصرية» للمادتين وشاشة الحصة (v132): vx-data.js أمثلة المادتين، وvx.js المحرك التفاعلي، يُحقنان داخل السكربت الرئيسي في vsc/index.html، وvx.css مع أنماطها
vx_css = (M / 'vx.css').read_text(encoding='utf-8'); vx_data = (M / 'vx-data.js').read_text(encoding='utf-8'); vx_js = '\n'.join((M / f).read_text(encoding='utf-8') for f in ('vx-tpl.js', 'vx-play.js', 'vx.js'))
# «نظام الصور الموحّد» (v132): رأس مصوَّر بعرض الصفحة وفواصل، للحلول البصرية وهندسة تجربة التعلّم كما في رئيسية الدليل
band_css = (M / 'band.css').read_text(encoding='utf-8'); band_js = (M / 'band.js').read_text(encoding='utf-8')
# «هندسة تجربة التعلّم» (v132): المختبر كله في lx.js وأنماطه في lx.css، يُحقن في lxd/index.html
lx_css = (M / 'lx.css').read_text(encoding='utf-8') if (M / 'lx.css').exists() else ''; lx_js = (M / 'lx.js').read_text(encoding='utf-8') if (M / 'lx.js').exists() else ''
for page, up in PAGES:
    p = R / page
    if not p.exists(): continue
    out = f'm2/auto-{page.replace("/", "-").replace(".html", "")}.css'
    subprocess.run([sys.executable, str(M / 'auto.py'), page, out], check=True)
    css = (R / out).read_text(encoding='utf-8') + core_css + (kb_css + arc_css + sj_css + nb_in if page == 'index.html' else band_css + vx_css if page == 'vsc/index.html' else band_css + lx_css if page == 'lxd/index.html' else '')
    # الوضع الليلي: قواعد مولَّدة لكل لون مكتوب في الصفحة وفي الطبقة الفاتحة (m2/dark.py)
    light = M / ('_light-' + page.replace('/', '-').replace('.html', '') + '.css'); light.write_text(css, encoding='utf-8')
    dk = f'm2/dark-{page.replace("/", "-").replace(".html", "")}.css'
    subprocess.run([sys.executable, str(M / 'dark.py'), page, str(light.relative_to(R)), dk], check=True); light.unlink()
    css += (R / dk).read_text(encoding='utf-8')
    if up: css = css.replace('url("fonts/', f'url("{up}fonts/').replace('url("m2/', f'url("{up}m2/').replace('url("vid/', f'url("{up}vid/')
    js_p = js.replace("var M2_BASE = '';", f"var M2_BASE = '{up}';")
    if page != 'index.html': js_p += band_js
    if page == 'index.html': js_p += '\nwindow.NB_PCSS_M2 = ' + _json.dumps(nb_ex, ensure_ascii=False).replace('</', '<\\/') + ';\n'
    s = p.read_text(encoding='utf-8')
    if page == 'index.html':
        assert '/*kb:start*/' in s and '/*kb:end*/' in s and '</script' not in kb_js
        s = re.sub(r'/\*kb:start\*/.*?/\*kb:end\*/', lambda m: '/*kb:start*/\n' + kb_js + '/*kb:end*/', s, count=1, flags=re.S)
        assert '/*arc:start*/' in s and '</script' not in arc_js
        s = re.sub(r'/\*arc:start\*/.*?/\*arc:end\*/', lambda m: '/*arc:start*/\n' + arc_js + '/*arc:end*/', s, count=1, flags=re.S)
        assert '/*sj:start*/' in s and '</script' not in sj_js
        s = re.sub(r'/\*sj:start\*/.*?/\*sj:end\*/', lambda m: '/*sj:start*/\n' + sj_js + '/*sj:end*/', s, count=1, flags=re.S)
    if page == 'vsc/index.html':
        assert '/*vxd:start*/' in s and '/*vx:start*/' in s and '</script' not in vx_data + vx_js
        s = re.sub(r'/\*vxd:start\*/.*?/\*vxd:end\*/', lambda m: '/*vxd:start*/\n' + vx_data + '/*vxd:end*/', s, count=1, flags=re.S)
        s = re.sub(r'/\*vx:start\*/.*?/\*vx:end\*/', lambda m: '/*vx:start*/\n' + vx_js + '/*vx:end*/', s, count=1, flags=re.S)
    if page == 'lxd/index.html' and lx_js and '/*lx:start*/' in s:
        assert '</script' not in lx_js
        s = re.sub(r'/\*lx:start\*/.*?/\*lx:end\*/', lambda m: '/*lx:start*/\n' + lx_js + '/*lx:end*/', s, count=1, flags=re.S)
    block = f'<!--m2:start--><style id="m2Css">\n{css}</style>\n<script id="m2Js">\n{js_p}</script><!--m2:end-->\n'
    if '<!--m2:start-->' in s: s = re.sub(r'<!--m2:start-->.*?<!--m2:end-->\n', lambda m: block, s, count=1, flags=re.S)
    else: i = s.index('</head>'); s = s[:i] + block + s[i:]
    # النموذج الوحيد: data-model="2" ثابت في وسم الصفحة، ومبدّل النموذجين يُزال إن وُجد
    s = re.sub(r'<html(?![^>]*data-model)([^>]*)>', r'<html\1 data-model="2">', s, count=1)
    s = re.sub(r'<div class="m2-switch" role="group".*?</div>\n    ', '', s, count=1, flags=re.S)
    s = re.sub(r'<div class="m2-menu-sw".*?</span></div>', '', s, count=1, flags=re.S)
    p.write_text(s, encoding='utf-8'); print('built', page, len(s.encode()))
# فحص الاتساق (v131): صيغة محظورة أو رابط داخلي مكسور يُفشل البناء
subprocess.run([sys.executable, str(M / 'check.py')], check=True)
