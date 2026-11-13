import * as THREE from 'three';
import { lightProfiles, qualityProfiles, visualSettings, visualModes, plateLight, plateScale, plateSunAzimuth, sunDirection, frameStatistics } from './visual-plan.mjs';
import { makeSurfaceStyles } from './visual-materials.ts';
import { makeWaterStyle } from './visual-water.ts';
import { makeSky } from './visual-sky.ts';
import { groundRealism, addSmoothNormals } from './visual-ground.ts';
import { makeInkPlate } from './visual-ink.ts';
import './visual-style.css';

type Mode = 'documental' | 'realista' | 'arquitectonic';
type Settings = { mode: Mode; light: keyof typeof lightProfiles; quality: keyof typeof qualityProfiles; atmosphere: boolean; vegetation: boolean };
type Options = {
  renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight; hemisphere: THREE.HemisphereLight;
  waterMaterials: THREE.MeshStandardMaterial[]; year: () => number; onChange: () => void;
  /** Sea surfaces: a deep floor is hung below each so clear water never shows the void. */
  waterMeshes?: THREE.Mesh[]; waterLevel?: number;
  /** Built roots that receive the shared patina; ground materials are passed in `skipMaterials`. */
  surfaceRoots?: THREE.Object3D[]; skipMaterials?: Set<THREE.Material>;
  /** Optional scenery that only exists in the realistic style (ambient vegetation). */
  scenery?: { set(realistic: boolean, density: number, enabled: boolean, plate?: boolean): void }[];
  /** Interpreted terrain meshes; they receive averaged shading normals on first realistic use. */
  groundMeshes?: () => THREE.Mesh[];
};
const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export function makeVisualStyle({ renderer, scene, camera, sun, hemisphere, waterMaterials, year, onChange, waterMeshes = [], waterLevel = 0, surfaceRoots, skipMaterials, scenery = [], groundMeshes }: Options) {
  let smoothed = false;
  let stored: unknown; try { stored = JSON.parse(localStorage.getItem('rapita-visual-v1') ?? '{}'); } catch { stored = {}; }
  const query = new URLSearchParams(location.search);
  const initial = { ...(stored && typeof stored === 'object' ? stored : {}), ...(query.has('visual') ? { mode: query.get('visual') } : {}), ...(query.has('llum') ? { light: query.get('llum') } : {}) };
  let settings = visualSettings(initial) as Settings;
  const skip = new Set<THREE.Material>([...(skipMaterials ?? []), ...waterMaterials]);
  const surfaces = makeSurfaceStyles(surfaceRoots ?? scene, skip), water = makeWaterStyle(waterMaterials);
  const sky = makeSky(renderer); scene.add(sky.mesh);
  const ink = makeInkPlate(renderer), paperWhite = new THREE.Color(1, 1, 1);
  const scaleBar = { key: '', right: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() };
  const plateSun = { azimuth: NaN, direction: new THREE.Vector3(), view: new THREE.Vector3() };
  const lettering = () => { element('plate-caption').textContent = 'Reconstrucció del conjunt ca. ' + year(); element('plate-year').textContent = 'ca. ' + year(); };
  groundRealism.waterLevel.value = waterLevel;
  // Below the deepest modelled seabed; only visible through clear water, never above ground.
  const floorMaterial = new THREE.MeshStandardMaterial({ color: new THREE.Color(.012, .105, .15), roughness: 1 }); floorMaterial.name = 'Fons marí profund · recurs visual';
  const floors = waterMeshes.map(parent => { const floor = new THREE.Mesh(parent.geometry, floorMaterial); floor.name = floorMaterial.name; floor.position.y = -9.4; floor.visible = false; floor.raycast = () => {}; parent.add(floor); return { parent, floor }; });
  const waterLines: THREE.Object3D[] = []; for (const parent of new Set(waterMeshes.map(m => m.parent))) parent?.children.forEach(o => { if (o instanceof THREE.Line) waterLines.push(o); });
  const before = { shadowRadius: sun.shadow.radius, background: scene.background, environment: scene.environment, environmentIntensity: scene.environmentIntensity, fog: scene.fog, exposure: renderer.toneMappingExposure, sunColor: sun.color.clone(), sunIntensity: sun.intensity, sunPosition: sun.position.clone(), sunTarget: sun.target.position.clone(), shadowCamera: sun.shadow.camera.clone(), sky: hemisphere.color.clone(), ground: hemisphere.groundColor.clone(), ambient: hemisphere.intensity };
  let shadowCenter = new THREE.Vector3(Infinity, Infinity, Infinity), shadowRadius = 0;
  const frameTimes: number[] = []; let skipFrame = true, lastUI = 0, lastRender = { triangles: 0, calls: 0 };
  const cameraTarget = new THREE.Vector3();
  const clearFrames = () => { frameTimes.length = 0; };
  function apply() {
    // `styled` covers both interpretive styles: they share smooth ground, fuller plants and a tracked shadow.
    const realistic = settings.mode === 'realista', plate = settings.mode === 'arquitectonic', styled = realistic || plate, q = qualityProfiles[settings.quality];
    const anisotropy = Math.max(1, Math.min(q.anisotropy, renderer.capabilities.getMaxAnisotropy()));
    const shadowSize = Math.min(q.shadowSize, renderer.capabilities.maxTextureSize);
    surfaces.set(realistic, anisotropy, plate);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, q.pixelRatio));
    if (sun.shadow.mapSize.x !== shadowSize) {
      sun.shadow.map?.dispose(); sun.shadow.map = null;
      sun.shadow.mapSize.set(shadowSize, shadowSize);
    }
    if (styled && !smoothed) { smoothed = true; for (const mesh of groundMeshes?.() ?? []) addSmoothNormals(mesh.geometry); }
    sky.mesh.visible = realistic; for (const f of floors) f.floor.visible = styled; for (const line of waterLines) line.visible = !styled;
    for (const item of scenery) item.set(styled, q.vegetation, settings.vegetation, plate);
    ink.setSamples(q.pixelRatio > 1 ? 4 : 0); if (!plate) ink.release();
    if (plate) {
      // Flat, shadow-casting studio light on bare paper: distance fades to the sheet, not to a sky.
      const p = plateLight;
      scene.background = paperWhite; scene.environment = null; scene.environmentIntensity = before.environmentIntensity;
      water.set('plate');
      // The sheet itself is the atmosphere: the ink pass fades distance to paper, so the scene needs no fog.
      scene.fog = null;
      renderer.toneMappingExposure = before.exposure;
      sun.color.set(p.sun); sun.intensity = p.intensity; sun.shadow.radius = 2.2;
      hemisphere.color.set(p.sky); hemisphere.groundColor.set(p.ground); hemisphere.intensity = p.ambient;
    } else if (realistic) {
      const p = lightProfiles[settings.light];
      scene.background = new THREE.Color(p.fogColor); scene.environment = sky.set(settings.light, p); scene.environmentIntensity = p.environment;
      water.set(true, scene.environment);
      scene.fog = settings.atmosphere ? new THREE.FogExp2(p.fogColor, p.fog) : null;
      renderer.toneMappingExposure = p.exposure;
      sun.color.set(p.sun); sun.intensity = p.intensity; sun.shadow.radius = 2.2;
      hemisphere.color.set(p.sky); hemisphere.groundColor.set(p.ground); hemisphere.intensity = p.ambient;
    } else {
      water.set(false);
      scene.background = before.background; scene.environment = before.environment; scene.environmentIntensity = before.environmentIntensity; scene.fog = before.fog;
      renderer.toneMappingExposure = before.exposure; sun.color.copy(before.sunColor); sun.intensity = before.sunIntensity; sun.shadow.radius = before.shadowRadius;
      sun.position.copy(before.sunPosition); sun.target.position.copy(before.sunTarget); sun.shadow.camera.copy(before.shadowCamera);
      hemisphere.color.copy(before.sky); hemisphere.groundColor.copy(before.ground); hemisphere.intensity = before.ambient;
    }
    shadowRadius = 0; shadowCenter.set(Infinity, Infinity, Infinity); renderer.shadowMap.needsUpdate = true; clearFrames();
    for (const mode of visualModes) element<HTMLButtonElement>('visual-' + mode).setAttribute('aria-pressed', String(settings.mode === mode));
    element<HTMLSelectElement>('visual-light').value = settings.light; element<HTMLSelectElement>('visual-light').disabled = !realistic;
    element<HTMLSelectElement>('visual-quality').value = settings.quality;
    element<HTMLInputElement>('visual-atmosphere').checked = settings.atmosphere; element<HTMLInputElement>('visual-atmosphere').disabled = !styled;
    element<HTMLInputElement>('visual-vegetation').checked = settings.vegetation; element<HTMLInputElement>('visual-vegetation').disabled = !styled;
    element('visual-summary').textContent = plate ? 'Arquitectònic · làmina C' : realistic ? 'Realista · acabats C' : 'Documental';
    element('visual-note').textContent = plate ? 'Làmina a tinta i aiguada: traç, paper, llum i vegetació ambiental interpretatius (C). Mateix any, geometria, costa i fonts documentals.' : realistic ? 'Acabats, cel, aigua i vegetació ambiental interpretatius (C). Mateix any, geometria, costa i fonts documentals.' : 'Aparença anterior del visor. Mateix any, geometria i fonts documentals.';
    document.querySelector('.viewport')?.setAttribute('data-visual', settings.mode);
    element('plate').hidden = !plate; scaleBar.key = ''; lettering();
  }
  function change(patch: Partial<Settings>) {
    settings = visualSettings({ ...settings, ...patch }) as Settings; apply(); onChange();
    try { localStorage.setItem('rapita-visual-v1', JSON.stringify(settings)); } catch { /* Optional preference storage. */ }
    // Explicit comparison links stay in sync with the controls, preserving year and hash.
    if (query.has('visual') || query.has('llum')) {
      const url = new URL(location.href); url.searchParams.set('visual', settings.mode); url.searchParams.set('llum', settings.light);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
  }
  for (const mode of visualModes as Mode[]) element<HTMLButtonElement>('visual-' + mode).onclick = () => change({ mode });
  element<HTMLSelectElement>('visual-light').onchange = e => change({ light: (e.target as HTMLSelectElement).value as Settings['light'] });
  element<HTMLSelectElement>('visual-quality').onchange = e => change({ quality: (e.target as HTMLSelectElement).value as Settings['quality'] });
  element<HTMLInputElement>('visual-atmosphere').onchange = e => change({ atmosphere: (e.target as HTMLInputElement).checked });
  element<HTMLInputElement>('visual-vegetation').onchange = e => change({ vegetation: (e.target as HTMLInputElement).checked });
  document.addEventListener('visibilitychange', () => { clearFrames(); skipFrame = true; });
  apply();
  return {
    get realistic() { return settings.mode === 'realista'; },
    get plate() { return settings.mode === 'arquitectonic'; },
    /** Ground shader branch: 0 documentary, 1 realistic, 2 plate. */
    get groundStyle() { return settings.mode === 'realista' ? 1 : settings.mode === 'arquitectonic' ? 2 : 0; },
    /** Year-dependent lettering of the plate; called whenever the scene changes. */
    refresh: lettering,
    /** Draws the frame: straight to the canvas, or through the ink-and-wash pass for the plate. */
    render(walking = false) { if (settings.mode === 'arquitectonic') ink.render(scene, camera, !walking); else renderer.render(scene, camera); },
    get settings() { return { ...settings }; },
    set: change,
    /** Tighten the shadow frustum nearby. Only lights move; canonical objects never do. */
    update(dt: number, target: THREE.Vector3, walking: boolean, moving: boolean) {
      cameraTarget.copy(target); water.update(dt, moving);
      if (settings.mode === 'documental') return;
      const plate = settings.mode === 'arquitectonic';
      if (plate) {
        // Light from the upper left of the sheet; while walking it stays where the last plate left it.
        camera.getWorldDirection(plateSun.view);
        const azimuth = walking && !Number.isNaN(plateSun.azimuth) ? plateSun.azimuth : plateSunAzimuth(Math.atan2(plateSun.view.x, -plateSun.view.z) * 180 / Math.PI);
        if (azimuth !== plateSun.azimuth) { plateSun.azimuth = azimuth; plateSun.direction.fromArray(sunDirection(azimuth, plateLight.elevation)).multiplyScalar(2000); shadowRadius = 0; shadowCenter.set(Infinity, Infinity, Infinity); }
        ink.setHaze(settings.atmosphere ? plateLight.fog : 0, walking ? 0 : camera.position.distanceTo(target));
        // Graphic scale, true at the point the camera looks at (perspective shortens the rest).
        scaleBar.right.setFromMatrixColumn(camera.matrixWorld, 0);
        scaleBar.a.copy(target).project(camera); scaleBar.b.copy(target).addScaledVector(scaleBar.right, 100).project(camera);
        const scale = walking ? null : plateScale(Math.abs(scaleBar.b.x - scaleBar.a.x) * renderer.domElement.clientWidth / 200);
        const key = scale ? scale.meters + ':' + Math.round(scale.pixels) : '';
        if (key !== scaleBar.key) {
          scaleBar.key = key; const host = element('plate-scale'); host.hidden = !scale;
          if (scale) {
            const number = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 1 }), ticks = scale.ticks;
            host.style.width = Math.round(scale.pixels) + 'px';
            host.innerHTML = ticks.map((t, i) => `<span style="left:${t.pixels.toFixed(1)}px">${number.format(t.meters)}${i === ticks.length - 1 ? ' m' : ''}</span>`).join('');
          }
        }
      } else { sky.follow(camera); sky.update(dt, moving); if (moving) groundRealism.time.value += Math.min(dt, .1); }
      for (const f of floors) if (f.floor.geometry !== f.parent.geometry) f.floor.geometry = f.parent.geometry;
      const radius = walking ? 75 : THREE.MathUtils.clamp(camera.position.distanceTo(target) * .55, 90, 800);
      const center = walking ? camera.position : target;
      if (center.distanceTo(shadowCenter) < radius * .15 && Math.abs(radius - shadowRadius) < radius * .2) return;
      const step = radius * 2 / qualityProfiles[settings.quality].shadowSize;
      shadowCenter.set(Math.round(center.x / step) * step, center.y, Math.round(center.z / step) * step); shadowRadius = radius;
      sun.target.position.copy(shadowCenter); sun.position.copy(shadowCenter).add(plate ? plateSun.direction : new THREE.Vector3(...lightProfiles[settings.light].direction));
      Object.assign(sun.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 100, far: 4000 });
      sun.shadow.camera.updateProjectionMatrix(); renderer.shadowMap.needsUpdate = true;
    },
    frame(milliseconds: number, now: number) {
      if (skipFrame) skipFrame = false;
      else if (Number.isFinite(milliseconds) && milliseconds > 0) { frameTimes.push(milliseconds); if (frameTimes.length > 180) frameTimes.shift(); }
      lastRender = { triangles: renderer.info.render.triangles, calls: renderer.info.render.calls };
      if (now - lastUI < 1000) return; lastUI = now;
      const stats = frameStatistics(frameTimes), f = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 0 });
      element('visual-metrics').textContent = stats && stats.samples >= 30 ? f.format(stats.fps) + ' FPS · ' + f.format(lastRender.calls) + ' crides · ' + f.format(lastRender.triangles) + ' triangles · p95 ' + f.format(stats.p95Ms) + ' ms' : 'Mesurant el rendiment…';
    },
    report() { return { year: year(), settings: { ...settings }, timing: frameStatistics(frameTimes), render: { ...lastRender }, memory: { ...renderer.info.memory }, texturedMaterials: surfaces.count, viewport: { width: renderer.domElement.width, height: renderer.domElement.height }, camera: { position: camera.position.toArray(), quaternion: camera.quaternion.toArray(), fov: camera.fov, target: cameraTarget.toArray() } }; }
  };
}
