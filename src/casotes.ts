import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {crearCasotes1858,crearCasotesActual,PARAMETROS_CASOTES as P} from './casotes-model.js';

/** Manté les transformacions dels tres edificis i agrupa les peces per material. */
function batch(source:THREE.Group){
 source.updateMatrixWorld(true);const inverse=source.matrixWorld.clone().invert(),parts=new Map<THREE.Material,THREE.BufferGeometry[]>();
 const elements:Record<string,number>={};
 source.traverse(o=>{if(!(o instanceof THREE.Mesh))return;if(Array.isArray(o.material))throw Error('Unexpected Casotes material array');
  elements[o.name]=(elements[o.name]??0)+1;
  const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,o.matrixWorld));g.deleteAttribute('uv');
  const list=parts.get(o.material)??[];list.push(g);parts.set(o.material,list);o.geometry.dispose();
 });
 source.clear();source.userData.elements=elements;
 for(const [m,list]of parts){const g=mergeGeometries(list,false);if(!g)throw Error('Invalid Casotes batch');const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;source.add(mesh);list.forEach(p=>p.dispose());}
 return source;
}
export const casotesGuardFootprints=()=>[-1,1].map(sign=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[sign*P.separacionGuardas/2+x*P.anchoGuarda/2,P.distanciaGuardas+z*P.fondoGuarda/2]));
export function casotesDescription(year:number,current=false,guards=false){
 if(year<1857)return 'Les Casotes encara no es representen. El conjunt pertany a les obres del canal del segle XIX (1852–1859), no a l’escena del 1800.';
 return (current?'Aspecte actual del museu · comparació posterior a la rehabilitació de 2013. No és l’estat de l’any seleccionat.':'Reconstrucció cap al 1858: oficines i tallers de la Companyia. Aparició d’assaig des del testimoni de 1857; acabament precís desconegut.')+' Onze arcades llargues, tres a cada lateral i coberta a quatre aigües. Mides estimades: 33 × 15,3 m; carena a 8,65 m.'+(guards?' Les dues cases de guarda es mostren amb separació i posició hipotètiques, sense georeferenciació.':'');
}
export function makeCasotes(guardTerrain?:(x:number,z:number)=>number){
 const root=new THREE.Group();root.name='Les Casotes · oficines i tallers';
 const originals={historic:crearCasotes1858({incluirGuardas:true}),actual:crearCasotesActual({incluirGuardas:true})};
 const variants=Object.fromEntries(Object.entries(originals).map(([key,g])=>{
  for(const child of [...g.children]){
   if(guardTerrain&&child.name.startsWith('Casa_guarda_')){
    const outline=[[-P.anchoGuarda/2,-P.fondoGuarda/2],[P.anchoGuarda/2,-P.fondoGuarda/2],[P.anchoGuarda/2,P.fondoGuarda/2],[-P.anchoGuarda/2,P.fondoGuarda/2]],height=(x:number,z:number)=>guardTerrain(child.position.x+x,child.position.z+z);
    const base=Math.max(...outline.map(([x,z])=>height(x,z)))+.03;child.position.y=base;
    const positions:number[]=[];
    for(let i=0;i<4;i++){const a=outline[i],b=outline[(i+1)%4];for(let k=0;k<6;k++){
     const v=[k/6,(k+1)/6].flatMap(t=>{const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;return[[x,0,z],[x,Math.min(0,height(x,z)-base)-.02,z]];});for(const j of[0,1,2,2,1,3])positions.push(...v[j]);
    }}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
    const support=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:'#ac8d6e',roughness:1,side:THREE.DoubleSide}));support.name='suport_tecnic_guarda';child.add(support);
   }
   batch(child as THREE.Group);
  }
  root.add(g);return[key,g];
 })) as Record<'historic'|'actual',THREE.Group>;
 let year=1800,current=false,guards=false;
 const apply=()=>{
  root.visible=year>=1857;root.userData.phase=current?'actual':'1858';root.userData.guards=guards;
  for(const [key,g]of Object.entries(variants)){g.visible=root.visible&&(key==='actual')===current;for(const child of g.children)child.visible=child.name.startsWith('Les_Casotes_edificio_')||guards;}
 };
 const setYear=(next:number)=>{if(next!==year){current=false;guards=false;}year=next;apply();};
 const setComparison=(on:boolean)=>{current=on&&year>=1857;apply();};
 const setGuards=(on:boolean)=>{guards=on&&year>=1857;apply();};
 apply();return{root,variants,setYear,setComparison,setGuards,get comparison(){return current;},get guards(){return guards;}};
}
