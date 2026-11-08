import * as THREE from 'three';
import {routeStations,nearestRoute} from './littoral-plan.mjs';
import {toWorld} from './geo.mjs';
import {surfaceMaterial} from './vernacular.ts';

/** A battered masonry wall supporting the higher, right-hand side of each traced line. */
export function makeRetainingWall(s:any,origin:any,sample:(e:number,n:number)=>number|null){
 const root=new THREE.Group(),body:number[]=[],coping:number[]=[],bodyUV:number[]=[],capUV:number[]=[],profiles:any[]=[];
 root.name='Paredó de sosteniment · traça 24';
 const level=(e:number,n:number)=>{const h=sample(e,n);if(h===null||!Number.isFinite(h))throw Error('Mur 24 fora del terreny vàlid');return h;};
 const quad=(target:number[],uv:number[],a:number[],b:number[],c:number[],d:number[],coords:number[][])=>{for(const i of[0,1,2,0,2,3]){target.push(...[a,b,c,d][i]);uv.push(...coords[i]);}};
 for(const line of s.retainingLinesUTM){
  const profile=routeStations(line,1.1).map(st=>{
   const right=[st.dy,-st.dx],ground=level(st.e,st.n),inside=Math.max(ground,level(st.e+right[0]*2.5,st.n+right[1]*2.5)),outside=level(st.e-right[0]*1.5,st.n-right[1]*1.5),access=(s.accessRoutes??[]).some((r:any)=>nearestRoute(st.e,st.n,r.points).distance<r.width/2+s.baseWidth/2+1.3),top=access?ground+.06:inside+.6,bottom=Math.min(ground-.35,outside-.35,top-1.4);
   const point=(side:number,width:number,y:number)=>toWorld(st.e+right[0]*side*width/2,st.n+right[1]*side*width/2,y,origin);
   return{...st,top,bottom,base:[point(-1,s.baseWidth,bottom),point(1,s.baseWidth,bottom)],edge:[point(-1,s.thickness,top-.18),point(1,s.thickness,top-.18)],cap0:[point(-1,s.thickness+.18,top-.18),point(1,s.thickness+.18,top-.18)],cap1:[point(-1,s.thickness+.18,top+.02),point(1,s.thickness+.18,top+.02)]};
  });profiles.push(profile.map(({e,n,top,bottom})=>({e,n,top,bottom})));
  for(let i=0;i<profile.length-1;i++){
   const a=profile[i],b=profile[i+1],u=a.along/2,U=b.along/2;
   quad(body,bodyUV,a.base[0],b.base[0],b.edge[0],a.edge[0],[[u,a.bottom/2],[U,b.bottom/2],[U,(b.top-.18)/2],[u,(a.top-.18)/2]]);
   quad(body,bodyUV,a.base[1],a.edge[1],b.edge[1],b.base[1],[[u,a.bottom/2],[u,(a.top-.18)/2],[U,(b.top-.18)/2],[U,b.bottom/2]]);
   quad(body,bodyUV,a.edge[0],b.edge[0],b.edge[1],a.edge[1],[[u,0],[U,0],[U,1],[u,1]]);
   quad(body,bodyUV,a.base[0],a.base[1],b.base[1],b.base[0],[[u,0],[u,1],[U,1],[U,0]]);
   quad(coping,capUV,a.cap1[0],b.cap1[0],b.cap1[1],a.cap1[1],[[u,0],[U,0],[U,1],[u,1]]);
   quad(coping,capUV,a.cap0[0],a.cap0[1],b.cap0[1],b.cap0[0],[[u,0],[u,1],[U,1],[U,0]]);
   for(const side of[0,1])quad(coping,capUV,a.cap0[side],b.cap0[side],b.cap1[side],a.cap1[side],[[u,0],[U,0],[U,1],[u,1]]);
  }
  for(const p of[profile[0],profile.at(-1)!]){
   quad(body,bodyUV,p.base[0],p.edge[0],p.edge[1],p.base[1],[[0,0],[0,1],[1,1],[1,0]]);
   quad(coping,capUV,p.cap0[0],p.cap1[0],p.cap1[1],p.cap0[1],[[0,0],[0,1],[1,1],[1,0]]);
  }
 }
 const mesh=(positions:number[],uv:number[],material:THREE.Material)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.computeVertexNormals();const m=new THREE.Mesh(g,material);m.castShadow=m.receiveShadow=true;root.add(m);};
 const masonry=surfaceMaterial('retaining-masonry','#f4eddd','masonry',.025),cap=surfaceMaterial('retaining-coping','#f4eddd','lime',.012);masonry.side=cap.side=THREE.DoubleSide;
 mesh(body,bodyUV,masonry);mesh(coping,capUV,cap);root.userData.profiles=profiles;root.userData.historicalSection=null;return root;
}
