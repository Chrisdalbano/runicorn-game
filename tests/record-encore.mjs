import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch(),page=await browser.newPage({viewport:{width:1280,height:800}});
await page.addInitScript(()=>{
 const connect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(destination,...args){
  const result=connect.call(this,destination,...args);
  if(destination instanceof AudioDestinationNode){
   const tap=this.context.createMediaStreamDestination();connect.call(this,tap);
   const chunks=[],recorder=new MediaRecorder(tap.stream);recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
   window.stopAudio=()=>new Promise(resolve=>{recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));recorder.stop();});
  }
  return result;
 };
});
await page.goto('http://127.0.0.1:4173');await page.locator('h1').click();await page.waitForTimeout(2500);
await page.click('#start');await page.waitForTimeout(4000);await page.click('#skip');
await page.evaluate(()=>__runicorn.set({p:{inv:100}}));await page.waitForTimeout(2000);
for(let i=0;i<6;i++){
 await page.evaluate(i=>{
  __runicorn.fixture();__runicorn.set({p:{x:320,y:215,a:0,inv:100},owned:{nyan:i>=4?1:0}});
  const poly=[{x:80,y:80},{x:260,y:80},{x:260,y:270},{x:80,y:270}];
  for(let j=0;j<1+i%4;j++)__runicorn.enemy({x:110+j*30,y:180});
  __runicorn.purify(poly);
 },i);
 await page.waitForTimeout(2200);
}
fs.writeFileSync('test-results/loop-encore-preview.webm',Buffer.from(await page.evaluate(()=>stopAudio())));
await browser.close();console.log('Recorded menu, lore, six changing loop rewards and dense catches.');
