"""Small local renderer for the authored research Markdown; no network dependency."""
from pathlib import Path
from html import escape
import re
ROOT=Path(__file__).resolve().parents[1]/'docs/EDIFICIS'
CSS=(ROOT/'index.html').read_text(encoding='utf8').split('<style>',1)[1].split('</style>',1)[0]
def inline(s):
 s=escape(s)
 s=re.sub(r'`([^`]+)`',r'<code>\1</code>',s)
 s=re.sub(r'\*\*([^*]+)\*\*',r'<strong>\1</strong>',s)
 s=re.sub(r'\[([^\]]+)\]\(([^)]+)\)',r'<a href="\2">\1</a>',s)
 return s
for filename in ['PLANS','CRITERIS_I_CONFLICTES','FONTS']:
 source=ROOT/(filename+'.md');text=source.read_text(encoding='utf8')
 # Editorial fixes apply to prose, never to link targets or source identifiers.
 chunks=re.split(r'(\]\([^)]*\)|`[^`]+`)',text)
 for i in range(0,len(chunks),2):
  s=chunks[i]
  s=re.sub(r'(?<=[a-zà-ÿ])(?=\d|N\d|[A-Z]{2,})',' ',s)
  s=re.sub(r'(?<=\d)(?=[a-zà-ÿ])',' ',s)
  s=re.sub(r'(?<=[a-zà-ÿ])(?=[A-ZÀ-Ý][a-zà-ÿ])',' ',s)
  for a,b in {'elmateix':'el mateix','delmateix':'del mateix','deltext':'del text','delpoble':'del poble','alpeu':'al peu','alnom':'al nom','alport':'al port','alcap':'al cap','deltemple':'del temple','delconvent':'del convent','delmodel':'del model','delmoll':'del moll','delpoble':'del poble','delTer':'del Ter','delXIX':'del XIX','delXX':'del XX','delXVIII':'del XVIII','dela':'de la','deles':'de les','almapa':'al mapa','alregistre':'al registre','alprojecte':'al projecte','alcatàleg':'al catàleg','delseu':'del seu','delfull':'del full','delcarrer':'del carrer','elcontrast':'el contrast','alprimer':'al primer','aldia':'al dia','alturó':'al turó','elterreny':'el terreny','elfull':'el full','pelcontrast':'pel contrast'}.items():s=re.sub(r'\b'+a+r'\b',b,s)
  s=s.replace('Cóс','Cóc').replace('del’Ebre','de l’Ebre').replace('del’hortizó','de l’horitzó')
  chunks[i]=s
 text=''.join(chunks);source.write_text(text,encoding='utf8')
 lines=text.splitlines();body='<nav><a href="index.html">← Expedients</a></nav>';i=0
 while i<len(lines):
  line=lines[i]
  if not line.strip():i+=1;continue
  if line.startswith('#'):
   n=len(line)-len(line.lstrip('#'));body+=f'<h{n}>'+inline(line[n:].strip())+f'</h{n}>';i+=1
  elif line.startswith('|'):
   rows=[]
   while i<len(lines)and lines[i].startswith('|'):
    cells=[x.strip()for x in lines[i].strip('|').split('|')]
    if not all(re.fullmatch(r'[: -]+',x)for x in cells):rows.append(cells)
    i+=1
   body+='<table>'+''.join('<tr>'+''.join(('<th>'if j==0 else'<td>')+inline(c)+('</th>'if j==0 else'</td>')for c in row)+'</tr>'for j,row in enumerate(rows))+'</table>'
  elif line.startswith('- ')or re.match(r'^\d+\. ',line):
   numbered=bool(re.match(r'^\d+\. ',line));tag='ol'if numbered else'ul';body+='<'+tag+'>'
   while i<len(lines)and (lines[i].startswith('- ')or re.match(r'^\d+\. ',lines[i])):
    body+='<li>'+inline(re.sub(r'^(- |\d+\. )','',lines[i]))+'</li>';i+=1
   body+='</'+tag+'>'
  else:
   para=[]
   while i<len(lines)and lines[i].strip()and not lines[i].startswith(('#','|','- ')):
    para.append(lines[i]);i+=1
   body+='<p>'+inline(' '.join(para))+'</p>'
 title=lines[0].lstrip('# ')
 (ROOT/(filename+'.html')).write_text('<!doctype html><html lang="ca"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(title)+'</title><style>'+CSS+'</style><main>'+body+'</main></html>',encoding='utf8')
print('Rendered research reference pages')
