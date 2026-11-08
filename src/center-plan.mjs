import {townToUTM} from './housing-plan.mjs';
import {planToUTM} from './building-plan.mjs';
export function generateCenterLayout(config,frame,housing){
  const bearings={east:90,west:-90,north:0,south:180},replaced=new Set();
  return config.sites.map(site=>{
    for(const id of site.replacesHousingIds??[]){
      if(replaced.has(id)||!housing.some(s=>s.id===id&&s.reservation))throw new Error('Invalid housing replacement '+id);
      replaced.add(id);
    }
    const s={...site,anchor:townToUTM(site.across,site.along,frame),frontAzimuthDegrees:(frame.alongAzimuthDegrees+bearings[site.front]+360)%360,
      geometryConfidence:'C',individualPositionConfidence:'C',state1800:null,historicalBaseElevation:null};
    s.footprintUTM=[[-s.width/2,s.depth/2],[s.width/2,s.depth/2],[s.width/2,-s.depth/2],[-s.width/2,-s.depth/2]].map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
    if(s.planBodies)s.bodyFootprintsUTM=s.planBodies.map(poly=>poly.map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees)));
    if(s.planOutline)s.planOutlineUTM=s.planOutline.map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
    if(s.layoutAlias)s.footprintUTM=[];
    return s;
  });
}
export function worldToTown(e,n,frame){
  const r=frame.alongAzimuthDegrees*Math.PI/180,x=e-frame.easting,y=n-frame.northing;
  return {across:x*Math.cos(r)-y*Math.sin(r),along:x*Math.sin(r)+y*Math.cos(r)};
}
export function isPublicGround(across,along,space){
  const p=space.plaza,c=space.crossAxis;
  return (Math.abs(across)<=p.halfWidth&&along>=p.south&&along<=p.north)||
    (along<p.south&&Math.hypot(across,along-p.south)<=p.exedraRadius)||
    (across>=c.west&&across<=c.east&&Math.abs(along)<=c.halfWidth)||
    (!!p.passage&&Math.abs(across)<=p.passage.halfWidth&&along<=p.south&&along>=p.passage.south);
}
