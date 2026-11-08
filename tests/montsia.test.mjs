import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {contextTriangles} from '../src/context-plan.mjs';
import {terrainIndices} from '../src/geo.mjs';
import {nativeTriangles,makeLandscape} from '../src/landscape.ts';
const root=new URL('../public/data/',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const grid=async m=>{const b=await readFile(new URL(m.heights,root));return[new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),await readFile(new URL(m.validity,root))];};
const m=await json('context.json'),local=await json('terrain.json'),[h,v]=await grid(m),[lh,lv]=await grid(local);
const faces=contextTriangles(m,h,v,local,lh,lv),east=local.west+(local.width-1)*local.step,south=local.north-(local.height-1)*local.step;

test('Montsià source, sample mask and exact overlapping LiDAR heights are recorded; local assets are unchanged',async()=>{
 assert.equal(m.crs,'EPSG:25831');assert.equal(m.step,50);assert.equal(m.width*m.height,h.length);assert.equal(v.length,h.length);
 assert.equal(v.reduce((a,b)=>a+b,0),m.validCount);assert.ok(m.maximum>750&&m.maximum<770);
 assert.ok(m.overlapCheck.comparedNativeSamples>6000);assert.equal(m.overlapCheck.maximumAbsoluteDifference,0);assert.equal(m.overlapCheck.transformationApplied,false);
 const ids=await readFile(new URL(m.sourceIds,root));assert.ok(ids.includes(1)&&ids.includes(2)&&ids.includes(3));
 for(let i=0;i<h.length;i++){assert.ok(Number.isFinite(h[i]));assert.equal(v[i],Number(ids[i]>0));if(!v[i])assert.equal(h[i],0);}
 for(const[file,hash]of Object.entries({'terrain.f32':'a16ae352f2dad5b5409b0ff49e970684fd36635b6646a9f6e20f7688afe75800','terrain.valid.u8':'f002d406ad7d2346c145f5cadc06a59cc21b368ebf32e20cd4931db4ed4ca0f1'}))assert.equal(createHash('sha256').update(await readFile(new URL(file,root))).digest('hex'),hash);
});

test('mountain context has no triangles inside the local rectangle and joins every native west boundary vertex',()=>{
 assert.ok(faces.length>30000);
 const seam=new Map();
 for(const face of faces){
   const [a,b,c]=face,e=(a[0]+b[0]+c[0])/3,n=(a[1]+b[1]+c[1])/3;
   assert.ok(!(e>local.west&&e<east&&n<local.north&&n>south),'overlapping context triangle');
   // Upward winding in X east / Z south.
   assert.ok((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])>0);
   for(const p of face)if(p[0]===local.west&&p[1]<=local.north&&p[1]>=south)seam.set(p[1],p[2]);
 }
 for(let row=0;row<local.height;row++)if(lv[row*local.width])assert.equal(seam.get(local.north-row*local.step),lh[row*local.width]);
});

test('real rendered canal excavation stays coincident across the new context/local north seam',async()=>{
 const data=await json('littoral.json'),north=nativeTriangles(local,lh,terrainIndices(local.width,2,lv));
 const outside=faces.filter(f=>f.some(p=>p[1]===local.north));
 const meshes=[makeLandscape(local,north,data,true),makeLandscape(m,outside,data,true)],z=local.origin.northing-local.north;
 const edges=meshes.map(mesh=>{const p=mesh.geometry.getAttribute('position'),result=[];for(let i=0;i<p.count;i+=3)for(let j=0;j<3;j++){
  const a=i+j,b=i+(j+1)%3;if(Math.abs(p.getZ(a)-z)>.001||Math.abs(p.getZ(b)-z)>.001)continue;
  const ea=p.getX(a)+local.origin.easting,eb=p.getX(b)+local.origin.easting;if(Math.min(ea,eb)<297005.24||Math.max(ea,eb)>297305.26)continue;
  result.push([[p.getX(a),p.getY(a)],[p.getX(b),p.getY(b)]]);
 }return result;});
 assert.ok(edges.every(e=>e.length>20));
 for(const[source,target]of[[edges[0],edges[1]],[edges[1],edges[0]]])for(const p of source.flat()){
   const match=target.find(([a,b])=>p[0]>=Math.min(a[0],b[0])-.001&&p[0]<=Math.max(a[0],b[0])+.001);assert.ok(match);
   const[a,b]=match,t=(p[0]-a[0])/(b[0]-a[0]);assert.ok(Math.abs(p[1]-(a[1]+t*(b[1]-a[1])))<.003);
 }
});

test('missing context samples remain holes rather than filled terrain',()=>{
 const c={west:0,north:200,step:50,width:5,height:5},l={west:50,north:150,step:10,width:11,height:11},ch=new Float32Array(25).fill(7),cv=new Uint8Array(25),hh=new Float32Array(121).fill(3),vv=new Uint8Array(121).fill(1);
 assert.deepEqual(contextTriangles(c,ch,cv,l,hh,vv),[]);
});
