import {shoreEasting} from './littoral-plan.mjs';
export function pathPose(points,time,speed=1,phase=0,lane=0){
 const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1])),length=lengths.reduce((a,b)=>a+b,0);
 let progress=((time*speed+phase*length)%(length*2)+length*2)%(length*2),direction=progress<=length?1:-1;if(direction<0)progress=2*length-progress;
 let i=0;while(i<lengths.length-1&&progress>lengths[i])progress-=lengths[i++];
 const a=points[i],b=points[i+1],dx=(b[0]-a[0])/lengths[i],dn=(b[1]-a[1])/lengths[i];
 return{e:a[0]+dx*progress-dn*lane,n:a[1]+dn*progress+dx*lane,heading:Math.atan2(dx*direction,-dn*direction),distance:time*speed};
}
export function boatPose(boat,index,time,data){
 const rn=boat.kind==='cabotatge'?50:boat.kind==='bot'?5:16,re=boat.kind==='cabotatge'?24:boat.kind==='bot'?3:7,radius=Math.hypot(boat.length,boat.beam)/2;
 const shores=Array.from({length:65},(_,i)=>shoreEasting(boat.anchor[1]-rn-radius+2*(rn+radius)*i/64,data.shorelineStudy));
 // Keep the whole hull clear of land and the eastern pier, including at turns.
 const center=Math.max(boat.anchor[0],Math.max(...shores)+radius+re+3,296583+radius+re),phase=time*.018+index*1.37;
 const de=re*Math.cos(phase),dn=-rn*Math.sin(phase);
 return{e:center+re*Math.sin(phase),n:boat.anchor[1]+rn*Math.cos(phase),height:data.studyWaterElevation+.025*Math.sin(time*.85+index),heading:Math.atan2(de,-dn),roll:.014*Math.sin(time*.7+index),pitch:.009*Math.cos(time*.65+index)};
}
