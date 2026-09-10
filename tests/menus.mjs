import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {offers,random} from '../src/core.js';
const base='http://127.0.0.1:4173',dom=JSON.parse(fs.readFileSync('dist/dom.json'));
// A real seeded offer with three combined powers exercises the longest layout.
let fixture=0,longest=0;
for(let seed=1;seed<2000;seed++){
 const cards=offers(random(seed),{},3);
 if(cards.every(c=>c.bonus)){
  const length=cards.reduce((sum,c)=>sum+c.desc.length+c.bonus.name.length+c.bonus.desc.length,0);
  if(length>longest){fixture=seed;longest=length;}
 }
}
assert.ok(fixture);
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch(),p=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'/dist/index.html');await p.waitForSelector('#'+dom.start);
 await p.context().setOffline(true);
 assert.equal(await p.evaluate(()=>document.activeElement.id),dom.start);
 await p.locator('#'+dom.mute).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#'+dom.mute).textContent(),'SOUND OFF');await p.locator('#'+dom.start).focus();
 await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>document.activeElement.id),dom.next);
 await p.keyboard.press('ArrowLeft');assert.equal(await p.evaluate(()=>document.activeElement.id),dom.skip);
 await p.keyboard.press('Space');assert.equal(await p.locator('#'+dom.dialog).isVisible(),false);
 await p.locator('#'+dom.mute).focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#'+dom.mute).textContent(),'SOUND ON');
 await p.keyboard.press('p');assert.equal(await p.evaluate(()=>document.activeElement.id),dom.resume);
 await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.id),dom.quit);
 await p.keyboard.press('Enter');assert.equal(await p.locator('#'+dom.title).isVisible(),true);
 assert.equal(await p.locator('#'+dom.paused).isVisible(),false);
 await p.context().setOffline(false);
 await p.addInitScript(seed=>Date.now=()=>seed,fixture);
 await p.goto(base);
 await p.evaluate(()=>{__runicorn.start();__runicorn.skip();__runicorn.stage(3);__runicorn.skip();__runicorn.set({clock:46,p:{x:320,y:215,inv:100}});__runicorn.tick(1);});
 await p.mouse.move(0,0);assert.equal(await p.locator('#cards button canvas').count(),6);
 await p.locator('#cards button').nth(2).hover();await p.keyboard.press('ArrowUp');
 assert.equal(await p.locator('#cards button').nth(1).evaluate(e=>e===document.activeElement),true);
 assert.equal(await p.locator('#cards button').evaluateAll(nodes=>nodes.filter(e=>getComputedStyle(e,'::before').visibility==='visible').length),1);
 await p.screenshot({path:`test-results/${name}-retro-combined.png`});
 await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');
 assert.equal(await p.locator('#cards button').nth(2).evaluate(e=>e===document.activeElement),true);
 await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');
 assert.equal(await p.evaluate(()=>__runicorn.snapshot().stage),4);
 assert.equal(await p.evaluate(()=>__runicorn.snapshot().owned.gun),1);
 await p.click('#skip');await p.evaluate(()=>__runicorn.die());await p.waitForFunction(()=>__runicorn.snapshot().state==='dead');
 await p.keyboard.press('ArrowDown');assert.equal(await p.evaluate(()=>document.activeElement.id),'home');
 await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__runicorn.snapshot().state),'title');
 assert.deepEqual(errors,[]);await browser.close();
}
const browser=await chromium.launch();
for(const [width,height] of [[320,568],[390,844],[844,390]]){
 const p=await browser.newPage({viewport:{width,height},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await p.addInitScript(seed=>Date.now=()=>seed,fixture);await p.goto(base);
 await p.evaluate(()=>{__runicorn.start();__runicorn.skip();__runicorn.stage(3);__runicorn.skip();__runicorn.set({clock:46,p:{x:320,y:215,inv:100}});__runicorn.tick(1);});
 assert.equal(await p.locator('#cards button canvas').count(),6);
 for(const selector of ['.upgradebox','#cards button','#cards span','#cards .item-icon']){
  for(const el of await p.locator(selector).all()){
   const box=await el.boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width+.5&&box.y+box.height<=height+.5,`${width}x${height} ${selector} escaped viewport`);
  }
 }
 await p.screenshot({path:`test-results/retro-combined-${width}.png`});
 await p.locator('#cards button').first().tap();assert.equal(await p.evaluate(()=>__runicorn.snapshot().stage),4);
 await p.close();
}
await browser.close();console.log('Packed keyboard menus, single cursor, wraparound, title transitions and combined touch layouts passed.');
