import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {makeCasotes,casotesGuardFootprints,casotesDescription} from '../src/casotes.ts';
import {makeUrban} from '../src/urban.ts';
const json=async p=>JSON.parse((await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/^\uFEFF/,''));

test('Casotes uses eleven long arcades, three short arcades, two floors and a roof with four outward-facing slopes',()=>{
 const model=makeCasotes();
 for(const [era,group]of Object.entries(model.variants)){
  const main=group.children.find(g=>g.name.startsWith('Les_Casotes_edificio_'));assert.ok(main);assert.equal(main.userData.elements.arco_medio_punto,(11*2+3*2)*16);assert.equal(main.userData.elements.tejado_cuatro_aguas,1);
  assert.ok(main.children.length<15,'one batch per material');
  main.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(main),size=box.getSize(new THREE.Vector3());assert.ok(size.x>33&&size.x<34.2);assert.ok(size.z>15.3&&size.z<16.5);assert.ok(size.y>8.65&&size.y<8.8);
  const roof=main.children.find(o=>o.material.color.getHexString()===(era==='historic'?'80634f':'a35b45'));assert.ok(roof);assert.equal(roof.material.side,THREE.FrontSide);
  const normals=roof.geometry.getAttribute('normal');for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>0,'roof normals face the sky');
  const cast=(x,z)=>new THREE.Raycaster(new THREE.Vector3(x,20,z),new THREE.Vector3(0,-1,0)).intersectObject(roof)[0]?.point.y;
  assert.ok(cast(0,0)>8.6);assert.ok(cast(15.5,0)<8);assert.ok(cast(0,7)<8);
  group.traverse(o=>{if(o.isMesh)for(const key of ['position','normal'])assert.ok([...o.geometry.getAttribute(key).array].every(Number.isFinite));});
  if(era==='historic'){assert.equal(main.userData.elements.montante_museo,undefined);assert.equal(main.userData.elements.hueco_superior_aprox,28);}
  else assert.equal(main.userData.elements.montante_museo,9);
 }
});

test('modern and guardhouse comparisons require explicit actions and reset on changing year',()=>{
 const f=makeCasotes();f.setComparison(true);f.setGuards(true);assert.equal(f.root.visible,false);assert.equal(f.comparison,false);assert.equal(f.guards,false);
 for(const year of [1857,1858,1950,1993]){f.setYear(year);assert.equal(f.root.visible,true);assert.equal(f.variants.historic.visible,true);assert.equal(f.variants.actual.visible,false);assert.equal(f.variants.historic.children.filter(g=>g.visible).length,1);}
 f.setComparison(true);f.setGuards(true);assert.equal(f.variants.actual.children.filter(g=>g.visible).length,3);assert.equal(f.variants.historic.visible,false);
 f.setYear(1993);assert.equal(f.comparison,true);f.setYear(1858);assert.equal(f.comparison,false);assert.equal(f.guards,false);assert.equal(f.variants.historic.children.filter(g=>g.visible).length,1);
 f.setYear(1800);assert.equal(f.root.visible,false);assert.ok(Object.values(f.variants).every(g=>!g.visible));
 assert.match(casotesDescription(1858,true,true),/2013.*No és l’estat/);assert.match(casotesDescription(1858,false,true),/hipotètiques/);
});

test('guardhouse batching preserves the supplied hypothetical positions once, and keeps dimensions separate from geographic evidence',()=>{
 const f=makeCasotes();f.setYear(1858);f.setGuards(true);f.root.updateMatrixWorld(true);
 const guards=f.variants.historic.children.filter(g=>g.name.startsWith('Casa_guarda_'));assert.equal(guards.length,2);
 for(const [i,g]of guards.entries()){assert.deepEqual(g.position.toArray(),[i===0?-11:11,0,45]);const centre=new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3());assert.ok(Math.abs(centre.x-g.position.x)<.15);assert.ok(Math.abs(centre.z-45)<.15);assert.match(g.userData.ubicacion,/APROXIMADA/);}
 const footprints=casotesGuardFootprints();assert.equal(footprints.length,2);for(const p of footprints){assert.equal(p.length,4);assert.ok(Math.abs(Math.hypot(p[1][0]-p[0][0],p[1][1]-p[0][1])-6)<1e-6);}
});

test('map, collision footprint and dossier retain the user anchor, estimated scale, 1857 witness and correct building identity',async()=>{
 const data=await json('public/data/urban-fabric.json'),source=await json('data/urban-fabric.json'),s=data.sites.find(s=>s.id==='casotes-companyia'),config=source.sites.find(site=>site.id==='casotes-companyia');
 assert.deepEqual(s.anchor,[296840,4499555]);assert.equal(s.alongAzimuthDegrees,12);assert.equal(s.fromYear,1857);assert.equal(s.width,33);assert.equal(s.depth,15.3);assert.equal(s.estimatedDimensions.measured,false);assert.deepEqual(s.estimatedDimensions,config.estimatedDimensions);assert.equal(s.historicalFootprint,null);
 for(let i=0;i<4;i++){const side=Math.hypot(...s.footprintUTM[i].map((x,k)=>x-s.footprintUTM[(i+1)%4][k]));assert.ok(Math.abs(side-(i%2?15.3:33))<1e-6);}
 const model=makeUrban(data,{origin:{easting:296000,northing:4499000}},()=>1);model.setYear(1800);assert.equal(model.groups.get(s.id).visible,false);model.setYear(1858);model.setCasotesComparison(true);model.setCasotesGuards(true);assert.equal(model.casotesComparison,true);assert.equal(model.casotesGuards,true);assert.equal(model.casotesCollision.length,2);model.setYear(1950);assert.equal(model.casotesGuards,false);assert.equal(model.casotesComparison,false);
 const dossier=(await json('public/data/dossiers.json')).items['companyia-canal'];assert.ok(dossier.phases.some(p=>p.date==='2013-12-01'));assert.match(dossier.modelNote,/estimades/);assert.equal(dossier.photos.some(p=>p.id==='N107'),false);assert.match(dossier.phaseRule,/cancel·la/);
});

test('optional guardhouses rest on the sampled slope with a technical skirt and keep their horizontal positions',()=>{
 const ground=(x,z)=>x*.02+z*.01,model=makeCasotes(ground);model.setYear(1858);model.setGuards(true);model.root.updateMatrixWorld(true);
 for(const g of model.variants.historic.children.filter(g=>g.name.startsWith('Casa_guarda_'))){
  const highestCorner=ground(g.position.x+3,g.position.z+3.05);assert.ok(Math.abs(g.position.y-highestCorner-.03)<1e-6);assert.equal(g.position.z,45);assert.equal(Math.abs(g.position.x),11);assert.equal(g.userData.elements.suport_tecnic_guarda,1);
  const box=new THREE.Box3().setFromObject(g);assert.ok(box.min.y<ground(g.position.x,g.position.z));g.traverse(o=>{if(o.isMesh)for(const key of ['position','normal'])assert.ok([...o.geometry.getAttribute(key).array].every(Number.isFinite));});
 }
});
