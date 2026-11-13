import * as THREE from 'three';
import { toWorld } from './geo.mjs';
import { vegetationPlan } from './visual-vegetation-plan.mjs';
import { landscapeSample } from './littoral-plan.mjs';

/**
 * Plant models for the «Realista» style. Everything here is generated locally and is
 * decoration of confidence C: the plaza carobs keep their documented alignment and count,
 * the ambient scrub and trees follow visual-vegetation-plan and can be switched off.
 */
type Species = 'carob' | 'olive' | 'pine';
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const lattice = (x: number, y: number, z: number) => hash(x * 1.31 + y * 57.7 + z * 113.3);
function noise3(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), s = (t: number) => t * t * (3 - 2 * t), fx = s(x - ix), fy = s(y - iy), fz = s(z - iz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t, c = (dx: number, dy: number, dz: number) => lattice(ix + dx, iy + dy, iz + dz);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), fx), l(c(0, 1, 0), c(1, 1, 0), fx), fy), l(l(c(0, 0, 1), c(1, 0, 1), fx), l(c(0, 1, 1), c(1, 1, 1), fx), fy), fz);
}
type Part = { position: number[]; normal: number[]; color: number[]; foliage: number[] };
const emptyPart = (): Part => ({ position: [], normal: [], color: [], foliage: [] });

/** One lumpy leaf mass. Normals lean away from the crown centre so the whole crown shades as one volume. */
function leafBlob(out: Part, center: THREE.Vector3, radius: THREE.Vector3, crown: THREE.Vector3, crownHeight: [number, number], tint: THREE.Color, seed: number, detail = 1) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.getAttribute('position'), v = new THREE.Vector3(), n = new THREE.Vector3(), away = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize(); n.copy(v);
    const lump = .78 + .44 * noise3(v.x * 1.9 + seed, v.y * 1.9 - seed * .7, v.z * 1.9 + seed * 1.3);
    v.multiplyScalar(lump).multiply(radius).add(center);
    away.copy(v).sub(crown).normalize(); n.lerp(away, .55).normalize();
    const lift = THREE.MathUtils.clamp((v.y - crownHeight[0]) / (crownHeight[1] - crownHeight[0]), 0, 1);
    // Baked occlusion: the underside and the inside of the crown receive less sky light.
    const shade = (.56 + .50 * lift) * (.9 + .2 * hash(seed * 3.3 + i * .37));
    out.position.push(v.x, v.y, v.z); out.normal.push(n.x, n.y, n.z); out.color.push(tint.r * shade, tint.g * shade, tint.b * shade); out.foliage.push(1);
  }
  g.dispose();
}
function limb(out: Part, from: THREE.Vector3, to: THREE.Vector3, r0: number, r1: number, bark: THREE.Color, seed: number, sides = 7, rings = 3) {
  const g = new THREE.CylinderGeometry(r1, r0, 1, sides, rings, true).toNonIndexed(), p = g.getAttribute('position'), nn = g.getAttribute('normal');
  const axis = to.clone().sub(from), length = axis.length(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.clone().normalize()), v = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const along = v.y + .5;
    const knot = 1 + .22 * (noise3(v.x * 6 + seed, along * 3.1, v.z * 6 - seed) - .5);
    v.x *= knot; v.z *= knot; v.y *= length; v.applyQuaternion(q).add(from).addScaledVector(axis, .5);
    n.fromBufferAttribute(nn, i).applyQuaternion(q);
    const tone = .72 + .5 * noise3(v.x * 5 + seed, v.y * 2.2, v.z * 5);
    out.position.push(v.x, v.y, v.z); out.normal.push(n.x, n.y, n.z); out.color.push(bark.r * tone, bark.g * tone, bark.b * tone); out.foliage.push(0);
  }
  g.dispose();
}
function finish(part: Part) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(part.position, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(part.normal, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(part.color, 3)); g.setAttribute('foliage', new THREE.Float32BufferAttribute(part.foliage, 1));
  g.computeBoundingSphere(); g.computeBoundingBox(); return g;
}
const leaf = { carob: new THREE.Color('#62803a'), olive: new THREE.Color('#9dab82'), pine: new THREE.Color('#72903f') };
const barkTone = { carob: new THREE.Color('#5c4a38'), olive: new THREE.Color('#6b6253'), pine: new THREE.Color('#70533c') };

/** A tree in metres with its base at the origin. `variant` only changes the silhouette; `detail` is 1 for close trees. */
export function treeGeometry(species: Species, variant = 0, detail = 0) {
  const sides = detail ? 8 : 6, twig = detail ? 5 : 4, rings = detail ? 3 : 1;
  const part = emptyPart(), seed = variant * 17.3 + (species === 'carob' ? 1 : species === 'olive' ? 41 : 83), r = (k: number) => hash(seed + k * 7.9), V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  if (species === 'pine') {
    const top = 6.4 + r(1) * 1.4, lean = V((r(2) - .5) * 1.1, top, (r(3) - .5) * 1.1), mid = lean.clone().multiplyScalar(.55).add(V((r(4) - .5) * .5, 0, (r(5) - .5) * .5));
    limb(part, V(0, -.3, 0), mid, .26, .19, barkTone.pine, seed, sides, rings); limb(part, mid, lean, .19, .11, barkTone.pine, seed + 1, sides, rings);
    const crown = lean.clone().add(V(0, .4, 0)), span: [number, number] = [top - 1.2, top + 2.1];
    for (let i = 0; i < 7; i++) {
      const a = i / 6 * Math.PI * 2 + r(10 + i), ring = i === 6 ? 0 : 1.5 + r(20 + i) * .7, c = crown.clone().add(V(Math.cos(a) * ring, (i === 6 ? 1.0 : .15) + r(30 + i) * .5, Math.sin(a) * ring));
      if (i < 6 && i % 2 === 0) limb(part, lean.clone().multiplyScalar(.82), c.clone().add(V(0, -.35, 0)), .09, .045, barkTone.pine, seed + i, twig, 1);
      leafBlob(part, c, V(1.5 + r(40 + i) * .5, .78 + r(50 + i) * .3, 1.5 + r(60 + i) * .5), crown, span, leaf.pine.clone().offsetHSL((r(70 + i) - .5) * .03, 0, (r(80 + i) - .5) * .07), seed + i * 3.1, detail);
    }
  } else {
    const olive = species === 'olive', trunkTop = olive ? 1.25 + r(1) * .35 : 1.7 + r(1) * .4, fork = V((r(2) - .5) * .35, trunkTop, (r(3) - .5) * .35);
    limb(part, V(0, -.3, 0), fork, olive ? .34 : .3, olive ? .24 : .21, barkTone[species], seed, sides, rings);
    const crownY = trunkTop + (olive ? 1.35 : 1.5), crown = V(fork.x, crownY, fork.z), reach = olive ? 1.35 : 1.75, span: [number, number] = [trunkTop + .1, crownY + (olive ? 1.5 : 1.7)];
    const count = olive ? 8 : 9;
    for (let i = 0; i < count; i++) {
      const top = i >= count - 2, a = i / (count - 2) * Math.PI * 2 + r(10 + i) * .8, ring = top ? r(20 + i) * .5 : reach * (.72 + r(20 + i) * .4);
      const c = crown.clone().add(V(Math.cos(a) * ring, top ? .75 + r(30 + i) * .3 : (r(30 + i) - .45) * .6, Math.sin(a) * ring));
      if (!top && i % 2 === 0) limb(part, fork.clone().add(V(0, -.1, 0)), c.clone().lerp(crown, .25), olive ? .13 : .12, .05, barkTone[species], seed + i, twig, 1);
      const size = (olive ? .95 : 1.22) * (.85 + r(40 + i) * .35);
      leafBlob(part, c, V(size * 1.12, size * (olive ? .8 : .74), size * 1.12), crown, span, leaf[species].clone().offsetHSL((r(70 + i) - .5) * .035, 0, (r(80 + i) - .5) * .08), seed + i * 3.1, detail);
    }
  }
  return finish(part);
}
/** A low mound of scrub about one metre in radius. */
export function shrubGeometry(variant = 0) {
  const part = emptyPart(), seed = 200 + variant * 23.1, r = (k: number) => hash(seed + k * 5.3), crown = new THREE.Vector3(0, .2, 0), white = new THREE.Color(1, 1, 1);
  for (let i = 0; i < 2; i++) {
    const a = r(i) * Math.PI * 2, d = i ? .5 + r(10 + i) * .2 : 0, s = i ? .66 + r(20 + i) * .2 : .92;
    leafBlob(part, new THREE.Vector3(Math.cos(a) * d, .3 + r(30 + i) * .15, Math.sin(a) * d), new THREE.Vector3(s, s * (.62 + r(40 + i) * .18), s), crown, [0, .95], white, seed + i * 2.7, 0);
  }
  return finish(part);
}

/** Leaf texture without bitmaps: dappled light and gaps from world-space noise. */
export function foliageMaterial(material: THREE.MeshStandardMaterial, perVertex: boolean) {
  const before = material.onBeforeCompile, key = material.customProgramCacheKey(), strength = { value: 1 };
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    shader.uniforms.visualFoliage = strength;
    shader.vertexShader = (perVertex ? 'attribute float foliage;' : '') + 'varying vec3 vFoliageW;varying float vFoliage;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `vec4 foliageWorld=vec4(transformed,1.0);
      #ifdef USE_INSTANCING
      foliageWorld=instanceMatrix*foliageWorld;
      #endif
      vFoliageW=(modelMatrix*foliageWorld).xyz;vFoliage=${perVertex ? 'foliage' : '1.0'};
      #include <project_vertex>`);
    shader.fragmentShader = `varying vec3 vFoliageW;varying float vFoliage;uniform float visualFoliage;
      float foliageHash(vec2 p){p=fract(p*vec2(.1031,.1030));p+=dot(p,p.yx+33.33);return fract((p.x+p.y)*p.y);}
      float foliageNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(foliageHash(i),foliageHash(i+vec2(1,0)),f.x),mix(foliageHash(i+vec2(0,1)),foliageHash(i+vec2(1,1)),f.x),f.y);}
    ` + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
      if(visualFoliage>.5){
        vec3 q=vFoliageW*3.4;
        float fade=1.0-smoothstep(.12,.7,length(fwidth(vFoliageW.xz)));
        float leaves=foliageNoise(q.xz+q.y*1.31)*.6+foliageNoise(q.zy*2.3+q.x*.7)*.4;
        float clumps=foliageNoise(vFoliageW.xz*.9+vFoliageW.y*.6);
        float dapple=mix(1.0,mix(.62,1.26,smoothstep(.28,.74,leaves)),fade)*mix(.86,1.12,clumps);
        diffuseColor.rgb*=mix(1.0,dapple,vFoliage);
      }`);
  };
  material.customProgramCacheKey = () => key + '-visual-foliage-1' + (perVertex ? 'v' : 'a'); material.needsUpdate = true;
  return (on: boolean) => { strength.value = on ? 1 : 0; };
}

type PlanInput = { urban: any; littoral: any; housing: any; center: any; landmarks: any; sample: (e: number, n: number) => number | null; origin: { easting: number; northing: number; elevation: number }; radius?: number };
type ResearchPlants = { groups: Map<string, THREE.Group>; data: any; sample: (e: number, n: number) => number | null };
export function makeVegetation(input: PlanInput, carobs?: { group: THREE.Group; trunks: THREE.InstancedMesh }, research?: ResearchPlants | null) {
  const root = new THREE.Group(); root.name = 'Vegetació ambiental · decoració C'; root.visible = false;
  root.userData.geometryConfidence = 'C'; root.userData.basis = 'Decoració ambiental genèrica; cap font situa aquestes plantes.';
  const material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92 }); material.name = 'Vegetació · recurs visual'; foliageMaterial(material, true);
  const shrubMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .95 }); shrubMaterial.name = 'Garriga · recurs visual'; foliageMaterial(shrubMaterial, true);
  const trees = { carob: [0, 1].map(v => treeGeometry('carob', v)), olive: [0, 1].map(v => treeGeometry('olive', v)), pine: [0, 1].map(v => treeGeometry('pine', v)) };
  const layers: { mesh: THREE.InstancedMesh; total: number; coastal: boolean; scrub: boolean }[] = [];
  let context = true, harbour = false, realistic = false, enabled = true, density = 1, built = false, plate = false;
  const instanced = (geometry: THREE.BufferGeometry, m: THREE.Material, count: number, shadow: boolean) => {
    const mesh = new THREE.InstancedMesh(geometry, m, count); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.raycast = () => {}; mesh.frustumCulled = false; return mesh;
  };
  // The sixty plaza carobs: same positions and count as the documentary lollipops they replace.
  const alignment: THREE.Object3D[] = [], documentary: THREE.Object3D[] = carobs ? [...carobs.group.children] : [];
  if (carobs) {
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const sets = [0, 1].map(v => instanced(treeGeometry('carob', v + 2, 1), material, Math.ceil(carobs.trunks.count / 2), true)), used = [0, 0];
    for (let i = 0; i < carobs.trunks.count; i++) {
      carobs.trunks.getMatrixAt(i, m); p.setFromMatrixPosition(m); p.y -= 1.05;
      const v = i % 2, scale = .92 + .16 * hash(i * 3.7);
      sets[v].setMatrixAt(used[v]++, m.compose(p, q.setFromAxisAngle(up, i * 2.4), s.set(scale, scale * (.94 + .12 * hash(i * 9.1)), scale)));
    }
    sets.forEach((mesh, v) => { mesh.count = used[v]; mesh.instanceMatrix.needsUpdate = true; mesh.name = 'Garrofers de la plaça · model realista C'; mesh.visible = false; carobs.group.add(mesh); alignment.push(mesh); });
  }
  // PR01 plants (figs, garden beds, the 1950 olive grove): same documented points, fuller crowns.
  if (research) {
    const d = research.data, m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), tint = new THREE.Color();
    const level = (e: number, n: number) => { const raw = research.sample(e, n); return raw === null ? null : Math.max(.85, landscapeSample(e, n, raw, input.littoral).height); };
    const swap = (id: string, hide: string[], geometry: THREE.BufferGeometry, m0: THREE.Material, points: number[][], scale: number, colour: [number, number, number], name: string) => {
      const group = research.groups.get(id); if (!group) return;
      const placed = points.map(p => ({ p, y: level(p[0], p[1]) })).filter(o => o.y !== null); if (!placed.length) return;
      for (const child of group.children) if (child instanceof THREE.Mesh && hide.includes((child.material as THREE.MeshStandardMaterial).color?.getHexString())) documentary.push(child);
      const mesh = instanced(geometry, m0, placed.length, true); mesh.name = name; mesh.visible = false;
      placed.forEach((o, i) => { const k = scale * (.9 + .2 * hash(o.p[0] + o.p[1] * 1.3)); mesh.setMatrixAt(i, m.compose(new THREE.Vector3(...toWorld(o.p[0], o.p[1], o.y!, input.origin)), q.setFromAxisAngle(up, hash(o.p[0]) * 6.28), s.set(k, k, k))); mesh.setColorAt(i, tint.setRGB(...colour)); });
      group.add(mesh); alignment.push(mesh);
    };
    const figTint: [number, number, number] = [1.12, 1.2, .8], leafHex = '637343', woodHex = '776347';
    if (d.trail?.figs) swap(d.trail.id, [leafHex, woodHex], treeGeometry('carob', 4, 1), material, d.trail.figs, .74, figTint, 'Figueres de la baixada · model realista C');
    if (d.garden) {
      const [ge, gn] = d.garden.center, beds: number[][] = []; for (let row = 0; row < 5; row++) for (let col = 0; col < 4; col++) beds.push([ge + (col - 1.5) * 1.8, gn + (row - 2) * 1.8]);
      swap(d.garden.id, [leafHex], shrubGeometry(5), shrubMaterial, beds, .34, [.36, .5, .2], 'Hort de la raconada · conreu realista C');
      if (d.garden.figs) swap(d.garden.id, [], treeGeometry('carob', 5, 1), material, d.garden.figs, .74, figTint, 'Figueres de l’hort · model realista C');
    }
    if (d.olives) {
      const { rows, cols, spacing, center: [oe, on] } = d.olives, grove: number[][] = [];
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const jitter = ((r * 7 + c * 13) % 5 - 2) * .3; grove.push([oe + (c - (cols - 1) / 2) * spacing + jitter, on + (r - (rows - 1) / 2) * spacing - jitter]); }
      swap(d.olives.id, [leafHex, woodHex], treeGeometry('olive', 3, 1), material, grove, 1.05, [1, 1, 1], 'Camp d’oliveres · model realista C');
    }
  }
  const build = () => {
    built = true;
    const plan = vegetationPlan(input); root.userData.plan = { shrubs: plan.shrubs.length, trees: plan.trees.length, confidence: plan.confidence };
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), color = new THREE.Color();
    const strip = [false, true];
    for (const coastal of strip) for (const species of ['carob', 'olive', 'pine'] as Species[]) for (const v of [0, 1]) {
      const list = plan.trees.filter((t, i) => t.kind === species && i % 2 === v && (t.coast < plan.coastalStrip) === coastal); if (!list.length) continue;
      const mesh = instanced(trees[species][v], material, list.length, true); mesh.name = `Arbres ambientals · ${species} · C`;
      list.forEach((t, i) => mesh.setMatrixAt(i, m.compose(new THREE.Vector3(...toWorld(t.e, t.n, t.height - .12, input.origin)), q.setFromAxisAngle(up, t.angle), s.set(t.scale, t.scale * (.9 + .2 * hash(t.e + t.n)), t.scale))));
      root.add(mesh); layers.push({ mesh, total: list.length, coastal, scrub: false });
    }
    const green = new THREE.Color('#5f7636'), grey = new THREE.Color('#8f966a'), straw = new THREE.Color('#b0a36a');
    for (const coastal of strip) for (const v of [0, 1, 2]) {
      const list = plan.shrubs.filter((b, i) => i % 3 === v && (b.coast < plan.coastalStrip) === coastal); if (!list.length) continue;
      const mesh = instanced(shrubGeometry(v), shrubMaterial, list.length, false); mesh.name = 'Garriga ambiental · C';
      list.forEach((b, i) => {
        mesh.setMatrixAt(i, m.compose(new THREE.Vector3(...toWorld(b.e, b.n, b.height - .08, input.origin)), q.setFromAxisAngle(up, b.angle), s.set(b.scale, b.scale * (.8 + .4 * hash(b.e * 1.7 + b.n)), b.scale)));
        const dry = THREE.MathUtils.clamp(b.dry, 0, 1);
        mesh.setColorAt(i, color.copy(green).lerp(grey, THREE.MathUtils.smoothstep(dry, .25, .7)).lerp(straw, THREE.MathUtils.smoothstep(dry, .78, 1.05) * .7));
      });
      root.add(mesh); layers.push({ mesh, total: list.length, coastal, scrub: true });
    }
    apply();
  };
  const apply = () => {
    for (const mesh of alignment) mesh.visible = realistic; for (const o of documentary) o.visible = !realistic;
    root.visible = realistic && enabled && context;
    if (root.visible && !built) build();
    // The plate draws trees only: scattered scrub would read as ink noise at the scale of a sheet.
    for (const { mesh, total, coastal, scrub } of layers) { mesh.count = Math.max(1, Math.round(total * density)); mesh.visible = !(coastal && harbour) && !(scrub && plate); }
  };
  return {
    root,
    /** Called by the visual style: quality only thins the ambient layer, never the plaza alignment. */
    set(isRealistic: boolean, quality: number, on: boolean, isPlate = false) { realistic = isRealistic; density = THREE.MathUtils.clamp(quality, .05, 1); enabled = on; plate = isPlate; apply(); },
    /**
     * The ambient layer belongs to the interpreted landscape; the measured terrain shows none.
     * Once a georeferenced harbour phase replaces the 1800 shore, the plants of that strip are hidden.
     */
    setContext(interpreted: boolean, harbourPhase = false) { context = interpreted; harbour = harbourPhase; apply(); }
  };
}
