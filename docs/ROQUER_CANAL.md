# Roquer, litoral i canal

**Estat espacial vigent (31/10/2026):** [ajust al redibuix de 1748, taula de coordenades i fases](ROQUER_ALINEACIO.md). Costa, edificis A–G i projectes H–O comparteixen una única transformació. Aquesta revisió substitueix les plantes i posicions d’assaig descrites a la fase 0.5 de sota. Els snapshots i `ubicacio.json` dels expedients es generen dels mateixos fitxers que el mapa.

## Antecedent · versió 0.5.0

Revisió focal feta el 30/10/2026. **Escenari C, no restitució històrica validada.** La geometria continua integrada al mapa general i es genera al navegador.

## Documents contrastats

| Document | Lectura i conseqüència |
|---|---|
| `t-6-8.jpg` | Inspecció de les dues plantes, perfil, llegenda i escala. Projecte de bateria de vuit canons. Contorn manual en D, dues ales i accés posterior. No s'ha georeferenciat el full. |
| Catàleg BVD, T-6/8 | [Registre oficial](https://bibliotecavirtual.defensa.gob.es/BVMDefensa/es/consulta/registro.do?control=BMDB20200579861). El catàleg data el document `[17--?]`. No s'atribueix una data exacta al JPEG per semblança amb el projecte de Llobet de 1778 reproduït a la tesi. |
| H01, tesi, pp. 107–120, especialment 113–115 | Obres iniciades el maig de 1779. Inventari parcial de març de 1780: murs, cambres amb obertures, magatzem d'avituallament gairebé acabat i cisterna incompleta. La Companyia Pintat acaba torre i muralla, excava la cisterna, acaba la contraescarpa i fa un forn. Obres suspeses el 1781. La figura de p. 118 s'ha revisat visualment. |
| H02, Reverté 2024, anàlisi i art. 16–29 | Torre i allotjament; bateria a mig fer amb **sis canons de ferro de 18 lliures**, tres en curenyes gairebé inútils, tres sense. Dàrsenes, molls, rampes, murs, pont i obres parcials de resclosa a Amposta. Canal principal de 12.300 vares, amplades variables de 8–12 i fins a 20 vares en alguns punts. No descriu una infraestructura moderna plenament navegable. |
| `T0009734.jpg` | Carta dels Alfacs de **1813**, data confirmada al [catàleg IGN](https://contenido.ign.es/web/catalogo-cartoteca/resources/html/009734.html). Comparació posterior qualitativa, no línia de costa georeferenciada de 1800. |
| `1997_septiembre_3368_10.pdf` | Contacte visual de les 12 pàgines i lectura de pp. 119–120 (PDF 7–8). El traçat exacte del primer canal es declara desconegut; la figura 3 correspon a mitjan XIX. El gran moll de 1782 és projecte no executat. No es copia cap dels dos com a obra de 1800. |
| `La_rabita_en_el_islam_Estudios_interdisciplinares.pdf` | Extracció de text i lectura focal dels passatges de Bramon i Francesc Carles sobre el monestir i el Roquer. No és lectura íntegra del volum. Context de reutilització i ruïna; cap justificació per construir un monestir medieval complet o una mesquita de 1800. |
| `1679586.xml` | ACA MP 284: còpia de 1870 d'un eixample de 1867. Exclòs del traçat de 1800. |
| Ajuntament d'Amposta, passeig del Canal Marítim, §2.1 | [Memòria municipal](https://www.amposta.cat/documents/54/08_002%20_U_PE_U%20URB_PG_CANALMAR%C3%8DTIM_CIRCUIT_SALUDABLE.pdf): inici de 1780, problemes de calat des de 1783 i sedimentació. |
| Museu Marítim de Barcelona, Argo 7 | [Vela llatina](https://www.mmb.cat/wp-content/uploads/2023/05/ARGO7-PROT-VERSIO-WEB.pdf), com a referència tipològica. Les cinc embarcacions són genèriques C, no rèpliques de vaixells identificats ni recompte de la flota. |

**Atribució del T-6/8:** Fuente: Archivo General Militar de Madrid / Biblioteca Virtual de Defensa · CC BY 4.0. Els originals no s'han modificat.

## Peces representades

Bateria parcial, torre amb dues variants cronològiques, dependències de guarnició, fàbriques fragmentàries del monestir amb un cos reutilitzat, cisterna d'assaig, forn de maons, Fonda Vella, duana antiga, caseta de Sanitat al moll i pou de les Figueretes. Els usos tenen graus d'evidència diferents; **cada posició individual, planta i alçat és C**. Les dependències del monestir/Sanitat poden correspondre a reutilitzacions d'un mateix àmbit: no s'afirma un inventari d'edificis independents mesurats.

La torre té quatre nivells d'assaig perquè la documentació esmenta segon, tercer i quart pis; la planta de 8 × 8 m i l'alçària de 13,2 m no són mesures documentals. La fase anterior a la reparació també és C. La correspondència entre la fonda dels Lanti de 1782 i el cos anomenat Fonda Vella és una hipòtesi.

La bateria parteix de l'escala de 40 vares del T-6/8. S'adopta la vara castellana de 0,835905 m (també indicada a H01, p. 252), amb una lectura manual d'uns 37 m d'amplada. La distorsió del full, el gir, l'emplaçament i els fragments executats no s'han resolt arqueològicament. L'opció d'envolupant mostra una comparació volumètrica C, apagada al començament. El perfil complet de dues plantes no es presenta com a construït.

S'han afegit molls modestos, escullera, dues rampes d'assaig i fàbrica parcial a la capçalera d'Amposta. **No** s'ha construït el moll monumental de 1782, ni les bateries del Fangar/Encanyissada, ni la fàbrica de paper o les rescloses del XIX. Les rampes no resolen encara tota la xarxa viària ni el pont d'entrada documentat.

## Terreny i aigua

- El GeoTIFF local i els tres binaris originals conserven les mostres i les màscares. El mode **MDT actual** mostra aquesta base contemporània.
- El mode **Litoral · C** genera malles de visualització noves: rebaixa els rebliments moderns a la banda de mar, assaja una franja de platja i un front més rocós al Roquer, i obre canal i dàrsenes amb bermes d’assaig. No és una correcció històrica acreditada. Els NoData no s'omplen amb sòl.
- Canal d'assaig de **10.258,31 m**, amplada de treball de 8,4 m, amb ramal i dues dàrsenes. És una connexió territorial C entre la Ràpita i l'àmbit de l'Ebre a Amposta, no un traçat digitalitzat sobre un plànol de 1800.
- El corredor s'ha afinat sobre el mapa topogràfic ICGC actual, arxivat a `docs/sources/canal-topographic-current.jpg` amb la petició WMS exacta. Lectura manual de precisió de desenes de metres, emprada per evitar passar pel vessant alt; no acredita la coincidència amb el canal de 1800.
- L'aigua del mar és a 0,45 m i la del canal puja tècnicament fins a 1,35 m. **Nivell històric i equivalència vertical desconeguts**, sense model hidràulic. No s'apliquen els nivells de la reforma del XIX. Bancs de sediment i barques només al fondejador; cap simulació de navegació funcional pel canal.
- El context nord prové del [WCS ICGC del MDT](https://www.icgc.cat/ca/Geoinformacio-i-mapes/Geoinformacio-en-linia-Geoserveis/WMS-i-WCS-Elevacions/WCS-del-Model-dElevacions-del-Terreny), cobertura `icc:met`, pas sol·licitat de **50 m**. És una font contemporània multiresolució diferent del LiDAR local. Petició exacta i resposta ASCII arxivades a `docs/sources/canal-region-request.txt` i `canal-region.asc`.
- Context: 72 × 206 mostres, E inicial 294.755,25 / N inicial 4.511.244,75. El darrer tram de 50 m s'uneix als vèrtexs natius de 10 m del límit nord local; es descarta la fila WCS duplicada en la malla visual. Cap solapament de dues superfícies al límit.
- Els triangles pròxims als talls es subdivideixen per l'aresta més llarga fins a ≤4 m per representar un canal més estret que la malla regional. Aquesta subdivisió interpola el context; **no afegeix precisió topogràfica**. Es conserven els índexs que exclouen NoData i les unions dels retalls locals.
- Una línia cartogràfica i tres etiquetes permeten llegir el canal a escala regional; no n'augmenten l'amplada física.

## Reproducció i pendents

`npm.cmd run data:littoral` regenera metadades, context binari i testimonis cronològics a partir dels JSON i de l'ASCII arxivat. Les imatges de referència es copien sense modificar-les; es carreguen en obrir-ne la consulta. Cap xarxa necessària durant la visita.

- [ ] Georeferenciar T-6/8 i cartografia de costa amb punts de control i residus publicats.
- [ ] Resoldre l'empremta i les fases de cada fàbrica del Roquer; mesurar alçats i obertures.
- [ ] Distingir millor reutilitzacions del monestir, dependències militars i serveis portuaris.
- [ ] Digitalitzar els trams executats de molls, pont i murs; no confondre projecció amb execució.
- [ ] Quantificar els danys de 1795 i canvis fins al 1800 abans d'animar-ne cap destrucció.
- [ ] Validar costa, batimetria, datum i hidràulica; la platja/roques actuals són un assaig explícit.
- [ ] Completar la restitució del fossat i la cisterna amb excavacions mesurades, no només els volums d'assaig.

## Correcció de connexió · 0.6.0

La geometria anterior deixava una llengua de terreny entre dàrsena i mar, i el ramal acabava dos metres abans de la vora d'aigua. A més, l'aplicació successiva de talussos podia tornar a alçar un fons ja excavat. S'ha substituït per una unió de talls: qualsevol fons d'aigua té prioritat sobre els talussos veïns.

La làmina de mar incorpora les dues dàrsenes obertes i substitueix les plaques rectangulars superposades. El ramal s'estén fins a N 4.499.424 per solapar-se amb la dàrsena. Els primers 100 m del nivell tècnic del canal són plans a 0,45 m, abans de l'ascens d'assaig cap a Amposta. La costa anterior continua diferenciada abans del testimoni de 1794.

És una correcció de coherència geomètrica de l'escenari C, no una mesura de l'amplada històrica de la boca ni prova de navegabilitat. Les proves recorren els triangles d'aigua de la boca principal i del ramal, no només una màscara de distàncies.
