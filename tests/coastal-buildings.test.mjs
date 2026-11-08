import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {coastalBuildingAudit,coastalSupport,deckSupport,footprintSamples,workerHutFootprints,workerHutsPlan,alignGypsumToInn,alignHealthToQuay,alignWorkerCampToBank} from '../src/coastal-buildings.mjs';
import {nearestRoute} from '../src/littoral-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const [urban,littoral,housing,center,landmarks,before]=await Promise.all(['public/data/urban-fabric.json','public/data/littoral.json','public/data/housing.json','public/data/center.json','public/data/landmarks.json','data/coastal-placement-review-before.json'].map(json));
test('every occupied footprint, including each of the twelve huts, has land or an actual quay under its full footprint',()=>{
 const report=coastalBuildingAudit({urban,littoral,housing,center,landmarks});
 assert.equal(report.unsupportedBuildings.length,0,JSON.stringify(report.unsupportedBuildings));assert.ok(report.samples>15000);
 const camp=urban.sites.find(s=>s.id==='barraques-obrers');assert.equal(workerHutsPlan(camp).length,12);assert.equal(workerHutFootprints(camp,urban.frame).length,12);
 for(const poly of workerHutFootprints(camp,urban.frame))for(const p of footprintSamples(poly,.5)){assert.ok(coastalSupport(...p,littoral));assert.ok(nearestRoute(...p,littoral.canal.routeStudy).distance>littoral.canal.studyWidth/2+2.9);}
});
test('the rejected workshop and mill positions really fail the water check; no shoreline or basin is expanded to cover them',()=>{
 for(const id of['forn-moli-guix','molinet']){const s=before.before.urban.find(s=>s.id===id),a=(s.alongAzimuthDegrees??urban.frame.alongAzimuthDegrees)*Math.PI/180,poly=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>[s.utmAnchor[0]+x*s.width/2*Math.cos(a)+y*s.depth/2*Math.sin(a),s.utmAnchor[1]-x*s.width/2*Math.sin(a)+y*s.depth/2*Math.cos(a)]);assert.ok(footprintSamples(poly).some(p=>!coastalSupport(...p,littoral)),id);}
 const oldMill=before.before.urban.find(s=>s.id==='molinet');assert.equal(coastalSupport(...oldMill.utmAnchor,littoral)?.kind,'land','checking only the centre would miss this regression');
 assert.deepEqual(littoral.shorelineStudy,before.waterGeometry.shorelineStudy);assert.deepEqual(littoral.basins,before.waterGeometry.basins);const {studyLengthMeters,...canal}=littoral.canal;assert.deepEqual(canal,before.waterGeometry.canal);assert.deepEqual(littoral.portWorks.breakwaters,before.waterGeometry.breakwaters);
 const mill=urban.unplacedSites.find(s=>s.id==='molinet');assert.equal(mill.placementStatus,'unlocated');assert.equal(mill.historicalCoordinates,null);assert.equal(mill.anchor,undefined);assert.equal(mill.utmAnchor,undefined);assert.equal(urban.sites.some(s=>s.id==='molinet'),false);
});
test('Sanitat is a documented quay building, fully on the rendered deck, with no new island beneath it',()=>{
 const site=littoral.sites.find(s=>s.id==='health');
 for(const p of footprintSamples(site.footprintUTM,.25)){const support=deckSupport(...p,littoral);assert.equal(support?.kind,'quay');assert.equal(support.elevation,site.technicalBaseElevation);}
 const old=before.before.health;assert.ok(Math.hypot(site.anchor[0]-old.anchor[0],site.anchor[1]-old.anchor[1])<.22);
 assert.equal(littoral.portWorks.width,4.2);assert.equal(littoral.studyWaterElevation,.45);
});
test('relational placement remains reproducible and inventories and historical coordinates stay unchanged',async()=>{
 const u=await json('data/urban-fabric.json'),l=await json('data/littoral-1800.json'),orig=structuredClone({u,l});
 alignGypsumToInn(u,l);alignWorkerCampToBank(u,l);alignHealthToQuay(l);
 for(const id of['forn-moli-guix','barraques-obrers']){const s=u.sites.find(s=>s.id===id),old=orig.u.sites.find(s=>s.id===id);assert.deepEqual(s.utmAnchor,old.utmAnchor);assert.equal(s.alongAzimuthDegrees,old.alongAzimuthDegrees);}
 const a=l.sites.find(s=>s.id==='health').anchor,b=orig.l.sites.find(s=>s.id==='health').anchor;assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8);
 const workshop=urban.sites.find(s=>s.id==='forn-moli-guix'),inn=littoral.sites.find(s=>s.id==='old-inn');assert.ok(workshop.anchor[1]>inn.anchor[1]);assert.equal(workshop.historicalFootprint,null);assert.equal(workshop.relationalPlacement.geometryConfidence,'C');
 assert.equal(housing.summary.royalInventoryUnits,81);assert.equal(urban.privateLedger.documentedMixedUnits,38);
 const dossiers=await json('public/data/dossiers.json');assert.deepEqual(dossiers.items.molinet.modelIds,[]);assert.ok(dossiers.items.molinet.withoutModel);assert.equal(dossiers.items.molinet.studyPosition,null);
});
