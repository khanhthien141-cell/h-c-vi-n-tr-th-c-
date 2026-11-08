import {roomInfo} from '../shared/roster.js';
import ASSETS from 'arcana:assets';
import * as XLSX from 'xlsx';
import {newRoom,publicRoom,joinRoom,commandRoom,tickRoom,inputData,playerAction,packet,bankFor,cleanName,id} from '../shared/room-core.js';
const json=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'no-store'}});
async function get(db,key){return db.prepare('SELECT value, revision FROM arcana_store WHERE key = ?').bind(key).first();}
async function set(db,key,value){await db.prepare('INSERT INTO arcana_store (key,value,revision) VALUES (?,?,0) ON CONFLICT(key) DO UPDATE SET value=excluded.value, revision=arcana_store.revision+1').bind(key,JSON.stringify(value)).run();}
async function list(db,prefix){const rows=await db.prepare('SELECT value FROM arcana_store WHERE key LIKE ?').bind(prefix+'%').all();return rows.results.map(r=>JSON.parse(r.value));}
async function user(db,request){const t=request.headers.get('Authorization')?.replace(/^Bearer /,'');if(!t)throw Error('Hãy nhập lại biệt danh.');const row=await get(db,'session:'+t),u=row&&JSON.parse(row.value);if(!u||u.expires<Date.now())throw Error('Phiên đã hết hạn. Hãy nhập lại biệt danh.');return u;}
async function mutate(db,code,fn){for(let attempt=0;attempt<8;attempt++){const row=await get(db,'room:'+code);if(!row)throw Error('Không tìm thấy mã phòng.');const r=JSON.parse(row.value),value=await fn(r);const out=await db.prepare('UPDATE arcana_store SET value = ?, revision = revision + 1 WHERE key = ? AND revision = ?').bind(JSON.stringify(r),'room:'+code,row.revision).run();if(out.meta.changes)return{r,value};}throw Error('Phòng đang cập nhật, hãy thử lại.');}
async function poll(db,code,u,data){
 const row=await get(db,'room:'+code);if(!row)throw Error('Không tìm thấy phòng.');let r=JSON.parse(row.value);
 if(r.owner!==u.id&&!r.players.some(p=>p.id===u.id)&&!u.spectating?.includes(code))throw Error('Hãy vào phòng trước.');
 if(r.match?.players.some(p=>p.id===u.id)&&data.input)await set(db,'input:'+code+':'+u.id,{id:u.id,at:Date.now(),input:inputData(data.input)});
 if(['battle','select'].includes(r.phase)){
  const inputs=r.phase==='battle'&&!r.paused?await list(db,'input:'+code+':'):[];
  if(tickRoom(r,inputs)){const out=await db.prepare('UPDATE arcana_store SET value=?, revision=revision+1 WHERE key=? AND revision=?').bind(JSON.stringify(r),'room:'+code,row.revision).run();if(!out.meta.changes)r=JSON.parse((await get(db,'room:'+code)).value);}
 }
 return packet(r,u);
}
async function api(request,env,path){const db=env.DB;if(path==='/api/health')return json({ok:true,version:'0.5.0',protocol:'polling',storage:!!db});if(!db)return json({error:'Máy chủ đang khởi tạo dữ liệu.'},503);
 const body=request.method==='GET'?{}:await request.json().catch(()=>({}));
 if(['/api/guest','/api/host'].includes(path)&&request.method==='POST'){
  const role=path.endsWith('host')?'host':'guest',name=cleanName(body.nickname||body.name||(role==='host'?'MC':''));if(!name)throw Error('Nhập biệt danh từ 1 đến 24 ký tự.');
  if(body.resumeToken){const row=await get(db,'session:'+String(body.resumeToken));if(row){const prev=JSON.parse(row.value);if(prev.role===role&&prev.expires>Date.now()&&(role==='host'||prev.name===name))return json({token:body.resumeToken,id:prev.id,name:prev.name,role});}}
  const token=id()+id(),u={id:id(),name,role,expires:Date.now()+30*86400000};await set(db,'session:'+token,u);return json({token,id:u.id,name,role});
 }
 const info=path.match(/^\/api\/room-info\/(\d{6})$/);if(info){const row=await get(db,'room:'+info[1]);return row?json(roomInfo(JSON.parse(row.value))):json({error:'Không tìm thấy phòng.'},404);}
 const u=await user(db,request);
 if(path==='/api/rooms'){
  if(u.role!=='host')return json({error:'Trang này dành cho máy chủ.'},403);
  if(request.method==='GET')return json((await list(db,'room:')).filter(r=>r.owner===u.id).map(publicRoom));
  const mine=(await list(db,'room:')).filter(r=>r.owner===u.id);if(mine.length>=30)throw Error('Mỗi máy chủ tối đa 30 phòng.');
  for(let attempt=0;attempt<10;attempt++){const code=String(Math.floor(100000+Math.random()*900000)),r=newRoom(code,u.id,body.title);const inserted=await db.prepare('INSERT OR IGNORE INTO arcana_store (key,value,revision) VALUES (?,?,0)').bind('room:'+code,JSON.stringify(r)).run();if(inserted.meta.changes)return json(publicRoom(r));}throw Error('Chưa tạo được mã phòng, thử lại nhé.');
 }
 if(path==='/api/bank'){if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id);const unique=[...new Map(rooms.flatMap(r=>r.bank||[]).map(q=>[q.id,q])).values()];return json(bankFor({bank:unique}));}
 const live=path.match(/^\/api\/live\/(\d{6})\/(join|poll|mc|answer|buy|chat|selectHero)$/);
 if(live){const [,code,event]=live;if(event==='poll')return json(await poll(db,code,u,body));if(event==='join'){
   const out=await mutate(db,code,r=>joinRoom(r,u,body));if(body.spectator&&out.r.owner!==u.id){const t=request.headers.get('Authorization').slice(7);u.spectating=[...new Set([...(u.spectating||[]),code])].slice(-30);await set(db,'session:'+t,u);}return json(packet(out.r,u));
  }
  const out=await mutate(db,code,r=>event==='mc'?commandRoom(r,u,body):playerAction(r,u,event,body));return json(event==='mc'?packet(out.r,u):out.value);
 }
 const archive=path.match(/^\/api\/archives\/(\d{6})$/),exported=path.match(/^\/api\/export\/(\d{6})$/);
 if(archive||exported){const row=await get(db,'room:'+(archive||exported)[1]),r=row&&JSON.parse(row.value);if(!r||r.owner!==u.id)return json({error:'Chỉ máy chủ của phòng.'},403);if(archive)return json(r.archives||[]);const wb=XLSX.utils.book_new(),rows=r.results.flatMap((m,i)=>m.players.map(p=>({Tran:i+1,BietDanh:p.name,Doi:r.teams[p.team],Tuong:p.hero,Dung:p.correct,DiemKienThuc:p.knowledge,HaGuc:p.kills})));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows),'KetQua');XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(r.history),'LichSu');return new Response(XLSX.write(wb,{type:'array',bookType:'xlsx'}),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="arcana-'+r.code+'.xlsx"'}});}
 if(path==='/api/import'&&request.method==='POST'){
  if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);if(typeof body.base64!=='string'||body.base64.length>1500000)throw Error('File tối đa 1 MB.');const wb=XLSX.read(body.base64,{type:'base64'}),rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);if(!rows.length||rows.length>1000)throw Error('Cần 1–1000 dòng.');const added=rows.map((a,i)=>{const v=String(a.DapAn).toLowerCase().trim();if(!String(a.CauHoi||'').trim()||!['true','false','đúng','sai','1','0'].includes(v))throw Error('Dòng '+(i+2)+' cần CauHoi và DapAn TRUE/FALSE.');return{id:id(),text:String(a.CauHoi).slice(0,500),answer:['true','đúng','1'].includes(v),round:Math.max(0,Math.min(3,Number(a.Vong)||0)),difficulty:['Dễ','Trung bình','Khó'].includes(a.DoKho)?a.DoKho:'Trung bình',topic:String(a.ChuDe||'Tự nhập').slice(0,60),owner:u.id};});const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id&&r.phase==='lobby');if(!rooms.length)throw Error('Tạo hoặc mở phòng ở sảnh trước khi nhập câu hỏi.');for(const room of rooms)await mutate(db,room.code,r=>{r.bank=[...(r.bank||[]),...added];});return json({count:added.length});
 }
 const edit=path.match(/^\/api\/bank\/([a-zA-Z0-9_-]+)$/);if(edit&&request.method==='PATCH'){if(u.role!=='host')return json({error:'Chỉ máy chủ.'},403);const rooms=(await list(db,'room:')).filter(r=>r.owner===u.id&&(r.bank||[]).some(q=>q.id===edit[1]));if(!rooms.length)throw Error('Không tìm thấy câu hỏi của bạn.');if(rooms.some(r=>['select','battle'].includes(r.phase)&&r.questionIds.includes(edit[1])))throw Error('Câu hỏi đã khóa trong trận.');if(typeof body.text!=='string'||typeof body.answer!=='boolean')throw Error('Dữ liệu không hợp lệ.');for(const room of rooms)await mutate(db,room.code,r=>{const q=r.bank.find(q=>q.id===edit[1]);q.text=body.text.slice(0,500);q.answer=body.answer;});return json({ok:true});}
 return json({error:'Không tìm thấy chức năng.'},404);
}
export default{async fetch(request,env){try{const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return await api(request,env,url.pathname);const path=['/mc','/mc.html'].includes(url.pathname)?'/mc.html':['/play','/player','/player.html'].includes(url.pathname)?'/player.html':url.pathname==='/'?'/index.html':url.pathname;const asset=ASSETS[path];if(!asset)return new Response('Không tìm thấy trang',{status:404});const bytes=asset.text!==undefined?new TextEncoder().encode(asset.text):Uint8Array.from(atob(asset.base64),c=>c.charCodeAt(0));const headers={'Content-Type':asset.type,'Cache-Control':path.endsWith('.mp4')?'public, max-age=86400':'no-cache','Accept-Ranges':'bytes'};const range=request.headers.get('Range')?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=Number(range[1]),end=Math.min(bytes.length-1,range[2]?Number(range[2]):bytes.length-1);if(start>=bytes.length)return new Response(null,{status:416});return new Response(bytes.slice(start,end+1),{status:206,headers:{...headers,'Content-Range':`bytes ${start}-${end}/${bytes.length}`}});}return new Response(request.method==='HEAD'?null:bytes,{headers});}catch(error){return json({error:error.message||'Máy chủ chưa sẵn sàng.'},400);}}};
