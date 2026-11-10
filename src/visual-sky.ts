import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import type { lightProfiles } from './visual-plan.mjs';

type Profile = typeof lightProfiles.mati;

/**
 * Procedural daylight sky (Three.js atmospheric model with generated clouds).
 * It is an editorial light setting: not a photograph and not a weather record.
 */
export function makeSky(renderer: THREE.WebGLRenderer) {
  const mesh = new Sky();
  mesh.name = 'Cel procedural · recurs interpretatiu';
  mesh.scale.setScalar(400000); mesh.frustumCulled = false; mesh.renderOrder = -100; mesh.visible = false;
  mesh.raycast = () => {};
  (mesh.material as THREE.ShaderMaterial).fog = false;
  // A second sky feeds the image-based light, without the solar disc that would cause fireflies.
  const probeScene = new THREE.Scene(), probe = new Sky(); probe.scale.setScalar(1000);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: '#8f876f', side: THREE.DoubleSide, toneMapped: false });
  const ground = new THREE.Mesh(new THREE.CircleGeometry(700, 24), groundMaterial); ground.rotation.x = -Math.PI / 2; ground.position.y = -6;
  probeScene.add(probe, ground);
  const environments = new Map<string, THREE.WebGLRenderTarget>();
  let pmrem: THREE.PMREMGenerator | null = null;
  const configure = (sky: Sky, p: Profile, disc: number) => {
    const u = (sky.material as THREE.ShaderMaterial).uniforms;
    u.turbidity.value = p.turbidity; u.rayleigh.value = p.rayleigh; u.mieCoefficient.value = p.mie; u.mieDirectionalG.value = p.mieG;
    u.sunPosition.value.fromArray(p.direction).normalize();
    u.cloudCoverage.value = p.clouds; u.cloudDensity.value = p.cloudDensity; u.cloudScale.value = .00022; u.cloudElevation.value = .5;
    u.showSunDisc.value = disc;
  };
  return {
    mesh,
    /** Returns the filtered environment for a profile, building it once. */
    set(key: string, p: Profile) {
      configure(mesh, p, 1);
      let target = environments.get(key);
      if (!target) {
        configure(probe, p, 0);
        (probe.material as THREE.ShaderMaterial).uniforms.time.value = (mesh.material as THREE.ShaderMaterial).uniforms.time.value;
        // Rough bounce from sunlit dry ground, in the same radiance units as the sky shader.
        groundMaterial.color.set(p.ground).multiplyScalar(.5 + .55 * Math.sin(p.elevation * Math.PI / 180));
        pmrem ??= new THREE.PMREMGenerator(renderer);
        target = pmrem.fromScene(probeScene, 0, .1, 3000); environments.set(key, target);
      }
      return target.texture;
    },
    follow(camera: THREE.Camera) { mesh.position.copy(camera.position); },
    update(dt: number, moving: boolean) { if (moving) (mesh.material as THREE.ShaderMaterial).uniforms.time.value += Math.min(dt, .1); }
  };
}
