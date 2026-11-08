"""Refresh live model snapshots without rewriting the documentary source readings."""
from pathlib import Path
import json,re,html,subprocess
ROOT=Path(__file__).resolve().parents[1];D=ROOT/'docs/EDIFICIS'
def load(p):return json.loads(p.read_text(encoding='utf8'))
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
models={}
for file,keys in [('housing.json',['structures']),('center.json',['sites']),('littoral.json',['sites','plan1748Project']),('landmarks.json',['sites']),('urban-fabric.json',['sites','routes'])]:
 d=load(ROOT/'public/data'/file)
 for key in keys:
  for s in d.get(key,[]):models[('public/data/'+file,s['id'])]=s
changed=[]
for item in load(D/'index.json')['items']:
 folder=D/item['id'];snap=load(folder/'model-actual.json');place=load(folder/'ubicacio.json');dirty=False
 if item['id']=='paredo-poblacio' and not snap['snapshots']:
  s=models.get(('public/data/urban-fabric.json','paredo-poblacio'))
  if s:
   snap['snapshots']=[{'file':'public/data/urban-fabric.json','data':s}];place['studyPositions']=[{'modelId':s['id'],'anchor':s['anchor'],'footprintUTM':s['footprintUTM'],'retainingLinesUTM':s['retainingLinesUTM'],'alongAzimuthDegrees':None,'planLetter':None,'projectOnly':False,'positionSource':None,'source':'public/data/urban-fabric.json','confidence':'C · traça del croquis; secció i cotes sense mesurar'}];dirty=True
 for old,pos in zip(snap['snapshots'],place['studyPositions']):
  key=(old['file'],old['data'].get('id','esglesia_nova'));s=models.get(key)
  if s is None or s==old['data']:continue
  old['data']=s;dirty=True
  for target,source in [('anchor','anchor'),('footprintUTM','footprintUTM'),('alongAzimuthDegrees','alongAzimuthDegrees'),('positionSource','positionSource')]:pos[target]=s.get(source)
 if not dirty:continue
 snap['captureDate']='2026-11-01';save(folder/'model-actual.json',snap);save(folder/'ubicacio.json',place);changed.append(item['id'])
 # Coordinate tables in the local readers must describe the same current anchors.
 md=(folder/'README.md').read_text(encoding='utf8');web=(folder/'index.html').read_text(encoding='utf8')
 for old in snap['snapshots']:
  s=old['data'];a=s.get('anchor')
  if not a:continue
  e,n=(a['easting'],a['northing']) if isinstance(a,dict) else a[:2];id=s.get('id','esglesia_nova')
  md=re.sub(r'(\| '+re.escape(id)+r' \| [^|]* \| )[^|]+ \| [^|]+( \|)',lambda m:m[1]+f'{e:.3f} | {n:.3f}'+m[2],md)
  web=re.sub(r'(<td>'+re.escape(id)+r'</td><td>[^<]*</td><td>)[^<]*(</td><td>)[^<]*(</td>)',lambda m:m[1]+f'{e:.3f}'+m[2]+f'{n:.3f}'+m[3],web)
 (folder/'README.md').write_text(md,encoding='utf8');(folder/'index.html').write_text(web,encoding='utf8')
links=load(ROOT/'data/dossier-model-links.json')
notes={
 'fonda-nova':'Un edifici continu en U oberta a llevant, amb murs únicament al perímetre, una sola cota de cornisa i coberta unida a les dues cantonades. Substitueix les dues peces reservades, sense sumar unitats a l’inventari. Forma relacional C segons N112 il·l.4.',
 'cases-talavera':'Conjunt continu en U oberta a ponent, al nord de la Fonda Nova. Perímetre únic, pati buit i coberta contínua a les cantonades; no tres edificis independents. Forma relacional C segons N112 il·l.4.',
 'paredo-poblacio':'Els dos trams del mur de sosteniment núm.24 segueixen el croquis N112 il·l.4: al costat oriental de Talavera/Fonda i al marge dels Horts de les Monges. Maçoneria amb base lleugerament atalussada i coronament seguint el terreny interior; passos de rampa rebaixats. No és una muralla defensiva. Secció i cotes d’assaig C.',
 'mancana-nova':'El núm.8 del croquis correspon a l’illa residencial occidental, ja representada. Es retira el segon rectangle que ocupava el jardí botànic. La fitxa conserva el testimoni, sense duplicar-ne el volum.',
 'fonda-vella':'Recol·locada davant la boca del braç del canal i al nord dels Horts de les Monges, segons N112 il·l.4. Forma del model preservada; posició C.',
 'duana-nova':'Edifici de pedra 12 recol·locat respecte de les rampes i Fonda Vella segons N112 il·l.4. Estructura i variants arquitectòniques preservades; ajust C.',
 'casa-white':'Edifici de pedra 13 al costat oriental de la Fonda Nova. Estructura preservada; emplaçament relacional C segons N112 il·l.4.',
 'jardi-botanic':'Recinte al costat occidental de la filera de cases grans, entre la Mançana i el camí de la Pedrera. Polígon traçat sobre N112 il·l.4; no parcel·la georeferenciada històricament.',
 'hort-rei-nord':'Recinte a ponent del jardí botànic, al nord del camí de la Pedrera, seguint N112 il·l.4.',
 'hort-rei-sud':'Recinte amb sínia al sud del camí de la Pedrera i a ponent dels habitatges, seguint N112 il·l.4.',
 'canal-amposta':'Braç terminal 19 redibuixat amb dues vores, fins a la boca septentrional de la dàrsena gran. Corredor llarg cap a Amposta preservat; traçat local d’assaig C.',
 'darsena-gran':'Port de l’escenari de 1800, amb dos braços oblics i boca lateral oberta. Làmina d’aigua, fons, molls i recorregut a peu comparteixen la planta de N112 il·l.4.',
 'cova-roquer':'Tres galeries cegues amb la mateixa roca i color que la ladera, coberta compartida i transició de terreny als laterals i al darrere. El sòlid ja no se superposa a una segona pell de terreny. Posició del comentari de Josep preservada; forma C.'}
for id,note in notes.items():
 links.setdefault('modelNotes',{})[id]=note
 folder=D/id
 if not folder.exists():continue
 md=folder/'README.md';text=md.read_text(encoding='utf8');marker='## Aplicació al model i treball pendent';text=re.sub(r'\n\n\*\*Ajust al croquis de referència · 01/11/2026:\*\*[^\n]*\n','',text);text=text.replace(marker,marker+'\n\n**Ajust al croquis de referència · 01/11/2026:** '+note+' [Criteris i verificació](../../AJUST_PLANTA_1800.md).\n');md.write_text(text,encoding='utf8')
 web=folder/'index.html';text=web.read_text(encoding='utf8');text=re.sub(r'<p><strong>Ajust al croquis · 01/11/2026:</strong>.*?</p>','',text);text=text.replace('<h2>Aplicació al model i treball pendent</h2>','<h2>Aplicació al model i treball pendent</h2><p><strong>Ajust al croquis · 01/11/2026:</strong> '+html.escape(note)+' <a href="../../AJUST_PLANTA_1800.md">Criteris i verificació</a>.</p>');web.write_text(text,encoding='utf8')
save(ROOT/'data/dossier-model-links.json',links)
extra=load(ROOT/'data/dossier-extra.json')
if not any(e['id']=='hort-monges' for e in extra['items']):extra['items'].append({'id':'hort-monges','name':'Horts de les Monges','kind':'hort','modelIds':['hort-monges'],'parent':None,'placement':'Entre el recinte de les monges i la dàrsena gran, al sud de Fonda Vella. Recinte traçat sobre N112 il·l.4, amb ajust relacional C.','certainty':'C · posició i mètrica d’assaig','placementRefs':'N112 il·l.4 · núm. Horts de les monges','description':['Recinte irregular entre el Roquer i el port de 1800. La forma segueix el croquis aportat, sense convertir-lo en un aixecament mètric.'],'phases':[],'todo':[],'unknown':['Límits i cultius individuals de 1800.'],'related':[{'id':'fonda-vella','name':'Fonda Vella'}],'sourceIds':[],'sources':[{'id':'N112','title':'Pilar Reverté, Recerca 20 · il·l.4','year':2024,'kind':'croquis interpretatiu','reading':'Base relacional per al conjunt, no plànol original del 1800.'}]})
save(ROOT/'data/dossier-extra.json',extra)
subprocess.run(['node','scripts/build-dossiers.mjs'],cwd=ROOT,check=True)
print(json.dumps({'synchronizedDossiers':len(changed),'ids':changed},ensure_ascii=False))
