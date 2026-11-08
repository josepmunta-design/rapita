import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {prepareUrbanLayout,retainingWallFootprints} from '../src/urban-plan.mjs';
import {sampleHeight} from '../src/geo.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const config=await json('data/urban-fabric.json'),housing=await json('public/data/housing.json'),meta=await json('public/data/terrain.json'),context=await json('public/data/context.json');
const raw=await readFile(new URL('public/data/'+meta.heights,root)),h=new Float32Array(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),v=await readFile(new URL('public/data/'+meta.validity,root));
const floats=async m=>{const r=await readFile(new URL('public/data/'+m.heights,root));return new Float32Array(r.buffer.slice(r.byteOffset,r.byteOffset+r.byteLength));};
const contextHeights=await floats(context),contextValid=await readFile(new URL('public/data/'+context.validity,root));
const data=prepareUrbanLayout(config,housing.townFrame);
for(const s of data.sites){const[e,n]=s.anchor,z=sampleHeight(meta,h,v,e,n)??sampleHeight(context,contextHeights,contextValid,e,n);if(z===null)throw Error('Urban site outside valid terrain: '+s.id);s.technicalBaseElevation=z;const a=(s.alongAzimuthDegrees??data.frame.alongAzimuthDegrees)*Math.PI/180;s.footprintUTM=s.polygonUTM??[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>{const dx=x*s.width/2,dy=y*s.depth/2;return[e+dx*Math.cos(a)+dy*Math.sin(a),n-dx*Math.sin(a)+dy*Math.cos(a)];});if(s.kind==='retaining-wall'){s.footprintUTM=[];s.accessRoutes=data.routes.filter(r=>r.kind==='ramp');s.collisionFootprintsUTM=retainingWallFootprints(s.retainingLinesUTM,s.baseWidth,s.accessRoutes);}}
await writeFile(new URL('public/data/urban-fabric.json',root),JSON.stringify(data,null,2)+'\n');
await mkdir(new URL('public/data/reference/',root),{recursive:true});
await copyFile(new URL('data/history-catalog.json',root),new URL('public/data/history-catalog.json',root));
await copyFile(new URL('data/chronology.json',root),new URL('public/data/chronology.json',root));
await copyFile(new URL('docs/sources/history/rapita-1945-1946.jpg',root),new URL('public/data/reference/rapita-1945-1946.jpg',root));
await copyFile(new URL('docs/sources/history/plan-1852-000.jpg',root),new URL('public/data/reference/plan-1852.jpg',root));
console.log(JSON.stringify({routes:data.routes.length,sites:data.sites.length,privateMixed:data.privateLedger.documentedMixedUnits}));
