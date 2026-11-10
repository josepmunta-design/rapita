# Mejora visual: estilo Realista

Este documento recoge dos fases del mismo día. La primera dejó el núcleo de representación; la segunda, más abajo, es la que cambia de verdad la imagen.

## Primera fase: núcleo de representación

Fecha: 10 de noviembre de 2026. Referencia: el plan director de la carpeta «Mejora Visual», versión del 8 de noviembre. Trabajo local sobre la versión 0.18.0 existente.

Las cifras y los valores por defecto de esta sección son los de aquella fase; donde la segunda los cambia, se indica más abajo.

Se ha empezado por el núcleo de representación F1: alternancia Documental/Realista, materiales compartidos, iluminación y control de calidad. La auditoría F0 está iniciada; faltan las capturas de comparación y las mediciones reales de GPU y descarga en navegador. El sector piloto todavía no se considera aprobado visualmente.

### Auditoría de la base existente

| Elemento | Estado observado |
| --- | --- |
| Motor | Three.js 0.187.0, WebGLRenderer, ACESFilmicToneMapping, salida sRGB |
| Referencia horizontal | EPSG:25831; coordenadas en metros |
| Origen local | Este 296389.3545; norte 4499364.7286; elevación 0 |
| Ejes | X hacia el este; Y elevación; Z hacia el sur |
| Datum vertical | Sigue pendiente de contraste en terrain.json; no se aplican correcciones nuevas |
| Terreno | Parches medidos y alternativa histórica ya existentes; no se regeneran |
| Modelos | Generación por código; ningún GLB/GLTF en public al iniciar esta fase |
| Cronología y navegación | Selector multitemporal, paseo, colisiones y expedientes ya implementados |
| Auditoría costera | 89 grupos / 104 plantas / 17095 muestras; ninguna planta sin soporte según el control existente del escenario 1800 |
| Evidencia | Los 28 JSON de data conservan su SHA256 respecto del comienzo de esta intervención |

El control costero no certifica por sí solo la exactitud histórica del litoral ni resuelve el datum vertical. El nuevo aspecto no cambia el nivel del mar, las huellas ni las cotas para mejorar una imagen.

### Implementación

El control «Aspecte», sobre el visor, permite alternar entre Documental y Realista desde la misma cámara. Documental restaura los mapas de superficie y la iluminación anterior. El primer uso abre Realista con calidad Mitjana y luz de mañana; las preferencias se recuerdan localmente.

| Mejora | Alcance |
| --- | --- |
| Cinco superficies PBR | Cal, mampostería, ladrillo, teja y madera; mapas compartidos de color, relieve y rugosidad, 256 × 256 |
| Colorimetría | Color sRGB; mapas de relieve y rugosidad sin conversión de color |
| Iluminación | Mañana clara, tarde cálida y cielo cubierto; direccional, hemisférica y entorno de cielo procedural filtrado con PMREM |
| Atmósfera | Niebla suave opcional; el cielo es generado, no es una fotografía HDR ni una reconstrucción meteorológica |
| Sombras | Volumen de sombras más próximo durante el paseo; se desplazan las luces, nunca los edificios |
| Suelo | Variación de color a varias escalas sobre las mallas existentes, sin desplazamiento de vértices |
| Agua | Normal ondulada, reflexión ambiental y material no metálico; conserva el nivel y la máscara del litoral |
| Calidad | Baixa/Mitjana/Alta: límite de resolución interna 1/1.5/2; sombras 1024/2048/4096, limitadas por el dispositivo |
| Movimiento reducido | La ondulación se detiene con la pausa del ambiente y la preferencia del sistema de reducir movimiento |
| Instrumentación | FPS de mediana y p95 de tiempo de fotograma en ventana móvil de hasta 180 muestras, llamadas y triángulos |

Los acabados y la luz se identifican como interpretativos. No se añaden casas, cubiertas, interiores, vegetación ni fases históricas. Los mapas nuevos se generan localmente, sin descargas ni licencias externas. Se conservan las texturas originales para recuperar Documental.

### Comprobaciones y límites de la primera fase

Las 124 pruebas anteriores pasan. Se añaden cuatro comprobaciones: invariancia de los modelos residenciales reales al alternar repetidamente; integridad y espacios de color de los mapas; reversibilidad del material de agua y respeto de sus efectos previos; validación de perfiles y percentiles. Total final esperado y comprobado: 128 pruebas.

La prueba residencial compara hashes de matrices, vértices, índices, UV, instancias y metadatos de navegación y fases. También comprueba que los materiales originales recuperan exactamente sus referencias. Se han inspeccionado las cinco imágenes de color generadas. Estas comprobaciones no equivalen a validar la escena renderizada.

TypeScript y la compilación de producción pasan. Paquete JavaScript de esta fase: aproximadamente 918 kB, 265 kB gzip; es el archivo de entrada, no la descarga total del territorio y los documentos. No se han medido FPS, tiempos de carga ni memoria GPU reales. La conexión de control del navegador ha fallado; quedan pendientes las capturas y la compilación efectiva de shaders en el dispositivo. No se ha publicado esta fase.

### Cómo comparar

Ejecutar npm run dev desde el proyecto. Abrir http://127.0.0.1:5173/?any=1800&visual=realista&llum=mati#habitatges y esperar a que termine el movimiento de cámara. Alternar Documental/Realista en «Aspecte», sin cambiar año ni cámara. También se admite visual=documental y llum=tarda o llum=cobert en la URL.

En desarrollo, window.__rapita.visual.report() devuelve año, ajustes, estadísticas, memoria informada por Three.js, dimensiones internas y posición/orientación/FOV/objetivo de cámara. Son datos del dispositivo en ejecución; no se han sustituido por objetivos teóricos. Al volver de una pestaña oculta se reinician las muestras.

## Segunda fase: paisaje, cielo, agua y vegetación

Fecha: 10 de noviembre de 2026. Versión 0.19.0, publicada ese mismo día junto con el registro del Roquer de la 0.18.0. La primera fase dejó el núcleo de representación, pero la imagen seguía siendo la de una maqueta: suelo verde pastel, mar plano, cielo en degradado, árboles de esfera y terreno facetado. Esta fase ataca esas cinco carencias, siempre dentro del estilo Realista y sin tocar datos, huellas, cotas ni cronología.

| Mejora | Qué hace | Qué no hace |
| --- | --- | --- |
| Suelo mediterráneo | Sustituye el verde uniforme por tierra ocre, pasto seco, manchas de garriga, matas sueltas y roca en las pendientes; relieve fino a corta distancia | No desplaza vértices; no es un mapa de usos del suelo de 1800 |
| Terreno sin facetas | Añade una normal promediada al paisaje interpretado, usada solo en Realista | Posiciones, índices y normales originales intactos; Documental conserva las facetas |
| Mar y canal | Superficie con oleaje de normales, reflejo del cielo y transparencia según el ángulo; el fondo modelado se tiñe por profundidad, con cáusticas someras y franja húmeda en la orilla | Mismo nivel técnico, misma máscara de costa; ninguna cota nueva |
| Cielo | Modelo atmosférico de Three.js con nubes generadas; el mismo cielo, filtrado con PMREM, ilumina la escena | No es una fotografía ni un parte meteorológico |
| Luz | Sol con acimut y altura plausibles para 40,6° N: mañana desde el este, tarde desde el oeste; sombras más suaves; relleno cálido desde el suelo | No reconstruye una fecha ni una hora documentada |
| Edificios | Mapas de 512 px: ladrillo fino en mortero de cal, mampostería irregular, encalado con manchas, teja árabe por hiladas y tabla envejecida; pátina de manchas y escorrentías en espacio de mundo | Ninguna geometría, hueco, cubierta o estado de obra cambia |
| Garrofers de la plaza | Los sesenta árboles pasan a tener tronco ramificado y copa irregular | Mismo número, mismas posiciones; el modelo documental vuelve al cambiar de estilo |
| Plantas de PR01 | Higueras, bancales del huerto y olivar de 1950 con copas llenas en los mismos puntos | No añade ni mueve ningún ejemplar |
| Vegetación ambiental | Matorral y pinos, olivos y algarrobos dispersos fuera del núcleo, sobre las manchas de garriga del suelo | Es decoración C sin fuente; se desactiva en «Aspecte» |

### Vegetación ambiental: reglas

La vegetación ambiental es la única adición de esta fase que no parte de un dato del atlas, y por eso tiene su propio interruptor, «Vegetació ambiental · C», y su propia etiqueta en la escena. El plan es reproducible y solo decide dónde no plantar: huellas de edificios de todas las fases, calles y accesos, plaza y espacio público, huertos y recintos, barranco, canal y dársenas, espigones, hitos, elementos de PR01, franja de 30 m desde la costa de 1800 y todo el rectángulo de la nueva población, que se mantiene despejado. Radio de 1,5 km desde el origen de la trama. En los años con fase portuaria georreferenciada se ocultan las plantas a menos de 350 m de la costa de 1800, donde el terreno ya es otro. La calidad gráfica reduce la densidad (40 %, 75 % o 100 %) sin tocar las alineaciones documentadas.

Con los datos actuales el plan coloca 7184 matas y 1572 árboles en calidad Alta.

### Cambios de comportamiento respecto de la primera fase

El primer uso abre Realista con luz de tarde, no de mañana; quien ya tuviera preferencias guardadas las conserva. La mañana ilumina ahora desde el este: antes el perfil «Matí clar» situaba el sol al suroeste. El realismo del suelo ya no depende de la capa «Detall de l’entorn», que vuelve a gobernar solo su grano documental y sus plantas bajas. En el modo «MDT actual» no hay suelo realista ni vegetación ambiental, porque ahí se consulta el terreno medido.

### Comprobaciones de esta fase

Las cuatro pruebas de la primera fase se han actualizado y se añaden cinco: perfiles de luz y dirección solar; normales promediadas como atributo aparte; exclusiones y reproducibilidad del plan de vegetación contra los datos reales; garrofers en las mismas sesenta bases y vuelta al modelo documental; dimensiones y geometría finita de los modelos de planta. TypeScript y la compilación de producción pasan; el paquete de entrada queda en unos 955 kB, 278 kB gzip.

Esta vez sí hay inspección de la imagen: la escena se ha renderizado en un navegador sin GPU, con WebGL por software, en 1800 y 1950, con las tres luces, en vista aérea, plaza, calle, costa, planta y paseo, alternando Documental y Realista y pasando por «MDT actual». No aparecieron errores de compilación de shaders ni avisos en consola. Las capturas de antes y después están en «Mejora Visual/capturas-20261110».

Lo que sigue sin medirse es el rendimiento real: el render por software no sirve para estimar FPS. La escena de 1800 pasa de aproximadamente 1,05 a 1,5 millones de triángulos en calidad Mitjana, casi todo vegetación instanciada en una docena de llamadas, y el agua pasa a dibujarse con transparencia. En un equipo modesto conviene probar Baixa y, si hace falta, desactivar la vegetación ambiental.

### Límites conocidos

Los cultivos de la trama urbana y las barcas siguen con su geometría esquemática. No hay oclusión ambiental ni posprocesado. La espuma de orilla no se ha abordado: exige una distancia a la costa por fase que hoy no existe como dato. El fondo marino profundo es un plano de color bajo el mar, visible solo a través del agua. El cielo cubierto es el perfil menos trabajado.

## Siguiente fase

1. Medir FPS, p95, carga inicial y memoria en calidades media y alta en el equipo de trabajo; ajustar densidades y presupuestos con esas cifras.
2. Revisar las cinco vistas guardadas en 1780, 1850 y 1932, que esta fase no ha inspeccionado.
3. Detalle próximo de fachadas, aleros y tejas en un edificio piloto con geometría contrastada; mantener los estados inacabados.
4. Cultivos, vallas y embarcaciones con el mismo criterio que los árboles: mismas posiciones, mejor modelo.
5. Oclusión ambiental y espuma de orilla, solo después de medir el coste real.

Archivos principales: src/visual-style.ts, src/visual-plan.mjs, src/visual-sky.ts, src/visual-ground.ts, src/visual-water.ts, src/visual-materials.ts, src/visual-vegetation.ts, src/visual-vegetation-plan.mjs y tests/visual-style.test.mjs. Los datos históricos y los cambios que ya estaban preparados antes de estas intervenciones se conservan.
