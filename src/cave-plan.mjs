/** Local frame anchored to the user's map comment: along the south flank, depth into rock. */
const cachedSites=new WeakMap();
export function caveSites(data){if(!data)return [];if(!cachedSites.has(data))cachedSites.set(data,data.cavities??[]);return cachedSites.get(data);}
export function caveFrame(data){return data.caveFrame??{center:data.cave.anchor,tangent:[0,1],outward:[1,0],floorElevation:.9,rockDepth:10};}
export function caveCoordinates(e,n,data){const f=caveFrame(data),de=e-f.center[0],dn=n-f.center[1];return {along:de*f.tangent[0]+dn*f.tangent[1],depth:-(de*f.outward[0]+dn*f.outward[1])};}
export function caveWorld(along,depth,height,data){const f=caveFrame(data);return [f.center[0]+f.tangent[0]*along-f.outward[0]*depth,f.center[1]+f.tangent[1]*along-f.outward[1]*depth,height];}
export function caveExtent(data){const caves=caveSites(data);return{first:Math.min(...caves.map(c=>c.along-c.width*.65))-4,last:Math.max(...caves.map(c=>c.along+c.width*.65))+4,depth:caveFrame(data).rockDepth};}
export function caveRockRoof(along,depth,data){const f=caveFrame(data),{first,last}=caveExtent(data),u=Math.max(first,Math.min(last,along));return f.floorElevation+4.5+.32*Math.sin(u*.36)+.17*Math.sin(u*.91)-.8*Math.pow(Math.abs((u-(first+last)/2)/((last-first)/2)),6)+Math.max(0,Math.min(f.rockDepth,depth))*.09;}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function caveRockBlend(e,n,data){if(!data||!caveSites(data).length)return 0;const p=caveCoordinates(e,n,data),b=caveExtent(data);return smooth(Math.min(p.along-b.first+10,b.last+10-p.along)/10)*smooth((b.depth+10-p.depth)/10)*smooth((p.depth+12)/5);}
export function caveTerrainCovered(e,n,data){if(!data||!caveSites(data).length)return false;const p=caveCoordinates(e,n,data),b=caveExtent(data);return p.along>b.first&&p.along<b.last&&p.depth>0&&p.depth<b.depth;}
export function caveFloor(e,n,original,data){
 if(!data)return original;const caves=caveSites(data);if(!caves.length)return original;
 const f=caveFrame(data),p=caveCoordinates(e,n,data),first=Math.min(...caves.map(c=>c.along-c.width*.65))-4,last=Math.max(...caves.map(c=>c.along+c.width*.65))+4;
 if(p.along<first-10||p.along>last+10||p.depth< -12||p.depth>f.rockDepth+10)return original;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};let h=original;
 // A continuous seaward apron joins the whole face, without three isolated trenches.
 if(p.depth<1.25){const across=smooth(Math.min(p.along-first+3,last+3-p.along)/3),shore=smooth((p.depth+12)/3);h=Math.min(h,original+(f.floorElevation-original)*across*shore);}
 if(p.depth>=1.25){const blend=caveRockBlend(e,n,data);h=original+(caveRockRoof(p.along,p.depth,data)-original)*blend;}
 // Behind the face retain the hillside, excavating only the blind gallery volumes.
 for(const c of caves){const side=Math.abs(p.along-c.along)/(c.width*.54),D=c.depth+.8;
  if(p.depth<0||p.depth>D||side>=1)continue;const blend=Math.max(0,Math.min(1,(1-side)*10,(D-p.depth)*3));h=Math.min(h,original+(c.floorElevation-original)*blend);
 }return h;
}
