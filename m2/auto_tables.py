# جداول تحويل ألوان الصفحة الأساسية (النموذج القديم) إلى التصميم البسيط، يستعملها auto.py وdark.py.
import re
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

