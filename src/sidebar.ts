import './sidebar.css';

const workspace=document.querySelector<HTMLElement>('.workspace')!;
const sidebar=document.getElementById('exploration-panel')!;
const toggle=document.getElementById('sidebar-toggle')!;
const close=document.getElementById('sidebar-close')!;
function setOpen(open:boolean) {
  sidebar.hidden=!open;
  workspace.classList.toggle('sidebar-closed',!open);
  toggle.setAttribute('aria-expanded',String(open));
  toggle.textContent=open?'☰ Tanca el panell':'☰ Explora';
  (open?close:toggle).focus();
}
toggle.addEventListener('click',()=>setOpen(sidebar.hidden!==false));
close.addEventListener('click',()=>setOpen(false));
sidebar.addEventListener('keydown',event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();setOpen(false);}});
