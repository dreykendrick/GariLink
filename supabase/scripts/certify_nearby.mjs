import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';

const ref='yvcdkmsfuakjflmuatgz'; const root=`https://${ref}.supabase.co`; const api=`${root}/functions/v1/garilink-api`;
const keys=JSON.parse(execFileSync('supabase',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service=keys.find(key=>key.name==='service_role').api_key; const admin={apikey:service,Authorization:`Bearer ${service}`,'Content-Type':'application/json'};
async function call(url,method='GET',body,headers={}) { const response=await fetch(url,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body)}); const json=await response.json(); return {status:response.status,json}; }
let passed=0; function check(value,label){assert.ok(value,label); console.log(`PASS ${label}`); passed++;}
const users=(await call(`${root}/auth/v1/admin/users?per_page=1000`,'GET',undefined,admin)).json.users;
const owner=users.find(user=>user.email==='seller-evaluation@garilink.test'); assert.ok(owner); const password=randomBytes(24).toString('base64url');
assert.equal((await call(`${root}/auth/v1/admin/users/${owner.id}`,'PUT',{password},admin)).status,200);
const auth=(await call(`${api}/auth/login`,'POST',{identifier:owner.email,password})).json; const ownerHeader={Authorization:`Bearer ${auth.accessToken}`};
const listings=(await call(`${api}/v2/vehicles/discoverable`)).json; assert.ok(listings.length>=2,'Two controlled vehicles required');
const coordinates=[[-6.8,39.2,'Sinza'],[-6.82,39.2,'Mikocheni']];
for(const [index,listing] of listings.slice(0,2).entries()){ const [lat,lng,locality]=coordinates[index]; const saved=await call(`${api}/v2/vehicles/${listing.vehicleId}/location`,'PATCH',{schemaVersion:1,source:'OWNER_CONFIGURED',latitude:lat,longitude:lng,locality,city:'Dar es Salaam',accuracyMeters:25},ownerHeader); assert.equal(saved.status,200,JSON.stringify(saved.json)); }
const nearby=(await call(`${api}/v2/vehicles/nearby?lat=-6.8&lng=39.2&radiusMeters=5000&limit=20`)).json; check(nearby.data.length>=2,'Known nearby vehicles included'); check(nearby.data[0].distanceMeters<=nearby.data[1].distanceMeters,'Distance ordering is ascending'); check(nearby.data[0].publicLocality==='Sinza','Coarse locality is present'); check(!/latitude|longitude|operationalLocation|operational_geog|accuracy|pickupLocation|destinationLocation|transportNeed/.test(JSON.stringify(nearby)),'Nearby privacy boundary holds');
const outside=(await call(`${api}/v2/vehicles/nearby?lat=-6.7&lng=39.2&radiusMeters=500&limit=20`)).json; check(outside.data.length===0,'Outside-radius vehicle excluded');
for(const query of ['lat=91&lng=39.2','lat=-6.8&lng=39.2&radiusMeters=0','lat=-6.8&lng=39.2&radiusMeters=100001','lat=-6.8&lng=39.2&limit=51']) { const result=await call(`${api}/v2/vehicles/nearby?${query}`); check(result.status===400&&!/SQLSTATE|Postgre|stack/i.test(JSON.stringify(result.json)),`Invalid query rejected safely: ${query}`); }
console.log(`Nearby hosted checks: ${passed} passed, 0 failed. Controlled accounts retained; credentials were not printed.`);
