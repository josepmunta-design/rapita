/**
 * Faro de Punta Senieta / La Ràpita — reconstrucción 3D procedural.
 * Modelos: 1864 (puesta en funcionamiento) y moderno (estado visible reciente).
 * Escala: 1 unidad = 1 metro. +Y vertical. Centro del edificio en (0,0,0).
 * Fachada principal hacia +Z; esta orientación es CONVENCIONAL, no geográfica.
 * Dependencia externa: Three.js importado vía import map como 'three'.
 *
 * Fuente geométrica: Cecilio Cardenal (1875), Autoridad Portuaria de Tarragona;
 * plano «Faro de la Rápita», Archivo de Puertos del Estado / RABASF.
 * Los acabados modernos se basan en fotos catalogadas por RABASF.
 * Huecos, herrería, cumbreras y pequeños detalles sin cota son aproximados.
 */
import * as THREE from 'three';

const PI = Math.PI;
const makeMat = (hex, opts={}) => new THREE.MeshStandardMaterial({color:hex, roughness:.83, ...opts});
const C = {
  pedra:makeMat('#c6b6a0'), pedraOsc:makeMat('#9d9485'), junta:makeMat('#a2a099'),
  groc:makeMat('#d7c38e'), blanc:makeMat('#e4e3da'), blancPintat:makeMat('#f5f3eb'),
  calca:makeMat('#bcbfbe'), portavell:makeMat('#6e4b33'), porta:makeMat('#342d29'),
  negre:makeMat('#32383c',{metalness:.45,roughness:.5}),
  ferro:makeMat('#60686c',{metalness:.68,roughness:.37}),
  alumini:makeMat('#b7c0c1',{metalness:.73,roughness:.24}),
  coure:makeMat('#9b6942',{metalness:.66,roughness:.35}),
  coureClar:makeMat('#c18a59',{metalness:.61,roughness:.37}),
  vidre:makeMat('#6e9ba4',{metalness:.04,roughness:.12,transparent:true,opacity:.44,depthWrite:false,side:THREE.DoubleSide}),
  fosc:makeMat('#243339',{metalness:.06,roughness:.28}),
  vermell:makeMat('#ab2634',{metalness:.05,roughness:.25,emissive:'#370810',emissiveIntensity:.2}),
  terracota:makeMat('#a8543e'), teula:makeMat('#ad5c47'),
  dorat:makeMat('#c8aa6d',{metalness:.4,roughness:.34}),
};

const b=(g,w,h,d,x,y,z,m)=>{
  const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
};
const cyl=(g,r1,r2,h,x,y,z,m,n=48)=>{
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,n),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;
};
function rod(g,a,bb,r,m,n=8){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...bb),vec=end.clone().sub(start);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,vec.length(),n),m);
  mesh.position.copy(start).add(end).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());
  g.add(mesh);return mesh;
}
function ring(g,r,y,mat,tube=.035,segments=72){
  const o=new THREE.Mesh(new THREE.TorusGeometry(r,tube,7,segments),mat);
  o.rotation.x=PI/2;o.position.set(0,y,0);g.add(o);return o;
}
function dome(g,r,yBase,mat,segments=48){
  const points=[];
  for(let i=0;i<=15;i++){
    const a=(i/15)*(PI/2);
    points.push(new THREE.Vector2(Math.max(.008,r*Math.cos(a)),yBase+r*.68*Math.sin(a)));
  }
  const mesh=new THREE.Mesh(new THREE.LatheGeometry(points,segments),mat);
  mesh.castShadow=true;g.add(mesh);
  ring(g,r,yBase,mat,.04);
}
function frameRect(g,cx,cy,cz,w,h,front,stone,glass,door=false){
  const onZ=Math.abs(front[2])>0;
  const s=onZ?front[2]:front[0];
  const depth=s*0.10;
  let faceX=cx,faceZ=cz;
  if(onZ)faceZ+=depth;else faceX+=depth;
  // cristal/puerta oscuro centrado sobre la superficie del muro
  const backing=door?C.porta:glass;
  if(onZ){b(g,w,h,.035,faceX,cy,faceZ,backing)}
  else{b(g,.035,h,w,faceX,cy,faceZ,backing)}
  const band=.105,off=.025*s;
  const bx=faceX+(onZ?0:off), bz=faceZ+(onZ?off:0);
  if(onZ){
    b(g,band,h+.2,.16,bx-w/2,cy,bz,stone);b(g,band,h+.2,.16,bx+w/2,cy,bz,stone);
    b(g,w+band*2,band,.16,bx,cy+h/2,bz,stone);b(g,w+band*2,band,.16,bx,cy-h/2,bz,stone);
  } else {
    b(g,.16,h+.2,band,bx,cy,bz-w/2,stone);b(g,.16,h+.2,band,bx,cy,bz+w/2,stone);
    b(g,.16,band,w+band*2,bx,cy+h/2,bz,stone);b(g,.16,band,w+band*2,bx,cy-h/2,bz,stone);
  }
  if(door){
    if(onZ){b(g,.035,h-.15,.045,bx,cy,bz+.03,C.pedraOsc);cyl(g,.035,.035,.04,bx+.35,cy-.08,bz+.09,C.dorat,12).rotation.x=PI/2}
  }else{
    if(onZ){b(g,.044,h,.058,bx,cy,bz+.04,C.ferro);b(g,w,.045,.058,bx,cy,bz+.04,C.ferro)}
    else{b(g,.058,h,.045,bx,cy,bz+.04,C.ferro);b(g,.058,.045,w,bx,cy,bz+.04,C.ferro)}
  }
  if(!door){
    // barrotes exteriores de época / actuales
    for(let i=-1;i<=1;i++){
      const p=i*w/3;
      if(onZ)b(g,.022,h-.1,.025,bx+p,cy,bz+.105,C.negre);
      else b(g,.025,h-.1,.022,bx+.105,cy,bz+p,C.negre);
    }
  }
}
function walls(g,modern){
  const paint=modern?C.blanc:C.groc, trim=modern?C.pedraOsc:C.pedra;
  // 13,10 m x 13,10 m. Zócalo 0.50 + mampostería 2.90 + cornisa 0.30 = 3.70.
  b(g,13.10,.50,13.10,0,.25,0,trim);
  b(g,13.10,2.90,13.10,0,1.95,0,paint);
  b(g,13.32,.30,13.32,0,3.55,0,trim);
  // Pretil por encima de la coronación; altura sin cota exacta, aprox. 0,40m.
  for(const z of [-6.56,6.56])b(g,13.33,.43,.23,0,3.915,z,modern?C.blancPintat:paint);
  for(const x of [-6.56,6.56])b(g,.23,.43,13.33,x,3.915,0,modern?C.blancPintat:paint);
  // Guardapolvo del borde superior
  for(const z of [-6.56,6.56])b(g,13.5,.055,.35,0,4.15,z,trim);
  for(const x of [-6.56,6.56])b(g,.35,.055,13.5,x,4.15,0,trim);
  // Cuatro aristones de sillería, aparejo simplificado.
  for(const x of [-6.39,6.39])for(const z of [-6.39,6.39]){
    for(let i=0;i<12;i++){
      const y=.60+i*.235;
      const w=i%2===0?.38:.48;
      b(g,w,.19,.36,x,y,z,trim);
    }
  }
  // Fachada frontal (+Z): una puerta, dos ventanas.
  frameRect(g,0,1.30,6.55,1.45,2.15,[0,0,1],trim,C.fosc,true);
  for(const x of [-4.08,4.08])frameRect(g,x,1.77,6.55,1.10,1.16,[0,0,1],trim,C.fosc);
  // Fachada posterior: tres ventanas.
  for(const x of [-4.1,0,4.1])frameRect(g,x,1.82,-6.55,1.10,1.13,[0,0,-1],trim,C.fosc);
  // Fachadas laterales: una ventana cada una.
  frameRect(g,-6.55,1.82,0,1.10,1.13,[-1,0,0],trim,C.fosc);
  frameRect(g,6.55,1.82,0,1.10,1.13,[1,0,0],trim,C.fosc);
  // Azotea plana con terrado, no cubierta inclinada.
  b(g,12.78,.06,12.78,0,3.745,0,modern?C.terracota:C.pedra);
  if(modern){
    // Juntas de ladrillo rojo visibles en fotografía aérea (detalle aproximado)
    for(let j=-15;j<=15;j++)b(g,12.6,.008,.016,0,3.782,j*.39,C.teula);
    for(let j=-15;j<=15;j++)b(g,.016,.008,12.6,j*.39,3.782,0,C.teula);
    // Pequeñas chimeneas y antena visible
    b(g,.36,.75,.36,4.8,4.18,-4.55,C.blancPintat);
    b(g,.48,.06,.48,4.8,4.59,-4.55,trim);
    rod(g,[-4.6,3.78,-4.8],[-4.6,6.35,-4.8],.025,C.ferro);
  } else {
    // Dos bajantes de evacuación, documentadas; posiciones aproximadas.
    for(const x of [-5.2,5.2])rod(g,[x,3.65,-6.66],[x,.12,-6.66],.045,C.pedraOsc);
  }
}
function oldLantern(g){
  // Primera torre: Ø 2,30m; segundo cuerpo Ø 1,90m.
  cyl(g,1.15,1.15,1.32,0,4.36,0,C.pedra,48);
  cyl(g,1.29,1.23,.29,0,5.15,0,C.pedra,48);
  cyl(g,.95,.95,1.03,0,5.81,0,C.pedra,48);
  cyl(g,1.01,1.01,.14,0,6.39,0,C.pedraOsc,48);
  // Balcón y barandilla en torno al cuerpo superior.
  for(let i=0;i<16;i++){
    const a=i*2*PI/16,x=1.29*Math.cos(a),z=1.29*Math.sin(a);
    rod(g,[x,5.34,z],[x,5.92,z],.019,C.negre);
  }
  ring(g,1.29,5.94,C.negre,.028);
  // Linterna original octogonal con 16 vidrios (dos hileras).
  const R=.90;
  cyl(g,.94,.94,.16,0,6.55,0,C.coure,8);
  // Exterior acristalado sobre base, dividido por ocho montantes.
  const glassmat=makeMat('#8da5a5',{metalness:.03,roughness:.20,transparent:true,opacity:.38,side:THREE.DoubleSide,depthWrite:false});
  for(let i=0;i<8;i++){
    const a=(i+.5)*2*PI/8,x=Math.cos(a)*.86,z=Math.sin(a)*.86;
    const pane=b(g,.67,1.18,.015,x,7.14,z,glassmat);
    pane.rotation.y=PI/2-a;
    for(const t of [0,1]){
      // Dos cristales por cara, separados por travesaño a media altura.
      // El esquema del bastidor es una aproximación de la estructura original.
    }
  }
  for(let i=0;i<8;i++){
    const a=i*2*PI/8,x=R*Math.cos(a),z=R*Math.sin(a);
    rod(g,[x,6.55,z],[x,7.78,z],.027,C.coure);
  }
  ring(g,.94,7.17,C.coure,.023);
  cyl(g,.97,.97,.095,0,7.77,0,C.coure,8);
  // Cúpula original de cobre. No usar la semiesfera metálica actual.
  cyl(g,.96,.96,.08,0,7.85,0,C.coure,8);
  cyl(g,.53,.96,.36,0,8.07,0,C.coureClar,8);
  cyl(g,.20,.51,.21,0,8.35,0,C.coure,8);
  cyl(g,.055,.055,.23,0,8.55,0,C.coure,12);
  cyl(g,.12,.12,.12,0,8.73,0,C.coure,12);
  // Simulación de la lámpara en el nivel focal (6,80 m sobre terreno).
  cyl(g,.23,.20,.43,0,6.84,0,C.dorat,24);
  const foc=new THREE.Mesh(new THREE.SphereGeometry(.12,12,12),C.vermell);foc.position.y=6.85;g.add(foc);
}
function modernLantern(g,red=true){
  // Se conserva la torre de sillería, modificada en el remate.
  cyl(g,1.16,1.16,1.40,0,4.43,0,C.pedra,48);
  cyl(g,1.44,1.23,.27,0,5.25,0,C.pedra,48);
  cyl(g,1.44,1.44,.055,0,5.42,0,C.terracota,48);
  // Tambor metálico de la linterna moderna.
  cyl(g,.91,.91,.72,0,5.80,0,C.alumini,48);
  ring(g,.94,6.13,C.alumini,.05);
  const side=makeMat('#9cbdc2',{metalness:.04,roughness:.12,transparent:true,opacity:.40,depthWrite:false,side:THREE.DoubleSide});
  for(let i=0;i<16;i++){
    const a=(i+.5)*2*PI/16,R=.91;
    const glass=b(g,.34,1.08,.012,Math.cos(a)*R,6.73,Math.sin(a)*R,side);
    glass.rotation.y=PI/2-a;
  }
  for(let i=0;i<12;i++){
    const a=i*2*PI/12,x=.93*Math.cos(a),z=.93*Math.sin(a);
    rod(g,[x,6.20,z],[x,7.24,z],.029,C.alumini);
    // diagonales/hélices del bastidor moderno, visibles en imágenes RABASF
    const a2=a+2*PI/12;
    rod(g,[x,6.22,z],[.93*Math.cos(a2),7.25,.93*Math.sin(a2)],.018,C.alumini);
  }
  ring(g,.95,7.29,C.alumini,.075);
  // Óptica moderna roja (representación figurativa).
  cyl(g,.32,.32,.66,0,6.70,0,red?C.vermell:C.dorat,32);
  for(const yy of [6.45,6.59,6.73,6.87,7.00])ring(g,.33,yy,C.dorat,.015,32);
  // Cúpula de metal semiesférica, pieza histórica 1919-1920/1929.
  dome(g,.96,7.33,C.alumini);
  cyl(g,.24,.24,.35,0,8.11,0,C.alumini,32);
  cyl(g,.26,.26,.13,0,8.31,0,C.alumini,24);
  rod(g,[0,8.32,0],[0,9.16,0],.025,C.ferro);
  // Veleta y pararrayos, posición y forma aproximadas.
  rod(g,[-.35,8.91,0],[.35,8.91,0],.025,C.ferro);
  b(g,.18,.09,.015,-.26,8.96,0,C.alumini);
  b(g,.14,.12,.015,.26,8.96,0,C.alumini);
  // Puerta técnica metálica en el tambor (visible en foto de linterna).
  b(g,.43,.65,.036,0,5.79, .92,C.blancPintat);
  b(g,.03,.64,.05,-.19,5.79,.96,C.ferro);
}
function faro(era){
  const modern=era==='actual';
  const root=new THREE.Group();
  root.name=modern?'Faro de La Ràpita — actual':'Faro de La Ràpita — 1864';
  root.userData={localidad:'La Ràpita, Punta Senieta',reconstruccion:era,
    metrosPorUnidad:1,orientacion:'Fachada principal hacia +Z (convencional)',
    medidaEdificio:'13.10 x 13.10 m',fuentes:['Autoridad Portuaria de Tarragona — Cecilio Cardenal (1875)','Archivo de Puertos del Estado, Faros históricos de España (RABASF)']};
  walls(root,modern);
  if(modern)modernLantern(root);else oldLantern(root);
  return root;
}
export const createFaro1864=()=>faro('1864');
export const createFaroActual=()=>faro('actual');
export {faro};

/** Adaptació del visor: volum de 1920 amb acabats originals, sense retrodatació de la pintura blanca. */
export function createFaroTransition(red=false){
  const root=new THREE.Group();
  root.name=red?'Far de La Ràpita · òptica de 1975':'Far de La Ràpita · llanterna de 1920';
  root.userData={reconstruccion:red?'1975':'1920',acabats:'Groc original conservat com a hipòtesi; data de repintat desconeguda'};
  walls(root,false);modernLantern(root,red);return root;
}
