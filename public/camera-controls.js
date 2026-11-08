import {createCameraState,resetCamera,rotateCamera,zoomCamera} from './shared/camera.js';
export function cameraControls(canvas,{free=true,state=createCameraState(free),onChange=()=>{}}={}){
 const pointers=new Map();let active=false,pinch=0;
 canvas.addEventListener('contextmenu',e=>{if(active)e.preventDefault();});
 canvas.addEventListener('pointerdown',e=>{if(!active||!state.free||![0,2].includes(e.button)&&e.pointerType==='mouse')return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});pinch=0;canvas.classList.add('rotating');});
 canvas.addEventListener('pointermove',e=>{const last=pointers.get(e.pointerId);if(!last)return;const next={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,next);if(pointers.size===2){const [a,b]=[...pointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)zoomCamera(state,(pinch-distance)*4);pinch=distance;}else rotateCamera(state,next.x-last.x,next.y-last.y);onChange(state);});
 function release(e){pointers.delete(e.pointerId);pinch=0;if(!pointers.size)canvas.classList.remove('rotating');}
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,release);
 canvas.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();zoomCamera(state,e.deltaY);onChange(state);},{passive:false});
 return{state,setActive(v,side=0){active=v;if(side!==state.side)resetCamera(state,side);canvas.classList.toggle('camera-active',active&&state.free);if(!v){pointers.clear();pinch=0;}},reset(side=state.side){resetCamera(state,side);onChange(state);},toggle(){state.free=!state.free;pointers.clear();pinch=0;resetCamera(state);canvas.classList.toggle('camera-active',active&&state.free);onChange(state);},zoom(delta){zoomCamera(state,delta);onChange(state);}};
}
