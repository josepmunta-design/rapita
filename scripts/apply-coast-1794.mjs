// Revisió del 08/11/2026 · costa estimada de N112 il·l.4 i obres del canal a la zona C de N112 il·l.3.
// Idempotent: tots els valors deriven de constants d'aquest fitxer i del registre existent del croquis.
import {readFile,writeFile} from 'node:fs/promises';
import {referenceUTM} from '../src/reference-layout.mjs';
import {nearestRoute} from '../src/littoral-plan.mjs';
import {traceUTM} from '../src/plan1748-layout.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const ref=await json('data/layout-reference-1800.json'),housing=await json('data/housing-1794.json'),lit=await json('data/littoral-1800.json'),plan1748=await json('data/plan-1748.json');
const frame=housing.townFrame,utm=p=>referenceUTM(p,ref,frame);
const round=p=>p.map(v=>+v.toFixed(3));

// 1. Línia punteada «Línia de costa estimada» de N112 il·l.4, llegida punt a punt (N→S) al full de 572 × 736 px.
ref.estimatedCoast=[[483.3,318.3],[450,340],[416,364],[396,384],[376,410],[355,457.5],[321,522.5]];
ref.estimatedCoastNote='Línia punteada de la llegenda «Línia de costa estimada». La línia discontínua 24 és el mur de contenció: es conserva a «shore» com a peu de l’escarpament, no com a vora d’aigua.';
// Dàrsena gran: els dos molls en L del croquis i la costa estimada com a costat de terra.
ref.breakwaters=[[[411,370],[479,390],[456,448]],[[295,524],[419,566],[439,509]]];
ref.largeBasin=[[396,384],[411,370],[479,390],[456,448],[439,509],[419,566],[318,532],[321,522.5],[355,457.5],[376,410]];

const coast=ref.estimatedCoast.map(utm);
// Enllaç C cap a la zona C de N112 il·l.3 (georeferenciada, docs/CANAL) i la costa general del nord.
// Al nord, la costa gira cap a llevant (carta de 1813; costa actual de la Bassa de Rabassa) i deixa en terra la plana
// de l'Horta Vella, la Rabosa i el Molinet, que era «immediat a la platja» (N112 art.30; il·l.3 zona D, N ≈ 4.499.660).
// L'antiga traça cap al NE creava una badia inexistent entre el canal i el delta.
const EAST=300589;// límit oriental del pla d'aigua (x local 4200 m)
// Entre E 297.150 i 298.350 la línia passa 8 m al nord dels NoData del MDT (mar o port actuals), perquè no quedin forats sense malla.
const northLink=[[EAST,4501500],[EAST,4499645],[298800,4499645],[298350,4499656],[298200,4499666],[298100,4499676],[298000,4499695],[297850,4499695],[297700,4499684],[297680,4499724],[297650,4499724],[297550,4499676],[297450,4499685],[297400,4499675],[297300,4499634],[297200,4499606],[297150,4499590],[297000,4499560],[296820,4499500],[296700,4499385]];
const northKeep=[];
const southLink=[utm([295,524]),[296447.7034682708,4499120.365647587]];
const southKeep=lit.shorelineStudy.filter(p=>p[1]<=4499100);
lit.shorelineStudy=[...northKeep,...northLink,...coast,...southLink,...southKeep];
// El peu de l'escarpament del Roquer continua sent la traça de roques; ja no és la línia d'aigua al nord de la dàrsena.
// Peu de l'escarpament del Roquer: traça del redibuix de 1748 registrada amb punts de control (09/11/2026), que segueix
// l'escarpament del MDT LiDAR. La línia discontínua 24 del croquis quedava 50–70 m a llevant, dins dels horts.
// L'últim gir de la traça (sota el moll gran, que el 1794 ja és dàrsena) queda fora: acaba al morro de la bateria.
lit.roquerCoast=traceUTM(plan1748.tracing.coastPixels,plan1748).filter((p,i,a)=>i<a.length-7);
lit.shorelineNote='Costa estimada de N112 il·l.4 (línia punteada) entre la punta del Roquer i N 4.499.310; enllaç C cap a la zona C de N112 il·l.3 i la costa general del nord. El peu del cantell del Roquer (roquerCoast) queda darrere d’una platja. Revisió 08/11/2026; no és una línia de marees mesurada.';
lit.coastRevision={date:'2026-11-08',source:'N112 il·l.4 · llegenda «Línia de costa estimada»; N112 il·l.3 zona C; carta dels Alfacs de 1813 (IGN T0009734); PR01 «platja al nord»',
  reason:'La costa anterior seguia el mur de contenció 24 i deixava el braç 19 dins del mar, amb aigua entre el canal i la població.',
  previousShoreReplacedNorthOf:4499120,previousNortheastBay:'Traça C anterior (296967,4500000)–(298800,4501500): retirada; deixava mar entre el canal i el delta.',dossier:'docs/CANAL/README.md',geometryConfidence:'C'};

const big=ref.largeBasin.map(utm),xs=big.map(p=>p[0]),ys=big.map(p=>p[1]);
const large=lit.basins.find(b=>b.id==='large');Object.assign(large,{center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],width:Math.max(...xs)-Math.min(...xs),length:Math.max(...ys)-Math.min(...ys),polygonUTM:big});
lit.portWorks.breakwaters=ref.breakwaters.map(line=>line.map(utm));
// La barca més propera a terra queda dins la dàrsena, no sobre la nova platja.
lit.boats.find(b=>b.id==='llagut-1').anchor=[296578,4499236];

// 2. Dàrsena petita i enclusa gran a la zona C (N112 il·l.3; art.20–21 p.233).
const route=lit.canal.routeStudy;
const q=nearestRoute(296700,4499530,route);
let seg=null;for(let i=0;i<route.length-1;i++){const r=nearestRoute(q.easting,q.northing,[route[i],route[i+1]]);if(!seg||r.distance<seg.distance)seg={...r,a:route[i],b:route[i+1]};}
const L=Math.hypot(seg.b[0]-seg.a[0],seg.b[1]-seg.a[1]),u=[(seg.b[0]-seg.a[0])/L,(seg.b[1]-seg.a[1])/L],n=[u[1],-u[0]];// n apunta cap al mar (ESE)
const at=(along,across)=>round([q.easting+u[0]*along+n[0]*across,q.northing+u[1]*along+n[1]*across]);
const half=lit.canal.studyWidth/2,dockLength=34,dockWidth=20,lockLength=38,lockWidth=8.4,plug=4;
const dockPoly=[at(-dockLength/2,half-.5),at(dockLength/2,half-.5),at(dockLength/2,half+dockWidth),at(-dockLength/2,half+dockWidth)];
const lockStart=half+dockWidth+plug,lockEnd=lockStart+lockLength;
lit.canalWorks={
  source:'N112 il·l.3 zona C («Dàrsena del canal i enclusa»), georeferenciada a docs/CANAL/data/georef-N112-il3.json; N112 art.20–21 p.233 (relació del 20/5/1794)',
  geometryConfidence:'C',historicalCoordinates:null,
  darsenaPetita:{id:'darsena-petita',name:'Dàrsena petita del canal',fromYear:1790,polygonUTM:dockPoly,length:dockLength,width:dockWidth,copingHeight:.55,
    state:'Acabada el 1794: maçoneria, carreus, pilotatge i puçolana sota l’aigua, coronada de canteria.',
    limits:'Eixamplament lateral del canal a la zona C. Mides, forma rectangular i costat obert al canal són C; l’any d’inici és una cota de visualització anterior al testimoni de 1794.'},
  enclusa:{id:'enclusa-gran',name:'Enclusa gran · començada',fromYear:1792,axisUTM:[at(0,lockStart),at(0,lockEnd)],length:lockLength,width:lockWidth,wallThickness:2.2,floorElevation:.75,
    wallHeights:[2.6,2.1,1.5,.9,.5],plugMeters:plug,
    state:'Començada i sense concloure el 1794; la major part de la pedra ja tallada. Sense portes ni connexió oberta amb el mar.',
    limits:'Cambra seca, murs a diferents alçàries i aplecs de carreus representen l’estat «començada». Llargada, amplada, orientació i alçàries són C; no es copien portes ni mecanismes del XIX.'},
  stonePiles:[at(-14,lockStart+6),at(-12,lockStart+18),at(-15,lockStart+30),at(14,lockStart+10),at(13,lockStart+26)],
  arm19:'Del costat de ponent de la dàrsena petita surt el braç 19 cap a la dàrsena gran, pel costat oriental de la població (N112 il·l.4).'
};
lit.canal.harbourConnection='El canal arriba a la dàrsena petita (zona C de N112 il·l.3) i continua pel braç terminal 19, en terra, pel costat oriental de la població fins a la cantonada NW de la dàrsena gran. Enclusa gran començada i sense connexió oberta amb el mar el 1794.';

await writeFile(new URL('data/layout-reference-1800.json',root),'{\n'+Object.entries(ref).map(([k,v])=>'  '+JSON.stringify(k)+': '+JSON.stringify(v)).join(',\n')+'\n}\n');
await save('data/littoral-1800.json',lit);
console.log('Coast 1794 applied:',lit.shorelineStudy.length,'shore points; dock',JSON.stringify(dockPoly));
