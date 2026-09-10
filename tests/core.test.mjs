import test from 'node:test';import assert from 'node:assert/strict';
import {random,generateArena,reachable,blocked,offers,upgrades,inside,intersection,segmentDistance,area,steer,SpatialHash} from '../src/core.js';
test('1,000 seeded layouts are connected, bounded, repeatable and leave the relay accessible',()=>{
 for(let seed=0;seed<1000;seed++){
  const stage=seed%5,a=generateArena(seed,stage);assert.deepEqual(a,generateArena(seed,stage));assert.ok(reachable(a));assert.equal(blocked(320,215,17,a),false);
  for(const b of a){assert.ok(b.x>=18&&b.x+b.w<=622);assert.ok(b.y>=54&&b.y+b.h<=380);}
 }
});
test('seeded PRNG reproduces independent sequences',()=>{const a=random(1313),b=random(1313);for(let i=0;i<1000;i++)assert.equal(a(),b());});
test('upgrade rolls respect prerequisites, caps and duplicates while guaranteeing Megacorn',()=>{
 for(let seed=0;seed<1000;seed++){
  const rng=random(seed),owned={};const first=offers(rng,owned,0);assert.equal(first[0].id,'gun');assert.ok(first.every(u=>!u.needs));
  for(let stage=0;stage<20;stage++){
   const choices=offers(rng,owned,stage);assert.equal(new Set(choices.map(u=>u.id)).size,choices.length);
   for(const u of choices){assert.ok(!u.needs||owned[u.needs]);assert.ok((owned[u.id]||0)<u.max);
    if(u.bonus){assert.notEqual(u.id,u.bonus.id);assert.ok((owned[u.bonus.id]||0)<u.bonus.max);assert.ok(!u.bonus.needs||owned[u.bonus.needs]||u.bonus.needs===u.id);}
   }
   const picked=choices[seed%choices.length];for(const u of [picked,picked.bonus].filter(Boolean))owned[u.id]=(owned[u.id]||0)+1;
  }
 }
 const owned=Object.fromEntries(upgrades.map(u=>[u.id,u.max]));assert.deepEqual(offers(random(1),owned,4),[]);
});
test('loop geometry handles winding, crossing, parallel edges and near misses',()=>{
 const poly=[{x:0,y:0},{x:10,y:0},{x:10,y:10},{x:0,y:10}];
 assert.equal(inside({x:5,y:5},poly),true);assert.equal(inside({x:5,y:5},[...poly].reverse()),true);assert.equal(inside({x:11,y:5},poly),false);assert.equal(area(poly),100);
 assert.deepEqual(intersection({x:0,y:5},{x:10,y:5},{x:5,y:0},{x:5,y:10}),{x:5,y:5});
 assert.equal(intersection({x:0,y:0},{x:10,y:0},{x:0,y:1},{x:10,y:1}),null);
 assert.equal(segmentDistance({x:5,y:3},{x:0,y:0},{x:10,y:0}),3);
});
test('spatial buckets find neighbors across cell boundaries',()=>{const h=new SpatialHash();h.insert('a',23,23);h.insert('b',25,25);h.insert('c',100,100);assert.deepEqual(h.query(24,24,4).sort(),['a','b']);h.clear();assert.deepEqual(h.query(24,24),[]);});
test('steering avoids a wall directly between enemy and target',()=>{
 const e={x:100,y:200,a:0},b=[{x:118,y:185,w:16,h:30}];const a=steer(e,{x:200,y:200},b,[],[]);assert.ok(Math.abs(a)>.5);
});
