import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';import * as THREE from'three';import{makeCenter}from'../src/center.ts';
const json=async p=>JSON.parse(await readFile(new URL('../public/data/'+p,import.meta.url),'utf8')),housing=await json('housing.json'),data=await json('center.json'),meta=await json('town-terrain.json'),raw=await readFile(new URL('../public/data/'+meta.heights,import.meta.url)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('../public/data/'+meta.validity,import.meta.url));
test('Talavera and Fonda each have one connected roof at a common cornice and no partitions at the wing junctions',()=>{
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillStyle:'',fillRect(){}})})};const scene=makeCenter(data,meta,h,v,housing);delete globalThis.document;
 for(const id of['cases-talavera','fonda-nova']){
  const s=data.sites.find(s=>s.id===id),g=scene.root.children.find(g=>g.userData.centerId===id),roof=g.children.find(o=>o.material?.name==='roof');assert.ok(roof);assert.equal(g.userData.continuousCompound,true);g.position.set(0,0,0);g.rotation.set(0,0,0);g.updateMatrixWorld(true);
  const p=roof.geometry.attributes.position,edges=new Map(),key=i=>[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(4)).join(',');
  for(let i=0;i<p.count;i+=3){const ids=[key(i),key(i+1),key(i+2)];for(const a of ids){if(!edges.has(a))edges.set(a,new Set());ids.forEach(b=>edges.get(a).add(b));}}
  const visited=new Set(),stack=[edges.keys().next().value];while(stack.length){const a=stack.pop();if(visited.has(a))continue;visited.add(a);stack.push(...edges.get(a));}assert.equal(visited.size,edges.size,'one roof surface joins all three wings: '+id);
  assert.equal(new Set(Array.from({length:p.count},(_,i)=>p.getY(i).toFixed(4))).size,2,'one eaves level and one joined ridge level');
  for(let i=0;i<2;i++){
   const joint=s.planBodies[i].filter(a=>s.planBodies[i+1].some(b=>Math.hypot(a[0]-b[0],a[1]-b[1])<1e-7));assert.equal(joint.length,2);
   const [a,b]=joint,mid=new THREE.Vector3((a[0]+b[0])/2,g.userData.corniceElevation-s.wallHeight+3.1,(a[1]+b[1])/2),normal=new THREE.Vector3(b[1]-a[1],0,a[0]-b[0]).normalize();
   const ray=new THREE.Raycaster(mid.clone().addScaledVector(normal,-1),normal,.05,1.95);assert.equal(ray.intersectObject(g,true).length,0,'no internal end wall between adjoining wings');
  }
 }
});
