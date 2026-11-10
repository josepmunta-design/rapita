# Encaje con el mapa actual, porxos, Horts de les Monges y costa sur · 08/11/2026 (0.17.0)

Imágenes en `encaix-icgc-20261108/`. Toda la geometría sigue siendo **C** salvo que se indique otra cosa.

## 1. Capa «mapa actual» en el visor

En *Capes → Mapa actual ICGC* se puede superponer al modelo:

- el **topográfico 1:1.000 del núcleo**,
- la **ortofoto 2024 del núcleo**,
- el **topográfico del territorio** (canal hasta Amposta).

Las tres imágenes son las mismas que ya estaban en `docs/sources/`, georreferenciadas a 3 px/m en EPSG:25831. Controles:

- **Opacidad.**
- **Fondo de papel.**
- **«Por encima de los edificios»**, para comprobar los contornos.
- **Encuadre:** vista cenital del núcleo.

Ficheros: `public/data/plan-icgc-actual.json` y `public/data/reference/icgc/*.jpg` (los genera `npm.cmd run data:overlay`).

## 2. Edificios encajados en el parcelario actual

Al superponer el modelo al topográfico (`01-abans-placa-sobre-icgc.jpg`) se veía que el croquis N112 il·l.4 se había leído con un eje de plaza desplazado unos 5 m al este y unas fachadas a ±23 m. La plaza de Carles III, el semicírculo de las cases rodones, el Cóc y las islas que los rodean conservan el trazado de 1780–1794. Por eso las líneas de fachada se han medido sobre el ráster, girado al marco de la población (azimut 19°, ±0,5 m):

| Elemento | Medida en el mapa actual | Antes | Ahora |
|---|---|---|---|
| Fachada oeste, isla del Ayuntamiento | −28,5 m | −23 m | −28,5 m |
| Fachada oeste, entre Constància y Rosari | −31 m | −23 m | −31 m |
| Iglesia (Santíssima Trinitat) | −31,5 m; along −62,5 a −80,5 | −23 m; along −70 a −87 | sobre el solar actual |
| Porxades (entre Aurora y semicírculo) | −32,3 m; 26 m de isla | 4 × 6,5 m sueltas | 4 × 6,5 m = 26 m exactos |
| Semicírculo | centro (−6,9; −108,8), R 25,4 m, paso de 10,3 m (ajuste a 14 puntos, residuo < 0,55 m) | (−2; −118), R 23, paso 8 | igual al mapa |
| Fachada este, Cóc–Arsenal | +20 m; 41,9 m de isla | +23 m, 9 × 5 m = 45 m | 9 casas de 4,66 m que llenan la isla |
| Fachada este, Arsenal–semicírculo | +18,5 m | +23 m | plaça coberta, tinglado y fuente |
| Fachada este, Cóc–Talavera | +22,5 m | ≈ +28 m | Fonda Nova y Talavera desplazadas en bloque |

Otros cambios:

- **Iglesia:** queda entre el carrer del Rosari (a su derecha mirándola de frente) y el carrer de l’Aurora (a su izquierda, estrecho, junto a las porxades), como en las fotos.
- **Cases cobertes:** las siete casas van del Rosari hacia el norte. Los 14 m de la esquina de la Constància quedan sin casa real (propiedades privadas no individualizadas).
- **Duana nova:** la isla actual al este del carreró que une el Cóc con la Plaça Vella cumple las cuatro lindes de la subasta de 1868: oeste con callejón, norte con la plaza, sur con la casa Ribera y la Plaça Vella, este con el patio del secuestro. Mide 30,5 × 17 m = 518 m², frente a los 520,555 m² de la escritura. Se corrige así la posición de la revisión anterior, que la dejaba al oeste del carreró.
- **Magatzems de White:** «el de l’esquerra» bajando por Sant Francesc, enfrente de la duana. Se mantienen 26 × 20 m y el límite este en el carrer del Rampar.
- **Cases petites:** el grupo 3 estaba sobre el Cóc y la duana; pasa al cap de la baixada de Sant Francesc, con la fachada a la calle. El grupo 2 sale del carrer de l’Arsenal y el grupo 1 sube 5 m.
- **Mançana:** 73 × 42 m en la isla actual entre Sant Antoni, Sant Tomàs, Sant Joaquim y la plaza (H02: «unos 80 × 40»).
- **Fonda Vella, forn de guix y casa de l’administrador:** estaban encima de calles actuales. Se trasladan a la isla más cercana; el forn sigue al norte de la Fonda Vella (N112 p.211).
- **Carrer principal:** pasa por el eje real (−5 m) y sale por el paso del carrer de la Pau. El suelo de la plaza (`publicSpace`) y las dos filas de garroferos siguen el mismo eje.

**Resultado** (`02-…`, `03-…`): las 55 piezas de la plaza, el Cóc y la Mançana coinciden en un 85 % de media con superficie edificada actual. Antes, por ejemplo, las cases cobertes coincidían entre un 18 y un 28 % y las porxades un 22–26 %.

**Fuera de este encaje:**

- Construcciones de 1748 (cuarteles, corrales, muro y capilla junto a la torre): vienen del plano de 1748 y son anteriores al trazado de la población.
- Huertos.
- Barracas de los obreros del canal.
- Caseta de Sanidad del muelle.

Todo ello puede no coincidir con las manzanas actuales.

Regeneración: `node scripts/apply-actual-map-20261108.mjs` + `npm.cmd run data:plaza`.

## 3. Porxos del centro, más fieles a las fotos

Comparados con CP01, N031 y la foto de Salvany (1916), los porxos del modelo eran demasiado anchos y bajos. Ahora (`src/porxo-plan.mjs`, `src/porxos.ts`):

- **Arcos:** de medio punto rebajado, estrechos (≈ 3,3 m de eje, luz < 3,2 m), dos por casa.
- **Pilares:** compartidos de 0,72 m con zócalo y capitel.
- **Galería:** 3,6 m de fondo, con arcos transversales en cada pilar.
- **Detalles:** banda de dovelas y forjado de viguetas.

## 4. Horts de les Monges en dos fases

- **1778–1780 · tres jornals:** según la queja de 1796, 3 jornals de Tortosa = 6.570 m². El polígono C tiene 5.936 m² (revisión del 09/11: borde oeste a 4,5 m del eje de la rampa) y llega al roquer de la costa.
- **Desde 1781:** recinte reducido (2.942 m²) entre los actuales carrers de la Mare de Déu de la Ràpita, de l’Arsenal y del Pou de les Figueretes. Las obras de la batería y de la rampa llarga se llevaron la parte del roquer.

La sínia y las higueras de PR01 quedan dentro del recinto (`04-horts-monges-i-rampa.jpg`).

## 5. Rampa llarga

El tramo alto sigue el camino arbolado de 1748, con el pou de les Figueretes en medio. El tramo bajo sigue ahora el eje del actual **carrer del Pou de les Figueretes**, que bordea el mercado construido sobre la batería («vorejant la bateria», N112 art.23), hasta el arranque del moll gran. El muro de contención se recalcula paralelo.

## 6. Costa sur rocosa

Desde el Roquer hacia el sur, la orilla se modela como plataforma de roca, no como playa. Hay unos 800 bloques y losas a ambos lados de la línea de agua hasta el final de la costa modelada (`07-costa-rocosa-sud.jpg`). Fuentes: carta de los Alfacs de 1813 y PR01. Al norte de la dársena se mantiene la playa de N112 il·l.4.

## 7. Pendiente

- Calle del Rampar: no se sabe si es el actual carrer del Pilar o el de Sant Miquel. El modelo mantiene la lectura anterior.
- Lindes exactas de la finca de White y de la casa de J. B. Ribera.
- Plano de la plaza de 1782, para validar la línea de fachadas sin depender del parcelario actual.
