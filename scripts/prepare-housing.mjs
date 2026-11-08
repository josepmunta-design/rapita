import{readFile,writeFile,access}from'node:fs/promises';
import{createReadStream}from'node:fs';
import{createHash}from'node:crypto';
import{fromFile}from'geotiff';
import{generateHousingLayout}from'../src/housing-plan.mjs';
import{planToUTM}from'../src/building-plan.mjs';
import{sampleHeight}from'../src/geo.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const coarse=await json('public/data/terrain.json'),config=await json('data/housing-1794.json'),source=new URL('tmp/terrain/source.tif',root);
try{await access(source);}catch{await import('./prepare-terrain.mjs');}
const hash=createHash('sha256');for await(const chunk of createReadStream(source))hash.update(chunk);const sha=hash.digest('hex');
if(sha!==coarse.sourceSha256)throw new Error('Run data:prepare: terrain source hash differs');
const tiff=await fromFile(source),raster=await tiff.getImage();
if(raster.getGeoKeys().ProjectedCSTypeGeoKey!==25831)throw new Error('Expected EPSG:25831');
const[ox,oy]=raster.getOrigin(),[rx,ry]=raster.getResolution();if(rx!==.5||ry!==-.5)throw new Error('Unexpected source resolution');
const meta={...coarse,id:'town-detail',width:226,height:251,step:2,west:296205.25,north:4499584.75,
  extent:[296205.25,4499084.75,296655.25,4499584.75],heights:'town-terrain.f32',validity:'town-terrain.valid.u8',
  sampleCount:226*251,sourceSha256:sha,historicalCorrections:[],sampling:'Píxel nativo cada 4 píxeles (2 m), sin relleno de NoData.',
  boundary:'Parche integrado en malla general: contorno a 10 m, interior a 2 m, sin cambiar alturas.'};
const h=new Float32Array(meta.sampleCount),v=new Uint8Array(meta.sampleCount),nodata=raster.getGDALNoData(),cx=(meta.west-ox)/rx-.5,cy=(meta.north-oy)/ry-.5;
for(let row=0;row<meta.height;row++){
  const y=cy+row*4,a=await raster.readRasters({window:[cx,y,cx+(meta.width-1)*4+1,y+1],samples:[0],interleave:true});
  for(let col=0;col<meta.width;col++){const i=row*meta.width+col,z=a[col*4];v[i]=Number.isFinite(z)&&z!==nodata?1:0;h[i]=v[i]?z:0;}
}
await tiff.close();meta.validCount=v.reduce((a,b)=>a+b,0);meta.minimum=Math.min(...h.filter((_,i)=>v[i]));meta.maximum=Math.max(...h.filter((_,i)=>v[i]));
const structures=generateHousingLayout(config);
for(const s of structures){
  const fw=s.frontWidth??s.width,bw=s.backWidth??s.width,fz=s.frontZ??s.depth/2,bz=s.backZ??-s.depth/2;
  s.footprintUTM=[[-fw/2,fz],[fw/2,fz],[bw/2,bz],[-bw/2,bz]].map(([x,z])=>planToUTM(x,z,s.anchor,s.frontAzimuthDegrees));
  const values=[];
  for(let row=0;row<=Math.ceil(fz-bz);row++){
    const z=bz+(fz-bz)*row/Math.ceil(fz-bz),w=bw+(fw-bw)*(z-bz)/(fz-bz),columns=Math.ceil(w);
    for(let col=0;col<=columns;col++){
      const x=-w/2+w*col/columns,[e,n]=planToUTM(x,z,s.anchor,s.frontAzimuthDegrees),height=sampleHeight(meta,h,v,e,n);if(height===null)throw new Error(s.id+' intersects NoData');values.push(height);
    }
  }
  s.terrain={minimum:Math.min(...values),maximum:Math.max(...values),technicalBaseElevation:Math.max(...values)+.08,historicalElevation:null};
}
const bytes=Buffer.alloc(h.length*4);h.forEach((z,i)=>bytes.writeFloatLE(z,i*4));
await writeFile(new URL('public/data/'+meta.heights,root),bytes);await writeFile(new URL('public/data/'+meta.validity,root),v);
await writeFile(new URL('public/data/town-terrain.json',root),JSON.stringify(meta,null,2)+'\n');
const out={...config,structures,summary:{renderedStructures:structures.length,royalInventoryUnits:81,largeHouses:43,smallCoastalUnits:14,sharedManzanaUnits:24,privateMixedUnplaced:38}};
await writeFile(new URL('public/data/housing.json',root),JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({samples:meta.sampleCount,valid:meta.validCount,summary:out.summary,groundStepsOver2m:structures.filter(s=>s.terrain.maximum-s.terrain.minimum>2).map(s=>[s.id,+(s.terrain.maximum-s.terrain.minimum).toFixed(2)])},null,2));
