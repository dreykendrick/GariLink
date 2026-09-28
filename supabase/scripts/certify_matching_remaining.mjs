import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import assert from 'node:assert/strict';

// Only existing, explicitly named evaluation fixtures are mutable here.
const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const keys = JSON.parse(execFileSync('supabase', ['projects','api-keys','--project-ref',ref,'--reveal','--output','json'], {encoding:'utf8',stdio:['ignore','pipe','pipe']}));
const service = keys.find(k => k.name === 'service_role').api_key;
const admin = {apikey:service, Authorization:`Bearer ${service}`};
async function request(path, method='GET', body, headers={}, base=api) {
  const response = await fetch(`${base}${path}`, {method, headers:{'Content-Type':'application/json',...headers}, body:body === undefined ? undefined : JSON.stringify(body), signal:AbortSignal.timeout(30000)});
  assert.ok(response.ok, `${method} ${path.split('?')[0]} HTTP ${response.status}`);
  return response.json();
}
const users = await request('/auth/v1/admin/users?per_page=1000','GET',undefined,admin,root);
const owner = users.users.find(u => u.email === 'seller-evaluation@garilink.test');
assert.ok(owner, 'Existing controlled owner required');
const password = randomBytes(24).toString('base64url');
await request(`/auth/v1/admin/users/${owner.id}`,'PUT',{password},admin,root);
const auth = await request('/auth/login','POST',{identifier:owner.email,password});
assert.ok(auth.accessToken);
const headers = {Authorization:`Bearer ${auth.accessToken}`};
const inventory = await request('/v2/vehicles/discoverable');
const fixtures = inventory.filter(v => v.title === 'TEST CERTIFICATION Isuzu N-Series Box Truck' || v.title === 'Controlled V2 Toyota Fortuner — Evaluation Only');
assert.equal(fixtures.length, 3, 'Expected three existing fixtures; do not create replacements');
const truck = fixtures.find(v => v.vehicleCategory === 'SMALL_TRUCK');
assert.ok(truck);
const origin = {latitude:-6.8,longitude:39.2};
const basic = {schemaVersion:1,purpose:'FAMILY_OR_GROUP',driverPreference:'WITH_DRIVER',longDistance:false,returnTrip:false};
const match = (need=basic,radiusMeters=5000,searchLocation=origin) => request('/v2/vehicles/match','POST',{searchLocation,transportNeed:need,radiusMeters,limit:50});
const patch = (v,capabilities=v.capabilities,operationalAvailability=v.operationalAvailability) => request(`/v2/vehicles/${v.vehicleId}`,'PATCH',{vehicleCategory:v.vehicleCategory,capabilities,operationalAvailability},headers);
function pass(label, evidence) { console.log(`PASS ${label}: ${JSON.stringify(evidence)}`); }
try {
  const nearby = await request('/v2/vehicles/nearby?lat=-6.8&lng=39.2&radiusMeters=5000&limit=50');
  const ordered = nearby.data.filter(v => fixtures.some(f => f.vehicleId === v.vehicleId));
  assert.ok(ordered.length >= 2);
  const close = fixtures.find(v => v.vehicleId === ordered[0].vehicleId);
  const far = fixtures.find(v => v.vehicleId === ordered.at(-1).vehicleId);
  assert.ok(ordered[0].distanceMeters < ordered.at(-1).distanceMeters);
  await patch(close,{...close.capabilities,with_driver:false});
  await patch(far,{...far.capabilities,with_driver:true});
  const ranked = await match();
  assert.ok(!ranked.data.some(v => v.vehicleId === close.vehicleId));
  assert.ok(ranked.data.some(v => v.vehicleId === far.vehicleId && v.suitability.status === 'SUITABLE'));
  pass('Closer hard-unsuitable excluded, farther suitable returned',{closerMeters:ordered[0].distanceMeters,fartherMeters:ordered.at(-1).distanceMeters,failedRequirement:'DRIVER_REQUIRED_NOT_SUPPORTED'});
  await patch(close,{...close.capabilities,with_driver:true});
  const first = await match(); const second = await match();
  assert.ok(first.data.length >= 2);
  assert.deepEqual(first.data.map(v=>v.id),second.data.map(v=>v.id));
  assert.ok(first.data.every((v,i,a)=>!i || a[i-1].distanceMeters <= v.distanceMeters));
  pass('Multiple suitable stable distance ordering', first.data.map(v=>({id:v.id,distanceMeters:v.distanceMeters})));
  await patch(truck,{...truck.capabilities,with_driver:true},'AVAILABLE');
  let result = (await match()).data.find(v=>v.vehicleId===truck.vehicleId);
  assert.equal(result.suitability.status,'SUITABLE'); assert.equal(result.operationalAvailability,'AVAILABLE'); assert.equal(result.eligibility.requestable,true);
  pass('Suitable AVAILABLE is requestable', result.eligibility);
  await patch(truck,{...truck.capabilities,with_driver:true},'BUSY');
  result = (await match()).data.find(v=>v.vehicleId===truck.vehicleId);
  assert.equal(result.suitability.status,'SUITABLE'); assert.equal(result.operationalAvailability,'BUSY'); assert.equal(result.eligibility.requestable,false);
  pass('Suitable BUSY is not requestable',result.eligibility);
  await patch(truck);
  for (const [key,need] of [['self_drive',{...basic,driverPreference:'SELF_DRIVE'}],['long_distance',{...basic,driverPreference:'ANY',longDistance:true}],['with_driver',basic]]) {
    for (const mode of ['false','absent']) {
      const caps = {...truck.capabilities}; if (mode==='absent') delete caps[key]; else caps[key]=false;
      await patch(truck,caps,'AVAILABLE');
      const candidates = await request('/v2/vehicles/nearby?lat=-6.8&lng=39.2&radiusMeters=5000&limit=50');
      assert.ok(candidates.data.some(v=>v.vehicleId===truck.vehicleId));
      assert.ok(!(await match(need)).data.some(v=>v.vehicleId===truck.vehicleId));
      pass(`${key} ${mode} excluded from primary matching`,{publishedDiscoverable:true,matched:false});
    }
  }
  await patch(truck);
  const impossible = {...basic,passengerCount:100};
  assert.equal((await match(impossible)).data.length,0);
  assert.ok(nearby.data.length>0);
  pass('Nearby candidates but no confirmed suitable results',{nearby:nearby.data.length,matched:0});
  const remoteOrigin={latitude:0,longitude:0};
  assert.equal((await match(basic,10000,remoteOrigin)).data.length,0);
  assert.equal((await request('/v2/vehicles/nearby?lat=0&lng=0&radiusMeters=10000&limit=1')).data.length,0);
  pass('No nearby candidates',{nearby:0,matched:0});
  const cargo={schemaVersion:1,purpose:'MOVING_GOODS',cargo:{estimatedWeightKg:500,requiresCoveredBody:true},driverPreference:'WITH_DRIVER',longDistance:true,returnTrip:false};
  assert.equal((await match(cargo,500)).data.length,0);
  assert.ok((await match(cargo,25000)).data.some(v=>v.vehicleId===truck.vehicleId));
  pass('Radius expansion with unchanged origin and need',{initialRadius:500,expandedRadius:25000});
  const final = await match();
  function inspect(value) { if (!value || typeof value!=='object') return; for(const [key,child] of Object.entries(value)) {assert.ok(!/latitude|longitude|operational_location|geog|accuracy|private.*(address|notes)|pickup|destination|phone|registration/i.test(key),`Forbidden public field: ${key}`); inspect(child);} }
  inspect(final);
  assert.ok(final.data.every(v=>v.type==='FOR_HIRE'));
  pass('Final public payload privacy and rental-only results',{results:final.data.length});
} finally {
  for(const fixture of fixtures) await patch(fixture);
  console.log('RESTORED original capabilities and availability for all three controlled fixtures. No rentals created.');
}
