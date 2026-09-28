import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';
const config={supabaseUrl:'https://project.supabase.co',anonKey:'test',origins:[]};
for (const transportNeed of [undefined,{schemaVersion:1,purpose:'PERSONAL_TRIP'},{schemaVersion:1,purpose:'MOVING_GOODS',cargo:{estimatedWeightKg:300}}]) {
 test(`Rental API preserves optional snapshot ${transportNeed?.purpose??'legacy'}`,async()=>{
  const payload={listingId:'11111111-1111-4111-8111-111111111111',transportNeed};
  const api=createApi(config,async(url,init)=>{
   if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'renter'});
   assert.deepEqual(JSON.parse(init!.body as string),{input:JSON.parse(JSON.stringify(payload))});
   return Response.json({id:'rental',transportNeed:transportNeed??null});
  });
  const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/rentals',{method:'POST',headers:{Authorization:'Bearer renter','Content-Type':'application/json'},body:JSON.stringify(payload)}));
  assert.equal(response.status,201);assert.deepEqual((await response.json()).transportNeed,transportNeed??null);
 });
}
test('Transport requirement database errors remain sanitized',async()=>{
 const api=createApi(config,async(url)=>String(url).endsWith('/auth/v1/user')?Response.json({id:'renter'}):Response.json({code:'22023',message:'private database transport error'},{status:400}));
 const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/rentals',{method:'POST',headers:{Authorization:'Bearer renter','Content-Type':'application/json'},body:JSON.stringify({transportNeed:{purpose:'bad'}})}));
 assert.equal(response.status,400);assert.doesNotMatch(await response.text(),/private database|22023/);
});
