# Ajust espacial del Roquer al redibuix de 1748

Revisió: **31/10/2026**. Taula generada dels mateixos JSON que consumeix el visor. Coordenades EPSG:25831 del model; no són punts històrics mesurats.

[Comparació gràfica del calc i la planta nord](ROQUER_ALINEACIO.png) · [Expedients](EDIFICIS/INDEX.md)

## Transformació compartida

Imatge de 1448 × 1086 px; ancoratge (879, 443) → E 296389 / N 4499194 m; escala de treball 0,101 m/px; gir 161°. La costa, els murs i les plantes fan servir la mateixa fórmula que la superposició. Cap desplaçament individual de la capella. ±15 m és una tolerància d’assaig, sense punts independents ni RMSE mesurat. La barra d’escala del redibuix no calibra el model.

## Plantes i posicions actuals

| Lletra | Model | E (m) | N (m) | Lectura |
|---|---|---:|---:|---|
| A | `tower` | 296388.987 | 4499194.272 | Preexistència traçada; alçat C |
| G | `well` | 296407.975 | 4499200.712 | Preexistència traçada; alçat C |
| B | `hostal-1748` | 296385.876 | 4499200.283 | Preexistència traçada; alçat C |
| C | `capella-1748` | 296375.749 | 4499230.048 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748` | 296384.998 | 4499222.163 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748` | 296386.456 | 4499229.112 | Preexistència traçada; alçat C |
| F | `corral-1748-1` | 296388.051 | 4499208.694 | Preexistència traçada; alçat C |
| F | `corral-1748-2` | 296381.174 | 4499218.735 | Preexistència traçada; alçat C |
| F | `mur-roquer-1748` | 296391.857 | 4499210.570 | Preexistència traçada; alçat C |
| F | `mur-nord-1748` | 296383.098 | 4499199.258 | Preexistència traçada; alçat C |
| A–G | `muralla-meseta-1748` | 296431.110 | 4499163.086 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748-2` | 296379.372 | 4499225.756 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748-3` | 296386.469 | 4499225.582 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748-2` | 296381.104 | 4499228.925 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748-3` | 296382.417 | 4499232.505 | Preexistència traçada; alçat C |
| F | `corral-1748-3` | 296375.058 | 4499219.123 | Preexistència traçada; alçat C |
| H | `project-1748-battery` | 296430.713 | 4499177.020 | Projecte de 1748 |
| I | `project-1748-cistern` | 296418.477 | 4499180.592 | Projecte de 1748 |
| K | `project-1748-powder` | 296407.639 | 4499179.571 | Projecte de 1748 |
| L | `project-1748-guard` | 296401.048 | 4499181.680 | Projecte de 1748 |
| M | `project-1748-officer` | 296398.429 | 4499184.932 | Projecte de 1748 |
| N | `project-1748-governor` | 296392.899 | 4499184.539 | Projecte de 1748 |
| O | `project-1748-tower` | 296390.735 | 4499193.456 | Projecte de 1748 |

Les tres peces D i les tres E substitueixen els dos rectangles agregats; els tres corrals F queden diferenciats. Els murs segueixen els seus vèrtexs, inclosos els tres ressalts de la meseta. Alçàries i cobertes C.

## Costa i fases

48 vèrtexs segueixen el peu del cantell, incloent l’entrant al costat de la bateria. Els plecs no es reordenen per nord: la làmina de mar i el tall del terreny comparteixen la mateixa polilínia. Els enllaços amb el litoral general continuen sent C. No és una línia de marees mesurada.

H–O són projectes, disponibles a **Litoral → Obres projectades el 1748**. La consulta en daurat oculta temporalment la bateria posterior. El botó **Roquer en planta · ajust de 1748** enfoca el conjunt des de dalt. La bateria parcial posterior manté T-6/8, vuit canons previstos i sis peces de 1794; només s’alineen centre i eix amb el sector H. No s’identifiquen els dos projectes.

La cisterna i les dependències posteriors s’ajusten al sector funcional corresponent com a hipòtesis. El forn, la Fonda Vella, la duana antiga i Sanitat no tenen una correspondència individual acreditada amb una lletra del dibuix i mantenen la seva atribució separada; l’hostal B no es converteix en la Fonda Vella dels Lantí.

## Compatibilitat amb el poble

El semicercle complet dels deu porxos es mou 1 m cap a ponent; radis, pas central, estats i inventari es mantenen. Les tres fileres de cases petites es mouen 4 m cap a l’interior i 9 m cap al nord del marc del poble per quedar fora de l’aigua i la rampa. Són ajustos relatius d’assaig, no parcel·les validades.

## Regeneració i comprovació

`npm.cmd run data:roquer` reconstrueix plantes, dades del mapa, notes, ubicacions, snapshots i catàleg del visor. `python scripts/render-roquer-check.py` regenera la figura de comprovació. `python scripts/validate-building-dossiers.py` exigeix que cada snapshot, ancoratge i planta documental coincideixi amb el fitxer viu. Els originals aportats i el MDT mesurat es conserven.
