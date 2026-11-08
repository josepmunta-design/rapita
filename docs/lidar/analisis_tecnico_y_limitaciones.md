# Cobertura LiDAR litoral sobre La Ràpita

**Fecha de los ficheros:** marzo-abril de 2024 (nombres de archivo).
**Sistema de referencia:** EPSG:25831, confirmado por GeoKeys de los cuatro encabezados LAS.
**Formato:** LAS 1.4, formato de punto 8 comprimido a LAZ, 42 bytes por punto descomprimido.
**Alcance:** cuatro teselas nominales contiguas de 1 × 1 km, conjunto 2 × 2 km; la extensión realmente ocupada por puntos puede ser menor.
**Puntos declarados en las cabeceras:** 49.533.333.

## Datos por archivo

| Tesela | Puntos | Coordenadas X | Coordenadas Y | Z mínima–máxima (m) |
|---|---:|---|---|---|
| 295498 | 12,831,942 | 295000.00–296000.00 | 4498000.00–4499000.00 | -0.646–54.157 |
| 295499 | 3,799,010 | 295084.72–296000.00 | 4499000.00–4500000.00 | 22.087–59.532 |
| 296498 | 6,156,759 | 296000.00–297000.00 | 4498321.84–4499000.00 | -3.990–49.763 |
| 296499 | 26,745,622 | 296000.00–297000.00 | 4499000.00–4500000.00 | -2.883–50.029 |

## Geometría de los monumentos

Los seis puntos proceden de la base documental previa (georreferenciaciones aproximadas de monumentos o centros de espacios). Estas posiciones intersectan las envolventes declaradas de las teselas. Eso **no** acredita que haya retornos LiDAR sobre todos ellos.

## Alcance y limitaciones

- Las cotas Z de cabecera son extremos brutos y pueden contener árboles, edificios, agua o ruido. No son un modelo digital del terreno (MDT).
- No se ha descomprimido la nube de puntos, por no estar disponible en este entorno la biblioteca LAZ (lazrs/LASzip/PDAL). Por tanto NO hay elevaciones locales verificadas ni curvas de nivel calculadas.
- Hasta descomprimir, no podemos saber la densidad real, clasificación de suelo ni vacíos en las teselas.
- Si se consigue un MDT GeoTIFF o una conversión LAS sin compresión, se podrá recortar y filtrar la clasificación de suelo y generar un sombreado de relieve y un terreno 3D.
- La ortofoto de fondo la facilitó el usuario; la fecha del vuelo no se ha corroborado con metadatos.

## Contexto histórico documental

Noèlia Borràs Matamoros, *La nova i reial població de Sant Carles de la Ràpita (1780–1794)*, Universitat Rovira i Virgili (2013), págs. 223–233. La tesis explica el espacio de la plaza como salón alargado con una exedra meridional; destaca que las estatuas propuestas no se llegaron a colocar y que el plano de 1852 muestra una ampliación posterior, que no debe confundirse con el estado de 1800. La tesis incluye una reconstrucción ideal, pero no un levantamiento planimétrico original del XVIII.
