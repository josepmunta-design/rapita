"""Research figure: pixel traces and the identical transformed geometry in a north-up map."""
from pathlib import Path
import json
import os
os.environ.setdefault('MPLCONFIGDIR',str(Path(__file__).resolve().parents[1]/'tmp/matplotlib'))
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
ROOT=Path(__file__).resolve().parents[1]
load=lambda name:json.loads((ROOT/name).read_text(encoding='utf-8-sig'))
plan=load('data/plan-1748.json');lit=load('public/data/littoral.json');urban=load('public/data/urban-fabric.json');housing=load('public/data/housing.json')
fig,(left,right)=plt.subplots(1,2,figsize=(17,9),layout='constrained')
left.imshow(plt.imread(ROOT/'public/data/reference/plan-1748.jpg'))
left.set(xlim=(65,1160),ylim=(860,230),title='Traza en el redibujo aportado · coordenadas de imagen',xlabel='Píxel X',ylabel='Píxel Y')
for f in plan['tracing']['existing']:
 pts=f['pixels'];xs=[p[0]for p in pts];ys=[p[1]for p in pts]
 if len(pts)>1:left.plot(xs+([]if f.get('line')else xs[:1]),ys+([]if f.get('line')else ys[:1]),color='#a22256',lw=1.2)
 else:left.scatter(xs,ys,c='#a22256',s=28)
for f in plan['tracing']['project']:
 left.add_patch(Polygon(f['pixels'],fill=False,edgecolor='#007a75',lw=1,linestyle='--'))
left.plot(*zip(*plan['tracing']['coastPixels']),color='#0275db',lw=2)
coast=lit['roquerCoast'];right.plot(*zip(*coast),color='#0275db',lw=2,label='Costa / pie del cantil')
for s in housing['structures']:
 right.add_patch(Polygon(s['footprintUTM'],facecolor='#e1e0d9',edgecolor='#777',lw=.5))
features={s['id']:s for s in urban['sites']+lit['sites']}
for f in plan['features']['existing']:
 s=features[f['id']];pts=s.get('lineUTM',s.get('footprintUTM',[]))
 if len(pts)>2 and not s.get('lineUTM'):right.add_patch(Polygon(pts,facecolor='#ebccd5',edgecolor='#a22256',lw=1))
 elif s.get('lineUTM'):right.plot(*zip(*pts),color='#a22256',lw=1)
 else:right.scatter(*s['anchor'],c='#a22256',s=18)
 e,n=f['utm'];right.annotate(f['letter'],(e,n),fontsize=8,ha='center',va='center')
for f in lit['plan1748Project']:
 right.add_patch(Polygon(f['footprintUTM'],fill=False,edgecolor='#007a75',lw=1,linestyle='--'))
 right.annotate(f['letter'],f['anchor'],fontsize=8,color='#007a75',ha='center')
right.set(xlim=(296355,296480),ylim=(4499125,4499275),aspect='equal',title='Misma geometría en planta · norte arriba',xlabel='E · EPSG:25831 (m)',ylabel='N · EPSG:25831 (m)')
right.ticklabel_format(useOffset=False,style='plain');right.tick_params(axis='x',rotation=35);right.grid(alpha=.2)
right.text(.02,.98,'N ↑\nRosa: existentes A–G\nVerde discontinuo: proyecto H–O\nGris: viviendas de ensayo',transform=right.transAxes,va='top',fontsize=9)
fig.suptitle('Roquer · ajuste compartido del plano de 1748 (C)\n0,101 m/px · giro 161° · anclaje único a la torre · tolerancia de ensayo ±15 m, sin RMSE independiente',fontsize=13)
fig.savefig(ROOT/'docs/ROQUER_ALINEACIO.png',dpi=140)
print('docs/ROQUER_ALINEACIO.png')
