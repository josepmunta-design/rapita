/**
 * Ambient vegetation for the «Realista» style: generic Mediterranean scrub and scattered trees.
 * It is decoration of confidence C: no source places these plants. The plan only decides where
 * NOT to put them (buildings, streets, the plaza, cultivated plots, the canal, the shore and
 * every documented landscape element) and is fully reproducible.
 */
import {isPublicGround,worldToTown} from './center-plan.mjs';
import {landscapeSample,nearestRoute,coastDistance} from './littoral-plan.mjs';
import {urbanGround} from './urban-plan.mjs';
import {footprintBlocked} from './walk-plan.mjs';
import {housingNavigation,rect} from './domestic-plan.mjs';

const fract=x=>x-Math.floor(x);
// Same lattice noise as the ground shader, so the scrub stands on the patches painted there.
export function terraHash(x,y){let px=fract(x*.1031),py=fract(y*.1030);const d=px*(py+33.33)+py*(px+33.33);px+=d;py+=d;return fract((px+py)*py);}
export function terraNoise(x,y){const ix=Math.floor(x),iy=Math.floor(y);let fx=x-ix,fy=y-iy;fx=fx*fx*(3-2*fx);fy=fy*fy*(3-2*fy);const a=terraHash(ix,iy),b=terraHash(ix+1,iy),c=terraHash(ix,iy+1),d=terraHash(ix+1,iy+1);return (a+(b-a)*fx)+((c+(d-c)*fx)-(a+(b-a)*fx))*fy;}
export function terraFbm(x,y){let v=0,a=.5;for(let i=0;i<4;i++){v+=a*terraNoise(x,y);x=x*2.03+11.7;y=y*2.03+5.3;a*=.5;}return v/.9375;}
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
/** Scrub cover painted by the ground shader at a world position (x east, z south) and altitude. */
export function scrubCover(x,z,altitude){
 const hill=smooth(14,95,altitude),edge=.56-.20*hill;
 return smooth(edge,edge+.13,terraFbm(x*.11+41,z*.11+41)*.58+terraFbm(x*.021+17,z*.021+17)*.42);
}
const random=(a,b,c=0)=>terraHash(a*.731+c*17.13,b*.617-c*9.71);
const box=points=>{let w=Infinity,e=-Infinity,s=Infinity,n=-Infinity;for(const p of points){w=Math.min(w,p[0]);e=Math.max(e,p[0]);s=Math.min(s,p[1]);n=Math.max(n,p[1]);}return[w,s,e,n];};

/**
 * @param sample measured ground height at (easting, northing) or null outside the terrain
 * @returns shrubs and trees in a shuffled, stable order so a quality level can keep the first N
 */
export function vegetationPlan({urban,littoral,housing,center,landmarks,sample,origin,radius=1500}){
 const occupied=[...housing.structures.flatMap(s=>[s.footprintUTM,...housingNavigation(s).floors]),...center.sites.map(s=>s.footprintUTM),...urban.sites.flatMap(s=>[s.footprintUTM,...(s.collisionFootprintsUTM??[])]),...littoral.sites.filter(s=>s.width&&s.depth).map(s=>rect(s.anchor[0],s.anchor[1],s.width+6,s.depth+6))].filter(Boolean);
 for(const s of landmarks?.sites??[])if(s.anchor)occupied.push(rect(s.anchor.easting,s.anchor.northing,(s.focusRadius??10)*1.4,(s.focusRadius??10)*1.4));
 const research=littoral.researchLandscape;
 if(research){
  const g=research.garden,o=research.olives;
  if(g)occupied.push(rect(g.center[0],g.center[1],g.width+14,g.depth+14));
  if(o)occupied.push(rect(o.center[0],o.center[1],o.cols*o.spacing+10,o.rows*o.spacing+10));
  if(research.rocks)occupied.push(rect(research.rocks.center[0],research.rocks.center[1],60,60));
 }
 for(const b of littoral.basins??[])occupied.push(b.polygonUTM??rect(b.center[0],b.center[1],b.width+12,b.length+12));
 const boxes=occupied.map(box);
 const blocked=(e,n,r)=>{for(let i=0;i<boxes.length;i++){const b=boxes[i];if(e>b[0]-r-1&&e<b[2]+r+1&&n>b[1]-r-1&&n<b[3]+r+1&&footprintBlocked(e,n,[occupied[i]],r))return true;}return false;};
 const lines=[...urban.routes.map(r=>({points:r.points,clear:r.width/2+2.2})),{points:urban.ravine.points,clear:urban.ravine.width/2+2},{points:littoral.canal.routeStudy,clear:littoral.canal.studyWidth/2+9},{points:littoral.canal.branchStudy,clear:9}];
 for(const key of['trail'])if(research?.[key]?.points)lines.push({points:research[key].points,clear:(research[key].width??2)/2+2.5});
 for(const line of littoral.portWorks?.breakwaters??[])lines.push({points:line,clear:littoral.portWorks.width/2+4});
 const lineBoxes=lines.map(l=>box(l.points));
 const nearLine=(e,n,extra)=>{for(let i=0;i<lines.length;i++){const b=lineBoxes[i],c=lines[i].clear+extra;if(e>b[0]-c&&e<b[2]+c&&n>b[1]-c&&n<b[3]+c&&nearestRoute(e,n,lines[i].points).distance<c)return true;}return false;};
 const points=[...(research?.garrigue?.points??[]),...(research?.trail?.figs??[]),...(research?.garden?.figs??[])];
 const frame=housing.townFrame,water=littoral.studyWaterElevation;
 const ground=(e,n,clear)=>{
  const t=worldToTown(e,n,frame);
  // The new town is cleared building land; the existing «Detall de l’entorn» layer covers it.
  if(Math.abs(t.across+15)<232&&Math.abs(t.along+4)<200)return null;
  if(isPublicGround(t.across,t.along,center.publicSpace))return null;
  const raw=sample(e,n);if(raw===null||!Number.isFinite(raw))return null;
  const s=landscapeSample(e,n,raw,littoral);if(s.zone!=='land')return null;
  const height=urbanGround(e,n,s.height,urban);if(!(height>water+.7))return null;
  const coast=coastDistance(e,n,littoral);if(coast<30+clear)return null;
  if(nearLine(e,n,clear)||blocked(e,n,clear+1.5))return null;
  if(points.some(p=>Math.hypot(p[0]-e,p[1]-n)<clear+3))return null;
  return{height,coast};
 };
 const shrubs=[],trees=[];
 const scatter=(step,inner,outer,visit)=>{
  for(let a=-outer;a<=outer;a+=step)for(let b=-outer;b<=outer;b+=step){
   const e=frame.easting+a+(random(a,b,step)-.5)*step*.9,n=frame.northing+b+(random(a,b,step+1)-.5)*step*.9,d=Math.hypot(e-frame.easting,n-frame.northing);
   if(d<inner||d>=outer)continue;visit(e,n,a,b,d);
  }
 };
 const shrub=(e,n,a,b,d,chance)=>{
  const x=e-origin.easting,z=origin.northing-n,raw=sample(e,n);if(raw===null)return;
  const cover=scrubCover(x,z,raw);
  if(random(a,b,3)>chance*(.07+.93*cover))return;
  const g=ground(e,n,.9);if(g===null)return;const height=g.height;
  shrubs.push({e,n,height,coast:g.coast,scale:(.55+random(a,b,4)*1.0)*(.75+.5*cover),angle:random(a,b,5)*Math.PI*2,dry:random(a,b,6)*.6+(1-cover)*.5,order:random(a,b,7)});
 };
 scatter(6.5,0,Math.min(radius,650),(e,n,a,b,d)=>shrub(e,n,a,b,d,.78));
 scatter(13,Math.min(radius,650),radius,(e,n,a,b,d)=>shrub(e,n,a,b,d,.9*(1-.45*smooth(900,radius,d))));
 scatter(17,0,radius,(e,n,a,b,d)=>{
  const x=e-origin.easting,z=origin.northing-n;
  const grove=terraFbm(x*.0058+90,z*.0058+90),chance=.03+.5*smooth(.46,.7,grove);
  if(random(a,b,11)>chance*(1-.35*smooth(800,radius,d)))return;
  const g=ground(e,n,3.6);if(g===null)return;const height=g.height;
  const pick=random(a,b,12),kind=height>60||pick<.26?'pine':grove>.55&&pick<.75?'olive':'carob';
  trees.push({e,n,height,coast:g.coast,kind,scale:.78+random(a,b,13)*.55,angle:random(a,b,14)*Math.PI*2,order:random(a,b,15)});
 });
 const byOrder=(p,q)=>p.order-q.order||p.e-q.e||p.n-q.n;
 // `coast` is the distance to the 1800 shore: later harbour phases hide the plants of that strip.
 return{confidence:'C',coastalStrip:350,basis:'Decoració ambiental genèrica; cap font situa aquestes plantes.',shrubs:shrubs.sort(byOrder),trees:trees.sort(byOrder)};
}
