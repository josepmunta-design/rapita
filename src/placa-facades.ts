import * as THREE from 'three';
import {wallSurfaceMesh} from './building-plan.mjs';
import {porticoPlan} from './domestic-plan.mjs';
import {placaBuilder} from './placa-model.ts';

/** N030: varied upper fronts above the open arcades. Parcel assignments are C. */
export function makePlacaFacade(s:any){
  const p=porticoPlan(s),b=placaBuilder(),index=Number(s.id.slice(-2)),base=p.top+.20;
  const H=[7.4,7.9,6.5,8.6,7.2,7.6,8.5,7.1,8.1,7.4,8.8,8.1,7.7,8.4][index-1];
  const material=(name:string,c:string)=>{const m=new THREE.MeshStandardMaterial({color:c,roughness:1});m.name=name;return m;};
  const plaster=material('placa-photo-plaster',['#c9c0a8','#d5cbb4','#c2b59c','#ded7c4'][index%4]),stone=material('placa-photo-stone','#e0d5be'),dark=material('placa-photo-recess','#39413c'),shutter=material('placa-photo-shutter',['#78735e','#a19070','#736f62'][index%3]),iron=material('placa-photo-iron','#38403a');
  const count=p.fw>8?3:2,windows=Array.from({length:count},(_,i)=>({x:(i-(count-1)/2)*p.fw/count,width:.92,height:1.8,bottom:.5}));
  const q=wallSurfaceMesh(p.fw,H-base,.38,windows,.08),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);
  // Use the same curved boundary as the original arcade, so the front meets its neighbours.
  if(s.arcSector){const a=Math.PI/20,R=p.fw/(2*Math.sin(a)),pos=g.attributes.position;for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,pos.getZ(i)+R*Math.cos(a)-Math.sqrt(Math.max(0,R*R-x*x)));}g.computeVertexNormals();}
  b.add(g,plaster,0,base,p.fz-.32);
  for(const h of windows){const z=p.fz-.10-(s.arcSector?.20:0),y=base+h.bottom;
    b.box(dark,h.x,y+.9,z-.2,.92,1.8,.08);
    for(const sign of[-1,1])b.box(shutter,h.x+sign*.23,y+.9,z-.14,.43,1.74,.07);
    b.box(stone,h.x,y-.08,z+.08,1.4,.14,.55);
    if(index%3!==0){for(let k=0;k<8;k++)b.box(iron,h.x-.64+k*1.28/7,y+.44,z+.34,.025,.85,.025);b.box(iron,h.x,y+.87,z+.34,1.35,.035,.04);}
    b.box(stone,h.x,y+1.9,z,1.16,.13,.15);
  }
  // Roof and parapet follow the tapered parcel rather than a rectangular slab.
  const vertices=[[-p.fw/2,H,p.fz],[p.fw/2,H,p.fz],[p.bw/2,H,p.bz],[-p.bw/2,H,p.bz]],roof=new THREE.BufferGeometry();roof.setAttribute('position',new THREE.Float32BufferAttribute([0,1,2,0,2,3].flatMap(i=>vertices[i]),3));roof.computeVertexNormals();b.add(roof,plaster);
  // Close the upper sides and rear, so later fronts do not mask an open construction site.
  for(const[a,c]of[[vertices[1],vertices[2]],[vertices[2],vertices[3]],[vertices[3],vertices[0]]]){
    const dx=c[0]-a[0],dz=c[2]-a[2],length=Math.hypot(dx,dz),q=wallSurfaceMesh(length,H-5.65,.3,[],.05),side=new THREE.BufferGeometry();side.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));side.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));side.setIndex(q.indices);side.rotateY(-Math.atan2(dz,dx));b.add(side,plaster,(a[0]+c[0])/2,5.65,(a[2]+c[2])/2);
  }
  b.box(stone,0,H-.12,p.fz-.2,p.fw,.18,.6);b.box(plaster,0,H+.25,p.fz-.25,p.fw,.5,.3);b.box(stone,0,H+.54,p.fz-.25,p.fw,.09,.45);
  const root=b.finish('Façana posterior · comparació N030');root.userData={source:'N030',photoDate:null,individualParcelVerified:false};return root;
}
