import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { toWorld, sampleHeight, terrainIndices } from './geo.mjs';
import { cutCoarsePatch, stitchedPatchIndices } from './lod.mjs';
import { makeTerrain, type Terrain } from './terrain';
import { makeEsglesia, type StudyConfig } from './esglesia';
import { makeHousing, type Housing } from './housing';
import { makeCenter,applyCenterGround,type CenterData,type CenterSite } from './center';
import {makeLittoral,type Littoral,type LittoralSite} from './littoral';
import {makeLandscape,nativeTriangles} from './landscape';
import {contextTriangles} from './context-plan.mjs';
import {chronologyAt,entityAt} from './chronology.mjs';
import {makeEarlyTown} from './early-town';
import {makeLandmarks,type LandmarkData} from './landmarks';
import {makeUrban} from './urban';
import {landscapeSample,coastalWaterEasting} from './littoral-plan.mjs';
import {makeWalking} from './walking';
import {walkingSurface,insidePolygon} from './walk-plan.mjs';
import {porticoPlan,siteUTM} from './domestic-plan.mjs';
import {makeLife} from './life';
import {groundDetail,makeEnvironment} from './environment';
import {planToUTM} from './building-plan.mjs';
import {townToUTM} from './housing-plan.mjs';
import {porxosEvidenceHTML,type PorxosEvidence} from './porxos-evidence';
import {makePicker} from './picking';
import {makeComments} from './comments';
import {makePlan1748,type PlanData} from './plan1748';
import {makeDossierPanel,modelLookup,type Dossier,type DossierData} from './dossiers';
import './style.css';

type Place = { geometry: { coordinates: number[] }; properties: {
  id: string; name: string; shortName: string; category: string; description: string;
  pending: string; utm_x: number; utm_y: number; terrainHeight: number | null;
  certainty: Record<string,string>; sourceRefs: string[]; url: string;
} };
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const format = new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 1 });
const dialog = el<HTMLDialogElement>('info-dialog');
const escape = (text: string) => text.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
let selected = 0;
let places: Place[] = [];
let meta: Terrain;
let studyConfig:StudyConfig;
let openLaboratory=()=>{};
let openHousing=()=>{};
let housingData:Housing;
let centerData:CenterData;
let selectedCenter:CenterSite|null=null;
let openCenter=()=>{};
let littoralData:Littoral;
let chronologyData:any;
let urbanData:any;
let landmarkData:LandmarkData;
let sceneYear=1800;
let fabricData:any;
let openUrban:(id?:string)=>void=()=>{};
let selectedLittoral:LittoralSite|null=null;
let openLittoral:(kind:'roquer'|'canal'|'amposta',site?:LittoralSite|null)=>void=()=>{};
const tabs=['places','layers','housing','building','littoral','urban'];
function littoralEvidence(site:LittoralSite|null=selectedLittoral){
  if(!littoralData)return;
  showDialog(`<h2>${escape(site?.name??'El Roquer, el litoral i el canal')}</h2>${site?`<p>${escape(site.state)}</p><p>${escape(site.evidence)}</p>`:''}<p>El T-6/8 és un projecte per a vuit canons. La bateria es representa parcial, amb sis peces a partir del testimoni de 1794: tres amb curenyes degradades i tres sense. L'envolupant de projecte és una comparació opcional; no és obra executada.</p><p>Les plantes individuals, els fragments conservats i els alçats són C. El monestir no es reconstrueix com un conjunt medieval íntegre. La torre canvia entre una fase anterior d'assaig i la reparació documentada de 1780.</p><p>El canal arriba a l'àmbit de l'Ebre a Amposta: ${format.format(littoralData.canal.studyLengthMeters/1000)} km d'assaig, amb amplada de ${format.format(littoralData.canal.studyWidth)} m. La seva connexió territorial és C: l'article de 1997 adverteix que el traçat exacte del primer canal és desconegut. Els nivells d'aigua de 0,45–1,35 m són tècnics, sense validar el dàtum ni la hidràulica històrica. Els bancs de sediment recorden el problema de calat; no s'hi simula trànsit navegable.</p><p>El relleu històric és una còpia de visualització amb talls reversibles per a costa, platja, Roquer i canal. El mode MDT actual recupera les malles mesurades. La costa és C; la carta IGN aportada és de 1813. Les cinc barques són tipologies mediterrànies genèriques, no un inventari de la flota.</p><h3>Plànols aportats</h3><details><summary>T-6/8 · projecte, no obra completada</summary><img class="source-plan" src="${import.meta.env.BASE_URL}data/reference/t-6-8.jpg" alt="Plantes i perfil de la bateria projectada per a vuit canons" loading="lazy"><p>Fuente: Archivo General Militar de Madrid / Biblioteca Virtual de Defensa · CC BY 4.0. Data de catàleg: segle XVIII, indeterminada.</p></details><details><summary>Carta dels Alfacs · 1813 · comparació posterior</summary><img class="source-plan" src="${import.meta.env.BASE_URL}data/reference/T0009734.jpg" alt="Carta del port dels Alfacs de 1813" loading="lazy"><p>IGN · registre 009734. No documenta directament la costa del 1800.</p></details><h3>Documents revisats</h3><ul>${littoralData.sources.map((s:any)=>`<li><strong>${escape(s.id)}</strong> · ${s.url?`<a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)}</a>`:escape(s.title)}<br>${escape(s.use)}${s.credit?`<br>${escape(s.credit)}`:''}</li>`).join('')}</ul><h3>Exclusions</h3><ul>${littoralData.excluded.map((s:string)=>`<li>${escape(s)}</li>`).join('')}</ul>`);
}
el('littoral-evidence').onclick=()=>littoralEvidence(null);
function landmarkEvidence(site?:any){
  if(!landmarkData)return;
  const sites=site?[site]:landmarkData.sites;
  showDialog(`<h2>La Glorieta i la Guardiola</h2>${sites.map((s:any)=>`<h3>${escape(s.name)}</h3><p>${escape(s.evidence)}</p><p>${escape(s.limits)}</p><p>Geometria C. Cota màxima del MDT sota el suport: ${format.format(s.terrain.maximum)} m; suport tècnic, no plataforma històrica.</p>`).join('')}<h3>Fonts revisades</h3><ul>${landmarkData.sources.map((s:any)=>`<li>${s.url?`<a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)}</a>`:escape(s.title)}<br>${escape(s.use)}</li>`).join('')}</ul><p>La Glorieta s'assaja només el 1800, sense atribuir-li una construcció aquell any. La Guardiola és una preexistència; se n'omet el coronament desconegut i els elements moderns.</p>`);
}
el('landmark-evidence').onclick=()=>landmarkEvidence();
el('time-evidence').onclick=()=>showDialog(`<h2>Any triat i any documentat</h2><p>El selector mostra canvis en fites documentades, sense interpolar una obra entre dues dates. L'alçària i els detalls de cada fase continuen sent hipòtesis C.</p>${chronologyData.milestones.map((m:any)=>`<h3>${m.year} · ${escape(m.label)}</h3><p>${escape(m.description)}</p><p class="tool-note">${m.sources.map(escape).join(' · ')}</p>`).join('')}<h3>Regles</h3><ul>${chronologyData.rules.map((s:string)=>`<li>${escape(s)}</li>`).join('')}</ul>`);
function activateTab(tab:string) {
  for(const name of tabs){el(`${name}-tab`).setAttribute('aria-selected',String(name===tab));el(`${name}-tab`).tabIndex=name===tab?0:-1;el(`${name}-panel`).hidden=name!==tab;}
}
const showDialog = (html: string) => { dialog.setAttribute('aria-label','Descripció, evidència i fonts'); el('dialog-content').innerHTML = html; if(!dialog.open)dialog.showModal(); dialog.scrollTop=0; };
function centerEvidence(site:CenterSite|null=selectedCenter){
  if(!centerData)return;
  showDialog(site?`<h2>${escape(site.name)}</h2><p>${escape(site.state1794)}.</p><h3>Evidència revisada</h3><p>${escape(site.evidence)}</p><h3>Hipòtesis i límits</h3><p>${escape(site.limits)}</p><p>Posició individual, planta i alçària: C. L’evidència és de 1794; l’estat individual el 1800 no està verificat. Les cotes històriques continuen sent desconegudes.</p>${site.inventoryRelation?`<p>${escape(site.inventoryRelation)}</p>`:''}<p>El suport gris és tècnic i reversible, sobre el MDT contemporani. No documenta una plataforma del 1800.</p><p><a href="${escape(centerData.source.url)}" target="_blank" rel="noreferrer">${escape(centerData.source.title)}</a></p>`:`<h2>El centre cap al 1800</h2><p>La relació d’obres de 1794 permet distingir els usos del nucli i els seus estats d’execució. Els edificis s’afegeixen a la mateixa escena del territori.</p><p>Sant Elm s’estudia com un temple diferent de l’Església Nova. La plaça coberta s’assaja amb el cos alt obert; els magatzems del Coc es mantenen sense coberta. La fonda substitueix dos cossos residencials reservats, sense duplicar-los.</p><p>La Mançana conserva les seves 24 habitacions compartides i rep un pou d’assaig. Les Cases de Talavera són dues cases privades documentades, encara sense correspondència individual amb el conjunt mixt de 38 propietats.</p><p>El sòl de terra i les dues fileres de seixanta garrofers són una distribució C sobre el MDT actual. No es copien el paviment ni la vegetació de la plaça contemporània. No es reconstrueix íntegrament el cobert malmès fins a aclarir-ne la cronologia.</p><p>Les posicions, les mesures, els detalls i la continuïtat de cada estat entre 1794 i 1800 continuen pendents de validació.</p><p><a href="${escape(centerData.source.url)}" target="_blank" rel="noreferrer">${escape(centerData.source.title)}</a></p>`);
}
el('center-evidence').onclick=()=>centerEvidence(null);
function buildingEvidence() {
  if(!studyConfig)return;
  const c=studyConfig;
  showDialog(`<h2>Església Nova: evidència i assaig</h2><p>La traça actual s’ha aproximat sobre una ortofoto ICGC de 2024. El volum és una hipòtesi C, no un aixecament ni una restitució validada del 1800.</p><table><thead><tr><th>Dada</th><th>Evidència</th></tr></thead><tbody><tr><td>Costat de 23,7 m</td><td>Mesura publicada a H07. Pendent de contrastar amb un aixecament.</td></tr><tr><td>Quatre costats digitalitzats</td><td>${c.footprintObservation.sideLengthsMeters.map(v=>format.format(v)+' m').join(' / ')}. Traça manual actual; marge de treball estimat de ±1,5 m.</td></tr><tr><td>Orientació de la façana</td><td>≈ ${format.format(c.orientation.frontAzimuthDegrees)}° respecte del nord de la quadrícula UTM; marge estimat de ±3°. Lectura aproximada de G02.</td></tr><tr><td>Alçària històrica / gruix</td><td>Sense mesurar. Camps documentats buits.</td></tr><tr><td>Alçària de treball</td><td>${escape(el('wall-height-value').textContent||'')} · hipòtesi modificable.</td></tr><tr><td>Distribució i obertures</td><td>Proporcions C: permeten assajar la creu grega, però no acrediten dimensions històriques.</td></tr><tr><td>Terreny sota la planta</td><td>${format.format(c.terrain.minimumUnderFootprint)}–${format.format(c.terrain.maximumUnderFootprint)} m, MDT actual.</td></tr><tr><td>Suport tècnic</td><td>${format.format(c.terrain.provisionalBaseElevation)} m. Peça provisional de visualització; el MDT no s’aplana ni es modifica.</td></tr><tr><td>Coberta</td><td>Sense cúpula ni coberta moderna al model.</td></tr></tbody></table><h3>Fonts i abast</h3><ul>${c.sources.map(s=>`<li><strong>${escape(s.id)}</strong> · ${s.url?`<a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)}</a>`:escape(s.title)}<br>${escape(s.use)}</li>`).join('')}</ul><h3>Què falta</h3><p>Aixecament de planta i alçats, cotes d’obertures i murs, distribució interior i datació de cada fàbrica respecte del 1800. El retall de 2 m millora el terreny actual, però no resol aquestes incògnites.</p>`);
}
el('building-evidence').onclick=buildingEvidence;
let porxosReading:Promise<PorxosEvidence>|null=null;
async function openPorxosEvidence(structureId?:string){
  showDialog('<h2>Les cases amb porxos</h2><p role="status">Carregant les descripcions i les fonts…</p>');
  dialog.setAttribute('aria-label','Les cases amb porxos · descripció i fonts');
  try{
    const d=await(porxosReading??=get<PorxosEvidence>('porxos-study.json'));
    if(!dialog.open)return;
    el('dialog-content').innerHTML=porxosEvidenceHTML(d,import.meta.env.BASE_URL,structureId);
    dialog.scrollTop=0;
  }catch{
    porxosReading=null;
    el('dialog-content').innerHTML='<h2>Les cases amb porxos</h2><p>No s’ha pogut carregar la fitxa. Torna a seleccionar les arcades per provar-ho de nou.</p>';
  }
}
el('porxos-evidence').onclick=()=>openPorxosEvidence();
el('center-porxos-evidence').onclick=()=>openPorxosEvidence();
el('housing-evidence').onclick=()=>showDialog(`<h2>Habitatges: testimonis i restitució</h2><h3>1788–1789 · dotze cases de lloguer</h3><p>${escape(urbanData?.source.evidence??'')}</p><p>${escape(urbanData?.limits??'')}</p><h3>1794 · inventari general</h3><p>La relació del 20 de maig de 1794 distingeix 22 cases grans acabades, 7 amb coberta però sense acabats i 14 sense coberta, amb murs alçats, bigues del primer pis i porxos complets. Hi afegeix 14 unitats petites prop del litoral i 24 habitacions dins de la Mançana. Són 81 unitats del patrimoni reial, representades en 58 cossos.</p><p>Les 38 propietats privades formen un conjunt mixt, amb usos no residencials i sense identificació individual completa. Les Cases de Talavera s’estudien com dues cases privades documentades, sense augmentar aquest total. Les dotze cases descrites a la tesi per al 1788–1789 no se sumen un altre cop a l’inventari.</p><h3>Detall domèstic i passos coberts · C</h3><p>Portes de taulons i ferratges, reixes, cornises, teula, terrats posteriors, xemeneies i patis de restitució C. Les set cases cobertes inacabades no reben fusteries ni emblanquinat. Als porxos es pot caminar entre les cases: es bloquegen pilars i cos posterior, no tota la planta. La columnata de la plaça coberta és un assaig de quatre suports i arquitrau; es distingeix dels arcs de les cases.</p><h3>Què és una hipòtesi</h3><p>La posició individual, el repartiment d’estats, les fondàries, les alçàries i les obertures són C. L’alineació fa servir referències actuals; encara no hi ha una georeferenciació del parcel·lari de 1794. Tampoc no s’ha demostrat que cada estat d’obra es mantingués igual el 1800. Els suports grisos són ajustos tècnics al MDT actual, no plataformes històriques.</p><h3>Fonts revisades</h3><ul>${housingData.sources.map(s=>`<li>${s.url?`<a href="${escape(s.url)}" target="_blank" rel="noreferrer">${escape(s.title)}</a>`:escape(s.title)}</li>`).join('')}</ul><h3>Regles de restitució</h3><ul>${housingData.rules.map(s=>`<li>${escape(s)}</li>`).join('')}</ul>`);
el('dialog-close').onclick = () => dialog.close();
dialog.addEventListener('click', e => { if (e.target === dialog) { const r=dialog.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) dialog.close(); } });
el('details-open').onclick = () => {
  if(selectedLittoral){littoralEvidence();return;}
  if(selectedCenter){centerEvidence();return;}
  const p = places[selected]?.properties;
  if (!p) return;
  if(p.id==='esglesia_nova'){buildingEvidence();return;}
  const landmark=landmarkData?.sites.find(s=>s.id===p.id);if(landmark){landmarkEvidence(landmark);return;}
  const names: Record<string,string> = {existence1800:'Existència cap al 1800',position:'Posició del punt de referència',footprint:'Planta mesurada',height:'Alçària històrica',appearance1800:'Aspecte cap al 1800'};
  showDialog(`<h2>${escape(p.shortName)}</h2><p>${escape(p.description)}</p><div class="coordinate">ETRS89 / UTM 31N · EPSG:25831<br>E ${format.format(p.utm_x)} / N ${format.format(p.utm_y)} m<br>Cota del MDT actual: ${p.terrainHeight === null ? 'sense mostra vàlida' : format.format(p.terrainHeight)+' m (orientativa)'}</div><h3>Què en sabem</h3><table><tbody>${Object.entries(p.certainty).map(([key,value])=>`<tr><td>${names[key]}</td><td>${escape(value)}</td></tr>`).join('')}</tbody></table><p>A: documentat · B: probable/aproximat · C: hipotètic · D: desconegut. La ubicació actual no prova l’alçat del 1800.</p><h3>Validació pendent</h3><p>${escape(p.pending)}</p><h3>Referències de l’expedient</h3><ul>${p.sourceRefs.map(s=>`<li>${escape(s)}</li>`).join('')}</ul><p><a href="${escape(p.url)}" target="_blank" rel="noreferrer">Consulta la referència cartogràfica actual ↗</a></p>`);
};
el('method-open').onclick=()=>showDialog(`<h2>Del document al paisatge</h2><p>Atles d’estudi de la Ràpita entre 1778 i 1800. La cronologia diferencia els testimonis de les dates de construcció: les fites del Roquer són de 1778, 1779, 1780, 1781 i 1794. El temporal de 1795 té extensió espacial encara desconeguda.</p><p>El poble conserva el MDT LiDAR a 10 m i detalls de 2 m. El nou GeoTIFF aportat amplia el Montsià amb mostres natives a 50 m: els dos TIFF coincideixen exactament en el solapament comprovat. El context cap a Amposta conserva el WCS ICGC arxivat; la seva equivalència vertical amb el LiDAR resta pendent. Una costura visual perimetral uneix les malles, sense canviar els binaris originals ni duplicar superfícies. Escala vertical ×1; no es reomplen els buits de cobertura.</p><p>El mode Litoral aplica talls d’assaig a una còpia de visualització per a la platja, el Roquer, les dàrsenes i el canal. El mode MDT actual recupera les dades mesurades. Els NoData originals no es converteixen en sòl inventat. El nivell d’aigua és tècnic, sense validar la cota històrica.</p><p>La costa és C i no evoluciona amb l’any. La carta IGN és de 1813, no de 1800; el plànol d’eixample de l’XML és de 1867/1870 i queda exclòs. El gran moll de 1782 i les rescloses del XIX no es construeixen a l’escena.</p><p>H01: Borràs Matamoros, tesi, pp. 107–120 i 221–240. H02: Reverté, inventari de 1794, art. 1–29. H03: Villares, Navas i Junyent (1997), lectura visual de pp. 119–120. H09: La rábita en el islam, lectura focal històrica. Consulta els documents i límits al tauler Litoral.</p><p>T-6/8: Fuente: Archivo General Militar de Madrid / Biblioteca Virtual de Defensa · CC BY 4.0. El plànol representa el projecte, no la seva execució completa.</p><p>Geometria reproduïble amb Three.js i Vite, dades locals i materials procedurals. Sense Blender ni serveis cartogràfics durant la visita.</p>`);
el('card-collapse').onclick = () => {
  const body = el('card-body'); body.hidden = !body.hidden;
  el('card-collapse').textContent = body.hidden ? '+' : '−';
  el('card-collapse').setAttribute('aria-expanded', String(!body.hidden));
  el('card-collapse').setAttribute('aria-label', body.hidden ? 'Desplega la fitxa' : 'Replega la fitxa');
};
for (const tab of tabs) {
  el(`${tab}-tab`).onclick = () => {
    activateTab(tab);
    if(tab==='building')openCenter();
    if(tab==='housing')openHousing();
    if(tab==='littoral')openLittoral('roquer');
    if(tab==='urban')openUrban();
  };
  el(`${tab}-tab`).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const i=tabs.indexOf(tab),n=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length;const next=el(`${tabs[n]}-tab`);next.click();next.focus();}};
}
async function get<T>(path: string): Promise<T> {
  const response=await fetch(`${import.meta.env.BASE_URL}data/${path}`);
  if (!response.ok) throw new Error(`No s’ha pogut carregar ${path} (${response.status}). Executa npm run data:prepare.`);
  return path.endsWith('.json')||path.endsWith('.geojson') ? response.json() : response.arrayBuffer() as Promise<T>;
}

async function start() {
  const initialHash=location.hash;
  const dossierPromise=get<DossierData>('dossiers.json');
  let detailMeta:Terrain,townMeta:Terrain,regionMeta:Terrain;
  [meta,{features:places},detailMeta,studyConfig,townMeta,housingData,centerData,regionMeta,littoralData,chronologyData,urbanData,landmarkData,fabricData]=await Promise.all([get<Terrain>('terrain.json'),get<{features:Place[]}>('monuments.geojson'),get<Terrain>('esglesia-terrain.json'),get<StudyConfig>('buildings/esglesia-nova.json'),get<Terrain>('town-terrain.json'),get<Housing>('housing.json'),get<CenterData>('center.json'),get<Terrain>('context.json'),get<Littoral>('littoral.json'),get<any>('chronology.json'),get<any>('urban-chronology.json'),get<LandmarkData>('landmarks.json'),get<any>('urban-fabric.json')]);
  const requestedYear=Number(new URLSearchParams(location.search).get('any')??chronologyData.defaultYear);sceneYear=chronologyAt(chronologyData,Number.isFinite(requestedYear)?requestedYear:chronologyData.defaultYear).year;
  // El selector avança per parades: cada any de 1778 a 1800 i, després, una parada cada 10 anys més les fites. Així el període documentat no queda aplastat.
  const yearStops:number[]=(()=>{const [first,last]=chronologyData.range as number[],fites:number[]=chronologyData.milestones.map((x:any)=>x.year),set=new Set<number>([...fites,first,1800,last]);for(let y=first;y<=1800;y++)set.add(y);for(let y=1810;y<last;y+=10)if(!fites.some(f=>Math.abs(f-y)<=3))set.add(y);return[...set].filter(y=>y>=first&&y<=last).sort((a,b)=>a-b);})();
  const yearIndex=(year:number)=>{let found=0;yearStops.forEach((y,i)=>{if(y<=year)found=i;});return found;};
  el<HTMLInputElement>('year-slider').min='0';el<HTMLInputElement>('year-slider').max=String(yearStops.length-1);el('year-slider').setAttribute('aria-label',`Any de la reconstrucció, de ${chronologyData.range[0]} a ${chronologyData.range[1]}`);
  const [heightData, maskData] = await Promise.all([get<ArrayBuffer>(meta.heights),get<ArrayBuffer>(meta.validity)]);
  if(heightData.byteLength!==meta.width*meta.height*4 || maskData.byteLength!==meta.width*meta.height) throw new Error('La mida de les dades no coincideix amb la malla. Regenera el terreny.');
  const heights = new Float32Array(heightData), valid = new Uint8Array(maskData);
  const [fineHeightData,fineMaskData]=await Promise.all([get<ArrayBuffer>(detailMeta.heights),get<ArrayBuffer>(detailMeta.validity)]);
  if(fineHeightData.byteLength!==detailMeta.width*detailMeta.height*4||fineMaskData.byteLength!==detailMeta.width*detailMeta.height)throw new Error('Detall de 2 m incomplet. Executa npm run data:prepare.');
  const fineHeights=new Float32Array(fineHeightData),fineValid=new Uint8Array(fineMaskData);
  const [townHeightData,townMaskData]=await Promise.all([get<ArrayBuffer>(townMeta.heights),get<ArrayBuffer>(townMeta.validity)]);
  if(townHeightData.byteLength!==townMeta.width*townMeta.height*4||townMaskData.byteLength!==townMeta.width*townMeta.height)throw new Error('Terreny del nucli incomplet. Executa npm run data:prepare.');
  const townHeights=new Float32Array(townHeightData),townValid=new Uint8Array(townMaskData);
  const [regionHeightData,regionMaskData]=await Promise.all([get<ArrayBuffer>(regionMeta.heights),get<ArrayBuffer>(regionMeta.validity)]);
  const regionHeights=new Float32Array(regionHeightData),regionValid=new Uint8Array(regionMaskData);
  if(regionHeights.length!==regionMeta.width*regionMeta.height||regionValid.length!==regionHeights.length)throw new Error('Context regional incomplet');
  const host=el('scene');
  const renderer=new THREE.WebGLRenderer({ antialias:true, alpha:false });
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.setClearColor('#e7ece6');
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.28;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false;
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#fff8dd','#8b9b7b',2.3));
  const sun=new THREE.DirectionalLight('#fff6de',2.6); sun.position.set(-900,1600,800); scene.add(sun);
  sun.castShadow=true;sun.target.position.set(0,0,-40);scene.add(sun.target);sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-380,right:380,top:380,bottom:-380,near:100,far:4000});sun.shadow.bias=-.00015;sun.shadow.normalBias=.06;
  const camera=new THREE.PerspectiveCamera(40,1,.15,100000);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true; controls.dampingFactor=.085;
  controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.PAN,RIGHT:THREE.MOUSE.PAN};
  controls.minDistance=12; controls.maxDistance=60000;
  controls.maxPolarAngle=Math.PI*.485;
  controls.screenSpacePanning=false;
  controls.target.set(-250,20,120); camera.position.set(750,850,1250); controls.update();
  const coarseIndices=cutCoarsePatch(meta,cutCoarsePatch(meta,terrainIndices(meta.width,meta.height,valid),detailMeta),townMeta);
  const fineIndices=stitchedPatchIndices(detailMeta.width,detailMeta.height,fineValid,meta.step/detailMeta.step);
  const coarse=makeTerrain(meta,heights,valid,10,coarseIndices),fine=makeTerrain(detailMeta,fineHeights,fineValid,2,fineIndices);
  const town=makeTerrain(townMeta,townHeights,townValid,2,stitchedPatchIndices(townMeta.width,townMeta.height,townValid,meta.step/townMeta.step));
  scene.add(coarse.mesh,coarse.contours,fine.mesh,fine.contours,town.mesh,town.contours);
  const housing=makeHousing(housingData,townMeta,townHeights,townValid);scene.add(housing);
  const center=makeCenter(centerData,townMeta,townHeights,townValid,housingData);scene.add(center.root);
  const colorGround=applyCenterGround(town.mesh,centerData,housingData);
  const regionalFaces=contextTriangles(regionMeta,regionHeights,regionValid,meta,heights,valid);
  const regionMeasured=makeLandscape(regionMeta,regionalFaces,littoralData,false,false);scene.add(regionMeasured);
  const sourcePatches=[{meta,faces:nativeTriangles(meta,heights,coarseIndices)},{meta:detailMeta,faces:nativeTriangles(detailMeta,fineHeights,fineIndices)},{meta:townMeta,faces:nativeTriangles(townMeta,townHeights,stitchedPatchIndices(townMeta.width,townMeta.height,townValid,meta.step/townMeta.step))},{meta:regionMeta,faces:regionalFaces}];
  const historic=new THREE.Group(),historicCoast=new THREE.Group();scene.add(historic,historicCoast);
  const historicGround:((visible:boolean)=>void)[]=[];
  for(const p of sourcePatches){const a=makeLandscape(p.meta,p.faces,littoralData,true,true,fabricData),b=makeLandscape(p.meta,p.faces,littoralData,false);historic.add(a);historicCoast.add(b);if(p.meta===townMeta)for(const m of[a,b])historicGround.push(applyCenterGround(m,centerData,housingData));}
  const littoral=makeLittoral(littoralData,meta,heights,valid,chronologyData);scene.add(littoral.root);
  const earlyTown=makeEarlyTown(urbanData,housingData,townMeta,townHeights,townValid,chronologyData);scene.add(earlyTown.root);
  const landmarks=makeLandmarks(landmarkData,meta,heights,valid,chronologyData);scene.add(landmarks.root);
  const sampleUrban=(e:number,n:number)=>{const raw=sampleHeight(townMeta,townHeights,townValid,e,n)??sampleHeight(detailMeta,fineHeights,fineValid,e,n)??sampleHeight(meta,heights,valid,e,n)??sampleHeight(regionMeta,regionHeights,regionValid,e,n);return raw===null?null:landscapeSample(e,n,raw,littoralData).height;};
  const urban=makeUrban(fabricData,meta,sampleUrban,n=>coastalWaterEasting(n,littoralData));scene.add(urban.root);
  // Plànol de 1748 superposat: eina de verificació del georeferenciat; no mou edificis ni costa.
  try{
    const planData=await get<PlanData>('plan-1748.json');
    const planTexture=await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}data/${planData.image}`);planTexture.colorSpace=THREE.SRGBColorSpace;
    const plan=makePlan1748(planData,planTexture,meta.origin,sampleUrban);scene.add(plan.mesh);
    const g=planData.georeference,planInput=(id:string)=>el<HTMLInputElement>(id);
    const refreshPlan=()=>{
      const on=planInput('plan1748-toggle').checked;
      const params={rotation:Number(planInput('plan1748-rotation').value),scale:Number(planInput('plan1748-scale').value),dE:Number(planInput('plan1748-de').value),dN:Number(planInput('plan1748-dn').value)};
      el('plan1748-opacity-value').textContent=`${planInput('plan1748-opacity').value} %`;el('plan1748-rotation-value').textContent=`${format.format(params.rotation)}°`;
      el('plan1748-scale-value').textContent=`${params.scale.toFixed(4).replace('.',',')} m/px`;el('plan1748-de-value').textContent=`${params.dE} m`;el('plan1748-dn-value').textContent=`${params.dN} m`;
      el('plan1748-controls').hidden=!on;plan.mesh.visible=on;plan.setOpacity(Number(planInput('plan1748-opacity').value)/100);if(on)plan.update(params);
    };
    const defaults=()=>{planInput('plan1748-rotation').value=String(g.rotationDegrees);planInput('plan1748-scale').value=String(g.metersPerPixel);planInput('plan1748-de').value=String(g.offsetMeters[0]);planInput('plan1748-dn').value=String(g.offsetMeters[1]);planInput('plan1748-opacity').value='60';};
    defaults();
    for(const id of['plan1748-toggle','plan1748-opacity','plan1748-rotation','plan1748-scale','plan1748-de','plan1748-dn'])planInput(id).oninput=refreshPlan;
    el('plan1748-reset').onclick=()=>{defaults();refreshPlan();};
    refreshPlan();
  }catch(error){console.warn('Plànol de 1748 no disponible',error);el('plan1748-tools').hidden=true;}
  let urbanFocus:string|null=null;
  // Cartells grans amb poste per localitzar de lluny els elements aïllats (Mataredona, Font de Burga), com els edificis emblemàtics.
  const flagGroup=new THREE.Group();scene.add(flagGroup);
  const flags=fabricData.sites.filter((s:any)=>s.flag).map((s:any)=>{
    const ground=(sampleUrban(s.anchor[0],s.anchor[1])??s.technicalBaseElevation)+1,height=30;
    const base=new THREE.Vector3(...toWorld(s.anchor[0],s.anchor[1],ground,meta.origin)),top=base.clone().add(new THREE.Vector3(0,height,0));
    const stem=new THREE.Line(new THREE.BufferGeometry().setFromPoints([base,top]),new THREE.LineBasicMaterial({color:'#45664c',depthTest:false,transparent:true,opacity:.6}));stem.renderOrder=5;flagGroup.add(stem);
    const button=document.createElement('button');button.className='marker built';button.innerHTML=`<span style="margin-left:0">${escape(s.name)} · C</span>`;button.setAttribute('aria-label',`${s.name}: centra el mapa`);button.onclick=()=>openUrban(s.id);button.hidden=true;el('labels').append(button);
    return {id:s.id,button,stem,top};
  });

  const urbanFeature=()=>[...fabricData.routes,...fabricData.sites,fabricData.ravine].find((f:any)=>f.id===urbanFocus);
  const urbanTarget=()=>{const f=urbanFeature(),p=f?.anchor??(f?.points?f.points[Math.floor(f.points.length/2)]:[296360,4499400]);return new THREE.Vector3(...toWorld(p[0],p[1],(sampleUrban(p[0],p[1])??5)+2,meta.origin));};
  const urbanOffset=()=>urbanFeature()?.kind==='spring'?new THREE.Vector3(.5,1.5,.8).multiplyScalar(26):new THREE.Vector3(1.4,1.25,1.8).multiplyScalar(urbanFocus==='$overview'?210:urbanFeature()?.kind==='bridge'?30:urbanFeature()?.points?90:Math.max(28,urbanFeature()?.width??40));
  let landmarkFocus:string|null=null;
  let mountainFocus=false;
  const mountainTarget=()=>new THREE.Vector3(...toWorld(293100,4500750,250,meta.origin));
  const mountainOffset=()=>new THREE.Vector3(4300,3400,4700);
  const landmarkSite=()=>landmarkData.sites.find(s=>s.id===landmarkFocus)!;
  const landmarkTarget=()=>{const s=landmarkSite();return new THREE.Vector3(...toWorld(s.anchor.easting,s.anchor.northing,s.terrain.technicalBaseElevation+2,meta.origin));};
  const landmarkOffset=()=>new THREE.Vector3(1.5,1.1,1.7).multiplyScalar(landmarkSite().focusRadius*2);
  let littoralFocus:'roquer'|'canal'|'amposta'|null=null;
  const littoralTarget=()=>{const p=selectedLittoral?.anchor??(littoralFocus==='canal'?[296450,4504300]:littoralFocus==='amposta'?littoralData.canal.routeStudy.at(-1):[296445,4499245]);return new THREE.Vector3(...toWorld(p[0],p[1],selectedLittoral?.technicalBaseElevation??5,meta.origin));};
  const littoralOffset=()=>littoralFocus==='canal'?new THREE.Vector3(2000,17000,10000):littoralFocus==='amposta'?new THREE.Vector3(160,150,230):selectedLittoral?new THREE.Vector3(1.5,1.2,1.8).multiplyScalar(selectedLittoral.radius*1.5):new THREE.Vector3(240,230,360);
  const replacedHousingIds=new Set(centerData.sites.flatMap(s=>s.replacesHousingIds??[]));
  const building=makeEsglesia(studyConfig,detailMeta,fineHeights,fineValid);
  scene.add(building.root,building.observed);
  let laboratory=false,housingFocus=false,centerFocus=false,studyVolume=true;
  const sampleMeasured=(e:number,n:number)=>sampleHeight(townMeta,townHeights,townValid,e,n)??sampleHeight(detailMeta,fineHeights,fineValid,e,n)??sampleHeight(meta,heights,valid,e,n);
  const walkingObstacles=()=>{
    const polygons:number[][][]=[],ch=chronologyAt(chronologyData,sceneYear);
    if(housing.visible)for(const g of housing.children)if(g.visible)polygons.push(...(g.userData.navigation?.solids??[]));
    if(earlyTown.root.visible)for(const version of earlyTown.root.children)if(version.visible)for(const g of version.children)polygons.push(...(g.userData.navigation?.solids??[]));
    if(center.root.visible)for(const g of center.root.children)if(g.visible&&g.userData.centerId)polygons.push(...(g.userData.navigation?.solids??[]));
    if(building.root.visible)polygons.push((studyConfig as any).previewFootprintUTM);
    if(landmarks.root.visible)for(const s of landmarkData.sites)if(landmarks.groups.get(s.id)?.visible)polygons.push(s.footprintUTM);
    if(urban.root.visible)for(const s of fabricData.sites)if(['forge','guardhouse','service-house','mill','warehouse','lighthouse','farmhouse','stonehouse'].includes(s.kind)&&urban.groups.get(s.id)?.visible)polygons.push(s.footprintUTM);
    if(littoral.root.visible)for(const s of littoralData.sites){if(!littoral.siteGroups.get(s.id)?.visible||!littoral.roquer.visible&&s.kind!=='health'||s.kind==='health'&&!littoral.port.visible)continue;
      if(s.kind==='battery')polygons.push(littoralData.battery.outlineStudy.map(([x,z]:number[])=>planToUTM(x,z,{easting:s.anchor[0],northing:s.anchor[1]},littoralData.battery.frontAzimuthDegrees)));
      else if(s.footprintUTM)polygons.push(s.footprintUTM);
      else if(s.width&&s.depth)polygons.push([[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,z])=>[s.anchor[0]+x*s.width/2,s.anchor[1]+z*s.depth/2]));
    }return polygons.filter(p=>p?.length>=3);
  };
  const detailHouse=housingData.structures.find(s=>s.id==='royal-finished-01')!,detailFront=siteUTM(detailHouse,[[0,detailHouse.depth/2+3.5]])[0],detailYard=siteUTM(detailHouse,[[0,-detailHouse.depth/2-1.55]])[0];
  const arcadeHouse=housingData.structures.find(s=>s.id==='royal-portico-05')!,arcade=porticoPlan(arcadeHouse),arcadePoint=siteUTM(arcadeHouse,[[0,arcade.fz-arcade.depth*.72]])[0],marketSite=centerData.sites.find(s=>s.kind==='covered-market')!,marketPoint=siteUTM(marketSite,[[0,marketSite.depth/2-2]])[0];
  const placaSpawn=townToUTM(0,15,housingData.townFrame),churchBearing=studyConfig.orientation.frontAzimuthDegrees*Math.PI/180;
  const walkSurfaceAt=(e:number,n:number)=>{
    for(const root of[housing,center.root,...(earlyTown.root.visible?earlyTown.root.children.filter(g=>g.visible):[])])if(root.visible)for(const g of root.children)if(g.visible&&g.userData.navigation?.floors.some((p:number[][])=>insidePolygon([e,n],p))){const raw=sampleMeasured(e,n);return raw===null?null:raw+.03;}
    return walkingSurface(e,n,sampleMeasured,fabricData,littoralData,{interpreted:el<HTMLInputElement>('landscape-toggle').checked,canal:chronologyAt(chronologyData,sceneYear).showCanal,bridge:urban.root.visible,port:littoral.root.visible&&littoral.port.visible});
  };
  const walking=makeWalking({camera,orbit:controls,canvas:renderer.domElement,origin:meta.origin,year:()=>sceneYear,
    surface:walkSurfaceAt,
    obstacles:walkingObstacles,spots:[{id:'casa',name:'Façana d’un habitatge · C',e:detailFront[0],n:detailFront[1],yaw:(180-detailHouse.frontAzimuthDegrees)*Math.PI/180,fromYear:1794},{id:'pati',name:'Pati d’un habitatge · C',e:detailYard[0],n:detailYard[1],yaw:-detailHouse.frontAzimuthDegrees*Math.PI/180,fromYear:1794},{id:'porxos',name:'Porxos de les cases rodones',e:arcadePoint[0],n:arcadePoint[1],yaw:(180-arcadeHouse.frontAzimuthDegrees)*Math.PI/180-Math.PI/2,fromYear:1794},{id:'columnata',name:'Columnata de la plaça coberta',e:marketPoint[0],n:marketPoint[1],yaw:(180-marketSite.frontAzimuthDegrees)*Math.PI/180-Math.PI/2,fromYear:1794},{id:'placa',name:'Plaça i carrers',e:placaSpawn.easting,n:placaSpawn.northing,yaw:-housingData.townFrame.alongAzimuthDegrees*Math.PI/180,fromYear:1778},{id:'moll',name:'Moll del Roquer',e:296516,n:4499184,yaw:-1.2,fromYear:1794},{id:'esglesia',name:'Davant l’Església Nova',e:studyConfig.anchor.easting+Math.sin(churchBearing)*28,n:studyConfig.anchor.northing+Math.cos(churchBearing)*28,yaw:-churchBearing-Math.PI,fromYear:1794}],
    onChange:()=>{tween=null;updateVisibility();}
  });
  const life=makeLife(fabricData,littoralData,littoral.boats,meta,walkSurfaceAt);scene.add(life.root);
  const environment=makeEnvironment(fabricData,littoralData,housingData,centerData,meta,walkSurfaceAt);scene.add(environment.root);
  const detailedMaterials=new Set<THREE.Material>(),groundEffects:((on:boolean)=>void)[]=[];
  for(const root of[coarse.mesh,fine.mesh,town.mesh,regionMeasured,historic,historicCoast,urban.root,housing,earlyTown.root])root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;o.receiveShadow=true;const m=o.material as THREE.MeshStandardMaterial;if(detailedMaterials.has(m))return;if(['road','bed','soil'].includes(m.name)||[coarse.mesh,fine.mesh,town.mesh,regionMeasured].includes(root as any)||root===historic||root===historicCoast){groundEffects.push(groundDetail(m));detailedMaterials.add(m);}});
  el('housing-porches').onclick=()=>{el<HTMLSelectElement>('walk-spawn').value='porxos';walking.start();};
  el<HTMLInputElement>('motion-toggle').checked=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const housingTarget=new THREE.Vector3(...toWorld(housingData.townFrame.easting,housingData.townFrame.northing,16,meta.origin));
  const housingOffset=new THREE.Vector3(220,210,340);
  const housingViewTarget=()=>earlyTown.root.visible?new THREE.Vector3(...toWorld(296529,4499342,5,meta.origin)):housingTarget.clone();
  const housingViewOffset=()=>earlyTown.root.visible?new THREE.Vector3(100,95,145):housingOffset;
  const centerTarget=()=>selectedCenter?new THREE.Vector3(...toWorld(selectedCenter.anchor.easting,selectedCenter.anchor.northing,selectedCenter.terrain.technicalBaseElevation+3,meta.origin)):housingTarget.clone().add(new THREE.Vector3(0,0,15));
  const centerOffset=()=>selectedCenter?new THREE.Vector3(1.6,1.25,2).multiplyScalar(Math.max(18,selectedCenter.width,selectedCenter.depth)):new THREE.Vector3(250,240,380);
  const esglesiaIndex=places.findIndex(p=>p.properties.id==='esglesia_nova');
  const buildingTarget=new THREE.Vector3(...toWorld(studyConfig.anchor.easting,studyConfig.anchor.northing,studyConfig.terrain.provisionalBaseElevation+3,meta.origin));
  const labOffset=new THREE.Vector3(58,50,82);
  const updateVisibility=()=>{
    el<HTMLButtonElement>('housing-porches').disabled=sceneYear<1794;el<HTMLButtonElement>('porxos-overview').disabled=sceneYear<1794;
    const curves=el<HTMLInputElement>('contours-toggle').checked;
    const interpreted=el<HTMLInputElement>('landscape-toggle').checked,ch=chronologyAt(chronologyData,sceneYear);
    const earlyState=entityAt(chronologyData,'rental-cohort',sceneYear);
    el('housing-summary').textContent=ch.showTown?'Inventari de 1794: 81 cases i habitacions del patrimoni reial, representades en 58 cossos.':earlyState.visible?`Dotze cases de lloguer · testimoni ${earlyState.fromYear}. Tres plantes i 50–60 m² de planta; emplaçament i detalls C.`:'Encara sense testimoni residencial representat per a aquest any. Les dues Cases de Talavera es mostren des del registre de 1782.';
    el('housing-inventory').hidden=!ch.showTown;
    el('housing-hypothesis').textContent=ch.showTown?'POSICIONS I ALÇATS C · CONTINUÏTAT EL 1800 SENSE VERIFICAR':'TESTIMONI ALTERNATIU · IDENTITAT AMB 1794 DESCONEGUDA';
    el('housing-context').textContent=ch.showTown?'Les 38 propietats privades encara no estan conciliades individualment. La Fonda Nova substitueix dos cossos reservats, sense augmentar les 81 unitats reials.':earlyState.visible?urbanData.limits:'No es pressuposa que el nucli fos buit: s’oculten els models sense un testimoni temporal revisat. Consulta les fonts per distingir absència i desconeixement.';
    el('center-summary').textContent=ch.showTown?'Centre i serveis de l’inventari de 1794. Edificis d’estudi C dins del mapa general.':'Cronologia parcial: només es mostren els edificis amb un testimoni revisat. Les altres fitxes no s’anticipen a una data desconeguda.';

    historic.visible=interpreted&&ch.showCanal;historicCoast.visible=interpreted&&!ch.showCanal;regionMeasured.visible=!interpreted;
    urban.setYear(sceneYear);urban.root.visible=el<HTMLInputElement>('urban-toggle').checked&&interpreted;
    el('urban-list').querySelectorAll<HTMLButtonElement>('button').forEach(b=>{const f=[...fabricData.routes,...fabricData.sites,fabricData.ravine].find((f:any)=>f.id===b.dataset.urban);b.disabled=sceneYear<f.fromYear||sceneYear>(f.toYear??Infinity);b.setAttribute('aria-pressed',String(urbanFocus===f.id));});
    landmarks.setYear(sceneYear);landmarks.root.visible=el<HTMLInputElement>('landmarks-toggle').checked;
    littoral.setYear(sceneYear);earlyTown.setYear(sceneYear);earlyTown.root.visible&&=el<HTMLInputElement>('housing-toggle').checked;
    littoral.routeAnnotation.visible=littoralFocus==='canal'&&interpreted&&ch.showCanal;
    littoral.root.visible=interpreted;el<HTMLButtonElement>('mouth-view').disabled=!ch.showCanal;
    el('landmark-list').querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=!entityAt(chronologyData,b.dataset.landmark!,sceneYear).visible;b.setAttribute('aria-pressed',String(b.dataset.landmark===landmarkFocus));});
    littoral.roquer.visible=el<HTMLInputElement>('littoral-toggle').checked;
    littoral.port.visible=ch.showTown&&littoral.roquer.visible;
    littoral.boats.visible=ch.showTown&&el<HTMLInputElement>('boats-toggle').checked;
    littoral.project.visible=el<HTMLInputElement>('project-toggle').checked&&littoral.roquer.visible;
    littoral.planProject.visible=el<HTMLInputElement>('project1748-toggle').checked&&littoral.roquer.visible;
    if(littoral.planProject.visible){littoral.siteGroups.get('battery')!.visible=false;littoral.project.visible=false;}
    el('landscape-study').setAttribute('aria-pressed',String(interpreted));el('landscape-measured').setAttribute('aria-pressed',String(!interpreted));
    el('ground-legend').textContent=interpreted?'Paisatge interpretat · C':'MDT contemporani mesurat';
    el('landscape-note').textContent=interpreted?'Costa C i aigua tècnica; la costa no canvia amb el selector d’any.':'MDT original. Litoral interpretat, construccions del Roquer i aigua ocults.';
    el<HTMLInputElement>('year-slider').value=String(yearIndex(sceneYear));el('year-value').textContent=String(sceneYear);
    el('year-slider').setAttribute('aria-valuetext',`${sceneYear}; testimoni de ${ch.milestone.year}: ${ch.milestone.label}`);
    el('time-stage').textContent=ch.milestone.state==='continuity'?`Continuïtat d’estudi cap al ${sceneYear}`:ch.milestone.label;
    el('time-note').textContent=ch.milestone.state==='continuity'?(sceneYear>1800?'Escenari de 1800 mantingut · sense reconstrucció de 1801–1950 · només s’hi afegeixen els edificis datats · C':'Base de 1794 · temporal de 1795 sense delimitar · C'):sceneYear===ch.milestone.year?`Fita documental de ${ch.milestone.year} · detalls C`:`Any ${sceneYear} · últim testimoni ${ch.milestone.year} · continuïtat C`;
    el('time-stops').querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.year)===(ch.milestone.state==='continuity'&&sceneYear>=1800?1800:ch.milestone.year))));
    const url=new URL(location.href);if(sceneYear===chronologyData.defaultYear)url.searchParams.delete('any');else url.searchParams.set('any',String(sceneYear));history.replaceState(null,'',url.pathname+url.search+url.hash);
    coarse.mesh.visible=!interpreted;coarse.contours.visible=curves&&!interpreted;
    fine.mesh.visible=!interpreted;fine.contours.visible=curves&&!interpreted;
    town.mesh.visible=!interpreted;town.contours.visible=curves&&!interpreted;
    housing.visible=el<HTMLInputElement>('housing-toggle').checked&&ch.showTown;
    const showCenter=el<HTMLInputElement>('center-toggle').checked;
    center.root.visible=showCenter;colorGround(showCenter&&ch.showTown);historicGround.forEach(apply=>apply(showCenter&&ch.showTown));
    center.root.children.forEach(o=>{if(o.userData.centerId)o.visible=ch.showTown||(o.userData.centerId==='cases-talavera'&&entityAt(chronologyData,'cases-talavera',sceneYear).visible);});
    el('center-list').querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=!ch.showTown&&!(b.dataset.center==='cases-talavera'&&entityAt(chronologyData,'cases-talavera',sceneYear).visible);b.title=b.disabled?'Primer testimoni representat: 1794':'';});
    el('littoral-list').querySelectorAll<HTMLButtonElement>('button').forEach(b=>{b.disabled=!littoral.siteGroups.get(b.dataset.site!)!.visible;b.title=b.disabled?'Sense obra representada en aquest any':'';});
    center.trees.visible=el<HTMLInputElement>('trees-toggle').checked&&entityAt(chronologyData,'alamedes',sceneYear).visible;
    center.manzanaDetails.visible=housing.visible;
    // Estats posteriors d'alguns edificis del centre: la duana (foto de 1890), el campanar de Sant Elm (foto de 1935) i les fonts (foto de 1916).
    {const stageYears:Record<string,number>={'duana-nova':1890,'sant-elm':1935,'font-oest':1916,'font-est':1916};
     for(const g of center.root.children){const from=stageYears[g.userData.centerId],stages=g.userData.stages;if(from&&stages){const later=sceneYear>=from;stages.complete.visible=later;stages.unfinished.visible=!later;}}}
    housing.children.forEach(h=>{h.visible=!showCenter||!replacedHousingIds.has(h.userData.structureId);});
    building.root.visible=ch.showTown;building.observed.visible=laboratory&&ch.showTown&&!walking.active;
    building.massing.visible=studyVolume;
    building.front.visible=!el<HTMLInputElement>('cutaway-toggle').checked;
    building.interior.visible=el<HTMLInputElement>('interior-toggle').checked;
    anchorGroup.visible=el<HTMLInputElement>('anchors-toggle').checked&&!littoralFocus&&!walking.active;
    anchorGroup.children.forEach(object=>{const id=places[object.userData.placeIndex]?.properties.id;object.visible=object.userData.placeIndex!==esglesiaIndex&&!(landmarks.root.visible&&landmarks.groups.get(id)?.visible);});
    el('labels').hidden=!el<HTMLInputElement>('anchors-toggle').checked||!!littoralFocus;
    axisGroup.visible=el<HTMLInputElement>('axis-toggle').checked&&!walking.active;
    controls.minDistance=12;controls.maxDistance=60000;
    el('view-territory').hidden=!laboratory&&!housingFocus&&!centerFocus&&!littoralFocus&&!landmarkFocus&&!mountainFocus&&!urbanFocus;
    document.body.classList.toggle('laboratory',laboratory||housingFocus||centerFocus||!!littoralFocus||!!landmarkFocus||mountainFocus||!!urbanFocus);
    el('esglesia-tools').hidden=!laboratory;el('center-tools').hidden=laboratory;
    const hash=walking.active?"#camina":urbanFocus?'#trama':mountainFocus?'#montsia':landmarkFocus?`#${landmarkFocus}`:littoralFocus?`#${littoralFocus}`:laboratory?'#esglesia':housingFocus?'#habitatges':centerFocus?'#centre':'';
    if(location.hash!==hash)history.replaceState(null,'',`${location.pathname}${location.search}${hash}`);
    el('map-eyebrow').textContent=laboratory?'L’EDIFICI SOBRE EL TERRITORI / 01':'EL TERRITORI COM A DOCUMENT';
    el('map-title').textContent=laboratory?'Església Nova':centerFocus?(selectedCenter?.name??'El centre de la població'):housingFocus?'Cases de la nova població':'La Ràpita i el seu relleu';
    el('map-subtitle').textContent=laboratory?(studyVolume?'Mateix territori / detall de 2 m i volum d’estudi C':'Mateix territori / traça actual aproximada'):housingFocus?'Inventari de 1794 / escenari cap al 1800 / geometria C':'MDT ICGC / 10 m + nucli a 2 m / habitatges d’estudi C';
    if(centerFocus)el('map-subtitle').textContent='Plaça, serveis i obres obertes / document de 1794 / geometria C';
    el('contour-interval').textContent=laboratory||housingFocus||centerFocus?'Equidistància local de 2 metres':'10 m local / 2 m al nucli · Montsià a 50 m';
    el('notice-text').textContent=laboratory?(studyVolume?'Model d’estudi C: alçàries i distribució provisionals. Integrat al terreny general; sense coberta moderna.':'Traça actual aproximada, digitalitzada sobre ortofoto ICGC 2024. Volum hipotètic ocult; planta del 1800 sense validar.'):'81 unitats del patrimoni reial de l’inventari de 1794, en 58 cossos. Ubicacions i alçats C; estat el 1800 sense verificar. Terreny actual.';
    if(centerFocus)el('notice-text').textContent='Centre d’estudi C: posicions i alçats per validar. S’hi distingeixen obres completes i incompletes; sòl actual sense explanació històrica.';
    el('feature-card').hidden=!!urbanFocus||mountainFocus||housingFocus||(centerFocus&&(!selectedCenter||!ch.showTown&&!(selectedCenter.id==='cases-talavera'&&entityAt(chronologyData,'cases-talavera',sceneYear).visible)))||(!!littoralFocus&&!selectedLittoral)||selectedLittoral?.kind==='water-connection';
    if(littoralFocus){el('map-title').textContent=selectedLittoral?.name??(littoralFocus==='canal'?'De la Ràpita a Amposta':littoralFocus==='amposta'?'Amposta · capçalera del canal':'El Roquer i el front marítim');el('map-subtitle').textContent=littoralFocus==='canal'?`${format.format(littoralData.canal.studyLengthMeters/1000)} km de traçat d’assaig C · canal de Carles III`:'Obra executada i projecte separats · fases documentades';}
    if(interpreted&&!littoralFocus)el('map-subtitle').textContent='Montsià a 50 m · nucli a 2 m · costa i edificis d’estudi C';
    if(urbanFocus){el('map-title').textContent=urbanFeature()?.name??'Carrers i serveis de la població';el('map-subtitle').textContent='Planta relacional C · accessos, horts i tallers · testimonis per any';}
    if(mountainFocus){el('map-title').textContent='La serra del Montsià';el('map-subtitle').textContent='MDT LiDAR 2021–2023 · pas de 50 m · escala vertical ×1';}
    if(housingFocus&&!ch.showTown){el('map-title').textContent=earlyState.visible?'Les dotze cases de lloguer':'Primers testimonis d’habitatge';el('map-subtitle').textContent=earlyState.visible?'Informes de 1788–1789 · ubicacions i acabats d’assaig C':'No es representen dates de construcció desconegudes';}
    el('notice-text').textContent=interpreted?'Costa, posicions i alçats d’estudi C. Any '+sceneYear+'; testimoni '+ch.milestone.year+'. Aigua tècnica, sense validar el nivell històric.':'MDT contemporani original. Any '+sceneYear+'; geometria arquitectònica C.';
    if(!ch.showTown)el('notice-text').textContent+=' Abans de 1794: només testimonis datats; conjunt complet encara sense cronologia individual.';
    if(earlyTown.root.visible)el('notice-text').textContent='Dotze cases, testimoni 1788–1789. Emplaçament i acabats C; correspondència amb 1794 desconeguda. No se sumen als altres inventaris.';
    if(landmarkFocus){el('map-title').textContent=landmarkSite().name;el('map-subtitle').textContent='Model d’estudi C · planta i alçat sense mesurar';el('notice-text').textContent=landmarkSite().limits;el('card-category').textContent='MODEL D’ESTUDI · C';}
    if(laboratory)el('card-category').textContent=studyVolume?'MODEL D’ESTUDI · CERTESA C':'TRAÇA ACTUAL · APROXIMACIÓ B';
    el('reference-legend').textContent=littoralFocus==='canal'?'Traçat d’assaig · C':laboratory?'Traça actual · aprox.':'Referència aproximada';
    el('void-legend').hidden=false;
    el('data-status').textContent=`${sceneYear} · Roquer, nucli i canal fins a Amposta · estudi C`;
    el('model-documental').setAttribute('aria-pressed',String(!studyVolume));el('model-study').setAttribute('aria-pressed',String(studyVolume));
    for(const id of['wall-height','cutaway-toggle','interior-toggle'])el<HTMLInputElement>(id).disabled=!studyVolume;
    environment.root.visible=interpreted&&ch.showTown&&el<HTMLInputElement>('environment-toggle').checked;
    environment.docks.visible=littoral.port.visible;environment.courtyards.visible=housing.visible;
    groundEffects.forEach(set=>set(interpreted&&el<HTMLInputElement>('environment-toggle').checked));
    for(const root of[housing,earlyTown.root,center.root,building.root,landmarks.root,littoral.roquer,urban.root])root.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
    renderer.shadowMap.needsUpdate=true;
    life.root.visible=interpreted;
    life.setState({year:sceneYear,playing:el<HTMLInputElement>('motion-toggle').checked,people:el<HTMLInputElement>('people-toggle').checked,animals:el<HTMLInputElement>('animals-toggle').checked});
    el('life-pause').textContent=el<HTMLInputElement>('motion-toggle').checked?'Pausa ambient':'Anima ambient';
    el('life-pause').setAttribute('aria-pressed',String(!el<HTMLInputElement>('motion-toggle').checked));
    walking.revalidate();picker?.hide();
  };
  el('support-note').textContent=`Suport tècnic provisional a ${format.format(studyConfig.terrain.provisionalBaseElevation)} m. No representa una plataforma històrica; el MDT conserva les cotes.`;
  const anchorGroup=new THREE.Group(); scene.add(anchorGroup);
  const markerPositions:THREE.Vector3[]=[], labelButtons:HTMLButtonElement[]=[], placeButtons:HTMLButtonElement[]=[], rings:{index:number;mesh:THREE.Mesh}[]=[];
  places.forEach((place,index)=>{
    const p=place.properties;
    const position=new THREE.Vector3(...toWorld(p.utm_x,p.utm_y,p.terrainHeight??0,meta.origin));
    markerPositions.push(position.clone().add(new THREE.Vector3(0,30,0)));
    if(p.terrainHeight!==null) {
      const ring=new THREE.Mesh(new THREE.RingGeometry(12,15,40),new THREE.MeshBasicMaterial({color:index===0?'#a35d32':'#476b4d',side:THREE.DoubleSide,depthTest:false}));
      ring.rotation.x=-Math.PI/2;ring.position.copy(position).add(new THREE.Vector3(0,.6,0));ring.renderOrder=3;ring.userData.placeIndex=index;anchorGroup.add(ring);rings.push({index,mesh:ring});
      const stemGeometry=new THREE.BufferGeometry().setFromPoints([position.clone().add(new THREE.Vector3(0,1,0)),position.clone().add(new THREE.Vector3(0,30,0))]);
      const stem=new THREE.Line(stemGeometry,new THREE.LineBasicMaterial({color:'#45664c',depthTest:false,transparent:true,opacity:.6}));stem.userData.placeIndex=index;anchorGroup.add(stem);
    }
    const label=document.createElement('button');label.className='marker';label.setAttribute('aria-label',p.shortName);label.onclick=()=>select(index,true);el('labels').append(label);labelButtons.push(label);
    const button=document.createElement('button');button.className='place-button';button.innerHTML=`<span class="place-number">${String(index+1).padStart(2,'0')}</span><span class="place-text"><strong>${escape(p.shortName)}</strong><small>${escape(p.category)}</small></span><span class="go" aria-hidden="true">↗</span>`;
    button.onclick=()=>select(index,true);el('places').append(button);placeButtons.push(button);
  });
  const axisGroup=new THREE.Group();scene.add(axisGroup);axisGroup.visible=false;
  const a=places[0].properties,b=places[2].properties,axisPoints:THREE.Vector3[]=[];
  let previous:THREE.Vector3|null=null;
  for(let i=0;i<=100;i++) {
    const x=THREE.MathUtils.lerp(a.utm_x,b.utm_x,i/100),n=THREE.MathUtils.lerp(a.utm_y,b.utm_y,i/100);
    const h=sampleHeight(meta,heights,valid,x,n);
    const current=h===null?null:new THREE.Vector3(...toWorld(x,n,h+1,meta.origin));
    if(previous&&current)axisPoints.push(previous,current);
    previous=current;
  }
  const axis=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(axisPoints),new THREE.LineDashedMaterial({color:'#b57944',dashSize:10,gapSize:7,depthTest:false}));axis.computeLineDistances();axisGroup.add(axis);
  let tween:{from:THREE.Vector3;to:THREE.Vector3;targetFrom:THREE.Vector3;targetTo:THREE.Vector3;time:number}|null=null;
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const move=(position:THREE.Vector3,target:THREE.Vector3)=>{
    if(walking.active)walking.stop();
    controls.update();
    if(reducedMotion){camera.position.copy(position);controls.target.copy(target);controls.update();return;}
    tween={from:camera.position.clone(),to:position,targetFrom:controls.target.clone(),targetTo:target,time:performance.now()};
  };
  controls.addEventListener('start',()=>{tween=null;});
  function select(index:number,focus:boolean) {
    selected=index;
    if(focus){urbanFocus=null;mountainFocus=false;littoralFocus=null;selectedLittoral=null;landmarkFocus=landmarkData.sites.some(s=>s.id===places[index].properties.id)?places[index].properties.id:null;}
    if(focus){laboratory=index===esglesiaIndex;housingFocus=false;centerFocus=false;selectedCenter=null;}
    const p=places[index].properties;
    for(let i=0;i<places.length;i++) {
      const active=i===index;
      labelButtons[i].classList.toggle('selected',active);
      const built=i===esglesiaIndex||!!(landmarks.root.visible&&landmarks.groups.get(places[i].properties.id)?.visible);
      labelButtons[i].classList.toggle('built',built);
      labelButtons[i].setAttribute('aria-pressed',String(active));
      labelButtons[i].innerHTML=`${String(i+1).padStart(2,'0')}${active||built?`<span>${escape(places[i].properties.shortName)}${built?' · C':''}</span>`:''}`;
      placeButtons[i].setAttribute('aria-pressed',String(active));
      // All current anchors have valid samples; missing samples remain list-only.
    }
    rings.forEach(({index:i,mesh})=>(mesh.material as THREE.MeshBasicMaterial).color.set(i===index?'#a35d32':'#476b4d'));
    el('card-number').textContent=`${String(index+1).padStart(2,'0')} / 06`;
    el('card-category').textContent=laboratory?'MODEL D’ESTUDI · CERTESA C':p.category;
    el('card-title').textContent=p.shortName;
    el('card-description').textContent=p.description;
    el('certainty').textContent=`Existència el 1800 · ${p.certainty.existence1800}`;
    el('altitude').textContent=p.terrainHeight===null?'Cota sense dades':`MDT actual ≈ ${format.format(p.terrainHeight)} m`;
    const collapsed=laboratory||!focus;
    el('card-body').hidden=collapsed;
    el('card-collapse').textContent=collapsed?'+':'−';el('card-collapse').setAttribute('aria-expanded',String(!collapsed));el('card-collapse').setAttribute('aria-label',collapsed?'Desplega la fitxa':'Replega la fitxa');
    updateVisibility();
    if(focus&&p.id==='mercat'){openLittoral('roquer');return;}
    if(focus&&['plaza','coc'].includes(p.id)){openCenter();return;}
    if(focus&&p.terrainHeight!==null) {
      const target=landmarkFocus?landmarkTarget():laboratory?buildingTarget:markerPositions[index].clone().add(new THREE.Vector3(0,-30,0));
      move(target.clone().add(landmarkFocus?landmarkOffset():laboratory?labOffset:new THREE.Vector3(520,480,650)),target.clone());
      if(laboratory||landmarkFocus)activateTab('building');
      else activateTab('places');
      setView('oblique');
    }
  }
  openLaboratory=()=>select(esglesiaIndex,true);
  openHousing=()=>{urbanFocus=null;mountainFocus=false;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;laboratory=false;housingFocus=true;centerFocus=false;selectedCenter=null;el<HTMLInputElement>('housing-toggle').checked=true;activateTab('housing');updateVisibility();move(housingViewTarget().add(housingViewOffset()),housingViewTarget());setView('oblique');};
  // Selecció d'edificis: vora en passar-hi per sobre i expedient lateral en fer clic.
  const dossierData=await dossierPromise,lookup=modelLookup(dossierData),modelObjects=new Map<string,THREE.Object3D>();
  const comments=makeComments({canvas:renderer.domElement,camera,scene,origin:meta.origin,year:()=>sceneYear,
    enabled:()=>!walking.active&&!dialog.open,onStart:()=>{picker.hide();panel.close();},
    focus:point=>move(point.clone().add(new THREE.Vector3(120,100,140)),point)});
  const picker=makePicker({renderer,camera,scene,tooltip:el('pick-tooltip'),enabled:()=>!walking.active&&!dialog.open&&!comments.active,onSelect:(target,info)=>{if(target&&info){picker.setSelection([target]);panel.open(lookup(info.modelId));}else{picker.setSelection([]);panel.close();}}});
  const registerModel=(object:THREE.Object3D|undefined,id:string|undefined)=>{if(!object||!id)return;const found=lookup(id);if(!found.length)return;modelObjects.set(id,object);picker.register(object,{modelId:id,label:found[0].name});};
  for(const g of housing.children)registerModel(g,g.userData.structureId);
  earlyTown.root.traverse(o=>{if(o.userData.structureId)registerModel(o,o.userData.structureId);});
  for(const g of center.root.children)registerModel(g,g.userData.centerId);
  for(const [id,g] of landmarks.groups)registerModel(g,id);
  for(const [id,g] of urban.groups)registerModel(g,id);
  for(const [id,g] of littoral.siteGroups)registerModel(g,id);
  registerModel(building.root,'esglesia_nova');registerModel(building.observed,'esglesia_nova');
  const shownInScene=(o:THREE.Object3D)=>{for(let n:THREE.Object3D|null=o;n;n=n.parent)if(!n.visible)return false;return true;};
  const focusDossier=(d:Dossier)=>{
    const objects=d.modelIds.map(id=>modelObjects.get(id)).filter((o):o is THREE.Object3D=>!!o&&shownInScene(o));
    if(!objects.length)return;
    picker.setSelection(objects);
    const box=new THREE.Box3();objects.forEach(o=>box.expandByObject(o));
    const centre=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()).length();
    const small=size<20;move(centre.clone().add(new THREE.Vector3(.5,small?1.6:.7,small?.8:1).normalize().multiplyScalar(small?38:Math.max(45,size*2.4))),centre);setView('oblique');
  };
  const panel=makeDossierPanel(el('dossier-panel'),dossierData,{onFocus:focusDossier,
    canFocus:d=>d.modelIds.some(id=>{const o=modelObjects.get(id);return !!o&&shownInScene(o);}),
    extra:d=>{
      const parts:string[]=[];
      if(d.modelIds.length){
        const present=d.modelIds.filter(id=>modelObjects.has(id));
        const visible=present.some(id=>shownInScene(modelObjects.get(id)!));
        if(!visible)parts.push(`<p class="dossier-warning">Aquest edifici no és visible a l’escena de ${sceneYear} (primer testimoni representat posterior, capa desactivada o cronologia pròpia). L’expedient conserva totes les fases.</p>`);
      }
      if(/^(cases-porxos|unitat-royal-portico)/.test(d.id))parts.push('<button class="dossier-action" data-action="porxos">Fotografies i restitució dels porxos →</button>');
      return parts.join('');
    },
    onClose:()=>picker.setSelection([]),onAction:(action,d)=>{if(action==='focus')focusDossier(d);if(action==='porxos')void openPorxosEvidence();}});
  el('dossier-index').onclick=()=>{
    const mains=Object.values(dossierData.items).filter(d=>!d.parent);
    showDialog(`<h2>Índex d’expedients</h2><p>${mains.length} expedients principals de docs/EDIFICIS. També es poden obrir fent clic sobre un edifici del mapa; els cossos residencials d’assaig s’hi arriben des del seu edifici o des de l’expedient de la tipologia.</p><input id="dossier-filter" type="search" placeholder="Cerca un edifici o un lloc" aria-label="Cerca un expedient"><nav id="dossier-index-list">${mains.map(d=>`<button class="place-button" data-dossier="${d.id}" data-text="${escape((d.name+' '+d.kind).toLowerCase())}"><span class="place-text"><strong>${escape(d.name)}</strong><small>${escape(d.kind)} · ${d.modelIds.length?'model al mapa':'sense model'}</small></span><span class="go" aria-hidden="true">↗</span></button>`).join('')}</nav>`);
    el<HTMLInputElement>('dossier-filter').oninput=e=>{const q=(e.target as HTMLInputElement).value.trim().toLowerCase();el('dossier-index-list').querySelectorAll<HTMLElement>('button').forEach(b=>{b.hidden=!!q&&!b.dataset.text!.includes(q);});};
    el('dossier-index-list').onclick=e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-dossier]');if(!b)return;dialog.close();const d=dossierData.items[b.dataset.dossier!];panel.open([d],{focus:true});};
  };
  el('porxos-overview').onclick=()=>{openHousing();const t=townToUTM(-1,-131,housingData.townFrame),p=townToUTM(9,-69,housingData.townFrame),h=sampleUrban(t.easting,t.northing)??10;move(new THREE.Vector3(...toWorld(p.easting,p.northing,h+26,meta.origin)),new THREE.Vector3(...toWorld(t.easting,t.northing,h+2,meta.origin)));};
  openCenter=()=>{urbanFocus=null;mountainFocus=false;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;laboratory=false;housingFocus=false;centerFocus=true;selectedCenter=null;el<HTMLInputElement>('center-toggle').checked=true;activateTab('building');el('center-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed','false'));updateVisibility();move(centerTarget().add(centerOffset()),centerTarget());setView('oblique');};
  for(const [index,site]of centerData.sites.entries()){
    const button=document.createElement('button');button.className='place-button';button.dataset.center=site.id;button.innerHTML=`<span class="place-number">${String(index+1).padStart(2,'0')}</span><span class="place-text"><strong>${escape(site.name)}</strong><small>${escape(site.state1794)}</small></span><span class="go">↗</span>`;
    button.onclick=()=>{urbanFocus=null;mountainFocus=false;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;selectedCenter=site;laboratory=false;housingFocus=false;centerFocus=true;el<HTMLInputElement>('center-toggle').checked=true;updateVisibility();
      el('card-number').textContent=`C${String(index+1).padStart(2,'0')} / 09`;el('card-category').textContent='EDIFICI D’ESTUDI · C';el('card-title').textContent=site.name;el('card-description').textContent=site.state1794+'.';
      el('certainty').textContent='Posició i alçat · C';el('altitude').textContent='Evidència de 1794';el('card-body').hidden=false;el('card-collapse').textContent='−';el('card-collapse').setAttribute('aria-expanded','true');el('card-collapse').setAttribute('aria-label','Replega la fitxa');
      move(centerTarget().add(centerOffset()),centerTarget());setView('oblique');
      el('center-list').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));};
    el('center-list').append(button);
  }
  openLittoral=(kind,site=null)=>{
    urbanFocus=null;mountainFocus=false;landmarkFocus=null;littoralFocus=kind;selectedLittoral=site;selectedCenter=null;laboratory=false;housingFocus=false;centerFocus=false;
    el<HTMLInputElement>('littoral-toggle').checked=true;el<HTMLInputElement>('landscape-toggle').checked=true;activateTab('littoral');
    updateVisibility();
    if(site){el('card-number').textContent='ROQUER / LITORAL';el('card-category').textContent='MODEL D’ESTUDI · C';el('card-title').textContent=site.name;el('card-description').textContent=site.state;el('certainty').textContent='Planta i alçat · C';el('altitude').textContent='Fase documental '+chronologyAt(chronologyData,sceneYear).milestone.year;el('card-body').hidden=true;el('card-collapse').textContent='+';el('card-collapse').setAttribute('aria-expanded','false');el('card-collapse').setAttribute('aria-label','Desplega la fitxa');}
    el('littoral-list').querySelectorAll<HTMLButtonElement>('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.site===site?.id)));
    for(const id of['roquer','canal','amposta'])el(id==='amposta'?'amposta-view':`${id}-overview`).setAttribute('aria-pressed',String(kind===id&&site?.kind!=='water-connection'));
    el('mouth-view').setAttribute('aria-pressed',String(site?.kind==='water-connection'));
    move(littoralTarget().add(littoralOffset()),littoralTarget());setView('oblique');
  };
  for(const [index,site]of littoralData.sites.entries()){
    const button=document.createElement('button');button.className='place-button';button.dataset.site=site.id;button.innerHTML=`<span class="place-number">${String(index+1).padStart(2,'0')}</span><span class="place-text"><strong>${escape(site.name)}</strong><small>${escape(site.state)}</small></span><span class="go">↗</span>`;button.onclick=()=>openLittoral('roquer',site);el('littoral-list').append(button);
  }
  el('roquer-overview').onclick=()=>openLittoral('roquer');el('canal-overview').onclick=()=>openLittoral('canal');el('amposta-view').onclick=()=>openLittoral('amposta');
  el('landscape-study').onclick=()=>{el<HTMLInputElement>('landscape-toggle').checked=true;updateVisibility();};el('landscape-measured').onclick=()=>{el<HTMLInputElement>('landscape-toggle').checked=false;updateVisibility();};
  const changeYear=(year:number)=>{sceneYear=chronologyAt(chronologyData,year).year;updateVisibility();};
  el<HTMLInputElement>('year-slider').oninput=e=>changeYear(yearStops[Number((e.target as HTMLInputElement).value)]);
  const stops=[...chronologyData.milestones.filter((x:any)=>x.year!==1800),{year:1800,label:'Escenari de 1800 · continuïtat C'}].sort((a:any,b:any)=>a.year-b.year);
  for(const m of stops){const button=document.createElement('button');button.textContent=String(m.year);button.dataset.year=String(m.year);button.style.left=`${yearIndex(m.year)/(yearStops.length-1)*100}%`;button.title=`${m.year} · ${m.label}`;if(m.minorTick)button.className='minor-stop';button.setAttribute('aria-label',`${m.year}: ${m.label}`);button.onclick=()=>changeYear(m.year);el('time-stops').append(button);}
  for(const id of['littoral-toggle','landscape-toggle','project-toggle','project1748-toggle','boats-toggle'])el<HTMLInputElement>(id).onchange=updateVisibility;
  el('roquer-plan-view').onclick=()=>{openLittoral('roquer');el<HTMLInputElement>('urban-toggle').checked=true;el<HTMLInputElement>('project1748-toggle').checked=true;updateVisibility();const t=new THREE.Vector3(...toWorld(296414,4499199,5,meta.origin));move(t.clone().add(new THREE.Vector3(0,190,.01)),t);setView('top');};
  for(const s of landmarkData.sites){const button=document.createElement('button');button.className='place-button';button.dataset.landmark=s.id;button.innerHTML=`<span class="place-number">↗</span><span class="place-text"><strong>${escape(s.name)}</strong><small>${escape(s.state)}</small></span>`;button.onclick=()=>select(places.findIndex(p=>p.properties.id===s.id),true);el('landmark-list').append(button);}
  el('mouth-view').onclick=()=>openLittoral('roquer',{id:'canal-mouth',name:'Desembocadura del canal',kind:'water-connection',anchor:[296610,4499420],radius:45,technicalBaseElevation:.45,state:'Canal, dàrsena i mar units · geometria d’assaig C',evidence:'H02, art. 18–20. La connexió oberta es representa com a hipòtesi C, sense atribuir-li amplada històrica mesurada.'});
  openUrban=(id='$overview')=>{urbanFocus=id;mountainFocus=false;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;laboratory=false;housingFocus=false;centerFocus=false;selectedCenter=null;el<HTMLInputElement>('urban-toggle').checked=true;el<HTMLInputElement>('landscape-toggle').checked=true;activateTab('urban');const f=urbanFeature();el('urban-selection').textContent=f?f.evidence:'Testimonis de 1780, 1782 i 1794. Plantes i traçats C; inventaris sense duplicacions.';updateVisibility();move(urbanTarget().add(urbanOffset()),urbanTarget());setView('oblique');};
  for(const f of[...fabricData.routes,...fabricData.sites,fabricData.ravine]){const b=document.createElement('button');b.className='place-button';b.dataset.urban=f.id;b.innerHTML=`<span class="place-number">↗</span><span class="place-text"><strong>${escape(f.name)}</strong><small>Testimoni ${f.fromYear} · geometria C</small></span>`;b.onclick=()=>openUrban(f.id);el('urban-list').append(b);}
  el('urban-overview').onclick=()=>openUrban();
  el('future-evidence').onclick=async()=>{const d=await get<any>('history-catalog.json');showDialog(`<h2>Documents per a les fases fins al 1950</h2><p>Prioritat actual: carrers, cases i serveis del 1800. El selector actiu cobreix 1778–1800; aquests testimonis es conserven per ampliar-lo amb fases contrastades.</p>${d.records.map((r:any)=>`<h3>${escape(r.name)} · ${r.years.map(String).join(' / ')}</h3><p>${escape(r.reason)}</p>${r.url?`<a href="${escape(r.url)}" target="_blank" rel="noreferrer">Consulta la font ↗</a>`:`<p>${escape(r.source??'')}</p>`}`).join('')}<h3>Plànol de 1852 reproduït a la tesi</h3><img class="source-plan" src="${import.meta.env.BASE_URL}data/reference/plan-1852.jpg" alt="Plànol posterior que diferencia obra existent, projecte i enderrocs"><p>ACA MPD 223 · reproducció de H01, p. 233. No s’ha georeferenciat ni incorporat com a obra del 1800.</p><h3>Ortofoto 1945–1946</h3><img class="source-plan" src="${import.meta.env.BASE_URL}data/${d.ortho.image}" alt="Ortofoto històrica ICGC de la Ràpita entre 1945 i 1946"><p>${escape(d.ortho.credit)}. ${escape(d.ortho.limits)}</p>`);};el<HTMLInputElement>('urban-toggle').onchange=updateVisibility;
  el('urban-evidence').onclick=()=>showDialog(`<h2>Carrers, serveis i propietats</h2><p>Planta relacional d'estudi. Encara no és un parcel·lari georeferenciat del 1800.</p><h3>El conjunt privat</h3><p>38 cases i habitacions de diversos usos. El nombre residencial i el saldo individual desconeguts continuen en null.</p><ul>${fabricData.privateLedger.entries.map((e:any)=>`<li><strong>${escape(e.name)}</strong> · ${escape(e.status)}</li>`).join('')}</ul><h3>Fonts</h3><ul>${fabricData.sources.map((f:any)=>`<li>${f.url?`<a href="${escape(f.url)}" target="_blank" rel="noreferrer">${escape(f.title)}</a>`:escape(f.title)}<br>${escape(f.use)}</li>`).join('')}</ul><h3>Límits</h3><ul>${fabricData.limits.map((s:string)=>`<li>${escape(s)}</li>`).join('')}</ul>`);
  el('center-overview').onclick=openCenter;
  el('center-esglesia').onclick=openLaboratory;
  el('lab-open').onclick=openLaboratory;
  el('model-study').onclick=()=>{studyVolume=true;updateVisibility();};
  el('model-documental').onclick=()=>{studyVolume=false;updateVisibility();};
  const rebuildModel=()=>{
    const height=Number(el<HTMLInputElement>('wall-height').value);building.rebuild(height);el('wall-height-value').textContent=`${format.format(height)} m`;updateVisibility();
  };
  el<HTMLInputElement>('wall-height').oninput=rebuildModel;
  el<HTMLInputElement>('cutaway-toggle').onchange=updateVisibility;
  el<HTMLInputElement>('interior-toggle').onchange=updateVisibility;
  el('model-reset').onclick=()=>{el<HTMLInputElement>('wall-height').value=String(studyConfig.preview.wallHeightMeters);el<HTMLInputElement>('cutaway-toggle').checked=false;el<HTMLInputElement>('interior-toggle').checked=true;studyVolume=true;rebuildModel();};
  function setView(view:'top'|'oblique') {
    el('view-top').setAttribute('aria-pressed',String(view==='top'));
    el('view-oblique').setAttribute('aria-pressed',String(view==='oblique'));
  }
  el('view-top').onclick=()=>{const t=urbanFocus?urbanTarget():mountainFocus?mountainTarget():landmarkFocus?landmarkTarget():littoralFocus?littoralTarget():laboratory?buildingTarget.clone():centerFocus?centerTarget():housingFocus?housingViewTarget():controls.target.clone();move(t.clone().add(new THREE.Vector3(0,urbanFocus?(urbanFocus==='$overview'?700:180):mountainFocus?11000:landmarkFocus?110:littoralFocus?(littoralFocus==='canal'?18000:littoralFocus==='amposta'?450:selectedLittoral?selectedLittoral.radius*5:650):laboratory?100:centerFocus?(selectedCenter?Math.max(80,selectedCenter.depth*3):450):housingFocus?500:1700,.1)),t);setView('top');};
  const reset=()=>{move(urbanFocus?urbanTarget().add(urbanOffset()):mountainFocus?mountainTarget().add(mountainOffset()):landmarkFocus?landmarkTarget().add(landmarkOffset()):littoralFocus?littoralTarget().add(littoralOffset()):laboratory?buildingTarget.clone().add(labOffset):centerFocus?centerTarget().add(centerOffset()):housingFocus?housingViewTarget().add(housingViewOffset()):new THREE.Vector3(750,850,1250),urbanFocus?urbanTarget():mountainFocus?mountainTarget():landmarkFocus?landmarkTarget():littoralFocus?littoralTarget():laboratory?buildingTarget.clone():centerFocus?centerTarget():housingFocus?housingViewTarget():new THREE.Vector3(-250,20,120));setView('oblique');};
  el('view-oblique').onclick=reset;el('reset').onclick=reset;
  const fullTarget=new THREE.Vector3(...toWorld(regionMeta.west+(regionMeta.width-1)*regionMeta.step/2,regionMeta.north-(regionMeta.height-1)*regionMeta.step/2,100,meta.origin));
  const fullView=()=>{const span=Math.max((regionMeta.width-1)*regionMeta.step,(regionMeta.height-1)*regionMeta.step),distance=span/(2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*Math.min(1,camera.aspect))*1.18;move(fullTarget.clone().add(new THREE.Vector3(.18,.92,.35).normalize().multiplyScalar(distance)),fullTarget);setView('oblique');};
  el('view-full').onclick=fullView;
  el('montsia-view').onclick=()=>{urbanFocus=null;mountainFocus=true;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;laboratory=false;housingFocus=false;centerFocus=false;selectedCenter=null;updateVisibility();const t=mountainTarget();move(t.clone().add(mountainOffset()),t);setView('oblique');};
  el('view-territory').onclick=()=>{urbanFocus=null;mountainFocus=false;landmarkFocus=null;littoralFocus=null;selectedLittoral=null;laboratory=false;housingFocus=false;centerFocus=false;selectedCenter=null;studyVolume=true;activateTab('places');select(selected,false);reset();};
  const zoom=(factor:number)=>{const target=tween?.targetTo.clone()??controls.target.clone(),position=tween?.to.clone()??camera.position.clone(),delta=position.sub(target);delta.multiplyScalar(factor);delta.clampLength(controls.minDistance,controls.maxDistance);move(target.clone().add(delta),target);};
  el('zoom-in').onclick=()=>zoom(.75);el('zoom-out').onclick=()=>zoom(1.33);
  el<HTMLInputElement>('wire-toggle').onchange=e=>{coarse.material.wireframe=(e.target as HTMLInputElement).checked;fine.material.wireframe=coarse.material.wireframe;town.material.wireframe=coarse.material.wireframe;(regionMeasured.material as THREE.MeshStandardMaterial).wireframe=coarse.material.wireframe;for(const root of[historic,historicCoast])root.traverse(o=>{if(o instanceof THREE.Mesh)(o.material as THREE.MeshStandardMaterial).wireframe=coarse.material.wireframe;});};
  el<HTMLInputElement>('housing-toggle').onchange=updateVisibility;
  el<HTMLInputElement>('center-toggle').onchange=updateVisibility;
  el<HTMLInputElement>('trees-toggle').onchange=updateVisibility;
  el<HTMLInputElement>('landmarks-toggle').onchange=updateVisibility;
  el<HTMLInputElement>('contours-toggle').onchange=updateVisibility;
  let showAnchors=true;
  el<HTMLInputElement>('anchors-toggle').onchange=e=>{showAnchors=(e.target as HTMLInputElement).checked;updateVisibility();};
  el<HTMLInputElement>('axis-toggle').onchange=updateVisibility;
  window.addEventListener('keydown',e=>{if(walking.active||dialog.open || (e.target instanceof HTMLElement && ['INPUT','BUTTON','SELECT'].includes(e.target.tagName)))return;if(e.key.toLowerCase()==='r')reset();if(/^[1-6]$/.test(e.key))select(Number(e.key)-1,true);});
  const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);picker.resize();camera.aspect=width/height;camera.updateProjectionMatrix();};
  new ResizeObserver(resize).observe(host);resize();select(initialHash==='#esglesia'?esglesiaIndex:0,initialHash==='#esglesia');
  if(['#habitatges','#viviendas'].includes(initialHash))openHousing();
  if(['#centre','#centro'].includes(initialHash))openCenter();
  if(['#roquer','#canal','#amposta'].includes(initialHash))openLittoral(initialHash.slice(1) as 'roquer'|'canal'|'amposta');
  if(['#glorieta','#guardiola'].includes(initialHash))select(places.findIndex(p=>p.properties.id===initialHash.slice(1)),true);
  if(initialHash==='#trama')openUrban();
  if(initialHash==='#camina'){openUrban();walking.start();}
  if(initialHash==='#montsia')el('montsia-view').click();
  el('loading').hidden=true;
  const routeLabels=[{name:'La Ràpita',e:296600,n:4499420,focus:'roquer'},{name:'Canal de Carles III · C',e:296340,n:4505400,focus:'canal'},{name:'Amposta · capçalera',e:littoralData.canal.routeStudy.at(-1)[0],n:littoralData.canal.routeStudy.at(-1)[1],focus:'amposta'}].map(s=>{const button=document.createElement('button');button.className='route-marker';button.textContent=s.name;button.onclick=()=>openLittoral(s.focus as 'roquer'|'canal'|'amposta');el('route-labels').append(button);return{button,position:new THREE.Vector3(...toWorld(s.e,s.n,3,meta.origin))};});
  for(const id of ['people-toggle','animals-toggle','motion-toggle','environment-toggle'])el<HTMLInputElement>(id).onchange=updateVisibility;
  el('life-pause').onclick=()=>{const toggle=el<HTMLInputElement>('motion-toggle');toggle.checked=!toggle.checked;updateVisibility();};
  let frame=0,lastRenderTime=performance.now();
  const render=()=>{
    requestAnimationFrame(render);
    const currentTime=performance.now(),dt=Math.min((currentTime-lastRenderTime)/1000,.25);lastRenderTime=currentTime;
    if(document.hidden)return;
    if(tween) {
      const t=Math.min((performance.now()-tween.time)/850,1),s=t*t*(3-2*t);
      camera.position.lerpVectors(tween.from,tween.to,s);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,s);
      if(t===1)tween=null;
    }
    life.update(dt);
    if(walking.active)walking.update(dt);else controls.update();renderer.render(scene,camera);
    if(!walking.active)picker.renderHighlights();
    comments.update();
    const rect=host.getBoundingClientRect();
    for(const label of routeLabels){const p=label.position.clone().project(camera),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;label.button.hidden=littoralFocus!=='canal'||!el<HTMLInputElement>('landscape-toggle').checked||!chronologyAt(chronologyData,sceneYear).showCanal||p.z>=1||x<15||x>rect.width-15||y<15||y>rect.height-55;label.button.style.left=`${Math.min(rect.width-130,x+15)}px`;label.button.style.top=`${y}px`;}
    const occupied:{x:number;y:number}[]=[];
    const priority=[selected,...places.map((_,i)=>i).filter(i=>i!==selected)];
    for(const i of priority) {
      const position=markerPositions[i].clone().project(camera),button=labelButtons[i];
      const x=(position.x*.5+.5)*rect.width,y=(-position.y*.5+.5)*rect.height-(i===esglesiaIndex?28:0);
      const visible=(!laboratory||i!==esglesiaIndex)&&showAnchors&&places[i].properties.terrainHeight!==null&&position.z<1&&position.z>-1&&x>12&&x<rect.width-12&&y>12&&y<rect.height-12&&!occupied.some(p=>Math.abs(p.x-x)<(i===selected?120:38)&&Math.abs(p.y-y)<32);
      button.hidden=!visible;
      if(visible){button.style.left=`${x}px`;button.style.top=`${y}px`;occupied.push({x,y});}
    }
    const placedFlags:{x:number;y:number}[]=[];
    for(const flag of flags){
      const group=urban.groups.get(flag.id),shown=!!group?.visible&&urban.root.visible&&!walking.active&&!el('labels').hidden;
      flag.stem.visible=shown;
      const p=flag.top.clone().project(camera),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;
      flag.button.hidden=!shown||p.z>=1||x<10||x>rect.width-10||y<40||y>rect.height-60;
      if(!flag.button.hidden){
        // Si dos cartells coincideixen a la pantalla, el segon puja perquè es llegeixin tots dos.
        let top=y;for(const other of placedFlags)if(Math.abs(other.x-x)<150&&Math.abs(other.y-top)<28)top=other.y-30;
        placedFlags.push({x,y:top});flag.button.style.left=`${x}px`;flag.button.style.top=`${top}px`;
      }
    }
    const target=controls.target.clone().project(camera),north=controls.target.clone().add(new THREE.Vector3(0,0,-200)).project(camera);
    el('north-arrow').style.transform=`rotate(${Math.atan2((north.x-target.x)*rect.width,(north.y-target.y)*rect.height)*180/Math.PI}deg)`;
    if(frame++%30===0)el('render-status').textContent=`EPSG:25831 · ${format.format(renderer.info.render.triangles)} triangles`;
  };
  renderer.domElement.addEventListener('webglcontextlost',event=>{event.preventDefault();el('loading').hidden=false;el('loading').innerHTML='<h2>S’ha interromput el visor 3D</h2><p>Recarrega la pàgina per recuperar el context gràfic.</p><button id="retry">Recarrega</button>';el('retry').onclick=()=>location.reload();});
  render();
}
start().catch(error=>{
  console.error(error);
  el('loading').hidden=false;
  el('loading').innerHTML=`<h2>No s’ha pogut obrir el terreny</h2><p>${escape(error instanceof Error?error.message:String(error))}</p><p>Comprova que WebGL 2 estigui disponible i que les dades s’hagin generat amb npm run data:prepare.</p><button id="retry">Torna-ho a provar</button>`;
  el('retry').onclick=()=>location.reload();
  el('data-status').textContent='Visor sense carregar · consulta les dades locals';
});

