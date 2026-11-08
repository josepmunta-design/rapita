import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateHousingLayout,townToUTM} from '../src/housing-plan.mjs';
import {sampleHeight,terrainIndices} from '../src/geo.mjs';
import {cutCoarsePatch,stitchedPatchIndices} from '../src/lod.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const config=await read('data/housing-1794.json'),data=await read('public/data/housing.json');

test('1794 inventory keeps units, shared buildings and mixed private properties distinct',()=>{
  const structures=generateHousingLayout(config),counts={};
  structures.forEach(s=>counts[s.group]=(counts[s.group]??0)+1);
  assert.deepEqual(counts,{'royal-finished':22,'royal-covered':7,'royal-portico':14,'royal-small-coast':14,'manzana-units':1});
  assert.equal(structures.length,58);
  assert.equal(structures.reduce((n,s)=>n+(s.countedUnits??1),0),81);
  assert.equal(config.inventory.find(s=>s.id==='private-mixed').count,38);
  assert.equal(config.inventory.find(s=>s.id==='private-mixed').render,false);
  assert.equal(structures.filter(s=>s.reservation).length,2);
  assert.deepEqual(structures,generateHousingLayout(config));
});
test('individual plots and 1800 states are not promoted from hypotheses to evidence',()=>{
  for(const s of data.structures){
    assert.equal(s.geometryConfidence,'C');assert.equal(s.individualPositionConfidence,'C');
    assert.equal(s.state1800,null);assert.equal(s.originalHouseNumber,null);assert.equal(s.terrain.historicalElevation,null);
    assert.ok(s.terrain.technicalBaseElevation>s.terrain.maximum);
  }
  const point=townToUTM(0,100,{easting:0,northing:0,alongAzimuthDegrees:0});
  assert.deepEqual(point,{easting:0,northing:100});
  assert.ok(data.structures.filter(s=>s.arcSector).every(s=>s.frontWidth<s.backWidth));
});
test('housing footprints fit native 2 m terrain without intersecting each other',async()=>{
  const meta=await read('public/data/town-terrain.json'),bytes=await readFile(new URL('../public/data/'+meta.heights,import.meta.url));
  const h=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
  const valid=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
  for(const s of data.structures)for(const[e,n]of s.footprintUTM)assert.notEqual(sampleHeight(meta,h,valid,e,n),null,s.id);
  // Separating-axis test on the four convex footprint corners; shared edges may touch.
  const overlap=(a,b)=>[a,b].every(poly=>poly.every((p,i)=>{
    const q=poly[(i+1)%poly.length],axis=[q[1]-p[1],p[0]-q[0]],project=points=>points.map(v=>v[0]*axis[0]+v[1]*axis[1]);
    const x=project(a),y=project(b);return Math.min(Math.max(...x),Math.max(...y))-Math.max(Math.min(...x),Math.min(...y))>1e-5;
  }));
  for(let i=0;i<data.structures.length;i++)for(let j=i+1;j<data.structures.length;j++)assert.equal(overlap(data.structures[i].footprintUTM,data.structures[j].footprintUTM),false,data.structures[i].id+' / '+data.structures[j].id);
});
test('town terrain transition covers its area once and shares native coarse boundary heights',async()=>{
  const coarse=await read('public/data/terrain.json'),fine=await read('public/data/town-terrain.json');
  const cb=await readFile(new URL('../public/data/'+coarse.heights,import.meta.url)),fb=await readFile(new URL('../public/data/'+fine.heights,import.meta.url));
  const cm=await readFile(new URL('../public/data/'+coarse.validity,import.meta.url)),fm=await readFile(new URL('../public/data/'+fine.validity,import.meta.url));
  const before=terrainIndices(coarse.width,coarse.height,cm),after=cutCoarsePatch(coarse,before,fine);
  assert.equal((before.length-after.length)/3,45*50*2);
  const ids=stitchedPatchIndices(fine.width,fine.height,fm,5),edges=new Map();let area=0;
  for(let i=0;i<ids.length;i+=3){
    const[a,b,c]=ids.slice(i,i+3),x=k=>k%fine.width,z=k=>Math.floor(k/fine.width);
    const normal=(z(b)-z(a))*(x(c)-x(a))-(x(b)-x(a))*(z(c)-z(a));assert.ok(normal>0);area+=normal/2;
    for(const[p,q]of[[a,b],[b,c],[c,a]]){const key=[p,q].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)??0)+1);}
  }
  assert.equal(area,(fine.width-1)*(fine.height-1));
  assert.ok([...edges.values()].every(n=>n===1||n===2));
  const boundary=[...edges].filter(([,n])=>n===1);assert.equal(boundary.length,190);
  const coarseVertices=new Set(after);
  for(const[edge]of boundary)for(const i of edge.split(':').map(Number)){
    const x=i%fine.width,z=Math.floor(i/fine.width);assert.ok(x===0||z===0||x===fine.width-1||z===fine.height-1);
    assert.ok(x%5===0&&z%5===0);
    const ci=((coarse.north-fine.north+z*2)/10)*coarse.width+(fine.west-coarse.west+x*2)/10;
    assert.ok(coarseVertices.has(ci));assert.equal(cb.readFloatLE(ci*4),fb.readFloatLE(i*4));
  }
});
