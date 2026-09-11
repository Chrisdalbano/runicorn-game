// Loaded only by the trailer recorder. The shipped game is never modified.
window.film = (() => {
  const out = document.createElement('canvas'); out.width=1280; out.height=720;
  const g=out.getContext('2d'), palette=['#ff6699','#ff9966','#ffee88','#77ffbb','#66ddff','#aa88ff'];
  let current=-1, previous=0;
  const cuts=[0,2,4,8,12,14,16,20,24,26.5,28,32];
  const cues=[['ZOMBIES?','BAD WISH.'],['RAINBOWS.','GOOD PROBLEM.'],['DRAW THE LOOP.','YOUR TRAIL IS THE TRAP.'],['DROP THE DEAD.','CLOSE IT. CLEAR IT.'],['AIM.','MEGACORN HAT'],['DASH. BLAST.','THE REQUIEM GUN'],['GET WEIRD.','RARE / NYAN-UNICORN'],['MAKE IT SING.','EVERY LOOP HAS A PAYOFF.'],['ONE LAST WISH.','BREAK THE WARDEN.'],['...ONE MORE RUN.','OKAY. THAT HAPPENED.']];
  function setup(k){
    seed=1313+k; rng=random(seed); owned={}; stage=k===8||k===9?4:Math.min(3,k%4);
    p={x:364,y:225,a:Math.PI/2,hp:3,shield:0,dash:0,cool:0,inv:0};
    beginStage(); window.__runicorn.skip();
    boxes=boxes.filter(b=>Math.hypot(b.x+b.w/2-320,b.y+b.h/2-225)>110); cachedStage=-1;
    enemies=[];trail=[];particles=[];rings=[];corrupt=[];items=[];shots=[];
    spawnClock=100;pickClock=100;shotClock=0;loopLock=0;hitstop=0;clock=0;relay=false;
    joy.id=-1; p.inv=0;
    if(k===4)owned={gun:1,haste:1};
    if(k===5)owned={requiem:1};
    if(k===6)owned={nyan:1,trail:1};
    if(k===7)owned={nyan:1};
    if(k===8||k===9){
      owned={gun:1}; p.x=370;p.y=250;
      window.__runicorn.enemy({x:310,y:215,boss:true,type:3,hp:12,warning:0,think:0});
    } else {
      for(let i=0;i<(k===0?13:8);i++){
        const a=i*TAU/8, r=85+(i%3)*12;
        window.__runicorn.enemy({x:320+Math.cos(a)*r,y:225+Math.sin(a)*r,warning:0,think:0,type:i%3===0?1:0});
      }
    }
    if(k===4||k===5){p.x=255;p.y=250;p.a=0;}
    if(k===9){p.hp=1;damage('WARDEN BITE',enemies[0]);}
    equipment();
  }
  function ink(text,x,y,size,color='#f5fbff',align='left'){
    g.font=`${size}px Runicorn`;g.textAlign=align;g.textBaseline='middle';
    if(color!=='#07151a'){g.fillStyle='#030711';g.fillText(text,x+3,y+4);}g.fillStyle=color;g.fillText(text,x,y);
  }
  function rainbow(t,x,y,w,h){
    for(let j=0;j<6;j++){g.strokeStyle=palette[j];g.lineWidth=h/6+1;g.beginPath();
      for(let i=0;i<=80;i++){const xx=x+i*w/80, yy=y+j*h/6+Math.sin(i*.12-t*5)*8;i?g.lineTo(xx,yy):g.moveTo(xx,yy);}g.stroke();}
  }
  function step(t){
    window.filmTime=t;
    let k=cuts.findIndex((v,i)=>t>=v&&t<cuts[i+1]); if(k<0)k=10;
    if(k!==current){setup(k);current=k;}
    if(k<9){
      for(let j=0;j<2;j++){
        const a=Math.atan2(p.y-225,p.x-320)+.24, r=k===7?26:k===6?47:44;
        const tx=320+Math.cos(a)*r,ty=225+Math.sin(a)*r;
        joy.x=tx-p.x;joy.y=ty-p.y;
        if(k===4||k===5){joy.x=Math.cos((t-cuts[k])*1.4);joy.y=Math.sin((t-cuts[k])*1.4)*.7;}
        // Controlled starting positions; movement, collisions and loop detection are the real engine.
        p.hp=3; update(1/60);frame++;
      }
      if(k===5&&previous<14.35&&t>=14.35)dash();
      if(k===8&&previous<25&&t>=25)dash();
      if(enemies.length<4&&k!==8&&Math.floor(t*2)!==Math.floor(previous*2)){
        const a=t*2;window.__runicorn.enemy({x:320+Math.cos(a)*75,y:225+Math.sin(a)*75,warning:0,think:0});
      }
    }else if(k===9){update(1/30);frame++;}
    else {elapsed=t;state='title';frame++;}
    draw();if(k===10){ctx.clearRect(0,0,640,400);drawTitleWorld();} previous=t;
    g.setTransform(1,0,0,1,0,0);g.fillStyle='#050810';g.fillRect(0,0,1280,720);
    g.imageSmoothingEnabled=false;
    const local=t-cuts[k],pulse=Math.exp(-((t*2)%1)*8);
    if(k<10){
      const span=k<2?260:k===6?330:k===8?280:350;
      const zoom=1+.025*Math.sin(local*.7); const sw=span/zoom,sh=sw*720/1280;
      g.drawImage(canvas,320-sw/2,225-sh/2,sw,sh,0,0,1280,720);
      const shade=g.createLinearGradient(0,0,0,720);shade.addColorStop(0,'#020511ed');shade.addColorStop(.29,'#02051108');shade.addColorStop(.72,'#02051100');shade.addColorStop(1,'#020511dc');g.fillStyle=shade;g.fillRect(0,0,1280,720);
      const slide=Math.max(0,1-local/.24);g.save();g.translate(-slide*50,0);g.globalAlpha=1-slide;
      ink(cues[k][0],58,95,k<2?86:k===9?53:57,k===9?palette[0]:palette[k%6]);
      ink(cues[k][1],62,155,17);g.restore();
      ink('RUNICORN',58,657,20);ink('ZOMBIE APOCALYPSE',58,686,11,'#aab5ca');
      ink(k===8?'FINAL BOSS':k===6?'RAINBOW OVERDRIVE':'CLOSE THE LOOP',1222,674,13,palette[k%6],'right');
      // Thin framing and a restrained beat meter keep the footage readable.
      g.fillStyle=palette[k%6];g.fillRect(58,190,70+35*pulse,4);
      for(let n=0;n<12;n++){const h=5+16*Math.abs(Math.sin(t*5+n*.7))*pulse;g.fillStyle=palette[n%6];g.fillRect(1085+n*11,620-h,5,h);}
    }else{
      g.fillStyle='#080d19';g.fillRect(0,0,1280,720);
      for(let i=0;i<55;i++){g.fillStyle=palette[i%6];g.globalAlpha=.13+.16*Math.sin(i+t);const x=(i*193+t*(i%2?14:-8)+1280)%1280,y=(i*137)%720;g.fillRect(x,y,3,3);}g.globalAlpha=1;
      rainbow(t,-50,510,1380,40);
      g.drawImage(canvas,200,140,240,130,390,355,500,270);
      g.font='102px Runicorn';g.textAlign='center';g.textBaseline='middle';
      for(let i=5;i>=0;i--){g.fillStyle=palette[i];g.fillText('RUNICORN',640,215+i*5);}
      ink('RUNICORN',640,215,102,'#f4fbff','center');
      ink('ZOMBIE APOCALYPSE',640,310,29,'#ff8faa','center');
      g.fillStyle='#77ffbb';g.fillRect(475,569,330,53);ink('PLAY FREE',640,596,25,'#07151a','center');
      ink('js13kGames  /  Wavedash',640,660,17,'#d9e6ff','center');
      ink('LINKS IN DESCRIPTION',640,692,10,'#8ea0b8','center');
    }
    // A single diagonal rainbow wipe per cut; no full-screen strobe.
    if(k>0&&local<.23){const q=local/.23;g.save();g.transform(1,0,-.35,1,0,0);for(let n=0;n<6;n++){g.fillStyle=palette[n];g.fillRect(-500+q*2300+n*34,0,36,720);}g.restore();}
    g.fillStyle='#fff';g.globalAlpha=.025;for(let y=0;y<720;y+=4)g.fillRect(0,y,1280,1);g.globalAlpha=1;
    const fade=t>31.5?(32-t)/.5:Math.min(1,t/.12);if(fade<1){g.fillStyle=`rgba(2,4,10,${1-fade})`;g.fillRect(0,0,1280,720);}
    return out.toDataURL('image/png').split(',')[1];
  }
  return {step,canvas:out};
})();
