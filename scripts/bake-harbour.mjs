import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {sampleHeight} from '../src/geo.mjs';
import {inHarbourLand} from '../src/harbour-plan.mjs';
const json=async n=>JSON.parse(await readFile('public/data/'+n,'utf8'));
const history=await json('harbour-history.json'),grid=history.terrain;
const sources=await Promise.all(['town-terrain.json','esglesia-terrain.json','terrain.json','context.json'].map(async name=>{const meta=await json(name),b=await readFile('public/data/'+meta.heights),valid=await readFile('public/data/'+meta.validity);return {meta,h:new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),valid};}));
const base=new Float32Array(grid.width*grid.height);
for(let r=0;r<grid.height;r++)for(let c=0;c<grid.width;c++){
 const e=grid.west+c*grid.step,n=grid.north-r*grid.step;let raw=null;
 for(const s of sources){raw=sampleHeight(s.meta,s.h,s.valid,e,n);if(raw!==null)break;}
 base[r*grid.width+c]=raw??-2;
}
await mkdir('public/data/harbour',{recursive:true});
for(const phase of history.phases){const t=performance.now(),h=new Float32Array(base.length);
 for(let r=0;r<grid.height;r++)for(let c=0;c<grid.width;c++){
  const i=r*grid.width+c,e=grid.west+c*grid.step,n=grid.north-r*grid.step;
  // Thin piers are rendered exactly from their polygons; the heightfield stays under them.
  h[i]=inHarbourLand(e,n,phase)?Math.max(base[i],phase.elevation)-.055:Math.min(base[i],-1.5);
 }
 await writeFile('public/data/'+phase.terrainFile,Buffer.from(h.buffer));console.log(phase.fromYear,Math.round(performance.now()-t)+'ms',h.byteLength);
}
