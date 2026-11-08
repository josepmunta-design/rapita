import * as THREE from 'three';
import {toWorld} from './geo.mjs';
/** Solid reclaimed land, including faces down to the seabed; water remains beneath it. */
export function makeHarbourLand(phase:any,origin:any){
 const root=new THREE.Group();root.name=`Port ${phase.label} / C`;
 const material=new THREE.MeshStandardMaterial({color:'#b9ac91',roughness:1,side:THREE.DoubleSide});
 for(const area of phase.landAreas??phase.land.map((outer:number[][])=>({outer,holes:[]}))){
  const polygon=area.outer;
  const shape=new THREE.Shape();polygon.forEach(([e,n]:number[],i:number)=>{const [x,,z]=toWorld(e,n,0,origin);i?shape.lineTo(x,-z):shape.moveTo(x,-z);});shape.closePath();
  for(const ring of area.holes){const hole=new THREE.Path();ring.forEach(([e,n]:number[],i:number)=>{const[x,,z]=toWorld(e,n,0,origin);i?hole.lineTo(x,-z):hole.moveTo(x,-z);});hole.closePath();shape.holes.push(hole);}
  const geo=new THREE.ExtrudeGeometry(shape,{depth:phase.elevation+2,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,-2,0);
  const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=true;root.add(mesh);

 }
 return root;
}
