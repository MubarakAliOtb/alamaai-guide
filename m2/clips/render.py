"""يصوّر مقاطع نموذج 2 من مشاهد stage.html.
الاستعمال: python3 render.py stills name[,name] t1,t2 ... ← صور للمراجعة في /tmp/clipf
           python3 render.py video name[,name|all]         ← vid/m2/<name>.mp4
"""
import asyncio, os, subprocess, sys
from playwright.async_api import async_playwright
ALL = 'brain load dual gestalt bell ask mayer dt ubd gagne bloom udl kirk chain daftar dialog proj distance ucurve'.split()
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
URL = 'http://localhost:8765/m2/clips/stage.html?s='

async def open_scene(br, name):
    pg = await br.new_page(viewport={'width': 1200, 'height': 900}, device_scale_factor=1)
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    await pg.goto(URL + name)
    await pg.wait_for_function('window.READY===true||!!window.ERR', timeout=30000)
    if errs: print(name, 'ERRORS:', errs)
    return pg

async def stills(br, name, times):
    pg = await open_scene(br, name)
    os.makedirs('/tmp/clipf', exist_ok=True)
    for t in times:
        await pg.evaluate(f'render({t})')
        await pg.screenshot(path=f'/tmp/clipf/{name}_{t}.png')
    await pg.close()

async def video(br, name):
    pg = await open_scene(br, name)
    out = os.path.join(ROOT, 'vid', 'm2', name + '.mp4'); tmp = out[:-4] + '.part.mp4'
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-',
                          '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-tune', 'animation', '-pix_fmt', 'yuv420p',
                          '-movflags', '+faststart', '-an', tmp], stdin=subprocess.PIPE)
    for i in range(240):
        await pg.evaluate(f'render({i / 30})')
        p.stdin.write(await pg.screenshot(type='jpeg', quality=92))
    p.stdin.close(); rc = p.wait(); await pg.close()
    if rc == 0: os.replace(tmp, out); print('ok', name, os.path.getsize(out))
    else: print('FAILED', name, rc)

async def main():
    mode, names = sys.argv[1], sys.argv[2]
    names = ALL if names == 'all' else names.split(',')
    async with async_playwright() as p:
        br = await p.chromium.launch(executable_path='/usr/bin/google-chrome')
        if mode == 'stills':
            times = [float(x) for x in sys.argv[3].split(',')]
            await asyncio.gather(*[stills(br, n, times) for n in names])
        else:
            sem = asyncio.Semaphore(2)
            async def one(n):
                async with sem: await video(br, n)
            await asyncio.gather(*[one(n) for n in names])
        await br.close()
asyncio.run(main())
