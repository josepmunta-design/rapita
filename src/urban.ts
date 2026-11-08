import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh} from './building-plan.mjs';
import {routeStations} from './littoral-plan.mjs';
import {urbanVisible,urbanGround} from './urban-plan.mjs';
import {toWorld} from './geo.mjs';
import {inPolygon} from './harbour-plan.mjs';
import {surfaceMaterial} from './vernacular.ts';
import {makeServiceHouse} from './service-house.ts';
import {tracedRoof,VILLAGE_EVIDENCE} from './village-plan.mjs';
import type {Terrain} from './terrain';
import {makeRetainingWall} from './retaining-wall.ts';
import {makeFaro} from './faro.ts';
import {makeCasotes,casotesGuardFootprints} from './casotes.ts';
export type UrbanData=any;

export function makeUrban(data:UrbanData,meta:Terrain,sample:(e:number,n:number)=>number|null,shore?:(n:number)=>number,sharedCourtyardElevation?:number){
 const lighthouses:ReturnType<typeof makeFaro>[]= [];
 const casotes:ReturnType<typeof makeCasotes>[]= [],casotesCollision:number[][][]= [];
 const root=new THREE.Group(),groups=new Map<string,THREE.Group>();root.name='Carrers i serveis · planta relacional C';
 const mat={road:new THREE.MeshStandardMaterial({color:'#baa47b',roughness:1,side:THREE.DoubleSide}),bed:new THREE.MeshStandardMaterial({color:'#8c816b',roughness:1,side:THREE.DoubleSide}),soil:new THREE.MeshStandardMaterial({color:'#897551',roughness:1,side:THREE.DoubleSide}),stone:surfaceMaterial('stone','#f2e9d6','masonry',.025),wood:surfaceMaterial('wood','#e7d0ae','wood',.014),lime:surfaceMaterial('lime','#fff8e8','lime',.012),tile:surfaceMaterial('tile','#fff2dd','tile',.025),leaf:new THREE.MeshStandardMaterial({color:'#697750',roughness:1}),dark:new THREE.MeshStandardMaterial({color:'#393d32',roughness:1})};
 Object.entries(mat).forEach(([name,m])=>m.name=name);
 const level=(e:number,n:number,cut:boolean)=>{const h=sample(e,n);if(h===null)return null;return cut?urbanGround(e,n,h,data):h;};
 const strip=(points:number[][],width:number,cut:boolean,material:THREE.Material)=>{
   const stations=routeStations(points,1.5),positions:number[]=[],ids:number[]=[];let previous:number|null=null;
   for(const st of stations){const pair=[];for(const sign of[-1,1]){const e=st.e-sign*st.dy*width/2,n=st.n+sign*st.dx*width/2,h=level(e,n,cut);if(h===null){pair.length=0;break;}pair.push(toWorld(e,n,h+.09,meta.origin));}
    if(pair.length!==2){previous=null;continue;}const index=positions.length/3;positions.push(...pair.flat());if(previous!==null)ids.push(previous,index,previous+1,previous+1,index,index+1);previous=index;}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(ids);g.computeVertexNormals();return new THREE.Mesh(g,material);
 };
 for(const r of data.routes){const group=new THREE.Group();group.name=r.name;group.userData.feature=r;const before=strip(r.points,r.width,false,mat.road),after=strip(r.points,r.width,true,mat.road);group.add(before,after);group.userData.before=before;group.userData.after=after;root.add(group);groups.set(r.id,group);}
 const ravine=new THREE.Group();ravine.name=data.ravine.name;ravine.userData.feature=data.ravine;ravine.add(strip(data.ravine.points,data.ravine.width,true,mat.bed));root.add(ravine);groups.set(data.ravine.id,ravine);
 for(const s of data.sites){
  const group=new THREE.Group();group.name=s.name;group.userData.feature=s;group.position.fromArray(toWorld(s.anchor[0],s.anchor[1],s.technicalBaseElevation,meta.origin));const alongDegrees:number=s.alongAzimuthDegrees??data.frame.alongAzimuthDegrees;group.rotation.y=-alongDegrees*Math.PI/180;root.add(group);groups.set(s.id,group);
  if(s.kind==='retaining-wall'){group.position.set(0,0,0);group.rotation.set(0,0,0);group.add(makeRetainingWall(s,meta.origin,(e,n)=>level(e,n,true)));continue;}
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>(),angle=alongDegrees*Math.PI/180;
  const ground=(x:number,z:number)=>{if(s.kind==='workyard'&&sharedCourtyardElevation!==undefined)return sharedCourtyardElevation-s.technicalBaseElevation;if(s.reclaimed)return 0;const e=s.anchor[0]+x*Math.cos(angle)-z*Math.sin(angle),n=s.anchor[1]-x*Math.sin(angle)-z*Math.cos(angle);return(sample(e,n)??s.technicalBaseElevation)-s.technicalBaseElevation;};
  const emit=(source:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,rotation=0)=>{const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();g.rotateY(rotation);g.translate(x,y,z);if(!g.getAttribute('normal'))g.computeVertexNormals();const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=[];for(let i=0;i<p.count;i++)uv.push((Math.abs(n.getZ(i))>.5?p.getX(i):p.getZ(i))/2,Math.abs(n.getY(i))>.6?p.getX(i)/2:p.getY(i)/2);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));const parts=batches.get(m)??[];parts.push(g);batches.set(m,parts);};
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material=mat.stone)=>emit(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const patch=(x:number,z:number,w:number,d:number,m:THREE.Material)=>{const p:number[]=[],nx=Math.ceil(w/2),nz=Math.ceil(d/2);for(let row=0;row<nz;row++)for(let col=0;col<nx;col++){const corners=[[x-w/2+col*w/nx,z-d/2+row*d/nz],[x-w/2+(col+1)*w/nx,z-d/2+row*d/nz],[x-w/2+col*w/nx,z-d/2+(row+1)*d/nz],[x-w/2+(col+1)*w/nx,z-d/2+(row+1)*d/nz]];for(const i of[0,2,1,1,2,3]){const[a,b]=corners[i];p.push(a,ground(a,b)+.1,b);}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();emit(g,m);};
  const fence=(w:number,d:number)=>{for(const side of[-1,1])for(let x=-w/2;x<w/2;x+=3){const cx=Math.min(x+1.5,w/2),z=side*d/2,y=ground(cx,z);box(cx,y+.5,z,.11,1,.11,mat.wood);box(cx,y+.65,z,Math.min(3,w/2-x),.09,.09,mat.wood);}for(const side of[-1,1])for(let z=-d/2;z<d/2;z+=3){if(side===1&&Math.abs(z)<3)continue;const cz=z+1.5,x=side*w/2,y=ground(x,cz);box(x,y+.5,cz,.11,1,.11,mat.wood);box(x,y+.65,cz,.09,.09,Math.min(3,d/2-z),mat.wood);}};
  if(['garden','noria-garden','botanical'].includes(s.kind)){
   const poly:number[][]|null=s.polygonUTM?s.polygonUTM.map(([e,n]:number[])=>{const de=e-s.anchor[0],dn=n-s.anchor[1];return[de*Math.cos(angle)-dn*Math.sin(angle),-de*Math.sin(angle)-dn*Math.cos(angle)];}):null;
   if(poly){
    for(let x=-s.width/2;x<s.width/2;x+=1.5)for(let z=-s.depth/2;z<s.depth/2;z+=1.5)if(inPolygon(x,z,poly))patch(x,z,1.48,1.48,mat.soil);
    for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.ceil(L/2.5),r=-Math.atan2(b[1]-a[1],b[0]-a[0]);for(let k=0;k<steps;k++){const t=(k+.5)/steps,x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t,y=ground(x,z);box(x,y+.45,z,.1,.9,.1,mat.wood);emit(new THREE.BoxGeometry(L/steps+.04,.08,.08),mat.wood,x,y+.65,z,r);}}
   }else{patch(0,0,s.width,s.depth,mat.soil);fence(s.width,s.depth);}
   for(let z=-s.depth/2+4;z<s.depth/2-3;z+=5)for(let x=-s.width/2+4;x<s.width/2-3;x+=4){if(poly&&!inPolygon(x,z,poly)||s.kind==='noria-garden'&&x>10&&z>5)continue;patch(x,z,2.8,1.5,mat.bed);const g=new THREE.DodecahedronGeometry(s.kind==='botanical'?.6:.3,0);emit(g,mat.leaf,x,ground(x,z)+.25,z);}
   if(s.kind==='noria-garden'){
    const x=18,z=13,y=ground(x,z);emit(new THREE.CylinderGeometry(1.4,1.4,.65,16,1,true),mat.stone,x,y+.325,z);emit(new THREE.CircleGeometry(1.2,20).rotateX(-Math.PI/2),mat.dark,x,y+.08,z);
    const ring=new THREE.TorusGeometry(1.7,.11,5,24);emit(ring,mat.wood,x,y+2.2,z);for(let i=0;i<8;i++){const a=i*Math.PI/4,g=new THREE.BoxGeometry(.1,3.4,.12);g.rotateZ(a);emit(g,mat.wood,x,y+2.2,z);emit(new THREE.CylinderGeometry(.14,.11,.4,6),mat.tile,x+1.7*Math.cos(a),y+2.2+1.7*Math.sin(a),z+.2);}box(x,y+1.8,z+.5,.3,3.6,.3,mat.wood);box(x,y+1.8,z-.5,.3,3.6,.3,mat.wood);
   }
  }else if(s.kind==='bridge'){
   const w=s.width,d=s.depth,span=d,opening=10,spring=.5,rise=1.3,H=2.5;
   const shape=new THREE.Shape();shape.moveTo(-span/2,0);shape.lineTo(-span/2,H);shape.lineTo(span/2,H);shape.lineTo(span/2,0);shape.lineTo(opening/2,0);shape.lineTo(opening/2,spring);for(let i=0;i<=24;i++){const a=i*Math.PI/24;shape.lineTo(opening/2*Math.cos(a),spring+rise*Math.sin(a));}shape.lineTo(-opening/2,0);shape.closePath();
   for(const sign of[-1,1])emit(new THREE.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:false}).translate(0,0,-.35),mat.stone,sign*(w/2-.35),-2.2,0,Math.PI/2);
   box(0,.45,0,w,.3,d);for(const sign of[-1,1]){box(sign*(w/2-.2),1.1,0,.35,1,d);for(const z of[-d/2+.5,d/2-.5])box(sign*(w/2-.2),.8,z,.55,.5,.7);}
   for(const sign of[-1,1]){const x=sign*(w/2+1.1),z=d/2+1.4,y=ground(x,z);box(x,y+.5,z,2.7,.28,.65);for(const dx of[-1,1])box(x+dx,y+.23,z,.3,.46,.55);}
  }else if(s.kind==='forge'||s.kind==='guardhouse'||s.kind==='service-house'){
   const w=s.width,d=s.depth,H=s.height,base=Math.max(...[-w/2,w/2].flatMap(x=>[-d/2,d/2].map(z=>ground(x,z))))+.06;
   const building=makeServiceHouse(s);building.position.y=base;group.add(building);group.userData.detailConfidence='C';
  }else if(s.kind==='shed'){
   // N112 pp. 215, 226: five arches, twelve + nine piers. Their arrangement remains C.
   const H=s.height,aw=s.width*.55,bw=s.width-aw,base=Math.max(...[-s.width/2,s.width/2].flatMap(x=>[-s.depth/2,s.depth/2].map(z=>ground(x,z))))+.06;
   group.userData.evidence=VILLAGE_EVIDENCE.tinglado;group.userData.frontArches=5;group.userData.pierCounts=[12,9];group.userData.detailConfidence='C';
   box(0,base-.1,0,s.width,.2,s.depth,mat.soil);
   const post=(x:number,z:number)=>{box(x,base+H/2,z,.5,H,.5,mat.stone);box(x,base+.12,z,.65,.24,.65,mat.stone);box(x,base+H-.12,z,.65,.24,.65,mat.stone);};
   const xs=Array.from({length:6},(_,i)=>-s.width/2+.4+i*(aw-.8)/5),front=s.depth/2-.4,back=-front;
   for(const x of xs)for(const z of[front,back])post(x,z);
   for(let c=0;c<3;c++)for(let r=0;r<3;r++)post(-s.width/2+aw+.5+c*(bw-1)/2,-s.depth/2+.5+r*(s.depth-1)/2);
   const spring=H*.58;
   for(let i=0;i<5;i++){
    const x=(xs[i]+xs[i+1])/2,span=xs[i+1]-xs[i]-.5,rx=span/2,rise=Math.min(rx,H-spring-.22),shape=new THREE.Shape();
    shape.moveTo(-rx,H);shape.lineTo(rx,H);shape.lineTo(rx,spring);
    for(let k=0;k<=20;k++){const a=k*Math.PI/20;shape.lineTo(rx*Math.cos(a),spring+rise*Math.sin(a));}shape.lineTo(-rx,H);shape.closePath();
    emit(new THREE.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:false}).translate(0,0,-.25),mat.lime,x,base,front);
   }
   // Timber members and incomplete reused covering: no completed monumental hall.
   for(const x of xs)box(x,base+H+.08,0,.18,.2,s.depth,mat.wood);
   for(let r=0;r<4;r++)box(-s.width/2+aw/2,base+H+.2,-s.depth/2+r*s.depth/3,aw,.18,.22,mat.wood);
   for(let r=0;r<2;r++)for(let c=0;c<5;c++)if(c<3||r===0){const x=-s.width/2+(c+.5)*aw/5,z=-s.depth/2+s.depth*(.2+r*.6);box(x,base+H+.36,z,aw/5-.13,.08,s.depth*.28,mat.wood);}
   box(-s.width/2+aw+bw/2,base+H+.4,0,bw-.4,.1,s.depth-.4,mat.tile);
   box(-s.width/2+aw+bw/2,base+H/2,-s.depth/2+.2,bw,H,.4,mat.lime);
  }else if(s.kind==='mill'){
   // Molinet de 1794: parets alçades sense coberta, dues moles i el conducte de l'aigua.
   const w=s.width,d=s.depth,H=s.height,T=.5,base=Math.max(...[-w/2,w/2].flatMap(x=>[-d/2,d/2].map(z=>ground(x,z))))+.06;
   box(0,base-.1,0,w+.2,.2,d+.2);
   group.userData.evidence=VILLAGE_EVIDENCE.mill;group.userData.millstones=2;group.userData.roof=false;
   const q=wallSurfaceMesh(w,H,T,[{x:0,width:1.5,height:2.3,bottom:0}],.1),entry=new THREE.BufferGeometry();entry.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));entry.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));entry.setIndex(q.indices);emit(entry,mat.lime,0,base,d/2-T/2);
   box(0,base+H/2,-d/2+T/2,w,H,T,mat.lime);
   for(const sign of[-1,1])box(sign*(w/2-T/2),base+H/2,0,T,H,d-2*T,mat.lime);
   for(const x of[-w/4,w/4]){emit(new THREE.CylinderGeometry(1.15,1.15,.3,18),mat.stone,x,base+.4,0);box(x,base+.05,0,.5,.3,.5,mat.dark);}
   const channel=new THREE.BoxGeometry(2.1,.35,Math.max(8,d+6));emit(channel,mat.wood,w/2+2.5,base+1.6,0);
   for(const z of[-d/2-2,d/2+2])box(w/2+2.5,base+.8,z,.3,1.6,.3,mat.wood);
  }else if(s.kind==='barracks'){
   // Dotze barraques a la valenciana en dues fileres, d'assaig C.
   for(let i=0;i<12;i++){
    const col=i%6,row=Math.floor(i/6),x=-s.width/2+2.6+col*(s.width-5.2)/5,z=-s.depth/2+2.2+row*(s.depth-4.4),y=ground(x,z);
    const w=3.4,d=4.2,eave=1.15,ridge=s.height,g=new THREE.BufferGeometry();
    const v=[[-w/2,eave,-d/2],[w/2,eave,-d/2],[0,ridge,-d/2],[-w/2,eave,d/2],[w/2,eave,d/2],[0,ridge,d/2]];
    g.setAttribute('position',new THREE.Float32BufferAttribute([0,3,2,2,3,5,1,2,4,2,5,4,0,2,1,3,4,5].flatMap(k=>v[k]),3));g.computeVertexNormals();
    box(x,y+eave/2,z,w-.2,eave,d-.2,mat.lime);emit(g,mat.wood,x,y,z);box(x,y+.8,z+d/2+.02,.9,1.6,.08,mat.dark);
   }
  }else if(s.id==='casotes-companyia'){
   const w=s.width,d=s.depth,base=Math.max(...[-w/2,w/2].flatMap(x=>[-d/2,d/2].map(z=>ground(x,z))))+.06;
   const model=makeCasotes((x,z)=>{const e=s.anchor[0]+x*Math.cos(angle)-z*Math.sin(angle),n=s.anchor[1]-x*Math.sin(angle)-z*Math.cos(angle);return(sample(e,n)??s.technicalBaseElevation)-s.technicalBaseElevation-base;});
   model.root.position.y=base;group.add(model.root);casotes.push(model);
   box(0,base-.2,0,w+.2,.4,d+.2,mat.stone);
   // Plataforma tècnica preexistent: no s'atribueix al recinte històric ni als guardes.
   if(shore){const toLocal=(dE:number,dN:number)=>[dE*Math.cos(angle)-dN*Math.sin(angle),-dE*Math.sin(angle)-dN*Math.cos(angle)];
    box(0,base-1.6,0,w+16,3,d+16,mat.soil);
    const shoreE=shore(s.anchor[1]),dE=Math.min(0,shoreE-s.anchor[0]),neck=Math.abs(dE)-w/2;
    if(neck>1){const[cx,cz]=toLocal(dE/2-w/4,0);emit(new THREE.BoxGeometry(neck+w/2+12,3,16),mat.soil,cx,base-1.6,cz,angle);}
   }
   for(const poly of casotesGuardFootprints())casotesCollision.push(poly.map(([x,z])=>[s.anchor[0]+x*Math.cos(angle)-z*Math.sin(angle),s.anchor[1]-x*Math.sin(angle)-z*Math.cos(angle)]));
  }else if(s.kind==='warehouse'||s.kind==='farmhouse'){
   // Cossos rectangulars amb coberta a dues aigües: magatzem del canal (façana d'arcades) i masia del Montsià. Volums C.
   const w=s.width,d=s.depth,H=s.height,T=s.kind==='warehouse'?.7:.6,rise=s.kind==='warehouse'?2.6:2.2,base=Math.max(...[-w/2,w/2].flatMap(x=>[-d/2,d/2].map(z=>ground(x,z))))+.06;
   box(0,base-.25,0,w+.6,.5,d+.6,mat.stone);
   // Terraplè tècnic que apareix amb l'edifici: la costa interpretada de 1800 cobreix aquest solar, que al MDT actual és terra guanyada al mar.
   // Una plataforma al voltant de l'edifici i un camí fins a la costa de 1800; l'extensió real del reompliment és desconeguda.
   if(s.kind==='warehouse'&&shore){
    const a=alongDegrees*Math.PI/180,toLocal=(dE:number,dN:number)=>[dE*Math.cos(a)-dN*Math.sin(a),-dE*Math.sin(a)-dN*Math.cos(a)];
    box(0,base-1.6,0,w+16,3,d+16,mat.soil);
    const shoreE=shore(s.anchor[1]),dE=Math.min(0,shoreE-s.anchor[0]),neck=Math.abs(dE)-w/2;
    if(neck>1){const[cx,cz]=toLocal(dE/2-w/4,0);emit(new THREE.BoxGeometry(neck+w/2+12,3,16),mat.soil,cx,base-1.6,cz,a);}
   }
   const front:any[]=[],back:any[]=[];
   if(s.kind==='warehouse'){const n=9,pitch=(w-3)/n;for(let i=0;i<n;i++){const x=-w/2+1.5+pitch*(i+.5);front.push({x,width:2.5,height:4.4,bottom:0},{x,width:1.1,height:1.7,bottom:5.3});back.push({x,width:1.1,height:1.7,bottom:2.2},{x,width:1.1,height:1.7,bottom:5.3});}}
   else{front.push({x:-3.2,width:1.3,height:2.3,bottom:0},{x:1.8,width:1.1,height:1.5,bottom:3.4},{x:-3.2,width:1.1,height:1.5,bottom:3.4},{x:4.6,width:1.1,height:1.5,bottom:3.4});back.push({x:0,width:1,height:1.3,bottom:3.3});}
   const wall=(length:number,openings:any[],x:number,z:number,r:number)=>{const q=wallSurfaceMesh(length,H,T,openings,.1),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);emit(g,mat.lime,x,base,z,r);};
   wall(w,front,0,d/2-T/2,0);wall(w,back,0,-d/2+T/2,Math.PI);for(const sign of[-1,1])wall(d-2*T,[],sign*(w/2-T/2),0,Math.PI/2);
   const p=[[-w/2,H,-d/2],[-w/2,H,d/2],[-w/2,H+rise,0],[w/2,H,-d/2],[w/2,H,d/2],[w/2,H+rise,0]],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([0,2,5,0,5,3,1,4,5,1,5,2].flatMap(i=>p[i]),3));g.computeVertexNormals();emit(g,mat.tile,0,base,0);
   for(const x of[-w/2,w/2]){const end=new THREE.BufferGeometry(),vertices=[[x,H,-d/2],[x,H,d/2],[x,H+rise,0]];end.setAttribute('position',new THREE.Float32BufferAttribute((x<0?[0,1,2]:[0,2,1]).flatMap(i=>vertices[i]),3));end.computeVertexNormals();emit(end,mat.lime,0,base,0);}
   if(s.kind==='farmhouse'){
    // Corral annex baix, adossat a un costat; l'estat de ruïna no es data.
    const cw=w*.7,cd=d*.8,cz=-d/2-cd/2-.2,cb=ground(0,cz);
    for(const sign of[-1,1]){box(sign*cw/2,cb+.7,cz,.45,1.4,cd,mat.stone);}box(0,cb+.7,cz-cd/2,cw,1.4,.45,mat.stone);box(0,cb+.7,-d/2-.1,cw,1.4,.45,mat.stone);
   }
  }else if(s.kind==='lighthouse'){
   const model=makeFaro();
   // Suport tècnic fins al terreny mostrejat; no és un recinte històric inventat.
   const edge=6.55,outline=[[-edge,-edge],[edge,-edge],[edge,edge],[-edge,edge]],p:number[]=[];
   const base=Math.max(...outline.map(([x,z])=>ground(x,z)),ground(0,0))+.03;
   model.root.position.y=base;group.add(model.root);lighthouses.push(model);
   for(let i=0;i<4;i++){const a=outline[i],b=outline[(i+1)%4];for(let j=0;j<14;j++){
    const vertices=[j/14,(j+1)/14].flatMap(t=>{const x=a[0]+(b[0]-a[0])*t,z=a[1]+(b[1]-a[1])*t;return[[x,base,z],[x,Math.min(base,ground(x,z))-.03,z]];});
    for(const k of [0,1,2,2,1,3])p.push(...vertices[k]);
   }}
   const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();emit(g,mat.stone);
  }else if(s.kind==='farmstead'){
   // Mas de Mataredona: grup de volums de pedra sobre bancals, llegit a la fotografia N100 (sense data original) i situat amb el full de 1913 (N111).
   // El conjunt mira cap avall de la vall; plantes, alçades i repartiment són C. Les parets de la dreta es mostren sense coberta: l'estat de ruïna de la foto no es data.
   const Tm=.55;
   const emitWall=(length:number,Hw:number,holes:any[],x:number,y:number,z:number,r:number,m:THREE.Material)=>{const q=wallSurfaceMesh(length,Hw,Tm,holes,.1),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);emit(g,m,x,y,z,r);};
   const room=(cx:number,cz:number,w:number,d:number,Hw:number,front:any[],m:THREE.Material,roofKind:'gable'|'flat'|'none',rise=1.5)=>{
    const base=Math.max(...[-w/2,w/2].flatMap(dx=>[-d/2,d/2].map(dz=>ground(cx+dx,cz+dz))))+.05;
    box(cx,base-.55,cz,w+.5,1.1,d+.5,mat.stone);
    emitWall(w,Hw,front,cx,base,cz+d/2-Tm/2,0,m);emitWall(w,Hw,[],cx,base,cz-d/2+Tm/2,Math.PI,m);
    for(const sign of[-1,1])emitWall(d-2*Tm,roofKind==='none'&&sign>0?Hw*.62:Hw,[],cx+sign*(w/2-Tm/2),base,cz,Math.PI/2,m);
    if(roofKind==='gable'){
     const q=[[-w/2,Hw,-d/2],[-w/2,Hw,d/2],[-w/2,Hw+rise,0],[w/2,Hw,-d/2],[w/2,Hw,d/2],[w/2,Hw+rise,0]],g=new THREE.BufferGeometry();
     g.setAttribute('position',new THREE.Float32BufferAttribute([0,2,5,0,5,3,1,4,5,1,5,2].flatMap(i=>q[i]),3));g.computeVertexNormals();emit(g,mat.tile,cx,base,cz,0);
     for(const x of[-w/2,w/2]){const end=new THREE.BufferGeometry(),vv=[[x,Hw,-d/2],[x,Hw,d/2],[x,Hw+rise,0]];end.setAttribute('position',new THREE.Float32BufferAttribute((x<0?[0,1,2]:[0,2,1]).flatMap(i=>vv[i]),3));end.computeVertexNormals();emit(end,m,cx,base,cz,0);}
    }else if(roofKind==='flat')box(cx,base+Hw+.14,cz,w+.3,.28,d+.3,mat.wood);
   };
   const door=(x:number,wd=1.3,ht=2.2)=>({x,width:wd,height:ht,bottom:0}),win=(x:number,b=3.5)=>({x,width:.9,height:1.2,bottom:b});
   room(3,-3,12,8,6.4,[door(-2.5),win(2.5,.9),win(-2.5,3.7),win(2.5,3.7),win(.0,3.7)],mat.lime,'gable',1.8);   // casa principal, dos plantes
   room(-12,-1,14,6.5,3.7,[door(-3,2.2,2.4)],mat.stone,'flat');                                                 // estable de coberta plana a l'esquerra
   room(-4,6,9,6,3.4,[door(-1.5),win(2)],mat.stone,'gable',1.3);                                                // cos baix davanter amb coberta a dues aigües
   room(15,0,9,7,4.4,[win(-1.8,1.4)],mat.stone,'none');                                                         // parets de la dreta, sense coberta
   for(let k=0;k<3;k++){                                                                                       // bancals davant del conjunt
    const z=12+k*4.5,length=30-k*3;
    for(let x=-length/2-2;x<length/2-2;x+=3.8)box(x+1.9,ground(x+1.9,z)+.5,z,3.9,1.1+k*.15,.7,mat.stone);
   }
   for(const[x,z]of[[-17,10],[-9,14.5]]){const y=ground(x,z);box(x,y+1,z,.32,2,.32,mat.wood);emit(new THREE.DodecahedronGeometry(1.7,0),mat.leaf,x,y+3.1,z);}
  }else if(s.kind==='spring'){
   // Font de Burga: pica de pedra amb mur de fons, situada amb el full de 1913 respecte del mas.
   const y0=ground(0,0)+.05;
   box(0,y0+.9,-1,s.width,1.8,.55,mat.stone);
   for(const sign of[-1,1])box(sign*(s.width/2-.3),y0+.5,.2,.6,1,2.2,mat.stone);
   box(0,y0+.25,.35,s.width-1.2,.5,1.7,mat.stone);box(0,y0+.52,.35,s.width-1.5,.06,1.4,mat.dark);
   box(0,y0+1.55,-.7,.6,.3,.4,mat.stone);
  }else if(s.kind==='stonehouse'&&s.polygonUTM){
   // Exact existing traced footprint; roof elevation and facade details remain C.
   const a=alongDegrees*Math.PI/180,pts:number[][]=s.polygonUTM.map(([e,n]:number[])=>{const de=e-s.anchor[0],dn=n-s.anchor[1];return[de*Math.cos(a)-dn*Math.sin(a),-de*Math.sin(a)-dn*Math.cos(a)];});
   const base=Math.max(...pts.map(([x,z])=>ground(x,z)))+.08,H=s.height;
   group.userData.detailConfidence='C';group.userData.evidence=VILLAGE_EVIDENCE.oldPrecinct;
   for(let i=0;i<pts.length;i++){
    const[x,z]=pts[i],[nx,nz]=pts[(i+1)%pts.length],length=Math.hypot(nx-x,nz-z),cx=(x+nx)/2,cz=(z+nz)/2,bottom=Math.min(ground(x,z),ground(nx,nz))-.2,r=Math.atan2(-(nz-z),nx-x);
    const holes:any[]=i===0&&length>1.5?[{x:0,width:Math.min(1.2,length*.4),height:Math.min(2.2,H-.2),bottom:base-bottom}]:[];
    if(length>3.2&&i===2)for(let k=0;k<Math.max(1,Math.floor(length/3.3));k++){const count=Math.max(1,Math.floor(length/3.3));holes.push({x:-length/2+(k+.5)*length/count,width:.65,height:.9,bottom:base-bottom+Math.min(2.6,H-1.2)});}
    const q=wallSurfaceMesh(length,base+H-bottom,.3,holes,.05),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);emit(g,mat.stone,cx,bottom,cz,r);
    for(const h of holes){const xx=cx+h.x*Math.cos(r),zz=cz-h.x*Math.sin(r);emit(new THREE.BoxGeometry(h.width+.18,.13,.36),mat.lime,xx,bottom+h.bottom+h.height+.065,zz,r);if(h.bottom<base-bottom+.1)emit(new THREE.BoxGeometry(h.width-.04,h.height-.04,.07),mat.wood,xx,bottom+h.bottom+h.height/2,zz,r);}
   }
   const roof=tracedRoof(pts,base+H);
   const face=(poly:number[][],m:THREE.Material,up=false)=>{const p:number[]=[];for(let i=1;i<poly.length-1;i++){let tri=[poly[0],poly[i],poly[i+1]];if(up&&(tri[1][2]-tri[0][2])*(tri[2][0]-tri[0][0])-(tri[1][0]-tri[0][0])*(tri[2][2]-tri[0][2])<0)tri=[tri[0],tri[2],tri[1]];p.push(...tri.flat());}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();emit(g,m);};
   roof.slopes.forEach((p:number[][])=>face(p,mat.tile,true));roof.gables.forEach((p:number[][])=>{face(p,mat.stone);face([...p].reverse(),mat.stone);});
  }else if(s.kind==='stonehouse'){
   // Edifici existent el 1748 al plànol de Marín (hostal, capella, quarters): cos de pedra amb coberta a dues aigües. Alçada, obertures i coberta C.
   const w=s.width,d=s.depth,H=s.height,Tm=.6,rise=Math.min(2.2,w*.22),base=Math.max(...[-w/2,w/2].flatMap(x=>[-d/2,d/2].map(z=>ground(x,z))))+.05;
   box(0,base-.55,0,w+.5,1.1,d+.5,mat.stone);
   const wallPiece=(length:number,holes:any[],x:number,z:number,r:number)=>{const q=wallSurfaceMesh(length,H,Tm,holes,.1),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);emit(g,mat.stone,x,base,z,r);};
   const front=[{x:0,width:Math.min(1.4,w*.3),height:2.3,bottom:0},...(H>5?[-w*.28,w*.28].map(x=>({x,width:.9,height:1.2,bottom:3.4})):[])];
   wallPiece(w,front,0,d/2-Tm/2,0);wallPiece(w,[],0,-d/2+Tm/2,Math.PI);for(const sign of[-1,1])wallPiece(d-2*Tm,[],sign*(w/2-Tm/2),0,Math.PI/2);
   const q=[[-w/2,H,-d/2],[-w/2,H,d/2],[-w/2,H+rise,0],[w/2,H,-d/2],[w/2,H,d/2],[w/2,H+rise,0]],g=new THREE.BufferGeometry();
   g.setAttribute('position',new THREE.Float32BufferAttribute([0,2,5,0,5,3,1,4,5,1,5,2].flatMap(i=>q[i]),3));g.computeVertexNormals();emit(g,mat.tile,0,base,0,0);
   for(const x of[-w/2,w/2]){const end=new THREE.BufferGeometry(),vv=[[x,H,-d/2],[x,H,d/2],[x,H+rise,0]];end.setAttribute('position',new THREE.Float32BufferAttribute((x<0?[0,1,2]:[0,2,1]).flatMap(i=>vv[i]),3));end.computeVertexNormals();emit(end,mat.stone,0,base,0,0);}
   // Cambres interiors (D i E del plànol): envans que divideixen el cos en parts iguals.
   for(let k=1;k<=(s.partitions??0);k++){const x=-w/2+k*w/((s.partitions??0)+1);box(x,base+H/2,0,.4,H,d-2*Tm,mat.stone);}
  }else if(s.kind==='enclosure'){
   // Corrals del recinte (plànol de 1748, F): parets baixes de pedra al llarg del polígon.
   const a=alongDegrees*Math.PI/180,toLocal=(e:number,n:number)=>{const dE=e-s.anchor[0],dN=n-s.anchor[1];return[dE*Math.cos(a)-dN*Math.sin(a),-dE*Math.sin(a)-dN*Math.cos(a)];};
   const pts:number[][]=s.polygonUTM.map((p:number[])=>toLocal(p[0],p[1]));
   for(let i=0;i<pts.length;i++){
    const[x0,z0]=pts[i],[x1,z1]=pts[(i+1)%pts.length],length=Math.hypot(x1-x0,z1-z0),steps=Math.max(1,Math.ceil(length/3));
    for(let k=0;k<steps;k++){const t=(k+.5)/steps,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,seg=length/steps;emit(new THREE.BoxGeometry(seg+.15,s.height,.55),mat.stone,x,ground(x,z)+s.height/2-.1,z,Math.atan2(-(z1-z0),x1-x0));}
   }
  }else if(s.kind==='wallline'){
   // Mur existent el 1748 al plànol de Marín: línia de pedra de la mateixa alçada, amb baluards petits si n'hi ha.
   const a=alongDegrees*Math.PI/180,toLocal=(e:number,n:number)=>{const dE=e-s.anchor[0],dN=n-s.anchor[1];return[dE*Math.cos(a)-dN*Math.sin(a),-dE*Math.sin(a)-dN*Math.cos(a)];};
   const pts:number[][]=s.lineUTM.map((p:number[])=>toLocal(p[0],p[1]));
   for(let i=0;i<pts.length-1;i++){
    const[x0,z0]=pts[i],[x1,z1]=pts[i+1],length=Math.hypot(x1-x0,z1-z0),steps=Math.max(1,Math.ceil(length/3));
    for(let k=0;k<steps;k++){const t=(k+.5)/steps,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t,seg=length/steps;emit(new THREE.BoxGeometry(seg+.15,s.height,.7),mat.stone,x,ground(x,z)+s.height/2-.1,z,Math.atan2(-(z1-z0),x1-x0));}
   }
   for(const t of s.towersUTM??[]){const[x,z]=toLocal(t[0],t[1]),y=ground(x,z);box(x,y+s.height*.65,z,2.8,s.height*1.3,2.8,mat.stone);}
  }else if(s.kind==='workyard'){
   for(let i=0;i<12;i++){const x=-14+(i%4)*2.2,z=-3+Math.floor(i/4)*1.4;box(x,ground(x,z)+.18,z,1.8,.35,.9,mat.tile);}
   for(let i=0;i<8;i++)box(8,ground(8,0)+.12+i*.15,0,12,.13,.35,mat.wood);
   box(2,ground(2,4)+.85,4,3,.15,1.2,mat.wood);for(const x of[.8,3.2])box(x,ground(x,4)+.4,4,.15,.8,1,mat.wood);
  }
  for(const[m,parts]of batches){const geometry=mergeGeometries(parts,false);if(!geometry)throw Error('Cannot merge urban feature '+s.id);group.add(new THREE.Mesh(geometry,m));for(const p of parts)p.dispose();}
 }
 const setYear=(year:number)=>{lighthouses.forEach(f=>f.setYear(year));casotes.forEach(f=>f.setYear(year));for(const group of groups.values()){group.visible=urbanVisible(group.userData.feature,year);if(group.userData.before){group.userData.before.visible=year<1794;group.userData.after.visible=year>=1794;}}};
 return {root,groups,setYear,setLighthouseComparison:(on:boolean)=>lighthouses.forEach(f=>f.setComparison(on)),get lighthouseComparison(){return lighthouses.some(f=>f.comparison);},setCasotesComparison:(on:boolean)=>casotes.forEach(f=>f.setComparison(on)),setCasotesGuards:(on:boolean)=>casotes.forEach(f=>f.setGuards(on)),get casotesComparison(){return casotes.some(f=>f.comparison);},get casotesGuards(){return casotes.some(f=>f.guards);},casotesCollision};
}
