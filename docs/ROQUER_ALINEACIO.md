# Ajust espacial del Roquer al redibuix de 1748

Revisió: **09/11/2026** (registre amb punts de control conservats). Taula generada dels mateixos JSON que consumeix el visor. Coordenades EPSG:25831 del model; no són punts històrics mesurats.

[Comparació gràfica del calc i la planta nord](ROQUER_ALINEACIO.png) · [Expedients](EDIFICIS/INDEX.md)

## Transformació compartida

Imatge de 1448 × 1086 px; ancoratge (879, 443) → E 296389 / N 4499194 m; escala de treball 0,101 m/px; gir 161°. La costa, els murs i les plantes fan servir la mateixa fórmula que la superposició. Cap desplaçament individual de la capella. ±15 m és una tolerància d’assaig, sense punts independents ni RMSE mesurat. La barra d’escala del redibuix no calibra el model.

## Plantes i posicions actuals

| Lletra | Model | E (m) | N (m) | Lectura |
|---|---|---:|---:|---|
| A | `tower` | 296402.613 | 4499206.242 | Preexistència traçada; alçat C |
| G | `well` | 296426.192 | 4499204.768 | Preexistència traçada; alçat C |
| B | `hostal-1748` | 296401.911 | 4499214.186 | Preexistència traçada; alçat C |
| C | `capella-1748` | 296404.186 | 4499251.159 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748` | 296410.741 | 4499238.428 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748` | 296415.438 | 4499245.350 | Preexistència traçada; alçat C |
| F | `corral-1748-1` | 296408.044 | 4499222.381 | Preexistència traçada; alçat C |
| F | `corral-1748-2` | 296405.039 | 4499236.402 | Preexistència traçada; alçat C |
| F | `mur-roquer-1748` | 296413.032 | 4499222.723 | Preexistència traçada; alçat C |
| F | `mur-nord-1748` | 296398.425 | 4499214.311 | Preexistència traçada; alçat C |
| A–G | `muralla-meseta-1748` | 296434.579 | 4499153.407 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748-2` | 296406.216 | 4499244.861 | Preexistència traçada; alçat C |
| D | `cuartel-caballeria-1748-3` | 296413.874 | 4499241.497 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748-2` | 296409.521 | 4499247.540 | Preexistència traçada; alçat C |
| E | `cuartel-infanteria-1748-3` | 296412.554 | 4499250.856 | Preexistència traçada; alçat C |
| F | `corral-1748-3` | 296398.547 | 4499239.560 | Preexistència traçada; alçat C |
| H | `project-1748-battery` | 296440.379 | 4499168.773 | Projecte de 1748 |
| I | `project-1748-cistern` | 296428.639 | 4499178.140 | Projecte de 1748 |
| K | `project-1748-powder` | 296416.369 | 4499181.874 | Projecte de 1748 |
| L | `project-1748-guard` | 296410.128 | 4499187.122 | Projecte de 1748 |
| M | `project-1748-officer` | 296408.728 | 4499191.838 | Projecte de 1748 |
| N | `project-1748-governor` | 296402.525 | 4499193.883 | Projecte de 1748 |
| O | `project-1748-tower` | 296404.155 | 4499204.570 | Projecte de 1748 |

Les tres peces D i les tres E substitueixen els dos rectangles agregats; els tres corrals F queden diferenciats. Els murs segueixen els seus vèrtexs, inclosos els tres ressalts de la meseta. Alçàries i cobertes C.

## Costa i fases

48 vèrtexs segueixen el peu del cantell, incloent l’entrant al costat de la bateria. Els plecs no es reordenen per nord: la làmina de mar i el tall del terreny comparteixen la mateixa polilínia. Els enllaços amb el litoral general continuen sent C. No és una línia de marees mesurada.

H–O són projectes, disponibles a **Litoral → Obres projectades el 1748**. La consulta en daurat oculta temporalment la bateria posterior. El botó **Roquer en planta · ajust de 1748** enfoca el conjunt des de dalt. La bateria parcial posterior manté T-6/8, vuit canons previstos i sis peces de 1794; només s’alineen centre i eix amb el sector H. No s’identifiquen els dos projectes.

La cisterna i les dependències posteriors s’ajusten al sector funcional corresponent com a hipòtesis. El forn, la Fonda Vella, la duana antiga i Sanitat no tenen una correspondència individual acreditada amb una lletra del dibuix i mantenen la seva atribució separada; l’hostal B no es converteix en la Fonda Vella dels Lantí.

## Compatibilitat amb el poble

El semicercle complet dels deu porxos es mou 1 m cap a ponent; radis, pas central, estats i inventari es mantenen. Les tres fileres de cases petites es mouen 4 m cap a l’interior i 9 m cap al nord del marc del poble per quedar fora de l’aigua i la rampa. Són ajustos relatius d’assaig, no parcel·les validades.

## Regeneració i comprovació

`npm.cmd run data:roquer` reconstrueix plantes, dades del mapa, notes, ubicacions, snapshots i catàleg del visor. `python scripts/render-roquer-check.py` regenera la figura de comprovació. `python scripts/validate-building-dossiers.py` exigeix que cada snapshot, ancoratge i planta documental coincideixi amb el fitxer viu. Els originals aportats i el MDT mesurat es conserven.
