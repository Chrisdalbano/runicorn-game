import {chromium} from 'playwright';
import fs from 'node:fs';
import {achievements} from '../src/wavedash-catalog.js';
fs.mkdirSync('promo/achievements',{recursive:true});
const browser=await chromium.launch(),page=await browser.newPage();
await page.goto('http://127.0.0.1:4173');
for(const [id,,,,,icon] of achievements) {
 const data=await page.evaluate(async icon=>{
  const {itemArt}=await import('/src/icons.js'), art=itemArt(icon),c=document.createElement('canvas');
  c.width=c.height=96;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.fillStyle='#000011';g.fillRect(0,0,96,96);g.strokeStyle=art.color;g.lineWidth=4;g.strokeRect(6,6,84,84);g.lineWidth=2;g.strokeRect(12,12,72,72);
  g.drawImage(art.canvas,18,18,60,60);return c.toDataURL('image/png').split(',')[1];
 },icon);
 fs.writeFileSync('promo/achievements/'+id+'.png',Buffer.from(data,'base64'));
}
await browser.close();console.log('Eight achievement icons rendered from original game artwork.');
