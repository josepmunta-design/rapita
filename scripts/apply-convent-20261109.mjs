// Revisió del 09/11/2026 · Capella del convent de les monges santjoanistes al Carreró / Passatge del Convent.
// Testimonis:
//  · Restes conservades (BCIL «Restes del Reial Monestir de Nostra Senyora», Passatge del Convent; Pobles de Catalunya,
//    fitxa 18369, 40,619122 N 0,593016 E → UTM 296398,9 / 4499262,4): mur restaurat amb carreus d'un brancal de porta i
//    una espadanya, adossat a una casa moderna. Castillosricsol: «Muro del monasterio que da a la c/ del Convento. Se
//    observa una puerta con arco escarzano y una pequeña espadaña.»
//  · El punt cau just a la línia de façana actual del costat de llevant del carreró (across 40,8–42,2 m al topogràfic
//    ICGC) i a 9 m de la capella C del plànol de 1748 registrat amb punts de control (09/11/2026).
//  · N112 p.215: el tinglado de la plaça es feia «davant de la capella del convent, a tocar de les cases rodones».
//  · Informe d'abril de 1785 (Borràs 2014, p.187–188): capella «estrecha, baja de techo, mojarse cuando llueve,
//    denegrida y húmeda», amb «hedor… por haber enterrado en ella algunos cadáveres»; amb vent no es podia dir missa amb
//    la porta oberta i tancada no hi cabia la gent.
// Mides C: nau única de 5,5 × 11 m i 5,2 m d'alçària. Idempotent.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const urban=await json('data/urban-fabric.json'),links=await json('data/dossier-model-links.json');
const FACADE_ACROSS=41,ALONG=-93.6,W=5.5,L=11;
const remainsUTM=[296398.9,4499262.4];
let s=urban.sites.find(x=>x.id==='esglesia-convent');
if(!s){s={id:'esglesia-convent'};urban.sites.splice(urban.sites.findIndex(x=>x.id==='capella-1748')+1,0,s);}
Object.assign(s,{name:'Capella del convent de les monges',kind:'convent-chapel',fromYear:1778,townAnchor:[FACADE_ACROSS+L/2,ALONG],alongAzimuthDegrees:109,width:W,depth:L,height:5.2,
  remainsUTM,remains:'Mur del carrer amb porta d’arc escarser, brancal de carreus i petita espadanya (BCIL, Passatge del Convent).',
  evidence:'Restes conservades al Passatge / Carreró del Convent (BCIL; Pobles de Catalunya 18369; foto de castillosricsol): porta d’arc escarser i espadanya al mur del carrer. Capella C del plànol de 1748. N112 p.215: el tinglado era davant de la capella del convent. Informe de 1785: capella estreta, baixa, humida i amb enterraments a dins.',
  limits:'La façana segueix la línia del carrer al punt de les restes; mida de la nau, alçària, coberta i finestres C. No es reconstrueix el claustre ni la resta del monestir medieval.',
  positionSource:{text:'Coordenades de l’inventari (40,619122 N, 0,593016 E) i línia de façana actual del topogràfic ICGC 1:1.000. A 9 m de la capella C del plànol de 1748 registrat.',precisionMeters:3},geometryConfidence:'C'});
const c=urban.sites.find(x=>x.id==='capella-1748');
Object.assign(c,{toYear:1777,replacedBy:'esglesia-convent',replacementNote:'La capella C del plànol de 1748 és la mateixa capella del convent; des del 09/11/2026 es dibuixa a la posició de les restes conservades (9 m de diferència, dins la tolerància del redibuix).'});
links.overrides??={};links.overrides['capella-convent']=['esglesia-convent','capella-1748'];
links.modelNotes??={};links.modelNotes['capella-convent']='Revisió 09/11/2026: la capella es col·loca al punt de les restes conservades del Passatge / Carreró del Convent (BCIL, poblesdecatalunya.cat element 18369; mur amb porta d’arc escarser i espadanya), a la línia de façana actual i davant del tinglado (N112 p.215). La capella C del plànol de 1748 registrat queda a 9 m. Nau de 5,5 × 11 m, baixa i humida segons l’informe de 1785; mides C.';
// Els expedients només admeten fonts de l'inventari local amb empremta: les referències web (fitxa BCIL 18369,
// castillosricsol) i la tesi de Borràs (2014) es citen a l'evidència del model i a docs/1800-1900/ROQUER-20261109.md.
const research=await json('data/building-research.json'),entity=research.entities.find(e=>e.id==='capella-convent');
entity.facts=entity.facts.filter(f=>!f.references.some(r=>['WEB-PDC-18369','WEB-CASTILLOSRICSOL','BORRAS2014'].includes(r.sourceId)));
await save('data/building-research.json',research);
await save('data/urban-fabric.json',urban);await save('data/dossier-model-links.json',links);
console.log('Capella del convent col·locada a les restes del carreró');
