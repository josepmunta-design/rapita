import {townToUTM} from './housing-plan.mjs';
export function referenceTown(point,reference){const r=reference.registration,a=r.imageAxisDegrees*Math.PI/180,x=point[0]-r.pixelOrigin[0],y=point[1]-r.pixelOrigin[1];return[r.townOrigin[0]+r.metersPerPixel*(x*Math.cos(a)+y*Math.sin(a)),r.townOrigin[1]+r.metersPerPixel*(x*Math.sin(a)-y*Math.cos(a))];}
export function referenceUTM(point,reference,frame){const p=townToUTM(...referenceTown(point,reference),frame);return[p.easting,p.northing];}
/** Same pixel transform as the traced buildings, expressed for the terrain overlay. */
export function referenceOverlayData(reference,frame){return{
 id:'plan-reverte',title:'Croquis de Pilar Reverté · població i port de 1794',source:reference.source,
 image:reference.image.replace(/^public\/data\//,''),imageSize:reference.imageSize,
 pixelBounds:[0,0,reference.imageSize[0],590],
 georeference:{anchorPixel:reference.registration.pixelOrigin,anchorUTM:referenceUTM(reference.registration.pixelOrigin,reference,frame),metersPerPixel:reference.registration.metersPerPixel,rotationDegrees:reference.registration.imageAxisDegrees-frame.alongAzimuthDegrees,offsetMeters:[0,0],confidence:'C',method:reference.registration.basis},
 limits:'Croquis interpretatiu publicat el 2024 sobre l’estat de 1794; no és un aixecament original del 1800. Els ajustos de la capa només mouen la imatge.'
};}
