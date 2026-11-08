import {readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),files=[],issues=[];const skip=new Set(['.git','node_modules','dist','tmp','.vercel','.sites-runtime']);
async function walk(relative=''){for(const entry of await readdir(new URL(relative,root),{withFileTypes:true})){const name=relative+entry.name;if(entry.isDirectory()){if(!skip.has(entry.name))await walk(name+'/');}else if(!/docs\/1800-1900\/(inventory|audit)\.json$/.test(name)){const meta=await stat(new URL(name,root));files.push({path:name,bytes:meta.size});}}}
await walk();
let jsonCount=0,notes=0,images=0;
for(const f of files){if(f.path.endsWith('.json')){try{JSON.parse((await readFile(new URL(f.path,root),'utf8')).replace(/^\uFEFF/,''));jsonCount++;}catch(e){issues.push({file:f.path,type:'json',error:e.message});}}if(/\.(md|txt)$/i.test(f.path))notes++;if(/\.(png|jpe?g|webp)$/i.test(f.path))images++;}
const read=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const dossiers=await read('public/data/dossiers.json');let imagesReferenced=0;
for(const d of Object.values(dossiers.items))for(const media of [...d.photos,...d.documents]){imagesReferenced++;try{await stat(new URL('public/data/dossier-img/'+media.image,root));}catch{issues.push({dossier:d.id,file:media.image,type:'missing-dossier-image'});}}
const sourceNotes=await read('data/new-source-notes.json'),research=await read('data/research-19c.json'),archive=await read('docs/1800-1900/manifest.json');
const summary={reviewed:research.reviewed,files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),jsonParsed:jsonCount,textDocumentsInventoried:notes,imagesInventoried:images,previousSourceRecords:Object.keys(sourceNotes).length,dossiers:Object.keys(dossiers.items).length,dossierImagesChecked:imagesReferenced,newSources:research.sources.length,newEvents:research.events.length,archiveFiles:archive.verifiedFiles,archiveBytes:archive.bytes,selectableYears:(await read('data/chronology.json')).range,issues};
await writeFile(new URL('docs/1800-1900/inventory.json',root),JSON.stringify({reviewed:research.reviewed,method:'Recursive inventory excluding dependencies, generated build, private runtime and temporary work. Binary originals inventoried; this does not assert reading every page or photograph.',files},null,2)+'\n');
await writeFile(new URL('docs/1800-1900/audit.json',root),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));if(issues.length)process.exitCode=1;
