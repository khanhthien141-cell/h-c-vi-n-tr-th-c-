import {heroes} from './shared/heroes.js';
// Deliberately render to a small 2D canvas; the browser scales whole pixels.
export function makePixelScene(canvas,state){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Thiết bị không hỗ trợ Canvas 2D.');
 let mode='lobby',zoom=1,panX=0,panZ=0,active=false,lastT=0,center={x:0,z:0};const pointers=new Map(),sprites=new Map(),walkSheets=new Map(),history=new Map(),floaters=[];let pinch=0;const terrain=new Image();terrain.src="./assets/pixel/terrain-atlas.png";
 for(const h of heroes){const im=new Image();im.src='./assets/pixel/'+h.id+'.png';sprites.set(h.id,im);const sheet=new Image();sheet.src='./assets/pixel/'+h.id+'-walk.png';walkSheets.set(h.id,sheet);}
 const controls={onChange:()=>{},setActive(v){active=v;},reset(){panX=panZ=0;zoom=1;controls.onChange();},toggle(){state.free=!state.free;panX=panZ=0;pointers.clear();controls.onChange();},zoom(d){zoom=Math.max(.65,Math.min(2,zoom*Math.exp(-d*.001)));controls.onChange();}};
 canvas.addEventListener('pointerdown',e=>{if(!active||!state.free)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;});
 canvas.addEventListener('pointermove',e=>{const prev=pointers.get(e.pointerId);if(!prev)return;const next={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,next);if(pointers.size===2){const [a,b]=[...pointers.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)controls.zoom((pinch-d)*4);pinch=d;}else{panX-=(next.x-prev.x)/canvas.clientWidth*canvas.width/(8*zoom);panZ-=(next.y-prev.y)/canvas.clientHeight*canvas.height/(8*zoom);}});
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,e=>{pointers.delete(e.pointerId);pinch=0;});
 canvas.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();controls.zoom(e.deltaY);},{passive:false});
 function rect(x,y,w,h,col){ctx.fillStyle=col;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 function tileTree(x,y,color){
 rect(x-11,y+8,24,4,'#557e8170');rect(x-3,y-3,7,16,'#685d77');rect(x-2,y-2,3,14,'#a28087');rect(x+1,y+2,2,7,'#806779');rect(x-6,y+11,13,2,'#617e75');
 const blocks=[[-7,-29,14,6],[-13,-24,25,9],[-17,-17,33,12],[-13,-6,27,7],[-7,1,16,3]];
 for(const [xx,yy,w,h]of blocks)rect(x+xx,y+yy,w,h,'#65778c');
 for(const [xx,yy,w,h]of blocks)rect(x+xx+1,y+yy,w-2,h-2,color);
 rect(x-10,y-22,7,2,'#fff5df66');rect(x-7,y-26,7,2,'#fff5df66');rect(x-13,y-14,5,2,'#fff5df44');rect(x+6,y-10,7,3,'#77678733');rect(x-4,y-5,10,2,'#77678733');
 for(let j=0;j<8;j++){const xx=(j*7)%23-12,yy=(j*11)%24-24;rect(x+xx,y+yy,2,2,j%3?'#fff1e955':'#f6da9c');}
 }
 function lamp(x,y,t){rect(x-5,y+3,11,3,'#557e8160');rect(x-1,y-16,3,21,'#66647e');rect(x-3,y+3,7,2,'#777286');rect(x-4,y-20,9,2,'#756582');rect(x-3,y-18,7,7,'#f1d397');rect(x-1,y-17,3,5,'#fff4c4');rect(x-4,y-11,9,2,'#746782');if(Math.floor(t*2)%2)rect(x+5,y-21,1,1,'#fff4c4');}
 function bench(x,y){rect(x-11,y+4,24,4,'#64817a66');rect(x-10,y-6,22,3,'#806c83');rect(x-10,y-2,22,3,'#b18b8f');rect(x-10,y+2,22,3,'#d3a99e');for(const xx of [-7,8])rect(x+xx,y+5,2,4,'#706277');rect(x-10,y-5,22,1,'#efc7ab');}
 function crystal(x,y,color,t){rect(x-9,y+6,18,3,'#6b6a8366');rect(x-7,y+1,14,5,'#afa2b5');rect(x-5,y-1,10,4,'#e5d1d2');const b=Math.floor(Math.sin(t*2)*2);for(const [w,yy] of [[2,-17],[6,-15],[10,-11],[6,-5],[2,-2]])rect(x-w/2,y+yy+b,w,4,color);rect(x-1,y-12+b,2,7,'#f7fff0');}
 function label(text,x,y,color='#fff4df'){ctx.font='7px monospace';ctx.textAlign='center';ctx.fillStyle='#2a344b';ctx.fillText(text,Math.round(x)+1,Math.round(y)+1);ctx.fillStyle=color;ctx.fillText(text,Math.round(x),Math.round(y));}
 function render(m,id,t){
 lastT=t;const w=Math.max(320,Math.round(canvas.clientWidth/2.5)),h=Math.max(160,Math.round(canvas.clientHeight/2.5));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.imageSmoothingEnabled=false;
 const me=m?.players.find(p=>p.id===id),follow=['battle','spectate'].includes(mode)&&m,scale=follow?8*zoom:Math.min(w/68,h/34),target=follow&&me?{x:me.x,z:me.z}:{x:0,z:0};
 center={x:target.x+panX,z:target.z+panZ};const point=(x,z)=>({x:Math.round(w/2+(x-center.x)*scale),y:Math.round(h/2+(z-center.z)*scale)});
 const world=(x,z,ww,hh,c)=>{const q=point(x,z);rect(q.x,q.y,ww*scale,hh*scale,c);};
 rect(0,0,w,h,'#789e99');
 // Tiled grass and a single paved lane. All positions stay on the pixel grid.
 const left=Math.floor((center.x-w/scale/2)/2)*2-2,right=Math.ceil(center.x+w/scale/2)+2,top=Math.floor((center.z-h/scale/2)/2)*2-2,bottom=Math.ceil(center.z+h/scale/2)+2;
 for(let x=left;x<=right;x+=2)for(let z=top;z<=bottom;z+=2){
 const q=point(x,z),seed=Math.abs(x*13+z*7);world(x,z,2.05,2.05,seed%5?'#a1bf9c':'#a9c7a0');
 if(terrain.complete&&terrain.naturalWidth)ctx.drawImage(terrain,(seed%2)*32,0,32,32,q.x,q.y,Math.ceil(2*scale),Math.ceil(2*scale));
 if(Math.abs(z)>6){rect(q.x+3,q.y+5,1,2,'#7caa87');rect(q.x+2,q.y+5,3,1,'#7caa87');if(seed%7===0){rect(q.x+8,q.y+2,2,2,'#f5ddb1');rect(q.x+9,q.y+1,1,4,'#fff1c5');}}}
 world(-31,-6,62,12,'#9d94a9');world(-30,-5.6,60,11.2,'#e2d3c6');
 for(let x=-30;x<30;x+=2)for(let z=-5;z<5;z+=2){const q=point(x,z),tile=(x+z)%4===0?2:3;world(x,z,1.96,1.96,tile===2?'#e2d3c6':'#e9ddce');if(terrain.complete&&terrain.naturalWidth)ctx.drawImage(terrain,tile*32,0,32,32,q.x,q.y,Math.ceil(1.96*scale),Math.ceil(1.96*scale));}
 for(const z of [-6.2,6]){world(-31,z,62,.35,'#8a809c');world(-31,z+.4,62,.25,'#fff0d3');for(let x=-30;x<30;x+=1){const q=point(x,z);rect(q.x,q.y,1,2,'#b7a6ba');}}
 // Pixel mosaics guide the eye toward the middle of the arena.
 for(const x of [-12,0,12]){const q=point(x,0);ctx.strokeStyle='#c7b7c3';ctx.lineWidth=1;ctx.strokeRect(q.x-13,q.y-13,26,26);ctx.strokeRect(q.x-9,q.y-9,18,18);rect(q.x-2,q.y-6,4,12,'#cebda8');rect(q.x-6,q.y-2,12,4,'#cebda8');}
 // Decorative academy garden; the combat lane stays clear.
 for(const x of [-20,-8,8,20]){const q=point(x,-12);bench(q.x,q.y);const l=point(x,7.5);lamp(l.x,l.y,t);}
 for(const x of [-16,16])for(const z of [-8,8]){const q=point(x,z);crystal(q.x,q.y,'#bde6e0',t);}
 for(const z of [-14,14]){world(-32,z,64,.7,'#827c95');world(-32,z+.7,64,.3,'#d9c6c8');for(let x=-30;x<=30;x+=6){const q=point(x,z);rect(q.x-3,q.y-13,6,15,'#bbadbe');rect(q.x-4,q.y-14,8,3,'#e6d3cf');rect(q.x-1,q.y-12,1,11,'#f1e0d9');}}
 // Academy walls, flowers, trees and recovery pads.
 for(let i=0;i<22;i++){const x=-29+(i%11)*5.8,z=i<11?-9:10;const q=point(x,z);tileTree(q.x,q.y,['#e6b6cf','#b5d5a6','#c7b7e3'][i%3]);}
 for(let x=-26;x<=26;x+=4)for(const z of [-7,7]){const q=point(x,z);rect(q.x,q.y,1,4,'#65977f');rect(q.x-2,q.y-2,5,3,'#ffe5a0');rect(q.x-1,q.y-3,3,5,'#edb6d2');rect(q.x,q.y-1,1,1,'#fff3d8');}
 for(const x of [-23,23]){world(x-2,-2,4,4,'#7aaf9f');world(x-1.8,-1.8,3.6,3.6,'#b8ecce');const q=point(x,0);rect(q.x-2,q.y-7,4,14,'#f6ffdc');rect(q.x-7,q.y-2,14,4,'#f6ffdc');}
 for(const [i,x] of [[0,-28],[1,28]]){const q=point(x,0),color=i?'#bfa0e9':'#8bd9c2';rect(q.x-15,q.y-17,30,34,'#686485');rect(q.x-12,q.y-14,24,28,'#d5c4dc');rect(q.x-9,q.y-10,18,22,color);rect(q.x-13,q.y-21,26,5,'#f3d49f');rect(q.x-10,q.y-26,20,5,color);rect(q.x-6,q.y-31,12,5,color);rect(q.x-2,q.y-35,4,5,'#fff5c4');for(let j=0;j<6;j++){const a=j/6*Math.PI*2+t*.8;rect(q.x+Math.cos(a)*19,q.y+Math.sin(a)*23,2,2,'#fff3b5');}if(m?.bases){rect(q.x-17,q.y-43,34,3,'#50516c');rect(q.x-17,q.y-43,34*m.bases[i]/2000,3,color);}label(i?'CĂN CỨ ĐỎ':'CĂN CỨ XANH',q.x,q.y+30);}
 const lobby=heroes.slice(0,8).map((h,i)=>({id:h.id,hero:h.id,x:(i%4-1.5)*5,z:(Math.floor(i/4)-.5)*5,team:i%2,slot:i,level:1,hp:h.hp,name:h.name}));
 const players=mode==='lobby'?lobby:(m?.players||lobby);
 for(const p of [...players].sort((a,b)=>a.z-b.z)){
 const q=point(p.x,p.z),hero=heroes.find(h=>h.id===p.hero),im=sprites.get(p.hero);if(p.dead){label('✦ '+Math.ceil(p.dead)+'s',q.x,q.y,'#fff0bd');continue;}
 const moving=Math.hypot(p.input?.x||0,p.input?.z||0)>.1,bob=moving?Math.floor(Math.sin(t*12+p.slot)*1.5):0;rect(q.x-7,q.y+5,14,3,'#527f8177');
 if(p.id===id){rect(q.x-10,q.y+7,20,2,'#fff5ad');rect(q.x-10,q.y+3,2,4,'#fff5ad');rect(q.x+8,q.y+3,2,4,'#fff5ad');}
 const old=history.get(p.id),moved=old&&Math.hypot(p.x-old.x,p.z-old.z)>.002;
 let damageSum=(old?.damageSum||0)+(old&&p.hp<old.hp?old.hp-p.hp:0),damageAt=old?.damageAt||0;
 if(damageSum>0&&t-damageAt>.3){floaters.push({x:p.x,z:p.z,text:'−'+Math.ceil(damageSum),at:t,color:'#ffd5ce'});damageSum=0;damageAt=t;}
 if(old&&p.hp>old.hp+5)floaters.push({x:p.x,z:p.z,text:'+'+Math.ceil(p.hp-old.hp),at:t,color:'#bdf2c2'});
 const walkUntil=moved?t+.3:old?.walkUntil||0,flipped=moved?p.x<old.x:old?.flipped||false;history.set(p.id,{x:p.x,z:p.z,hp:p.hp,walkUntil,flipped,damageSum,damageAt});
 const sheet=walkSheets.get(p.hero),walking=(moving||walkUntil>t)&&sheet?.complete&&sheet.naturalWidth,frame=walking?1+Math.floor(t*8)%2:0;
 if(im?.complete&&im.naturalWidth){ctx.save();ctx.translate(q.x,q.y);if(flipped)ctx.scale(-1,1);if(walking)ctx.drawImage(sheet,frame*32,0,32,48,-14,-34+bob,28,42);else ctx.drawImage(im,-14,-34+bob,28,42);ctx.restore();}else{rect(q.x-7,q.y-15,14,18,hero.color);rect(q.x-5,q.y-21,10,9,'#ffe2c5');}
 if(p.shield>0){rect(q.x-14,q.y-20,2,27,'#c4eeff');rect(q.x+12,q.y-20,2,27,'#c4eeff');rect(q.x-12,q.y-22,24,2,'#c4eeff');}
 if(m?.bases){rect(q.x-12,q.y-39,24,3,'#4c4565');rect(q.x-12,q.y-39,24*Math.max(0,p.hp/hero.hp),3,p.team===me?.team?'#a7f3bc':'#f5a8bf');label(p.name.slice(0,14),q.x,q.y-43,p.id===id?'#fff2a4':'#fff5df');label('Lv'+p.level,q.x,q.y+17);}
 }
 // Floating damage feedback persists briefly between network snapshots.
 for(let i=floaters.length-1;i>=0;i--){const f=floaters[i],age=t-f.at;if(age>.85){floaters.splice(i,1);continue;}const q=point(f.x,f.z);label(f.text,q.x,q.y-30-age*16,f.color);}
 for(const shot of m?.shots||[]){const from=point(shot.x,shot.z),to=point(shot.tx,shot.tz),progress=1-shot.life/.3,n=Math.max(3,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/5)),c=shot.kind===3?'#ffe295':shot.kind===1?'#d6b8ff':'#e1f9ff';for(let j=0;j<n;j++){const k=j/n;if(k>progress+.2)continue;rect(from.x+(to.x-from.x)*k,from.y+(to.y-from.y)*k-8,shot.kind===3?5:3,shot.kind===3?5:3,c);}rect(to.x-4,to.y-13,8,3,'#fff9cb');rect(to.x-1,to.y-16,3,9,c);}
 // Tiny drifting square sparkles instead of smooth particle effects.
 for(let i=0;i<12;i++){const x=(i*73+Math.floor(t*4))%w,y=(i*41+Math.floor(t*2))%h;rect(x,y,1,1,'#fff2c7');}
 }
 return {render,controls,setMode(v){mode=v;panX=panZ=0;history.clear();floaters.length=0;},destroy(){pointers.clear();}};
}
