import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {walkStep,footprintBlocked,walkingSurface} from '../src/walk-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const urban=await json('urban-fabric.json'),littoral=await json('littoral.json'),meta=await json('terrain.json');
const raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
const sample=(e,n)=>sampleHeight(meta,h,v,e,n),surface=(e,n)=>walkingSurface(e,n,sample,urban,littoral);
test('a long movement cannot tunnel through a thin building wall; circular clearance and sliding work',()=>{
 const polygons=[[[2,-2],[2.15,-2],[2.15,2],[2,2]]];
 const r=walkStep([0,0],20,0,()=>0,polygons);assert.ok(r.position[0]<1.69&&r.position[0]>1.5);assert.equal(r.blocked,true);
 assert.equal(footprintBlocked(1.8,0,polygons),true);assert.equal(footprintBlocked(1,0,polygons),false);
 const slide=walkStep([1.6,-1],1,1,()=>0,polygons);assert.ok(slide.position[0]<1.69&&slide.position[1]>-.2);
});
test('NoData, water and abrupt vertical cliffs stop walking without altering height data',()=>{
 const noData=walkStep([0,0],6,0,(e,n)=>e<2?0:null,[]);assert.ok(noData.position[0]<2);
 const cliff=walkStep([0,0],6,0,e=>e<2?0:5,[]);assert.ok(cliff.position[0]<2);assert.equal(cliff.height,0);
 assert.equal(surface(298000,4499000),null);assert.equal(walkingSurface(1,1,()=>null,urban,littoral),null);
 const before=new Float32Array(h);for(let i=0;i<100;i++)surface(296389+i*.05,4499364);assert.deepEqual(h,before);
});
test('real bridge and both pier decks support the walker above their water/ravine; hidden decks do not',()=>{
 const b=urban.sites.find(s=>s.kind==='bridge');assert.equal(surface(...b.anchor),b.technicalBaseElevation+.6);
 for(const line of littoral.portWorks.breakwaters){const a=line[0],b=line[1],p=[(a[0]+b[0])/2,(a[1]+b[1])/2];assert.equal(surface(...p),littoral.portWorks.top);assert.equal(walkingSurface(...p,sample,urban,littoral,{port:false}),null);}
 assert.ok(walkingSurface(...b.anchor,sample,urban,littoral,{bridge:false})<b.technicalBaseElevation);
});
test('the real plaza spawn and the complete street axis remain walkable outside occupied footprints',async()=>{
 const housing=await json('housing.json'),center=await json('center.json'),removed=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[])),polygons=[...housing.structures.filter(s=>!removed.has(s.id)),...center.sites].map(s=>s.footprintUTM);
 const route=urban.routes.find(s=>s.id==='carrer-major'),start=route.points[0],end=route.points[1];
 assert.equal(footprintBlocked(296389,4499364,polygons),false);assert.notEqual(surface(296389,4499364),null);
 const result=walkStep(start,end[0]-start[0],end[1]-start[1],surface,polygons);assert.ok(Math.hypot(result.position[0]-end[0],result.position[1]-end[1])<.01);
});
