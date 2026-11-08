# Far de Punta Senieta · revisió 2/11/2026

Substituït el volum incorrecte (casa rectangular amb coberta inclinada i torre lateral alta) pel codi procedural aportat a `Faro/faro_rapita_dos_modelos_threejs.zip`. Els set arxius originals es conserven a `Faro/faro_rapita/`; hashes a [procedència](../data/faro-provenance.json).

La planta documentada és de **13,10 × 13,10 m**, amb **terrat pla** i **torre central**. Zòcal 0,50 m, mur 2,90 m i cornisa 0,30 m: 3,70 m fins a coronació. Torre de 2,30 m de diàmetre, cos superior de 1,90 m. El focus original és a 6,80 m del terreny; no és l’alçada total de la cúpula i pinacle, que són aproximats.

## Fases del visor

- Abans de 1862: edifici absent, també el 1800.
- 1862–1863: obra i llanterna acabades, sense servei. La resolució anual no distingeix maig de desembre.
- 1864–1919: façanes groc clar, torre de pedra i llanterna octogonal de coure; primera llum documentada l’1/11/1864.
- 1920–1974: llanterna cilíndrica amb muntants helicoidals; òptica representativa sense el vermell posterior. Es conserva el groc com a hipòtesi perquè el repintat blanc no està datat. L’electrificació de 1929 no canvia la silueta. Divergència 1920/1929 entre Port i RABASF conservada.
- 1937–1938: sense emissió; represa visible el 1939, per la resolució anual. L’apagada real comença el 17/3/1937 i acaba a finals de 1938.
- Des de 1975: òptica roja representativa. No s’hi reprodueix el mecanisme intern ni l’animació de les ocultacions.
- **Aspecte actual**: façanes blanques, terrat vermellós i llanterna metàl·lica del segon model aportat. Comparació manual a **Trama → Far de Sant Carles**, també accessible des de l’expedient. Un avís sobre el mapa identifica la comparació; canviar d’any la cancel·la. No s’estén el calendari de la resta del poble per mostrar acabats sense data.

## Integració

`src/faro-rapita-model.js` parteix del codi aportat i hi afegeix una variant de transició. `src/faro.ts` agrupa les peces per material (menys de 25 malles per variant), gestiona la visibilitat i conserva una sola fase visible. `src/urban.ts` manté la selecció, la posició del mapa i el suport tècnic fins al terreny mostrejat. Planta de col·lisió actualitzada a 13,10 m. El MDT no es modifica.

Els GLB originals es conserven com a referència: el mateix paquet adverteix que es van generar independentment i no són idèntics a la versió procedural. No es carreguen al visor.

Regeneració de dades i fitxa: `npm.cmd run data:faro`. Proves específiques: `node --test tests/faro.test.mjs tests/urban.test.mjs`. Compilació: `npm.cmd run build`.

## Límits i fonts

La posició de treball es conserva (E 295687,2 / N 4497963 m, EPSG:25831), basada en coordenades de la **platja** amb precisió ±150 m. No s’ha obtingut una nova georeferenciació. La façana +Z del paquet és convencional: el gir del mapa continua sent d’assaig. Finestres i portes són superfícies superposades, adequades per a l’exterior. Els remats, reixes i petits detalls són aproximacions; el perímetre, jardí i via d’accés no s’inventen.

- [Autoritat Portuària de Tarragona: relat de Cardenal (1875) i reformes](https://www.porttarragona.cat/es/notes-de-premsa-rss/item/1758-faro-sant-carles-de-la-rapita). Consultat el 2/11/2026: dimensions, primera llum de novembre dins el relat i reforma de 1920. La capçalera web diu setembre; la discrepància queda indicada.
- [RABASF: Far de Punta Senieta](https://www.faros-historicos-de-espana.com/faro/faro-de-sant-carles-de-la-rapita). Fotografies i cronologia del paquet aportat; no és un aixecament mètric del 2026.
- [Cronologia i fonts del paquet](../Faro/faro_rapita/cronologia-y-fuentes.md), inclòs l’avís nàutic de 20/9/1864 publicat al BOP de Cadis l’1/10/1864 i la làmina de la Ràpita de 6è ordre.

N085, present a l’expedient anterior, mostra una torre alta de tipologia diferent. S’ha retirat de la galeria del far de Punta Senieta perquè la correspondència no està verificada. No s’utilitza per determinar-ne la geometria.
