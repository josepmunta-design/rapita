# Edificios y agua: revisión de la escena de 1800

Versión 0.14.1 · 08/11/2026.

El error estaba en las posiciones de ensayo de edificios y barracas, no en una evidencia nueva sobre la costa. El horno conservaba un anclaje incompatible con la Fonda Vella recolocada sobre el croquis; el conjunto de barracas atravesaba el canal. Sanitat necesitaba ajustar su apoyo al muelle y el Molinet estaba indebidamente atribuido al brazo nuevo.

| Elemento | Corrección | Evidencia | Límite |
|---|---|---|---|
| forn-moli-guix | Recol·locat al nord de Fonda Vella en relació amb el seu emplaçament del croquis. | N112 p.211: afrontacions de 1782; p.224. | Relació nord documentada; separació de 3 m i punt individual C. |
| barraques-obrers | Dotze peces en dues fileres paral·leles a la riba occidental; abans algunes tallaven el llit. | N029, 13/11/1780: dotze barraques a les vores del canal. | Emplaçament, costat i separacions C; nombre de dotze conservat. |
| health | Centrada i alineada amb el moll existent; tota la planta queda recolzada. | N112 art.18 p.232: oficina al cap de la dàrsena. | Ajust de 0,21 m i gir d’assaig; planta i moll C. No es crea un illot. |
| molinet | Posició del braç nou retirada; es conserva l’expedient sense solar assignat. | N112 il·l.3, zona D, i p.223; art.30 p.234: extrem del canal vell a la platja del Molinet. | No s’ha georeferenciat el solar; no es trasllada arbitràriament a la riba del canal nou. |

La fuente principal es Pilar Reverté Vidal, Recerca 20 (2024), pp. 191–234, con transcripción de la relación del 20/5/1794 (ACA RP BGRP Cajas 60). La figura 3 separa D (Molí fariner) de C (dársena y esclusa del canal); el art.30 menciona expresamente el canal viejo. Reubicarlo a unos metros del punto incorrecto en el brazo nuevo carecería de esa correspondencia.

Las consultas al enlace PARES 1679817 no han recuperado una copia georreferenciable. La búsqueda municipal de la playa del Molinet aporta contexto actual, pero no fija el solar del molino de 1794 y no se usa para colocar un edificio histórico.

Se conservan sin modificaciones la costa, los polígonos de las dársenas, los dos trazados del canal, los espigones, la anchura del muelle y el nivel técnico del agua. Tampoco se modifican los binarios del MDT ni sus máscaras.

La posición rechazada del Molinet se conserva en docs/EDIFICIS/molinet/posicio-rebutjada-20261108.json. Su expediente mantiene las fuentes y fases, con coordenadas históricas nulas y sin un modelo emplazado.

## Comprobación preventiva

Se han comprobado 89 edificios y conjuntos (104 huellas), con 17587 muestras de perímetros e interiores. Las doce barracas se muestrean por separado. Resultado: cero huellas sin tierra o muelle real debajo en el escenario de 1800. El control está integrado en el comando de compilación y bloquea una publicación si reaparece una ocupación del agua sin apoyo.

Los centros de los edificios no bastan: el antiguo punto central del Molinet coincidía con un banco del canal, pero gran parte de su planta invadía el agua. La prueba cubre ambos casos.
