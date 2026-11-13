import * as THREE from 'three';

/**
 * «Arquitectònic» plate: the same scene, redrawn as ink line over flat washes on paper.
 * It is a screen-space pass over colour and depth, so it cannot move, add or remove geometry.
 * Line, wash and paper are a drawing convention (C), not a record of any historical plan.
 */
export const plateFragment = /* glsl */`
  uniform sampler2D tColor; uniform sampler2D tDepth;
  uniform vec2 texel; uniform vec2 projection; uniform float near; uniform float far;
  uniform float lineScale; uniform float aspect; uniform float margins; uniform float inkReach; uniform float haze;
  uniform vec3 paperColor; uniform vec3 inkColor; uniform float exposure;
  varying vec2 vUv;
  float plateHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
  float plateNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(plateHash(i),plateHash(i+vec2(1,0)),f.x),mix(plateHash(i+vec2(0,1)),plateHash(i+vec2(1,1)),f.x),f.y);}
  float plateFbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*plateNoise(p);p=p*2.07+vec2(13.1,7.9);a*=.5;}return v/.9375;}
  float viewDepth(vec2 uv){float d=texture2D(tDepth,uv).x;return near*far/(far-d*(far-near));}
  vec3 viewPoint(vec2 uv,float z){return vec3((uv*2.0-1.0)*projection*z,-z);}
  vec3 chroma(vec3 c){return c/(c.r+c.g+c.b+.06);}
  float luma(vec3 c){return dot(c,vec3(.299,.587,.114));}
  // Scene light is authored for this pass: a soft shoulder keeps lit lime walls below pure white.
  vec3 wash(vec3 c){c*=exposure;return min(c,vec3(.80))+.20*(1.0-exp(-max(c-.80,0.0)/.20));}
  void main(){
    vec2 pixel=vUv/texel;
    // A hand does not rule perfect lines: the pen wanders by a fraction of a pixel.
    vec2 wander=(vec2(plateNoise(pixel*.11),plateNoise(pixel*.11+31.7))-.5)*texel*1.1*lineScale;
    vec2 uv=vUv+wander,o=texel*lineScale;
    vec2 l=uv-vec2(o.x,0.0),r=uv+vec2(o.x,0.0),d=uv-vec2(0.0,o.y),u=uv+vec2(0.0,o.y);
    float z0=viewDepth(uv),zl=viewDepth(l),zr=viewDepth(r),zd=viewDepth(d),zu=viewDepth(u);
    vec3 p0=viewPoint(uv,z0);
    // Two one-sided normals: equal on a plane, apart on an arris or a silhouette.
    vec3 na=normalize(cross(p0-viewPoint(l,zl),p0-viewPoint(d,zd))),nb=normalize(cross(viewPoint(r,zr)-p0,viewPoint(u,zu)-p0));
    float arris=smoothstep(.05,.28,1.0-dot(na,nb));
    // Depth jump measured on 1/z, which is flat across any plane however obliquely it is seen.
    float jump=z0*(abs(1.0/zl+1.0/zr-2.0/z0)+abs(1.0/zd+1.0/zu-2.0/z0));
    float grain=length(projection*texel)*2.0*lineScale;
    float silhouette=smoothstep(4.0*grain,11.0*grain,jump);
    vec3 c0=texture2D(tColor,vUv).rgb,cl=texture2D(tColor,l).rgb,cr=texture2D(tColor,r).rgb,cd=texture2D(tColor,d).rgb,cu=texture2D(tColor,u).rgb;
    // Colour boundaries: hue changes (roof against wall, water against sand) but not cast shadows.
    float hue=smoothstep(.055,.15,length(chroma(cl)-chroma(cr))+length(chroma(cd)-chroma(cu)));
    float tone=smoothstep(.46,.75,abs(luma(wash(cl))-luma(wash(cr)))+abs(luma(wash(cd))-luma(wash(cu))));
    float sky=step(.9999,texture2D(tDepth,vUv).x);
    float reach=exp(-pow(z0/inkReach,2.0));
    float line=max(max(arris,silhouette),max(hue*.75,tone*.6))*reach*(1.0-sky);
    line*=.62+.38*plateNoise(pixel*.045+5.0);

    vec2 sheet=vUv*vec2(aspect,1.0);
    float cloud=plateFbm(sheet*4.2),fibre=plateNoise(pixel*vec2(.55,.16))*.6+plateNoise(pixel*.9)*.4,tooth=plateHash(floor(pixel));
    vec3 paper=paperColor*(.955+.075*cloud)*(.975+.05*fibre)*(.99+.02*tooth);
    paper*=mix(vec3(1.0),vec3(.93,.90,.84),smoothstep(.55,.9,plateFbm(sheet*1.3+9.0))*.5);

    vec3 colour=wash(c0);
    colour=mix(vec3(luma(colour)),colour,.95)*mix(vec3(1.0),paperColor/max(paperColor.r,.001),.22);
    // Lit lime reads as the white of the sheet rather than as a yellow wash.
    colour=mix(colour,vec3(luma(colour))*vec3(1.03,1.0,.93),smoothstep(.50,.80,luma(colour))*.45);
    // Uneven washes and pigment settling in the tooth of the paper, stronger in dark tones.
    colour*=.955+.09*plateFbm(sheet*9.0+3.0);
    colour*=1.0-(.05+.10*(1.0-luma(colour)))*(fibre-.45);
    // Shaded faces carry a light diagonal hatch, as in a pen-and-wash drawing.
    float shade=1.0-smoothstep(.10,.30,luma(colour));
    float hatch=smoothstep(.55,.85,abs(fract((pixel.x+pixel.y)/(5.5*lineScale))-.5)*2.0);
    colour*=1.0-.12*shade*hatch*reach;
    // Distance and the empty background dissolve into the sheet instead of a sky.
    colour=mix(paperColor,colour,(1.0-sky)*exp(-pow(z0*haze,2.0)));

    // The drawing stops short of the sheet edge and leaves room for the title, the scale and the cartouche.
    vec2 edge=min(vUv,1.0-vUv)*vec2(aspect,1.0);
    float ragged=plateFbm(sheet*5.5+21.0)-.5;
    float painted=smoothstep(.004,.05,min(edge.x,edge.y)+ragged*.04);
    painted*=mix(.30,1.0,smoothstep(.10,.56,length((sheet-vec2(0.0,1.0))*vec2(1.0,1.02))+ragged*.18));
    painted*=mix(.55,1.0,smoothstep(.05,.26,length((sheet-vec2(aspect,1.0))*vec2(1.0,1.6))+ragged*.10));
    painted*=mix(.55,1.0,smoothstep(.04,.22,length((sheet-vec2(aspect,0.0))*vec2(1.0,1.9))+ragged*.10));
    painted=mix(1.0,painted,margins);

    // Washes are opaque colour on the sheet; the paper shows through as grain and at the margins.
    vec3 result=mix(paper,colour*paper/paperColor,painted);
    result=mix(result,inkColor*(.8+.4*cloud),clamp(line*.9*mix(.35,1.0,painted),0.0,1.0));
    gl_FragColor=vec4(result,1.0);
    #include <colorspace_fragment>
  }
`;
const plateVertex = 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}';

export function makeInkPlate(renderer: THREE.WebGLRenderer) {
  let target: THREE.WebGLRenderTarget | null = null, samples = 4;
  const size = new THREE.Vector2();
  const material = new THREE.ShaderMaterial({
    vertexShader: plateVertex, fragmentShader: plateFragment, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: {
      tColor: { value: null }, tDepth: { value: null }, texel: { value: new THREE.Vector2(1, 1) }, projection: { value: new THREE.Vector2(1, 1) },
      near: { value: .1 }, far: { value: 1000 }, lineScale: { value: 1 }, aspect: { value: 1 }, margins: { value: 1 }, inkReach: { value: 5200 }, haze: { value: 0 },
      // Linear values of a warm laid paper and a sepia ink.
      paperColor: { value: new THREE.Color('#f1e6c9') }, inkColor: { value: new THREE.Color('#2f2219') }, exposure: { value: 1 }
    }
  });
  material.name = 'Làmina arquitectònica · tinta i aiguada';
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material), quadScene = new THREE.Scene(), quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  quad.frustumCulled = false; quadScene.add(quad);
  const release = () => { target?.depthTexture?.dispose(); target?.dispose(); target = null; };
  const prepare = () => {
    renderer.getDrawingBufferSize(size);
    const width = Math.max(1, Math.floor(size.x)), height = Math.max(1, Math.floor(size.y));
    if (target && target.width === width && target.height === height && target.samples === samples) return target;
    release();
    // Stored as sRGB bytes and read back linear by the GPU: no banding and no float buffers needed.
    target = new THREE.WebGLRenderTarget(width, height, { samples, depthTexture: new THREE.DepthTexture(width, height), colorSpace: THREE.SRGBColorSpace });
    target.texture.name = 'Làmina · color'; material.uniforms.tColor.value = target.texture; material.uniforms.tDepth.value = target.depthTexture;
    material.uniforms.texel.value.set(1 / width, 1 / height); material.uniforms.aspect.value = width / height;
    return target;
  };
  return {
    material,
    /** MSAA samples of the drawing buffer; 0 on the low quality profile. */
    setSamples(count: number) { samples = Math.max(0, Math.min(count, renderer.capabilities.maxSamples)); },
    /** `margins` is false while walking: a first-person view has no sheet edge. */
    /**
     * Fog density of the sheet: ground beyond the subject fades to bare paper. 0 switches it off.
     * `distance` is how far the camera stands from what it looks at, so a regional view is not erased.
     */
    setHaze(density: number, distance = 0) {
      material.uniforms.haze.value = density > 0 ? Math.min(density, .3 / Math.max(distance, 1)) : 0;
      material.uniforms.inkReach.value = Math.max(5200, distance * 3.2);
    },
    render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, margins = true) {
      const buffer = prepare(), u = material.uniforms, tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.zoom;
      u.projection.value.set(tan * camera.aspect, tan); u.near.value = camera.near; u.far.value = camera.far;
      u.lineScale.value = Math.max(1, renderer.getPixelRatio() * .8); u.margins.value = margins ? 1 : 0;
      const autoReset = renderer.info.autoReset; renderer.info.autoReset = false; renderer.info.reset();
      renderer.setRenderTarget(buffer); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.render(quadScene, quadCamera);
      renderer.info.autoReset = autoReset;
    },
    release
  };
}
