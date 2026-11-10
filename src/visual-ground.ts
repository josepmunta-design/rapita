import * as THREE from 'three';

/**
 * Realistic ground shading for the «Realista» style. Colour only: it never displaces
 * vertices, never changes the water level and never moves the shoreline. The palette is
 * a generic dry Mediterranean interpretation (C), not a land-use map of 1800.
 */
export const groundRealism = {
  time: { value: 0 },
  waterLevel: { value: 0 }
};

/** Sinless hash noise for the realistic branch; the documentary grain keeps its own functions. */
export const terraNoiseGLSL = /* glsl */`
  float terraHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
  float terraNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(terraHash(i),terraHash(i+vec2(1,0)),f.x),mix(terraHash(i+vec2(0,1)),terraHash(i+vec2(1,1)),f.x),f.y);}
  float terraFbm(vec2 p){float v=0.0,a=.5;for(int i=0;i<4;i++){v+=a*terraNoise(p);p=p*2.03+vec2(11.7,5.3);a*=.5;}return v/.9375;}
  float terraRelief(vec2 p){return terraNoise(p*1.1)+.5*terraNoise(p*2.9+7.0)+.25*terraNoise(p*6.7+3.0);}
`;

/** Replaces the vertex colour with soil, dry grass, scrub, rock, wet sand and seabed tones. */
export const groundColorGLSL = /* glsl */`
  if(groundRealismStrength>.5){
    vec2 gxz=vGroundW.xz;
    float gfw=length(fwidth(gxz));
    float fadeFine=1.0-smoothstep(.25,1.4,gfw),fadeClump=1.0-smoothstep(2.5,14.0,gfw);
    vec3 base=diffuseColor.rgb;
    float landness=smoothstep(.004,.045,base.g-base.r);
    float slope=1.0-clamp(normalize(vGroundN).y,0.0,1.0);
    float alt=vGroundW.y;
    float macro=terraFbm(gxz*.0036);
    float meso=terraFbm(gxz*.021+17.0);
    float clump=mix(.5,terraFbm(gxz*.11+41.0),fadeClump);
    float fine=mix(.5,terraNoise(gxz*1.3),fadeFine);
    float grain=mix(.5,terraNoise(gxz*7.0),grainFade);
    float hill=smoothstep(14.0,95.0,alt);
    vec3 soil=mix(vec3(.34,.235,.13),vec3(.49,.37,.215),macro);
    vec3 straw=mix(vec3(.46,.40,.17),vec3(.33,.33,.13),meso);
    vec3 scrub=mix(vec3(.105,.15,.055),vec3(.21,.245,.10),clump);
    vec3 rock=mix(vec3(.30,.285,.25),vec3(.44,.42,.37),fine);
    float grassCover=smoothstep(.30,.60,meso*.62+macro*.38);
    float scrubEdge=.54-.20*hill;
    float scrubCover=smoothstep(scrubEdge,scrubEdge+.13,clump*.58+meso*.42+(fine-.5)*.08);
    vec3 land=mix(soil,straw,grassCover*.85);
    // Tussocks a few metres apart keep open ground from reading as bare sand.
    float tuft=smoothstep(.58,.80,terraNoise(gxz*.62+5.0))*fadeFine;
    land=mix(land,mix(vec3(.25,.27,.10),vec3(.38,.35,.14),clump),tuft*(.35+.4*grassCover));
    land=mix(land,scrub*(.78+.44*fine),scrubCover*(.74+.2*hill));
    float rockCover=smoothstep(.22,.5,slope+(clump-.5)*.22)*smoothstep(4.0,30.0,alt+slope*60.0);
    land=mix(land,rock,rockCover*.85);
    land*=(.90+.20*fine)*(1.0+.26*(grain-.5));
    // Streets, the plaza and yards are trodden earth: kept paler than open soil so the plan still reads.
    vec3 other=base*mix(1.22,1.0,smoothstep(.44,.6,base.r))*mix(vec3(.92,.89,.84),vec3(1.06,1.01,.93),meso)*(.94+.12*fine)*(1.0+.16*(grain-.5));
    vec3 groundColor=mix(other,land,landness);
    float depth=groundWaterLevel-alt;
    // A damp strand just above the waterline; the level itself is untouched.
    groundColor*=mix(1.0,.60,(1.0-smoothstep(.03,.42,-depth))*(1.0-landness*.6));
    if(depth>0.0){
      vec3 bed=mix(vec3(.50,.46,.33),vec3(.64,.58,.42),meso)*(.9+.2*fine);
      float ca=terraNoise(gxz*.55+groundTime*vec2(.21,.13)),cb=terraNoise(gxz*.83-groundTime*vec2(.17,-.19));
      float caustic=pow(1.0-abs(ca-cb),8.0)*fadeFine*exp(-depth*.45);
      vec3 absorb=exp(-depth*vec3(.62,.17,.13));
      vec3 deep=vec3(.012,.105,.15);
      groundColor=mix(deep,bed*absorb*(1.0+caustic*.9),exp(-depth*.40));
    }
    diffuseColor.rgb=groundColor;
  }
`;

/** Small relief on dry land so raking light reads as rough earth instead of a painted plane. */
export const groundNormalGLSL = /* glsl */`
  if(groundRealismStrength>.5&&vGroundW.y>groundWaterLevel+.02){
    vec2 gp=vGroundW.xz;
    float gf=1.0-smoothstep(.12,.9,length(fwidth(gp)));
    if(gf>.01){
      float g0=terraRelief(gp),gx=terraRelief(gp+vec2(.22,0.0)),gz=terraRelief(gp+vec2(0.0,.22));
      normal=normalize(normal+mat3(viewMatrix)*vec3(g0-gx,0.0,g0-gz)*(.85*gf));
    }
  }
`;

/**
 * Interpreted terrain is stored triangle by triangle, so its own normals are faceted.
 * This adds a second, averaged normal used only by the realistic style; positions,
 * indices and the original normals stay exactly as they were.
 */
export function addSmoothNormals(geometry: THREE.BufferGeometry) {
  if (geometry.index || geometry.getAttribute('smoothNormal')) return false;
  const position = geometry.getAttribute('position'), a = position.array as Float32Array, count = position.count;
  const ids = new Uint32Array(count), seen = new Map<number, number>(), sums = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // Shared corners of a height field coincide in plan; 5 cm cells keep the key exact.
    const key = Math.round((a[i * 3] + 40000) * 20) * 2097152 + Math.round((a[i * 3 + 2] + 40000) * 20);
    let id = seen.get(key); if (id === undefined) { id = seen.size; seen.set(key, id); } ids[i] = id;
  }
  for (let i = 0; i + 2 < count; i += 3) {
    const ax = a[i * 3], ay = a[i * 3 + 1], az = a[i * 3 + 2], ux = a[i * 3 + 3] - ax, uy = a[i * 3 + 4] - ay, uz = a[i * 3 + 5] - az, vx = a[i * 3 + 6] - ax, vy = a[i * 3 + 7] - ay, vz = a[i * 3 + 8] - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    for (let k = 0; k < 3; k++) { const id = ids[i + k] * 3; sums[id] += nx; sums[id + 1] += ny; sums[id + 2] += nz; }
  }
  const out = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const id = ids[i] * 3, x = sums[id], y = sums[id + 1], z = sums[id + 2], l = Math.hypot(x, y, z) || 1;
    out[i * 3] = x / l; out[i * 3 + 1] = y / l; out[i * 3 + 2] = z / l;
  }
  geometry.setAttribute('smoothNormal', new THREE.BufferAttribute(out, 3)); return true;
}
