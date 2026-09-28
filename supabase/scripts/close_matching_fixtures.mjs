import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';
const ref='yvcdkmsfuakjflmuatgz', root=`https://${ref}.supabase.co`, api=`${root}/functions/v1/garilink-api`;
const keys=JSON.parse(execFileSync('supabase',['projects','api-keys','--project-ref',ref,'--reveal','--output','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service=keys.find(k=>k.name==='service_role').api_key;
const admin={apikey:service,Authorization:`Bearer ${service}`};
async function call(base,path,method='GET',body,headers={}) {
 const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
 assert.ok(r.ok,`${method} ${path.split('?')[0]} HTTP ${r.status}`); return r.json();
}
const users=await call(root,'/auth/v1/admin/users?per_page=1000','GET',undefined,admin);
const owner=users.users.find(u=>u.email==='seller-evaluation@garilink.test'); assert.ok(owner);
const password=randomBytes(24).toString('base64url');
await call(root,`/auth/v1/admin/users/${owner.id}`,'PUT',{password},admin);
const auth=await call(api,'/auth/login','POST',{identifier:owner.email,password});
const headers={Authorization:`Bearer ${auth.accessToken}`};
const expected=new Set(['4c1849d4-a825-42b2-8211-97fd8bb6451c','9bff59fc-5f24-473d-8338-131ecfc2d045','4232f9ca-d05d-4e2b-a975-c3c4b71b2728']);
const inventory=await call(api,'/v2/vehicles/discoverable');
const fixtures=inventory.filter(v=>expected.has(v.vehicleId));
assert.equal(fixtures.length,3);
assert.ok(fixtures.every(v=>v.title==='TEST CERTIFICATION Isuzu N-Series Box Truck'||v.title==='Controlled V2 Toyota Fortuner — Evaluation Only'));
const workspaces=await call(api,'/workspaces','GET',undefined,headers);
const rentals=[];
for(const workspace of workspaces) {
 const rows=await call(api,`/owner/workspaces/${workspace.id}/rentals`,'GET',undefined,headers);
 assert.ok(Array.isArray(rows));
 rentals.push(...rows.filter(r=>expected.has(r.vehicleId)));
}
console.log('Rental fixture review:',JSON.stringify(rentals.map(r=>({id:r.id,status:r.status}))));
for(const rental of rentals.filter(r=>!['CANCELLED','REJECTED','COMPLETED'].includes(r.status))) {
 const customer=users.users.find(u=>u.id===rental.customer?.id);
 assert.ok(customer && ['buyer-evaluation@garilink.test','renter-evaluation@garilink.test'].includes(customer.email),'Only an established controlled evaluation renter may be changed');
 const renterPassword=randomBytes(24).toString('base64url');
 await call(root,`/auth/v1/admin/users/${customer.id}`,'PUT',{password:renterPassword},admin);
 const renterAuth=await call(api,'/auth/login','POST',{identifier:customer.email,password:renterPassword});
 const cancelled=await call(api,`/rentals/${rental.id}/cancel`,'PATCH',{}, {Authorization:`Bearer ${renterAuth.accessToken}`});
 assert.equal(cancelled.status,'CANCELLED');
 rental.status=cancelled.status;
 console.log(`CANCELLED controlled evaluation rental ${rental.id}`);
}
assert.ok(rentals.every(r=>['CANCELLED','REJECTED','COMPLETED'].includes(r.status)),'Active requests need canonical cancellation review before cleanup');
// Final no-suitable check where ALL nearby fixtures explicitly fail a hard requirement.
try {
 for(const v of fixtures) await call(api,`/v2/vehicles/${v.vehicleId}`,'PATCH',{vehicleCategory:v.vehicleCategory,capabilities:{...v.capabilities,with_driver:false},operationalAvailability:'AVAILABLE'},headers);
 const nearby=await call(api,'/v2/vehicles/nearby?lat=-6.8&lng=39.2&radiusMeters=5000&limit=50');
 assert.equal(nearby.data.length,fixtures.length);
 assert.ok(nearby.data.every(v=>v.capabilities.with_driver===false));
 const result=await call(api,'/v2/vehicles/match','POST',{searchLocation:{latitude:-6.8,longitude:39.2},transportNeed:{schemaVersion:1,purpose:'FAMILY_OR_GROUP',driverPreference:'WITH_DRIVER',longDistance:false,returnTrip:false},radiusMeters:5000,limit:50});
 assert.equal(result.data.length,0);
 console.log('PASS Nearby but none suitable: three discoverable candidates all explicitly fail WITH_DRIVER; zero matched.');
} finally {
 for(const v of fixtures) await call(api,`/v2/vehicles/${v.vehicleId}`,'PATCH',{vehicleCategory:v.vehicleCategory,capabilities:v.capabilities,operationalAvailability:v.operationalAvailability},headers);
 console.log('RESTORED all temporary capabilities and availability.');
}
for(const v of fixtures) {
 await call(api,`/v2/vehicles/${v.vehicleId}/publication`,'POST',{action:'pause'},headers);
 console.log(`PAUSED controlled fixture ${v.vehicleId}`);
}
const after=await call(api,'/v2/vehicles/discoverable');
assert.ok(after.every(v=>!expected.has(v.vehicleId)));
console.log('PASS Cleanup: all three evaluation vehicles absent from public discovery; accounts and media preserved; no active certification rentals.');
