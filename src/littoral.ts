import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh} from './building-plan.mjs';
import {toWorld,sampleHeight} from './geo.mjs';
import {landscapeSample,routeStations,canalWaterLevel,shoreEasting,coastalWaterOutline} from './littoral-plan.mjs';
import {entityAt} from './chronology.mjs';
import {tileTexture} from './housing.ts';
import {makeBoats} from './boats.ts';
import {makeResearchLandscape} from './research-landscape.ts';
import type {Terrain} from './terrain';
export type LittoralSite={id:string;name:string;anchor:number[];kind:string;radius:number;state:string;evidence:string;technicalBaseElevation:number;[key:string]:any};
export type Littoral={sites:LittoralSite[];[key:string]:any};

export function makeLittoral(data:Littoral,meta:Terrain,h:Float32Array,v:Uint8Array,chronology:any){
  const root=new THREE.Group(),roquer=new THREE.Group(),port=new THREE.Group(),canal=new THREE.Group(),water=new THREE.Group(),project=new THREE.Group(),guns=new THREE.Group();
  root.name='Roquer, litoral i canal · estudi C';root.add(roquer,port,canal,water,project);
  const mat={stone:new THREE.MeshStandardMaterial({color:'#b8aa89',roughness:1}),lime:new THREE.MeshStandardMaterial({color:'#d1c5aa',roughness:1}),brick:new THREE.MeshStandardMaterial({color:'#a37a55',roughness:1}),wood:new THREE.MeshStandardMaterial({color:'#675039',roughness:1}),iron:new THREE.MeshStandardMaterial({color:'#414742',roughness:.9}),roof:new THREE.MeshStandardMaterial({map:tileTexture(),color:'#f4e4cc',roughness:1}),earth:new THREE.MeshStandardMaterial({color:'#a59e80',roughness:1}),rock:new THREE.MeshStandardMaterial({color:'#969583',roughness:1})};
  for(const[name,m]of Object.entries(mat))m.name=name;
  const seaMat=new THREE.MeshStandardMaterial({color:'#4c8e91',roughness:.33,metalness:.14,transparent:false});seaMat.name='Aigua · nivell tècnic';
  const canalMat=seaMat;
  const makeSea=(basins:any[])=>{
    const seaShape=new THREE.Shape();coastalWaterOutline({...data,basins}).forEach(([e,n]:number[],i:number)=>{const[x,,z]=toWorld(e,n,0,meta.origin);i?seaShape.lineTo(x,-z):seaShape.moveTo(x,-z);});
    seaShape.lineTo(4200,-(meta.origin.northing-4497800));seaShape.lineTo(4200,-(meta.origin.northing-4501500));seaShape.closePath();
    const sg=new THREE.ShapeGeometry(seaShape);sg.rotateX(-Math.PI/2);const sea=new THREE.Mesh(sg,seaMat);sea.position.y=data.studyWaterElevation;return sea;
  };
  const openHarbour=makeSea(data.basins),earlierCoast=makeSea([]);openHarbour.name='Mar i dàrsenes connectats · estudi C';earlierCoast.name='Costa anterior · estudi C';water.add(openHarbour,earlierCoast);
  const lineMat=new THREE.LineBasicMaterial({color:'#b2cec0',transparent:true,opacity:.35});
  // Small stationary ripples cannot change water elevation or flood adjacent ground.
  for(let j=0;j<50;j++){const e=296620+(j%10)*32,n=4499090+Math.floor(j/10)*65;const p=[toWorld(e,n,data.studyWaterElevation+.025,meta.origin),toWorld(e+12,n+3,data.studyWaterElevation+.025,meta.origin)];water.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p.map(p=>new THREE.Vector3(...p))),lineMat));}
  const ribbon=(route:number[][],width:number,sloping:boolean)=>{
    const stations=routeStations(route,4),p:number[]=[],ids:number[]=[];
    for(const s of stations){const level=sloping?canalWaterLevel(s.along,s.length,data.studyWaterElevation):data.studyWaterElevation;for(const sign of[-1,1])p.push(...toWorld(s.e-sign*s.dy*width/2,s.n+sign*s.dx*width/2,level,meta.origin));}
    for(let i=0;i<stations.length-1;i++){const a=i*2;ids.push(a,a+2,a+1,a+1,a+2,a+3);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();return new THREE.Mesh(g,canalMat);
  };
  const annotationPoints=routeStations(data.canal.routeStudy,30).map((s:any)=>new THREE.Vector3(...toWorld(s.e,s.n,canalWaterLevel(s.along,s.length,data.studyWaterElevation)+.12,meta.origin)));
  const routeAnnotation=new THREE.Line(new THREE.BufferGeometry().setFromPoints(annotationPoints),new THREE.LineBasicMaterial({color:'#28645b',transparent:true,opacity:.85,depthTest:false}));routeAnnotation.name='Anotació del traçat C · amplada física independent';routeAnnotation.renderOrder=5;root.add(routeAnnotation);routeAnnotation.visible=false;
  const mainWater=ribbon(data.canal.routeStudy,data.canal.studyWidth,true),branchWater=ribbon(data.canal.branchStudy,6.5,false);mainWater.name='Canal de Carles III · aigua baixa C';branchWater.name='Ramal de la dàrsena petita';canal.add(mainWater,branchWater);

  const createBuilder=(group:THREE.Group)=>{
    const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
    const emit=(source:THREE.BufferGeometry,m:THREE.Material,x=0,y=0,z=0,angle=0)=>{
      const g=source.index?source.toNonIndexed():source;if(source!==g)source.dispose();g.rotateY(angle);g.translate(x,y,z);if(!g.getAttribute('normal'))g.computeVertexNormals();
      if(!g.getAttribute('uv')){const p=g.getAttribute('position'),uv=[];for(let i=0;i<p.count;i++)uv.push(p.getX(i)/3,p.getZ(i)/3+p.getY(i)/3);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
      const arr=batches.get(m)??[];arr.push(g);batches.set(m,arr);
    };
    const box=(x:number,y:number,z:number,w:number,H:number,d:number,m:THREE.Material=mat.stone,angle=0)=>emit(new THREE.BoxGeometry(w,H,d),m,x,y,z,angle);
    const wall=(x:number,y:number,z:number,w:number,H:number,t:number,angle=0,holes:any[]=[],m:THREE.Material=mat.lime)=>{const s=wallSurfaceMesh(w,H,t,holes,.12),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(s.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(s.normals,3));g.setIndex(s.indices);emit(g,m,x,y,z,angle);};
    const shell=(w:number,d:number,H:number,holes:any[]=[],m:THREE.Material=mat.lime,y=0)=>{wall(0,y,d/2-.25,w,H,.5,0,holes,m);wall(0,y,-d/2+.25,w,H,.5,Math.PI,[],m);for(const sign of[-1,1])wall(sign*(w/2-.25),y,0,d-1,H,.5,Math.PI/2,[],m);};
    const roof=(w:number,d:number,H:number)=>{const p=[-w/2,H,-d/2,-w/2,H,d/2,-w/2,H+d*.23,0,w/2,H,-d/2,w/2,H,d/2,w/2,H+d*.23,0],g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex([0,2,5,0,5,3,1,4,5,1,5,2]);g.computeVertexNormals();emit(g,mat.roof);for(const sign of[-1,1]){const tg=new THREE.BufferGeometry();tg.setAttribute('position',new THREE.Float32BufferAttribute([sign*w/2,H,-d/2,sign*w/2,H+d*.23,0,sign*w/2,H,d/2],3));tg.computeVertexNormals();emit(tg,new THREE.MeshStandardMaterial({color:'#c9bca0',side:THREE.DoubleSide,roughness:1}));}};
    const flush=()=>{for(const[m,gs]of batches){const g=mergeGeometries(gs,false);if(!g)throw Error('Invalid littoral batch');const mesh=new THREE.Mesh(g,m);group.add(mesh);for(const old of gs)old.dispose();}batches.clear();};
    return {emit,box,wall,shell,roof,flush};
  };
  const siteGroups=new Map<string,THREE.Group>();let lowBattery:THREE.Group,finishedBattery:THREE.Group,oldTower:THREE.Group,repairedTower:THREE.Group;
  for(const s of data.sites){
    const group=new THREE.Group();group.name=s.name;group.userData.littoralId=s.id;siteGroups.set(s.id,group);(s.kind==='health'?port:roquer).add(group);
    group.position.fromArray(toWorld(...s.anchor,s.technicalBaseElevation,meta.origin));
    if(s.alongAzimuthDegrees)group.rotation.y=-s.alongAzimuthDegrees*Math.PI/180;
    const b=createBuilder(group),w=s.width??8,d=s.depth??8,H=s.height??3.2;
    const openings=[{x:0,width:1.4,height:2.35,bottom:0}];
    if(s.kind==='battery'){
      group.rotation.y=(180-data.battery.frontAzimuthDegrees)*Math.PI/180;
      const outline=data.battery.outlineStudy;
      const makePhase=(height:number)=>{
        const phase=new THREE.Group(),pb=createBuilder(phase),shape=new THREE.Shape(),hole=new THREE.Path();
        outline.forEach(([x,z]:number[],i:number)=>i?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();
        [...outline].reverse().forEach(([x,z]:number[],i:number)=>i?hole.lineTo(x*.89,-z*.89):hole.moveTo(x*.89,-z*.89));hole.closePath();shape.holes.push(hole);
        const g=new THREE.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false});g.rotateX(-Math.PI/2);pb.emit(g,mat.stone);
        // Partial radial rooms follow the planned arrangement; none receives a full upper storey.
        for(let i=0;i<7;i++){const a=Math.PI*.12+i*Math.PI*.126,x=13.5*Math.cos(a),z=9+8.5*Math.sin(a);pb.wall(x,0,z,5,Math.min(height,2.5),.55,a-Math.PI/2,[],mat.brick);}
        for(const sign of[-1,1])pb.wall(sign*11,0,-1,13,Math.min(height,2.7),.6,Math.PI/2,[{x:0,width:1.5,height:2.1,bottom:0}],mat.brick);
        pb.box(0,-.15,5,27,.3,22,mat.earth);
        // One almost finished supply room; the rest remains open.
        if(height>2){pb.wall(-8,0,-7,6,2.8,.5,0,[{x:0,width:1.4,height:2.1,bottom:0}],mat.stone);pb.box(-8,2.8,-9,6,.25,4,mat.stone);}
        pb.flush();return phase;
      };
      lowBattery=makePhase(.9);finishedBattery=makePhase(3.2);group.add(lowBattery,finishedBattery);
      const projectShape=new THREE.Shape();outline.forEach(([x,z]:number[],i:number)=>i?projectShape.lineTo(x,-z):projectShape.moveTo(x,-z));projectShape.closePath();
      const pg=new THREE.ExtrudeGeometry(projectShape,{depth:7,bevelEnabled:false});pg.rotateX(-Math.PI/2);const wire=new THREE.LineSegments(new THREE.EdgesGeometry(pg),new THREE.LineDashedMaterial({color:'#ad653b',dashSize:1.3,gapSize:.8,transparent:true,opacity:.7}));wire.computeLineDistances();
      const projectGroup=new THREE.Group();projectGroup.position.copy(group.position);projectGroup.rotation.copy(group.rotation);projectGroup.add(wire);project.add(projectGroup);
      group.add(guns);
      for(let i=0;i<6;i++){
        const gun=new THREE.Group();gun.name=i<3?'Canó amb curenya degradada · C':'Canó sense curenya · C';gun.userData.mounted=i<3;
        const a=.2+i*Math.PI*.15;gun.position.set(12*Math.cos(a),i<3?.9:.32,7+9*Math.sin(a));gun.rotation.y=a-Math.PI/2;
        const barrel=new THREE.Mesh(new THREE.CylinderGeometry(.21,.32,2.7,12,1,true),mat.iron);barrel.rotation.x=Math.PI/2;gun.add(barrel);
        if(i<3){const gb=createBuilder(gun);for(const sign of[-1,1]){gb.box(sign*.38,-.2,-.1,.18,.48,1.7,mat.wood);for(const z of[-.55,.55]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.27,.27,.17,10),mat.wood);wheel.rotation.z=Math.PI/2;wheel.position.set(sign*.52,-.43,z);gun.add(wheel);}}gb.flush();}
        guns.add(gun);
      }
      // Foundation follows the footprint; no rectangular pad projects outside the fort.
      const skirt:number[]=[];
      for(let i=0;i<outline.length;i++){
        const a=outline[i],next=outline[(i+1)%outline.length],count=Math.ceil(Math.hypot(next[0]-a[0],next[1]-a[1]));
        for(let j=0;j<count;j++){
          const points=[];
          for(const u of[j/count,(j+1)/count]){const x=THREE.MathUtils.lerp(a[0],next[0],u),z=THREE.MathUtils.lerp(a[1],next[1],u),r=group.rotation.y,e=s.anchor[0]+x*Math.cos(r)+z*Math.sin(r),n=s.anchor[1]+x*Math.sin(r)-z*Math.cos(r),raw=sampleHeight(meta,h,v,e,n);const bottom=raw===null?-.35:landscapeSample(e,n,raw,data).height-s.technicalBaseElevation;points.push([x,-.34,z],[x,bottom-.05,z]);}
          for(const k of[0,1,2,2,1,3])skirt.push(...points[k]);
        }
      }
      const sk=new THREE.BufferGeometry();sk.setAttribute('position',new THREE.Float32BufferAttribute(skirt,3));sk.computeVertexNormals();b.emit(sk,new THREE.MeshStandardMaterial({color:'#a59e80',roughness:1,side:THREE.DoubleSide}));
      const foundation=new THREE.Shape();outline.forEach(([x,z]:number[],i:number)=>i?foundation.lineTo(x,-z):foundation.moveTo(x,-z));foundation.closePath();const fg=new THREE.ExtrudeGeometry(foundation,{depth:.35,bevelEnabled:false});fg.rotateX(-Math.PI/2);fg.translate(0,-.35,0);b.emit(fg,mat.earth);
    }else if(s.kind==='tower'){
      const phase=(repaired:boolean)=>{const g=new THREE.Group(),q=createBuilder(g),height=repaired?H:H*.81,holes=[...openings],ww=repaired?w:(s.existingWidth??w);g.position.x=repaired?0:-(w-ww)/2;for(let i=1;i<4;i++)if(i*3<height-1)holes.push({x:0,width:.7,height:1.1,bottom:i*3});q.shell(ww,d,height,holes,repaired?mat.lime:mat.stone);q.box(0,height-.10,0,ww-.6,.2,d-.6,mat.earth);for(const sign of[-1,1]){q.box(sign*(ww/2-.2),height+.35,0,.4,.7,d);q.box(0,height+.35,sign*(d/2-.2),ww-.8,.7,.4);}q.flush();return g;};
      oldTower=phase(false);repairedTower=phase(true);group.add(oldTower,repairedTower);
    }else if(s.kind==='ruins'){
      b.wall(0,0,-d/2+.3,w,H,.6,0,[],mat.stone);b.wall(-w/2+.3,0,0,d-1.2,H*1.4,.6,Math.PI/2,[{x:0,width:1.4,height:2,bottom:0}],mat.stone);
      b.wall(w/2-.3,0,-3,d*.55,H*.6,.6,Math.PI/2,[],mat.stone);b.wall(-3,0,4,8,1.2,.6,0,[],mat.stone);
      const reused=new THREE.Group();reused.position.set(4,0,-3);group.add(reused);const rb=createBuilder(reused);rb.shell(8,7,4.1,openings);rb.roof(8,7,4.1);rb.flush();
    }else if(s.kind==='cistern'){
      b.shell(w,d,1.05,[],mat.stone);b.box(0,-.12,0,w-1,.12,d-1,mat.earth);for(let i=0;i<6;i++)b.box(-w/2-.6,i*.16,-d/2+i*.6,1.1,.2,.6,mat.stone);
    }else if(s.kind==='kiln'){
      b.shell(w,d,H,[{x:0,width:1.8,height:1.6,bottom:0}],mat.brick);b.box(0,H-.15,0,w,.3,d,mat.brick); // Simple kiln, no invented industrial chimney.
    }else if(s.kind==='well'){
      const shape=new THREE.Shape(),hole=new THREE.Path();shape.absarc(0,0,1,0,Math.PI*2,false);hole.absarc(0,0,.6,0,Math.PI*2,true);shape.holes.push(hole);const g=new THREE.ExtrudeGeometry(shape,{depth:1,bevelEnabled:false});g.rotateX(-Math.PI/2);b.emit(g,mat.stone);
    }else{
      const holes=[...openings];if(s.kind!=='health')for(const x of[-w*.28,w*.28])holes.push({x,width:.9,height:1.1,bottom:H>5?3.5:1.4});
      b.shell(w,d,H,holes);b.roof(w,d,H);if(s.kind==='inn')for(const x of[-w*.3,w*.3])b.box(x,1.4,d/2+1.4,.16,2.8,.16,mat.wood);
    }
    // Perimeter footings descend into the current study ground, without a floating building.
    if(s.kind!=='battery'){
      const ground=sampleHeight(meta,h,v,...s.anchor),bottom=ground===null?-2:landscapeSample(...s.anchor,ground,data).height;
      const rise=Math.max(.15,s.technicalBaseElevation-bottom+.2);b.box(0,-rise/2,0,w,rise,d,mat.earth);
    }
    b.flush();
  }
  const planProject=new THREE.Group();planProject.name='Obres H–O projectades el 1748 · no executades com al dibuix';planProject.visible=false;roquer.add(planProject);
  for(const f of data.plan1748Project??[]){
    const shape=new THREE.Shape();
    f.footprintUTM.forEach(([e,n]:number[],i:number)=>{const[x,,z]=toWorld(e,n,0,meta.origin);i?shape.lineTo(x,-z):shape.moveTo(x,-z);});shape.closePath();
    const levels=f.footprintUTM.map(([e,n]:number[])=>{const raw=sampleHeight(meta,h,v,e,n);return raw===null?0:landscapeSample(e,n,raw,data).height;}),base=Math.max(...levels)+.15;
    const g=new THREE.ExtrudeGeometry(shape,{depth:f.height,bevelEnabled:false});g.rotateX(-Math.PI/2);g.translate(0,base,0);
    const outline=new THREE.LineSegments(new THREE.EdgesGeometry(g),new THREE.LineDashedMaterial({color:'#e1ac37',dashSize:.65,gapSize:.3,depthTest:false}));outline.computeLineDistances();outline.name=`${f.letter} · ${f.name}`;outline.userData.plan1748=f;outline.renderOrder=7;planProject.add(outline);g.dispose();
  }
  const p=createBuilder(port),worldBox=(e:number,n:number,w:number,d:number,top:number,H:number,m=mat.stone)=>{const[x,,z]=toWorld(e,n,0,meta.origin);p.box(x,top-H/2,z,w,H,d,m);};
  // Modest works in the inventory, not the monumental unexecuted mole of 1782.
  worldBox(296516,4499184,85,5,1.3,2.6);worldBox(296574,4499247,5,70,1.25,2.5);
  for(let i=0;i<13;i++)worldBox(296477+i*7,4499188,3.5,2.5,.8,1.8,mat.rock);
  // Built retaining wall / two ramp studies connect the high town to the low waterfront.
  for(const [start,end]of[[[296457,4499323],[296505,4499285]],[[296455,4499380],[296563,4499411]]]){
    const dx=end[0]-start[0],dn=end[1]-start[1],L=Math.hypot(dx,dn),angle=Math.atan2(-dn,dx);
    const [x,,z]=toWorld((start[0]+end[0])/2,(start[1]+end[1])/2,0,meta.origin);
    const shape=new THREE.BufferGeometry();shape.setAttribute('position',new THREE.Float32BufferAttribute([-L/2,6,-2,L/2,1.3,-2,-L/2,6,2,L/2,1.3,2],3));shape.setIndex([0,2,1,1,2,3]);shape.computeVertexNormals();p.emit(shape,mat.earth,x,0,z,-angle);
    p.box(x,1.5,z,L,.7,.6,mat.stone,-angle);
  }
  p.flush();
  // Sediment shoals remain above parts of the canal water. They do not imply navigability.
  const cb=createBuilder(canal),stations=routeStations(data.canal.routeStudy,100);
  for(let i=3;i<stations.length-3;i+=11){const s=stations[i],[x,y,z]=toWorld(s.e,s.n,canalWaterLevel(s.along,s.length,data.studyWaterElevation)+.025,meta.origin);cb.box(x,y,z,3,.10,5,mat.earth,Math.atan2(-s.dx,-s.dy));}cb.flush();
  // Amposta head works: only the small drainage sluice and partial masonry are claimed.
  const head=new THREE.Group();head.name='Amposta · obra parcial de la resclosa';head.position.fromArray(toWorld(...data.canal.routeStudy.at(-1),1.35,meta.origin));canal.add(head);
  const hb=createBuilder(head);for(const sign of[-1,1])hb.box(sign*6,.65,0,2,1.3,16);for(let i=0;i<12;i++)hb.box(12+(i%4)*1.2,.35,-6+Math.floor(i/4)*1.1,1,.7,.9);hb.flush();
  const rocks=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),mat.rock,156);
  rocks.name='Afloraments del Roquer · distribució C';
  const dummy=new THREE.Object3D();
  const coastStations=data.roquerCoast?routeStations(data.roquerCoast,1):null;
  for(let i=0;i<rocks.count;i++){
    const st=coastStations?.[Math.min(coastStations.length-1,Math.floor(i/rocks.count*coastStations.length))],distance=.6+(Math.sin(i*23.17)*.5+.5)*1.7,n=st?st.n-st.dx*distance:4499055+(i/rocks.count)*205,e=st?st.e+st.dy*distance:shoreEasting(n,data.shorelineStudy)-distance,level=sampleHeight(meta,h,v,e,n);
    const ground=level===null?.6:landscapeSample(e,n,level,data).height;
    dummy.position.fromArray(toWorld(e,n,ground+.1,meta.origin));dummy.rotation.set(i*.7,i*1.7,i*.3);dummy.scale.set(.7+(i%4)*.3,.4+(i%3)*.2,.65+(i%5)*.22);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
  }
  root.add(rocks);
  const boats=makeBoats(data,meta);root.add(boats);
  const research=data.researchLandscape?makeResearchLandscape(data.researchLandscape,meta,(e,n)=>{const raw=sampleHeight(meta,h,v,e,n);return raw===null?null:landscapeSample(e,n,raw,data).height;}):null;
  if(research)roquer.add(research.root);
  const setYear=(year:number)=>{
    research?.setYear(year);
    const battery=entityAt(chronology,'battery',year),tower=entityAt(chronology,'tower',year),works=entityAt(chronology,'works',year),services=entityAt(chronology,'services',year);
    siteGroups.get('battery')!.visible=battery.visible;lowBattery!.visible=battery.variant==='construction';finishedBattery!.visible=battery.visible&&!lowBattery!.visible;
    oldTower!.visible=tower.variant==='unrepaired';repairedTower!.visible=!oldTower!.visible;guns.visible=entityAt(chronology,'guns',year).visible;
    for(const id of['quarters','cistern','kiln'])siteGroups.get(id)!.visible=works.visible;
    for(const id of['old-inn','old-customs'])siteGroups.get(id)!.visible=entityAt(chronology,id,year).visible;siteGroups.get('health')!.visible=services.visible;
    port.visible=services.visible;canal.visible=entityAt(chronology,'canal',year).visible;openHarbour.visible=canal.visible;earlierCoast.visible=!canal.visible;boats.visible=services.visible;
  };
  setYear(1800);return {root,roquer,port,canal,water,boats,research,project,planProject,guns,siteGroups,setYear,routeAnnotation,openHarbour,earlierCoast,mainWater,branchWater};
}
