import * as THREE from 'three';
import { terrainIndices, toWorld } from './geo.mjs';

export type Terrain = {
  width:number; height:number; west:number; north:number; step:number;
  origin:{easting:number;northing:number;elevation:number};validCount:number;sampleCount:number;
  minimum:number;maximum:number;heights:string;validity:string;source:string;sourceSha256:string;verticalDatum:string;
};
export function makeTerrain(meta:Terrain,heights:Float32Array,valid:Uint8Array,interval=10,customIndices?:number[]) {
  const positions=new Float32Array(heights.length*3),colors=new Float32Array(heights.length*3);
  const low=new THREE.Color('#acb994'),high=new THREE.Color('#75895c');
  for(let row=0;row<meta.height;row++)for(let col=0;col<meta.width;col++){
    const i=row*meta.width+col;
    positions.set(toWorld(meta.west+col*meta.step,meta.north-row*meta.step,heights[i],meta.origin),i*3);
    const color=low.clone().lerp(high,THREE.MathUtils.clamp(heights[i]/110,0,1));colors.set([color.r,color.g,color.b],i*3);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const indices=customIndices??terrainIndices(meta.width,meta.height,valid);geometry.setIndex(indices);geometry.computeVertexNormals();
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);
  const contourPoints:number[]=[];
  for(let i=0;i<indices.length;i+=3){
    const ids=indices.slice(i,i+3),zs=ids.map(n=>heights[n]);
    for(let level=Math.ceil(Math.min(...zs)/interval)*interval;level<=Math.max(...zs);level+=interval){
      const intersections:number[][]=[];
      for(let e=0;e<3;e++){
        const a=ids[e],b=ids[(e+1)%3],za=heights[a],zb=heights[b];
        if((za<=level&&zb>level)||(zb<=level&&za>level)){
          const t=(level-za)/(zb-za);intersections.push([THREE.MathUtils.lerp(positions[a*3],positions[b*3],t),level+.045,THREE.MathUtils.lerp(positions[a*3+2],positions[b*3+2],t)]);
        }
      }
      if(intersections.length===2)contourPoints.push(...intersections[0],...intersections[1]);
    }
  }
  const cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.Float32BufferAttribute(contourPoints,3));
  const contours=new THREE.LineSegments(cg,new THREE.LineBasicMaterial({color:'#526b43',transparent:true,opacity:.24}));
  return {mesh,contours,material};
}
