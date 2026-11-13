#!/usr/bin/env python3
"""Headless check for one station game.

  python3 tools/shoot.py games/03-noir/index.html out/03 [--keys "KeyD,ArrowLeft,KeyF,Enter"]

Serves the repo root on localhost, opens the game standalone, and takes screenshots of:
  idle, learn (t=5, t=40), play (t=learn+20 with random key mashing), paused, over.
Prints every console error / page error. Exit code 1 if any errors.
"""
import sys, os, http.server, threading, functools, random, argparse, pathlib
from playwright.sync_api import sync_playwright

ap = argparse.ArgumentParser()
ap.add_argument('game'); ap.add_argument('out')
ap.add_argument('--keys', default='KeyW,KeyA,KeyS,KeyD,KeyF,ArrowUp,ArrowDown,ArrowLeft,ArrowRight,Enter')
ap.add_argument('--mash', type=float, default=12, help='seconds of random key presses in the play phase')
a = ap.parse_args()
root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *x): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Q, directory=str(root)))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/{a.game}?mute=1'

errs = []
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1280, 'height': 720})
    pg.on('console', lambda m: m.type == 'error' and 'Failed to load resource' not in m.text and errs.append('console: ' + m.text))
    pg.on('response', lambda r: r.status >= 400 and 'favicon' not in r.url and errs.append(f'HTTP {r.status}: {r.url}'))
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.goto(url); pg.wait_for_timeout(2500)
    pg.screenshot(path=str(out / '0-idle.png'))
    pg.evaluate('GS._set({active:true, roundId:1, t:0, paused:false})'); pg.wait_for_timeout(300)
    # drive time forward ourselves (headless timers are fine, but we want fixed points)
    def at(t, wait=1200):
        pg.evaluate(f'GS._set({{t:{t}}})'); pg.wait_for_timeout(wait)
    at(5); pg.screenshot(path=str(out / '1-learn-05.png'))
    keys = a.keys.split(',')
    for i in range(20):
        pg.keyboard.press(random.choice(keys)); pg.wait_for_timeout(120)
    at(40); pg.screenshot(path=str(out / '2-learn-40.png'))
    at(75); pg.screenshot(path=str(out / '3-learn-75.png'))
    pg.evaluate('GS.skipLearn()'); pg.wait_for_timeout(800)
    t = 120.0
    end = a.mash
    n = 0
    while n * 0.1 < end:
        k = random.choice(keys)
        pg.keyboard.down(k); pg.wait_for_timeout(60); pg.keyboard.up(k); pg.wait_for_timeout(40)
        n += 1
        if n % 10 == 0:
            t += 1; pg.evaluate(f'GS._set({{t:{t}}})')
    pg.screenshot(path=str(out / '4-play.png'))
    pg.evaluate('GS._set({paused:true, banner:"Teacher test message"})'); pg.wait_for_timeout(500)
    pg.screenshot(path=str(out / '5-paused.png'))
    pg.evaluate('GS._set({paused:false})'); pg.wait_for_timeout(1500)
    pg.screenshot(path=str(out / '6-play-after-pause.png'))
    pg.evaluate('GS._set({t:301})'); pg.wait_for_timeout(600)
    pg.screenshot(path=str(out / '7-over.png'))
    # next pair arrives: must reset cleanly
    pg.evaluate('GS._set({roundId:2, t:2})'); pg.wait_for_timeout(1200)
    pg.screenshot(path=str(out / '8-round2-learn.png'))
    fps = pg.evaluate('''() => new Promise(r => { let n=0; const t0=performance.now(); function f(){ n++; if (performance.now()-t0<2000) requestAnimationFrame(f); else r(n/2); } requestAnimationFrame(f); })''')
    print(f'approx fps (headless software GL): {fps:.0f}')
    b.close()
srv.shutdown()
for e in errs: print(e)
print('OK, no errors' if not errs else f'{len(errs)} errors')
sys.exit(1 if errs else 0)
