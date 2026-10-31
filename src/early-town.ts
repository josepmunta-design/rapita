import * as THREE from 'three';
import {makeHousing,type Housing} from './housing.ts';
import {entityAt} from './chronology.mjs';
import type {Terrain} from './terrain';
export function makeEarlyTown(data:any,housing:Housing,meta:Terrain,h:Float32Array,v:Uint8Array,chronology:any){
  const root=new THREE.Group();root.name='Dotze cases · testimoni de 1788–1789';
  const complete=makeHousing({...housing,structures:data.structures},meta,h,v);
  const construction=makeHousing({...housing,structures:data.structures.map((s:any)=>({...s,renderState:'roofed-unfinished'}))},meta,h,v);
  const remove:THREE.Object3D[]=[];construction.traverse(o=>{if(o instanceof THREE.Mesh&&(o.material as THREE.MeshStandardMaterial).name==='roof')remove.push(o);});
  for(const o of remove)o.removeFromParent();
  root.add(construction,complete);
  const setYear=(year:number)=>{const state=entityAt(chronology,'rental-cohort',year);root.visible=state.visible;construction.visible=state.variant==='construction';complete.visible=!construction.visible;};
  setYear(1800);return {root,construction,complete,setYear};
}
