import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {toWorld} from './geo.mjs';
import {routeStations} from './littoral-plan.mjs';
import type {Terrain} from './terrain';

/** PR01 is a research interpretation, never a measured reconstruction. */
export function makeResearchLandscape(data:any,meta:Terrain,sample:(e:number,n:number)=>number|null){
 const root=new THREE.Group(),groups=new Map<string,THREE.Group>();root.name='Paisatge de Pilar Reverté · interpretació C';
 const stone=new THREE.MeshStandardMaterial({color:'#a59b82',roughness:1,side:THREE.DoubleSide}),earth=new THREE.MeshStandardMaterial({color:'#b9a47d',roughness:1,side:THREE.DoubleSide}),soil=new THREE.MeshStandardMaterial({color:'#7c6d48',roughness:1,side:THREE.DoubleSide}),wood=new THREE.MeshStandardMaterial({color:'#776347',roughness:1}),leaf=new THREE.MeshStandardMaterial({color:'#637343',roughness:1,side:THREE.DoubleSide}),dark=new THREE.MeshStandardMaterial({color:'#3b3b2d',roughness:1});
 const level=(e:number,n:number)=>{const h=sample(e,n);if(h===null||!Number.isFinite(h))throw Error('PR01 outside terrain');return Math.max(.85,h);};
 const newGroup=(id:string,name:string)=>{const g=new THREE.Group();g.name=name;g.userData.sourceId='PR01';g.userData.geometryConfidence='C';root.add(g);groups.set(id,g);return g;};
 const builder=(g:THREE.Group)=>{
  const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
  const emit=(geo:THREE.BufferGeometry,m:THREE.Material,e:number,n:number,y:number,rotation=0)=>{const p=toWorld(e,n,y,meta.origin),b=geo.index?geo.toNonIndexed():geo;if(b!==geo)geo.dispose();b.deleteAttribute('uv');b.rotateY(rotation);b.translate(p[0],p[1],p[2]);if(!b.getAttribute('normal'))b.computeVertexNormals();const a=batches.get(m)??[];a.push(b);batches.set(m,a);};
  const flush=()=>{for(const[m,parts]of batches){const b=mergeGeometries(parts,false);if(!b)throw Error('PR01 batch failed');const mesh=new THREE.Mesh(b,m);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);parts.forEach(p=>p.dispose());}};
  return {emit,flush};
 };
 const figs=(b:ReturnType<typeof builder>,points:number[][])=>{for(const[e,n]of points){const y=level(e,n);b.emit(new THREE.CylinderGeometry(.15,.24,2.1,6),wood,e,n,y+1.05);for(const[dx,dn,dy]of[[-.8,0,2.1],[.7,.4,2.2],[0,-.7,2.6],[0,.6,2.8]])b.emit(new THREE.DodecahedronGeometry(1.1,0).scale(1.2,.65,1),leaf,e+dx,n+dn,y+dy);}};
 const trail=newGroup(data.trail.id,'Baixada amb figueres · PR01 · C'),tb=builder(trail),stations=routeStations(data.trail.points,.75);
 // Small ribbon on the interpreted surface; not a measured slope or a navigation floor.
 for(let i=0;i<stations.length-1;i++){
  const a=stations[i],b=stations[i+1],points=[a,b].flatMap(s=>[-1,1].map(sign=>{const e=s.e-sign*s.dy*data.trail.width/2,n=s.n+sign*s.dx*data.trail.width/2;return toWorld(e,n,level(e,n)+.13,meta.origin);}));
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute([0,2,1,1,2,3].flatMap(j=>points[j]),3));geo.computeVertexNormals();trail.add(new THREE.Mesh(geo,earth));
 }
 figs(tb,data.trail.figs);tb.flush();
 const garden=newGroup(data.garden.id,'Hort de la raconada i sínia · PR01 · C'),gb=builder(garden),[ge,gn]=data.garden.center;
 // Conforming beds avoid a horizontal slab floating above the coastal slope.
 for(let row=0;row<5;row++)for(let col=0;col<4;col++){
  const e=ge+(col-1.5)*1.8,n=gn+(row-2)*1.8,y=level(e,n);
  gb.emit(new THREE.BoxGeometry(1.5,.12,1.2),soil,e,n,y+.05);
  gb.emit(new THREE.DodecahedronGeometry(.28,0).scale(1,.7,1),leaf,e,n,y+.27);
 }
 figs(gb,data.garden.figs);
 const[we,wn]=data.garden.noria,wy=level(we,wn);
 gb.emit(new THREE.CylinderGeometry(.9,.95,.65,16,1,true),stone,we,wn,wy+.325);
 gb.emit(new THREE.CircleGeometry(.8,16).rotateX(-Math.PI/2),dark,we,wn,wy+.07);
 gb.emit(new THREE.TorusGeometry(1.2,.09,5,20),wood,we,wn,wy+1.8,Math.PI/2);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,spoke=new THREE.BoxGeometry(.08,2.4,.08);spoke.rotateX(a);gb.emit(spoke,wood,we,wn,wy+1.8);gb.emit(new THREE.CylinderGeometry(.12,.10,.28,6),earth,we+.15,wn+1.2*Math.sin(a),wy+1.8+1.2*Math.cos(a));}
 for(const de of[-.4,.4])gb.emit(new THREE.BoxGeometry(.18,2.4,.18),wood,we+de,wn,wy+1.2);gb.flush();
 const cave=newGroup(data.cave.id,'Boca de cova sota el Roquer · assaig PR01 · C'),cb=builder(cave),[ce,cn]=data.cave.anchor,cy=level(ce,cn),W=data.cave.width,H=data.cave.height;
 // An open arch with a recessed dark back: no solid black disc, no excavation of source terrain.
 const face=new THREE.Shape();face.moveTo(-W/2,0);face.lineTo(-W/2,H);face.lineTo(W/2,H);face.lineTo(W/2,0);face.lineTo(W*.34,0);face.lineTo(W*.34,.8);
 for(let i=0;i<=20;i++){const a=i*Math.PI/20;face.lineTo(W*.34*Math.cos(a),.8+H*.50*Math.sin(a));}
 face.lineTo(-W*.34,0);face.closePath();
 cb.emit(new THREE.ExtrudeGeometry(face,{depth:data.cave.depth,bevelEnabled:false}),stone,ce,cn,cy,-Math.PI/2);
 cb.emit(new THREE.BoxGeometry(.1,H*.65,W*.68),dark,ce-data.cave.depth+.1,cn,cy+H*.325);cb.flush();
 const garrigue=newGroup(data.garrigue.id,'Garriga i margallons baixos · PR01 · C'),pb=builder(garrigue);
 for(const[i,[e,n]]of data.garrigue.points.entries()){
  const y=level(e,n);pb.emit(new THREE.DodecahedronGeometry(.65,0).scale(1,.6,1),leaf,e+.9,n+.5,y+.35);
  // Chamaerops-like low fan leaves: no tall palm trunk.
  pb.emit(new THREE.CylinderGeometry(.12,.2,.4,6),wood,e,n,y+.2);
  for(let j=0;j<8;j++){
   const a=j*Math.PI/4+i*.4,dx=Math.cos(a),dn=Math.sin(a),fan=new THREE.BufferGeometry();
   fan.setAttribute('position',new THREE.Float32BufferAttribute([0,.35,0,dx*.7-dn*.5,1.1,-dn*.7-dx*.5,dx*1.2,1.35,-dn*1.2,dx*.7+dn*.5,1.1,-dn*.7+dx*.5],3));fan.setIndex([0,1,2,0,2,3]);fan.computeVertexNormals();pb.emit(fan,leaf,e,n,y);
  }
 }pb.flush();
 // Comment-driven additions: a rocky shore with small caves (1800) and an olive grove (1950 scene).
 const rocks=newGroup(data.rocks.id,'Zona de roques amb coves · comentari · C'),rb=builder(rocks),[re,rn]=data.rocks.center;
 for(const[i,[dx,dn,size]]of data.rocks.stones.entries())rb.emit(new THREE.DodecahedronGeometry(size,0).scale(1.3,.75+(i%3)*.12,1),stone,re+dx,rn+dn,level(re+dx,rn+dn)+size*.3,i*.7);
 for(const[dx,dn,w,h,depth]of data.rocks.caves){
  const e=re+dx,n=rn+dn,y=level(e,n),mouth=new THREE.Shape();mouth.moveTo(-w/2,0);mouth.lineTo(-w/2,h);mouth.lineTo(w/2,h);mouth.lineTo(w/2,0);mouth.lineTo(w*.34,0);mouth.lineTo(w*.34,.6);
  for(let i=0;i<=20;i++){const a=i*Math.PI/20;mouth.lineTo(w*.34*Math.cos(a),.6+h*.5*Math.sin(a));}
  mouth.lineTo(-w*.34,0);mouth.closePath();
  rb.emit(new THREE.ExtrudeGeometry(mouth,{depth,bevelEnabled:false}),stone,e,n,y,-Math.PI/2);
  rb.emit(new THREE.BoxGeometry(.1,h*.6,w*.68),dark,e-depth+.1,n,y+h*.3);
 }rb.flush();
 const olives=newGroup(data.olives.id,'Camp d’oliveres · comentari · C'),ob=builder(olives),[oe,on]=data.olives.center,{rows,cols,spacing}=data.olives;
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
  const jitter=((r*7+c*13)%5-2)*.3,e=oe+(c-(cols-1)/2)*spacing+jitter,n=on+(r-(rows-1)/2)*spacing-jitter,y=level(e,n);
  ob.emit(new THREE.CylinderGeometry(.22,.38,1.6,7),wood,e,n,y+.8);
  for(const[dx,dn,dy,k]of[[-.6,0,1.9,1.5],[.7,.3,2.1,1.6],[0,-.7,2.3,1.4],[0,.6,2.6,1.5]])ob.emit(new THREE.DodecahedronGeometry(k,0).scale(1.2,.7,1.1),leaf,e+dx,n+dn,y+dy);
 }ob.flush();
 const setYear=(year:number)=>{root.visible=year>=data.sceneFromYear;rocks.visible=year>=data.sceneFromYear;olives.visible=year>=data.olives.fromYear;};
 setYear(1800);return {root,groups,setYear};
}
