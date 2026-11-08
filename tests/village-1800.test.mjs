import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {readFile} from 'node:fs/promises';
import {makeServiceHouse} from '../src/service-house.ts';
import {makeHousing} from '../src/housing.ts';
import {makeUrban} from '../src/urban.ts';
import {sampleHeight} from '../src/geo.mjs';
import {tracedRoof,serviceHousePlan,VILLAGE_EVIDENCE} from '../src/village-plan.mjs';
import {housingNavigation,siteUTM} from '../src/domestic-plan.mjs';
import {footprintBlocked,walkStep,insidePolygon} from '../src/walk-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const data=await json('housing.json'),meta=await json('town-terrain.json'),urban=await json('urban-fabric.json'),raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),valid=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
test('Mançana entrance crosses both facades physically and in navigation; courtyard is accessible but rooms and well remain solid',()=>{
 const s=data.structures.find(s=>s.id==='manzana-shared'),nav=housingNavigation(s),to=p=>siteUTM(s,[p])[0];
 const a=to([0,s.depth/2+1]),b=to([0,s.depth/2-s.wingDepth-2]),step=walkStep(a,b[0]-a[0],b[1]-a[1],()=>0,nav.solids);
 assert.ok(Math.hypot(...step.position.map((x,i)=>x-b[i]))<.02);
 assert.equal(footprintBlocked(...to([0,0]),nav.solids),true);assert.equal(footprintBlocked(...to([8,s.depth/2-2]),nav.solids),true);
 const group=makeHousing(data,meta,h,valid).children.find(g=>g.userData.structureId===s.id);group.position.set(0,0,0);group.rotation.set(0,0,0);group.updateMatrixWorld(true);
 const ray=new THREE.Raycaster(new THREE.Vector3(0,1.5,s.depth/2+1),new THREE.Vector3(0,0,-1),.01,s.wingDepth+3);
 assert.equal(ray.intersectObject(group,true).length,0,'no solid facade or shutter across the shared entrance');
 const level=(e,n)=>{const patch=group.userData.walkSurfaces.find(s=>insidePolygon([e,n],s.polygon));return patch?patch.elevation:nav.floors.some(p=>insidePolygon([e,n],p))?group.userData.floorElevation:sampleHeight(meta,h,valid,e,n);};
 const outside=to([0,s.depth/2+6.5]),inside=to([0,s.depth/2-s.wingDepth-2]),actual=walkStep(outside,inside[0]-outside[0],inside[1]-outside[1],level,nav.solids);
 assert.ok(Math.hypot(...actual.position.map((x,i)=>x-inside[i]))<.03,'modern MDT height difference is crossed with visible technical steps');
 assert.equal(group.userData.countedUnits,24);assert.equal(group.userData.evidence,VILLAGE_EVIDENCE.manzana);assert.equal(data.summary.royalInventoryUnits,81);
});
test('five Tinglado arches remain real openings below the spandrels; the mill stays unroofed',()=>{
 const scene=makeUrban(urban,meta,()=>0),s=urban.sites.find(s=>s.id==='tinglado'),group=scene.groups.get(s.id),aw=s.width*.55;
 group.position.set(0,0,0);group.rotation.set(0,0,0);group.updateMatrixWorld(true);
 for(let i=0;i<5;i++){const x=-s.width/2+.4+(i+.5)*(aw-.8)/5,z=s.depth/2-.4;
  const ray=y=>new THREE.Raycaster(new THREE.Vector3(x,y-s.technicalBaseElevation+.06,z+1),new THREE.Vector3(0,0,-1),.01,1.5).intersectObject(group,true);
  assert.equal(ray(1.6).length,0,'arch '+i+' must be open');assert.ok(ray(s.height-.1).length>0,'arch '+i+' needs a spandrel');
 }
 assert.deepEqual(group.userData.pierCounts,[12,9]);assert.equal(scene.groups.get('molinet').userData.roof,false);assert.equal(scene.groups.get('molinet').userData.millstones,2);
});
test('pitched roofs retain every traced corner and ridge projection inside each existing quadrilateral',()=>{
 for(const s of urban.sites.filter(s=>s.kind==='stonehouse'&&s.polygonUTM)){
  const roof=tracedRoof(s.polygonUTM,10),corners=roof.slopes.flat().filter(p=>p[1]===10).map(([x,,z])=>[x,z]);
  for(const p of s.polygonUTM)assert.ok(corners.some(c=>Math.hypot(c[0]-p[0],c[1]-p[1])<1e-8));
  assert.ok(roof.rise>0&&roof.rise<=1.8);for(const poly of roof.slopes)assert.ok(poly.flat().every(Number.isFinite));
 }
});
test('service facade details fit the unchanged study envelopes and all materials have finite physical UVs',()=>{
 const sites=[...urban.sites.filter(s=>['forge','guardhouse','service-house'].includes(s.kind)),...[{id:'old-inn',width:12,depth:20,height:5.5,kind:'inn'},{id:'health',width:5,depth:4,height:3.1,kind:'health'}]];
 for(const s of sites){const plan=serviceHousePlan(s),g=makeServiceHouse(s);assert.equal(plan.detailConfidence,'C');
  for(const [length,holes]of[[plan.w,plan.front],[plan.w,plan.back],[plan.d-2*plan.T,plan.side]])for(const a of holes){assert.ok(Math.abs(a.x)+a.width/2<length/2);assert.ok(a.bottom+a.height<=s.height);}
  g.traverse(o=>{if(!o.isMesh)return;for(const key of['position','normal','uv'])assert.ok([...o.geometry.attributes[key].array].every(Number.isFinite));if(o.material.name==='tile'){const n=o.geometry.attributes.normal;for(let i=0;i<12;i++)assert.ok(n.getY(i)>.1,'roof slopes must point upwards');}});
 }
 assert.equal(VILLAGE_EVIDENCE.inventory.independentBuildings,null);
});
