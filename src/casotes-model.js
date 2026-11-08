/**
 * LES CASOTES — La Ràpita (Tarragona)
 * Reconstrucción procedural aproximada: estado XIX (hacia 1858) y actual (2023+).
 * 1 unidad = 1 metro. Eje Y arriba; fachada principal apunta a +Z POR CONVENCIÓN.
 * Centro de la nave principal: x=0, z=0, suelo a y=0. No está georreferenciado.
 *
 * VERIFICADO: 11 arcos fachada larga; 3 por fachada corta; dos plantas;
 * cubierta a cuatro aguas; dos casas de guarda en acceso; materiales neoclásicos.
 * NO MEDIDO: anchura 33 m, fondo 15.3 m, altura 8.8 m y posiciones guardas.
 * Son HIPÓTESIS de trabajo modificables. No confundir con plano medido.
 *
 * FUENTES:
 * https://museumarebre.com/museu/
 * https://www.poblesdecatalunya.cat/element.php?e=18378
 * https://www.flickr.com/photos/11299883@N08/53486418908
 * https://jaumevcera.blogspot.com/2013/02/
 * https://www.poblesdecatalunya.cat/mapa_element.php?e=18378
 */
import * as THREE from 'three';

export const PARAMETROS_CASOTES = Object.freeze({
  largo:33.0, ancho:15.3, alturaAlero:6.5, alturaCumbrera:8.65,
  arcosFrente:11, arcosCostado:3,
  anchoGuarda:6.0, fondoGuarda:6.1, altoGuarda:7.25,
  separacionGuardas:22.0, distanciaGuardas:45.0
});
const material=(color, o={})=>new THREE.MeshStandardMaterial({color,roughness:.90,...o});
const M={
  brick: material('#bc9872'), old: material('#b99a79'), band: material('#dac7a4'),
  oldPanel: material('#ad8667'), nowPanel:material('#d6bda0'), joint:material('#9c775b'),
  glass:material('#587d83',{roughness:.18, metalness:.12, transparent:true, opacity:.78}),
  glassBlack:material('#27414c',{roughness:.23, metalness:.12}),
  frame:material('#4e6062',{roughness:.42,metalness:.55}),
  roof:material('#a35b45'), roofRidge:material('#874332'),
  oldRoof:material('#80634f'), oldRidge:material('#6e503d'),
  wood:material('#624b36'), deep:material('#544538'),
  stucco:material('#e3ddcd'), rust:material('#a45a49'),
  white:material('#f4eee6'), rubble:material('#ac8d6e'),
};

function caja(parent, x,y,z, sx,sy,sz, mat, nombre='pieza'){
  const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);
  o.name=nombre;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function tramo(parent,x1,y1,x2,y2,z,ancho,fondo,mat, nombre='dovela'){
  const dx=x2-x1,dy=y2-y1;
  const o=caja(parent,(x1+x2)/2,(y1+y2)/2,z,Math.hypot(dx,dy),ancho,fondo,mat,nombre);
  o.rotation.z=Math.atan2(dy,dx);return o;
}
function perfilArco(radius, arranque, base=.12, pasos=20){
  const s=new THREE.Shape();s.moveTo(-radius,base);s.lineTo(radius,base);s.lineTo(radius,arranque);
  for(let i=1;i<=pasos;i++){
    const t=(i/pasos)*Math.PI;
    s.lineTo(radius*Math.cos(t),arranque+radius*Math.sin(t));
  }
  s.lineTo(-radius,base);s.closePath();return s;
}
function manchaArco(parent,cx,z,r,arranque,mat){
  const mesh=new THREE.Mesh(new THREE.ShapeGeometry(perfilArco(r,arranque)),mat);
  mesh.position.set(cx,0,z);mesh.name='interior_arco';mesh.receiveShadow=true;parent.add(mesh);
}
function arco(parent,cx,baseZ,paso,epoca,n,fachada){
  const r=paso*.375, arranque=4.55;
  const old=epoca==='1858', glass=!old && fachada==='principal' && n>=4 && n<=6;
  const z=baseZ+.01;
  manchaArco(parent,cx,z,r,arranque,glass?M.glassBlack:(old?M.oldPanel:M.nowPanel));
  // Moldura de medio punto real mediante dovelas trapezoidales aproximadas.
  const rf=r+.055,an=.155;
  for(let k=0;k<16;k++){
    const a=Math.PI*k/16,b=Math.PI*(k+1)/16;
    const x1=cx+rf*Math.cos(a),x2=cx+rf*Math.cos(b);
    const y1=arranque+rf*Math.sin(a),y2=arranque+rf*Math.sin(b);
    tramo(parent,x1,y1,x2,y2,z+.06,an,.105,M.band,'arco_medio_punto');
  }
  for(const s of [-1,1]){
    caja(parent,cx+s*(r+.06),(arranque+.12)/2,z+.06,.145,arranque-.12,.12,M.band,'jamba_arco');
  }
  if(glass){
    // Tres huecos de vidrio actuales: la fachada histórica no tenía estos paños.
    manchaArco(parent,cx,z+.082,r*.90,arranque,M.glass);
    for(let off of [-r*.43,0,r*.43])
      caja(parent,cx+off,2.24,z+.12,.057,4.23,.085,M.frame,'montante_museo');
    for(let h of [2.25,3.03])caja(parent,cx,h,z+.12,r*1.84,.065,.09,M.frame,'travesano_museo');
    return;
  }
  // Originalmente pequeñas aberturas superiores y vanos inferiores dentro de cada arco.
  // El dibujo exacto de todas las carpinterías no se conoce; aquí son interpretaciones.
  const huecoViejo=old;
  if(huecoViejo){
    const puerta=(n%3===2||n===5);
    caja(parent,cx,1.38,z+.085,puerta?1.18:1.12,puerta?2.40:1.58, .07,puerta?M.wood:M.deep,'hueco_planta_baja_aprox');
    caja(parent,cx,4.42,z+.085,.70,.60,.055,M.deep,'hueco_superior_aprox');
    caja(parent,cx,4.42,z+.122,.04,.60,.03,M.wood,'travesano_vertical');
    caja(parent,cx,4.42,z+.125,.70,.045,.03,M.wood,'travesano_horizontal');
  } else {
    // Arcos cegados / huecos de ventilación reconocibles en foto moderna.
    for(const h of [1.28,2.74,4.16]){
      const off=(Math.floor(h*10)%2?-.15:.17);
      caja(parent,cx+off,h,z+.08,.28,.13,.065,M.joint,'respiradero_aprox');
    }
    caja(parent,cx,3.47,z+.07,r*1.64,.09,.10,M.band,'junta_historica');
  }
}
function facade(parent,largo,arcos,z,orient,epoca,nombre){
  // Usar un grupo local evita alterar la posición de las aberturas en la geometría.
  const g=new THREE.Group();g.name=nombre;g.position.z=z;g.rotation.y=orient;parent.add(g);
  const paso=largo/arcos;
  for(let i=0;i<arcos;i++){
    const x=-largo/2+paso*(i+.5);
    arco(g,x,0,paso,epoca,i,nombre);
  }
  for(let i=0;i<=arcos;i++){
    const x=-largo/2+i*paso;
    caja(g,x,3.10,.115,.16,6.2,.16,M.band,'pilastra');
  }
  caja(g,0,6.28,.115,largo,.26,.18,M.band,'cornisa_horizontal');
  caja(g,0,.17,.13,largo,.34,.21,M.band,'zocalo');
}
function tejado(parent,L,D,eave,ridge,mat,matEdge){
  const x=L/2+.45,z=D/2+.40,t=Math.min(D*.30,L*.22);
  const ridgeHalf=x-t;
  const p=[[-x,eave,-z],[x,eave,-z],[x,eave,z],[-x,eave,z],[-ridgeHalf,ridge,0],[ridgeHalf,ridge,0]];
  const faces=[[0,1,5],[0,5,4],[3,4,5],[3,5,2],[0,4,3],[1,2,5]];
  const points=[];
  for(const f of faces)for(const id of [f[0],f[2],f[1]])points.push(...p[id]);
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.computeVertexNormals();
  const roofMat=mat.clone();roofMat.side=THREE.FrontSide;
  const m=new THREE.Mesh(geo,roofMat);m.castShadow=true;m.receiveShadow=true;m.name='tejado_cuatro_aguas';parent.add(m);
  caja(parent,0,eave+.04,z,x*2,.17,.12,matEdge,'alero_frontal');
  caja(parent,0,eave+.04,-z,x*2,.17,.12,matEdge,'alero_trasero');
  caja(parent,x,eave+.04,0,.12,.17,z*2,matEdge,'alero_este');
  caja(parent,-x,eave+.04,0,.12,.17,z*2,matEdge,'alero_oeste');
  caja(parent,0,ridge,0,ridgeHalf*2,.13,.13,matEdge,'cumbrera');
}
function casotaPrincipal(epoca,P){
  const g=new THREE.Group();g.name=`Les_Casotes_edificio_${epoca}`;
  g.userData={referencia:'Les Casotes - Reial Companyia de Canalització de l’Ebre', epoca,
    aviso:'Volumetría aproximada, NO levantamiento medido',
    fuente:'https://museumarebre.com/museu/'};
  const L=P.largo,D=P.ancho,E=P.alturaAlero;
  // Muro de fábrica, tejado y arquería de once y tres vanos por fachada.
  caja(g,0,E/2,0,L,E,D,epoca==='1858'?M.old:M.brick,'mamposteria_nave');
  // Principales +Z y -Z (el segundo gira 180 grados).
  facade(g,L,11,D/2,0,epoca,'principal');
  facade(g,L,11,-D/2,Math.PI,epoca,'posterior');
  const side=(positive)=>{
    const sub=new THREE.Group();sub.name=positive?'lateral_derecho':'lateral_izquierdo';
    sub.position.x=positive?L/2:-L/2;sub.rotation.y=positive?Math.PI/2:-Math.PI/2;g.add(sub);
    const step=D/3;
    for(let i=0;i<3;i++)arco(sub,-D/2+step*(i+.5),0,step,epoca,i,'lateral');
    for(let i=0;i<=3;i++)caja(sub,-D/2+step*i,3.10,.115,.16,6.2,.16,M.band,'pilastra_lateral');
    caja(sub,0,6.28,.115,D,.26,.18,M.band,'cornisa_lateral');
    caja(sub,0,.17,.13,D,.34,.21,M.band,'zocalo_lateral');
  };
  side(true);side(false);
  tejado(g,L,D,E,P.alturaCumbrera,epoca==='1858'?M.oldRoof:M.roof,
    epoca==='1858'?M.oldRidge:M.roofRidge);
  return g;
}
function casaGuarda(epoca,P,numero){
  const s=numero===1?-1:1;
  const g=new THREE.Group();g.name=`Casa_guarda_${numero}_${epoca}`;
  g.position.set(s*P.separacionGuardas/2,0,P.distanciaGuardas);
  g.userData={ubicacion:'APROXIMADA: requiere mapa/plano de conjunto',epoca};
  const W=P.anchoGuarda,D=P.fondoGuarda,H=P.altoGuarda;
  const modern=epoca==='actual';
  caja(g,0,H/2,0,W,H,D,modern?M.white:M.stucco,'muros_casa_guarda');
  // Trama de marcos rojos visible tras rehabilitación; sin inferir su pintura histórica.
  if(modern){
    for(const x of [-W/2,W/2])for(const z of [-D/2,D/2])
      caja(g,x,H/2,z,.33,H,.35,M.rust,'esquina_ocre');
    caja(g,0,3.75,D/2+.13,W,.28,.22,M.rust,'friso_frontal');
    caja(g,0,3.75,-D/2-.13,W,.28,.22,M.rust,'friso_trasero');
    caja(g,0,H+.03,0,W+.35,.28,D+.35,M.rust,'pretil_superior');
  } else {
    caja(g,0,H+.03,0,W+.18,.20,D+.18,M.band,'pretil_historico_aprox');
  }
  const front=D/2+.035;
  for(const y of [1.70,5.04]){
    const x=numero===1?-.62:.62;
    caja(g,x,y,front+.045,1.18,1.82,.065,modern?M.wood:M.deep,'ventana_guarda');
    caja(g,x,y+1.01,front+.09,1.35,.20,.08,modern?M.rust:M.band,'arco_dintel_guarda');
    caja(g,x-.61,y,front+.09,.13,1.88,.07,modern?M.rust:M.band,'jamba');
    caja(g,x+.61,y,front+.09,.13,1.88,.07,modern?M.rust:M.band,'jamba');
  }
  for(const x of [-W/2,W/2]){
    caja(g,x+Math.sign(x)*.07,2.1,-.45,.06,2.2,1.20,M.wood,'ventana_lateral');
    caja(g,x+Math.sign(x)*.08,5.1,.75,.06,1.60,1.10,M.wood,'ventana_alta_lateral');
  }
  return g;
}

export function crearCasotes1858(opciones={}){return crearCasotes({epoca:'1858',...opciones});}
export function crearCasotesActual(opciones={}){return crearCasotes({epoca:'actual',...opciones});}
export function crearCasotes({epoca='1858', incluirGuardas=false, ...config}={}){
  const P={...PARAMETROS_CASOTES,...config};
  if(!['1858','actual'].includes(epoca))throw new Error('Época válida: 1858 o actual');
  const g=new THREE.Group();g.name=`Casotes_LaRapita_${epoca}`;
  g.add(casotaPrincipal(epoca,P));
  if(incluirGuardas){g.add(casaGuarda(epoca,P,1));g.add(casaGuarda(epoca,P,2));}
  g.userData={epoca, unidades:'metros', oriente:'Convencional. Fachada hacia +Z',
   precision:'Hipótesis basada en fotografías y descripciones; sin planos acotados',
   dimensiones_estimadas_m:{largo:P.largo,ancho:P.ancho,altura_cumbrera:P.alturaCumbrera}};
  return g;
}
