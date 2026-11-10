// Revisió del 09/11/2026 · Murs del Roquer després del nou registre del plànol de 1748.
// 1. La muralla rosa de la meseta (1748) passa exactament per on s'aixecà el flanc SW de la bateria (1778–1781): la
//    bateria la substitueix, de manera que deixa de dibuixar-se a partir del 1780 en lloc de travessar-la.
// 2. El segon tram del mur 24 del croquis N112 il·l.4 quedava a 50–70 m a llevant de l'escarpament real i travessava la
//    rampa i els Horts de les Monges. El sosteniment en aquest tram és el mur de contenció de la rampa llarga
//    (N112 art.23: «reforçada amb un mur de contenció en tota la seva llargada»), que va al peu de l'escarpament.
//    El tram es conserva a retiredLinesUTM per a consulta. Idempotent.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const urban=await json('data/urban-fabric.json');
const muralla=urban.sites.find(s=>s.id==='muralla-meseta-1748');
Object.assign(muralla,{toYear:1779,replacedBy:'battery',replacementNote:'Amb el registre de 09/11/2026 la muralla de 1748 coincideix amb el flanc SW de la bateria; a partir del 1780 la representa la bateria.'});
const wall=urban.sites.find(s=>s.id==='paredo-poblacio');
if(wall.retainingLinesUTM.length===2){
  wall.retiredLinesUTM=[wall.retainingLinesUTM[1]];wall.retiredReferencePixels=wall.referencePixels?[wall.referencePixels[1]]:undefined;
  wall.retainingLinesUTM=[wall.retainingLinesUTM[0]];if(wall.referencePixels)wall.referencePixels=[wall.referencePixels[0]];
  const pts=wall.retainingLinesUTM.flat(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  Object.assign(wall,{utmAnchor:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],width:Math.max(...xs)-Math.min(...xs),depth:Math.max(...ys)-Math.min(...ys)});
}
wall.retiredNote='Tram dels Horts de les Monges retirat el 09/11/2026: travessava la rampa i els horts, a 50–70 m de l’escarpament del MDT. El sosteniment d’aquest tram és el mur de la rampa llarga (mur-rampa-figueretes).';
await save('data/urban-fabric.json',urban);console.log('Murs del Roquer revisats');
