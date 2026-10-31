// Superposició del plànol de 1748 (N112 il·l.1) sobre el terreny, per verificar-ne el georeferenciat.
import * as THREE from 'three';
import {toWorld} from './geo.mjs';
import {planPixelToUTM} from './plan1748-layout.mjs';

export type PlanData={image:string;imageSize:[number,number];georeference:{anchorPixel:[number,number];anchorUTM:[number,number];metersPerPixel:number;rotationDegrees:number;offsetMeters:[number,number]}};
export type PlanParams={rotation:number;scale:number;dE:number;dN:number};

/** Píxel del plànol (y cap avall) → UTM. La rotació és antihorària sobre (E,N), amb l'ancoratge de la Torre fix. */
export function planToUTM(px:number,py:number,data:PlanData,p:PlanParams):[number,number]{
  return planPixelToUTM(px,py,data,p) as [number,number];
}

export function makePlan1748(data:PlanData,texture:THREE.Texture,origin:{easting:number;northing:number;elevation:number},sample:(e:number,n:number)=>number|null){
  const [w,h]=data.imageSize,nx=36,ny=26,positions=new Float32Array((nx+1)*(ny+1)*3),uvs=new Float32Array((nx+1)*(ny+1)*2),indices:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i;uvs[k*2]=i/nx;uvs[k*2+1]=1-j/ny;if(i<nx&&j<ny){const a=k,b=k+1,c=k+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const mesh=new THREE.Mesh(geometry,material);mesh.name='Plànol de 1748 · superposició georeferenciada C';mesh.renderOrder=6;mesh.frustumCulled=false;mesh.visible=false;mesh.raycast=()=>{};
  const update=(p:PlanParams)=>{
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const k=j*(nx+1)+i,[e,n]=planToUTM(i/nx*w,j/ny*h,data,p),ground=sample(e,n)??8;
      positions.set(toWorld(e,n,ground+.5,origin),k*3);
    }
    geometry.getAttribute('position').needsUpdate=true;geometry.computeBoundingSphere();
  };
  return {mesh,update,setOpacity:(v:number)=>{material.opacity=v;}};
}
