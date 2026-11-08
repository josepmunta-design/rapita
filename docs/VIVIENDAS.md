# Viviendas — expediente de la versión 0.3.0

Fecha de revisión: 30/10/2026. Escenario visual hacia 1800; evidencia principal fechada **20 de mayo de 1794**. No se ha demostrado la continuidad individual de los estados de obra durante esos seis años.

## Lectura documental

Se ha consultado directamente el texto de [Pilar Reverté Vidal, *1794. Estat de les obres reials de San Carlos*, Recerca 20 (2024), pp. 191–234](https://www.academia.edu/170882307/1794_Estat_de_les_obres_reials_de_San_Carlos_Una_descripci%C3%B3_detallada_de_les_intervencions_realitzades_a_la_R%C3%A0pita_entre_1780_i_1794): análisis residencial de pp. 208–215 y transcripción de los artículos 1–9, pp. 230–231. Documento original citado: ACA, RP, BGRP, Cajas 60. Las ilustraciones del PDF quedan por cotejar.

| Registro de 1794 | Cantidad | Representación |
|---|---:|---|
| Casas grandes terminadas | 22 | Revoco, balcones, teja y patio |
| Grandes cubiertas sin acabar | 7 | Cubierta y rejas, sin carpinterías ni revoco |
| Grandes sin cubierta, con vigas de primer piso y pórticos completos | 14 | Muros elevados y pórticos; sin tejado |
| Pequeñas del entorno costero | 14 | Casas bajas de ensayo |
| Habitaciones de la Mançana | 24 | Un conjunto compartido con patio |
| Propiedades privadas de usos mixtos | 38 | Sin colocar: falta identificación individual |

Las **119 casas y habitaciones** no equivalen a 119 edificios residenciales. Las 81 unidades reales se representan en **57 casas y un conjunto compartido**. El registro privado incluye inmuebles no residenciales. No se ha calculado una cifra residencial privada mediante una resta arbitraria.

Se ha ampliado la lectura de la tesis de Noèlia Borràs Matamoros, `tesi doctoral.pdf`, a pp. impresas 251–253 (PDF 255–257): construcción de doce casas en 1788–1789, tipología adosada y materiales. Esas doce no se añaden al total de 1794, para evitar duplicación.

## Decisiones del modelo

- **Cantidades y estados:** proceden de la transcripción; la asignación de cada estado a una parcela concreta es C.
- **Trazado:** filas de ensayo junto a la plaza, diez sectores en una exedra meridional, cuatro pórticos al oeste, grupo costero y Mançana. La relación de la exedra con las casas redondas es una interpretación del artículo. Las coordenadas individuales y el reparto en filas son una decisión de visualización, no una planta histórica recuperada.
- **Referencia actual:** ortofoto ICGC 2024 y mapa topográfico conservados con sus solicitudes WMS en `docs/sources/`. Solo se usan para leer alineaciones y calles; no son textura ni parcelario de 1800.
- **Geometría:** alturas, profundidad, distribución de huecos, forma de arcos y compartimentación son parámetros C. Las variaciones son deterministas; no se usa aleatoriedad en cada visita. Las casas pequeñas tienen una planta de ensayo, no una altura documentada.
- **Mançana:** cuatro alas simplificadas con patio, un identificador y 24 unidades contadas. No se restituyen aún sus instalaciones y usos singulares.
- **Fonda nueva:** se reservan dos cuerpos de ensayo de la fila este como posible solapamiento. Al desarrollar la fonda habrá que revisar esa atribución y sustituirlos, sin sumarlos otra vez.
- **Suelo:** MDT contemporáneo intacto, con apoyo técnico gris por edificio. En la Mançana el desnivel alcanza unos 2,7 m; no se atribuye ese zócalo a una construcción histórica.
- **Huecos:** usan la misma envolvente de muro con normales explícitas que corrigió el parpadeo de Església Nova. Carpinterías y barandillas tienen separación física de la fachada.

## Archivos y repetición

`data/housing-1794.json` conserva inventario, referencias y parámetros; `src/housing-plan.mjs` genera las posiciones; `scripts/prepare-housing.mjs` verifica el TIFF y produce el terreno y `public/data/housing.json`; `src/housing.ts` construye las mallas en el navegador.

```powershell
npm.cmd run data:housing
npm.cmd test
npm.cmd run build
npm.cmd run dev
```

Abrir `http://127.0.0.1:5173/#viviendas`. La pestaña solo enfoca la cámara: las viviendas existen desde la carga inicial del mapa general. Capas permite ocultarlas para comparar con el terreno.

## Pendientes

1. Georreferenciar planos históricos con controles y errores de ajuste antes de sustituir las posiciones C.
2. Identificar las 38 propiedades privadas y separar residencia de otros usos, sin duplicar monumentos o fondas.
3. Contrastar cambios, ventas, ocupación y obras entre 1794 y 1800.
4. Sustituir dimensiones y huecos de ensayo por medidas justificadas; cotejar ilustraciones originales y edificios conservados.
5. Desarrollar después los edificios emblemáticos, según el orden solicitado por el usuario.

La validación técnica de la aplicación no constituye una validación histórica de las parcelas ni los alzados.

## Integración del centro (0.4.0)

La fonda nueva sustituye los dos cuerpos de ensayo reservados por dos alas y un patio, conservando las 81 unidades reales. Los identificadores técnicos 21 y 22 no se convierten por ello en los números históricos 5 y 6. Las Cases de Talavera se representan por evidencia específica, sin sumar dos unidades al agregado privado de 38 hasta conciliar su registro.


## Revisió de detall i navegació (0.11.0)

Vegeu [Detall d’habitatges i porxos transitables](DETALL_HABITATGES.md), revisió de 31/10/2026. Diferencia els porxos de les cases i les quatre columnes amb arquitrau de la plaça coberta, documenta materials i obertures C i substitueix els bloquejos massissos per murs i pilars als passos oberts. Els inventaris i els camps històrics desconeguts es conserven.
