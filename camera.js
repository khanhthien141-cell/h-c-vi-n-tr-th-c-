const limit=(x,a,b)=>Math.max(a,Math.min(b,x));
export function createCameraState(free=true){return{free,yaw:-Math.PI/2,pitch:.54,distance:13,side:0,userMoved:false};}
export function resetCamera(s,side=s.side){s.side=side;s.yaw=side===1?Math.PI/2:-Math.PI/2;s.pitch=.54;s.distance=13;s.userMoved=false;}
export function rotateCamera(s,dx,dy){if(!s.free)return;s.yaw-=dx*.007;s.pitch=limit(s.pitch+dy*.005,.22,1.26);s.userMoved=true;}
export function zoomCamera(s,delta){s.distance=limit(s.distance*Math.exp(limit(delta,-500,500)*.0012),6,27);}
export function cameraPose(s,p){const r=s.distance*Math.cos(s.pitch);return{position:[p.x+Math.sin(s.yaw)*r,1.5+Math.sin(s.pitch)*s.distance,p.z+Math.cos(s.yaw)*r],target:[p.x,1.5,p.z]};}
export function cameraMovement(s,forward,right){let x=-Math.sin(s.yaw)*forward+Math.cos(s.yaw)*right,z=-Math.cos(s.yaw)*forward-Math.sin(s.yaw)*right;const len=Math.max(1,Math.hypot(x,z));return{x:x/len,z:z/len};}
