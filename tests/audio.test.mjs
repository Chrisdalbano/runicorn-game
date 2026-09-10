import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
function synth(){
 const notes=[],sounds=[],gains=[];let context,scheduler;
 const param=()=>({value:0,setValueAtTime(v,t){this.value=v;},exponentialRampToValueAtTime(){}});
 const node=()=>({connect(){},gain:param(),frequency:param(),Q:param()});
 class AudioContext{
  constructor(){context=this;this.currentTime=0;this.sampleRate=8000;this.destination={};this.state='suspended';}
  resume(){this.state='running';}
  createGain(){const g=node();gains.push(g);return g;}
  createOscillator(){const o=node();o.start=t=>{assert.ok(Number.isFinite(t)&&t>=context.currentTime-1e-7);notes.push({t,hz:o.frequency.value,type:o.type});};o.stop=()=>{};return o;}
  createBiquadFilter(){return node();}
  createBuffer(ch,length){return{getChannelData:()=>new Float32Array(length)}}
  createBufferSource(){return{connect(){},start(t){sounds.push(t)}}}
 }
 const sandbox={AudioContext,setInterval(fn){scheduler=fn;return 1;}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync('src/audio.js','utf8').replaceAll('export ',''),sandbox);
 return{api:sandbox,notes,sounds,gains,advance(t){context.currentTime=t;scheduler();}};
}
test('menu theme unlocks, follows a steady beat, and mutes at the master bus',()=>{
 const s=synth();s.api.soundOn();for(let t=0;t<2;t+=.05)s.advance(t);
 const kicks=s.notes.filter(n=>n.hz===150);
 assert.ok(kicks.length>=5);for(let i=1;i<kicks.length;i++)assert.ok(Math.abs(kicks[i].t-kicks[i-1].t-60/148)<1e-8);
 assert.ok(s.notes.some(n=>n.type==='sawtooth')&&s.notes.some(n=>n.hz>400));
 assert.equal(s.api.mute(),true);assert.equal(s.gains[0].gain.value,0);const before=s.notes.length;s.advance(2.2);assert.equal(s.notes.length,before);
 assert.equal(s.api.mute(),false);assert.ok(s.gains[0].gain.value>0);
});
test('loop rewards are quantized, harmonic, layered and bounded during bursts',()=>{
 const s=synth();s.api.soundOn();s.api.music(0);s.advance(0);
 for(let i=0;i<100;i++)s.api.sfx('loop',4);s.api.sfx('pick');
 const before=s.notes.length;s.advance(.17);const reward=s.notes.slice(before),tick=60/148/4;
 assert.ok(reward.length<30);assert.equal(reward.filter(n=>n.type==='triangle').length,11);
 for(const note of reward){assert.ok(Math.abs(note.t/tick-Math.round(note.t/tick))<1e-7);const interval=12*Math.log2(note.hz/55);assert.ok(Math.abs(interval-Math.round(interval))<1e-7);}
 // A later bar uses a new root. Advance the actual clock without skipping beats.
 for(let t=.2;t<3.35;t+=.05)s.advance(t);
 s.api.sfx('loop');const start=s.notes.length;s.advance(3.45);const chord=s.notes.slice(start).filter(n=>n.type==='square');
 assert.ok(chord.length>=3);assert.ok(Math.abs(chord[0].hz-65.406*2)<1e-6);
 // A background stall must not replay an accumulated backlog.
 const old=s.notes.length;s.api.music(2);s.advance(100);assert.ok(s.notes.length-old<30);
});
test('larger loops add phrases, successive loops vary, and narration stays melodic',()=>{
 function phrase(count){const s=synth();s.api.soundOn();s.api.music(0);s.advance(0);s.api.sfx('loop',count);const before=s.notes.length;s.advance(.17);return s.notes.slice(before);}
 assert.ok(phrase(4).length>phrase(0).length);
 const s=synth();s.api.soundOn();s.api.music(0);s.advance(0);
 const before=s.notes.length;s.api.sfx('loop',1);assert.ok(s.notes.length>before,'immediate impact');s.advance(.17);
 const first=s.notes.filter(n=>n.type==='triangle').map(n=>n.hz);
 const offset=s.notes.length;s.api.sfx('loop',1);s.advance(.3);
 assert.notDeepEqual(s.notes.slice(offset).filter(n=>n.type==='triangle').map(n=>n.hz),first);
 const calm=synth();calm.api.soundOn();calm.api.music(0);for(let t=0;t<2;t+=.05)calm.advance(t);
 assert.ok(calm.notes.filter(n=>n.type==='triangle').length>=4);
 const shot=synth();shot.api.soundOn();shot.api.sfx('shot');assert.equal(shot.notes.length,2);assert.equal(shot.notes[0].hz,1500);
});
