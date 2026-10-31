import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh,planToUTM} from './building-plan.mjs';
import {townToUTM} from './housing-plan.mjs';
import {worldToTown,isPublicGround} from './center-plan.mjs';
import {sampleHeight,toWorld} from './geo.mjs';
import type {Housing} from './housing.ts';
import type {Terrain} from './terrain';
import {centerNavigation,marketPlan} from './domestic-plan.mjs';
import {groundQuad,surfaceMaterial} from './vernacular.ts';
import {crearEdificioDuana1890,DUANA_1890} from './duana-1890.ts';
import {crearFuenteRapita,FUENTE_RAPITA} from './fuente-rapita.ts';

type Hole={x:number;width:number;height:number;bottom:number};
export type CenterSite={id:string;name:string;kind:string;across:number;along:number;width:number;depth:number;wallHeight:number;roofRise:number;clock?:boolean;
  anchor:{easting:number;northing:number};frontAzimuthDegrees:number;state1794:string;evidence:string;limits:string;inventoryRelation?:string;replacesHousingIds?:string[];
  terrain:{minimum:number;maximum:number;technicalBaseElevation:number};geometryConfidence:string};
export type CenterData={sites:CenterSite[];source:{title:string;url:string};townFrame:Housing['townFrame'];publicSpace:{plaza:{halfWidth:number;north:number;south:number;exedraRadius:number;passage?:{halfWidth:number;south:number}};crossAxis:{west:number;east:number;halfWidth:number};trees:{count:number;across:number[];south:number;north:number}}};

function bossageTexture(){
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d')!;
  c.fillStyle='#b9ab8c';c.fillRect(0,0,128,128);
  for(let row=0;row<8;row++)for(let col=-1;col<4;col++){
    const x=col*40+(row%2)*20,y=row*16;c.fillStyle=['#c0b294','#b8a88b','#c4b69a'][(row+col+3)%3];c.fillRect(x+1,y+1,38,14);
    c.fillStyle='#ddd1b7';c.fillRect(x+2,y+1,36,1);c.fillStyle='#8f826b';c.fillRect(x,y+15,40,1);
  }
  const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;return map;
}

export function applyCenterGround(mesh:THREE.Mesh,data:CenterData,housing:Housing){
  const g=mesh.geometry,colors=g.getAttribute('color'),positions=g.getAttribute('position'),original=colors.array.slice();
  const soil=new THREE.Color('#b9a982'),yard=new THREE.Color('#c0b291');
  const yards=[...data.sites.filter(s=>['inn','private-courtyard'].includes(s.kind)),{across:-60,along:105,width:40,depth:80}];
  const enabled=new Float32Array(original);
  for(let i=0;i<positions.count;i++){
    const t=worldToTown(positions.getX(i)+housing.townFrame.easting,housing.townFrame.northing-positions.getZ(i),housing.townFrame);
    const court=yards.some(s=>Math.abs(t.across-s.across)<s.depth/2&&Math.abs(t.along-s.along)<s.width/2);
    if(isPublicGround(t.across,t.along,data.publicSpace)||court){
      const c=(court?yard:soil).clone().multiplyScalar(.98+.025*Math.sin(t.across*.33+t.along*.17));enabled.set([c.r,c.g,c.b],i*3);
    }
  }
  return (visible:boolean)=>{colors.array.set(visible?enabled:original);colors.needsUpdate=true;};
}

export function makeCenter(data:CenterData,meta:Terrain,heights:Float32Array,valid:Uint8Array,housing:Housing){
  const root=new THREE.Group();root.name='Centre · escenari d’estudi';
  const materials={lime:surfaceMaterial('lime','#fff9e9','lime',.008),stone:surfaceMaterial('stone','#f5e7ce','lime',.012),
    bare:surfaceMaterial('bare','#fff1d4','brick',.016),rustic:new THREE.MeshStandardMaterial({color:'#fff2d8',map:bossageTexture(),roughness:1}),
    roof:surfaceMaterial('roof','#fff1dc','tile',.025),wood:surfaceMaterial('wood','#c7ae91','wood',.012),
    dark:new THREE.MeshStandardMaterial({color:'#384539',roughness:1}),support:new THREE.MeshStandardMaterial({color:'#a4a591',roughness:1,side:THREE.DoubleSide})};
  for(const[name,material]of Object.entries(materials))material.name=name;
  for(const s of data.sites){
    const group=new THREE.Group();group.name=s.name;group.userData.centerId=s.id;
    group.userData.navigation=centerNavigation(s);
    group.position.fromArray(toWorld(s.anchor.easting,s.anchor.northing,s.terrain.technicalBaseElevation,meta.origin));group.rotation.y=THREE.MathUtils.degToRad(180-s.frontAzimuthDegrees);root.add(group);
    type Batches=Map<THREE.Material,THREE.BufferGeometry[]>;
    const mainBatches:Batches=new Map();let batches:Batches=mainBatches;
    const transform=(x=0,y=0,z=0,rotation=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(1,1,1));
    const emit=(source:THREE.BufferGeometry,material:THREE.Material,matrix?:THREE.Matrix4)=>{
      const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();if(matrix)g.applyMatrix4(matrix);
      if(!g.getAttribute('normal'))g.computeVertexNormals();
      if(!g.getAttribute('uv')){const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=[];for(let i=0;i<p.count;i++)uv.push((Math.abs(n.getZ(i))>.5?p.getX(i):p.getZ(i))/3,Math.abs(n.getY(i))>.5?p.getX(i)/3:p.getY(i)/3);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
      const list=batches.get(material)??[];list.push(g);batches.set(material,list);
    };
    const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat=materials.stone)=>emit(new THREE.BoxGeometry(w,h,d),mat,transform(x,y,z));
    const wall=(x:number,y:number,z:number,w:number,h:number,T:number,angle=0,holes:Hole[]=[],mat=materials.lime)=>{
      const shell=wallSurfaceMesh(w,h,T,holes,.17);
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(shell.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(shell.normals,3));g.setIndex(shell.indices);emit(g,mat,transform(x,y,z,angle));
    };
    const localGround=(x:number,z:number)=>{const[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),h=sampleHeight(meta,heights,valid,e,n);if(h===null)throw new Error('Centre sense mostra '+s.id);return h-s.terrain.technicalBaseElevation;};
    const support=(x:number,z:number,w:number,d:number,independent=false,slab=true)=>{
      let y=0;
      if(independent){y=-Infinity;for(let i=-w/2;i<=w/2;i++)for(let j=-d/2;j<=d/2;j++)y=Math.max(y,localGround(x+i,z+j)+.08);}
      const corners=[[x-w/2,z+d/2],[x+w/2,z+d/2],[x+w/2,z-d/2],[x-w/2,z-d/2]],p:number[]=[],ids:number[]=[];
      for(let e=0;e<4;e++){
        const a=corners[e],b=corners[(e+1)%4],steps=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1]));
        for(let i=0;i<steps;i++){
          const x0=THREE.MathUtils.lerp(a[0],b[0],i/steps),z0=THREE.MathUtils.lerp(a[1],b[1],i/steps),x1=THREE.MathUtils.lerp(a[0],b[0],(i+1)/steps),z1=THREE.MathUtils.lerp(a[1],b[1],(i+1)/steps),j=p.length/3;
          p.push(x0,y,z0,x0,localGround(x0,z0),z0,x1,localGround(x1,z1),z1,x1,y,z1);ids.push(j,j+1,j+2,j,j+2,j+3);
        }
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ids);emit(g,materials.support);
      if(slab)box(x,y-.025,z,w,.05,d,materials.stone);return y;
    };
    const roof=(x:number,y:number,z:number,w:number,d:number,H:number,rise:number,angle=0)=>{
      const p=[[-w/2,H,-d/2],[-w/2,H,d/2],[-w/2,H+rise,0],[w/2,H,-d/2],[w/2,H,d/2],[w/2,H+rise,0]];
      for(const[ids,mat]of[[[0,2,5,0,5,3,1,4,5,1,5,2],materials.roof],[[0,1,2,3,5,4],materials.lime],[[0,3,4,0,4,1],materials.wood]]as[number[],THREE.Material][]){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(ids.flatMap(i=>p[i]),3));if(mat===materials.roof)g.setAttribute('uv',new THREE.Float32BufferAttribute(ids.flatMap(i=>[p[i][0]/1.4,p[i][2]/1.6]),2));emit(g,mat,transform(x,y,z,angle));}
    };
    const shell=(x:number,z:number,w:number,d:number,H:number,front:Hole[],mat=materials.lime,y=0,back:Hole[]=[])=>{
      const T=.55;
      wall(x,y,z+d/2-T/2,w,H,T,0,front,mat);wall(x,y,z-d/2+T/2,w,H,T,Math.PI,back,mat);
      for(const sign of[-1,1])wall(x+sign*(w/2-T/2),y,z,d-2*T,H,T,sign*Math.PI/2,[],mat);
    };
    const openings=(w:number,number:number,H=1.5,bottom=4.5)=>Array.from({length:number},(_,i)=>({x:-w/2+(i+.5)*w/number,width:1.1,height:H,bottom}));
    const arch=(cx:number,z:number,span:number,spring:number,rise:number,top:number,T=.55)=>{
      const r=span/2,shape=new THREE.Shape();shape.moveTo(cx-r,spring);shape.lineTo(cx-r,top);shape.lineTo(cx+r,top);shape.lineTo(cx+r,spring);
      for(let i=0;i<=24;i++){const a=i*Math.PI/24;shape.lineTo(cx+r*Math.cos(a),spring+rise*Math.sin(a));}shape.closePath();
      emit(new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false,steps:1}),materials.stone,transform(0,0,z-T));
    };
    const classicFront=(w:number,z:number,H:number)=>{
      for(const k of[-.39,-.13,.13,.39]){
        box(k*w,H*.45,z+.16,.72,H*.9,.26);box(k*w,.15,z+.19,1,.3,.4);box(k*w,H*.9-.1,z+.2,1.03,.22,.44);
      }
      box(0,H*.93,z+.17,w,.3,.45);
    };
    const compound=s.kind==='inn'||s.kind==='private-courtyard';
    let variants:{unfinished:Batches;complete:Batches}|null=null;
    let duanaPlacement:{x:number;y:number;z:number}|null=null;
    const fountainZ=-.4;
    if(!compound&&s.kind!=='covered-market'&&s.id!=='duana-nova')support(0,0,s.width,s.depth);
    const w=s.width,d=s.depth,H=s.wallHeight;
    if(s.kind==='church'){
      const front=[{x:0,width:2.5,height:3.8,bottom:0},{x:0,width:1.5,height:1.9,bottom:5.4}];
      shell(0,0,w,d,H,front);roof(0,0,0,d,w,H,s.roofRise,Math.PI/2);classicFront(w,d/2,H);
      box(0,1.85,d/2-.18,2.4,3.7,.09,materials.wood);
      // Campanar de planta quadrada a l'extrem dret de la façana vista de front, a partir de N076, N083 i N058 (vistes sense data original; N083 [1935]).
      // L'expedient diu que el 1794 falta un tram: el fust arriba a mitja alçada i no s'hi adopten les proporcions del cos de campanes tardà.
      const TW=4.6,tx=w/2-TW/2,tz=d/2-TW/2,Hs=H+4.6,Hu=3.2,Hb=3.6,Tt=.5;
      shell(tx,tz,TW,TW,Hs,[{x:0,width:.8,height:1.5,bottom:H+1.1}],materials.lime,0,[{x:0,width:.8,height:1.5,bottom:H+1.1}]);
      // Portada: sòcol, emmarcament de pedra de la porta i entaulament amb cornisa (façana dòrica, N076/N083).
      box(0,.45,d/2+.07,w+.3,.9,.2,materials.stone);box(0,H-.2,d/2+.12,w+.3,.4,.3,materials.stone);
      for(const sign of[-1,1])box(sign*1.45,2.1,d/2+.1,.32,4.2,.22,materials.stone);box(0,4.35,d/2+.1,3.2,.3,.26,materials.stone);
      variants={unfinished:new Map(),complete:new Map()};
      batches=variants.unfinished;
      for(const[sx,sz]of[[-1,-1],[-1,1],[1,-1],[1,1]])box(tx+sx*(TW/2-Tt/2),Hs+.55,tz+sz*(TW/2-Tt/2),Tt,1.1,Tt,materials.bare);
      for(const dz of[-1.2,0,1.2])box(tx,Hs+.35,tz+dz,TW+1,.18,.2,materials.wood);
      batches=variants.complete;
      const upper=(y:number,h:number,front:Hole[],mat=materials.lime)=>{shell(tx,tz,TW,TW,h,front,mat,y,front);};
      upper(Hs,Hu,[]);
      const disc=new THREE.CylinderGeometry(.85,.85,.14,24);disc.rotateX(Math.PI/2);emit(disc,materials.stone,transform(tx,Hs+1.7,tz+TW/2+.07));
      const rim=new THREE.TorusGeometry(.88,.06,6,24);emit(rim,materials.dark,transform(tx,Hs+1.7,tz+TW/2+.12));
      const by=Hs+Hu,openings2=[-.95,.95].map(x=>({x,width:1.1,height:2,bottom:.55}));
      upper(by,Hb,openings2,materials.bare);
      for(const x of[-.95,.95]){arch(tx+x,tz+TW/2,1.1,by+1.5,.55,by+2.05,Tt);arch(tx+x,tz-TW/2+Tt,1.1,by+1.5,.55,by+2.05,Tt);}
      box(tx,by+Hb+.2,tz,TW+.8,.4,TW+.8,materials.stone);box(tx,by+Hb+.55,tz,TW-.4,.3,TW-.4,materials.roof);
      batches=mainBatches;
    }else if(s.kind==='covered-market'){
      const plan=marketPlan(s),{T,piers,sideDepth,passage,sideWidth}=plan,floor=4.05;
      emit(groundQuad(plan.floor,localGround),materials.stone);
      const skirt=(x:number,z:number,L:number,alongX:boolean)=>{const count=Math.ceil(L);for(let i=0;i<count;i++){const a=-L/2+(i+.5)*L/count,cx=x+(alongX?a:0),cz=z+(alongX?0:a),y=localGround(cx,cz);if(y<0)box(cx,y/2,cz,alongX?L/count:T,-y,alongX?T:L/count,materials.support);}};
      wall(0,0,-d/2+T/2,w,H,T,0,openings(w,3,1.3,4.7));
      skirt(0,-d/2+T/2,w,true);
      for(const sign of[-1,1]){
        wall(sign*(w/2-T/2),0,-passage/2,sideDepth-2*T,H,T,Math.PI/2,[],materials.lime);
        skirt(sign*(w/2-T/2),-passage/2,sideDepth-2*T,false);
        wall(sign*(w/2-T/2),floor,d/2-passage/2,passage,H-floor,T,Math.PI/2,[],materials.bare);
        const x=sign*(w/2-sideWidth/2),y=localGround(x,d/2-T/2);box(x,(3.8+y)/2,d/2-T/2,sideWidth,3.8-y,T);
      }
      for(const p of piers){const y=localGround(p.x,p.z);box(p.x,y+.12,p.z,p.baseWidth,.24,p.depth);const col=new THREE.CylinderGeometry(.34,.42,3.55-y,12);emit(col,materials.stone,transform(p.x,(3.8+y+.25)/2,p.z));box(p.x,3.72,p.z,1.03,.22,.96);}
      box(0,floor-.1,0,w,.2,d,materials.wood);
      box(0,3.97,d/2-T/2,w,.3,.82);
      wall(0,floor,d/2-T/2,w,H-floor,T,0,openings(w,3,1.4,.5),materials.bare);
    }else if(s.kind==='warehouse'){
      // Duana nova i magatzems de White. Detall llegit a N040 i N101 (vista de 1890): carreus encoixinats amb cantoneres, portes d'arc amb dovelles,
      // finestres amb emmarcament de pedra i cornisa. L'inventari de 1794 només acredita murs a tota alçària, sense coberta, revoltons ni envans.
      const bays=5,Tw=.55,bx=(i:number)=>-w/2+(i+.5)*w/bays,doorW=(i:number)=>i===2?2.8:2.1;
      const ground=Array.from({length:bays},(_,i)=>({x:bx(i),width:doorW(i),height:3.9,bottom:0}));
      const upper=Array.from({length:bays},(_,i)=>({x:bx(i),width:1.1,height:1.65,bottom:4.8}));
      // La duana té dos estats: l'obra inacabada de 1794 (aquesta planta d'estudi de 26 × 20 m) i, des de 1890, l'edifici de la fotografia.
      variants={unfinished:new Map(),complete:new Map()};
      batches=s.id==='duana-nova'?variants.unfinished:mainBatches;
      if(s.id==='duana-nova'){
        support(0,0,w,d,false,false);
        // Petjada de l'edifici de 1890: enrasat amb el costat oest (portal cap al Montsià) i amb el costat nord (carrer cap al mar).
        batches=variants.complete;
        duanaPlacement={x:w/2-DUANA_1890.D/2,z:d/2-DUANA_1890.W/2,y:0};
        duanaPlacement.y=support(duanaPlacement.x,duanaPlacement.z,DUANA_1890.D,DUANA_1890.W,true,false);
        batches=variants.unfinished;
      }
      shell(0,0,w,d,H,[...ground,...upper],materials.rustic,0,openings(w,4,2.4,0));
      for(let i=0;i<bays;i++){
        arch(bx(i),d/2,doorW(i),2.8,1.1,3.9,Tw);
        for(const sign of[-1,1]){box(bx(i)+sign*(doorW(i)/2+.12),1.4,d/2+.05,.24,2.8,.14);}
        box(bx(i),4.8+1.65+.13,d/2+.06,1.8,.26,.2);box(bx(i),4.73,d/2+.07,1.65,.14,.26);
        for(const sign of[-1,1])box(bx(i)+sign*.64,4.8+.83,d/2+.04,.18,1.65,.14);
      }
      for(const sx of[-1,1])for(let k=0;k*.9<H-.2;k++){const wide=k%2===0;box(sx*(w/2-.02),.45+k*.9,d/2-Tw/2,wide?.9:.55,.82,Tw+.12);}
      box(0,4.4,d/2+.04,w+.1,.22,.22);box(0,H-.05,d/2+.08,w+.5,.3,.42);box(0,H-.05,-d/2-.08,w+.5,.3,.42);
      // Remat inacabat: peces de pedra aïllades al coronament dels murs, sense coberta ni sostre.
      for(let x=-w/2+1.3;x<w/2;x+=2.6)for(const z of[d/2-Tw/2,-d/2+Tw/2])box(x,H+.45,z,.9,.9,Tw,materials.rustic);
      batches=mainBatches;
      // El 1794 no hi ha coberta, revoltons ni envans alts: l'estat inacabat és el testimoni documentat.
    }else if(s.kind==='unfinished-block'){
      shell(0,0,w,d,H,openings(w,5,2.7,0),materials.bare);
      for(const x of[-w/4,0,w/4])wall(x,0,0,d-1.1,H,.4,Math.PI/2,[{x:0,width:1.2,height:2.2,bottom:0}],materials.bare);
    }else if(compound){
      const wingDepth=s.kind==='inn'?10:9,frontZ=d/2-wingDepth/2,backZ=-d/2+wingDepth/2;
      for(const z of[frontZ,backZ]){
        const y=support(0,z,w,wingDepth,true),front=[...openings(w,s.kind==='inn'?3:5,2.35,0),...openings(w,s.kind==='inn'?3:5,1.45,4.3)];
        shell(0,z,w,wingDepth,H,front,materials.lime,y,front);roof(0,y,z,w,wingDepth,H,s.roofRise);
      }
      // Boundary follows current ground; the courtyard is not raised to the highest corner.
      for(const sign of[-1,1])for(let z=backZ+wingDepth/2;z<frontZ-wingDepth/2;z+=2){
        if(s.kind==='inn'&&sign===1&&Math.abs(z)<3.2)continue;
        const x=sign*(w/2-.18),y=localGround(x,z)+.7;box(x,y,z,.3,1.4,1.98,materials.lime);
      }
      // A light shelter is C; no particular historical side is asserted.
      const z0=backZ+wingDepth/2+2.5,y=localGround(0,z0)+2.8;
      roof(0,y,z0,w-1,4,0,.6);
      for(const x of[-w/2+1,w/2-1]){const ground=localGround(x,z0);box(x,(ground+y)/2,z0,.2,y-ground,.2,materials.wood);}
    }else if(s.kind==='fountain'){
      // Font i torre amb la forma de la fotografia de 1916 (src/fuente-rapita.ts). Només l'esfera d'assaig s'emet aquí: la font no porta sòcol ni llosa.
      if(s.clock){
        const dial=new THREE.CircleGeometry(.36,24);emit(dial,materials.stone,transform(0,6.15,fountainZ+FUENTE_RAPITA.D/2+.012));
        box(0,6.28,fountainZ+FUENTE_RAPITA.D/2+.03,.035,.2,.02,materials.dark);box(.08,6.15,fountainZ+FUENTE_RAPITA.D/2+.032,.16,.035,.02,materials.dark);
      }
    }
    const flush=(map:Batches,target:THREE.Object3D)=>{for(const[material,parts]of map){const geometry=mergeGeometries(parts,false);if(!geometry)throw new Error('No es pot generar el centre: '+s.id);target.add(new THREE.Mesh(geometry,material));parts.forEach(g=>g.dispose());}};
    flush(mainBatches,group);
    if(s.kind==='fountain'){
      const{group:fountain,restos}=crearFuenteRapita();fountain.position.set(0,0,fountainZ);restos.position.set(0,0,fountainZ);restos.visible=false;group.add(fountain,restos);
      group.userData.stages={unfinished:new THREE.Group(),complete:restos};
    }
    if(variants){const unfinished=new THREE.Group(),complete=new THREE.Group();unfinished.name=s.kind==='church'?'Campanar inacabat · 1794':'Obra inacabada · 1794';complete.name=s.kind==='church'?'Campanar amb cos de campanes · foto de 1935':'Estat posterior · vista de 1890';flush(variants.unfinished,unfinished);flush(variants.complete,complete);group.add(unfinished,complete);group.userData.stages={unfinished,complete};if(s.id==='duana-nova'){// El portal mira al Montsià (≈290°, oest-nord-oest): l'eix local +X de la duana apunta a 289°. L'edifici queda enrasat amb aquest costat de la planta.
    const photo=crearEdificioDuana1890();photo.rotation.y=Math.PI/2;photo.position.set(duanaPlacement!.x,duanaPlacement!.y,duanaPlacement!.z);complete.add(photo);}if(s.kind==='church')group.userData.campanar=group.userData.stages;}
  }
  const additions=new THREE.Group();additions.name='Mançana · pou d’assaig';
  const manzana=housing.structures.find(s=>s.id==='manzana-shared')!;
  const wellH=sampleHeight(meta,heights,valid,manzana.anchor.easting,manzana.anchor.northing)!;
  additions.position.fromArray(toWorld(manzana.anchor.easting,manzana.anchor.northing,wellH,meta.origin));
  const curb=new THREE.Mesh(new THREE.LatheGeometry([[.7,0],[.95,0],[.85,.85],[.7,.85],[.7,0]].map(p=>new THREE.Vector2(...p)),20),materials.stone);additions.add(curb);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.85,.11,6,20),materials.stone);rim.rotation.x=Math.PI/2;rim.position.y=.85;additions.add(rim);root.add(additions);
  const trees=new THREE.Group();trees.name='Seixanta garrofers · distribució C';
  const t=data.publicSpace.trees,trunkMat=materials.wood,crownMat=new THREE.MeshStandardMaterial({color:'#69764b',roughness:1});
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.12,.19,2.1,6),trunkMat,t.count),crowns=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,1),crownMat,t.count*2);
  for(let i=0;i<t.count;i++){
    const row=i%2,j=Math.floor(i/2),along=THREE.MathUtils.lerp(t.south,t.north,j/(t.count/2-1)),p=townToUTM(t.across[row],along,data.townFrame),h=sampleHeight(meta,heights,valid,p.easting,p.northing);
    if(h===null)throw new Error('Arbre sense terreny');const world=new THREE.Vector3(...toWorld(p.easting,p.northing,h,meta.origin));
    trunks.setMatrixAt(i,new THREE.Matrix4().makeTranslation(world.x,world.y+1.05,world.z));
    for(let k=0;k<2;k++){const size=1.55+.17*Math.sin(i*7+k),m=new THREE.Matrix4().compose(world.clone().add(new THREE.Vector3(k?.65:-.5,3+k*.3,0)),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),i*.8),new THREE.Vector3(size,size*.7,size*.9));crowns.setMatrixAt(i*2+k,m);}
  }
  trees.add(trunks,crowns);root.add(trees);
  return {root,manzanaDetails:additions,trees};
}
