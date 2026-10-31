import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler,{validateComment} from '../api/comments.mjs';

const point={text:'Una observació sobre aquest lloc',author:'Pilar',easting:296414,northing:4499199,elevation:12,year:1800};
const request=(method,body)=>({method,body,headers:{host:'rapita.vercel.app',origin:'https://rapita.vercel.app','content-type':'application/json','x-forwarded-for':'192.0.2.1'}});
const response=()=>({headers:{},setHeader(name,value){this.headers[name]=value;},status(code){this.code=code;return this;},json(body){this.body=body;return this;}});

test('comment validation rejects empty, oversized and invalid map coordinates',()=>{
  assert.deepEqual(validateComment({...point,text:'  Nota  '}),{...point,text:'Nota'});
  for(const change of [{text:' '},{text:'x'.repeat(2001)},{author:'x'.repeat(61)},{easting:NaN},{northing:0},{elevation:Infinity},{year:1800.5},{year:'1800'}])assert.equal(validateComment({...point,...change}),null);
  assert.equal(validateComment(null),null);
});

test('shared comment API persists, retrieves, rate limits and fails honestly',async()=>{
  const oldFetch=globalThis.fetch,oldURL=process.env.KV_REST_API_URL,oldToken=process.env.KV_REST_API_TOKEN;
  process.env.KV_REST_API_URL='https://redis.example.test';process.env.KV_REST_API_TOKEN='test-only';
  let records=[],allow=true;
  globalThis.fetch=async(_url,options)=>{const command=JSON.parse(options.body);assert.equal(options.headers.Authorization,'Bearer test-only');let result;
    if(command[0]==='SET')result=allow?'OK':null;
    else if(command[0]==='ZADD'){records.push(command[3]);result=1;}
    else if(command[0]==='ZRANGE')result=records;
    else throw new Error('Unexpected command');
    return {ok:true,json:async()=>({result})};
  };
  try {
    let res=response();await handler(request('POST',point),res);assert.equal(res.code,201);assert.equal(res.body.comment.text,point.text);assert.ok(res.body.comment.id);assert.ok(Date.parse(res.body.comment.createdAt));
    const saved=res.body.comment;
    res=response();await handler(request('GET'),res);assert.equal(res.code,200);assert.deepEqual(res.body.comments,[saved]);assert.equal(res.headers['Cache-Control'],'no-store');
    records.push('broken',JSON.stringify({...saved,easting:null}));res=response();await handler(request('GET'),res);assert.equal(res.body.comments.length,1);
    res=response();await handler(request('POST',{...point,text:''}),res);assert.equal(res.code,400);
    const foreign=request('POST',point);foreign.headers.origin='https://elsewhere.example';res=response();await handler(foreign,res);assert.equal(res.code,403);
    res=response();await handler(request('DELETE'),res);assert.equal(res.code,405);
    allow=false;res=response();await handler(request('POST',point),res);assert.equal(res.code,429);assert.equal(res.headers['Retry-After'],'5');
    globalThis.fetch=async()=>{throw new Error('Offline');};res=response();await handler(request('POST',point),res);assert.equal(res.code,503);assert.equal(res.body.comment,undefined);
  } finally {globalThis.fetch=oldFetch;if(oldURL===undefined)delete process.env.KV_REST_API_URL;else process.env.KV_REST_API_URL=oldURL;if(oldToken===undefined)delete process.env.KV_REST_API_TOKEN;else process.env.KV_REST_API_TOKEN=oldToken;}
});
