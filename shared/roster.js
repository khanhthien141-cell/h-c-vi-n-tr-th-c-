const clean=v=>String(v||'').normalize('NFC').replace(/[\u0000-\u001f\u007f]/g,'').trim().slice(0,24);
export function saveRoster(r,rows){
 if(r.phase!=='lobby')throw Error('Chỉ sửa danh sách trước giải.');if(!Array.isArray(rows)||rows.length>20)throw Error('Danh sách tối đa 20 người.');
 const entries=rows.filter(row=>clean(row.name)).map(row=>({id:String(row.id||crypto.randomUUID()),name:clean(row.name),team:Number(row.team)}));
 if(entries.some(row=>!Number.isInteger(row.team)||row.team<0||row.team>3)||new Set(entries.map(row=>row.id)).size!==entries.length)throw Error('Danh sách không hợp lệ.');
 for(let team=0;team<4;team++){const group=entries.filter(row=>row.team===team);if(group.length>5||new Set(group.map(row=>row.name.toLocaleLowerCase())).size!==group.length)throw Error('Mỗi đội tối đa 5 tên, không trùng nhau.');}
 for(const p of r.players||[]){if(!p.rosterId)continue;const entry=entries.find(row=>row.id===p.rosterId);if(!entry||entry.team!==p.team)throw Error('Thành viên đã vào phòng phải giữ đúng ô và đội. Có thể sửa tên.');}
 r.roster=entries;for(const p of r.players||[]){const entry=entries.find(row=>row.id===p.rosterId);if(entry)p.rosterName=entry.name;}return r;
}
export function rosterSlot(r,userId,rosterId){if(!r.roster?.length||!rosterId)return null;const row=r.roster.find(row=>row.id===rosterId);if(!row)throw Error('Hãy chọn tên trong danh sách giáo viên.');if(r.players.some(p=>p.rosterId===row.id&&p.id!==userId))throw Error('Tên này đã có người vào.');return row;}
export function roomInfo(r){return{code:r.code,title:r.title,teams:r.teams,phase:r.phase,roster:(r.roster||[]).map(row=>({...row,claimedBy:r.players.find(p=>p.rosterId===row.id)?.id||null}))};}
