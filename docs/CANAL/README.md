# Canal de Carles III · expediente de trabajo (revisión 08/11/2026)

Carpeta específica del canal: diagnóstico, fuentes, georreferencias, imágenes y decisiones. Todo lo que aquí se describe es una restitución **C** salvo que se diga lo contrario.

## 1. Problema detectado

El último tramo del canal (unos 220 m, de N 4.499.260 a N 4.499.475) discurría **por dentro del mar**, entre dos bermas, y dejaba una franja de agua marina entre el canal y el pueblo (`img/02`, `img/03`, `img/04`).

Causa: en la fase del 01/11/2026 se trazó como «costa» (`shore` de `data/layout-reference-1800.json`) la línea discontinua **24 · Mur de contenció** y el borde de los Horts de les Monges del croquis N112 il·l.4. La leyenda del croquis reserva la línea **punteada** para la «Línia de costa estimada», y esa línea va en diagonal SW→NE, cruza la dàrsena gran y deja el brazo 19 entero en tierra (`img/07`).

## 2. Fuentes contrastadas

| Fuente | Lectura | Uso |
|---|---|---|
| N112 il·l.4 (Reverté 2024), croquis de 1794 | Línea punteada = costa estimada; brazo 19 en tierra, al este de la población; termina en la esquina NW de la dàrsena gran; casas de particulares (5) entre el brazo y la costa. | Nueva línea de costa entre la dàrsena gran y N 4.499.310. |
| N112 il·l.3 (Reverté 2024), sobre base ICGC 2023 | Zonas A (población), B (Església Nova), **C (dàrsena del canal i enclusa)**, **D (molí fariner, Desguàs del Molinet)**. | Georreferenciada con 4 topónimos comunes con el mapa topográfico ICGC (`data/georef-N112-il3.json`). Control independiente: B cae a 15 m de la Església Nova del modelo. |
| Carta del puerto de los Alfaques, 1813 (IGN T0009734) | El canal llega recto desde el norte y desemboca en la costa junto al NE de San Carlos; sin agua entre canal y población (`img/05`). | Comprobación cualitativa. |
| Pilar Reverté, *Descripció ia* | «La playa al norte», cabo y golfo con playa; la playa queda en la raconada al norte de la punta. | La costa al norte del Roquer es playa, no el pie del acantilado. |
| N112 art. 20–21, p. 233 (relación del 20/5/1794) | Dàrsena petita acabada (mampostería, sillares, pilotaje, puzolana bajo agua, coronación de cantería); **enclusa gran comenzada y sin concluir**, con la mayor parte de la piedra ya tallada. | Nuevo conjunto dàrsena petita + enclusa inacabada en la zona C. |
| Mapa topográfico ICGC actual (`docs/sources/canal-topographic-current.jpg`) | Canal de Navegació, Horta Vella, el Saliner, la Rabosa, Desguàs del Molinet. | Base de la georreferencia de il·l.3 y de los topónimos de partida. |

## 3. Georreferencia de N112 il·l.3

Escala + traslación (ambas bases ICGC orientadas al norte), 5,75 m/píxel del original de 602 × 379 px. Residuos de 18 a 51 m. Resultado por zonas (UTM 31N, EPSG:25831):

| Zona | Centro aproximado | Lectura |
|---|---|---|
| A · Població | 296.232 / 4.499.337 | Trama completa proyectada. |
| B · Església Nova | 295.955 / 4.498.899 | Control: el modelo la tiene en 295.940 / 4.498.903. |
| **C · Dàrsena del canal i enclusa** | **296.717 / 4.499.510** (±50 m) | A unos 250 m al NE de la plaza, junto a la costa estimada. |
| D · Molí fariner (extremo sur) | 298.788 / 4.499.661 (±60 m) | Fuera del terreno modelado (límite E 298.350). No se emplaza en 3D. |

## 4. Decisiones aplicadas (versión 0.15.0)

1. **Costa estimada de 1794** (`scripts/apply-coast-1794.mjs`, idempotente). Entre la punta del Roquer y N 4.499.310 se usa la línea punteada de N112 il·l.4 (siete puntos, `estimatedCoast` en `data/layout-reference-1800.json`), con el mismo registro del croquis que ya usaban edificios y huertos. El muro 24 (`shore`) se conserva como pie del escarpe (`roquerCoast`, rocas), ya no como borde del agua.
2. **Dàrsena gran**: su lado de tierra es la costa estimada; los dos muelles en L arrancan donde los dibuja el croquis (el de levante en el píxel 411,370). El brazo 19 entra por la esquina NW, en tierra en todo su recorrido.
3. **Costa al norte del pueblo**: la traza C anterior subía hacia el NE (296.967/4.500.000 → 298.800/4.501.500) y creaba una bahía inexistente entre el canal y el delta. Ahora la costa gira a levante en N ≈ 4.499.560–4.499.630 (carta de 1813; costa actual de la Bassa de Rabassa), y deja en tierra la Horta Vella, la Rabosa y la playa del Molinet. Las fases portuarias del siglo XX se empalman con un tramo horizontal (`src/harbour-plan.mjs`) para no heredar aquella bahía.
4. **Dàrsena petita y enclusa gran** (zona C): ensanche lateral del canal de 34 × 20 m con muelle de mampostería, coronación de cantería y pilotaje; esclusa de 38 × 8,4 m **comenzada**, cámara seca, muros a alturas distintas, sin puertas y separada de la dàrsena por un tapón de tierra de 4 m; montones de sillares tallados. Botón **Litoral → Dàrsena petita**. Visibles desde 1790 y 1792 (cotas de visualización, no fechas de obra).
5. **Vista Desembocadura** recentrada en la boca real del brazo 19.
6. **Molinet**: su posición estimada (E 298.788 / N 4.499.661, ±80 m) queda fuera del terreno del visor (límite E 298.350). Se registra en el expediente; no se coloca en 3D.

## 5. Comprobaciones

- `tests/canal-coast-20261108.test.mjs`: ninguna estación del canal en el mar; 60 m de tierra al oeste del brazo 19; la plana NE es tierra; la dàrsena petita tiene agua y la esclusa está seca y no llega al mar; nuevos edificios con fuente y precisión.
- Auditoría de edificios costeros: 90 grupos / 105 huellas, ninguno sin apoyo.
- Pruebas antiguas ajustadas solo donde codificaban la costa superada (se conserva la comprobación de las posiciones rechazadas contra la costa anterior).

## 6. Pendiente

- Obtener el plano del puerto de 1782 y el original de N112 il·l.4 para sustituir la lectura del croquis por puntos de control.
- Contrastar la costa N con la planimetría de 1913 (N111) georreferenciada.
- Dimensiones reales de la dàrsena petita y de la esclusa (art. 20–21 no da medidas).
- Ampliar el terreno a levante si se quiere representar el Molinet y el canal viejo.

## Imágenes

| Archivo | Contenido |
|---|---|
| `img/01`–`04` | Estado anterior: canal regional, desembocadura en perspectiva y planta, diagnóstico en planta. |
| `img/05` | Carta de 1813, detalle de San Carlos. |
| `img/06`–`07` | N112 il·l.4: trazas anteriores (azul = costa usada antes) y línea punteada de costa estimada. |
| `img/08`–`09` | Mapa topográfico ICGC y N112 il·l.3 con zonas A–D. |
| `img/10`–`16` | Resultado: desembocadura del brazo 19, dàrsena petita y esclusa, planta (costa nueva en azul sobre el MDT actual), vista general y vista regional del canal. |
