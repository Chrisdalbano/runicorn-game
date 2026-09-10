// Original electro-rock synth. Loop closures and kills extend the scheduled lead.
const tick=60/148/4;
// Modes: 0 ambience, 1 title hook, 2 gameplay. Pending bits coalesce reward voices.
let ctx,master,timer,step=0,next=0,active=1,muted=false,phrase=0,energy=0,pending=0,reward=0;
export function soundOn(){
  if(!ctx){ctx=new AudioContext();master=ctx.createGain();master.gain.value=.25;master.connect(ctx.destination);}
  if(ctx.state==='suspended')ctx.resume();
  if(!timer){next=ctx.currentTime;timer=setInterval(schedule,50);}
}
function tone(freq,t,d,type='square',vol=.1,end=freq){
  if(!ctx||muted)return;
  const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+d);
  f.type='lowpass';f.frequency.setValueAtTime(type==='sawtooth'?1800:6500,t);f.frequency.exponentialRampToValueAtTime(type==='sawtooth'?170:1500,t+d);f.Q.value=type==='sawtooth'?5:.5;
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(f);f.connect(g);g.connect(master);o.start(t);o.stop(t+d);
}
function noise(t,d,vol,cut){
  if(!ctx||muted)return;
  const b=ctx.createBuffer(1,ctx.sampleRate*d,ctx.sampleRate),a=b.getChannelData(0);
  for(let i=0;i<a.length;i++)a[i]=(Math.random()*2-1)*(1-i/a.length);
  const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=b;f.type='highpass';f.frequency.value=cut;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(master);s.start(t);
}
function chord(root,t,d,vol){for(const semitone of [0,7,12])tone(root*2**(semitone/12),t,d,'square',vol);}
function schedule(){
  if(!ctx)return;
  if(next<ctx.currentTime-.5)next=ctx.currentTime;
  while(next<ctx.currentTime+.12){
    const n=step%16,bar=(step/16|0)%4,root=[55,55,65.406,49][bar];
    if(active){
      if([0,2,3,6,8,10,12,14].includes(n)){tone(root*([3,10].includes(n)?2:1),next,.17,'sawtooth',.24);tone(root,next,.13,'sine',.3);}
      if(n%4===0)tone(150,next,.18,'sine',.85,35);
      if(n%8===4){noise(next,.12,.24,1200);tone(190,next,.08,'triangle',.12,70);}
      noise(next,n%4===2?.08:.025,.05,7000);
      if(n%4===0||active===2&&n%8===3)chord(root,next,.15,.06);
      if(energy>0||active===1&&n%2===0||active===3){tone(root*2**((active===3?[36,31,34,38,34,31,36,39]:[24,27,31,34,36,34,31,27])[(n+phrase)%8]/12),next,.13,'square',.065);if(energy>0)energy--;}
      const arp=root*2**([24,31,27,34,24,31,22,27][n%8]/12);
      if(n%2){tone(arp,next,.09,'square',.045);tone(arp,next+tick*2,.12,'triangle',.025);}
    }else{
      if(n===0){chord(root*2,next,1.5,.018);tone(root,next,1.4,'sine',.12);}
      if(n%4===0)tone(root*2**([24,31,27,22][n/4]/12),next,.5,'triangle',.07);
    }
    if(pending&1){
      chord(root*2,next,.55,.09);tone(110,next,.24,'sine',.55,35);
      const melody=[[0,7,12,15,19,24,19,12],[12,7,15,12,22,19,24,31],[0,12,7,19,15,24,22,31]][phrase%3];
      for(let i=0;i<4+reward;i++){
        const hz=root*4*2**(melody[i%8]/12),t=next+i*tick;
        tone(hz,t,.19,'triangle',.18);tone(hz,t+tick*3,.25,'sine',.065);
        if(i%2===0)tone(hz/2,t,.12,'square',.055);
      }
    }
    if(pending&2)for(let i=0;i<3;i++)tone(root*2**([24,27,31][i]/12),next+i*tick,.14,'triangle',.13);
    if(pending&4)tone(root*8,next,.2,'sawtooth',.09,root*16);
    pending=reward=0;
    next+=tick;step++;
  }
}
export function music(play){active=play;if(!play)pending=energy=0;}
export function mute(){muted=!muted;if(master)master.gain.value=muted?0:.25;return muted;}
export function sfx(name,count=0){
  if(!ctx)return;const t=ctx.currentTime;
  if(name==='shot'){tone(1500,t,.085,'square',.12,230);tone(740,t+.018,.06,'triangle',.07,180);}
  if(name==='dash'){pending|=4;noise(t,.2,.12,1600);}
  if(name==='hit'||name==='dead'){noise(t,.2,.25,400);tone(140,t,.2,'sawtooth',.14,30);}
  if(name==='dead'){energy=Math.min(32,energy+2);}
  if(name==='pick'){pending|=2;energy=Math.min(32,energy+4);}
  if(name==='loop'){pending|=1;reward=Math.max(reward,Math.min(4,count));energy=Math.min(48,energy+24);phrase++;tone(90,t,.14,'sine',.4,40);noise(t,.1,.12,3200);}
  if(name==='requiem'){tone(80,t,.24,'sawtooth',.3,30);noise(t,.17,.25,600);}
  if(name==='fall'){chord(110,t,1.2,.08);tone(440,t,1.5,'sawtooth',.09,35);}
  if(name==='talk')tone(220+(step%3)*55,t,.018,'square',.018);
}
