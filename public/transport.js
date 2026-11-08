import {io} from './vendor/socket.io.js';
export function makeSocket(options){
 const handlers=new Map();let native=null,code=null,latest={},timer=null,closed=false,busy=false,lastUI=null,lastQuiz=null,lastChats=new Set(),failed=false;
 const fire=(event,data)=>{for(const fn of handlers.get(event)||[])fn(data);};
 const request=async(path,body)=>{const res=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+options.auth.token},body:JSON.stringify(body||{})});const value=await res.json();if(!res.ok)throw Error(value.error||'Không kết nối được phòng.');return value;};
 const apply=p=>{if(p.room&&lastUI!==p.room.uiVersion){lastUI=p.room.uiVersion;fire('room',p.room);}if(p.match)fire('match',p.match);if(p.question){const key=p.question.index+':'+p.question.at+':'+p.question.reason;if(key!==lastQuiz){lastQuiz=key;fire('question',p.question);}}for(const chat of p.chats||[])if(!lastChats.has(chat.seq)){lastChats.add(chat.seq);fire('chat',chat);}if(lastChats.size>150)lastChats=new Set((p.chats||[]).map(c=>c.seq));};
 const poll=async()=>{if(closed||busy||!code)return;busy=true;try{const p=await request('/api/live/'+code+'/poll',{input:latest});apply(p);if(failed){failed=false;fire('connect');}}catch(e){if(!failed){failed=true;fire('disconnect');}}finally{busy=false;}};
 const socket={on(event,fn){if(!handlers.has(event))handlers.set(event,[]);handlers.get(event).push(fn);native?.on(event,fn);return socket;},emit(event,data,cb){if(native)return native.emit(event,data,cb);if(event==='input'){latest=data;return;}if(closed)return;
  (async()=>{try{if(event==='join'){code=String(data.code);const p=await request('/api/live/'+code+'/join',data);apply(p);cb?.({ok:true,room:p.room,owner:p.owner});clearInterval(timer);timer=setInterval(poll,250);}else{const p=await request('/api/live/'+code+'/'+event,event==='chat'?{text:data}:data);if(p.room)apply(p);cb?.(p);}}catch(e){cb?.({error:e.message});}})();
 },disconnect(){closed=true;clearInterval(timer);native?.disconnect();}};
 fetch('/api/health').then(r=>r.json()).then(health=>{if(closed)return;if(health.protocol==='polling')fire('connect');else{native=io(options);for(const [event,fns]of handlers)for(const fn of fns)native.on(event,fn);}}).catch(()=>fire('connect_error',Error('Không kết nối được máy chủ.')));
 return socket;
}
