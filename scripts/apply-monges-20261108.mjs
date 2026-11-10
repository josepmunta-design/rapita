// Revisió del 08/11/2026 (3) · Horts de les Monges en dues fases.
// N112: abans de 1780 l'hort de les monges tenia tres jornals (queixa de 1796); el 1781 les obres de la bateria i de la
// rampa llarga en van prendre la part del roquer i el recinte quedà reduït entre el carrer de la Mare de Déu de la Ràpita,
// el de l'Arsenal i la rampa (actual carrer del Pou de les Figueretes). Jornal de Tortosa = 2.190 m² → 3 jornals = 6.570 m².
// Polígons C dibuixats sobre el mapa topogràfic actual (ICGC 1:1.000) seguint les vores que conserva el parcel·lari.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const urban=await json('data/urban-fabric.json'),housing=await json('data/housing-1794.json'),pilar=await json('data/pilar-reverte.json'),lit=await json('data/littoral-1800.json');
const frame=housing.townFrame,r=frame.alongAzimuthDegrees*Math.PI/180;
const local=([e,n])=>{const x=e-frame.easting,y=n-frame.northing;return[x*Math.cos(r)-y*Math.sin(r),x*Math.sin(r)+y*Math.cos(r)];};
const area=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
// Vora de ponent: 4,5 m a llevant de l'eix de la rampa llarga (registre del plànol de 1748 del 09/11/2026), perquè
// l'hort no toqui ni el camí ni el seu mur de contenció.
const westEdge=[[296476,4499166.1],[296468.4,4499176],[296459.8,4499184.4],[296456,4499196.1],[296449.8,4499200.1],[296440.1,4499201],[296434.5,4499203.9],[296429.3,4499208],[296425.3,4499212.9],[296421.3,4499218],[296420.4,4499226.6],[296421.7,4499232.5]];
const reduced=[[296425,4499240],[296457,4499237.5],[296463,4499228],[296466,4499208],[296505,4499204],[296498,4499170],...westEdge];
const original=[[296424,4499244],[296456,4499243],[296468,4499244],[296520,4499244],[296526,4499214],[296506,4499168],...westEdge];
const geometry=P=>{const L=P.map(local),xs=L.map(p=>p[0]),ys=L.map(p=>p[1]),c=[P.reduce((s,p)=>s+p[0],0)/P.length,P.reduce((s,p)=>s+p[1],0)/P.length];
  return{utmAnchor:c.map(v=>+v.toFixed(3)),width:+(Math.max(...xs)-Math.min(...xs)).toFixed(2),depth:+(Math.max(...ys)-Math.min(...ys)).toFixed(2),polygonUTM:P,areaM2:Math.round(area(P))};};
const hort=urban.sites.find(s=>s.id==='hort-monges');
const before={townPolygon:hort.townPolygon??hort.previousTownPolygon,townAnchor:hort.townAnchor??hort.previousTownAnchor};
for(const k of['townPolygon','townAnchor'])delete hort[k];
Object.assign(hort,{fromYear:1781,...geometry(reduced),previousTownPolygon:before.townPolygon,previousTownAnchor:before.townAnchor,revisedPolygon20261108:true,
  evidence:'N112: hort de les monges reduït després de les obres de la bateria i de la rampa llarga (1780–1781); la queixa de 1796 recorda els tres jornals originals. Recinte C entre els carrers actuals de la Mare de Déu de la Ràpita, de l’Arsenal i del Pou de les Figueretes.',
  layoutSource:'Mapa topogràfic ICGC 1:1.000 (vores conservades al parcel·lari) i N112; revisió 08/11/2026',geometryConfidence:'C'});
let early=urban.sites.find(s=>s.id==='hort-monges-1778');
if(!early){early={id:'hort-monges-1778'};urban.sites.splice(urban.sites.indexOf(hort)+1,0,early);}
Object.assign(early,{name:'Horts de les Monges · tres jornals (abans de 1781)',kind:'garden',fromYear:1778,toYear:1780,height:1,...geometry(original),revisedPolygon20261108:true,
  evidence:'Queixa de 1796 (N112): l’hort tenia tres jornals abans de les obres. 3 jornals de Tortosa = 6.570 m²; el polígon C en fa uns 5.900 i arriba fins al roquer de la costa («raconada del roquer… on batia la mar»).',
  layoutSource:'Mapa topogràfic ICGC 1:1.000 i N112; revisió 08/11/2026',geometryConfidence:'C'});
// La segona figuera de PR01 quedava fora del recinte reduït: es desplaça 8 m dins de l'hort.
for(const g of[pilar.garden,lit.researchLandscape?.garden])if(g)g.figs[1]=[296445,4499205];
await save('data/urban-fabric.json',urban);await save('data/pilar-reverte.json',pilar);await save('data/littoral-1800.json',lit);
console.log('Horts de les Monges:',hort.areaM2,'m² (1781–) ·',early.areaM2,'m² (1778–1780)');
