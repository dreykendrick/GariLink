import {execFileSync} from 'node:child_process';
import {randomUUID, randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';

const ref='yvcdkmsfuakjflmuatgz';
const root=`https://${ref}.supabase.co`, api=`${root}/functions/v1/garilink-api`;
const keys=JSON.parse(execFileSync('supabase',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service=keys.find(k=>k.name==='service_role').api_key;
const admin={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'};
async function call(url,method='GET',body,headers={}) {
 const r=await fetch(url,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 const json=await r.json(); return {status:r.status,json};
}
let passed=0;
function check(condition,label){assert.ok(condition,label);console.log(`PASS ${label}`);passed++;}
const users=(await call(`${root}/auth/v1/admin/users?per_page=1000`,'GET',undefined,admin)).json.users;
async function login(email){
 const user=users.find(u=>u.email===email); assert.ok(user,'Controlled account exists');
 const password=randomBytes(24).toString('base64url');
 assert.equal((await call(`${root}/auth/v1/admin/users/${user.id}`,'PUT',{password},admin)).status,200);
 const session=await call(`${api}/auth/login`,'POST',{identifier:email,password});assert.equal(session.status,200);
 return {Authorization:`Bearer ${session.json.accessToken}`};
}
const buyer=await login('buyer-evaluation@garilink.test'), owner=await login('seller-evaluation@garilink.test');
const discovery=(await call(`${api}/v2/vehicles/discoverable`)).json;
const listing=discovery.find(l=>l.eligibility.requestable);assert.ok(listing,'Available controlled listing');
check(!JSON.stringify(discovery).includes('transportNeed'),'Public discovery excludes rental requirements');
const position={schemaVersion:1,source:'OWNER_CONFIGURED',locality:'Sinza',city:'Dar es Salaam',latitude:-6.8,longitude:39.2,accuracyMeters:25};
const vehicleId=listing.vehicleId ?? listing.vehicle.id;
const saved=await call(`${api}/v2/vehicles/${vehicleId}/location`,'PATCH',position,owner);
check(saved.status===200,'Owner location save');
const read=await call(`${api}/v2/vehicles/${vehicleId}/location`,'GET',undefined,owner);
assert.deepEqual(read.json.operationalLocation,position);check(true,'Private owner readback');
check([403,404].includes((await call(`${api}/v2/vehicles/${vehicleId}/location`,'PATCH',position,buyer)).status),'Unrelated owner mutation denied');
for(const bad of [{...position,latitude:91},{...position,longitude:-181},{...position,accuracyMeters:-1},{...position,latitude:'1'},{...position,source:'INVALID'},{...position,schemaVersion:2},{...position,extra:true}]) {
 check((await call(`${api}/v2/vehicles/${vehicleId}/location`,'PATCH',bad,owner)).status===400,'Invalid location rejected');
}
const publicRows=(await call(`${api}/v2/vehicles/discoverable`)).json;
check(publicRows.some(l=>l.id===listing.id && l.publicLocality==='Sinza'),'Public locality projection');
check(!/latitude|longitude|accuracyMeters|operationalLocation|pickupLocation|destinationLocation|transportNeed/.test(JSON.stringify(publicRows)),'Public privacy gate');
const pickup={schemaVersion:1,source:'MANUAL',locality:'Sinza',city:'Dar es Salaam'};
const destination={schemaVersion:1,source:'MANUAL',locality:'Airport'};
const base={listingId:listing.id,startDate:new Date(Date.now()+100*86400000).toISOString(),endDate:new Date(Date.now()+102*86400000).toISOString(),pickupNotes:'Controlled TransportNeed certification'};
const valid=[{schemaVersion:1,purpose:'PERSONAL_TRIP'},{schemaVersion:1,purpose:'FAMILY_OR_GROUP',passengerCount:6},...['PARCEL_DELIVERY','MOVING_GOODS','HEAVY_CARGO'].map(purpose=>({schemaVersion:1,purpose,cargo:{estimatedWeightKg:300,estimatedVolumeM3:2.5,fragile:true,requiresCoveredBody:true},driverPreference:'WITH_DRIVER'}))];
const invalid=[{}, {schemaVersion:1}, {schemaVersion:2,purpose:'PERSONAL_TRIP'}, {schemaVersion:1,purpose:'INVALID'}, {schemaVersion:1,purpose:'PERSONAL_TRIP',passengerCount:-1},{schemaVersion:1,purpose:'PERSONAL_TRIP',passengerCount:1.5},{schemaVersion:1,purpose:'PERSONAL_TRIP',passengerCount:'6'},{schemaVersion:1,purpose:'HEAVY_CARGO',cargo:{estimatedWeightKg:-1}},{schemaVersion:1,purpose:'HEAVY_CARGO',cargo:{estimatedVolumeM3:-1}},{schemaVersion:1,purpose:'PERSONAL_TRIP',unknown:true},{schemaVersion:1,purpose:'PERSONAL_TRIP',driverPreference:null},{schemaVersion:1,purpose:'PERSONAL_TRIP',notes:42},{schemaVersion:1,purpose:'HEAVY_CARGO'},{schemaVersion:1,purpose:'PERSONAL_TRIP',cargo:{}},{schemaVersion:1,purpose:'HEAVY_CARGO',cargo:{fragile:'yes'}}];
for(const [i,need] of invalid.entries()){
 const result=await call(`${api}/rentals`,'POST',{...base,requestId:randomUUID(),transportNeed:need},buyer);
 check(result.status===400 && !/SQLSTATE|42702|Postgre|stack/i.test(JSON.stringify(result.json)),`Invalid requirement ${i+1} rejected safely`);
}
for(const [i,need] of [...valid,undefined].entries()) {
 const payload={...base,requestId:randomUUID(),startDate:new Date(Date.now()+(440+i*5)*86400000).toISOString(),endDate:new Date(Date.now()+(442+i*5)*86400000).toISOString(),...(need?{transportNeed:need,pickupLocation:pickup,...(i%2?{}:{destinationLocation:destination})}:{})};
 const created=await call(`${api}/rentals`,'POST',payload,buyer);assert.equal(created.status,201,JSON.stringify(created.json));
 const rental=created.json;
 assert.deepEqual(rental.pickupLocation,payload.pickupLocation??null);assert.deepEqual(rental.destinationLocation,payload.destinationLocation??null);check(Boolean(rental.listing?.vehicle && 'depositAmount' in rental),'Nested serializer compatibility');
 const unrelated=(await call(`${api}/rentals`,'GET',undefined,owner)).json;
 check(!unrelated.some(r=>r.id===rental.id),'Other renter cannot read private snapshot');
 check([403,404].includes((await call(`${api}/owner/workspaces/${listing.workspaceId}/rentals`,'GET',undefined,buyer)).status),'Unrelated workspace reader denied');
 check([403,404].includes((await call(`${api}/owner/workspaces/${randomUUID()}/rentals/${rental.id}/approve`,'PATCH',{},owner)).status),'Wrong workspace action denied');
 assert.deepEqual(rental.transportNeed,need??null);check(true,`Snapshot ${i+1} created atomically (including legacy)`);
 const retry=await call(`${api}/rentals`,'POST',payload,buyer);check(retry.json.id===rental.id,'Identical retry returns same rental');
 const conflict=await call(`${api}/rentals`,'POST',{...payload,transportNeed:{schemaVersion:1,purpose:'CITY_TRAVEL'}},buyer);check(conflict.status===409,'Changed retry rejected');
 const own=(await call(`${api}/rentals`,'GET',undefined,buyer)).json.find(r=>r.id===rental.id);
 const incoming=(await call(`${api}/owner/workspaces/${listing.workspaceId}/rentals`,'GET',undefined,owner)).json.find(r=>r.id===rental.id);
 assert.deepEqual(own.pickupLocation,payload.pickupLocation??null);assert.deepEqual(incoming.destinationLocation,payload.destinationLocation??null);assert.deepEqual(own.transportNeed,need??null);assert.deepEqual(incoming.transportNeed,need??null);check(true,'Renter and authorized owner receive same snapshot');
 const denied=await call(`${api}/owner/workspaces/${listing.workspaceId}/rentals/${rental.id}/approve`,'PATCH',{},buyer);check([403,404].includes(denied.status),'Renter cannot perform owner action');
 const approved=await call(`${api}/owner/workspaces/${listing.workspaceId}/rentals/${rental.id}/approve`,'PATCH',{},owner);
 assert.equal(approved.status,200,JSON.stringify(approved.json));assert.deepEqual(approved.json.pickupLocation,payload.pickupLocation??null);assert.deepEqual(approved.json.destinationLocation,payload.destinationLocation??null);assert.deepEqual(approved.json.transportNeed,need??null);check(true,'Approval preserves snapshot');
 const cancelled=await call(`${api}/rentals/${rental.id}/cancel`,'PATCH',{},buyer);assert.equal(cancelled.status,200);assert.deepEqual(cancelled.json.transportNeed,need??null);check(true,'Cancellation preserves snapshot and releases test dates');
}
check((await call(`${api}/rentals`)).status===401,'Anonymous rental access rejected');
console.log(`Location hosted checks: ${passed} passed, 0 failed. Controlled test rentals cancelled; accounts retained. Credentials were not printed.`);


