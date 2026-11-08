import{test}from'node:test';import assert from'node:assert/strict';import{readFile}from'node:fs/promises';
import{port1945OverlayData}from'../src/port-overlay-plan.mjs';import{planToUTM}from'../src/plan1748.ts';
const json=async p=>JSON.parse(await readFile(new URL('../'+p,import.meta.url),'utf8')),history=await json('public/data/harbour-history.json'),data=await json('public/data/plan-port-1945.json');
test('the original 1945–1946 capture uses the existing independently checked UTM registration',()=>{
 assert.deepEqual(data,port1945OverlayData(history));const g=data.georeference,p={rotation:g.rotationDegrees,scale:g.metersPerPixel,dE:0,dN:0},reg=history.phases.find(p=>p.fromYear===1945).registration,m=reg.matrix;
 for(const c of reg.points){const[x,y]=c.pixel,expected=[295500+(m[0][0]*x+m[0][1]*y+m[0][2])*5/3,4500000-(m[1][0]*x+m[1][1]*y+m[1][2])*5/3],actual=planToUTM(x,y,data,p);assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<1e-7);assert.ok(Math.hypot(actual[0]-c.utm[0],actual[1]-c.utm[1])<3);}
 assert.deepEqual(data.sourcePeriod,[1945,1946]);assert.ok(g.registrationInliers>2000);assert.ok(g.registrationRMSEMeters<1);assert.ok(data.pixelBounds[1]>=190&&data.pixelBounds[3]<=940);
});
