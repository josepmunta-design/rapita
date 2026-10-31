import * as THREE from 'three';
import {toWorld} from './geo.mjs';
import type {Terrain} from './terrain';
export function makeBoats(data:any,meta:Terrain){
  const root=new THREE.Group();root.name='Embarcacions mediterrànies · tipologia C';
  const wood=new THREE.MeshStandardMaterial({color:'#684c32',roughness:1,side:THREE.DoubleSide}),inside=new THREE.MeshStandardMaterial({color:'#a08053',roughness:1}),dark=new THREE.MeshStandardMaterial({color:'#253e39',roughness:1});
  const sail=new THREE.MeshStandardMaterial({color:'#e8ddba',roughness:1,side:THREE.DoubleSide});
  const lineMat=new THREE.LineBasicMaterial({color:'#685c45'});
  const beam=(group:THREE.Group,a:THREE.Vector3,b:THREE.Vector3,r:number,mat:THREE.Material)=>{const v=b.clone().sub(a),m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),7),mat);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());group.add(m);};
  for(const b of data.boats){
    const group=new THREE.Group();group.name=b.kind==='bot'?'Bot de rem · C':b.kind==='cabotatge'?'Barca de cabotatge · C':'Llagut de vela llatina · C';group.userData.boatId=b.id;
    group.position.fromArray(toWorld(...b.anchor,data.studyWaterElevation,meta.origin));group.rotation.y=b.heading*Math.PI/180;root.add(group);
    const L=b.length,B=b.beam,H=L*.15,p:number[]=[],ids:number[]=[],rows=25,cols=13;
    for(let i=0;i<rows;i++){
      const t=i/(rows-1),z=(t-.5)*L,w=Math.pow(Math.sin(Math.PI*t),.62)*B/2;
      for(let j=0;j<cols;j++){const a=-Math.PI/2+j*Math.PI/(cols-1);p.push(w*Math.sin(a),-.48*H+H*(1-Math.cos(a))+.11*H*Math.abs(2*t-1),z);}
    }
    for(let i=0;i<rows-1;i++)for(let j=0;j<cols-1;j++){const a=i*cols+j;ids.push(a,a+cols,a+1,a+1,a+cols,a+cols+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setIndex(ids);g.computeVertexNormals();group.add(new THREE.Mesh(g,wood));
    const addBox=(x:number,y:number,z:number,w:number,h:number,d:number,mat=inside)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);group.add(m);};
    // Open hull, seats and separate gunwales; no modern engine or cabin.
    for(const z of[-.28,-.06,.18])addBox(0,H*.3,z*L,B*.77,.10,L*.07);
    for(const sign of[-1,1]){const rail=[];for(let i=0;i<rows;i++)rail.push(new THREE.Vector3(sign*Math.pow(Math.sin(Math.PI*i/(rows-1)),.62)*B/2,H*.52+.11*H*Math.abs(2*i/(rows-1)-1),(i/(rows-1)-.5)*L));group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(rail),lineMat));}
    if(b.kind!=='bot'){
      const mastHeight=L*.83,mastZ=-L*.08;beam(group,new THREE.Vector3(0,-.1,mastZ),new THREE.Vector3(0,mastHeight,mastZ),L*.015,wood);
      const low=new THREE.Vector3(-.10,mastHeight*.22,-L*.42),high=new THREE.Vector3(.15,mastHeight*1.14,L*.43);beam(group,low,high,L*.012,wood);
      if(b.sail){const foot=new THREE.Vector3(.32,H*.7,L*.4),sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute([...low.toArray(),...high.toArray(),...foot.toArray()],3));sg.computeVertexNormals();group.add(new THREE.Mesh(sg,sail));
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([low,foot,high]),lineMat));
        for(let j=1;j<=5;j++){const t=j/6,a=low.clone().lerp(high,t),c=low.clone().lerp(foot,t);group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([a,c]),new THREE.LineBasicMaterial({color:'#c4b99a',transparent:true,opacity:.6})));}
      }else beam(group,low,high,L*.026,sail);
      for(const sign of[-1,1])group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(sign*B*.45,H*.4,L*.2),new THREE.Vector3(0,mastHeight*.85,mastZ)]),lineMat));
    }else for(const sign of[-1,1])beam(group,new THREE.Vector3(sign*B*.2,H*.4,0),new THREE.Vector3(sign*B*1.1,-.10,-L*.25),.035,wood);
    // A small transom rudder is a period-compatible generic detail.
    addBox(0,0,-L*.47,.09,H*.75,.3,dark);
  }
  return root;
}
