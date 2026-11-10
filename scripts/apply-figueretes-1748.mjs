// Revisió del 08/11/2026 · Rampa llarga i Pou de les Figueretes.
// El redibuix del plànol de 1748 dibuixa el camí al peu del cantell amb una filera d'arbres a cada costat i el pou G
// al mig del camí; la fotografia PR01-06/07 mostra el brocal traslladat al mig d'una rampa. N112 art.23 (p.221):
// la rampa llarga «baixava al mar vorejant la bateria», documentada abans de 1780, millorada i reforçada amb mur
// de contenció en tota la llargada. Idempotent: tots els punts deriven dels píxels del redibuix i del registre comú.
import {readFile,writeFile} from 'node:fs/promises';
import {planPixelToUTM} from '../src/plan1748-layout.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const plan=await json('data/plan-1748.json'),urban=await json('data/urban-fabric.json'),lit=await json('data/littoral-1800.json'),pilar=await json('data/pilar-reverte.json');
const px=p=>planPixelToUTM(p[0],p[1],plan).map(v=>+v.toFixed(3));
// Eix del camí arbrat del redibuix (píxels del full de 1448 × 1086): des del convent, pel peu del cantell i el pou G, fins a la volta del cantell.
const path1748=[[975,825],[960,760],[940,702],[912,652],[880,612],[840,588],[780,576],[723,567],[660,570],[600,585],[560,610],[530,635],[500,642]].map(px);
const well=lit.sites.find(s=>s.id==='well');
path1748[7]=well.anchor.slice(0,2);// el pou queda exactament a l'eix del camí
// Tram de 1794 vorejant la bateria fins a l'arrencada del moll gran (N112 art.23 i il·l.4, núm. 23). Revisió 08/11/2026 (3):
// segueix l'eix de l'actual carrer del Pou de les Figueretes, mesurat al mapa topogràfic ICGC 1:1.000, que voreja el
// mercat construït sobre la bateria; C.
const moll=lit.portWorks.breakwaters[1][0];
// Amb el registre del 09/11/2026 el camí de 1748 ja cau sobre aquest carrer; el tram final en continua l'eix.
const tail=[[296456,4499182],[296465,4499173],[296472,4499164],[296474,4499156],[296470,4499143],[moll[0]-1.5,moll[1]+2.5]];
const route=[...path1748,...tail];
const ramp=urban.routes.find(r=>r.id==='rampa-roquer');
Object.assign(ramp,{name:'Rampa llarga del Pou de les Figueretes',fromYear:1778,width:3.6,utmPoints:route,
  evidence:'Plànol de 1748 (redibuix): camí al peu del cantell amb una filera d’arbres a cada costat i el pou G al mig. N112 art.23 p.221: rampa llarga que baixava al moll gran vorejant la bateria, anterior a les obres i millorada amb mur de contenció en tota la llargada (fins a uns 6 m de desnivell). Revisió 08/11/2026: el traç anterior travessava la bateria i deixava el pou fora del camí.',
  positionSource:{text:'Píxels del camí arbrat al redibuix de 1748 amb la mateixa transformació que el pou G, la torre i la bateria (±15 m). Tram final fins al moll gran C.',precisionMeters:15},
  wellOnAxis:'well'});
// Mur de contenció al costat alt (dreta en el sentit de baixada), a 2,4 m de l'eix.
const offset=(line,d)=>line.map((p,i)=>{const a=line[Math.max(0,i-1)],b=line[Math.min(line.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy);return[+(p[0]+dy/L*d).toFixed(3),+(p[1]-dx/L*d).toFixed(3)];});
const wallLine=offset(route,2.4).slice(0,-1);
let wall=urban.sites.find(s=>s.id==='mur-rampa-figueretes');
if(!wall){wall={id:'mur-rampa-figueretes'};urban.sites.push(wall);}
const xs=wallLine.map(p=>p[0]),ys=wallLine.map(p=>p[1]);
Object.assign(wall,{name:'Mur de contenció de la rampa llarga',kind:'retaining-wall',fromYear:1786,utmAnchor:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],
  width:Math.max(...xs)-Math.min(...xs),depth:Math.max(...ys)-Math.min(...ys),height:2.6,thickness:1,baseWidth:1.4,retainingLinesUTM:[wallLine],
  evidence:'N112 art.23 p.221 i p.233: la rampa es reforçà amb un mur de contenció en tota la llargada, que també protegia els vianants (uns 6 m de desnivell al punt més alt). Traça paral·lela a l’eix C; alçària adaptada al terreny actual.',
  layoutSource:'Plànol de 1748 (redibuix) i N112 art.23',geometryConfidence:'C'});
// Les figueres de PR01 vorejant el camí, alternades a banda i banda com al dibuix de 1748.
const trailLine=path1748.slice(0,10);
const figs=[];
for(let i=1;i<trailLine.length-1;i++){const side=i%2?3.3:-3.3,[p]=offset([trailLine[i-1],trailLine[i],trailLine[i+1]],side).slice(1,2);if(Math.hypot(trailLine[i][0]-well.anchor[0],trailLine[i][1]-well.anchor[1])>3)figs.push(p);}
for(const target of[pilar,lit.researchLandscape]){target.trail.points=trailLine.map(p=>p.map(v=>+v.toFixed(3)));target.trail.figs=figs;target.trail.width=1.4;target.trail.note='Senda de PR01 sobre l’eix del camí arbrat de 1748; pou al mig i figueres a banda i banda. Revisió 08/11/2026.';}
for(const target of[pilar.dossiers?.['pou-figueretes'],lit.researchLandscape.dossiers?.['pou-figueretes']])if(target)target.description=['PR01 · Pou a mitja baixada, al mig del camí vorejat de figueres (fotografies PR01-06/07, brocal traslladat el 1971). El camí segueix el traç arbrat del plànol de 1748 i passa pel punt G.'];
await save('data/urban-fabric.json',urban);await save('data/littoral-1800.json',lit);await save('data/pilar-reverte.json',pilar);
console.log('Rampa llarga:',route.length,'punts; mur',wallLine.length,'punts; figueres',figs.length);
