# Aspecto Arquitectònic: lámina a tinta y aguada

Versión 0.20.0 · 13/11/2026. Tercer aspecto del visor, junto a Documental y Realista. Parte de la lámina de referencia aportada por Josep (`DIsseny/`, original local, no publicado): una planta oblicua del conjunto dibujada como plancha de atlas, con línea de tinta, aguadas planas, papel, título, leyenda numerada, norte, escala gráfica y cartela.

## Qué cambia y qué no

Cambia solo la representación. El año, la cámara, la geometría, las huellas, las cotas, la costa, el nivel de agua y la cronología son los mismos que en los otros dos aspectos; se puede alternar entre los tres sin recargar. Todo lo que añade la lámina es convención de dibujo de certeza C y así lo indica el propio control (*Arquitectònic · làmina C*).

| Elemento | Cómo se obtiene | Límite |
| --- | --- | --- |
| Línea de tinta | Pase de pantalla sobre profundidad y color: aristas (dos normales unilaterales), siluetas (salto en 1/z) y cambios de matiz | No añade ni quita aristas al modelo; a pie, la línea lejana se apaga antes |
| Aguadas | Colores documentales de los edificios, sin pátina ni mapas PBR; suelo y mar con paleta propia | Paleta genérica, no un mapa de usos del suelo de 1800 |
| Hiladas de teja | Rayado por la pendiente del faldón, con separación constante sobre el papel | Dibujo, no despiece de tejas |
| Curvas de nivel | Leídas de la superficie mostrada: 1 m de cerca, 5 m a media distancia, 25 m en la sierra | Heredan la certeza del relieve (C donde está interpretado) |
| Luz y sombras | Convención del dibujo de arquitectura: desde arriba a la izquierda de la lámina, por lo que gira con la vista en pasos de 10° | No es una hora del día ni una efeméride |
| Papel y márgenes | El dibujo se desvanece hacia el borde y bajo el título, la escala y la cartela; la distancia se funde con el papel en lugar de un cielo | — |
| Escala gráfica | Longitud redonda (1-2-5) medida en el punto al que mira la cámara | En perspectiva solo es exacta en ese punto |
| Leyenda | Los siete lugares de referencia del visor, con su misma numeración, más Hort del Rei, canal y muelles cuando el año los muestra | No renombra ni inventa conjuntos; los nombres salen de los datos |

La vegetación ambiental C se limita a los árboles (el matorral disperso y el detalle de entorno se ocultan: a escala de lámina se leían como ruido). Los sesenta algarrobos de la plaza y las plantas de PR01 conservan posición y número.

## Implementación

- `src/visual-ink.ts`: `makeInkPlate` dibuja la escena en un búfer con profundidad (sRGB de 8 bits, MSAA ×4 salvo en calidad baja) y lo recompone con `plateFragment`. Es un pase de fragmentos: no puede desplazar vértices.
- `src/visual-ground.ts`: `groundPlateGLSL`, tercera rama del sombreador de suelo (`groundRealismStrength` 0 documental, 1 realista, 2 lámina).
- `src/visual-water.ts`: `set('plate')` da un lavado mate y quieto que escribe profundidad, para que la tinta perfile el plano del agua y no el fondo.
- `src/visual-materials.ts`: `set(false, anisotropía, true)` conserva los acabados documentales y solo raya las cubiertas de teja.
- `src/visual-plan.mjs`: `visualModes`, `plateLight`, `plateSunAzimuth` y `plateScale` (funciones puras, con pruebas).
- `src/visual-style.ts`: el modo `arquitectonic`, la luz ligada a la vista, la escala y `render()`, que sustituye a `renderer.render` en el bucle.
- `index.html` y `src/visual-style.css`: la plancha (`#plate`) con título, leyenda, escala y cartela; los controles del visor siguen operativos con papel y tinta. La ficha del lugar solo aparece al enfocar un elemento; el aviso documental pasa a ser la nota al pie de la lámina.
- `src/main.ts`: leyenda y marcadores numerados sobre el terreno (sin poste), tres marcas de paisaje y ningún rótulo sobre el bloque del título.

Enlace directo: `?visual=arquitectonic`. La preferencia se guarda con el resto de ajustes de *Aspecte*.

## Comprobaciones

- 135 pruebas (`npm test`), dos nuevas: la lámina conserva geometría y restaura todos los materiales y el agua al volver a Documental; la escala usa longitudes redondas que caben y la luz sigue a la vista en pasos válidos.
- `npm run build` sin errores de tipos.
- Revisión en navegador (Edge, GPU real, 1672 × 941 y 1500 × 1000): vista general, Poble, Planta, Montsià, Extensió, a pie, año 1993, calidad baja, anchos de 900 y 420 px, e ida y vuelta Documental → Realista → Arquitectònic. Sin errores de consola; 57–60 FPS en calidad media en el equipo de trabajo.

## Límites conocidos

- Es una interpretación gráfica en tiempo real: se aproxima a la lámina de referencia en línea, color, luz y composición, pero no reproduce su trazo a mano ni sus texturas dibujadas (cultivos rayados, copas de árbol individualizadas).
- Los cultivos siguen siendo las plantas del modelo, no un rayado de hileras.
- En pantallas de menos de 1100 px se ocultan la leyenda, la escala y la cartela para no tapar el dibujo.
- Al girar la vista, la luz cambia a saltos de 10° (cada salto redibuja el mapa de sombras).
