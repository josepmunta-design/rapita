// Selecció d'edificis amb el ratolí: contorn exterior de color en passar-hi per sobre (provisional) i en fer clic (fix fins que es tanqui l'expedient o es cliqui a un altre lloc).
import * as THREE from 'three';

export type Pickable={modelId:string;label:string};
const HOVER_LAYER=1,SELECT_LAYER=2;

const vertex='varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}';
// Cada píxel just fora de la silueta (màscara) dibuixa la vora; no hi ha aristes interiors.
const fragment=`
uniform sampler2D tMask;uniform vec2 texel;uniform vec3 color;uniform float width;varying vec2 vUv;
void main(){
  if(texture2D(tMask,vUv).r>.5)discard;
  float d=99.;
  for(int x=-8;x<=8;x++)for(int y=-8;y<=8;y++){
    vec2 o=vec2(float(x),float(y));float l=length(o);
    if(l>width+2.5||l>=d)continue;
    if(texture2D(tMask,vUv+o*texel).r>.5)d=l;
  }
  if(d>width+2.5)discard;
  float line=1.-smoothstep(width-.6,width+.6,d);
  float halo=(1.-smoothstep(width+.6,width+2.4,d))*.55;
  gl_FragColor=vec4(mix(vec3(.17,.09,.03),color,line),max(line,halo));
}`;

export function makePicker(opts:{renderer:THREE.WebGLRenderer;camera:THREE.Camera;scene:THREE.Scene;tooltip:HTMLElement;
  enabled:()=>boolean;onSelect:(target:THREE.Object3D|null,info:Pickable|null)=>void}){
  const {renderer,camera,scene,tooltip}=opts,canvas=renderer.domElement;
  const registry=new Map<THREE.Object3D,Pickable>();
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
  let hovered:THREE.Object3D|null=null,selection:THREE.Object3D[]=[],press:{x:number;y:number;id:number}|null=null,pending:PointerEvent|null=null,frame=0;

  const mask=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
  const maskMaterial=new THREE.MeshBasicMaterial({color:0xffffff,side:THREE.DoubleSide,toneMapped:false});
  const edge=new THREE.ShaderMaterial({vertexShader:vertex,fragmentShader:fragment,transparent:true,depthTest:false,depthWrite:false,
    uniforms:{tMask:{value:mask.texture},texel:{value:new THREE.Vector2()},color:{value:new THREE.Vector3(1,.54,.12)},width:{value:3}}});
  const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),edge),quadScene=new THREE.Scene(),quadCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  quad.frustumCulled=false;quadScene.add(quad);
  const clearColor=new THREE.Color();

  const register=(object:THREE.Object3D,info:Pickable)=>{registry.set(object,info);};
  const setLayer=(objects:THREE.Object3D[],layer:number,on:boolean)=>{for(const o of objects)o.traverse(c=>{if(c instanceof THREE.Mesh)on?c.layers.enable(layer):c.layers.disable(layer);});};
  const drawOutline=(objects:THREE.Object3D[],layer:number,width:number)=>{
    const live=objects.filter(o=>{for(let n:THREE.Object3D|null=o;n;n=n.parent)if(!n.visible)return false;return true;});
    if(!live.length)return;
    setLayer(live,layer,true);
    const cameraMask=camera.layers.mask,background=scene.background,clearAlpha=renderer.getClearAlpha();renderer.getClearColor(clearColor);
    camera.layers.set(layer);scene.background=null;scene.overrideMaterial=maskMaterial;
    renderer.setRenderTarget(mask);renderer.setClearColor(0x000000,1);renderer.clear();renderer.render(scene,camera);
    renderer.setRenderTarget(null);renderer.setClearColor(clearColor,clearAlpha);
    scene.overrideMaterial=null;scene.background=background;camera.layers.mask=cameraMask;
    setLayer(live,layer,false);
    edge.uniforms.width.value=width*renderer.getPixelRatio();
    const autoClear=renderer.autoClear;renderer.autoClear=false;renderer.render(quadScene,quadCamera);renderer.autoClear=autoClear;
  };
  // Es crida després de renderer.render(scene,camera): dibuixa el contorn provisional i, a sobre, el de la selecció fixa.
  const renderHighlights=()=>{
    if(hovered&&!selection.includes(hovered))drawOutline([hovered],HOVER_LAYER,2.5);
    if(selection.length)drawOutline(selection,SELECT_LAYER,3.5);
  };

  const setHover=(target:THREE.Object3D|null,x=0,y=0)=>{
    hovered=target;canvas.style.cursor=target?'pointer':'';
    tooltip.hidden=!target;
    if(target){tooltip.textContent=registry.get(target)!.label;tooltip.style.left=`${x+14}px`;tooltip.style.top=`${y+16}px`;}
  };
  const pick=(e:PointerEvent):THREE.Object3D|null=>{
    const rect=canvas.getBoundingClientRect();
    pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const meshes:THREE.Object3D[]=[];scene.traverseVisible(o=>{if(o instanceof THREE.Mesh)meshes.push(o);});
    let hit:THREE.Object3D|null=raycaster.intersectObjects(meshes,false)[0]?.object??null;
    while(hit&&!registry.has(hit))hit=hit.parent;
    return hit;
  };
  const update=()=>{
    frame=0;const e=pending;pending=null;
    if(!e)return;
    if(!opts.enabled()||e.buttons){setHover(null);return;}
    const target=pick(e),rect=canvas.getBoundingClientRect();
    setHover(target,e.clientX-rect.left,e.clientY-rect.top);
  };
  canvas.addEventListener('pointermove',e=>{
    if(press&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>6)press=null;
    pending=e;if(!frame)frame=requestAnimationFrame(update);
  });
  canvas.addEventListener('pointerleave',()=>{pending=null;setHover(null);});
  canvas.addEventListener('pointerdown',e=>{if(e.button===0&&!document.pointerLockElement)press={x:e.clientX,y:e.clientY,id:e.pointerId};});
  canvas.addEventListener('pointercancel',()=>{press=null;});
  canvas.addEventListener('pointerup',e=>{
    const start=press;press=null;
    if(!start||start.id!==e.pointerId||e.button!==0||!opts.enabled())return;
    const target=pick(e);
    opts.onSelect(target,target?registry.get(target)!:null);
  });
  const resize=()=>{
    const size=renderer.getDrawingBufferSize(new THREE.Vector2());
    mask.setSize(size.x,size.y);edge.uniforms.texel.value.set(1/size.x,1/size.y);
  };
  return {register,resize,renderHighlights,hide:()=>setHover(null),setSelection:(objects:THREE.Object3D[])=>{selection=objects;},get selection(){return selection;}};
}
