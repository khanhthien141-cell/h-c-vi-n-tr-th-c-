import {heroes} from './heroes.js';
export const SELECTION_MS=20000;
export const activePlayers=r=>r.players.filter(p=>r.pair.includes(p.team)&&p.approved);
export function prepareSelection(r,now=Date.now()){
 r.selectionVersion=2;r.selectionEnds=now+SELECTION_MS;
 for(const p of r.players){p.hero=null;p.heroReady=false;}
 for(const team of r.pair){const used=new Set();for(const p of activePlayers(r).filter(p=>p.team===team&&p.bot)){p.hero=heroes.find(h=>!used.has(h.id)).id;p.heroReady=true;used.add(p.hero);}}
}
export function selectionReady(r){const ps=activePlayers(r);return ps.length===10&&ps.every(p=>p.heroReady&&heroes.some(h=>h.id===p.hero))&&r.pair.every(team=>new Set(ps.filter(p=>p.team===team).map(p=>p.hero)).size===5);}
export function lockHero(r,userId,hero,now=Date.now()){
 if(r.phase!=='select')throw Error('Chỉ chọn tướng sau khi giáo viên mở chọn tướng.');
 if(now>=r.selectionEnds)throw Error('Đã hết 20 giây chọn tướng.');
 const p=activePlayers(r).find(p=>p.id===userId);if(!p)throw Error('Bạn chưa được duyệt hoặc đội bạn chưa thi đấu vòng này.');
 if(p.heroReady)throw Error('Bạn đã chốt tướng. Hãy chờ các bạn còn lại.');
 if(!heroes.some(h=>h.id===hero))throw Error('Chọn một tướng hợp lệ.');
 if(r.players.some(q=>q.id!==p.id&&q.team===p.team&&q.heroReady&&q.hero===hero))throw Error('Đồng đội vừa chọn tướng này. Hãy chọn tướng khác.');
 p.hero=hero;p.heroReady=true;r.uiVersion=(r.uiVersion||0)+1;return p;
}
export function advanceSelection(r,now=Date.now()){
 if(r.phase!=='select')return false;
 if(now>=r.selectionEnds){for(const team of r.pair){const ps=activePlayers(r).filter(p=>p.team===team),used=new Set(ps.filter(p=>p.heroReady).map(p=>p.hero));for(const p of ps.filter(p=>!p.heroReady)){p.hero=heroes.find(h=>!used.has(h.id)).id;p.heroReady=true;used.add(p.hero);}}}
 if(!selectionReady(r))return false;r.phase='ready';r.uiVersion=(r.uiVersion||0)+1;return true;
}
