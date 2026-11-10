import * as THREE from 'three';
import { foliageMaterial } from './visual-vegetation.ts';

export type SurfaceKind = 'lime' | 'masonry' | 'brick' | 'tile' | 'wood';
type SurfaceMaps = { map: THREE.DataTexture; bumpMap: THREE.DataTexture; roughnessMap: THREE.DataTexture };
/** Texel size of the generated maps. One tile covers two to three metres of wall or roof. */
export const SURFACE_SIZE = 512;
const S = SURFACE_SIZE;
const cache = new Map<SurfaceKind, SurfaceMaps>();
const fract = (n: number) => n - Math.floor(n);
const hash = (x: number, y: number) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
const lerp = THREE.MathUtils.lerp;
// Periodic value noise keeps tile boundaries seamless at every octave.
function noise(u: number, v: number, cells: number) {
  const x = u * cells, y = v * cells, ix = Math.floor(x), iy = Math.floor(y);
  const sx = fract(x), sy = fract(y), a = sx * sx * (3 - 2 * sx), b = sy * sy * (3 - 2 * sy);
  const h = (x: number, y: number) => hash((x + cells) % cells, (y + cells) % cells);
  return lerp(lerp(h(ix, iy), h(ix + 1, iy), a), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), a), b);
}
const cloud = (u: number, v: number, cells: number) => noise(u, v, cells) * .5 + noise(u, v, cells * 2) * .3 + noise(u, v, cells * 4) * .2;
const mix3 = (a: number[], b: number[], t: number) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
function dataTexture(bytes: Uint8Array, color: boolean) {
  const t = new THREE.DataTexture(bytes, S, S);
  t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true; t.needsUpdate = true;
  return t;
}
/** Rubble masonry: periodic jittered cells; returns the stone id and the distance to its joint. */
function stones(u: number, v: number, cols: number, rows: number) {
  const x = u * cols, y = v * rows, ix = Math.floor(x), iy = Math.floor(y); let d1 = 9, d2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = ix + i, cy = iy + j, kx = (cx + cols) % cols, ky = (cy + rows) % rows;
    // Courses stay roughly level: less vertical than horizontal jitter.
    const px = cx + .5 + (hash(kx, ky) - .5) * .8, py = cy + .5 + (hash(kx + 31, ky + 17) - .5) * .38;
    const d = Math.hypot((x - px) * 1.0, (y - py) * 1.25);
    if (d < d1) { d2 = d1; d1 = d; id = kx * 57 + ky; } else if (d < d2) d2 = d;
  }
  return { id, edge: d2 - d1 };
}
/** Shared local PBR maps. These are visual interpretations, not sampled historic finishes. */
export function visualSurface(kind: SurfaceKind): SurfaceMaps {
  const prior = cache.get(kind); if (prior) return prior;
  const albedo = new Uint8Array(S * S * 4), bump = new Uint8Array(S * S * 4), rough = new Uint8Array(S * S * 4);
  const put = (bytes: Uint8Array, i: number, values: number[]) => { bytes[i] = Math.max(0, Math.min(255, Math.round(values[0]))); bytes[i + 1] = Math.max(0, Math.min(255, Math.round(values[1]))); bytes[i + 2] = Math.max(0, Math.min(255, Math.round(values[2]))); bytes[i + 3] = 255; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const u = x / S, v = y / S, broad = cloud(u, v, 4), medium = noise(u, v, 24), fine = noise(u, v, 96), grain = hash(x, y);
    let rgb = [222, 216, 201], height = 130, r = 235;
    if (kind === 'lime') {
      // Limewash over render: soft patches, a little soot and a fine sandy grain.
      const tone = (broad - .5) * 30 + (medium - .5) * 12 + (fine - .5) * 8 + (grain - .5) * 5, patch = THREE.MathUtils.smoothstep(broad, .62, .8);
      rgb = mix3([236 + tone, 228 + tone, 208 + tone], [214 + tone, 198 + tone, 170 + tone], patch * .55);
      height = 128 + fine * 30 + grain * 10 - patch * 14; r = 226 + broad * 24;
    } else if (kind === 'brick') {
      // Thin handmade brick, about 30 × 12 cm on a two-metre tile, in lime mortar.
      const rows = 16, cols = 6, row = Math.floor(v * rows), across = u * cols + (row % 2) * .5 + (hash(row, 3) - .5) * .12;
      const bx = (Math.floor(across) + cols) % cols, fx = fract(across), fy = fract(v * rows), jointY = Math.min(fy, 1 - fy), jointX = Math.min(fx, 1 - fx);
      const joint = jointY < .085 || jointX < .028, pick = hash(bx + 3, row + 11), burn = hash(bx + 41, row + 5);
      const brick = mix3(mix3([150, 88, 60], [192, 126, 86], pick), [116, 78, 62], burn > .86 ? .7 : 0), wear = THREE.MathUtils.smoothstep(Math.min(jointY * 3.2, jointX * 12), 0, .5);
      const tone = (fine - .5) * 22 + (medium - .5) * 12 + (grain - .5) * 8;
      rgb = joint ? [198 + (broad - .5) * 26 + (grain - .5) * 12, 187 + (broad - .5) * 26 + (grain - .5) * 12, 162 + (broad - .5) * 24] : brick.map((c, i) => c * (.86 + .14 * wear) + tone * (i ? .7 : 1));
      height = joint ? 78 + grain * 14 : 150 + wear * 26 + fine * 22; r = joint ? 246 : 218 + fine * 26;
    } else if (kind === 'masonry') {
      // Coursed limestone rubble with wide lime joints.
      const cell = stones(u, v, 5, 9), joint = cell.edge < .07, pick = hash(cell.id, 7), grey = hash(cell.id, 19);
      const stone = mix3(mix3([186, 170, 138], [222, 208, 176], pick), [176, 172, 160], grey > .7 ? .6 : 0), bevel = THREE.MathUtils.smoothstep(cell.edge, .07, .3);
      const tone = (fine - .5) * 20 + (medium - .5) * 16 + (grain - .5) * 8;
      rgb = joint ? [168 + (broad - .5) * 24, 157 + (broad - .5) * 24, 132 + (broad - .5) * 22] : stone.map(c => c * (.84 + .16 * bevel) + tone);
      height = joint ? 62 + grain * 12 : 120 + bevel * 70 + fine * 24 + pick * 18; r = joint ? 248 : 214 + fine * 30;
    } else if (kind === 'tile') {
      // Arab barrel tiles: alternating covers and channels, laid in overlapping courses.
      const cols = 10, rows = 5, col = Math.floor(u * cols), fx = fract(u * cols), course = v * rows + hash(col, 2) * .35, rowId = Math.floor(course) % rows, fy = fract(course);
      const cover = fx < .56, profile = cover ? Math.sin(fx / .56 * Math.PI) : .22 * (1 - Math.sin((fx - .56) / .44 * Math.PI)), lap = fy < .07;
      const pick = hash(col * 2 + (cover ? 0 : 1), rowId + 23), pale = hash(col + 9, rowId * 3 + (cover ? 5 : 2));
      let clay = mix3(mix3([164, 94, 62], [206, 130, 88], pick), [220, 170, 126], pale > .8 ? .75 : 0);
      clay = mix3(clay, [150, 140, 112], THREE.MathUtils.smoothstep(broad, .58, .82) * .45).map(c => c * (cover ? .9 + .14 * profile : .66 + .5 * profile) * (1 - .1 * fy));
      const tone = (fine - .5) * 18 + (grain - .5) * 8;
      rgb = lap ? clay.map(c => c * .62) : clay.map((c, i) => c + tone * (i ? .7 : 1));
      height = lap ? 40 + profile * 60 : 70 + profile * 150 + (1 - fy) * 22 + fine * 8; r = 206 + broad * 36;
    } else if (kind === 'wood') {
      // Weathered boards with open joints; grain runs along v.
      const planks = 6, plank = Math.floor(u * planks), fx = fract(u * planks), gap = Math.min(fx, 1 - fx) < .03;
      const fibre = Math.sin((u * 46 + Math.sin(v * Math.PI * 2 + plank) * .35 + noise(u, v, 12) * 1.4) * Math.PI * 2) * 9;
      const tone = fibre + (broad - .5) * 26 + (hash(plank, 5) - .5) * 30 + (grain - .5) * 8;
      rgb = gap ? [52, 40, 30] : [138 + tone, 110 + tone * .85, 80 + tone * .7]; height = gap ? 50 : 126 + fibre * 2.4 + fine * 14; r = 214 + broad * 32;
    }
    const i = (y * S + x) * 4; put(albedo, i, rgb); put(bump, i, [height, height, height]); put(rough, i, [r, r, r]);
  }
  const result = { map: dataTexture(albedo, true), bumpMap: dataTexture(bump, false), roughnessMap: dataTexture(rough, false) };
  cache.set(kind, result); return result;
}

const weathering = { value: 0 };
const weathered = new WeakSet<THREE.Material>();
/**
 * World-space ageing for built surfaces: broad stains, rain streaks on walls and uneven roofs.
 * Albedo only, driven by one shared uniform, so toggling the style never recompiles or moves anything.
 * It is a generic patina (C), not a record of the condition of any building.
 */
export function weatherMaterial(material: THREE.MeshStandardMaterial) {
  if (weathered.has(material)) return; weathered.add(material);
  const before = material.onBeforeCompile, key = material.customProgramCacheKey();
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    shader.uniforms.visualWeathering = weathering;
    shader.vertexShader = 'varying vec3 vWeatherW;varying vec3 vWeatherN;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <beginnormal_vertex>', `#include <beginnormal_vertex>
      vec3 weatherNormal=objectNormal;
      #ifdef USE_INSTANCING
      weatherNormal=mat3(instanceMatrix)*weatherNormal;
      #endif
      vWeatherN=mat3(modelMatrix)*weatherNormal;`);
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `vec4 weatherWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      weatherWorld=instanceMatrix*weatherWorld;
      #endif
      vWeatherW=(modelMatrix*weatherWorld).xyz;
      #include <project_vertex>`);
    shader.fragmentShader = `varying vec3 vWeatherW;varying vec3 vWeatherN;uniform float visualWeathering;
      float weatherHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
      float weatherNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(weatherHash(i),weatherHash(i+vec2(1,0)),f.x),mix(weatherHash(i+vec2(0,1)),weatherHash(i+vec2(1,1)),f.x),f.y);}
      float weatherFbm(vec2 p){return weatherNoise(p)*.55+weatherNoise(p*2.1+9.0)*.30+weatherNoise(p*4.3+3.0)*.15;}
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if(visualWeathering>.5){
        vec3 wn=normalize(vWeatherN);
        float wall=smoothstep(.55,.9,1.0-abs(wn.y));
        // Unwrap walls along their own direction; flat faces use the plan position.
        vec2 along=abs(wn.x)>abs(wn.z)?vec2(vWeatherW.z,vWeatherW.y):vec2(vWeatherW.x,vWeatherW.y);
        vec2 uvw=mix(vWeatherW.xz,along,wall);
        float fade=1.0-smoothstep(.5,3.0,length(fwidth(uvw)));
        float stain=weatherFbm(uvw*.21+dot(wn.xz,vec2(3.1,7.7)));
        float streak=weatherNoise(vec2(uvw.x*2.6,uvw.y*.22+4.0));
        float speck=mix(.5,weatherNoise(uvw*5.5),fade);
        float tone=mix(.76,1.10,stain)*mix(1.0,.90+.16*streak,wall)*(.94+.12*speck);
        vec3 tint=mix(vec3(1.04,1.0,.93),vec3(.93,.96,.98),weatherNoise(uvw*.07+21.0));
        diffuseColor.rgb*=tone*tint;
      }`);
  };
  material.customProgramCacheKey = () => key + '-visual-weather-1'; material.needsUpdate = true;
}

/** Swap only material properties, keeping mesh identity, phases and transforms intact. */
export function makeSurfaceStyles(root: THREE.Object3D | THREE.Object3D[], skip: Set<THREE.Material> = new Set()) {
  const originals = new Map<THREE.MeshStandardMaterial, { map: THREE.Texture | null; bumpMap: THREE.Texture | null; roughnessMap: THREE.Texture | null; bumpScale: number; roughness: number }>();
  let aged = 0; const leaves: ((on: boolean) => void)[] = [];
  for (const r of Array.isArray(root) ? root : [root]) r.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      if (!(m instanceof THREE.MeshStandardMaterial) || skip.has(m) || m.transparent) continue;
      // Untextured green materials are the documentary plants: they get leaf dapple, not wall stains.
      if (!m.map && !m.vertexColors && m.color.g > m.color.r * 1.06 && m.color.g > m.color.b * 1.25) { if (!weathered.has(m)) { weathered.add(m); leaves.push(foliageMaterial(m, false)); } continue; }
      if (!weathered.has(m)) { weatherMaterial(m); aged++; }
      if (!m.userData.surfaceKind || originals.has(m)) continue;
      originals.set(m, { map: m.map, bumpMap: m.bumpMap, roughnessMap: m.roughnessMap, bumpScale: m.bumpScale, roughness: m.roughness });
    }
  });
  return {
    count: originals.size, weathered: aged,
    set(realistic: boolean, anisotropy = 4) {
      weathering.value = realistic ? 1 : 0;
      for (const set of leaves) set(realistic);
      for (const [m, original] of originals) {
        if (realistic) {
          const maps = visualSurface(m.userData.surfaceKind);
          for (const t of Object.values(maps)) if (t.anisotropy !== anisotropy) { t.anisotropy = anisotropy; t.needsUpdate = true; }
          Object.assign(m, maps); m.roughness = 1; m.bumpScale = m.userData.surfaceKind === 'tile' ? .07 : m.userData.surfaceKind === 'masonry' ? .045 : m.userData.surfaceKind === 'brick' ? .03 : m.userData.surfaceKind === 'wood' ? .02 : .012;
        } else Object.assign(m, original);
        m.needsUpdate = true;
      }
    }
  };
}
