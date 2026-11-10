import * as THREE from 'three';
import {marketPlan} from './domestic-plan.mjs';
import {wallSurfaceMesh} from './building-plan.mjs';
import {placaBuilder,archedPanel,archBand} from './placa-model.ts';

/** Qualitative reconstruction from N030 and the five supplied Palau photographs.
 * Dimensions and the attribution of surviving fabric to 1794 remain C. */
export function makeCasaLaureano(s:{width:number;depth:number},ground:(x:number,z:number)=>number,photo=false){
  const b=placaBuilder(),p=marketPlan(s),w=s.width,d=s.depth,front=d/2,back=front-p.passage,H=9.3;
  const mat=(name:string,color:string)=>{const m=new THREE.MeshStandardMaterial({color,roughness:.9});m.name=name;return m;};
  const stone=mat('laureano-stone','#cfc6ac'),light=mat('laureano-moulding','#e2d9c3'),wall=mat('laureano-wall','#c3b395'),joint=mat('laureano-joints','#a69a83'),dark=mat('laureano-recess','#323934'),wood=mat('laureano-door','#69503a'),iron=mat('laureano-iron','#303632');
  const soffit=['#a4977c','#b7b39c','#b5a286','#926e5c'].map((c,i)=>mat('laureano-soffit-'+i,c));
  const box=(m:THREE.Material,x:number,y:number,z:number,W:number,h:number,D:number)=>b.box(m,x,y,z,W,h,D);
  const cylinder=(x:number,y:number,z:number,rt:number,rb:number,h:number,m=stone)=>b.add(new THREE.CylinderGeometry(rt,rb,h,32),m,x,y,z);
  const wallPart=(W:number,height:number,x:number,z:number,holes:any[]=[],rotation=0)=>{const q=wallSurfaceMesh(W,height,.5,holes,.12),g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(q.positions,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(q.normals,3));g.setIndex(q.indices);g.rotateY(rotation);b.add(g,wall,x,0,z);};
  const bays=[-w*4/15,0,w*4/15],openings=bays.flatMap(x=>[{x,width:1.8,height:3.3,bottom:0},{x,width:1.8,height:2.95,bottom:4.6}]);
  wallPart(w,H,0,back-.25,openings);wallPart(w,H,0,-d/2+.25);
  for(const sign of[-1,1])wallPart(d-p.passage-.5,H,sign*(w/2-.25),-p.passage/2,photo&&sign<0?[-4,0,4].flatMap(x=>[{x,width:1.1,height:2.1,bottom:4.6},{x,width:.75,height:1.7,bottom:.5}]):[],sign*Math.PI/2);
  // Four tall smooth shafts: a single order spans the ground and upper floors.
  for(const pier of p.piers){const x=pier.x,z=pier.z,y=ground(x,z);
    box(stone,x,y+.15,z,1.3,.3,1.3);box(light,x,y+.36,z,1.18,.12,1.18);
    cylinder(x,y+.5,z,.58,.63,.16);cylinder(x,y+.64,z,.53,.58,.12);
    const bottom=y+.7,top=8.75;cylinder(x,(bottom+top)/2,z,.43,.53,top-bottom);
    // Thin drums read as joints, without fluting absent from the references.
    for(let cy=bottom+1.3;cy<top-.3;cy+=1.3)cylinder(x,cy,z,.53-(cy-bottom)/(top-bottom)*.10,.53-(cy-bottom)/(top-bottom)*.10,.012,joint);
    for(const[cy,r,h]of[[8.78,.48,.12],[8.9,.58,.15],[9.04,.66,.13]]as number[][])cylinder(x,cy,z,r,r,h,light);
    box(light,x,9.16,z,1.32,.16,1.28);
  }
  // Entablature and a deep, continuous ceiling, rather than a low colonnade.
  box(stone,0,9.37,front-.32,w+.1,.32,.85);box(light,0,9.58,front-.32,w+.35,.12,1);
  box(stone,0,9.19,(front+back)/2,w,.18,p.passage);
  if(photo){
    for(let i=0;i<24;i++)for(let j=0;j<6;j++)box(soffit[(i+j*3)%4],-w/2+(i+.5)*w/24,9.09,back+(j+.5)*p.passage/6,w/24-.015,.025,p.passage/6-.015);
    // Horizontal ashlar joints, short vertical joints and pale corner pilasters.
    for(let y=.45;y<H;y+=.48){box(joint,0,y,back+.012,w,.013,.018);for(let x=-w/2+.4+(Math.round(y/.48)%2)*.65;x<w/2;x+=1.3){if(bays.some(cx=>Math.abs(x-cx)<1.03&&(y<3.4||y>4.5&&y<7.65)))continue;box(joint,x,y-.23,back+.013,.012,.46,.02);}}
    for(const x of[-w/2+.3,w/2-.3]){box(light,x,4.55,back+.07,.52,9.1,.18);box(light,x,8.95,back+.12,.72,.25,.26);}
    for(const z of[-p.passage/2-4,-p.passage/2,-p.passage/2+4]){
      box(dark,-w/2+.10,5.65,z,.08,2.1,1.1);box(wood,-w/2+.02,5.65,z,.06,2.02,1.02);
      box(light,-w/2-.15,4.5,z,.65,.17,1.55);
      for(let k=0;k<9;k++)box(iron,-w/2-.46,5.05,z-.7+k*.175,.03,.95,.025);
      box(iron,-w/2-.46,5.53,z,.04,.04,1.5);
      box(dark,-w/2+.05,1.35,z,.08,1.7,.75);
    }
    for(let y=.48;y<H;y+=.48)box(joint,-w/2-.012,y,-p.passage/2,.018,.012,d-p.passage-.4);
    for(const x of bays){
      for(const[y,h]of[[0,3.3],[4.6,2.95]]){
        const rise=.9,spring=y+h-rise;
        b.add(new THREE.ShapeGeometry(archedPanel(1.76,h)),dark,x,y,back-.15);
        b.add(archBand(1.8,spring,rise,.16,.14),light,x,0,back-.03);
        for(const sign of[-1,1])box(light,x+sign*.98,(y+spring)/2,back+.025,.16,spring-y,.18);
        if(y>0){for(let k=0;k<8;k++)box(light,x-.78+(k+.5)*1.56/8,y+1.02,back-.06,.18,2.04,.07);}
        else {for(let k=0;k<9;k++)box(x===0?wood:iron,x-.79+k*.198,y+1.22,back-.04,.035,2.44,.045);box(wood,x,2.4,back-.025,1.7,.08,.075);}
      }
      box(light,x,4.51,back+.28,2.35,.18,.76);
      for(const sign of[-1,1])box(light,x+sign*.72,4.28,back+.11,.2,.32,.38);
      for(let k=0;k<=12;k++)box(iron,x-1.1+k*2.2/12,5.05,back+.64,.026,.96,.035);
      for(const y of[4.61,4.83,5.53])box(iron,x,y,back+.64,2.25,.035,.045);
      for(const sign of[-1,1])box(iron,x+sign*1.1,5.05,back+.33,.03,.96,.66);
      for(const sign of[-1,1])for(let k=0;k<3;k++){const ring=new THREE.TorusGeometry(.13,.015,5,12);b.add(ring,iron,x+sign*(.34+k*.2),5.1,back+.65);}
    }
    // The silhouette present in both the old and modern photographs: balustrade and segmental crest.
    const railZ=front-.32;
    for(let x=-w/2+.3;x<w/2;x+=.6){const ornament=new THREE.TorusGeometry(.18,.018,5,14);ornament.scale(1.45,.65,1);b.add(ornament,light,x,9.4,front+.12);}
    for(const y of[9.75,10.65])box(light,0,y,railZ,w+.35,.14,.6);
    const balusterProfile=[[.10,0],[.11,.08],[.06,.15],[.12,.29],[.09,.43],[.045,.57],[.09,.72]].map(([r,y])=>new THREE.Vector2(r,y));
    for(let x=-w/2+.3;x<w/2;x+=.32){if(Math.abs(x)<2.0)continue;b.add(new THREE.LatheGeometry(balusterProfile,8),light,x,9.83,railZ);}
    for(const pier of p.piers){cylinder(pier.x,10.25,railZ,.35,.35,1.08);cylinder(pier.x,10.83,railZ,.42,.42,.1,light);}
    const crest=archedPanel(w*.36,2.05,1.85);b.add(new THREE.ExtrudeGeometry(crest,{depth:.3,bevelEnabled:false}),stone,0,10.55,railZ-.15);
    b.add(archBand(w*.36,10.75,1.85,.16,.38),light,0,0,railZ-.19);
    // Roof over the rear body; the modern extra storey is deliberately outside this historical comparison.
    box(stone,0,H+.05,-p.passage/2,w,.2,d-p.passage);
  }else{
    // Open upper body and first-floor beams retain the unfinished study of 1794.
    for(let z=-d/2+.4;z<back;z+=.75)box(wood,0,4.25,z,w-.6,.22,.18);
    // «Plaça coberta»: entarimat sobre les bigues que cobreix el mercat de la planta baixa (N112 art.9); el cos superior queda sense coberta.
    const deckFront=back-1.2;for(let z=-d/2+.55;z<deckFront;z+=1.05)box(wood,0,4.4,z,w-.7,.07,1.0);
    // Bigues de coberta apilades al pis: obra del cos superior «molt avançada», no acabada.
    for(let k=0;k<5;k++)box(wood,-w/4+(k%2)*.3,4.55+k*.2,-d/2+3,w*.45,.18,.2);
  }
  const root=b.finish(photo?'Casa Laureano · comparació fotogràfica':'Plaça coberta · restitució C de 1794');
  root.userData={photographicComparison:photo,sourceFiles:['N030','128379.jpeg','128380.jpeg','128381.jpeg','128382.jpeg','128383.jpeg'],historicalDimensions:null,photoDate:null};return root;
}
