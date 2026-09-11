import fs from 'node:fs';

// Original 120 BPM synth-funk arrangement. No recordings or third-party samples.
export async function soundtrack(events,destination){
 const sr=48000,duration=32,N=sr*duration,L=new Float32Array(N),R=new Float32Array(N),TAU=Math.PI*2;
 let seed=991;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;};
 const hz=n=>440*2**((n-69)/12);
 function add(t,d,fn,pan=0,vol=1){const start=Math.round(t*sr),count=Math.round(d*sr),a=Math.sqrt((1-pan)/2),b=Math.sqrt((1+pan)/2);for(let j=0;j<count&&start+j<N;j++){if(start+j<0)continue;const v=fn(j/sr,j/count)*vol;L[start+j]+=v*a;R[start+j]+=v*b;}}
 function tone(t,n,d,v=.2,kind='pluck',pan=0,end=null){
  const f=hz(n),f2=end===null?f:hz(end);let phase=0;
  add(t,d,(s,q)=>{phase+=TAU*(f+(f2-f)*q)/sr;const env=Math.min(1,s/.004)*Math.exp(-q*(kind==='bass'?4:6))*(1-q);
   let x=kind==='bass'?Math.sin(phase)+.3*Math.sin(phase*2)*Math.exp(-q*7)+.12*Math.sin(phase*3):kind==='bell'?Math.sin(phase)+.35*Math.sin(phase*2.005)*Math.exp(-q*10):Math.sin(phase)+.25*Math.sin(phase*3)+.1*Math.sin(phase*5);
   return x*env;},pan,v);
 }
 function kick(t,v=.6){let phase=0;add(t,.27,(s,q)=>{phase+=TAU*(43+120*Math.exp(-s*43))/sr;return Math.sin(phase)*Math.exp(-s*17)+rand()*.08*Math.exp(-s*150);},0,v);}
 function snare(t,v=.3){let prev=0;add(t,.17,(s)=>{const n=rand(),h=n-prev;prev=n;return(h*.4+Math.sin(s*TAU*185)*.4)*Math.exp(-s*23);},.12,v);for(const delay of [0,.012,.025])add(t+delay,.035,s=>rand()*Math.exp(-s*95),-.15,v*.16);}
 function hat(t,open=false,v=.07){let prev=0;add(t,open?.14:.042,(s)=>{const n=rand(),h=n-prev;prev=n;return h*Math.exp(-s*(open?25:95));},open?.38:-.28,v);}
 function chord(t,root,v=.06){for(const [i,n]of [0,3,7,10].entries())tone(t,root+12+n,.32,v,'pluck',(i-1.5)*.35);}
 function whoosh(t,v=.12){add(t,.25,(s,q)=>rand()*Math.sin(q*Math.PI)*(.3+q),0,v);tone(t,62,.22,v,'pluck',-.3,86);}
 const roots=[45,45,48,43],bass=[0,null,12,0,null,7,10,null,0,null,12,null,7,10,null,12];
 for(let bar=0;bar<16;bar++){
  const root=roots[bar%4],base=bar*2;const breakdown=bar===13;
  for(let n=0;n<16;n++){
   const swing=n%2?.013:0,t=base+n*.125+swing;if(t>=31.4||breakdown)continue;
   const intro=bar<2,energy=bar>=10&&bar<12;
   if([0,6,8,11].includes(n)&&(!intro||n===0||n===8))kick(t);
   if(n===4||n===12)snare(t,.28);
   if(n===10||n===15)snare(t,.045);
   hat(t,n%8===6,n%2?.035:.065);
   if(bass[n]!==null)tone(t,root+bass[n],n===0?.28:.18,.33,'bass');
   if([2,7,10,14].includes(n))chord(t,root,.045);
   if(!intro&&[0,3,6,8,10,13,15].includes(n)){
    const melody=[24,27,31,34,31,27,22,24];const note=root+melody[(n+bar)%8];
    tone(t,note,.19,.075,'pluck',-.25);tone(t+.1875,note,.2,.023,'bell',.45);
   }
   if(bar>=8&&bar<10&&n%2===0)tone(t,root+[36,31,34,38,34,31,36,39][n/2],.12,.065,'bell',Math.sin(n)*.5);
   if(energy&&n%4===3)tone(t,root+36,.06,.045,'bell',-.5);
  }
 }
 // Edit punctuation and the final logo resolve.
 for(const t of [2,4,8,12,14,16,20,24,28]){whoosh(t-.18);kick(t,.68);}
 for(let i=0;i<8;i++)snare(23+i*.125,.06+i*.014);
 add(26.5,.4,(s,q)=>Math.sin(TAU*(850*s-800*s*s))*Math.exp(-q*4),-.15,.22);
 tone(27.15,45,.4,.16,'bass',0,33);
 for(const n of [45,57,60,64,67,72])tone(28,n,1.4,.11,'bell',0);
 for(const n of [45,57,60,64,69])tone(31,n,1,.09,'bell',0);kick(31,.4);
 // Match the actual runtime reward gestures to the captured loop frames.
 let variant=0,lastShot=-1;
 for(const e of events){const t=e.t;if(t<.1||t>=28)continue;
  if(e.name==='loop'){
   const notes=[[0,7,12,15,19,24,19,12],[12,7,15,12,22,19,24,31],[0,12,7,19,15,24,22,31]][variant++%3];
   kick(t,.45);for(let i=0;i<4+Math.min(4,e.count);i++){const n=57+notes[i];tone(t+i*.125,n,.25,.17,'bell',-.25);tone(t+i*.125+.375,n,.25,.05,'bell',.45);}
  }
  if(e.name==='shot'&&t-lastShot>.13){tone(t,90,.085,.065,'pluck',.1,58);lastShot=t;}
  if(e.name==='requiem'){kick(t,.65);snare(t,.23);tone(t,40,.3,.24,'bass',0,28);}
  if(e.name==='dash')whoosh(t,.12);
  if(e.name==='dead')tone(t,52,.1,.05,'pluck',-.3,35);
  if(e.name==='fall'){tone(t,69,1.1,.12,'pluck',0,33);}
 }
 // Gentle stereo saturation, a short fade, and a conservative PCM peak.
 let peak=0;for(let i=0;i<N;i++){const t=i/sr,fade=Math.min(1,t/.025,(duration-t)/.65);L[i]=Math.tanh(L[i]*1.15)*fade;R[i]=Math.tanh(R[i]*1.15)*fade;peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));}
 const b=Buffer.alloc(44+N*4);b.write('RIFF');b.writeUInt32LE(b.length-8,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(2,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*4,28);b.writeUInt16LE(4,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(N*4,40);
 for(let i=0;i<N;i++){b.writeInt16LE(Math.round(L[i]/peak*.82*32767),44+i*4);b.writeInt16LE(Math.round(R[i]/peak*.82*32767),46+i*4);}
 fs.writeFileSync(destination,b);console.log(`Original stereo soundtrack: ${duration}s, ${variant} loop accents.`);
}
