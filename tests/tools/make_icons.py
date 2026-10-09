# アプリのアイコン（PNG）を作る：にゃんだ（手描きトレース）をピンクの背景に描く
# 使い方: python tests/tools/make_icons.py   → icons/ に出力
from PIL import Image, ImageDraw
import os

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
OUT = os.path.join(ROOT, 'icons')
os.makedirs(OUT, exist_ok=True)

BG, INK, WHITE, BLUSH = (212, 66, 111), (43, 42, 48), (255, 255, 255), (242, 140, 166)
# index.html の catSVG と同じ座標（viewBox 264x220）
BODY = [(24, 213), (36, 104), (5, 85), (33, 11), (51, 55), (87, 54), (113.6, 5.6), (130, 79), (113, 100), (204, 101), (259, 14), (214, 213), (191, 176), (164, 209), (167, 173), (58, 168.4)]
LEG = [(55.6, 170), (62, 205), (81, 169)]

def draw(size, safe):
    S = 4  # 4倍で描いて縮小（線をなめらかに）
    W = size * S
    img = Image.new('RGBA', (W, W), BG + (255,))
    d = ImageDraw.Draw(img)
    if not safe:  # 通常アイコンは角丸
        mask = Image.new('L', (W, W), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * .22), fill=255)
        img.putalpha(mask)
    # 猫の大きさ：マスカブルは中央80%の安全域に収める
    area = W * (.62 if safe else .78)
    k = area / 264
    ox, oy = (W - 264 * k) / 2, (W - 220 * k) / 2 + W * .02
    P = lambda pts: [(ox + x * k, oy + y * k) for x, y in pts]
    lw = max(2, int(3.2 * k))
    for poly in (BODY, LEG):
        d.polygon(P(poly), fill=WHITE)
        d.line(P(poly) + [P(poly)[0]], fill=INK, width=lw, joint='curve')
    def dot(x, y, r, c):
        cx, cy = ox + x * k, oy + y * k
        d.ellipse([cx - r * k, cy - r * k, cx + r * k, cy + r * k], fill=c)
    dot(31, 101, 6, BLUSH); dot(103, 98, 6, BLUSH)
    dot(39.4, 77, 3.4, INK); dot(88, 75.4, 3.4, INK)
    # ω の口
    pts = []
    import math
    for cx in (57, 69.5):
        pts.append([(ox + (cx - 6 + 12 * t) * k, oy + (93 + 8 * math.sin(math.pi * t)) * k) for t in [i / 12 for i in range(13)]])
    for seg in pts: d.line(seg, fill=INK, width=lw, joint='curve')
    return img.resize((size, size), Image.LANCZOS)

for name, size, safe in [('icon-192.png', 192, False), ('icon-512.png', 512, False), ('icon-maskable-512.png', 512, True), ('apple-touch-icon.png', 180, True)]:
    draw(size, safe).save(os.path.join(OUT, name))
    print('作成', name)
