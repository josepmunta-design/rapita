import {manzanaPlan} from './village-plan.mjs';
import {planToUTM} from './building-plan.mjs';
import {PORXO_STUDY as study} from './porxo-plan.mjs';
export const rect=(x,z,w,d)=>[[x-w/2,z+d/2],[x+w/2,z+d/2],[x+w/2,z-d/2],[x-w/2,z-d/2]];
export function envelope(s){
 const fw=s.frontWidth??s.width,bw=s.backWidth??s.width,fz=s.frontZ??s.depth/2,bz=s.backZ??-s.depth/2;
 const widthAt=z=>bw+(fw-bw)*(z-bz)/(fz-bz);
 return{fw,bw,fz,bz,widthAt,corners:[[-fw/2,fz],[fw/2,fz],[bw/2,bz],[-bw/2,bz]]};
}
export function porticoPlan(s){
 const e=envelope(s),depth=study.galleryDepth,back=e.fz-depth,rearWidth=e.widthAt(back),spring=study.springHeight,band=study.voussoirBand,pier=study.sharedHalfPierWidth,T=study.arcadeThickness;
 const n=Math.max(1,Math.round(e.fw/study.arcPitch)),bay=e.fw/n,rx=(bay-2*pier)/2,rise=Math.min(study.maximumRise,rx*study.riseHalfSpanFactor);
 const bays=Array.from({length:n},(_,i)=>({x:-e.fw/2+(i+.5)*bay}));
 const piers=[-1,1].map(sign=>({x:sign*(e.fw/2-pier/2),z:e.fz-T/2,width:pier,baseWidth:pier+.08,depth:T+.10,shared:true}));
 for(let i=1;i<n;i++)piers.push({x:-e.fw/2+i*bay,z:e.fz-T/2,width:2*pier,baseWidth:2*pier+.16,depth:T+.10,shared:false});
 const top=spring+rise+band+.22;
 return{...e,depth,back,rearWidth,spring,rise,band,rx,bays,piers,T,top,floor:top-.05,
  gallery:[[-e.fw/2,e.fz],[e.fw/2,e.fz],[rearWidth/2,back],[-rearWidth/2,back]],
  body:[[-rearWidth/2,back],[rearWidth/2,back],[e.bw/2,e.bz],[-e.bw/2,e.bz]]};
}
export function yardPlan(s){
 if(s.kind!=='large'||(s.renderState??s.state1794)!=='finished')return null;
 const e=envelope(s),depth=3.1,gate=1.05,T=.2,w=s.width;
 return{depth,gate,T,w,bz:e.bz,corners:rect(0,e.bz-depth/2,w,depth),
  walls:[{x:-(w+gate)/4,z:e.bz-depth,w:(w-gate)/2,d:T},{x:(w+gate)/4,z:e.bz-depth,w:(w-gate)/2,d:T},...[-1,1].map(sign=>({x:sign*(w/2-T/2),z:e.bz-depth/2,w:T,d:depth}))]};
}
export const siteUTM=(s,poly)=>poly.map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
export function housingNavigation(s){
 if(s.kind==='shared-courtyard'){const p=manzanaPlan(s);return{solids:p.solids.map(p=>siteUTM(s,p)),floors:p.floors.map(p=>siteUTM(s,p))};}
 const e=envelope(s),portico=s.group==='royal-portico'?porticoPlan(s):null,yard=yardPlan(s);
 const solids=portico?[portico.body,...portico.piers.map(p=>rect(p.x,p.z,p.baseWidth,p.depth))]:[e.corners];
 if(yard)solids.push(...yard.walls.map(p=>rect(p.x,p.z,p.w,p.d)));
 return{solids:solids.map(p=>siteUTM(s,p)),floors:[...(portico?[portico.gallery]:[]),...(yard?[yard.corners]:[])].map(p=>siteUTM(s,p))};
}
export function marketPlan(s){
 const w=s.width,d=s.depth,T=.55,pier=.75,passage=3.2;
 const piers=[-.4,-.133333,.133333,.4].map(k=>({x:k*w,z:d/2-T/2,width:pier,baseWidth:1.3,depth:1.3}));
 const sideDepth=d-passage,sideWidth=w/2-piers[3].x-pier/2;
 return{T,piers,passage,sideDepth,sideWidth,
  solids:[rect(0,-passage/2,w,sideDepth),...piers.map(p=>rect(p.x,p.z,p.baseWidth,p.depth))],
  floor:rect(0,0,w,d)};
}
export function centerNavigation(s){
 if(s.layoutAlias)return{solids:[],floors:[]};
 if(s.planOutlineUTM)return{solids:[s.planOutlineUTM],floors:[]};
 if(s.bodyFootprintsUTM)return{solids:s.bodyFootprintsUTM,floors:[]};
 if(s.kind==='covered-market'){const p=marketPlan(s);return{solids:p.solids.map(p=>siteUTM(s,p)),floors:[siteUTM(s,p.floor)]};}
 if(s.kind==='inn'){
  const wing=10,w=s.width,d=s.depth,T=.3;
  const solids=[rect(0,d/2-wing/2,w,wing),rect(0,-d/2+wing/2,w,wing),rect(-w/2+T/2,0,T,d-2*wing)];
  // Match the existing 2 m fence modules and its cart entrance exactly.
  for(let z=-d/2+wing;z<d/2-wing;z+=2)if(Math.abs(z)>=3.2)solids.push(rect(w/2-.18,z,T,1.98));
  return{solids:solids.map(p=>siteUTM(s,p)),floors:[]};
 }
 return{solids:[s.footprintUTM],floors:[]};
}
