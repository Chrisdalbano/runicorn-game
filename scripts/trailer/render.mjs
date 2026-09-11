import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {soundtrack} from './soundtrack.mjs';

const root=path.resolve(import.meta.dirname,'../..');process.chdir(root);
const dir='release/trailer';fs.mkdirSync(dir,{recursive:true});
const preview=process.argv.includes('--preview');
const browser=await chromium.launch();
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{window.requestAnimationFrame=()=>0;window.filmEvents=[];window.filmTime=0;let seed=13;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
await page.route('**/src/audio.js',route=>route.fulfill({contentType:'text/javascript',body:`export function soundOn(){} export function music(){} export function mute(){return false} export function sfx(name,count=0){window.filmEvents.push({t:window.filmTime,name,count})}`}));
await page.route('**/src/game.js',route=>route.fulfill({contentType:'text/javascript',body:'const __DEV__=true;\n'+fs.readFileSync('src/game.js','utf8')+'\n'+fs.readFileSync('scripts/trailer/scene.js','utf8')}));
await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);
await page.evaluate(()=>__runicorn.start());
const encoder=preview?null:spawn('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate','30','-i','pipe:0','-vf','scale=1920:1080:flags=neighbor','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-an',`${dir}/picture.mp4`],{windowsHide:true});
let encoderError='';encoder?.stderr.on('data',b=>encoderError+=b);encoder?.stdin.on('error',()=>{});
const completion=encoder?once(encoder,'close'):null;
const stills=[.8,2.8,5.5,7.3,9.7,12.8,14.7,17.8,21.7,25.2,27.1,29.7];
for(let i=0;i<960;i++){
  const t=i/30;const encoded=await page.evaluate(t=>film.step(t),t);const bytes=Buffer.from(encoded,'base64');
  if(stills.some(s=>Math.abs(s-t)<.016))fs.writeFileSync(`${dir}/frame-${String(i).padStart(4,'0')}.png`,bytes);
  if(encoder&&!encoder.stdin.write(bytes))await once(encoder.stdin,'drain');
  if(i%120===0)console.log(`Rendered ${t.toFixed(0)} / 32 seconds`);
}
const events=await page.evaluate(()=>filmEvents);fs.writeFileSync(`${dir}/events.json`,JSON.stringify(events,null,2));
await browser.close();if(errors.length)throw Error(errors.join('\n'));
if(encoder){encoder.stdin.end();const [code]=await completion;if(code)throw Error(encoderError);}
console.log('Loop events:',events.filter(e=>e.name==='loop'));
await soundtrack(events,`${dir}/soundtrack.wav`);
if(!preview){
  execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-i',`${dir}/picture.mp4`,'-i',`${dir}/soundtrack.wav`,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','320k','-ar','48000','-af','loudnorm=I=-14:TP=-1.5:LRA=8','-movflags','+faststart','-t','32',`${dir}/runicorn-funky-trailer.mp4`],{windowsHide:true,stdio:'inherit'});
  fs.copyFileSync(`${dir}/runicorn-funky-trailer.mp4`,'promo/runicorn-trailer.mp4');
  fs.copyFileSync(`${dir}/frame-0891.png`,'promo/trailer-thumbnail.png');
}
console.log('Trailer assets ready in '+dir);
