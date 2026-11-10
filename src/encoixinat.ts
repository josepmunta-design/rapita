import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Magatzems encoixinats del Cóc (Duana nova i White) en l'estat de 1794: murs a tota alçària, sense coberta,
 * revoltons ni envans superiors (N112 art.12–13, p.216–217 i 232).
 * Planta baixa de carreus encoixinats amb juntes enfonsades i portals d'arc de mig punt amb dovelles;
 * imposta motllurada; pis de maçoneria amb finestres sense fusteria i cantoneres de carreus;
 * coronament irregular d'obra inacabada. Lectura de PR01-11 (edifici de l'esquerra, inacabat) i PR01-12 / N040 (portals d'arc).
 * Mides, ritme d'obertures i alçàries són C.
 */
export type EncoixinatOptions={width:number;depth:number;height:number;variant:'duana'|'white';seed?:number};

function rubbleTexture(){
  const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d')!;
  g.fillStyle='#8c7f66';g.fillRect(0,0,256,256);
  let r=7;const rnd=()=>{r=(r*16807)%2147483647;return r/2147483647;};
  for(let y=0;y<256;y+=18)for(let x=-20;x<256;){const w=18+rnd()*30,h=12+rnd()*6;const t=150+rnd()*45;g.fillStyle=`rgb(${t+20},${t+8},${t-18})`;
    g.fillRect(x+1,y+1+rnd()*3,w-2,h-1);x+=w+2;}
  const map=new THREE.CanvasTexture(c);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;return map;
}

export function makeEncoixinat(o:EncoixinatOptions){
  const root=new THREE.Group();root.name=o.variant==='duana'?'Duana nova · obra de 1794':'Magatzem de White · obra de 1794';
  const mats={
    rustA:new THREE.MeshStandardMaterial({color:'#cbb790',roughness:.95}),rustB:new THREE.MeshStandardMaterial({color:'#d6c5a0',roughness:.95}),
    joint:new THREE.MeshStandardMaterial({color:'#7f735c',roughness:1}),dressed:new THREE.MeshStandardMaterial({color:'#e1d4b6',roughness:.9}),
    rubble:new THREE.MeshStandardMaterial({color:'#efe4cc',map:typeof document!=='undefined'?rubbleTexture():null,roughness:1}),
    dark:new THREE.MeshStandardMaterial({color:'#3f392e',roughness:1}),wood:new THREE.MeshStandardMaterial({color:'#7b5c3c',roughness:1}),
    earth:new THREE.MeshStandardMaterial({color:'#a89a78',roughness:1})};
  for(const[k,m]of Object.entries(mats))m.name='encoixinat-'+k;
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const put=(g:THREE.BufferGeometry,m:THREE.Material,matrix:THREE.Matrix4)=>{g.applyMatrix4(matrix);const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv:number[]=[];
    for(let i=0;i<p.count;i++){const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i));uv.push((ax>.5?p.getZ(i):p.getX(i))/2.2,(ay>.5?p.getZ(i):p.getY(i))/2.2);}
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const l=batches.get(m)??[];l.push(g.index?g.toNonIndexed():g);batches.set(m,l);};
  // Caixa en coordenades de façana: u al llarg del mur, v alçària, s profunditat (positiva cap a fora).
  type Face={ox:number;oz:number;ux:number;uz:number;nx:number;nz:number;len:number};
  const W=o.width,D=o.depth,T=.9,GF=4.6,H=o.height;
  const faces:Record<string,Face>={
    front:{ox:0,oz:D/2,ux:1,uz:0,nx:0,nz:1,len:W},back:{ox:0,oz:-D/2,ux:-1,uz:0,nx:0,nz:-1,len:W},
    east:{ox:W/2,oz:0,ux:0,uz:-1,nx:1,nz:0,len:D},west:{ox:-W/2,oz:0,ux:0,uz:1,nx:-1,nz:0,len:D}};
  const fbox=(f:Face,u:number,v:number,s:number,lu:number,lv:number,ls:number,m:THREE.Material,rotZ=0)=>{
    const g=new THREE.BoxGeometry(lu,lv,ls),basis=new THREE.Matrix4().makeBasis(new THREE.Vector3(f.ux,0,f.uz),new THREE.Vector3(0,1,0),new THREE.Vector3(f.nx,0,f.nz));
    const m4=new THREE.Matrix4().makeTranslation(f.ox+f.ux*u+f.nx*s,v,f.oz+f.uz*u+f.nz*s).multiply(basis);if(rotZ)m4.multiply(new THREE.Matrix4().makeRotationZ(rotZ));put(g,m,m4);};
  let seed=o.seed??(o.variant==='duana'?11:23);const rnd=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  type Opening={u:number;w:number;spring:number};
  const doors:Record<string,Opening[]>={
    front:[-10.4,-5.2,0,5.2,10.4].map(u=>({u,w:u===0?3:2.6,spring:2.75})),
    back:[-6.5,0,6.5].map(u=>({u,w:2,spring:2.4})),
    east:[-5,5].map(u=>({u,w:2.4,spring:2.6})),west:[-5,5].map(u=>({u,w:2.4,spring:2.6}))};
  const windows:Record<string,number[]>={front:[-10.4,-5.2,0,5.2,10.4],back:[-10.4,-5.2,0,5.2,10.4],east:[-7.5,-2.5,2.5,7.5],west:[-7.5,-2.5,2.5,7.5]};
  // Alçària irregular del coronament de cada pany: obra aturada a diferents filades.
  const ragged=o.variant==='white'?1.1:.55;
  for(const[name,f]of Object.entries(faces)){
    const ops=doors[name],L=f.len,course=GF/8;
    // Nucli del mur de planta baixa (color de junta) amb buits als portals.
    const cuts=ops.map(p=>[p.u-p.w/2,p.u+p.w/2]).sort((a,b)=>a[0]-b[0]);
    let start=-L/2;for(const[a,b]of[...cuts,[L/2,L/2]]){if(a-start>.01)fbox(f,(start+a)/2,GF/2,-T/2,a-start,GF,T-.12,mats.joint);start=b;}
    for(const p of ops){const top=p.spring+p.w/2;if(GF-top>.01)fbox(f,p.u,(top+GF)/2,-T/2,p.w,GF-top,T-.12,mats.joint);
      // Timpà massís per sobre de la volta de l'arc (corba aproximada per franges).
      for(let k=0;k<6;k++){const y0=p.spring+k*p.w/12,y1=y0+p.w/12,half=p.w/2*Math.sqrt(Math.max(0,1-((y0+y1)/2-p.spring)**2/(p.w/2)**2));for(const sg of[-1,1])fbox(f,p.u+sg*(half+(p.w/2-half)/2),(y0+y1)/2,-T/2,p.w/2-half+.02,y1-y0,T-.12,mats.joint);}}
    // Filades de carreus encoixinats amb juntes enfonsades.
    for(let c=0;c<8;c++){
      const y=c*course+course/2,blocked=ops.map(p=>{const top=p.spring+p.w/2+.55;if(y>top)return null;const half=y<p.spring?p.w/2:p.w/2*Math.sqrt(Math.max(0,1-((y-p.spring)/(p.w/2+.55))**2))+.55*((y-p.spring)/(p.w/2+.55));return[p.u-Math.max(p.w/2,half),p.u+Math.max(p.w/2,half)];}).filter(Boolean) as number[][];
      let u=-L/2+(c%2?.6:0);const len=1.2;
      for(let u0=-L/2;u0<L/2-.01;){const piece=Math.min(c%2&&u0===-L/2?.6:len,L/2-u0),mid=u0+piece/2;
        if(!blocked.some(([a,b])=>mid+piece/2>a&&mid-piece/2<b))fbox(f,mid,y,.06,piece-.07,course-.07,.28,(c+Math.round(mid))%2?mats.rustA:mats.rustB);
        else{for(const[a,b]of blocked){if(u0<a&&u0+piece>a&&a-u0>.25)fbox(f,(u0+a)/2,y,.06,a-u0-.06,course-.07,.28,mats.rustA);if(u0<b&&u0+piece>b&&u0+piece-b>.25)fbox(f,(b+u0+piece)/2,y,.06,u0+piece-b-.06,course-.07,.28,mats.rustB);}}
        u0+=piece;}
      void u;
    }
    // Brancals, dovelles i clau dels portals.
    for(const p of ops){
      for(let y=.3;y<p.spring;y+=.6)for(const sg of[-1,1])fbox(f,p.u+sg*(p.w/2+.22),y,.1,.44,.55,.34,mats.dressed);
      const n=p.w>2.5?11:9,r=p.w/2;
      for(let k=0;k<n;k++){const a=Math.PI*(k+.5)/n,rm=r+.33;fbox(f,p.u+Math.cos(a)*rm,p.spring+Math.sin(a)*rm,.12,.3,.64,.36,k===(n-1)/2?mats.dressed:mats.rustB,a-Math.PI/2);}
      fbox(f,p.u,p.spring+r+.36,.2,.42,.8,.42,mats.dressed);
      fbox(f,p.u,.04,-T/2+.05,p.w,.08,T,mats.dressed);
    }
    // Sòcol i imposta motllurada entre planta i pis.
    fbox(f,0,.25,.16,L+.5,.5,.32,mats.dressed);
    fbox(f,0,GF+.1,.2,L+.6,.2,.44,mats.dressed);fbox(f,0,GF+.26,.12,L+.5,.12,.3,mats.dressed);
    // Pis de maçoneria: pilars entre finestres, amb coronament irregular.
    const win=windows[name],ww=1.25,sill=GF+.75,wh=2.1;
    const edges=[-L/2,...win.flatMap(x=>[x-ww/2,x+ww/2]),L/2];
    for(let i=0;i<edges.length;i+=2){const a=edges[i],b=edges[i+1],top=H-rnd()*ragged;fbox(f,(a+b)/2,(GF+.32+top)/2,-T/2+.05,b-a,top-GF-.32,T-.1,mats.rubble);}
    for(const x of win){
      fbox(f,x,(GF+.32+sill)/2,-T/2+.05,ww,sill-GF-.32,T-.1,mats.rubble);
      const top=H-rnd()*ragged;if(top>sill+wh+.3)fbox(f,x,(sill+wh+top)/2,-T/2+.05,ww,top-sill-wh,T-.1,mats.rubble);
      fbox(f,x,sill-.06,.06,ww+.3,.12,.3,mats.dressed);
      if(rnd()>.35)fbox(f,x,sill+wh+.12,.05,ww+.5,.24,.3,mats.dressed);
    }
    // Cantoneres de carreus alternats.
    for(let y=GF+.6,k=0;y<H-.6;y+=.62,k++)fbox(f,L/2-(k%2?.4:.6),y,.08,k%2?.8:1.2,.56,.24,mats.dressed);
  }
  // Interior buit: caixes de bigues sense revoltons i mur de càrrega de la planta baixa amb arcs.
  for(const name of['front','back'])for(let u=-W/2+1.2;u<W/2-1;u+=.9)fbox(faces[name],u,GF+.18,-T-.01,.22,.26,.06,mats.dark);
  const spine:Face={ox:0,oz:-1,ux:1,uz:0,nx:0,nz:1,len:W-2*T};
  for(let i=0;i<4;i++){const span=(W-2*T)/4,u=-(W-2*T)/2+(i+.5)*span;fbox(spine,u-span/2+.45,GF/2,0,.9,GF,.7,mats.rubble);
    fbox(spine,u,3.6+.5,0,span-.9,GF-3.6,.7,mats.rubble);}
  fbox(spine,(W-2*T)/2-.45,GF/2,0,.9,GF,.7,mats.rubble);
  // Obra en curs: aplecs de carreus tallats al Cóc i, a l'obra privada de White, bastida de fusta.
  const pile=(x:number,z:number,n:number)=>{for(let k=0;k<n;k++){const lx=x+(k%3)*1.05,lz=z+Math.floor(k/3)%2*.7,ly=.28+Math.floor(k/6)*.55;const g=new THREE.BoxGeometry(.95,.52,.62);put(g,k%2?mats.rustA:mats.rustB,new THREE.Matrix4().makeTranslation(lx,ly,lz));}};
  pile(W/2+2.2,D/2-3,9);pile(-W/2-4.6,-D/2+2,6);
  if(o.variant==='white'){
    const f=faces.east;
    for(let k=0;k<6;k++){const u=-D/2+1.5+k*(D-3)/5;for(const s of[.9,2.2])fbox(f,u,(H+1.2)/2,s,.16,H+1.2,.16,mats.wood);}
    for(const y of[GF+.4,GF+2.4,H-.2])for(const s of[.9,2.2])fbox(f,0,y,s,D-2,.12,.12,mats.wood);
    for(const y of[GF+.52,GF+2.52])fbox(f,0,y,1.55,D-2.6,.06,1.2,mats.wood);
    // Cabria per pujar carreus.
    const g=new THREE.CylinderGeometry(.09,.09,H+3,6);put(g,mats.wood,new THREE.Matrix4().makeTranslation(W/2+3.2,(H+3)/2,-1).multiply(new THREE.Matrix4().makeRotationZ(.12)));
    const arm=new THREE.BoxGeometry(3.2,.14,.14);put(arm,mats.wood,new THREE.Matrix4().makeTranslation(W/2+2.2,H+2.6,-1));
  }else{
    // Apuntalament de fusta d'un portal i pedres per a la cornisa pendent.
    const f=faces.front;for(const sg of[-1,1])fbox(f,sg*1.6,2.2,1.6,.16,4.4,.16,mats.wood,sg*.35);
    pile(-W/2+2,D/2+2.6,12);
  }
  for(const[m,gs]of batches){const g=mergeGeometries(gs,false);if(g){const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);}gs.forEach(x=>x.dispose());}
  root.userData={roof1794:false,rusticatedGroundFloor:true,detailConfidence:'C',sources:['N112 art.12–13 p.216–217, 232','PR01-11','PR01-12','N040']};
  return root;
}
