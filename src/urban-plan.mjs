import {townToUTM} from './housing-plan.mjs';
import {nearestRoute} from './littoral-plan.mjs';
export const urbanVisible=(feature,year)=>year>=feature.fromYear&&year<=(feature.toYear??Infinity);
export function retainingWallFootprints(lines,width,accessRoutes=[]){return lines.flatMap(line=>line.slice(1).flatMap((b,i)=>{const a=line[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(L),nx=-(b[1]-a[1])/L*width/2,ny=(b[0]-a[0])/L*width/2,out=[];for(let k=0;k<steps;k++){const A=[a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps],B=[a[0]+(b[0]-a[0])*(k+1)/steps,a[1]+(b[1]-a[1])*(k+1)/steps],e=(A[0]+B[0])/2,n=(A[1]+B[1])/2;if(accessRoutes.some(r=>nearestRoute(e,n,r.points).distance<r.width/2+width/2+.8))continue;out.push([[A[0]+nx,A[1]+ny],[B[0]+nx,B[1]+ny],[B[0]-nx,B[1]-ny],[A[0]-nx,A[1]-ny]]);}return out;}));}
export function prepareUrbanLayout(config,frame){
 const convert=p=>{const q=townToUTM(...p,frame);return[q.easting,q.northing];};
 const routes=config.routes.map(r=>({...r,points:r.utmPoints??r.townPoints.map(convert),historicalWidth:null,positionConfidence:'C'}));
 const ravine={...config.ravine,points:config.ravine.townPoints.map(convert),historicalDepth:null};
 const sites=config.sites.map(s=>({...s,...(s.townPolygon?{polygonUTM:s.townPolygon.map(convert)}:{}),anchor:s.utmAnchor??convert(s.townAnchor),historicalFootprint:null,historicalHeight:null,inventoryIncrement:0}));
 return {...config,routes,ravine,sites,frame};
}
export function urbanGround(e,n,height,data){
 const r=data.ravine,d=nearestRoute(e,n,r.points).distance,half=r.width/2;
 if(d>half+4)return height;
 const factor=d<=half*.5?1:Math.max(0,(half+4-d)/(half*.5+4));
 return height-r.depth*factor;
}
export function segmentsCross(a,b,c,d){
 const cross=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);
 return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;
}
