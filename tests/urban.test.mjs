import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeUrban} from '../src/urban.ts';
import {urbanVisible,urbanGround} from '../src/urban-plan.mjs';
import {routeStations} from '../src/littoral-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const data=await json('public/data/urban-fabric.json'),housing=await json('public/data/housing.json'),center=await json('public/data/center.json'),meta=await json('public/data/terrain.json');
const littoral=await json('public/data/littoral.json');
const b=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};

test('all seven street corridors clear retained houses, central buildings and new/littoral service buildings',()=>{
 const removed=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[])),coastal=littoral.sites.filter(s=>['inn','customs','quarters','monastery','health','tower','kiln'].includes(s.kind)).map(s=>({...s,footprintUTM:[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,n])=>[s.anchor[0]+x*s.width/2,s.anchor[1]+n*s.depth/2])})),all=[...housing.structures.filter(s=>!removed.has(s.id)),...center.sites,...coastal,...data.sites.filter(s=>['forge','guardhouse','service-house'].includes(s.kind)&&urbanVisible(s,1800))];
 assert.equal(data.routes.length,7);
 for(const route of data.routes)for(const st of routeStations(route.points,1))for(const sign of[-.5,0,.5]){
  const p=[st.e-sign*st.dy*route.width,st.n+sign*st.dx*route.width];for(const s of all)assert.equal(inside(p,s.footprintUTM),false,route.id+' crosses '+s.id);
 }
});
test('new service buildings and grounds do not overlap retained houses; workyard belongs to existing Mançana',()=>{
 const removed=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[])),all=[...housing.structures.filter(s=>!removed.has(s.id)),...center.sites];
 const overlaps=(a,b)=>a.length>=3&&b.length>=3&&[a,b].every(p=>p.every((v,i)=>{const q=p[(i+1)%p.length],axis=[q[1]-v[1],v[0]-q[0]],project=s=>s.map(p=>p[0]*axis[0]+p[1]*axis[1]),x=project(a),y=project(b);return Math.min(Math.max(...x),Math.max(...y))-Math.max(Math.min(...x),Math.min(...y))>1e-5;}));
 for(const s of data.sites.filter(s=>s.kind!=='workyard'&&(s.toYear??Infinity)>=1794))for(const old of all)assert.equal(overlaps(s.footprintUTM,old.footprintUTM),false,s.id+' / '+old.id);
 assert.ok(inside(data.sites.find(s=>s.kind==='workyard').anchor,housing.structures.find(s=>s.id==='manzana-shared').footprintUTM));
});
test('chronological services replace evidence variants reversibly and never increase residential inventory',()=>{
 const old=data.sites.find(s=>s.id==='ferreria-vella'),next=data.sites.find(s=>s.id==='ferreria-nova');
 for(const y of[1780,1794,1782,1800]){assert.equal(urbanVisible(old,y),y<1794);assert.equal(urbanVisible(next,y),y>=1794);}
 assert.equal(data.privateLedger.documentedMixedUnits,38);assert.equal(data.privateLedger.documentedResidentialCount,null);assert.equal(data.privateLedger.unidentifiedResidentialCount,null);assert.equal(data.privateLedger.reconciledIndividualRegister,false);
 assert.ok(data.sites.every(s=>s.inventoryIncrement===0&&s.historicalFootprint===null&&s.historicalHeight===null));assert.equal(housing.summary.royalInventoryUnits,81);
});
test('rendered roads and bridge are finite, face upwards and the ravine cut leaves the measured arrays untouched',()=>{
 const before=new Float32Array(h),mask=Buffer.from(v),scene=makeUrban(data,meta,(e,n)=>sampleHeight(meta,h,v,e,n));
 scene.setYear(1800);assert.equal(scene.groups.get('ferreria-vella').visible,false);scene.setYear(1780);assert.equal(scene.groups.get('pont-monges').visible,false);assert.equal(scene.groups.get('ferreria-vella').visible,true);scene.setYear(1800);
 scene.root.traverse(o=>{if(!o.isMesh)return;assert.ok([...o.geometry.getAttribute('position').array].every(Number.isFinite));assert.ok([...o.geometry.getAttribute('normal').array].every(Number.isFinite));if(o.material.name==='road')assert.ok([...o.geometry.getAttribute('normal').array].filter((_,i)=>i%3===1).every(n=>n>=0));});
 const p=data.ravine.points[2];assert.equal(urbanGround(...p,10,data),10-data.ravine.depth);assert.equal(urbanGround(294900,4498000,10,data),10);assert.deepEqual(h,before);assert.deepEqual(v,mask);
});

test('buildings located after 1800 appear in their witness year and stay; 1800 buildings persist to 1950',()=>{
 const later={'casotes-companyia':1857,'far-sant-carles':1862,mataredona:1913,'font-burga':1913};
 const scene=makeUrban(data,meta,(e,n)=>sampleHeight(meta,h,v,e,n)??1);
 for(const[id,year]of Object.entries(later)){
  const site=data.sites.find(s=>s.id===id);assert.ok(site,id);assert.ok(site.positionSource.text&&site.positionSource.precisionMeters>0);
  assert.equal(site.inventoryIncrement,0);assert.equal(site.historicalFootprint,null);assert.equal(urbanVisible(site,year-1),false);assert.equal(urbanVisible(site,year),true);assert.equal(urbanVisible(site,1950),true);
  scene.setYear(year-1);assert.equal(scene.groups.get(id).visible,false);scene.setYear(year);assert.equal(scene.groups.get(id).visible,true);
 }
 scene.setYear(1950);for(const id of['pont-monges','ferreria-nova','casa-administrador'])assert.equal(scene.groups.get(id).visible,true,id);
 assert.equal(scene.groups.get('ferreria-vella').visible,false);
 const casotes=data.sites.find(s=>s.id==='casotes-companyia');assert.ok(Math.abs(casotes.footprintUTM[0][0]-casotes.footprintUTM[1][0])+Math.abs(casotes.footprintUTM[0][1]-casotes.footprintUTM[1][1])>30);
});
