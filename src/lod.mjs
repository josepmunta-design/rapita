/** Remove only triangles covered by a nested fine patch. Boundary coordinates stay native. */
export function cutCoarsePatch(meta,indices,patch) {
  const inside=i=>{
    const e=meta.west+(i%meta.width)*meta.step,n=meta.north-Math.floor(i/meta.width)*meta.step;
    return e>=patch.west&&e<=patch.west+(patch.width-1)*patch.step&&n<=patch.north&&n>=patch.north-(patch.height-1)*patch.step;
  };
  const result=[];
  for(let i=0;i<indices.length;i+=3)if(!indices.slice(i,i+3).every(inside))result.push(indices[i],indices[i+1],indices[i+2]);
  return result;
}

/** Native fine interior, coarse-spaced boundary, triangulated transition ring. No heights are blended. */
export function stitchedPatchIndices(width,height,valid,ratio=5) {
  if((width-1)%ratio||(height-1)%ratio)throw new Error('Patch must nest exactly in coarse cells');
  const out=[];
  const add=(a,b,c)=>{
    if(!valid[a]||!valid[b]||!valid[c])return;
    const ax=a%width,az=Math.floor(a/width),bx=b%width,bz=Math.floor(b/width),cx=c%width,cz=Math.floor(c/width);
    const normal=(bz-az)*(cx-ax)-(bx-ax)*(cz-az);
    if(normal===0)throw new Error('Degenerate seam triangle');
    out.push(a,...(normal>0?[b,c]:[c,b]));
  };
  for(let row=1;row<height-2;row++)for(let col=1;col<width-2;col++){
    const a=row*width+col;add(a,a+width,a+1);add(a+1,a+width,a+width+1);
  }
  const edges=[
    {outer:Array.from({length:(width-1)/ratio+1},(_,i)=>i*ratio),inner:Array.from({length:width-2},(_,i)=>width+i+1)},
    {outer:Array.from({length:(height-1)/ratio+1},(_,i)=>i*ratio*width+width-1),inner:Array.from({length:height-2},(_,i)=>(i+1)*width+width-2)},
    {outer:Array.from({length:(width-1)/ratio+1},(_,i)=>height*width-1-i*ratio),inner:Array.from({length:width-2},(_,i)=>(height-2)*width+width-2-i)},
    {outer:Array.from({length:(height-1)/ratio+1},(_,i)=>(height-1-i*ratio)*width),inner:Array.from({length:height-2},(_,i)=>(height-2-i)*width+1)}
  ];
  for(const {outer,inner}of edges){
    let a=0,b=0;
    while(a<outer.length-1||b<inner.length-1){
      const ta=a<outer.length-1?(a+1)*ratio:Infinity,tb=b<inner.length-1?b+2:Infinity;
      if(ta<tb){add(outer[a],outer[++a],inner[b]);}
      else {add(outer[a],inner[b+1],inner[b]);b++;}
    }
  }
  return out;
}
