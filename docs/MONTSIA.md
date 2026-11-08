# Ampliació del terreny cap al Montsià

Enllaços oficials comprovats el 30/10/2026:

- [Visor de descàrregues de cartografia ICGC](https://visors.icgc.cat/appdownloads/index.html).
- [Descripció oficial dels models d'elevacions](https://www.icgc.cat/ca/Geoinformacio-i-mapes/Dades-i-productes/Elevacions/Elevacions-territorial/Models-delevacions).
- [Metadades del MDT LiDAR Catalunya 50 cm 2021–2023](https://catalegs.ide.cat/geonetwork/geonetwork/api/records/model-elevacions-terreny-lidar-catalunya-50cm-2021-2023?language=cat).

## Producte per preparar l'ampliació

Triar **Model d'Elevacions del Terreny LiDAR Catalunya 50 cm 2021–2023**, format **GeoTIFF**, sistema **ETRS89 / UTM 31N, EPSG:25831**. És el terreny sense vegetació ni edificis, adequat per ampliar la base que ja tenim. Una ortofoto o un mapa d'ombres no contenen les cotes de terreny que necessita la malla. El MDS representa també objectes per damunt del sòl i no és el producte proposat.

Al visor, cercar La Ràpita/serra del Montsià i delimitar la muntanya cap a la Foradada i la carena, incloent un marge de solapament amb la franja de terreny ja disponible a l'oest de la població. És preferible conservar els fitxers originals i els seus acompanyants de metadades i georeferenciació, sense convertir-los a imatge.

La fitxa actual també ofereix resolucions d'1 i 5 m, útils si es necessita una descàrrega més lleugera per cobrir tota la serra. En aquest cas cal confirmar la mateixa sèrie LiDAR 2021–2023: el catàleg també conté un MDT topogràfic de 5 m de 2009–2018, que és un producte diferent.

No cal descarregar el COG únic de tot Catalunya: la llista directa del servidor inclou fitxers de centenars de GB. Per a aquesta feina interessa la selecció de l'àrea del Montsià.

## Descàrrega aportada i incorporada en 0.7.0

El ZIP `FME_46302427_1793390462662_232.zip` conté coordenades, TFW i un GeoTIFF de **12.440 × 15.952 píxels**, a **0,5 m**, EPSG:25831 i NoData **−9999**. Límits de píxel originals: E **289.869–296.089** / N **4.496.933–4.504.909**. El fitxer es conserva; l'extracció temporal és independent de l'anterior TIFF.

SHA-256 del TIFF: `4b5e3b59c024b8a5a1af0ef0aa30624c555063a9a9029441d99cb4231171ed72`.

S'han comparat **6.386 centres natius comuns** dels dos TIFF: diferència màxima **0 m**. No s'hi ha aplicat una transformació vertical. La fitxa oficial del producte declara altituds ortomètriques EGM08D595; els TIFF no duen una clau vertical que permeti verificar-la independentment. La correspondència amb el WCS d'Amposta continua pendent.

## Preparació per al navegador

`scripts/prepare-montsia.mjs` genera `public/data/context.json`, `context.f32`, `context.valid.u8` i `context.sources.u8`. Malla regular de **169 × 287 mostres a 50 m**, amb primera mostra E 289.905,25 / N 4.511.244,75; darrera E 298.305,25 / N 4.496.944,75. El rectangle de treball és de 8,4 × 14,3 km, però **no tot disposa de dades**: 33.717 de les 48.503 mostres són vàlides. Rang de cotes vàlides **−0,247–759,312 m**. No es reomplen buits ni s'escala l'altitud.

Cada mostra LiDAR és un centre natiu cada 100 píxels, sense mitjana ni interpolació. Es prefereix el TIFF anterior en el seu solapament amb el nou; els dos coincideixen en la comprovació. El WCS arxivat es conserva al corredor nord preexistent. Els identificadors 1, 2 i 3 registren la procedència; 0 significa sense dades.

`src/context-plan.mjs` retalla el rectangle de la malla local de 10 m i triangula una transició perimetral fins als seus vèrtexs reals. Algunes cotes de la costura de visualització s'interpolen o adapten per unir resolucions; **els binaris originals continuen intactes**. No hi ha una segona superfície superposada sota el poble. Els detalls de 2 m continuen igual.

El mode **MDT actual** mostra el terreny contemporani. En mode **Litoral · C**, els talls reversibles existents de platja/canal s'apliquen a còpies de visualització; la serra no rep una restitució històrica inventada. La càmera **Montsià** i l'accés `#montsia` enfoquen la nova muntanya dins de la mateixa escena. **Extensió** enquadra la cobertura conjunta.

## Regenerar

Després de preparar les dades locals, amb els dos ZIP originals a l'arrel:

```powershell
npm.cmd run data:montsia
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

`npm.cmd run data:prepare` també inclou l'ampliació, des de zero. El script pot extreure el TIFF anterior si falta a la memòria cau i comprova el seu hash abans de combinar-los. El navegador només descarrega els binaris petits generats; no carrega els TIFF ni consulta cap servei d'elevació.

## Pendents

- Confirmar l'equivalència vertical amb el context WCS i el nivell històric d'aigua.
- Documentar canvis entre el terreny actual i el del 1800 abans d'introduir correccions.
- Afegir detall per proximitat si s'implementen rutes a peu: una malla de 50 m serveix per al paisatge distant.
- Ampliar la cobertura només si calen els espais sense font al nord-oest; aquests buits no s'han tapat.
