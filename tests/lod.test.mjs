import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {cutCoarsePatch,stitchedPatchIndices} from '../src/lod.mjs';
import {terrainIndices} from '../src/geo.mjs';

test('fine patch has a closed transition ring with no internal cracks, overlaps or inverted faces',()=>{
  const w=121,h=121,ids=stitchedPatchIndices(w,h,new Uint8Array(w*h).fill(1),5),edges=new Map();
  assert.equal(ids.length/3,28416);
  let area=0;
  for(let i=0;i<ids.length;i+=3){
    const [a,b,c]=ids.slice(i,i+3),ax=a%w,az=Math.floor(a/w),bx=b%w,bz=Math.floor(b/w),cx=c%w,cz=Math.floor(c/w);
    const normal=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);assert.ok(normal>0);area+=normal/2;
    for(const [p,q]of[[a,b],[b,c],[c,a]]){const key=[p,q].sort((a,b)=>a-b).join(':');edges.set(key,(edges.get(key)||0)+1);}
  }
  assert.equal(area,(w-1)*(h-1));
  const boundary=[...edges].filter(([,count])=>count===1);assert.equal(boundary.length,96);
  assert.ok([...edges.values()].every(count=>count===1||count===2));
  for(const [edge]of boundary)for(const i of edge.split(':').map(Number)){
    const x=i%w,z=Math.floor(i/w);assert.ok(x===0||x===120||z===0||z===120);assert.ok(x%5===0&&z%5===0);
  }
});
test('coarse terrain is cut only under the fine patch, with identical native boundary heights',async()=>{
  const json=async name=>JSON.parse(await readFile(new URL('../public/data/'+name,import.meta.url),'utf8'));
  const coarse=await json('terrain.json'),fine=await json('esglesia-terrain.json');
  const mask=await readFile(new URL('../public/data/'+coarse.validity,import.meta.url));
  const indices=terrainIndices(coarse.width,coarse.height,mask),cut=cutCoarsePatch(coarse,indices,fine);
  assert.equal((indices.length-cut.length)/3,24*24*2);
  const vertices=new Set(cut),fineIds=stitchedPatchIndices(fine.width,fine.height,new Uint8Array(fine.width*fine.height).fill(1),5);
  const cb=await readFile(new URL('../public/data/'+coarse.heights,import.meta.url)),fb=await readFile(new URL('../public/data/'+fine.heights,import.meta.url));
  for(const i of new Set(fineIds)){
    const x=i%fine.width,z=Math.floor(i/fine.width);if(x!==0&&z!==0&&x!==120&&z!==120)continue;
    const e=fine.west+x*2,n=fine.north-z*2,cx=(e-coarse.west)/10,cz=(coarse.north-n)/10;
    assert.ok(Number.isInteger(cx)&&Number.isInteger(cz));const ci=cz*coarse.width+cx;
    assert.ok(vertices.has(ci));assert.equal(cb.readFloatLE(ci*4),fb.readFloatLE(i*4));
  }
});
