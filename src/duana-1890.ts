/**
 * Duana nova i magatzems encoixinats · estat de la fotografia atribuïda a 1890.
 * Geometria aportada per l'usuari: reconstrucció aproximada a partir d'UNA perspectiva fotogràfica
 * (vistes de la plaça i del carrer de Sant Francesc, N040 i N101). Mesures estimades, no un aixecament.
 *
 * Convencions: metres estimats; Y amunt; façana principal cap a +Z; façana lateral visible cap a -X.
 * El model no prova que l'edifici existís així el 1800 ni que ocupés tota la planta de 26 × 20 m d'estudi.
 */
import * as THREE from 'three';

type V3=[number,number,number];
type Opening={x:number;y:number;w:number;h:number;arco?:boolean;tipo:string};

const M={
  pared:       new THREE.MeshStandardMaterial({color:0xada99f,roughness:.98}),
  lateral:     new THREE.MeshStandardMaterial({color:0xc4bfb4,roughness:1}),
  junta:       new THREE.MeshStandardMaterial({color:0x777269,roughness:1}),
  sillar:      new THREE.MeshStandardMaterial({color:0x928f86,roughness:1}),
  sillarClaro: new THREE.MeshStandardMaterial({color:0xc8c3b9,roughness:1}),
  sillarOsc:   new THREE.MeshStandardMaterial({color:0x817d75,roughness:1}),
  cornisa:     new THREE.MeshStandardMaterial({color:0xa39d92,roughness:1}),
  hueco:       new THREE.MeshStandardMaterial({color:0x272522,roughness:1}),
  madera:      new THREE.MeshStandardMaterial({color:0x362b26,roughness:.9}),
  madera2:     new THREE.MeshStandardMaterial({color:0x56473c,roughness:.9}),
  persiana:    new THREE.MeshStandardMaterial({color:0xb5b0a6,roughness:1}),
  cristal:     new THREE.MeshStandardMaterial({color:0x383c3d,metalness:.08,roughness:.38}),
  cristal2:    new THREE.MeshStandardMaterial({color:0x4f504b,metalness:.04,roughness:.6}),
  hierro:      new THREE.MeshStandardMaterial({color:0x22201f,metalness:.48,roughness:.76}),
  techo:       new THREE.MeshStandardMaterial({color:0x777169,roughness:1}),
};

export const DUANA_1890={W:8.8,D:5.75,H:13.65,T:.33};
const {W,D,H,T}=DUANA_1890;

function caja(parent:THREE.Object3D,material:THREE.Material,w:number,h:number,d:number,x:number,y:number,z:number,shadow=true){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;
}

function barra(parent:THREE.Object3D,material:THREE.Material,a:V3,b:V3,radius=.023,sides=7){
  const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),delta=to.clone().sub(from);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,delta.length(),sides),material);
  mesh.position.copy(from).add(to).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;parent.add(mesh);return mesh;
}

function rand01(n:number){ // resultats reproduïbles (sense Math.random)
  const v=Math.sin(n*78.233+21.17)*43758.5453;return v-Math.floor(v);
}

// El mur és un sòlid extruït amb buits reals: no són adhesius negres.
function muroPerforado(ancho:number,alto:number,aperturas:Opening[],material:THREE.Material){
  const shape=new THREE.Shape();
  shape.moveTo(-ancho/2,0);shape.lineTo(ancho/2,0);shape.lineTo(ancho/2,alto);shape.lineTo(-ancho/2,alto);shape.closePath();
  for(const o of aperturas){
    const p=new THREE.Path(),l=o.x-o.w/2,r=o.x+o.w/2;
    if(o.arco){
      const spring=o.y+o.h-o.w/2;
      p.moveTo(l,o.y);p.lineTo(l,spring);p.absarc(o.x,spring,o.w/2,Math.PI,0,true);p.lineTo(r,o.y);
    }else{
      p.moveTo(l,o.y);p.lineTo(l,o.y+o.h);p.lineTo(r,o.y+o.h);p.lineTo(r,o.y);
    }
    p.closePath();shape.holes.push(p);
  }
  const geo=new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false,curveSegments:18,steps:1});
  const mesh=new THREE.Mesh(geo,material);
  mesh.position.z=-T;mesh.castShadow=true;mesh.receiveShadow=true;return mesh;
}

// Es col·loquen sobre una capa local on Z=0 és el pla de façana.
function cercoPiedra(layer:THREE.Object3D,o:Opening,{estrecho=false}={}){
  const b=estrecho?.11:.165,l=o.x-o.w/2,r=o.x+o.w/2,mat=M.sillarClaro,z=.035;
  const altoPata=o.arco?o.h-o.w/2:o.h;
  caja(layer,mat,b,altoPata+.13,.16,l-b/2,o.y+altoPata/2,z);
  caja(layer,mat,b,altoPata+.13,.16,r+b/2,o.y+altoPata/2,z);
  if(o.arco){
    // Dovelles de l'arc: mig anell segmentat en pedra.
    const base=o.y+o.h-o.w/2,ri=o.w/2,ro=ri+b,n=11;
    for(let i=0;i<n;i++){
      const a1=(i/n)*Math.PI,a2=((i+1)/n)*Math.PI,s=new THREE.Shape();
      const pts:[number,number][]=[[ro*Math.cos(a1),ro*Math.sin(a1)],[ro*Math.cos(a2),ro*Math.sin(a2)],[ri*Math.cos(a2),ri*Math.sin(a2)],[ri*Math.cos(a1),ri*Math.sin(a1)]];
      s.moveTo(...pts[0]);for(let j=1;j<pts.length;j++)s.lineTo(...pts[j]);s.closePath();
      const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.145,bevelEnabled:false}),i%3===0?M.sillar:M.sillarClaro);
      mesh.position.set(o.x,base,-.023);mesh.castShadow=true;layer.add(mesh);
    }
    // Pedra central a la clau de l'arc.
    caja(layer,M.sillarClaro,.26,.19,.2,o.x,o.y+o.h+.045,.055);
  }else{
    caja(layer,mat,o.w+2*b+.11,b*1.15,.21,o.x,o.y+o.h+b*.43,.055);
    caja(layer,M.sillar,o.w+2*b+.17,.13,.23,o.x,o.y-.065,.055);
  }
}

function panelHueco(layer:THREE.Object3D,o:Opening){
  // Foscor al fons del buit i muntants interiors reals.
  const zFondo=-T+.065;
  if(o.arco){
    const s=new THREE.Shape(),r=o.w/2,spring=o.y+o.h-r;
    s.moveTo(o.x-r,o.y);s.lineTo(o.x+r,o.y);s.lineTo(o.x+r,spring);s.absarc(o.x,spring,r,0,Math.PI,false);s.lineTo(o.x-r,o.y);s.closePath();
    const mesh=new THREE.Mesh(new THREE.ShapeGeometry(s,20),M.hueco);mesh.position.z=zFondo;layer.add(mesh);
  }else caja(layer,M.hueco,o.w-.01,o.h-.01,.025,o.x,o.y+o.h/2,zFondo,false);
}

function contraventanas(layer:THREE.Object3D,o:Opening,claras=true){
  const mat=claras?M.persiana:M.madera2,z=-.195,half=(o.w-.085)/2;
  for(let k=0;k<2;k++){
    const cx=o.x+(k?1:-1)*(half/2+.021);
    caja(layer,mat,half,o.h-.12,.042,cx,o.y+o.h/2,z);
    caja(layer,M.sillar,half-.13,.025,.012,cx,o.y+o.h-.31,z+.029,false);
    caja(layer,M.sillar,half-.13,.025,.012,cx,o.y+.33,z+.029,false);
    for(let j=0;j<13;j++){
      const yy=o.y+.46+j*((o.h-.94)/12);
      caja(layer,claras?M.sillar:M.madera,half-.17,.009,.008,cx,yy,z+.028,false);
    }
  }
}

function puertaConCristales(layer:THREE.Object3D,o:Opening,acristalada:boolean){
  const z=-.195,w=o.w-.12,h=o.h-.08;
  caja(layer,M.madera,w,h,.065,o.x,o.y+h/2+.04,z);
  if(acristalada){
    const v=.1,pad=.12,panelH=h*.59;
    for(const side of[-1,1]){
      const px=o.x+side*w*.25;
      caja(layer,M.cristal,w/2-pad,panelH,.01,px,o.y+h*.64,z+.039,false);
      caja(layer,M.madera2,v*.7,panelH+.03,.05,o.x,o.y+h*.64,z+.051);
      for(let j=1;j<3;j++)caja(layer,M.madera2,w/2-pad+.03,.055,.055,px,o.y+h*(.36+j*.14),z+.054);
      caja(layer,M.madera2,w/2-.12,.23,.07,px,o.y+.24,z+.05);
    }
  }else{
    for(const side of[-1,1]){
      const cx=o.x+side*w*.245;
      caja(layer,M.madera2,w*.4,h*.58,.024,cx,o.y+h*.63,z+.04);
      caja(layer,M.madera2,w*.4,h*.23,.024,cx,o.y+h*.17,z+.04);
    }
    caja(layer,M.hierro,.023,.09,.028,o.x+.1,o.y+1.22,z+.09);
  }
}

function portalArqueado(layer:THREE.Object3D,o:Opening){
  // Porta en arc amb una fulla fosca, llinda semicircular i muntants.
  const hP=o.h-o.w*.49;
  caja(layer,M.madera,o.w-.15,hP-.08,.07,o.x,o.y+hP/2+.05,-.18);
  caja(layer,M.madera2,.085,hP-.1,.075,o.x+.11,o.y+hP/2,-.12);
  caja(layer,M.hierro,.025,.15,.025,o.x+.2,o.y+1.05,-.075);
  const arch=new THREE.Shape(),r=o.w/2-.09,cy=o.y+o.h-o.w/2;
  arch.moveTo(o.x-r,cy);arch.absarc(o.x,cy,r,Math.PI,0,true);arch.lineTo(o.x-r,cy);arch.closePath();
  const m=new THREE.Mesh(new THREE.ShapeGeometry(arch,20),M.madera);m.position.z=-.19;layer.add(m);
  caja(layer,M.sillarOsc,o.w+.45,.19,.42,o.x,.075,.1);
}

function balcon(layer:THREE.Object3D,x:number,y:number,{ancho=2.4,fondo=.75,corto=false}={}){
  const inicio=-.015,final=fondo,superior=y+(corto?.51:.89);
  caja(layer,M.sillar,ancho+.12,.15,fondo+.13,x,y-.12,(fondo-.08)/2);
  caja(layer,M.sillarOsc,ancho+.04,.095,fondo+.08,x,y-.215,(fondo-.1)/2);
  // Dues mènsules de pedra sota la llosa.
  for(const dx of[-ancho*.32,ancho*.32])caja(layer,M.sillar,.2,.31,fondo*.56,x+dx,y-.39,fondo*.18);
  const xs=[x-ancho/2,x+ancho/2],bot=y+.015;
  for(const side of xs){
    barra(layer,M.hierro,[side,bot,final],[side,superior,final],.035);
    barra(layer,M.hierro,[side,bot,inicio],[side,superior,inicio],.028);
    barra(layer,M.hierro,[side,superior,inicio],[side,superior,final],.027);
    for(let z=.13;z<final-.05;z+=.145)barra(layer,M.hierro,[side,y+.13,z],[side,superior-.045,z],.014);
  }
  for(let i=0;i<=12;i++){
    const xx=x-ancho/2+i*ancho/12;
    barra(layer,M.hierro,[xx,y+.045,final],[xx,superior,final],i%3===0?.024:.014);
    if(i>0&&i<12&&!corto){
      // Motiu de forja discret en forma d'X.
      const mid=y+.38;
      barra(layer,M.hierro,[xx-.033,mid-.07,final],[xx+.033,mid+.07,final],.009,5);
    }
  }
  barra(layer,M.hierro,[xs[0],superior,final],[xs[1],superior,final],.031);
  barra(layer,M.hierro,[xs[0],y+.18,final],[xs[1],y+.18,final],.014);
}

function hiladas(layer:THREE.Object3D,ancho:number,aperturas:Opening[],frente:boolean){
  // Juntes de filades de carreus, interrompudes a tots els buits.
  let row=0;
  for(let y=.42;y<H-.08;y+=.49,row++){
    let intervalos:[number,number][]=[[-ancho/2+.075,ancho/2-.075]];
    for(const o of aperturas){
      if(y<o.y-.01||y>o.y+o.h+.15)continue;
      const left=o.x-o.w/2-.14,right=o.x+o.w/2+.14,next:[number,number][]=[];
      for(const[a,b]of intervalos){
        if(left>=b||right<=a)next.push([a,b]);
        else{
          if(left>a+.12)next.push([a,Math.min(left,b)]);
          if(right<b-.12)next.push([Math.max(right,a),b]);
        }
      }
      intervalos=next;
    }
    for(const[a,b]of intervalos){
      if(b-a<.15)continue;
      caja(layer,M.junta,b-a,.012,.007,(a+b)/2,y,.007,false);
      // Juntes verticals de carreus, separades aproximadament 0,9–1,2 m.
      const paso=.92+rand01(row+19)*.25,fase=rand01(row+97)*paso;
      for(let x=a+fase;x<b;x+=paso){
        const ocupaVano=aperturas.some(o=>x>o.x-o.w/2-.16&&x<o.x+o.w/2+.16&&y+.2>=o.y&&y-.2<=o.y+o.h);
        if(!ocupaVano&&x>a+.12&&x<b-.12)caja(layer,M.junta,.012,.23,.007,x,y+.245,.009,false);
      }
    }
  }
  // Sòcol de pedra.
  for(const x of[-ancho/2+.6,ancho/2-.6])caja(layer,frente?M.sillarOsc:M.sillar,.65,.63,.07,x,.32,.038);
}

function esquinas(layer:THREE.Object3D,ancho:number,{lados=2}={}){
  // Carreus més foscos a les cantonades, travats irregularment.
  for(let i=0;i<27;i++){
    const y=.25+i*.48;
    for(let e=0;e<lados;e++){
      const sign=e===0?-1:1,w=.37+.12*rand01(i*7+e*13);
      const block=caja(layer,i%4===0?M.sillarOsc:M.sillar,w,.43,.065,sign*(ancho/2-w/2-.005),y,.028);
      block.userData.type='sillar-esquina';
    }
  }
}

function remateDeAzotea(root:THREE.Object3D){
  // Cornisa horitzontal que sobresurt a tot el perímetre.
  for(const[y,e,alto,mat]of[[H-.08,.06,.12,M.cornisa],[H+.1,.2,.21,M.sillar],[H+.26,.33,.1,M.sillarClaro]]as[number,number,number,THREE.Material][])
    caja(root,mat,W+2*e,alto,D+2*e,0,y,0);
  caja(root,M.techo,W-.2,.15,D-.2,0,H+.08,0);
  // Paret d'una terrassa plana. L'angle de la foto amaga l'interior de la coberta.
  const alto=.56,top=H+.38;
  caja(root,M.pared,W+.34,alto,.28,0,top+alto/2,D/2);
  caja(root,M.pared,W+.34,alto,.28,0,top+alto/2,-D/2);
  caja(root,M.pared,.28,alto,D+.15,-W/2,top+alto/2,0);
  caja(root,M.pared,.28,alto,D+.15,W/2,top+alto/2,0);
  caja(root,M.sillar,W+.39,.1,.39,0,top+alto,D/2);
  caja(root,M.sillar,W+.39,.1,.39,0,top+alto,-D/2);
  caja(root,M.sillar,.39,.1,D+.31,-W/2,top+alto,0);
  caja(root,M.sillar,.39,.1,D+.31,W/2,top+alto,0);
  // Petita construcció de coberta visible darrere la paret, cap a la dreta.
  caja(root,M.sillarClaro,.62,1.12,.68,2.25,H+.7,-.95);
  caja(root,M.techo,.79,.11,.82,2.25,H+1.3,-.95);
  caja(root,M.hueco,.1,.22,.035,2.25,H+1,-.59);
  for(let i=0;i<3;i++)caja(root,M.hierro,.025,.14,.025,-2.2+i*.3,H+1.05+(i%2)*.04,-1.2);
}

/** Retorna un THREE.Group complet, sense sòl ni il·luminació. */
export function crearEdificioDuana1890({escala=1,balcones=true}={}){
  const root=new THREE.Group();
  root.name='Duana nova · estat de la fotografia de 1890';
  root.userData={
    procedencia:'Fotografies N040 i N101 (peu: 1890); geometria aportada per l\'usuari',
    certeza:'Morfologia inferida d\'una fotografia, dimensions no verificades',
    advertencia:'No acredita l\'existència del mateix edifici el 1800',
    dimensionesEstimadas:{ancho:W,fondo:D,alturaMuro:H},
  };
  // Buits de la façana principal: esquerra amb portes/balcons; dreta amb persianes.
  const frontOpenings:Opening[]=[
    {x:-1.63,y:.045,w:1.88,h:2.86,arco:true,tipo:'portal'},
    {x:2.05,y:.84,w:1.3,h:1.88,tipo:'persiana'},
    {x:-1.63,y:4.11,w:1.5,h:2.28,tipo:'puerta'},
    {x:2.05,y:4.2,w:1.37,h:2.17,tipo:'persiana'},
    {x:-1.63,y:7.38,w:1.53,h:2.36,tipo:'cristalera'},
    {x:2.05,y:7.51,w:1.38,h:2.22,tipo:'persiana'},
    {x:-1.63,y:10.78,w:1.36,h:2.05,tipo:'oscura'},
    {x:2.05,y:10.76,w:1.36,h:2.09,tipo:'persiana'},
  ];
  const lateralOpenings:Opening[]=[
    {x:-1.73,y:.4,w:.6,h:2.11,arco:true,tipo:'oscura'},
    {x:1.41,y:.28,w:.65,h:2.27,arco:true,tipo:'oscura'},
    {x:-1.73,y:4.08,w:.56,h:2.13,tipo:'oscura'},
    {x:1.41,y:4.09,w:.6,h:2.22,tipo:'oscura'},
    {x:-1.73,y:7.44,w:.58,h:2.12,tipo:'oscura'},
    {x:1.41,y:7.44,w:.6,h:2.23,tipo:'oscura'},
    {x:-1.73,y:10.78,w:.56,h:2},
    {x:1.41,y:10.78,w:.58,h:2.03},
  ].map(o=>({tipo:'oscura',...o}));

  // Pla exterior de cada façana situat a z-local=0.
  const front=new THREE.Group();front.name='Façana principal / plaça (+Z)';front.position.z=D/2;root.add(front);
  front.add(muroPerforado(W,H,frontOpenings,M.pared));hiladas(front,W,frontOpenings,true);esquinas(front,W);

  const lateral=new THREE.Group();lateral.name='Façana lateral / carrer en pendent (-X)';lateral.position.x=-W/2;lateral.rotation.y=-Math.PI/2;root.add(lateral);
  lateral.add(muroPerforado(D,H,lateralOpenings,M.lateral));hiladas(lateral,D,lateralOpenings,false);esquinas(lateral,D);

  // Murs no documentats per la fotografia: discrets, sense inventar buits.
  caja(root,M.lateral,T,H,D,W/2-T/2,H/2,0);
  caja(root,M.lateral,W,H,T,0,H/2,-D/2+T/2);

  // Retirades, fusteries i emmarcaments de pedra.
  for(const o of frontOpenings){
    panelHueco(front,o);cercoPiedra(front,o);
    if(o.tipo==='portal')portalArqueado(front,o);
    if(o.tipo==='persiana')contraventanas(front,o,true);
    if(o.tipo==='oscura')contraventanas(front,o,false);
    if(o.tipo==='puerta'||o.tipo==='cristalera')puertaConCristales(front,o,o.tipo==='cristalera');
  }
  for(const o of lateralOpenings){
    panelHueco(lateral,o);cercoPiedra(lateral,o,{estrecho:true});
    if(o.arco)caja(lateral,M.madera,o.w-.11,o.h-o.w/2-.12,.08,o.x,o.y+(o.h-o.w/2)/2,-.2);
    else contraventanas(lateral,o,false);
  }

  if(balcones){
    // Dos balcons amb volada i reixa a l'esquerra, a 1a i 2a planta.
    balcon(front,-1.63,4.1,{ancho:2.53,fondo:.74});
    balcon(front,-1.63,7.39,{ancho:2.49,fondo:.69});
    // A 3a planta s'aprecia un ampit curt, no un altre gran balcó.
    caja(front,M.sillar,1.76,.14,.29,-1.63,10.7,.11);
    barra(front,M.hierro,[-2.37,10.8,.23],[-.9,10.8,.23],.022);
    // Balconets estrets laterals a les tres plantes superiors.
    for(const o of lateralOpenings.filter(a=>a.y>3))balcon(lateral,o.x,o.y-.035,{ancho:.91,fondo:.28,corto:true});
  }

  // Lleugeres motllures horitzontals vora les llosses de les plantes.
  for(const y of[3.6,6.93,10.34])caja(front,M.sillar,W-.9,.055,.052,0,y,.032,false);

  remateDeAzotea(root);
  root.scale.setScalar(escala);
  return root;
}
