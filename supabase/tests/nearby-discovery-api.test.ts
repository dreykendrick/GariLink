import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createApi} from '../functions/garilink-api/handler.ts';

const config={supabaseUrl:'https://project.supabase.co',anonKey:'test',origins:[]};
const path='/v2/vehicles/nearby?lat=-6.8&lng=39.2&radiusMeters=10000&limit=20';

test('nearby discovery forwards a bounded server-side query',async()=>{
 const api=createApi(config,async(url,init)=>{
  assert.match(String(url),/garilink_v2_nearby_vehicles$/);
  assert.deepEqual(JSON.parse(init!.body as string),{p_latitude:-6.8,p_longitude:39.2,p_radius_meters:10000,p_limit:20,p_offset:0});
  return Response.json({data:[{id:'listing',publicLocality:'Sinza',distanceMeters:4400,eligibility:{requestable:true}}]});
 });
 const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api'+path));
 assert.equal(response.status,200);
 const payload=await response.json();
 assert.equal(payload.data[0].distanceMeters,4400);
 assert.doesNotMatch(JSON.stringify(payload),/latitude|longitude|operationalLocation/);
});
for(const query of ['?lat=91&lng=39','?lat=-6&lng=181','?lat=x&lng=39','?lat=-6&lng=39&radiusMeters=1.5','?lat=-6&lng=39&limit=999999']) {
 test('nearby query rejects malformed input '+query,async()=>{
  const api=createApi(config,async()=>Response.json({code:'22023',message:'private validator failure'},{status:400}));
  const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api/v2/vehicles/nearby'+query));
  assert.equal(response.status,400);
 });
}
test('nearby database validation is sanitized',async()=>{
 const api=createApi(config,async()=>Response.json({code:'22023',message:'private postgis failure'},{status:400}));
 const response=await api(new Request('https://project.supabase.co/functions/v1/garilink-api'+path));
 assert.equal(response.status,400);
 assert.doesNotMatch(await response.text(),/postgis|22023/i);
});
