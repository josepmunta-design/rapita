/** Three-centred basket arch; dimensions remain study parameters, never a survey. */
// Revisió 08/11/2026 amb CP01, N031 i Salvany 1916: pilastres altes i esveltes sobre un sòcol, arcs de carpanell estrets
// (llum ≈ 2,6 m, ritme ≈ 3,3 m, dos per cos), imposta alta i galeria més fonda amb arcs transversals i bigues.
export const PORXO_STUDY={confidence:'C',galleryDepth:3.6,springHeight:3.35,maximumRise:1.0,riseHalfSpanFactor:.72,voussoirBand:.28,sharedHalfPierWidth:.36,arcadeThickness:.64,rearBodyHeight:7.0,brickPitch:.155,joistSpacing:.48,arcPitch:3.3,plinthHeight:.85,frontFloorsAdded:false,historicalDimensions:null,revision:'2026-11-08'};
export function carpanell(a,b,t){
 const r=b*.48,cx=a-r,cy=((b-r)**2-cx**2)/(2*(b-r)),R=b-cy,D=R-r;
 const tx=R*cx/D,ty=cy+R*(-cy)/D,alpha=Math.atan2(ty,tx-cx),beta=Math.atan2(ty-cy,tx);
 const side=r*alpha,crown=R*(Math.PI-2*beta),length=2*side+crown,s=Math.max(0,Math.min(1,t))*length;
 let x,y,nx,ny;
 if(s<=side){const angle=Math.PI-s/r;nx=Math.cos(angle);ny=Math.sin(angle);x=-cx+r*nx;y=r*ny;}
 else if(s<=side+crown){const angle=Math.PI-beta-(s-side)/R;nx=Math.cos(angle);ny=Math.sin(angle);x=R*nx;y=cy+R*ny;}
 else{const angle=alpha-(s-side-crown)/r;nx=Math.cos(angle);ny=Math.sin(angle);x=cx+r*nx;y=r*ny;}
 return{x,y,nx,ny,length};
}
