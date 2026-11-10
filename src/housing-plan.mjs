export function townToUTM(across,along,frame){
  const r=frame.alongAzimuthDegrees*Math.PI/180;
  return {easting:frame.easting+across*Math.cos(r)+along*Math.sin(r),northing:frame.northing-across*Math.sin(r)+along*Math.cos(r)};
}
export function generateHousingLayout(config){
  const structures=[],frame=config.townFrame,counters={};
  const add=(group,kind,across,along,front,extra={})=>{
    const index=counters[group]=(counters[group]||0)+1;
    const type=config.typologies[kind],side=front==='east'?90:-90;
    const structure={id:group+'-'+String(index).padStart(2,'0'),group,kind,anchor:townToUTM(across,along,frame),
      across,along,frontAzimuthDegrees:frame.alongAzimuthDegrees+side,
      width:type.frontWidth,depth:type.depth,wallHeight:type.wallHeight,roofRise:type.roofRise,wallThickness:type.wallThickness,
      originalHouseNumber:null,state1800:null,individualPositionConfidence:'C',geometryConfidence:'C',...extra};
    if(kind==='large'&&group!=='royal-portico'&&extra.depth===undefined){
      structure.depth=[10.4,11,11.6][(index-1)%3];structure.wallHeight+=[0,.15,-.1][(index-1)%3];
    }
    structures.push(structure);return structure;
  };
  const row=(def,group,kind,state)=>{for(let i=0;i<def.count;i++)add(group,kind,def.across,def.startAlong+i*def.spacing,def.front,{state1794:state,layoutBasis:'group-location-inference',terrace:kind==='large',...(def.depth?{depth:def.depth}:{}),...(def.width?{width:def.width,frontWidth:def.width}:{}),...(def.block?{block:def.block}:{})});};
  for(const r of config.layout.finishedRows)row(r,'royal-finished','large','finished');
  row(config.layout.coveredRow,'royal-covered','large','roofed-unfinished');
  const arc=config.layout.exedra,R=arc.innerRadius+arc.depth/2,gap=(arc.gap??0)/R,delta=(Math.PI-gap)/arc.count;
  // El semicercle no es tanca: un pas de carrer separa els cinc cossos de cada costat (fotografies i H02 p.210 nota 60).
  for(let i=0;i<arc.count;i++){
    const t=(i+.5)*delta+(i>=arc.count/2?gap:0),across=arc.across+R*Math.cos(t),along=arc.along-R*Math.sin(t);
    const u=-Math.cos(t),v=Math.sin(t),r=frame.alongAzimuthDegrees*Math.PI/180;
    const bearing=Math.atan2(u*Math.cos(r)+v*Math.sin(r),-u*Math.sin(r)+v*Math.cos(r))*180/Math.PI;
    add('royal-portico','large',across,along,'east',{frontAzimuthDegrees:(bearing+360)%360,state1794:'unroofed-with-portico',
      frontWidth:2*arc.innerRadius*Math.sin(delta/2),backWidth:2*(arc.innerRadius+arc.depth)*Math.sin(delta/2),
      frontZ:R-arc.innerRadius*Math.cos(delta/2),backZ:R-(arc.innerRadius+arc.depth)*Math.cos(delta/2),
      arcSector:true,layoutBasis:'hypothetical-10-cases-rodones',terrace:true});
  }
  row(config.layout.porticoRow,'royal-portico','large','unroofed-with-portico');
  if(config.layout.coastalHouses){
    const r=frame.alongAzimuthDegrees*Math.PI/180;
    for(const p of config.layout.coastalHouses){const de=p.anchor[0]-frame.easting,dn=p.anchor[1]-frame.northing;add('royal-small-coast','small',de*Math.cos(r)-dn*Math.sin(r),de*Math.sin(r)+dn*Math.cos(r),'east',{frontAzimuthDegrees:p.frontAzimuthDegrees,state1794:'finished',layoutBasis:p.layoutSource?'N112-relational-layout-study':'1813-coastal-clusters-study',coastalCluster:p.cluster,shoreSetbackMeters:p.shoreSetbackMeters,layoutSource:p.layoutSource});}
  }else for(const r of config.layout.smallRows??[])row(r,'royal-small-coast','small','finished');
  const m=config.layout.manzana;
  structures.push({id:'manzana-shared',group:'manzana-units',kind:'shared-courtyard',anchor:townToUTM(m.across,m.along,frame),
    across:m.across,along:m.along,width:m.acrossLength,depth:m.alongLength,wingDepth:m.wingDepth,countedUnits:m.countedUnits,
    wallHeight:config.typologies.manzana.wallHeight,roofRise:config.typologies.manzana.roofRise,wallThickness:config.typologies.manzana.wallThickness,
    frontAzimuthDegrees:frame.alongAzimuthDegrees,state1794:'finished-mixed-shared-building',state1800:null,geometryConfidence:'C',individualPositionConfidence:'C',originalHouseNumber:null});
  // These two study units reserve the possible residential bodies of the new inn.
  const east=structures.filter(s=>s.group==='royal-finished'&&s.across>0);east.slice(-2).forEach(s=>{s.reservation='possible-inn-bodies-do-not-duplicate';});
  return structures;
}
