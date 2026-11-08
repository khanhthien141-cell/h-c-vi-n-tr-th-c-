import {heroes} from './heroes.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function queue(p,reason){p.quizTriggers??=[];reason==='death'?p.quizTriggers.unshift({reason}):p.quizTriggers.push({reason,level:p.level});}
function defeated(p){p.hp=0;p.dead=10;p.shield=0;queue(p,'death');}
export function spawn(p,side){Object.assign(p,{x:side===0?-20:20,z:(p.slot-2)*2,hp:heroes.find(h=>h.id===p.hero).hp,dead:0,cd:[0,0,0,0],shield:p.shield||0,ultimate:!!p.ultimate});}
export function createMatch(players,pair,duration=420){const m={pair,duration,time:0,players:players.filter(p=>pair.includes(p.team)).map(p=>({...p,slot:p.slot??0,kills:0,knowledge:0,wallet:0,correct:0,level:1,quizTriggers:[],quizUsed:[],quizSequence:0,quiz:null,shield:0,ultimate:false,input:{},answered:{},items:[],online:true})),bases:[2000,2000],shots:[],events:[],done:false};m.players.forEach(p=>spawn(p,pair.indexOf(p.team)));return m;}
export function attack(m,p,k){if(p.dead||m.done||p.cd[k]>0||(k===3&&!p.ultimate))return false;const h=heroes.find(h=>h.id===p.hero),side=m.pair.indexOf(p.team);p.cd[k]=[.65,5,9,18][k];if(k===3)p.ultimate=false;
 if(k===3&&h.role==='Hỗ trợ'){for(const q of m.players.filter(q=>q.team===p.team&&!q.dead&&Math.hypot(q.x-p.x,q.z-p.z)<18)){q.hp=Math.min(heroes.find(h=>h.id===q.hero).hp,q.hp+60);q.shield+=35;}m.events.push({type:'heal',x:p.x,z:p.z,team:p.team});return true;}
 if(k===2){if(h.role==='Hỗ trợ'){m.players.filter(q=>q.team===p.team&&!q.dead&&Math.hypot(q.x-p.x,q.z-p.z)<12).forEach(q=>q.hp=Math.min(heroes.find(a=>a.id===q.hero).hp,q.hp+40));}else if(h.role==='Đấu sĩ'){p.shield=50;}else{p.x=clamp(p.x+(side===0?7:-7),-27,27);}m.events.push({type:'heal',x:p.x,z:p.z,team:p.team});return true;}
 const range=k===3?18:k===1?13: h.role==='Xạ thủ'||h.role==='Pháp sư'?10:5;
 const enemies=m.players.filter(q=>q.team!==p.team&&!q.dead&&Math.hypot(q.x-p.x,q.z-p.z)<=range).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z));
 const damage=h.damage*(k===3?3.4:k===1?1.8:1)*(1+(p.level-1)*.06)+(p.items.includes('power')?5:0);const targets=k===3?enemies:enemies.slice(0,1);
 for(const q of targets){const absorbed=Math.min(q.shield,damage);q.shield-=absorbed;q.hp-=damage-absorbed;m.shots.push({x:p.x,z:p.z,tx:q.x,tz:q.z,hero:p.hero,team:p.team,life:.3,kind:k});if(q.hp<=0){defeated(q);p.kills++;if(p.level<10){p.level++;queue(p,'levelup');}m.events.push({type:'kill',name:p.name,target:q.name});}}
 const enemy=1-side,bx=enemy===0?-27:27;if(!targets.length&&Math.hypot(bx-p.x,p.z)<=range){m.bases[enemy]=Math.max(0,m.bases[enemy]-damage);m.shots.push({x:p.x,z:p.z,tx:bx,tz:0,hero:p.hero,team:p.team,life:.3,kind:k});}return true;
}
export function step(m,dt){if(m.done)return;m.time+=dt;m.events=[];m.shots=m.shots.filter(s=>(s.life-=dt)>0);for(const p of m.players){const h=heroes.find(a=>a.id===p.hero),side=m.pair.indexOf(p.team);p.cd=p.cd.map(c=>Math.max(0,c-dt));if(p.dead){p.dead-=dt;if(p.dead<=0)spawn(p,side);continue;}let x=Number(p.input.x)||0,z=Number(p.input.z)||0;const len=Math.max(1,Math.hypot(x,z));if(x||z)p.facing=Math.atan2(x,z);p.x=clamp(p.x+x/len*h.speed*dt,-27,27);p.z=clamp(p.z+z/len*h.speed*dt,-10,10);if(Math.abs(p.x-(side===0?-20:20))<3)p.hp=Math.min(h.hp,p.hp+12*dt);
 const enemyBase=side===0?27:-27;if(Math.hypot(p.x-enemyBase,p.z)<8){p.hp-=10*dt;if(p.hp<=0)defeated(p);}
 for(let k=0;k<4;k++)if(p.input['a'+k])attack(m,p,k);
 }if(m.time>=m.duration||m.bases.some(h=>h<=0))m.done=true;}
export function botInput(m,p){
 if(p.dead)return{};const side=m.pair.indexOf(p.team),h=heroes.find(h=>h.id===p.hero),near=m.players.filter(q=>q.team!==p.team&&!q.dead).sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
 const target=near||{x:side===0?27:-27,z:0},range=h.role==='Đấu sĩ'?3.5:7.5,dx=target.x-p.x,dz=target.z-p.z,d=Math.hypot(dx,dz);let x=d>range?dx/Math.max(1,d):0,z=d>range?dz/Math.max(1,d):0;
 for(const q of m.players){if(q.id===p.id||q.dead)continue;const ax=p.x-q.x,az=p.z-q.z,dist=Math.hypot(ax,az);if(dist<2.8){x+=ax/Math.max(.2,dist)*.55;z+=az/Math.max(.2,dist)*.55;}}
 return{x,z,a0:true,a1:true,a2:p.hp<65,a3:true};
}
export function award(m,p,index,answer,correct,elapsed){if(p.answered[index]!==undefined)return null;p.answered[index]=answer;const ok=answer===correct,points=ok?Math.round(100+clamp(10-elapsed,0,10)*5):0;if(ok){p.knowledge+=points;p.wallet=(p.wallet||0)+points;p.correct++;p.ultimate=true;const r=Math.random();if(r<.34){if(p.dead)p.shield+=25;else p.hp=Math.min(heroes.find(h=>h.id===p.hero).hp,p.hp+35);}else if(r<.67)p.shield+=25;else p.cd=p.cd.map(c=>c*.4);}return{ok,isCorrect:ok,correctAnswer:correct,selectedAnswer:answer,correct,points};}
export function scores(m){return m.pair.map((team,i)=>{const ps=m.players.filter(p=>p.team===team),knowledge=ps.reduce((s,p)=>s+p.knowledge,0),kills=ps.reduce((s,p)=>s+p.kills,0),combat=Math.min(100,(2000-m.bases[1-i])/2000*70+kills*3),learning=Math.min(100,knowledge/(Math.max(1,ps.length)*1500)*100);return{team,knowledge,kills,combat,learning,total:combat*.5+learning*.5,correct:ps.reduce((s,p)=>s+p.correct,0)};});}
export function result(m){const ranking=scores(m).sort((a,b)=>b.total-a.total||b.knowledge-a.knowledge);return{scores:ranking,winner:ranking[0].total===ranking[1].total&&ranking[0].knowledge===ranking[1].knowledge?null:ranking[0].team,mvp:[...m.players].sort((a,b)=>(b.knowledge+b.kills*100)-(a.knowledge+a.kills*100))[0]?.name};}
