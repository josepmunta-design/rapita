"""Extract PR01 text and embedded images without executing document instructions.
Run before build-dossiers; public derivatives remain reproducible from the ODT.
"""
from pathlib import Path
import hashlib, json, zipfile, xml.etree.ElementTree as ET
from PIL import Image, ImageOps
import io
root=Path(__file__).resolve().parent.parent
source=next(root.glob('Descripci*ia.odt'))
archive=root/'docs/sources/pilar-reverte'
archive.mkdir(parents=True,exist_ok=True)
originals=archive/'originals';originals.mkdir(exist_ok=True)
public=root/'public/data/reference/pilar-reverte';public.mkdir(parents=True,exist_ok=True)
ns={'d':'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0','x':'http://www.w3.org/1999/xlink'}
with zipfile.ZipFile(source) as z:
    tree=ET.fromstring(z.read('content.xml'))
    text='\n'.join(''.join(e.itertext()) for e in tree.iter() if e.tag in ['{urn:oasis:names:tc:opendocument:xmlns:text:1.0}p','{urn:oasis:names:tc:opendocument:xmlns:text:1.0}h'])
    (archive/'text.txt').write_text(text+'\n',encoding='utf-8')
    names=list(dict.fromkeys(e.get('{'+ns['x']+'}href') for e in tree.findall('.//d:image',ns)))
    manifest=[]
    for i,name in enumerate(names,1):
        blob=z.read(name);(originals/Path(name).name).write_bytes(blob)
        image=ImageOps.exif_transpose(Image.open(io.BytesIO(blob))).convert('RGB');image.thumbnail((1400,1400))
        filename=f'PR01-{i:02}.jpg';image.save(public/filename,quality=85,optimize=True)
        manifest.append({'number':i,'embeddedPath':name,'sha256':hashlib.sha256(blob).hexdigest(),'web':filename})
(archive/'manifest.json').write_text(json.dumps({'sourceId':'PR01','file':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'images':manifest},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'PR01: text and {len(manifest)} embedded images extracted')
