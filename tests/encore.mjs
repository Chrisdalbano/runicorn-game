import {chromium,firefox} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
fs.mkdirSync('test-results',{recursive:true});
for(const [name,engine] of [['chromium',chromium],['firefox',firefox]]){
 const browser=await engine.launch(),p=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
 p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4173');
 await p.click('#start');await p.click('#skip');
 // An enemy behind the player must never redirect the forward blaster.
 await p.evaluate(()=>{__runicorn.fixture();__runicorn.set({p:{x:320,y:215,a:0,inv:100},owned:{gun:1}});__runicorn.enemy({x:150});__runicorn.tick(1);});
 let c=await p.evaluate(()=>__runicorn.combat());assert.equal(c.shots.length,1);assert.ok(c.shots[0].vx>0);assert.equal(c.shots[0].vy,0);
 // Requiem has an independent cooldown even if the dash is reset by pickups.
 await p.evaluate(()=>{__runicorn.fixture();__runicorn.set({owned:{gun:0,requiem:1},p:{a:0,cool:0}});__runicorn.aim();});
 c=await p.evaluate(()=>__runicorn.combat());assert.equal(c.shots.length,3);assert.ok(c.shots[0].vy<0&&c.shots[2].vy>0);
 await p.evaluate(()=>{__runicorn.set({p:{cool:0}});__runicorn.aim();});assert.equal((await p.evaluate(()=>__runicorn.combat())).shots.length,3);
 await p.evaluate(()=>{__runicorn.tick(241);__runicorn.fixture();__runicorn.set({p:{cool:0}});__runicorn.aim();});assert.equal((await p.evaluate(()=>__runicorn.combat())).shots.length,3);
 // Green Herb heals once, and cannot be farmed by empty loops or rapid kills.
 const poly=[{x:80,y:80},{x:150,y:80},{x:150,y:150},{x:80,y:150}];
 await p.evaluate(poly=>{__runicorn.fixture();__runicorn.set({p:{hp:1,dash:0},owned:{herb:1}});__runicorn.purify(poly);},poly);
 assert.equal((await p.evaluate(()=>__runicorn.snapshot())).p.hp,1);
 for(let i=0;i<2;i++)await p.evaluate(poly=>{__runicorn.enemy({x:110,y:110});__runicorn.purify(poly);},poly);
 assert.equal((await p.evaluate(()=>__runicorn.snapshot())).p.hp,2);
 await p.evaluate(()=>{__runicorn.fixture();__runicorn.set({p:{x:320,y:215,a:0,dash:0},owned:{nyan:1}});__runicorn.tick(30);});
 assert.ok((await p.evaluate(()=>__runicorn.snapshot())).p.x>365);
 await p.screenshot({path:`test-results/${name}-nyan.png`});
 await p.evaluate(()=>{__runicorn.stage(4);__runicorn.skip();});c=await p.evaluate(()=>__runicorn.combat());assert.equal(c.enemies.find(e=>e.boss).hp,24);
 // Freeze the cause, prevent input from skipping the death beat, then offer retry.
 await p.evaluate(()=>{__runicorn.set({p:{hp:1}});__runicorn.hurt('WARDEN BITE',{x:335,y:215});});
 assert.equal((await p.evaluate(()=>__runicorn.snapshot())).state,'dying');assert.equal(await p.locator('#end').isVisible(),false);
 await p.keyboard.press('Enter');await p.keyboard.press('Space');assert.equal((await p.evaluate(()=>__runicorn.snapshot())).state,'dying');
 await p.waitForTimeout(900);await p.screenshot({path:`test-results/${name}-last-bite.png`});
 await p.waitForFunction(()=>__runicorn.snapshot().state==='dead');assert.equal(await p.locator('#endreason').textContent(),'WARDEN BITE');
 await p.click('#again');assert.equal((await p.evaluate(()=>__runicorn.snapshot())).state,'dialog');
 assert.deepEqual(errors,[]);await browser.close();
}
console.log('Directional fire, Requiem cooldown, herb healing, Nyan flight, Warden health and cinematic death passed in Chromium and Firefox.');
