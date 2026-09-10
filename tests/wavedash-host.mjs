import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dom=JSON.parse(fs.readFileSync('dist/dom.json')),browser=await chromium.launch();
for(const mode of ['ok','save-fails','read-fails','stale']){
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(mode=>{
  const stats={},unlocked=new Set(),listeners=new Set();window.calls=[];
  window.Wavedash={Events:{STATS_STORED:'stored'},LeaderboardSortOrder:{DESC:1},LeaderboardDisplayType:{NUMERIC:0},
   init:()=>true,async getOrCreateLeaderboard(){return {success:true,data:{id:'board'}};},
   async uploadLeaderboardScore(...args){calls.push(['score',...args]);return {success:true,data:{globalRank:2}};},
   async requestStats(){calls.push(['load']);return {success:mode!=='read-fails'};},
   getStat:id=>stats[id]||0,getAchievement:id=>unlocked.has(id),
   setStat(id,value){stats[id]=value;calls.push(['stat',id,value]);return true;},
   setAchievement(id){unlocked.add(id);calls.push(['achievement',id]);return true;},
   on(event,fn){listeners.add(fn);return()=>listeners.delete(fn);},
   storeStats(){window.confirmSave=()=>{for(const fn of [...listeners])fn({success:mode!=='save-fails'});};if(mode!=='stale')setTimeout(confirmSave,50);return true;},
   toggleOverlay(){calls.push(['overlay']);}
  };
 },mode);
 await page.goto('http://127.0.0.1:4173/release/wavedash/index.html');
 await page.evaluate(dom=>{
  document.getElementById(dom.title).hidden=true;
  document.getElementById(dom.endlabel).textContent='WISH GRANTED';
  document.getElementById(dom.endscore).textContent='006000';
  document.getElementById(dom.endstats).textContent='50 PURIFIED · 10 LOOPS · DISTRICT 5/5';
  document.getElementById(dom.end).hidden=false;
 },dom);
 if(mode==='stale'){
  await page.waitForFunction(()=>window.confirmSave);
  await page.evaluate(dom=>{document.getElementById(dom.end).hidden=true;},dom);
  await page.evaluate(()=>confirmSave());await page.waitForTimeout(80);
  assert.equal(await page.getByText('ACHIEVEMENTS + RECORDS SYNCED').count(),0);
 }else{
  await page.getByText(mode==='ok'?'ACHIEVEMENTS + RECORDS SYNCED':'PROGRESS SYNC UNAVAILABLE').waitFor();
  await page.getByText('WAVEDASH / BEST RANK 2').waitFor();
  const count=await page.evaluate(()=>calls.filter(c=>c[0]==='achievement').length);
  assert.equal(count,mode==='read-fails'?0:8);
  if(mode==='ok'){
   const box=await page.locator('#'+dom.end+' > div').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844);
   await page.screenshot({path:'test-results/wavedash-achievements-mobile.png'});
  }
 }
 await page.evaluate(dom=>{document.getElementById(dom.end).hidden=true;document.getElementById(dom.paused).hidden=false;},dom);
 await page.getByRole('button',{name:'WAVEDASH OVERLAY',exact:true}).tap();
 assert.equal(await page.evaluate(()=>calls.filter(c=>c[0]==='overlay').length),1);
 if(mode==='ok')await page.screenshot({path:'test-results/wavedash-pause-mobile.png'});
 assert.deepEqual(errors,[]);await page.close();
}
await browser.close();console.log('Packed Wavedash achievements, independent score saving, stale responses and touch overlay passed.');
