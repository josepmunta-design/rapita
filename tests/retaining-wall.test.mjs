import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{referenceUTM}from'../src/reference-layout.mjs';import{routeStations}from'../src/littoral-plan.mjs';import{footprintBlocked}from'../src/walk-plan.mjs';import{makeRetainingWall}from'../src/retaining-wall.ts';import{urbanVisible}from'../src/urban-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8')),ref=await json('data/layout-reference-1800.json'),urban=await json('public/data/urban-fabric.json'),wall=urban.sites.find(s=>s.id==='paredo-poblacio');
test('wall 24 follows both sketch lines and uses a physical footprint along each masonry segment',()=>{
 // El segon tram (Horts de les Monges) es retira el 09/11/2026: travessava la rampa i els horts lluny de l'escarpament real.
 const lines=ref.retainingWall24.map(line=>line.map(p=>referenceUTM(p,ref,urban.frame)));assert.deepEqual(wall.retainingLinesUTM,[lines[0]]);assert.deepEqual(wall.retiredLinesUTM,[lines[1]]);
 for(const line of wall.retainingLinesUTM)for(const st of routeStations(line,1)){const isAccess=(wall.accessRoutes??[]).some(r=>Math.min(...routeStations(r.points,1).map(p=>Math.hypot(p.e-st.e,p.n-st.n)))<r.width/2+wall.baseWidth/2+1);if(!isAccess)assert.equal(footprintBlocked(st.e,st.n,wall.collisionFootprintsUTM,.05),true);}
 assert.equal(urbanVisible(wall,1793),false);assert.equal(urbanVisible(wall,1794),true);assert.equal(wall.historicalHeight,null);assert.equal(wall.inventoryIncrement,0);
});
test('retaining masonry and coping follow a sloping site with buried footings and a higher landward crest',()=>{
 const o={easting:296389,northing:4499364,elevation:0},sample=(e,n)=>3+(e-o.easting)*.015+(n-o.northing)*.01,model=makeRetainingWall({...wall,accessRoutes:[]},o,sample);
 for(const line of model.userData.profiles)for(const p of line){assert.ok(p.top>=sample(p.e,p.n)+.59);assert.ok(p.bottom<=sample(p.e,p.n)-.34);assert.ok(p.top-p.bottom>=1.4-1e-9);}
 assert.equal(model.children.length,2);model.traverse(o=>{if(o.isMesh)for(const k of['position','normal','uv'])assert.ok([...o.geometry.attributes[k].array].every(Number.isFinite));});
});
test('the wall keeps the road and ramp corridors clear',()=>{
 const conflicts=new Set();for(const r of urban.routes)for(const st of routeStations(r.points,.75))for(const side of[-.5,0,.5])if(footprintBlocked(st.e-side*st.dy*r.width,st.n+side*st.dx*r.width,wall.collisionFootprintsUTM,.05))conflicts.add(r.id);
 assert.deepEqual([...conflicts],[]);
});
