// Tauler lateral amb l'expedient documental d'un edifici (docs/EDIFICIS, convertit a public/data/dossiers.json).
export type Phase={label:string;date:string|null;year:number|null;state:string;kind:string;refs:string[];precision:string;outside:boolean|null};
export type Photo={id:string;title:string;file:string;image:string;kind:'photo'|'plan'|'document';dateText:string;year:number|null;note:string};
export type Dossier={id:string;name:string;parent:string|null;kind:string;modelIds:string[];withoutModel:string|null;modelNote:string|null;studyPosition:{text:string;url:string|null}|null;placement:string;certainty:string;placementRefs:string;
  description:string[];phases:Phase[];photos:Photo[];documents:Photo[];todo:{done:boolean;text:string}[];unknown:string[];related:{id:string;name:string}[];
  sources:{id:string;title:string;year:number|null;kind:string;reading:string}[];note:string};
export type DossierData={prefixes:Record<string,string>;reviewed:string;targetRange:number[];activeSceneRange:number[];items:Record<string,Dossier>};

const escape=(text:string)=>text.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
// Les marques {{id|nom}} generades per l'script són enllaços a altres expedients.
const inline=(text:string)=>escape(text).replace(/\{\{([a-z0-9-]+)\|([^}]+)\}\}/g,(_,id,name)=>`<button class="dossier-link" data-dossier="${id}">${name}</button>`).replace(/\b(N\d{3}|H\d{2}|G\d{2})\b/g,'<span class="ref">$1</span>');
const KIND_LABEL:Record<string,string>={testimoni:'Testimoni',projecte:'Projecte',ordre:'Ordre',comparació:'Comparació'};

export function modelLookup(data:DossierData){
  const byModel=new Map<string,string[]>();
  for(const d of Object.values(data.items))for(const m of d.modelIds){const list=byModel.get(m)??[];list.push(d.id);byModel.set(m,list);}
  // Un cos individual (unitat-…) passa davant l'expedient de la tipologia, que es manté com a context.
  return (modelId:string):Dossier[]=>{
    let ids=byModel.get(modelId);
    if(!ids)for(const [prefix,id] of Object.entries(data.prefixes))if(modelId.startsWith(prefix))ids=[id];
    return [...new Set(ids??[])].map(id=>data.items[id]).filter(Boolean).sort((a,b)=>Number(!!b.parent)-Number(!!a.parent));
  };
}

function dossierHTML(d:Dossier,data:DossierData,opts:{extra?:string}):string{
  const parent=d.parent?data.items[d.parent]:null;
  const range=data.activeSceneRange;
  const phases=d.phases.map(p=>{
    const dated=p.year!==null,inScene=dated&&p.year!>=range[0]&&p.year!<=range[1];
    return `<li class="phase-item${dated&&!inScene?' outside':''}"><div class="phase-date">${escape(p.date??'Sense data fixada')}<span class="phase-kind">${escape(KIND_LABEL[p.kind]??p.kind)}</span></div><strong>${escape(p.label)}</strong><p>${escape(p.state)}</p><p class="phase-refs">${p.refs.map(r=>escape(r)).join(' · ')}</p>${dated&&!inScene?`<p class="phase-note">Fora de l’escena activa ${range[0]}–${range[1]}: es conserva com a comparació.</p>`:''}</li>`;
  }).join('');
  const base=import.meta.env.BASE_URL+'data/dossier-img/';
  const KIND:Record<string,string>={photo:'Fotografia',plan:'Plànol',document:'Document'};
  const card=(p:Photo,cls:string)=>`<figure class="${cls}"><a href="${base}${escape(p.image)}" target="_blank" rel="noreferrer"><img loading="lazy" decoding="async" src="${base}${escape(p.image)}" alt="${escape(p.title)}"></a><figcaption><span class="photo-year${p.year?'':' undated'}"><b>${KIND[p.kind]}</b> ${p.year?escape(p.dateText):'sense data original fixada'}</span><strong><span class="ref">${escape(p.id)}</span> ${escape(p.title)}</strong>${p.note?`<small>${escape(p.note)}</small>`:''}</figcaption></figure>`;
  // A dalt, només fotografies i, al davant de tot, el projecte de 1748 (N112 il·l.1) quan correspon a l'edifici.
  // La resta de plànols, mapes i previsions van més avall, just abans dels documents.
  const KEY_PLAN='N112 il·l.1';
  const byYear=(a:Photo,b:Photo)=>(a.year??9999)-(b.year??9999);
  const keyPlan=d.photos.filter(p=>p.id===KEY_PLAN),others=d.photos.filter(p=>p.id!==KEY_PLAN);
  const gallery=[...keyPlan,...others.filter(p=>p.kind!=='plan').sort(byYear)];
  const photos=gallery.length?`<h3>${keyPlan.length?'Fotografies i plànol de 1748':'Fotografies'} · ${gallery.length}</h3><div class="dossier-photos">${gallery.map(p=>card(p,'dossier-photo')).join('')}</div><p class="dossier-rule">L’any és el que indica l’expedient per a cada imatge: no sempre és la data de l’edifici ni de l’estat el 1800.${keyPlan.length?' El plànol de 1748 és un projecte, no obra executada.':''} Reproduccions de recerca; autoria i drets per verificar abans de qualsevol ús públic.</p>`:'';
  const planList=others.filter(p=>p.kind==='plan').sort(byYear);
  const plans=planList.length?`<h3>Plànols, mapes i previsions · ${planList.length}</h3><div class="dossier-photos">${planList.map(p=>card(p,'dossier-photo')).join('')}</div><p class="dossier-rule">Els plànols i projectes mostren previsions o interpretacions: no equivalen a obra executada ni a una planta mesurada de l’edifici.</p>`:'';
  // Imatges dels documents que citen l'edifici: cartes, llegendes, pàgines de les fonts impreses i de l'article.
  const docs=d.documents.length?`<h3>Documents consultats · ${d.documents.length}</h3><div class="dossier-docs">${d.documents.map(p=>card(p,'dossier-photo dossier-doc')).join('')}</div><p class="dossier-rule">Imatges dels textos i manuscrits que citen aquest edifici. Les pàgines de l’article de 2024 comenten el document de 1794: no en són l’original.</p>`:'';
  const sources=d.sources.map(s=>`<li><span class="ref">${escape(s.id)}</span> ${escape(s.title)}${s.year?` · ${s.year}`:''}<small>${escape(s.reading)}</small></li>`).join('');
  return `
    <div class="dossier-kicker">${escape(d.kind||'expedient')}${parent?` · cos d’estudi de <button class="dossier-link" data-dossier="${parent.id}">${escape(parent.name)}</button>`:''}</div>
    <h2>${escape(d.name)}</h2>
    ${photos}
    ${d.note?`<p class="dossier-warning">${inline(d.note)}</p>`:''}
    ${d.withoutModel?`<p class="dossier-warning">Sense model al visor: ${escape(d.withoutModel)}</p>`:''}
    ${d.modelNote?`<p class="dossier-warning">${escape(d.modelNote)}</p>`:''}
    ${opts.extra??''}
    <h3>Col·locació</h3>
    <p>${inline(d.placement)}</p>
    ${d.certainty?`<p class="dossier-certainty"><b>Certesa</b> ${escape(d.certainty)}</p>`:''}
    ${d.studyPosition?`<p class="dossier-position"><b>Posició al visor</b> ${escape(d.studyPosition.text)}${d.studyPosition.url?` <a href="${escape(d.studyPosition.url)}" target="_blank" rel="noreferrer">Font ↗</a>`:''}</p>`:''}
    <p class="dossier-coordinates">Coordenades històriques: <b>desconegudes</b>. La posició al visor és una posició d’assaig, no un punt mesurat.</p>
    <h3>Descripció documentada</h3>
    <ul>${d.description.map(t=>`<li>${inline(t)}</li>`).join('')}</ul>
    <h3>Canvis i testimonis per època</h3>
    <ol class="phase-list">${phases}</ol>
    <p class="dossier-rule">Cada fase recull la data del testimoni, no la de construcció. Cap d’aquestes dates activa automàticament un canvi de geometria.</p>
    <h3>Treball pendent</h3>
    <ul class="todo-list">${d.todo.map(t=>`<li class="${t.done?'done':''}">${inline(t.text)}</li>`).join('')}</ul>
    ${d.unknown.length?`<h3>Dades encara desconegudes</h3><ul>${d.unknown.map(t=>`<li>${escape(t)}</li>`).join('')}</ul>`:''}
    ${d.related.length?`<h3>Expedients relacionats</h3><p>${d.related.map(r=>`<button class="dossier-link" data-dossier="${r.id}">${escape(r.name)}</button>`).join(' ')}</p>`:''}
    ${plans}
    ${docs}
    <h3>Fonts</h3>
    <ul class="source-list">${sources}</ul>`;
}

export function makeDossierPanel(host:HTMLElement,data:DossierData,hooks:{onFocus:(d:Dossier)=>void;canFocus:(d:Dossier)=>boolean;extra:(d:Dossier)=>string;onAction:(action:string,d:Dossier)=>void;onClose:()=>void}){
  const body=host.querySelector<HTMLElement>('.dossier-body')!,tabs=host.querySelector<HTMLElement>('.dossier-tabs')!,closeButton=host.querySelector<HTMLButtonElement>('.dossier-close')!,focusButton=host.querySelector<HTMLButtonElement>('.dossier-focus')!;
  let list:Dossier[]=[],current=0;
  const show=(index:number,focus:boolean)=>{
    current=index;const d=list[index];
    tabs.hidden=list.length<2;focusButton.hidden=!hooks.canFocus(d);
    tabs.innerHTML=list.map((x,i)=>`<button role="tab" aria-selected="${i===index}" data-tab="${i}">${escape(x.parent?'Cos d’estudi':x.name)}</button>`).join('');
    body.innerHTML=dossierHTML(d,data,{extra:hooks.extra(d)});body.scrollTop=0;
    if(focus)hooks.onFocus(d);
  };
  const open=(dossiers:Dossier[],opts:{tab?:number;focus?:boolean}={})=>{if(!dossiers.length)return;list=dossiers;host.hidden=false;document.body.classList.add('dossier-open');show(opts.tab??0,!!opts.focus);host.focus({preventScroll:true});};
  const close=()=>{if(host.hidden)return;host.hidden=true;document.body.classList.remove('dossier-open');hooks.onClose();};
  closeButton.onclick=close;
  tabs.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-tab]');if(b)show(Number(b.dataset.tab),true);});
  host.addEventListener('click',e=>{
    const t=e.target as HTMLElement,link=t.closest<HTMLElement>('[data-dossier]');
    if(link){const d=data.items[link.dataset.dossier!];if(d)open([d,...(d.parent?[data.items[d.parent]]:[])].filter(Boolean),{focus:true});return;}
    const action=t.closest<HTMLElement>('[data-action]');if(action)hooks.onAction(action.dataset.action!,list[current]);
  });
  host.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  return {open,close,get isOpen(){return !host.hidden;}};
}
