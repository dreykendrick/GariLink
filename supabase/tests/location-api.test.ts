import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';
const config={supabaseUrl:'https://project.supabase.co',anonKey:'test',origins:[]};
const id='11111111-1111-4111-8111-111111111111';
for(const method of ['GET','PATCH']) {
 test('Location '+method+' requires authentication',async()=>{
 const api=createApi(config,async()=>{throw Error('Must not call upstream');});
 const result=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/'+id+'/location',{method}));
 assert.equal(result.status,401);
 });
 test('Location '+method+' forwards authorized path identity',async()=>{
 const api=createApi(config,async(url,init)=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'owner'});
 const body=JSON.parse(init!.body as string);
 assert.equal(body[method==='GET'?'p_vehicle_id':'target_vehicle_id'],id);
 return Response.json({publicLocality:'Sinza',operationalLocation:{locality:'Sinza'}});
 });
 const result=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/'+id+'/location',{method,headers:{Authorization:'Bearer owner','Content-Type':'application/json'},...(method==='PATCH'?{body:JSON.stringify({schemaVersion:1,source:'MANUAL',locality:'Sinza'})}:{})}));
 assert.equal(result.status,200);assert.equal((await result.json()).publicLocality,'Sinza');
 });
}
for(const code of ['22023','42501']) test('Location sanitizes '+code,async()=>{
 const api=createApi(config,async(url)=>String(url).endsWith('/auth/v1/user')?Response.json({id:'owner'}):Response.json({code,message:'private SQL policy internals'},{status:400}));
 const result=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/'+id+'/location',{method:'PATCH',headers:{Authorization:'Bearer owner','Content-Type':'application/json'},body:'{}'}));
 assert.ok(result.status>=400);assert.doesNotMatch(await result.text(),/private SQL|policy internals/);
});
for(const locations of [{},{pickupLocation:{schemaVersion:1,source:'MANUAL',locality:'Sinza'}},{pickupLocation:{schemaVersion:1,source:'MANUAL',locality:'Sinza'},destinationLocation:{schemaVersion:1,source:'MANUAL',locality:'Airport'}}]) test('Rental location contract '+Object.keys(locations).join(','),async()=>{
 const fixture={id,listing:{id,vehicle:{make:'Toyota'}},depositAmount:null,transportNeed:null,...locations};
 const api=createApi(config,async(url,init)=>{
 if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'renter'});
 assert.deepEqual(JSON.parse(init!.body as string),{input:locations});
 return Response.json(fixture);
 });
 const result=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/rentals',{method:'POST',headers:{Authorization:'Bearer renter','Content-Type':'application/json'},body:JSON.stringify(locations)}));
 assert.equal(result.status,201);assert.deepEqual(await result.json(),fixture);
});

