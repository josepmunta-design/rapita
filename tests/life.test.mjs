import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {pathPose,boatPose} from '../src/life-plan.mjs';
import {shoreEasting} from '../src/littoral-plan.mjs';
import {makeLife} from '../src/life.ts';
import {makeBoats} from '../src/boats.ts';
import {footprintBlocked} from '../src/walk-plan.mjs';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8'));
const urban=await json('urban-fabric.json'),littoral=await json('littoral.json'),meta=await json('terrain.json');
test('routes use travelled distance, reverse at endpoints and have stable headings and lane offsets',()=>{
 const route=[[0,0],[0,10],[10,10]];
 const p=pathPose(route,5,1,0,1);assert.equal(p.e,-1);assert.equal(p.n,5);assert.equal(p.heading,Math.PI);
 const back=pathPose(route,35,1,0,1);assert.equal(back.e,-1);assert.equal(back.n,5);assert.ok(Math.abs(back.heading)===0);
 assert.deepEqual(pathPose(route,15),pathPose(route,15));
});
test('every moving hull stays seaward of the coast and clear of both harbour piers throughout its cycle',()=>{
 const before=structuredClone(littoral);
 for(const[i,b]of littoral.boats.entries())for(let t=0;t<350;t+=.75){
  const p=boatPose(b,i,t,littoral);assert.ok(Object.values(p).every(Number.isFinite));
  for(const x of[-b.beam/2,0,b.beam/2])for(const z of[-b.length/2,0,b.length/2]){
   const e=p.e+x*Math.cos(p.heading)+z*Math.sin(p.heading),n=p.n+x*Math.sin(p.heading)-z*Math.cos(p.heading);
   assert.ok(e>shoreEasting(n,littoral.shorelineStudy),`${b.id} / ${t} hits coast`);
   assert.equal(Math.abs(e-296574)<3&&Math.abs(n-4499247)<36,false);
   assert.equal(Math.abs(e-296516)<44&&Math.abs(n-4499184)<4,false);
  }
 }
 assert.deepEqual(littoral,before);
});
test('ambient pause freezes every actor and boat while chronological and independent visibility remain reversible',()=>{
 const boats=makeBoats(littoral,meta),life=makeLife(urban,littoral,boats,meta,()=>0),state={year:1800,playing:true,people:true,animals:true};
 assert.equal(life.actors.filter(a=>!a.animal).length,21);assert.equal(life.actors.filter(a=>a.animal).length,3);
 const poses=()=>[...life.actors.map(a=>a.model.root),...boats.children].map(o=>[...o.position.toArray(),...o.rotation.toArray()]);
 life.setState(state);const first=poses();life.update(.06);assert.notDeepEqual(poses(),first);
 life.setState({...state,playing:false});const paused=poses();for(let i=0;i<20;i++)life.update(.06);assert.deepEqual(poses(),paused);
 life.setState({...state,year:1780,people:false});assert.ok(life.actors.every(a=>!a.model.root.visible));
 life.setState({...state,year:1780});assert.equal(life.actors.filter(a=>a.model.root.visible).length,1);
 life.setState({...state,animals:false});assert.ok(life.actors.filter(a=>a.animal).every(a=>!a.model.root.visible));
 life.setState(state);assert.ok(life.actors.every(a=>a.model.root.visible));
 life.root.traverse(o=>{if(o.isMesh)assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite));});
});
test('all pedestrian and animal corridors stay outside residential and service footprints',async()=>{
 const housing=await json('housing.json'),center=await json('center.json'),removed=new Set(center.sites.flatMap(s=>s.replacesHousingIds??[])),polys=[...housing.structures.filter(s=>!removed.has(s.id)),...center.sites,...urban.sites.filter(s=>['forge','guardhouse','service-house'].includes(s.kind)&&s.fromYear<=1800&&(s.toYear??1800)>=1800)].map(s=>s.footprintUTM);
 const life=makeLife(urban,littoral,makeBoats(littoral,meta),meta,()=>0);
 for(const a of life.actors.filter(a=>a.route))for(let phase=0;phase<=1;phase+=.005){const p=pathPose(a.route.points,0,a.speed,phase,a.lane);assert.equal(footprintBlocked(p.e,p.n,polys,a.animal?.9:.32),false);}
});
