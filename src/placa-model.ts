import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Small batched builder for the photographed architecture of the square. */
export function placaBuilder(){
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const add=(source:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0)=>{
    const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();
    g.translate(x,y,z);if(!g.attributes.normal)g.computeVertexNormals();
    if(!g.attributes.uv){const p=g.attributes.position,uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/3,p.getY(i)/3);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
    const parts=batches.get(m)??[];parts.push(g);batches.set(m,parts);
  };
  const box=(m:THREE.Material,x:number,y:number,z:number,w:number,h:number,d:number)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const finish=(name:string)=>{const root=new THREE.Group();root.name=name;
    for(const[m,parts]of batches){const g=mergeGeometries(parts,false);if(!g)throw new Error('Plaça: geometria incompatible');root.add(new THREE.Mesh(g,m));parts.forEach(p=>p.dispose());}return root;};
  return{add,box,finish};
}

export function archedPanel(w:number,h:number,rise=w/2){
  const s=new THREE.Shape(),spring=h-rise;s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,spring);
  for(let i=0;i<=32;i++){const a=i*Math.PI/32;s.lineTo(w/2*Math.cos(a),spring+rise*Math.sin(a));}s.closePath();return s;
}

export function archBand(w:number,spring:number,rise:number,band:number,depth:number){
  const shape=new THREE.Shape();
  for(let i=0;i<=40;i++){const a=i*Math.PI/40,x=w/2*Math.cos(a),y=spring+rise*Math.sin(a);i?shape.lineTo(x,y):shape.moveTo(x,y);}
  for(let i=40;i>=0;i--){const a=i*Math.PI/40;shape.lineTo((w/2+band)*Math.cos(a),spring+(rise+band)*Math.sin(a));}
  shape.closePath();return new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false});
}
