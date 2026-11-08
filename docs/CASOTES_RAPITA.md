# Les Casotes · revisió 2/11/2026

Substituït el model anterior de magatzem amb nou arcs i coberta a dues aigües pels models de les **oficines i tallers de la Companyia** aportats a `Edificios Codigo/casotes_rapita_modelos_y_fuentes.zip`. Els nou arxius originals es conserven a la carpeta del mateix nom; hashes a [procedència](../data/casotes-provenance.json).

## Models i dimensions

- Reconstrucció **cap al 1858**: façanes de maó i grans arcades que engloben els buits de les dues plantes. Programa de portes i finestres interpretatiu, no datat per la fotografia antiga.
- **Aspecte actual**: rehabilitació museística de 2013, amb els tres panys centrals de vidre. Comparació manual, sense ampliar el calendari de la resta de la vila.
- **Cases de guarda**: dues cases opcionals, disponibles amb un control propi i un avís de distribució hipotètica. La situació local de ±11 m / +45 m prové del conveni visual del paquet; no es presenta com a georeferenciació.

El paquet utilitza **33 × 15,3 m**, aler a **6,5 m** i carena a **8,65 m**: són valors **estimats**, no mesures. La configuració d’onze arcades llargues, tres als laterals, dues plantes i teulada a quatre aigües és la base descriptiva del model. Els 900 m² publicats no s’han convertit en una petjada deduïda.

La nau principal i el magatzem amb semisoterrani eren elements diferents del complex. No s’inventen el moll, el magatzem independent, el pont giratori ni la resclosa sense planta verificada.

## Posició i cronologia

Es conserva **el punt marcat per Josep l’1/11/2026**, E **296840** / N **4499555** m, EPSG:25831, i el gir local de **12°**. El paquet nou no el substitueix amb les coordenades del catàleg; la façana +Z del generador és convencional.

El conjunt correspon a les obres de 1852–1859. El model conserva l’activació d’assaig des del testimoni de **1857**, amb etiqueta de reconstrucció cap al 1858 i sense fixar l’acabament exacte. **No apareix el 1800.** Els canvis d’activitat de 1867 i 1872 no activen reformes arquitectòniques inventades. El museu actual (obert l’1/12/2013) i les cases de guarda opcionals es desactiven en canviar d’any.

El suport i la connexió tècnica amb la costa es conserven i adapten a la planta nova. No delimiten un recinte històric mesurat. No es modifica el MDT. Les col·lisions utilitzen la planta de 33 × 15,3 m i incorporen les dues cases només mentre són visibles.

## Ús al visor

**Trama → Les Casotes · oficines i tallers de la Companyia**: reconstrucció històrica, comparació actual i cases de guarda opcionals. L’expedient també obre les dues versions. Els avisos sobre el mapa distingeixen l’estat actual i la distribució hipotètica. El far corregit continua disponible amb la seva cronologia i comparació.

`src/casotes-model.js` adapta el generador aportat: s’ha corregit el sentit dels triangles de teulada per orientar les normals cap a fora. `src/casotes.ts` agrupa la geometria per material i edifici sense duplicar les transformacions dels guardes. `src/urban.ts` conserva l’ancoratge i gestiona el suport tècnic i la visibilitat.

Regeneració: `npm.cmd run data:casotes`. Proves: `node --test tests/casotes.test.mjs tests/urban.test.mjs tests/port-georeference.test.mjs`. Compilació: `npm.cmd run build`.

## Fonts i límits

[Història oficial del Museu de la Mar de l’Ebre](https://museumarebre.com/museu/): oficines, tallers i magatzem independent; obra de 1852–1859; projecte de Jean Lenté, supervisió de Jules Carvallo i execució de Josep Canício Sala; obertura del museu el 2013. Consultada el 2/11/2026.

[Fitxa i fotografies de Pobles de Catalunya](https://www.poblesdecatalunya.cat/element.php?e=18378): dues plantes, maó vist, teulada a quatre aigües, façanes i cases de vigilants. Els enllaços externs es conserven com a font; no s’han incorporat noves còpies de fotografies externes a la galeria pública.

[Documentació completa del paquet](../Edificios%20Codigo/casotes_rapita_modelos_y_fuentes/cronologia-fuentes-y-medidas.md): onze i tres arcades, distinció dels 900 m² i hipòtesis paramètriques. Els GLB es conserven com a referència; el visor utilitza la versió procedural.

La fotografia antiga N107 del dossier anterior presenta un edifici blanc amb cossos laterals i una altra composició de façana. No se’n confirma la correspondència amb la nau aportada; s’ha retirat de la galeria de les Casotes. N073 es manté com a context de cases de guarda, sense deduir-ne una data ni la distribució exacta.

Les cases de guarda opcionals s’assenten sobre el terreny mostrejat amb un faldó tècnic local; aquesta adaptació vertical no valida les seves posicions horitzontals ni fixa una cota històrica.
