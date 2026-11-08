import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {wallSurfaceMesh,planToUTM} from './building-plan.mjs';
import {entityAt} from './chronology.mjs';
import {toWorld,sampleHeight} from './geo.mjs';
import type {Terrain} from './terrain';
export type LandmarkData={sites:any[];sources:any[]};

/** A single concave shell: the arch opening reaches the ground, with no overlapping jamb boxes. */
export function archPanel(span:number,height:number,opening:number,spring:number,thickness:number){
  const r=opening/2,s=new THREE.Shape();s.moveTo(-span/2,0);s.lineTo(-span/2,height);s.lineTo(span/2,height);s.lineTo(span/2,0);s.lineTo(r,0);s.lineTo(r,spring);
  for(let i=0;i<=24;i++){const a=i*Math.PI/24;s.lineTo(r*Math.cos(a),spring+r*Math.sin(a));}s.lineTo(-r,0);s.closePath();
  const g=new THREE.ExtrudeGeometry(s,{depth:thickness,bevelEnabled:false});g.translate(0,0,-thickness/2);return g;
}
export function makeLandmarks(data:LandmarkData,meta:Terrain,h:Float32Array,v:Uint8Array,chronology:any){
  const root=new THREE.Group(),groups=new Map<string,THREE.Group>();root.name='Glorieta i Guardiola · models d’estudi';
  const stone=new THREE.MeshStandardMaterial({color:'#a99c7d',roughness:1}),lime=new THREE.MeshStandardMaterial({color:'#c7b99b',roughness:1}),brick=new THREE.MeshStandardMaterial({color:'#a67f5d',roughness:1}),support=new THREE.MeshStandardMaterial({color:'#a4a591',roughness:1,side:THREE.DoubleSide});
  for(const [name,mat]of Object.entries({stone,lime,brick,support}))mat.name=name;
  for(const site of data.sites){
    const group=new THREE.Group();group.name=site.name;group.userData.landmarkId=site.id;group.position.fromArray(toWorld(site.anchor.easting,site.anchor.northing,site.terrain.technicalBaseElevation,meta.origin));group.rotation.y=(180-site.frontAzimuthDegrees)*Math.PI/180;root.add(group);groups.set(site.id,group);
    const batches=new Map<THREE.Material,THREE.BufferGeometry[]>();
    const emit=(source:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0,angle=0)=>{const g=source.index?source.toNonIndexed():source;if(g!==source)source.dispose();g.rotateY(angle);g.translate(x,y,z);if(!g.getAttribute('normal'))g.computeVertexNormals();g.deleteAttribute('uv');const list=batches.get(mat)??[];list.push(g);batches.set(mat,list);};
    const box=(x:number,y:number,z:number,w:number,H:number,d:number,mat=stone)=>emit(new THREE.BoxGeometry(w,H,d),mat,x,y,z);
    const wall=(x:number,y:number,z:number,w:number,H:number,T:number,angle=0,holes:any[]=[],mat=stone)=>{const s=wallSurfaceMesh(w,H,T,holes,.12),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(s.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(s.normals,3));g.setIndex(s.indices);emit(g,mat,x,y,z,angle);};
    const skirt=(outline:number[][])=>{
      const p:number[]=[];
      for(let i=0;i<outline.length;i++){const a=outline[i],b=outline[(i+1)%outline.length],count=Math.max(1,Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])));
        for(let j=0;j<count;j++){const points=[];for(const t of[j/count,(j+1)/count]){const x=THREE.MathUtils.lerp(a[0],b[0],t),z=THREE.MathUtils.lerp(a[1],b[1],t),[e,n]=planToUTM(x,z,site.anchor,site.frontAzimuthDegrees),raw=sampleHeight(meta,h,v,e,n);if(raw===null)throw Error('Landmark support without measured terrain');points.push([x,0,z],[x,raw-site.terrain.technicalBaseElevation-.05,z]);}for(const k of[0,1,2,2,1,3])p.push(...points[k]);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.computeVertexNormals();emit(g,support);
    };
    if(site.kind==='pavilion'){
      const R=site.radius,H=site.wallHeight,T=site.wallThickness,segments=12,half=Math.PI/segments,span=2*R*Math.sin(half),apo=R*Math.cos(half),floor=new THREE.Shape();
      for(let i=0;i<48;i++){const a=i*Math.PI/24,x=R*Math.sin(a),z=R*Math.cos(a);i?floor.lineTo(x,-z):floor.moveTo(x,-z);}floor.closePath();const fg=new THREE.ShapeGeometry(floor);fg.rotateX(-Math.PI/2);emit(fg,stone,0,.005,0);
      const outline=Array.from({length:48},(_,i)=>[R*Math.sin(i*Math.PI/24),R*Math.cos(i*Math.PI/24)]);skirt(outline);
      for(let i=0;i<segments;i++){
        if(i===6)continue; // Connection to the unroofed rectangular annex.
        const a=i*Math.PI*2/segments,x=(apo-T/2)*Math.sin(a),z=(apo-T/2)*Math.cos(a),arch=i===0||i===2||i===10;
        if(arch){const opening=i===0?1.65:1.35,g=archPanel(span,H,opening,2.1,T);const mesh=new THREE.Mesh(g,brick);mesh.position.set(x,0,z);mesh.rotation.y=a;mesh.userData.archId=i;group.add(mesh);
          for(const sign of[-1,1]){const px=sign*(opening/2+.14),pz=T/2+.12,cx=x+px*Math.cos(a)+pz*Math.sin(a),cz=z-px*Math.sin(a)+pz*Math.cos(a);emit(new THREE.CylinderGeometry(.15,.19,3.8,10),lime,cx,1.9,cz);box(cx,.13,cz,.43,.26,.43,lime);box(cx,3.78,cz,.43,.18,.43,lime);}
        }else wall(x,0,z,span,H,T,a,[],stone);
      }
      // An annular architrave leaves the entire centre open: no dome or roof.
      const band=new THREE.Shape(),hole=new THREE.Path();band.absarc(0,0,R,0,Math.PI*2,false);hole.absarc(0,0,R-T,0,Math.PI*2,true);band.holes.push(hole);const bg=new THREE.ExtrudeGeometry(band,{depth:.2,bevelEnabled:false});bg.rotateX(-Math.PI/2);emit(bg,lime,0,H,0);
      const w=site.annexWidth,d=site.annexDepth,z0=-R+.7-d/2;wall(0,0,z0-d/2+T/2,w,H,T,0,[],stone);for(const sign of[-1,1])wall(sign*(w/2-T/2),0,z0,d-T,H,T,Math.PI/2,[],stone);
      box(0,.025,z0,w,.05,d,stone);skirt([[-w/2,z0+d/2],[w/2,z0+d/2],[w/2,z0-d/2],[-w/2,z0-d/2]]);
    }else{
      const w=site.width,d=site.depth,T=site.wallThickness,base=site.batteredHeight,H=site.wallHeight-base;
      if(site.id==='torre-moro'){const g=new THREE.BoxGeometry(1,1,1),p=g.getAttribute('position');for(let i=0;i<p.count;i++){const top=p.getY(i)>0;p.setXYZ(i,p.getX(i)*(top?w:site.baseWidth),(p.getY(i)+.5)*base,p.getZ(i)*(top?d:site.baseDepth));}g.computeVertexNormals();emit(g,stone);}else{const g=new THREE.CylinderGeometry(w/Math.SQRT2,site.baseWidth/Math.SQRT2,base,4,1);g.rotateY(Math.PI/4);emit(g,stone,0,base/2,0);}
      wall(0,base,d/2-T/2,w,H,T,0,[{x:0,width:.9,height:1.6,bottom:1.1}],stone);wall(0,base,-d/2+T/2,w,H,T,Math.PI,[],stone);
      for(const sign of[-1,1])wall(sign*(w/2-T/2),base,0,d-2*T,H,T,Math.PI/2,[{x:0,width:.25,height:.9,bottom:2.6}],stone);
      skirt([[-site.baseWidth/2,site.baseWidth/2],[site.baseWidth/2,site.baseWidth/2],[site.baseWidth/2,-site.baseWidth/2],[-site.baseWidth/2,-site.baseWidth/2]]);
      if(site.crownStudy){
        const top=site.wallHeight;box(0,top-.06,0,w-.9,.12,d-.9,stone);
        for(const sign of [-1,1]){box(0,top+.2,sign*(d/2-T/2),w,.4,T,stone);box(sign*(w/2-T/2),top+.2,0,T,.4,d,stone);}
        for(const sign of [-1,1])for(let i=0;i<4;i++){const x=-w/2+.48+i*(w-.96)/3;box(x,top+.76,sign*(d/2-T/2),.75,.75,T,stone);}
        for(const sign of [-1,1])for(let i=1;i<3;i++)box(sign*(w/2-T/2),top+.76,-d/2+.5+i*(d-1)/3,T,.75,.7,stone);
        for(const [x,z,r] of [[w*.28,d/2+.32,0],[w/2+.32,-d*.25,Math.PI/2]]){wall(x,top-1.2,z,.95,.95,.55,r,[{x:0,width:.3,height:.5,bottom:.12}],stone);for(const dx of [-.3,.3])box(x+dx*Math.cos(r),top-1.45,z-dx*Math.sin(r),.18,.55,.65,stone);}
        for(let y=base+.2;y<top-.4;y+=.5)for(const x of [-w/2+.16,w/2-.16])for(const z of [-d/2+.16,d/2-.16])box(x,y,z,.38,.28,.38,lime);
      }
    }
    for(const[mat,list]of batches){const g=mergeGeometries(list,false);if(!g)throw Error('Invalid landmark batch');group.add(new THREE.Mesh(g,mat));for(const old of list)old.dispose();}
  }
  const setYear=(year:number)=>{for(const site of data.sites)groups.get(site.id)!.visible=entityAt(chronology,site.id,year).visible;};setYear(1800);return{root,groups,setYear};
}
