// Pure deterministic systems, shared by the game and the test suite.
export const TAU = Math.PI * 2;
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const angleDelta = (a, b) => Math.atan2(Math.sin(b-a), Math.cos(b-a));
export function random(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = Math.imul(s ^ s >>> 15, 1 | s); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
export function inside(p, polygon) {
  let hit = false;
  for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const a=polygon[i],b=polygon[j];
    if ((a.y>p.y)!=(b.y>p.y) && p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x) hit=!hit;
  }
  return hit;
}
export function intersection(a,b,c,d) {
  const x=b.x-a.x,y=b.y-a.y,u=d.x-c.x,v=d.y-c.y,det=x*v-y*u;
  if (Math.abs(det)<1e-8) return null;
  const t=((c.x-a.x)*v-(c.y-a.y)*u)/det, q=((c.x-a.x)*y-(c.y-a.y)*x)/det;
  return t>=0 && t<=1 && q>=0 && q<=1 ? {x:a.x+t*x,y:a.y+t*y} : null;
}
export function segmentDistance(p,a,b) {
  const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy;
  const t=l?clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/l,0,1):0;
  return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
export function area(poly) {
  return Math.abs(poly.reduce((s,a,i)=>{const b=poly[(i+1)%poly.length];return s+a.x*b.y-b.x*a.y;},0))/2;
}
export function blocked(x,y,r,boxes) {
  return x<18+r||x>622-r||y<54+r||y>380-r||boxes.some(b=>x+r>b.x&&x-r<b.x+b.w&&y+r>b.y&&y-r<b.y+b.h);
}
export function reachable(boxes) {
  // Conservative navigation cells have enough clearance for a unicorn.
  const cells=new Set();
  for(let y=0;y<19;y++)for(let x=0;x<36;x++)if(!blocked(32+x*16,70+y*16,9,boxes))cells.add(y*36+x);
  if(!cells.size)return false;
  const todo=[cells.values().next().value],seen=new Set(todo);
  for(let i=0;i<todo.length;i++) {
    const n=todo[i],x=n%36,y=n/36|0;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const xx=x+dx,yy=y+dy,k=yy*36+xx;
      if(xx>=0&&xx<36&&yy>=0&&yy<19&&cells.has(k)&&!seen.has(k)){seen.add(k);todo.push(k);}
    }
  }
  return seen.size===cells.size;
}
export function generateArena(seed,stage) {
  // Separated city lots leave connected streets by construction. The relay
  // occupies a reserved central square, never an obstacle or a narrow passage.
  const rng=random(seed+stage*7919),lots=[];
  for(let y=0;y<4;y++)for(let x=0;x<5;x++) {
    const b={x:58+x*112+(rng()*9|0),y:78+y*76+(rng()*9|0),w:16+(rng()*3|0)*16,h:16+(rng()*2|0)*16,type:(x+y)%4};
    if(b.x<365&&b.x+b.w>272&&b.y<256&&b.y+b.h>165)continue;
    lots.push(b);
  }
  const boxes=[];
  for(let i=0;i<6+Math.floor(stage/2);i++)boxes.push(lots.splice(rng()*lots.length|0,1)[0]);
  return boxes;
}
export const upgrades = [
  {id:'gun',name:'MEGACORN HAT',desc:'Fire forward. Steer to aim.',max:1,tag:'BLASTER'},
  {id:'requiem',name:'THE REQUIEM GUN',desc:'Dash fires 3 shots. 4s cooldown.',max:1,tag:'DASH'},
  {id:'nyan',name:'NYAN-UNICORN',desc:'Fly 10% faster. Denser rainbow.',max:1,tag:'RARE'},
  {id:'herb',name:'GREEN HERB',desc:'Loop hits heal. 12s cooldown.',max:1,tag:'RECOVERY'},
  {id:'pierce',name:'GHOST FREQUENCY',desc:'Shots pierce +1 zombie.',max:2,needs:'gun',tag:'BLASTER'},
  {id:'ricochet',name:'BOUNCE THEORY',desc:'Shots bounce off walls.',max:1,needs:'gun',tag:'BLASTER'},
  {id:'haste',name:'DOUBLE TIME',desc:'Blaster fires 30% faster.',max:2,needs:'gun',tag:'BLASTER'},
  {id:'recharge',name:'RAINBOW DASH+',desc:'Dash recharges 20% faster.',max:3,tag:'DASH'},
  {id:'longdash',name:'AFTERIMAGE',desc:'Dash lasts 25% longer.',max:2,tag:'DASH'},
  {id:'trail',name:'LONG GOODBYE',desc:'Trail lasts 25% longer.',max:2,tag:'TRAIL'},
  {id:'blast',name:'CHROMA DETONATOR',desc:'Loop kills explode.',max:2,tag:'TRAIL'},
  {id:'magnet',name:'GOOD VIBRATIONS',desc:'+25 pickup pull range.',max:2,tag:'UTILITY'},
  {id:'shield',name:'SECOND CHANCE',desc:'Block 2 hits.',max:3,tag:'UTILITY'},
  {id:'heart',name:'RESIDENT EQUINE',desc:'Heal 2 hearts.',max:99,tag:'RECOVERY'}
];
export function offers(rng,owned,stage) {
  let pool=upgrades.filter(u=>(owned[u.id]||0)<u.max&&(!u.needs||owned[u.needs]));
  const result=[];
  if(!owned.gun) {result.push(upgrades[0]);pool=pool.filter(u=>u.id!=='gun');}
  while(result.length<3&&pool.length) {
    const weights=pool.map(u=>u.id==='nyan'?.15:1+(owned.gun&&u.tag==='BLASTER'?1:0)+(stage>2&&u.id==='heart'?1:0));
    let n=rng()*weights.reduce((a,b)=>a+b,0),i=0;
    while(i<pool.length-1&&n>=weights[i])n-=weights[i++];
    result.push(pool.splice(i,1)[0]);
  }
  return result.map(u=>{
    const secondary=upgrades.filter(v=>v.id!==u.id&&v.id!=='gun'&&v.id!=='nyan'&&(owned[v.id]||0)<v.max&&(!v.needs||owned[v.needs]||u.id===v.needs));
    const bonus=stage>0&&rng()<.45?secondary[rng()*secondary.length|0]:null;
    return {...u,bonus};
  });
}
export class SpatialHash {
  constructor(size=24){this.size=size;this.cells=new Map();}
  clear(){this.cells.clear();}
  insert(value,x,y){const k=`${x/this.size|0},${y/this.size|0}`;if(!this.cells.has(k))this.cells.set(k,[]);this.cells.get(k).push(value);}
  query(x,y,r=24){const out=[];for(let j=(y-r)/this.size|0;j<=((y+r)/this.size|0);j++)for(let i=(x-r)/this.size|0;i<=((x+r)/this.size|0);i++)out.push(...(this.cells.get(`${i},${j}`)||[]));return out;}
}
export function steer(enemy,target,boxes,trails,neighbors) {
  const desired=Math.atan2(target.y-enemy.y,target.x-enemy.x);
  let best=enemy.a,score=-Infinity;
  for(let i=-3;i<=3;i++) {
    const a=enemy.a+i*.42,p={x:enemy.x+Math.cos(a)*23,y:enemy.y+Math.sin(a)*23};
    let s=3-Math.abs(angleDelta(a,desired));
    if(blocked(p.x,p.y,9,boxes))s-=100;
    for(const t of trails)if(distance(p,t)<13)s-=4;
    for(const n of neighbors)if(n!==enemy&&distance(p,n)<18)s-=1.5;
    if(s>score){score=s;best=a;}
  }
  return best;
}
