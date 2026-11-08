from pathlib import Path
from urllib.parse import unquote,urlparse
from html.parser import HTMLParser
import json,hashlib,re
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/EDIFICIS'
load=lambda p:json.loads(p.read_text(encoding='utf8'))
index=load(OUT/'index.json');inventory=load(OUT/'fonts-20261031/inventory.json');catalog=load(OUT/'fonts-20261031/catalogue-reviewed.json');sources={r['id']:r for r in catalog['records']}
# Institutional references introduced by the lighthouse and Casotes generators.
sources.update(load(ROOT/'data/building-research.json').get('externalSources',{}))
class Links(HTMLParser):
 def __init__(self):super().__init__();self.links=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ['href','src']and v:self.links.append(v)
errors=[];phases=0;links=0
live_models={}
for file,keys in [('housing.json',['structures']),('center.json',['sites']),('littoral.json',['sites','plan1748Project']),('landmarks.json',['sites']),('urban-fabric.json',['sites','routes'])]:
 data=load(ROOT/'public/data'/file)
 for key in keys:
  for model in data.get(key,[]):live_models[(f'public/data/{file}',model['id'])]=model
church=load(ROOT/'public/data/buildings/esglesia-nova.json')
live_models[('public/data/buildings/esglesia-nova.json',church.get('id','esglesia_nova'))]=church
for rec in inventory['records']:
 cached=OUT/'fonts-20261031/originals'/(rec['id']+Path(rec['file']).suffix.lower())
 for p in[cached,Path(rec['absolutePath'])]:
  if not p.exists()or hashlib.sha256(p.read_bytes()).hexdigest()!=rec['sha256']:errors.append('Source changed or missing: '+str(p))
 assert rec['id']in sources
for item in index['items']:
 folder=OUT/item['id']
 for name in['README.md','index.html','fases.json','fonts.json','model-actual.json','ubicacio.json']:
  if not(folder/name).is_file():errors.append('Missing '+str(folder/name))
 p=load(folder/'fases.json');ids=set()
 for phase in p['phases']:
  phases+=1
  if phase['id']in ids:errors.append('Duplicate phase '+phase['id'])
  ids.add(phase['id'])
  if phase['automaticTimelineActivation']is not False:errors.append('Unreviewed timeline activation')
  for ref in phase['references']:
   if ref['sourceId']not in sources:errors.append('Unresolved reference '+ref['sourceId'])
   if not ref['locator']:errors.append('Missing source locator')
  if phase['witnessYear']and phase['witnessYear']>1950 and phase['outsideTargetRange']is not True:errors.append('Future witness hidden as in-range')
 place=load(folder/'ubicacio.json')['historicalEvidence']
 if place['historicalCoordinates']is not None or place['georeferencedHistoricalFootprint']is not None:errors.append('Unreviewed historical geometry '+item['id'])
 snapshots=load(folder/'model-actual.json')['snapshots'];positions=load(folder/'ubicacio.json')['studyPositions']
 for snapshot,position in zip(snapshots,positions):
  model=snapshot['data'];id=model.get('id','esglesia_nova');actual=live_models.get((snapshot['file'],id))
  if actual!=model:errors.append('Stale model snapshot '+item['id']+' / '+id)
  if position['anchor']!=model.get('anchor')or position.get('footprintUTM')!=model.get('footprintUTM'):errors.append('Stale documentary position '+item['id']+' / '+id)
 if len(snapshots)!=len(positions):errors.append('Position count mismatch '+item['id'])
for p in OUT.rglob('*.html'):
 parser=Links();parser.feed(p.read_text(encoding='utf8'))
 for url in parser.links:
  if urlparse(url).scheme or url.startswith('#'):continue
  target=(p.parent/unquote(url.split('#',1)[0])).resolve();links+=1
  if not target.exists():errors.append('Broken local link '+str(p.relative_to(OUT))+' -> '+url)
if phases!=index['phaseRecords']:errors.append('Index phase count mismatch: '+str(phases)+' != '+str(index['phaseRecords']))
result={'status':'passed'if not errors else'failed','dossiers':len(index['items']),'mainDossiers':index['mainDossiers'],'individualStudyBodies':index['individualStudyBodies'],'phaseRecords':phases,'originalFilesVerifiedUnchanged':len(inventory['records']),'archivedCopiesVerified':len(inventory['records']),'localHTMLLinksChecked':links,'errors':errors}
(OUT/'checks.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(result,ensure_ascii=False));raise SystemExit(bool(errors))
