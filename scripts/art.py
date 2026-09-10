"""Author a tiny editable ASE animation, then export using LibreSprite.
The indexed pixel matrices are code-native original art, not stock assets.
"""
import struct as s, zlib, pathlib, subprocess, os
ROOT=pathlib.Path(__file__).resolve().parents[1]
palette=['00000000','11151dff','555e6cff','a6b2c5ff','f6faf4ff','f572b6ff','b388ffff','6fdcffff','73ffc8ff','ffde7aff','ff9366ff','364651ff','74878dff','bfced0ff','e3e6dfff','252d35ff']
# 16 x 16 right-facing unicorn; legs are animated independently.
rows=[
'0000000000000900',
'0000000000100900',
'0000000001444900',
'0000000051444400',
'0000000561434140',
'0000000671444440',
'0000000713444300',
'0500011144443000',
'0650144444441000',
'0768444444410000',
'0088144444310000',
'0000143333100000',
'0000011001100000',
'0000014001400000',
'0000011001100000',
'0000000000000000']
frames=[]
for frame in range(4):
 grid=[list(r) for r in rows]
 for y in range(12,16):grid[y]=list('0'*16)
 for leg,x in enumerate([5,9]):
  shift=[0,1,0,-1][(frame+leg*2)%4]
  grid[12][x]='3';grid[13][x+shift]='4';grid[14][x+shift*2]='1'
 frames.append(''.join(''.join(r) for r in grid))
def chunk(kind,data):return s.pack('<IH',len(data)+6,kind)+data
name=b'Runicorn / gallop'
layer=chunk(0x2004,s.pack('<HHHHHHB',1,0,0,16,16,0,255)+bytes(3)+s.pack('<H',len(name))+name)
tagdata=s.pack('<H',4)+bytes(8)
for i,name in enumerate([b'gallop',b'dash',b'hit',b'portrait']):
 tagdata+=s.pack('<HHB',0,3,0)+bytes(8)+bytes([115,255,200])+bytes(1)+s.pack('<H',len(name))+name
tags=chunk(0x2018,tagdata)
frame_bytes=[]
for i,pixels in enumerate(frames):
 rgba=b''.join(bytes.fromhex(palette[int(c,16)]) for c in pixels)
 cel=chunk(0x2005,s.pack('<HhhBH',0,0,0,255,2)+bytes(7)+s.pack('<HH',16,16)+zlib.compress(rgba))
 chunks=([layer,tags] if i==0 else [])+[cel]
 body=b''.join(chunks)
 frame_bytes.append(s.pack('<IHHHHI',16+len(body),0xf1fa,len(chunks),95,0,0)+body)
body=b''.join(frame_bytes)
header=s.pack('<IHHHHI',128+len(body),0xa5e0,4,16,16,32) # depth is fixed below
# Explicit offsets follow the published ASE file format.
header=bytearray(128)
s.pack_into('<IHHHHHHI',header,0,128+len(body),0xa5e0,4,16,16,32,1,95)
header[28]=0;s.pack_into('<H',header,32,16);header[34]=header[35]=1
(ROOT/'art/runicorn.aseprite').write_bytes(header+body)
(ROOT/'art/palette.hex').write_text('\n'.join(palette[1:])+'\n')
exe=os.environ.get('LIBRESPRITE') or str(ROOT/'vendor/libresprite/libresprite.exe')
subprocess.run([exe,'--batch',str(ROOT/'art/runicorn.aseprite'),'--sheet',str(ROOT/'art/runicorn.png'),'--data',str(ROOT/'art/runicorn.json'),'--sheet-type','horizontal'],check=True)
print('LibreSprite exported four frames and tags from editable ASE source.')
