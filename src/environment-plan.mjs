import {townToUTM} from './housing-plan.mjs';
import {isPublicGround} from './center-plan.mjs';
import {routeStations,nearestRoute,shoreEasting} from './littoral-plan.mjs';
import {footprintBlocked} from './walk-plan.mjs';
import {housingNavigation,yardPlan,siteUTM,rect} from './domestic-plan.mjs';
const random=(a,b,c=0)=>{const x=Math.sin(a*127.1+b*311.7+c*74.7)*43758.5453;return x-Math.floor(x);};
export function environmentPlan(urban,littoral,housing,center,sample){
 const occupied=[...housing.structures.flatMap(s=>[s.footprintUTM,...housingNavigation(s).floors]),...center.sites.map(s=>s.footprintUTM),...urban.sites.map(s=>s.footprintUTM),...littoral.sites.filter(s=>s.width&&s.depth).map(s=>rect(s.anchor[0],s.anchor[1],s.width,s.depth))].filter(Boolean);
 occupied.push(rect(296516,4499184,86,6),rect(296574,4499247,6,72));
 for(const s of urban.sites)occupied.push(...(s.collisionFootprintsUTM??[]));
 for(const line of littoral.portWorks?.breakwaters??[])for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1],L=Math.hypot(b[0]-a[0],b[1]-a[1]),dx=(b[0]-a[0])/L,dn=(b[1]-a[1])/L,r=littoral.portWorks.width/2+1;occupied.push([[a[0]-dn*r,a[1]+dx*r],[b[0]-dn*r,b[1]+dx*r],[b[0]+dn*r,b[1]-dx*r],[a[0]+dn*r,a[1]-dx*r]]);}
 const shrubs=[],stones=[],pots=[];
 const dry=(e,n,radius=.4)=>{if(footprintBlocked(e,n,occupied,radius))return null;return sample(e,n);};
 for(let a=-220;a<=190;a+=11)for(let b=-178;b<=170;b+=11){
  const across=a+(random(a,b)-.5)*8,along=b+(random(a,b,1)-.5)*8;
  if(isPublicGround(across,along,center.publicSpace))continue;
  const p=townToUTM(across,along,housing.townFrame),e=p.easting,n=p.northing,h=dry(e,n,1);
  if(h===null||urban.routes.some(r=>nearestRoute(e,n,r.points).distance<r.width/2+1.3))continue;
  if(random(a,b,2)<.47)shrubs.push({e,n,height:h,scale:.45+random(a,b,3)*.65,angle:random(a,b,4)*Math.PI*2});
  const h2=sample(e+.6,n-.3);if(random(a,b,5)<.27&&h2!==null)stones.push({e:e+.6,n:n-.3,height:h2,scale:.10+random(a,b,6)*.14,angle:random(a,b,7)*6});
 }
 for(const[ri,r]of urban.routes.entries())for(const st of routeStations(r.points,8))for(const sign of[-1,1]){
  const offset=r.width/2+.55+random(st.e,st.n)*.55,e=st.e-sign*st.dy*offset,n=st.n+sign*st.dx*offset,h=dry(e,n,.3);if(h===null)continue;
  stones.push({e,n,height:h+.02,scale:.07+random(st.e,st.n,ri)*.11,angle:random(st.e,st.n,2)*6});
 }
 for(let n=4499100;n<=4499510;n+=9){const e=shoreEasting(n,littoral.shorelineStudy)-2.4-random(n,3)*2,h=dry(e,n,.4);if(h!==null)stones.push({e,n,height:h,scale:.13+random(n,4)*.13,angle:random(n,5)*6});}
 const removed=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[]));
 for(const s of housing.structures){const yard=yardPlan(s);if(!yard||removed.has(s.id))continue;for(const sign of[-1,1]){const[e,n]=siteUTM(s,[[sign*(s.width/2-.6),yard.bz-.7]])[0],h=sample(e,n);if(h!==null)pots.push({e,n,height:h,scale:.8+random(e,n)*.4,angle:0});}}
 return{confidence:'C',fromYear:1794,shrubs,stones,pots};
}
