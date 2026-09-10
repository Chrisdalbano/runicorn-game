import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProgress,readRun} from '../src/wavedash-progress.js';
import {achievements,stats} from '../src/wavedash-catalog.js';
function mock(options={}) {
 const values={BEST_CHROMA:9000},unlocked=new Set(),listeners=new Set(),calls=[];
 const sdk={Events:{STATS_STORED:'stored'},
  async requestStats(){calls.push('load');if(options.loadError)throw Error();return {success:options.load!==false};},
  getStat:id=>values[id]||0,getAchievement:id=>unlocked.has(id),
  setStat(id,value){calls.push(['stat',id,value]);values[id]=value;return true;},
  setAchievement(id){calls.push(['achievement',id]);unlocked.add(id);return true;},
  on(event,fn){listeners.add(fn);return()=>listeners.delete(fn);},
  storeStats(){calls.push('store');if(options.accept===false)return false;if(!options.silent)setTimeout(()=>{for(const fn of [...listeners])fn({success:options.save!==false});},2);return true;}
 };
 return {sdk,values,unlocked,listeners,calls};
}
const run=readRun('006000','50 PURIFIED · 10 LOOPS · DISTRICT 5/5','WISH GRANTED');
test('Parse only complete final-run records, including the packed display',()=>{
 assert.deepEqual(run,{BEST_CHROMA:6000,MOST_PURIFIED:50,MOST_LOOPS:10,FURTHEST_DISTRICT:5,WORLD_SAVED:1});
 for(const [score,summary,label] of [['-1','50 PURIFIED · 10 LOOPS · DISTRICT 5/5','WISH GRANTED'],['100','','SIGNAL LOST'],['100','1 PURIFIED · 1 LOOPS · DISTRICT 9/5','SIGNAL LOST'],['100','1 PURIFIED · 1 LOOPS · DISTRICT 1/5','OTHER']]) assert.equal(readRun(score,summary,label),null);
});
test('Save all eight milestones, preserve better cloud stats and avoid duplicate writes',async()=>{
 const m=mock(),save=createProgress(m.sdk,50);
 assert.equal(await save(run),true);assert.equal(m.values.BEST_CHROMA,9000);
 assert.equal(m.unlocked.size,8);assert.equal(m.calls.filter(x=>x==='store').length,1);assert.equal(m.listeners.size,0);
 assert.equal(await save(run),true);assert.equal(m.calls.filter(x=>x==='store').length,1);
 assert.ok(achievements.every(([id])=>m.unlocked.has(id)));assert.equal(stats.length,5);
});
test('Stat reads must load successfully before any mutation',async()=>{
 for(const options of [{load:false},{loadError:true}]) {const m=mock(options);assert.equal(await createProgress(m.sdk,30)(run),false);assert.deepEqual(m.calls,['load']);}
});
test('Wait for host acknowledgment; scheduling success is insufficient',async()=>{
 for(const options of [{save:false},{silent:true},{accept:false}]) {
  const m=mock(options),save=createProgress(m.sdk,15);assert.equal(await save(run),false);
  assert.equal(await save(run),false,'optimistic local values cannot masquerade as a confirmed save');assert.equal(m.listeners.size,0);
 }
});
test('Serialized rapid runs do not lose a larger record',async()=>{
 const m=mock(),save=createProgress(m.sdk,50);
 const results=await Promise.all([save(run),save({...run,BEST_CHROMA:12000}),save({...run,BEST_CHROMA:200})]);
 assert.deepEqual(results,[true,true,true]);assert.equal(m.values.BEST_CHROMA,12000);assert.equal(m.calls.filter(x=>x==='load').length,1);
});
