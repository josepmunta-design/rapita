import * as THREE from 'three';
// Local deterministic textures: no image downloads or random state.
const texture=(kind:string,relief=false)=>{
 const size=128,bytes=new Uint8Array(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const noise=((x*17+y*31+(x*y)%29)%19)-9;let value:number[];
  if(kind==='tile'){const a=x%16,b=y%32,v=142+27*Math.cos(a/16*Math.PI*2)+noise*.5;value=b>29?[85,55,36]:[v+24,v*.67,v*.43];if(relief)value=[a===0||b>29?60:150+55*Math.cos(a/16*Math.PI*2),0,0];}
  else if(kind==='brick'){const joint=y%16<2||(x+(Math.floor(y/16)%2)*16)%32<2;value=joint?[173,163,141]:[154+noise,122+noise*.7,85+noise*.6];if(relief)value=[joint?80:170+noise,0,0];}
  else if(kind==='masonry'){const row=Math.floor(y/16),joint=y%16<1||(x+(row%2)*16)%32<1,tone=((row*11+Math.floor((x+(row%2)*16)/32)*7)%13)-6;value=joint?[145,140,126]:[183+tone+noise*.4,176+tone+noise*.4,157+tone+noise*.4];if(relief)value=[joint?75:150+noise,0,0];}
  else if(kind==='wood'){const grain=Math.sin(x*.6+Math.sin(y*.055)*2)*9+noise*.35;value=[105+grain,79+grain*.7,53+grain*.5];if(relief)value=[120+grain,0,0];}
  else {value=[196+noise*.5,188+noise*.5,164+noise*.5];if(relief)value=[128+noise,0,0];}
  const i=(y*size+x)*4;if(relief)value=[value[0],value[0],value[0]];bytes.set([...value.map(v=>Math.max(0,Math.min(255,Math.round(v)))),255],i);
 }
 const map=new THREE.DataTexture(bytes,size,size);map.colorSpace=relief?THREE.NoColorSpace:THREE.SRGBColorSpace;map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;return map;
};
export const roofTexture=()=>texture('tile');
export function surfaceMaterial(name:string,color:string,kind:string,bumpScale=.015){
 const m=new THREE.MeshStandardMaterial({color,map:texture(kind),bumpMap:texture(kind,true),bumpScale,roughness:1});m.name=name;m.userData.surfaceKind=kind;return m;
}
export function groundQuad(corners:number[][],sample:(x:number,z:number)=>number){
 const width=Math.max(Math.hypot(corners[1][0]-corners[0][0],corners[1][1]-corners[0][1]),Math.hypot(corners[2][0]-corners[3][0],corners[2][1]-corners[3][1]));
 const depth=Math.max(Math.hypot(corners[3][0]-corners[0][0],corners[3][1]-corners[0][1]),Math.hypot(corners[2][0]-corners[1][0],corners[2][1]-corners[1][1]));
 const cols=Math.ceil(width),rows=Math.ceil(depth),p:number[]=[],ids:number[]=[],uv:number[]=[];
 for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const v=j/rows,u=i/cols,x=THREE.MathUtils.lerp(THREE.MathUtils.lerp(corners[0][0],corners[1][0],u),THREE.MathUtils.lerp(corners[3][0],corners[2][0],u),v),z=THREE.MathUtils.lerp(THREE.MathUtils.lerp(corners[0][1],corners[1][1],u),THREE.MathUtils.lerp(corners[3][1],corners[2][1],u),v);p.push(x,sample(x,z)+.03,z);uv.push(x,z);}
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+1,c=a+cols+1;ids.push(a,b,c,b,c+1,c);}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ids);g.computeVertexNormals();return g;
}
