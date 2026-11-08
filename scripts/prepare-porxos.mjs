import{readFile,writeFile,copyFile,mkdir}from'node:fs/promises';
import{createHash}from'node:crypto';
import{PORXO_STUDY}from'../src/porxo-plan.mjs';
const root=new URL('../',import.meta.url),config=JSON.parse(await readFile(new URL('data/porxos-evidence.json',root),'utf8'));
await mkdir(new URL('public/data/reference/',root),{recursive:true});
const copies=[['salvany-1916.jpg','porxos-salvany-1916.jpg'],['salvany-1916-full.jpg','porxos-salvany-1916-estereo.jpg']],hashes={};
for(const[from,to]of copies){const source=new URL('docs/sources/porxos/'+from,root),target=new URL('public/data/reference/'+to,root);await copyFile(source,target);hashes[to]=createHash('sha256').update(await readFile(target)).digest('hex');}
await writeFile(new URL('public/data/porxos-study.json',root),JSON.stringify({...config,workingGeometry:PORXO_STUDY,imageSha256:hashes},null,2)+'\n');
console.log(JSON.stringify({version:config.version,publicImages:hashes,historicalDimensions:config.historicalDimensions}));
