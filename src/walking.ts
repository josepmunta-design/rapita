import * as THREE from 'three';
import type {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {walkStep,footprintBlocked,walkDistance} from './walk-plan.mjs';
type Spot={id:string;name:string;e:number;n:number;yaw:number;fromYear:number};
type Options={camera:THREE.PerspectiveCamera;orbit:OrbitControls;canvas:HTMLCanvasElement;origin:{easting:number;northing:number;elevation:number};surface:(e:number,n:number)=>number|null;obstacles:()=>number[][][];spots:Spot[];year:()=>number;onChange:()=>void};
export function makeWalking(o:Options){
 const byId=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
 const button=byId<HTMLButtonElement>('view-walk'),bar=byId('walk-toolbar'),status=byId('walk-status'),distance=byId('walk-distance'),select=byId<HTMLSelectElement>('walk-spawn'),modal=byId<HTMLDialogElement>('info-dialog'),keys=new Set<string>();
 let active=false,travelled=0,point=[0,0],yaw=0,pitch=0,drag:number|null=null,lastX=0,lastY=0,hadPointerLock=false;
 const speedInput=byId<HTMLInputElement>('walk-speed'),speedValue=byId('walk-speed-value');
 const speed=()=>Number(speedInput.value);
 speedInput.oninput=()=>{speedValue.textContent=`${speed().toLocaleString('ca-ES')} m/s`;};
 let saved:{position:THREE.Vector3;target:THREE.Vector3;quaternion:THREE.Quaternion;fov:number;near:number;top:string|null;oblique:string|null}|null=null;
 const message=(s:string)=>{if(status.textContent!==s)status.textContent=s;};
 for(const spot of o.spots){const option=document.createElement('option');option.value=spot.id;option.textContent=spot.name;select.append(option);}
 select.value='placa';
 const setPose=()=>{const h=o.surface(point[0],point[1]);if(h===null)return; o.camera.position.set(point[0]-o.origin.easting,h-o.origin.elevation+1.65,o.origin.northing-point[1]);o.camera.rotation.set(pitch,yaw,0,'YXZ');};
 const spawn=(id:string)=>{const polygons=o.obstacles(),candidates=[o.spots.find(s=>s.id===id),...o.spots].filter((s):s is Spot=>!!s&&s.fromYear<=o.year());const spot=candidates.find(s=>o.surface(s.e,s.n)!==null&&!footprintBlocked(s.e,s.n,polygons));if(!spot){message('No hi ha un punt de sortida vàlid amb aquestes capes.');return false;}point=[spot.e,spot.n];yaw=spot.yaw;pitch=0;select.value=spot.id;travelled=0;distance.textContent='0 m';setPose();message('WASD o fletxes · arrossega per mirar · Esc per sortir');return true;};
 const syncOptions=()=>{for(const option of select.options){const spot=o.spots.find(s=>s.id===option.value)!;option.disabled=spot.fromYear>o.year();}};
 const stop=()=>{if(!active)return;active=false;keys.clear();drag=null;if(document.pointerLockElement===o.canvas)document.exitPointerLock();document.body.classList.remove('walking');bar.hidden=true;button.setAttribute('aria-pressed','false');o.orbit.enabled=true;
  if(saved){o.camera.fov=saved.fov;o.camera.near=saved.near;o.camera.updateProjectionMatrix();o.camera.position.copy(saved.position);o.camera.quaternion.copy(saved.quaternion);o.orbit.target.copy(saved.target);byId('view-top').setAttribute('aria-pressed',saved.top??'false');byId('view-oblique').setAttribute('aria-pressed',saved.oblique??'true');o.orbit.update();}o.onChange();};
 const start=()=>{if(active){stop();return;}saved={position:o.camera.position.clone(),target:o.orbit.target.clone(),quaternion:o.camera.quaternion.clone(),fov:o.camera.fov,near:o.camera.near,top:byId('view-top').getAttribute('aria-pressed'),oblique:byId('view-oblique').getAttribute('aria-pressed')};syncOptions();if(!spawn(select.value||'placa'))return;active=true;o.orbit.enabled=false;o.camera.fov=68;o.camera.near=.06;o.camera.updateProjectionMatrix();document.body.classList.add('walking');bar.hidden=false;button.setAttribute('aria-pressed','true');byId('view-top').setAttribute('aria-pressed','false');byId('view-oblique').setAttribute('aria-pressed','false');o.canvas.tabIndex=0;o.canvas.focus({preventScroll:true});o.onChange();};
 const move=(forward:number,right:number,meters:number)=>{if(!active)return;const length=Math.hypot(forward,right);if(!length)return;const de=(-Math.sin(yaw)*forward+Math.cos(yaw)*right)*meters/length,dn=(Math.cos(yaw)*forward+Math.sin(yaw)*right)*meters/length,result=walkStep(point,de,dn,o.surface,o.obstacles());point=result.position;travelled+=result.distance;distance.textContent=`${travelled.toLocaleString('ca-ES',{maximumFractionDigits:1})} m`;setPose();message(result.blocked?'Pas limitat: edifici, aigua, desnivell o manca de terreny.':'WASD o fletxes · arrossega per mirar · Esc per sortir');};
 const direction=(key:string)=>['w','arrowup'].includes(key)?[1,0]:['s','arrowdown'].includes(key)?[-1,0]:['a','arrowleft'].includes(key)?[0,-1]:['d','arrowright'].includes(key)?[0,1]:null;
 window.addEventListener('keydown',e=>{if(!active||modal.open)return;if(e.key==='Escape'){e.preventDefault();stop();return;}if(e.target instanceof HTMLElement&&['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const key=e.key.toLowerCase(),d=direction(key);if(d){e.preventDefault();if(!keys.has(key))move(d[0],d[1],.12);keys.add(key);}if(key==='shift')keys.add(key);});
 window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();drag=null;});document.addEventListener('visibilitychange',()=>{if(document.hidden)keys.clear();});
 o.canvas.addEventListener('pointerdown',e=>{if(!active||document.pointerLockElement===o.canvas)return;drag=e.pointerId;lastX=e.clientX;lastY=e.clientY;o.canvas.setPointerCapture(e.pointerId);o.canvas.focus({preventScroll:true});});
 const look=(dx:number,dy:number)=>{yaw-=dx*.0025;pitch=THREE.MathUtils.clamp(pitch-dy*.0025,-1.35,1.35);setPose();};
 o.canvas.addEventListener('pointermove',e=>{if(!active||drag!==e.pointerId||document.pointerLockElement===o.canvas)return;look(e.clientX-lastX,e.clientY-lastY);lastX=e.clientX;lastY=e.clientY;});
 o.canvas.addEventListener('pointerup',()=>{drag=null;});o.canvas.addEventListener('pointercancel',()=>{drag=null;});
 document.addEventListener('mousemove',e=>{if(active&&document.pointerLockElement===o.canvas)look(e.movementX,e.movementY);});
 document.addEventListener('pointerlockchange',()=>{const locked=document.pointerLockElement===o.canvas;if(active&&hadPointerLock&&!locked)stop();hadPointerLock=locked;});
 o.canvas.addEventListener('wheel',e=>{if(active)e.preventDefault();},{passive:false});
 byId('walk-mouse').onclick=()=>{if(!active)return;try{const result=o.canvas.requestPointerLock();if(result&&typeof result.catch==='function')result.catch(()=>message('Arrossega sobre la vista per mirar al voltant.'));}catch{message('Arrossega sobre la vista per mirar al voltant.');}};
 byId('walk-exit').onclick=stop;button.onclick=start;select.onchange=()=>{if(active){keys.clear();spawn(select.value);o.canvas.focus({preventScroll:true});}};
 for(const b of byId('walk-pad').querySelectorAll<HTMLButtonElement>('button')){
  const key=b.dataset.key!;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const d=direction(key)!;move(d[0],d[1],.12);keys.add(key);};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys.delete(key);
 }
 const update=(dt:number)=>{if(!active)return;if(modal.open){keys.clear();return;}let forward=0,right=0;for(const key of keys){const d=direction(key);if(d){forward+=d[0];right+=d[1];}}if(forward||right)move(forward,right,walkDistance(dt,speed(),keys.has('shift')));};
 const revalidate=()=>{syncOptions();if(!active)return;if(o.surface(point[0],point[1])===null||footprintBlocked(point[0],point[1],o.obstacles()))spawn(select.value);else setPose();};
 bar.hidden=true;return{get active(){return active;},start,stop,update,revalidate};
}
