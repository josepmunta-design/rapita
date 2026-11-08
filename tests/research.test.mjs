import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {filterResearch,censusAt,inheritedContextVisible,evidenceForYear} from '../src/research-model.mjs';
import {chronologyAt} from '../src/chronology.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse((await readFile(new URL(p,root),'utf8')).replace(/^\uFEFF/,''));
const canonical=await json('data/research-19c.json'),data=await json('public/data/research-19c.json'),manifest=await json('docs/1800-1900/manifest.json');
test('every public documentary claim resolves to a source; catalogue leads never become built geometry',()=>{
 const ids=new Set(data.sources.map(s=>s.id));assert.equal(ids.size,data.sources.length);
 for(const r of [...data.events,...data.leads,...data.conflicts]){assert.ok(r.refs.length);for(const id of r.refs)assert.ok(ids.has(id),id);}
 assert.deepEqual(data.events,canonical.events);assert.ok(data.events.every(e=>e.geometry==='none'));
 assert.ok(data.leads.every(l=>l.geometry===null&&l.status==='original-pendent'));
 assert.equal(data.sources.find(s=>s.id==='XIX09').availability,'catalogue-only');assert.equal(data.sources.find(s=>s.id==='XIX19').availability,'unavailable');
 assert.ok(data.conflicts.some(c=>c.id==='far-month'));assert.ok(data.conflicts.some(c=>c.id==='chart-1878'));
});
test('census values match all seven source CSV columns, preserving unavailable counts and distinct concepts',async()=>{
 const csv=await readFile(new URL('docs/1800-1900/originals/ine-censos-43136.csv',root),'utf8');
 assert.match(csv,/Municipio: 43136/);const lines=csv.split(/\r?\n/),header=lines.find(l=>l.startsWith(';1842')).split(';').slice(1);
 const rows=['Población de Hecho','Población de Derecho','Hogares'].map(label=>lines.find(l=>l.startsWith(label+';')).split(';').slice(1));
 for(const r of data.census.rows){const i=header.findIndex(x=>x.startsWith(String(r.year)));assert.ok(i>=0);const parse=x=>x==='..'?null:Number(x);assert.deepEqual([r.deFacto,r.deJure,r.households],rows.map(row=>parse(row[i])));}
 assert.equal(censusAt(data.census,1800),null);assert.equal(censusAt(data.census,1856).year,1842);assert.equal(censusAt(data.census,1890).year,1887);assert.equal(censusAt(data.census,1900).year,1900);assert.throws(()=>censusAt(data.census,NaN));
});
test('search handles accents, source identifiers, combined words, topics and future records',()=>{
 assert.ok(filterResearch(data.events,{query:'navegacio',topic:'canal'}).length>0);
 assert.equal(filterResearch(data.sources,{query:'XIX08 eixample'})[0].id,'XIX08');
 assert.equal(filterResearch(data.events,{query:'ferrocarril',until:1879}).length,0);
 assert.ok(filterResearch(data.events,{query:'ferrocarril',until:1880}).length>0);
 assert.equal(filterResearch(data.events,{query:'noexistentqwerty'}).length,0);
});
test('later evidence changes the selected documentary milestone without fabricating new entity phases',async()=>{
 const ch=await json('public/data/chronology.json');assert.deepEqual(ch.range,[1778,1993]);
 assert.equal(chronologyAt(ch,1851).milestone.year,1851);assert.equal(chronologyAt(ch,1900).milestone.year,1900);
 assert.deepEqual(chronologyAt(ch,1851).entities,chronologyAt(ch,1800).entities);
 assert.equal(evidenceForYear(data,1880).events.length,2);assert.equal(inheritedContextVisible(1800,false),true);assert.equal(inheritedContextVisible(1864,false),false);assert.equal(inheritedContextVisible(1864,true),true);
 assert.equal(ch.milestones.find(m=>m.year===1950).label,'Context de postguerra');
});
test('all archived source copies have valid signatures and immutable hashes; hosted files exist',async()=>{
 for(const s of data.sources){if(s.file){const f=manifest.files.find(f=>f.file==='originals/'+s.file);assert.equal(f.formatValid,true,s.id);assert.equal(f.sha256,s.sha256,s.id);const raw=await readFile(new URL('docs/1800-1900/originals/'+s.file,root)).catch(e=>{if(e.code==='ENOENT')return null;throw e;});if(raw)assert.equal(createHash('sha256').update(raw).digest('hex'),s.sha256,s.id);}if(s.publicFile)assert.ok((await stat(new URL('public/data/'+s.publicFile,root))).size>0,s.id);}
 assert.equal(data.archive.verifiedFiles,manifest.files.filter(f=>f.formatValid).length);
});
