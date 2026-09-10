import {TAU,clamp,distance,angleDelta,random,inside,intersection,segmentDistance,area,blocked,generateArena,offers,upgrades,SpatialHash,steer} from './core.js';
import {palette,pixels} from './art.js';
import {soundOn,music,mute,sfx} from './audio.js';
import {itemArt,itemIcon} from './icons.js';

const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
ctx.imageSmoothingEnabled=false;
const colors=['#f69','#f96','#fe8','#7fb','#6df','#a8f'];
const names=['THE TROTTING DEAD','RESIDENT EQUINE','THE LAST OF HERD','THE LAMP TOWER','THE LAST WISH'];
const stories=[
 [['ISAAC','Jacob and Esau found a genie. Three wishes.'],['JACOB','I wish unicorns were real!'],['ESAU','I wish for a zombie apocalypse!'],['ISAAC',"The herd turned. Esau fell. Jacob's unicorn kept its magic."],['ISAAC',"Find Jacob. Undo the wish."]],
 [['ISAAC','Follow the relays.'],['RUNI','Four hooves. One last wish.']],
 [['ISAAC','Watch the chargers.'],['RUNI','Change the beat.']],
 [['ISAAC',"Bring the brothers home."]],
 [['ISAAC','Loop the Warden. Save Jacob.'],['WARDEN','THE LAST WISH DIES HERE.'],['RUNI','Buddy. Wrong unicorn.']]
];
let state='title',stage=0,seed=0,rng=random(13),clock=0,elapsed=0,score=0,kills=0,loops=0,best=0;
let p,boxes=[],enemies=[],trail=[],corrupt=[],shots=[],items=[],particles=[],rings=[],floaters=[],owned={},choice=[];
let spawnClock=0,pickClock=0,shotClock=0,loopLock=0,toastTime=0,shake=0,shakeOn=!matchMedia('(prefers-reduced-motion)').matches,relay=false,frame=0,bossDead=false,hitstop=0;
let deathTime=0,deathCause='',deathSource=null,requiemClock=0,herbClock=0;
let narration=[],lineIndex=0,typed=0,dialogDone=()=>{},radioTime=0,radioBeat=0;
const keys=new Set(),joy={x:0,y:0,id:null};
const touch=matchMedia('(pointer:coarse)').matches;
const hash=new SpatialHash(),enemyHash=new SpatialHash(32);
try{best=Number(localStorage.getItem('runicorn2026:best'))||0;}catch{}
$('record').textContent='BEST '+String(best).padStart(6,'0');

// Indexed sprites and radio portraits share one tiny bitmap decoder.
function bitmap(bits,pal){
 const c=document.createElement('canvas');c.width=c.height=16;const g=c.getContext('2d');
 for(let i=0;i<256;i++){const n=parseInt(bits[i],16);if(n){g.fillStyle=pal[n];g.fillRect(i%16,i/16|0,1,1);}}return c;
}
const sprites=[palette,palette.map((c,n)=>n>=5&&n<=10?'#567':n===4?'#99a':n===3?'#677':c)].map(pal=>Array.from({length:4},(_,f)=>bitmap(pixels.slice(f*256,f*256+256),pal)));
const moth=bitmap('00000000000000000000033333300000000333333333300000330000000033000330033333300330033033333333033043333222222333344333324444233334433332222223333403303333333303300330033223300330000300333300300000003003300300000000333444400000000000033300000000000000000000000',['','#223','#234','#689','#9ee']);
function sprite(x,y,a,scale=1,enemy=false,hat=false,time=elapsed,kind=0){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a);ctx.scale(scale,scale);ctx.imageSmoothingEnabled=false;
 ctx.drawImage(sprites[+enemy][Math.floor(time*11)%4],-8,-8);
 if(enemy){
  ctx.fillStyle=kind>1?'#666':'#445';ctx.fillRect(-6,-4,9,kind===1?2:7);
  if(kind>=2){ctx.fillStyle='#bbb';for(let i=0;i<3;i++)ctx.fillRect(-4+i*3,-7,2,3);}
  ctx.fillStyle='#945';ctx.fillRect(5,-4,2,1);ctx.fillRect(-3,2,2,2);
 }
 if(hat){ctx.fillStyle=enemy?'#455':'#6df';ctx.fillRect(1,-6,5,3);ctx.fillStyle=enemy?'#dee':'#efe';ctx.fillRect(6,-5,4,2);ctx.fillStyle='#234';ctx.fillRect(2,-4,4,1);}
 ctx.restore();
}
function child(g,x,y,s,i){g.save();g.translate(x,y);g.scale(s,s);for(const [color,a,b,w,h] of [['#223',3,27,11,14],[colors[i?1:4],1,13,15,16],['#eb9',3,2,11,12],['#223',3,0,11,4],['#223',10,6,2,2]]){g.fillStyle=color;g.fillRect(a,b,w,h);}g.restore();}
function portrait(who){
 const g=$('portrait').getContext('2d');g.fillStyle='#122';g.fillRect(0,0,64,64);g.imageSmoothingEnabled=false;
 if(who==='JACOB'||who==='ESAU')child(g,8,0,3,who==='ESAU');
 else g.drawImage(who==='RUNI'?sprites[0][0]:moth,0,0,64,64);
}
function show(id,on){const el=$(id);el.hidden=!on;if(on&&state!=='play')el.querySelector('button')?.focus();}
function notify(text){$('toast').textContent=text;toastTime=2.4;}
function setState(next){state=next;music(next==='play'?(owned.nyan?3:2):next==='title'||next==='upgrade'?1:0);show('touch',next==='play'&&touch);if(next!=='play')show('radio',false);}
function radio(line){$('radio').lastElementChild.textContent=line;radioTime=4;show('radio',true);sfx('pick');}
function equipment(){$('kit').replaceChildren();for(const id of ['recharge',...Object.keys(owned).filter(id=>id!=='recharge')]){const c=itemIcon(id);c.title=upgrades.find(u=>u.id===id).name;$('kit').appendChild(c);}}
function talk(lines,done){
 narration=lines;lineIndex=0;dialogDone=done;setState('dialog');show('dialog',true);nextLine();
}
function nextLine(){
 if(lineIndex>=narration.length){show('dialog',false);dialogDone();return;}
 const [who]=narration[lineIndex];$('speaker').textContent=who;$('channel').textContent='TRANSMISSION / '+String(stage+1).padStart(2,'0');portrait(who);typed=0;$('line').textContent='';
}
function advance(){
 if(state!=='dialog')return;
 const line=narration[lineIndex][1];if(typed<line.length){typed=line.length;$('line').textContent=line;}else{sfx('pick');lineIndex++;nextLine();}
}
$('next').onclick=advance;$('skip').onclick=()=>{lineIndex=narration.length;nextLine();};
function start(){
 soundOn();seed=Date.now()>>>0;rng=random(seed);stage=0;score=kills=loops=0;owned={};equipment();
 p={x:320,y:215,a:-Math.PI/2,hp:3,shield:0,dash:0,cool:0,inv:1.5};
 show('title',false);show('end',false);show('hud',true);show('bottom',true);$('app').classList.add('playing');
 beginStage();
}
$('start').onclick=start;$('again').onclick=start;
function beginStage(){
 cachedStage=-1;boxes=generateArena(seed,stage);enemies=[];trail=[];corrupt=[];shots=[];items=[];particles=[];rings=[];floaters=[];radioBeat=0;radioTime=0;
 p.x=320;p.y=215;p.a=-Math.PI/2;p.cool=0;p.dash=0;p.inv=2;
 deathTime=requiemClock=herbClock=0;deathSource=null;
 clock=0;spawnClock=1.2;pickClock=5;shotClock=0;relay=false;bossDead=false;loopLock=0;
 $('district').textContent=`0${stage+1} / ${names[stage]}`;$('objective').textContent=stage===4?'BREAK THE WARDEN':'CLOSE THE LOOP';
 talk(stories[stage],()=>{setState('play');notify(stage===0?'CLOSE LOOPS. TRAP THE DEAD.':'KEEP MOVING.');if(stage===4)spawn(true);});
}
function choose(index){
 if(state!=='upgrade'||!choice[index])return;
 for(const u of [choice[index],choice[index].bonus].filter(Boolean)){
  const id=u.id;owned[id]=(owned[id]||0)+1;
  if(id==='heart')p.hp=Math.min(3,p.hp+2);if(id==='shield')p.shield+=2;
 }
 equipment();sfx('pick');show('upgrade',false);stage++;beginStage();
}
function upgrade(){
 setState('upgrade');choice=offers(rng,owned,stage);$('cards').replaceChildren();
 choice.forEach((u,i)=>{const b=document.createElement('button');b.style.setProperty('--accent',itemArt(u.id).color);b.innerHTML=`<em>0${i+1} / ${u.tag}</em><b>${u.name}</b><span>${u.desc}${u.bonus?'<br>+ '+u.bonus.name+'<br>'+u.bonus.desc:''}</span>`;b.prepend(itemIcon(u.id));if(u.bonus)b.appendChild(itemIcon(u.bonus.id));b.onclick=()=>choose(i);$('cards').appendChild(b);});
 show('upgrade',true);
}
function finish(win,reason){
 setState(win?'win':'dead');show('end',true);show('hud',false);show('bottom',false);
 best=Math.max(best,score);try{localStorage.setItem('runicorn2026:best',String(best));}catch{}
 $('endlabel').textContent=win?'WISH GRANTED':'SIGNAL LOST';
 $('endtitle').textContent=win?'THE LAST WISH.':'TRY AGAIN.';
 $('endreason').textContent=reason;$('endscore').textContent=String(score).padStart(6,'0');
 $('endstats').textContent=`${kills} PURIFIED · ${loops} LOOPS · DISTRICT ${stage+1}/5`;
}
function home(){setState('title');show('end',false);show('hud',false);show('bottom',false);show('title',true);$('app').classList.remove('playing');$('record').textContent='BEST '+String(best).padStart(6,'0');}
$('home').onclick=home;
function pause(){
 if(state==='play'){setState('pause');show('paused',true);keys.clear();joy.x=joy.y=0;}
 else if(state==='pause'){setState('play');show('paused',false);}
}
$('pause').onclick=pause;$('resume').onclick=pause;
$('quit').onclick=()=>{show('paused',false);home();};
$('app').onpointerover=e=>e.target.closest('button')?.focus();
$('app').onfocusin=()=>sfx('talk');
$('start').focus();
window.addEventListener('pointerdown',soundOn);
$('mute').onclick=()=>{soundOn();$('mute').textContent=mute()?'SOUND OFF':'SOUND ON';};
function shoot(a){shots.push({x:p.x,y:p.y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,life:1.1,hit:new Set(),pierce:1+(owned.pierce||0),bounces:owned.ricochet||0});}
function dash(){if(state==='play'&&p.cool<=0){p.dash=.28*(1+(owned.longdash||0)*.25);p.cool=3.5*.8**(owned.recharge||0);sfx('dash');if(owned.requiem&&requiemClock<=0){for(const a of [-.24,0,.24])shoot(p.a+a);requiemClock=4;sfx('requiem');}shake=2;burst(p.x,p.y,12,true);}}
window.addEventListener('keydown',e=>{
 soundOn();const k=e.key.toLowerCase(),arrow=k.startsWith('arrow'),confirm=k==='enter'||k===' ';if(arrow||confirm)e.preventDefault();if(e.repeat||state==='dying')return;
 if(state==='play')keys.add(k);
 if(state!=='play'&&(arrow||confirm)||k==='enter'){
  const buttons=[...document.querySelectorAll('section:not([hidden]) button')],i=Math.max(0,buttons.indexOf(document.activeElement));
  if(confirm)(document.activeElement.closest('button')||buttons[i])?.click();
  else buttons[(i+(k==='arrowup'||k==='arrowleft'?-1:1)+buttons.length)%buttons.length].focus();
  return;
 }
 if(k===' ')dash();if(k==='escape'||k==='p')pause();if(state==='upgrade'&&['1','2','3'].includes(k))choose(Number(k)-1);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{if(state==='play')pause();keys.clear();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play')pause();});
$('stick').onpointerdown=e=>{e.preventDefault();joy.id=e.pointerId;$('stick').setPointerCapture(e.pointerId);moveStick(e);};
function moveStick(e){if(e.pointerId!==joy.id)return;const r=$('stick').getBoundingClientRect();joy.x=clamp((e.clientX-r.left-r.width/2)/(r.width*.4),-1,1);joy.y=clamp((e.clientY-r.top-r.height/2)/(r.height*.4),-1,1);$('stick').firstElementChild.style.transform=`translate(${joy.x*70}%,${joy.y*70}%)`;}
$('stick').onpointermove=moveStick;
function releaseStick(){joy.id=null;joy.x=joy.y=0;$('stick').firstElementChild.style.transform='';}
$('stick').onpointerup=releaseStick;$('stick').onpointercancel=releaseStick;
$('dash').onpointerdown=e=>{e.preventDefault();dash();};
function burst(x,y,n,color){for(let i=0;i<n&&particles.length<320;i++){const a=Math.random()*TAU,s=15+Math.random()*100;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.3+Math.random()*.5,c:color?colors[i%6]:['#734','#a45','#b99'][i%3]});}}
function float(x,y,text,c='#efe'){floaters.push({x,y,text,c,life:1.1});}
function damage(reason,source=p){
 if(state!=='play'||p.inv>0||p.dash>0)return;
 if(p.shield>0){p.shield--;p.inv=1;sfx('pick');return;}
 p.hp--;p.inv=1.8;shake=5;hitstop=.055;sfx('hit');burst(p.x,p.y,14,true);
 if(p.hp<=0){deathTime=1.8;deathCause=reason;deathSource={x:source.x,y:source.y};setState('dying');show('hud',false);show('bottom',false);keys.clear();releaseStick();sfx('fall');notify(reason+' / SIGNAL FADING');return;}
 notify(reason+' / '+p.hp+' HEARTS LEFT');
}
function kill(e,loop=false){
 if(e.dead)return;
 if(e.boss&&e.hp>0)return;
 e.dead=true;kills++;score+=e.boss?1500:loop?120:65;burst(e.x,e.y,e.boss?90:28,loop);if(!loop)sfx('dead');float(e.x,e.y,e.boss?'+1500':loop?'+120':'+65',loop?colors[4]:'#ccc');
 if(e.boss){bossDead=true;relay=true;notify('WARDEN DOWN. REACH THE RELAY.');}
 if(rng()<.18)items.push({x:e.x,y:e.y,type:rng()<.3?'heart':'charge',life:12});
 if(loop&&owned.blast)for(const n of enemies)if(n!==e&&!n.dead&&distance(n,e)<24+owned.blast*10){n.hp-=1;if(n.hp<=0)kill(n);}
}
function hitEnemy(e,n=1,loop=false){e.hp-=n;e.flash=.1;if(e.hp<=0)kill(e,loop);}
function spawn(boss=false){
 if(enemies.filter(e=>!e.dead).length>=18)return;
 let pos;
 for(let tries=0;tries<40;tries++){const side=rng()*4|0;pos={x:side<2?(side?600:40):40+rng()*560,y:side>=2?(side===2?72:360):76+rng()*280};if(!blocked(pos.x,pos.y,10,boxes)&&distance(pos,p)>120)break;pos=null;}
 if(!pos)return;
 const type=boss?3:stage<1?0:Math.min(2,rng()*(stage+1)|0);
 enemies.push({...pos,a:Math.atan2(p.y-pos.y,p.x-pos.x),hp:boss?24:type===2?2:1,type,boss,life:0,think:rng()*.2,desired:0,charge:0,cycle:2+rng()*2,trail:0,flash:0,warning:.8});
}
function purify(poly){
 if(area(poly)<110)return;
 loops++;loopLock=.25;shake=2;hitstop=.055;let count=0;
 for(const e of enemies)if(!e.dead&&inside(e,poly)){hitEnemy(e,e.boss?3:5,true);count++;}
 sfx('loop',count);
 if(count&&owned.herb&&herbClock<=0&&p.hp<3){p.hp++;herbClock=12;float(p.x,p.y-30,'+HEART',colors[3]);}
 corrupt=corrupt.filter(t=>!inside(t,poly));
 rings.push({poly,life:.85});for(let i=0;i<poly.length;i+=6)burst(poly[i].x,poly[i].y,2,true);
 if(count){score+=count*40;p.cool=Math.max(0,p.cool-count*.7);float(p.x,p.y-18,`${count} CAUGHT!`,colors[3]);}
 else float(p.x,p.y-14,'LOOP!',colors[4]);
}
function updateTrail(dt,old){
 const ttl=5.5*(1+(owned.trail||0)*.25);
 trail=trail.filter(t=>(t.life-=dt)>0);
 loopLock=Math.max(0,loopLock-dt);
 if(trail.length>15&&loopLock<=0){
  for(let i=0;i<trail.length-12;i++){
   const a=trail[i],b=trail[i+1];
   if(distance(p,a)>8)continue;
   const cross=intersection(old,p,a,b)|| (segmentDistance(p,a,b)<3?{x:p.x,y:p.y}:null);
   if(cross){const poly=[cross,...trail.slice(i+1),{x:p.x,y:p.y}];purify(poly);trail=[];break;}
  }
 }
 if(!trail.length||distance(p,trail[trail.length-1])>=3)trail.push({x:p.x,y:p.y,life:ttl,c:Math.floor(elapsed*12)%6});
 hash.clear();for(let i=0;i<trail.length;i++)hash.insert(i,trail[i].x,trail[i].y);
}
function update(dt){
 elapsed+=dt;toastTime=Math.max(0,toastTime-dt);$('toast').style.opacity=toastTime>0?1:0;
 if(state==='dialog'){
  const line=narration[lineIndex]?.[1]||'',before=typed|0;typed=Math.min(line.length,typed+dt*32);$('line').textContent=line.slice(0,typed|0);
  if((typed|0)>before&&line[before]!==' ')sfx('talk');return;
 }
 if(state==='dying'){deathTime-=dt;if(deathTime<=0)finish(false,deathCause);return;}
 if(state!=='play')return;
 requiemClock-=dt;herbClock-=dt;
 if(hitstop>0){hitstop-=dt;return;}
 clock+=dt;loopLock=Math.max(0,loopLock-dt);p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);p.dash=Math.max(0,p.dash-dt);shake=Math.max(0,shake-dt*15);
 radioTime-=dt;if(radioTime<=0)show('radio',false);
 if(clock>12+radioBeat*17&&radioBeat<2){radio(['They can smell your color.','Jacob is waiting.'][radioBeat++]);}
 let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dy=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));
 if(joy.id!==null){dx=joy.x;dy=joy.y;}
 if(dx||dy)p.a+=clamp(angleDelta(p.a,Math.atan2(dy,dx)),-7.4*dt,7.4*dt);
 const old={x:p.x,y:p.y},speed=p.dash>0?300:owned.nyan?110:100;
 if(p.dash>0&&frame%2===0)burst(p.x-Math.cos(p.a)*9,p.y-Math.sin(p.a)*9,2,true);
 // Small swept steps prevent high-speed dash tunneling through narrow walls.
 const steps=Math.ceil(speed*dt/3);
 for(let i=0;i<steps;i++){
  const x=p.x+Math.cos(p.a)*speed*dt/steps,y=p.y+Math.sin(p.a)*speed*dt/steps;
  if(blocked(x,y,5,boxes)){damage('HIT A WALL',{x,y});p.a+=Math.PI*.7;break;}else{p.x=x;p.y=y;}
 }
 if(state!=='play')return;
 updateTrail(dt,old);
 enemyHash.clear();for(const e of enemies)if(!e.dead)enemyHash.insert(e,e.x,e.y);
 for(const e of enemies){
  if(e.dead)continue;e.life+=dt;e.warning-=dt;e.flash=Math.max(0,e.flash-dt);if(e.warning>0)continue;
  e.think-=dt;e.cycle-=dt;
  if(e.type>=2&&e.cycle<=0){e.charge=1.1;e.cycle=e.boss?(e.hp<=12?1.9:2.5):4;e.desired=Math.atan2(p.y-e.y,p.x-e.x);}
  if(e.charge>0)e.charge-=dt;
  if(e.think<=0&&e.charge<=0){
   const lead=e.type===1?45:0,target={x:p.x+Math.cos(p.a)*lead,y:p.y+Math.sin(p.a)*lead};
   e.desired=steer(e,target,boxes,hash.query(e.x,e.y,36).map(i=>trail[i]),enemyHash.query(e.x,e.y,36));e.think=.16+(e.type===0?.12:0);
  }
  const preparing=e.charge>.65,charging=e.charge>0&&!preparing;
  e.a+=clamp(angleDelta(e.a,e.desired),-dt*(charging?1:3.6),dt*(charging?1:3.6));
  const speed=preparing?0:charging?194: e.boss?(e.hp<=12?70:58):47+stage*5+e.type*7.5;
  const x=e.x+Math.cos(e.a)*speed*dt,y=e.y+Math.sin(e.a)*speed*dt;
  if(!blocked(x,y,e.boss?13:6,boxes)){e.x=x;e.y=y;}else{e.a+=1.8;e.think=0;e.charge=0;}
  e.trail-=dt;
  if(e.trail<=0){corrupt.push({x:e.x,y:e.y,life:e.boss?4:2.6});e.trail=.09;}
  if(distance(e,p)<(e.boss?17:11)){
   if(p.dash>0&&!e.dashed){e.dashed=true;hitEnemy(e,e.boss?1:3);}else damage(e.boss?'WARDEN BITE':'BITTEN',e);
  }
  if(p.dash<=0)e.dashed=false;
  if(e.flash<=0)for(const i of hash.query(e.x,e.y,12)){
   if(i<1)continue;if(segmentDistance(e,trail[i-1],trail[i])<(e.boss?10:5)){hitEnemy(e,e.boss?.04:1);e.flash=e.boss?.3:.1;break;}
  }
 }
 if(state!=='play')return;
 enemies=enemies.filter(e=>!e.dead);
 corrupt=corrupt.filter(t=>(t.life-=dt)>0);
 for(const t of corrupt)if(distance(p,t)<5){damage('CURSED TRAIL',t);break;}
 if(state!=='play')return;
 spawnClock-=dt;
 if(spawnClock<=0&&!relay){spawn();spawnClock=Math.max(.65,2-stage*.26-clock*.012);}
 if(clock>=45&&stage<4&&!relay){relay=true;notify('RELAY ONLINE. REACH THE CENTER.');sfx('pick');}
 if(relay&&Math.hypot(p.x-320,p.y-215)<17){
  if(stage===4){talk([['JACOB',"I wish Esau's wish had never been granted!"],['ISAAC','Esau lives again. The unicorns stay.'],['RUNI','Best. Wish. Ever.']],()=>finish(true,'Two brothers. Unicorns forever.'));}
  else upgrade();return;
 }
 shotClock-=dt;
 if(owned.gun&&shotClock<=0&&enemies.length){
  shoot(p.a);
  shotClock=.85*.7**(owned.haste||0);sfx('shot');burst(p.x,p.y,3,true);
 }
 for(const b of shots){
  b.life-=dt;
  for(let step=0;step<2;step++){
   let x=b.x+b.vx*dt/2,y=b.y+b.vy*dt/2;
   if(blocked(x,y,2,boxes)){
    if(b.bounces>0){if(blocked(x,b.y,2,boxes))b.vx=-b.vx;else b.vy=-b.vy;b.bounces--;}else b.life=0;
   }else{b.x=x;b.y=y;}
   for(const e of enemyHash.query(b.x,b.y,20))if(!e.dead&&!b.hit.has(e)&&distance(b,e)<(e.boss?16:9)){b.hit.add(e);hitEnemy(e,e.boss?.5:1);burst(b.x,b.y,4,true);if(--b.pierce<=0)b.life=0;break;}
   if(b.life<=0)break;
  }
 }
 shots=shots.filter(b=>b.life>0);
 pickClock-=dt;
 if(pickClock<=0){
  for(let i=0;i<30;i++){const item={x:40+rng()*560,y:80+rng()*276,type:rng()<.4?'heart':rng()<.5?'shield':'charge',life:14};if(!blocked(item.x,item.y,10,boxes)){items.push(item);break;}}
  pickClock=8;
 }
 for(const item of items){
  item.life-=dt;const d=distance(item,p);
  if(d<25+25*(owned.magnet||0)&&d>1){item.x+=(p.x-item.x)/d*60*dt;item.y+=(p.y-item.y)/d*60*dt;}
  if(d<10){item.life=0;score+=25;sfx('pick');burst(item.x,item.y,6,true);if(item.type==='heart')p.hp=Math.min(3,p.hp+1);else if(item.type==='shield')p.shield=Math.min(6,p.shield+1);else p.cool=0;float(p.x,p.y-12,item.type==='charge'?'DASH READY':item.type==='heart'?'+HEART':'+SHIELD',colors[3]);}
 }
 items=items.filter(i=>i.life>0);
 for(const a of particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vx*=.96;a.vy*=.96;a.life-=dt;}particles=particles.filter(a=>a.life>0);
 for(const r of rings)r.life-=dt;rings=rings.filter(r=>r.life>0);
 for(const f of floaters){f.y-=dt*17;f.life-=dt;}floaters=floaters.filter(f=>f.life>0);
 $('health').textContent='♥'.repeat(p.hp)+'♡'.repeat(3-p.hp)+(p.shield?' ◇'+p.shield:'');$('score').textContent=String(score).padStart(6,'0');
 $('loadout').textContent=(owned.gun?'MEGACORN / ':'')+'DASH '+(p.cool>0?p.cool.toFixed(1)+'s':'READY');
 $('clock').textContent=relay?'→ RELAY':stage===4?'BREAK THE WARDEN':String(Math.max(0,45-Math.floor(clock))).padStart(2,'0')+'s';
}

// Cached grayscale city floor. Color is reserved for living energy, items, and combat feedback.
let floor=document.createElement('canvas');floor.width=640;floor.height=400;
function floorArt(){
 const c=floor.getContext('2d');
 c.fillStyle='#111';c.fillRect(0,0,640,400);
 c.fillStyle='#122';c.fillRect(18,54,604,326);
 c.strokeStyle='#334';c.lineWidth=1;
 for(let y=54;y<380;y+=24)for(let x=18;x<622;x+=32)c.strokeRect(x,y,32,24);
 c.strokeStyle='#667';c.strokeRect(18,54,604,326);
 for(const b of boxes){
  c.fillStyle='#001';c.fillRect(b.x+4,b.y+7,b.w,b.h);
  c.fillStyle='#445';c.fillRect(b.x,b.y,b.w,b.h);
  c.fillStyle='#223';c.fillRect(b.x+2,b.y+3,b.w-4,b.h-3);
  c.fillStyle='#667';
  for(let y=b.y+5;y<b.y+b.h-2;y+=6)c.fillRect(b.x+4,y,b.w-8,b.type===0?3:1);
 }
}
let cachedStage=-1;
function draw(){
 if(cachedStage!==stage){floorArt();cachedStage=stage;}
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#111';ctx.fillRect(0,0,640,400);
 const title=state==='title';
 ctx.save();if(shakeOn&&shake>0&&state==='play')ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 if(touch&&innerHeight>innerWidth&&!title&&p){const span=400*innerWidth/innerHeight;ctx.translate(320-clamp(p.x,span/2,640-span/2),0);}
 ctx.drawImage(floor,0,0);
 // Horizon with unlit windows, antennas and a broken elevated rail.
 ctx.fillStyle='#011';ctx.fillRect(0,0,640,54);
 for(let i=0;i<30;i++){const x=i*25-30,h=20+i*31%55;ctx.fillStyle='#122';ctx.fillRect(x,54-h,20,h);}
 if(title){drawTitleWorld();}else{
  if(relay){const pulse=Math.sin(elapsed*5)*2;ctx.strokeStyle='#9bb';ctx.lineWidth=1;ctx.beginPath();ctx.arc(320,215,17+pulse,0,TAU);ctx.stroke();ctx.strokeRect(308,203,24,24);ctx.fillStyle='#ddd';ctx.font='7px Runicorn';ctx.textAlign='center';ctx.fillText('RELAY',320,186);ctx.fillText('↓',320,199);}
  else{ctx.fillStyle='#334';ctx.fillRect(313,208,14,14);ctx.strokeStyle='#566';ctx.strokeRect(313,208,14,14);}

  for(const r of rings){ctx.globalAlpha=r.life*.6;ctx.fillStyle=colors[(elapsed*9|0)%6];ctx.beginPath();r.poly.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.globalAlpha=Math.min(1,r.life*2);ctx.strokeStyle='#dfe';ctx.lineWidth=2;ctx.stroke();}ctx.globalAlpha=1;
  for(const t of corrupt){ctx.fillStyle=`rgba(141,154,164,${Math.min(.6,t.life*.3)})`;ctx.fillRect(t.x-2,t.y-2,4,4);ctx.fillStyle='#112';ctx.fillRect(t.x-1,t.y,2,1);}
  ctx.lineCap='round';
  for(let i=1;i<trail.length;i++){const a=trail[i-1],b=trail[i];ctx.globalAlpha=Math.min(1,b.life);ctx.strokeStyle=colors[b.c];ctx.lineWidth=owned.nyan?10:6;ctx.globalAlpha*=.14;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.globalAlpha=Math.min(1,b.life);ctx.lineWidth=owned.nyan?4:2.3;ctx.stroke();
   if(owned.nyan){const a1=Math.atan2(b.y-a.y,b.x-a.x);for(let j=0;j<6;j++){const x=Math.sin(a1)*(j-2.5)*1.1,y=-Math.cos(a1)*(j-2.5)*1.1;ctx.strokeStyle=colors[j];ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(a.x+x,a.y+y);ctx.lineTo(b.x+x,b.y+y);ctx.stroke();}}}ctx.globalAlpha=1;
  for(const item of items){const y=item.y+Math.sin(elapsed*5)*3,a=itemArt(item.type);ctx.globalAlpha=.14;ctx.fillStyle=a.color;ctx.fillRect(item.x-10,y-10,20,20);ctx.globalAlpha=1;ctx.strokeStyle=a.color;ctx.strokeRect(item.x-9,y-9,18,18);ctx.drawImage(a.canvas,item.x-6,y-6);}
  for(const e of enemies){
   if(e.dead)continue;
   if(e.warning>0){ctx.strokeStyle='#aab';ctx.beginPath();ctx.arc(e.x,e.y,8+e.warning*12,0,TAU);ctx.stroke();continue;}
   if(e.charge>.65){ctx.strokeStyle='#ccd';ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+Math.cos(e.desired)*85,e.y+Math.sin(e.desired)*85);ctx.stroke();ctx.setLineDash([]);}
   if(e.flash>0)ctx.globalAlpha=.5;sprite(e.x,e.y+Math.sin(elapsed*15+e.life)*.7,e.a,e.boss?2.5:e.type===2?1.55:e.type===1?1.05:1.25,true,e.type>=2,elapsed+e.life,e.type);ctx.globalAlpha=1;
   if(e.boss){ctx.fillStyle='#112';ctx.fillRect(e.x-22,e.y-25,44,3);ctx.fillStyle=e.hp<=12?'#f69':'#cdd';ctx.fillRect(e.x-22,e.y-25,44*Math.max(0,e.hp)/24,3);ctx.font='5px Runicorn';ctx.textAlign='center';ctx.fillText(e.hp<=12?'WARDEN / ENRAGED':'WARDEN',e.x,e.y-29);}
  }
  for(const b of shots){ctx.fillStyle=colors[(elapsed*12|0)%6];ctx.fillRect(b.x-3,b.y-2,6,4);ctx.fillStyle='#fff';ctx.fillRect(b.x-1,b.y-1,2,2);}
  if(p){
   const py=p.y+(owned.nyan?Math.sin(elapsed*TAU*148/60)*1.4:0);

   if(p.inv>0&&state!=='dying')ctx.globalAlpha=.45+.55*Math.abs(Math.sin(elapsed*20));sprite(p.x,py,p.a,owned.nyan?1.55:1.45,state==='dying'&&deathTime<1,owned.gun,owned.nyan?0:elapsed);ctx.globalAlpha=1;
   if(owned.nyan){ctx.save();ctx.translate(p.x,py);ctx.rotate(p.a);ctx.fillStyle='#db9';ctx.fillRect(-10,-7,13,14);ctx.fillStyle=state==='dying'&&deathTime<1?'#789':'#f9c';ctx.fillRect(-8,-5,9,10);ctx.fillStyle='#b58';for(let i=0;i<5;i++)ctx.fillRect(-7+(i*3)%8,-4+i*2,1,1);ctx.restore();}
   if(p.shield){ctx.strokeStyle='#9fd';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,14,0,TAU);ctx.stroke();}
   ctx.strokeStyle=p.cool>0?'#799':'#bfd';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,17,-Math.PI/2,-Math.PI/2+TAU*(1-p.cool/(3.5*.8**(owned.recharge||0))));ctx.stroke();
   if(p.dash>0){ctx.strokeStyle=colors[frame%6];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-Math.cos(p.a)*25,p.y-Math.sin(p.a)*25);ctx.lineTo(p.x,p.y);ctx.stroke();}
  }
  if(state==='dying'){const d=deathSource;ctx.strokeStyle='#f69';ctx.lineWidth=2;ctx.beginPath();ctx.arc(d.x,d.y,12+Math.sin(elapsed*8)*2,0,TAU);ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(d.x,d.y);ctx.stroke();ctx.fillStyle='#fff';ctx.font='7px Runicorn';ctx.textAlign='center';ctx.fillText(deathCause,clamp(p.x,70,570),p.y>110?p.y-36:p.y+36);}
  for(const a of particles){ctx.globalAlpha=Math.min(1,a.life*3);ctx.fillStyle=a.c;ctx.fillRect(a.x,a.y,a.life>.4?3:2,2);}ctx.globalAlpha=1;
  for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life*2);ctx.fillStyle=f.c;ctx.font='bold 7px Runicorn';ctx.textAlign='center';ctx.fillText(f.text,f.x,f.y);}ctx.globalAlpha=1;
 }
 ctx.restore();
 if(state==='dialog'&&(stage===0||relay))drawStory();
}
function drawStory(){
 const bright=relay||lineIndex<2,bob=Math.sin(elapsed*3)*2;
 ctx.fillStyle=bright?'#247':'#112';ctx.fillRect(108,55,424,174);
 ctx.strokeStyle='#79b';ctx.strokeRect(108,55,424,174);
 for(let i=0;i<12;i++){const x=116+i*34,h=24+(i*17)%61;ctx.fillStyle=bright?colors[i%6]:'#334';ctx.fillRect(x,190-h,26,h);ctx.fillStyle=bright?'#fe8':'#112';for(let y=198-h;y<181;y+=10)ctx.fillRect(x+5,y,4,4);}
 for(let j=0;j<6;j++){ctx.strokeStyle=colors[j];ctx.beginPath();ctx.lineWidth=3;ctx.ellipse(323,191,49+j*3,12+j*2,0,0,TAU);ctx.stroke();}
 sprite(322,169+bob,-.2,3,false, !bright);
 for(let i=0;i<2;i++){
  const x=259+i*114;
  if(!bright){sprite(x,170,-i*3,2,true);continue;}
  child(ctx,x-8,142,1,i);
 }
 ctx.globalAlpha=bright?.35:.8;ctx.drawImage(moth,296,64+bob,48,48);ctx.globalAlpha=1;
 ctx.fillStyle=colors[2];ctx.fillRect(315,120,16,5);ctx.fillRect(328,117,7,3);
 ctx.fillStyle='#eef';ctx.font='7px Runicorn';ctx.textAlign='center';ctx.fillText(relay?'WISH 03 / HOME':bright?'WISH 01 / COLOR':'WISH 02 / CURSE',320,216);
}
function drawTitleWorld(){
 // A looping mural made from the exact runtime art, not a separate heavy image.
 ctx.save();ctx.translate(320,206);
 for(let j=0;j<6;j++){
  ctx.beginPath();ctx.strokeStyle=colors[j];ctx.lineWidth=3;ctx.globalAlpha=.7;
  ctx.ellipse(0,0,90+j*3,25+j*2,0,elapsed*.08,elapsed*.08+5.5);ctx.stroke();
 }
 ctx.globalAlpha=1;sprite(0,-12,-.28,3.5,false,true);
 sprite(-151,22,-.9,2,true,false);sprite(145,-25,2.2,2,true,true);sprite(167,62,-2.5,2.1,true,false);
 ctx.restore();
}
let last=performance.now(),acc=0;
function loop(now){const dt=Math.min(.1,(now-last)/1000);last=now;acc+=dt;while(acc>=1/60){update(1/60);acc-=1/60;}frame++;draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);

// Development-only hooks are compiled out of the submitted archive.
if(__DEV__){
 // Run the real mutation application and combat after production minification.
 window.__verify=()=>{
  start();
  for(const u of upgrades){stage=0;choice=[u];setState('upgrade');choose(0);}
  lineIndex=narration.length;nextLine();p.inv=100;spawn();dash();update(1/60);
  return [upgrades.every(u=>owned[u.id]===1),p.shield,p.cool,p.dash,shots[0]?.pierce,shots[0]?.bounces];
 };
 window.__runicorn={
  snapshot:()=>({state,stage,clock,score,kills,loops,seed,p:{...p},enemyCount:enemies.length,trailCount:trail.length,owned:{...owned},boxes}),
  combat:()=>({shots:shots.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy})),enemies:enemies.map(e=>({...e})),requiemClock,herbClock,deathTime}),
  aim:dash,
  fixture:()=>{enemies=[];boxes=[];trail=[];corrupt=[];shots=[];spawnClock=100;shotClock=0;},
  enemy:(data={})=>{enemies.push({x:400,y:215,a:0,hp:1,type:0,life:0,think:10,desired:0,charge:0,cycle:10,trail:10,flash:0,warning:10,...data});},
  hurt:(reason,source)=>{p.inv=p.dash=0;damage(reason,source);},
  purify,
  start,skip:()=>{if(state==='dialog'){lineIndex=narration.length;nextLine();}},
  set:(data)=>{if(data.p)Object.assign(p,data.p);if(data.clock!==undefined)clock=data.clock;if(data.owned)Object.assign(owned,data.owned);},
  stage:(n)=>{stage=n;beginStage();},
  tick:(n)=>{for(let i=0;i<n;i++)update(1/60);},
  win:()=>{enemies.forEach(e=>{e.hp=0;kill(e,true);});relay=true;p.x=320;p.y=215;update(1/60);},
  loop:()=>{const poly=[{x:80,y:80},{x:150,y:80},{x:150,y:150},{x:80,y:150}];enemies.push({x:110,y:110,hp:1,dead:false});purify(poly);},
  stress:()=>{for(let i=0;i<18;i++)spawn();for(let i=0;i<200;i++)trail.push({x:30+(i*7)%570,y:80+(i*3)%260,life:5,c:i%6});},
  die:()=>{p.hp=1;p.inv=0;p.dash=0;damage('TEST COLLISION');}
  ,drive:(steps=1)=>{
   for(let i=0;i<steps;i++){
    if(state==='dialog'){lineIndex=narration.length;nextLine();}
    if(state==='upgrade')choose(0);
    if(state!=='play')break;
    const a=Math.atan2(p.y-215,p.x-320)+.55;
    joy.id=-1;joy.x=(relay?320:320+Math.cos(a)*34)-p.x;joy.y=(relay?215:215+Math.sin(a)*34)-p.y;
    if(enemies.some(e=>!e.dead&&distance(e,p)<24)||corrupt.some(t=>distance(t,p)<12))dash();
    update(1/60);
   }
  }
 };
}
