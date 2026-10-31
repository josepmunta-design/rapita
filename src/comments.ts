import * as THREE from 'three';
import './comments.css';

type Comment = {id:string;text:string;author:string;createdAt:string;year:number;easting:number;northing:number;elevation:number};
type Point = Pick<Comment,'easting'|'northing'|'elevation'|'year'>;

async function commentResponse(response:Response) {
  let data:any;
  try {data=await response.json();}
  catch {throw new Error('No s’ha pogut connectar amb els comentaris. Torna-ho a provar.');}
  if(!response.ok)throw new Error(typeof data?.error==='string'?data.error:'No s’ha pogut connectar amb els comentaris. Torna-ho a provar.');
  if(!data||typeof data!=='object')throw new Error('El servei de comentaris no està disponible. Torna-ho a provar.');
  return data;
}

export function makeComments(opts:{canvas:HTMLCanvasElement;camera:THREE.Camera;scene:THREE.Scene;
  origin:{easting:number;northing:number;elevation:number};year:()=>number;enabled:()=>boolean;
  focus:(point:THREE.Vector3)=>void;onStart:()=>void}) {
  const {canvas,camera,scene,origin}=opts,viewport=canvas.closest<HTMLElement>('.viewport')!;
  const toolbar=document.createElement('div');toolbar.className='comment-tools';
  toolbar.innerHTML='<button type="button" class="header-button comment-add" aria-pressed="false">＋ Afegir comentari</button><button type="button" class="header-button comment-list">Comentaris</button><button type="button" class="header-button comment-visibility" aria-pressed="true">Amaga comentaris</button>';
  document.getElementById('header-comments')!.append(toolbar);
  const add=toolbar.querySelector<HTMLButtonElement>('.comment-add')!,list=toolbar.querySelector<HTMLButtonElement>('.comment-list')!,visibility=toolbar.querySelector<HTMLButtonElement>('.comment-visibility')!;
  const status=document.createElement('p');status.className='comment-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.hidden=true;viewport.append(status);
  const markers=document.createElement('div');markers.className='comment-markers';viewport.append(markers);
  const modal=document.createElement('dialog');modal.className='comment-dialog';modal.setAttribute('aria-labelledby','comment-title');
  document.body.append(modal);
  let armed=false,items:Comment[]=[],pins:{button:HTMLButtonElement;point:THREE.Vector3}[]=[],press:{x:number;y:number;id:number}|null=null;
  let ready=false,busy=false,lastRefresh=0,showMarkers=true;
  const date=new Intl.DateTimeFormat('ca-ES',{dateStyle:'medium',timeStyle:'short'});
  const world=(p:Point)=>new THREE.Vector3(p.easting-origin.easting,p.elevation-origin.elevation,origin.northing-p.northing);
  const message=(text:string)=>{status.textContent=text;status.hidden=!text;};
  const setArmed=(value:boolean)=>{armed=value;press=null;add.setAttribute('aria-pressed',String(value));add.textContent=value?'Cancel·la':'＋ Afegir comentari';viewport.classList.toggle('comment-placing',value);message(value?'Fes clic en un punt del mapa. Esc per cancel·lar.':'');};
  const heading=(title:string)=>{modal.replaceChildren();const h=document.createElement('h2');h.id='comment-title';h.textContent=title;const close=document.createElement('button');close.type='button';close.className='comment-close';close.textContent='×';close.setAttribute('aria-label','Tanca els comentaris');close.onclick=()=>{if(!busy)modal.close();};modal.append(close,h);};
  const open=()=>{if(!modal.open)modal.showModal();};
  const renderPins=()=>{markers.replaceChildren();pins=items.map((item,i)=>{const button=document.createElement('button');button.type='button';button.className='comment-pin';button.textContent=String(i+1);button.title=item.text;button.setAttribute('aria-label',`Comentari de ${item.author||'visitant'}: ${item.text.slice(0,100)}`);button.onclick=()=>showItem(item);markers.append(button);return{button,point:world(item)};});list.textContent=`Comentaris (${items.length})`;};
  const details=(item:Comment,parent:HTMLElement)=>{const p=document.createElement('p');p.className='comment-text';p.textContent=item.text;const info=document.createElement('p');info.className='comment-meta';info.textContent=`${item.author||'Visitant'} · ${date.format(new Date(item.createdAt))} · Escena de ${item.year}`;parent.append(p,info);};
  const setMarkers=(show:boolean)=>{showMarkers=show;markers.hidden=!show||!opts.enabled();visibility.setAttribute('aria-pressed',String(show));visibility.textContent=show?'Amaga comentaris':'Mostra comentaris';};
  const deleteButton=(item:Comment,parent:HTMLElement,closeAfter=false)=>{
    const button=document.createElement('button');button.type='button';button.className='comment-delete';button.textContent='Esborrar';
    const error=document.createElement('p');error.className='comment-error';error.setAttribute('role','alert');error.hidden=true;
    button.onclick=async()=>{
      if(busy||!window.confirm('Vols esborrar aquest comentari del mapa compartit?'))return;
      busy=true;button.disabled=true;button.textContent='Esborrant…';error.hidden=true;
      try {await commentResponse(await fetch('/api/comments',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id})}));items=items.filter(comment=>comment.id!==item.id);renderPins();if(closeAfter)modal.close();else parent.remove();message('Comentari esborrat del mapa compartit.');}
      catch(cause){error.textContent=cause instanceof Error?cause.message:'No s’ha pogut esborrar el comentari.';error.hidden=false;}
      finally{busy=false;button.disabled=false;button.textContent='Esborrar';}
    };
    parent.append(button,error);
  };
  const showItem=(item:Comment)=>{setArmed(false);heading('Comentari al mapa');details(item,modal);const focus=document.createElement('button');focus.type='button';focus.className='comment-primary';focus.textContent='Centra aquest punt';focus.onclick=()=>{modal.close();setMarkers(true);opts.focus(world(item));};modal.append(focus);deleteButton(item,modal,true);open();};
  async function refresh() {
    if(busy)return;
    try {const data=await commentResponse(await fetch('/api/comments',{cache:'no-store'}));
      if(!Array.isArray(data.comments))throw new Error('Resposta de comentaris no vàlida.');
      items=data.comments;ready=true;renderPins();if(!armed)message('');
    } catch(error) {ready=false;if(!armed)message(error instanceof Error?error.message:'No s’han pogut carregar els comentaris.');}
    lastRefresh=Date.now();
  }
  const showList=async()=>{setArmed(false);heading('Comentaris al mapa');const loading=document.createElement('p');loading.textContent='Carregant comentaris…';modal.append(loading);open();await refresh();loading.remove();
    if(!ready){const error=document.createElement('p');error.textContent=status.textContent;modal.append(error);const retry=document.createElement('button');retry.textContent='Torna-ho a provar';retry.onclick=showList;modal.append(retry);return;}
    const note=document.createElement('p');note.className='comment-meta';note.textContent='Comentaris compartits amb totes les persones que obren el mapa.';modal.append(note);
    if(!items.length){const empty=document.createElement('p');empty.textContent='Encara no hi ha comentaris. Afegeix el primer en un punt del mapa.';modal.append(empty);}
    for(const item of items){const article=document.createElement('article');article.className='comment-entry';details(item,article);const button=document.createElement('button');button.type='button';button.textContent='Veure al mapa ↗';button.onclick=()=>{modal.close();setMarkers(true);opts.focus(world(item));};article.append(button);deleteButton(item,article);modal.append(article);}
  };
  function compose(point:Point) {
    heading('Afegir comentari');
    const note=document.createElement('p');note.className='comment-meta';note.textContent=`Punt seleccionat · escena de ${point.year}. El comentari serà visible per a tothom.`;
    const form=document.createElement('form');form.innerHTML='<label for="comment-author">El teu nom (opcional)</label><input id="comment-author" name="author" maxlength="60" autocomplete="given-name"><label for="comment-text">Comentari</label><textarea id="comment-text" name="text" rows="5" maxlength="2000" required placeholder="Escriu què vols comentar sobre aquest lloc…"></textarea><p class="comment-error" role="alert" hidden></p><div class="comment-actions"><button type="button" class="comment-cancel">Cancel·la</button><button type="submit" class="comment-primary">Desa el comentari</button></div>';
    modal.append(note,form);open();
    const textarea=form.querySelector('textarea')!,submit=form.querySelector<HTMLButtonElement>('[type=submit]')!,error=form.querySelector<HTMLParagraphElement>('.comment-error')!;
    form.querySelector<HTMLButtonElement>('.comment-cancel')!.onclick=()=>{if(!busy)modal.close();};
    textarea.focus();
    form.onsubmit=async event=>{event.preventDefault();if(busy)return;const text=textarea.value.trim();if(!text){textarea.setCustomValidity('Escriu un comentari.');textarea.reportValidity();return;}
      busy=true;submit.disabled=true;submit.textContent='Desant…';error.hidden=true;
      try {const data=await commentResponse(await fetch('/api/comments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...point,text,author:form.querySelector<HTMLInputElement>('input')!.value.trim()})}));if(!data.comment||typeof data.comment.id!=='string')throw new Error('No s’ha confirmat el desat. Torna-ho a provar.');items=[data.comment,...items.filter(item=>item.id!==data.comment.id)];setMarkers(true);renderPins();modal.close();message('Comentari desat i compartit.');}
      catch(cause){error.textContent=cause instanceof Error?cause.message:'No s’ha pogut desar. Torna-ho a provar.';error.hidden=false;}
      finally{busy=false;submit.disabled=false;submit.textContent='Desa el comentari';}
    };
    textarea.oninput=()=>textarea.setCustomValidity('');
  }
  add.onclick=()=>{if(armed){setArmed(false);return;}opts.onStart();setArmed(true);};list.onclick=showList;visibility.onclick=()=>setMarkers(!showMarkers);
  modal.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&armed)setArmed(false);});
  canvas.addEventListener('pointerdown',event=>{if(armed&&event.isPrimary&&event.button===0)press={x:event.clientX,y:event.clientY,id:event.pointerId};else press=null;},true);
  canvas.addEventListener('pointermove',event=>{if(press&&Math.hypot(event.clientX-press.x,event.clientY-press.y)>6)press=null;},true);
  canvas.addEventListener('pointercancel',()=>{press=null;},true);
  canvas.addEventListener('pointerup',event=>{
    if(!armed)return;const start=press;press=null;
    if(!start||start.id!==event.pointerId||event.button!==0||!opts.enabled())return;
    const rect=canvas.getBoundingClientRect(),ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),camera);
    const meshes:THREE.Object3D[]=[];scene.traverseVisible(object=>{if(object instanceof THREE.Mesh)meshes.push(object);});
    const hit=ray.intersectObjects(meshes,false)[0];if(!hit){message('Tria un punt del terreny o d’un edifici.');return;}
    const p=hit.point;setArmed(false);compose({easting:p.x+origin.easting,northing:origin.northing-p.z,elevation:p.y+origin.elevation,year:opts.year()});
  },true);
  // Refresh on return and while the map is visible, without polling a hidden tab.
  const refreshIfVisible=()=>{if(!document.hidden&&!modal.open&&Date.now()-lastRefresh>30000)void refresh();};
  window.addEventListener('focus',refreshIfVisible);document.addEventListener('visibilitychange',refreshIfVisible);setInterval(refreshIfVisible,60000);
  void refresh();
  return {get active(){return armed||modal.open;},update:()=>{
    const enabled=opts.enabled();toolbar.hidden=!enabled;markers.hidden=!enabled||!showMarkers;
    if(!enabled&&armed)setArmed(false);
    const rect=canvas.getBoundingClientRect();for(const pin of pins){const p=pin.point.clone().project(camera),x=(p.x*.5+.5)*rect.width,y=(-p.y*.5+.5)*rect.height;pin.button.hidden=p.z< -1||p.z>1||x<12||x>rect.width-12||y<20||y>rect.height-15;pin.button.style.left=`${x}px`;pin.button.style.top=`${y}px`;}
  }};
}
