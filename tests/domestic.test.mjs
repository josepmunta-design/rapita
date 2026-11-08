import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {makeHousing} from '../src/housing.ts';
import {makeCenter} from '../src/center.ts';
import {porticoPlan,housingNavigation,centerNavigation,marketPlan,siteUTM,yardPlan} from '../src/domestic-plan.mjs';
import {walkStep,footprintBlocked,walkDistance} from '../src/walk-plan.mjs';
import {sampleHeight,toWorld} from '../src/geo.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const housing=await json('housing.json'),center=await json('center.json'),meta=await json('town-terrain.json'),raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url));
const h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url)),surface=(e,n)=>sampleHeight(meta,h,v,e,n)+.03;
const to=(s,p)=>siteUTM(s,[p])[0];
const group=makeHousing(housing,meta,h,v);group.updateMatrixWorld(true);
test('all ten curved porches connect at terrain level without a shared lateral wall or invisible footprint',()=>{
 const structures=housing.structures.filter(s=>s.arcSector),polys=structures.flatMap(s=>housingNavigation(s).solids);
 for(let i=0;i<structures.length-1;i++){
  const a=structures[i],b=structures[i+1],p=porticoPlan(a),q=porticoPlan(b),start=to(a,[0,p.fz-p.depth*.72]),end=to(b,[0,q.fz-q.depth*.72]);
  const r=walkStep(start,end[0]-start[0],end[1]-start[1],surface,polys);assert.ok(Math.hypot(...r.position.map((x,j)=>x-end[j]))<.03,`${a.id} → ${b.id}`);
  const head=new THREE.Vector3(...toWorld(...start,surface(...start)+1.0,meta.origin)),target=new THREE.Vector3(...toWorld(...end,surface(...end)+1.0,meta.origin)),direction=target.clone().sub(head);
  const ray=new THREE.Raycaster(head,direction.clone().normalize(),.01,direction.length()-.01);assert.equal(ray.intersectObject(group,true).length,0,'rendered walls must also be open');
 }
});
test('straight house porches clear their side passage and still block piers and rear domestic space',()=>{
 for(const s of housing.structures.filter(s=>s.group==='royal-portico')){const p=porticoPlan(s),nav=housingNavigation(s),a=to(s,[-p.fw/2,p.fz-1.05]),b=to(s,[p.fw/2,p.fz-1.05]);
  const result=walkStep(a,b[0]-a[0],b[1]-a[1],surface,nav.solids);assert.ok(Math.hypot(...result.position.map((x,j)=>x-b[j]))<.02,s.id);
  assert.equal(footprintBlocked(...to(s,[0,p.back-1]),nav.solids),true);for(const pier of p.piers)assert.equal(footprintBlocked(...to(s,[pier.x,pier.z]),nav.solids),true);
 }
});
test('the covered plaza allows entering between columns and traversing its gallery, not its back wall',()=>{
 const s=center.sites.find(s=>s.kind==='covered-market'),p=marketPlan(s),nav=centerNavigation(s),start=to(s,[0,s.depth/2+2]),inside=to(s,[0,s.depth/2-2]);
 let r=walkStep(start,inside[0]-start[0],inside[1]-start[1],surface,nav.solids);assert.ok(Math.hypot(...r.position.map((x,j)=>x-inside[j]))<.01);
 const a=to(s,[-s.width/2-1,s.depth/2-2]),b=to(s,[s.width/2+1,s.depth/2-2]);r=walkStep(a,b[0]-a[0],b[1]-a[1],surface,nav.solids);assert.ok(Math.hypot(...r.position.map((x,j)=>x-b[j]))<.01);
 for(const col of p.piers)assert.equal(footprintBlocked(...to(s,[col.x,col.z]),nav.solids),true);
 assert.equal(footprintBlocked(...to(s,[0,-s.depth/2]),nav.solids),true);
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
 const scene=makeCenter(center,meta,h,v,housing);delete globalThis.document;scene.root.updateMatrixWorld(true);
 const eye=new THREE.Vector3(...toWorld(...a,surface(...a)+1,meta.origin)),target=new THREE.Vector3(...toWorld(...b,surface(...b)+1,meta.origin)),direction=target.clone().sub(eye),ray=new THREE.Raycaster(eye,direction.clone().normalize(),.01,direction.length()-.01);
 assert.equal(ray.intersectObject(scene.root,true).length,0,'rendered side walls also leave the gallery open');
});
test('courtyard gates admit the walker while their walls and closed house interiors remain solid',()=>{
 const s=housing.structures.find(s=>s.group==='royal-finished'),yard=yardPlan(s),nav=housingNavigation(s),a=to(s,[0,yard.bz-yard.depth-1]),b=to(s,[0,yard.bz-yard.depth/2]);
 const r=walkStep(a,b[0]-a[0],b[1]-a[1],surface,nav.solids);assert.ok(Math.hypot(...r.position.map((x,j)=>x-b[j]))<.01);
 assert.equal(footprintBlocked(...to(s,[yard.w/2-.1,yard.bz-1]),nav.solids),true);assert.equal(footprintBlocked(...to(s,[0,0]),nav.solids),true);
});
test('construction states, inventory, measured arrays, roof UVs and material normals remain valid',()=>{
 const before=Buffer.from(h.buffer),data=JSON.stringify(housing);
 for(const s of housing.structures){const g=group.children.find(g=>g.userData.structureId===s.id),roof=g.children.find(o=>o.material?.name==='roof');if(s.group==='royal-portico')assert.equal(roof,undefined);else assert.ok(roof);
  assert.equal(g.userData.detailConfidence,'C');if(s.group==='royal-covered')assert.equal(g.children.some(o=>o.material.name==='lime'),false);
  g.traverse(o=>{if(o.isMesh)for(const key of['position','normal','uv'])assert.ok([...o.geometry.attributes[key].array].every(Number.isFinite));});
 }
 assert.deepEqual(Buffer.from(h.buffer),before);assert.equal(JSON.stringify(housing),data);assert.equal(housing.summary.royalInventoryUnits,81);
});
test('walking now covers six metres per second even at five frames per second, with adjustable speed and fast mode',()=>{
 const distance=(fps,speed=6,fast=false)=>Array.from({length:fps},()=>walkDistance(1/fps,speed,fast)).reduce((a,b)=>a+b,0);
 assert.ok(Math.abs(distance(60)-6)<1e-9);assert.ok(Math.abs(distance(5)-6)<1e-9);assert.ok(Math.abs(distance(10,12,true)-24)<1e-9);assert.equal(walkDistance(3,6),1.5);
 const wall=[[[2,-2],[2.1,-2],[2.1,2],[2,2]]],r=walkStep([0,0],walkDistance(.25,12,true),0,()=>0,wall);assert.ok(r.position[0]<1.69);
});
