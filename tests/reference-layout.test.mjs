import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{referenceUTM}from'../src/reference-layout.mjs';import{centerNavigation}from'../src/domestic-plan.mjs';import{footprintBlocked}from'../src/walk-plan.mjs';import{caveExtent,caveRockRoof,caveWorld,caveFloor}from'../src/cave-plan.mjs';import{inPolygon}from'../src/harbour-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const ref=await json('data/layout-reference-1800.json'),center=await json('public/data/center.json'),housing=await json('public/data/housing.json'),lit=await json('public/data/littoral.json'),urban=await json('public/data/urban-fabric.json');
test('Talavera and Fonda bodies follow the shared sketch registration and leave their courtyards open',()=>{
 for(const[id,polys]of Object.entries(ref.compounds)){
  const s=center.sites.find(s=>s.id===id),nav=centerNavigation(s);assert.equal(s.planBodies.length,3);assert.equal(nav.solids.length,1);assert.equal(s.continuousCompound,true);assert.equal(s.planOutline.length,8);
  const a=housing.townFrame.alongAzimuthDegrees*Math.PI/180;
  polys.forEach((poly,i)=>poly.forEach((point,j)=>{const expected=referenceUTM(point,ref,housing.townFrame),actual=s.bodyFootprintsUTM[i][j];const k=s.layoutShiftAcross??4,m=s.layoutShiftAlong??0;assert.ok(Math.hypot(actual[0]-expected[0]-k*Math.cos(a)-m*Math.sin(a),actual[1]-expected[1]+k*Math.sin(a)-m*Math.cos(a))<1e-7);}));
  for(const poly of s.bodyFootprintsUTM){const p=poly.reduce((q,p)=>[q[0]+p[0]/4,q[1]+p[1]/4],[0,0]);assert.equal(footprintBlocked(...p,nav.solids),true);}
  assert.equal(footprintBlocked(s.anchor.easting,s.anchor.northing,nav.solids,.05),false,'court centre stays empty: '+id);
 }
});
test('emblematic structures retain their established dimensions',()=>{
 // Duana: 30,5 × 17 m = 518 m² perquè la planta de 520 m² de 1868 cap a l'illa actual (encaix ICGC 08/11/2026).
 const expected={'sant-elm':[17,25,9.4],'placa-coberta':[15,17,9.3],'duana-nova':[30.5,17,8.2],'casa-white':[26,20,8.2]};
 for(const[id,dims]of Object.entries(expected)){const s=center.sites.find(s=>s.id===id);assert.deepEqual([s.width,s.depth,s.wallHeight],dims);assert.equal(s.planBodies,undefined);}
 // Torre i bateria: dimensions derivades del registre amb punts de control del 09/11/2026 (0,119 m/px) i del front conservat.
 const t=lit.sites.find(s=>s.id==='tower');assert.ok(Math.abs(t.width-8.806)<1e-6);assert.ok(Math.abs(t.depth-10.353)<1e-6);assert.equal(t.height,13.2);assert.equal(lit.battery.planWidth,28.5);
});
test('gardens and the 1800 harbour share the traced polygons rather than rectangular placeholders',()=>{
 for(const[id,pixels]of Object.entries(ref.gardens)){const g=urban.sites.find(s=>s.id===id);if(g.revisedPolygon20261108){assert.ok(g.polygonUTM.length>=8&&g.areaM2>2000);continue;}// Horts de les Monges: revisió ICGC + N112
  assert.deepEqual(g.polygonUTM,pixels.map(p=>referenceUTM(p,ref,housing.townFrame)));}
 const b=lit.basins.find(b=>b.id==='large');assert.deepEqual(b.polygonUTM,ref.largeBasin.map(p=>referenceUTM(p,ref,housing.townFrame)));assert.equal(lit.portWorks.breakwaters.length,2);
 assert.ok(inPolygon(...b.center,b.polygonUTM));const a=lit.portWorks.breakwaters[0].at(-1),c=lit.portWorks.breakwaters[1].at(-1);assert.ok(Math.hypot(a[0]-c[0],a[1]-c[1])>40,'lateral mouth remains open');
 assert.deepEqual(lit.canal.routeStudy.slice(0,4),ref.canal.map(p=>referenceUTM(p,ref,housing.townFrame)));
});
test('the cliff roof and both terrain shoulders meet continuously without moving the three cave mouths',()=>{
 const d=lit.researchLandscape,b=caveExtent(d);assert.deepEqual(d.caveFrame.center,[296428.711402999,4499119.483827252]);
 for(const u of[b.first,b.last]){const a=caveWorld(u-.001,5,0,d),c=caveWorld(u+.001,5,0,d);assert.ok(Math.abs(caveFloor(a[0],a[1],8,d)-caveFloor(c[0],c[1],8,d))<.02);}
 const p=caveWorld(0,b.depth,0,d),q=caveWorld(0,b.depth+.001,0,d);assert.ok(Math.abs(caveFloor(...p.slice(0,2),8,d)-caveRockRoof(0,b.depth,d))<1e-7);assert.ok(Math.abs(caveFloor(...q.slice(0,2),8,d)-caveRockRoof(0,b.depth,d))<.02);
});
