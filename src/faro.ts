import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {createFaro1864,createFaroActual,createFaroTransition} from './faro-rapita-model.js';

/** Font original a Faro/faro_rapita; totes les mides són en metres. */
function batch(source:THREE.Group){
  source.updateMatrixWorld(true);
  const parts=new Map<THREE.Material,THREE.BufferGeometry[]>();
  source.traverse(o=>{
    if(!(o instanceof THREE.Mesh))return;
    if(Array.isArray(o.material))throw Error('Unexpected lighthouse material array');
    const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();
    g.applyMatrix4(o.matrixWorld);g.deleteAttribute('uv');
    const list=parts.get(o.material)??[];list.push(g);parts.set(o.material,list);
    o.geometry.dispose();
  });
  source.clear();
  for(const [material,list] of parts){
    const g=mergeGeometries(list,false);if(!g)throw Error('Invalid lighthouse batch');
    const m=material.clone();m.name='faro-'+material.uuid;
    const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;source.add(mesh);
    list.forEach(p=>p.dispose());
  }
  return source;
}

export function faroPhase(year:number):'absent'|'1864'|'1920'|'1975'{
  return year<1862?'absent':year<1920?'1864':year<1975?'1920':'1975';
}
export function faroDescription(year:number,comparison=false){
  if(comparison)return 'Aspecte actual · comparació fotogràfica: façanes blanques, terrat vermellós i llanterna metàl·lica. No és l’estat de l’any seleccionat.';
  if(year<1862)return 'El far de Punta Senieta encara no existia. Obra acabada el 1862 i primera llum l’1 de novembre de 1864.';
  const state=year<1864?'Obra de 1862, encara sense servei':year<1920?'Model de 1864: façanes groc clar i llanterna octogonal de coure':year<1975?'Llanterna cilíndrica de 1920 amb senyal blanca; electrificació de 1929':'Òptica roja de 1975 amb llanterna metàl·lica';
  return state+'. Planta documentada de 13,10 × 13,10 m, terrat pla i torre central. Posició i orientació d’assaig; repintat blanc sense data.'+(year>=1937&&year<=1938?' Apagat durant la Guerra Civil; represa a finals de 1938.':'');
}
export function makeFaro(){
  const root=new THREE.Group();root.name='Far de Punta Senieta · fases';
  const variants={
    '1864':batch(createFaro1864()),
    '1920':batch(createFaroTransition(false)),
    '1975':batch(createFaroTransition(true)),
    actual:batch(createFaroActual()),
  };
  Object.entries(variants).forEach(([key,g])=>{g.userData.phase=key;root.add(g);});
  let year=1800,comparison=false;
  const apply=()=>{
    const phase=comparison&&year>=1862?'actual':faroPhase(year);
    root.visible=phase!=='absent';root.userData.phase=phase;
    root.userData.lightOperational=year>=1864&&!(year>=1937&&year<=1938);
    for(const [key,g] of Object.entries(variants)){
      g.visible=key===phase;
      // L'òptica es mostra com a peça, sense inventar un feix o una animació del senyal.
      g.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial&&o.material.emissive.getHex())o.material.emissiveIntensity=(root.userData.lightOperational||phase==='actual') ? 0.2 : 0;});
    }
  };
  const setYear=(next:number)=>{if(next!==year)comparison=false;year=next;apply();};
  const setComparison=(on:boolean)=>{comparison=on&&year>=1862;apply();};
  apply();return {root,variants,setYear,setComparison,get comparison(){return comparison;}};
}
