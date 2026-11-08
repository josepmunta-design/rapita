import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {makeLandmarks,archPanel} from '../src/landmarks.ts';
import {entityAt} from '../src/chronology.mjs';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const data=await json('public/data/landmarks.json'),meta=await json('public/data/terrain.json'),chronology=await json('public/data/chronology.json');
const b=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));

test('Glorieta has three open arch shells and no dome; Guardiola has no modern crown',()=>{
  const model=makeLandmarks(data,meta,h,v,chronology),pavilion=model.groups.get('glorieta');
  assert.equal(pavilion.children.filter(o=>o.userData.archId!==undefined).length,3);
  assert.equal(data.sites[0].domeConstructed,false);assert.equal(data.sites[1].modernCrown,false);
  for(const s of data.sites){assert.equal(s.historicalHeight,null);assert.equal(s.constructionYear,null);assert.equal(s.historicalFootprint,null);assert.equal(s.state1800,null);for(const[e,n]of s.footprintUTM)assert.ok(sampleHeight(meta,h,v,e,n)<=s.terrain.technicalBaseElevation);}
  model.root.traverse(o=>{if(!o.isMesh)return;for(const attribute of['position','normal'])assert.ok([...o.geometry.getAttribute(attribute).array].every(Number.isFinite));assert.ok(!Array.isArray(o.material));assert.notEqual(o.material.name,'roof');});
});

test('arches have empty doorways and correct solid jambs, without internal overlapping reveal boxes',()=>{
  const mesh=new THREE.Mesh(archPanel(2.17,4.2,1.65,2.1,.55),new THREE.MeshBasicMaterial({side:THREE.DoubleSide}));mesh.updateMatrixWorld();
  const hit=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,2),new THREE.Vector3(0,0,-1)).intersectObject(mesh).length;
  assert.equal(hit(0,1),0);assert.equal(hit(0,2.7),0);assert.ok(hit(0,3.1)>0);assert.ok(hit(1,1)>0);
});

test('landmark years distinguish preexistence from a retrospective 1800 hypothesis',()=>{
  assert.equal(entityAt(chronology,'glorieta',1794).visible,false);assert.equal(entityAt(chronology,'glorieta',1800).certainty,'C');assert.match(entityAt(chronology,'glorieta',1800).dateMeaning,/retrospectiva/);
  const model=makeLandmarks(data,meta,h,v,chronology);model.setYear(1780);assert.equal(model.groups.get('guardiola').visible,true);assert.equal(model.groups.get('glorieta').visible,false);model.setYear(1800);assert.equal(model.groups.get('glorieta').visible,true);model.setYear(1780);assert.equal(model.groups.get('glorieta').visible,false);
});
