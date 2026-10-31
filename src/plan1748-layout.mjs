/** Shared similarity transform for the overlay, traced geometry and documentary positions. */
export function planPixelToUTM(px,py,data,params){
  const g=data.georeference,p=params??{rotation:g.rotationDegrees,scale:g.metersPerPixel,dE:g.offsetMeters[0],dN:g.offsetMeters[1]};
  const a=p.rotation*Math.PI/180,x=(px-g.anchorPixel[0])*p.scale,y=-(py-g.anchorPixel[1])*p.scale;
  return [g.anchorUTM[0]+p.dE+x*Math.cos(a)-y*Math.sin(a),g.anchorUTM[1]+p.dN+x*Math.sin(a)+y*Math.cos(a)];
}
export const traceUTM=(points,data)=>points.map(p=>planPixelToUTM(...p,data));
export const traceCenter=points=>[0,1].map(i=>points.reduce((sum,p)=>sum+p[i],0)/points.length);
/** Local rectangular approximation is only used by legacy models, never by the traced footprints. */
export function traceBounds(points,anchor,degrees){
  const a=degrees*Math.PI/180,local=points.map(([e,n])=>[(e-anchor[0])*Math.cos(a)-(n-anchor[1])*Math.sin(a),-(e-anchor[0])*Math.sin(a)-(n-anchor[1])*Math.cos(a)]);
  return {width:Math.max(...local.map(p=>p[0]))-Math.min(...local.map(p=>p[0])),depth:Math.max(...local.map(p=>p[1]))-Math.min(...local.map(p=>p[1]))};
}
