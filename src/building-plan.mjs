/** Local x runs along the facade; local z points out through the facade. */
export function planToUTM(x, z, anchor, frontAzimuthDegrees) {
  const r=(180-frontAzimuthDegrees)*Math.PI/180;
  return [anchor.easting+x*Math.cos(r)+z*Math.sin(r),anchor.northing+x*Math.sin(r)-z*Math.cos(r)];
}

/** Rectangular panels around real apertures, avoiding CSG and solid walls behind windows. */
export function wallPanels(length, height, openings=[], trimWidth=0) {
  const xs=[-length/2,length/2], ys=[0,height];
  for(const hole of openings) {
    xs.push(Math.max(-length/2,hole.x-hole.width/2),Math.min(length/2,hole.x+hole.width/2));
    ys.push(Math.max(0,hole.bottom),Math.min(height,hole.bottom+hole.height));
    if(trimWidth>0){
      xs.push(Math.max(-length/2,hole.x-hole.width/2-trimWidth),Math.min(length/2,hole.x+hole.width/2+trimWidth));
      ys.push(Math.max(0,hole.bottom-trimWidth),Math.min(height,hole.bottom+hole.height+trimWidth));
    }
  }
  const unique=values=>[...new Set(values.map(v=>Math.round(v*1e9)/1e9))].sort((a,b)=>a-b);
  const x=unique(xs),y=unique(ys),panels=[];
  for(let i=0;i<x.length-1;i++) for(let j=0;j<y.length-1;j++) {
    const cx=(x[i]+x[i+1])/2,cy=(y[j]+y[j+1])/2;
    if(openings.some(h=>Math.abs(cx-h.x)<h.width/2&&cy>h.bottom&&cy<h.bottom+h.height))continue;
    if(x[i+1]>x[i]&&y[j+1]>y[j])panels.push({x:cx,y:cy,width:x[i+1]-x[i],height:y[j+1]-y[j]});
  }
  return panels;
}

/** One boundary shell for wall + stone frame. Shared panel sides are never rendered. */
export function wallSurfaceMesh(length,height,thickness,openings=[],trimWidth=.18) {
  const positions=[],normals=[],materialIndices=[[],[]],edges=new Map();
  const q=v=>Math.round(v*1e9)/1e9;
  const framed=(x,y)=>openings.some(h=>x>=h.x-h.width/2-trimWidth&&x<=h.x+h.width/2+trimWidth&&y>=h.bottom-trimWidth&&y<=h.bottom+h.height+trimWidth);
  const quad=(points,normal,material)=>{
    const i=positions.length/3;for(const p of points){positions.push(...p);normals.push(...normal);}
    materialIndices[material].push(i,i+1,i+2,i,i+2,i+3);
  };
  const z=thickness/2;
  for(const p of wallPanels(length,height,openings,trimWidth)){
    const x0=q(p.x-p.width/2),x1=q(p.x+p.width/2),y0=q(p.y-p.height/2),y1=q(p.y+p.height/2),material=framed(p.x,p.y)?1:0;
    if(x1<=x0||y1<=y0)continue;
    quad([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],[0,0,1],material);
    quad([[x1,y0,-z],[x0,y0,-z],[x0,y1,-z],[x1,y1,-z]],[0,0,-1],material);
    const corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
    for(let i=0;i<4;i++){
      const a=corners[i],b=corners[(i+1)%4],key=[a.join(','),b.join(',')].sort().join('|');
      const edge=edges.get(key);if(edge)edge.count++;else edges.set(key,{a,b,material,count:1});
    }
  }
  for(const {a,b,material,count}of edges.values()){
    if(count===2)continue;
    if(count!==1)throw new Error('Non-manifold wall panel boundary');
    const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy);
    quad([[a[0],a[1],z],[a[0],a[1],-z],[b[0],b[1],-z],[b[0],b[1],z]],[dy/l,-dx/l,0],material);
  }
  return {positions,normals,indices:[...materialIndices[0],...materialIndices[1]],groups:[
    {start:0,count:materialIndices[0].length,materialIndex:0},
    {start:materialIndices[0].length,count:materialIndices[1].length,materialIndex:1}
  ]};
}

/** Parameters for display never become historical measurements. */
export function effectiveStudyParameters(config, wallHeight=config.preview.wallHeightMeters) {
  if(!Number.isFinite(wallHeight)||wallHeight<6||wallHeight>11)throw new Error('Study wall height must be between 6 and 11 m');
  if(config.documented.centralRoofBuilt!==false)throw new Error('This study requires an unfinished roof');
  return {...config.preview,wallHeightMeters:wallHeight};
}
