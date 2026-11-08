import{test}from'node:test';
import assert from'node:assert/strict';
import{readFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import * as THREE from'three';
import{carpanell,PORXO_STUDY}from'../src/porxo-plan.mjs';
import{porticoPlan}from'../src/domestic-plan.mjs';
import{makeHousing}from'../src/housing.ts';
import{porxosEvidenceHTML}from'../src/porxos-evidence.ts';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
test('basket arch has symmetric finite three-centred geometry, continuous tangent and the intended rise',()=>{
 for(const[a,b]of[[3.2,1.4],[2.1,1.0],[.96,.52]]){
  const start=carpanell(a,b,0),top=carpanell(a,b,.5),end=carpanell(a,b,1);
  assert.ok(Math.abs(start.x+a)<1e-9&&Math.abs(end.x-a)<1e-9);assert.ok(Math.abs(top.x)<1e-9&&Math.abs(top.y-b)<1e-9);
  for(let i=1;i<1000;i++){const p=carpanell(a,b,i/1000),q=carpanell(a,b,1-i/1000),prev=carpanell(a,b,(i-1)/1000);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(Math.abs(p.x+q.x)<1e-8&&Math.abs(p.y-q.y)<1e-8);assert.ok(Math.abs(Math.hypot(p.nx,p.ny)-1)<1e-9);assert.ok(Math.hypot(p.nx-prev.nx,p.ny-prev.ny)<.08);}
 }
});
test('detailed porticos have masonry and stone courses, an empty pedestrian opening and a free upper silhouette',async()=>{
 const data=await json('housing.json'),meta=await json('town-terrain.json'),b=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
 const scene=makeHousing(data,meta,h,v);
 for(const s of data.structures.filter(s=>s.group==='royal-portico')){const g=scene.children.find(o=>o.userData.structureId===s.id),p=porticoPlan(s);g.position.set(0,0,0);g.rotation.set(0,0,0);g.updateMatrixWorld(true);
  const study=g.userData.photoComparison.study;assert.equal(g.userData.photoComparison.photo.visible,false);
  assert.equal(g.userData.porxoStudy.frontFloorsAdded,false);assert.ok(study.children.some(o=>o.material.name==='porxo-masonry'));assert.ok(study.children.some(o=>o.material.name==='porxo-stone'));assert.equal(study.children.some(o=>o.material.name==='roof'),false);
  const cross=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,p.fz+1),new THREE.Vector3(0,0,-1),0,2).intersectObject(study,true);
  assert.equal(cross(0,1.65).length,0,'pedestrian opening');assert.ok(cross(p.piers[0].x,1).length>0,'physical pier');assert.equal(cross(0,p.top+1).length,0,'no speculative upper facade over the arcade');
 }
 assert.equal(PORXO_STUDY.historicalDimensions,null);
});
test('photographic evidence keeps its real dates, credits and image hashes without assigning later forms to 1800 as measured facts',async()=>{
 const d=await json('porxos-study.json');assert.equal(d.state1800Verified,false);assert.equal(d.historicalDimensions,null);assert.equal(d.surveyedIndividualBayCount,null);assert.equal(d.workingGeometry.confidence,'C');
 assert.equal(d.references.find(r=>r.id==='P01').year,1916);assert.equal(d.references.find(r=>r.id==='P07').year,null);
 for(const[file,hash]of Object.entries(d.imageSha256)){const b=await readFile(new URL('../public/data/reference/'+file,import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),hash);}
 assert.ok(d.references.find(r=>r.id==='P01').archive.includes('Salvany'));
 assert.equal(d.descriptions.length,6);
 for(const section of d.descriptions){assert.ok(section.sourceRefs.length);for(const id of section.sourceRefs)assert.ok(d.references.some(r=>r.id===id),`unresolved evidence ${id}`);}
 const html=porxosEvidenceHTML(d,'/atles/','Arcada <06>');
 assert.ok(html.includes('Arcada &lt;06&gt;'));assert.ok(html.includes('/atles/data/reference/porxos-salvany-1916.jpg'));
 for(const r of d.references){assert.ok(html.includes(`id="porxos-source-${r.id}"`));if(r.url)assert.ok(html.includes(r.url));}
});
