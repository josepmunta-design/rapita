# Revisión del proyecto La Ràpita · 1800–1900

Fecha: 8 de noviembre de 2026. Versión de la app: 0.13.0.

## Resultado y alcance real

Se incorpora un archivo documental del siglo XIX a la aplicación existente. Se mantienen el terreno medido, las posiciones ya establecidas, las reconstrucciones C y las fases portuarias anteriores. Los nuevos testimonios no generan automáticamente edificios, demoliciones, vías ni una nueva línea de costa.

El inventario recursivo abarca **1725 archivos**, **574 JSON válidos**, **194 documentos de texto** y **559 imágenes**. Se han comprobado **125 expedientes**, **722 referencias visuales** y el catálogo previo de **113 fuentes aportadas**. Inventariar un archivo no equivale a leer todas sus páginas ni a validar cada fotografía: se conserva esa distinción en inventory.json. La revisión documental nueva es focal, con localizadores por fuente. La tesis de Borràs y Reverté siguen siendo las bases de la escena de 1800; sus límites y las revisiones anteriores se conservan.

## Cambios publicados en la app

| Cambio | Base documental o motivo verificable |
|---|---|
| Arxiu XIX: búsqueda, fuentes, hitos y pendientes | data/research-19c.json; 21 fuentes y 24 hitos con referencias explícitas |
| Consulta de planos de 1852 y 1870 | N003 / XIX20 y PARES 1679586 / XIX08; proyecto separado de obra existente |
| Siete censos, 1842–1900, y CSV descargable | XIX02, INE, municipio 43136; cotejo automático de todas las columnas |
| Selector dividido en tres escalas temporales | La cronología implementada ya cubría 1778–1993; los documentos de seguimiento estaban desactualizados |
| Aviso permanente del contexto de 1800 después de ese año | Falta de evidencia de continuidad para cada edificio; no se presenta como ciudad completa del año elegido |
| Ocultación reversible de edificios heredados | Control de visualización; no se interpreta como fecha de demolición |
| Referencias de fuentes desde hitos y expedientes | Relaciones explícitas entre evento, fuente y expediente |
| Casotes y faro correctamente indicados como modelos ya presentes | El código los representaba desde 1857 y 1862; history-catalog los seguía marcando sin renderizar |
| Corrección del supuesto fin del atlas en 1950 | El selector real llega a 1993 y contiene fases portuarias posteriores |
| Barcas genéricas limitadas a la escena hasta 1800 | La regla documental existente ya excluía el ambiente posterior; ahora también se aplica al interruptor de barcas |

## Fuentes revisadas en esta fase

Se han guardado **30 archivos verificados, 166.044.018 bytes**, en originales. Incluyen documentos completos, fichas de catálogo y copias de consulta; no son 30 planos históricos independientes. manifest.json conserva tamaño, SHA-256 y formato. Los libros con derechos permanecen como copias de investigación; la web publica los planos de dominio público y la tabla derivada del INE, junto a enlaces a los demás originales.

| ID | Fuente | Localizador | Consulta |
|---|---|---|---|
| XIX01 | [Fons de Complement · catàleg 2024](https://larapita.cat/wp-content/uploads/2024/08/Cat%C3%A0leg-FC-agost-2024.pdf) | pp. 1–7 i 12 | Catálogo o noticia descriptiva |
| XIX02 | [Censos de població · municipi 43136](https://www.ine.es/intercensal/intercensal.do?search=3&codigoProvincia=43&codigoMunicipio=136&btnBuscarCod=Consultar+selecci%C3%B3n) | Taula municipal; set censos fins al 1900 | Documento o relato institucional leído |
| XIX03 | [Concessió de la canalització de l’Ebre](https://www.boe.es/gazeta/dias/1851/12/02/pdfs/GMD-1851-6350.pdf) | Núm. 6350, PDF p. 1, art. 1 i condicions | Documento o relato institucional leído |
| XIX04 | [La Companyia i el complex duaner](https://museumarebre.com/museu/) | Història · complex duaner i fi de la Companyia | Documento o relato institucional leído |
| XIX05 | [Història del Canal de la Dreta](https://comunitatregants.org/web/informacio/historia/) | Història del canal | Documento o relato institucional leído |
| XIX06 | [Història de la ciutat](https://larapita.cat/la-ciutat/historia/) | Canal i evolució del segle XIX | Documento o relato institucional leído |
| XIX07 | [Far de Sant Carles · memòria de Cardenal (1875)](https://www.porttarragona.cat/ca/notes-de-premsa-rss/item/1758-far-sant-carles-de-la-rapita) | Història · transcripció de la memòria de 1875 | Transcripción institucional |
| XIX08 | [Còpia del plànol de l’eixample · 1870](https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/1679586) | ACA, REAL PATRIMONIO, BGRP, Cajas 70, carp. 1, nº 8, plano | Documento o relato institucional leído |
| XIX09 | [Croquis de l’edifici anomenat Iglesia nueva](https://pares.cultura.gob.es/ParesBusquedas20/catalogo/description/1679995) | ACA, REAL PATRIMONIO, BGRP, Cajas 70, carp. 2, nº 1, croquis | Ficha; imagen pendiente |
| XIX10 | [Plànol de Carlos Gaurán · 1861](https://xac.gencat.cat/web/.content/xac/01_continguts_arxius_comarcals/ah_tarragona/06_publicacions_aht/publicacions_periodiques_aht/Bulleti-num.-23-Difusio.pdf) | Butlletí 23, p. 5; protocol notarial 8340, f. 295–311 | Catálogo o noticia descriptiva |
| XIX11 | [Càrrega de sal al Fondal de les Estaques](https://www.boe.es/gazeta/dias/1878/06/25/pdfs/GMD-1878-176.pdf) | Núm. 176, Ministeri d’Hisenda | Documento o relato institucional leído |
| XIX12 | [Llei del ferrocarril de Val de Zafán](https://www.boe.es/gazeta/dias/1880/05/15/pdfs/GMD-1880-136.pdf) | Núm. 136, p. 403, PDF p. 1, art. 1–3 | Documento o relato institucional leído |
| XIX13 | [Concessió de pesca i piscicultura a les llacunes](https://www.boe.es/gazeta/dias/1880/03/22/pdfs/GMD-1880-82.pdf) | Núm. 82, p. 750, PDF p. 2, Ministeri de Marina | Documento o relato institucional leído |
| XIX14 | [Terrenys i moll de les Salines de la Trinitat](https://www.boe.es/gazeta/dias/1885/11/11/pdfs/GMD-1885-315.pdf) | Núm. 315, p. 480, PDF p. 2, Ministeri de Foment | Documento o relato institucional leído |
| XIX15 | [Plano del puerto de Alfaques · 1813](https://www.ign.es/web/catalogo-cartoteca/resources/html/009734.html) | IGN 009734 · 92-83(V01-0020-MAPA15) | Documento o relato institucional leído |
| XIX16 | [Carta de 1919 sobre un aixecament de 1878](https://www.ign.es/web/catalogo-cartoteca/resources/html/000429.html) | IGN 000429 · S1-35-O-109 | Catálogo o noticia descriptiva |
| XIX17 | [Cementiri Municipal · notícia històrica](https://www.poblesdecatalunya.cat/element.php?e=18391) | Fitxa 18391 | Lectura focal del estudio |
| XIX18 | [Sanitat Marítima: la defensa de la costa i la salut pública de Tarragona (1720–1930)](https://www.porttarragona.cat/es/catalogo-de-publicaciones?element=3beed8c2-15db-40af-9860-3c6e3b261cc8&format=raw&item_id=5422&method=download&task=callelement) | pp. 145–151; AHCB, Fons Sanitat VII–VIII, 1804 | Lectura focal del estudio |
| XIX19 | [Costa entre el riu de la Sénia i Sant Carles · 1818](https://bdh.bne.es/bnesearch/detalle/bdh0000021490) | BNE MR/42/451 · bdh0000021490 | Original inaccesible |
| XIX20 | [Reforma urbanística · plànol aportat de 1852](https://hdl.handle.net/10803/284704) | N003 · correspondència amb MPD 223 segons H01, pp. 232–233 | Documento o relato institucional leído |
| XIX21 | [La desamortització de Madoz a la província de Tarragona (1859–1886)](https://www.dipta.cat/llibreria/sites/llibreria/files/media/la_desamortitzacio_de_madoz.pdf) | pp. 488–495 (PDF 490–497), apartat 2.10.7 | Lectura focal del estudio |

## Lecturas y límites destacados

- **1804:** Otiña, Sanitat Marítima (2014), pp. 145–151. Inspección sanitaria y Junta; las 50–60 familias son estimación del visitante. Un lazareto propuesto no se añade como edificio ejecutado.
- **1851:** ley de 26 de noviembre, publicada el 2 de diciembre. Autoriza la concesión del canal; no es una certificación de obra acabada.
- **1852–1859:** el Museu diferencia oficinas, almacén, casas de guarda, esclusa y puente giratorio. Se mantiene la geometría ya implementada; las piezas sin plano siguen pendientes.
- **1857 / 1858 / 1861 / 1867:** inauguración del canal, inicio de navegación según la Comunidad, uso agrícola y cambio administrativo de concesión son conceptos distintos; no se fuerza una fecha única.
- **1864:** permanece la discrepancia septiembre/noviembre en la fuente del faro.
- **1867 / 1870:** original del ensanche y copia; los 197 solares no se convierten en 197 edificios.
- **1878:** habilitación de carga de sal en el Fondal de les Estaques; se exige caseta, sin dar por acreditada su ejecución ni inventar emplazamiento.
- **1880:** autorización del ferrocarril y concesión de piscicultura; no se dibujan un tren en servicio ni todas las obras de saneamiento como terminadas.
- **1885:** la Gaceta acredita la existencia de salinas y menciona un muelle construido sin autorización. No proporciona geometría suficiente para incorporarlo al mapa.
- **Propiedades:** Rovira i Gómez (1987), pp. 488–495 (PDF 490–497), distingue casas, solares, direcciones históricas y remisiones a protocolos. Se ha leído ese apartado, no íntegramente sus 624 páginas. Se necesita conciliación de fincas antes de añadir trazas.
- **Carta de 1878:** el ejemplar IGN 000429 es una edición corregida de 1919. No se usa toda su costa como si fuese la de 1878.

## Trabajo documental pendiente para reconstruir más ciudad

- **1803 · Bateries i edificis militars:** Ar.F-T.8-C.3-326(1) i 327. Obtenir originals i distingir projecte/estat. Fuente: XIX01; C020 · p. 6.
- **1817 · Salines i canal de reg:** AGP, Bailia de Catalunya, 11483/01. Llegir reclamacions i plànols adjunts. Fuente: XIX01; C002 · p. 1.
- **1825 · Petició de fàbriques:** AGP, Bailia, 11490/38. Petició; execució desconeguda. Fuente: XIX01; C002 · p. 1.
- **1828 · Llogaters del Reial Patrimoni:** AGP, Bailia, 11546/29. Conciliar cases i arrendataris. Fuente: XIX01; C002 · p. 1.
- **1829 · Terrenys tocant al mar:** AGP, Bailia, 11479/1. Localitzar finques. Fuente: XIX01; C002 · p. 1.
- **1832 · Establiment d’escola:** AGP, Bailia, 11546/48. Comprovar funcionament i adreça. Fuente: XIX01; C002 · p. 1.
- **1842 · Reparació de cases 1 i 2:** Pressupost Mies · Manzana. Identificar peces. Fuente: XIX01; C014 · p. 5.
- **1843 · Capella del cementiri de la Devesa:** Carta de Gasparín Gombau de 1854; esment 1843. Obtenir carta i planta. Fuente: XIX01; C014 · p. 5.
- **1861 · Presó a plaça Major 15:** AGP, Bailia, 11535/26. Contrastar numeració i ús. Fuente: XIX01; C002 · p. 2.
- **1865 · Registre de cases:** AGP, Bailia, 11545/1. Transcriure i relacionar finques. Fuente: XIX01; C002 · p. 2.
- **1869 · Cases i llogaters:** AGP, Bailia, 11536/26. Conciliar amb 1865. Fuente: XIX01; C002 · p. 2.
- **1870 · Solars de l’eixample:** ACA, BGRP, Caja 70, carp. 2, 1; Caja 349, exp. 1865. Obtenir relació i plànol original. Fuente: XIX08; PARES 1679586.
- **1873 · Inventari de les Salines de la Trinitat:** Donació Jordi Surià Guillaumes, 1873–1874. Consultar inventari íntegre. Fuente: XIX01; C027 · p. 12.
- **1882 · Estatuts de San Pedro:** Museo Naval, AMN 1187 F 044. Consultar estatuts. Fuente: XIX01; C022 · p. 7.
- **1878 · Aixecament hidrogràfic original:** Dirección Hidrográfica, aixecament 1878. Obtenir edició anterior a les correccions de 1919. Fuente: XIX16; IGN 000429 / XIX16.
- **1864 · Cases i solars del registre de desamortització:** BOPT, suplements 1864; protocols notarials 8328–8333 i altres. Conciliar adreces històriques i títols amb els plànols. Fuente: XIX21; XIX21, pp. 488–495.

No se declara completada la reconstrucción urbana de 1800–1900. Faltan parcelarios conciliados, fechas individuales, alzados y costa georreferenciada con controles independientes. La búsqueda de esta fase es amplia pero no acredita que se haya localizado toda la documentación existente en todos los archivos.

## Acceso no conseguido

- XIX09, croquis de Església Nova [1868]: ficha descargada; el visor PARES responde que no hay imágenes asociadas. No se han extraído medidas.
- XIX19, BNE MR/42/451, costa Sénia–Sant Carles (1818): ficha identificada mediante catálogo; descarga y visor devuelven HTTP 403. No se ha leído ni guardado una imagen inexistente.
- El plano de 1870 recuperado mide 640 × 524 píxeles; permite consulta general, no digitización parcelaria fiable. Otro tamaño servido por PARES resulta menor y no se etiqueta como alta resolución.

## Reproducción y verificación

- Datos de entrada: data/research-19c.json.
- Preparación: node scripts/build-research.mjs.
- Inventario y comprobación de referencias: node scripts/audit-project.mjs.
- Pruebas: node --test tests/*.test.mjs; tsc --noEmit; vite build.
- Consulta sin cambiar la escena: botón Arxiu XIX. Acceso inicial: ?any=1864#arxiu-xix.
- Los originales descargados se excluyen de la publicación estática. No se sustituyen los originales aportados ni las alturas medidas.

### Resultado de las comprobaciones

111 pruebas correctas; TypeScript y compilación correctos. Comprobados 123 expedientes base con 299 fases, 113 originales y sus copias sin cambios, y 2.700 enlaces HTML locales. La app reúne 125 fichas al incluir dos entradas auxiliares. Revisión de navegador de escritorio y móvil: sin errores de página ni recursos fallidos. Los contadores obsoletos y la validación de referencias FAR/CAS se han corregido sin modificar los testimonios.
