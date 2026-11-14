# Genera 21 fotos de ejemplo (flores dibujadas) en src/fotos/. SOLO para probar:
# bórralas y pon las tuyas con los mismos nombres (o con los que quieras).
import math, random
from PIL import Image, ImageDraw, ImageFilter
PAL = [(214,48,74),(245,190,40),(232,120,170),(250,248,240),(150,90,200),(250,140,50),(80,140,230)]
for n in range(1, 22):
    rnd = random.Random(n)
    w, h = (1200, 900) if n % 3 else (900, 1200)
    img = Image.new('RGB', (w, h))
    px = img.load()
    c1 = (rnd.randint(20,70), rnd.randint(80,130), rnd.randint(40,80))
    c2 = (rnd.randint(60,110), rnd.randint(140,190), rnd.randint(70,120))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = y / h
        d.line([(0,y),(w,y)], fill=tuple(int(c1[i]*(1-t)+c2[i]*t) for i in range(3)))
    for _ in range(40):  # hojas
        x, y, r = rnd.randint(0,w), rnd.randint(0,h), rnd.randint(30,90)
        d.ellipse([x-r, y-r//2, x+r, y+r//2], fill=(rnd.randint(30,60), rnd.randint(100,150), rnd.randint(40,70)))
    col = PAL[n % len(PAL)]
    cx, cy, R = w//2 + rnd.randint(-80,80), h//2 + rnd.randint(-60,60), min(w,h)//3
    k = rnd.choice([5,6,7,8,9])
    for ring, sh in ((1.0,0.8),(0.7,1.0)):
        for i in range(k):
            a = 2*math.pi*i/k + ring
            px0, py0 = cx + math.cos(a)*R*0.55*ring, cy + math.sin(a)*R*0.55*ring
            pr = R*0.42*ring
            d.ellipse([px0-pr, py0-pr*0.7, px0+pr, py0+pr*0.7], fill=tuple(int(v*sh) for v in col))
    d.ellipse([cx-R*0.16, cy-R*0.16, cx+R*0.16, cy+R*0.16], fill=(110,60,20))
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    img.save(f'src/fotos/flor-{n:02d}.jpg', quality=82)
print('ok')
