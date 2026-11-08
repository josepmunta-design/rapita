import {readFile,writeFile} from 'node:fs/promises';
import {coastalBuildingAudit} from '../src/coastal-buildings.mjs';
const read=async file=>JSON.parse(await readFile(new URL('../public/data/'+file,import.meta.url),'utf8'));
const [urban,littoral,housing,center,landmarks]=await Promise.all(['urban-fabric.json','littoral.json','housing.json','center.json','landmarks.json'].map(read));
const report=coastalBuildingAudit({urban,littoral,housing,center,landmarks});
if(process.argv.includes('--report'))await writeFile(new URL('../public/data/coastal-building-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
if(report.unsupportedBuildings.length){console.error(JSON.stringify(report.unsupportedBuildings,null,2));process.exitCode=1;}else console.log('Coastal building audit: '+report.buildings+' building groups / '+report.footprints+' footprints, '+report.samples+' samples, no unsupported buildings in 1800.');
