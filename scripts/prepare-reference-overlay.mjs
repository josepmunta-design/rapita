import {readFile,writeFile} from 'node:fs/promises';
import {referenceOverlayData} from '../src/reference-layout.mjs';
import {port1945OverlayData} from '../src/port-overlay-plan.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const [reference,housing]=await Promise.all([read('data/layout-reference-1800.json'),read('data/housing-1794.json')]);
await writeFile(new URL('public/data/plan-reverte.json',root),JSON.stringify(referenceOverlayData(reference,housing.townFrame),null,2)+'\n');
await writeFile(new URL('public/data/plan-port-1945.json',root),JSON.stringify(port1945OverlayData(await read('public/data/harbour-history.json')),null,2)+'\n');

// Mapa actual ICGC (topogràfic i ortofoto 2024), imatges WMS en EPSG:25831 orientades al nord: registre exacte per la bbox de la petició.
const icgc=(id,title,image,bbox,size,request)=>({id,title,image,imageSize:size,source:'ICGC · '+request,
 georeference:{anchorPixel:[0,0],anchorUTM:[bbox[0],bbox[3]],metersPerPixel:(bbox[2]-bbox[0])/size[0],rotationDegrees:0,offsetMeters:[0,0],crs:'EPSG:25831',method:'Bbox exacta de la petició WMS'},
 limits:'Mapa contemporani: serveix per comparar emplaçaments i alineacions, no és un testimoni de 1800.'});
const icgcLayers={id:'plan-icgc-actual',variants:[
 icgc('icgc-topografic-nucli','Mapa topogràfic ICGC · nucli','reference/icgc/topografic-nucli.jpg',[296200,4499050,296650,4499600],[1350,1650],'mapa-base topografic, docs/sources/nucleo-topografico-request.txt'),
 icgc('icgc-ortofoto-nucli','Ortofoto ICGC 2024 · nucli','reference/icgc/ortofoto-2024-nucli.jpg',[296200,4499050,296650,4499600],[1350,1650],'orto-territorial ortofoto_color_2024, docs/sources/nucleo-ortofoto-request.txt'),
 icgc('icgc-topografic-territori','Mapa topogràfic ICGC · nucli, canal i Amposta','reference/icgc/topografic-territori.jpg',[294500,4499000,298500,4510500],[1200,3450],'mapa-base topografic, docs/sources/canal-topographic-request.txt')]};
await writeFile(new URL('public/data/plan-icgc-actual.json',root),JSON.stringify(icgcLayers,null,2)+'\n');
console.log('Pilar Reverté overlay: shared sketch registration, original image, map-only pixel bounds.');
