import * as THREE from 'three';

/**
 * Water surface for the «Realista» style: moving normals, sky reflection and a view-dependent
 * transparency that lets the modelled seabed read through in the shallows.
 * The «Arquitectònic» plate uses a still, matt blue wash with short pen strokes instead.
 * Shading only: no vertex displacement, water level or coastline changes.
 */
export type WaterStyle = boolean | 'plate';
export function makeWaterStyle(materials: THREE.MeshStandardMaterial[]) {
  const time = { value: 0 }, enabled = { value: 0 };
  const originals = [...new Set(materials)].map(material => {
    const original = { color: material.color.clone(), roughness: material.roughness, metalness: material.metalness, transparent: material.transparent, opacity: material.opacity, depthWrite: material.depthWrite, envMap: material.envMap, envMapIntensity: material.envMapIntensity };
    const before = material.onBeforeCompile, key = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      before.call(material, shader, renderer);
      shader.uniforms.visualWaterTime = time; shader.uniforms.visualWaterEnabled = enabled;
      shader.vertexShader = 'varying vec3 vVisualWaterWorld;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvVisualWaterWorld=(modelMatrix*vec4(position,1.0)).xyz;');
      shader.fragmentShader = `varying vec3 vVisualWaterWorld;uniform float visualWaterTime;uniform float visualWaterEnabled;
        float visualWaterFresnel=0.0;
        float waterHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
        float waterNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(waterHash(i),waterHash(i+vec2(1,0)),f.x),mix(waterHash(i+vec2(0,1)),waterHash(i+vec2(1,1)),f.x),f.y);}
        // Height of small wind waves: two drifting noise layers plus a faint directional swell.
        float waterHeight(vec2 p,float t,float detail){
          float h=waterNoise(p*.21+t*vec2(.11,.05))*1.0+waterNoise(p*.47-t*vec2(.07,.13))*.55;
          h+=detail*(waterNoise(p*1.25+t*vec2(.23,-.17))*.26+waterNoise(p*2.9-t*vec2(.31,.21))*.11);
          return h+sin(dot(p,vec2(.052,.031))+t*.5)*.35;
        }
      ` + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        if(visualWaterEnabled>.5&&visualWaterEnabled<1.5){
          vec2 p=vVisualWaterWorld.xz;
          float t=visualWaterTime;
          float fw=length(fwidth(p));
          float detail=1.0-smoothstep(.25,1.6,fw),broad=1.0-smoothstep(3.0,16.0,fw);
          float e=.35;
          float h0=waterHeight(p,t,detail),hx=waterHeight(p+vec2(e,0.0),t,detail),hz=waterHeight(p+vec2(0.0,e),t,detail);
          vec3 ripple=normalize(vec3((h0-hx)*.42*broad,1.0,(h0-hz)*.42*broad));
          normal=normalize(mat3(viewMatrix)*ripple);
          visualWaterFresnel=pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),4.0);
        }`);
      // Seen from above the water is clear; towards the horizon it becomes a mirror of the sky.
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        if(visualWaterEnabled>1.5){
          // Plate: an even wash, broken by short strokes drawn along the swell; nothing moves.
          vec2 p=vVisualWaterWorld.xz;
          float fw=length(fwidth(p)),closeUp=1.0-smoothstep(.5,3.5,fw);
          vec2 q=vec2(dot(p,vec2(.94,.34)),dot(p,vec2(-.34,.94)));
          float band=abs(fract(q.y/5.5+waterNoise(q*vec2(.02,.11))*1.6)-.5)*2.0;
          float stroke=(1.0-smoothstep(.0,.16,band))*step(.52,waterNoise(q*vec2(.045,.19)+7.0))*closeUp;
          outgoingLight*=mix(.94,1.06,waterNoise(p*.012+3.0));
          outgoingLight=mix(outgoingLight,outgoingLight*1.22+.03,stroke*.5);
          diffuseColor.a=.90;
        }else if(visualWaterEnabled>.5){
          float sparkle=dot(reflectedLight.directSpecular+reflectedLight.indirectSpecular,vec3(.3,.5,.2));
          diffuseColor.a=clamp(mix(.38,.97,visualWaterFresnel)+sparkle,0.0,1.0);
        }
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => key + '-visual-water-3'; material.needsUpdate = true;
    return { material, original };
  });
  return {
    /** `sky` is the filtered sky of the active light, so the sea mirrors it at full strength. */
    set(style: WaterStyle, sky: THREE.Texture | null = null) {
      const plate = style === 'plate', realistic = style === true, styled = plate || realistic;
      enabled.value = plate ? 2 : realistic ? 1 : 0;
      for (const { material, original } of originals) {
        material.color.copy(plate ? new THREE.Color('#3a81a0') : realistic ? new THREE.Color('#0d4a55') : original.color);
        material.roughness = plate ? 1 : realistic ? .09 : original.roughness;
        material.metalness = styled ? 0 : original.metalness;
        material.transparent = styled ? true : original.transparent;
        material.opacity = styled ? 1 : original.opacity;
        material.depthWrite = realistic ? false : original.depthWrite;
        material.envMap = realistic ? sky : plate ? null : original.envMap;
        material.envMapIntensity = realistic ? .34 : original.envMapIntensity;
        material.needsUpdate = true;
      }
    },
    update(dt: number, moving: boolean) { if (moving) time.value += Math.min(dt, .1); }
  };
}
