import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {makeCasaLaureano} from '../src/casa-laureano.ts';
import {makePlacaFacade} from '../src/placa-facades.ts';
import {marketPlan,centerNavigation,siteUTM,porticoPlan} from '../src/domestic-plan.mjs';
import {footprintBlocked} from '../src/walk-plan.mjs';
const json=async file=>JSON.parse(await readFile(new URL('../'+file,import.meta.url),'utf8'));
const data=await json('public/data/center.json'),s=data.sites.find(s=>s.id==='placa-coberta'),p=marketPlan(s);

test('the two Laureano variants preserve the tall open colonnade and reserve the curved crest for the photographic comparison',()=>{
  for(const photo of[false,true]){
    const root=makeCasaLaureano(s,()=>0,photo);root.updateMatrixWorld(true);
    const ray=(x,y)=>new THREE.Raycaster(new THREE.Vector3(x,y,s.depth/2+2),new THREE.Vector3(0,0,-1),0,3).intersectObject(root,true);
    assert.equal(ray(0,1.65).length,0,'entrance between the middle columns');
    assert.equal(ray(0,6).length,0,'single order spans both floors');
    for(const col of p.piers)assert.ok(ray(col.x,6).length,'every shaft extends to the upper floor');
    assert.equal(ray(0,11.6).length>0,photo,'undated crest stays out of the 1794 study');
    const ceiling=new THREE.Raycaster(new THREE.Vector3(0,1.65,s.depth/2-1.5),new THREE.Vector3(0,1,0),0,20).intersectObject(root,true)[0];
    assert.ok(ceiling&&ceiling.point.y>9&&ceiling.point.y<9.4,'gallery has a double-height ceiling');
    root.traverse(o=>{if(o.isMesh)for(const k of['position','normal','uv'])assert.ok([...o.geometry.attributes[k].array].every(Number.isFinite));});
    assert.equal(root.userData.photoDate,null);assert.equal(root.userData.historicalDimensions,null);
  }
  const nav=centerNavigation(s),to=point=>siteUTM(s,[point])[0];
  for(const col of p.piers)assert.equal(footprintBlocked(...to([col.x,col.z]),nav.solids),true);
  for(const x of[-s.width/2,0,s.width/2])assert.equal(footprintBlocked(...to([x,s.depth/2-2]),nav.solids),false,'side-to-side gallery stays open');
  assert.equal(footprintBlocked(...to([0,0]),nav.solids),true,'rear domestic body remains solid');
});

test('all fourteen photographic fronts have closed upward-facing roofs without changing their parcels',async()=>{
  const housing=await json('public/data/housing.json');
  for(const s of housing.structures.filter(s=>s.group==='royal-portico')){
    const original=JSON.stringify(s),root=makePlacaFacade(s),p=porticoPlan(s),z=(p.fz+p.bz)/2;root.updateMatrixWorld(true);
    const hits=new THREE.Raycaster(new THREE.Vector3(0,20,z),new THREE.Vector3(0,-1,0),0,20).intersectObject(root,true);
    assert.ok(hits.length&&hits[0].face.normal.y>.9,'roof visible from above: '+s.id);
    assert.equal(JSON.stringify(s),original);assert.equal(root.userData.individualParcelVerified,false);
  }
});

test('the five inspected Palau photographs retain their original bytes and unknown dates',async()=>{
  const manifest=await json('docs/Palau de la plaça carles III/review.json');
  assert.equal(manifest.images.length,5);assert.equal(manifest.photoDate,null);
  for(const f of manifest.images){const bytes=await readFile(new URL('../docs/Palau de la plaça carles III/'+f.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);}
  assert.equal(s.photographicComparison.automaticTimelineActivation,false);assert.equal(s.documented.height,null);
});
