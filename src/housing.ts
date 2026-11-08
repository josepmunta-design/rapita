import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh,planToUTM} from './building-plan.mjs';
import {sampleHeight,toWorld} from './geo.mjs';
import type {Terrain} from './terrain';
import {roofTexture,surfaceMaterial,groundQuad} from './vernacular.ts';
import {housingNavigation,porticoPlan,yardPlan} from './domestic-plan.mjs';
import {detailedPorxo} from './porxos.ts';
import {PORXO_STUDY} from './porxo-plan.mjs';
import {makePlacaFacade} from './placa-facades.ts';

export type HousingStructure={id:string;group:string;kind:string;anchor:{easting:number;northing:number};across:number;along:number;
  width:number;depth:number;frontWidth?:number;backWidth?:number;frontZ?:number;backZ?:number;wingDepth?:number;countedUnits?:number;
  renderState?:string;wallHeight:number;roofRise:number;wallThickness:number;frontAzimuthDegrees:number;state1794:string;reservation?:string;
  terrain:{minimum:number;maximum:number;technicalBaseElevation:number};individualPositionConfidence:string;geometryConfidence:string};
export type Housing={structures:HousingStructure[];summary:{renderedStructures:number;royalInventoryUnits:number;largeHouses:number;smallCoastalUnits:number;sharedManzanaUnits:number;privateMixedUnplaced:number};
  inventory:{id:string;count:number;unit:string;source:string}[];townFrame:{easting:number;northing:number;alongAzimuthDegrees:number};
  sources:{id:string;title:string;url?:string;local?:string}[];rules:string[]};
type Hole={x:number;width:number;height:number;bottom:number};

export function tileTexture(){
  return roofTexture();
}

export function makeHousing(data:Housing,meta:Terrain,heights:Float32Array,valid:Uint8Array){
  const root=new THREE.Group();root.name='Habitatges · inventari de 1794 / escenari del 1800';
  const palette={lime:['#fffdf2','#f8f2e3','#fff6e6'].map(color=>surfaceMaterial('lime',color,'lime',.008)),
    bare:surfaceMaterial('bare','#f5eedb','brick',.018),stone:surfaceMaterial('stone','#fff4d9','lime',.013),
    roof:surfaceMaterial('roof','#fff7e9','tile',.025),wood:surfaceMaterial('wood','#d6bda0','wood',.012),
    soil:new THREE.MeshStandardMaterial({color:'#b9a982',roughness:1}),
    iron:new THREE.MeshStandardMaterial({color:'#384039',roughness:.8}),technical:new THREE.MeshStandardMaterial({color:'#a4a591',roughness:1,side:THREE.DoubleSide})};
  palette.soil.name='soil';
  for(const [unitIndex,s]of data.structures.entries()){
    const house=new THREE.Group();house.name=s.id;house.userData.structureId=s.id;
    house.userData.navigation=housingNavigation(s);house.userData.detailConfidence='C';
    house.position.fromArray(toWorld(s.anchor.easting,s.anchor.northing,s.terrain.technicalBaseElevation,meta.origin));house.rotation.y=THREE.MathUtils.degToRad(180-s.frontAzimuthDegrees);
    const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
    const add=(geometry:THREE.BufferGeometry,material:THREE.Material,matrix?:THREE.Matrix4)=>{
      let g=geometry.index?geometry.toNonIndexed():geometry;if(g!==geometry)geometry.dispose();
      if(matrix)g.applyMatrix4(matrix);
      if(!g.attributes.normal)g.computeVertexNormals();
      if(!g.attributes.uv){const p=g.getAttribute('position'),n=g.getAttribute('normal'),uv=[];for(let i=0;i<p.count;i++)uv.push((Math.abs(n.getZ(i))>.5?p.getX(i):p.getZ(i))/2,Math.abs(n.getY(i))>.6?p.getX(i)/2:p.getY(i)/2);g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));}
      const list=batches.get(material)??[];list.push(g);batches.set(material,list);
    };
    const matrix=(x:number,y:number,z:number,rotation=0)=>new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),rotation),new THREE.Vector3(1,1,1));
    const box=(x:number,y:number,z:number,w:number,h:number,d:number,mat:THREE.Material)=>add(new THREE.BoxGeometry(w,h,d),mat,matrix(x,y,z));
    const localGround=(x:number,z:number)=>{const[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),h=sampleHeight(meta,heights,valid,e,n);if(h===null)throw new Error('Habitatge sense terreny: '+s.id);return h-s.terrain.technicalBaseElevation;};
    const finished=(s.renderState??s.state1794)==='finished'||s.kind==='shared-courtyard',finish=finished?palette.lime[unitIndex%3]:palette.bare;
    const wall=(x:number,z:number,L:number,H:number,T:number,rotation:number,holes:Hole[]=[],offsetY=0)=>{
      const mesh=wallSurfaceMesh(L,H,T,holes,.12),transform=matrix(x,offsetY,z,rotation);
      for(const group of mesh.groups){if(!group.count)continue;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(mesh.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(mesh.normals,3));g.setIndex(mesh.indices.slice(group.start,group.start+group.count));add(g,group.materialIndex===0?finish:palette.stone,transform);}
    };
    const segment=(a:number[],b:number[],H:number,T:number,holes:Hole[]=[],shorten=false)=>{
      const dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);wall((a[0]+b[0])/2+dz/L*T/2,(a[1]+b[1])/2-dx/L*T/2,L-(shorten?2*T:0),H,T,-Math.atan2(dz,dx),holes);
    };
    const roof=(x:number,z:number,w:number,d:number,H:number,rise:number,rotation=0)=>{
      const p=[[-w/2,H,-d/2],[-w/2,H,d/2],[-w/2,H+rise,0],[w/2,H,-d/2],[w/2,H,d/2],[w/2,H+rise,0]];
      const ids=[[0,2,5,0,5,3,1,4,5,1,5,2],[0,1,2,3,5,4],[0,3,4,0,4,1]],mats=[palette.roof,finish,palette.wood];
      ids.forEach((indices,i)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(indices.flatMap(j=>p[j]),3));if(i===0)g.setAttribute('uv',new THREE.Float32BufferAttribute(indices.flatMap(j=>[p[j][0]/1.4,p[j][2]/1.6]),2));g.computeVertexNormals();add(g,mats[i],matrix(x,0,z,rotation));});
      const ridge=new THREE.CylinderGeometry(.10,.10,w,7);ridge.rotateZ(Math.PI/2);add(ridge,palette.roof,matrix(x,H+rise+.015,z,rotation));
      for(const sign of[-1,1])add(new THREE.BoxGeometry(w,.11,.11),palette.wood,matrix(x+Math.sin(rotation)*sign*d/2,H-.015,z+Math.cos(rotation)*sign*d/2,rotation));
    };
    const foundation=(corners:number[][])=>{
      const verts:number[]=[],ids:number[]=[];
      for(let edge=0;edge<corners.length;edge++){
        const a=corners[edge],b=corners[(edge+1)%corners.length],steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));
        for(let i=0;i<steps;i++){
          const sample=(t:number)=>{
            const x=THREE.MathUtils.lerp(a[0],b[0],t),z=THREE.MathUtils.lerp(a[1],b[1],t),[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),h=sampleHeight(meta,heights,valid,e,n);
            if(h===null)throw new Error('Habitatge sense terreny: '+s.id);return{x,z,h:h-s.terrain.technicalBaseElevation};
          };
          const p=sample(i/steps),q=sample((i+1)/steps),j=verts.length/3;
          verts.push(p.x,0,p.z,p.x,p.h,p.z,q.x,q.h,q.z,q.x,0,q.z);ids.push(j,j+1,j+2,j,j+2,j+3);
        }
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ids);g.computeVertexNormals();add(g,palette.technical);
      const floor=new THREE.BufferGeometry();floor.setAttribute('position',new THREE.Float32BufferAttribute(corners.flatMap(p=>[p[0],.005,p[1]]),3));floor.setIndex([0,1,2,0,2,3]);floor.computeVertexNormals();add(floor,finish);
    };
    const shutter=(h:Hole,z:number,door=false,back=false)=>{
      const direction=back?-1:1,x=back?-h.x:h.x,count=door?5:4;for(let j=0;j<count;j++)box(x-h.width*.48+(j+.5)*h.width*.96/count,h.bottom+h.height/2,z-.10*direction,h.width*.96/count-.008,h.height*.97,.055,palette.wood);
      for(const y of[.22,.77])box(x,h.bottom+h.height*y,z-.061*direction,h.width*.85,.065,.035,palette.wood);
      if(door){box(x+h.width*.26,h.bottom+1,z-.052*direction,.045,.15,.055,palette.iron);for(const y of[.25,.78])box(x-h.width*.36,h.bottom+h.height*y,z-.052*direction,.13,.045,.035,palette.iron);}
    };
    const bars=(h:Hole,z:number,back=false)=>{const cx=back?-h.x:h.x,sign=back?-1:1;for(let x=-h.width/2+.12;x<h.width/2;x+=.18)box(cx+x,h.bottom+h.height/2,z+.035*sign,.025,h.height,.035,palette.iron);box(cx,h.bottom+h.height*.5,z+.04*sign,h.width,.025,.04,palette.iron);};
    const balcony=(h:Hole,z:number)=>{
      box(h.x,h.bottom-.055,z+.34,h.width+.3,.09,.62,palette.stone);
      for(let x=-h.width/2-.1;x<=h.width/2+.11;x+=.17)box(h.x+x,h.bottom+.43,z+.62,.025,.86,.025,palette.iron);
      box(h.x,h.bottom+.86,z+.62,h.width+.3,.03,.035,palette.iron);
    };
    if(s.kind==='shared-courtyard'){
      const w=s.width,d=s.depth,t=s.wingDepth!;
      const wing=(x:number,z:number,L:number,D:number,rotation:number,units:number)=>{
        const holes:Hole[]=[];for(let i=0;i<units;i++){const a=-L/2+(i+.5)*L/units;holes.push({x:a,width:1,height:1.9,bottom:0},{x:a,width:.9,height:1.15,bottom:3.5});}
        // The four wings share one technical identifier; they do not become 24 detached houses.
        const local=new THREE.Matrix4().makeRotationY(rotation),transform=(a:number,b:number)=>new THREE.Vector3(a,0,b).applyMatrix4(local).add(new THREE.Vector3(x,0,z));
        const pts=[[-L/2,D/2],[L/2,D/2],[L/2,-D/2],[-L/2,-D/2]].map(p=>{const q=transform(p[0],p[1]);return[q.x,q.z];});foundation(pts);
        const H=s.wallHeight,T=s.wallThickness;
        for(let e=0;e<4;e++)segment(pts[e],pts[(e+1)%4],H,T,e===0?holes:[],e===1||e===3);
        roof(x,z,L,D,H,s.roofRise,rotation);
      };
      wing(0,d/2-t/2,w,t,0,8);wing(0,-d/2+t/2,w,t,Math.PI,8);
      wing(-w/2+t/2,0,d-2*t,t,Math.PI/2,4);wing(w/2-t/2,0,d-2*t,t,-Math.PI/2,4);
    }else{
      const fw=s.frontWidth??s.width,bw=s.backWidth??s.width,fz=s.frontZ??s.depth/2,bz=s.backZ??-s.depth/2,T=s.wallThickness,H=s.group==='royal-portico'?PORXO_STUDY.rearBodyHeight:s.wallHeight;
      const corners=[[-fw/2,fz],[fw/2,fz],[bw/2,bz],[-bw/2,bz]];
      const portico=s.group==='royal-portico'?porticoPlan(s):null;foundation(portico?portico.body:corners);
      const small=s.kind==='small',ground:Hole[]=[{x:-fw*.19,width:small?.9:1.05,height:small?1.95:2.15,bottom:0},{x:fw*.26,width:small?.8:.95,height:small?.9:1.2,bottom:.9}];
      const upper:Hole[]=small?[]:[-1,1].map(sign=>({x:sign*fw*.24,width:.82,height:1.85,bottom:3.4}));
      const attic:Hole[]=small?[]:[-1,1].map(sign=>({x:sign*fw*.23,width:.62,height:.55,bottom:6.65}));
      const unfinished=s.group==='royal-portico';
      if(unfinished){
        const p=portico!;add(groundQuad(p.gallery,localGround),palette.soil);
        house.userData.porxoStudy=PORXO_STUDY;
        detailedPorxo(s,{add,box,ground:localGround,matrix,stone:palette.stone,wood:palette.wood,
          rearWall:p=>wall(0,p.back-T/2,p.rearWidth,H,T,0,[...ground,...upper])});
        for(const sign of[-1,1]){const a=[sign*p.rearWidth/2,p.back],b=[sign*bw/2,bz];segment(sign===1?a:b,sign===1?b:a,H,T,[],true);}
      }else{
        wall(0,fz-T/2,fw,H,T,0,[...ground,...upper,...attic]);
        const terrace=finished&&!small?1.8:0;
        roof(0,(fz+bz+terrace)/2,s.width,fz-bz-terrace+.25,H,s.roofRise);
        if(terrace){box(0,H-.07,bz+terrace/2,s.width,.14,terrace,finish);for(const sign of[-1,1])box(sign*(s.width/2-.1),H+.28,bz+terrace/2,.2,.56,terrace,finish);box(0,H+.28,bz+.1,s.width,.56,.2,finish);}
        ground.forEach((h,i)=>{if(finished)shutter(h,fz,i===0);if(i===1)bars(h,fz);});
        if(finished)upper.forEach(h=>{shutter(h,fz);balcony(h,fz);});else upper.forEach(h=>bars(h,fz));
        attic.forEach(h=>bars(h,fz));
        if(finished&&!small){
          for(const y of[3.25,6.3])box(0,y,fz+.035,fw-.04,.12,.20,palette.stone);
          const cx=fw*.26,cz=bz+terrace+.7,cy=H+s.roofRise*(1-Math.abs(cz-(fz+bz+terrace)/2)/((fz-bz-terrace+.25)/2))+.4;
          box(cx,cy,cz,.48,1.15,.46,finish);box(cx,cy+.60,cz,.60,.12,.58,palette.stone);box(cx,cy+.67,cz,.28,.025,.26,palette.iron);
        }
        segment(corners[1],corners[2],H,T,[],true);segment(corners[3],corners[0],H,T,[],true);
      }
      const rear:Hole[]=[{x:0,width:.9,height:1.95,bottom:0}];
      if(finished){rear.push({x:fw*.30,width:.75,height:.95,bottom:1});if(!small)for(const sign of[-1,1])rear.push({x:sign*fw*.25,width:.75,height:1.1,bottom:4.2});}
      segment(corners[2],corners[3],H,T,rear);
      if(finished)rear.forEach((h,i)=>{shutter(h,bz,i===0,true);if(i)bars(h,bz,true);});
      if(finished&&!small){
        const yard=yardPlan(s)!;add(groundQuad(yard.corners,localGround),palette.soil);
        for(const p of yard.walls){const length=Math.max(p.w,p.d),count=Math.ceil(length);for(let i=0;i<count;i++){const delta=-length/2+(i+.5)*length/count,x=p.x+(p.w>p.d?delta:0),z=p.z+(p.d>p.w?delta:0),ground=localGround(x,z);box(x,ground+.55,z,p.w>p.d?length/count:p.w,1.1,p.d>p.w?length/count:p.d,finish);}}
        // Open yard gate; its size and side are an explicitly generic C detail.
        const gate=new THREE.BoxGeometry(.08,.9,.85);add(gate,palette.wood,matrix(yard.gate/2,localGround(yard.gate/2,bz-yard.depth)+.48,bz-yard.depth+.45));
      }
    }
    for(const[material,geometries]of batches){const merged=mergeGeometries(geometries,false);if(!merged)throw new Error('No es pot generar l’habitatge: '+s.id);house.add(new THREE.Mesh(merged,material));geometries.forEach(g=>g.dispose());}
    if(s.group==='royal-portico'){
      const study=new THREE.Group(),photo=new THREE.Group();study.name='Porxo · obra oberta de 1794';photo.name='Porxo i façana · comparació N030';
      for(const mesh of [...house.children]){study.add(mesh);if((mesh as THREE.Mesh).material!==palette.wood)photo.add(mesh.clone());}
      photo.add(makePlacaFacade(s));photo.visible=false;house.add(study,photo);house.userData.photoComparison={study,photo};
    }
    root.add(house);
  }
  return root;
}
