import {chromium} from 'playwright';import fs from 'node:fs';
const browser=await chromium.launch();const context=await browser.newContext({viewport:{width:1280,height:800},recordVideo:{dir:'test-results/video',size:{width:1280,height:800}}});
const page=await context.newPage();
await page.addInitScript(()=>{
 const connect=AudioNode.prototype.connect;
 AudioNode.prototype.connect=function(destination,...args){
  const result=connect.call(this,destination,...args);
  if(destination instanceof AudioDestinationNode){
   const tap=this.context.createMediaStreamDestination();connect.call(this,tap);
   const recorder=new MediaRecorder(tap.stream),chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);recorder.start();
   window.stopAudio=()=>new Promise(resolve=>{recorder.onstop=async()=>resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));recorder.stop();});
  }return result;
 };
});await page.goto('http://127.0.0.1:4173');await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:'promo/title.png'});
await page.click('#start');await page.waitForTimeout(1600);await page.screenshot({path:'promo/dialog.png'});await page.click('#skip');
for(let i=0;i<360;i++){
 await page.evaluate(()=>__runicorn.drive(1));
 if(i===240)await page.screenshot({path:'promo/gameplay.png'});
 await page.waitForTimeout(33);
}
fs.writeFileSync('promo/electro-preview.webm',Buffer.from(await page.evaluate(()=>stopAudio())));
const video=page.video();await context.close();await video.saveAs('promo/gameplay.webm');await browser.close();console.log('Screenshots and gameplay video captured.');
