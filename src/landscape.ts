import {harbourHeight} from './harbour-plan.mjs';
import {caveSites,caveCoordinates,caveFrame,caveTerrainCovered,caveRockRoof,caveRockBlend} from './cave-plan.mjs';
import * as THREE from 'three';
import {sampleHeight,toWorld,terrainIndices} from './geo.mjs';
import {landscapeSample,nearestRoute,shoreEasting,coastalWaterEasting} from './littoral-plan.mjs';
import type {Terrain} from './terrain';
import {urbanGround} from './urban-plan.mjs';
export type LittoralData=any;
type P=[number,number,number]; // easting, northing, measured height

/** North context is joined to every native 10 m vertex, not to a second overlapping surface. */
export function regionalTriangles(region:Terrain,h:Float32Array,v:Uint8Array,local:Terrain,lh:Float32Array,lv:Uint8Array){
  const triangles:P[][]=[];
  const point=(i:number):P=>[region.west+(i%region.width)*region.step,region.north-Math.floor(i/region.width)*region.step,h[i]];
  for(const ids of chunks(terrainIndices(region.width,region.height-1,v)))triangles.push(ids.map(point));
  const row=region.height-2,n=local.north,ratio=region.step/local.step;
  for(let col=0;col<region.width-1;col++){
    const a=row*region.width+col,b=a+1;if(!v[a]||!v[b])continue;
    const topA=point(a),topB=point(b),bottom:P[]=[];
    for(let j=0;j<=ratio;j++){const e=topA[0]+j*local.step,level=sampleHeight(local,lh,lv,e,n);if(level===null){bottom.length=0;break;}bottom.push([e,n,level]);}
    if(!bottom.length)continue;
    for(let j=0;j<ratio;j++)triangles.push([topA,bottom[j],bottom[j+1]]);
    triangles.push([topA,bottom.at(-1)!,topB]);
  }
  return triangles;
}
function* chunks(values:number[]){for(let i=0;i<values.length;i+=3)yield values.slice(i,i+3);}
export function nativeTriangles(meta:Terrain,h:Float32Array,ids:number[]){
  return [...chunks(ids)].map(face=>face.map(i=>[meta.west+(i%meta.width)*meta.step,meta.north-Math.floor(i/meta.width)*meta.step,h[i]] as P));
}
export function makeLandscape(meta:Terrain,triangles:P[][],data:LittoralData,canal=true,interpret=true,urban?:any){
  const positions:number[]=[],colors:number[]=[],land=new THREE.Color('#aab68f'),high=new THREE.Color('#75895c');
  const palette:Record<string,THREE.Color>={cave:new THREE.Color('#40301d'),sand:new THREE.Color('#caba91'),rock:new THREE.Color('#a19b83'),seabed:new THREE.Color('#799484'),bed:new THREE.Color('#9c9a70')};
  const active=canal?data:{...data,basins:[],canal:{...data.canal,routeStudy:[[0,0],[0,1]],branchStudy:[[0,0],[0,1]]}};
  const caveData=!data.harbourPhase?data.researchLandscape:null,caves=caveData?caveSites(caveData):[],caveExtent=caves.length?{first:Math.min(...caves.map((c:any)=>c.along-c.width*.65))-14,last:Math.max(...caves.map((c:any)=>c.along+c.width*.65))+14,depth:caveFrame(caveData).rockDepth+10}:null;
  const mid=(a:P,b:P):P=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  const emit=(a:P,b:P,c:P,depth=0)=>{
    const e=(a[0]+b[0]+c[0])/3,n=(a[1]+b[1]+c[1])/3,edge=Math.max(Math.hypot(a[0]-b[0],a[1]-b[1]),Math.hypot(a[0]-c[0],a[1]-c[1]),Math.hypot(c[0]-b[0],c[1]-b[1]));
    const nearShore=n>4497750&&n<4501550&&Math.abs(coastalWaterEasting(n,active)-e)<edge+28;
    const nearCanal=canal&&n>4499350&&n<4509700&&nearestRoute(e,n,data.canal.routeStudy).distance<edge+16;
    const nearBasin=canal&&data.basins.some((s:any)=>Math.abs(e-s.center[0])<s.width/2+edge+6&&Math.abs(n-s.center[1])<s.length/2+edge+6);
    const nearRavine=urban&&canal&&Math.abs(n-4499520)<edge+150&&Math.abs(e-296400)<edge+350&&nearestRoute(e,n,urban.ravine.points).distance<edge+15;
    const cavePoint=caveExtent?caveCoordinates(e,n,caveData):null,nearCave=!!(cavePoint&&caveExtent&&cavePoint.along>caveExtent.first-edge&&cavePoint.along<caveExtent.last+edge&&cavePoint.depth> -12-edge&&cavePoint.depth<caveExtent.depth+edge);
    if(interpret&&edge>(nearCave?.6:4)&&depth<16&&(nearShore||nearCanal||nearBasin||nearRavine||nearCave)){
      // Longest-edge bisection leaves short edges intact, so the native 2 m patches
      // and the 10/50 m context share identical subdivisions where a cut crosses them.
      const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);
      if(ab>=bc&&ab>=ca){const m=mid(a,b);emit(a,m,c,depth+1);emit(m,b,c,depth+1);}
      else if(bc>=ca){const m=mid(b,c);emit(a,b,m,depth+1);emit(a,m,c,depth+1);}
      else{const m=mid(c,a);emit(a,b,m,depth+1);emit(m,b,c,depth+1);}return;
    }
    if(interpret&&caveData&&[a,b,c].every(p=>caveTerrainCovered(p[0],p[1],caveData)))return;
    for(const p of[a,b,c]){
      const s=interpret?landscapeSample(p[0],p[1],p[2],active):{height:p[2],zone:'land'};
      if(interpret&&harbourHeight(p[0],p[1],data.harbourPhase)!==null)s.height-=.04;
      if(interpret&&caveData&&caveTerrainCovered(p[0],p[1],caveData)){const q=caveCoordinates(p[0],p[1],caveData);s.height=caveRockRoof(q.along,q.depth,caveData);}
      const height=urban&&canal&&interpret?urbanGround(p[0],p[1],s.height,urban):s.height;
      positions.push(...toWorld(p[0],p[1],height,meta.origin));
      const color=(palette[s.zone]??land.clone().lerp(high,THREE.MathUtils.clamp(p[2]/110,0,1))).clone();if(interpret&&caveData)color.lerp(palette.rock,caveRockBlend(p[0],p[1],caveData));colors.push(color.r,color.g,color.b);
    }
  };
  for(const triangle of triangles)emit(...triangle as[P,P,P]);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});return new THREE.Mesh(geometry,material);
}
