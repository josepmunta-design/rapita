# Regeneració de l’arxiu documental

Les dades revisades s’editen a `data/building-research.json` i `data/new-source-notes.json`. No editar directament els expedients generats. Els documents `PLANS.md` i `CRITERIS_I_CONFLICTES.md` són d’autoria manual.

Per a l’ajust del Roquer, executar primer `npm.cmd run data:roquer`. Les traces en píxels i la transformació són a `data/plan-1748.json`; el procés sincronitza els models, les correspondències dels expedients i el catàleg del visor. `ubicacio.json` inclou ancoratge, planta, orientació i procedència. El validador comprova igualtat exacta amb les dades vives, a més dels hashes i els enllaços. La figura es regenera amb `python scripts/render-roquer-check.py`.

Des de l’arrel del projecte, amb Python 3 i les dependències d’extracció instal·lades quan calgui:

```powershell
python scripts/prepare-building-dossiers.py
python scripts/render-research-pages.py
python scripts/validate-building-dossiers.py
```

El primer script genera cada carpeta i comprova les còpies arxivades dels originals. El segon prepara les versions HTML dels documents de referència. El tercer comprova hashes de l’entrada i de l’arxiu, fases, referències, ubicacions i enllaços HTML; desa el resultat a `checks.json` i retorna error si troba incidències. El manifest `reproducibility.json` registra dues regeneracions coincidents.

`catalogue-new-sources.py` és el pas d’ingesta: requereix la carpeta original per inventariar i extreure de nou els fitxers. No cal tornar-lo a executar per editar les interpretacions. Si s’afegeixen fonts, cal revisar-ne la lectura i actualitzar el catàleg abans de regenerar.

`index.html` funciona obrint el fitxer localment: no utilitza xarxa ni fetch. També es pot servir la carpeta amb un servidor estàtic local. Les imatges es conserven per a recerca; no s’afegeixen a `public/` ni a la distribució de la web.

Les fases documenten testimonis. `automaticTimelineActivation: false` evita interpretar una fotografia o una proposta com una data d’obra. Per integrar una variant al mapa encara cal resoldre identitat, geometria, interval de vigència i fonts. Les coordenades històriques desconegudes continuen a `null`; les posicions del prototip queden separades.

## Dades per al visor web

`npm run data:dossiers` converteix els expedients en `public/data/dossiers.json` i redueix les fotografies citades a `public/data/dossier-img/` (cal Pillow). Els originals no es modifiquen. La correspondència entre expedients i models del visor (i les posicions amb la seva font) s'edita a `data/dossier-model-links.json`, que sobreescriu els `modelIds` d'`index.json`.

Les fotografies, els plànols i els documents que mostra cada fitxa surten de les fonts citades a l'expedient i del catàleg `FONTS.md`; les pàgines de l'article N112 es calculen a partir de les pàgines citades (pàgina impresa − 190 = pàgina del PDF). `data/dossier-media.json` fixa les il·lustracions de l'article, els tipus exclosos i els duplicats ocults. Els cossos d'estudi hereten la galeria i els documents de la seva tipologia.
