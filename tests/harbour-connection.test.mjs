import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {coastalWaterOutline,coastalWaterEasting,landscapeSample,routeStations,canalWaterLevel} from '../src/littoral-plan.mjs';
import {makeLittoral} from '../src/littoral.ts';
import {sampleHeight} from '../src/geo.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8'));
const data=await json('public/data/littoral.json'),meta=await json('public/data/terrain.json'),chronology=await json('public/data/chronology.json');
const raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));

test('sea boundary opens the basin and keeps its exact piecewise coastline instead of a land plug',()=>{
  const outline=coastalWaterOutline(data);assert.ok(outline.length>data.shorelineStudy.length);
  const basin=data.basins.find(b=>b.id==='small'),n=basin.center[1],crossings=basin.polygonUTM.flatMap((a,i,ps)=>{const b=ps[(i+1)%ps.length];return(n>=Math.min(a[1],b[1])&&n<=Math.max(a[1],b[1])&&a[1]!==b[1])?[a[0]+(b[0]-a[0])*(n-a[1])/(b[1]-a[1])]:[];});assert.ok(coastalWaterEasting(n,data)<=Math.min(...crossings)+1e-8);
  assert.equal(coastalWaterEasting(4498500,data),data.shorelineStudy.find(p=>p[1]===4498500)[0]);
});

test('one rendered water polygon covers a continuous path from the canal mouth through the basin to the sea',()=>{
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
  const model=makeLittoral(data,meta,h,v,chronology),g=model.openHarbour.geometry,p=g.getAttribute('position'),index=g.index;
  const contains=(e,n)=>{const x=e-meta.origin.easting,z=meta.origin.northing-n;for(let i=0;i<index.count;i+=3){const a=index.getX(i),b=index.getX(i+1),c=index.getX(i+2),ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz),u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,w=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den;if(u>=-1e-6&&w>=-1e-6&&u+w<=1+1e-6)return true;}return false;};
  const basin=data.basins.find(b=>b.id==='large'),path=[data.canal.branchStudy.at(-1),basin.center,[Math.max(...basin.polygonUTM.map(p=>p[0]))+50,basin.center[1]]];
  for(let i=0;i<path.length-1;i++)for(let j=0;j<=100;j++){const e=path[i][0]+(path[i+1][0]-path[i][0])*j/100,n=path[i][1]+(path[i+1][1]-path[i][1])*j/100,height=sampleHeight(meta,h,v,e,n);assert.ok(contains(e,n),'No rendered water at '+[e,n]);if(height!==null)assert.ok(landscapeSample(e,n,height,data).height<data.studyWaterElevation-.5,'Land plug at '+[e,n]);}
  model.setYear(1788);assert.equal(model.openHarbour.visible,false);assert.equal(model.earlierCoast.visible,true);model.setYear(1800);assert.equal(model.openHarbour.visible,true);
  delete globalThis.document;
});

test('branch embankments cannot refill the main canal bed at a junction',()=>{
  for(const s of routeStations(data.canal.routeStudy,2).filter(s=>s.along<350)){
    const original=sampleHeight(meta,h,v,s.e,s.n);if(original===null)continue;
    const water=canalWaterLevel(s.along,s.length,data.studyWaterElevation);assert.ok(landscapeSample(s.e,s.n,original,data).height<=water-.8);
  }
});

// The old branch ended 2 m short of the basin: test the actual water triangles,
// rather than only a distance mask whose rounded end could hide that gap.
test('rendered branch overlaps the harbour water across its entire final section',()=>{
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
 const model=makeLittoral(data,meta,h,v,chronology);
 const contains=(mesh,e,n)=>{const p=mesh.geometry.getAttribute('position'),ids=mesh.geometry.index,x=e-meta.origin.easting,z=meta.origin.northing-n,count=ids?ids.count:p.count;for(let i=0;i<count;i+=3){const a=ids?ids.getX(i):i,b=ids?ids.getX(i+1):i+1,c=ids?ids.getX(i+2):i+2,ax=p.getX(a),az=p.getZ(a),bx=p.getX(b),bz=p.getZ(b),cx=p.getX(c),cz=p.getZ(c),den=(bz-cz)*(ax-cx)+(cx-bx)*(az-cz),u=((bz-cz)*(x-cx)+(cx-bx)*(z-cz))/den,w=((cz-az)*(x-cx)+(ax-cx)*(z-cz))/den;if(u>=-1e-6&&w>=-1e-6&&u+w<=1+1e-6)return true;}return false;};
 for(const st of routeStations(data.canal.branchStudy,.25)){const e=st.e,n=st.n;assert.ok(contains(model.branchWater,e,n)||contains(model.openHarbour,e,n),'Water gap at '+[e,n]);const raw=sampleHeight(meta,h,v,e,n);if(raw!==null)assert.ok(landscapeSample(e,n,raw,data).height<data.studyWaterElevation-.5);}
 delete globalThis.document;
});
