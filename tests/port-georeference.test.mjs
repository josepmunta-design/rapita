import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {Raycaster,Vector3} from 'three';
import {makeHarbourCache} from '../src/harbour-cache.ts';
import {inHarbourLand} from '../src/harbour-plan.mjs';
import {makeRockCave,makeRoquerCliff} from '../src/rock-cave.ts';
import {caveSites,caveWorld} from '../src/cave-plan.mjs';
import {landscapeSample} from '../src/littoral-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const history=await json('harbour-history.json'),lit=await json('littoral.json'),meta=await json('terrain.json');
test('screenshot registration has independent coordinate controls and metre-scale residuals',()=>{
 for(const phase of history.phases.filter(p=>p.fromYear!==1990)){
  const reg=phase.registration;assert.ok(reg.inliers>1500);assert.ok(reg.rmseMeters<1.3);assert.ok(reg.points.length>=12);
  for(const point of reg.points){const [x,y]=point.pixel,m=reg.matrix,px=m[0][0]*x+m[0][1]*y+m[0][2],py=m[1][0]*x+m[1][1]*y+m[1][2];assert.ok(Math.hypot(295500+px*5/3-point.utm[0],4500000-py*5/3-point.utm[1])<3);}
 }
});
test('later land contains all earlier land: dated reclamation never becomes sea again',()=>{
 for(let i=1;i<history.phases.length;i++){
  const before=history.phases[i-1],after=history.phases[i];assert.ok(after.landAreaSquareMeters>=before.landAreaSquareMeters);
  for(let e=295505;e<297700;e+=29)for(let n=4498005;n<4500000;n+=31)if(inHarbourLand(e,n,before))assert.ok(inHarbourLand(e,n,after),JSON.stringify({e,n,year:after.fromYear}));
 }
});
test('dated port geometry is reused in thousands of year changes, without rebuilding buffers',async()=>{
 const heights=new Map(await Promise.all(history.phases.map(async p=>{const b=await readFile(new URL('../public/data/'+p.terrainFile,import.meta.url));return [p.fromYear,new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))];})));
 const cache=makeHarbourCache(history,meta.origin,heights),geometries=[...cache.groups.values()].map(g=>g.children[0].geometry),start=performance.now();
 for(let i=0;i<10000;i++)cache.setPhase(history.phases[i%history.phases.length]);
 const elapsed=performance.now()-start;assert.ok(elapsed<200,`10000 transitions: ${elapsed} ms`);
 assert.deepEqual([...cache.groups.values()].map(g=>g.children[0].geometry),geometries);assert.equal([...cache.groups.values()].filter(g=>g.visible).length,1);cache.setPhase(null);assert.ok([...cache.groups.values()].every(g=>!g.visible));console.log('Cached port transition average:',elapsed/10000,'ms');
});
test('all three lateral caves have a rock roof covering the whole tunnel and are spread along the cliff',()=>{
 const cavities=caveSites(lit.researchLandscape);assert.equal(cavities.length,3);assert.ok(cavities[2].along-cavities[0].along>20);
 for(const c of cavities){const model=makeRoquerCliff(lit.researchLandscape,meta.origin);model.updateMatrixWorld(true);
  for(const fraction of [.12,.4,.7,.9]){const [e,n]=caveWorld(c.along,c.depth*fraction,0,lit.researchLandscape),ray=new Raycaster(new Vector3(e-meta.origin.easting,20,meta.origin.northing-n),new Vector3(0,-1,0)),hits=ray.intersectObject(model,true);assert.ok(hits.length);assert.ok(hits[0].point.y>c.floorElevation+c.height*.78,'Continuous exterior roof required');}
 }
});
test('the marked Companyia building is on land from the initial shore, with its 1857 witness retained',async()=>{
 const urban=await json('urban-fabric.json'),site=urban.sites.find(s=>s.id==='casotes-companyia');assert.equal(site.fromYear,1857);assert.deepEqual(site.anchor,[296840,4499555]);
 for(const [e,n]of site.footprintUTM){assert.ok(landscapeSample(e,n,2,lit).height>lit.studyWaterElevation);for(const phase of history.phases)assert.ok(inHarbourLand(e,n,phase));}
});
