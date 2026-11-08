import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {wallPanels,wallSurfaceMesh,planToUTM,effectiveStudyParameters} from '../src/building-plan.mjs';
import {sampleHeight,terrainIndices} from '../src/geo.mjs';

test('real door/window apertures are empty; wall panel area excludes the openings',()=>{
  const holes=[{x:0,width:2,height:4,bottom:0},{x:5,width:1,height:2,bottom:2}];
  const panels=wallPanels(20,8,holes);
  assert.equal(panels.reduce((s,p)=>s+p.width*p.height,0),20*8-2*4-1*2);
  assert.ok(panels.every(p=>!holes.some(h=>Math.abs(p.x-h.x)<h.width/2&&p.y>h.bottom&&p.y<h.bottom+h.height)));
  assert.ok(panels.every(p=>p.width>0&&p.height>0&&p.y+p.height/2<=8));
});
test('facade azimuth rotates local plan towards the correct UTM direction',()=>{
  const a={easting:100,northing:200};
  const front=planToUTM(0,10,a,120);
  assert.ok(Math.abs(front[0]-108.66025403784438)<1e-9);
  assert.ok(Math.abs(front[1]-195)<1e-9);
  const right=planToUTM(10,0,a,120);
  assert.ok(Math.abs(Math.hypot(right[0]-a.easting,right[1]-a.northing)-10)<1e-9);
});
test('window and door reveals form one closed shell with outward normals and no duplicate/internal faces',()=>{
  const L=20,H=8,T=.85,holes=[{x:0,width:2,height:4,bottom:0},{x:5,width:1,height:2,bottom:2}];
  const mesh=wallSurfaceMesh(L,H,T,holes),edges=new Map(),triangles=new Set();
  const point=i=>mesh.positions.slice(i*3,i*3+3);
  const key=p=>p.map(v=>v.toFixed(9)).join(',');
  let area=0;
  for(let i=0;i<mesh.indices.length;i+=3){
    const ids=mesh.indices.slice(i,i+3),[a,b,c]=ids.map(point),ab=b.map((v,j)=>v-a[j]),ac=c.map((v,j)=>v-a[j]);
    const cross=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],size=Math.hypot(...cross);
    assert.ok(size>1e-12);area+=size/2;
    const normal=mesh.normals.slice(ids[0]*3,ids[0]*3+3);assert.ok(cross.reduce((s,v,j)=>s+v*normal[j],0)/size>.999999);
    const keys=[a,b,c].map(key),triangle=keys.slice().sort().join('|');assert.ok(!triangles.has(triangle));triangles.add(triangle);
    for(let e=0;e<3;e++){const edge=[keys[e],keys[(e+1)%3]].sort().join('|');edges.set(edge,(edges.get(edge)||0)+1);}
  }
  // 2 × exposed wall area, plus the actual perimeter of the wall/openings × depth.
  // Extra coplanar jamb boxes or closed panel dividers would increase this surface area.
  assert.ok(Math.abs(area-(2*(L*H-10)+T*(2*L+2*H+8+6)))<1e-6);
  assert.ok([...edges.values()].every(count=>count===2));
  assert.equal(mesh.groups.reduce((s,g)=>s+g.count,0),mesh.indices.length);
});
test('the fine terrain matches original coarse samples and technical support stays above current ground',async()=>{
  const json=async path=>JSON.parse(await readFile(new URL('../'+path,import.meta.url),'utf8'));
  const coarse=await json('public/data/terrain.json'),fine=await json('public/data/esglesia-terrain.json');
  const config=await json('public/data/buildings/esglesia-nova.json');
  const bytes=await readFile(new URL('../public/data/'+fine.heights,import.meta.url));
  const mask=await readFile(new URL('../public/data/'+fine.validity,import.meta.url));
  const coarseBytes=await readFile(new URL('../public/data/'+coarse.heights,import.meta.url));
  const coarseMask=await readFile(new URL('../public/data/'+coarse.validity,import.meta.url));
  const h=Float32Array.from({length:mask.length},(_,i)=>bytes.readFloatLE(i*4));
  assert.equal(fine.step,2);assert.equal(fine.validCount,14641);assert.equal(bytes.length,mask.length*4);
  assert.equal(fine.sourceSha256,coarse.sourceSha256);assert.deepEqual(fine.historicalCorrections,[]);
  let matched=0;
  for(let row=0;row<coarse.height;row++)for(let col=0;col<coarse.width;col++){
    const e=coarse.west+col*10,n=coarse.north-row*10;
    const fx=(e-fine.west)/2,fy=(fine.north-n)/2;
    if(fx<0||fy<0||fx>=fine.width||fy>=fine.height)continue;
    assert.ok(Number.isInteger(fx)&&Number.isInteger(fy));
    const ci=row*coarse.width+col,fi=fy*fine.width+fx;
    assert.equal(mask[fi],coarseMask[ci]);if(mask[fi])assert.equal(h[fi],coarseBytes.readFloatLE(ci*4));matched++;
  }
  assert.ok(matched>500);
  assert.equal(terrainIndices(fine.width,fine.height,mask).length/3,28800);
  const half=config.preview.sideMeters/2;
  for(let x=-half;x<=half;x+=1)for(let z=-half;z<=half;z+=1){
    const [e,n]=planToUTM(x,z,config.anchor,config.orientation.frontAzimuthDegrees);
    const ground=sampleHeight(fine,h,mask,e,n);assert.notEqual(ground,null);
    // Sampling the full footprint rather than just its corners catches modern slopes.
    assert.ok(config.terrain.provisionalBaseElevation>=ground);
  }
  const before=JSON.stringify(config.documented),p=effectiveStudyParameters(config,10);
  assert.equal(p.wallHeightMeters,10);assert.equal(JSON.stringify(config.documented),before);
  assert.equal(config.documented.wallHeightMeters,null);assert.equal(config.documented.wallThicknessMeters,null);
  assert.equal(config.documented.centralRoofBuilt,false);assert.equal(config.terrain.historicalElevation,null);
  assert.equal(config.footprintObservation.historicalFootprintValidated,false);
  assert.throws(()=>effectiveStudyParameters(config,20));
});
