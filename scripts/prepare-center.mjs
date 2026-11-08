import {readFile,writeFile} from 'node:fs/promises';
import {generateCenterLayout} from '../src/center-plan.mjs';
import {planToUTM} from '../src/building-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const config=await json('data/center-1794.json'),housing=await json('public/data/housing.json'),meta=await json('public/data/town-terrain.json');
const buffer=await readFile(new URL('public/data/'+meta.heights,root)),heights=new Float32Array(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength));
const valid=await readFile(new URL('public/data/'+meta.validity,root));
const sites=generateCenterLayout(config,housing.townFrame,housing.structures);
for(const s of sites){
  const samples=[];
  for(let x=-s.width/2;x<=s.width/2+1e-6;x+=1)for(let z=-s.depth/2;z<=s.depth/2+1e-6;z+=1){
    const[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),h=sampleHeight(meta,heights,valid,e,n);
    if(h===null)throw new Error('Centro sin terreno '+s.id);samples.push(h);
  }
  s.terrain={minimum:Math.min(...samples),maximum:Math.max(...samples),technicalBaseElevation:Math.max(...samples)+.08};
}
await writeFile(new URL('public/data/center.json',root),JSON.stringify({...config,townFrame:housing.townFrame,sourceSha256:meta.sourceSha256,sites},null,2)+'\n');
console.log(JSON.stringify({sites:sites.length,replacedHousingIds:sites.flatMap(s=>s.replacesHousingIds??[]),technicalGroundSpans:sites.map(s=>[s.id,+(s.terrain.maximum-s.terrain.minimum).toFixed(2)])},null,2));
