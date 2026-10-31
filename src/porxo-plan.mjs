/** Three-centred basket arch; dimensions remain study parameters, never a survey. */
export const PORXO_STUDY={confidence:'C',galleryDepth:3,springHeight:2.45,maximumRise:1.40,riseHalfSpanFactor:.48,voussoirBand:.28,sharedHalfPierWidth:.39,arcadeThickness:.64,rearBodyHeight:5.8,brickPitch:.155,joistSpacing:.48,frontFloorsAdded:false,historicalDimensions:null};
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
