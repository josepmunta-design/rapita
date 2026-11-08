import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {generateCenterLayout,worldToTown,isPublicGround} from '../src/center-plan.mjs';
import {townToUTM} from '../src/housing-plan.mjs';
import {makeCenter,applyCenterGround} from '../src/center.ts';
import * as THREE from 'three';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const config=await json('data/center-1794.json'),data=await json('public/data/center.json'),housing=await json('public/data/housing.json');

test('center uses nine evidence records and replaces the reserved inn bodies exactly once',()=>{
  const sites=generateCenterLayout(config,housing.townFrame,housing.structures);
  assert.equal(sites.length,9);assert.equal(new Set(sites.map(s=>s.id)).size,9);
  const replaced=sites.flatMap(s=>s.replacesHousingIds??[]);assert.deepEqual(replaced,housing.structures.filter(s=>s.reservation).map(s=>s.id));
  assert.throws(()=>generateCenterLayout({...config,sites:[...config.sites,config.sites.find(s=>s.kind==='inn')]},housing.townFrame,housing.structures),/Invalid housing replacement/);
  for(const s of data.sites){assert.equal(s.geometryConfidence,'C');assert.equal(s.state1800,null);assert.equal(s.historicalBaseElevation,null);assert.equal(s.documented.footprint,null);assert.equal(s.documented.height,null);}
  assert.deepEqual(sites,generateCenterLayout(config,housing.townFrame,housing.structures));
});
test('new central footprints do not overlap each other or the retained houses',()=>{
  const removed=new Set(data.sites.flatMap(s=>s.replacesHousingIds??[])),all=[...data.sites,...housing.structures.filter(s=>!removed.has(s.id))];
  const overlaps=(a,b)=>[a,b].every(p=>p.every((v,i)=>{
    const q=p[(i+1)%p.length],axis=[q[1]-v[1],v[0]-q[0]],proj=points=>points.map(v=>v[0]*axis[0]+v[1]*axis[1]),x=proj(a),y=proj(b);
    return Math.min(Math.max(...x),Math.max(...y))-Math.max(Math.min(...x),Math.min(...y))>1e-5;
  }));
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++)for(const a of all[i].bodyFootprintsUTM??[all[i].footprintUTM])for(const b of all[j].bodyFootprintsUTM??[all[j].footprintUTM])assert.equal(overlaps(a,b),false,all[i].id+' / '+all[j].id);
  for(const s of data.sites)for(const[e,n]of s.footprintUTM){assert.ok(Number.isFinite(e)&&Number.isFinite(n));}
});
test('ground interpretation is reversible and only changes colors, never elevations',async()=>{
  const frame=data.townFrame,p=townToUTM(15,-60,frame),t=worldToTown(p.easting,p.northing,frame);
  assert.ok(Math.abs(t.across-15)<1e-8&&Math.abs(t.along+60)<1e-8);
  assert.equal(isPublicGround(0,0,data.publicSpace),true);assert.equal(isPublicGround(150,150,data.publicSpace),false);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,12,0,200,25,-200],3));g.setAttribute('color',new THREE.Float32BufferAttribute([.5,.6,.4,.5,.6,.4],3));
  const positions=[...g.getAttribute('position').array],colors=[...g.getAttribute('color').array],apply=applyCenterGround(new THREE.Mesh(g),data,housing);
  apply(true);assert.notDeepEqual([...g.getAttribute('color').array],colors);assert.deepEqual([...g.getAttribute('position').array],positions);
  apply(false);assert.deepEqual([...g.getAttribute('color').array],colors);
});
test('rendered center keeps unfinished buildings unroofed, one clock, and finite geometry',async()=>{
  // A deterministic canvas stand-in is enough for mesh generation; browser QA verifies actual textures.
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
  const meta=await json('public/data/town-terrain.json'),bytes=await readFile(new URL('../public/data/'+meta.heights,import.meta.url));
  const heights=new Float32Array(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),valid=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
  const scene=makeCenter(data,meta,heights,valid,housing);
  assert.equal(data.sites.filter(s=>s.clock).length,1);
  for(const s of data.sites){
    const group=scene.root.children.find(g=>g.userData.centerId===s.id);assert.ok(group);
    const roofs=group.children.filter(m=>m.material?.name==='roof');
    if(['warehouse','covered-market','unfinished-block','fountain'].includes(s.kind))assert.equal(roofs.length,0,s.id);
    if(['church','inn','private-courtyard'].includes(s.kind))assert.ok(roofs.length>0,s.id);
  }
  const bell=scene.root.children.find(g=>g.userData.centerId==='sant-elm').userData.campanar;
  assert.ok(bell.unfinished.children.length>0&&bell.complete.children.length>0);
  assert.ok(bell.complete.children.some(m=>m.material.name==='roof'),'cos de campanes amb coberta pròpia');
  const duana=scene.root.children.find(g=>g.userData.centerId==='duana-nova').userData.stages,white=scene.root.children.find(g=>g.userData.centerId==='casa-white').userData.stages;
  assert.ok(duana.unfinished.children.length>0&&duana.complete.children.length>0,'duana: estat inacabat i estat de 1890');
  assert.equal(white.complete.children.length,0,'White no té estat posterior documentat');
  assert.equal(scene.root.children.find(g=>g.userData.centerId==='duana-nova').children.filter(m=>m.material?.name==='roof').length,0);
  assert.equal(scene.trees.children[0].count,60);
  scene.root.traverse(object=>{if(!object.isMesh)return;
    assert.ok([...object.geometry.getAttribute('position').array].every(Number.isFinite),object.parent.name);
    assert.ok([...object.geometry.getAttribute('normal').array].every(Number.isFinite),object.parent.name);
    object.geometry.computeBoundingBox();assert.ok(!object.geometry.boundingBox.isEmpty());
  });
  delete globalThis.document;
});
