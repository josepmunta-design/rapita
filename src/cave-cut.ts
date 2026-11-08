import * as THREE from 'three';
/** Remove intruding terrain/wall fragments from the already modelled lateral cave volumes. */
export function clipCaveVoids(material:THREE.MeshStandardMaterial,data:any,origin:any){
 const enabled={value:1},cavities=data.cavities;
 const centers=cavities.map((c:any)=>new THREE.Vector4(c.anchor[0]-origin.easting,origin.northing-c.anchor[1],data.caveFrame.floorElevation+.14+c.height*.32,c.width*.43));
 const params=cavities.map((c:any)=>new THREE.Vector4(c.height*.31,c.depth+.2,0,0));
 const tangent=new THREE.Vector2(...data.caveFrame.tangent),outward=new THREE.Vector2(...data.caveFrame.outward);
 const before=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=(shader,renderer)=>{
  before.call(material,shader,renderer);shader.uniforms.caveCutEnabled=enabled;shader.uniforms.caveCenters={value:centers};shader.uniforms.caveParams={value:params};shader.uniforms.caveTangent={value:tangent};shader.uniforms.caveOutward={value:outward};
  shader.vertexShader='varying vec3 vCaveCut;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`vec4 caveWorld=vec4(transformed,1.0);
#ifdef USE_INSTANCING
caveWorld=instanceMatrix*caveWorld;
#endif
vCaveCut=(modelMatrix*caveWorld).xyz;
#include <project_vertex>`);
  shader.fragmentShader='varying vec3 vCaveCut;uniform float caveCutEnabled;uniform vec4 caveCenters[3];uniform vec4 caveParams[3];uniform vec2 caveTangent;uniform vec2 caveOutward;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
if(caveCutEnabled>.5){for(int i=0;i<3;i++){vec4 c=caveCenters[i],p=caveParams[i];vec2 delta=vec2(vCaveCut.x-c.x,c.y-vCaveCut.z);float dn=dot(delta,caveTangent),dy=(vCaveCut.y-c.z)/p.x,side=dn/c.w,depth=-dot(delta,caveOutward);if(depth>-.8&&depth<p.y&&side*side+dy*dy<.99)discard;}}`);
 };
 material.customProgramCacheKey=()=>key+'-lateral-caves-1';material.needsUpdate=true;return (on:boolean)=>{enabled.value=on?1:0;};
}
