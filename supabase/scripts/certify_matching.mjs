import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';

const ref='yvcdkmsfuakjflmuatgz'; const root=`https://${ref}.supabase.co`; const api=`${root}/functions/v1/garilink-api`;
const keys=JSON.parse(execFileSync('supabase',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service=keys.find(key=>key.name==='service_role').api_key; const admin={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'};
async function call(url,method='GET',body,headers={}) { const response=await fetch(url,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)}); const json=await response.json(); return {status:response.status,json}; }
const jpegDimensions=(bytes)=>{let i=2; while(i<bytes.length-9){if(bytes[i]!==0xff){i++;continue;} const marker=bytes[i+1],length=bytes.readUInt16BE(i+2); if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return {height:bytes.readUInt16BE(i+5),width:bytes.readUInt16BE(i+7)}; i+=2+length;} throw new Error('Controlled evaluation image is invalid.');};
let passed=0; function check(value,label){assert.ok(value,label); console.log(`PASS ${label}`); passed++;}
const users=(await call(`${root}/auth/v1/admin/users?per_page=1000`,'GET',undefined,admin)).json.users;
const owner=users.find(user=>user.email==='seller-evaluation@garilink.test'); assert.ok(owner); const password=randomBytes(24).toString('base64url');
assert.equal((await call(`${root}/auth/v1/admin/users/${owner.id}`,'PUT',{password},admin)).status,200);
const auth=(await call(`${api}/auth/login`,'POST',{identifier:owner.email,password})).json; const ownerHeader={Authorization:`Bearer ${auth.accessToken}`};
let listings=(await call(`${api}/v2/vehicles/discoverable`)).json; assert.ok(listings.length>=2,'Two controlled fixtures required');
const passenger=listings.find(item=>!['SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK'].includes(item.vehicleCategory));
let cargo=listings.find(item=>['PICKUP','SMALL_TRUCK','MEDIUM_TRUCK','HEAVY_TRUCK'].includes(item.vehicleCategory));
assert.ok(passenger,'A controlled passenger fixture is required');
if(!cargo) {
 const workspaces=(await call(`${api}/workspaces`,'GET',undefined,ownerHeader)).json;
 const workspace=workspaces.find(item=>item.name==='GariLink Evaluation Garage')??workspaces[0]; assert.ok(workspace,'Controlled owner workspace is required');
 const draft=await call(`${api}/v2/vehicles/drafts`,'POST',{
  workspaceId:workspace.id,requestId:'18000000-0000-4000-8000-000000000001',title:'TEST CERTIFICATION Isuzu N-Series Box Truck',description:'Controlled GariLink matching certification inventory. Not customer inventory.',county:'Dar es Salaam',price:250000,
  vehicle:{make:'Isuzu',model:'N-Series Certification Box',year:2022,mileage:18000,type:'TRUCK',fuelType:'DIESEL',transmission:'MANUAL',condition:'LOCAL_USED'},
  vehicleCategory:'SMALL_TRUCK',operationalAvailability:'AVAILABLE',capabilities:{schema_version:1,payload_kg:2500,cargo_body:'BOX',with_driver:true,self_drive:false,long_distance:true},
 },ownerHeader); assert.equal(draft.status,201,JSON.stringify(draft.json));
 const vehicleId=draft.json.vehicle?.id??draft.json.vehicleId; assert.ok(vehicleId,'Cargo draft vehicle ID required');
 const bytes=await readFile(join(process.cwd(),'evaluation-media','howo-front.jpeg')); const {width,height}=jpegDimensions(bytes);
 const reservation=await call(`${api}/media/reserve`,'POST',{vehicleId,mimeType:'image/jpeg'},ownerHeader); assert.equal(reservation.status,201,JSON.stringify(reservation.json));
 const upload=await fetch(reservation.json.uploadUrl,{method:'POST',headers:{Authorization:`Bearer ${auth.accessToken}`,apikey:reservation.json.apiKey,'Content-Type':'image/jpeg','Content-Length':String(bytes.length)},body:bytes}); assert.ok(upload.ok,'Controlled media upload failed');
 const finalized=await call(`${api}/media/finalize`,'POST',{mediaId:reservation.json.id,byteSize:bytes.length,width,height},ownerHeader); assert.equal(finalized.status,200,JSON.stringify(finalized.json));
 assert.equal((await call(`${api}/v2/vehicles/${vehicleId}/location`,'PATCH',{schemaVersion:1,source:'OWNER_CONFIGURED',latitude:-6.82,longitude:39.2,locality:'Mikocheni',city:'Dar es Salaam',accuracyMeters:25},ownerHeader)).status,200);
 assert.equal((await call(`${api}/v2/vehicles/${vehicleId}/publication`,'POST',{action:'publish'},ownerHeader)).status,200);
 listings=(await call(`${api}/v2/vehicles/discoverable`)).json; cargo=listings.find(item=>item.vehicleId===vehicleId); assert.ok(cargo,'Published cargo fixture is discoverable');
}
const passengerPatch={vehicleCategory:passenger.vehicleCategory,operationalAvailability:'AVAILABLE',capabilities:{schema_version:1,passenger_capacity:7,with_driver:true,self_drive:true,long_distance:true}};
assert.equal((await call(`${api}/v2/vehicles/${passenger.vehicleId}`,'PATCH',passengerPatch,ownerHeader)).status,200);
assert.equal((await call(`${api}/v2/vehicles/${cargo.vehicleId}`,'PATCH',{vehicleCategory:cargo.vehicleCategory,operationalAvailability:'AVAILABLE',capabilities:{schema_version:1,payload_kg:2500,cargo_body:'BOX',with_driver:true,self_drive:false,long_distance:true}},ownerHeader)).status,200);
const family={schemaVersion:1,purpose:'FAMILY_OR_GROUP',passengerCount:6,driverPreference:'WITH_DRIVER',longDistance:true,returnTrip:false};
const familyMatch=await call(`${api}/v2/vehicles/match`,'POST',{searchLocation:{latitude:-6.8,longitude:39.2},transportNeed:family,radiusMeters:5000,limit:20});
check(familyMatch.status===200,'Passenger match request succeeds');
check(familyMatch.json.data.some(item=>item.vehicleId===passenger.vehicleId&&item.suitability.status==='SUITABLE'),'Sufficient passenger vehicle is suitable');
{
 const cargoNeed={schemaVersion:1,purpose:'MOVING_GOODS',cargo:{estimatedWeightKg:1200,requiresCoveredBody:true},driverPreference:'WITH_DRIVER',longDistance:false,returnTrip:false};
 const cargoMatch=await call(`${api}/v2/vehicles/match`,'POST',{searchLocation:{latitude:-6.8,longitude:39.2},transportNeed:cargoNeed,radiusMeters:5000,limit:20});
 check(cargoMatch.status===200,'Cargo match request succeeds');
 check(cargoMatch.json.data.some(item=>item.vehicleId===cargo.vehicleId&&item.suitability.reasons.includes('PAYLOAD_CAPACITY_OK')&&item.suitability.reasons.includes('COVERED_CARGO_SUPPORTED')),'Covered payload-capable vehicle is suitable');
 check(!/latitude|longitude|operational_location|operational_geog|accuracy|pickup|destination|transportNeed/.test(JSON.stringify(cargoMatch.json)),'Matched discovery privacy boundary holds');
}
const invalid=await call(`${api}/v2/vehicles/match`,'POST',{searchLocation:{latitude:91,longitude:39.2},transportNeed:family});
check(invalid.status===400&&!/SQLSTATE|Postgre|stack/i.test(JSON.stringify(invalid.json)),'Invalid match request is rejected safely');
console.log(`Matching hosted checks: ${passed} passed, 0 failed. Controlled accounts retained; credentials were not printed.`);
