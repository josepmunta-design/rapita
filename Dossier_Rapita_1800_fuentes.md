> Actualización 30/10/2026: este documento conserva el inventario inicial. El MDT aportado ya se ha procesado y existe un prototipo web sin Blender. Consultar [GUIA_PROYECTO.md](GUIA_PROYECTO.md) y la investigación de segunda revisión en docs/investigacion/ para el estado vigente.

# La Ràpita hacia 1800 — dossier de fuentes y criterios de reconstrucción

**Fecha de compilación:** 29 de octubre de 2026  
**Objetivo:** recuperar bases geográficas y documentales fiables para una recreación de San Carlos de la Rápita alrededor de 1800.  
**Importante:** esta versión es un inventario crítico de fuentes verificadas por sus fichas y resúmenes. No supone que se hayan descargado ni explotado todavía los modelos de elevación, las imágenes históricas o el texto íntegro de las investigaciones.

## 1. Hechos contrastados y consecuencias visuales

| Aspecto | Dato sustentado | Consecuencia visual | Confianza | Fuentes |
|---|---|---|---|---|
| Fundación | Población real fundada el 6 de noviembre de 1780 en el proyecto de Carlos III. | Núcleo muy reciente en 1800. | Alta | [1], [2] |
| Interrupción | Construcción real suspendida en 1794-1795, según el distinto encuadre de las fuentes. | No dibujar un gran asentamiento activo en plena obra en 1800. | Alta | [3], [4], [5] |
| Trazado plaza | Conjunto de dos espacios yuxtapuestos: paseo-salón longitudinal rematado por pórtico semicircular y eje transversal mar-montaña. | No dibujar una plaza elíptica cerrada y simétrica por todos los lados. | Alta para la idea espacial, pendiente de planta métrica. | [2], [6] |
| Glorieta | Pabellón aislado e incompleto, mirador en el extremo superior del eje mar-montaña; cúpula nunca terminada. | Ubicarlo elevado en la cabecera de ese eje; no en una cima inventada. | Alta cualitativa, falta cota exacta. | [2], [7] |
| Església Nova | Edificio inconcluso en extremo sur, en el término de Codonyol durante las obras; función cultual original no demostrada. | Edificio aislado respecto al centro y sin tejado/cúpula final. | Alta para localización relativa, hipótesis para función. | [8], [9] |
| Canal | Proyecto de canal navegable Amposta–Alfacs; problemas de aterramiento documentados tempranamente. | Canal poco funcional en 1800, no curso de agua moderno navegable de gran calado. | Alta para su problemática, falta cartografía de 1800. | [1], [10] |
| Puerto | Apertura del puerto dels Alfacs al comercio americano en 1778. | Bahía natural y actividad marítima limitada por evidencia, evitar muelles modernos. | Alta para actividad histórica, muelles exactos sin verificar. | [1], [3] |
| Paisaje | El delta y los humedales condicionaban el asentamiento. | Humedales, marismas y parcelas no necesariamente arroceras. | Alta cualitativa. | [2], [5] |
| Costa | Carta del IGN de Joseph Roux de 1764, escala aprox. 1:174.000. | Base para la forma general del litoral anterior a la fundación, NO para una línea de costa urbana de precisión. | Alta para existencia y descripción del mapa. | [11] |
| Alzado histórico | Fotografías de Josep Salvany desde Glorieta (1916). | Sirven para cámara, masas de edificios y alineaciones visibles; no prueba de 1800. | Alta para fecha y autoría. | [12] |
| Plano 1870 | Plano del ensanche de 1870, José Mies, 197 parcelas. | Solo para comparar crecimiento posterior, NUNCA como planta directa de 1800. | Alta. | [13] |

## 2. Recursos cartográficos georreferenciados

### Modelo digital de elevaciones — ICGC

- [Descripción oficial de MDT y MDS](https://www.icgc.cat/ca/Geoinformacio-i-mapes/Dades-i-productes/Elevacions/Elevacions-territorial/Models-delevacions). Publicación de datos de alta resolución: MDT de 0,5 m (terreno sin vegetación ni edificios) y otros tamaños, GeoTIFF, EPSG:25831. **Ficha verificada; raster específico de la Ràpita aún no descargado.**
- [Servicio WMS Elevacions territorial](https://www.icgc.cat/ca/Geoinformacio-i-mapes/Geoinformacio-en-linia-Geoserveis/WMS-Elevacions/WMS-Elevacions-territorial). Permite capas MDT con años de adquisición identificados. **Endpoint identificado, sin extracción altimétrica aún.**
- [Comparador histórico ICGC](https://www.icgc.cat/es/Herramientas-y-visores/Visores/Cambios-en-el-territorio/Comparador-historico). Vuelos a partir de 1945; no son prueba directa de la topografía ni el litoral de 1800.

### Cartografía y fotografías

- [Carta náutica Baye de Sofa, Roux, 1764, IGN](https://www.ign.es/web/catalogo-cartoteca/resources/html/025916.html) — escala aprox. 1:174.000, identificador de catálogo 32-G-15.
- [Descarga IGN de dicha carta](https://centrodedescargas.cnig.es/CentroDescargas/detalleArchivo?sec=10900896) — formato JPG, ficha de acceso verificada.
- [Plano del ensanche de 1870, PARES, Archivo de la Corona de Aragón](https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/1679586) — signatura ACA,REAL PATRIMONIO,BGRP, Cajas,70,carp. 1,nº8,plano.
- [Fotografía de la vista desde la Glorieta, Salvany, 1916, Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Vista_del_poble_de_Sant_Carles_de_la_R%C3%A0pita_des_de_la_Glorieta_(cropped).jpeg).

## 3. Fuentes de historia urbana y construcción

[1] [Ayuntamiento de La Ràpita — Historia](https://larapita.cat/la-ciutat/historia/).

[2] [Joan Figuerola — Plaça de Carles III (Diari de Tarragona, 2021)](https://www.diaridetarragona.com/ebre/71404/sant-carles-de-la-rapita-placa-de-carles-iii-del-temps-de-la-il-lustracio-20210515-0034-eidt202105150034_amp.html). Descripción de forma longitudinal de paseo-salón, cabecera porticada semicircular, plaza transversal y posición axial de Glorieta.

[3] [Noèlia Borràs Matamoros — La nova i reial població de Sant Carles de la Ràpita (1780-1794), tesis doctoral, URV, 2013](https://portalcientifico.uned.es/documentos/638802236c720410d9c83a5c). [Enlace al PDF](https://tesisenred.net/bitstream/handle/10803/284704/Tesi%20Noelia.pdf?isAllowed=y&sequence=1). **Ficha académica y extractos públicos verificados; lectura sistemática del texto completo pendiente.**

[4] [Pilar Reverté — 1794. Estat de les obres reials de San Carlos, Recerca 20 (2024), 191–234](https://dialnet.unirioja.es/servlet/articulo?codigo=10331418&info=resumen). Presenta transcripción y comentario de documento de estado de obras entre 1780 y 1794. **Ficha y resumen verificados, enlace al texto completo devolvió restricción de acceso durante esta consulta.**

[5] [Pobles de Catalunya — La Ràpita](https://www2.poblesdecatalunya.cat/element.php?e=18382).

[6] [Turisme La Ràpita — Plaça de Carles III](https://turismelarapita.cat/interes/placa-de-carles-iii/).

[7] [Pobles de Catalunya — Glorieta](https://www2.poblesdecatalunya.cat/element.php?e=18376).

[8] [La Ràpita Cultura (Ayuntamiento) — Església Nova](https://cultura.larapita.cat/espais/esglesia-nova/).

[9] [Pobles de Catalunya — Església Nova](https://www2.poblesdecatalunya.cat/element.php?e=18375).

[10] [Proyecto de urbanización del canal marítimo, Ayuntamiento de Amposta](https://www.amposta.cat/documents/54/08_002%20_U_PE_U%20URB_PG_CANALMAR%C3%8DTIM_CIRCUIT_SALUDABLE.pdf). Relata construcción desde mayo de 1780 y aterramiento ya en 1783.

[11] [IGN — carta 1764](https://www.ign.es/web/catalogo-cartoteca/resources/html/025916.html).

[12] [Wikimedia Commons — vista desde la Glorieta, Salvany 1916](https://commons.wikimedia.org/wiki/File:Vista_del_poble_de_Sant_Carles_de_la_R%C3%A0pita_des_de_la_Glorieta_(cropped).jpeg).

[13] [PARES — Plano del ensanche 1870](https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/1679586).

### Fuente adicional a examinar

- [Pilar Reverté — El terme de la Ràpita ... (2022)](https://dialnet.unirioja.es/servlet/autor?codigo=6219687). Según el resumen, trata un **croquis del término del siglo XVIII**. Puede ayudar a conocer la geografía y propiedad del entorno; no debe confundirse automáticamente con un plano urbanístico de la ciudad.

## 4. Trabajo de validación pendiente antes de producir una recreación definitiva

1. Descargar GeoTIFF MDT del entorno y medir cotas del suelo en Glorieta, plaza, Església Nova y loma de Guardiola, además de perfil longitudinal del eje mar–montaña. **No realizado todavía.**
2. Georreferenciar sobre ortofoto actual y vuelos 1945/1956 las plantas de los monumentos y las alineaciones de la plaza; comprobar rumbo de los ejes con medidas cartográficas. **Pendiente; no tratar las posiciones ilustradas en imágenes generadas como medidas.**
3. Obtener y analizar íntegramente el artículo de Reverté de 2024 para un inventario edificio por edificio en 1794. **Pendiente por restricción al texto completo.**
4. Leer los apartados relevantes de la tesis de Borràs de 2013 y contrastar testimonios con la fuente de 1794. **Pendiente de extracción sistemática.**
5. Descargar e inspeccionar carta Roux 1764, documentación militar de baterías y croquis del siglo XVIII; reconstruir costa con incertidumbre, sin inventar rompeolas. **Pendiente.**
6. Documentar variantes del paisaje, usos del suelo y la arquitectura por periodos: 1780, 1794, 1800, 1830, 1870, 1916, 1945. **Pendiente.**

## 5. Principio de reconstrucción

La recreación final debe distinguir: **existencia/posición histórica comprobada**, **extrapolación razonable por evidencias posteriores**, y **elementos hipotéticos**. Ninguna imagen generada es por sí misma prueba histórica, y el estado de una fotografía de 1916 o del mapa de 1870 no se puede trasladar sin más al año 1800.
