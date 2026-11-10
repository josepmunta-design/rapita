import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {coastDistance,landscapeSample,routeStations,nearestRoute,canalWaterLevel} from '../src/littoral-plan.mjs';
import {inPolygon} from '../src/harbour-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const lit=await json('public/data/littoral.json'),urban=await json('public/data/urban-fabric.json'),ref=await json('data/layout-reference-1800.json');

test('the terminal canal runs on land: no sea between the canal and the town (N112 il·l.4 estimated coast)',()=>{
 const stations=routeStations(lit.canal.routeStudy,2).filter(s=>s.along>15&&s.n<4500600);
 for(const s of stations)assert.ok(coastDistance(s.e,s.n,lit)>0,`canal station in the sea at ${s.e.toFixed(1)}, ${s.n.toFixed(1)}`);
 // Along arm 19, the 60 m strip towards the town is land.
 for(const s of stations.filter(s=>s.n>4499262&&s.n<4499480))for(let d=6;d<=60;d+=6)assert.ok(coastDistance(s.e-d,s.n,lit)>0,`water west of arm 19 at ${s.n.toFixed(0)}`);
 // The canal enters the dàrsena gran at its NW corner.
 const mouth=lit.canal.routeStudy[0],big=lit.basins.find(b=>b.id==='large');
 assert.ok(nearestRoute(...mouth,[...big.polygonUTM,big.polygonUTM[0]]).distance<6);
 assert.equal(ref.estimatedCoast.length,7);assert.match(lit.coastRevision.source,/Línia de costa estimada/);
});

test('the plain north-east of the town is land in 1800; the former north-east bay is gone',()=>{
 for(const p of[[297160,4500330],[297700,4500300],[297000,4500000],[298000,4500800],[296900,4499700]])assert.ok(coastDistance(...p,lit)>0,'sea at '+p);
 for(const p of[[296700,4499250],[297500,4499450],[298300,4499500]])assert.ok(coastDistance(...p,lit)<0,'land at '+p);
});

test('dàrsena petita holds canal water and the unfinished enclusa stays dry and closed to the sea',()=>{
 const w=lit.canalWorks,dock=w.darsenaPetita,lock=w.enclusa;
 const c=[dock.polygonUTM.reduce((v,p)=>v+p[0],0)/4,dock.polygonUTM.reduce((v,p)=>v+p[1],0)/4];
 assert.ok(inPolygon(...c,dock.polygonUTM));
 const q=nearestRoute(...c,lit.canal.routeStudy),level=canalWaterLevel(q.along,q.length,lit.studyWaterElevation);
 assert.ok(landscapeSample(...c,2,lit).height<level-.5,'dock is not excavated');
 const [a,b]=lock.axisUTM,mid=[(a[0]+b[0])/2,(a[1]+b[1])/2];
 const floor=landscapeSample(...mid,2,lit).height;assert.ok(floor>lit.studyWaterElevation&&floor<=lock.floorElevation+1e-6,'lock floor '+floor);
 assert.ok(coastDistance(...b,lit)>10,'the lock reaches the sea');
 assert.match(lock.state,/sense concloure/);assert.equal(w.historicalCoordinates,null);
});

test('documented works added in 08/11/2026 carry indicative positions, sources and the C flag',()=>{
 for(const[id,kind,maxPrecision]of[['casa-bous','farmhouse',300],['rajolar-rabosa','brickworks',350],['pedrera-guardiola','quarry',80]]){
  const s=urban.sites.find(s=>s.id===id);assert.ok(s,id);assert.equal(s.kind,kind);assert.ok(s.positionSource.precisionMeters<=maxPrecision);assert.match(s.evidence,/N112/);assert.ok(coastDistance(...s.anchor,lit)>50,id+' near the sea');
 }
 const mill=urban.unplacedSites.find(s=>s.id==='molinet');assert.equal(mill.estimatedPosition.outsideModelledTerrain,true);assert.ok(mill.estimatedPosition.utm[0]>298350);
});

test('no land-side NoData holes: wherever the 1800 coast declares land, the 10 m terrain has a mesh',async()=>{
 const meta=await json('public/data/terrain.json'),valid=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));let holes=0;
 for(let r=0;r<meta.height;r++)for(let c=0;c<meta.width;c++){if(valid[r*meta.width+c])continue;const e=meta.west+c*meta.step,n=meta.north-r*meta.step;if(n<4499100||n>4501000)continue;if(coastDistance(e,n,lit)>0)holes++;}
 assert.equal(holes,0);
});
