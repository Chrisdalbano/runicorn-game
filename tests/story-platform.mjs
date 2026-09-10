import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const browser=await chromium.launch();
const base='http://127.0.0.1:4173';
const dom=JSON.parse(fs.readFileSync('dist/dom.json'));
const page=await browser.newPage({viewport:{width:1280,height:800}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 window.blips=0;const start=OscillatorNode.prototype.start,stop=OscillatorNode.prototype.stop;
 OscillatorNode.prototype.start=function(t){this.started=t;return start.call(this,t);};
 OscillatorNode.prototype.stop=function(t){if(Math.abs(t-this.started-.018)<.001)window.blips++;return stop.call(this,t);};
});
await page.goto(base);await page.click('#start');await page.waitForTimeout(250);
let text=await page.locator('#line').textContent();assert.ok(text.length>0&&text.length<30);assert.ok(await page.evaluate(()=>blips>0));
await page.click('#next');assert.match(await page.locator('#line').textContent(),/Three wishes/);
assert.equal(await page.locator('#speaker').textContent(),'ISAAC');
await page.click('#next');assert.equal(await page.locator('#speaker').textContent(),'JACOB');await page.click('#next');
await page.screenshot({path:'promo/wish-one.png'});
await page.click('#next');assert.equal(await page.locator('#speaker').textContent(),'ESAU');await page.click('#next');
assert.match(await page.locator('#line').textContent(),/zombie apocalypse/);await page.screenshot({path:'promo/wish-two.png'});
await page.click('#skip');await page.evaluate(()=>{__runicorn.stage(4);__runicorn.skip();__runicorn.win();});
await page.click('#next');assert.match(await page.locator('#line').textContent(),/Esau's wish had never been granted/);
await page.screenshot({path:'promo/last-wish.png'});await page.click('#skip');assert.equal(await page.evaluate(()=>__runicorn.snapshot().state),'win');
assert.deepEqual(errors,[]);await page.close();
for(const mode of ['ok','absent','init-false','init-throws','board-fails','upload-fails','stale']){
 const p=await browser.newPage();const failures=[];p.on('pageerror',e=>failures.push(e.message));
 await p.addInitScript(mode=>{
  window.calls=[];
  if(mode==='absent')return;
  window.Wavedash={
   LeaderboardSortOrder:{DESC:1},LeaderboardDisplayType:{NUMERIC:0},
   init(){calls.push(['init']);if(mode==='init-throws')throw Error('host unavailable');return mode!=='init-false';},
   async getOrCreateLeaderboard(...args){calls.push(['board',...args]);return mode==='board-fails'?{success:false}:{success:true,data:{id:'board-id'}};},
   async uploadLeaderboardScore(...args){calls.push(['score',...args]);if(mode==='upload-fails')throw Error('offline');if(mode==='stale')await new Promise(r=>window.resolveScore=r);return{success:true,data:{globalRank:7}};}
  };
 },mode);
 await p.goto(base+'/release/wavedash/index.html');await p.waitForSelector('#'+dom.start);
 await p.evaluate(({end,endscore})=>{document.getElementById(endscore).textContent='000500';document.getElementById(end).hidden=false;},dom);
 if(mode==='ok'){
  await p.getByText('WAVEDASH / BEST RANK 7').waitFor();
  assert.deepEqual(await p.evaluate(()=>calls),[['init'],['board','runicorn-chroma',1,0],['score','board-id',500,true]]);
 }else if(mode==='board-fails'||mode==='upload-fails')await p.getByText('WAVEDASH OFFLINE / LOCAL SCORE KEPT').waitFor();
 else if(mode==='stale'){
  await p.waitForFunction(()=>window.resolveScore);
  await p.evaluate(id=>{document.getElementById(id).hidden=true;},dom.end);
  await p.evaluate(()=>resolveScore());await p.waitForTimeout(50);
  assert.equal(await p.getByText('WAVEDASH / BEST RANK 7').count(),0);
 }else assert.equal(await p.locator('#'+dom.end+' [role=status]').count(),0);
 assert.deepEqual(failures,[]);await p.close();
}
await browser.close();console.log('Typewriter audio, wish narrative, and seven Wavedash host/failure scenarios passed.');
