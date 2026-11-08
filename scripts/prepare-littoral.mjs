import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {sampleHeight} from '../src/geo.mjs';
import {landscapeSample,batteryOutline,nearestRoute} from '../src/littoral-plan.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const config=await json('data/littoral-1800.json'),meta=await json('public/data/terrain.json');
config.researchLandscape=await json('data/pilar-reverte.json');
const raw=await readFile(new URL('public/data/'+meta.heights,root)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('public/data/'+meta.validity,root));
const asciiPath=new URL('docs/sources/canal-region.asc',root);
let ascii;try{ascii=await readFile(asciiPath,'utf8');}catch{
  try{await copyFile(new URL('tmp/terrain/canal-region.asc',root),asciiPath);ascii=await readFile(asciiPath,'utf8');}catch{
    const url=(await readFile(new URL('docs/sources/canal-region-request.txt',root),'utf8')).trim();const response=await fetch(url);ascii=await response.text();if(!ascii.startsWith('NCOLS'))throw Error('WCS response is not an ASCII grid');await writeFile(asciiPath,ascii);
  }
}
const tokens=ascii.trim().split(/\s+/),header={};for(let i=0;i<12;i+=2)header[tokens[i].toLowerCase()]=Number(tokens[i+1]);
const width=header.ncols,height=header.nrows,step=header.cellsize,values=tokens.slice(12).map(Number);
if(width!==72||height!==206||step!==50||values.length!==width*height)throw Error('Unexpected regional grid');
const heights=new Float32Array(values.length),valid=new Uint8Array(values.length);let minimum=Infinity,maximum=-Infinity;
for(let i=0;i<values.length;i++){if(Number.isFinite(values[i])&&values[i]!==header.nodata_value){heights[i]=values[i];valid[i]=1;minimum=Math.min(minimum,values[i]);maximum=Math.max(maximum,values[i]);}}
await mkdir(new URL('public/data',root),{recursive:true});
await writeFile(new URL('public/data/region.f32',root),new Uint8Array(heights.buffer));await writeFile(new URL('public/data/region.valid.u8',root),valid);
await writeFile(new URL('public/data/region.json',root),JSON.stringify({version:1,crs:'EPSG:25831',width,height,step,west:header.xllcorner+step/2,north:header.yllcorner+(height-.5)*step,origin:meta.origin,validCount:valid.reduce((s,v)=>s+v,0),sampleCount:valid.length,minimum,maximum,heights:'region.f32',validity:'region.valid.u8',source:'ICGC WCS icc:met · cobertura contemporània multiresolució',sourceSha256:createHash('sha256').update(ascii).digest('hex'),verticalDatum:'Cotes natives WCS; equivalència vertical amb el LiDAR local pendent de contrastar.',sampling:'Pas de 50 m; no és un aixecament del canal. Unió tècnica al límit de la malla local sense canviar els fitxers originals.'},null,2)+'\n');
for(const site of config.sites){
  const r=(180-config.battery.frontAzimuthDegrees)*Math.PI/180,a=-(site.alongAzimuthDegrees??0)*Math.PI/180;
  const points=site.kind==='battery'?batteryOutline(config.battery.planWidth).map(([x,z])=>[site.anchor[0]+x*Math.cos(r)+z*Math.sin(r),site.anchor[1]+x*Math.sin(r)-z*Math.cos(r)]):site.footprintUTM??[[-1,-1],[-1,1],[1,1],[1,-1]].map(([x,z])=>[site.anchor[0]+x*(site.width??8)/2*Math.cos(a)+z*(site.depth??8)/2*Math.sin(a),site.anchor[1]+x*(site.width??8)/2*Math.sin(a)-z*(site.depth??8)/2*Math.cos(a)]);
  site.footprintUTM=points;
  const levels=points.map(([e,n])=>{const sample=sampleHeight(meta,h,v,e,n);if(sample===null)throw Error('Missing terrain at '+site.id);return landscapeSample(e,n,sample,config).height;});
  site.technicalBaseElevation=site.kind==='health'?config.studyWaterElevation+.85:site.kind==='well'?Math.max(config.studyWaterElevation+.15,...levels)+.08:Math.max(...levels)+.08;site.geometryConfidence='C';site.historicalFootprint=null;site.historicalHeight=null;site.state1800=null;
}
config.battery.outlineStudy=batteryOutline(config.battery.planWidth);
config.canal.studyLengthMeters=nearestRoute(...config.canal.routeStudy[0],config.canal.routeStudy).length;
await writeFile(new URL('public/data/littoral.json',root),JSON.stringify(config,null,2)+'\n');
await writeFile(new URL('public/data/chronology.json',root),JSON.stringify(await json('data/chronology.json'),null,2)+'\n');
console.log(JSON.stringify({regionalSamples:valid.length,canalStudyLength:config.canal.studyLengthMeters,sites:config.sites.length,boats:config.boats.length}));

const urban=await json('data/urban-chronology.json'),town=await json('public/data/town-terrain.json');
const tb=await readFile(new URL('public/data/'+town.heights,root)),th=new Float32Array(tb.buffer.slice(tb.byteOffset,tb.byteOffset+tb.byteLength)),tv=await readFile(new URL('public/data/'+town.validity,root));
urban.structures=[];
for(let i=0;i<urban.count;i++){
  const e=urban.placement.easting+(i%urban.placement.columns)*urban.placement.spacingEasting,n=urban.placement.northing+Math.floor(i/urban.placement.columns)*urban.placement.spacingNorthing,t=urban.typology;
  const levels=[];for(const x of[-t.width/2,t.width/2])for(const z of[-t.depth/2,t.depth/2]){const level=sampleHeight(town,th,tv,e+x,n+z);if(level===null)throw Error('Early housing without terrain');levels.push(level);}
  urban.structures.push({id:urban.id+'-'+String(i+1).padStart(2,'0'),group:'rental-cohort',kind:'large',anchor:{easting:e,northing:n},across:0,along:0,...t,frontAzimuthDegrees:180,state1794:'identity-unknown',renderState:i<urban.studyFinishedCount1789?'finished':'roofed-unfinished',geometryConfidence:'C',individualPositionConfidence:'C',identityWith1794:null,terrain:{minimum:Math.min(...levels),maximum:Math.max(...levels),technicalBaseElevation:Math.max(...levels)+.08}});
}
await writeFile(new URL('public/data/urban-chronology.json',root),JSON.stringify(urban,null,2)+'\n');

await mkdir(new URL('public/data/reference/',root),{recursive:true});
for(const file of['t-6-8.jpg','T0009734.jpg'])await copyFile(new URL(file,root),new URL('public/data/reference/'+file,root));

const interpretations=await json('data/interpretations.json'),monuments=await json('public/data/monuments.geojson');
for(const feature of monuments.features)Object.assign(feature.properties,interpretations[feature.properties.id]);
await writeFile(new URL('public/data/monuments.geojson',root),JSON.stringify(monuments,null,2)+'\n');
