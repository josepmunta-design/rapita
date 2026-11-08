import * as THREE from 'three';
import {makeHarbourLand} from './harbour.ts';
/** Prepared once during load. Year changes only toggle cached objects. */
export function makeHarbourCache(history:any,origin:any,heights:Map<number,Float32Array>){
 const root=new THREE.Group(),groups=new Map<number,THREE.Group>(),g=history.terrain,count=g.width*g.height,ids:number[]=[];
 for(let r=0;r<g.height-1;r++)for(let c=0;c<g.width-1;c++){const a=r*g.width+c;ids.push(a,a+g.width,a+1,a+1,a+g.width,a+g.width+1);}
 const index=new THREE.Uint32BufferAttribute(ids,1),land=new THREE.Color('#aab68f'),water=new THREE.Color('#799484');
 for(const phase of history.phases){
  const h=heights.get(phase.fromYear);if(!h||h.length!==count)throw Error('Port terrain cache is incomplete');
  const positions=new Float32Array(count*3),colors=new Float32Array(count*3);
  for(let r=0;r<g.height;r++)for(let c=0;c<g.width;c++){
   const i=r*g.width+c;positions.set([g.west+c*g.step-origin.easting,h[i],origin.northing-g.north+r*g.step],i*3);const col=h[i]<0?water:land;colors.set([col.r,col.g,col.b],i*3);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.setIndex(index);geo.computeVertexNormals();
  const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));
  const group=new THREE.Group();group.name=`Port georeferenciat ${phase.fromYear}`;group.add(mesh,makeHarbourLand(phase,origin));group.visible=false;root.add(group);groups.set(phase.fromYear,group);
 }
 let selected:number|null=null;
 const setPhase=(phase:any)=>{const next=phase?.fromYear??null;if(next===selected)return;if(selected!==null)groups.get(selected)!.visible=false;if(next!==null)groups.get(next)!.visible=true;selected=next;};
 return {root,groups,setPhase};
}
/** Clip the static landscape once, retaining only the terrain outside the port rectangle. */
export function outsidePortMesh(mesh:THREE.Mesh,history:any,origin:any){
 const b=history.reference.bbox,[west,south,east,north]=b,box=[west-origin.easting,east-origin.easting,origin.northing-north,origin.northing-south];
 const source=mesh.geometry,p=source.getAttribute('position'),col=source.getAttribute('color'),normal=source.getAttribute('normal'),out:number[]=[],colors:number[]=[],normals:number[]=[];
 type V=number[];
 const clip=(poly:V[],axis:number,value:number,sign:number)=>{
  const result:V[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],z=poly[(i+1)%poly.length],ia=(a[axis]-value)*sign>=-1e-7,ib=(z[axis]-value)*sign>=-1e-7;if(ia)result.push(a);if(ia!==ib){const t=(value-a[axis])/(z[axis]-a[axis]);result.push(a.map((v,j)=>v+(z[j]-v)*t));}}return result;
 };
 const emit=(poly:V[])=>{for(let j=1;j<poly.length-1;j++)for(const v of[poly[0],poly[j],poly[j+1]]){out.push(...v.slice(0,3));colors.push(...v.slice(3,6));normals.push(...v.slice(6,9));}};
 for(let i=0;i<p.count;i+=3){
  const triangle=[0,1,2].map(k=>[p.getX(i+k),p.getY(i+k),p.getZ(i+k),col.getX(i+k),col.getY(i+k),col.getZ(i+k),normal.getX(i+k),normal.getY(i+k),normal.getZ(i+k)]);
  if(triangle.every(v=>v[0]<=box[0])||triangle.every(v=>v[0]>=box[1])||triangle.every(v=>v[2]<=box[2])||triangle.every(v=>v[2]>=box[3])){emit(triangle);continue;}
  if(triangle.every(v=>v[0]>=box[0]&&v[0]<=box[1]&&v[2]>=box[2]&&v[2]<=box[3]))continue;
  emit(clip(triangle,0,box[0],-1));emit(clip(triangle,0,box[1],1));
  const middle=clip(clip(triangle,0,box[0],1),0,box[1],-1);emit(clip(middle,2,box[2],-1));emit(clip(middle,2,box[3],1));
 }
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(out,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));return new THREE.Mesh(geo,mesh.material);
}
