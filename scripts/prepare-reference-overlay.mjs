import {readFile,writeFile} from 'node:fs/promises';
import {referenceOverlayData} from '../src/reference-layout.mjs';
import {port1945OverlayData} from '../src/port-overlay-plan.mjs';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const [reference,housing]=await Promise.all([read('data/layout-reference-1800.json'),read('data/housing-1794.json')]);
await writeFile(new URL('public/data/plan-reverte.json',root),JSON.stringify(referenceOverlayData(reference,housing.townFrame),null,2)+'\n');
await writeFile(new URL('public/data/plan-port-1945.json',root),JSON.stringify(port1945OverlayData(await read('public/data/harbour-history.json')),null,2)+'\n');
console.log('Pilar Reverté overlay: shared sketch registration, original image, map-only pixel bounds.');
