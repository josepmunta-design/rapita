import * as THREE from 'three';
import {toWorld} from './geo.mjs';
import {environmentPlan} from './environment-plan.mjs';
import {surfaceMaterial} from './vernacular.ts';
import {groundRealism,terraNoiseGLSL,groundColorGLSL,groundPlateGLSL,groundNormalGLSL} from './visual-ground.ts';
import type {Terrain} from './terrain';

/** World-space colour grain; does not displace vertices or alter measured elevations. */
export function groundDetail(material:THREE.MeshStandardMaterial){
 const strength={value:1},realism={value:0};
 const before=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  before.call(material,shader,renderer);
  shader.uniforms.groundDetailStrength=strength;shader.uniforms.groundRealismStrength=realism;shader.uniforms.groundTime=groundRealism.time;shader.uniforms.groundWaterLevel=groundRealism.waterLevel;
  shader.vertexShader='attribute vec3 smoothNormal;uniform float groundRealismStrength;varying vec3 vGroundW;varying vec3 vGroundN;\n'+shader.vertexShader;
  // Faceted interpreted terrain carries an averaged normal for the realistic style only.
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\nif(groundRealismStrength>.5&&dot(smoothNormal,smoothNormal)>.25)objectNormal=smoothNormal;\nvGroundN=normalize(mat3(modelMatrix)*objectNormal);');
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvGroundW=(modelMatrix*vec4(position,1.0)).xyz;');
  shader.fragmentShader=`varying vec3 vGroundW;varying vec3 vGroundN;uniform float groundDetailStrength;uniform float groundRealismStrength;uniform float groundTime;uniform float groundWaterLevel;
  float groundHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float groundNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(groundHash(i),groundHash(i+vec2(1,0)),f.x),mix(groundHash(i+vec2(0,1)),groundHash(i+vec2(1,1)),f.x),f.y);}
  ${terraNoiseGLSL}
  `+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 vGroundXZ=vGroundW.xz;
   float grainFade=1.0-smoothstep(.06,.32,length(fwidth(vGroundXZ)));
   if(groundRealismStrength<.5){
    float groundTone=.86+.20*groundNoise(vGroundXZ*.13)+.09*groundNoise(vGroundXZ*1.2)+grainFade*.05*(groundNoise(vGroundXZ*7.0)-.5);
    diffuseColor.rgb*=mix(1.0,groundTone,groundDetailStrength);
   }
   ${groundColorGLSL}
   ${groundPlateGLSL}`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
   ${groundNormalGLSL}`);
 };
 material.customProgramCacheKey=()=>key+'-rapita-ground-detail-4';material.needsUpdate=true;
 // `enabled` is the documentary grain of the «Detall de l’entorn» layer; `style` is 0 documentary, 1 realistic, 2 plate.
 return(enabled:boolean,style:boolean|number=0)=>{strength.value=enabled?1:0;realism.value=Number(style);};
}

export function makeEnvironment(urban:any,littoral:any,housing:any,center:any,meta:Terrain,sample:(e:number,n:number)=>number|null){
 const root=new THREE.Group(),plants=new THREE.Group(),docks=new THREE.Group(),courtyards=new THREE.Group();root.name='Detall d’entorn · recreació genèrica C';root.add(plants,docks,courtyards);
 const plan=environmentPlan(urban,littoral,housing,center,sample);root.userData.plan=plan;
 const green=new THREE.MeshStandardMaterial({color:'#7b8250',roughness:1}),dry=new THREE.MeshStandardMaterial({color:'#929063',roughness:1}),stone=new THREE.MeshStandardMaterial({color:'#aaa085',roughness:1}),clay=new THREE.MeshStandardMaterial({color:'#a46e45',roughness:1}),wood=surfaceMaterial('wood','#c7b198','wood',.015),iron=new THREE.MeshStandardMaterial({color:'#484a3b',roughness:.9}),rope=new THREE.MeshStandardMaterial({color:'#a28d60',roughness:1});
 const instances=(g:THREE.BufferGeometry,m:THREE.Material,points:any[],parent:THREE.Group,scale:THREE.Vector3,up=0)=>{const mesh=new THREE.InstancedMesh(g,m,points.length);for(const[i,p]of points.entries()){const world=new THREE.Vector3(...toWorld(p.e,p.n,p.height+up*p.scale,meta.origin)),matrix=new THREE.Matrix4().compose(world,new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),p.angle),scale.clone().multiplyScalar(p.scale));mesh.setMatrixAt(i,matrix);}mesh.instanceMatrix.needsUpdate=true;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 instances(new THREE.DodecahedronGeometry(1,0),green,plan.shrubs.filter((_:any,i:number)=>i%2===0),plants,new THREE.Vector3(.7,.37,.55),.32);
 instances(new THREE.DodecahedronGeometry(1,0),dry,plan.shrubs.filter((_:any,i:number)=>i%2===1),plants,new THREE.Vector3(.6,.32,.7),.28);
 instances(new THREE.DodecahedronGeometry(1,0),stone,plan.stones,plants,new THREE.Vector3(1,.48,.7),.16);
 const pot=new THREE.LatheGeometry([[.12,0],[.19,.05],[.23,.24],[.17,.38],[.13,.4],[.13,.44],[.10,.44],[.10,.39],[.14,.36],[.19,.24],[.15,.07],[.12,.05]].map(p=>new THREE.Vector2(...p)),10);
 instances(pot,clay,plan.pots,courtyards,new THREE.Vector3(1,1,1));
 const box=(parent:THREE.Group,x:number,y:number,z:number,w:number,h:number,d:number,m=wood)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
 const dockProp=(e:number,n:number)=>{const g=new THREE.Group();g.position.fromArray(toWorld(e,n,1.3,meta.origin));docks.add(g);return g;};
 const dockPoints=littoral.portWorks?.dockProps??[[296499,4499185.2],[296506,4499185.2],[296544,4499185.1],[296492,4499185.15]];
 for(const[e,n]of dockPoints.slice(0,3)){
  const g=dockProp(e,n),barrel=new THREE.Mesh(new THREE.LatheGeometry([[.23,0],[.26,.06],[.30,.35],[.26,.67],[.23,.72]].map(p=>new THREE.Vector2(...p)),12),wood);barrel.castShadow=true;g.add(barrel);
  for(const y of[.10,.6]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(.28,.024,4,12),iron);hoop.rotation.x=Math.PI/2;hoop.position.y=y;g.add(hoop);}
  const lid=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.035,12),wood);lid.position.y=.72;g.add(lid);
  for(let i=0;i<5;i++){const coil=new THREE.Mesh(new THREE.TorusGeometry(.18+i*.04,.018,4,24),rope);coil.rotation.x=Math.PI/2;coil.position.set(.8,.04,.1);g.add(coil);}
  for(let row=0;row<4;row++)for(const sign of[-1,1])box(g,-.8,.10+row*.14,sign*.27,.65,.10,.04);
  box(g,-.8,.06,0,.65,.08,.58);for(const sign of[-1,1])box(g,-.8+sign*.29,.3,0,.04,.55,.58);
 }
 const net=dockProp(...dockPoints[3] as[number,number]),lines:number[]=[];
 for(let i=0;i<=18;i++)lines.push(i*.22,.035,-.45,i*.22,.035,.45);
 for(let i=0;i<=5;i++)lines.push(0,.035,-.45+i*.18,3.96,.035,-.45+i*.18);
 const ng=new THREE.BufferGeometry();ng.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));net.add(new THREE.LineSegments(ng,new THREE.LineBasicMaterial({color:'#746b4a'})));
 return{root,plants,docks,courtyards,plan};
}
