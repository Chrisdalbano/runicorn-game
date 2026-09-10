"""Build our original 5x7 arcade alphabet. No downloaded font or runtime dependency."""
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
# Each digit represents one five-bit scanline; lowercase maps to the same glyph.
rows={
'A':[14,17,17,31,17,17,17],'B':[30,17,17,30,17,17,30],
'C':[14,17,16,16,16,17,14],'D':[30,17,17,17,17,17,30],
'E':[31,16,16,30,16,16,31],'F':[31,16,16,30,16,16,16],
'G':[14,17,16,23,17,17,15],'H':[17,17,17,31,17,17,17],
'I':[31,4,4,4,4,4,31],'J':[7,2,2,2,18,18,12],
'K':[17,18,20,24,20,18,17],'L':[16,16,16,16,16,16,31],
'M':[17,27,21,21,17,17,17],'N':[17,25,25,21,19,19,17],
'O':[14,17,17,17,17,17,14],'P':[30,17,17,30,16,16,16],
'Q':[14,17,17,17,21,18,13],'R':[30,17,17,30,20,18,17],
'S':[15,16,16,14,1,1,30],'T':[31,4,4,4,4,4,4],
'U':[17,17,17,17,17,17,14],'V':[17,17,17,17,17,10,4],
'W':[17,17,17,21,21,27,17],'X':[17,17,10,4,10,17,17],
'Y':[17,17,10,4,4,4,4],'Z':[31,1,2,4,8,16,31],
'0':[14,17,19,21,25,17,14],'1':[4,12,4,4,4,4,14],
'2':[14,17,1,2,4,8,31],'3':[30,1,1,14,1,1,30],
'4':[2,6,10,18,31,2,2],'5':[31,16,16,30,1,1,30],
'6':[14,16,16,30,17,17,14],'7':[31,1,2,4,8,8,8],
'8':[14,17,17,14,17,17,14],'9':[14,17,17,15,1,1,14],
' ':[0]*7,'.':[0,0,0,0,0,0,4],',':[0,0,0,0,0,4,8],
'!':[4,4,4,4,4,0,4],'?':[14,17,1,2,4,0,4],':':[0,4,0,0,4,0,0],
"'":[4,4,8,0,0,0,0],'-':[0,0,0,31,0,0,0],'+':[0,4,4,31,4,4,0],
'/':[1,1,2,4,8,16,16],'%':[25,25,2,4,8,19,19],
'(':[2,4,8,8,8,4,2],')':[8,4,2,2,2,4,8],
'♥':[0,10,31,31,14,4,0],'♡':[0,10,21,17,10,4,0],
'◇':[4,10,17,17,17,10,4],'→':[0,4,2,31,2,4,0],
'↗':[0,15,3,5,9,16,0],'↵':[1,1,5,9,31,8,4],
'↓':[4,4,4,21,14,4,0],'·':[0,0,0,4,0,0,0],
'Ⅱ':[10,10,10,10,10,10,10],'✦':[4,4,14,31,14,4,4]
}
for char in '?,():\u2197\u21b5\u2161\u2726':rows.pop(char,None)
font=FontBuilder(64,isTTF=True)
used=sorted({n for row in rows.values() for n in row if n})
names=['.notdef']+['u'+str(ord(c)) for c in rows]+['r'+str(n) for n in used]
font.setupGlyphOrder(names);glyphs={};metrics={}
for n in used:
 pen=TTGlyphPen(None);x=0
 while x<5:
  if not n&(16>>x):x+=1;continue
  l=x*8
  while x<5 and n&(16>>x):x+=1
  pen.moveTo((l,0));pen.lineTo((l,8));pen.lineTo((x*8,8));pen.lineTo((x*8,0));pen.closePath()
 glyphs['r'+str(n)]=pen.glyph();metrics['r'+str(n)]=(48,0)
for c,name in zip([' ']+list(rows),names):
 pen=TTGlyphPen(glyphs)
 for y,row in enumerate(rows[c]):
  if row:pen.addComponent('r'+str(row),(1,0,0,1,0,(6-y)*8))
 glyphs[name]=pen.glyph();metrics[name]=(48,0)
 if glyphs[name].isComposite():
  for component in glyphs[name].components:component.flags &= ~4
mapping={ord(c):'u'+str(ord(c)) for c in rows}
mapping.update({ord(c.lower()):mapping[ord(c)] for c in rows if c.isalpha()})
font.setupCharacterMap(mapping);font.setupGlyf(glyphs);font.setupHorizontalMetrics(metrics)
font.setupHorizontalHeader(ascent=60,descent=-4);font.setupNameTable({'familyName':'Runicorn Pixel','styleName':'Regular','uniqueFontIdentifier':'RunicornPixel1','fullName':'Runicorn Pixel','psName':'RunicornPixel'})
font.setupOS2(sTypoAscender=60,sTypoDescender=-4,usWinAscent=60,usWinDescent=4);font.setupPost();font.setupMaxp()
font.font['head'].created=font.font['head'].modified=3869424000
font.font.recalcTimestamp=False; font.font['name'].names=[]; font.font['post'].formatType=3; font.font.flavor='woff2';font.save(ROOT/'art/runicorn.woff2')
(ROOT/'art/font.json').write_text(json.dumps(rows,separators=(',',':')))
print('Pixel font:',(ROOT/'art/runicorn.woff2').stat().st_size,'bytes')
