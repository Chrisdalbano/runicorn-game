// Eight-pixel silhouettes, shared by loot, mutation cards and the equipment HUD.
const data={
 requiem:['00fe783838100000','#fa6'],nyan:['427e5a7e3c667e00','#f9c'],herb:['1054387c10103800','#7fb'],
 gun:['3c7effe7ff3c1818','#7df'],pierce:['1010fe7c38101010','#b9f'],
 ricochet:['021e3230223e2000','#fa6'],haste:['4444eeee44440000','#fd7'],
 recharge:['0c18307e0c183000','#6ef'],longdash:['081cfefc70301800','#b8f'],
 trail:['007fc1bd8581ff00','#7fb'],blast:['105438ee38541000','#f7a'],
 magnet:['66666666663c1800','#f7b'],shield:['7effe7e7663c1800','#7fc'],
 heart:['0066ffff7e3c1800','#f68']
};
const cache={};
export function itemArt(id){
 id=id==='charge'?'recharge':id;const [bits,color]=data[id]||data.recharge;
 if(!cache[id]){const c=document.createElement('canvas');c.width=c.height=12;const g=c.getContext('2d');
  for(let y=0;y<8;y++)for(let x=0;x<8;x++)if(parseInt(bits.slice(y*2,y*2+2),16)&(128>>x)){
   g.fillStyle='#112';g.fillRect(x+2,y+2,2,2);g.fillStyle=y<2?'#efe':color;g.fillRect(x+1,y+1,1,1);
  }cache[id]=c;
 }return {canvas:cache[id],color};
}
export function itemIcon(id){const c=document.createElement('canvas');c.width=c.height=12;c.className='item-icon';c.setAttribute('aria-label',id);c.getContext('2d').drawImage(itemArt(id).canvas,0,0);return c;}
