import * as THREE from 'three';
import { wallSurfaceMesh, planToUTM, effectiveStudyParameters } from './building-plan.mjs';
import { sampleHeight, toWorld } from './geo.mjs';
import type { Terrain } from './terrain';

export type StudyConfig={
  name:string;anchor:{easting:number;northing:number;accuracyMeters:number};
  orientation:{frontAzimuthDegrees:number;accuracyDegrees:number};
  documented:{publishedSideMeters:number;wallHeightMeters:null;wallThicknessMeters:null;centralRoofBuilt:false};
  footprintObservation:{cornersUTM:number[][];sideLengthsMeters:number[]};
  preview:{sideMeters:number;wallHeightMeters:number;wallThicknessMeters:number;centralRadiusMeters:number;crossArmWidthMeters:number;corridorWidthMeters:number;partitionHeightMeters:number;doorWidthMeters:number;doorHeightMeters:number;windowWidthMeters:number;windowHeightMeters:number;columnRadiusMeters:number;columnHeightRatio:number;columnOffsetsMeters:number[]};
  terrain:{provisionalBaseElevation:number;minimumUnderFootprint:number;maximumUnderFootprint:number;centerElevation:number;historicalElevation:null};
  sources:{id:string;title:string;url?:string;use:string}[];
};
type Opening={x:number;width:number;height:number;bottom:number};

export function makeEsglesia(config:StudyConfig,meta:Terrain,heights:Float32Array,valid:Uint8Array) {
  const root=new THREE.Group();root.name='ESG-001 · estudi C';
  const base=config.terrain.provisionalBaseElevation;
  root.position.fromArray(toWorld(config.anchor.easting,config.anchor.northing,base,meta.origin));
  root.rotation.y=THREE.MathUtils.degToRad(180-config.orientation.frontAzimuthDegrees);
  const massing=new THREE.Group(),front=new THREE.Group(),interior=new THREE.Group(),support=new THREE.Group();
  root.add(massing);massing.add(front,interior,support);
  const materials={
    masonry:new THREE.MeshStandardMaterial({color:'#87633d',roughness:1}),
    stone:new THREE.MeshStandardMaterial({color:'#ded1b2',roughness:.95}),
    inner:new THREE.MeshStandardMaterial({color:'#bda581',roughness:1,side:THREE.DoubleSide}),
    technical:new THREE.MeshStandardMaterial({color:'#b1b5a4',roughness:1,side:THREE.DoubleSide}),
    floor:new THREE.MeshStandardMaterial({color:'#c9bda0',roughness:1})
  };
  let runtimeGeometry:THREE.BufferGeometry[]=[];
  const box=(parent:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,material:THREE.Material)=>{
    const geometry=new THREE.BoxGeometry(w,h,d);runtimeGeometry.push(geometry);
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);parent.add(mesh);return mesh;
  };
  const wall=(parent:THREE.Group,x:number,z:number,length:number,height:number,thickness:number,rotation:number,openings:Opening[]=[])=>{
    const group=new THREE.Group();group.position.set(x,0,z);group.rotation.y=rotation;parent.add(group);
    // Frame and reveal are material regions of the same shell, never overlapping boxes.
    const surface=wallSurfaceMesh(length,height,thickness,openings);
    const geometry=new THREE.BufferGeometry();runtimeGeometry.push(geometry);
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(surface.positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(surface.normals,3));
    geometry.setIndex(surface.indices);
    for(const g of surface.groups)if(g.count)geometry.addGroup(g.start,g.count,g.materialIndex);
    group.add(new THREE.Mesh(geometry,[materials.masonry,materials.stone]));
    return group;
  };
  const half=config.preview.sideMeters/2;
  // Technical support follows current MDT at the perimeter. It never edits raster heights.
  const supportPositions:number[]=[],supportIndices:number[]=[];
  const perimeter:number[][]=[];
  for(let edge=0;edge<4;edge++)for(let i=0;i<24;i++){
    const t=i/24;
    const p=edge===0?[-half+2*half*t,-half]:edge===1?[half,-half+2*half*t]:edge===2?[half-2*half*t,half]:[-half,half-2*half*t];
    perimeter.push(p);
  }
  perimeter.forEach(([x,z],i)=>{
    const [e,n]=planToUTM(x,z,config.anchor,config.orientation.frontAzimuthDegrees);
    const ground=sampleHeight(meta,heights,valid,e,n);
    if(ground===null)throw new Error('Technical support intersects NoData');
    supportPositions.push(x,-.06,z,x,ground-base,z);
    const a=i*2,b=((i+1)%perimeter.length)*2;supportIndices.push(a,a+1,b,b,a+1,b+1);
  });
  const foundation=new THREE.BufferGeometry();foundation.setAttribute('position',new THREE.Float32BufferAttribute(supportPositions,3));foundation.setIndex(supportIndices);foundation.computeVertexNormals();support.add(new THREE.Mesh(foundation,materials.technical));
  const floorGeometry=new THREE.BoxGeometry(half*2,.12,half*2);const floor=new THREE.Mesh(floorGeometry,materials.floor);floor.position.y=-.06;support.add(floor);
  const observedPoints=config.footprintObservation.cornersUTM.map(([e,n])=>{
    const h=sampleHeight(meta,heights,valid,e,n);if(h===null)throw new Error('Observed outline intersects NoData');return new THREE.Vector3(...toWorld(e,n,h+.09,meta.origin));
  });observedPoints.push(observedPoints[0]);
  const observed=new THREE.Line(new THREE.BufferGeometry().setFromPoints(observedPoints),new THREE.LineBasicMaterial({color:'#376454',depthTest:true}));observed.name='Fábrica actual · traza aproximada ICGC';observed.renderOrder=4;
  function rebuild(wallHeight:number) {
    const p=effectiveStudyParameters(config,wallHeight),H=p.wallHeightMeters,T=p.wallThicknessMeters;
    for(const group of [front,interior])group.clear();
    // Dispose previous study meshes without touching the permanent technical support.
    for(const g of runtimeGeometry)g.dispose();runtimeGeometry=[];
    const old=massing.children.filter(c=>c!==front&&c!==interior&&c!==support);old.forEach(c=>massing.remove(c));
    const outer=new THREE.Group();massing.add(outer);
    const door={x:0,width:p.doorWidthMeters,height:p.doorHeightMeters,bottom:0};
    const facadeHoles:Opening[]=[door];
    for(const x of[-9,9])for(const bottom of[1.25,5.6])if(bottom+p.windowHeightMeters<H)facadeHoles.push({x,width:p.windowWidthMeters,height:p.windowHeightMeters,bottom});
    wall(front,0,half-T/2,half*2,H,T,0,facadeHoles);
    // Detalls llegits a N075, N077 i N080: sòcol de pedra, portal amb arc i muntants, i finestres amb cornisa i ampit.
    box(front,0,.5,half+.06,half*2+.3,1,.2,materials.stone);
    {
      const dw=p.doorWidthMeters,dh=p.doorHeightMeters,ro=dw/2+.5,ri=dw/2;
      const ring=new THREE.Shape();ring.moveTo(-ro,0);ring.absarc(0,0,ro,Math.PI,0,true);ring.lineTo(ri,0);ring.absarc(0,0,ri,0,Math.PI,false);ring.lineTo(-ro,0);
      const g=new THREE.ExtrudeGeometry(ring,{depth:.28,bevelEnabled:false});runtimeGeometry.push(g);
      const arc=new THREE.Mesh(g,materials.stone);arc.position.set(0,dh,half+.01);front.add(arc);
      for(const sign of[-1,1]){box(front,sign*(ri+.25),dh/2,half+.14,.5,dh,.28,materials.stone);box(front,sign*(ri+.25),dh+.05,half+.14,.74,.2,.34,materials.stone);}
      box(front,0,dh+ro+.12,half+.14,ro*2+.2,.2,.3,materials.stone);
    }
    for(const x of[-9,9])for(const bottom of[1.25,5.6])if(bottom+p.windowHeightMeters<H){
      box(front,x,bottom+p.windowHeightMeters+.14,half+.1,p.windowWidthMeters+.8,.26,.3,materials.stone);
      box(front,x,bottom-.08,half+.09,p.windowWidthMeters+.55,.14,.28,materials.stone);
    }
    wall(outer,0,-half+T/2,half*2,H*.86,T,0,[door,...[-7.5,7.5].map(x=>({x,width:1.4,height:1.8,bottom:1.4}))]);
    for(const sign of[-1,1])wall(outer,sign*(half-T/2),0,half*2,H*.86,T,Math.PI/2,[door,...[-7.5,7.5].map(x=>({x,width:1.4,height:1.8,bottom:1.4}))]);
    // Quoins are simplified bands, without pretending a surveyed stone-by-stone restitution.
    for(const x of[-1,1])for(const z of[-1,1])box(z===1?front:outer,x*(half-T/2),H/2,z*(half-T/2),T+.1,H,T+.1,materials.stone);
    const colHeight=H*p.columnHeightRatio;
    for(const x of p.columnOffsetsMeters){
      const column=new THREE.Group();column.position.set(x,0,half+.12);front.add(column);
      box(column,0,.18,0,1.12,.36,1.05,materials.stone);
      const g=new THREE.CylinderGeometry(p.columnRadiusMeters*.86,p.columnRadiusMeters,colHeight-.9,20);runtimeGeometry.push(g);
      const shaft=new THREE.Mesh(g,materials.stone);shaft.position.y=.4+(colHeight-.9)/2;column.add(shaft);
      box(column,0,colHeight-.32,0,1.02,.22,.86,materials.stone);
      for(const sign of[-1,1]){
        const tg=new THREE.TorusGeometry(.19,.065,6,16);runtimeGeometry.push(tg);const volute=new THREE.Mesh(tg,materials.stone);volute.position.set(sign*.37,colHeight-.43,.4);column.add(volute);
      }
      box(column,0,colHeight-.12,0,1.2,.16,.98,materials.stone);
    }
    const r=p.centralRadiusMeters,arm=p.crossArmWidthMeters/2,edge=half-p.corridorWidthMeters;
    const transition=Math.sqrt(r*r-arm*arm),partitionHeight=Math.min(p.partitionHeightMeters,H*.8);
    for(const sx of[-1,1])for(const sz of[-1,1]){
      const length=edge-transition;
      wall(interior,sx*arm,sz*(transition+length/2),length,partitionHeight,.55,Math.PI/2);
      wall(interior,sx*(transition+length/2),sz*arm,length,partitionHeight,.55,0);
      const start=Math.asin(arm/r),end=Math.acos(arm/r),verts:number[]=[],ids:number[]=[];
      for(let i=0;i<=16;i++){
        const angle=start+(end-start)*i/16;
        for(const rad of[r,r+.55])for(const y of[0,partitionHeight])verts.push(sx*rad*Math.cos(angle),y,sz*rad*Math.sin(angle));
        if(i<16){const a=i*4,b=a+4;ids.push(a,a+1,b,b,a+1,b+1,a+2,b+2,a+3,b+2,b+3,a+3,a+1,a+3,b+1,b+1,a+3,b+3);}
      }
      const g=new THREE.BufferGeometry();runtimeGeometry.push(g);g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(ids);g.computeVertexNormals();interior.add(new THREE.Mesh(g,materials.inner));
    }
    for(const sign of[-1,1]){
      const openings=[-6,0,6].map(x=>({x,width:1.45,height:2.7,bottom:0}));
      wall(interior,sign*edge,0,edge*2,partitionHeight,.55,Math.PI/2,openings);
      wall(interior,0,sign*edge,edge*2,partitionHeight,.55,0,openings);
    }
  }
  rebuild(config.preview.wallHeightMeters);
  return {root,massing,front,interior,support,observed,rebuild};
}
