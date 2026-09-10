import fs from 'node:fs';
import { PNG } from 'pngjs';
const png=PNG.sync.read(fs.readFileSync('art/runicorn.png'));
const metadata=JSON.parse(fs.readFileSync('art/runicorn.json','utf8'));metadata.meta.image='runicorn.png';fs.writeFileSync('art/runicorn.json',JSON.stringify(metadata,null,2)+'\n');
const palette=['00000000',...fs.readFileSync('art/palette.hex','utf8').trim().split(/\r?\n/)];
let pixels='';
for(let frame=0;frame<4;frame++)for(let y=0;y<16;y++)for(let x=0;x<16;x++){
 const i=(y*png.width+frame*16+x)*4,hex=png.data.subarray(i,i+4).toString('hex');
 const index=png.data[i+3]===0?0:palette.indexOf(hex);
 if(index<0)throw Error(`Unknown exported pixel ${hex}`);
 pixels+=index.toString(16);
}
fs.writeFileSync('src/art.js',`// Generated from art/runicorn.aseprite via LibreSprite. npm run art\nexport const palette=${JSON.stringify(palette.slice(0,1+Math.max(...[...pixels].map(n=>parseInt(n,16)))).map(p=>'#'+p.slice(0,6)))};\nexport const pixels=${JSON.stringify(pixels)};\n`);
console.log('Packed',png.width,png.height,'sprite sheet into 4-bit pixel indices.');
