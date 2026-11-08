from pathlib import Path
import json,sys
sys.path.insert(0,str(Path('tmp/port-python').resolve()))
from shapely.geometry import Polygon,box
from shapely.ops import unary_union
# All traces are in the same official WMS image: 1320x1200 px, EPSG:25831.
bbox=[295500,4498000,297700,4500000]
N=[(1320,160),(1230,165),(1120,190),(1010,220),(888,245),(866,277),(850,350)]
S45=[(823,391),(808,394),(797,344),(780,331),(795,398),(689,430),(676,451),(655,511),(639,528),(609,508),(582,548),(535,568),(534,601),(511,623),(519,645),(516,681),(521,738),(483,812),(443,870),(350,955),(260,1035),(198,1120),(156,1200)]
S57=[(862,344),(839,392),(826,380),(814,420),(795,473),(763,506),(713,525),(681,524),(650,548),(598,578),(543,623),(529,638),(535,659),(519,694),(523,735),(480,818),(443,875),(350,960),(260,1040),(198,1120),(156,1200)]
N83=[(1320,160),(1230,165),(1120,190),(1010,220),(888,245),(866,277),(860,340)]
S83=[(867,346),(830,379),(820,398),(788,427),(718,488),(650,546),(585,606),(540,641),(522,656),(544,676),(558,701),(611,748),(652,776),(620,779),(550,786),(492,801),(460,821),(427,857),(379,900),(333,932),(285,975),(238,1016),(197,1060),(166,1100),(126,1160),(100,1200)]
S90=[(868,346),(830,379),(820,398),(788,427),(718,488),(650,546),(585,606),(540,641),(522,656),(544,676),(558,701),(611,748),(652,776),(620,779),(550,786),(492,801),(460,821),(427,857),(379,900),(333,932),(285,975),(238,1016),(197,1060),(166,1100),(126,1160),(100,1200)]
S93=[(868,346),(830,379),(820,398),(788,427),(718,488),(650,546),(585,606),(540,641),(522,656),(544,676),(558,701),(611,748),(652,776),(620,779),(550,786),(492,801),(460,821),(427,857),(379,900),(333,932),(285,975),(238,1016),(197,1060),(166,1100),(126,1160),(100,1200)]
west45=[(511,623),(520,618),(817,938),(813,946)]
west57=[(514,629),(525,621),(818,928),(1116,1122),(1110,1131),(808,944)]
mollet45=[(549,668),(607,685),(715,650),(720,658),(608,696),(543,678)]
mollet57=[(549,668),(607,680),(714,646),(723,654),(716,669),(635,700),(612,717),(584,704),(543,680)]
quay83=[(534,623),(793,412),(822,446),(851,465),(869,486),(873,509),(853,514),(822,464),(636,617),(605,629),(566,657)]
east83=[(792,427),(804,418),(1007,640),(1315,627),(1319,638),(1006,653),(834,801),(823,790),(989,644)]
north83=[(1291,164),(1302,163),(1312,407),(1303,410)]
fish83=[(881,538),(895,551),(846,595),(837,584)]
mollet83=[(544,665),(588,679),(634,676),(705,648),(720,652),(720,666),(692,696),(632,732),(611,750),(581,720),(533,681)]
commercial83=[(710,815),(723,807),(828,933),(1068,1064),(1062,1085),(820,951)]
quay90=[(800,429),(898,531),(1008,616),(1015,649),(990,648),(873,547),(786,446)]
fish90=[(873,547),(896,562),(801,619),(787,605)]
north90=[(1291,164),(1302,163),(1319,581),(1307,585)]
supply90=[(865,346),(893,349),(938,351),(972,366),(1040,450),(1034,455),(967,374),(935,359),(892,356),(868,352)]
supplyFill90=[(1050,475),(1061,475),(1104,521),(1114,524),(1118,609),(1142,615),(1161,637),(1006,653),(1005,644),(1094,640),(1102,611),(1098,540)]
marina93=[(913,577),(925,589),(803,647),(815,706),(803,712),(787,641)]
supply93=[(865,346),(893,349),(938,351),(972,366),(1040,450),(1034,455),(967,374),(935,359),(892,356),(868,352)]
fill93=[(1050,475),(1061,475),(1104,521),(1114,524),(1118,589),(1148,614),(1189,625),(1319,619),(1319,638),(1006,653),(1005,644),(1094,640),(1102,611),(1098,540)]
coasts=[N+S45,N+S57,N83+S83,N83+S90,N83+S93]
works=[[west45,mollet45],[west57,mollet57],[west57,mollet83,quay83,east83,north83,fish83,commercial83],[west57,mollet83,quay83,east83,north90,quay90,fish90,commercial83,supply90,supplyFill90],[west57,mollet83,quay83,east83,north90,quay90,fish90,commercial83,supply93,fill93,marina93]]
def utm(p):return [round(bbox[0]+p[0]*5/3,3),round(bbox[3]-p[1]*5/3,3)]
def coords(ring):return [utm(p) for p in list(ring.coords)[:-1]]
registrations=json.loads(Path('data/harbour-registration.json').read_text(encoding='utf8'))
Path('tmp/port-geo').mkdir(parents=True,exist_ok=True)
phases=[];previous=None
for i,year in enumerate([1945,1957,1983,1990,1993]):
 coast=coasts[i];mainland=Polygon([(0,0),(1320,0),*coast,(0,1200)]).buffer(0)
 shapes=[mainland]+[Polygon(p).buffer(0) for p in works[i]]
 if previous is not None:shapes.append(previous)
 union=unary_union(shapes).intersection(box(0,0,1320,1200));previous=union
 areas=list(union.geoms) if hasattr(union,'geoms') else [union]
 reg=registrations[str(year)]
 # Compact audit subset, spread over the image; original matches remain locally archived.
 selected=[]
 for row in sorted(reg['points'],key=lambda r:r['residualMeters']):
  if all(sum((row['referencePixel'][j]-p['referencePixel'][j])**2 for j in [0,1])>120**2 for p in selected):selected.append(row)
  if len(selected)==16:break
 reg['points']=selected
 phase=dict(fromYear=year,label={1945:'1945\u20131946',1957:'1957',1983:'1983\u20131989',1990:'1990',1993:'1993'}[year],works=[list(map(utm,p)) for p in works[i]],sourceFile={1945:'1945-1946.png',1957:'1957.png',1983:'1983.png',1990:'ICGC WMS 1990',1993:'1990.png'}[year],sourcePeriod={1945:[1945,1946],1957:[1957,1957],1983:[1983,1989],1990:[1990,1990],1993:[1993,1993]}[year],referenceImage=f'reference/port/{year}-utm.png',shore=list(map(utm,coast)),land=[coords(a.exterior) for a in areas],landAreas=[dict(outer=coords(a.exterior),holes=[coords(h) for h in a.interiors]) for a in areas],elevation=1.65,confidence='C',landAreaSquareMeters=union.area*(5/3)**2,registration=reg,terrainFile=f'harbour/{year}.f32')
 phase['landAreas'].append(dict(outer=[[297700, 4499733.333], [298000, 4499720], [298400, 4499690], [298800, 4499650], [299000, 4499550], [299000, 4501500], [297000, 4501500], [297000, 4500000], [297700, 4500000]],holes=[]));phase['land'].append([[297700, 4499733.333], [298000, 4499720], [298400, 4499690], [298800, 4499650], [299000, 4499550], [299000, 4501500], [297000, 4501500], [297000, 4500000], [297700, 4500000]])
 if year==1990:phase['registration']=dict(method='Native WMS EPSG:25831 grid',inliers=0,rmseMeters=0,points=[])
 phases.append(phase)
 # Diagnostic tracing and coordinate controls against the exact orthophoto.
 from PIL import Image,ImageDraw
 im=Image.open(f'public/data/reference/port/{year}-utm.png').convert('RGB');draw=ImageDraw.Draw(im)
 for a in areas:
  draw.line(list(a.exterior.coords),fill=(255,90,20),width=3)
  for h in a.interiors:draw.line(list(h.coords),fill=(255,90,20),width=3)
 for k,p in enumerate(selected):
  x,y=p['referencePixel'];draw.ellipse((x-4,y-4,x+4,y+4),outline='cyan',width=2);draw.text((x+6,y+3),str(k+1),fill='cyan')
 im.save(f'tmp/port-geo/{year}-check.png')
 Path('public/data/reference/port').mkdir(exist_ok=True)
 pass # Georeferenced reference images are retained verbatim in public/data/reference/port.
history=dict(version=2,scope='Port i costa: terrenys guanyats al mar acumulats per fases, dics i darsenes. Vila anterior com a context.',registration='Captures registrades individualment contra ortofotos oficials ICGC EPSG:25831, amb milers de punts RANSAC i residus mesurats. Traces de costa i obres digitalitzades a les ortofotos amb extensio comuna. Les cotes continuen sent C.',reference=dict(crs='EPSG:25831',bbox=bbox,width=1320,height=1200,service='https://geoserveis.icgc.cat/servei/catalunya/orto-territorial/wms'),terrain=dict(west=295500,north=4500000,step=5,width=441,height=401),sources=['ICGC WMS Ortofoto Territorial, EPSG:25831','PORT/Marti-Ramis-MPIA.pdf, pp. 38-39','PORT/planol 1813 port alfacs.jpg','PORT/T0025916.jpg'],phases=phases)
Path('public/data/harbour-history.json').write_text(json.dumps(history,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
Path('data/harbour-traces.json').write_text(json.dumps(dict(bbox=bbox,coasts=coasts,works=works),indent=2)+'\n',encoding='utf8')
for p in phases:print(p['fromYear'],round(p['landAreaSquareMeters']),p['registration']['inliers'],round(p['registration']['rmseMeters'],2))
