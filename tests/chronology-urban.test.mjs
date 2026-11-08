import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {entityAt,chronologyAt} from '../src/chronology.mjs';
import {makeEarlyTown} from '../src/early-town.ts';
const json=async p=>JSON.parse((await readFile(new URL('../'+p,import.meta.url),'utf8')).replace(/^\uFEFF/,''));
const data=await json('public/data/urban-chronology.json'),chronology=await json('public/data/chronology.json');

test('1788–1789 housing is an alternative dated witness, never twelve extra houses in 1794',()=>{
  assert.equal(data.count,12);assert.equal(data.structures.length,12);assert.equal(data.identityWith1794,null);assert.equal(data.documentedCompletedCount,null);
  assert.equal(entityAt(chronology,'rental-cohort',1787).visible,false);assert.equal(entityAt(chronology,'rental-cohort',1788).variant,'construction');assert.equal(entityAt(chronology,'rental-cohort',1789).variant,'majority-complete');assert.equal(entityAt(chronology,'rental-cohort',1794).visible,false);
  for(let year=1778;year<=1800;year++)assert.equal(entityAt(chronology,'rental-cohort',year).visible&&chronologyAt(chronology,year).showTown,false);
  for(const s of data.structures){assert.equal(s.identityWith1794,null);assert.equal(s.geometryConfidence,'C');assert.equal(s.state1794,'identity-unknown');assert.ok(s.width*s.depth>=50&&s.width*s.depth<=60);}
  assert.equal(data.structures.filter(s=>s.renderState==='finished').length,data.studyFinishedCount1789);
});

test('Talavera and old service buildings appear from their first reviewed witness, not an invented construction date',()=>{
  for(const[id,year]of[['old-customs',1780],['old-inn',1782],['cases-talavera',1782]]){
    assert.equal(entityAt(chronology,id,year-1).visible,false);assert.equal(entityAt(chronology,id,year).visible,true);assert.match(entityAt(chronology,id,year).dateMeaning,/testimoni/);
  }
});

test('early housing changes roofs and finishes without modifying measured terrain or the later inventory',async()=>{
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};
  const meta=await json('public/data/town-terrain.json'),housing=await json('public/data/housing.json'),raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
  const before=new Uint8Array(h.buffer).slice(),inventory=JSON.stringify(housing),model=makeEarlyTown(data,housing,meta,h,v,chronology);
  const roofs=g=>{let n=0;g.traverse(o=>{if(o.isMesh&&o.material.name==='roof')n++;});return n;};
  assert.equal(roofs(model.construction),0);assert.equal(roofs(model.complete),12);
  assert.ok(model.construction.children.every(g=>g.children.some(o=>o.isMesh&&o.material.name==='bare')),'unfinished walls survive removal of the roof');
  model.setYear(1788);assert.equal(model.root.visible,true);assert.equal(model.construction.visible,true);assert.equal(model.complete.visible,false);
  model.setYear(1789);assert.equal(model.complete.visible,true);model.setYear(1794);assert.equal(model.root.visible,false);model.setYear(1788);assert.equal(model.construction.visible,true);
  assert.deepEqual(new Uint8Array(h.buffer),before);assert.equal(JSON.stringify(housing),inventory);
  model.root.traverse(o=>{if(o.isMesh)assert.ok([...o.geometry.getAttribute('position').array].every(Number.isFinite));});
  delete globalThis.document;
});
