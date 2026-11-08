// Rebuild the study geometry from the archived redrawing. No external data or source images are changed.
import {readFile,writeFile} from 'node:fs/promises';
import {planPixelToUTM,traceUTM,traceCenter,traceBounds} from '../src/plan1748-layout.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,'')),save=(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const plan=await read('data/plan-1748.json'),littoral=await read('data/littoral-1800.json'),urban=await read('data/urban-fabric.json');
const tr=plan.tracing;
if(!tr)throw Error('Missing reviewed pixel traces');
const source={text:'Traça manual del redibuix de 1748: mateixa transformació que la superposició (ancoratge a la Torre, 0,101 m/px, 161°). Sense desplaçaments individuals. Ajust relatiu al dibuix; coordenades absolutes C, ±15 m; no és una mesura històrica.',url:null,precisionMeters:15};
for(const feature of tr.existing){
  const points=traceUTM(feature.pixels,plan),anchor=traceCenter(points),site=feature.layer==='littoral'?littoral.sites.find(s=>s.id===feature.id):urban.sites.find(s=>s.id===feature.id);
  const s=site??{id:feature.id,name:feature.name,kind:feature.kind,fromYear:1778,height:feature.height??3.8};
  Object.assign(s,{planLetter:feature.letter,planPixels:feature.pixels,positionSource:source});
  if(feature.layer==='littoral'){
    s.anchor=anchor;s.footprintUTM=points;s.alongAzimuthDegrees=180-plan.georeference.rotationDegrees;
    if(s.kind==='tower'){
      Object.assign(s,traceBounds(points,anchor,s.alongAzimuthDegrees));s.existingWidth=s.width/2;
      s.state='Torre traçada al redibuix de 1748: part A existent i porció O projectada; reparació posterior representada des de 1780. Alçària i obertures C.';
    }
  }else{
    s.utmAnchor=anchor;s.alongAzimuthDegrees=0;
    if(feature.line){s.lineUTM=points;s.polygonUTM=undefined;}
    else s.polygonUTM=points;
    Object.assign(s,traceBounds(points,anchor,0));
    if(!site)urban.sites.push(s);
  }
  s.evidence=`Plànol de 1748, ${feature.letter}: ${feature.name??s.name}. Planta traçada al redibuix aportat; alçària, obertures i persistència posterior C.`;
}
const coast=traceUTM(tr.coastPixels,plan); // Ordered north to south in UTM, with the original re-entrant bends retained.
littoral.roquerCoast=coast;
const north=Math.max(...coast.map(p=>p[1])),south=Math.min(...coast.map(p=>p[1]));
littoral.shorelineStudy=[...littoral.shorelineStudy.filter(p=>p[1]>north+1),...coast,...littoral.shorelineStudy.filter(p=>p[1]<south-1)];
littoral.shorelineNote='Traça del peu del cantell del Roquer al redibuix de 1748, amb entrants i sortints; mateixa transformació que els edificis. Enllaços amb la costa general C. No equival a una línia de marees mesurada.';
littoral.plan1748Project=tr.project.map(f=>({...f,anchor:traceCenter(traceUTM(f.pixels,plan)),footprintUTM:traceUTM(f.pixels,plan),geometryConfidence:'C',projectOnly:true}));
const battery=littoral.sites.find(s=>s.id==='battery');
battery.anchor=planPixelToUTM(...tr.laterBatteryAnchorPixel,plan);littoral.battery.anchor=battery.anchor;littoral.battery.frontAzimuthDegrees=270-plan.georeference.rotationDegrees;
battery.positionSource={...source,text:source.text+' Centre i eix de la bateria posterior ajustats al sector H; es conserva la planta T-6/8 de vuit canons, diferent del projecte de 1748.'};
for(const[id,pixel,w,d]of[['cistern',[564,406],4.5,5],['quarters',[750,362],7,7]]){
  const s=littoral.sites.find(s=>s.id===id);s.anchor=planPixelToUTM(...pixel,plan);s.width=w;s.depth=d;s.alongAzimuthDegrees=180-plan.georeference.rotationDegrees;delete s.footprintUTM;
  s.positionSource={...source,text:source.text+' Emplaçament d’assaig de les obres posteriors dins del sector funcional corresponent; no prova identitat amb la peça projectada el 1748.'};
  s.evidence=s.evidence.split(' Reajust espacial al sector de servei')[0]+' Reajust espacial al sector de servei del redibuix, sense atribuir execució al projecte de 1748.';
}
plan.features.waterline=coast;plan.features.existing=tr.existing.map(f=>({id:f.id,letter:f.letter,utm:traceCenter(traceUTM(f.pixels,plan)),footprintUTM:f.line?null:traceUTM(f.pixels,plan)}));
const tower=littoral.sites.find(s=>s.id==='tower');
plan.features.tower={utm:tower.anchor,width:tower.width,depth:tower.depth,alongAzimuthDegrees:tower.alongAzimuthDegrees};
plan.features.towerExisting={utm:planPixelToUTM(898.5,445.5,plan),width:tower.existingWidth,depth:tower.depth,alongAzimuthDegrees:tower.alongAzimuthDegrees};
plan.features.towerRebuilt={utm:planPixelToUTM(861.5,445.5,plan),width:tower.width-tower.existingWidth,depth:tower.depth,alongAzimuthDegrees:tower.alongAzimuthDegrees};
plan.features.well={utm:littoral.sites.find(s=>s.id==='well').anchor};
plan.built.note='La bateria parcial posterior conserva la planta T-6/8, orientada i centrada sobre el sector H. Les plantes H–O del projecte de 1748 es poden consultar com a traça daurada, sense atribuir-los execució.';
await save('data/littoral-1800.json',littoral);await save('data/urban-fabric.json',urban);await save('data/plan-1748.json',plan);await save('public/data/plan-1748.json',plan);
console.log(JSON.stringify({existing:tr.existing.length,project:littoral.plan1748Project.length,coastVertices:coast.length}));
