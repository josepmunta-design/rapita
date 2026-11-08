# Correccion del puerto y las cuevas - 1 noviembre 2026

Las capturas originales se registraron contra las ortofotos oficiales ICGC en EPSG:25831. El recuadro comun es E 295500-297700 / N 4498000-4500000 m, 1320 x 1200 px. Las trazas, puntos de control y residuos estan en data/harbour-traces.json, data/harbour-registration.json y public/data/harbour-history.json. La precision del registro no equivale a precision de levantamiento de cada contorno manual ni de las cotas.

| Captura | Puntos coincidentes | RMSE del ajuste |
|---|---:|---:|
| 1945-1946 | 2712 | 0,84 m |
| 1957 | 1906 | 1,13 m |
| 1983 (capa 1983-1989) | 1860 | 1,21 m |
| 1990.png (en realidad 1993) | 2792 | 0,97 m |

Para la fase de 1990 se utiliza directamente la ortofoto oficial de 1990, sin atribuirle la captura de 1993. Los rellenos se conservan al avanzar de fase. El nivel tecnico del agua permanece fijo.

La Companyia queda anclada en E 296840 / N 4499555 m y conserva su aparicion en 1857, segun la aclaracion del usuario. La ribera inicial y su expediente se han corregido.

Las tres cavidades se distribuyen a lo largo del cantil, con galerias laterales, techo continuo y fondos cerrados. Las superficies auxiliares de los muros no rellenan los huecos. Se mantiene la consideracion C de la geometria.

Las cinco mallas del puerto se preparan con node scripts/bake-harbour.mjs (3,54 MB en total), se cargan una vez y se reutilizan. No se reconstruye el territorio al cambiar el ano. Comprobacion en Edge aislado: sin errores de pagina; ejecucion del cambio de fase aproximadamente 3-10 ms, sin contar el dibujo de la GPU. 78 pruebas correctas, compilacion correcta y validacion de 122 expedientes correcta.

Las referencias fotograficas y las capturas originales se conservan. No se modifican los binarios de elevacion originales. Para regenerar los contornos, scripts/prepare-harbour.py necesita Pillow y shapely; toma las imagenes retenidas en public/data/reference/port y los controles guardados en data.
