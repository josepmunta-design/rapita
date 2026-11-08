# Trama urbana i serveis cap al 1800 · 0.8.0

La prioritat d'aquesta fase és completar els carrers, cases i serveis del poble del 1800. L'horitzó del projecte s'amplia fins al 1950, amb els testimonis posteriors registrats separadament a `data/history-catalog.json`. El selector actiu continua 1778–1800: no s'ha avançat artificialment l'estat del XVIII al XX.

## Fonts revisades i resultat

- **H01**, Borràs Matamoros, tesi aportada: lectura focal de pp. 159–162, 232–233 i revisió de pp. 251–253. Descriu duana, casa de l'administrador, dues cases dels guardes i ferreria el 1780; els plànols enviats aquell any no s'han localitzat. Les quatre cases sol·licitades per Constans són una petició, no obra acreditada: no s'han construït al visor.
- **H02**, [Reverté (2024), transcripció de la relació de 20/05/1794](https://www.academia.edu/170882307/1794_Estat_de_les_obres_reials_de_San_Carlos_Una_descripci%C3%B3_detallada_de_les_intervencions_realitzades_a_la_R%C3%A0pita_entre_1780_i_1794): revisió dels arts. 5, 7, 10, 14 i 22–26, de la concessió de Talavera de 1782 i de la carta de plantació de 6/05/1792. Document primari: ACA RP BGRP Cajas 60. Els límits de finca permeten una lectura relacional, sense identificar encara totes les parcel·les.
- **G03**, mapa topogràfic actual ICGC arxivat: situa els corredors contemporanis, sense acreditar que les seves amplades o alineacions fossin les mateixes el 1800.

S'han afegit set corredors de terra: carrer principal/Alamedes, Rambla, Rampar, camí de la pedrera al Cóc, dues baixades al port i la baixada del Pou de les Figueretes. Les tres baixades s'afegeixen com a connexions de sòl als elements portuaris ja representats, sense duplicar molls o edificis.

S'afegeixen el pont de l'entrada de Barcelona, el barranc de les Monges, dos horts amb una sínia d'assaig, jardí botànic, dues variants de ferreria, dues cases de guardes, casa de l’administrador i materials/taller al pati de la Mançana existent. **Hi ha deu registres de servei, nou visibles simultàniament el 1800**, perquè les dues ferreries representen testimonis alternatius. El barranc és un altre registre territorial.

## Geometria i sòl

Tots els recorreguts, plantes i alçats nous són **C**. Les mesures històriques desconegudes continuen en `null`. Les formes dels arcs del pont, tanques, conreus, mecanisme de sínia i objectes de taller són aproximacions tipològiques; no són aixecaments.

La planta és una **restitució relacional**, no una georeferenciació de parcel·les històriques. Les proves geomètriques han detectat dues cruïlles inicials entre rampes i cossos d'assaig: s'han corregit els corredors per deixar pas, conservant les cases. Les set amplades completes es comproven contra les petjades dels habitatges i el centre. Els nous recintes no envaeixen els cossos existents; el pati de treball pertany deliberadament a la Mançana.

El barranc té 8 m d'amplada i 2,2 m de fondària **d'assaig**, amb transició de talús, sense cabal ni aigua atribuïts. Només es talla la còpia de visualització del paisatge a partir del testimoni de 1794. El mode MDT actual recupera les dades mesurades; no es modifiquen les altures o màscares originals. El pont salva aquest corredor amb una volta rebaixada d'estudi.

Carrers, horts i tanques segueixen el terreny mostrejat. Els petits suports dels edificis són tècnics. No representen una explanació històrica validada.

## Dates i recomptes

- **1780:** ferreria de les primeres obres, dues cases de guardes i casa de l’administrador, amb ubicació i aparença C.
- **1782:** Rambla i Rampar a partir dels límits citats a la concessió de Talavera. El recorregut complet continua sent C.
- **1792:** els 60 garrofers de la població es mostren des del testimoni de plantació. La seva supervivència individual el 1800 no s'ha acreditat.
- **1794:** carrer principal, camí de pedrera, rampes, pont, barranc, horts, sínia, jardí, ferreria de l'àmbit de Fonda Vella i pati de materials. L'aparició al visor no és la data de construcció.
- El pas de la ferreria vella a la nova el 1794 **no data el trasllat**: canvia el testimoni representat.

Es conserven les **81 unitats reials**. Els guardes i tallers no s'hi afegeixen com a noves cases. El registre privat manté 38 unitats de diversos usos i **nombre residencial desconegut**; relaciona duana, recinte de les monges, Sanitat i Talavera amb els models existents, sense duplicar-los. La fusteria antiga de l'art. 5 no s'identifica automàticament amb la del pati de la Mançana de l'art. 7.

## Plànols i recerca fins al 1950

El plànol **ACA MPD 223**, reproduït a H01 p. 233, és atribuït per la tesi a una reforma de **1852**. El fosc indica obra existent, el rosat projecte i el groc enderrocs proposats. El JPEG incrustat té només **384 × 554 píxels**. No hi ha prou controls independents inequívocs per justificar un ajust mètric: **no s'ha declarat georeferenciat** ni s'ha usat per posar el seu projecte al 1800.

L'XML aportat `1679586.xml` descriu una còpia d'un **altre plànol**, l'eixample amb escala de l'original de **1867**, amb 197 parcel·les. Aquesta xifra no es converteix en cases construïdes. Cal obtenir i contrastar els originals abans de substituir les coordenades C.

S'ha arxivat també una ortofoto oficial ICGC **1945–1946**, EPSG:25831, amb petició WMS, extensió, mida i SHA-256. El GetFeatureInfo retorna un interval i no resol el dia/any local del fotograma. No és una fotografia del 1950. El catàleg conserva, a més, complex del canal de 1852–1859, far i canvis d'òptica, projecte ferroviari, reconstrucció parroquial i pistes de mercat provisional. Es poden consultar a **Trama → Documents per a les fases fins al 1950**; no estan incorporats com a volums d'aquesta fase.

## Arxius, comprovació i següents passos

`data/urban-fabric.json` → `scripts/prepare-urban.mjs` → `public/data/urban-fabric.json`; geometria a `src/urban.ts`, regles i tall reversible a `src/urban-plan.mjs`. Accés `#trama` dins de la mateixa escena general. `npm.cmd run data:urban` regenera el resultat i copia les referències locals.

Proves noves: corredors contra petjades, absència de solapaments nous, variants cronològiques reversibles, recomptes, geometria finita, normals dels carrers i conservació dels buffers mesurats.

Pendents prioritaris del 1800:

- Identificar les propietats privades que encara no tenen correspondència, amb número, ús i document; no completar-les per una resta de 38.
- Obtenir els plànols originals i punts de control, quantificar l'error i contrastar les parcel·les existents amb fonts anteriors al XIX.
- Resoldre el traçat i secció mesurats dels accessos, barranc i pont; contrastar les diferents cotes de terraplè.
- Mesurar edificis i fàbriques conservades, conciliant 1788–1789 amb 1794 i els canvis fins al 1800.
- Continuar després amb les fases fins al 1950 segons el catàleg, sense convertir projectes ni dates dubtoses en obra executada.
