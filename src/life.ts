import * as THREE from 'three';
import {toWorld} from './geo.mjs';
import {townToUTM} from './housing-plan.mjs';
import {pathPose,boatPose} from './life-plan.mjs';
import type {Terrain} from './terrain';
type Pose={root:THREE.Group;animate:(phase:number,walking:boolean,task?:string)=>void};
export function makeLife(urban:any,littoral:any,boats:THREE.Group,meta:Terrain,surface:(e:number,n:number)=>number|null){
 const root=new THREE.Group(),people=new THREE.Group(),animals=new THREE.Group();root.name='Vida quotidiana · escena genèrica C';people.name='Persones';animals.name='Animals de càrrega';root.add(people,animals);
 const colors={skin:new THREE.MeshStandardMaterial({color:'#b78a66',roughness:1}),linen:new THREE.MeshStandardMaterial({color:'#d3c6a6',roughness:1}),blue:new THREE.MeshStandardMaterial({color:'#495d63',roughness:1}),brown:new THREE.MeshStandardMaterial({color:'#765b46',roughness:1}),ochre:new THREE.MeshStandardMaterial({color:'#8a714c',roughness:1}),dark:new THREE.MeshStandardMaterial({color:'#343d35',roughness:1}),wood:new THREE.MeshStandardMaterial({color:'#735a3c',roughness:1}),horse:new THREE.MeshStandardMaterial({color:'#6e4b34',roughness:1}),donkey:new THREE.MeshStandardMaterial({color:'#92917f',roughness:1})};
 const sphere=new THREE.SphereGeometry(1,7,5),cylinder=new THREE.CylinderGeometry(1,1,1,6),cube=new THREE.BoxGeometry(1,1,1);
 const mesh=(g:THREE.Group,geometry:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,sx:number,sy:number,sz:number)=>{const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);g.add(o);return o;};
 const person=(index:number,task='walk'):Pose=>{
  const g=new THREE.Group(),torso=new THREE.Group();g.name='Persona d’assaig · '+task;g.add(torso);const cloth=[colors.linen,colors.blue,colors.brown,colors.ochre][index%4];
  mesh(torso,cylinder,cloth,0,1.15,0,.19,.57,.15);mesh(torso,sphere,colors.skin,0,1.59,0,.125,.155,.12);mesh(torso,cylinder,colors.dark,0,1.76,0,.15,.07,.15);
  if(index%5===0){mesh(torso,new THREE.ConeGeometry(.30,.75,8),colors.ochre,0,.59,0,1,1,1);mesh(torso,cylinder,colors.linen,0,1.79,-.025,.13,.08,.12);}
  const legs:THREE.Group[]=[],arms:THREE.Group[]=[];
  for(const sign of[-1,1]){const leg=new THREE.Group();leg.position.set(sign*.10,.87,0);g.add(leg);mesh(leg,cylinder,colors.dark,0,-.36,0,.07,.72,.07);mesh(leg,cube,colors.brown,0,-.78,.045,.14,.13,.24);legs.push(leg);
   const arm=new THREE.Group();arm.position.set(sign*.23,1.35,0);torso.add(arm);mesh(arm,cylinder,cloth,0,-.24,0,.06,.48,.06);mesh(arm,sphere,colors.skin,0,-.51,0,.06,.075,.06);arms.push(arm);
  }
  if(task==='walk'&&index%3===0)mesh(arms[1],new THREE.CylinderGeometry(.18,.13,.25,8),colors.ochre,0,-.7,0,1,1,1);
  if(task==='garden'){const tool=mesh(arms[1],cylinder,colors.wood,0,-.85,.15,.023,1.35,.023);tool.rotation.x=-.2;mesh(arms[1],cube,colors.dark,0,-1.43,.25,.35,.06,.15);}
  if(task==='forge'){mesh(arms[1],cylinder,colors.wood,0,-.7,0,.03,.35,.03);mesh(arms[1],cube,colors.dark,0,-.88,0,.24,.13,.12);}
  if(task==='fishing'){const line=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(.23,1.1,.3),new THREE.Vector3(.23,2.1,2.3),new THREE.Vector3(.23,-.8,2.9)]);g.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:'#776a50'})));}
  const animate=(phase:number,moving:boolean,kind=task)=>{const step=moving?Math.sin(phase):0;legs.forEach((o,i)=>o.rotation.x=step*(i?-.43:.43));arms.forEach((o,i)=>o.rotation.x=step*(i?.33:-.33));torso.rotation.x=0;
   if(['garden','forge','carpenter'].includes(kind)){torso.rotation.x=kind==='garden'?.24:.08;arms[0].rotation.x=-.8;arms[1].rotation.x=-.9+Math.sin(phase)*.35;}
   if(kind==='fishing'){arms.forEach(o=>o.rotation.x=-.8+Math.sin(phase*.25)*.05);}
  };animate(0,false);return{root:g,animate};
 };
 const equine=(donkey:boolean,cart:boolean):Pose=>{
  const g=new THREE.Group(),m=donkey?colors.donkey:colors.horse;g.name=donkey?'Ruc amb sàrries · C':'Cavall i carro · C';const scale=donkey?.84:1;
  mesh(g,sphere,m,0,1.02,0,.34,.40,.78);const neck=mesh(g,cube,m,0,1.36,.57,.30,.65,.38);neck.rotation.x=-.35;mesh(g,sphere,m,0,1.69,.82,.22,.25,.39);mesh(g,cube,colors.dark,0,1.62,1.1,.28,.16,.28);
  for(const sign of[-1,1]){const ear=mesh(g,new THREE.ConeGeometry(.08,donkey?.43:.24,5),m,sign*.13,donkey?2.03:1.94,.75,1,1,1);ear.rotation.z=sign*.2;mesh(g,sphere,colors.dark,sign*.2,1.77,.93,.028,.028,.028);}
  const legs:THREE.Group[]=[];for(const x of[-.23,.23])for(const z of[-.52,.50]){const leg=new THREE.Group();leg.position.set(x,.87,z);g.add(leg);mesh(leg,cylinder,m,0,-.37,0,.06,.75,.06);mesh(leg,cube,colors.dark,0,-.79,.015,.15,.13,.19);legs.push(leg);}
  const tail=mesh(g,cylinder,colors.dark,0,.86,-.85,.055,.60,.055);tail.rotation.x=-.7;
  if(donkey){for(const sign of[-1,1])mesh(g,new THREE.CylinderGeometry(.27,.21,.5,8),colors.ochre,sign*.44,1.06,0,1,1,1);mesh(g,cube,colors.brown,0,1.32,0,.65,.10,.65);}
  const wheels:THREE.Group[]=[];if(cart){mesh(g,cube,colors.wood,0,.77,-2.35,1.35,.15,1.6);for(const sign of[-1,1]){mesh(g,cube,colors.wood,sign*.55,.78,-1.1,.09,.09,2.5);const w=new THREE.Group();w.position.set(sign*.85,.43,-2.35);g.add(w);const rim=mesh(w,new THREE.TorusGeometry(.43,.045,5,16),colors.wood,0,0,0,1,1,1);rim.rotation.y=Math.PI/2;for(let j=0;j<6;j++){const spoke=mesh(w,cube,colors.wood,0,0,0,.045,.86,.045);spoke.rotation.x=j*Math.PI/6;}wheels.push(w);}for(let i=0;i<3;i++)mesh(g,cube,colors.ochre,(i-1)*.35,1,-2.35,.3,.35,1);}
  g.scale.setScalar(scale);return{root:g,animate:(phase:number,moving:boolean)=>{legs.forEach((o,i)=>o.rotation.x=moving?Math.sin(phase+(i===0||i===3?0:Math.PI))*.35:0);tail.rotation.z=Math.sin(phase*.25)*.12;wheels.forEach(w=>w.rotation.x=phase*.3);}};
 };
 type Actor={model:Pose;route?:any;phase:number;lane:number;speed:number;fromYear:number;point?:number[];height?:number;task?:string;dynamicForge?:boolean;animal?:boolean;aboard?:boolean};
 const actors:Actor[]=[];let index=0;
 for(const[id,count]of[['carrer-major',4],['rambla',3],['rampar',2],['pedrera',1]]as[string,number][]){const r=urban.routes.find((r:any)=>r.id===id),route={...r,points:id==='pedrera'?r.points.slice(0,-1):r.points};for(let i=0;i<count;i++){const model=person(index++);people.add(model.root);actors.push({model,route,phase:id==='carrer-major'?[.40,.48,.58,.65][i]:(i+.2)/count,lane:i%2?1:-1,speed:.78+(i%3)*.12,fromYear:r.fromYear});}}
 const town=(a:number,b:number)=>{const p=townToUTM(a,b,urban.frame);return[p.easting,p.northing];};
 for(const[point,task,fromYear]of[[town(-151,40),'garden',1794],[town(-145,-45),'garden',1794],[town(-58,99),'carpenter',1794],[[0,0],'forge',1780]]as[number[],string,number][]){const model=person(index++,task);people.add(model.root);actors.push({model,point,task,fromYear,phase:index,lane:0,speed:0,dynamicForge:task==='forge'});}
 for(const e of[296523,296539]){const model=person(index++,'fishing');people.add(model.root);actors.push({model,point:[e,4499183.2],height:1.3,task:'fishing',fromYear:1794,phase:index,lane:0,speed:0});}
 for(let i=0;i<3;i++){const model=equine(i!==0,i===0),r=urban.routes.find((r:any)=>r.id===(i===0?'pedrera':'rambla'));animals.add(model.root);actors.push({model,route:{...r,points:i===0?r.points.slice(0,-1):r.points},phase:.27+i*.24,lane:i===0?0:i===1?.7:-.7,speed:i===0?.65:.78,fromYear:r.fromYear,animal:true});}
 for(const[bi,boat]of boats.children.entries()){const b=littoral.boats[bi],model=person(index++,'fishing');model.root.position.set(0,b.length*.15*.3,-b.length*.13);model.root.scale.setScalar(.95);boat.add(model.root);actors.push({model,task:'fishing',fromYear:1794,phase:index,lane:0,speed:0,aboard:true});}
 let time=0,year=1800,playing=true,showPeople=true,showAnimals=true;
 const update=(dt:number)=>{
  if(playing)time+=Math.min(dt,.08);
  for(const a of actors){const available=year>=a.fromYear&&year<=1800&&(a.animal?showAnimals:showPeople);a.model.root.visible=available;if(!available)continue;
   if(!a.aboard){let e:number,n:number,heading=0;if(a.route){const p=pathPose(a.route.points,time,a.speed,a.phase,a.lane);e=p.e;n=p.n;heading=p.heading;}else{let point=a.point!;if(a.dynamicForge){const site=urban.sites.find((s:any)=>s.id===(year<1794?'ferreria-vella':'ferreria-nova')),r=urban.frame.alongAzimuthDegrees*Math.PI/180;point=[site.anchor[0]-Math.sin(r)*5,site.anchor[1]-Math.cos(r)*5];}e=point[0];n=point[1];}
    const ground=a.height??surface(e,n);if(ground===null){a.model.root.visible=false;continue;}a.model.root.position.fromArray(toWorld(e,n,ground,meta.origin));a.model.root.rotation.y=heading;
   }
   a.model.animate(time*(a.route?5:2.4)+a.phase,!!a.route,a.task);
  }
  if(year>=1794&&year<=1800)for(const[i,boat]of boats.children.entries()){const p=boatPose(littoral.boats[i],i,time,littoral);boat.position.fromArray(toWorld(p.e,p.n,p.height,meta.origin));boat.rotation.set(p.pitch,p.heading,p.roll);}
 };
 const setState=(options:{year:number;playing:boolean;people:boolean;animals:boolean})=>{year=options.year;playing=options.playing;showPeople=options.people;showAnimals=options.animals;people.visible=showPeople;animals.visible=showAnimals;update(0);};
 return{root,people,animals,actors,setState,update,get time(){return time;}};
}
