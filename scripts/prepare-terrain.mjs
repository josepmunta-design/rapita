// Node only: derive the browser asset from the original GeoTIFF, never from bpy/NPZ.
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import yauzl from 'yauzl';
import { fromFile } from 'geotiff';
import { sampleHeight } from '../src/geo.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const archive = resolve(root, 'FME_46302427_1793275473239_7788.zip');
const out = resolve(root, 'public/data');
const temporary = resolve(root, 'tmp/terrain');
await mkdir(out, { recursive: true });
await mkdir(temporary, { recursive: true });
const tifPath = resolve(temporary, 'source.tif');
let entryName;
await new Promise((done, fail) => {
  yauzl.open(archive, { lazyEntries: true }, (error, zip) => {
    if (error) return fail(error);
    zip.on('error', fail);
    zip.on('end', () => entryName ? done() : fail(new Error('No GeoTIFF in archive')));
    zip.on('entry', entry => {
      if (!entry.fileName.endsWith('.tif')) return zip.readEntry();
      if (entryName) return fail(new Error('Ambiguous GeoTIFF archive'));
      entryName = entry.fileName;
      zip.openReadStream(entry, async (error, stream) => {
        if (error) return fail(error);
        try { await pipeline(stream, createWriteStream(tifPath)); zip.readEntry(); }
        catch (error) { zip.close(); fail(error); }
      });
    });
    zip.readEntry();
  });
});
console.log('GeoTIFF extracted; checking reference system…');
const sourceHash = createHash('sha256');
for await (const chunk of createReadStream(tifPath)) sourceHash.update(chunk);
const tiff = await fromFile(tifPath);
const raster = await tiff.getImage();
const keys = raster.getGeoKeys();
if (keys.ProjectedCSTypeGeoKey !== 25831) throw new Error('Expected EPSG:25831');
const [ox, oy] = raster.getOrigin();
const [rx, ry] = raster.getResolution();
if (rx !== 0.5 || ry !== -0.5) throw new Error('Unexpected resolution');
// Exact native pixel centres at a 20-pixel stride. No interpolation or filling.
const extent = [294750, 4497800, 298350, 4501000];
const window = [(extent[0]-ox)/rx, (extent[3]-oy)/ry, (extent[2]-ox)/rx, (extent[1]-oy)/ry];
if (!window.every(Number.isInteger)) throw new Error('Window is not pixel aligned');
const width = 360, height = 320, stride = 20, offset = 10;
const elevations = new Float32Array(width * height);
const valid = new Uint8Array(width * height);
const noData = raster.getGDALNoData();
// Read strips to avoid keeping the entire half-metre raster in memory.
for (let row = 0; row < height; row++) {
  const y = window[1] + row * stride + offset;
  const samples = await raster.readRasters({ window: [window[0], y, window[2], y+1], samples: [0], interleave: true });
  for (let col = 0; col < width; col++) {
    const z = samples[col * stride + offset];
    const i = row * width + col;
    valid[i] = Number.isFinite(z) && z !== noData ? 1 : 0;
    elevations[i] = valid[i] ? z : 0;
  }
}
await tiff.close();
const terrain = {
  version: 1, crs: 'EPSG:25831', source: entryName,
  sourceSha256: sourceHash.digest('hex'), sourcePeriod: '2021–2023',
  verticalDatum: 'Pendiente de contraste con ficha del producto ICGC; cotas nativas sin transformar.',
  width, height, step: stride*rx,
  west: ox + (window[0]+offset+0.5)*rx,
  north: oy + (window[1]+offset+0.5)*ry,
  extent, origin: { easting: 296389.3545, northing: 4499364.7286, elevation: 0 },
  encoding: 'float32-le', rowOrder: 'north-to-south', noData,
  sampling: 'Un píxel nativo cada 20 (10 m). Sin promedio, interpolación ni relleno NoData.',
  historicalCorrections: [],
  validCount: valid.reduce((a,b) => a+b, 0), sampleCount: valid.length,
  minimum: Math.min(...elevations.filter((_, i) => valid[i])),
  maximum: Math.max(...elevations.filter((_, i) => valid[i])),
  heights: 'terrain.f32', validity: 'terrain.valid.u8'
};
const bytes = Buffer.alloc(elevations.length * 4);
elevations.forEach((z,i) => bytes.writeFloatLE(z,i*4));
await writeFile(resolve(out, terrain.heights), bytes);
await writeFile(resolve(out, terrain.validity), valid);
const points = JSON.parse(await readFile(resolve(root, 'docs/investigacion/Rapita_1800_puntos_georreferenciados.geojson'), 'utf8'));
const notes = JSON.parse(await readFile(resolve(root, 'data/interpretations.json'), 'utf8'));
for (const point of points.features) {
  const p = point.properties;
  Object.assign(p, notes[p.id]);
  p.terrainHeight = sampleHeight(terrain, elevations, valid, p.utm_x, p.utm_y);
  p.terrainHeightMethod = 'Interpolación bilineal solo con las cuatro muestras válidas; MDT contemporáneo a 10 m.';
}
await writeFile(resolve(out, 'terrain.json'), JSON.stringify(terrain, null, 2)+'\n');
await writeFile(resolve(out, 'monuments.geojson'), JSON.stringify(points, null, 2)+'\n');
console.log(JSON.stringify({ validCount: terrain.validCount, sampleCount: terrain.sampleCount, range: [terrain.minimum, terrain.maximum], anchors: points.features.map(f=>[f.properties.id,f.properties.terrainHeight]) }, null, 2));
