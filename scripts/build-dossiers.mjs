// Converteix els expedients de docs/EDIFICIS en public/data/dossiers.json, que llegeix el tauler lateral del visor.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),dir=new URL('docs/EDIFICIS/',root);
const text=async p=>(await readFile(new URL(p,dir),'utf8')).replace(/^﻿/,'');
const index=JSON.parse(await text('index.json'));
const links=JSON.parse((await readFile(new URL('data/dossier-model-links.json',root),'utf8')).replace(/^﻿/,''));

// Els enllaços a altres expedients es converteixen en marques {{id|nom}}; la resta d'enllaços (originals no publicats) queden com a text.
const clean=s=>s.replace(/\[([^\]]+)\]\(\.\.\/([a-z0-9-]+)\/README\.md\)/g,'{{$2|$1}}').replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/`([^`]+)`/g,'$1').trim();
const sections=md=>{const out={},parts=md.split(/^## /m);out.head=parts.shift();for(const p of parts){const i=p.indexOf('\n');out[p.slice(0,i).trim()]=p.slice(i+1);}return out;};
const bullets=s=>(s??'').split('\n').filter(l=>/^- /.test(l)).map(l=>clean(l.replace(/^- (\[[ x]\] )?/,'')));
// «- [N040 · Títol](../fonts…/originals/N040.jpg) · 1890. Nota»: identificador, títol, fitxer, data indicada i nota.
const photo=l=>{
  const m=l.match(/^- \[(N\d+) · ([^\]]+)\]\(\.\.\/fonts-20261031\/originals\/([^)]+\.(?:jpe?g|png))\)\s*·?\s*(.*)$/i);
  if(!m)return null;
  const [,id,title,file,rest]=m,cut=rest.search(/\.(\s|$)/),dateText=(cut<0?rest:rest.slice(0,cut)).trim(),note=(cut<0?'':rest.slice(cut+1)).trim();
  const year=(dateText.match(/\b(1[5-9]\d\d|20\d\d)\b/)??[])[1];
  return {id,title:title.trim(),file,dateText,year:year?Number(year):null,note:clean(note)};
};
const paragraphs=s=>(s??'').split(/\n\s*\n/).map(p=>p.trim()).filter(p=>p&&!/^[-#]/.test(p));

const media=JSON.parse((await readFile(new URL('data/dossier-media.json',root),'utf8')).replace(/^\uFEFF/,''));
// Catàleg de fonts (FONTS.md): títol, tipus, data atribuïda i arxiu original de cada N###.
const catalogue={};
for(const block of (await text('FONTS.md')).split(/^## (?=N\d+ )/m).slice(1)){
  const [head,...rest]=block.split('\n'),id=head.match(/^(N\d+)/)[1],body=rest.join('\n');
  const file=(body.match(/\]\(fonts-20261031\/originals\/([^)]+)\)/)??[])[1]??null;
  const type=(body.match(/Tipus: ([^.\n]*)\./)??[])[1]??'';
  const date=(body.match(/Data o interval atribuït: \*\*([^*]+)\*\*/)??[])[1]??'';
  const para=body.split(/\n\s*\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('[')&&!x.startsWith('Data o interval')&&!x.startsWith('SHA256'))[0]??'';
  const y=(date.match(/(1[5-9]\d\d|20\d\d)/)??[])[1];
  catalogue[id]={id,title:head.replace(/^N\d+\s*/,'').trim(),file,type,dateText:date,year:y?Number(y):null,note:clean(para).slice(0,260)};
}
const classify=c=>{
  if(!c||!c.file||media.skipTypes.some(t=>c.type.startsWith(t)))return null;
  if(/^fotografia/.test(c.type))return 'photo';
  if(/pl[àa]nol|mapa|projecte urb/.test(c.type))return 'plan';
  if(/^(carta|manuscrit|llegenda|text imprès|gravats)/.test(c.type))return 'document';
  return null;
};
const imageName=file=>file.replace(/\.[^.]+$/,'')+'.jpg';
// Pàgines de l'article N112 citades: «p.232», «p.215 i 226», «p.198,203,220», «p.212–213». Pàgina impresa − 190 = pàgina del PDF.
const articlePages=blob=>{
  const pages=new Set();
  for(const m of blob.matchAll(/\bp\.\s*(\d{3}(?:\s*(?:[,–-]|i)\s*\d{3})*)/g)){
    const nums=m[1].match(/\d{3}/g).map(Number),range=/[–-]/.test(m[1])&&nums.length===2;
    for(const n of range?Array.from({length:nums[1]-nums[0]+1},(_,i)=>nums[0]+i):nums)if(n>=191&&n<=234)pages.add(n);
  }
  for(const m of blob.matchAll(/PDF(\d{1,2})/g))if(Number(m[1])>=1&&Number(m[1])<=44)pages.add(Number(m[1])+media.pageOffset);
  return [...pages].sort((a,b)=>a-b);
};
const items={};
for(const it of index.items){
  const md=await text(it.path),sec=sections(md),fonts=JSON.parse(await text(it.id+'/fonts.json')),fases=JSON.parse(await text(it.phasePath));
  const kind=(sec.head.match(/Revisió: \*\*[^*]+\*\* · ([^.]+)\./)??[])[1]??'';
  const place=paragraphs(sec['Col·locació']).filter(p=>!/^\*\*Coordenades/.test(p));
  const certainty=place.find(p=>/^Certesa:/.test(p));
  const refs=(sec['Col·locació'].match(/^\[N\d+\].*$/m)??[''])[0];
  const unknown=((sec['Aplicació al model i treball pendent']??'').split(/### Dades encara desconegudes/)[1]??'').split(/###/)[0];
  const related=[...(sec['Aplicació al model i treball pendent']??'').matchAll(/\[([^\]]+)\]\(\.\.\/([a-z0-9-]+)\/README\.md\)/g)].map(m=>({id:m[2],name:m[1]}));
  const note=(sec.head.match(/\*\*Cos d’assaig[^\n]*/)??[''])[0];
  const blob=[sec['Col·locació'],sec['Descripció documentada'],sec['Canvis i testimonis per època'],sec['Aplicació al model i treball pendent'],...fases.phases.flatMap(p=>p.references.map(r=>`${r.sourceId} · ${r.locator}`))].join('\n');
  const cited=[...new Set([...blob.matchAll(/\b(N\d{3})\b/g)].map(m=>m[1]).concat(fonts.map(f=>f.id).filter(x=>/^N\d{3}$/.test(x))))];
  const gallery=(sec['Fotografies i plànols de comparació']??'').split(String.fromCharCode(10)).map(l=>photo(l.trimEnd())).filter(Boolean).filter(p=>!media.hideDuplicates.includes(p.id)).map(p=>({...p,kind:'photo',image:imageName(p.file),src:{file:p.file}}));
  const documents=[];
  for(const id of cited){
    if(id==='N112'||media.hideDuplicates.includes(id)||gallery.some(g=>g.id===id))continue;
    const c=catalogue[id],kind=classify(c);if(!kind)continue;
    const entry={id,title:c.title,file:c.file,dateText:c.dateText||'desconeguda',year:c.year,note:c.note,kind,image:imageName(c.file),src:/\.pdf$/i.test(c.file)?{pdf:c.file,page:1}:{file:c.file}};
    (kind==='document'?documents:gallery).push(entry);
  }
  if(cited.includes('N112')){
    for(const m of new Set([...blob.matchAll(/il[·.]l\.?\s*(\d{1,2})/gi)].map(x=>x[1]))){
      const il=media.illustrations[m];if(!il)continue;
      gallery.push({id:'N112 il·l.'+m,title:il.title,file:'N112.pdf',dateText:il.year?String(il.year):'data no fixada',year:il.year,note:il.note,kind:il.kind,image:`N112-il${m}.jpg`,src:il.local?{local:il.local}:{pdf:'N112.pdf',page:il.pdfPage,embedded:true}});
    }
    for(const n of articlePages(blob).slice(0,media.maxArticlePages))documents.push({id:'N112 p.'+n,title:`Article de Reverté (2024), p.${n}`,file:'N112.pdf',dateText:'1794 (comentat el 2024)',year:1794,note:'Pàgina de l’article on es cita aquest edifici. Distingeix el comentari de 2024 del document de 20/5/1794.',kind:'document',image:`N112-p${n}.jpg`,src:{pdf:'N112.pdf',page:n-media.pageOffset}});
  }
  const snapshot=JSON.parse(await text(it.id+'/model-actual.json')).snapshots;
  const traced=snapshot.filter(s=>s.data.planPixels||s.data.projectOnly||s.data.positionSource?.text?.includes('1748'));
  const tracedPosition=traced.length?{text:traced.map(({data:s})=>`${s.planLetter??s.letter??s.id}: ${s.id}, E ${s.anchor[0].toFixed(3)} / N ${s.anchor[1].toFixed(3)} m${s.projectOnly?' (projecte)':''}`).join('; ')+'. EPSG:25831, ajust C compartit amb la costa; no són coordenades històriques mesurades.',url:null}:null;
  items[it.id]={
    id:it.id,name:it.name,parent:it.parentDossier,kind,modelIds:links.overrides[it.id]??it.modelIds,withoutModel:links.withoutModel[it.id]??null,modelNote:links.modelNotes?.[it.id]??null,phaseRule:links.phaseRules?.[it.id]??null,studyPosition:tracedPosition??links.positions?.[it.id]??null,
    placement:place.filter(p=>!/^Certesa:/.test(p)).map(clean).join(' '),certainty:certainty?clean(certainty).replace(/^Certesa: /,''):'',placementRefs:clean(refs),
    historicalCoordinates:null,
    description:bullets(sec['Descripció documentada']),
    phases:fases.phases.map(p=>({label:p.label,date:p.witnessDate,year:p.witnessYear,state:p.state,kind:p.kind,refs:p.references.map(r=>`${r.sourceId} · ${r.locator}`),precision:p.datePrecision,outside:p.outsideTargetRange})),
    photos:gallery,documents,
    todo:(sec['Aplicació al model i treball pendent']??'').split('\n').filter(l=>/^- \[/.test(l)).map(l=>({done:/^- \[x\]/.test(l),text:clean(l.replace(/^- \[[ x]\] /,''))})),
    unknown:bullets(unknown),related:related.filter(r=>r.id!==it.id),
    sources:fonts.map(f=>({id:f.id,title:f.title,year:f.witnessDate,kind:f.kind,reading:f.reading,url:f.url})),
    note:clean(note)
  };
}
// Expedients afegits fora de docs/EDIFICIS (data/dossier-extra.json): peces pròpies del visor que la recerca esmenta dins d'un altre expedient.
const extra=JSON.parse((await readFile(new URL('data/dossier-extra.json',root),'utf8')).replace(/^\uFEFF/,''));
for(const e of extra.items){
  const gallery=[],documents=[];
  for(const id of e.sourceIds??[]){
    const c=catalogue[id],kind=classify(c);if(!kind)continue;
    const entry={id,title:c.title,file:c.file,dateText:c.dateText||'desconeguda',year:c.year,note:c.note,kind,image:imageName(c.file),src:{file:c.file}};
    (kind==='document'?documents:gallery).push(entry);
  }
  items[e.id]={modelNote:links.modelNotes?.[e.id]??null,studyPosition:links.positions?.[e.id]??null,withoutModel:null,historicalCoordinates:null,photos:gallery,documents,note:'',...e,modelIds:links.overrides[e.id]??e.modelIds};
  for(const r of e.related??[])if(items[r.id]&&!items[r.id].related.some(x=>x.id===e.id))items[r.id].related.push({id:e.id,name:e.name});
}
// Fotografies aportades directament dins d'un expedient; fonts locals i dates originals independents del fitxer digital.
for(const [id,photos]of Object.entries(media.localImages??{})){
  const d=items[id];if(!d)throw Error('Unknown local-image dossier '+id);
  for(const p of photos){
    if(d.photos.some(photo=>photo.id===p.id||photo.image===p.image))throw Error('Duplicate local image '+p.id);
    if(p.kind!=='photo'||!p.src?.local||p.src.local.startsWith('/')||p.src.local.split('/').includes('..'))throw Error('Invalid local image '+p.id);
  }
  d.photos.unshift(...photos);
  d.sources.push(...photos.map(p=>({id:p.id,title:p.title,year:p.year,kind:'fotografia aportada',reading:p.note})));
}
for(const d of Object.values(items))if(d.parent&&items[d.parent]){const q=items[d.parent];if(!d.photos.length)d.photos=q.photos;if(!d.documents.length)d.documents=q.documents;}
const pilar=JSON.parse((await readFile(new URL('data/pilar-reverte.json',root),'utf8')).replace(/^\uFEFF/,''));
for(const [id,addition] of Object.entries(pilar.dossiers)){
  const d=items[id];if(!d)throw Error('Unknown PR01 dossier '+id);
  d.description.push(...addition.description);
  d.sources.push({id:pilar.source.id,title:pilar.source.title,year:pilar.source.year,kind:pilar.source.kind,reading:pilar.source.use});
  for(const number of addition.images){
    const p=pilar.images.find(p=>p.number===number);if(!p||p.generated)throw Error('Invalid documentary PR01 image');
    d.photos.push({...p,file:p.image,src:{local:'public/data/reference/pilar-reverte/'+p.image}});
  }
}
// Counts must follow later additions such as Casotes and the lighthouse.
index.phaseRecords=index.items.reduce((n,item)=>n+items[item.id].phases.length,0);
index.mainDossiers=index.items.filter(item=>!item.parentDossier).length;
index.individualStudyBodies=index.items.filter(item=>!!item.parentDossier).length;
index.activeSceneRange=links.activeSceneRange??index.activeSceneRange;
await writeFile(new URL('index.json',dir),JSON.stringify(index,null,2)+'\n');
const out={prefixes:links.prefixes,reviewed:index.reviewed,targetRange:index.targetRange,activeSceneRange:links.activeSceneRange??index.activeSceneRange,items};
await writeFile(new URL('public/data/dossiers.json',root),JSON.stringify(out)+'\n');
console.log('dossiers:',Object.keys(items).length);
