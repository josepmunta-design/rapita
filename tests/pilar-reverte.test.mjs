import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Raycaster,Vector3} from 'three';
import {makeResearchLandscape} from '../src/research-landscape.ts';
import {landscapeSample,nearestRoute} from '../src/littoral-plan.mjs';
import {caveFrame} from '../src/cave-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse((await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const lit=await json('public/data/littoral.json'),data=await json('data/pilar-reverte.json'),meta=await json('public/data/terrain.json');
const raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));

test('PR01 archives all embedded references and keeps AI imagery out of historical photo galleries',async()=>{
 const manifest=await json('docs/sources/pilar-reverte/manifest.json');
 const source=await readFile(new URL('../'+manifest.file,import.meta.url));assert.equal(manifest.sha256,createHash('sha256').update(source).digest('hex'));
 assert.equal(manifest.images.length,16);assert.deepEqual(lit.researchLandscape,data);
 const dossiers=await json('public/data/dossiers.json');
 for(const[id,addition]of Object.entries(data.dossiers)){
  const d=dossiers.items[id];assert.ok(d.sources.some(s=>s.id==='PR01'&&s.year===2024));
  assert.equal(d.photos.filter(p=>p.id.startsWith('PR01-')).length,addition.images.length);
  assert.ok(d.photos.every(p=>p.id!=='PR01-01'));for(const p of d.photos.filter(p=>p.id.startsWith('PR01-'))){assert.equal(p.year,null);assert.ok((await readFile(new URL('../public/data/dossier-img/'+p.image,import.meta.url))).length>100);}
 }
 assert.equal(dossiers.items['cova-roquer'].withoutModel,null);assert.ok(dossiers.items['cova-roquer'].modelIds.includes('pilar-cave'));
});

test('research landscape has finite open cave geometry, low fan palms and reversible chronology without changing measured samples',()=>{
 const before=raw.slice(),mask=v.slice();
 const model=makeResearchLandscape(data,meta,(e,n)=>{const measured=sampleHeight(meta,h,v,e,n);return measured===null?null:landscapeSample(e,n,measured,lit).height;});
 assert.equal(model.groups.size,6);
 model.setYear(1800);assert.equal(model.root.visible,true);model.setYear(1777);assert.equal(model.root.visible,false);model.setYear(1778);assert.equal(model.root.visible,true);
 model.root.traverse(o=>{if(!o.isMesh)return;for(const name of['position','normal'])assert.ok([...o.geometry.getAttribute(name).array].every(Number.isFinite));});
 // Cave entrance is empty at head height; masonry lies on either side and over the arch.
 const cave=model.groups.get('pilar-cave'),rock=cave.children[0].children[0],[ce,cn]=data.cave.anchor;
 const cy=Math.max(.85,landscapeSample(ce,cn,sampleHeight(meta,h,v,ce,cn),lit).height);
 const f=caveFrame(data),ray=new Raycaster(new Vector3(ce-meta.origin.easting+f.outward[0]*3,cy+1.4,meta.origin.northing-cn-f.outward[1]*3),new Vector3(-f.outward[0],0,f.outward[1]));
 model.root.updateMatrixWorld(true);const galleryHits=ray.intersectObject(rock);assert.ok(galleryHits.length>0);assert.ok(galleryHits[0].distance>6,'Entrance stays open until the blind gallery end');
 const leaf=model.groups.get('pilar-garrigue').children.find(m=>m.material.color.getHexString()==='637343');leaf.geometry.computeBoundingBox();
 const maxGround=Math.max(...data.garrigue.points.map(([e,n])=>Math.max(.85,landscapeSample(e,n,sampleHeight(meta,h,v,e,n),lit).height)));
 assert.ok(leaf.geometry.boundingBox.max.y<=maxGround+1.4,'Fan palms stay low above the ground');
 const well=lit.sites.find(s=>s.id==='well');assert.ok(well.technicalBaseElevation>lit.studyWaterElevation);assert.ok(nearestRoute(...well.anchor,data.trail.points).distance<3);
 assert.deepEqual(Buffer.from(h.buffer),before);assert.deepEqual(v,mask);
});
