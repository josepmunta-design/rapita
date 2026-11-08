import {caveFrame,caveWorld,caveSites,caveRockRoof} from './cave-plan.mjs';
import {mergeVertices,toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import {toWorld} from './geo.mjs';
/** Eroded calcarenite: irregular lip, receding vault, sediment floor and shaded rear. */
export function makeRockCave(c:any,origin:any){
 const group=new THREE.Group();group.name='Cova erosionada / PR01 / C';
 const W=c.width,H=c.height,D=c.depth,N=40,R=10,seed=c.seed??2;
 const noise=(a:number,b=0)=>Math.sin(a*3.13+seed*1.7+b)*.55+Math.sin(a*8.71-seed+b*2)*.25;
 const opening=(i:number,t:number)=>{
  const a=Math.PI*2*i/N,shrink=1-.55*t,rx=W*.43*shrink,ry=H*.34*(1-.48*t);
  return [Math.cos(a)*rx*(1+.07*noise(a,t)),H*.32+Math.sin(a)*ry*(1+.10*noise(a+2,t))+.10*Math.cos(a),-D*t];
 };
 const geometry=(positions:number[],colors:number[])=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;};
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide});material.name='Calcarenita erosionada';
 const build=(rings:number[][][],interior:boolean)=>{
  const p:number[]=[],colors:number[]=[];
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<N;i++)for(const [r,k]of[[j,i],[j+1,i],[j,(i+1)%N],[j,(i+1)%N],[j+1,i],[j+1,(i+1)%N]]){
   const [x,y,z]=rings[r][k],grain=.035*noise(k*2.4,r),layer=.045*Math.sin(y*17+noise(k*.2)),shade=interior?Math.max(.26,.76+z/D*.49):1;
   p.push(x,y,z);const color=new THREE.Color().setRGB((.62+grain+layer)*shade,(.49+grain+layer)*shade,(.35+grain+layer)*shade);colors.push(color.r,color.g,color.b);
  }
  const mesh=new THREE.Mesh(geometry(p,colors),material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;
 };
 // Nonrectangular lip blends into a low, layered cliff, with no masonry arch.
 const lip=Array.from({length:5},(_,r)=>Array.from({length:N},(_,i)=>{
  const a=Math.PI*2*i/N,inner=opening(i,0),t=r/4;
  const outer=[Math.cos(a)*W*.72*(1+.07*noise(a)),H*.43+Math.sin(a)*H*.56*(1+.07*noise(a+2)),-.6-.3*noise(a)];
  return inner.map((v,k)=>v+(outer[k]-v)*t);
 }));build(lip,false);
 const tunnel=Array.from({length:R+1},(_,j)=>Array.from({length:N},(_,i)=>opening(i,j/R)));build(tunnel,true);
 // A continuous outer rock surface covers the entire vault, leaving only a lateral entrance.
 const cover=Array.from({length:R+1},(_,j)=>Array.from({length:N},(_,i)=>{
  const t=j/R,a=Math.PI*2*i/N,front=lip[4][i];
  return [Math.cos(a)*W*.72*(1+.045*noise(a,t)),H*.43+Math.sin(a)*H*.56*(1+.035*noise(a+2,t)),front[2]*(1-t)-D*1.15*t];
 }));build(cover,false);
 const cap:number[]=[],capColor:number[]=[];for(let i=0;i<N;i++)for(const p of [[0,H*.43,-D*1.15],cover[R][i],cover[R][(i+1)%N]]){cap.push(...p);capColor.push(.57,.45,.32);}
 group.add(new THREE.Mesh(geometry(cap,capColor),material));
 // The back is an irregular stone face at real depth, never a black plane at the mouth.
 const rear:number[]=[],color:number[]=[];for(let i=0;i<N;i++){
  for(const p of[[0,H*.32,-D*1.05],opening(i,1),opening((i+1)%N,1)]){rear.push(...p);color.push(.18,.13,.09);}
 }
 group.add(new THREE.Mesh(geometry(rear,color),material));
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(W*.84,D+1,8,8),new THREE.MeshStandardMaterial({color:'#8e7958',roughness:1,side:THREE.DoubleSide}));floor.rotation.x=-Math.PI/2;floor.position.set(0,.035,-D/2);group.add(floor);
 // Weathered strata and fallen stones stay beside the opening.
 const rock=new THREE.MeshStandardMaterial({color:'#b39a74',roughness:1});
 for(let i=0;i<18;i++){
  const sign=i%2?1:-1,x=sign*(W*.48+(i%3)*.20),y=.15+(i%6)*H*.17;
  const stone=new THREE.Mesh(new THREE.IcosahedronGeometry(.15+(i%4)*.045,1),rock);stone.position.set(x,y,-.1-(i%3)*.16);stone.scale.set(1.8,.48,1);stone.rotation.y=i*.8;group.add(stone);
 }
 // Local +z is seaward (+E), local x is along the cliff (-N).
 group.rotation.y=Math.PI/2;group.position.fromArray(toWorld(c.anchor[0],c.anchor[1],c.floorElevation,origin));
 return group;
}

/** Closed rock boundary: three blind galleries, outward faces and inward gallery normals. */
export function makeRoquerCliff(data:any,origin:any){
 const root=new THREE.Group(),cavities=caveSites(data),frame=caveFrame(data),base=frame.floorElevation,D=frame.rockDepth;
 const first=Math.min(...cavities.map((c:any)=>c.along-c.width*.65))-4,last=Math.max(...cavities.map((c:any)=>c.along+c.width*.65))+4;
 const roof=(u:number)=>caveRockRoof(u,0,data)-base;
 const outer:THREE.Vector2[]=[];
 for(let u=first;u<last;u+=.85)outer.push(new THREE.Vector2(u,.025*Math.sin(u*1.7)));outer.push(new THREE.Vector2(last,.025*Math.sin(last*1.7)));
 for(let y=1;y<roof(last);y+=.8)outer.push(new THREE.Vector2(last,y));outer.push(new THREE.Vector2(last,roof(last)));
 for(let u=last-.85;u>first;u-=.85)outer.push(new THREE.Vector2(u,roof(u)));outer.push(new THREE.Vector2(first,roof(first)));
 for(let y=roof(first)-.8;y>.5;y-=.8)outer.push(new THREE.Vector2(first,y));
 const shape=new THREE.Shape(outer),rings:THREE.Vector2[][]=[];
 for(const [j,c]of cavities.entries()){
  const ring=Array.from({length:48},(_,i)=>{const a=2*Math.PI*i/48;return new THREE.Vector2(c.along+Math.cos(a)*c.width*.43*(1+.035*Math.sin(5*a+j)),.14+c.height*.32+Math.sin(a)*c.height*.31*(1+.045*Math.sin(a*7+j)));});
  const path=new THREE.Path(ring);path.closePath();shape.holes.push(path);rings.push(ring);
 }
 const positions:number[]=[],colors:number[]=[];
 const emit=(a:number[],b:number[],c:number[],inside=false)=>{
  // The E/N -> E/-N world transform reverses handedness: reverse each triangle once.
  for(const [u,y,d]of [a,c,b]){
   const erosion=(.24*Math.sin(u*.36)+.10*Math.sin(u*.81)+.035*Math.sin(y*.7+u*.12))*Math.pow(1-d/D,3),[e,n]=caveWorld(u,d-erosion,0,data),h=base+y+d/D*.9;
   positions.push(e-origin.easting,h,origin.northing-n);const grain=.025*Math.sin(u*5+y*11),shade=inside?.6*Math.exp(-d/3.4):1;
   const tone=new THREE.Color('#a19b83');colors.push((tone.r+grain*.4)*shade,(tone.g+grain*.4)*shade,(tone.b+grain*.4)*shade);
  }
 };
 const subdivide=(a:number[],b:number[],c:number[],inside:boolean,depth=0)=>{
  const ab=Math.hypot(a[0]-b[0],a[1]-b[1]),bc=Math.hypot(b[0]-c[0],b[1]-c[1]),ca=Math.hypot(c[0]-a[0],c[1]-a[1]);
  if(Math.max(ab,bc,ca)<=1.3||depth>16){emit(a,b,c,inside);return;}
  const mid=(x:number[],y:number[])=>x.map((v,k)=>(v+y[k])/2);
  if(ab>=bc&&ab>=ca){const m=mid(a,b);subdivide(a,m,c,inside,depth+1);subdivide(m,b,c,inside,depth+1);}else if(bc>=ca){const m=mid(b,c);subdivide(a,b,m,inside,depth+1);subdivide(a,m,c,inside,depth+1);}else{const m=mid(c,a);subdivide(a,b,m,inside,depth+1);subdivide(m,b,c,inside,depth+1);}
 };
 const cap=(s:THREE.Shape,depth:number,front:boolean)=>{
  const g=new THREE.ShapeGeometry(s),p=g.getAttribute('position'),index=g.index!;
  for(let i=0;i<index.count;i+=3){const pts=[0,1,2].map(k=>{const q=index.getX(i+k);return[p.getX(q),p.getY(q),depth];});subdivide(pts[0],pts[front?2:1],pts[front?1:2],false);}g.dispose();
 };
 cap(shape,0,true);cap(new THREE.Shape(outer),D,false);
 // Exterior sides and covered roof, normals facing out of the solid rock.
 for(let i=0;i<outer.length;i++)for(let j=0;j<10;j++){
  const a=outer[i],b=outer[(i+1)%outer.length],d0=D*j/10,d1=D*(j+1)/10,A=[a.x,a.y,d0],B=[b.x,b.y,d0],C=[a.x,a.y,d1],E=[b.x,b.y,d1];emit(A,B,C);emit(B,E,C);
 }
 // Each gallery ends before the rear of the rock mass, with a solid blind end.
 for(const [j,c]of cavities.entries()){
  const ringsAt=Array.from({length:9},(_,k)=>rings[j].map(p=>{const t=k/8,shrink=1-.3*t;return[c.along+(p.x-c.along)*shrink,.14+c.height*.32+(p.y-(.14+c.height*.32))*(1-.18*t),c.depth*t];}));
  for(let k=0;k<8;k++)for(let i=0;i<48;i++){const ni=(i+1)%48,A=ringsAt[k][i],B=ringsAt[k][ni],C=ringsAt[k+1][i],E=ringsAt[k+1][ni];emit(A,C,B,true);emit(B,C,E,true);}
  for(let i=0;i<48;i++)emit([c.along,.14+c.height*.32,c.depth],ringsAt[8][(i+1)%48],ringsAt[8][i],true);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 const indexed=mergeVertices(geometry,1e-4);indexed.computeVertexNormals();const shaded=toCreasedNormals(indexed,Math.PI/2.8);indexed.dispose();geometry.dispose();
 // Limit shading normals at tight eroded lips, while keeping the surrounding face smooth.
 const sp=shaded.getAttribute('position'),sn=shaded.getAttribute('normal');for(let i=0;i<sp.count;i+=3){const a=new THREE.Vector3().fromBufferAttribute(sp,i),b=new THREE.Vector3().fromBufferAttribute(sp,i+1),c=new THREE.Vector3().fromBufferAttribute(sp,i+2),face=b.sub(a).cross(c.sub(a)).normalize();for(let k=0;k<3;k++){const n=new THREE.Vector3().fromBufferAttribute(sn,i+k);if(n.dot(face)<.55){n.lerp(face,.6).normalize();sn.setXYZ(i+k,n.x,n.y,n.z);}}}
 const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.FrontSide});material.name='Roquer / solid rock and blind lateral galleries';
 const mesh=new THREE.Mesh(shaded,material);mesh.castShadow=true;mesh.receiveShadow=true;mesh.userData.caveMass=true;root.add(mesh);root.userData.caveMass=true;root.userData.frame=frame;
 return root;
}
