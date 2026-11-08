import {prepareSelection,selectionReady,lockHero,advanceSelection} from './selection.js';
import {customization} from './customization.js';
import {saveRoster,rosterSlot} from './roster.js';
import {heroes,teams} from './heroes.js';
import {questions} from './questions.js';
import {createMatch,step,botInput,result,clamp} from './engine.js';
import {pumpQuizzes,answerQuiz,publicQuiz} from './quizzes.js';
export const id=()=>crypto.randomUUID().replaceAll('-','');
export const cleanName=v=>String(v||'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24);
export function newRoom(code,owner,title){return{code,owner,title:String(title||'Giải đấu Học viện').slice(0,80),teams:[...teams],emblems:['phoenix','cat','deer','dragon'].sort(()=>Math.random()-.5),players:[],phase:'lobby',paused:false,round:0,seed:[0,1,2,3],pair:[0,3],results:[],history:[],rank:[],used:[],questionIds:[],match:null,uiVersion:1,lastWall:Date.now(),chats:[],roster:[],settings:{semiSeconds:customization.match.semiSeconds,finalSeconds:customization.match.finalSeconds}};}
export function publicRoom(r){const {code,title,teams,players,phase,paused,round,pair,results,seed,rank,history,selectionEnds,questionIds,uiVersion,roster,settings,emblems}=r;return{emblems,code,title,teams,players,phase,paused,round,pair,results,seed,rank,history,selectionEnds,questionIds,uiVersion,roster,settings};}
export function publicPlayer({answered,input,quiz,quizUsed,quizTriggers,quizSequence,inputAt,...p}){return p;}
export function safeMatch(m){return m?{...m,players:m.players.map(publicPlayer)}:null;}
export const bankFor=r=>[...questions,...(r.bank||[])];
export function joinRoom(r,u,d){
 if(r.owner!==u.id&&!d.spectator){let p=r.players.find(p=>p.id===u.id);if(!p){if(r.phase!=='lobby')throw Error('Trận đã bắt đầu. Có thể chọn chỉ xem.');const slot=rosterSlot(r,u.id,d.rosterId),team=slot?slot.team:Number(d.team);if(!Number.isInteger(team)||team<0||team>3)throw Error('Chọn đội hợp lệ.');const ps=r.players.filter(p=>p.team===team);if(ps.length>=5)throw Error('Đội đã đủ 5 người.');if(r.players.some(p=>p.name.toLocaleLowerCase()===u.name.toLocaleLowerCase()))throw Error('Biệt danh đã có trong phòng; thêm số hoặc ký tự để phân biệt.');p={id:u.id,name:u.name,team,hero:null,heroReady:false,slot:ps.length,approved:false,rosterId:slot?.id||null,rosterName:slot?.name||null};r.players.push(p);r.uiVersion++;}}
 return r;
}
export function finishRoom(r){if(!r.match||!['battle'].includes(r.phase))return;const m=r.match;m.done=true;r.results.push({...result(m),pair:m.pair,players:m.players.map(publicPlayer),at:new Date().toISOString()});r.phase=r.round===2?'finished':'result';r.paused=false;r.uiVersion++;}
export function commandRoom(r,u,d){if(r.owner!==u.id)throw Error('Chỉ máy chủ của phòng này được điều khiển.');
 const action=d.action;
 if(action==='roster'){saveRoster(r,d.rows);}
 else if(action==='settings'){if(r.phase!=='lobby')throw Error('Chỉ chỉnh trước giải.');const semi=Number(d.semiSeconds),final=Number(d.finalSeconds);if(!Number.isInteger(semi)||!Number.isInteger(final)||semi<60||semi>1800||final<60||final>1800)throw Error('Thời gian từ 60–1800 giây.');r.settings={semiSeconds:semi,finalSeconds:final};}
 else if(action==='approve'){const p=r.players.find(p=>p.id===d.id);if(p)p.approved=true;}
 else if(action==='bots'){if(r.phase!=='lobby')throw Error('Chỉ thêm máy trước giải.');for(let team=0;team<4;team++)while(r.players.filter(p=>p.team===team).length<5){const ps=r.players.filter(p=>p.team===team);r.players.push({id:id(),name:'Máy '+(team+1)+'-'+(ps.length+1),team,hero:heroes.find(h=>!ps.some(p=>p.hero===h.id)).id,slot:ps.length,approved:true,bot:true});}}
 else if(action==='setup'){if(r.phase!=='lobby')throw Error('Giải đã khóa đội.');if(Array.isArray(d.teams)&&d.teams.length===4)r.teams=d.teams.map(t=>cleanName(t)||'Đội');if(Array.isArray(d.seed)&&d.seed.length===4&&new Set(d.seed).size===4&&d.seed.every(n=>Number.isInteger(n)&&n>=0&&n<4))r.seed=d.seed;else if(d.seed)throw Error('Thứ hạng không hợp lệ.');}
 else if(action==='start'){if(!['lobby','result'].includes(r.phase))throw Error('Chưa thể bắt đầu vòng.');const round=r.phase==='result'?r.round+1:r.round;if(r.phase==='result'&&r.results.at(-1)?.winner===null)throw Error('Hãy chỉnh điểm để phân định trận hòa.');if(round>2)throw Error('Giải đã kết thúc.');const pair=round===0?[r.seed[0],r.seed[3]]:round===1?[r.seed[1],r.seed[2]]:[r.results[0].winner,r.results[1].winner];if(pair.some(team=>r.players.filter(p=>p.team===team&&p.approved).length!==5))throw Error('Mỗi đội cần đủ 5 người đã được duyệt. Có thể điền người máy để thử.');const pool=bankFor(r).filter(q=>q.round===round&&!r.used.includes(q.id)),chosen=d.questionIds?.length?pool.filter(q=>d.questionIds.includes(q.id)):pool;if(!chosen.length)throw Error('Cần câu hỏi cho vòng này.');r.round=round;r.pair=pair;r.questionIds=chosen.map(q=>q.id);r.used.push(...r.questionIds);r.phase='select';prepareSelection(r);r.match=null;}
 else if(action==='launch'){if(r.phase!=='ready'||!selectionReady(r))throw Error('Chờ hai đội chọn đủ tướng.');r.phase='battle';r.paused=false;r.match=createMatch(r.players,r.pair,r.round===2?(r.settings?.finalSeconds||720):(r.settings?.semiSeconds||420));r.lastWall=Date.now();}
 else if(action==='pause'){if(r.phase!=='battle')throw Error('Chỉ tạm dừng khi đang đấu.');r.paused=!r.paused;r.lastWall=Date.now();}
 else if(action==='finish'){if(r.phase!=='battle')throw Error('Chưa có trận đấu.');finishRoom(r);}
 else if(action==='adjust'){const p=r.match?.players.find(p=>p.id===d.id),delta=Number(d.delta),reason=String(d.reason||'').trim().slice(0,200);if(!p||!Number.isFinite(delta)||Math.abs(delta)>1000||!reason)throw Error('Chọn người chơi, nhập điểm ±1000 và lý do.');p.knowledge=Math.max(0,p.knowledge+delta);r.history.push({at:new Date().toISOString(),by:u.name,student:p.name,delta,reason});if(['result','finished'].includes(r.phase))Object.assign(r.results.at(-1),result(r.match),{players:r.match.players.map(publicPlayer)});}
 else if(action==='replay'){if(!['lobby','result','finished'].includes(r.phase))throw Error('Hãy kết thúc trận trước.');r.archives??=[];r.archives.push({at:new Date().toISOString(),teams:[...r.teams],results:r.results,history:r.history});r.results=[];r.history=[];r.round=0;r.used=[];r.phase='lobby';r.match=null;r.questionIds=[];for(const p of r.players){p.hero=null;p.heroReady=false;}r.selectionEnds=null;}
 else throw Error('Thao tác không hợp lệ.');
 r.uiVersion++;return r;
}
export function tickRoom(r,inputs=[],now=Date.now()){
 if(r.phase==='select'&&!r.selectionVersion){prepareSelection(r);r.uiVersion=(r.uiVersion||0)+1;return true;}
 if(advanceSelection(r,now))return true;
 if(r.phase!=='battle'||r.paused)return false;const elapsed=Math.min(1,Math.max(0,(now-(r.lastWall||now))/1000));if(elapsed<.09)return false;r.lastWall=now;
 for(const p of r.match.players){const data=inputs.find(i=>i.id===p.id);p.input=data&&now-data.at<800?data.input:{};p.online=!!data&&now-data.at<6000;}
 const bank=bankFor(r).filter(q=>r.questionIds.includes(q.id));
 for(let remaining=elapsed;remaining>0;remaining-=.05){const dt=Math.min(.05,remaining);for(const p of r.match.players)if(p.bot)p.input=botInput(r.match,p);step(r.match,dt);pumpQuizzes(r.match,bank);for(const p of r.match.players)if(p.bot&&p.quiz&&!p.quiz.resolved&&r.match.time-p.quiz.at>=2)answerQuiz(r.match,p,p.quiz.index,Math.random()<.7?p.quiz.answer:!p.quiz.answer);if(r.match.done){finishRoom(r);break;}}
 return true;
}
export function inputData(data){return{x:clamp(Number(data?.x)||0,-1,1),z:clamp(Number(data?.z)||0,-1,1),a0:!!data?.a0,a1:!!data?.a1,a2:!!data?.a2,a3:!!data?.a3};}
export function playerAction(r,u,event,d){if(event==='selectHero'){lockHero(r,u.id,d.hero);return{ok:true,room:publicRoom(r)};}const p=r.match?.players.find(p=>p.id===u.id);if(event==='answer'){if(!p||r.phase!=='battle'||r.paused)throw Error('Câu hỏi đã đóng.');const a=answerQuiz(r.match,p,d.index,d.value);if(!a)throw Error('Câu hỏi đã đóng hoặc bạn đã trả lời.');return a;}
 if(event==='buy'){if(!p||r.phase!=='battle'||r.paused||!['power','shield'].includes(d.item)||p.items.includes(d.item)||p.wallet<200)throw Error('Cần 200 điểm ví; mỗi món mua một lần.');p.wallet-=200;p.items.push(d.item);if(d.item==='shield')p.shield+=80;return{ok:true};}
 if(event==='chat'){const pp=r.players.find(p=>p.id===u.id);if(!pp?.approved)throw Error('Chờ MC duyệt.');const last=(r.chats||[]).filter(c=>c.id===u.id).at(-1);if(last&&Date.now()-last.at<2000)throw Error('Chờ 2 giây giữa tin nhắn.');const text=String(d.text||'').trim().slice(0,120).replace(/https?:\/\/\S+/gi,'[liên kết]').replace(/\b(fuck|shit|vcl|dm|đm)\b/gi,'***');r.chats??=[];r.chats.push({seq:id(),id:u.id,name:u.name,team:pp.team,text,at:Date.now()});r.chats=r.chats.slice(-80);return{ok:true};}throw Error('Thao tác không hợp lệ.');}
export function packet(r,u){const p=r.match?.players.find(p=>p.id===u.id),team=r.players.find(p=>p.id===u.id)?.team;return{ok:true,room:publicRoom(r),owner:r.owner===u.id,match:safeMatch(r.match),question:p?.quiz&&!p.quiz.resolved?publicQuiz(p.quiz):null,chats:(r.chats||[]).filter(c=>c.team===team).slice(-10)};}
