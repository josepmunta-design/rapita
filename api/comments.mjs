import {createHash,randomUUID} from 'node:crypto';

const KEY='rapita:comments:v1';
export function validateComment(body) {
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const {text,author='',easting,northing,elevation,year}=body;
  if(typeof text!=='string'||!text.trim()||text.trim().length>2000||typeof author!=='string'||author.trim().length>60)return null;
  if(![easting,northing,elevation,year].every(Number.isFinite)||easting<200000||easting>400000||northing<4400000||northing>4600000||elevation< -100||elevation>2000||!Number.isInteger(year)||year<1700||year>2000)return null;
  return {text:text.trim(),author:author.trim(),easting,northing,elevation,year};
}

export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','POST','DELETE'].includes(req.method)){res.setHeader('Allow','GET, POST, DELETE');return res.status(405).json({error:'Mètode no permès.'});}
  const url=process.env.KV_REST_API_URL||process.env.UPSTASH_REDIS_REST_URL;
  const token=process.env.KV_REST_API_TOKEN||process.env.UPSTASH_REDIS_REST_TOKEN;
  if(!url||!token)return res.status(503).json({error:'Els comentaris compartits encara no estan disponibles. Torna-ho a provar més tard.'});
  const redis=async command=>{const response=await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Storage unavailable');const data=await response.json();if(data.error)throw new Error('Storage command failed');return data.result;};
  try {
    if(req.method==='GET'){
      const records=await redis(['ZRANGE',KEY,0,999,'REV']);
      const comments=(records||[]).flatMap(record=>{try{const item=JSON.parse(record);return validateComment(item)&&typeof item.id==='string'&&Number.isFinite(Date.parse(item.createdAt))?[item]:[];}catch{return[];}});
      return res.status(200).json({comments});
    }
    // Only same-origin browser submissions; no cross-origin credentials or scripts.
    if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Origen no permès.'});
    if(!req.headers['content-type']?.startsWith('application/json'))return res.status(415).json({error:'Format no vàlid.'});
    if(Number(req.headers['content-length']||0)>16000)return res.status(413).json({error:'El comentari és massa llarg.'});
    let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{return res.status(400).json({error:'Comentari no vàlid.'});}}
    const deleting=req.method==='DELETE';
    const input=deleting?null:validateComment(body);
    if(deleting&&(!body||typeof body.id!=='string'||!/^[a-f0-9-]{36}$/i.test(body.id)))return res.status(400).json({error:'Tria un comentari vàlid per esborrar-lo.'});
    if(!deleting&&!input)return res.status(400).json({error:'Escriu un text de fins a 2.000 caràcters i selecciona un punt vàlid del mapa.'});
    const ip=String(req.headers['x-forwarded-for']||req.headers['x-real-ip']||'unknown').split(',')[0].trim();
    const hash=createHash('sha256').update(`${token}:${ip}`).digest('hex').slice(0,24);
    const allowed=await redis(['SET',`rapita:comment-rate:${req.method}:${hash}`,'1','EX',deleting?1:5,'NX']);
    if(!allowed){res.setHeader('Retry-After','5');return res.status(429).json({error:'Espera uns segons abans de desar un altre comentari.'});}
    if(deleting){
      const records=await redis(['ZRANGE',KEY,0,999,'REV']);
      const record=(records||[]).find(value=>{try{const item=JSON.parse(value);return validateComment(item)&&item.id===body.id;}catch{return false;}});
      if(!record)return res.status(404).json({error:'Aquest comentari ja no existeix. Actualitza la llista.'});
      await redis(['ZREM',KEY,record]);
      return res.status(200).json({deleted:true});
    }
    const comment={...input,id:randomUUID(),createdAt:new Date().toISOString()};
    await redis(['ZADD',KEY,Date.now(),JSON.stringify(comment)]);
    return res.status(201).json({comment});
  } catch {return res.status(503).json({error:'No s’ha pogut connectar amb els comentaris. Torna-ho a provar.'});}
}
