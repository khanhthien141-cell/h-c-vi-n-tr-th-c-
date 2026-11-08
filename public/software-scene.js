// Perspective software renderer for browsers without WebGL (remote desktops, older phones).
// All vertices use the same 3D camera and depth sorting; no external assets required.
import {heroes} from './shared/heroes.js';
import {cameraPose} from './shared/camera.js';
export function makeSoftwareScene(original,cameraState){
 const canvas=original.cloneNode();original.replaceWith(canvas);const ctx=canvas.getContext('2d');if(!ctx)throw Error('Không tạo được bộ dựng hình.');let mode='lobby',cam=[32,29,34],look=[0,0,0],w=0,h=0,basis;const faces=[];
 function shade(hex,k){const c=parseInt(hex.slice(1),16);return `rgb(${Math.min(255,(c>>16)*k)},${Math.min(255,((c>>8)&255)*k)},${Math.min(255,(c&255)*k)})`;}
 function poly(v,c){faces.push({v,c});}
 function box(x,y,z,a,b,d,c){const X=x-a/2,Y=y-b/2,Z=z-d/2,A=x+a/2,B=y+b/2,D=z+d/2;poly([[X,B,Z],[A,B,Z],[A,B,D],[X,B,D]],shade(c,1.16));poly([[X,Y,Z],[A,Y,Z],[A,B,Z],[X,B,Z]],shade(c,.72));poly([[X,Y,D],[A,Y,D],[A,B,D],[X,B,D]],shade(c,.9));poly([[X,Y,Z],[X,Y,D],[X,B,D],[X,B,Z]],shade(c,.82));poly([[A,Y,Z],[A,Y,D],[A,B,D],[A,B,Z]],shade(c,.65));}
 function cone(x,y,z,r,height,c,n=6){for(let i=0;i<n;i++){const a=i/n*Math.PI*2,b=(i+1)/n*Math.PI*2;poly([[x+Math.cos(a)*r,y,z+Math.sin(a)*r],[x+Math.cos(b)*r,y,z+Math.sin(b)*r],[x,y+height,z]],shade(c,.75+Math.sin(a)*.18));}}
 function sphere(x,y,z,r,c){faces.push({sphere:[x,y,z,r],c});}
 function line(a,b,c,width=2){faces.push({line:[a,b],c,width});}
 const norm=a=>{const l=Math.hypot(...a);return a.map(v=>v/l);},cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
 function project(v){const d=v.map((p,i)=>p-cam[i]),z=dot(d,basis.f),f=h*1.15;return{x:w/2+dot(d,basis.r)/z*f,y:h/2-dot(d,basis.u)/z*f,z,scale:f/z};}
 function drawCharacter(point,player,color,t){
 const scale=Math.min(point.scale,150),x=point.x,y=point.y-Math.sin(t*3+player.slot)*scale*.055;
 if(scale<1)return;ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=1;
 function oval(x,y,rx,ry,c){ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
 oval(0,.02,.77,.14,'#7f9eaa55');oval(-.24,-.2,.2,.15,'#7e6a87');oval(.24,-.2,.2,.15,'#7e6a87');oval(0,-.9,.56,.63,color);
 oval(-.59,-1.02,.17,.26,color);oval(.59,-1.02,.17,.26,color);oval(-.61,-.81,.14,.13,'#ffe6d6');oval(.61,-.81,.14,.13,'#ffe6d6');
 oval(0,-1.95,.73,.69,'#ffe7d5');ctx.fillStyle='#77627d';ctx.beginPath();ctx.ellipse(0,-2.12,.74,.58,0,Math.PI,Math.PI*2);ctx.fill();
 for(const s of [-1,1]){oval(s*.24,-1.99,.085,.115,'#53435e');oval(s*.24-.025,-2.03,.027,.035,'#fffaf1');oval(s*.43,-1.78,.12,.06,'#f2a7bb');}
 ctx.strokeStyle='#a7798c';ctx.lineWidth=.025;ctx.beginPath();ctx.arc(0,-1.8,.09,0,Math.PI);ctx.stroke();
 ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(-.56,-2.55);ctx.quadraticCurveTo(-.24,-3.18,.04,-3.36);ctx.quadraticCurveTo(.1,-3.03,.58,-2.55);ctx.closePath();ctx.fill();oval(0,-2.55,.83,.13,color);
 for(const s of [-1,1]){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(s*.28-.13,-3);ctx.lineTo(s*.28,-3.35);ctx.lineTo(s*.28+.13,-3);ctx.fill();oval(s*.28,-3.1,.035,.07,'#f4b2c8');}
 ctx.fillStyle='#fff4cf';ctx.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?.065:.14;const xx=Math.cos(a)*r,yy=-2.87+Math.sin(a)*r;j?ctx.lineTo(xx,yy):ctx.moveTo(xx,yy);}ctx.closePath();ctx.fill();
 oval(0,-1.28,.19,.11,'#fff9ed');oval(0,-1.07,.07,.13,'#edaac2');ctx.strokeStyle='#fff7e8';ctx.lineWidth=.075;ctx.beginPath();ctx.moveTo(.8,-.18);ctx.lineTo(.8,-2.1);ctx.stroke();oval(.8,-2.17,.18,.18,color);oval(.75,-2.23,.05,.05,'#fffaf0');
 const hero=heroes.find(h=>h.id===player.hero);ctx.strokeStyle='#b6aaba';ctx.lineWidth=.07;ctx.beginPath();ctx.moveTo(-.65,-3.65);ctx.lineTo(.65,-3.65);ctx.stroke();ctx.strokeStyle=player.team%2?'#cba5ed':'#8bcba5';ctx.beginPath();ctx.moveTo(-.65,-3.65);ctx.lineTo(-.65+1.3*Math.max(0,player.hp/hero.hp),-3.65);ctx.stroke();ctx.restore();
 }
 function render(m,id,t){const cw=canvas.clientWidth,ch=canvas.clientHeight;if(cw!==w||ch!==h){w=cw;h=ch;canvas.width=w*Math.min(devicePixelRatio,1.5);canvas.height=h*Math.min(devicePixelRatio,1.5);}ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);const bg=ctx.createLinearGradient(0,0,w,h);bg.addColorStop(0,'#adb8d8');bg.addColorStop(.5,'#ccd0e4');bg.addColorStop(1,'#b4d6d6');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 const p=m?.players?.find(p=>p.id===id)||m?.players?.[0],side=m?.pair?.indexOf(p?.team)===1?-1:1;const pose=p?cameraPose(cameraState,p):null,target=mode==='battle'&&p?pose.position:mode==='spectate'?[3,36,32]:[32,29,34],aim=mode==='battle'&&p?pose.target:[0,0,0];cam=cam.map((v,i)=>v+(target[i]-v)*.07);look=look.map((v,i)=>v+(aim[i]-v)*.1);const f=norm(look.map((v,i)=>v-cam[i])),r=norm(cross(f,[0,1,0])),u=cross(r,f);basis={f,r,u};faces.length=0;
 // Distant academy spires on floating rocks.
 for(let i=0;i<10;i++){const x=(i-4.5)*10,z=-30-i%3*3;cone(x,-11,z,5,6,'#bbc5d5',5);box(x,-2,z,3,5+i%3,3,'#bfb8d5');cone(x,1+i%3/2,z,2.5,4,'#c5a9d3',4);}
 box(0,-2,0,64,3,28,'#b8bfca');box(0,-.25,0,63,.5,27,'#a8d2b9');box(0,.15,0,59,.3,12,'#dbd3da');
 for(let x=-28;x<=28;x+=2)for(let z=-4;z<=4;z+=2)poly([[x-1,.33,z-1],[x+1,.33,z-1],[x+1,.33,z+1],[x-1,.33,z+1]],(x+z)%4?'#e2d6e4':'#f4e8e5');
 for(const z of [-6,6]){box(0,.4,z,60,.2,.3,'#c4b6a8');for(let x=-25;x<=25;x+=5){box(x,.65,z,.4,.7,.4,'#b6a4b6');sphere(x,1.13,z,.16,'#ffe0a2');}}
 for(const [i,x] of [[0,-28],[1,28]]){const col=i?'#ceb0ee':'#a4ddc4';box(x,.6,0,6,1.2,8,'#cbbfd7');for(const z of [-3,3]){box(x,3,z,1.2,5,1.2,'#e6d4dc');cone(x,5.5,z,1.2,2.7,col);box(x,5.3,z,1.6,.35,1.6,'#d8c6b6');}box(x,5.35,0,1,1,5,'#dec6df');for(let j=0;j<8;j++){const a=j/8*Math.PI*2+t*.2;sphere(x,2.8+Math.cos(a)*1.9,Math.sin(a)*2,.17,col);}for(let j=-1;j<=1;j++)box(x,2.7,j*.65,.1,3.2-Math.abs(j)*.5,.6,col);}
 for(let i=0;i<22;i++){const x=-28+i%11*5.5,z=(i<11?-1:1)*(9+Math.sin(i)*1.2);if(mode==='battle'&&p){const vx=p.x-cam[0],vz=p.z-cam[2],along=((x-cam[0])*vx+(z-cam[2])*vz)/(vx*vx+vz*vz),near=Math.hypot(x-(cam[0]+along*vx),z-(cam[2]+along*vz));if(along>-.1&&along<1&&near<3.4)continue;}const color=['#e9bdd1','#b6d9bb','#c8bbe3'][i%3];box(x,1,z,.34,2,.34,'#bd9ba5');sphere(x,3,z,1.55,color);sphere(x-.9,2.7,z+.12,1.05,color);sphere(x+.85,2.8,z-.1,1,color);}
 for(let x of [-16,16])for(let z of [-8,8]){box(x,.7,z,1.4,.5,1.4,'#ded1dc');cone(x,1,z,.7,2,'#97e8dd',4);}
 for(let i=0;i<32;i++){const x=-25+(i%16)*3.25,z=i<16?-7.15:7.15,c=['#ffbfd9','#fff0ae','#d6bdf2'][i%3];line([x,.4,z],[x,.82,z],'#8bb99a',2);for(let j=0;j<5;j++){const angle=j/5*Math.PI*2;sphere(x+Math.cos(angle)*.15,.88,z+Math.sin(angle)*.15,.11,c);}sphere(x,.93,z,.09,'#f2cb7e');}
 for(let i=0;i<5;i++)for(let j=-1;j<=1;j++)sphere((i-2)*19+j*2.2,13+Math.sin(i)*2,-40-i%2*5,2.2,'#fff0f4');
 for(const a of m?.players||[]){if(!a.dead)faces.push({character:a,c:heroes.find(h=>h.id===a.hero)?.color||'#c3a5eb'});}
 for(const shot of m?.shots||[])line([shot.x,1.5,shot.z],[shot.tx,1.5,shot.tz],shot.kind===3?'#ffe29c':shot.team%2?'#d7a7ff':'#a2ffe3',shot.kind===3?5:2);
 // Project then sort every polygon back to front.
 const draw=[];for(const a of faces){if(a.v){const pts=a.v.map(project);if(pts.some(p=>p.z<=.5))continue;draw.push({...a,pts,depth:pts.reduce((s,p)=>s+p.z,0)/pts.length});}else if(a.sphere){const p=project(a.sphere.slice(0,3));if(p.z>.5)draw.push({...a,p,depth:p.z});}else if(a.character){const p=project([a.character.x,0,a.character.z]);if(p.z>.5)draw.push({...a,p,depth:p.z});}else{const pts=a.line.map(project);if(pts.every(p=>p.z>.5))draw.push({...a,pts,depth:(pts[0].z+pts[1].z)/2});}}
 draw.sort((a,b)=>b.depth-a.depth);for(const a of draw){ctx.globalAlpha=Math.max(.32,1-(a.depth-55)*.008);ctx.fillStyle=a.c;ctx.strokeStyle=a.c;if(a.v){ctx.beginPath();a.pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fill();}else if(a.character){continue;}else if(a.sphere){const radius=Math.abs(a.p.scale*a.sphere[3]);if(radius>300)continue;const g=ctx.createRadialGradient(a.p.x-radius*.3,a.p.y-radius*.4,0,a.p.x,a.p.y,radius);g.addColorStop(0,a.c);g.addColorStop(1,shade(a.c,.83));ctx.fillStyle=g;ctx.beginPath();ctx.arc(a.p.x,a.p.y,radius,0,Math.PI*2);ctx.fill();}else{ctx.lineWidth=a.width;ctx.beginPath();ctx.moveTo(a.pts[0].x,a.pts[0].y);ctx.lineTo(a.pts[1].x,a.pts[1].y);ctx.stroke();}}ctx.globalAlpha=1;for(const a of draw)if(a.character)drawCharacter(a.p,a.character,a.c,t);
 for(let i=0;i<38;i++){const x=(Math.sin(i*82.7)*.5+.5)*w,y=((Math.cos(i*37.4)*.5+.5)*h+t*4)%h;ctx.fillStyle='#f0d79a55';ctx.fillRect(x,y,1.6,1.6);}
 }
 return{render,setMode(v){mode=v;},destroy(){}};
}
