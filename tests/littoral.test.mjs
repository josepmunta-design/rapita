import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {chronologyAt,entityAt} from '../src/chronology.mjs';
import {landscapeSample,shoreEasting,nearestRoute,canalWaterLevel} from '../src/littoral-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
import {regionalTriangles,makeLandscape} from '../src/landscape.ts';
import {makeLittoral} from '../src/littoral.ts';
const json=async p=>JSON.parse((await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const data=await json('public/data/littoral.json'),chronology=await json('public/data/chronology.json'),meta=await json('public/data/terrain.json');
const loadGrid=async m=>{const raw=await readFile(new URL('../public/data/'+m.heights,import.meta.url));return [new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),await readFile(new URL('../public/data/'+m.validity,import.meta.url))];};
const[h,v]=await loadGrid(meta);

test('battery project and inventory stay distinct; unmeasured historical geometry remains unknown',()=>{
  assert.equal(data.battery.projectedGuns,8);assert.equal(data.battery.inventoryGuns,6);assert.equal(data.battery.mountedGuns,3);assert.equal(data.battery.unmountedGuns,3);
  for(const s of data.sites){assert.equal(s.geometryConfidence,'C');assert.equal(s.historicalHeight,null);assert.equal(s.historicalFootprint,null);assert.equal(s.state1800,null);assert.ok(Number.isFinite(s.technicalBaseElevation));}
  const xs=data.battery.outlineStudy.map(p=>p[0]);// Planta T-6/8 encaixada al front conservat sota el mercat (09/11/2026): 28,5 m; la lectura anterior de l'escala donava 36,9 m.
  assert.ok(Math.abs(Math.max(...xs)-Math.min(...xs)-28.5)<1e-8);assert.equal(data.battery.preservedFit.previousPlanWidth,36.9);assert.ok(data.battery.preservedFit.rmsMeters<.5);
  assert.match(data.sources.find(s=>s.id==='P01').credit,/Archivo General Militar de Madrid/);
  assert.match(data.sources.find(s=>s.id==='P02').title,/1813/);assert.ok(data.excluded.some(s=>s.includes('1867')));
});

test('timeline selects evidence intervals, clamps years and supports independent building timelines',()=>{
  assert.equal(entityAt(chronology,'battery',1778).visible,false);assert.equal(entityAt(chronology,'battery',1779).variant,'construction');
  assert.equal(entityAt(chronology,'tower',1780).variant,'repaired');assert.equal(entityAt(chronology,'guns',1793).visible,false);assert.equal(entityAt(chronology,'guns',1794).visible,true);
  assert.equal(chronologyAt(chronology,1700).year,1778);assert.equal(chronologyAt(chronology,1820).year,1820);assert.equal(chronologyAt(chronology,2000).year,1993);assert.equal(chronologyAt(chronology,1860).milestone.year,1860);assert.throws(()=>chronologyAt(chronology,NaN));
  assert.equal(chronologyAt(chronology,1784).milestone.year,1782);assert.equal(chronologyAt(chronology,1800).milestone.year,1795);
  const extended={...chronology,entities:{...chronology.entities,example:[{fromYear:1783,variant:'partial',visible:true},{fromYear:1790,variant:'altered',visible:true}]}};
  assert.equal(entityAt(extended,'example',1782).visible,false);assert.equal(entityAt(extended,'example',1785).variant,'partial');assert.equal(entityAt(extended,'example',1790).variant,'altered');
  assert.throws(()=>entityAt(chronology,'missing',1800));
});

test('canal spans the Amposta connection, keeps a shallow technical grade and boats remain seaward',()=>{
  const route=data.canal.routeStudy,nearest=nearestRoute(...route[0],route);
  assert.ok(nearest.length>10000&&nearest.length<11000);assert.ok(route.at(-1)[1]>4509300);
  for(const p of route){const hit=nearestRoute(...p,route);assert.ok(hit.distance<1e-8);const level=canalWaterLevel(hit.along,hit.length,data.studyWaterElevation);assert.ok(level>=.45&&level<=1.35+1e-8);const s=landscapeSample(...p,4,data);assert.ok(s.height<=level-.8);}
  assert.equal(data.historicalWaterElevation,null);assert.equal(data.historicalShoreline,null);
  for(const boat of data.boats)assert.ok(boat.anchor[0]-boat.beam/2>shoreEasting(boat.anchor[1],data.shorelineStudy),boat.id);
  assert.equal(data.boats.length,5);
});

test('historical cuts preserve all source samples and do not flood the retained town',async()=>{
  const before=new Uint8Array(h.buffer).slice(),mask=Uint8Array.from(v),housing=await json('public/data/housing.json'),center=await json('public/data/center.json');
  for(const building of[...housing.structures,...center.sites])for(const[e,n]of building.footprintUTM){
    const raw=sampleHeight(meta,h,v,e,n);assert.notEqual(raw,null);const study=landscapeSample(e,n,raw,data);assert.ok(study.height>data.studyWaterElevation+.15,building.id);
  }
  assert.deepEqual(new Uint8Array(h.buffer),before);assert.deepEqual(Uint8Array.from(v),mask);
  assert.equal(landscapeSample(295900,4504000,11,data).height,11);
});

test('regional context shares every native 10 m boundary vertex and keeps the WCS archive verifiable',async()=>{
  const region=await json('public/data/region.json'),[rh,rv]=await loadGrid(region),faces=regionalTriangles(region,rh,rv,meta,h,v);
  const south=faces.flat().filter(p=>p[1]===meta.north);assert.ok(south.length>0);
  for(const[e,n,z]of south)assert.equal(z,sampleHeight(meta,h,v,e,n));
  assert.equal(region.sourceSha256,createHash('sha256').update(await readFile(new URL('../docs/sources/canal-region.asc',import.meta.url))).digest('hex'));
  const before=Array.from(rh),seam=faces.filter(f=>f.some(p=>p[1]===meta.north)),mesh=makeLandscape(region,seam,data,true);
  const pos=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal');
  assert.ok([...pos.array].every(Number.isFinite));for(let i=0;i<normals.count;i++)assert.ok(normals.getY(i)>=-1e-6);
  assert.deepEqual(Array.from(rh),before);
});

test('Roquer geometry has six guns, three carriages, finite surfaces and reversible year states',()=>{
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
  const model=makeLittoral(data,meta,h,v,chronology);
  assert.equal(model.guns.children.length,6);assert.equal(model.guns.children.filter(g=>g.userData.mounted).length,3);
  model.setYear(1778);assert.equal(model.siteGroups.get('battery').visible,false);assert.equal(model.canal.visible,false);
  model.setYear(1779);assert.equal(model.siteGroups.get('battery').visible,true);assert.equal(model.guns.visible,false);
  model.setYear(1794);assert.equal(model.guns.visible,true);assert.equal(model.canal.visible,true);
  model.setYear(1778);assert.equal(model.guns.visible,false);assert.equal(model.port.visible,false);
  model.root.traverse(o=>{if(!o.isMesh)return;for(const attribute of['position','normal'])assert.ok([...o.geometry.getAttribute(attribute).array].every(Number.isFinite),o.name+' '+attribute);});
  for(const object of model.water.children)if(object.isMesh){const n=object.geometry.getAttribute('normal');for(let i=0;i<n.count;i++)assert.ok(n.getY(i)>.99);}
  delete globalThis.document;
});
