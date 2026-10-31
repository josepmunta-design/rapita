import {sampleHeight} from './geo.mjs';

/** Surround, rather than overlap, the local mesh. Every boundary vertex is local.
 * @returns {Array<Array<[number,number,number]>>}
 */
export function contextTriangles(meta,h,v,local,lh,lv){
  const west=local.west,east=west+(local.width-1)*local.step,north=local.north,south=north-(local.height-1)*local.step;
  const xs=[...new Set([...Array.from({length:meta.width},(_,i)=>meta.west+i*meta.step),west,east])].sort((a,b)=>a-b);
  const ns=[...new Set([...Array.from({length:meta.height},(_,i)=>meta.north-i*meta.step),north,south])].sort((a,b)=>b-a);
  const onBoundary=(e,n)=>((e===west||e===east)&&n<=north&&n>=south)||((n===north||n===south)&&e>=west&&e<=east);
  const sample=(m,heights,valid,e,n)=>{
    const x=(e-m.west)/m.step,y=(m.north-n)/m.step;
    if(Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&x<m.width&&y>=0&&y<m.height){const i=y*m.width+x;return valid[i]?heights[i]:null;}
    return sampleHeight(m,heights,valid,e,n);
  };
  const level=(e,n)=>onBoundary(e,n)?sample(local,lh,lv,e,n):sample(meta,h,v,e,n);
  const faces=[];
  for(let row=0;row<ns.length-1;row++)for(let col=0;col<xs.length-1;col++){
    const a=xs[col],b=xs[col+1],top=ns[row],bottom=ns[row+1],ce=(a+b)/2,cn=(top+bottom)/2;
    if(ce>west&&ce<east&&cn<north&&cn>south)continue;
    // Counter-clockwise when viewed from above in the browser's X/Z system.
    const corners=[[a,top],[a,bottom],[b,bottom],[b,top]],polygon=[];
    for(let k=0;k<4;k++){
      const p=corners[k],q=corners[(k+1)%4];polygon.push(p);
      if(onBoundary(...p)&&onBoundary(...q)){
        const length=Math.hypot(q[0]-p[0],q[1]-p[1]),count=Math.round(length/local.step);
        for(let j=1;j<count;j++)polygon.push([p[0]+(q[0]-p[0])*j/count,p[1]+(q[1]-p[1])*j/count]);
      }
    }
    const points=polygon.map(([e,n])=>{const z=level(e,n);return z===null?null:[e,n,z];});
    if(polygon.length===4){
      for(const ids of[[0,1,3],[3,1,2]])if(ids.every(i=>points[i]))faces.push(ids.map(i=>points[i]));
    }else if(points.every(Boolean)){
      // A visual transition cell only: no change to either source buffer.
      const z=points.reduce((sum,p)=>sum+p[2],0)/points.length,center=[ce,cn,z];
      for(let i=0;i<points.length;i++)faces.push([center,points[i],points[(i+1)%points.length]]);
    }
  }
  return faces;
}
