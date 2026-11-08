/** Dates refer to documentary snapshots; no annual construction date is inferred. */
export function harbourPhaseAt(history,year){return [...history.phases].reverse().find(p=>p.fromYear<=year)??null;}
export function harbourData(base,phase){
 if(!phase)return base;
 return {...base,shorelineStudy:[...base.shorelineStudy.filter(p=>p[1]>phase.shore[0][1]),...phase.shore,...base.shorelineStudy.filter(p=>p[1]<phase.shore.at(-1)[1])],roquerCoast:null,basins:[],harbourPhase:phase};
}
export function inPolygon(e,n,poly){
 let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];if((a[1]>n)!==(b[1]>n)&&e<(b[0]-a[0])*(n-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }return inside;
}
const areaCache=new WeakMap();
function areas(phase){
 if(!areaCache.has(phase))areaCache.set(phase,(phase.landAreas??phase.land.map(outer=>({outer,holes:[]}))).map(a=>({...a,box:a.outer.reduce((b,p)=>[Math.min(b[0],p[0]),Math.min(b[1],p[1]),Math.max(b[2],p[0]),Math.max(b[3],p[1])],[Infinity,Infinity,-Infinity,-Infinity])})));
 return areaCache.get(phase);
}
export function inHarbourLand(e,n,phase){
 if(!phase)return false;
 return areas(phase).some(a=>e>=a.box[0]&&e<=a.box[2]&&n>=a.box[1]&&n<=a.box[3]&&inPolygon(e,n,a.outer)&&!a.holes.some(h=>inPolygon(e,n,h)));
}
export function harbourHeight(e,n,phase){return phase&&(phase.works??phase.land).some(p=>inPolygon(e,n,p))?phase.elevation:null;}
export function harbourGround(e,n,original,phase){
 if(!phase||e<295500||e>297700||n<4498000||n>4500000)return null;
 return inHarbourLand(e,n,phase)?Math.max(original,phase.elevation):Math.min(original,-1.5);
}
