# La Ràpita hacia 1800 — guía de implementación

**Actualització:** 8 de novembre de 2026. **Versió web:** 0.13.0. **Guía vigente de seguimiento.**

**Ajust espacial vigent del Roquer:** [traça de 1748, coordenades i comprovació en planta](docs/ROQUER_ALINEACIO.md). Costa, torre, hostal, capella, sis peces de quarters, tres corrals i murs comparteixen transformació; H–O es consulten com a projecte. Snapshots, ubicacions, Markdown, HTML i catàleg del visor sincronitzats. El semicercle de porxos es mou 1 m a ponent i les files de cases petites 4 m cap a l’interior i 9 m cap al nord del marc local per evitar conflictes. Regeneració: `npm.cmd run data:roquer`. Els documents de fases anteriors es conserven com a antecedents; les posicions actuals són les dels JSON i les taules generades, amb certesa C.

**Estat vigent:** selector 1778–1993, amb fases portuàries pròpies i context anterior de la vila. **Prioritat:** documentació i ampliació contrastada del 1800–1900. Arxiu XIX: 21 fonts, 24 fites i 16 pendents; [revisió detallada](docs/1800-1900/REVISION.md). La disponibilitat d’un any al selector no equival a una reconstrucció integral.

## Decisión de partida

Construir una aplicación estática de navegador con **TypeScript + Three.js + Vite**, con geometría procedural y datos locales versionables. El proyecto no depende de Blender, ni para crear la escena ni para regenerar su terreno. Los GLB/glTF podrán ser una exportación futura, nunca un paso obligatorio de edición.

Empezamos por la **fase A: terreno y referencias documentales**, y adelantamos una interfaz mínima de la fase F para inspeccionarlos. No empezamos generando una ciudad de aspecto acabado: las plantas y los alzados históricos todavía no están validados.

La aplicación está vinculada al proyecto Vercel rapita y al repositorio josepmunta-design/rapita. Los originales se conservan; las copias de investigación no se publican como parte de la app.

**Avance 0.2:** se añade un laboratorio de Església Nova con terreno nativo a 2 m, una traza actual aproximada sobre ortofoto oficial y un volumen procedural de estudio C. No cierra la validación histórica de las fases A, B o C. El expediente completo está en [docs/ESGLESIA_NOVA.md](docs/ESGLESIA_NOVA.md).

**Avanç 0.5:** Roquer i fortificació parcial, litoral i aigua d’assaig C, canal fins a Amposta i selector 1778–1800. També s’ha iniciat i implementat el següent pas autoritzat: primers testimonis cronològics del nucli (1780, 1782 i dotze cases de 1788–1789). Els apartats anteriors descriuen el progrés de cada versió, no el límit actual. Vegeu [Roquer i canal](docs/ROQUER_CANAL.md) i [cronologia](docs/CRONOLOGIA.md).

## Revisión de los materiales aportados

| Material | Revisión realizada | Utilidad y límite |
|---|---|---|
| `especifiación técnica 1.0.txt` | Revisión de alcance, geografía, terreno, arquitectura, navegación y validación. Actualizada a v1.1. | Base del plan; se sustituye el flujo Blender. Muchos entregables siguen siendo objetivos, no resultados. |
| `Dossier_Rapita_1800_fuentes.md` | Leído completo. | Inventario inicial del 29/10; sus pendientes de acceso quedan matizados por materiales posteriores. |
| `Rapita_1800_investigacion_fase_2.zip` | Extraído en `docs/investigacion/`; leídos dossier, LEEME y GeoJSON. | Aporta seis anclas, rumbos y un resumen de Reverté (2024). Ese resumen no sustituye el cotejo directo con el artículo. |
| `tesi doctoral.pdf` (439 páginas) | Texto extraído para búsqueda. Lectura focal de pp. impresas 221–235, PDF 225–239. Inspección visual de las plantas en PDF 232–233. No es una lectura íntegra de la tesis. | Distingue ciudad habitada, proyecto monumental, planos posteriores e interpretación ideal. |
| `1997_septiembre_3368_10.pdf` (12 páginas) | Revisión inicial de metadatos y portada; en 0.5, contacto de las 12 páginas y lectura visual focal de pp. 119–120. El texto extraído está vacío. | Artículo escaneado: *Apuntes históricos de los puertos del delta del Ebro*, Míriam Villares, Teresa Navas y Rosa Junyent, Revista de Obras Públicas, septiembre 1997. En 0.5 se usa para excluir el gran muelle no ejecutado de 1782 y no confundir el canal del XIX con el de Carlos III. No se han leído íntegramente todas las páginas. |
| `FME_46302427_1793275473239_7788.zip` | Inventario, coordenadas, TFW y GeoTIFF verificados. Ráster leído con GeoTIFF.js. | Es el MDT real disponible; no hace falta esperar una descarga externa. CRS EPSG:25831 y píxel 0,5 m. |
| `Rapita_1800_Blender_PROTOTIPO.zip` | Extraído en `docs/archivo-blender/`; revisados script, LEEME y estructura del NPZ. No ejecutado. | Antecedente únicamente. Su NPZ tenía alturas rellenadas en NoData y una geometría ilustrativa que no adoptamos como restitución. |
| `Rapita_LiDAR_2024_cobertura_verificada.zip` | Extraído en `docs/lidar/`; revisado informe e inventario. | La cobertura de cabecera no demuestra retornos ni clasificación de suelo sobre cada punto. |
| Cuatro nubes `.laz` de 2024 | Inventariadas junto con el informe anterior. No descomprimidas. | Contraste futuro; no son la fuente de la malla web actual. |
| `output_files.zip` y `output_files actual.zip` | Inventariados: cada uno contiene PNG + PGW. | Fondos georreferenciados aportados, sin procedencia/fecha de vuelo validadas; no usados como prueba de 1800 ni como textura. |

### Consecuencias para la reconstrucción

1. La tesis, p. impresa 228 (PDF 232), reproduce un plano de **finales del XIX**, de Hermenegildo Gorria. No es una planta medida en 1800.
2. Su p. 229 (PDF 233) rotula la imagen como **reconstrucción ideal**. Puede informar hipótesis y comparaciones, no acreditar edificios ejecutados.
3. La p. 233 (PDF 237) presenta el trazado existente y la nueva delineación proyectada, ACA MPD 223. Hay que separar ambos antes de digitalizar.
4. H02 se ha cotejado directamente en su texto y transcripción: el registro de 119 casas y habitaciones suma 81 unidades reales y 38 propiedades privadas de usos mixtos. No equivale a 119 edificios residenciales independientes. Ver el expediente de viviendas.
5. No copiar la silueta contemporánea de Guardiola ni asumir una Glorieta o Església Nova terminadas. El inventario de 1794 y el estado en 1800 son fechas distintas.
6. El MDT 2021–2023 es una base espacial contemporánea. Los rellenos portuarios, explanaciones y barrancos soterrados necesitan correcciones históricas documentadas.

## Pasos realizados el 30/10/2026

- [x] Inventariar documentos y ZIP y separar investigación previa, datos originales y prototipo anterior.
- [x] Elegir una cadena de trabajo sin Blender: GeoTIFF original → muestras binarias + metadatos → BufferGeometry de Three.js en navegador.
- [x] Preparar el proyecto npm, TypeScript y Vite. Dependencias fijadas y `package-lock.json` para repetir la instalación con `npm ci`.
- [x] Implementar `scripts/prepare-terrain.mjs`, con extracción de un único TIFF del ZIP, comprobación de EPSG y resolución, y hash SHA-256 del TIFF.
- [x] Generar terreno directamente del TIFF; **no se reutiliza la malla ni el NPZ del prototipo anterior**.
- [x] Conservar centros de píxel y paso métrico exactos, cotas nativas y máscara de validez. No se rellenan NoData.
- [x] Construir un visor 3D orbital con curvas cada 10 m, selección de seis lugares, vistas de perspectiva/planta/extensión y controles de zoom.
- [x] Añadir capas de referencias, malla y eje interpretado opcional (apagado al inicio).
- [x] Añadir fichas de evidencia con certeza separada por existencia, posición, planta, altura y apariencia; la geometría histórica desconocida permanece en `null`.
- [x] Identificar de forma visible relieve contemporáneo, ausencia de malla e incertidumbre histórica. El fondo no se presenta como mar.
- [x] Añadir comprobaciones de coordenadas, muestreo, índices de malla y archivos generados.
- [x] Actualizar README, esta guía y la especificación para reflejar el flujo web y el avance real.

### Datos de la primera malla

| Parámetro | Resultado |
|---|---|
| Fuente | ICGC, MDT LiDAR Catalunya 0,5 m, 2021–2023, dentro del ZIP FME aportado |
| GeoTIFF completo | 14.110 × 11.366 píxeles; bordes E 292.856–299.911 / N 4.496.524–4.502.207 |
| Recorte solicitado | E 294.750–298.350 / N 4.497.800–4.501.000; 3,6 × 3,2 km |
| Muestreo | 360 × 320 muestras; una muestra nativa cada 20 píxeles, paso de 10 m |
| Primera muestra | Centro E 294.755,25 / N 4.500.994,75; filas de norte a sur |
| Muestras válidas | 81.200 / 115.200 = 70,49 %; no equivale exactamente a porcentaje de superficie triangulada |
| Rango de muestras válidas | −0,696 a 132,973 m, sin transformación del datum vertical |
| Origen local | E 296.389,3545 / N 4.499.364,7286 / Z 0 |
| Ejes del visor | X este, Y arriba, Z sur. Escala vertical ×1 |
| Malla | 160.647 triángulos; se omite cada triángulo con algún vértice NoData |
| Correcciones históricas | Ninguna. Lista `historicalCorrections: []` |
| Datos servidos | 460.800 bytes de alturas + 115.200 de máscara, más JSON y GeoJSON |

Las cotas indicativas de las fichas son interpolaciones bilineales sobre cuatro muestras válidas. **No son cotas medidas del edificio ni cotas de 1800**. No se ha confirmado todavía el datum vertical con la ficha específica del producto; no se ha creado un plano de agua que pueda sugerir una equivalencia falsa con el nivel del mar.

## Cómo repetir y continuar

```powershell
# Desde la raíz del proyecto; instalar Node.js 22.12+ si fuera necesario
npm.cmd ci
npm.cmd run data:prepare   # opcional si public/data ya está disponible
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abrir `http://127.0.0.1:5173/`. `npm run preview` sirve la distribución compilada (puerto habitual 4173). `dist/` se puede servir desde cualquier servidor estático, incluso bajo una subcarpeta gracias a las rutas relativas. El usuario final solo necesita navegador con WebGL 2; no necesita Node, Python ni Blender.

- Editar **interpretaciones** en `data/interpretations.json`.
- Corregir **anclas de origen** en `docs/investigacion/Rapita_1800_puntos_georreferenciados.geojson`, documentando fuente y precisión en esta guía. Regenerar después.
- Editar **renderizado/interfaz** en `src/main.ts` y `src/style.css`.
- Cambiar **reglas geográficas** en `src/geo.mjs` y actualizar sus pruebas.
- Los binarios y `monuments.geojson` de `public/data/` son resultados generados; no editarlos a mano.
- El TIFF temporal queda en `tmp/terrain/source.tif`; el script vuelve a extraerlo del ZIP original en cada ejecución. `tmp/` no se distribuye.

## Trabajo pendiente, en orden

### A2 — Validar la base geográfica

- [ ] Confirmar datum vertical, condiciones de reutilización y metadatos del MDT ICGC.
- [ ] Corregir las anclas aproximadas usando contornos patrimoniales y ortofoto de procedencia conocida; registrar precisión por punto.
- [ ] Crear perfiles de terreno Glorieta–plaza–Coc y Guardiola–núcleo; contrastar el Roquer con la documentación y los vuelos históricos.
- [x] Generar un parche nativo a 2 m para el núcleo residencial y coserlo a la malla de 10 m. Escaleras y cotas de acceso históricas siguen sin medir.
- [x] Generar un primer recorte local a 2 m alrededor de Església Nova y comprobar sus muestras coincidentes con el MDT de 10 m. El núcleo residencial se incorpora en 0.3.0.
- [ ] Evaluar las nubes LAZ 2024 (retornos, suelo, densidad y huecos), solo si aportan mejora frente al MDT disponible.

**Cierre de A:** cotas y posiciones verificadas, referencia vertical explícita y resolución local suficiente. La primera malla no significa que la fase A esté históricamente cerrada.

### B — Restituir el trazado histórico

- [x] Consultar directamente el texto de Reverté 2024 y los artículos 1–9 de la transcripción de 1794; extraer cantidades, estados y tipologías residenciales con fecha y páginas.
- [ ] Cotejar las ilustraciones del PDF original de Reverté y completar un inventario individual georreferenciado; las 38 propiedades privadas siguen sin desagregar.
- [ ] Leer las secciones restantes pertinentes de la tesis: canal/baterías, suspensión/mantenimiento y anexos. No marcar la tesis como leída íntegramente.
- [ ] Hacer OCR/lectura del artículo portuario de 1997 y localizar las reproducciones de planos útiles.
- [ ] Obtener imágenes de archivo de Gorria, Hess 1852 y Salomón 1782. Separar estado existente, proyecto y reconstrucción interpretativa.
- [ ] Georreferenciar con puntos estables; guardar puntos de control, transformación, error de ajuste e incertidumbre. No trasladar directamente un plano XIX a 1800.
- [ ] Digitalizar polígonos de plaza, porches, manzanas, rampas y batería; añadir fuente, fecha y certeza a cada geometría.
- [ ] Reconstruir costa/canal con bandas de incertidumbre. Hasta entonces, mantenerlos fuera del visor.

**Cierre de B:** plantas y trazados verificables, con geometría histórica independiente de las anclas actuales.

### C — Primer módulo arquitectónico reproducible

- [x] Elegir Església Nova como primer módulo de estudio, con traza actual aproximada y lado publicado de 23,7 m. Levantamiento exacto pendiente.
- [x] Crear un esquema paramétrico con planta, espesor, cotas, huecos y estados de ejecución. Los campos documentados desconocidos siguen vacíos; las proporciones de ensayo están en un bloque C separado.
- [x] Implementar la geometría en TypeScript y probar su regeneración desde JSON, sin edición manual de mallas.
- [ ] Validar planta histórica, alzados, espesores, huecos y cota de acceso antes de considerar el primer módulo una restitución de 1800.
- [x] Incorporar primero las viviendas por indicación del usuario: cantidades y estados de 1794, tipologías de ensayo C y presencia permanente en el mapa.
- [x] Después de las viviendas, iniciar los edificios emblemáticos por el centro, como ha pedido el usuario: Sant Elm, plaza cubierta, fonda, almacenes, fuentes y otros edificios. Sustituir las dos unidades reservadas de la fonda sin duplicarlas.
- [ ] Continuar fuera del centro con Glorieta, batería y torre, cuando sus plantas y estados estén suficientemente documentados.
- [ ] Huertos, garrofers y elementos portuarios con evidencia suficiente.

### D–F — Paisaje y experiencia final

- [ ] Correcciones del relieve histórico registradas como operaciones reversibles, cada una con fuente y comparación antes/después.
- [ ] Materiales, vegetación y actividad compatibles con los documentos; sin introducir paisaje urbano/portuario actual.
- [ ] Paseo a escala humana, colisiones y navegación terrestre. La versión actual es orbital, no permite caminar.
- [ ] Visita guiada, perfiles y modo científico con visualización diferenciada por certeza.
- [ ] Exportación glTF/GLB opcional desde la escena procedural; capturas y gestión de LOD.
- [ ] Medir rendimiento en equipos de referencia y móviles reales. Los 60/30 FPS de la especificación son objetivos todavía no medidos.
- [ ] Revisar publicación, atribuciones y licencias cuando se prepare una versión compartible.

## Registro de validación

**30/10/2026:**

- `npm test`: cuatro comprobaciones pasan: ejes y escala, interpolación/NoData, triangulación y coherencia de los datos generados.
- Regeneración completa repetida desde el ZIP FME: los cuatro archivos de `public/data/` mantienen exactamente el mismo SHA-256. Se ha comprobado la repetibilidad de los resultados, además de conservar el hash del TIFF de origen.
- `npm run build`: TypeScript y compilación estática correctos. Aviso de tamaño del módulo 3D (~571 kB sin comprimir); queda como tarea de optimización cuando se añadan nuevas geometrías.
- Respuesta HTTP del visor local: 200. Renderizado WebGL observado en desarrollo y distribución compilada, con terreno, curvas y marcadores. Comprobadas selección de lugar, ficha documental, planta, malla, ocultación de anclas y eje opcional. Sin errores/avisos de consola observados en la distribución. Captura en `docs/visor-0.1.0.jpg`.
- No hay validación histórica final de plantas, costa, alturas arquitectónicas ni restitución del relieve de 1800.

En cada sesión, añadir aquí cambios, comprobaciones, fuentes nuevas y pendientes resueltos. Marcar una tarea como completada solo cuando exista el archivo o la evidencia de validación correspondiente.

## Segunda sesión — terreno local y primer edificio (0.2.0)

### Pasos realizados

- [x] Ampliar la lectura de la tesis a pp. impresas 234–240, PDF 238–244, incluyendo sus fotografías del edificio. La función original continúa discutida.
- [x] Consultar directamente la ficha municipal y la entrada de Gran Enciclopèdia Catalana. Registrar el lado publicado de 23,7 m con fuente, sin presentarlo como levantamiento propio.
- [x] Obtener una ortofoto oficial ICGC, capa `ortofoto_color_2024`, mediante WMS EPSG:25831; conservar imagen y solicitud exacta en `docs/sources/`.
- [x] Digitizar cuatro esquinas aproximadas de la fábrica actual y registrar píxeles, transformación, centro, lados observados y márgenes de trabajo estimados. No se ha validado una planta de 1800.
- [x] Generar una retícula 121 × 121 a 2 m, 240 × 240 m entre muestras extremas; 14.641 muestras válidas y 28.800 triángulos de terreno.
- [x] Implementar `data/esglesia-nova.json`, con evidencia, valores desconocidos en `null` y parámetros de ensayo C independientes.
- [x] Construir muros con huecos efectivos, cuatro columnas simplificadas y una distribución central de ensayo. El modelo no incorpora cúpula ni cubierta moderna.
- [x] Añadir pestaña Edificio, selección traza/volumen, altura variable, corte de fachada, ocultación del interior y ficha de fuentes/medidas.
- [x] Integrar el terreno general de 10 m y el detalle de 2 m en una única escena, recortando la malla gruesa bajo el parche y triangulando un borde común, sin modificar las cotas nativas.
- [x] Añadir un apoyo técnico provisional y reversible: plano a 25,792 m sobre el MDT actual bajo la planta (24,448–25,642 m). No se atribuye ese apoyo a 1800.

### Límites que siguen abiertos

La digitización actual tiene un margen de trabajo estimado de ±1,5 m, y la orientación de ±3° respecto al norte de la cuadrícula UTM. No son precisiones topográficas certificadas. La cubierta moderna puede ocultar los límites originales.

La altura inicial de 8,4 m, espesor de 0,85 m, radio central de 5 m, huecos y distribución son **hipótesis C** para poder ensayar la pieza. Los campos de altura, espesor, huecos medidos y cota histórica permanecen en `null`. Cambiar el deslizador no convierte esos valores en evidencia.

Las consultas probadas a OSM/Overpass y Catastro no proporcionaron un contorno utilizable. La geometría de posición/orientación procede de la ortofoto ICGC y queda identificada como aproximación.

### Próximo paso concreto

Pendiente de validación del primer módulo: obtener un levantamiento acotado de Església Nova (planta y alzados) y documentación de restauraciones. Sustituir cada parámetro C por una medida con referencia, conservar las variantes y cotejar qué fábrica corresponde al periodo 1794–1800. El laboratorio ya permite revisar esos cambios sin rehacer una malla manual.

### Integración en el mapa general — corrección solicitada

Església Nova se representa desde la carga inicial, aunque esté seleccionado otro lugar. Seleccionar el edificio únicamente acerca la cámara y abre sus controles: no sustituye el territorio por otro escenario. La rueda permite alejarse sin abandonar el detalle, y «Vista general» restaura el encuadre conservando el edificio.

El parche de 2 m sustituye las 24 × 24 celdas de 10 m que ocupa. Una banda de triángulos conecta el interior de 2 m con los vértices coincidentes del contorno a 10 m. No se interpolan ni alteran alturas para coserlo; se mantienen coordenadas y cotas nativas. El parche integrado tiene 28.416 triángulos, con 96 aristas exteriores coincidentes con la malla general. La planta y el volumen siguen identificados con sus incertidumbres.

En 0.2.0 solo Església Nova tenía geometría arquitectónica. En 0.3.0 se añaden las viviendas a la misma escena persistente; los demás monumentos conservan sus referencias.

### Corrección de parpadeo en los huecos

La inspección del usuario detectó parpadeo en jambas y dinteles. La geometría inicial formaba el muro con cajas y añadía otras cajas de piedra para los marcos. Las superficies laterales coincidían y competían en el búfer de profundidad.

Se sustituyó cada muro por una envolvente única: caras delantera/trasera, contorno exterior y superficies de los huecos. Las divisiones interiores entre celdas adyacentes no se emiten. Piedra y mampostería son regiones de material de esa misma envolvente, con normales explícitas hacia fuera. Una prueba de regresión verifica superficie total, ausencia de triángulos duplicados, cierre de la malla y orientación de las normales. El conjunto tiene diez pruebas correctas y compila.

### Validación de 0.2.0

- `npm test`: **10 pruebas correctas**. Además de las cuatro anteriores, se comprueban huecos reales y área de muros, orientación UTM, coincidencia de muestras entre resoluciones y separación de parámetros de ensayo y cotas históricas desconocidas.
- `npm run data:prepare`: cadena completa ejecutada desde el ZIP FME. Los siete archivos de terreno/edificio conservaron su SHA-256 frente a la generación previa; `monuments.geojson` cambió únicamente para incorporar la ficha documental actualizada.
- `npm run build`: TypeScript y compilación correctos. Módulo 3D ~588 kB sin comprimir (~148 kB gzip); permanece el aviso de tamaño como pendiente de optimización.
- Navegador: terreno y modelo renderizados en desarrollo y distribución compilada. Probados altura variable, corte de fachada, planta, traza sin volumen con controles desactivados, ficha de fuentes, regreso a Territorio y reapertura de Edificio. Revisadas las disposiciones estrecha y de escritorio durante la prueba. Sin errores o avisos de consola en la distribución final.
- Captura verificada: `docs/esglesia-0.2.0.jpg`.
- Las pruebas técnicas no validan la reconstrucción histórica: planta exacta, alturas, fases constructivas y cota de acceso de 1800 siguen pendientes.

## Tercera sesión — trama residencial (0.3.0)

### Trabajo realizado

- [x] Revisar directamente el texto de H02 y su transcripción del inventario de 20/05/1794, con análisis residencial de pp. 208–215 y artículos 1–9 de pp. 230–231. Las ilustraciones del PDF siguen pendientes.
- [x] Ampliar H01 a pp. impresas 251–253 (PDF 255–257), para tipologías y materiales. Las doce casas de 1788–1789 no se suman de nuevo al inventario posterior.
- [x] Corregir la interpretación de 119 viviendas: son casas y habitaciones, con 81 unidades reales y un agregado privado mixto de 38 propiedades. No equivalen a 119 casas independientes.
- [x] Registrar cantidades y estados en `data/housing-1794.json`, separando evidencia de 1794, geometría C y estado individual desconocido en 1800 (`null`).
- [x] Generar 58 cuerpos: 22 casas grandes acabadas, 7 cubiertas sin acabar, 14 sin cubierta con pórticos, 14 pequeñas y una Mançana compartida de 24 habitaciones. La ubicación de cada unidad y el reparto de estados son C.
- [x] Incorporar alzados procedurales con huecos reales, cubiertas de teja, carpinterías simplificadas, balcones, vigas y arcos; materiales y mallas generados localmente, sin Blender ni texturas externas.
- [x] Leer alineaciones actuales en ortofoto oficial ICGC 2024 y mapa topográfico. Imágenes y solicitudes conservadas; no sustituyen una georreferenciación histórica.
- [x] Generar terreno del núcleo a 2 m: 226 × 251 muestras (56.726 válidas), extensión entre muestras de 450 × 500 m. Recorte E 296.205,25–296.655,25 / N 4.499.084,75–4.499.584,75.
- [x] Sustituir 4.500 triángulos gruesos bajo el nuevo parche y coserlo con 190 aristas exteriores, sin alterar las cotas nativas. El parche de Església Nova permanece integrado y no se superpone con el del núcleo.
- [x] Mantener todas las viviendas en la escena general desde la carga inicial; pestaña Viviendas para enfocar y consultar inventario/fuentes, y una capa para comparar con el terreno.
- [x] Reservar dos posibles cuerpos de la fonda nueva para evitar duplicación al desarrollar edificios emblemáticos. Su atribución y posición son provisionales.
- [x] Actualizar README, especificación v1.3, ficha de método y expediente `docs/VIVIENDAS.md`.

### Alcance y siguiente trabajo

El usuario ha establecido el orden: primero casas; después edificios emblemáticos. Esta entrega cubre las 81 unidades reales identificables por grupos. Las 38 propiedades privadas no se colocan sin poder distinguir uso, posición y duplicados. La reconstrucción no está completa a escala de parcela.

Las posiciones individuales, dimensiones, arcos y alturas son de ensayo C. El inventario describe 1794: falta investigar cambios hasta 1800. El apoyo técnico gris sigue el MDT actual; destaca un desnivel de unos 2,7 m bajo la Mançana y no equivale a una plataforma histórica.

Próximos pasos: desagregar propiedades privadas y georreferenciar planos; contrastar cambios 1794–1800 y medidas; después desarrollar Glorieta, fondas y demás edificios emblemáticos sin duplicar cuerpos ya contados. Mantener este registro de evidencia por pieza.

### Validación de 0.3.0

- `npm test`: 14 pruebas correctas. Incluyen inventario sin duplicaciones, campos históricos desconocidos, ausencia de solapamientos de plantas y cobertura/orientación/borde del nuevo terreno a 2 m.
- TypeScript y compilación estática correctos. Permanece el aviso de tamaño del motor 3D; no es un fallo de compilación.
- Regeneración de viviendas y sus tres archivos de terreno repetida: SHA-256 idénticos en los cuatro resultados. Se conserva el hash verificado del TIFF original.
- Navegador sobre la distribución compilada: carga inicial general con casas y Església Nova visibles; acceso directo `#viviendas`, ficha de fuentes, ocultación/restauración de la capa y retorno a vista general comprobados. Sin errores ni avisos de consola observados.
- Capturas de esta versión: `docs/viviendas-0.3.0.jpg` y `docs/mapa-integrado-0.3.0.jpg`.

## Cuarta sesión — centro del pueblo (0.4.0)

### Prioridad y fuentes

El usuario pide continuar con edificios emblemáticos y concreta que se empiece por completar el centro del pueblo. Se prioriza plaza y servicios; no se amplía esta entrega a Glorieta, batería o Guardiola.

- [x] Revisar H02, análisis de pp. 208–219 y transcripción de los arts. 1–15. Separar Sant Elm de Església Nova y los edificios concluidos de los todavía en obras.
- [x] Ampliar la lectura de H01 a pp. 167–168 y repasar pp. 225–229; inspeccionar PDF 230–231, con fotografías de la plaza y fuente. No considerar el plano del XIX ni las fotos de restos como una restitución de 1800.
- [x] Contrastar cualitativamente calles y alineaciones en el mapa topográfico ICGC ya conservado. No se ha realizado una georreferenciación histórica nueva.

### Implementación

- [x] Crear `data/center-1794.json` y expediente `docs/CENTRO.md`, con nueve registros, páginas, estados, dimensiones C y campos medidos desconocidos en `null`.
- [x] Modelar Sant Elm, plaza cubierta/Casa Laureano, fonda nueva, nueva aduana del Cóc, almacenes de White, pareja de fuentes, Mançana nueva iniciada y Cases de Talavera. Se mantienen las incertidumbres de identificación y avance de cada obra.
- [x] Sustituir los dos cuerpos residenciales reservados de la fonda. La geometría nueva y la anterior no se superponen; el inventario real no crece por esa sustitución.
- [x] Mantener los almacenes sin tejado, la Mançana nueva sin planta alta acabada y la torre de Sant Elm incompleta. El estado simétrico exacto de la obra privada de White se identifica como extrapolación C.
- [x] Añadir un pozo de ensayo en el patio de la Mançana, conservando su único conjunto y las 24 habitaciones ya contadas.
- [x] Añadir suelo de tierra de ensayo mediante color de los vértices existentes. La capa es reversible y no modifica ninguna cota del MDT.
- [x] Añadir sesenta algarrobos con distribución, tamaño y persistencia en 1800 de ensayo C. Capa de vegetación independiente dentro del centro.
- [x] Asentar por separado las alas de los conjuntos con patio, siguiendo el terreno contemporáneo. Los zócalos técnicos siguen sin atribución histórica.
- [x] Ampliar Edificios con catálogo del centro, selección por pieza, fichas y vista de conjunto `#centro`. Plaza y Cóc enfocan ese conjunto. Todas las piezas ya existen en el mapa general antes de seleccionarlas.
- [x] Conservar el laboratorio de Església Nova accesible desde Edificios o su ancla, en la misma escena.
- [x] Actualizar README, especificación v1.4 y expedientes; ampliar la cadena reproducible con `data:center`.

### Límites y trabajo siguiente

La entrega no declara una planta de 1800 validada. Posiciones, dimensiones, alturas, huecos y detalles del centro son C. El documento de 1794 permite controlar estados y usos, pero falta investigar cambios posteriores. Las Cases de Talavera y el edificio de White no aumentan por separado el agregado privado de 38 propiedades sin conciliar su inventario.

- [ ] Georreferenciar planos y medir los edificios conservados para sustituir las posiciones y dimensiones C del centro.
- [ ] Resolver la identificación y fases de Casa Laureano, el tinglado dañado, convento y aduana antigua antes de completar esos ámbitos.
- [ ] Documentar accesos, rampas y costa histórica sin copiar el puerto contemporáneo.
- [ ] Comprobar reformas, ocupación, ventas y terminaciones entre 1794 y 1800.
- [ ] Después del centro: Glorieta y fortificaciones, con el mismo registro de evidencia.

### Validación de 0.4.0

- `npm test`: 18 pruebas correctas, incluyendo geometría real del centro, ausencia de cubiertas en obras incompletas, un solo reloj, sustitución de la fonda sin duplicados y plantas sin solapamientos.
- Comprobada la reversibilidad del color del suelo sin modificar posiciones de vértices.
- TypeScript y compilación estática correctos. Permanece el aviso de tamaño del módulo 3D como optimización pendiente.
- Regeneración del expediente del centro repetida con SHA-256 idéntico.
- Navegador sobre la distribución compilada: centro visible en la vista general, acceso `#centro`, selección de piezas, ficha documental, comparación al ocultar/restaurar la capa y acceso desde Plaza comprobados. El laboratorio de Església Nova sigue disponible.
- Consola final sin errores ni avisos observados. Capturas: `docs/centro-0.4.0.jpg` y `docs/mapa-integrado-0.4.0.jpg`.


## Cinquena sessió — aplicació en català (0.4.1)

- [x] Traduir la interfície, les pestanyes, els controls, les etiquetes accessibles i els missatges de càrrega i d’error.
- [x] Traduir les fitxes, els estats de les obres, els límits històrics i les regles de restitució que mostra el visor.
- [x] Revisar els noms del catàleg: Oratori de Sant Elm, Duana nova del Coc, Magatzems de Josep White, Font i torre del rellotge, Mançana nova iniciada, Roquer i bateria i la resta de llocs.
- [x] Mantenir els títols originals de les fonts bibliogràfiques i els identificadors tècnics per conservar-ne la traçabilitat.
- [x] Declarar `lang="ca"` i format numèric `ca-ES`.
- [x] Fer servir `#centre` i `#habitatges`, amb compatibilitat amb els enllaços antics `#centro` i `#viviendas`.
- [x] Actualitzar els textos canònics dels JSON i regenerar els expedients públics. Les geometries, els recomptes i les incerteses històriques es conserven.

Referència de nomenclatura: Museu de les Terres de l’Ebre, itinerari «Sant Carles de la Ràpita, el somni d’un rei il·lustrat»: plaça del Coc i casa Laureano. https://www.museuterresebre.cat/pagina/ca/serveis-educatius/itineraris/sant-carles-rapita-somni-rei-ilustrat

Els pendents de validació històrica del centre continuen vigents; aquesta sessió actualitza la llengua de l’aplicació.

### Validació de la traducció

- `npm test`: 18 proves correctes. `npm run build`: TypeScript i compilació correctes; es manté l’avís de mida del motor 3D.
- Navegador: comprovat `lang="ca"`, noms del catàleg, fitxes del centre i dels habitatges, regles de restitució i compatibilitat de l’accés antic `#centro`, normalitzat a `#centre`.
- Les pestanyes caben a l’amplada disponible del visor. Consola sense errors ni avisos observats.
- Captura: `docs/visor-catala-0.4.1.jpg`.

## Sisena sessió — Roquer, canal i selector temporal (0.5.0)

### Revisió i implementació completades

- [x] Inspeccionar T-6/8: dues plantes, perfil, llegenda i escala; contrastar-ne el registre oficial i separar projecte de vuit canons de bateria inacabada amb sis peces de l’inventari de 1794.
- [x] Llegir H01 pp. 107–120 i H02 art. 16–29; diferenciar torre reparada, muralla, dependències parcials, cisterna, contraescarpa i forn.
- [x] Comprovar la data de 1813 de la carta IGN aportada i excloure l’eixample de 1867/1870 descrit a l’XML.
- [x] Extreure el text de La rábita en el islam i fer lectura focal del monestir/Roquer; no donar el volum complet per llegit.
- [x] Afegir deu registres d’estudi del Roquer/litoral, sis canons amb només tres curenyes, molls modestos, rampes i obra parcial de capçalera a Amposta. Geometria C visible al mapa general segons l’any.
- [x] Crear una còpia reversible del paisatge per a costa, platja/roques, canal i dàrsenes; conservar binaris i màscares originals. El mode MDT recupera la base contemporània.
- [x] Obtenir i arxivar el context WCS ICGC a 50 m fins a Amposta; generar 72 × 206 mostres i unió al límit de 10 m sense dues superfícies superposades.
- [x] Afegir 10,3 km de canal d’assaig amb aigua tècnica, ramal i dues dàrsenes; sedimentació visible i cinc barques de tipologia mediterrània C al fondejador.
- [x] Incorporar Litoral, càmeres Roquer/canal/Amposta, comparació amb MDT, envolupant de projecte opcional i consulta local dels dos plànols amb atribució.
- [x] Implementar el selector anual 1778–1800, fites, teclat i persistència a la URL. Les transicions provenen de testimonis; no s’interpolen terminacions ni destruccions desconegudes.
- [x] Separar les cronologies per entitat a `data/chronology.json`, amb font, certesa i significat de la data. Deixar la base preparada per afegir altres edificis i períodes.

### Següent fase autoritzada: primera cronologia del nucli

- [x] Ampliar la lectura de H01 a pp. 159–162, 167–168, 189–191, 251–252, 268 i 322.
- [x] Anticipar la duana antiga al testimoni de 1780 i mostrar les Cases de Talavera i la correspondència C de la fonda dels Lanti a partir dels registres de 1782.
- [x] Crear el testimoni alternatiu de dotze cases de lloguer de 1788–1789, amb canvi de coberta/acabats. La xifra exacta acabada resta `null`; l’assignació visual de vuit és C.
- [x] Retirar aquesta escena en passar a l’inventari de 1794, sense sumar dotze unitats ni afirmar un enderroc o identitat parcel·lària.
- [x] Mantenir les altres peces del centre i Església Nova sense avançar-les a dates no acreditades. Una previsió de primera pedra de 1786 no es pren per acabament comprovat.

### Validació i pendents actuals

Les proves automatitzades cobreixen cronologies reversibles, recompte de canons/curenyes, absència de duplicació de les dotze cases, NoData, integritat de mostres originals, canal fins a Amposta, flotació de barques, terreny sota els habitatges i geometria finita. El registre de comprovació final i les captures s’afegeixen al tancament de la sessió.

- [ ] Georeferenciar T-6/8 i costa, mesurar planta/alçats i resoldre fases del Roquer.
- [ ] Delimitar excavació real de cisterna/fossat, pont d’entrada, murs i trams executats de molls.
- [ ] Conciliar les reutilitzacions del monestir i Sanitat, els dos àmbits de fonda i les propietats privades.
- [ ] Resoldre datum, nivell d’aigua, batimetria, traçat exacte i hidràulica del canal; no és navegació funcional simulada.
- [ ] Cronologia individual de la resta del centre, cases i temples; reconciliar els testimonis de 1788–1789 amb 1794.
- [ ] Quantificar danys de 1795 i canvis fins al 1800 abans de representar-los com a destruccions.
- [ ] Glorieta i Guardiola: continuen pendents d’alçats/fases validats; no es copia la torre contemporània.

Els expedients de treball vigents d’aquesta fase són `docs/ROQUER_CANAL.md` i `docs/CRONOLOGIA.md`. La costa, les posicions i els alçats d’aquesta versió són C; els nivells d’aigua són tècnics. El visor és reproduïble en navegador i continua sense Blender.

### Comprovació final de 0.5.0

- `npm test`: **28 proves correctes**. Inclouen la continuïtat de superfícies on el tall del canal travessa la unió regional, els sis canons/tres curenyes, la cronologia de les dotze cases i la integritat dels binaris mesurats.
- `npm run build`: TypeScript i distribució estàtica correctes. Es conserva l’avís d’optimització de mida del paquet 3D, sense error de compilació.
- `data:littoral` repetit: **nou resultats idèntics byte a byte**. Manifest SHA-256 històric a `docs/sources/littoral-reproducibility-0.5.0.json`.
- Navegador sobre `dist/`: selector amb fletxes i Fi, recàrrega de `?any=1788`, transició a 1789, retorn a 1800, centre parcial de 1782 amb peces sense testimoni desactivades, mode MDT/interpretat i consulta del T-6/8 original comprovats.
- Canal complet enquadrat amb etiquetes de la Ràpita, traçat i Amposta; capçalera i aigua revisades. El corredor s’ha afinat amb el mapa topogràfic ICGC actual per evitar un pas pel vessant; continua sent C.
- Ajustat el zoom perquè, durant una transició, actuï sobre la destinació de càmera escollida.
- Darrera consulta de consola sense errors ni avisos observats. Comprovació visual a l’amplada natural del navegador, sense afirmar una validació de tots els dispositius.
- Captures: `docs/roquer-0.5.0.jpg`, `docs/roquer-1779-0.5.0.jpg`, `docs/canal-0.5.0.jpg`, `docs/amposta-0.5.0.jpg` i `docs/habitatges-1789-0.5.0.jpg`.

Per tornar a servir la distribució local després de la comprovació: `npm.cmd run preview`, i obrir `http://127.0.0.1:4173/#roquer`. El selector i les càmeres formen part de la distribució estàtica; no calen serveis remots durant la visita.

## Setena sessió — monuments pendents i desembocadura (0.6.0)

- [x] Revisar H01 pp. 222–223 i 229–231, inclosa la fotografia de Glorieta; contrastar la fitxa municipal de Guardiola amb la menció de 1780 (H01 pp. 161–162).
- [x] Afegir la Glorieta amb tres arcs reals, rotonda i annex sense cúpula; alçat i dimensions C. Només s'assaja el 1800, perquè la visita de Jaubert és de 1816 i H02 no l'esmenta el 1794.
- [x] Afegir Guardiola amb planta quadrada, base atalussada i alçat C, sense copiar elements contemporanis ni inventar el coronament històric.
- [x] Integrar els dos models al mapa general, Edificis i Llocs, amb capes i cronologies pròpies, i accessos `#glorieta` i `#guardiola`. Les mesures històriques continuen en `null`.
- [x] Corregir la desembocadura: unir la superfície de mar i dàrsenes, prolongar el ramal dins l'aigua i impedir que un talús reompli un altre canal a les cruïlles.
- [x] Afegir una càmera de Desembocadura i eliminar les plaques d'aigua superposades de les dàrsenes. Els primers 100 m de la làmina de treball queden al mateix nivell tècnic que el mar, sense afirmar un model hidràulic històric.
- [x] Comprovar amb triangles reals d'aigua la continuïtat de la boca principal i de l'últim tram del ramal. La forma i l'amplada de l'entrada són C.
- [x] Facilitar els enllaços oficials de descàrrega del Montsià a `docs/MONTSIA.md`. Després d'aquesta fase s'ha rebut i integrat el nou ZIP, tal com registra la sessió següent.

Expedient de monuments: `docs/GLORIETA_GUARDIOLA.md`. Les propietats privades sense identificació, els serveis sense planta mesurada i la cronologia individual pendent no es consideren resolts per aquests models.

La validació conjunta final de 0.7.0 inclou aquestes modificacions: 39 proves correctes, TypeScript i compilació estàtica correctes. Continua l'avís d'optimització de mida del paquet 3D. Comprovació visual de tres arcs oberts, torre sense coronament modern i aigua contínua de canal/ramal/dàrsena/mar. El selector desactiva la Glorieta el 1794 i recupera l'assaig el 1800; Guardiola és una preexistència. Captures: `docs/glorieta-0.7.0.jpg`, `docs/guardiola-0.7.0.jpg` i `docs/desembocadura-0.7.0.jpg`.

## Vuitena sessió — ampliació del Montsià (0.7.0)

- [x] Inventariar el ZIP aportat `FME_46302427_1793390462662_232.zip`: TIFF de 12.440 × 15.952 píxels, 0,5 m, EPSG:25831, NoData −9999. Límits originals E 289.869–296.089 / N 4.496.933–4.504.909.
- [x] Extreure'l en un directori propi i verificar SHA-256 `4b5e3b59c024b8a5a1af0ef0aa30624c555063a9a9029441d99cb4231171ed72`, conservant tots els originals.
- [x] Comparar **6.386 centres de píxel coincidents** amb el GeoTIFF anterior: diferència màxima **0 m**. No s'aplica cap desplaçament vertical. Aquesta comprovació no resol l'equivalència amb el WCS de la zona d'Amposta.
- [x] Preparar `context.json`, altures, màscara i identificadors de procedència: 169 × 287 mostres a **50 m**, 33.717 vàlides, rang −0,247–759,312 m. El pas és un centre natiu cada 100 píxels; no es reomple cap NoData ni s'exagera la muntanya.
- [x] Ampliar el context a l'oest i sud des dels dos TIFF i conservar el WCS nord arxivat. Els identificadors de procedència distingeixen les tres fonts.
- [x] Tallar el rectangle del terreny local dins del context i cosir-ne el perímetre als vèrtexs de 10 m. Cap cara del context queda damunt la malla local; els detalls de 2 m i els binaris locals no canvien.
- [x] Integrar el Montsià tant en mode interpretat com en MDT actual. Afegir càmera **Montsià**, URL `#montsia`, planta i restabliment propis, i recalcular l'enquadrament d'Extensió segons cobertura i proporció de pantalla.
- [x] Afegir `npm.cmd run data:montsia` i incloure'l a `data:prepare`. La regeneració només necessita els dos ZIP originals, dades locals i dependències npm; no consulta elevacions per xarxa.
- [x] Documentar cobertura, mostreig, costura i límits a `docs/MONTSIA.md`.

### Verificació i passos que falten

- `npm.cmd test`: **39 proves correctes**. Les noves comproven integritat dels fitxers locals, procedència/màscara, absència de solapaments, normals cap amunt, tots els vèrtexs de la vora oest, continuïtat de la superfície del canal a la costura nord i conservació dels buits NoData.
- `npm.cmd run build`: compilació correcta; avís de mida del paquet del motor 3D.
- Regeneració repetida dels catorze resultats de litoral, monuments i context: hashes registrats a `docs/sources/littoral-reproducibility.json`; es conserva el manifest de la versió 0.5.0 amb el seu nom propi.
- Navegador sobre `dist/`: relleu del Montsià, recàrrega directa de `#montsia`, extensió completa, desembocadura en planta, canvi de mode i cronologia dels dos monuments revisats. Darrera consulta de consola sense errors ni avisos. Captura de muntanya: `docs/montsia-0.7.0.jpg`.

Pendents:

- [ ] Georeferenciar la costa i els plànols executats, validar forma i amplada real de la desembocadura, nivells d'aigua i batimetria.
- [ ] Mesurar alçats i plantes històrics de Glorieta i Guardiola, resoldre'n fases i coronament; els models C no ho donen per resolt.
- [ ] Conciliar les propietats privades, els testimonis de 1788–1789 i 1794 i la cronologia individual dels altres edificis.
- [ ] Confirmar el dàtum i les diferències del WCS respecte al LiDAR. La coincidència entre TIFF no acredita el nivell d'aigua històric.
- [ ] Validar correccions del relleu del 1800: l'ampliació mostra el terreny contemporani 2021–2023.
- [ ] Si cal caminar per la muntanya, preparar detall per proximitat a partir del TIFF de 0,5 m; els 50 m actuals són per al context territorial. La cobertura no és rectangular completa: els espais sense font continuen buits.

Per tornar a servir la distribució local: `npm.cmd run preview`; obrir `http://127.0.0.1:4173/#montsia`.

## Novena sessió — carrers i serveis del 1800 (0.8.0)

La instrucció d'ampliar fins al 1950 queda registrada. La instrucció posterior prioritza acabar el poble del 1800; no es presenta una reconstrucció completa del XIX/XX ni s'amplia el selector amb escenes sense validar.

- [x] Revisar H01 pp. 159–162 i 232–233 i la transcripció H02, arts. 5, 7, 10, 14 i 22–26, límits de Talavera de 1782 i carta de plantació de 1792.
- [x] Separar el plànol ACA MPD 223 de 1852 reproduït a la tesi i l'eixample de 1867 descrit a l'XML. La còpia de la tesi té 384 × 554 píxels: no s'ha declarat georeferenciada sense prou controls independents.
- [x] Afegir set corredors de sòl: eix principal/Alamedes, Rambla, Rampar, camí de pedrera i tres baixades al port.
- [x] Detectar i corregir dues cruïlles inicials de rampes amb habitatges. Comprovar amplada completa de tots els corredors contra les petjades retingudes, sense moure ni duplicar cases.
- [x] Afegir barranc i pont de l'entrada nord, dos horts i sínia, jardí botànic, dues variants de ferreria, dues cases dels guardes, casa de l’administrador i pati de materials de la Mançana.
- [x] Incorporar els nous volums i terres a la mateixa escena general, pestanya **Trama**, capes, consulta de fonts i accés `#trama`.
- [x] Fer reversible el tall del barranc en la còpia interpretada. Les mostres i màscares originals continuen intactes.
- [x] Anticipar els 60 garrofers al testimoni de 1792. Guardes/ferreria apareixen en el testimoni de 1780; Rambla/Rampar en el de 1782; altres serveis en el de 1794. El canvi de variant no data un trasllat real.
- [x] Crear el registre relacional del conjunt privat de 38 unitats mixtes: usos compartits, models existents i identitats pendents, amb nombre residencial desconegut en null. No s'afegeix un número arbitrari de cases.
- [x] Arxivar vuit registres de recerca posterior fins al 1950, amb dates i conflictes explícits, i una ortofoto oficial ICGC 1945–1946 amb petició, extensió, resposta de dates i hash. Consulta local dins de Trama.

### Comprovació

- `npm.cmd test`: **43 proves correctes**, incloses quatre de la nova trama.
- `npm.cmd run build`: TypeScript i distribució estàtica correctes. Persisteix l'avís d'optimització de mida del motor 3D.
- Les proves noves comproven corredors contra edificis, no-solapament de recintes, variants reversibles, recomptes, normals i preservació de dades.
- Regeneració repetida idèntica dels cinc resultats de la trama: `docs/sources/urban-reproducibility.json`. Comprovació visual de Trama, anys 1780 i 1800, consulta documental i catàleg posterior. Els resultats de compilació i proves de la fase següent inclouen aquesta trama.

Expedients: `docs/TRAMA_1800.md` i `docs/HORITZO_1950.md`.

### Pendents prioritaris

- [ ] Identificar individualment les propietats privades pendents i conciliar numeració, ús i testimonis; no es considera complet el cens de cases.
- [ ] Aconseguir els plànols originals, controls independents i error d'ajust; substituir només les ubicacions C contrastades. La planta actual és relacional, no un parcel·lari històric mesurat.
- [ ] Mesurar el pont, les seccions del barranc i dels accessos, els terraplens i les fàbriques conservades.
- [ ] Resoldre els canvis de 1794 a 1800 i les correspondències amb 1788–1789.
- [ ] Després de completar aquesta prioritat, ampliar les fases fins al 1950 amb les dades conservades; digitalitzar la imatge de 1945–1946 i contrastar dates d'obra del XIX i de la reconstrucció parroquial.


## Desena sessió — prioritat de passeig a peu i ambient (0.9–0.10)

La instrucció més recent prioritza la vista com una persona que camina pel poble. S'ha implementat i comprovat abans d'acabar la petició anterior de persones, animals i barques en moviment.

- [x] Afegir **Camina** al mapa general i URL `#camina`, sense escena separada.
- [x] Situar els ulls a 1,65 m i seguir la superfície activa de terreny, pont i molls.
- [x] Implementar WASD/fletxes, Majúscules, arrossegament de mirada, captura de ratolí opcional i controls tàctils.
- [x] Frenar davant plantes d'edificis visibles, aigua, buits i salts bruscos; subdividir moviments per impedir travessar una paret entre fotogrames.
- [x] Incorporar tres punts de sortida amb disponibilitat segons l'any i restauració de la càmera anterior amb Esc.
- [x] Alliberar tecles en perdre focus, ocultar la pestanya o obrir un diàleg.
- [x] Afegir 21 figures humanes genèriques, un cavall amb carro i dos rucs, amb animacions de caminar, treballar i pescar.
- [x] Moure les cinc barques en circuits suaus, amb tripulants, balanceig i separació comprovada respecte de costa i molls.
- [x] Afegir controls independents de persones, animals i moviment; pausa dins del passeig que no impedeix caminar. Iniciar l'ambient en pausa si el sistema demana reduir moviment.
- [x] Conservar la cronologia: presència de figures vinculada al testimoni del servei/camí; no afirmar un cens de població ni oficis individuals.

### Comprovació i passos que falten

- `npm.cmd test`: **51 proves correctes**; vuit noves cobreixen passeig i ambient.
- `npm.cmd run build`: TypeScript i distribució correctes. Avís d'optimització pendent per la mida del paquet 3D.
- Navegador: entrada i recàrrega directa del passeig, moviment, mirada arrossegada, plaça/moll/Església, pausa i retorn orbital amb Esc. Canvi de 1800 a 1780: sortida del moll cap a la plaça i opcions posteriors desactivades; retorn reversible al 1800. Consola final sense errors ni avisos. Captures `docs/caminar-0.10.0.jpg` i `docs/vida-moll-0.10.0.jpg`.
- [ ] Contrastar parcel·les i correspondències pendents del 1800; els 38 registres privats mixtos continuen sense conciliació individual.
- [ ] Validar i facilitar els itineraris entre poble i port quan es mesurin rampes i seccions.
- [ ] Preparar interiors accessibles, col·lisions d'elements petits i evitació entre actors.
- [ ] Contrastar indumentària, eines, treballs, amarratges i maniobres amb fonts específiques. Les escenes actuals són genèriques C.
- [ ] Preparar detall local si es vol caminar pel Montsià; el context a 50 m continua destinat a vista territorial.
- [ ] Ampliar la reconstrucció fins al 1950 després de resoldre les prioritats del 1800, amb el catàleg ja arxivat.

Expedient: `docs/PASSEIG_I_VIDA.md`. Per servir la versió compilada: `npm.cmd run preview`, accés `http://127.0.0.1:4173/#camina`.


## Onzena sessió — detall dels habitatges, passos coberts i velocitat (0.11.0)

- [x] Rellegir H02 pp. 208–210 i art. 1–3; H01 pp. 226 i 251–253, inclosa la fotografia de la columnata.
- [x] Diferenciar els arcs de les cases rodones i els quatre suports amb arquitrau de la plaça coberta. No copiar ornaments posteriors com a obra del 1800.
- [x] Detallar fusteries, ferratges, reixes, balcons, cornises, coberta, terrat posterior, xemeneia i pati. Materials locals amb color i relleu procedurals; formes i dimensions C.
- [x] Conservar els set cossos coberts sense fusteries ni arrebossat i els catorze porticats sense teulada. Corregir el filtre antic de les cases de 1788 perquè no eliminés els murs quan ara tenen textura.
- [x] Obrir els murs laterals sota els porxos i seguir el terreny amb el paviment; retirar la plataforma massissa de la galeria.
- [x] Compartir geometria i col·lisions: galeries, columnata i patis oberts accessibles; pilars, murs i cos posterior continuen bloquejant.
- [x] Afegir punts de sortida als porxos, columnata, façana i pati, i botó directe a Habitatges.
- [x] Atendre la petició de moure’s molt més ràpid: 6 m/s inicials, regulador 2–12 i Majúscules ×2; corregir l’alentiment a pocs fotogrames/s.
- [x] Verificar 59 proves, TypeScript i compilació; l’avís de mida del paquet 3D continua com a optimització pendent.

### Comprovació i pendents

Proves de pas entre els deu porxos corbs tant en col·lisions com sobre les malles reals, galeries rectes, columnata, portells, estats d’obra, materials finits, inventari intacte, terreny intacte i velocitat independent dels fotogrames fins al límit de seguretat de 250 ms. Navegador: recorregut sota porxos, sortida lateral de columnata i regulador; dos segons d’avanç són uns 12,2 m. Captures a `docs/porxos-0.11.0.jpg`, `docs/columnata-0.11.0.jpg`, `docs/habitatge-0.11.0.jpg` i `docs/pati-0.11.0.jpg`.

- [ ] Mesurar profunditat i seccions històriques dels porxos, columnata i accessos; les obertures laterals i cotes són d’assaig C.
- [ ] Individualitzar portes, finestres, materials, terrats, patis, pous compartits i estables quan hi hagi correspondència documental.
- [ ] Validar cotes de carrer respecte del terreny contemporani i substituir els suports tècnics quan es coneguin les plataformes històriques.
- [ ] Continuar la conciliació de les propietats privades i els canvis entre 1794 i 1800. Els nous detalls no completen el cens ni la restitució.

Expedient: `docs/DETALL_HABITATGES.md`. Els binaris i els catàlegs generats de la fase anterior no s’han regenerat ni alterat en aquesta fase.


### Ampliació de la mateixa fase — edificis, terreny i entorn

- [x] Atendre la petició de centrar el treball en el detall visual del conjunt: materials als edificis del centre, gra i variació del sòl, vegetació baixa, pedres de marge i elements de pati i moll.
- [x] Excloure matolls de la plaça, els corredors, les plantes i els patis; rebutjar aigua i NoData. La distribució és determinista i C, no una descripció botànica o cadastral.
- [x] Afegir terrissa, bótes, caixes, cordes i xarxa com a utillatge genèric C; no s’incrementa l’inventari d’edificis.
- [x] Incorporar ombres estàtiques amb actualització només en canvis de la composició; amagar els ancoratges i eixos 3D durant el passeig.
- [x] Afegir dues proves d’entorn: **59 proves totals**. Compilació correcta; avís pendent d’optimització de la mida del paquet 3D.
- [ ] Contrastar espècies, conreus, acabats locals, utillatge i densitats amb fonts específiques abans de passar aquests detalls de C a evidència.
- [ ] Ampliar el detall topogràfic mesurat per proximitat si es vol treballar el Montsià de prop; el gra de material no és relleu nou.

L’aplicació de desenvolupament ja activa a `http://127.0.0.1:5173/` s’ha reutilitzat per a les comprovacions finals. Només es tanca el servidor de previsualització temporal propi del port 4173; es conserva el servidor de desenvolupament existent.


## Dotzena sessió — restitució detallada dels porxos i lectura al mapa (0.12.0)

- [x] Investigar específicament les cases porticades: relació de 1794, fotografia de Salvany de 1916, fitxa IPAC 6415 i fotografies de 1996, 2008, 2009 i 2023; postals sense data conservades com a tals.
- [x] Arxivar imatges, procedència, autor, dates i hashes; distribuir només les reproduccions de domini públic de Salvany, amb crèdit visible.
- [x] Reconstruir arcs de carpanell de tres centres amb peces radials, juntes, gruix, pilastres per filades, sòcols, impostes, cornises, arcs transversals i bigues.
- [x] Retirar els pisos frontals especulatius sobre les arcades, sense completar la coberta de les catorze cases. Mantenir inventari, coordenades d’assaig i dades originals del terreny.
- [x] Afegir fitxa de sis descripcions amb cites al costat de cada explicació, fotografia, bibliografia i límits. Clicar una arcada l’obre al mapa general i durant el passeig; també hi ha accessos amb teclat a Habitatges i Edificis.
- [x] Identificar l’arcada amb numeració d’estudi, sense confondre-la amb una finca documentada. Evitar selecció durant arrossegament o a través d’altres edificis.
- [x] Verificar **62 proves correctes**, TypeScript i compilació. Navegador: pas de 8,6 m seguint la corba, lectura per selecció orbital i a peu, cites i fotografia. Captures `docs/porxos-conjunt-0.12.0.jpg`, `docs/porxos-0.12.0.jpg` i `docs/porxos-fitxa-0.12.0.jpg`.

Expedient complet: [docs/PORXOS.md](docs/PORXOS.md). Dades editables: `data/porxos-evidence.json`; regeneració: `npm.cmd run data:porxos`. Els alçats són més informats, però no mesurats: mètrica, colors, nombre d’obertures per finca i estat individual el 1800 continuen desconeguts o C.

### Pendents prioritaris després d’aquesta fase

- [ ] Aixecar i datar la fàbrica conservada: llums i seccions dels arcs, perfils, cotes, acabats i reparacions.
- [ ] Contrastar parcel·les i recompte original d’obertures amb plànols georeferenciats i fotografies datades.
- [ ] Acreditar els canvis de 1794 a 1800; després incorporar les fases posteriors fins al 1950 amb testimonis específics, sense traslladar reformes del XX al XVIII.
- [ ] Continuar detallant habitatges i entorn segons documentació i completar la conciliació de les propietats privades.
- [ ] Optimitzar càrrega i detall del motor 3D; l’avís de paquet superior a 500 kB continua pendent, sense impedir la compilació.


## Tretzena sessió — expedients per edifici i per època (31/10/2026)

S’ha revisat la carpeta `A:\APP MAMA\JOSEP_descripcions Ràpita-20261031T095755Z-1-001`, conservant els originals. Aquesta fase prepara la reconstrucció multitemporal; la web continua en la versió 0.12.0 i el selector actiu en 1778–1800. L’horitzó de recerca és fins al 1950, amb testimonis anteriors o posteriors guardats com a comparació.

- [x] Inventariar els **113 fitxers**: 96 imatges, 12 PDF, 4 DOCX i 1 ODT. Revisar l’article complet de Reverté (44 pàgines), textos i imatges incrustades, llegendes manuscrites, fotografies i peus de llibre. Les atribucions no confirmades continuen explícites.
- [x] Crear **65 expedients principals** d’edificis, conjunts, infraestructures i llocs. Separar també **57 cossos residencials d’assaig** del prototip, sense presentar-los com a 57 finques històriques identificades.
- [x] Guardar **291 registres de fases o testimonis**, amb data, tipus, estat, font i localitzador. Distingir projecte, execució, ruïna, ús i fotografia; la data del testimoni no es converteix automàticament en data d’obra.
- [x] Donar a cada carpeta sis fitxers: `README.md`, `index.html`, `fases.json`, `ubicacio.json`, `fonts.json` i `model-actual.json`. Separar coordenades del prototip de les històriques desconegudes.
- [x] Arxivar còpies exactes dels 113 originals amb SHA256, sense alterar la carpeta aportada. Crear catàleg i lector local amb cerca per nom, ús o any, amb fotografies i referències.
- [x] Revisar els plànols: 1852 diferencia existents, nova delineació i demolicions proposades; el full de 1913 conté afegits de 1921, 1942 i 1961. El suposat paredó de 1743 correspon al Ter/Girona i queda exclòs com a prova rapitenca.
- [x] Conservar les discrepàncies: quatre cases porxades rectes probablement totes a ponent; límits de Talavera corresponents al solar irregular; identitat de plaça coberta/tinglado i orientació dels edificis del Cóc pendents. No s’han traslladat aquestes lectures a geometria sense contrast espacial.
- [x] Precisar la nota de 1780: dotze barraques construïdes i ampliació prevista fins a cinquanta en total; la previsió no prova execució ni persistència el 1800.
- [x] Verificar fonts, fases i enllaços locals amb `scripts/validate-building-dossiers.py`; comprovar el lector al navegador. Regeneració i comprovacions a [docs/EDIFICIS/REGENERACIO.md](docs/EDIFICIS/REGENERACIO.md).

Accés: [índex dels expedients](docs/EDIFICIS/INDEX.md) · [lector local](docs/EDIFICIS/index.html) · [revisió dels plànols](docs/EDIFICIS/PLANS.md) · [criteris i conflictes](docs/EDIFICIS/CRITERIS_I_CONFLICTES.md).

### Passos que falten

- [ ] Obtenir els originals complets de 1748 i 1782 i confirmar les signatures/dates dels mapes sense llegenda completa.
- [ ] Georeferenciar primer els existents de 1852, contrastant-los amb altres plànols i afrontacions; registrar punts de control i error d’ajust.
- [ ] Resoldre les quatre cases rectes, Talavera, plaça coberta/tinglado i les dues peces del Cóc abans de canviar-ne emplaçaments.
- [ ] Individualitzar les cases amb correspondència parcel·lària; les 38 propietats privades mixtes encara no són 38 habitatges identificats.
- [ ] Acreditar intervals de reforma, ús, ruïna o desaparició, i després vincular les variants al selector fins al 1950. Els testimonis sense data no activen geometria.
- [ ] Aplicar les descripcions contrastades al model, distingint mesures acreditades i hipòtesis C. La documentació nova no equival a una reconstrucció ja validada.
