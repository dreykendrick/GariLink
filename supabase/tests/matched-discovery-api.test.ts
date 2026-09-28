import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';

const config={supabaseUrl:'https://project.supabase.co',anonKey:'test',origins:[]};
const need={schemaVersion:1,purpose:'FAMILY_OR_GROUP',passengerCount:6,driverPreference:'ANY',longDistance:false,returnTrip:false};

test('matched discovery accepts structured intent and forwards only the bounded RPC contract',async()=>{
 const api=createApi(config,async(url,init)=>{
  assert.match(String(url),/garilink_v2_matched_vehicles$/);
  assert.deepEqual(JSON.parse(init!.body as string),{
   p_latitude:-6.8,p_longitude:39.2,p_transport_need:need,p_radius_meters:10000,p_limit:20,p_offset:0,
  });
  return Response.json({data:[{distanceMeters:3000,publicLocality:'Sinza',suitability:{matchingVersion:1,status:'SUITABLE',reasons:['PASSENGER_CAPACITY_OK']}}]});
 });
 const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/match',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({searchLocation:{latitude:-6.8,longitude:39.2},transportNeed:need}),
 }));
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.data[0].suitability.status,'SUITABLE');
 assert.doesNotMatch(JSON.stringify(payload),/operational_location|latitude|longitude/i);
});

for(const body of [
 {},
 {searchLocation:{latitude:91,longitude:39},transportNeed:need},
 {searchLocation:{latitude:-6,longitude:39},transportNeed:need,extra:true},
]) test('matched discovery rejects malformed request',async()=>{
 const api=createApi(config,async()=>Response.json({code:'22023',message:'private validator failure'},{status:400}));
 const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/match',{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
 }));
 assert.equal(response.status,400);
 assert.doesNotMatch(await response.text(),/validator|22023/i);
});
