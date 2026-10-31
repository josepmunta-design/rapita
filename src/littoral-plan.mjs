/** Interpretation only: never mutates the archived measured terrain or its validity mask. */
export function shoreEasting(n,shore){
  let west=Infinity;
  for(let i=0;i<shore.length-1;i++){const a=shore[i],b=shore[i+1];if(n>=Math.min(a[1],b[1])&&n<=Math.max(a[1],b[1])&&a[1]!==b[1])west=Math.min(west,a[0]+(b[0]-a[0])*(n-a[1])/(b[1]-a[1]));}
  if(Number.isFinite(west))return west;
  return n>shore[0][1]?shore[0][0]:shore.at(-1)[0];
}
/** Union of sea and open harbour basins. A basin cannot leave a land plug at its seaward edge. */
export function coastalWaterEasting(n,data){
  let e=shoreEasting(n,data.shorelineStudy);
  for(const b of data.basins)if(Math.abs(n-b.center[1])<=b.length/2)e=Math.min(e,b.center[0]-b.width/2);
  return e;
}
export function coastalWaterOutline(data){
  const shore=data.shorelineStudy,points=[];
  const add=(e,n)=>{if(!points.length||points.at(-1)[0]!==e||points.at(-1)[1]!==n)points.push([e,n]);};
  // Keep polyline order: sorting by northing destroys the re-entrant coves of the traced Roquer.
  for(let i=0;i<shore.length-1;i++){
    const a=shore[i],b=shore[i+1],ts=new Set([0,1]);
    for(const basin of data.basins){
      if(a[1]!==b[1])for(const n of[basin.center[1]-basin.length/2,basin.center[1]+basin.length/2]){const t=(n-a[1])/(b[1]-a[1]);if(t>0&&t<1)ts.add(t);}
      if(a[0]!==b[0]){const t=(basin.center[0]-basin.width/2-a[0])/(b[0]-a[0]);if(t>0&&t<1)ts.add(t);}
    }
    const cuts=[...ts].sort((x,y)=>x-y);
    for(let j=0;j<cuts.length-1;j++){
      const n=a[1]+(b[1]-a[1])*(cuts[j]+cuts[j+1])/2,active=data.basins.filter(s=>Math.abs(n-s.center[1])<s.length/2);
      for(const t of[cuts[j],cuts[j+1]])add(Math.min(a[0]+(b[0]-a[0])*t,...active.map(s=>s.center[0]-s.width/2)),a[1]+(b[1]-a[1])*t);
    }
  }return points;
}
/** Signed distance to the coast: positive on land, negative in the sea, including coves. */
export function coastDistance(e,n,data){
  const trace=data.roquerCoast;
  if(!trace||n<Math.min(...trace.map(p=>p[1]))-2||n>Math.max(...trace.map(p=>p[1]))+2)return coastalWaterEasting(n,data)-e;
  const shore=data.shorelineStudy;let crossings=0;
  for(let i=0;i<shore.length-1;i++){const a=shore[i],b=shore[i+1];if((a[1]>n)!==(b[1]>n)&&e>a[0]+(b[0]-a[0])*(n-a[1])/(b[1]-a[1]))crossings++;}
  let distance=nearestRoute(e,n,shore).distance*(crossings%2?-1:1);
  for(const b of data.basins)if(Math.abs(n-b.center[1])<=b.length/2)distance=Math.min(distance,b.center[0]-b.width/2-e);
  return distance;
}
export function nearestRoute(e,n,route){
  let best={distance:Infinity,along:0,length:0,easting:0,northing:0};let length=0;
  for(let i=0;i<route.length-1;i++){
    const a=route[i],b=route[i+1],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),t=Math.max(0,Math.min(1,((e-a[0])*dx+(n-a[1])*dy)/(l*l))),x=a[0]+t*dx,y=a[1]+t*dy,d=Math.hypot(e-x,n-y);
    if(d<best.distance)best={distance:d,along:length+t*l,length:0,easting:x,northing:y};length+=l;
  }best.length=length;return best;
}
export function canalWaterLevel(along,length,sea=.45){return sea+.9*Math.max(0,Math.min(1,(along-100)/Math.max(1,length-100)));}
const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
export function landscapeSample(e,n,original,data){
  let height=original,zone='land',wetBed=Infinity,bank=null;
  if(n>=4497800&&n<=4501500){
    const d=coastDistance(e,n,data),rock=n>4499060&&n<4499260;
    if(d<=0){height=Math.min(height,-.8-Math.min(8,-d*.015));zone='seabed';wetBed=height;}
    else if(d<24){const edge=rock?.6:.46;height=edge+(original-edge)*smooth(d/(rock?16:24));zone=rock?'rock':'sand';}
  }
  for(const basin of data.basins){const dx=Math.abs(e-basin.center[0])-basin.width/2,dy=Math.abs(n-basin.center[1])-basin.length/2,d=Math.max(dx,dy);if(d<=0)wetBed=Math.min(wetBed,data.studyWaterElevation-.9);else if(d<4)height=Math.min(height,data.studyWaterElevation-.9+d*.4);}
  for(const[route,width]of[[data.canal.routeStudy,data.canal.studyWidth],[data.canal.branchStudy,6.5]]){
    if(n<Math.min(route[0][1],route.at(-1)[1])-20||n>Math.max(route[0][1],route.at(-1)[1])+20)continue;
    const p=nearestRoute(e,n,route),edge=p.distance-width/2;
    if(edge<8){const water=route===data.canal.routeStudy?canalWaterLevel(p.along,p.length,data.studyWaterElevation):data.studyWaterElevation,bed=water-.85;
      if(edge<=0)wetBed=Math.min(wetBed,bed);
      else if(!bank||edge<bank.distance){const crest=Math.max(original,water+.35);bank={distance:edge,height:edge<4?bed+(crest-bed)*smooth(edge/4):crest+(original-crest)*smooth((edge-4)/4)};}
    }
  }
  // Excavation is a union: a neighbouring canal bank must never refill an existing wet bed.
  if(Number.isFinite(wetBed)){height=Math.min(height,wetBed);zone=zone==='seabed'?'seabed':'bed';}
  else if(bank){height=bank.height;zone='sand';}
  return {height,zone};
}

export function batteryOutline(width=36.9){
  // Manual reading of the T-6/8 low plan. Local +Z points towards the sea.
  const s=width/646,points=[[-323*s,-172*s]];
  for(let i=0;i<=32;i++){const a=Math.PI-i*Math.PI/32;points.push([323*Math.cos(a)*s,(178+215*Math.sin(a))*s]);}
  points.push([323*s,-172*s],[122*s,-105*s],[0,-223*s],[-122*s,-105*s]);return points;
}
export function routeStations(route,spacing=4){
  const points=[];let along=0;const length=route.reduce((v,b,i)=>i?v+Math.hypot(b[0]-route[i-1][0],b[1]-route[i-1][1]):0,0);
  for(let i=0;i<route.length-1;i++){const a=route[i],b=route[i+1],l=Math.hypot(b[0]-a[0],b[1]-a[1]),count=Math.ceil(l/spacing),dx=(b[0]-a[0])/l,dy=(b[1]-a[1])/l;
    for(let j=0;j<count;j++)points.push({e:a[0]+dx*l*j/count,n:a[1]+dy*l*j/count,along:along+l*j/count,length,dx,dy});along+=l;
  }
  const a=points.at(-1),b=route.at(-1);if(!a)throw new Error('Empty route');points.push({...a,e:b[0],n:b[1],along:length});return points;
}
