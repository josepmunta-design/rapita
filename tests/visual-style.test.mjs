import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { makeHousing } from '../src/housing.ts';
import { makeSurfaceStyles, visualSurface, SURFACE_SIZE } from '../src/visual-materials.ts';
import { makeWaterStyle } from '../src/visual-water.ts';
import { frameStatistics, visualSettings, lightProfiles, qualityProfiles, sunDirection } from '../src/visual-plan.mjs';
import { addSmoothNormals } from '../src/visual-ground.ts';
import { makeVegetation, treeGeometry, shrubGeometry } from '../src/visual-vegetation.ts';
import { vegetationPlan, scrubCover } from '../src/visual-vegetation-plan.mjs';
import { sampleHeight, toWorld } from '../src/geo.mjs';
import { landscapeSample, nearestRoute, coastDistance } from '../src/littoral-plan.mjs';
import { worldToTown, isPublicGround } from '../src/center-plan.mjs';
import { footprintBlocked } from '../src/walk-plan.mjs';
const json = async name => JSON.parse(await readFile(new URL('../public/data/' + name, import.meta.url), 'utf8'));

test('switching surface styles preserves the real housing geometry, openings, collisions, phases and original material references', async () => {
  const data = await json('housing.json'), meta = await json('town-terrain.json');
  const raw = await readFile(new URL('../public/data/' + meta.heights, import.meta.url));
  const h = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength));
  const v = await readFile(new URL('../public/data/' + meta.validity, import.meta.url));
  const inputs = JSON.stringify(data), heightHash = createHash('sha256').update(raw).digest('hex');
  const root = makeHousing(data, meta, h, v); root.updateMatrixWorld(true);
  const materials = new Map();
  root.traverse(o => { if (o.isMesh) for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m.userData.surfaceKind) materials.set(m, { map: m.map, bumpMap: m.bumpMap, roughnessMap: m.roughnessMap, roughness: m.roughness, bumpScale: m.bumpScale, hook: m.onBeforeCompile, color: m.color.toArray() }); });
  const metadata = value => value?.isObject3D ? { uuid: value.uuid } : Array.isArray(value) ? value.map(metadata) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k,v]) => [k,metadata(v)])) : value;
  const fingerprint = () => {
    const hash = createHash('sha256');
    root.updateMatrixWorld(true);
    root.traverse(o => {
      hash.update(JSON.stringify([o.uuid, o.visible, o.matrixWorld.elements, metadata(o.userData)]));
      if (o.geometry) for (const a of [...Object.values(o.geometry.attributes), ...(o.geometry.index ? [o.geometry.index] : [])]) hash.update(Buffer.from(a.array.buffer, a.array.byteOffset, a.array.byteLength));
      if (o.instanceMatrix) hash.update(Buffer.from(o.instanceMatrix.array.buffer));
    }); return hash.digest('hex');
  };
  const before = fingerprint(), styles = makeSurfaceStyles(root); assert.ok(styles.count >= 5); assert.ok(styles.weathered >= styles.count);
  // The patina hook is installed once and then driven by a uniform: toggling never swaps shaders.
  const hooks = new Map([...materials.keys()].map(m => [m, m.onBeforeCompile]));
  for (const [m, original] of materials) assert.notEqual(m.onBeforeCompile, original.hook);
  assert.equal(fingerprint(), before);
  for (let i = 0; i < 3; i++) {
    styles.set(true, 4); assert.equal(fingerprint(), before);
    for (const [m, original] of materials) { assert.notEqual(m.map, original.map); assert.ok(m.roughnessMap); assert.equal(m.onBeforeCompile, hooks.get(m)); assert.deepEqual(m.color.toArray(), original.color); }
    styles.set(false);
    assert.equal(fingerprint(), before);
    for (const [m, original] of materials) { for (const key of ['map', 'bumpMap', 'roughnessMap', 'roughness', 'bumpScale']) assert.equal(m[key], original[key]); assert.equal(m.onBeforeCompile, hooks.get(m)); }
  }
  assert.equal(JSON.stringify(data), inputs); assert.equal(createHash('sha256').update(Buffer.from(h.buffer)).digest('hex'), heightHash);
});

test('five shared PBR surfaces have correctly separated color and data maps without network resources', () => {
  for (const kind of ['lime', 'masonry', 'brick', 'tile', 'wood']) {
    const maps = visualSurface(kind); assert.equal(maps, visualSurface(kind));
    for (const [key, t] of Object.entries(maps)) {
      assert.equal(t.image.width, SURFACE_SIZE); assert.equal(t.image.height, SURFACE_SIZE); assert.equal(t.image.data.length, SURFACE_SIZE * SURFACE_SIZE * 4);
      // Seamless tiles: the first and last texel columns must not differ like unrelated noise.
      if (key === 'map' && kind === 'lime') { let jump = 0; for (let y = 0; y < SURFACE_SIZE; y++) jump += Math.abs(t.image.data[y * SURFACE_SIZE * 4] - t.image.data[(y * SURFACE_SIZE + SURFACE_SIZE - 1) * 4]); assert.ok(jump / SURFACE_SIZE < 12); }
      assert.equal(t.colorSpace, key === 'map' ? THREE.SRGBColorSpace : THREE.NoColorSpace);
      assert.equal(t.wrapS, THREE.RepeatWrapping); assert.equal(t.generateMipmaps, true);
    }
  }
});

test('water style restores the original physical properties and keeps the sea geometry and previous shader hook', () => {
  const material = new THREE.MeshStandardMaterial({ color: '#4c8e91', roughness: .33, metalness: .14 });
  material.onBeforeCompile = shader => { shader.uniforms.existing = { value: 1 }; };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(40, 50), material), geometry = mesh.geometry.toJSON();
  const original = { color: material.color.toArray(), roughness: material.roughness, metalness: material.metalness, transparent: material.transparent, depthWrite: material.depthWrite, envMap: material.envMap, envMapIntensity: material.envMapIntensity };
  const sky = new THREE.Texture(), water = makeWaterStyle([material, material]); water.set(true, sky);
  assert.equal(material.transparent, true); assert.equal(material.depthWrite, false); assert.equal(material.envMap, sky); assert.equal(material.metalness, 0);
  const shader = { vertexShader: THREE.ShaderLib.standard.vertexShader, fragmentShader: THREE.ShaderLib.standard.fragmentShader, uniforms: {} };
  material.onBeforeCompile(shader, null);
  assert.equal(shader.uniforms.existing.value, 1); assert.equal(shader.uniforms.visualWaterEnabled.value, 1);
  water.update(.05, false); assert.equal(shader.uniforms.visualWaterTime.value, 0);
  water.update(.05, true); assert.equal(shader.uniforms.visualWaterTime.value, .05);
  water.set(false); assert.equal(shader.uniforms.visualWaterEnabled.value, 0);
  assert.deepEqual(material.color.toArray(), original.color); for (const key of ['roughness', 'metalness', 'transparent', 'depthWrite', 'envMap', 'envMapIntensity']) assert.equal(material[key], original[key]);
  assert.ok(shader.fragmentShader.includes('visualWaterFresnel') && shader.fragmentShader.includes('#include <opaque_fragment>'));
  assert.deepEqual(mesh.geometry.toJSON(), geometry); assert.equal(mesh.material, material);
});

test('visual settings reject unknown profiles and timings report real frame percentiles', () => {
  assert.deepEqual(visualSettings({ mode: 'invalid', quality: '__proto__', light: 'constructor' }), { mode: 'realista', quality: 'mitja', light: 'tarda', atmosphere: true, vegetation: true });
  assert.equal(visualSettings({ vegetation: false, atmosphere: false, light: 'mati' }).vegetation, false); assert.equal(visualSettings({ light: 'mati' }).light, 'mati');
  assert.equal(frameStatistics([]), null);
  const stats = frameStatistics([NaN, -1, 0, 10, 20, 30, 60]);
  assert.equal(stats.samples, 4); assert.equal(stats.medianMs, 20); assert.equal(stats.p95Ms, 60); assert.equal(stats.fps, 50); assert.equal(stats.longFrameRatio, .25);
});

test('light profiles place the sun above the horizon on a compass bearing and scale the ambient layer by quality', () => {
  const close = (a, b) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9));
  close(sunDirection(90, 0), [1, 0, 0]); close(sunDirection(180, 0), [0, 0, 1]); close(sunDirection(0, 90), [0, 1, 0]);
  for (const p of Object.values(lightProfiles)) {
    assert.ok(p.elevation > 5 && p.elevation < 80); assert.ok(Math.abs(Math.hypot(...p.direction) - 2000) < 1e-6); assert.ok(p.direction[1] > 0);
    // Morning light comes from the east and afternoon light from the west.
    for (const key of ['intensity', 'ambient', 'environment', 'exposure', 'fog', 'turbidity', 'rayleigh', 'clouds']) assert.ok(Number.isFinite(p[key]) && p[key] > 0);
  }
  assert.ok(lightProfiles.mati.direction[0] > 0); assert.ok(lightProfiles.tarda.direction[0] < 0);
  assert.ok(qualityProfiles.baix.vegetation < qualityProfiles.mitja.vegetation && qualityProfiles.mitja.vegetation < qualityProfiles.alta.vegetation); assert.equal(qualityProfiles.alta.vegetation, 1);
});

test('averaged terrain normals are an extra attribute: positions, colours and the faceted normals are untouched', () => {
  // Two triangles sharing an edge, stored corner by corner like the interpreted landscape.
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0,0,0, 10,0,0, 0,0,10, 10,0,0, 10,4,10, 0,0,10], 3)); g.computeVertexNormals();
  const position = [...g.getAttribute('position').array], normal = [...g.getAttribute('normal').array];
  assert.equal(addSmoothNormals(g), true); assert.equal(addSmoothNormals(g), false);
  assert.deepEqual([...g.getAttribute('position').array], position); assert.deepEqual([...g.getAttribute('normal').array], normal);
  const smooth = g.getAttribute('smoothNormal'); assert.equal(smooth.count, 6);
  for (let i = 0; i < 6; i++) { assert.ok(Math.abs(Math.hypot(smooth.getX(i), smooth.getY(i), smooth.getZ(i)) - 1) < 1e-5); assert.ok(smooth.getY(i) > 0); }
  // Corners 1 and 3 coincide, as do 2 and 5: they must now share one shading normal.
  for (const [a, b] of [[1, 3], [2, 5]]) for (const axis of ['getX', 'getY', 'getZ']) assert.equal(smooth[axis](a), smooth[axis](b));
  assert.notDeepEqual([smooth.getX(0), smooth.getY(0), smooth.getZ(0)], [smooth.getX(4), smooth.getY(4), smooth.getZ(4)]);
  const indexed = new THREE.PlaneGeometry(2, 2); assert.equal(addSmoothNormals(indexed), false); assert.equal(indexed.getAttribute('smoothNormal'), undefined);
});

const arrays = async meta => { const b = await readFile(new URL('../public/data/' + meta.heights, import.meta.url)), v = await readFile(new URL('../public/data/' + meta.validity, import.meta.url)); return [new Float32Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)), v]; };
async function vegetationInput() {
  const [housing, center, urban, littoral, landmarks, meta, town, region] = await Promise.all(['housing.json', 'center.json', 'urban-fabric.json', 'littoral.json', 'landmarks.json', 'terrain.json', 'town-terrain.json', 'context.json'].map(json));
  const [h, v] = await arrays(meta), [th, tv] = await arrays(town), [rh, rv] = await arrays(region);
  const sample = (e, n) => sampleHeight(town, th, tv, e, n) ?? sampleHeight(meta, h, v, e, n) ?? sampleHeight(region, rh, rv, e, n);
  return { urban, littoral, housing, center, landmarks, sample, origin: meta.origin };
}

test('ambient vegetation is reproducible decoration C that avoids buildings, streets, the plaza, plots, the canal and the shore', async () => {
  const input = await vegetationInput(), data = JSON.stringify([input.urban, input.littoral, input.housing, input.center, input.landmarks]);
  const plan = vegetationPlan(input); assert.deepEqual(plan, vegetationPlan(input));
  assert.equal(plan.confidence, 'C'); assert.ok(plan.shrubs.length > 2000 && plan.shrubs.length < 12000); assert.ok(plan.trees.length > 400 && plan.trees.length < 2500);
  assert.deepEqual([...new Set(plan.trees.map(t => t.kind))].sort(), ['carob', 'olive', 'pine']);
  const { urban, littoral, housing, center } = input, frame = housing.townFrame;
  const footprints = [...housing.structures.map(s => s.footprintUTM), ...center.sites.map(s => s.footprintUTM), ...urban.sites.map(s => s.footprintUTM)].filter(Boolean);
  for (const plant of [...plan.shrubs, ...plan.trees]) {
    assert.ok(Object.values(plant).every(value => typeof value === 'string' || Number.isFinite(value)));
    const raw = input.sample(plant.e, plant.n); assert.notEqual(raw, null);
    assert.equal(landscapeSample(plant.e, plant.n, raw, littoral).zone, 'land'); assert.ok(plant.height > littoral.studyWaterElevation + .7);
    assert.ok(coastDistance(plant.e, plant.n, littoral) >= 30); assert.equal(plant.coast, coastDistance(plant.e, plant.n, littoral));
    assert.equal(footprintBlocked(plant.e, plant.n, footprints, .9), false);
    const t = worldToTown(plant.e, plant.n, frame); assert.equal(isPublicGround(t.across, t.along, center.publicSpace), false);
    // The new town itself stays clear: its low detail belongs to the existing environment layer.
    assert.equal(Math.abs(t.across + 15) < 232 && Math.abs(t.along + 4) < 200, false);
    for (const road of urban.routes) assert.ok(nearestRoute(plant.e, plant.n, road.points).distance >= road.width / 2 + 2.2);
    assert.ok(nearestRoute(plant.e, plant.n, littoral.canal.routeStudy).distance >= littoral.canal.studyWidth / 2 + 9);
    assert.ok(Math.hypot(plant.e - frame.easting, plant.n - frame.northing) < 1500);
  }
  for (const tree of plan.trees) assert.equal(footprintBlocked(tree.e, tree.n, footprints, 3.6), false);
  // Scrub follows the patches painted by the ground shader, so it is denser where cover is high.
  const cover = plan.shrubs.map(b => scrubCover(b.e - input.origin.easting, input.origin.northing - b.n, input.sample(b.e, b.n)));
  assert.ok(cover.filter(c => c > .5).length > cover.length * .6);
  // Thinning by quality keeps the first N plants, so the order must not sweep the map.
  const half = plan.shrubs.slice(0, plan.shrubs.length >> 1), mean = list => list.reduce((sum, b) => sum + b.e, 0) / list.length;
  assert.ok(Math.abs(mean(half) - mean(plan.shrubs)) < 40);
  assert.equal(JSON.stringify([input.urban, input.littoral, input.housing, input.center, input.landmarks]), data);
});

test('realistic plants keep the sixty documented carobs in place and switch back to the documentary models', async () => {
  const input = await vegetationInput();
  const group = new THREE.Group(), trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .19, 2.1, 6), new THREE.MeshStandardMaterial(), 60), crowns = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 1), new THREE.MeshStandardMaterial(), 120);
  for (let i = 0; i < 60; i++) trunks.setMatrixAt(i, new THREE.Matrix4().makeTranslation(i * 6, 9 + 1.05, (i % 2) * 14));
  group.add(trunks, crowns); const before = [...trunks.instanceMatrix.array];
  const vegetation = makeVegetation(input, { group, trunks });
  const added = group.children.filter(o => o !== trunks && o !== crowns); assert.equal(added.reduce((sum, mesh) => sum + mesh.count, 0), 60);
  assert.equal(vegetation.root.visible, false); assert.ok(added.every(mesh => !mesh.visible)); assert.ok(trunks.visible && crowns.visible); assert.equal(vegetation.root.children.length, 0);
  vegetation.set(true, 1, true);
  assert.ok(added.every(mesh => mesh.visible)); assert.ok(!trunks.visible && !crowns.visible); assert.equal(vegetation.root.visible, true);
  // Each realistic carob stands on the base of a documentary trunk.
  const bases = new Set(Array.from({ length: 60 }, (_, i) => [i * 6, 9, (i % 2) * 14].join())), m = new THREE.Matrix4(), p = new THREE.Vector3();
  for (const mesh of added) for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m); assert.ok(bases.delete([p.x, Math.round(p.y * 1e4) / 1e4, p.z].join())); }
  assert.equal(bases.size, 0); assert.deepEqual([...trunks.instanceMatrix.array], before);
  const total = vegetation.root.children.reduce((sum, mesh) => sum + mesh.count, 0), plan = vegetation.root.userData.plan; assert.equal(total, plan.shrubs + plan.trees); assert.equal(vegetation.root.userData.geometryConfidence, 'C');
  vegetation.root.traverse(o => { if (o.isInstancedMesh) { assert.ok([...o.instanceMatrix.array].every(Number.isFinite)); assert.ok([...o.geometry.attributes.position.array].every(Number.isFinite)); } });
  vegetation.set(true, .4, true); const thinned = vegetation.root.children.reduce((sum, mesh) => sum + mesh.count, 0); assert.ok(thinned < total * .45 && thinned > total * .35);
  assert.equal(added.reduce((sum, mesh) => sum + mesh.count, 0), 60);
  vegetation.set(true, 1, false); assert.equal(vegetation.root.visible, false); assert.ok(added.every(mesh => mesh.visible));
  vegetation.set(true, 1, true); vegetation.setContext(false); assert.equal(vegetation.root.visible, false);
  vegetation.setContext(true, true); assert.equal(vegetation.root.visible, true); assert.ok(vegetation.root.children.some(mesh => !mesh.visible)); assert.ok(vegetation.root.children.some(mesh => mesh.visible));
  vegetation.setContext(true, false); assert.ok(vegetation.root.children.every(mesh => mesh.visible));
  vegetation.set(false, 1, true); assert.equal(vegetation.root.visible, false); assert.ok(added.every(mesh => !mesh.visible)); assert.ok(trunks.visible && crowns.visible);
});

test('generated plants have human-scale sizes, finite geometry and marked foliage', () => {
  for (const [species, low, high] of [['carob', 3.6, 6.2], ['olive', 3, 5.6], ['pine', 6.5, 11.5]]) for (const detail of [0, 1]) {
    const g = treeGeometry(species, 0, detail), box = g.boundingBox; assert.ok(box.max.y > low && box.max.y < high, species + ' ' + box.max.y); assert.ok(box.min.y <= 0);
    assert.ok([...g.attributes.position.array, ...g.attributes.normal.array, ...g.attributes.color.array].every(Number.isFinite));
    const foliage = [...g.attributes.foliage.array]; assert.ok(foliage.includes(0) && foliage.includes(1)); assert.equal(g.attributes.position.count % 3, 0);
  }
  assert.ok(treeGeometry('carob', 0, 0).attributes.position.count < treeGeometry('carob', 0, 1).attributes.position.count / 2);
  const shrub = shrubGeometry(1); assert.ok(shrub.boundingBox.max.y < 1.4 && shrub.attributes.position.count <= 150);
});
