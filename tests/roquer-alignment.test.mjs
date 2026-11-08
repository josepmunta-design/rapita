import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planPixelToUTM} from '../src/plan1748-layout.mjs';
import {planToUTM} from '../src/plan1748.ts';
import {coastalWaterOutline,coastDistance,landscapeSample} from '../src/littoral-plan.mjs';
const read=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const plan=await read('data/plan-1748.json'),urban=await read('public/data/urban-fabric.json'),lit=await read('public/data/littoral.json');
const near=(a,b)=>assert.ok(Math.hypot(a[0]-b[0],a[1]-b[1])<1e-8,`${a} != ${b}`);

test('all A–G bodies and H–O proposals use the same transform as the top-view overlay',()=>{
 const p=plan.georeference,params={rotation:p.rotationDegrees,scale:p.metersPerPixel,dE:p.offsetMeters[0],dN:p.offsetMeters[1]};
 for(const f of plan.tracing.existing){
  const s=[...lit.sites,...urban.sites].find(s=>s.id===f.id);assert.ok(s,f.id);
  const points=f.line?s.lineUTM:s.footprintUTM;
  assert.equal(points.length,f.pixels.length);
  f.pixels.forEach(([x,y],i)=>{near(points[i],planPixelToUTM(x,y,plan));near(points[i],planToUTM(x,y,plan,params));});
 }
 assert.equal(urban.sites.filter(s=>s.planLetter==='F'&&s.kind==='enclosure').length,3);
 assert.equal(urban.sites.filter(s=>s.planLetter==='D').length,3);assert.equal(urban.sites.filter(s=>s.planLetter==='E').length,3);
 assert.deepEqual(lit.plan1748Project.map(s=>s.letter).sort(),['H','I','K','L','M','N','O']);
 for(const s of lit.plan1748Project){assert.equal(s.projectOnly,true);s.pixels.forEach(([x,y],i)=>near(s.footprintUTM[i],planPixelToUTM(x,y,plan)));}
});

test('rendered sea and interpreted ground retain the re-entrant coastline on both sides of every traced segment',()=>{
 const outline=coastalWaterOutline({...lit,basins:[]});
 for(const point of lit.roquerCoast)assert.ok(outline.some(p=>Math.hypot(p[0]-point[0],p[1]-point[1])<1e-8));
 const sea=[...coastalWaterOutline(lit),[lit.shorelineStudy.at(-1)[0]+10000,4497800],[lit.shorelineStudy[0][0]+10000,4501500]];
 const inside=([e,n])=>{let result=false;for(let i=0,j=sea.length-1;i<sea.length;j=i++){const a=sea[i],b=sea[j];if((a[1]>n)!==(b[1]>n)&&e<(b[0]-a[0])*(n-a[1])/(b[1]-a[1])+a[0])result=!result;}return result;};
 for(let i=2;i<lit.roquerCoast.length-2;i++){
  const a=lit.roquerCoast[i-1],b=lit.roquerCoast[i],e=(a[0]+b[0])/2,n=(a[1]+b[1])/2;
  for(const dx of[-.5,.5])for(const dy of[-.5,.5]){
   const point=[e+dx,n+dy],wet=inside(point);assert.equal(coastDistance(...point,lit)<0,wet);
   if(wet)assert.ok(landscapeSample(...point,8,{...lit,researchLandscape:undefined,canal:{...lit.canal,routeStudy:[[0,0],[0,1]],branchStudy:[[0,0],[0,1]]}}).height<lit.studyWaterElevation);
  }
 }
});

test('documentary snapshots, footprints and published dossier coordinates equal the live map',async()=>{
 const dossiers=await read('public/data/dossiers.json');
 for(const id of['torre-rapita','bateria-roquer','capella-convent','convent-masoveria','cavallerisses-roquer','pou-figueretes','cisterna-fossat-roquer']){
  const doc=await read(`docs/EDIFICIS/${id}/model-actual.json`),positions=await read(`docs/EDIFICIS/${id}/ubicacio.json`);
  for(const {file,data:snapshot} of doc.snapshots){
   const source=await read(file),actual=[...(source.sites??[]),...(source.plan1748Project??[])].find(s=>s.id===snapshot.id);assert.deepEqual(snapshot,actual);
   const position=positions.studyPositions.find(p=>p.modelId===snapshot.id);assert.deepEqual(position.anchor,actual.anchor);assert.deepEqual(position.footprintUTM,actual.footprintUTM??null);
   assert.ok(dossiers.items[id].studyPosition.text.includes(actual.anchor[0].toFixed(3)),id);
  }
 }
});
