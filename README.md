# La Ràpita · atles de reconstrucció

**Les Casotes · 2/11/2026:** models aportats cap al 1858 i actual integrats, amb onze arcades llargues, tres als laterals i coberta a quatre aigües. Mides estimades de 33 × 15,3 m; posició marcada preservada. **Trama → Les Casotes** permet comparar el museu actual i mostrar les cases de guarda en distribució hipotètica. [Aplicació i límits](docs/CASOTES_RAPITA.md). Regeneració: `npm.cmd run data:casotes`.

**Far de Punta Senieta · 2/11/2026:** models aportats de 1864 i actual integrats: planta de 13,10 m, terrat pla i torre central. Fases de 1920 i 1975, absència el 1800 i comparació actual a **Trama → Far de Sant Carles**. [Aplicació i límits](docs/FARO_RAPITA.md). Regeneració: `npm.cmd run data:faro`.

**Paisatge de Pilar Reverté · 31/10/2026:** incorporades les correccions de `Descripció ia.odt`: baixada amb figueres, hort i sínia de la raconada, boca de cova i margallons baixos. Capa reversible a **Capes → Paisatge de Pilar Reverté**; 16 imatges a Litoral i noves referències PR01 a les fitxes. Interpretació C, sense retrodatàr les fotografies ni alterar el MDT. [Aplicació, font i límits](docs/PILAR_REVERTE.md). Regeneració: `npm.cmd run data:pilar`.


**Ajust del Roquer · 31/10/2026:** costa i plantes A–G alineades amb el redibuix de 1748; tres corrals i sis peces de quarters diferenciats. Els projectes H–O es consulten en daurat a **Litoral → Roquer en planta · ajust de 1748**. Documents, coordenades i plantes sincronitzats amb el mapa. [Taula i límits de l’ajust](docs/ROQUER_ALINEACIO.md). Regeneració: `npm.cmd run data:roquer`.

Atlas tridimensional de investigación, ejecutado en navegador con TypeScript, Three.js y Vite. La escena se genera por código y datos: **no necesita Blender**.

La base de la versión 0.4 incorpora **58 cuerpos residenciales que representan 81 casas y habitaciones reales del inventario de 1794**: 22 casas grandes acabadas, 7 cubiertas sin terminar, 14 sin cubierta con pórticos, 14 pequeñas y un conjunto compartido de 24 habitaciones en la Mançana. El agregado privado de 38 propiedades sigue sin conciliación individual; las Cases de Talavera se incorporan como estudio singular, sin sumar viviendas a ese total. Las posiciones individuales, alzados y persistencia del estado de obra en 1800 siguen sin validar; ver [el expediente de viviendas](docs/VIVIENDAS.md).

También representa el **relieve contemporáneo ICGC**, seis referencias espaciales y un **laboratorio de Església Nova** con terreno a 2 m y un primer volumen paramétrico C. Es un modelo de estudio: sus alturas, espesores, huecos y distribución todavía no están medidos ni validados para 1800. NoData queda sin malla. La versión 0.5 añade un escenario litoral C reversible, separado del MDT original.

Església Nova se dibuja desde la carga inicial en el mapa general. Seleccionarla o abrir la pestaña **Edificis** solo acerca la cámara y muestra sus controles; el entorno permanece visible. También se puede acceder a `http://127.0.0.1:5173/#esglesia`.

El centro añade nueve registros de estudio: Sant Elm, plaza cubierta/Casa Laureano, fonda nueva, dos almacenes del Cóc, dos fuentes con un solo reloj, Mançana nueva iniciada y Cases de Talavera. Un pozo completa la lectura de la Mançana existente. Suelo en tierra y sesenta algarrobos de distribución C; los archivos del MDT conservan sus cotas originales. Ver [el expediente del centro](docs/CENTRO.md).

La interfície, les fitxes i els noms dels llocs i edificis estan en català des de la versió 0.4.1. Els accessos actuals són `#centre`, `#habitatges` i `#esglesia`; els enllaços antics continuen funcionant.

## Versió 0.5 · Roquer, aigua i cronologia

El mapa general incorpora el **Roquer amb bateria parcial, torre, dependències i restes d’estudi**, molls i rampes, una platja amb front rocós, cinc embarcacions mediterrànies genèriques i **10,3 km de canal d’assaig cap a Amposta** amb aigua baixa. El T-6/8 és un projecte per a vuit canons; l’escena distingeix el conjunt inacabat i les sis peces descrites el 1794. [Expedient i límits](docs/ROQUER_CANAL.md).

El **selector d’any 1778–1800** canvia els models en fites documentades. També incorpora una primera cronologia del nucli: duana el 1780, testimonis de Talavera i fonda dels Lanti el 1782, i una escena alternativa de dotze cases de lloguer de 1788–1789. Aquestes dotze **no se sumen** a les 81 unitats de 1794; la identitat individual és desconeguda. [Cronologia i com ampliar-la](docs/CRONOLOGIA.md).

Accessos: `#roquer`, `#canal`, `#amposta`; l’any es conserva a `?any=1789#roquer`. El tauler **Litoral** permet comparar amb el **MDT actual** i consultar els plànols originals. La costa, els alçats i les posicions són C; els nivells d’aigua són tècnics, no cotes històriques validades. El context ICGC cap a Amposta té pas de 50 m i una font diferent del LiDAR local.

## Versió 0.6 · monuments i desembocadura

S'afegeixen **la Glorieta i la Torre de la Guardiola** al mateix mapa, amb alçats C, fitxes i cronologia pròpia. La Glorieta no rep una cúpula; Guardiola no copia el coronament modern. [Expedient](docs/GLORIETA_GUARDIOLA.md).

La desembocadura uneix ara mar, dàrsenes i ramal amb aigua contínua; els talussos no poden tornar a tapar les cruïlles. Botó **Desembocadura** al tauler Litoral. L'entrada continua sent una geometria d'assaig C.

El ZIP del Montsià rebut després d’aquesta fase ja està incorporat en 0.7.0; vegeu el pas següent.

## Versió 0.7 · Montsià

El nou ZIP ICGC amplia el relleu de la serra dins del mateix mapa. El context usa mostres natives a **50 m**, fins a **759 m d'altitud**, i conserva el poble a 10 m i els detalls a 2 m. Els dos TIFF coincideixen en 6.386 mostres comunes. Les vores queden cosides sense una malla superposada ni farciment de NoData. Botó **Montsià** i accés `#montsia`; Extensió enquadra la cobertura conjunta. És terreny contemporani 2021–2023, sense exageració vertical. [Dades, procedència, regeneració i pendents](docs/MONTSIA.md).

## Versió 0.8 · trama del poble del 1800

Set corredors de terra connecten plaça, accessos i port. S'afegeixen el pont i barranc de les Monges, dos horts i sínia, jardí botànic, ferreria amb variants, dues cases dels guardes, casa de l’administrador i pati de materials. Sempre al mapa general; pestanya **Trama**, accés `#trama`, capes i testimonis de 1780, 1782, 1792 i 1794. No es dupliquen les 81 unitats reials ni es converteixen les 38 propietats mixtes en cases arbitràries. [Expedient i pendents](docs/TRAMA_1800.md).

L'horitzó del projecte arriba al **1950**, amb prioritat actual per completar el **1800**. La recerca posterior queda arxivada i consultable a Trama: [fonts i fases](docs/HORITZO_1950.md). El selector actiu encara és 1778–1800. La planta del XVIII és una restitució relacional C; no s'afirma haver georeferenciat un parcel·lari històric.

## Versions 0.9–0.10 · caminar i vida quotidiana

**Camina** entra en primera persona al mateix poble: WASD/fletxes, arrossegar per mirar, Majúscules per accelerar i Esc per recuperar la vista anterior. Tres punts de sortida: plaça, moll i Església Nova. Accessos: `#camina` o `?any=1794#camina`.

Persones caminant, treballant i pescant, tripulants, un cavall amb carro i dos rucs amb càrrega acompanyen cinc barques en moviment. Tot és recreació genèrica C. **Pausa ambient** atura l’animació i permet continuar caminant; controls independents a Capes i respecte de la preferència de reduir moviment. [Controls, verificació i límits](docs/PASSEIG_I_VIDA.md).

## Versió 0.11 · habitatges, porxos i velocitat

Portes de taulons i ferratges, reixes, cornises, teula amb relleu, terrats posteriors, xemeneies i patis amb portell. Es mantenen explícits els detalls C i els estats inacabats de 1794. **Camina pels porxos** permet travessar les galeries i la columnata; pilars i murs continuen sent sòlids. Els patis oberts deixen de quedar bloquejats per la planta sencera. [Fonts, decisions i límits](docs/DETALL_HABITATGES.md).

El sòl incorpora gra i variacions de color, vores amb petites pedres, vegetació baixa fora dels passos i ombres dels edificis. Terrissa als patis i utillatge genèric al moll completen l’entorn. Tot és una capa C reversible a **Capes → Detall de l’entorn**, sense alterar el MDT.

**Velocitat inicial: 6 m/s**, regulable de 2 a 12 m/s; Majúscules duplica el valor. Corregida la pèrdua de velocitat quan baixa el rendiment. El selector de sortida incorpora porxos, columnata, façana i pati.

## Abrir el proyecto

Requisito de desarrollo: Node.js 22.12 o posterior (comprobado con 24.12). En PowerShell puede usarse `npm.cmd` si la política de ejecución bloquea `npm.ps1`.

```powershell
npm.cmd ci
npm.cmd run dev
```

Abrir **http://127.0.0.1:5173/**. Los datos web ya están generados en `public/data`; no hace falta reprocesar el GeoTIFF para visitar el prototipo. Usar un navegador con WebGL 2. No abrir `index.html` directamente mediante `file://`.

```powershell
# Regeneración opcional a partir de los dos ZIP FME originales situados en la raíz
npm.cmd run data:prepare
# Solo regenerar el recorte de 2 m y el expediente del edificio
npm.cmd run data:detail
# Solo regenerar viviendas y terreno del núcleo
npm.cmd run data:housing
# Solo regenerar los edificios del centro
npm.cmd run data:center
# Regenerar Roquer, canal, contexto regional y testimonios cronológicos
npm.cmd run data:littoral
# Regenerar calles, servicios y referencias históricas
npm.cmd run data:urban
# Regenerar la ampliación de Montsià
npm.cmd run data:montsia
# Regenerar Glorieta y Guardiola
npm.cmd run data:landmarks
# Comprobar datos, coordenadas, huecos y compilación
npm.cmd test
npm.cmd run build
# Servir la versión de distribución
npm.cmd run preview
```

`dist/` es un sitio estático autocontenido: incluye motor, código y datos. El visor no usa CDN, mapas remotos ni servicios de elevación. Las consultas externas se abren solo al pulsar enlaces de documentación. No se ha configurado una caché de service worker: para usarlo sin conexión, servir `dist/` desde un servidor local.

## Versió 0.12 · cases amb porxos

Revisió amb el testimoni de 1794, Salvany (1916) i l’IPAC: arcs de carpanell amb peces radials, filades, impostes, cornises, arcs transversals i fusta. Es retiren els pisos frontals especulatius. **Selecciona una arcada al mapa per llegir-ne la descripció amb cites i fotografia**, també durant el passeig. Accessos alternatius a Habitatges i Edificis. **Mostra el conjunt dels porxos** n’apropa la vista. Les mesures i parcel·les continuen sent C. [Fonts, implementació i pendents](docs/PORXOS.md).

Regeneració documental: `npm.cmd run data:porxos`. Verificació de la fase: 62 proves correctes i compilació estàtica. Les imatges modernes són referències de recerca; només les reproduccions de Salvany de domini públic s’inclouen al web.

## Controles

- Arrastrar: girar; rueda/pellizcar: acercar; botón derecho o dos dedos: desplazar.
- Seleccionar un lugar: enfocar y consultar su ficha.
- Perspectiva, planta, extensión, zoom y restablecer: botones del visor.
- Viviendas: enfocar el núcleo y consultar inventario, estados de obra, fuentes e incertidumbres. Acceso directo: `http://127.0.0.1:5173/#habitatges`. Las viviendas ya se dibujan antes de abrir la pestaña.
- Capes: habitatges, centre, Roquer, interpretació litoral, vegetació, corbes del MDT, referències, malla i eix opcional.
- Any: lliscador i fites; teclat amb fletxes, Inici i Fi.
- Litoral: càmeres Roquer/canal/Amposta, mode interpretat o MDT, envolupant de projecte opcional, barques i fonts.
- Edificios: enfocar todo el centro o cada pieza, consultar su estado, fuentes e hipótesis. Acceso directo `#centre`.
- Laboratorio de Església Nova: desde Edificios o su referencia, traza/volumen C, altura de trabajo, corte de fachada y distribución interior.
- Vista general: alejar la cámara y recuperar la lista de lugares. El edificio sigue visible. El terreno de 2 m se integra en el de 10 m mediante un borde triangulado común.
- Teclas `1`–`6`: lugares; `R`: vista inicial; `Esc`: cerrar el diálogo.

La guía de trabajo vigente es [GUIA_PROYECTO.md](GUIA_PROYECTO.md). Incluye el inventario, decisiones, trabajo realizado, limitaciones y tareas siguientes. La especificación original se ha actualizado a v1.11 en `especifiación técnica 1.0.txt` conservando su nombre de archivo.

## Organización

```text
src/context-plan.mjs       Costura del contexto de Montsià y Amposta con el terreno local
scripts/prepare-montsia.mjs Muestreo de los dos TIFF y procedencia del contexto
src/                       Visor y funciones de coordenadas/malla
data/interpretations.json  Fichas, incertidumbres y referencias editables
data/esglesia-nova.json    Observaciones actuales, fuentes y parámetros C separados
scripts/prepare-terrain.mjs Extracción y muestreo reproducible del GeoTIFF
scripts/prepare-esglesia.mjs Recorte nativo 2 m y apoyo provisional del modelo
data/housing-1794.json      Inventario, fuentes, tipologías y trazado de ensayo C
scripts/prepare-housing.mjs Núcleo a 2 m, plantas y apoyo técnico de las viviendas
data/center-1794.json       Fuentes, estados y dimensiones de ensayo del centro
scripts/prepare-center.mjs Posiciones y apoyo técnico, con sustitución de la fonda
data/littoral-1800.json    Roquer, costa y canal de ensayo C, fuentes y exclusiones
data/chronology.json       Testimonios e intervalos por entidad
data/urban-chronology.json Testimonio alternativo de doce casas de 1788–1789
scripts/prepare-littoral.mjs Contexto WCS archivado y datos de las nuevas fases
public/data/               Datos listos para el navegador; planos bajo reference/
tests/                     Comprobaciones geográficas y de datos
docs/investigacion/        Investigación anterior extraída del ZIP
docs/lidar/                Inventario y límites de las nubes LAZ
docs/sources/              Ortofoto ICGC de referencia y solicitud WMS exacta
docs/archivo-blender/      Prototipo anterior conservado como antecedente
tmp/                      Extracción temporal y material de revisión (ignorado)
```

Los archivos de `docs/archivo-blender/` no se ejecutan ni forman parte de la aplicación. `public/data/monuments.geojson` es generado: editar las fichas en `data/interpretations.json` y regenerar, o corregir las anclas de origen en el GeoJSON de investigación dejando constancia en la guía.

La ortofoto de 2024 se usa para investigar la posición y orientación contemporáneas; no se publica como textura del paisaje de 1800. Ver [el expediente de Església Nova](docs/ESGLESIA_NOVA.md) para la metodología, las fuentes y los límites del primer modelo.


## Arxiu documental multitemporal · 31/10/2026

[Obre el lector d’expedients](docs/EDIFICIS/index.html) o [l’índex Markdown](docs/EDIFICIS/INDEX.md). Hi ha **65 expedients principals i 57 cossos residencials d’assaig**, cadascun en una carpeta amb descripció, ubicació, fonts, fases i paràmetres actuals del model. Els 291 testimonis conserven les dates i les incerteses; no identifiquen automàticament dates de construcció ni finques individuals.

Els 113 fitxers aportats estan catalogats i arxivats amb hashes. [Revisió dels plànols](docs/EDIFICIS/PLANS.md) · [Criteris i conflictes](docs/EDIFICIS/CRITERIS_I_CONFLICTES.md) · [Regeneració i verificació](docs/EDIFICIS/REGENERACIO.md). Aquesta fase documental no canvia la geometria ni amplia encara el selector actiu de 1778–1800.
