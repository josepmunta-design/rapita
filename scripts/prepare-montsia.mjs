// Original archives -> native 50 m samples. No terrain service at browser runtime.
import {createReadStream,createWriteStream} from 'node:fs';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {pipeline} from 'node:stream/promises';
import {createHash} from 'node:crypto';
import yauzl from 'yauzl';
import {fromFile} from 'geotiff';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const archive='FME_46302427_1793390462662_232.zip',cache=new URL('tmp/montsia/',root),out=new URL('public/data/',root);
await mkdir(cache,{recursive:true});
let entryName;
await new Promise((done,fail)=>yauzl.open(new URL(archive,root),{lazyEntries:true},(err,zip)=>{
  if(err)return fail(err);zip.on('error',fail);zip.on('end',()=>entryName?done():fail(Error('No GeoTIFF')));
  zip.on('entry',entry=>{
    if(!entry.fileName.endsWith('.tif'))return zip.readEntry();
    if(entryName)return fail(Error('Ambiguous GeoTIFF archive'));entryName=entry.fileName;
    zip.openReadStream(entry,async(err,stream)=>{if(err)return fail(err);try{await pipeline(stream,createWriteStream(new URL('source.tif',cache)));zip.readEntry();}catch(e){fail(e);}});
  });zip.readEntry();
}));
const digest=async path=>{const h=createHash('sha256');for await(const part of createReadStream(path))h.update(part);return h.digest('hex');};
const paths=[new URL('tmp/terrain/source.tif',root),new URL('source.tif',cache)];
// data:montsia also works on a fresh checkout with prepared public assets.
try{await access(paths[0]);}catch{
  await mkdir(new URL('tmp/terrain/',root),{recursive:true});
  await new Promise((done,fail)=>yauzl.open(new URL('FME_46302427_1793275473239_7788.zip',root),{lazyEntries:true},(err,zip)=>{
    if(err)return fail(err);let found=false;zip.on('error',fail);zip.on('end',()=>found?done():fail(Error('Missing original GeoTIFF')));
    zip.on('entry',entry=>{if(!entry.fileName.endsWith('.tif'))return zip.readEntry();if(found)return fail(Error('Ambiguous original GeoTIFF'));found=true;zip.openReadStream(entry,async(err,stream)=>{if(err)return fail(err);try{await pipeline(stream,createWriteStream(paths[0]));zip.readEntry();}catch(e){fail(e);}});});zip.readEntry();
  }));
}
const tiffs=await Promise.all(paths.map(p=>fromFile(p))),images=await Promise.all(tiffs.map(t=>t.getImage()));
for(const image of images)if(image.getGeoKeys().ProjectedCSTypeGeoKey!==25831||image.getResolution()[0]!==.5||image.getResolution()[1]!==-.5)throw Error('Expected 0.5 m EPSG:25831');
const local=await json('public/data/terrain.json'),region=await json('public/data/region.json');
if(await digest(paths[0])!==local.sourceSha256)throw Error('Original GeoTIFF hash differs from local metadata');
const buffer=await readFile(new URL(region.heights,out)),rh=new Float32Array(buffer.buffer.slice(buffer.byteOffset,buffer.byteOffset+buffer.byteLength)),rv=await readFile(new URL(region.validity,out));
// Same native pixel-centre lattice as the existing local and regional grids.
const west=289905.25,north=region.north,step=50,width=169,height=287;
const heights=new Float32Array(width*height),valid=new Uint8Array(width*height),source=new Uint8Array(width*height);
const readRow=async(image,n)=>{
  const [ox,oy]=image.getOrigin(),[rx,ry]=image.getResolution(),y=(n-oy)/ry-.5;
  if(!Number.isInteger(y)||y<0||y>=image.getHeight())return null;
  return image.readRasters({window:[0,y,image.getWidth(),y+1],samples:[0],interleave:true});
};
let minimum=Infinity,maximum=-Infinity,overlapCount=0,overlapMaxDifference=0;
for(let row=0;row<height;row++){
  const n=north-row*step,rows=await Promise.all(images.map(r=>readRow(r,n)));
  for(let col=0;col<width;col++){
    const e=west+col*step,i=row*width+col,samples=images.map((image,k)=>{
      if(!rows[k])return null;const x=(e-image.getOrigin()[0])/.5-.5;
      if(!Number.isInteger(x)||x<0||x>=image.getWidth())return null;
      const z=rows[k][x];return Number.isFinite(z)&&z!==image.getGDALNoData()?z:null;
    });
    if(samples[0]!==null&&samples[1]!==null){overlapCount++;overlapMaxDifference=Math.max(overlapMaxDifference,Math.abs(samples[0]-samples[1]));}
    // Keep the already archived north context; extend west/south from LiDAR.
    const rc=(e-region.west)/step,rr=(region.north-n)/step,ri=rr*region.width+rc;
    let z=null,id=0;
    if(n>local.north&&Number.isInteger(rc)&&Number.isInteger(rr)&&rc>=0&&rc<region.width&&rr>=0&&rr<region.height&&rv[ri]){z=rh[ri];id=3;}
    else if(samples[0]!==null){z=samples[0];id=1;}
    else if(samples[1]!==null){z=samples[1];id=2;}
    if(z!==null){heights[i]=z;valid[i]=1;source[i]=id;minimum=Math.min(minimum,z);maximum=Math.max(maximum,z);}
  }
}
if(overlapCount<100||overlapMaxDifference!==0)throw Error('LiDAR overlap differs: inspect before joining');
const sourceSha256=await digest(paths[1]);
const meta={version:1,crs:'EPSG:25831',width,height,west,north,step,origin:local.origin,validCount:valid.reduce((a,b)=>a+b,0),sampleCount:valid.length,minimum,maximum,heights:'context.f32',validity:'context.valid.u8',sourceIds:'context.sources.u8',source:'ICGC · dos retalls MDT LiDAR 50 cm 2021–2023 + context WCS arxivat',sourceSha256,verticalDatum:'LiDAR: fitxa EGM08D595; coincidència exacta en el solapament dels dos TIFF. Equivalència amb el WCS pendent.',sampling:'Una mostra nativa cada 100 píxels (50 m), sense mitjana, interpolació ni farciment NoData. Costura visual perimetral amb la malla local de 10 m.',sources:[{id:1,file:local.source,sha256:local.sourceSha256},{id:2,archive,file:entryName,sha256:sourceSha256,bounds:images[1].getBoundingBox(),nativeSize:[images[1].getWidth(),images[1].getHeight()],nativeStep:.5,period:'2021–2023',noData:images[1].getGDALNoData()},{id:3,file:'docs/sources/canal-region.asc',sha256:region.sourceSha256}],overlapCheck:{comparedNativeSamples:overlapCount,maximumAbsoluteDifference:overlapMaxDifference,transformationApplied:false},historicalCorrections:[]};
await writeFile(new URL(meta.heights,out),new Uint8Array(heights.buffer));await writeFile(new URL(meta.validity,out),valid);await writeFile(new URL(meta.sourceIds,out),source);await writeFile(new URL('context.json',out),JSON.stringify(meta,null,2)+'\n');
for(const t of tiffs)await t.close();
console.log(JSON.stringify({samples:valid.length,valid:meta.validCount,range:[minimum,maximum],overlap:meta.overlapCheck,sourceSha256}));
