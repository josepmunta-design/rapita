import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {terrainIndices} from '../src/geo.mjs';
import {nativeTriangles,regionalTriangles,makeLandscape} from '../src/landscape.ts';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const grid=async m=>{const b=await readFile(new URL('../public/data/'+m.heights,import.meta.url));return[new Float32Array(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)),await readFile(new URL('../public/data/'+m.validity,import.meta.url))];};
test('canal excavation keeps coincident surfaces across differently subdivided regional edges',async()=>{
 const m=await json('terrain.json'),r=await json('region.json'),data=await json('littoral.json'),[h,v]=await grid(m),[rh,rv]=await grid(r);
 const north=nativeTriangles(m,h,terrainIndices(m.width,2,v)),south=regionalTriangles(r,rh,rv,m,h,v).filter(f=>f.some(p=>p[1]===m.north));
 const a=makeLandscape(m,north,data,true),b=makeLandscape(r,south,data,true),z=m.origin.northing-m.north;
 const edges=mesh=>{const p=mesh.geometry.getAttribute('position'),set=new Set();for(let i=0;i<p.count;i+=3)for(let j=0;j<3;j++){
  const k=i+j,l=i+(j+1)%3;if(Math.abs(p.getZ(k)-z)>.001||Math.abs(p.getZ(l)-z)>.001)continue;
  const x0=p.getX(k)+m.origin.easting,x1=p.getX(l)+m.origin.easting;if(Math.min(x0,x1)<297005.24||Math.max(x0,x1)>297305.26)continue;
  const point=n=>[p.getX(n),p.getY(n),p.getZ(n)].map(v=>Math.round(v*1000)/1000).join(',');set.add([point(k),point(l)].sort().join('|'));
 }return[...set].sort();};
 const parse=mesh=>edges(mesh).map(s=>s.split('|').map(p=>p.split(',').map(Number)));
 const ea=parse(a),eb=parse(b);assert.ok(ea.length>20&&eb.length>20);
 // Extra vertices on an unchanged linear edge are allowed; they must lie on
 // exactly the same surface, including where the nonlinear canal cut crosses it.
 for(const [source,target]of[[ea,eb],[eb,ea]])for(const p of source.flat()){
   const edge=target.find(([a,b])=>p[0]>=Math.min(a[0],b[0])-.001&&p[0]<=Math.max(a[0],b[0])+.001);assert.ok(edge);
   const [u,v]=edge,t=(p[0]-u[0])/(v[0]-u[0]),level=u[1]+t*(v[1]-u[1]);assert.ok(Math.abs(p[1]-level)<=.002,JSON.stringify({p,level}));
 }
});
