"""Read-only inventory/extraction of the supplied 31 October source folder."""
from pathlib import Path
from collections import Counter
from zipfile import ZipFile
import hashlib,json,xml.etree.ElementTree as ET,logging
from PIL import Image,ImageOps,ImageDraw,ImageFont
from pypdf import PdfReader
SOURCE=Path('A:/APP MAMA/JOSEP_descripcions Ràpita-20261031T095755Z-1-001/JOSEP_descripcions Ràpita')
OUT=Path('A:/Mapa Ràpita/docs/EDIFICIS/fonts-20261031')
OUT.mkdir(parents=True,exist_ok=True)
(OUT/'text').mkdir(exist_ok=True)
(OUT/'contactes').mkdir(exist_ok=True)
records=[]
logging.getLogger('pypdf').setLevel(logging.ERROR)
for i,p in enumerate(sorted(SOURCE.rglob('*'),key=lambda p:str(p.relative_to(SOURCE)).casefold()),1):
 if not p.is_file():continue
 rel=str(p.relative_to(SOURCE)).replace('\\','/');uid=f'N{len(records)+1:03}'
 b=p.read_bytes();rec={'id':uid,'file':rel,'absolutePath':str(p),'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'review':'inventariat'}
 ext=p.suffix.lower()
 if ext=='.pdf':
  pdf=PdfReader(p);pages=[]
  for j,page in enumerate(pdf.pages,1):pages.append({'page':j,'text':page.extract_text() or ''})
  rec.update(pages=len(pages),pageTextLengths=[len(x['text']) for x in pages],metadata={str(k):str(v) for k,v in (pdf.metadata or {}).items()})
  (OUT/'text'/f'{uid}.json').write_text(json.dumps(pages,ensure_ascii=False,indent=2),encoding='utf8')
  (OUT/'text'/f'{uid}.txt').write_text('\n\n'.join(f"===== PDF {x['page']} =====\n{x['text']}" for x in pages),encoding='utf8')
 elif ext in ['.docx','.odt']:
  with ZipFile(p)as z:
   name='word/document.xml' if ext=='.docx' else 'content.xml';tree=ET.fromstring(z.read(name))
   paras=[]
   for e in tree.iter():
    if e.tag.rsplit('}',1)[-1]in['p','h']:paras.append(''.join(e.itertext()))
   rec['paragraphs']=len(paras);rec['embeddedMedia']=[n for n in z.namelist()if n.startswith(('word/media/','media/','Pictures/'))]
   text='\n\n'.join(paras);(OUT/'text'/f'{uid}.txt').write_text(text,encoding='utf8')
 elif ext in ['.jpg','.jpeg','.png']:
  with Image.open(p)as im:rec.update(width=im.width,height=im.height,exif={str(k):str(v)[:200]for k,v in im.getexif().items() if k in[306,36867,270,315,33432]})
 records.append(rec)
(OUT/'inventory.json').write_text(json.dumps({'sourceRoot':str(SOURCE),'reviewed':'2026-10-31','records':records},ensure_ascii=False,indent=2),encoding='utf8')
dups={}
for rec in records:dups.setdefault(rec['sha256'],[]).append(rec['id'])
print('FILES',len(records),'EXTENSIONS',dict(Counter(Path(x['file']).suffix.lower()for x in records)))
for rec in records:
 if Path(rec['file']).suffix.lower()in['.pdf','.docx','.odt']:print(rec['id'],rec['file'],rec.get('pages',rec.get('paragraphs')),rec.get('pageTextLengths',''))
print('DUPLICATES',[v for v in dups.values()if len(v)>1])
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
images=[x for x in records if 'width'in x]
for batch in range(0,len(images),16):
 group=images[batch:batch+16];sheet=Image.new('RGB',(1440,1120),'#ece9df');draw=ImageDraw.Draw(sheet)
 for j,rec in enumerate(group):
  im=ImageOps.exif_transpose(Image.open(SOURCE/rec['file'])).convert('RGB');im.thumbnail((344,224))
  x=(j%4)*360+8;y=(j//4)*280+8;sheet.paste(im,(x+(344-im.width)//2,y))
  label=rec['id']+' '+rec['file'];lines=[label[k:k+43]for k in range(0,min(len(label),129),43)]
  draw.text((x,y+226),'\n'.join(lines),fill='#172c29',font=font,spacing=1)
 sheet.save(OUT/'contactes'/f'imatges-{batch//16+1:02}.jpg',quality=92)
