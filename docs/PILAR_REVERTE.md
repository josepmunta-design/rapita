# Paisatge de Pilar Reverté · PR01

Aplicat al mapa local el 31/10/2026 a partir de **Descripció ia.odt**, marca interna **MREVER/PR_2024**. El fitxer original es conserva. El text i les 16 imatges incrustades són a [l’arxiu de la font](sources/pilar-reverte/manifest.json), amb SHA-256; [transcripció](sources/pilar-reverte/text.txt).

## Lectura i aplicació

El document és un exercici per a Ideogram amb comentaris de la investigadora. La primera imatge és generada amb IA i Pilar en corregeix expressament la vegetació i la posició de la masoveria. Es pren com una **interpretació de recerca C**, diferenciada dels testimonis de 1748 i 1794.

- Es conserva l’ajust comú de 1748: bateria prop de la punta, torre i conjunt antic al darrere. No s’arrosseguen peces independents ni es completa el projecte militar.
- S’afegeix un sender estret vorejant el sector de la bateria, amb figueres i pas prop del punt G del pou. Complementa la rampa llarga d’obra del visor; no se n’afirma la identitat ni la secció històrica.
- S’incorporen un hort petit de la raconada, figueres i una sínia genèrica, sense duplicar els dos Horts del Rei ni sumar habitatges.
- S’afegeix una boca rocosa amb arc obert per evocar les coves sota el Roquer. És una geometria superficial d’assaig; no s’ha identificat una cavitat concreta ni excavat el MDT.
- S’incorpora garriga amb margallons baixos, sense palmeres arbòries. La distribució i les espècies menors són d’assaig.
- Les fotos del brocal traslladat, base de bateria, porta del convent, edificis encoixinats, Alamedes i cases de la plaça s’enllacen a les fitxes corresponents, amb data original no establerta. La imatge IA queda fora de les galeries fotogràfiques documentals.

## Consulta

Al mapa: **Capes → Paisatge de Pilar Reverté**. És visible per defecte al Roquer, reversible amb aquest control i amb el mode MDT actual. Les geometries de la cova, hort i sender es poden seleccionar per obrir-ne la fitxa. A **Litoral → Documents, paisatge de Pilar i límits** es consulten les 16 imatges, la lectura i les limitacions.

Les fitxes de bateria, torre, masoveria, capella, pou, rampa, cova, duana nova, cases acabades i plaça/Alamedes incorporen la font PR01. Les lectures de la nova font s’afegeixen en generar `public/data/dossiers.json`, des de `data/pilar-reverte.json`, sense reescriure el text dels testimonis anteriors.

## Mesures i cronologia

Els **4 m de penya-segat** i **3 m de mur** són valors del text de prova, no mesures validades. La boca rocosa usa 4 m d’alçària d’assaig; el mur militar conserva la geometria anterior. Les fotos de cases amb pis i golfes no demostren aquests alçats el 1800. La superposició sobre cadastre és una pista sense calibració independent.

La capa és una interpretació del paisatge durant tota l’escena des de 1778; aquesta visibilitat és una convenció, no una data de construcció. La marca 2024 només identifica el dossier de recerca. Es manté l’inventari de 81 unitats reials i les cronologies individuals existents.

El pou G manté les coordenades de l’ajust de 1748. Aquest punt cau lleugerament dins de l’aigua de la costa interpretada: el brocal anterior quedava submergit. S’ha elevat **només el suport de visualització** a un mínim de 0,68 m; ni la costa ni el punt s’han desplaçat. Cal resoldre aquesta discrepància amb una referència espacial independent. El brocal fotografiat fou traslladat i no resol la posició antiga.

El sender i la cova són geometries de consulta; no s’hi afegeix navegació a peu ni una cavitat subterrània transitable. El MDT, màscares NoData, plantes A–G i superposició de 1748 es conserven.

## Regeneració i verificació

`npm.cmd run data:pilar` extreu text i imatges, genera el litoral, sincronitza els snapshots documentals, reconstrueix les fitxes i prepara les imatges. `npm.cmd test` comprova també la font arxivada, dates de comparació, galeries sense imatges IA, geometria finita, proximitat del sender al pou i preservació dels fitxers mesurats. `npm.cmd run build` genera la distribució local.
