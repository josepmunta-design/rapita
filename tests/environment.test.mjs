import{test}from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{environmentPlan}from'../src/environment-plan.mjs';
import{makeEnvironment}from'../src/environment.ts';
import{walkingSurface}from'../src/walk-plan.mjs';
import{sampleHeight}from'../src/geo.mjs';
import{nearestRoute}from'../src/littoral-plan.mjs';
import{worldToTown,isPublicGround}from'../src/center-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const housing=await json('housing.json'),center=await json('center.json'),urban=await json('urban-fabric.json'),littoral=await json('littoral.json'),meta=await json('terrain.json'),town=await json('town-terrain.json');
const arrays=async m=>{const b=await readFile(new URL('../public/data/'+m.heights,import.meta.url)),v=await readFile(new URL('../public/data/'+m.validity,import.meta.url));return[new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),v];};
const[h,v]=await arrays(meta),[th,tv]=await arrays(town),sample=(e,n)=>walkingSurface(e,n,(e,n)=>sampleHeight(town,th,tv,e,n)??sampleHeight(meta,h,v,e,n),urban,littoral);
test('environment detail is reproducible, stays on dry surveyed ground and keeps paths and the public plaza clear',()=>{
 const before=Buffer.from(h.buffer),data=JSON.stringify([housing,center,urban,littoral]),p=environmentPlan(urban,littoral,housing,center,sample);assert.deepEqual(p,environmentPlan(urban,littoral,housing,center,sample));
 assert.ok(p.shrubs.length>30);assert.ok(p.stones.length>250);assert.equal(p.pots.length,40);assert.equal(p.confidence,'C');
 for(const o of[...p.shrubs,...p.stones,...p.pots]){assert.ok(Object.values(o).every(Number.isFinite));assert.notEqual(sample(o.e,o.n),null);assert.ok(Math.abs(o.height-sample(o.e,o.n))<.04);}
 for(const o of p.shrubs){const t=worldToTown(o.e,o.n,housing.townFrame);assert.equal(isPublicGround(t.across,t.along,center.publicSpace),false);for(const road of urban.routes)assert.ok(nearestRoute(o.e,o.n,road.points).distance>=road.width/2+1.3);}
 for(const o of[...p.shrubs,...p.stones]){assert.equal(Math.abs(o.e-296516)<43&&Math.abs(o.n-4499184)<3,false);assert.equal(Math.abs(o.e-296574)<3&&Math.abs(o.n-4499247)<36,false);}
 assert.deepEqual(Buffer.from(h.buffer),before);assert.equal(JSON.stringify([housing,center,urban,littoral]),data);
});
test('environment instances and harbour props have finite geometry and low meshes are shared across instances',()=>{
 const scene=makeEnvironment(urban,littoral,housing,center,meta,sample);assert.equal(scene.plants.children.length,3);assert.equal(scene.courtyards.children[0].count,40);assert.equal(scene.docks.children.length,4);
 scene.root.traverse(o=>{if(o.isMesh||o.isLineSegments){assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));if(o.isInstancedMesh)assert.ok([...o.instanceMatrix.array].every(Number.isFinite));}});
});
