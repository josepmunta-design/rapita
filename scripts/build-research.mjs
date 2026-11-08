import {readFile,writeFile,mkdir,copyFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),archive=new URL('docs/1800-1900/originals/',root),out=new URL('public/data/research/',root);
const read=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
await mkdir(out,{recursive:true});
const data=await read('data/research-19c.json'),downloadPlan=await read('data/research-downloads.json'),files=[];
for(const name of (await readdir(archive)).sort()){
 const url=new URL(name,archive),info=await stat(url);if(!info.isFile())continue;
 const raw=await readFile(url),ext=name.split('.').at(-1).toLowerCase();
 const valid=ext==='pdf'?raw.subarray(0,5).toString()==='%PDF-'&&raw.subarray(-4096).toString().includes('%%EOF'):ext==='jpg'?raw[0]===255&&raw[1]===216:ext==='html'?/<html/i.test(raw.toString('utf8')):true;
 const request=downloadPlan.files.find(f=>f.file===name);if(!request)throw Error('Missing source URL: '+name);
 files.push({file:'originals/'+name,url:request.url,session:request.session,reviewScope:data.sources.some(s=>s.file===name||s.extraFiles?.includes(name))?'used-source-or-support':'supplemental-not-used-for-public-claims',bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),formatValid:valid,sourceIds:data.sources.filter(s=>s.file===name||s.extraFiles?.includes(name)).map(s=>s.id)});
}
const ids=new Set(data.sources.map(s=>s.id));if(ids.size!==data.sources.length)throw Error('Duplicate source IDs');
for(const e of [...data.events,...data.leads,...data.conflicts])for(const id of e.refs)if(!ids.has(id))throw Error('Unresolved source: '+id);
for(const s of data.sources){
 if(s.file){const f=files.find(f=>f.file==='originals/'+s.file);if(!f?.formatValid)throw Error('Missing or invalid source: '+s.id);s.sha256=f.sha256;s.archiveStatus='verified-copy';}
 if(s.localOriginal)await copyFile(new URL(s.localOriginal,root),new URL(s.publicFile.replace('research/',''),out));
 else if(s.id==='XIX08')await copyFile(new URL('aca-eixample-1870.jpg',archive),new URL('aca-eixample-1870.jpg',out));
 delete s.localOriginal;
}
// Only reviewed public-domain images and derived census data are copied to hosting.
const csv='Any;Poblacio_de_fet;Poblacio_de_dret;Llars\n'+data.census.rows.map(r=>[r.year,r.deFacto??'',r.deJure??'',r.households].join(';')).join('\n')+'\n';
await writeFile(new URL('ine-censos-1842-1900.csv',out),'\uFEFF'+csv);
const manifest={reviewed:data.reviewed,folder:'docs/1800-1900',files,verifiedFiles:files.filter(f=>f.formatValid).length,bytes:files.reduce((n,f)=>n+f.bytes,0),failures:[{sourceId:'XIX19',type:'HTTP 403',scope:'BNE original and viewer; not downloaded'},{sourceId:'XIX09',type:'image unavailable',scope:'Catalogue downloaded; viewer reports no associated images'}]};
await save('docs/1800-1900/manifest.json',manifest);
data.archive={verifiedFiles:manifest.verifiedFiles,bytes:manifest.bytes};
await save('public/data/research-19c.json',data);
await save('docs/1800-1900/research-19c.json',await read('data/research-19c.json'));
// Add documentary milestones only; existing entity timelines and geometry are unchanged.
const chronology=await read('data/chronology.json');
chronology.milestones=chronology.milestones.filter(m=>!m.researchEventId);
const kinds={projecte:'project-witness',autoritzacio:'authorization-witness',cens:'census-witness',us:'use-witness',cataleg:'catalogue-witness',testimoni:'later-witness',obra:'later-witness'};
for(const e of data.events){if(chronology.milestones.some(m=>m.year===e.year))continue;chronology.milestones.push({year:e.year,label:e.title,description:e.claim,sources:e.refs,state:kinds[e.kind],minorTick:true,researchEventId:e.id});}
chronology.milestones.sort((a,b)=>a.year-b.year);
const end=chronology.milestones.find(m=>m.year===1950);if(end?.label==='Fi de l’horitzó d’estudi'){end.label='Context de postguerra';end.description='Any de consulta: el port conserva l’últim testimoni disponible. La resta de la vila manté context anterior sense una reconstrucció integral del 1950.';}
await save('data/chronology.json',chronology);await save('public/data/chronology.json',chronology);
console.log(JSON.stringify({sources:data.sources.length,events:data.events.length,leads:data.leads.length,verifiedFiles:manifest.verifiedFiles,bytes:manifest.bytes}));
