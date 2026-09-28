import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const configuredVehicle = '9bff59fc-5f24-473d-8338-131ecfc2d045';
const unconfiguredVehicle = '4232f9ca-d05d-4e2b-a975-c3c4b71b2728';
const policy = {
  policyVersion: 1,
  currency: 'TZS',
  baseChargeMinor: 25000,
  minimumChargeMinor: 50000,
  durationRateMinorPerDay: 80000,
  distanceRateMinorPerKilometer: 1500,
};

const keys = JSON.parse(execFileSync(
  'supabase', ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'],
  {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']},
));
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(service, 'Authorized project service credential is available');
const admin = {apikey: service, Authorization: `Bearer ${service}`};

async function call(url, method = 'GET', body, headers = {}) {
  const response = await fetch(url, {
    method,
    headers: {'Content-Type': 'application/json', ...headers},
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = {message: text}; }
  return {status: response.status, json};
}

let passed = 0;
function check(condition, label) {
  assert.ok(condition, label);
  console.log(`PASS ${label}`);
  passed += 1;
}
function expectStatus(result, status, label) {
  assert.equal(result.status, status, `${label}: HTTP ${result.status} ${JSON.stringify(result.json)}`);
  check(true, label);
  return result.json;
}
function safeError(result, label) {
  check(result.status === 400 && !/SQLSTATE|Postgrest|stack|constraint/i.test(JSON.stringify(result.json)), label);
}

const users = expectStatus(
  await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin),
  200,
  'Authorized admin can enumerate controlled accounts',
).users;
async function login(email) {
  const user = users.find((item) => item.email === email);
  assert.ok(user, `Controlled account ${email} exists`);
  const password = randomBytes(24).toString('base64url');
  expectStatus(await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin), 200, `Controlled ${email.startsWith('seller') ? 'owner' : 'renter'} credential rotated privately`);
  const session = expectStatus(await call(`${api}/auth/login`, 'POST', {identifier: email, password}), 200, `Controlled ${email.startsWith('seller') ? 'owner' : 'renter'} authenticates normally`);
  return {Authorization: `Bearer ${session.accessToken}`};
}

const owner = await login('seller-evaluation@garilink.test');
const renter = await login('buyer-evaluation@garilink.test');
const workspaces = expectStatus(await call(`${api}/workspaces`, 'GET', undefined, owner), 200, 'Owner workspace loads');
const workspace = workspaces[0];
assert.ok(workspace?.id, 'Controlled owner workspace exists');
const inventory = expectStatus(await call(`${api}/vehicles/workspace/${workspace.id}`, 'GET', undefined, owner), 200, 'Owner inventory loads').data;
const configuredOriginal = inventory.find((item) => item.id === configuredVehicle);
const unconfiguredOriginal = inventory.find((item) => item.id === unconfiguredVehicle);
assert.ok(configuredOriginal && unconfiguredOriginal, 'Controlled pricing vehicles belong to owner');

let rental;
try {
  const initialUnconfigured = expectStatus(await call(`${api}/v2/vehicles/${unconfiguredVehicle}/pricing`, 'GET', undefined, owner), 200, 'Unconfigured policy reads explicitly');
  check(initialUnconfigured.configured === false, 'Absent pricing is not represented as a zero price');

  const saved = expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', policy, owner), 200, 'Owner configures Pricing Policy V1');
  check(saved.configured === true && saved.baseChargeMinor === 25000 && saved.distanceRateMinorPerKilometer === 1500, 'Exact integer TZS values round-trip without drift');
  const reread = expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'GET', undefined, owner), 200, 'Configured policy reads back');
  check(Object.entries(policy).every(([key, value]) => reread[key] === value), 'Repeated reads are deterministic');

  for (const [label, invalid] of [
    ['negative amount is rejected', {...policy, baseChargeMinor: -1}],
    ['unsupported currency is rejected', {...policy, currency: 'USD'}],
    ['unsupported version is rejected', {...policy, policyVersion: 2}],
    ['unknown field is rejected', {...policy, surpriseFeeMinor: 1}],
    ['minimum below base is rejected', {...policy, baseChargeMinor: 50001, minimumChargeMinor: 50000}],
    ['fractional amount is rejected', {...policy, baseChargeMinor: 1.5}],
  ]) safeError(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', invalid, owner), label);

  check([403, 404].includes((await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', policy, renter)).status), 'Renter cannot mutate owner pricing');
  check((await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', policy)).status === 401, 'Anonymous pricing mutation is rejected');
  check([403, 404].includes((await call(`${api}/v2/vehicles/${randomUUID()}/pricing`, 'PATCH', policy, owner)).status), 'Unknown or unrelated vehicle cannot be mutated');

  const category = configuredOriginal.vehicleCategory ?? 'SUV';
  const capabilities = configuredOriginal.capabilities;
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}`, 'PATCH', {vehicleCategory: category, capabilities, operationalAvailability: 'AVAILABLE'}, owner), 200, 'Configured vehicle remains V2 valid');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/publication`, 'POST', {action: 'publish'}, owner), 200, 'Configured FOR_HIRE vehicle publishes');
  const discovery = expectStatus(await call(`${api}/v2/vehicles/discoverable`), 200, 'Public V2 discovery loads after pricing configuration');
  const listing = discovery.find((item) => item.vehicleId === configuredVehicle || item.vehicle?.id === configuredVehicle);
  assert.ok(listing, 'Configured controlled vehicle appears in public discovery');
  const publicPolicy = listing.vehicle?.rentalPricing ?? listing.rentalPricing;
  check(publicPolicy?.configured === true && publicPolicy.durationRateMinorPerDay === 80000, 'Public discovery exposes only the safe pricing summary');
  const publicText = JSON.stringify(listing);
  check(!/updatedBy|updated_by|phone|registration|service_role|exactAddress/i.test(publicText), 'Public pricing payload excludes owner and operational secrets');
  check(discovery.every((item) => item.type === 'FOR_HIRE'), 'FOR_SALE remains excluded from V2 rental discovery');

  const start = new Date(Date.now() + 240 * 86400000).toISOString();
  const end = new Date(Date.now() + 243 * 86400000).toISOString();
  const rentalPayload = {
    listingId: listing.id,
    requestId: randomUUID(),
    startDate: start,
    endDate: end,
    pickupNotes: 'Sprint 2.1 controlled pricing regression',
    transportNeed: {schemaVersion: 1, purpose: 'FAMILY_OR_GROUP', passengerCount: 2, driverPreference: 'WITH_DRIVER', longDistance: false, returnTrip: false},
    pickupLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Mikocheni', city: 'Dar es Salaam'},
    destinationLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Kariakoo', city: 'Dar es Salaam'},
  };
  rental = expectStatus(await call(`${api}/rentals`, 'POST', rentalPayload, renter), 201, 'Legacy rental request still succeeds with configured pricing');
  check(rental.pricingEstimate === null, 'Rental estimate snapshot stays null until route-input activation');
  check(typeof rental.totalAmount === 'number' && rental.totalAmount > 0, 'Legacy rental total remains compatible');
  expectStatus(await call(`${api}/rentals/${rental.id}/cancel`, 'PATCH', {}, renter), 200, 'Certification rental is cancelled');
  rental = null;

  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/publication`, 'POST', {action: 'pause'}, owner), 200, 'Configured vehicle pauses');
  check(!(await call(`${api}/v2/vehicles/discoverable`)).json.some((item) => item.vehicleId === configuredVehicle || item.vehicle?.id === configuredVehicle), 'Paused vehicle disappears from discovery');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/publication`, 'POST', {action: 'publish'}, owner), 200, 'Configured vehicle republishes');
  check((await call(`${api}/v2/vehicles/discoverable`)).json.some((item) => item.vehicleId === configuredVehicle || item.vehicle?.id === configuredVehicle), 'Republished vehicle returns to discovery');
} finally {
  if (rental) await call(`${api}/rentals/${rental.id}/cancel`, 'PATCH', {}, renter);
  for (const vehicleId of [configuredVehicle, unconfiguredVehicle]) {
    const paused = await call(`${api}/v2/vehicles/${vehicleId}/publication`, 'POST', {action: 'pause'}, owner);
    assert.ok([200, 409].includes(paused.status), `Cleanup pause failed for ${vehicleId}: HTTP ${paused.status}`);
  }
  console.log('PASS Cleanup: controlled vehicles paused; pricing policy retained for Phase 2; accounts and evidence retained.');
}

console.log(`Sprint 2.1 hosted pricing checks: ${passed} passed, 0 failed. Credentials were not printed.`);
