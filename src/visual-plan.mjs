/** Editorial light and GPU budgets; never used by the historical model. */
// Scene axes: X east, Y up, Z south. Azimuth is clockwise from north, as on a compass.
export function sunDirection(azimuthDegrees, elevationDegrees) {
  const a = azimuthDegrees * Math.PI / 180, e = elevationDegrees * Math.PI / 180;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}
// Sun positions are plausible for 40.6° N, not a dated weather or ephemeris reconstruction.
// `horizon` tints fog and fill light; `sky`/`ground` remain for the low-resolution fallback sky.
const light = p => ({ ...p, direction: sunDirection(p.azimuth, p.elevation).map(v => v * 2000) });
export const lightProfiles = {
  mati: light({ label: 'Matí clar', azimuth: 100, elevation: 31, sky: '#cbd8ee', horizon: '#dfe3df', ground: '#c4a67c', sun: '#ffe8c6', intensity: 5.4, ambient: .9, environment: .09, exposure: .56, fog: .000034, fogColor: '#c9d6de', turbidity: 3.2, rayleigh: 1.25, mie: .004, mieG: .82, clouds: .34, cloudDensity: .42 }),
  tarda: light({ label: 'Tarda càlida', azimuth: 240, elevation: 32, sky: '#d6dae8', horizon: '#eed9b4', ground: '#c9a474', sun: '#ffd6a6', intensity: 5.6, ambient: .85, environment: .1, exposure: .64, fog: .00004, fogColor: '#dccdb4', turbidity: 5.5, rayleigh: 1.7, mie: .006, mieG: .86, clouds: .3, cloudDensity: .38 }),
  cobert: light({ label: 'Cel cobert', azimuth: 190, elevation: 48, sky: '#e3e2dc', horizon: '#dfe2de', ground: '#a89c84', sun: '#f4efe6', intensity: 1.3, ambient: 1.9, environment: .045, exposure: .62, fog: .00006, fogColor: '#c5cbcc', turbidity: 2.5, rayleigh: .9, mie: .003, mieG: .7, clouds: .92, cloudDensity: 1.0})
};
// `vegetation` scales the ambient scrub and trees; documented alignments are never thinned.
export const qualityProfiles = {
  baix: { label: 'Baixa', pixelRatio: 1, shadowSize: 1024, anisotropy: 2, vegetation: .4 },
  mitja: { label: 'Mitjana', pixelRatio: 1.5, shadowSize: 2048, anisotropy: 4, vegetation: .75 },
  alta: { label: 'Alta', pixelRatio: 2, shadowSize: 4096, anisotropy: 8, vegetation: 1 }
};
/** Representation styles. «Arquitectònic» is an ink-and-wash plate drawn over the same scene. */
export const visualModes = ['documental', 'realista', 'arquitectonic'];
// Studio light of the plate. It is a drawing convention, not a time of day: like the light of an
// architectural drawing it comes from the upper left of the sheet, so it turns with the view.
export const plateLight = { label: 'Làmina', elevation: 40, turn: 242, step: 10, sun: '#fff4e2', sky: '#fffaf0', ground: '#e6dcc4', intensity: 3.6, ambient: 2.5, fog: .00021 };
/** Sun bearing for a view bearing, snapped so the shadow map is only redrawn every `step` degrees. */
export function plateSunAzimuth(viewAzimuthDegrees) {
  const snapped = Math.round((viewAzimuthDegrees + plateLight.turn) / plateLight.step) * plateLight.step;
  return ((snapped % 360) + 360) % 360;
}
/**
 * Graphic scale for the plate: the longest 1-2-5 length that fits in `maxPixels`.
 * `pixelsPerMeter` is measured at the point the camera looks at, so it is only exact there.
 */
export function plateScale(pixelsPerMeter, maxPixels = 210) {
  if (!(pixelsPerMeter > 0) || !Number.isFinite(pixelsPerMeter) || !(maxPixels > 0)) return null;
  const limit = maxPixels / pixelsPerMeter, power = 10 ** Math.floor(Math.log10(limit));
  const lead = [5, 2, 1].find(step => step * power <= limit * (1 + 1e-9)) ?? 1, meters = lead * power;
  const ticks = (lead === 5 ? [0, .5, 1] : [0, .25, .5, 1]).map(t => ({ meters: t * meters, pixels: t * meters * pixelsPerMeter }));
  return { meters, pixels: meters * pixelsPerMeter, ticks };
}
export function visualSettings(value = {}) {
  return {
    mode: visualModes.includes(value.mode) ? value.mode : 'realista',
    light: Object.hasOwn(lightProfiles, value.light) ? value.light : 'tarda',
    quality: Object.hasOwn(qualityProfiles, value.quality) ? value.quality : 'mitja',
    atmosphere: value.atmosphere !== false,
    vegetation: value.vegetation !== false
  };
}
export function frameStatistics(values) {
  const samples = values.filter(v => Number.isFinite(v) && v > 0).sort((a,b) => a-b);
  if (!samples.length) return null;
  const percentile = p => samples[Math.min(samples.length-1, Math.ceil(samples.length*p)-1)];
  return { samples: samples.length, medianMs: percentile(.5), p95Ms: percentile(.95), fps: 1000/percentile(.5), longFrameRatio: samples.filter(v=>v>50).length/samples.length };
}
