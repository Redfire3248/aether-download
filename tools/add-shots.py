"""Puts pictures of the apps on the website.

Takes every .png in a folder (by default %TEMP%\\aether-site-app-shots) and saves it as assets/shots/<name>.webp,
which the pages already show. A picture with the same name replaces the old one.

    python tools/add-shots.py [folder]

Pictures the pages look for: aether, aether-ai, aether-debug, game-maker-scene, game-maker-art, game-maker-play,
aether-lab. Until one is there, its window shows the app drawn in HTML or a "picture coming" card.
Needs Pillow (pip install pillow).
"""
import os
import sys
from pathlib import Path

from PIL import Image

src = Path(sys.argv[1] if len(sys.argv) > 1 else Path(os.environ.get('TEMP', '.')) / 'aether-site-app-shots')
out = Path(__file__).resolve().parent.parent / 'assets' / 'shots'
out.mkdir(parents=True, exist_ok=True)
pngs = sorted(src.glob('*.png'))
if not pngs:
    sys.exit(f'No .png pictures in {src}')
for p in pngs:
    im = Image.open(p).convert('RGB')
    if im.width > 2400:  # big enough for any screen, small enough to load fast
        im = im.resize((2400, round(im.height * 2400 / im.width)), Image.LANCZOS)
    dest = out / (p.stem + '.webp')
    im.save(dest, quality=88, method=6)
    print(f'{p.name} -> assets/shots/{dest.name} ({dest.stat().st_size // 1024} KB)')
