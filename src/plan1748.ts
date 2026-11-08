// Terrain-projected documentary maps. The existing 1748 API remains available.
import * as THREE from 'three';
import {toWorld} from './geo.mjs';
import {planPixelToUTM} from './plan1748-layout.mjs';

export type PlanData={id?:string;title?:string;image:string;imageSize:[number,number];pixelBounds?:[number,number,number,number];georeference:{anchorPixel:[number,number];anchorUTM:[number,number];metersPerPixel:number;rotationDegrees:number;offsetMeters:[number,number]}};
export type PlanParams={rotation:number;scale:number;dE:number;dN:number};

/** Píxel del plànol (y cap avall) → UTM. La rotació és antihorària sobre (E,N), amb l'ancoratge de la Torre fix. */
export function planToUTM(px:number,py:number,data:PlanData,p:PlanParams):[number,number]{
  return planPixelToUTM(px,py,data,p) as [number,number];
}

export function makeProjectedPlan(data:PlanData,texture:THREE.Texture,origin:{easting:number;northing:number;elevation:number},sample:(e:number,n:number)=>number|null){
  const [w,h]=data.imageSize,[left,top,right,bottom]=data.pixelBounds??[0,0,w,h],nx=data.pixelBounds?Math.min(180,Math.ceil((right-left)*data.georeference.metersPerPixel/4)):36,ny=data.pixelBounds?Math.min(180,Math.ceil((bottom-top)*data.georeference.metersPerPixel/4)):26,positions=new Float32Array((nx+1)*(ny+1)*3),uvs=new Float32Array((nx+1)*(ny+1)*2),indices:number[]=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const k=j*(nx+1)+i;uvs[k*2]=(left+i/nx*(right-left))/w;uvs[k*2+1]=1-(top+j/ny*(bottom-top))/h;if(i<nx&&j<ny){const a=k,b=k+1,c=k+nx+1,d=c+1;indices.push(a,c,b,b,c,d);}}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uvs,2));geometry.setIndex(indices);
  const material=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.6,depthWrite:false,side:THREE.DoubleSide,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  const paperFilter={value:0};material.onBeforeCompile=shader=>{shader.uniforms.planPaperFilter=paperFilter;shader.fragmentShader='uniform float planPaperFilter;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat planLuma=dot(diffuseColor.rgb,vec3(.299,.587,.114));\ndiffuseColor.a*=mix(1.0,1.0-smoothstep(.45,.96,planLuma),planPaperFilter);');};material.customProgramCacheKey=()=> 'projected-document-paper-v1';
  const mesh=new THREE.Mesh(geometry,material);mesh.name=data.title??'Plànol de 1748 · superposició georeferenciada C';mesh.renderOrder=data.id==='plan-port-1945'?8:data.id==='plan-reverte'?7:6;mesh.frustumCulled=false;mesh.visible=false;mesh.raycast=()=>{};
  const update=(p:PlanParams)=>{
    for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){
      const k=j*(nx+1)+i,[e,n]=planToUTM(left+i/nx*(right-left),top+j/ny*(bottom-top),data,p),ground=sample(e,n)??8;
      positions.set(toWorld(e,n,ground+.5,origin),k*3);
    }
    geometry.getAttribute('position').needsUpdate=true;geometry.computeBoundingSphere();
  };
  return {mesh,update,setOpacity:(v:number)=>{material.opacity=Math.max(0,Math.min(1,v));},setPaperVisible:(visible:boolean)=>{paperFilter.value=visible?0:1;}};
}
export const makePlan1748=makeProjectedPlan;
