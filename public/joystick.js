import {joystickVector} from './shared/controls.js';
export function makeJoystick(element,onMove){let pointer=null;const knob=element.querySelector('.joystick-knob');
 function move(e){const rect=element.getBoundingClientRect(),v=joystickVector(e.clientX-rect.left-rect.width/2,e.clientY-rect.top-rect.height/2,rect.width*.32);knob.style.transform=`translate(${v.x}px,${v.y}px)`;onMove(v);}
 element.addEventListener('pointerdown',e=>{if(pointer!==null)return;e.preventDefault();pointer=e.pointerId;element.setPointerCapture(pointer);element.classList.add('active');move(e);});
 element.addEventListener('pointermove',e=>{if(e.pointerId===pointer){e.preventDefault();move(e);}});
 function reset(){pointer=null;knob.style.transform='translate(0,0)';element.classList.remove('active');onMove({forward:0,right:0});}
 for(const name of ['pointerup','pointercancel','lostpointercapture'])element.addEventListener(name,e=>{if(e.pointerId===pointer)reset();});window.addEventListener('blur',reset);return{reset};
}
