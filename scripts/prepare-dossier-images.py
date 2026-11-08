"""Prepara les imatges que mostren les fitxes laterals: fotografies, plànols i documents citats pels expedients.
Redueix els fitxers originals de docs/EDIFICIS/fonts-20261031/originals a public/data/dossier-img/ (JPEG de 1400 px màx.).
Les pàgines i il·lustracions dels PDF (article N112, Jaubert, Laborde) es renderitzen o n'extreuen la imatge incrustada.
Els originals no es modifiquen. Cal executar-lo després de scripts/build-dossiers.mjs."""
import io, json, pathlib, warnings
warnings.filterwarnings('ignore')
import fitz
from PIL import Image, ImageOps

root = pathlib.Path(__file__).resolve().parent.parent
originals = root / 'docs/EDIFICIS/fonts-20261031/originals'
out = root / 'public/data/dossier-img'
out.mkdir(parents=True, exist_ok=True)
data = json.loads((root / 'public/data/dossiers.json').read_text(encoding='utf-8'))

wanted = {}
for d in data['items'].values():
    for entry in [*d['photos'], *d['documents']]:
        wanted[entry['image']] = entry['src']

pdfs = {}
def pdf(name):
    if name not in pdfs:
        pdfs[name] = fitz.open(originals / name)
    return pdfs[name]

def load(src):
    if 'local' in src:
        with Image.open(root / src['local']) as im:
            return ImageOps.exif_transpose(im).convert('RGB')
    if 'file' in src:
        with Image.open(originals / src['file']) as im:
            return ImageOps.exif_transpose(im).convert('RGB')
    doc = pdf(src['pdf'])
    page = doc[src['page'] - 1]
    if src.get('embedded'):
        images = page.get_images(full=True)
        if images:
            pix = fitz.Pixmap(doc, images[0][0])
            if pix.n - pix.alpha >= 4:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')
    zoom = 1100 / page.rect.width
    pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
    return Image.open(io.BytesIO(pix.tobytes('png'))).convert('RGB')

done = 0
for name, src in sorted(wanted.items()):
    try:
        im = load(src)
    except Exception as error:
        print('ERROR', name, error)
        continue
    im.thumbnail((1400, 1400))
    im.save(out / name, 'JPEG', quality=78, optimize=True)
    done += 1
# Elimina imatges que cap expedient no cita ja.
for old in out.glob('*.jpg'):
    if old.name not in wanted:
        old.unlink()
print('imatges:', done, 'de', len(wanted))

# Plànol de 1748 (N112 il·l.1) per a la superposició georeferenciada del visor.
import shutil
(root / 'public/data/reference').mkdir(parents=True, exist_ok=True)
with Image.open(root / 'docs/sources/plan-1748-redibuix.png') as im:
    im.convert('RGB').save(root / 'public/data/reference/plan-1748.jpg', 'JPEG', quality=90, optimize=True)
shutil.copyfile(root / 'data/plan-1748.json', root / 'public/data/plan-1748.json')
print('plànol de 1748 preparat')
