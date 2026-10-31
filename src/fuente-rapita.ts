// Font i torre de la plaça · forma de la fotografia (N081 i N032, 1916).
// Geometria aportada per l'usuari: model aproximat de l'estructura monumental de la foto, mesures estimades.
// Convencions: metres estimats; Y amunt; el nínxol i la pila miren cap a +Z.
// Els enderrocs i el buit de la part alta provenen de l'estat fotografiat el 1916: es retornen apart (`restos`)
// perquè el visor només els mostri des d'aquesta data i no els retroprojecti sobre el 1794.
import * as THREE from 'three';

export const FUENTE_RAPITA={W:4.2,H:6.7,D:.72};

export function crearFuenteRapita({escala=1,colorPiedra=0xb8ae9f,colorPiedraOscura=0x8d8377,colorAgua=0x6f8fa6,conEntorno=false}={}){
  const g=new THREE.Group();g.name='Font i torre · forma de la fotografia de 1916';
  const restos=new THREE.Group();restos.name='Parts degradades fotografiades el 1916';
  const {W,H,D}=FUENTE_RAPITA;

  const matPiedra=new THREE.MeshStandardMaterial({color:colorPiedra,roughness:.92,metalness:.03});
  const matPiedraOscura=new THREE.MeshStandardMaterial({color:colorPiedraOscura,roughness:.96,metalness:.02});
  const matAgua=new THREE.MeshStandardMaterial({color:colorAgua,roughness:.2,metalness:0});
  const fondoNichoMat=new THREE.MeshStandardMaterial({color:0xc4bbad,roughness:.95,metalness:.01});
  const huecoMat=new THREE.MeshStandardMaterial({color:0x9a907f,roughness:1});

  const caja=(parent:THREE.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);parent.add(m);return m;
  };

  // Bloc central (mur general) i basament
  // El paramento macizo només arriba al frontó i entre les pilastres: sobre el frontó la torre es llegeix pels seus resalts, sense un bloc rectangular al darrere.
  const muroAncho=3.5,muroAlto=4.75;
  caja(g,muroAncho,muroAlto,D,0,muroAlto/2,0,matPiedra);
  caja(g,muroAncho+.18,.42,D+.08,0,.21,0,matPiedraOscura);

  // Pilastres laterals amb basa i capitell simple
  const pilastraAncho=.42,pilastraProf=.1,pilastraH=4.9,sepX=1.38;
  for(const x of[-sepX,sepX]){
    const grupo=new THREE.Group();
    const fuste=caja(grupo,pilastraAncho,pilastraH,D+pilastraProf,x,2.45,.02,matPiedraOscura);void fuste;
    caja(grupo,pilastraAncho+.12,.28,D+.16,x,.14,.04,matPiedraOscura);
    caja(grupo,pilastraAncho+.16,.24,D+.18,x,pilastraH+.12,.04,matPiedraOscura);
    g.add(grupo);
  }

  // Franges horitzontals del parament (despesar de carreus) i franges verticals vora les pilastres
  for(const y of[1.2,1.85,2.5,3.15,3.8,4.45])caja(g,W-.88,.08,D+.03,0,y,.03,matPiedraOscura);
  for(const x of[-.92,.92])caja(g,.1,4.3,D+.02,x,2.55,.03,matPiedraOscura);

  // Nínxol central amb arc superior
  const nichoAncho=1.36,nichoAltoRecto=2.35,nichoRadio=nichoAncho/2,nichoProf=.08;
  caja(g,nichoAncho,nichoAltoRecto,nichoProf,0,2.65,D/2+.01,fondoNichoMat);
  const semi=new THREE.Shape();semi.absarc(0,0,nichoRadio,Math.PI,0,true);semi.lineTo(nichoRadio,0);semi.lineTo(-nichoRadio,0);semi.closePath();
  const nichoSemi=new THREE.Mesh(new THREE.ExtrudeGeometry(semi,{depth:nichoProf,bevelEnabled:false}),fondoNichoMat);
  nichoSemi.position.set(0,3.825,D/2+.01);g.add(nichoSemi);
  for(const x of[-.77,.77])caja(g,.14,2.85,.12,x,2.7,D/2+.05,matPiedraOscura);
  const arcoMarco=new THREE.Mesh(new THREE.TorusGeometry(.79,.07,8,24,Math.PI),matPiedraOscura);arcoMarco.rotation.z=Math.PI;arcoMarco.position.set(0,3.83,D/2+.06);g.add(arcoMarco);
  caja(g,.16,.12,.12,0,4.63,D/2+.06,matPiedraOscura);

  // Frontó triangular i cornisa
  const frontonShape=new THREE.Shape();frontonShape.moveTo(-2.95/2,0);frontonShape.lineTo(0,.75);frontonShape.lineTo(2.95/2,0);frontonShape.closePath();
  const fronton=new THREE.Mesh(new THREE.ExtrudeGeometry(frontonShape,{depth:.22,bevelEnabled:false}),matPiedraOscura);fronton.position.set(0,4.75,D/2+.03);g.add(fronton);
  caja(g,2.8,.12,.18,0,4.72,D/2+.04,matPiedraOscura);

  // Part superior (cos de la torre): bloc central, resalts laterals i franges de carreus
  caja(g,1.55,1.05,D-.1,0,6.1,-.02,matPiedraOscura);
  for(const x of[-.95,.95]){
    caja(g,.56,2,D-.05,x,5.7,-.03,matPiedraOscura);
    for(const y of[5.05,5.55,6.05,6.55])caja(g,.58,.08,D+.02,x,y,0,matPiedra);
  }
  // Només a l'estat fotografiat del 1916: buit de la part alta i restes sortints a l'esquerra
  caja(restos,.75,.55,.14,0,6.15,D/2-.1,huecoMat);
  [5.15,5.45,5.75,6.05].forEach((y,i)=>caja(restos,.18,.08,.2,-1.85,y,-.15+i*.02,matPiedraOscura));

  // Pila inferior: mènsula, cassoleta, llavi, brollador i aigua
  const soporte=new THREE.Mesh(new THREE.CylinderGeometry(.18,.25,.4,18),matPiedraOscura);soporte.position.set(0,1.62,D/2+.1);g.add(soporte);
  const cuenco=new THREE.Mesh(new THREE.SphereGeometry(.3,24,16,0,Math.PI*2,0,Math.PI*.7),matPiedraOscura);cuenco.scale.set(1.05,.7,.95);cuenco.position.set(0,1.25,D/2+.21);g.add(cuenco);
  const labio=new THREE.Mesh(new THREE.TorusGeometry(.31,.025,8,24),matPiedra);labio.rotation.x=Math.PI/2;labio.position.set(0,1.4,D/2+.21);g.add(labio);
  const surtidor=new THREE.Mesh(new THREE.SphereGeometry(.05,12,12),matPiedra);surtidor.position.set(0,1.34,D/2+.44);g.add(surtidor);
  const agua=new THREE.Mesh(new THREE.CircleGeometry(.24,24),matAgua);agua.rotation.x=-Math.PI/2;agua.position.set(0,1.17,D/2+.21);g.add(agua);

  // Sòcol / petjada a terra
  const huella=new THREE.Mesh(new THREE.CylinderGeometry(.95,1.06,.08,28),new THREE.MeshStandardMaterial({color:0xa89e8f,roughness:1,metalness:0}));huella.position.set(0,.04,.18);g.add(huella);

  if(conEntorno){
    caja(g,2.6,3.4,.45,-3.35,1.7,-.1,matPiedra);
    const arcoIzq=new THREE.Mesh(new THREE.TorusGeometry(.95,.1,8,22,Math.PI),matPiedraOscura);arcoIzq.rotation.z=Math.PI;arcoIzq.position.set(-3.35,2.25,.16);g.add(arcoIzq);
    caja(g,.2,2,.5,-4.3,1,-.1,matPiedraOscura);caja(g,.2,2,.5,-2.4,1,-.1,matPiedraOscura);
    caja(g,2,3.8,.55,3.15,1.9,-.08,matPiedra);
    const arcoDer=new THREE.Mesh(new THREE.TorusGeometry(.82,.1,8,22,Math.PI),matPiedraOscura);arcoDer.rotation.z=Math.PI;arcoDer.position.set(3.55,2.05,.2);g.add(arcoDer);
  }

  for(const root of[g,restos])root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  g.scale.setScalar(escala);restos.scale.setScalar(escala);
  return {group:g,restos};
}
