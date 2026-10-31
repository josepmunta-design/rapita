import * as THREE from 'three';
import {carpanell,PORXO_STUDY} from './porxo-plan.mjs';
import {porticoPlan} from './domestic-plan.mjs';
import {surfaceMaterial} from './vernacular.ts';
type Builder={add:(g:THREE.BufferGeometry,m:THREE.Material,matrix?:THREE.Matrix4)=>void;box:(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material)=>void;ground:(x:number,z:number)=>number;matrix:(x:number,y:number,z:number,rotation?:number)=>THREE.Matrix4;stone:THREE.Material;wood:THREE.Material;rearWall:(p:any)=>void};
export function detailedPorxo(s:any,b:Builder){
 const p=porticoPlan(s),tones=['#d7b897','#e3c5a5','#c7a989','#dbbb98','#e8cbaa'].map(color=>surfaceMaterial('porxo-masonry',color,'lime',.012)),stones=['#e8dcc5','#d7c9b1','#f0e5cf'].map(color=>surfaceMaterial('porxo-stone',color,'lime',.015)),mortar=surfaceMaterial('porxo-mortar','#f1e6ce','lime',.01);
 mortar.name='porxo-mortar';tones.forEach(m=>m.name='porxo-masonry');
 // Bow the front of curved plots without changing their shared corner positions.
 const curve=(g:THREE.BufferGeometry)=>{if(!s.arcSector)return g;const pos=g.getAttribute('position'),a=Math.PI/20,R=p.fw/(2*Math.sin(a));for(let i=0;i<pos.count;i++){const x=pos.getX(i);pos.setZ(i,pos.getZ(i)+R*Math.cos(a)-Math.sqrt(Math.max(0,R*R-x*x)));}g.computeVertexNormals();return g;};
 const emitFront=(g:THREE.BufferGeometry,m:THREE.Material)=>{g.translate(0,0,p.fz-p.T);b.add(curve(g),m);};
 const stoneBox=(x:number,y:number,z:number,w:number,h:number,d:number,m:THREE.Material)=>{const g=new THREE.BoxGeometry(w,h,d);g.translate(x,y,z);b.add(curve(g),m);};
 const arch=(a:number,rise:number,spring:number,top:number,T:number,place:(g:THREE.BufferGeometry,m:THREE.Material)=>void,band=.28)=>{
  const steps=80,profile=Array.from({length:steps+1},(_,i)=>carpanell(a,rise,i/steps));
  const shape=new THREE.Shape();shape.moveTo(-a,spring);shape.lineTo(-a,top);shape.lineTo(a,top);shape.lineTo(a,spring);for(let i=steps;i>=0;i--)shape.lineTo(profile[i].x,spring+profile[i].y);shape.closePath();
  place(new THREE.ExtrudeGeometry(shape,{depth:T,bevelEnabled:false}),mortar);
  const count=Math.ceil(profile[0].length/PORXO_STUDY.brickPitch),gap=.006/profile[0].length;
  for(let i=0;i<count;i++){
   const lo=i/count+gap/2,hi=(i+1)/count-gap/2,pts=[];
   for(let k=0;k<=3;k++){const q=carpanell(a,rise,lo+(hi-lo)*k/3);pts.push([q.x-.003*q.nx,spring+q.y-.003*q.ny]);}
   for(let k=3;k>=0;k--){const q=carpanell(a,rise,lo+(hi-lo)*k/3);pts.push([q.x+band*q.nx,spring+q.y+band*q.ny]);}
   const brick=new THREE.Shape();pts.forEach(([x,y],j)=>j?brick.lineTo(x,y):brick.moveTo(x,y));brick.closePath();const g=new THREE.ExtrudeGeometry(brick,{depth:T+.024,bevelEnabled:false});g.translate(0,0,-.012);place(g,tones[(i*7+Number(s.id.slice(-2)))%tones.length]);
  }
 };
 arch(p.rx,p.rise,p.spring,p.top,p.T,emitFront,p.band);
 for(const[j,pier]of p.piers.entries()){
  const y=b.ground(pier.x,pier.z),rows=Math.ceil((p.spring-y)/.28),height=(p.spring-y)/rows;
  stoneBox(pier.x,(p.spring+y)/2,pier.z,pier.width,p.spring-y,p.T,mortar);
  for(let row=0;row<rows;row++)stoneBox(pier.x,y+(row+.5)*height,pier.z+.006,pier.width-.008,height-.008,p.T+.012,stones[(row+j)%3]);
  stoneBox(pier.x,y+.09,pier.z,pier.baseWidth,.18,pier.depth,b.stone);
  // Impost: three small moulding steps, not a generic classical column capital.
  for(let k=0;k<3;k++)stoneBox(pier.x,p.spring-.13+k*.055,pier.z,pier.width+.035+k*.025,.055,p.T+.03+k*.035,b.stone);
  stoneBox(pier.x,p.spring+.06,pier.z,pier.width,.12,p.T,mortar);
 }
 // Coping and string course preserve the free arcade silhouette seen in 1916.
 for(const[y,h,extra]of[[p.top+.035,.07,.02],[p.top+.11,.08,.10],[p.top+.18,.06,.05]])stoneBox(0,y,p.fz-p.T/2,p.fw,h,p.T+extra,b.stone);
 b.rearWall(p);
 // First-floor timbers in the unfinished domestic body.
 for(let z=p.bz+.4;z<p.back-.15;z+=.6)b.box(0,p.floor-.12,z,p.widthAt(z)-.3,.22,.16,b.wood);
 // Exposed gallery joists; the household roof is deliberately not completed.
 for(let x=-p.fw/2+.25;x<p.fw/2;x+=PORXO_STUDY.joistSpacing){
  const g=new THREE.BoxGeometry(.14,.21,p.depth-p.T/2);g.translate(x,p.top-.10,p.back+(p.depth-p.T/2)/2);b.add(g,b.wood);
 }
 // Transverse basket arch at each study boundary: no wall at walking height.
 const index=Number(s.id.slice(-2));for(const sign of(index===10||index===14?[-1,1]:[-1])){
  const span=p.depth-p.T-.44,z=(p.fz-p.T+p.back+.44)/2;
  arch(span/2,.52,2.4,3.28,.18,(g,m)=>{g.rotateY(sign<0?Math.PI/2:-Math.PI/2);g.translate(sign*(p.fw/2-.10),0,z);b.add(g,m);},.18);
 }
 return p;
}
