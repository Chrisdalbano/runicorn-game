import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base='http://127.0.0.1:4173',dom=JSON.parse(fs.readFileSync('dist/dom.json'));
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch();
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  window.notes=0;
  const start=OscillatorNode.prototype.start;
  OscillatorNode.prototype.start=function(t){notes++;return start.call(this,t);};
  const connect=AudioNode.prototype.connect;
  AudioNode.prototype.connect=function(destination,...args){
   const result=connect.call(this,destination,...args);
   if(destination instanceof AudioDestinationNode){
    const tap=this.context.createMediaStreamDestination();connect.call(this,tap);
    const chunks=[],recorder=new MediaRecorder(tap.stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
    window.stopAudio=()=>new Promise(resolve=>{recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));recorder.stop();});
   }return result;
  };
 });
 await page.goto(base+'/dist/index.html');await page.waitForSelector('h1');await page.evaluate(()=>document.fonts.ready);
 assert.equal(await page.locator('h2').textContent(),'ZOMBIE APOCALYPSE');
 const logo=await page.locator('h1').boundingBox();assert.ok(Math.abs(logo.x+logo.width/2-640)<2);
 await page.context().setOffline(true);await page.locator('h1').click();
 await page.waitForTimeout(name==='chromium'?10000:700);
 assert.ok(await page.evaluate(()=>notes>20));assert.equal(await page.locator('#'+dom.title).isVisible(),true);
 if(name==='chromium'){
  fs.writeFileSync('promo/menu-electro.webm',Buffer.from(await page.evaluate(()=>stopAudio())));
  await page.screenshot({path:'promo/title.png'});
 }
 assert.deepEqual(errors,[]);await browser.close();
}
const browser=await chromium.launch();
for(const [width,height] of [[320,568],[390,844],[844,390]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true});
 await p.goto(base+'/dist/index.html');await p.waitForSelector('h1');await p.evaluate(()=>document.fonts.ready);
 for(const selector of ['h1','h2','.'+dom.titlemenu,'#'+dom.start]){
  const box=await p.locator(selector).boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=height+.5,`${selector} outside ${width}x${height}`);
 }
 assert.ok(await p.locator('#'+dom.start).evaluate(e=>e.getBoundingClientRect().height>=32));
 await p.screenshot({path:`test-results/title-final-${width}.png`});
 if(width===390)await p.screenshot({path:'promo/mobile-title.png'});
 await p.close();
}
await browser.close();console.log('Centered packed title, touch bounds, offline menu music and both browser audio unlocks passed.');
