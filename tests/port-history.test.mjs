import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Raycaster,Vector3} from 'three';
import {harbourData,harbourPhaseAt,harbourHeight,inHarbourLand,inPolygon} from '../src/harbour-plan.mjs';
import {landscapeSample,coastalWaterEasting} from '../src/littoral-plan.mjs';
import {makeHarbourLand} from '../src/harbour.ts';
import {makeRockCave} from '../src/rock-cave.ts';
import {caveSites,caveFloor} from '../src/cave-plan.mjs';
const json=async name=>JSON.parse(await readFile(new URL('../public/data/'+name,import.meta.url),'utf8'));
const history=await json('harbour-history.json'),base=await json('littoral.json'),meta=await json('terrain.json');
test('port phases select full source intervals, preserve date discrepancies and reverse to the earlier coast',()=>{
 const snapshot=JSON.stringify(base);assert.equal(harbourPhaseAt(history,1800),null);
 assert.equal(harbourPhaseAt(history,1946).fromYear,1945);assert.equal(harbourPhaseAt(history,1956).fromYear,1945);assert.equal(harbourPhaseAt(history,1957).fromYear,1957);
 assert.deepEqual(harbourPhaseAt(history,1983).sourcePeriod,[1983,1989]);assert.deepEqual(harbourPhaseAt(history,1990).sourcePeriod,[1990,1990]);
 for(const phase of history.phases){const d=harbourData(base,phase);assert.equal(d.basins.length,0);assert.notDeepEqual(d.shorelineStudy,base.shorelineStudy);
  for(let n=4498300;n<4499600;n+=30){const e=coastalWaterEasting(n,d)+70;if(!inHarbourLand(e,n,phase))assert.ok(landscapeSample(e,n,8,d).height<base.studyWaterElevation,'Harbour water must not contain a land plug');}
 }
 assert.equal(harbourData(base,null),base);assert.equal(JSON.stringify(base),snapshot);
});
test('reclaimed land has a finite top, seabed walls and a walkable surface at every traced footprint',()=>{
 for(const phase of history.phases){const root=makeHarbourLand(phase,meta.origin);root.updateMatrixWorld(true);
  root.traverse(o=>{if(o.isMesh)for(const attribute of ['position','normal'])assert.ok([...o.geometry.getAttribute(attribute).array].every(Number.isFinite));});
  // Find an interior point in each narrow or concave footprint, then hit its actual top.
  for(const polygon of phase.land){let found=null;const lo=polygon.reduce((a,p)=>a.map((v,i)=>Math.min(v,p[i])),[Infinity,Infinity]),hi=polygon.reduce((a,p)=>a.map((v,i)=>Math.max(v,p[i])),[-Infinity,-Infinity]);
   for(let x=1;x<30&&!found;x++)for(let y=1;y<30&&!found;y++){const e=lo[0]+(hi[0]-lo[0])*x/30,n=lo[1]+(hi[1]-lo[1])*y/30;if(inPolygon(e,n,polygon)&&inHarbourLand(e,n,phase))found=[e,n];}
   assert.ok(found);const hit=new Raycaster(new Vector3(found[0]-meta.origin.easting,10,meta.origin.northing-found[1]),new Vector3(0,-1,0)).intersectObject(root,true).filter(h=>h.object.isMesh);assert.ok(hit.length);assert.ok(Math.abs(hit[0].point.y-phase.elevation)<.01);
  }
 }
});
test('eroded caves open at the lip, reach a recessed rock back and lower only their interpreted footprint',()=>{
 for(const c of caveSites(base.researchLandscape)){
  const root=makeRockCave(c,meta.origin);root.updateMatrixWorld(true);
  const ray=new Raycaster(new Vector3(c.anchor[0]-meta.origin.easting+1,c.floorElevation+c.height*.32,meta.origin.northing-c.anchor[1]),new Vector3(-1,0,0));
  assert.equal(ray.intersectObject(root.children[0]).length,0);const hits=ray.intersectObject(root,true);assert.ok(hits.length);assert.ok(hits[0].distance>c.depth*.5,'No dark panel in front of the tunnel');
  assert.ok(Math.abs(caveFloor(c.anchor[0]-.5,c.anchor[1],7,base.researchLandscape)-c.floorElevation)<1e-6);
 }
 assert.equal(caveFloor(296000,4499500,7,base.researchLandscape),7);
});
