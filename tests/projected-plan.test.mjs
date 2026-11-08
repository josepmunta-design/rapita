import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import * as THREE from'three';
import{referenceUTM,referenceOverlayData}from'../src/reference-layout.mjs';import{makeProjectedPlan,makePlan1748,planToUTM}from'../src/plan1748.ts';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const reference=await read('data/layout-reference-1800.json'),housing=await read('public/data/housing.json'),data=await read('public/data/plan-reverte.json');
test('Pilar overlay matches the exact transform used by the traced buildings and gardens',()=>{
 assert.deepEqual(data,referenceOverlayData(reference,housing.townFrame));assert.equal(data.georeference.confidence,'C');assert.equal(data.georeference.rotationDegrees,-1);
 const g=data.georeference,p={rotation:g.rotationDegrees,scale:g.metersPerPixel,dE:0,dN:0};
 for(const point of[[0,0],...reference.compounds['cases-talavera'].flat(),...reference.gardens['hort-monges'],...reference.canal]){
  const a=planToUTM(...point,data,p),b=referenceUTM(point,reference,housing.townFrame);assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);
 }
});
test('the cropped projection follows the sampled ground, preserves north-facing UVs and only moves the image',()=>{
 const origin={easting:296389,northing:4499364,elevation:0},g=data.georeference,p={rotation:g.rotationDegrees,scale:g.metersPerPixel,dE:0,dN:0},before=JSON.stringify(housing);
 let tide=1;const sample=(e,n)=>Math.max(tide,(e-origin.easting)*.012+(n-origin.northing)*.009),plan=makeProjectedPlan(data,new THREE.Texture(),origin,sample);
 plan.update(p);const pos=plan.mesh.geometry.attributes.position,uv=plan.mesh.geometry.attributes.uv;
 for(let i=0;i<pos.count;i++){const e=pos.getX(i)+origin.easting,n=origin.northing-pos.getZ(i);assert.ok(Math.abs(pos.getY(i)-sample(e,n)-.5)<1e-4);}
 assert.equal(uv.getX(0),0);assert.equal(uv.getY(0),1);assert.ok(Math.abs(uv.getY(uv.count-1)-(1-590/736))<1e-7);
 const x=pos.getX(0),z=pos.getZ(0);plan.update({...p,dE:12,dN:-7});assert.ok(Math.abs(pos.getX(0)-x-12)<1e-4);assert.ok(Math.abs(pos.getZ(0)-z-7)<1e-4);
 tide=25;plan.update(p);assert.ok(pos.getY(0)>=25.5);assert.equal(JSON.stringify(housing),before);assert.equal(plan.mesh.visible,false);assert.equal(plan.mesh.material.depthWrite,false);assert.equal(makePlan1748,makeProjectedPlan);
});
test('ink-only comparison filters white paper and keeps opacity reversible',()=>{
 const plan=makeProjectedPlan(data,new THREE.Texture(),{easting:0,northing:0,elevation:0},()=>0),shader={uniforms:{},fragmentShader:'#include <map_fragment>'};plan.mesh.material.onBeforeCompile(shader,{});
 assert.ok(shader.fragmentShader.includes('planLuma'));plan.setPaperVisible(false);assert.equal(shader.uniforms.planPaperFilter.value,1);plan.setPaperVisible(true);assert.equal(shader.uniforms.planPaperFilter.value,0);
 plan.setOpacity(.35);assert.equal(plan.mesh.material.opacity,.35);plan.setOpacity(3);assert.equal(plan.mesh.material.opacity,1);
});
