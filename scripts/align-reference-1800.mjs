import {readFile,writeFile} from 'node:fs/promises';
import {referenceTown,referenceUTM} from '../src/reference-layout.mjs';
const root=new URL('../',import.meta.url),json=async p=>JSON.parse(await readFile(new URL(p,root),'utf8')),save=async(p,d)=>writeFile(new URL(p,root),JSON.stringify(d,null,2)+'\n');
const ref=await json('data/layout-reference-1800.json'),housing=await json('data/housing-1794.json'),frame=housing.townFrame,center=await json('data/center-1794.json'),urban=await json('data/urban-fabric.json'),lit=await json('data/littoral-1800.json'),pilar=await json('data/pilar-reverte.json');
const town=p=>referenceTown(p,ref),utm=p=>referenceUTM(p,ref,frame),bounds=poly=>{const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);return{cx:(Math.min(...xs)+Math.max(...xs))/2,cy:(Math.min(...ys)+Math.max(...ys))/2,w:Math.max(...xs)-Math.min(...xs),d:Math.max(...ys)-Math.min(...ys)};};
for(const[id,polygons]of Object.entries(ref.compounds)){
 const shifted=polygons.map(poly=>poly.map(town).map(([x,y])=>[x+4,y])),s=center.sites.find(s=>s.id===id),b=bounds(shifted.flat());s.across=b.cx;s.along=b.cy;s.width=b.d;s.depth=b.w;
 // Front faces west: local x points north, local z points west.
 s.planBodies=shifted.map(poly=>poly.map(([across,along])=>[b.cy-along,b.cx-across]));
 s.planOutline=ref.compoundOutlines[id].map(town).map(([across,along])=>[b.cy-along,b.cx-across-4]);s.continuousCompound=true;
 s.name=id==='cases-talavera'?'Dues cases de Ramon Talavera':'Fonda Nova de la plaça';
 s.layoutSource=ref.source;s.referencePixels=polygons;s.limits='Edifici continu en U, amb murs només al perímetre exterior i del pati, una única cota de cornisa i coberta unida a les cantonades. Les tres peces de planta són una partició tècnica del mateix edifici, no tres edificis independents. Forma relacional C segons N112 il·l.4.';
}
for(const id of['duana-nova','casa-white']){const s=center.sites.find(s=>s.id===id),p=town(ref.anchors[id]);s.across=p[0];s.along=p[1];s.layoutSource=ref.source;}
// The sketch labels the western residential block as 8; avoid a second large block behind it.
const nova=center.sites.find(s=>s.id==='manzana-nova');nova.layoutAlias='western-residential-block';nova.representedByHousingIds=housing.layout.finishedRows[0].count?Array.from({length:11},(_,i)=>'royal-finished-'+String(i+1).padStart(2,'0')):[];nova.limits='El núm.8 del croquis és l’illa residencial occidental, ja representada pels habitatges. Es retira el volum rectangular duplicat darrere la filera per deixar lloc al jardí botànic i als horts.';
for(const[id,poly]of Object.entries(ref.gardens)){
 let s=urban.sites.find(s=>s.id===id);if(!s){s={id,name:'Horts de les Monges',kind:'garden',fromYear:1794,height:1,evidence:'N112 il·l.4 i referència aportada per Josep. Recinte relacional C, sense parcel·lari històric mesurat.'};urban.sites.push(s);}
 const points=poly.map(town),b=bounds(points);delete s.utmAnchor;delete s.polygonUTM;s.townAnchor=[b.cx,b.cy];s.width=b.w;s.depth=b.d;s.townPolygon=points;s.layoutSource=ref.source;
}
for(const id of['old-inn','old-customs']){const s=lit.sites.find(s=>s.id===id);s.anchor=utm(ref.anchors[id]);s.alongAzimuthDegrees=frame.alongAzimuthDegrees;delete s.footprintUTM;s.positionSource={text:ref.source+' · ajust relacional a la plaça i torre, conservant la forma del model.',precisionMeters:15};}
{const s=lit.sites.find(s=>s.id==='old-customs'),p=town(ref.anchors['old-customs']),a=frame.alongAzimuthDegrees*Math.PI/180;s.anchor=[frame.easting+(p[0]+8)*Math.cos(a)+p[1]*Math.sin(a),frame.northing-(p[0]+8)*Math.sin(a)+p[1]*Math.cos(a)];}
const forge=urban.sites.find(s=>s.id==='ferreria-nova');delete forge.utmAnchor;forge.townAnchor=[125,-101];forge.alongAzimuthDegrees=frame.alongAzimuthDegrees;
const administrator=urban.sites.find(s=>s.id==='casa-administrador');delete administrator.utmAnchor;administrator.townAnchor=[99,84];
{
 const lines=ref.retainingWall24.map(line=>line.map(utm)),b=bounds(lines.flat());let wall=urban.sites.find(s=>s.id==='paredo-poblacio');
 if(!wall){wall={id:'paredo-poblacio'};urban.sites.push(wall);}
 Object.assign(wall,{name:'Paredó de sosteniment · mur 24',kind:'retaining-wall',fromYear:1794,utmAnchor:[b.cx,b.cy],width:b.w,depth:b.d,height:3,thickness:1.3,baseWidth:1.8,retainingLinesUTM:lines,referencePixels:ref.retainingWall24,layoutSource:ref.source,evidence:'N112 il·l.4, núm.24; art.24 p.233 i p.222: mur de maçoneria i terraplens per sostenir la població. Dos trams traçats sobre el croquis; secció i cotes d’assaig C.',limits:'No és una muralla defensiva. Traça relacional C; gruix, perfil i cotes històriques desconeguts. El coronament segueix la cota del terreny interior.'});
}
// Keep the documented long corridor to Amposta; redraw only the terminal arm shown in the sketch.
const north=lit.canal.routeStudy.filter(p=>p[1]>=4499780);lit.canal.routeStudy=[...ref.canal.map(utm),...north];lit.canal.branchStudy=[utm([367,380]),utm([392,389]),utm([377,414])];lit.canal.terminalReference=ref.source;lit.canal.harbourConnection='El braç terminal 19 ressegueix el costat oriental de la població i desemboca al costat nord de la dàrsena gran. Línia d’assaig traçada sobre N112 il·l.4.';
const trace=ref.shore.map(utm);lit.coast1748Trace??=lit.roquerCoast;lit.roquerCoast=trace;lit.shorelineStudy=[...lit.shorelineStudy.filter(p=>p[1]>trace[0][1]),...trace,...lit.shorelineStudy.filter(p=>p[1]<trace.at(-1)[1])];
const big=ref.largeBasin.map(utm),bb=bounds(big),mouth=utm([376,400]);lit.basins=[{id:'small',center:mouth,width:10,length:12,polygonUTM:[utm([366,387]),utm([390,393]),utm([382,413]),utm([360,406])],name:'Boca del braç del canal · no una segona dàrsena independent'},{id:'large',center:[bb.cx,bb.cy],width:bb.w,length:bb.d,polygonUTM:big,name:'Dàrsena gran · port de 1800'}];
lit.portWorks={source:ref.source,breakwaters:ref.breakwaters.map(poly=>poly.map(utm)),width:4.2,top:1.3,dockProps:[[325,534],[339,539],[353,544],[367,548]].map(utm)};
const health=lit.sites.find(s=>s.id==='health');health.anchor=utm([309,529]);health.alongAzimuthDegrees=frame.alongAzimuthDegrees;delete health.footprintUTM;
for(const[id,key]of[['rampa-nord','rampNorth'],['rampa-sud','rampSouth'],['rampa-roquer','rampLong']]){const r=urban.routes.find(r=>r.id===id);delete r.townPoints;r.utmPoints=ref[key].map(utm);r.evidence=r.evidence.split(' Ajust relacional N112')[0]+' Ajust relacional N112 il·l.4 (01/11/2026).';}
const ramp=urban.routes.find(s=>s.id==='rampar');ramp.townPoints=[[121,145],[121,45],[125,0],[140,-15]];delete ramp.utmPoints;
urban.routes.find(s=>s.id==='rambla').townPoints=[[-132,-142],[-132,144],[0,144]];
urban.routes.find(s=>s.id==='pedrera').townPoints=[[-220,-21],[-140,-21],[-70,-21],[-40,0],[0,0],[90,0],[111,-4]];
const garden=urban.sites.find(s=>s.id==='hort-monges'),gp=town([278,437]),g=referenceUTM([278,437],ref,frame);pilar.garden.center=g;pilar.garden.noria=utm([264,426]);pilar.garden.figs=[utm([253,420]),utm([260,447])];pilar.garden.note='Detall de conreu dins del recinte Horts de les Monges, ajustat al croquis N112 il·l.4.';
lit.researchLandscape=pilar;lit.layoutReference={source:ref.source,registration:ref.registration,protectedStructures:['sant-elm','placa-coberta','duana-nova','casa-white','battery','tower'],historicalCoordinates:null};
// Fourteen small units remain in three short landward clusters; identities remain unknown.
const groups=[[[305,354],[304,360],[303,366],[302,372]],[[291,377],[289,383],[287,389],[285,395]],[[307,287],[305,293],[303,299],[301,305],[299,311],[297,317]]];
housing.layout.coastalHouses=groups.flatMap((ps,i)=>ps.map((p,j)=>{let [x,y]=town(p);if(i===0)x+=7;if(i===2){x=75;y=-8-j*5.5;}const a=frame.alongAzimuthDegrees*Math.PI/180;return{anchor:[frame.easting+x*Math.cos(a)+y*Math.sin(a),frame.northing-x*Math.sin(a)+y*Math.cos(a)],frontAzimuthDegrees:109,cluster:i+1,shoreSetbackMeters:null,layoutSource:ref.source};}));
for(const [file,d]of[['data/housing-1794.json',housing],['data/center-1794.json',center],['data/urban-fabric.json',urban],['data/littoral-1800.json',lit],['data/pilar-reverte.json',pilar]])await save(file,d);
console.log('Reference layout applied: compounds, gardens, terminal canal, coastline and 1800 harbour.');
