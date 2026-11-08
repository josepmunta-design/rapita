# Horitzó 1950 · recerca conservada, implementació posterior al poble del 1800

> Actualització 8/11/2026: el selector implementat arriba a 1993. Arxiu XIX amplia la recerca 1800–1900; [estat vigent i límits](1800-1900/REVISION.md). El text següent conserva l’abast i les decisions de la fase original.

L'abast demanat inclou fins al **1950**. La instrucció posterior prioritza completar carrers i cases del **1800**. Per això la versió 0.8.0 implementa la trama del XVIII i conserva la recerca posterior en un catàleg consultable: **el selector actiu continua 1778–1800**, i no es declara reconstruït el poble del XIX o del XX.

Les dades reutilitzables, anys, fonts, dubtes i motiu de no renderitzar cada peça són a `data/history-catalog.json`. No cal tornar a fer aquesta cerca per iniciar la fase següent.

## Fonts i fases trobades

| Període | Dada conservada | Aplicació següent |
|---|---|---|
| 1852 | Plànol ACA MPD 223 reproduït a la tesi, amb obra existent/projecte/enderrocs diferenciats | Aconseguir original; georeferenciar amb controls, no copiar tota la proposta |
| 1852–1859 | [Museu de la Mar de l'Ebre: complex de la Companyia](https://museumarebre.com/museu/) | Oficines, magatzem, dues cases, resclosa i pont giratori amb fases d'obra; distingir 1857 del final de tot el conjunt |
| 1862–1864 i 1920–1929 | [Autoritat Portuària: far de Sant Carles](https://www.porttarragona.cat/ca/notes-de-premsa-rss/item/1758-far-sant-carles-de-la-rapita) | Obra, servei, canvi de tanca i òptica; la font discrepa sobre el mes d'encesa de 1864, que queda sense resoldre |
| 1867 / còpia posterior | XML d'eixample de 197 parcel·les | Projecte separat de MPD 223; no són 197 cases acreditades |
| 1880–1945 | [Ajuntament de Bot: Val de Zafán](https://www.bot.altanet.org/la-vall-de-zafan-i-el-sarmentero), [Ajuntament d'Alcanyís: tram no completat](https://www.alcaniz.es/attachments/article/1845/6.%20La%20reconstrucci%C3%B3n%20de%20Alca%C3%B1iz%20tras%20la%20Guerra%20Civil.pdf) | No simular trens ni vies acabades a la Ràpita |
| Guerra Civil / 1938 | [Turisme: far apagat i represa a finals de 1938](https://turismelarapita.cat/interes/far-de-la-rapita/) | Interval d'apagada, sense precisar un dia no acreditat |
| 1939–1945 | [Fitxa municipal de Santíssima Trinitat](https://turismelarapita.cat/interes/esglesia-de-la-santissima-trinitat/), [catàleg patrimonial](https://www.poblesdecatalunya.cat/element.php?e=18366) | La primera diu 1941; el segon diferencia inici 1941 i benedicció 1945. Contrastar l'expedient abans de triar la variant acabada |
| 1945–1946 | Ortofoto ICGC arxivada | Digitalitzar cases i costa d'aquest moment, sense atribuir-les al 1800 ni al 1950 |
| 1950 | Pista escolar sobre un mercat provisional | Contrast primari pendent; sense geometria ni data validada |

El [fons municipal](https://larapita.cat/serveis/arxiu-municipal/fons-documentals/) conserva majoritàriament documentació des de 1938, amb documents anteriors aïllats: la pèrdua documental no es confon amb destrucció física de tota la població.

## Ortofoto arxivada

Font: ICGC, WMS Ortofoto Territorial, capa `ortofoto_blanc_i_negre_1945-1946`. Crèdit **ICGC · CC BY 4.0**. [Descripció del producte](https://www.icgc.cat/es/Geoinformacion-y-mapas/Datos-y-productos/Imagen/Ortofoto-Territorial).

Extensió EPSG:25831 E 295.500–297.100 / N 4.497.300–4.500.300; 1.280 × 2.400 píxels, sortida a 1,25 m/píxel. El GetFeatureInfo informa del període 25/02/1945–03/08/1946 i GSD d'origen 1 m. La data exacta local continua `null`. Les peticions a les capes anuals consultades han donat la mateixa imatge, i per això es conserva el nom **1945–1946** sense una precisió falsa.

JPEG, petició i resposta de dates a `docs/sources/history/`; SHA-256 `ae432973003dbd02962e1a70eb3087d722b913bbf7511a191c6b8e0bacd9b519`. La còpia per a consulta dins de l'app és local, sense servei remot durant la visita.
