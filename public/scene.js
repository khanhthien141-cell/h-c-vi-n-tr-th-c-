import * as T from './vendor/three.module.js';
import {GLTFLoader} from './vendor/gltf-loader.js';
import {customization} from './shared/customization.js';
import {heroes} from './shared/heroes.js';
import {cameraPose} from './shared/camera.js';
export function makeScene(canvas,cameraState){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});}catch{throw Error('Thiết bị chưa bật WebGL. Hãy bật tăng tốc đồ họa của trình duyệt.');}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.setClearColor('#9ba5cc',1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;
 const scene=new T.Scene();scene.fog=new T.FogExp2(customization.theme.sky||'#a8b8d3',.012);const camera=new T.PerspectiveCamera(48,1,.1,220);
 scene.add(new T.HemisphereLight('#c9e8ff','#aca0bb',2.7));const sun=new T.DirectionalLight('#ffe7bd',3.5);sun.position.set(-20,35,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-45,right:45,top:30,bottom:-30});scene.add(sun);
 const ambient=new T.PointLight('#a68cff',70,50);ambient.position.set(0,8,-4);scene.add(ambient);
 function mesh(geometry,color,x,y,z,cast=true){const m=new T.Mesh(geometry,new T.MeshStandardMaterial({color,roughness:.72,metalness:.1}));m.position.set(x,y,z);m.castShadow=cast;m.receiveShadow=true;scene.add(m);return m;}
 function box(w,h,d,c,x,y,z){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z);}
 function cylinder(rt,rb,h,c,x,y,z,n=8){return mesh(new T.CylinderGeometry(rt,rb,h,n),c,x,y,z);}
 const island=box(64,3,28,'#b1bdc2',0,-1.8,0);island.rotation.z=.015;
 box(62,.5,26,'#99c9b0',0,-.1,0);box(58,.25,11,'#e7dbda',0,.25,0);
 for(let x=-28;x<=28;x+=2)for(let z=-4;z<=4;z+=2){const b=box(1.93,.08,1.93,(x+z)%4?'#e4d7e1':'#f3e9e4',x,.41,z);b.rotation.y=(x%6===0)?.02:0;}
 for(const z of [-6,6]){box(59,.18,.25,'#d5c2a8',0,.45,z);for(let x=-25;x<=25;x+=5){cylinder(.22,.4,.8,'#b5a6ba',x,.5,z);const lamp=mesh(new T.SphereGeometry(.18,8,6),'#ffc986',x,1,z);lamp.material.emissive.set('#ffb45f');lamp.material.emissiveIntensity=1.8;}}
 const portals=[];
 for(const [i,x] of [[0,-28],[1,28]]){const c=i?'#bf89ff':'#71dece';box(6,1.2,8,'#c7bdd2',x,.5,0);for(const z of [-3,3]){cylinder(.7,.9,5,'#e5d3d6',x,3,z);cylinder(.95,.05,2.4,c,x,6.5,z);box(1.6,.25,1.6,'#d6bcac',x,5.4,z);}const arch=mesh(new T.TorusGeometry(2.9,.32,8,32,Math.PI),'#fff2db',x,3,0);arch.rotation.y=Math.PI/2;const portal=mesh(new T.CircleGeometry(2.55,48),c,x,2.7,0);portal.rotation.y=Math.PI/2;portal.material=new T.MeshBasicMaterial({color:c,transparent:true,opacity:.5,side:T.DoubleSide});portals.push(portal);const rune=mesh(new T.TorusGeometry(1.6,.06,8,32),c,x+(i?-.1:.1),2.7,0);rune.rotation.y=Math.PI/2;}
 const occluders=[];
 // Towers and pines flank the central lane; no collision obstacles in this prototype.
 for(let i=0;i<22;i++){const x=-28+(i%11)*5.5,z=(i<11?-1:1)*(9+Math.sin(i)*1.2);const treeColor=i%3===0?'#efbdd4':i%3===1?'#b4d8bf':'#cbbbe3';occluders.push(cylinder(.2,.3,2.2,'#b4969b',x,1,z),mesh(new T.SphereGeometry(1.55,12,10),treeColor,x,3.1,z),mesh(new T.SphereGeometry(1.1,12,10),treeColor,x-.85,2.8,z+.1),mesh(new T.SphereGeometry(1.05,12,10),treeColor,x+.85,2.95,z-.05));}
 for(let x of [-16,16])for(let z of [-8,8]){cylinder(.7,.8,.4,'#ded0d6',x,.7,z);const crystal=mesh(new T.OctahedronGeometry(.9),'#98fff0',x,2,z);crystal.scale.y=1.7;crystal.material.emissive.set('#3c8c85');}
 // Distant floating school towers.
 for(let i=0;i<12;i++){const x=(i-5.5)*9,z=-28-Math.sin(i)*5;box(3,4+i%3,3,'#c1b7d6',x,-.5,z);cylinder(0,2.6,3,'#c9a8d4',x,3+i%3/2,z,4);mesh(new T.OctahedronGeometry(5),'#b2bacd',x,-7,z).scale.set(1,.7,.8);}
 // Little flower beds and marshmallow clouds soften the school courtyard.
 for(let i=0;i<36;i++){const x=-26+(i%18)*3,z=i<18?-7.1:7.1,c=['#ffd3e3','#fff0b5','#dac6f3'][i%3];cylinder(.035,.035,.42,'#89b99b',x,.65,z,6);for(let j=0;j<5;j++){const a=j/5*Math.PI*2;mesh(new T.SphereGeometry(.13,7,5),c,x+Math.cos(a)*.17,.92,z+Math.sin(a)*.17);}mesh(new T.SphereGeometry(.1,7,5),'#f4ce82',x,.97,z);}
 for(let i=0;i<6;i++)for(let j=-1;j<=1;j++){const cloud=mesh(new T.SphereGeometry(2.2,12,8),'#fff2f3',(i-2.5)*16+j*2.2,12+Math.sin(i)*2,-35-i%2*7,false);cloud.scale.set(1.3,.5,1);}
 const points=[];for(let i=0;i<100;i++)points.push((Math.random()-.5)*90,Math.random()*14+1,(Math.random()-.5)*55);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(points,3));const dust=new T.Points(geo,new T.PointsMaterial({color:'#ffdf9b',size:.11,transparent:true,opacity:.7}));scene.add(dust);
 const modelLoader=new GLTFLoader();let lastAnimationTime=0;
 const actors=new Map(),effects=new T.Group();scene.add(effects);let mode='lobby',focus=null,theme=-1;
 function character(p){
 const h=heroes.find(h=>h.id===p.hero)||heroes[0],g=new T.Group(),bodyMat=new T.MeshStandardMaterial({color:h.color,roughness:.9});
 const skin=new T.MeshStandardMaterial({color:'#ffe7d5',roughness:1}),dark=new T.MeshStandardMaterial({color:'#594966',roughness:1}),white=new T.MeshStandardMaterial({color:'#fff9ed',roughness:1}),pink=new T.MeshStandardMaterial({color:'#f6a8bd',roughness:1});
 function part(geo,mat,x,y,z,sx=1,sy=1,sz=1){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;g.add(m);return m;}
 const ball=new T.SphereGeometry(1,16,12);
 part(ball,bodyMat,0,.93,0,.56,.64,.44);part(ball,skin,0,1.92,0,.72,.69,.63);
 part(new T.SphereGeometry(.735,16,12,0,Math.PI*2,0,Math.PI*.49),dark,0,2.07,-.02,1,.92,1);
 part(new T.ConeGeometry(.53,.78,20),bodyMat,0,2.94,0);part(new T.CylinderGeometry(.82,.82,.11,24),bodyMat,0,2.55,0);
 for(const x of [-.32,.32]){part(new T.ConeGeometry(.15,.32,12),bodyMat,x,3.13,.02);part(ball,pink,x,3.14,.12,.065,.105,.035);}
 for(const x of [-.245,.245]){part(ball,dark,x,1.99,.581,.085,.12,.055);part(ball,white,x-.025,2.035,.626,.027,.036,.015);part(ball,pink,x*1.65,1.79,.54,.125,.065,.035);part(ball,dark,x,.28,.1,.21,.16,.28);part(ball,bodyMat,x*2.45,1.03,.03,.18,.28,.22);part(ball,skin,x*2.5,.86,.1,.16,.15,.17);}
 const smile=part(new T.TorusGeometry(.09,.016,6,16,Math.PI),dark,0,1.78,.627);smile.rotation.z=Math.PI;
 part(ball,white,0,1.3,.39,.2,.13,.05);part(new T.ConeGeometry(.08,.28,4),pink,0,1.09,.43);
 part(new T.CylinderGeometry(.045,.045,1.8,10),white,.79,1.15,.1);
 const gem=part(new T.OctahedronGeometry(.23),bodyMat,.79,2.17,.1);gem.material=bodyMat.clone();gem.material.emissive.set(h.color);gem.material.emissiveIntensity=.35;
 const ring=part(new T.TorusGeometry(.82,.045,8,36),new T.MeshBasicMaterial({color:p.team%2?'#dbb7ff':'#b0e9ce'}),0,.1,0);ring.rotation.x=Math.PI/2;
 const bar=part(new T.PlaneGeometry(1.3,.1),new T.MeshBasicMaterial({color:'#91d9b0',side:T.DoubleSide}),0,3.65,0);
 g.userData={h,bar,gem};if(h.model)modelLoader.load(new URL(h.model,location.href).href,data=>{const model=data.scene,box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),factor=3.3/Math.max(.1,size.y)*(h.modelScale||1);model.scale.setScalar(factor);model.position.y=-box.min.y*factor;model.rotation.y=(h.modelRotation||0)*Math.PI/180;for(const child of g.children)if(child!==bar&&child!==ring)child.visible=false;g.add(model);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});if(data.animations.length){const mixer=new T.AnimationMixer(model);mixer.clipAction(data.animations[0]).play();g.userData.mixer=mixer;}},undefined,error=>console.warn('Không tải được model, dùng nhân vật mặc định.',error.message));scene.add(g);actors.set(p.id,g);return g;}
 let previousW=0,previousH=0;function resize(){const w=canvas.clientWidth,h=canvas.clientHeight;if(w&&h&&(w!==previousW||h!==previousH)){previousW=w;previousH=h;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}}new ResizeObserver(resize).observe(canvas);
 const v=new T.Vector3(),look=new T.Vector3();
 function render(m,id,t){const animationDelta=Math.min(.1,Math.max(0,t-lastAnimationTime));lastAnimationTime=t;resize();dust.rotation.y=t*.015;const desired=new Set(m?.players?.map(p=>p.id)||[]);for(const [key,a]of actors)if(!desired.has(key)){scene.remove(a);actors.delete(key);}if(m){if(theme!==m.round&&m.round!==undefined){theme=m.round;scene.fog.color.set(['#a8b8d3','#c5b0d4','#b0d4cc'][theme%3]);renderer.setClearColor(scene.fog.color);}
 for(const p of m.players){const a=actors.get(p.id)||character(p);a.visible=!p.dead;a.position.lerp(new T.Vector3(p.x,0,p.z),.3);a.position.y=Math.sin(t*3+p.slot)*.065;a.rotation.y=Number.isFinite(p.facing)?p.facing:m.pair?.indexOf(p.team)===1?-Math.PI/2:Math.PI/2;a.userData.bar.scale.x=Math.max(.01,p.hp/a.userData.h.hp);a.userData.bar.quaternion.copy(camera.quaternion);a.userData.gem.rotation.y=t;a.userData.mixer?.update(animationDelta);}
 for(const e of [...effects.children]){e.geometry.dispose();e.material.dispose();effects.remove(e);}for(const s of m.shots||[]){const pts=[new T.Vector3(s.x,1.5,s.z),new T.Vector3(s.tx,1.4,s.tz)];const line=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:s.kind===3?'#ffe3a0':s.team%2?'#cb9aff':'#80efdd',transparent:true,opacity:Math.min(1,s.life*4)}));effects.add(line);}
 focus=m.players.find(p=>p.id===id)||m.players[0];}
 if(mode==='battle'&&focus){const pose=cameraPose(cameraState,focus);v.set(...pose.position);look.set(...pose.target);}else if(mode==='spectate'){v.set(3,36,32);look.set(0,0,0);}else{v.set(30,29,34);look.set(0,0,0);}camera.position.lerp(v,.045);camera.lookAt(look);for(const tree of occluders){let faded=false;if(mode==='battle'&&focus){const vx=focus.x-camera.position.x,vz=focus.z-camera.position.z,along=((tree.position.x-camera.position.x)*vx+(tree.position.z-camera.position.z)*vz)/(vx*vx+vz*vz),distance=Math.hypot(tree.position.x-(camera.position.x+along*vx),tree.position.z-(camera.position.z+along*vz));faded=along>-.1&&along<1&&distance<3.4;}tree.material.transparent=faded;tree.material.opacity=faded?.15:1;tree.material.depthWrite=!faded;}renderer.render(scene,camera);}
 return{render,setMode(v){mode=v;},destroy(){renderer.dispose();}};
}
