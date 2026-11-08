import {coastDistance,landscapeSample,nearestRoute} from './littoral-plan.mjs';
import {inPolygon} from './harbour-plan.mjs';
// Position relationships only. No shoreline expansion, parcel survey or inferred reclaimed land.
export function alignGypsumToInn(urban,littoral){
 const workshop=urban.sites.find(s=>s.id==='forn-moli-guix'),inn=littoral.sites.find(s=>s.id==='old-inn');
 if(!workshop||!inn)throw Error('Missing documented Fonda Vella / gypsum relationship');
 const degrees=inn.alongAzimuthDegrees??19,a=degrees*Math.PI/180,gap=3,offset=inn.depth/2+workshop.depth/2+gap;
 workshop.utmAnchor=[inn.anchor[0]+Math.sin(a)*offset,inn.anchor[1]+Math.cos(a)*offset];delete workshop.townAnchor;
 workshop.alongAzimuthDegrees=degrees;
 workshop.relationalPlacement={relativeTo:'old-inn',side:'north',offsetLocalMeters:[0,-offset],gapMeters:gap,geometryConfidence:'C',source:'N112 p.211 · concessió de 1782; p.224'};
 workshop.positionSource={text:'N112 p.211: el forn i molí de guix afronta al nord de la Fonda Vella. Emplaçament relacional C solidari amb la fonda; separació de 3 m i volums són d’assaig, no una distància ni parcel·la documentades.',precisionMeters:15};
 workshop.evidence='N112 p.211 i 224: forn i molí de guix al límit nord de Fonda Vella en la concessió de 1782. Solar individual desconegut. Volum C recol·locat en relació amb la fonda, sense modificar la costa.';
 return workshop;
}
export function alignHealthToQuay(littoral){
 const site=littoral.sites.find(s=>s.id==='health'),line=littoral.portWorks.breakwaters[1],q=nearestRoute(...site.anchor,line);
 let best=null;
 for(let i=0;i<line.length-1;i++){const a=line[i],b=line[i+1],r=nearestRoute(q.easting,q.northing,[a,b]);if(!best||r.distance<best.distance)best={...r,a,b};}
 site.anchor=[q.easting,q.northing];site.alongAzimuthDegrees=Math.atan2(-(best.b[1]-best.a[1]),best.b[0]-best.a[0])*180/Math.PI;
 delete site.footprintUTM;
 site.positionSource={text:'N112 art.18 p.232: oficina de sanitat al cap de la dàrsena. Posició del croquis C conservada, ajustada a l’eix del moll perquè la planta de 5 × 4 m recolzi íntegrament sobre l’amplada tècnica de 4,2 m. Ni posició ni mides històriques mesurades.',precisionMeters:15};
 return site;
}
export function alignWorkerCampToBank(urban,littoral){
 const site=urban.sites.find(s=>s.id==='barraques-obrers');if(!site)return null;
 const referencePoint=site.relationalPlacement?.referencePoint??site.utmAnchor,route=littoral.canal.routeStudy,q=nearestRoute(...referencePoint,route);
 let best=null;for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1],r=nearestRoute(q.easting,q.northing,[a,b]);if(!best||r.distance<best.distance)best={...r,a,b};}
 const dx=best.b[0]-best.a[0],dn=best.b[1]-best.a[1],L=Math.hypot(dx,dn),offset=littoral.canal.studyWidth/2+site.depth/2+3;
 site.utmAnchor=[q.easting-dn/L*offset,q.northing+dx/L*offset];delete site.townAnchor;
 site.alongAzimuthDegrees=Math.atan2(-dn,dx)*180/Math.PI;
 site.relationalPlacement={relativeTo:'canal.routeStudy',referencePoint,bank:'west',bankGapMeters:3,geometryConfidence:'C',source:'N029 · 13/11/1780'};
 site.positionSource={text:'N029, 13/11/1780: dotze barraques a les vores del canal. Dues fileres paral·leles a la riba occidental del canal d’assaig; separació, costat i lloc individual C. El conjunt no travessa el llit ni altera el traçat de l’aigua.',precisionMeters:30};
 return site;
}
export function workerHutsPlan(site){return Array.from({length:12},(_,i)=>({id:site.id+'-'+(i+1),x:-site.width/2+2.6+i%6*(site.width-5.2)/5,z:-site.depth/2+2.2+Math.floor(i/6)*(site.depth-4.4),width:3.4,depth:4.2}));}
export function workerHutFootprints(site,frame){const a=(site.alongAzimuthDegrees??frame.alongAzimuthDegrees)*Math.PI/180;return workerHutsPlan(site).map(h=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>{x=h.x+x*h.width/2;z=h.z+z*h.depth/2;return[site.anchor[0]+x*Math.cos(a)-z*Math.sin(a),site.anchor[1]-x*Math.sin(a)-z*Math.cos(a)];}));}
export function deckSupport(e,n,data){
 const port=data.portWorks;if(!port||port.top<=data.studyWaterElevation)return null;
 return port.breakwaters.some(line=>nearestRoute(e,n,line).distance<=port.width/2+1e-7)?{kind:'quay',elevation:port.top}:null;
}
export function coastalSupport(e,n,data){
 const deck=deckSupport(e,n,data);if(deck)return deck;
 const ground=landscapeSample(e,n,10,data);
 return !['seabed','bed'].includes(ground.zone)&&ground.height>data.studyWaterElevation?{kind:'land'}:null;
}
export function footprintSamples(poly,spacing=1){
 if(poly.length<3)return[];
 const points=[...poly];
 for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],count=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/spacing);for(let j=1;j<count;j++)points.push([a[0]+(b[0]-a[0])*j/count,a[1]+(b[1]-a[1])*j/count]);}
 const es=poly.map(p=>p[0]),ns=poly.map(p=>p[1]);
 for(let e=Math.min(...es)+spacing/2;e<Math.max(...es);e+=spacing)for(let n=Math.min(...ns)+spacing/2;n<Math.max(...ns);n+=spacing)if(inPolygon(e,n,poly))points.push([e,n]);
 return points;
}
export function coastalBuildingAudit({urban,littoral,housing,center,landmarks},year=1800){
 const kinds=new Set(['forge','guardhouse','service-house','shed','mill','stonehouse','warehouse','lighthouse','farmhouse','farmstead','barracks']);
 const active=s=>(s.fromYear??1778)<=year&&(s.toYear??Infinity)>=year;
 const replaced=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[]));
 const buildings=[...urban.sites.filter(s=>kinds.has(s.kind)&&active(s)),...littoral.sites.filter(s=>!['well','cistern'].includes(s.kind)),...housing.structures.filter(s=>!replaced.has(s.id)),...center.sites.filter(s=>!s.layoutAlias&&!s.kind.startsWith('fountain')),...(landmarks?.sites??[]).filter(active)];
 const entries=buildings.map(s=>{
  const polygons=s.kind==='barracks'?workerHutFootprints(s,urban.frame):s.bodyFootprintsUTM??[s.planOutlineUTM??s.polygonUTM??s.footprintUTM];
  if(polygons.some(p=>!p?.length))throw Error('Missing building footprint: '+s.id);
  const points=polygons.flatMap(p=>footprintSamples(p)),unsupported=points.filter(p=>!coastalSupport(...p,littoral)),quay=points.filter(p=>deckSupport(...p,littoral)).length;
  return {id:s.id,name:s.name??s.id,footprints:polygons.length,samples:points.length,unsupported:unsupported.length,quaySamples:quay,minimumShoreDistance:Math.min(...points.map(p=>coastDistance(...p,littoral))),firstUnsupported:unsupported[0]??null};
 });
 return {year,buildings:entries.length,footprints:entries.reduce((n,s)=>n+s.footprints,0),samples:entries.reduce((n,s)=>n+s.samples,0),unsupportedBuildings:entries.filter(s=>s.unsupported),entries};
}
