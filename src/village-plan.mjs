// Source-backed uses; facade layouts and roof profiles remain reversible C studies.
export const VILLAGE_EVIDENCE={
 source:'N112',title:'Pilar Reverté Vidal · 1794. Estat de les obres reials de San Carlos',
 inventory:{pages:'230–231',royalUnits:81,privateMixedUnits:38,totalMixedUnits:119,independentBuildings:null},
 manzana:{pages:'231, art. 7',units:24,documented:['hospital sobre quadra/refugi dels operaris','magatzem d’eines i taller de fusteria al front','pati de materials amb pou central','forn de pa al tram oposat'],interpretation:'Distribució interior, accessos, alçats i forma del forn C; no són noves cases.'},
 tinglado:{pages:'215, 226; ACA RP BGRP Cajas 33, 1785–1786',frontArches:5,firstPiers:12,secondPiers:9,interpretation:'Disposició dels pilars, llums, perfils i coberta parcial C; desmuntatge sense data fixada.'},
 mill:{pages:'234, art. 30',millstones:2,roof:false,interpretation:'Edifici pendent de tancar i cobrir el 1794; no es representa com a molí en funcionament.'},
 services:{pages:'211–212, 224; 231 art. 5',interpretation:'Usos documentats. Fusteries, obertures, teulada i acabats C; es conserven les plantes i els emplaçaments d’assaig.'},
 oldPrecinct:{source:'N112 il·l. 1, p. 197 · AGMM PL T-6/5 · redibuix interpretatiu',interpretation:'Plantes A–G del dibuix de 1748 conservades. Cobertes inclinades, portes i finestres C; no s’executen els cossos projectats H–O.'}
};
export function serviceHousePlan({width:w,depth:d,height:H,kind}){
 const doorWidth=Math.min(kind==='forge'?2.3:kind==='customs'?2:1.25,w*.35),doorHeight=Math.min(2.35,H-.35);
 const front=[{x:0,width:doorWidth,height:doorHeight,bottom:0,door:true}];
 const upper=H>4.8,windowHeight=Math.min(1.05,H-1.6);
 if(w>5.5)for(const x of[-w*.3,w*.3])front.push({x,width:.8,height:windowHeight,bottom:1.15});
 if(upper)for(const x of[-w*.3,0,w*.3])front.push({x,width:.8,height:1,bottom:3.5});
 const back=w>5?[{x:0,width:.75,height:1,bottom:upper?3.5:1.25}]:[];
 const side=d>4.5?[{x:0,width:.75,height:1,bottom:1.25}]:[];
 return {w,d,H,T:.4,rise:Math.min(2.3,d*.23),front,back,side,upper,detailConfidence:'C'};
}
// A roof follows the traced quadrilateral exactly; it never replaces it by a bounding box.
export function tracedRoof(points,height){
 if(points.length!==4)throw Error('Traced roof requires four existing corners');
 const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const p=length(points[0],points[1])+length(points[2],points[3])>=length(points[1],points[2])+length(points[3],points[0])?points:[points[1],points[2],points[3],points[0]];
 const rise=Math.min(1.8,(length(p[1],p[2])+length(p[3],p[0]))*.12);
 const v=p.map(([x,z])=>[x,height,z]),mid=(a,b)=>[(a[0]+b[0])/2,height+rise,(a[2]+b[2])/2];
 const r0=mid(v[0],v[3]),r1=mid(v[1],v[2]);
 return {slopes:[[v[0],v[1],r1,r0],[v[2],v[3],r0,r1]],gables:[[v[3],v[0],r0],[v[1],v[2],r1]],ridge:[r0,r1],rise};
}
export function manzanaPlan(s){
 const w=s.width,d=s.depth,t=s.wingDepth,passage=3;
 const rect=(x,z,W,D)=>[[x-W/2,z+D/2],[x+W/2,z+D/2],[x+W/2,z-D/2],[x-W/2,z-D/2]];
 return {passage,solids:[rect(-(w+passage)/4,d/2-t/2,(w-passage)/2,t),rect((w+passage)/4,d/2-t/2,(w-passage)/2,t),rect(0,-d/2+t/2,w,t),rect(-w/2+t/2,0,t,d-2*t),rect(w/2-t/2,0,t,d-2*t),rect(0,0,1.9,1.9)],floors:[rect(0,0,w-2*t,d-2*t),rect(0,d/2-t/2,passage,t),rect(0,d/2+3,passage,6)]};
}
