/** Exterior walking: a circular footprint, swept short steps, no traversal of NoData/water. */
import {landscapeSample} from './littoral-plan.mjs';
import {urbanGround} from './urban-plan.mjs';
export const walkDistance=(dt,speed=6,fast=false)=>Math.max(0,Math.min(dt,.25))*speed*(fast?2:1);
export function walkingSurface(e,n,sample,urban,littoral,{interpreted=true,canal=true,bridge=true,port=true}={}){
 if(interpreted&&canal&&port){
  if(Math.abs(e-296516)<=42&&Math.abs(n-4499184)<=2.1)return 1.3;
  if(Math.abs(e-296574)<=2.1&&Math.abs(n-4499247)<=34.5)return 1.25;
 }
 const raw=sample(e,n);if(raw===null)return null;if(!interpreted)return raw;
 if(canal&&bridge){const s=urban.sites.find(s=>s.kind==='bridge'),r=urban.frame.alongAzimuthDegrees*Math.PI/180,x=e-s.anchor[0],y=n-s.anchor[1],across=x*Math.cos(r)-y*Math.sin(r),along=x*Math.sin(r)+y*Math.cos(r);if(Math.abs(across)<s.width/2-.5&&Math.abs(along)<=s.depth/2)return s.technicalBaseElevation+.6;}
 const active=canal?littoral:{...littoral,basins:[],canal:{...littoral.canal,routeStudy:[[0,0],[0,1]],branchStudy:[[0,0],[0,1]]}};
 const p=landscapeSample(e,n,raw,active);if(p.zone==='seabed'||p.zone==='bed')return null;
 return canal?urbanGround(e,n,p.height,urban):p.height;
}
export function insidePolygon(p,polygon){
 let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
export function footprintBlocked(e,n,polygons,radius=.32){
 for(const polygon of polygons){if(insidePolygon([e,n],polygon))return true;
  for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length],dx=b[0]-a[0],dn=b[1]-a[1],t=Math.max(0,Math.min(1,((e-a[0])*dx+(n-a[1])*dn)/(dx*dx+dn*dn||1)));
   if(Math.hypot(e-a[0]-t*dx,n-a[1]-t*dn)<radius)return true;}
 }return false;
}
export function walkStep(from,de,dn,surface,polygons,{radius=.32,maxStep=.45,maxSlope=.85}={}){
 let e=from[0],n=from[1],height=surface(e,n);if(height===null)return{position:[e,n],height:null,distance:0,blocked:true};
 const count=Math.max(1,Math.ceil(Math.hypot(de,dn)/.12)),a=de/count,b=dn/count;let distance=0,blocked=false;
 const attempt=(dx,dy)=>{const x=e+dx,y=n+dy;
  if(footprintBlocked(x,y,polygons,radius))return false;const z=surface(x,y);if(z===null||!Number.isFinite(z))return false;
  if(Math.abs(z-height)>maxStep+maxSlope*Math.hypot(dx,dy))return false;
  distance+=Math.hypot(dx,dy);e=x;n=y;height=z;return true;
 };
 for(let i=0;i<count;i++)if(!attempt(a,b)){blocked=true;if(Math.abs(a)>1e-9)attempt(a,0);if(Math.abs(b)>1e-9)attempt(0,b);}
 return{position:[e,n],height,distance,blocked};
}
