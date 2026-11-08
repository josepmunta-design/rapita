import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh} from './building-plan.mjs';
import {surfaceMaterial} from './vernacular.ts';
import {serviceHousePlan,VILLAGE_EVIDENCE} from './village-plan.mjs';
// No measured historical facade survives in these inputs. All detail is explicitly C.
export function makeServiceHouse(site:any){
 const root=new THREE.Group(),p=serviceHousePlan(site),{w,d,H,T,rise}=p;
 root.name=site.name??site.id;root.userData.detailConfidence='C';root.userData.evidence=VILLAGE_EVIDENCE.services;
 const materials={lime:surfaceMaterial('lime','#fff9e9','lime',.012),stone:surfaceMaterial('stone','#ede3ce','masonry',.025),wood:surfaceMaterial('wood','#ead8bb','wood',.016),tile:surfaceMaterial('tile','#fff5e7','tile',.025),iron:new THREE.MeshStandardMaterial({color:'#3b3b34',roughness:.9}),dark:new THREE.MeshStandardMaterial({color:'#453c30',roughness:1})};
 const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
 const emit=(source:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,r=0)=>{
  const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();g.rotateY(r);g.translate(x,y,z);if(!g.attributes.normal)g.computeVertexNormals();
  const a=g.attributes.position,n=g.attributes.normal,uv=[];for(let i=0;i<a.count;i++){const ny=Math.abs(n.getY(i));uv.push((Math.abs(n.getZ(i))>.5?a.getX(i):a.getZ(i))/2,ny>.6?a.getX(i)/2:a.getY(i)/2);}g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  const parts=batches.get(m)??[];parts.push(g);batches.set(m,parts);
 };
 const box=(x:number,y:number,z:number,W:number,h:number,D:number,m:THREE.Material,r=0)=>emit(new THREE.BoxGeometry(W,h,D),m,x,y,z,r);
 const face=(poly:number[][],m:THREE.Material,up=false)=>{const a:number[]=[];for(let i=1;i<poly.length-1;i++){let tri=[poly[0],poly[i],poly[i+1]];const cross=(tri[1][2]-tri[0][2])*(tri[2][0]-tri[0][0])-(tri[1][0]-tri[0][0])*(tri[2][2]-tri[0][2]);if(up&&cross<0)tri=[tri[0],tri[2],tri[1]];a.push(...tri.flat());}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(a,3));g.computeVertexNormals();emit(g,m);};
 const wall=(L:number,holes:any[],x:number,z:number,r:number)=>{
  const q=wallSurfaceMesh(L,H,T,holes,.10),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);emit(g,materials.lime,x,0,z,r);
  const detail=(u:number,y:number,v:number,W:number,h:number,D:number,m:THREE.Material)=>box(x+u*Math.cos(r)+v*Math.sin(r),y,z-u*Math.sin(r)+v*Math.cos(r),W,h,D,m,r);
  // Lintels, jambs, deep timber leaves and iron bars sit inside the existing envelope.
  for(const h of holes){
   detail(h.x,h.bottom+h.height+.07,T/2-.015,h.width+.24,.14,.12,materials.stone);
   for(const sign of[-1,1])detail(h.x+sign*(h.width/2+.06),h.bottom+h.height/2,T/2-.02,.12,h.height,.12,materials.stone);
   if(h.door){for(let k=0;k<6;k++)detail(h.x-h.width/2+(k+.5)*h.width/6,h.height/2,-.06,h.width/6-.012,h.height-.06,.075,materials.wood);for(const y of[.35,h.height-.35])detail(h.x,y,.005,h.width-.1,.08,.045,materials.iron);detail(h.x+h.width*.27,1,.04,.06,.18,.055,materials.iron);}
   else{
    detail(h.x,h.bottom+h.height/2,-.06,h.width-.04,h.height-.04,.05,materials.wood);
    detail(h.x,h.bottom-.055,T/2,h.width+.2,.11,.2,materials.stone);
    for(let u=-h.width/2+.12;u<h.width/2;u+=.17)detail(h.x+u,h.bottom+h.height/2,T/2-.015,.022,h.height,.025,materials.iron);
   }
  }
 };
 box(0,-.08,0,w,.16,d,materials.stone);
 wall(w,p.front,0,d/2-T/2,0);wall(w,p.back,0,-d/2+T/2,Math.PI);
 wall(d-2*T,p.side,w/2-T/2,0,Math.PI/2);wall(d-2*T,p.side,-w/2+T/2,0,-Math.PI/2);
 const e=.12;face([[-w/2-e,H,-d/2-e],[w/2+e,H,-d/2-e],[w/2+e,H+rise,0],[-w/2-e,H+rise,0]],materials.tile,true);
 face([[-w/2-e,H+rise,0],[w/2+e,H+rise,0],[w/2+e,H,d/2+e],[-w/2-e,H,d/2+e]],materials.tile,true);
 for(const sign of[-1,1]){face((sign<0?[[sign*w/2,H,-d/2],[sign*w/2,H,d/2],[sign*w/2,H+rise,0]]:[[sign*w/2,H,d/2],[sign*w/2,H,-d/2],[sign*w/2,H+rise,0]]),materials.lime);box(0,H-.03,sign*d/2,w+.18,.13,.16,materials.wood);}
 const ridge=new THREE.CylinderGeometry(.10,.10,w+.24,8);ridge.rotateZ(Math.PI/2);emit(ridge,materials.tile,0,H+rise+.02,0);
 for(let x=-w/2+.6;x<w/2;x+=1.25)for(const sign of[-1,1])box(x,H-.13,sign*(d/2-.15),.14,.18,.5,materials.wood);
 if(p.upper)box(0,3.05,0,w-.8,.2,d-.8,materials.wood);
 if(site.kind==='forge'){
  box(-w*.25,.45,-d*.22,1.45,.9,1.2,materials.stone);box(-w*.25,1.2,-d*.22,1.4,.65,1.1,materials.dark);
  box(-w*.25,H-.1,-d*.22,.6,H+.5,.6,materials.stone);box(-w*.25,H+rise+.3,-d*.22,.75,.16,.75,materials.stone);
  box(0,.65,0,.72,.18,.45,materials.iron);box(0,.35,0,.3,.6,.28,materials.wood);
 }else if(site.chimney){box(-w/3,H+.4,-d/4,.65,1.7,.65,materials.stone);box(-w/3,H+1.25,-d/4,.8,.15,.8,materials.stone);}
 for(const[m,parts]of batches){const g=mergeGeometries(parts,false);if(!g)throw Error('Service house geometry');const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);parts.forEach(p=>p.dispose());}
 return root;
}
