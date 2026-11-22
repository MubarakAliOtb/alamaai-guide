# يبني جدول ألوان ثلاثيًّا (‎.cube) يحوّل ألوان مقاطع النموذج 1 إلى ألوان النموذج 2، ثم يطبّقه على vid/*.mp4 فيكتب vid/m2/*.mp4.
# كل لون قريب من لون في القائمة يُزاح نحو مقابله، وما بعُد عنها يبقى كما هو (والرماديات ثابتة).
import numpy as np, subprocess, glob, os
def hx(h): return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], float) / 255
PAIRS = [('#091B43', '#17172A'), ('#102E6E', '#262640'), ('#0E265F', '#22223A'), ('#070F29', '#111120'), ('#0C2256', '#1F1F36'), ('#14367E', '#2B2B47'), ('#133580', '#2B2B47'), ('#163E92', '#30304E'), ('#163B8A', '#2E2E4B'), ('#06243D', '#121D26'), ('#071431', '#121222'),
         ('#0A1530', '#141424'), ('#0D1B3D', '#1A1A2E'), ('#16264D', '#24243A'), ('#16306F', '#2A2A44'), ('#1E3A8A', '#30304E'), ('#22345F', '#2C2C44'),
         ('#2563EB', '#4D7CFE'), ('#1D4ED8', '#3F6CF2'), ('#3B82F6', '#6E95FF'), ('#8DB0F7', '#A9C0FF'), ('#60A5FA', '#86A8FF'),
         ('#14B8A6', '#2EC4A0'), ('#0B7C70', '#1E9E7F'), ('#5FD3C5', '#6FDCC0'), ('#5EEAD4', '#7FE6CC'),
         ('#FF7A1A', '#FF7A5C'), ('#FFB26B', '#FFB49C'), ('#B54E00', '#C2412A'), ('#FF9A47', '#FF9478')]
NEUTRAL = ['#000000', '#FFFFFF', '#808080', '#C0C0C0', '#404040', '#EEEEEE', '#202020']
def lin(c): return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
def lab(rgb):
    M = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    xyz = lin(rgb) @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 0.008856, np.cbrt(xyz), 7.787 * xyz + 16 / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)
S = np.array([hx(a) for a, _ in PAIRS] + [hx(n) for n in NEUTRAL]); T = np.array([hx(b) for _, b in PAIRS] + [hx(n) for n in NEUTRAL])
SL = lab(S)
N = 33
g = np.linspace(0, 1, N)
# ترتيب ملف cube: الأحمر يتغير أسرع
B, G, Rr = np.meshgrid(g, g, g, indexing='ij'); grid = np.stack([Rr, G, B], -1).reshape(-1, 3)
GL = lab(grid)
d = np.linalg.norm(GL[:, None, :] - SL[None, :, :], axis=-1)
sigma = 18.0
w = np.exp(-(d / sigma) ** 2)
w0 = 0.15  # وزن الهوية: الألوان البعيدة لا تتغير
disp = (T - S)[None, :, :]
out = grid + (w[..., None] * disp).sum(1) / (w.sum(1, keepdims=True) + w0)
out = np.clip(out, 0, 1)
with open('/tmp/m2.cube', 'w') as f:
    f.write('TITLE "alm m2"\nLUT_3D_SIZE %d\n' % N)
    for r in out: f.write('%.5f %.5f %.5f\n' % tuple(r))
print('lut ok')
os.makedirs('vid/m2', exist_ok=True)
import sys
files = sys.argv[1:] or sorted(glob.glob('vid/*.mp4'))
for v in files:
    o = 'vid/m2/' + os.path.basename(v)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', v, '-vf', 'lut3d=/tmp/m2.cube:interp=tetrahedral', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23',
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', o], check=True)
    print(o, os.path.getsize(o))
