import { readFile, writeFile, access } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { fromFile } from 'geotiff';
import { sampleHeight } from '../src/geo.mjs';
import { planToUTM } from '../src/building-plan.mjs';

const root=new URL('../',import.meta.url);
const readJSON=async path=>JSON.parse(await readFile(new URL(path,root),'utf8'));
const coarse=await readJSON('public/data/terrain.json');
const config=await readJSON('data/esglesia-nova.json');
const sourcePath=new URL('tmp/terrain/source.tif',root);
try { await access(sourcePath); } catch { await import('./prepare-terrain.mjs'); }
const hash=createHash('sha256');for await(const chunk of createReadStream(sourcePath))hash.update(chunk);
const sha=hash.digest('hex');
if(sha!==coarse.sourceSha256)throw new Error('Source TIFF differs from coarse terrain: run npm run data:prepare');
const tiff=await fromFile(sourcePath);
const raster=await tiff.getImage();
if(raster.getGeoKeys().ProjectedCSTypeGeoKey!==25831)throw new Error('Expected EPSG:25831');
const [ox,oy]=raster.getOrigin(),[rx,ry]=raster.getResolution();
if(rx!==0.5||ry!==-0.5)throw new Error('Unexpected native pixel resolution');
// Nested in the coarse sample lattice. Native centres remain exact, every 4 pixels.
const meta={...coarse,id:'esglesia-detail',width:121,height:121,west:295825.25,north:4499014.75,step:2,
  heights:'esglesia-terrain.f32',validity:'esglesia-terrain.valid.u8',
  sourceSha256:sha,sampling:'Una muestra nativa cada 4 píxeles (2 m). Sin interpolación, relleno ni modificación histórica.',
  extent:[295825.25,4498774.75,296065.25,4499014.75],
  sampleCount:14641,historicalCorrections:[],
  boundary:'Retícula anidada en el MDT de 10 m. La escena recorta el terreno grueso bajo este parche y triangula un borde común sin modificar alturas nativas.'};
const h=new Float32Array(meta.sampleCount),valid=new Uint8Array(meta.sampleCount);
const noData=raster.getGDALNoData();
const col0=(meta.west-ox)/rx-0.5,row0=(meta.north-oy)/ry-0.5;
if(!Number.isInteger(col0)||!Number.isInteger(row0))throw new Error('Sample grid is not aligned with native pixel centres');
for(let row=0;row<meta.height;row++) {
  const y=row0+row*4;
  const samples=await raster.readRasters({window:[col0,y,col0+(meta.width-1)*4+1,y+1],samples:[0],interleave:true});
  for(let col=0;col<meta.width;col++) {
    const i=row*meta.width+col,z=samples[col*4];valid[i]=Number.isFinite(z)&&z!==noData?1:0;h[i]=valid[i]?z:0;
  }
}
await tiff.close();
meta.validCount=valid.reduce((a,b)=>a+b,0);meta.minimum=Math.min(...h.filter((_,i)=>valid[i]));meta.maximum=Math.max(...h.filter((_,i)=>valid[i]));
const half=config.preview.sideMeters/2,footprint=[];
for(const [x,z]of[[-half,-half],[half,-half],[half,half],[-half,half],[-half,-half]])footprint.push(planToUTM(x,z,config.anchor,config.orientation.frontAzimuthDegrees));
const supportSamples=[];
for(let x=-half;x<=half+0.01;x+=half/12)for(let z=-half;z<=half+0.01;z+=half/12){
  const [e,n]=planToUTM(x,z,config.anchor,config.orientation.frontAzimuthDegrees);
  const height=sampleHeight(meta,h,valid,e,n);
  if(height===null)throw new Error('Building footprint intersects NoData');
  supportSamples.push(height);
}
config.terrain={meta:'esglesia-terrain.json',minimumUnderFootprint:Math.min(...supportSamples),maximumUnderFootprint:Math.max(...supportSamples),
  provisionalBaseElevation:Math.max(...supportSamples)+config.placement.clearanceMeters,
  centerElevation:sampleHeight(meta,h,valid,config.anchor.easting,config.anchor.northing),historicalElevation:null};
config.previewFootprintUTM=footprint;
const observations=config.footprintObservation.cornersUTM;
config.footprintObservation.sideLengthsMeters=observations.map((p,i)=>Math.hypot(p[0]-observations[(i+1)%4][0],p[1]-observations[(i+1)%4][1]));
const bytes=Buffer.alloc(h.length*4);h.forEach((v,i)=>bytes.writeFloatLE(v,i*4));
await writeFile(new URL('public/data/'+meta.heights,root),bytes);
await writeFile(new URL('public/data/'+meta.validity,root),valid);
await writeFile(new URL('public/data/esglesia-terrain.json',root),JSON.stringify(meta,null,2)+'\n');
await writeFile(new URL('public/data/buildings/esglesia-nova.json',root),JSON.stringify(config,null,2)+'\n');
console.log(JSON.stringify({samples:meta.sampleCount,valid:meta.validCount,range:[meta.minimum,meta.maximum],terrain:config.terrain,observedSides:config.footprintObservation.sideLengthsMeters},null,2));
