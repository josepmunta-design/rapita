// Revisió del 09/11/2026 · Nou registre del plànol de 1748 (Lloc i Torre de la Ràpita) amb punts de control.
// L'ajust anterior (0,101 m/px, 161°, ancoratge únic a la torre) era visual i sense residus. Ara la transformació de
// semblança s'ajusta a tres testimonis que es conserven:
//  1. Bateria: el mercat municipal s'hi va construir a sobre i en conserva el front corbat al SE. El cercle del mur
//     corbat a l'ortofoto ICGC 2024 (6 punts, residu ≤ 0,36 m) té centre (296438,30; 4499168,39) i R 16,0 m; l'eix del
//     mercat té azimut 130,9°. Al redibuix, el parapet de H té centre (444, 409) px i radi 125 px.
//  2. Camí arbrat i pou G: el camí al peu del cantell coincideix amb l'eix de l'actual carrer del Pou de les Figueretes
//     (5 punts entre els píxels 840 i 600, residus 0,4–1,4 m), i el pou G hi cau a sobre.
//  3. Validació independent: la traça del peu del cantell segueix l'escarpament del MDT LiDAR 2021–2023 al nord de la
//     bateria i envolta el morro del mercat.
// Escala fixada per la bateria (radi del parapet 125 px ↔ mig ample 14,85 m del mercat) = 0,119 m/px; gir i translació
// per mínims quadrats. Idempotent.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const plan=await json('data/plan-1748.json');
const PREVIOUS={method:'Ajust visual de treball: 0,101 m/px, rotació 161°, ancoratge únic a la Torre del model.',anchorPixel:[879,443],anchorUTM:[296389,4499194],metersPerPixel:.101,rotationDegrees:161};
Object.assign(plan.georeference,{
  method:'Transformació de semblança ajustada el 09/11/2026 a testimonis conservats: front corbat de la bateria sota el mercat municipal (ortofoto ICGC 2024: centre i eix), camí arbrat i pou G sobre l’eix de l’actual carrer del Pou de les Figueretes (topogràfic ICGC 1:1.000) i, com a validació, l’escarpament del MDT LiDAR. Escala 0,119 m/px fixada pel parapet de la bateria; gir i translació per mínims quadrats.',
  anchorPixel:[444,409],anchorUTM:[296438.718,4499168.728],metersPerPixel:.119,rotationDegrees:138.689,offsetMeters:[0,0],precisionMeters:3,
  controlPoints:{batteryCentre:{pixel:[444,409],utm:[296438.3,4499168.39],residualMeters:.53},batteryAxisAzimuthDegrees:130.9,
    pathOnCarrerPouFigueretes:{pixels:[[840,588],[780,576],[723,567],[660,570],[600,585]],residualsMeters:[.9,.4,.7,1.4,.4]}},
  confidence:'B',previous:PREVIOUS,revision:'2026-11-09',
  limits:'Redibuix interpretatiu, no l’original de 1748; la barra d’escala del redibuix no s’utilitza. El plànol és un projecte: només els edificis en rosa existien el 1748. Les obres projectades (H–O) no es donen per executades.'});
await save('data/plan-1748.json',plan);await save('public/data/plan-1748.json',plan);
console.log('Plànol de 1748 registrat: 0,119 m/px, 138,69°');
