"""Rebuild original Bông Arena pixel sprites (optional: Python + Pillow)."""
from pathlib import Path
from PIL import Image,ImageDraw
import colorsys,random
out=Path(__file__).resolve().parents[1]/'public/assets/pixel'
colors={'sol':'#ffc66f','luna':'#bc9bff','ivy':'#83e6b9','kai':'#8bdbff','ember':'#ff9a8b','nova':'#d5a5ff','sage':'#b8e890','raven':'#a8b7ff','atlas':'#e8c098','faye':'#fface0','milo':'#f4e299','zephyr':'#a5e6e4'}
def shade(c,v):
 rgb=tuple(int(c[k:k+2],16) for k in [1,3,5]);return tuple(max(0,min(255,int(n*v))) for n in rgb)
for i,(name,color) in enumerate(colors.items()):
 frames=[]
 for frame in range(3):
  im=Image.new('RGBA',(32,48));d=ImageDraw.Draw(im);dark='#3d3555';c=shade(color,.77);light=shade(color,1.12);skin=['#ffe0c4','#f4cfb7','#e6b79e'][i%3];hair=['#6b4c67','#725c8b','#445674','#8c5d65'][i%4]
  # Small, deliberately stepped outlines and shaded robes.
  for x,offset in [(10,1 if frame==1 else 0),(18,1 if frame==2 else 0)]:
   d.rectangle((x,38+offset,x+4,43+offset),fill=dark);d.rectangle((x,42+offset,x+5,44+offset),fill='#4d506e');d.rectangle((x+1,42+offset,x+4,42+offset),fill='#a9abc0')
  d.polygon([(8,27),(23,27),(25,38),(22,41),(9,41),(6,38)],fill=dark)
  d.polygon([(9,28),(22,28),(23,38),(20,39),(10,39),(8,37)],fill=color)
  d.rectangle((9,29,11,36),fill=light);d.rectangle((20,29,22,38),fill=c);d.rectangle((9,37,22,39),fill=c);d.rectangle((13,31,18,38),fill='#fff0d3');d.rectangle((15,30,16,35),fill='#d982ad')
  d.rectangle((8,35,23,36),fill='#7a6177');d.rectangle((14,35,17,37),fill='#ffe7a4');d.rectangle((15,36,16,36),fill='#b58b6b')
  arms=1 if frame==2 else 0
  d.rectangle((5,28+arms,8,34+arms),fill=dark);d.rectangle((6,29+arms,8,33+arms),fill=color);d.rectangle((5,34+arms,8,37+arms),fill=skin)
  d.rectangle((23,28-arms,26,34-arms),fill=dark);d.rectangle((23,29-arms,25,33-arms),fill=c);d.rectangle((24,34-arms,27,37-arms),fill=skin)
  # Face, ears, hair locks and highlights.
  d.rectangle((7,13,24,24),fill=dark);d.rectangle((8,13,23,25),fill=hair);d.rectangle((9,16,22,25),fill=skin);d.rectangle((10,26,21,27),fill=skin)
  d.rectangle((7,20,8,23),fill=skin);d.rectangle((23,20,24,23),fill=skin);d.rectangle((10,15,21,17),fill=hair);d.rectangle((9,17,11,20),fill=hair);d.rectangle((14,16,16,19),fill=hair);d.rectangle((21,16,22,20),fill=hair)
  d.rectangle((9,14,12,14),fill=shade(hair,1.3));d.rectangle((16,14,20,14),fill=shade(hair,1.25))
  for x in [12,19]:
   d.rectangle((x,21,x+1,23),fill=dark);d.point((x,21),fill='#fff9ed')
  d.rectangle((10,24,11,24),fill='#eea3b0');d.rectangle((21,24,22,24),fill='#eea3b0');d.rectangle((15,25,17,25),fill='#a56b80')
  # Every class has a distinct silhouette.
  if i%4==1:
   d.polygon([(6,14),(8,10),(10,8),(12,5),(16,2),(18,7),(21,10),(24,14)],fill=dark)
   d.polygon([(8,13),(11,8),(16,4),(17,8),(22,13)],fill=color)
   d.rectangle((5,14,26,16),fill=dark);d.rectangle((6,14,25,15),fill=color);d.rectangle((9,13,23,13),fill=c);d.rectangle((15,8,17,10),fill='#fff0b5');d.point((16,7),fill='#fff9de')
  elif i%4==0:
   d.polygon([(8,16),(6,9),(8,7),(12,12),(20,12),(24,7),(26,9),(24,16)],fill=dark)
   d.polygon([(9,15),(8,10),(12,13),(20,13),(24,10),(23,15)],fill=color);d.point((9,11),fill='#ee9eb7');d.point((23,11),fill='#ee9eb7');d.rectangle((11,12,21,14),fill=color);d.rectangle((15,12,17,14),fill='#fff1b5')
  elif i%4==2:
   d.rectangle((7,13,24,16),fill=c);d.rectangle((8,12,23,13),fill=color)
   for x in [9,14,19]:d.rectangle((x,10,x+2,12),fill='#f7d8ac');d.point((x+1,11),fill='#eaa7bd')
  else:
   d.rectangle((7,13,24,16),fill=c);d.rectangle((8,13,23,14),fill=color);d.rectangle((23,14,27,15),fill=color);d.rectangle((26,15,28,17),fill=color);d.point((28,18),fill=light)
  # Weapons: sword, wand, flower staff, bow.
  if i%4==0:
   d.line((27,28,27,39),fill='#795777',width=2);d.rectangle((25,28,29,29),fill='#ffdc99');d.rectangle((26,20,28,27),fill='#b6d7f4');d.rectangle((27,18,27,26),fill='#fff8dc')
  elif i%4==3:
   d.line([(27,23),(30,26),(30,32),(27,36)],fill='#d5a877',width=2);d.line((27,23,27,36),fill='#fff0ce');d.line((25,30,31,30),fill='#b5e8ff')
  else:
   d.rectangle((27,22,28,40),fill='#ad7e78');d.rectangle((28,24,28,38),fill='#e2b693');d.rectangle((26,19,29,23),fill=dark);d.rectangle((26,19,29,21),fill=color);d.rectangle((27,17,28,23),fill=light);d.point((27,18),fill='#fff8d8')
  frames.append(im)
 frames[0].save(out/(name+'.png'))
 sheet=Image.new('RGBA',(96,48))
 for j,im in enumerate(frames):sheet.paste(im,(j*32,0))
 sheet.save(out/(name+'-walk.png'))
# Decorative tiles as original PNG assets; an atlas is easy to edit later.
im=Image.new('RGBA',(128,64));d=ImageDraw.Draw(im)
for i in range(4):
 x=i*32;d.rectangle((x,0,x+31,31),fill=['#a9c7a0','#b1cda8','#e1d4c8','#e9ddce'][i]);
 rng=random.Random(149*i+13)
 for k in range(10):
  xx=x+rng.randrange(30);yy=rng.randrange(30);d.line((xx,yy,xx+1,yy),fill=['#93b78e','#9bbd94','#c8bcae','#d0c1b0'][i])
 if i>1:d.line((x,31,x+31,31),fill='#b3a6a6');d.line((x+31,0,x+31,31),fill='#f7e9d6')
im.save(out/'terrain-atlas.png')
print('Updated 12 detailed characters, 3-frame walking sheets and tile atlas.')
