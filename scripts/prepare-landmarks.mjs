import {readFile,writeFile} from 'node:fs/promises';
import {sampleHeight} from '../src/geo.mjs';
import {planToUTM} from '../src/building-plan.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const data=await json('data/landmarks.json'),meta=await json('public/data/terrain.json');
const raw=await readFile(new URL('public/data/'+meta.heights,root)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('public/data/'+meta.validity,root));
for(const s of data.sites){
  const points=[];
  if(s.kind==='pavilion'){
    for(let i=0;i<48;i++){const a=i*Math.PI/24;points.push([s.radius*Math.sin(a),s.radius*Math.cos(a)]);}
    for(const x of[-s.annexWidth/2,s.annexWidth/2])for(const z of[-s.radius+.7,-s.radius+.7-s.annexDepth])points.push([x,z]);
  }else for(const x of[-s.baseWidth/2,s.baseWidth/2])for(const z of[-s.baseWidth/2,s.baseWidth/2])points.push([x,z]);
  s.supportFootprint=points;s.footprintUTM=points.map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
  const levels=s.footprintUTM.map(([e,n])=>{const height=sampleHeight(meta,h,v,e,n);if(height===null)throw Error('Missing landmark terrain: '+s.id);return height;});
  s.terrain={minimum:Math.min(...levels),maximum:Math.max(...levels),technicalBaseElevation:Math.max(...levels)+.08};
}
await writeFile(new URL('public/data/landmarks.json',root),JSON.stringify({...data,sourceSha256:meta.sourceSha256},null,2)+'\n');
console.log(JSON.stringify({landmarks:data.sites.map(s=>s.id)}));

await writeFile(new URL('public/data/chronology.json',root),JSON.stringify(await json('data/chronology.json'),null,2)+'\n');
const interpretations=await json('data/interpretations.json'),monuments=await json('public/data/monuments.geojson');
for(const feature of monuments.features)Object.assign(feature.properties,interpretations[feature.properties.id]);
await writeFile(new URL('public/data/monuments.geojson',root),JSON.stringify(monuments,null,2)+'\n');
