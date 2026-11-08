# Centro del pueblo — expediente 0.4.0

Revisión: 30/10/2026. Se atiende la prioridad del usuario: desarrollar primero el núcleo de plaza y servicios, manteniendo la escena continua de navegador. Glorieta, batería y torres exteriores quedan para otra fase.

## Fuentes revisadas

- H02: [Pilar Reverté Vidal, *1794. Estat de les obres reials de San Carlos*, Recerca 20, 2024](https://www.academia.edu/170882307/1794_Estat_de_les_obres_reials_de_San_Carlos_Una_descripci%C3%B3_detallada_de_les_intervencions_realitzades_a_la_R%C3%A0pita_entre_1780_i_1794), texto de pp. 208–219 y transcripción, arts. 1–15. Original citado: ACA, RP, BGRP, Cajas 60, 20/05/1794. Las ilustraciones del artículo no se han georreferenciado.
- H01: tesis de Noèlia Borràs Matamoros, `tesi doctoral.pdf`, lectura de pp. impresas 167–168, 225–229 y 251–253. Inspección visual de la fotografía de la plaza y la fuente en PDF 230–231 (impresas 226–227). La foto de restos y el plano decimonónico no documentan por sí solos el estado de 1800.
- Dossier de segunda revisión aportado por el usuario: posiciones generales, edificios del Cóc, fuentes y algarrobos.
- G03: mapa topográfico ICGC y ortofoto 2024, con solicitudes conservadas en `docs/sources/`. Solo referencia de calles y alineaciones actuales.

## Piezas y decisiones

| Registro | Evidencia de partida | Decisión visual de ensayo |
|---|---|---|
| Sant Elm | Templo nuevo; campanario por concluir | Nave pequeña con fachada clásica y torre baja abierta; distinto de Església Nova |
| Plaza cubierta / Casa Laureano | Identificación probable y obra avanzada | Planta baja cubierta y cuerpo superior abierto |
| Fonda nueva | Dos cuerpos y patio | Sustituir dos modelos residenciales reservados, con entrada lateral al patio |
| Nueva aduana del Cóc | Muros completos, sin cubierta ni pisos altos concluidos | Envolvente abierta con lectura de piedra almohadillada |
| Almacenes de White | Edificio opuesto, simetría prescrita | Pareja abierta; su estado exacto se extrapola como C |
| Dos fuentes | Pareja con torres; un reloj instalado | Dos pilas y un solo reloj, con asignación de lado C |
| Mançana nueva | Muros preparados para vigas del primer piso | Recinto bajo sin tejado ni viviendas altas acabadas |
| Cases de Talavera | Dos casas privadas y recinto con patio | Dos alas de ensayo, sin aumentar el agregado privado contabilizado |
| Mançana existente | Patio y pozo | Mantener su único conjunto de 24 habitaciones y añadir un pozo C |

## Qué representa la geometría

**Ninguna de las nueve parcelas nuevas es una planta histórica validada.** El marco de orientación procede del trazado de ensayo residencial. Posiciones, dimensiones, espesores, huecos y detalles quedan en C; las medidas documentadas desconocidas permanecen en `null`. El modelo no convierte una fachada clásica en prueba de un alzado concreto.

La fonda reemplaza `royal-finished-21` y `royal-finished-22`. Estos identificadores técnicos no equivalen a los números históricos 5 y 6. Al ocultar la capa del centro se recuperan los cuerpos residenciales anteriores para la comparación; nunca se muestran las dos versiones superpuestas. El inventario real sigue teniendo 81 unidades.

Talavera y White se identifican por fuentes específicas, sin añadir viviendas por una resta del grupo mixto de 38 propiedades. Falta conciliar las entradas individuales de ese agregado.

No se completa el tinglado anexo: los daños y desmontajes descritos requieren una cronología más precisa. Tampoco se trasladan balaustradas tardías, el templo contemporáneo, un mercado moderno o fachadas acabadas a edificios que seguían en obras.

La plaza y los patios reciben color de tierra sobre los mismos vértices del MDT: **no cambian sus alturas**. La forma de la superficie y las dos filas de sesenta algarrobos son una distribución C. El tamaño de los árboles y su supervivencia individual en 1800 son desconocidos. No se incorpora una costa moderna.

Los apoyos grises son técnicos, no basamentos históricos. Las alas de la fonda y Talavera se asientan por separado sobre el terreno contemporáneo; no se crea una plataforma plana bajo todo el patio. La Mançana antigua conserva su apoyo de ensayo anterior.

## Archivos y reproducción

- `data/center-1794.json`: fuente, páginas, estados y parámetros de cada pieza.
- `src/center-plan.mjs`: orientación, plantas de ensayo, validación de sustituciones y definición del espacio público.
- `scripts/prepare-center.mjs`: terreno bajo las plantas y generación de `public/data/center.json`.
- `src/center.ts`: envolventes, cubiertas, pórticos, fuentes, pozo y vegetación; materiales procedurales locales.
- `src/main.ts`: presencia permanente, capas, catálogo, enfoque y fichas de evidencia.

```powershell
npm.cmd run data:center
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abrir `http://127.0.0.1:5173/#centro` o elegir **Edificios**. Seleccionar Plaza o Cóc también enfoca el centro. Elegir una pieza acerca la cámara y permite consultar su evidencia; no carga un escenario separado.

## Validación y pendientes

Las pruebas verifican sustituciones sin duplicación, ausencia de solapamientos de plantas, reversibilidad del color del suelo, cotas intactas, geometría finita, ausencia de cubiertas en obras incompletas y un solo reloj. Son controles técnicos; no certifican exactitud histórica.

Antes de cerrar la restitución del centro falta georreferenciar planos, medir fábricas conservadas, conciliar propiedades y usos, y seguir las transformaciones de 1794 a 1800. El grupo del convento, aduana antigua, tinglado y accesos al puerto también requieren más documentación para incorporarlos. La entrega amplía el centro como modelo de estudio, no lo declara históricamente completo.


## Revisió de detall i navegació (0.11.0)

Vegeu [Detall d’habitatges i porxos transitables](DETALL_HABITATGES.md), revisió de 31/10/2026. Diferencia els porxos de les cases i les quatre columnes amb arquitrau de la plaça coberta, documenta materials i obertures C i substitueix els bloquejos massissos per murs i pilars als passos oberts. Els inventaris i els camps històrics desconeguts es conserven.
