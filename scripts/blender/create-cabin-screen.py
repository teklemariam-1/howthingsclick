"""Draw an original illustrative ride display, shared by Blender and the browser."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[2]
im=Image.new('RGB',(1280,720),'#10181e');d=ImageDraw.Draw(im)
def font(size):
    for file in ['C:/Windows/Fonts/segoeui.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
        if Path(file).exists():return ImageFont.truetype(file,size)
    return ImageFont.load_default()
d.text((42,25),'12:45',font=font(34),fill='#f1f4f0')
d.text((1000,34),'CYBERCAB',font=font(20),fill='#b3c2c2')
d.rounded_rectangle((35,103,443,624),18,fill='#1b2a30')
for x in range(-200,850,72):
    d.line([(max(40,x),110),(min(440,x+260),615)],fill='#32444a',width=5)
for y in range(145,620,70):
    d.line([(42,y),(435,y-32)],fill='#34464b',width=5)
d.line([(153,553),(218,390),(330,344),(285,243),(366,163)],fill='#74cbe3',width=9)
d.ellipse((142,542,164,564),fill='#e2f2f4')
d.ellipse((356,153,376,173),fill='#a8d5a3')
d.rounded_rectangle((53,565,305,607),10,fill='#10181e')
d.text((69,573),'8 min · 2.4 miles',font=font(21),fill='#d5e4e5')
d.rectangle((444,103,1279,632),fill='#10181e')
d.text((503,118),'Your ride is ready',font=font(41),fill='#eef0e8')
d.text((505,177),'A space to sit back and explore.',font=font(23),fill='#9dafb6')
# Original gold coupe illustration.
d.polygon([(615,390),(683,345),(798,305),(911,313),(1011,382),(1092,412),(1092,483),(590,483),(580,442)],fill='#b49d72')
d.polygon([(692,351),(800,319),(905,327),(974,376)],fill='#253b43')
d.line([(796,321),(805,369)],fill='#7e8e8e',width=3)
for x in [690,1010]:
    d.ellipse((x-43,441,x+43,527),fill='#070d10')
    d.ellipse((x-34,450,x+34,518),fill='#c1ad86')
d.line([(588,422),(623,412)],fill='#e5f6ed',width=7)
d.text((557,573),'Welcome aboard',font=font(26),fill='#d5e0dd')
d.line((34,653,1245,653),fill='#344048',width=2)
for x,title in [(53,'Doors'),(274,'Route'),(475,'Support'),(890,'21°'),(1080,'Climate')]:
    d.text((x,674),title,font=font(23),fill='#dce6e5')
target=root/'public/models/cybercab-display.png';im.save(target,optimize=True)
print(str(target))
