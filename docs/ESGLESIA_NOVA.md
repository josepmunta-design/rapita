# ESG-001 — primer módulo de Església Nova

**Fecha:** 30/10/2026. **Versión:** 0.2.0. **Estado:** modelo de estudio C; no validado como reconstrucción del año 1800.

## Qué se ha construido

- Recorte local de 240 × 240 m integrado en el mapa general, 121 × 121 muestras a paso de 2 m, extraído del GeoTIFF original ICGC. Conserva centros de píxel, máscara y cotas nativas.
- Una traza aproximada de la fábrica actual, digitizada manualmente en una ortofoto oficial ICGC de 2024.
- Un volumen procedural de planta cuadrada, con cuatro columnas de fachada, huecos practicados en los muros, espacio central abierto y una distribución de ensayo en cruz griega.
- Controles para ocultar el volumen, cambiar la altura de trabajo, retirar la fachada y ocultar el interior. Ninguno de estos controles modifica los campos documentales.
- Un apoyo técnico provisional para poder inspeccionar la pieza sobre el MDT actual sin aplanar el terreno.

No se han modelado cubierta ni cúpula, instalaciones contemporáneas, mobiliario, esculturas, restauraciones o detalles de acabado sin acreditar. Los capiteles son una simplificación geométrica para reconocer el orden mencionado en las fuentes, no una restitución del despiece.

## Evidencias utilizadas

| ID | Fuente | Uso y límite |
|---|---|---|
| H01 | Noèlia Borràs Matamoros, tesis de 2013, páginas impresas 234–240 / PDF 238–244, archivo `tesi doctoral.pdf` en la raíz | Leído el apartado completo hasta las fotografías de p. 240. Configuración, controversia funcional, columnas y cubierta sin ejecutar. Las fotos no proporcionan un levantamiento métrico ni una datación del estado exacto en 1800. |
| H06 | [Ajuntament: Església Nova](https://cultura.larapita.cat/espais/esglesia-nova/) | Planta central, doble altura, corredores, columnas jónicas y cúpula sin construir. Se mantiene abierto el debate sobre función original. |
| H07 | [Gran Enciclopèdia Catalana: la Ràpita](https://www.enciclopedia.cat/gran-enciclopedia-catalana/la-rapita-3) | Publica un cuadrado de **23,7 m de lado**. Medida de referencia bibliográfica; no se ha medido in situ ni cotejado con un plano acotado. |
| G01 | GeoTIFF ICGC MDT 0,5 m, 2021–2023, ZIP FME aportado | Fuente altimétrica contemporánea. Datum vertical todavía pendiente de contraste; no se deduce de él la cota de 1800. |
| G02 | [ICGC, WMS Ortofoto Territorial](https://www.icgc.cat/ca/Geoinformacio-i-mapes/Geoinformacio-en-linia-Geoserveis/WMS-Ortoimatges/WMS-Ortofoto-Territorial), capa `ortofoto_color_2024` | Ortofoto actual para posición/orientación aproximadas. Cubierta e intervenciones posteriores pueden ocultar la fábrica original. No es evidencia del estado de 1800. |

Las consultas a OSM/Overpass no entregaron geometría utilizable; tampoco se obtuvo una geometría catastral en las consultas probadas. No se ha atribuido a esas fuentes ningún contorno medido.

## Digitización actual y orientación

La imagen de trabajo está en `docs/sources/esglesia-nova-ortofoto-2024.jpg` (1100 × 1100 píxeles). Se conserva la solicitud exacta en `docs/sources/ortofoto-request.txt`.

- CRS: EPSG:25831, orden E/N.
- BBOX WMS: E 295.890–296.000 / N 4.498.850–4.498.960.
- Resolución solicitada: 0,1 m/píxel. No equivale necesariamente a resolución nativa de captura.
- Conversión continua desde el borde de la imagen: `E = 295890 + x * 0.1`; `N = 4498960 - y * 0.1`.

| Vértice | Píxel seleccionado (x,y) | E | N |
|---|---|---:|---:|
| NO | 464,424 | 295936,4 | 4498917,6 |
| NE | 659,546 | 295955,9 | 4498905,4 |
| SE | 534,745 | 295943,4 | 4498885,5 |
| SO | 338,623 | 295923,8 | 4498897,7 |

La selección manual se considera **B, aproximación de la fábrica actual**, con margen de trabajo estimado de ±1,5 m; no es una precisión certificada. Sus lados resultan aproximadamente 23,00 / 23,50 / 23,09 / 23,55 m. Las diferencias respecto a los 23,7 m publicados no se han ocultado ni corregido forzando la digitización.

El centro empleado para el ensayo es el promedio de las cuatro esquinas: E 295939,875 / N 4498901,55. Los decimales son resultado de cálculo, no precisión topográfica. Se mantiene el ancla previa del visor general como referencia anterior; el modelo local usa esta aproximación revisada.

La fachada se orienta aproximadamente a **122,2° respecto al norte de la cuadrícula UTM**, con margen de trabajo de ±3°. Se obtiene de las alineaciones visibles y la lectura de la fachada hacia el SE. No es un azimut geodésico corregido por convergencia de meridianos.

El volumen se normaliza a un cuadrado de 23,7 m siguiendo H07; la traza digitizada se muestra por separado en verde, para que pueda apreciarse que no coinciden exactamente.

## Qué sigue siendo hipotético

`data/esglesia-nova.json` mantiene dos grupos independientes:

- `documented`: tipología, lado publicado, número/orden de columnas, ausencia de cúpula y campos sin medir en `null`.
- `preview`: altura, espesor, radio central, anchura de brazos/corredores, huecos, posición de columnas y distribución de trabajo. Todo este grupo es **C**.

La altura inicial de muros es **8,4 m** y puede variarse entre 6 y 11 m. Es un parámetro de ensayo, no una medida histórica. Espesor inicial 0,85 m, radio central 5 m y anchura de brazos 4,8 m son también hipótesis de trabajo.

Las fotografías reproducidas en la tesis muestran fábrica y vanos, pero la perspectiva no permite deducir de forma fiable todas estas cotas. No se han inventado medidas y guardado como documentadas.

## Terreno y apoyo provisional

| Parámetro | Valor |
|---|---|
| Recorte | 240 × 240 m entre centros extremos |
| Retícula | 121 × 121, paso 2 m, todas las 14.641 muestras válidas |
| Primera muestra | E 295825,25 / N 4499014,75 |
| Última muestra | E 296065,25 / N 4498774,75 |
| Rango del recorte | 17,110–30,563 m |
| Terreno muestreado bajo planta | 24,448–25,642 m |
| Centro de referencia | 25,316 m, MDT actual |
| Plano técnico de apoyo | 25,792 m, máximo muestreado bajo planta + 0,15 m |
| Cota histórica | Desconocida (`null`) |

El apoyo gris es una **pieza técnica provisional** cuya cara inferior sigue el terreno actual. No acredita un podio histórico, cimentación o relleno de esa forma. No se ha alterado ningún valor del MDT ni añadido una corrección histórica. En modo «Traza actual» se ocultan conjuntamente apoyo, suelo y volumen.

La retícula local comparte centros exactos con el MDT de 10 m. Una prueba compara directamente sus alturas coincidentes. Se muestran simultáneamente: se elimina el terreno grueso bajo el recorte y se conecta el interior fino mediante una banda de transición a los vértices comunes de 10 m. No hay solapamiento ni relleno de alturas; el borde conserva los valores nativos. Dos pruebas comprueban que no quedan grietas, caras invertidas ni superficie duplicada.

## Reproducción y archivos

```powershell
npm.cmd run data:prepare # deriva el MDT general, las fichas y el recorte local
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

`npm.cmd run data:detail` repite únicamente el detalle, comprobando el SHA-256 del TIFF temporal contra los metadatos del MDT general. Si falta el TIFF temporal, el script lo recupera ejecutando la preparación general. No se consulta ningún servicio externo para regenerar la escena.

- Datos editables: `data/esglesia-nova.json`.
- Transformación y huecos: `src/building-plan.mjs`.
- Geometría: `src/esglesia.ts`.
- Terreno reutilizable: `src/terrain.ts`.
- Resultados: `public/data/esglesia-terrain.*` y `public/data/buildings/esglesia-nova.json`.

## Próxima validación

1. Obtener un plano arquitectónico acotado de planta y alzados; verificar lado, orientación, espesores y huecos.
2. Contrastar límites de fábrica y restauraciones con ortofoto de mayor detalle y documentación patrimonial.
3. Diferenciar alturas/fábricas existentes en 1794 y cambios hasta 1800, evitando trasladar el estado fotografiado en el XX.
4. Sustituir los parámetros C por medidas justificadas una a una, conservando referencia y precisión.
5. Documentar la cota de acceso y cualquier plataforma histórica antes de convertir el apoyo técnico en arquitectura.

## Validación técnica de esta entrega

Diez pruebas automáticas pasan y la distribución compila. Se ha observado el renderizado en navegador y comprobado selección de traza/volumen, cambio de altura, corte, planta, ficha de evidencia y regreso al territorio. La regeneración conserva los binarios y metadatos del terreno/edificio de forma determinista. La captura de `docs/esglesia-0.2.0.jpg` corresponde a la versión compilada final. Estas comprobaciones acreditan el funcionamiento del laboratorio; no sustituyen la validación histórica pendiente.

El parpadeo observado en los laterales de ventanas y puertas se corrigió eliminando caras coincidentes entre bloques y marcos. Cada muro usa ahora una envolvente única con huecos, normales exteriores y dos regiones de material. La prueba de regresión comprueba que su superficie coincida con la envolvente esperada y que todas las aristas estén cerradas por exactamente dos caras, sin duplicados.
