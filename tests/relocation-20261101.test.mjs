import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import * as THREE from 'three';
import {makeRoquerCliff} from '../src/rock-cave.ts';import {caveWorld,caveFloor} from '../src/cave-plan.mjs';import {nearestRoute,landscapeSample} from '../src/littoral-plan.mjs';import {entityAt} from '../src/chronology.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const lit=await json('public/data/littoral.json'),data=lit.researchLandscape,meta=await json('public/data/terrain.json');
test('three caves use the user comment on the south flank and leave the former northern site intact',()=>{
 assert.equal(data.caveFrame.commentId,'498c0593-3701-4287-914a-582c8e3d6f3b');assert.deepEqual(data.caveFrame.center,[296428.711402999,4499119.483827252]);assert.deepEqual(data.cavities[1].anchor,data.caveFrame.center);assert.equal(data.cavities.length,3);
 assert.ok(data.cavities.every(c=>c.anchor[1]<4499150));assert.equal(caveFloor(296392,4499227,7,data),7);
 const model=makeRoquerCliff(data,meta.origin);model.updateMatrixWorld(true);
 for(const c of data.cavities){const f=data.caveFrame,[e,n]=caveWorld(c.along,-4,0,data),ray=new THREE.Raycaster(new THREE.Vector3(e-meta.origin.easting,f.floorElevation+.14+c.height*.32,meta.origin.northing-n),new THREE.Vector3(-f.outward[0],0,f.outward[1]));const hits=ray.intersectObject(model,true);assert.ok(hits.length);assert.ok(hits[0].distance>c.depth+2,'The mouth is open and ends inside the rock');}
});
test('the rock boundary is watertight, has outward winding and consistent normals without double-sided faces',()=>{
 const mesh=makeRoquerCliff(data,meta.origin).children[0],p=mesh.geometry.getAttribute('position'),normals=mesh.geometry.getAttribute('normal'),edges=new Map();assert.equal(mesh.material.side,THREE.FrontSide);let volume=0;
 const vector=i=>new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)),key=i=>vector(i).toArray().map(v=>Math.round(v*1000)).join(',');
 for(let i=0;i<p.count;i+=3){const a=vector(i),b=vector(i+1),c=vector(i+2),face=b.clone().sub(a).cross(c.clone().sub(a));assert.ok(face.length()>1e-8);face.normalize();for(let k=0;k<3;k++)assert.ok(face.dot(new THREE.Vector3(normals.getX(i+k),normals.getY(i+k),normals.getZ(i+k)))>.5);
  volume+=a.dot(b.clone().cross(c))/6;for(const[x,y]of[[i,i+1],[i+1,i+2],[i+2,i]]){const edge=[key(x),key(y)].sort().join('|');edges.set(edge,(edges.get(edge)??0)+1);}
 }assert.ok(volume>0);assert.ok([...edges.values()].every(n=>n===2));
});
test('the coastal houses form three shore-facing clusters while preserving the documented inventory',async()=>{
 const h=await json('public/data/housing.json'),houses=h.structures.filter(s=>s.group==='royal-small-coast');assert.equal(houses.length,14);assert.deepEqual([...new Set(houses.map(s=>s.coastalCluster))],[1,2,3]);assert.equal(h.summary.royalInventoryUnits,81);assert.equal(h.structures.length,58);
 for(const s of houses){const near=nearestRoute(s.anchor.easting,s.anchor.northing,lit.shorelineStudy);assert.ok(near.distance>5&&near.distance<140);assert.match(s.layoutSource,/N112/);assert.equal(s.geometryConfidence,'C');for(const[e,n]of s.footprintUTM)assert.ok(landscapeSample(e,n,2,lit).height>lit.studyWaterElevation);const r=s.frontAzimuthDegrees*Math.PI/180,face=[Math.sin(r),Math.cos(r)],toSea=[near.easting-s.anchor.easting,near.northing-s.anchor.northing];
  // Encaix ICGC 08/11/2026: el tercer grup s'alinea a la baixada de Sant Francesc, que davalla cap al mar; la façana dona al carrer.
  if(s.coastalCluster===3)assert.equal(s.frontAzimuthDegrees,h.townFrame.alongAzimuthDegrees);else assert.ok(face[0]*toSea[0]+face[1]*toSea[1]>0);}
});
test('Torre del Moro has the supplied geographic coordinates, a dated preexistence and a linked dossier',async()=>{
 const landmarks=await json('public/data/landmarks.json'),s=landmarks.sites.find(s=>s.id==='torre-moro'),chronology=await json('public/data/chronology.json'),dossiers=await json('public/data/dossiers.json');
 assert.deepEqual([s.geographicPosition.latitude,s.geographicPosition.longitude],[40.616905,.574878]);assert.ok(Math.abs(s.anchor.easting-294857.738986)<.001);assert.ok(Math.abs(s.anchor.northing-4499058.499279)<.001);assert.equal(entityAt(chronology,s.id,1778).visible,true);assert.equal(s.constructionYear,null);assert.equal(s.historicalHeight,null);assert.ok(dossiers.items[s.id].modelIds.includes(s.id));assert.ok(s.baseWidth>s.width&&s.baseDepth>s.depth);
});
