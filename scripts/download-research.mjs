// Download the documented corpus. Existing validated copies are reused unless --refresh is requested.
import {readFile,writeFile,mkdir,rename,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';import {promisify} from 'node:util';import {fileURLToPath} from 'node:url';
const run=promisify(execFile),root=new URL('../',import.meta.url),folder=new URL('docs/1800-1900/originals/',root);
const plan=JSON.parse(await readFile(new URL('data/research-downloads.json',root),'utf8')),manifest=JSON.parse(await readFile(new URL('docs/1800-1900/manifest.json',root),'utf8'));
await mkdir(folder,{recursive:true});const cookie=new URL('tmp/ine-research-cookies.txt',root);await mkdir(new URL('tmp/',root),{recursive:true});
const flags=process.platform==='win32'?['--ssl-revoke-best-effort']:[];let cookiesReady=false;
for(const item of plan.files){const file=new URL(item.file,folder),known=manifest.files.find(f=>f.file==='originals/'+item.file);
 try{const raw=await readFile(file);if(!process.argv.includes('--refresh')&&known?.sha256===createHash('sha256').update(raw).digest('hex')){console.log('verified',item.file);continue;}}catch{}
 if(item.session&&!cookiesReady){const url=plan.files.find(f=>f.file==='ine-censos-43136.html').url;await run('curl',[...flags,'--fail','-L','-sS','-c',fileURLToPath(cookie),'-o',fileURLToPath(new URL('ine-censos-43136.html',folder)),url]);cookiesReady=true;}
 const part=new URL(item.file+'.part',folder);
 try{await run('curl',[...flags,'--fail','-L','-sS','--max-time','240',...(item.session?['-b',fileURLToPath(cookie)]:[]),'-o',fileURLToPath(part),item.url]);const raw=await readFile(part);if(item.file.endsWith('.pdf')&&raw.subarray(0,5).toString()!=='%PDF-')throw Error('Expected PDF');if(item.file.endsWith('.jpg')&&!(raw[0]===255&&raw[1]===216))throw Error('Expected JPEG');await rename(part,file);console.log('downloaded',item.file);}catch(error){console.error('failed',item.file,error.message);process.exitCode=1;}
}
