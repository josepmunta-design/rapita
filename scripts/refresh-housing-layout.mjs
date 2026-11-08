import {readFile,writeFile} from 'node:fs/promises';
import {generateHousingLayout} from '../src/housing-plan.mjs';
import {planToUTM} from '../src/building-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const config=await json('data/housing-1794.json'),meta=await json('public/data/town-terrain.json'),previous=await json('public/data/housing.json');
const b=await readFile(new URL('public/data/'+meta.heights,root)),h=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),v=await readFile(new URL('public/data/'+meta.validity,root));
const structures=generateHousingLayout(config);
for(const s of structures){
  const fw=s.frontWidth??s.width,bw=s.backWidth??s.width,fz=s.frontZ??s.depth/2,bz=s.backZ??-s.depth/2;
  s.footprintUTM=[[-fw/2,fz],[fw/2,fz],[bw/2,bz],[-bw/2,bz]].map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
  const values=[];
  for(let row=0;row<=Math.ceil(fz-bz);row++){
    const z=bz+(fz-bz)*row/Math.ceil(fz-bz),w=bw+(fw-bw)*(z-bz)/(fz-bz),columns=Math.ceil(w);
    for(let col=0;col<=columns;col++){
      const x=-w/2+w*col/columns,[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),height=sampleHeight(meta,h,v,e,n);if(height===null)throw new Error(s.id+' intersects NoData');values.push(height);
    }
  }
  s.terrain={minimum:Math.min(...values),maximum:Math.max(...values),technicalBaseElevation:Math.max(...values)+.08,historicalElevation:null};
}

await writeFile(new URL('public/data/housing.json',root),JSON.stringify({...config,structures,summary:previous.summary},null,2)+'\n');console.log('Housing placements updated:',structures.length);
