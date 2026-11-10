// Revisió del 08/11/2026 (3) · Encaix dels edificis amb el mapa topogràfic actual de l'ICGC (1:1.000).
// La plaça de Carles III, el semicercle de les cases rodones, el Cóc i les illes que les envolten conserven el traçat
// de 1780–1794. Les mesures s'han pres sobre docs/sources/nucleo-topografico.jpg (3 px/m) girat al marc de la població
// (azimut 19°): vegeu docs/1800-1900/ENCAIX-ICGC-20261108.md. Idempotent: tots els valors són constants d'aquest fitxer.
import {readFile,writeFile} from 'node:fs/promises';
import {alignGypsumToInn} from '../src/coastal-buildings.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const housing=await json('data/housing-1794.json'),center=await json('data/center-1794.json'),urban=await json('data/urban-fabric.json'),lit=await json('data/littoral-1800.json');
const frame=housing.townFrame,r=frame.alongAzimuthDegrees*Math.PI/180;
const utm=(a,l)=>[+(frame.easting+a*Math.cos(r)+l*Math.sin(r)).toFixed(3),+(frame.northing-a*Math.sin(r)+l*Math.cos(r)).toFixed(3)];
const town=([e,n])=>{const x=e-frame.easting,y=n-frame.northing;return[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];};

// Línies de façana mesurades al mapa actual (marc local, m). Totes amb ±0,5 m de lectura del ràster.
const M={
  westNorth:-28.5,   // illa del nord-oest (Ajuntament), along 8,5–79
  westSouth:-31,     // illa entre el carrer de la Constància i el del Rosari, along −56,7 a −7,5
  church:-31.5,      // Santíssima Trinitat, entre el carrer del Rosari (−62,5 a −56,7) i el de l'Aurora (−81,8 a −80,5)
  westPorxos:-32.3,  // illa entre el carrer de l'Aurora i el semicercle
  eastMid:20,        // illa entre el Cóc i el carrer de l'Arsenal, along −58,2 a −16,3
  eastSouth:18.5,    // illa entre el carrer de l'Arsenal i el semicercle, along −140 a −63,5
  eastNorth:22.5,    // illa entre el Cóc i el carrer de Talavera, along 15,2–102
  exedra:{across:-6.9,along:-108.8,radius:25.4,gap:10.3}// ajust per mínims quadrats a 14 punts de façana (residu < 0,55 m)
};
const L=housing.layout;
const [wn,em,en]=L.finishedRows;
Object.assign(wn,{across:M.westNorth-5.5,startAlong:12,spacing:5,actualMap20261108:'Façana a la línia actual del costat oest (−28,5 m), des de la cantonada del carrer de la Constància.'});
const emWidth=+((58.2-16.3)/9).toFixed(3);
Object.assign(em,{across:M.eastMid+4,startAlong:+(-16.3-emWidth/2).toFixed(3),spacing:-emWidth,width:emWidth,actualMap20261108:'Les nou cases omplen l’illa actual entre el Cóc i el carrer de l’Arsenal (41,9 m): front de 4,66 m, dins del «frente aproximado 5 m» de H02.'});
Object.assign(en,{across:M.eastNorth+5.5});
Object.assign(L.coveredRow,{across:M.westSouth-5.5,startAlong:-54.2,spacing:5,actualMap20261108:'Set cases des del carrer del Rosari (cantonada de l’església) cap al nord; els 14 m de la cantonada de la Constància queden sense casa reial (propietats privades no individualitzades).'});
Object.assign(L.porticoRow,{across:M.westPorxos-5.5,startAlong:-105,spacing:6.5,actualMap20261108:'Les quatre porxades omplen l’illa actual entre el carrer de l’Aurora i el semicercle (26 m = 4 × 6,5 m).'});
Object.assign(L.exedra,{across:M.exedra.across,along:M.exedra.along,innerRadius:M.exedra.radius,gap:M.exedra.gap,
  actualMap20261108:'Centre, radi i pas del carrer de la Pau ajustats al semicercle actual de la plaça (14 punts de façana, residu < 0,55 m). Substitueix el reajust relacional anterior (−2, −118; R 23 m; pas 8 m).'});
Object.assign(L.manzana,{across:-63.5,along:105.5,acrossLength:73,alongLength:42,actualMap20261108:'Illa actual entre els carrers de Sant Antoni, Sant Tomàs, Sant Joaquim i la plaça (73 × 42 m; H02: «aproximadament 80 × 40»).'});
// Cases petites: el tercer grup quedava damunt del Cóc i de la duana. Es col·loca al cap de la baixada de Sant Francesc,
// a l'illa actual del costat sud, amb la façana al carrer; el segon grup baixa 5 m perquè no ocupi el carrer de l'Arsenal.
const small=L.coastalHouses;
const c3=small.filter(p=>p.cluster===3);c3.forEach((p,i)=>{p.anchor=utm(101.2+i*4.45,-19.5);p.frontAzimuthDegrees=frame.alongAzimuthDegrees;p.actualMap20261108='Baixada de Sant Francesc, costat sud.';});
small.filter(p=>p.cluster===2).forEach((p,i)=>{p.anchor=utm(97.25,-79.2-i*5.44);p.actualMap20261108='Illa al sud del carrer de l’Arsenal (abans damunt del carrer).';});
small.filter(p=>p.cluster===1).forEach((p,i)=>{p.anchor=utm([119.65,120.43,121.2,121.98][i],[-46.68,-51.86,-57.03,-62.2][i]);p.actualMap20261108='Illa del carrer de l’Om, +5 m cap al nord perquè la quarta casa no ocupi el carrer.';});
housing.actualMapRevision={date:'2026-11-08',source:'ICGC, mapa topogràfic 1:1.000 (docs/sources/nucleo-topografico.jpg) i ortofoto 2024',method:'Línies de façana mesurades sobre el ràster girat al marc de la població',doc:'docs/1800-1900/ENCAIX-ICGC-20261108.md'};

const site=id=>center.sites.find(s=>s.id===id);
Object.assign(site('sant-elm'),{across:M.church-12.5,along:-71.5,actualMap20261108:'Al solar de l’actual Santíssima Trinitat: façana a la plaça, carrer del Rosari a la dreta (mirant-la) i carrer de l’Aurora a l’esquerra.'});
Object.assign(site('placa-coberta'),{across:M.eastSouth+8.5,along:-72.25,actualMap20261108:'Simètrica a l’església, a la cantonada sud del carrer de l’Arsenal.'});
// Fonts al peu de les porxades i del tinglado, just abans d'on comença el semicercle (N112 p.210: «entre la font i el carrer»).
Object.assign(site('font-oest'),{across:M.westPorxos+1.6,along:-106.2});
Object.assign(site('font-est'),{across:M.eastSouth-1.6,along:-106.2});
// Fonda Nova i cases de Talavera: les plantes en U del croquis es conserven; es traslladen en bloc fins a la façana actual
// de la plaça (22,5 m) i el límit del Cóc (along 15,2).
for(const[id,dA,dL]of[['fonda-nova',-5.5,9.5],['cases-talavera',-5.5,2.5]]){
  const s=site(id),baseA=s.across-(s.layoutShiftAcross??0),baseL=s.along-(s.layoutShiftAlong??0);
  s.layoutShiftAcross=-6+dA;s.layoutShiftAlong=dL;s.across=baseA+s.layoutShiftAcross;s.along=baseL+s.layoutShiftAlong;
  s.actualMap20261108='Planta del croquis desplaçada en bloc a la línia actual de la plaça (22,5 m) i del Cóc.';
}
// Duana nova: solar núm. 6 de 1868 = illa actual entre el carreró (oest, across 60–64,5), el Cóc (nord), la Plaça Vella i
// la casa Ribera (sud) i el pati del segrest (est). 30,5 × 17 m = 518 m² (escriptura: 520,555 m²).
Object.assign(site('duana-nova'),{across:79.75,along:-30.5,width:30.5,depth:17,
  actualMap20261108:'Illa actual entre el carreró (oest), el Cóc (nord) i la Plaça Vella (sud): 30,5 × 17 m = 518 m², com els 520,555 m² de la subhasta de 1868. L’anterior posició (across 48,5) quedava a l’oest del carreró.'});
Object.assign(site('casa-white'),{across:104,along:14,width:26,depth:20,
  actualMap20261108:'«El de l’esquerra» baixant per Sant Francesc, enfront de la duana i amb la mateixa superfície (520 m², «idèntic»); el límit de llevant respecta el carrer del Rampar: illa actual al nord del carrer de Sant Francesc, que s’allarga cap a l’actual plaça de Francesc Moragas.'});
const ps=center.publicSpace;
Object.assign(ps.plaza,{axis:-5,halfWidth:25.5,north:100,south:M.exedra.along,exedraAcross:M.exedra.across,exedraRadius:M.exedra.radius,passage:{across:-8,halfWidth:5,south:-150}});
Object.assign(ps.trees,{across:[-16,6],south:-100,north:95});

// Eix de la plaça: el carrer principal passa pel centre real (−5 m) i surt pel pas del carrer de la Pau (−8 m).
urban.routes.find(r=>r.id==='carrer-major').townPoints=[[-8,-116],[-6.9,-100],[-5,10],[-2.5,165]];
const t=urban.sites.find(s=>s.id==='tinglado');
t.utmAnchor=utm(M.eastSouth+5,-94);t.actualMap20261108='Entre la plaça coberta i la font de llevant, amb la façana a la línia actual (18,5 m).';
urban.sites.find(s=>s.id==='pati-mancana').townAnchor=[-63.5,105.5];// pati de la Mançana, solidari amb l'illa
// Petits cossos de servei: desplaçament mínim (≤ 13 m) fins a l'illa actual més propera, sense canviar mides.
const adm=urban.sites.find(s=>s.id==='casa-administrador');adm.townAnchor=[100,78];adm.actualMap20261108='Abans [99, 84], damunt del carrer del Pilar.';
const inn=lit.sites.find(s=>s.id==='old-inn');inn.anchor=utm(100,-58);inn.actualMap20261108='Abans damunt del carrer de la Mare de Déu de Montserrat (across 132,5; along −71,7). Nova posició: illa actual més propera que deixa lliures la baixada del Cóc al port (rampa-sud), les cases petites i la duana antiga; 35 m cap a ponent, C.';
// El forn i molí de guix continua afrontant al nord de la Fonda Vella (N112 p.211).
alignGypsumToInn(urban,lit).actualMap20261108='Segueix la Fonda Vella; abans al mig del carrer de la Mare de Déu de Montserrat.';

await save('data/housing-1794.json',housing);await save('data/center-1794.json',center);await save('data/urban-fabric.json',urban);await save('data/littoral-1800.json',lit);
console.log('Encaix ICGC aplicat');
