"""Regenerate per-entity Markdown/HTML and explicit chronology from reviewed research.

No scene/timeline settings are changed. Original files are read, never rewritten.
"""
from pathlib import Path
from collections import Counter
from copy import deepcopy
from html import escape
from urllib.parse import quote
import json,re,hashlib,os,shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/EDIFICIS';FONTS=OUT/'fonts-20261031'
load=lambda p:json.loads(p.read_text(encoding='utf8'))
def save(p,d):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
research=load(ROOT/'data/building-research.json');inventory=load(FONTS/'inventory.json');notes=load(ROOT/'data/new-source-notes.json');records={r['id']:{**r,**notes[r['id']]}for r in inventory['records']}
# Preserve an exact private research copy so dossiers keep working if the intake folder moves.
(FONTS/'originals').mkdir(exist_ok=True)
for rec in records.values():
 source=Path(rec['absolutePath']);target=FONTS/'originals'/(rec['id']+source.suffix.lower())
 if not target.exists():shutil.copy2(source,target)
 if hashlib.sha256(target.read_bytes()).hexdigest()!=rec['sha256']:raise ValueError('Archived source hash mismatch: '+rec['id'])
 rec['archivedPath']=str(target)
prior={
 'ANT-TESI':{'id':'ANT-TESI','title':'Noèlia Borràs Matamoros La nova i reial població de Sant Carles de la Ràpita','absolutePath':str(ROOT/'tesi doctoral.pdf'),'reading':'Tesi anterior revisada focalment al projecte. Fonts i pàgines indicades a cada citació; no és un nou testimoni de la carpeta.'},
 'ANT-HIST':{'id':'ANT-HIST','title':'Catàleg de recerca anterior fins al1950','absolutePath':str(ROOT/'data/history-catalog.json'),'reading':'Dades prèviament revisades i conflictes conservats. Aquesta revisió no converteix pistes en dades validades.'},
 'ANT-PORXOS':{'id':'ANT-PORXOS','title':'Expedient documental dels porxos versió0.12','absolutePath':str(ROOT/'docs/PORXOS.md'),'reading':'IPAC6415, Salvany1916 i mesures d’assaig separades.'},
 'ANT-LIT':{'id':'ANT-LIT','title':'Expedient anterior de Roquer i canal','absolutePath':str(ROOT/'docs/ROQUER_CANAL.md'),'reading':'Inclou projecteT-6/8 i límits d’execució.'},
 'ANT-LAND':{'id':'ANT-LAND','title':'Expedient anterior de Glorieta i Guardiola','absolutePath':str(ROOT/'docs/GLORIETA_GUARDIOLA.md'),'reading':'Hipòtesis i cronologia prèviament explicitades.'},
 'WEB-AGS':{'id':'WEB-AGS','title':'Ministeri de Cultura Mapa del delta de l’Ebre amb fortificacions AGS MPD07,063','url':'https://www.cultura.gob.es/dam/jcr%3A28bf9496-836a-4abe-9eae-b20ea1ffbd93/Catalu-a.pdf','reading':'Catàleg oficial identifica el mapa amb l’any1585. Consulta31/10/2026; no és data llegida en elcamp de la còpia local.'}}
records.update(prior)
records.update(research.get("externalSources",{}))
models={}
for file,keys in [('housing.json',['structures']),('center.json',['sites']),('littoral.json',['sites']),('landmarks.json',['sites']),('urban-fabric.json',['sites','routes'])]:
 d=load(ROOT/'public/data'/file)
 for key in keys:
  for model in d[key]:models[model['id']]={'file':'public/data/'+file,'data':model}
models['esglesia_nova']={'file':'public/data/buildings/esglesia-nova.json','data':load(ROOT/'public/data/buildings/esglesia-nova.json')}
for model in load(ROOT/'public/data/littoral.json').get('plan1748Project',[]):
 models[model['id']]={'file':'public/data/littoral.json','data':model}
entries=deepcopy(research['entities']);main_count=len(entries)
model_links=load(ROOT/'data/dossier-model-links.json')
for e in entries:
 if e['id'] in model_links['overrides']:e['currentModelIds']=model_links['overrides'][e['id']]
by={e['id']:e for e in entries}
groups={'royal-finished':'cases-acabades','royal-covered':'cases-cobertes-inacabades','royal-portico':'cases-porxos','royal-small-coast':'cases-petites'}
housing=load(ROOT/'public/data/housing.json')
for s in housing['structures']:
 if s['group']not in groups:continue
 parent=by[groups[s['group']]];e=deepcopy(parent);id='unitat-'+s['id'];idx=s['id'].rsplit('-',1)[-1]
 e.update(id=id,name=f"{parent['name']} cos d’estudi {idx}",category='cos residencial d’assaig',parentDossier=parent['id'],currentModelIds=[s['id']],images=[],relations=[parent['id']],unknowns=parent['unknowns']+['Identitat del solar històric d’aquest cos tècnic, encara desconeguda.'])
 e['facts']=[{'text':'Aquest número identifica un cos del model actual. No és una numeració cadastral ni identifica una casa documentalment. Els testimonis i fases del tipus es reprodueixen aquí com a context compartit, sense verificar-ne la correspondència individual.','references':[{'sourceId':'N112','locator':'art.1–4 p.230–231'}]}]+parent['facts']
 if s.get('reservation')or s['id']in['royal-finished-21','royal-finished-22']:
  e['facts'].append({'text':'Cos d’assaig reservat per a la Fonda Nova i substituït en mostrar el centre. No és una casa addicional independent de la fonda ni correspon als números històrics21 o22.','references':[{'sourceId':'N112','locator':'p.210 i documentació del model'}]});e['relations'].append('fonda-nova')
 for i,p in enumerate(e['phases'],1):p['id']=f'{id}-fase-{i:02}';p['individualIdentityVerified']=False
 entries.append(e)

def prose(s):
 for a,b in {'dela':'de la','deles':'de les','elmateix':'el mateix','delmateix':'del mateix','eltext':'el text','altext':'al text','alnom':'al nom','alpeu':'al peu','alport':'al port','alcap':'al cap','almapa':'al mapa','alregistre':'al registre','alprojecte':'al projecte','alcatàleg':'al catàleg','delseu':'del seu','delfull':'del full','delsegle':'del segle','alvolum':'al volum','alnucli':'al nucli','enobres':'en obres','deguix':'de guix','deTalavera':'de Talavera','elcontrast':'el contrast','delmeu':'del meu'}.items():s=re.sub(r'\b'+a+r'\b',b,s)
 s=re.sub(r'(?<=[a-zà-ÿ])(?=[A-ZÀ-Ý][a-zà-ÿ])',' ',s)
 s=re.sub(r'(?<=[a-zà-ÿ])(?=\d|N\d|[A-Z]{2,})',' ',s)
 s=re.sub(r'(?<=\d)(?=[a-zà-ÿ])',' ',s)
 s=re.sub(r'\bdela\b','de la',s)
 s=re.sub(r'\bdeles\b','de les',s)
 return s.replace('Chat GPT','ChatGPT').replace('Cóс','Cóc').replace('del’Ebre','de l’Ebre').replace('del’hortizó','de l’horitzó').replace('del’altre','de l’altre').replace('del’exemplar','de l’exemplar').replace('del’original','de l’original').replace('enobres','en obres').replace('acontrast','a contrast').replace('0.12','0.12')
def linkpath(p,base):return quote(os.path.relpath(p,base).replace('\\','/'),safe='/.:')
def source_link(ref,base):
 r=records[ref['sourceId']];url=r.get('url')or linkpath(r.get('archivedPath',r['absolutePath']),base)
 return f"[{ref['sourceId']}]({url}) · {prose(ref['locator'])}"
def cite(refs,base):return '; '.join(source_link(r,base)for r in refs)
CSS='''body{margin:0;background:#f5f3ec;color:#203a34;font:16px/1.65 system-ui,sans-serif}main{max-width:920px;margin:0 auto;padding:40px 32px 80px}a{color:#85532e;text-underline-offset:3px}h1{font:42px/1.15 Georgia,serif;margin:26px 0}h2{font:29px/1.2 Georgia,serif;margin:38px 0 16px}h3{font-size:19px;margin:24px 0 10px}.meta{font-size:13px;color:#5c7165}.note{padding:18px 22px;background:#e6ebde;border-left:4px solid #799078}article{border-top:1px solid #c9d1c4;padding:18px 0}.sources{font-size:13px}img{display:block;width:auto;max-width:100%;height:auto;max-height:650px;margin:18px auto}figure{margin:24px 0}figcaption{font-size:13px}table{width:100%;border-collapse:collapse;font-size:14px}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid #c9d1c4}th{background:#e8ecdf}input{box-sizing:border-box;width:100%;padding:14px;font:inherit;margin:15px 0;border:1px solid #a8b6a2;background:white}.tags{font-size:12px;text-transform:uppercase;letter-spacing:.12em}li{margin:8px 0}code{word-break:break-word}.card{padding:16px 0;border-bottom:1px solid #ccd4c4}.hidden{display:none}@media(max-width:600px){main{padding:24px 18px}h1{font-size:34px}table{font-size:12px}}@media print{body{background:white}main{max-width:none;padding:0}nav,input{display:none}article,figure{break-inside:avoid}h2,h3{break-after:avoid}}'''
def webpage(title,body):return '<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>'+CSS+'</style><main>'+body+'</main></html>'
def html_ref(ref,base):
 r=records[ref['sourceId']];url=r.get('url')or linkpath(r.get('archivedPath',r['absolutePath']),base)
 return f'<a href="{escape(url)}">{escape(ref["sourceId"])}</a> · {escape(prose(ref["locator"]))}'
def html_cite(refs,base):return '<span class="sources">'+ '; '.join(html_ref(r,base)for r in refs)+'</span>'
allrefs=set();model_coverage={};phase_count=0
for e in entries:
 folder=OUT/e['id'];folder.mkdir(exist_ok=True)
 refs_used={r['sourceId']for r in e['location']['references']}
 for f in e['facts']:refs_used.update(r['sourceId']for r in f['references'])
 for i,p in enumerate(e['phases'],1):
  p['state']=prose(p['state']);p['label']=prose(p['label']);p['id']=f'{e["id"]}-fase-{i:02}'
  p['outsideTargetRange']=None if p['witnessYear']is None else not research['targetRange'][0]<=p['witnessYear']<=research['targetRange'][1]
  p['datePrecision']='desconeguda'if p['witnessDate']is None else 'interval'if'/'in p['witnessDate']else 'dia'if len(p['witnessDate'])==10 else 'mes'if len(p['witnessDate'])==7 else 'any'
  refs_used.update(r['sourceId']for r in p['references']);phase_count+=1
 for id in e['images']:assert id in records;refs_used.add(id)
 assert refs_used<=set(records),refs_used-set(records)
 allrefs.update(refs_used)
 snapshots=[models[id]for id in e['currentModelIds']if id in models]
 for id in e['currentModelIds']:
  if id in models:model_coverage.setdefault(id,[]).append(e['id'])
 e['name']=prose(e['name']);e['location']['description']=prose(e['location']['description'])
 for f in e['facts']:f['text']=prose(f['text'])
 e['modellingActions']=[prose(x)for x in e['modellingActions']]
 save(folder/'fases.json',{'entityId':e['id'],'targetRange':research['targetRange'],'rule':'Testimonis datats, no interpolació automàtica ni dates de construcció inventades. Els testimonis sense data o contradictoris no activen geometria.','phases':e['phases']})
 save(folder/'fonts.json',[records[id]for id in sorted(refs_used)])
 save(folder/'model-actual.json',{'entityId':e['id'],'captureDate':research['reviewed'],'confidence':'C excepte observacions expressament identificades a les dades originals','warning':'Paràmetres del prototip0.12.0. No són mesures històriques noves. La cota delMDT és contemporània; el suport és tècnic.','snapshots':snapshots})
 save(folder/'ubicacio.json',{'entityId':e['id'],'historicalEvidence':e['location'],'studyPositions':[{'modelId':s['data'].get('id','esglesia_nova'),'anchor':s['data'].get('anchor'),'footprintUTM':s['data'].get('footprintUTM'),'alongAzimuthDegrees':s['data'].get('alongAzimuthDegrees'),'planLetter':s['data'].get('planLetter',s['data'].get('letter')),'projectOnly':s['data'].get('projectOnly',False),'positionSource':s['data'].get('positionSource'),'source':s['file'],'confidence':'C posició del prototip, no punt històric mesurat'}for s in snapshots],'warning':'EPSG:25831 correspon al model; no s’atribueix als plànols antics. La planta històrica i l’error d’ajust continuen desconeguts.'})
 lines=[f'# {e["name"]}','',f'Revisió: **31/10/2026** · {e["category"]}. Expedient per a reconstrucció i col·locació per èpoques.','', '[Índex dels expedients](../INDEX.md) · [Lectura en navegador](index.html) · [Fases estructurades](fases.json) · [Fonts completes](fonts.json) · [Paràmetres actuals](model-actual.json)','']
 body=f'<nav><a href="../index.html">← Tots els expedients</a></nav><p class="tags">{escape(e["category"])} · 31 octubre 2026</p><h1>{escape(e["name"])}</h1><p class="note">El document conserva testimonis de diverses èpoques. Una data de fotografia o inventari no equival a la data de construcció. Les coordenades i dimensions del prototip es mantenen separades de l’evidència.</p>'
 if e.get('parentDossier'):
  lines+=['**Cos d’assaig sense identificació parcel·lària validada.** Context compartit: ['+by[e['parentDossier']]['name']+'](../'+e['parentDossier']+'/README.md).','']
  body+=f'<p><a href="../{e["parentDossier"]}/index.html">Expedient del tipus compartit</a> · Identitat individual pendent.</p>'
 lines+=['## Col·locació', '', e['location']['description'],'','Certesa: '+e['location']['confidence']+'.', '',cite(e['location']['references'],folder),'','**Coordenades històriques i planta georeferenciada:** desconegudes (`null`). La ubicació actual de treball, si n’hi ha, es consulta a `ubicacio.json` i `model-actual.json`.','', '## Descripció documentada','']
 body+='<h2>Col·locació</h2><p>'+escape(e['location']['description'])+'</p><p>Certesa documental: '+escape(e['location']['confidence'])+'.</p>'+html_cite(e['location']['references'],folder)+'<p class="meta">Coordenades històriques i planta georeferenciada: desconegudes. Ubicació del prototip a model-actual.json, amb certesa C.</p><h2>Descripció documentada</h2>'
 if snapshots:
  rows=[]
  for snapshot in snapshots:
   s=snapshot['data'];anchor=s.get('anchor')
   if isinstance(anchor,dict):anchor=[anchor.get('easting'),anchor.get('northing')]
   if not isinstance(anchor,list) or len(anchor)<2:continue
   rows.append((s.get('id','esglesia_nova'),str(s.get('planLetter',s.get('letter','—'))),f'{anchor[0]:.3f}',f'{anchor[1]:.3f}','Projecte de 1748' if s.get('projectOnly') else 'Model d’assaig'))
  if rows:
   table=['### Posicions actuals del visor · EPSG:25831','','| Model | Lletra | E (m) | N (m) | Estat |','|---|---|---:|---:|---|']+['| '+' | '.join(row)+' |'for row in rows]
   at=lines.index('## Descripció documentada');lines[at:at]=table+['','Plantes i orientacions completes a `ubicacio.json`; valors generats directament dels mateixos fitxers que el mapa. No són punts històrics mesurats.','']
   html_table='<h3>Posicions actuals del visor · EPSG:25831</h3><table><tr><th>Model</th><th>Lletra</th><th>E (m)</th><th>N (m)</th><th>Estat</th></tr>'+''.join('<tr>'+''.join('<td>'+escape(cell)+'</td>'for cell in row)+'</tr>'for row in rows)+'</table><p class="meta">Plantes i orientacions completes a ubicacio.json; valors generats dels mateixos fitxers que el mapa. No són punts històrics mesurats.</p>'
   body=body.replace('<h2>Descripció documentada</h2>',html_table+'<h2>Descripció documentada</h2>')
 for f in e['facts']:
  lines+=['- '+f['text']+' '+cite(f['references'],folder)]
  body+='<p>'+escape(f['text'])+'<br>'+html_cite(f['references'],folder)+'</p>'
 lines+=['','## Canvis i testimonis per època','']
 body+='<h2>Canvis i testimonis per època</h2>'
 for p in e['phases']:
  date=p['witnessDate']or'Sense data fixada';lim=' · comparació fora de 1778–1950'if p['outsideTargetRange']else''
  lines+=['### '+date+' · '+p['label'],'',p['state'],'',f'Tipus: {p["kind"]}{lim}. Data de construcció o canvi exacte: pendent si no està expressament acreditada. Activació automàtica al selector: **no**.','',cite(p['references'],folder),'']
  body+=f'<article><p class="tags">{escape(date)} · {escape(p["kind"])}{escape(lim)}</p><h3>{escape(p["label"])}</h3><p>{escape(p["state"])}</p>{html_cite(p["references"],folder)}<p class="meta">La data identifica el testimoni. Activació automàtica al selector desactivada fins a resoldre identitat, mètrica i intervals.</p></article>'
 lines+=['## Fotografies i plànols de comparació','']
 body+='<h2>Fotografies i plànols de comparació</h2>'
 if not e['images']:lines+=['No s’ha assignat una fotografia individual sense correspondència suficient. Els plànols i els textos citats són la base de treball.',''];body+='<p>No s’ha assignat una fotografia individual sense correspondència suficient. Consulteu els plànols i textos citats.</p>'
 for id in e['images']:
  rec=records[id];url=linkpath(rec.get('archivedPath',rec['absolutePath']),folder);date=str(rec.get('witnessDate')or'data original no fixada')
  lines+=[f'- [{id} · {prose(rec["title"])}]({url}) · {date}. {prose(rec["reading"])}']
  # Original user-provided research photographs stay in the supplied folder; no publication in public/.
  body+=f'<figure><a href="{escape(url)}"><img loading="lazy" src="{escape(url)}" alt="{escape(prose(rec["title"]))}"></a><figcaption><strong>{id} · {escape(date)}</strong> · {escape(prose(rec["reading"]))}</figcaption></figure>'
 lines+=['','## Aplicació al model i treball pendent','']+['- [ ] '+x for x in e['modellingActions']]+['','### Dades encara desconegudes','']+['- '+x for x in e['unknowns']]
 body+='<h2>Aplicació al model i treball pendent</h2><ul>'+''.join('<li>'+escape(x)+'</li>'for x in e['modellingActions'])+'</ul><h3>Dades encara desconegudes</h3><ul>'+''.join('<li>'+escape(x)+'</li>'for x in e['unknowns'])+'</ul>'
 if snapshots:
  lines+=['','### Correspondència amb el prototip','',', '.join('`'+id+'`'for id in e['currentModelIds']if id in models)+'. Identificadors tècnics, sense equivalència automàtica amb números històrics. Vegeu `model-actual.json` per a tots els camps i valors actuals.']
 if e['relations']:
  lines+=['','### Expedients relacionats','']+['- ['+by[id]['name']+'](../'+id+'/README.md)'for id in e['relations']if id in by]
 body+='<p><a href="fases.json">Fases estructurades</a> · <a href="ubicacio.json">Col·locació i incertesa</a> · <a href="model-actual.json">Paràmetres del prototip</a> · <a href="fonts.json">Referències completes</a></p><h2>Fonts utilitzades</h2><ul>'
 lines+=['','## Fonts utilitzades','']
 for id in sorted(refs_used):
  rec=records[id];url=rec.get('url')or linkpath(rec.get('archivedPath',rec['absolutePath']),folder);title=prose(rec['title'])
  lines+=['- **'+id+'** · ['+title+']('+url+'). '+prose(rec.get('reading',''))]
  body+=f'<li><a href="{escape(url)}">{id} · {escape(title)}</a><br><span class="meta">{escape(prose(rec.get("reading","")))}</span></li>'
 body+='</ul>'
 (folder/'README.md').write_text('\n'.join(lines)+'\n',encoding='utf8');(folder/'index.html').write_text(webpage(e['name'],body),encoding='utf8')

by_all={e['id']:e for e in entries}
index=['# Expedients dels edificis i llocs de la Ràpita','','Revisió documental del 31 d’octubre de 2026. **'+str(main_count)+' expedients principals** i **'+str(len(entries)-main_count)+' dossiers individuals dels cossos residencials d’assaig**. Cada carpeta conserva descripció, col·locació, fases i fonts.','', '[Obre el lector en navegador](index.html) · [Revisió dels plànols](PLANS.md) · [Catàleg dels 113 fitxers](FONTS.md) · [Criteris de fases i contradiccions](CRITERIS_I_CONFLICTES.md)','', 'La visualització activa continua a 1778–1800; l’horitzó de recerca és 1778–1950. Es conserven testimonis anteriors i posteriors com a comparació, sense convertir-los en obra executada dins del període. No s’ha canviat cap geometria durant aquesta fase.','', '## Edificis i llocs amb expedient propi','', '| Expedient | Tipus | Fites del testimoni |','|---|---|---|']
cards=''
for e in entries:
 dates=' · '.join(dict.fromkeys(p['witnessDate']or'sense data'for p in e['phases']))
 if not e.get('parentDossier'):index+=[f'| [{e["name"]}]({e["id"]}/README.md) | {e["category"]} | {dates} |']
 cards+=f'<div class="card" data-text="{escape((e["name"]+" "+e["id"]+" "+e.get("parentDossier","")+" "+e["category"]+" "+dates).lower())}"><a href="{e["id"]}/index.html">{escape(e["name"])}</a><div class="meta">{escape(e["category"])} · {escape(dates)}</div></div>'
index+=['','## Cossos residencials individuals del prototip','','Els números següents són identificadors de treball. Les fases del tipus es conserven com a context compartit: no acrediten una biografia individual de cada casa.','']
for e in entries:
 if e.get('parentDossier'):index+=['- ['+e['name']+']('+e['id']+'/README.md)']
(OUT/'INDEX.md').write_text('\n'.join(index)+'\n',encoding='utf8')
body=f'<p class="tags">Arxiu de reconstrucció · 31 octubre 2026</p><h1>Edificis i llocs de la Ràpita</h1><p>{main_count} expedients principals i {len(entries)-main_count} cossos residencials d’assaig, amb descripcions, col·locació, fases i fonts.</p><p class="note">Horitzó1778–1950. La data d’un testimoni no és automàticament una data d’obra. Les posicions del prototip estan separades de la documentació històrica.</p><nav><a href="PLANS.md">Plànols</a> · <a href="FONTS.md">Catàleg de fonts</a> · <a href="CRITERIS_I_CONFLICTES.md">Criteris i conflictes</a></nav><label for="search">Cerca un edifici, ús o any</label><input id="search" type="search" placeholder="Porxos, Mançana, 1794, 1916…"><p class="meta" id="count">{len(entries)} expedients</p>'+cards+'''<script>document.getElementById('search').addEventListener('input',e=>{const q=e.target.value.toLocaleLowerCase('ca').normalize('NFD').replace(/[\u0300-\u036f]/g,''),cards=[...document.querySelectorAll('.card')];let n=0;for(const c of cards){const show=c.dataset.text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes(q);c.hidden=!show;if(show)n++;}document.getElementById('count').textContent=n+' expedients';});</script>'''
body=body.replace('href="PLANS.md"','href="PLANS.html"').replace('href="FONTS.md"','href="FONTS.html"').replace('href="CRITERIS_I_CONFLICTES.md"','href="CRITERIS_I_CONFLICTES.html"').replace('Horitzó1778','Horitzó 1778')
(OUT/'index.html').write_text(webpage('Expedients dels edificis i llocs',body),encoding='utf8')

lines=['# Catàleg de la nova documentació','','113 fitxers originals inventariats amb SHA256. Els noms dels fitxers i les dates de captura digital no substitueixen data/autoria del testimoni. Les còpies acolorides i els retalls d’una mateixa imatge no són testimonis independents.','']
for id,rec in records.items():
 url=rec.get('url')or linkpath(rec.get('archivedPath',rec['absolutePath']),OUT);lines+=['## '+id+' '+prose(rec['title']),'',f'[{rec.get("file","Obre la font")}]({url})','',prose(rec.get('reading','')),'']
 if id in notes:lines+=['Data o interval atribuït: **'+str(rec.get('witnessDate')or'desconegut')+'**. Tipus: '+rec['kind']+'. Revisió: '+rec['reviewMethod']+'.','',f'SHA256: `{rec["sha256"]}`.','']
(OUT/'FONTS.md').write_text('\n'.join(lines)+'\n',encoding='utf8')
save(FONTS/'catalogue-reviewed.json',{'reviewed':research['reviewed'],'sourceRoot':inventory['sourceRoot'],'records':list(records.values())})
save(OUT/'index.json',{'schemaVersion':1,'reviewed':research['reviewed'],'mainDossiers':main_count,'individualStudyBodies':len(entries)-main_count,'phaseRecords':phase_count,'targetRange':research['targetRange'],'activeSceneRange':research['activeSceneRange'],'items':[{'id':e['id'],'name':e['name'],'parentDossier':e.get('parentDossier'),'path':e['id']+'/README.md','phasePath':e['id']+'/fases.json','modelIds':e['currentModelIds']}for e in entries]})
missing_models=set(models)-set(model_coverage)
save(OUT/'validation.json',{'entities':len(entries),'main':main_count,'individualStudyBodies':len(entries)-main_count,'phaseRecords':phase_count,'sourceFiles':len(inventory['records']),'allReferencesResolved':True,'automaticTimelineActivations':sum(p['automaticTimelineActivation']for e in entries for p in e['phases']),'modelsWithoutDedicatedDossier':sorted(missing_models),'currentModelsLinked':model_coverage,'measuredHistoricalFootprintsInvented':0})
print(json.dumps({'main':main_count,'individual':len(entries)-main_count,'phases':phase_count,'modelsWithoutDossier':sorted(missing_models)},ensure_ascii=False))
