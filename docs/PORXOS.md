# Cases amb porxos · revisió 0.12.0

Revisió documental i implementació: **31/10/2026**. Aquesta fase substitueix el primer volum porticat de 0.11. No es considera un aixecament mètric ni una restitució exacta de cada finca el 1800.

## Resultat i consulta

Els catorze cossos porticats continuen al mapa general. **Habitatges → Mostra el conjunt dels porxos** n’apropa la vista, i **Camina pels porxos** situa el visitant a la galeria. Clicar una arcada obre una fitxa amb sis descripcions, cites al costat de cada explicació, fotografia de referència, bibliografia i límits. També s’hi accedeix amb teclat des de **Habitatges → Porxos · fotografies i restitució** o **Edificis → Les arcades · descripció i fonts**.

La selecció identifica un número d’estudi, no un número de finca històric. El mateix expedient descriu el conjunt; no s’atribueix una història individual inventada a cada arc. Arrossegar la càmera no obre la fitxa; els elements ocults i els que queden darrere d’una altra malla no són seleccionables a través d’aquesta. Durant la lectura s’atura el desplaçament a peu.

## Fonts contrastades

| Referència | Data del testimoni | Què aporta | Què no acredita |
|---|---|---|---|
| H02 · [Relació d’obres transcrita per Pilar Reverté Vidal](https://www.academia.edu/170882307/1794_Estat_de_les_obres_reials_de_San_Carlos_Una_descripci%C3%B3_detallada_de_les_intervencions_realitzades_a_la_R%C3%A0pita_entre_1780_i_1794), art. 3, pp. 208–210 i 230 | 20/05/1794; edició 2024 | Catorze cases, pòrtics conclosos, primeres bigues i murs preparats per continuar | Estat individual el 1800, seccions i recompte d’arcs per finca |
| H01 · tesi de Noèlia Borràs Matamoros, document aportat, pp. 226 i 251–253 | 2014; testimonis històrics reproduïts | Comparació amb columnata i construcció domèstica de 1788–1789 | Identitat automàtica entre les dotze cases primerenques i cada cos porticat |
| P01 · [Josep Salvany, Vista dels porxos](https://commons.wikimedia.org/wiki/File:Vista_dels_porxos_de_la_pla%C3%A7a_Carles_III.jpeg), Biblioteca de Catalunya, Fons Salvany, MDC bcsalvany/3410 | **1916** | Arcades exemptes, fàbrica radial, relació amb edificis posteriors, font i estructura visible | Que els desperfectes fotografiats existissin el 1800; colors originals |
| P02 · [Inventari del Patrimoni Arquitectònic de Catalunya, 6415](https://invarquit.cultura.gencat.cat/card/6415) | Data de redacció no confirmada | Pilastres rectangulars, arcs de carpanell, traçat i nota sobre pisos majoritàriament del XX | Mesurament individual dels trams de 1800 |
| P03–P05 · mateixa fitxa IPAC: J. Contijoch; Pere Rams i Josep M. Pérez; Museu del Montsià | 1996; 2008; 2009 | Exterior, interior, impostes i arcs transversals conservats | Que totes les fàbriques i reformes siguin originals |
| P06–P07 · [Pobles de Catalunya](https://www.poblesdecatalunya.cat/element.php?e=18368), Albert Esteves i postals reproduïdes | 2023; postals sense data confirmada | Contrast visual i comparació qualitativa | Dates de fases per a les postals, drets per distribuir les fotografies modernes |

No hi ha fotografies del 1800 en aquestes fonts. La reconstrucció combina text de 1794 i observació posterior, mantenint explícita aquesta distància temporal.

## Canvis de geometria

- Arcs de carpanell de tres centres, amb continuïtat tangent; intradós, extradós i gruix. Peces radials individuals amb juntes i variació de material, en lloc d’una sola superfície llisa.
- Pilastres rectangulars amb filades, sòcol, impostes escalonades i coronament. Es conserven els punts compartits del traçat d’assaig; els fronts corbs segueixen la corba entre aquests punts.
- Arcs transversals i biguetes de fusta a la galeria; bigues del primer pis al cos posterior. No es completa una teulada domèstica.
- Es retira la façana alta contínua especulativa sobre el front porticat. La fotografia de 1916 i la nota de l’IPAC justifiquen revisar aquesta part; no proven un alçat exacte de totes les cases el 1800.
- Es conserven pas lateral, sòl seguint el terreny i col·lisions compartides amb la planta del model. Els pilars i els murs continuen sent obstacles físics.

**Paràmetres de treball C:** fondària de galeria 3 m; arrencada de l’arc 2,45 m; fletxa màxima 1,40 m; banda radial 0,28 m; gruix frontal 0,64 m. Són decisions d’assaig, no mesures extretes de les fotografies. Vegeu `src/porxo-plan.mjs`. Es manté un arc principal per cos d’estudi, sense afirmar que aquest sigui el recompte històric. `historicalDimensions`, `surveyedIndividualBayCount` i `historicalColour` continuen en `null`; `state1800Verified` és `false`.

## Dades, drets i reproducció

`data/porxos-evidence.json` és la font editable de les descripcions i referències. `npm.cmd run data:porxos` genera `public/data/porxos-study.json` i copia només les dues reproduccions de Salvany identificades com a domini públic a Commons. Crèdit i data es mostren dins de la fitxa. No s’importen les fotografies modernes com a textures ni es distribueixen amb el web.

La recerca local queda a `docs/sources/porxos/`: text i registre de l’IPAC, metadades fotogràfiques amb autor/data/URL/hash, fotografies consultades i pàgines de procedència. `manifest.json` registra els fitxers arxivats. Les imatges IPAC completes es van recuperar de l’API pública del catàleg, sense utilitzar captures truncades. La data d’accés és el 31/10/2026.

## Verificació

- **62 proves correctes**: tres sobre el nou carpanell, malles reals de totes les arcades i evidència fotogràfica; inclouen pas buit a alçària de persona, pilars sòlids, absència de pisos frontals inventats, dates reals, cites resoltes i hashes de les imatges. Les proves anteriors cobreixen continuïtat de galeries i conservació d’inventari i terreny.
- TypeScript i compilació estàtica correctes. Continua l’avís d’optimització de mida del paquet del motor 3D.
- Navegador: nova geometria, recorregut de 8,6 m seguint el gir, selecció real d’arcades des de vista orbital i passeig, lectura amb cites. El gir ha de seguir la corba; els pilars no es travessen.
- Captures: `porxos-conjunt-0.12.0.jpg`, `porxos-0.12.0.jpg`, `porxos-fitxa-0.12.0.jpg`.

## Passos que falten

1. Aconseguir aixecament mètric dels porxos conservats i contrastar transformacions: llums, seccions, profunditats, impostes, cornises i cotes.
2. Identificar finques i nombre d’obertures originals amb plànols i fotografies datades; georeferenciar amb punts de control independents.
3. Datar cada fàbrica i reparació, acabats i colors; destriar originals, afegits i restauracions.
4. Resoldre l’evolució entre 1794 i 1800 i preparar fases posteriors del selector amb testimonis datats. Les fotografies de 1916 i del XX s’arxiven per a aquestes fases, però no generen per si soles nous estats de construcció.
5. Continuar la conciliació de propietats privades, interiors i accessos. El detall visual no completa el cens històric.
