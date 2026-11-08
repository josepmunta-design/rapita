import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { toWorld, sampleHeight, terrainIndices } from '../src/geo.mjs';

test('UTM north is negative Z; elevations are not exaggerated', () => {
  assert.deepEqual(toWorld(296400,4499400,36,{easting:296389,northing:4499365,elevation:0}),[11,36,-35]);
});
test('interpolation preserves slope and rejects NoData and out-of-bounds locations', () => {
  const m={west:100,north:200,step:10,width:2,height:2};
  const h=new Float32Array([0,10,20,30]),v=new Uint8Array([1,1,1,1]);
  assert.equal(sampleHeight(m,h,v,105,195),15);
  assert.equal(sampleHeight(m,h,v,110,190),30);
  assert.equal(sampleHeight(m,h,v,99,195),null);
  v[3]=0;assert.equal(sampleHeight(m,h,v,105,195),null);
});
test('mesh omits triangles touching NoData and faces upwards', () => {
  assert.deepEqual(terrainIndices(2,2,new Uint8Array([1,1,1,1])),[0,2,1,1,2,3]);
  assert.deepEqual(terrainIndices(2,2,new Uint8Array([0,1,1,1])),[1,2,3]);
  assert.deepEqual(terrainIndices(2,2,new Uint8Array([1,0,1,1])),[]);
});
test('generated geographic assets are complete, finite, reproducible and keep unknown geometry null',async()=>{
  const root=new URL('../public/data/',import.meta.url);
  const m=JSON.parse(await readFile(new URL('terrain.json',root),'utf8'));
  const bytes=await readFile(new URL(m.heights,root)),mask=await readFile(new URL(m.validity,root));
  assert.equal(m.crs,'EPSG:25831');assert.equal(m.step,10);
  assert.equal(m.width*m.height,m.sampleCount);assert.equal(bytes.length,m.sampleCount*4);
  assert.equal(mask.length,m.sampleCount);assert.equal(mask.reduce((a,b)=>a+b,0),m.validCount);
  assert.match(m.sourceSha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(m.historicalCorrections,[]);
  // Decode declared byte order explicitly, independently of browser-native Float32Array.
  const heights=Float32Array.from({length:mask.length},(_,i)=>bytes.readFloatLE(i*4));
  assert.ok([...heights].every(Number.isFinite));
  assert.ok([...mask].every(v=>v===0||v===1));
  const points=JSON.parse(await readFile(new URL('monuments.geojson',root),'utf8'));
  assert.equal(points.features.length,7);
  for(const {properties:p} of points.features){
    const h=sampleHeight(m,heights,mask,p.utm_x,p.utm_y);
    assert.notEqual(h,null,p.id);assert.ok(Math.abs(h-p.terrainHeight)<1e-6,p.id);
    assert.equal(p.geometry1800,null);assert.equal(p.certainty.footprint,'D');
    assert.equal(p.certainty.height,'D');assert.ok(p.sourceRefs.length>0);
  }
  // No indexed vertex refers to a missing raster sample.
  const indices=terrainIndices(m.width,m.height,mask);
  assert.ok(indices.length>0);assert.equal(indices.length%3,0);
  assert.ok(indices.every(i=>mask[i]===1));
});
