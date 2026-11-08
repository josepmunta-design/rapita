import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {makeFaro,faroPhase,faroDescription} from '../src/faro.ts';
import {makeUrban} from '../src/urban.ts';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse((await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/^\uFEFF/,''));

test('lighthouse replaces the lateral tower with a square house, flat terrace and central lantern at metre scale',()=>{
 const model=makeFaro();
 for(const [phase,g]of Object.entries(model.variants)){
  g.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3());
  assert.ok(size.x>=13.5&&size.x<=13.6,phase+' footprint including trim');assert.ok(Math.abs(size.z-size.x)<.02,phase+' square footprint');assert.ok(size.y>8&&size.y<10,phase+' tower height');
  // Above the parapet the only vertical mass is the central tower, plus the modern small fittings.
  let highest=null,count=0;
  g.traverse(o=>{if(!o.isMesh)return;count++;for(const attribute of ['position','normal'])assert.ok([...o.geometry.getAttribute(attribute).array].every(Number.isFinite));
   const p=o.geometry.getAttribute('position');for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);if(!highest||v.y>highest.y)highest=v;}
  });
  assert.ok(Math.hypot(highest.x,highest.z)<.3,phase+' pinnacle centred');assert.ok(count<25,phase+' batched materials');
  // The terrace can be seen at y=3.775 away from the central tower.
  g.visible=true;const hits=new THREE.Raycaster(new THREE.Vector3(3,10,3),new THREE.Vector3(0,-1,0)).intersectObject(g,true);
  assert.ok(hits.length);assert.ok(Math.abs(hits[0].point.y-3.775)<.03,phase+' flat terrace');
 }
});

test('year changes select a single phase, omit the lighthouse in 1800 and reset the modern comparison',()=>{
 const f=makeFaro();
 for(const [year,phase]of [[1800,'absent'],[1861,'absent'],[1862,'1864'],[1864,'1864'],[1919,'1864'],[1920,'1920'],[1929,'1920'],[1974,'1920'],[1975,'1975'],[1993,'1975'],[1864,'1864']]){
  assert.equal(faroPhase(year),phase);f.setYear(year);assert.equal(f.root.userData.phase,phase);assert.equal(f.root.visible,phase!=='absent');assert.equal(Object.values(f.variants).filter(g=>g.visible).length,phase==='absent'?0:1);
 }
 f.setComparison(true);assert.equal(f.root.userData.phase,'actual');f.setYear(1864);assert.equal(f.comparison,true);f.setYear(1865);assert.equal(f.comparison,false);assert.equal(f.root.userData.phase,'1864');
 f.setYear(1800);f.setComparison(true);assert.equal(f.root.visible,false);assert.equal(f.comparison,false);
 for(const [year,on]of [[1862,false],[1864,true],[1936,true],[1937,false],[1938,false],[1939,true]]){f.setYear(year);assert.equal(f.root.userData.lightOperational,on);}
 assert.match(faroDescription(1800),/encara no existia/);assert.match(faroDescription(1950),/blanca/);assert.match(faroDescription(1864,true),/No és l’estat/);
});

test('only photographic comparison uses white facades; 1920 and 1975 preserve the undated finish uncertainty',()=>{
 const f=makeFaro();const colors=g=>g.children.map(o=>o.material.color.getHexString());
 for(const phase of ['1864','1920','1975']){assert.ok(colors(f.variants[phase]).includes('d7c38e'));assert.equal(colors(f.variants[phase]).includes('e4e3da'),false);}
 assert.ok(colors(f.variants.actual).includes('e4e3da'));
 // No red optic in the 1920 white-light state; it returns in 1975.
 assert.equal(colors(f.variants['1920']).includes('ab2634'),false);assert.ok(colors(f.variants['1975']).includes('ab2634'));
});

test('map footprint, documentary dimensions, collision polygon and dossier agree without changing terrain',async()=>{
 const data=await json('public/data/urban-fabric.json'),source=await json('data/urban-fabric.json'),meta=await json('public/data/terrain.json');
 const site=data.sites.find(s=>s.id==='far-sant-carles'),config=source.sites.find(s=>s.id===site.id);
 assert.equal(site.width,13.1);assert.equal(site.depth,13.1);assert.equal(site.height,3.7);assert.deepEqual(site.documentedDimensions,config.documentedDimensions);assert.deepEqual(site.anchor,config.utmAnchor);
 const polygon=site.footprintUTM;for(let i=0;i<4;i++)assert.ok(Math.abs(Math.hypot(...polygon[i].map((v,k)=>v-polygon[(i+1)%4][k]))-13.1)<1e-6);
 const raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url)),before=Buffer.from(h.buffer);
 const urban=makeUrban(data,meta,(e,n)=>sampleHeight(meta,h,v,e,n)??1);urban.setYear(1864);urban.setLighthouseComparison(true);assert.equal(urban.lighthouseComparison,true);urban.setYear(1920);assert.equal(urban.lighthouseComparison,false);urban.setYear(1800);assert.equal(urban.groups.get(site.id).visible,false);assert.deepEqual(Buffer.from(h.buffer),before);
 const dossier=(await json('public/data/dossiers.json')).items[site.id];assert.ok(dossier.phases.some(p=>p.date==='1864-11-01'));assert.ok(dossier.phases.some(p=>p.year===1920));assert.ok(dossier.phases.some(p=>p.year===1975));assert.match(dossier.modelNote,/13,10/);assert.equal(dossier.photos.some(p=>p.id==='N085'),false);
});
