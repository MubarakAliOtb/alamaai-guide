#!/usr/bin/env python3
"""يولّد VS_IDX في index.html من صفحات «الحلول البصرية» (vsc/index.html).

VS_IDX فهرس البحث العام في الدليل لصفحات المنصة: [المعرّف، العنوان، التصنيف، العناوين الداخلية، الدور].
كان يولّده بناء المنصة الأصلي خارج المستودع؛ ومنذ v132 يولَّد من هنا بعد كل تعديل على نصوص المنصة:

    python3 m2/vsidx.py            يكتب الفهرس في index.html
    python3 m2/vsidx.py --check    يقارن فقط، ويخرج بـ1 إن اختلف

العناوين الداخلية: نصوص h2 و h3 في الصفحة بترتيبها، بلا تكرار، وبلا شارات مستوى الدليل (.ev) ولا إحالات المراجع (.cite). والدور يبقى كما هو لكل صفحة معروفة (يحدده سكربت المنصة لا وسمها).
"""
import json, pathlib, re, sys
from html.parser import HTMLParser

R = pathlib.Path(__file__).resolve().parent.parent
VSC, IDX = R / 'vsc' / 'index.html', R / 'index.html'


class Views(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.cur, self.depth, self.h, self.buf, self.skip = [], None, 0, None, [], 0
        self.inh = []  # الوسوم المفتوحة داخل العنوان: True لشارة مستوى الدليل (.ev) أو إحالة مرجع (.cite) فيُترك نصها

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'section' and 'view' in (a.get('class') or '').split() and a.get('data-view'):
            self.cur = {'id': a['data-view'], 't': a.get('data-title', ''), 'k': a.get('data-kicker', ''), 'h': []}
            self.out.append(self.cur); self.depth = 1; return
        if self.cur is None: return
        if tag == 'section': self.depth += 1
        if tag in ('script', 'style', 'svg', 'template'): self.skip += 1
        if self.h and tag not in ('br', 'img', 'wbr'): self.inh.append(bool({'ev', 'cite'} & set((a.get('class') or '').split())))
        if tag in ('h2', 'h3') and not self.skip and not self.h: self.h, self.buf, self.inh = tag, [], []

    def handle_endtag(self, tag):
        if self.cur is None: return
        if tag in ('script', 'style', 'svg', 'template') and self.skip: self.skip -= 1
        if self.h and tag != self.h and self.inh: self.inh.pop()
        if self.h and tag == self.h:
            t = re.sub(r'\s+', ' ', re.sub(r'\(\s*\)', '', ''.join(self.buf))).strip()
            if t and t not in self.cur['h']: self.cur['h'].append(t)
            self.h = None
        if tag == 'section':
            self.depth -= 1
            if self.depth == 0: self.cur = None

    def handle_data(self, d):
        if self.h and not self.skip and not any(self.inh): self.buf.append(d)


def main():
    src = VSC.read_text(encoding='utf-8')
    p = Views(); p.feed(src)
    page = IDX.read_text(encoding='utf-8')
    i = page.index('const VS_IDX='); j = page.index('];', i) + 1
    old = json.loads(page[i + len('const VS_IDX='):j])
    role = {o[0]: (o[4] if len(o) > 4 else '') for o in old}
    new = [[v['id'], v['t'], v['k'], ' · '.join(v['h']), role.get(v['id'], '')] for v in p.out]
    ids = [n[0] for n in new]
    assert len(ids) == len(set(ids)) and 'home' in ids, 'معرّفات الصفحات مكررة أو ناقصة'
    raw = json.dumps(new, ensure_ascii=False, separators=(',', ':'))
    assert '</script' not in raw
    same = page[i + len('const VS_IDX='):j] == raw
    print(f'VS_IDX: {len(new)} صفحة (كانت {len(old)})', '— مطابق' if same else '— تغيّر')
    gone = [o[0] for o in old if o[0] not in ids]; add = [n for n in ids if n not in role]
    if gone: print('  صفحات لم تعد في المنصة:', '، '.join(gone))
    if add: print('  صفحات جديدة:', '، '.join(add))
    if '--check' in sys.argv: sys.exit(0 if same else 1)
    if not same: IDX.write_text(page[:i + len('const VS_IDX=')] + raw + page[j:], encoding='utf-8')


if __name__ == '__main__':
    main()
