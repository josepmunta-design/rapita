/** Original comparator capture → official ICGC UTM grid, using the archived registration. */
export function port1945OverlayData(history){
 const phase=history.phases.find(p=>p.fromYear===1945),m=phase.registration.matrix,reference=history.reference,step=(reference.bbox[2]-reference.bbox[0])/reference.width;
 return{id:'plan-port-1945',title:'Ortofoto del port i la població · 1945–1946',image:'reference/port/1945-1946.png',imageSize:[1920,1080],pixelBounds:[48,190,1900,940],
  source:'PORT/1945-1946.png · captura del Comparador històric de Catalunya, ICGC',sourcePeriod:[1945,1946],
  georeference:{anchorPixel:[0,0],anchorUTM:[reference.bbox[0]+m[0][2]*step,reference.bbox[3]-m[1][2]*step],metersPerPixel:Math.hypot(m[0][0],m[1][0])*step,rotationDegrees:-Math.atan2(m[1][0],m[0][0])*180/Math.PI,offsetMeters:[0,0],crs:'EPSG:25831',registrationRMSEMeters:phase.registration.rmseMeters,registrationInliers:phase.registration.inliers},
  limits:'Fotografia de 1945–1946: permet comparar localitzacions, sense convertir els edificis i la costa fotografiats en testimonis de 1800. El retall exclou els controls del navegador.'};
}
