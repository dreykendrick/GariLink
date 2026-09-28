import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const keys = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}));
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(service, 'Authorized project service credential is available');
const admin = {apikey: service, Authorization: `Bearer ${service}`};

async function call(url, method = 'GET', body, headers = {}) {
  const binary = body instanceof Uint8Array;
  const response = await fetch(url, {method, headers: {'Content-Type': 'application/json', ...headers}, body: body === undefined ? undefined : binary ? body : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = {message: text}; }
  return {status: response.status, json};
}
function expect(result, status, label) {
  assert.equal(result.status, status, `${label}: HTTP ${result.status} ${JSON.stringify(result.json)}`);
  console.log(`PASS ${label}`); passed += 1; return result.json;
}
function check(value, label) { assert.ok(value, label); console.log(`PASS ${label}`); passed += 1; }
let passed = 0;

const users = expect(await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin), 200, 'Controlled users enumerate').users;
async function login(email, label) {
  const user = users.find((item) => item.email === email); assert.ok(user, `${label} account exists`);
  const password = `${randomBytes(24).toString('base64url')}#9aA`;
  expect(await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin), 200, `${label} credential rotates privately`);
  const session = expect(await call(`${api}/auth/login`, 'POST', {identifier: email, password}), 200, `${label} authenticates normally`);
  return {Authorization: `Bearer ${session.accessToken}`};
}
const owner = await login('seller-evaluation@garilink.test', 'Owner');
const renter = await login('buyer-evaluation@garilink.test', 'Renter');

let workspaces = expect(await call(`${api}/workspaces`, 'GET', undefined, owner), 200, 'Workspace list loads');
let fleet = workspaces.find((item) => item.name === 'GariLink Evaluation Fleet');
if (!fleet) fleet = expect(await call(`${api}/workspaces`, 'POST', {
  name: 'GariLink Evaluation Fleet', type: 'FLEET_OWNER',
  description: 'Controlled Phase 4 certification workspace.',
  requestId: '44444444-4444-4444-8444-444444444444',
}, owner), 201, 'Fleet workspace creates through normal API');
check(fleet.businessMode === 'FLEET', 'New FLEET_OWNER workspace serializes authoritative FLEET mode');
workspaces = expect(await call(`${api}/workspaces`, 'GET', undefined, owner), 200, 'Multiple workspaces reload');
check(workspaces.some((item) => item.businessMode === 'INDIVIDUAL') && workspaces.some((item) => item.id === fleet.id && item.businessMode === 'FLEET'), 'Individual and Fleet workspaces coexist for one account');

const specs = [
  {requestId: '55555555-5555-4555-8555-555555555551', title: 'Phase 4 Fleet Fortuner — Evaluation Only', make: 'Toyota', model: 'Fortuner'},
  {requestId: '55555555-5555-4555-8555-555555555552', title: 'Phase 4 Fleet Prado — Evaluation Only', make: 'Toyota', model: 'Land Cruiser Prado'},
];
const capability = {schema_version: 1, transmission: 'AUTOMATIC', fuel_type: 'DIESEL', self_drive: true, with_driver: true, passenger_capacity: 7};
const created = [];
for (const [index, spec] of specs.entries()) {
  const draft = expect(await call(`${api}/v2/vehicles/drafts`, 'POST', {
    workspaceId: fleet.id, requestId: spec.requestId, title: spec.title,
    description: 'Controlled internal Fleet certification vehicle. Not customer inventory.',
    county: 'Dar es Salaam', price: 250000 + index * 25000,
    vehicle: {make: spec.make, model: spec.model, year: 2021 + index, mileage: 32000 + index * 4000, type: 'CAR', fuelType: 'DIESEL', transmission: 'AUTOMATIC', condition: 'FOREIGN_USED'},
    vehicleCategory: 'SUV', capabilities: capability, operationalAvailability: 'AVAILABLE',
  }, owner), 201, `${spec.model} fleet draft creates idempotently`);
  created.push({vehicleId: draft.vehicleId ?? draft.vehicle?.id, listingId: draft.listingId ?? draft.listing?.id, title: spec.title});
}
const minePayload = expect(await call(`${api}/listings/mine`, 'GET', undefined, owner), 200, 'Owner listing inventory reloads');
const mine = Array.isArray(minePayload) ? minePayload : minePayload.data;
assert.ok(Array.isArray(mine), 'Owner listing inventory data is available');
for (const item of created) {
  const listing = mine.find((candidate) => candidate.workspaceId === fleet.id && candidate.title === item.title);
  item.vehicleId ??= listing?.vehicleId ?? listing?.vehicle?.id;
  item.listingId ??= listing?.id;
}
check(created.every((item) => item.vehicleId && item.listingId) && new Set(created.map((item) => item.vehicleId)).size === 2, 'Fleet owns multiple distinct vehicles');

const primary = created[0];
expect(await call(`${api}/v2/vehicles/${primary.vehicleId}/location`, 'PATCH', {schemaVersion: 1, source: 'OWNER_CONFIGURED', locality: 'Mikocheni', city: 'Dar es Salaam', latitude: -6.77, longitude: 39.25, accuracyMeters: 25}, owner), 200, 'Fleet operational location saves privately');
expect(await call(`${api}/v2/vehicles/${primary.vehicleId}/pricing`, 'PATCH', {policyVersion: 1, currency: 'TZS', baseChargeMinor: 50000, minimumChargeMinor: 120000, durationRateMinorPerDay: 90000, distanceRateMinorPerKilometer: 0}, owner), 200, 'Fleet Pricing Policy V1 configures');

let publication = await call(`${api}/v2/vehicles/${primary.vehicleId}/publication`, 'POST', {action: 'publish'}, owner);
// The public API deliberately maps publication-readiness details to a generic
// user-safe message. A 400 here means the otherwise complete controlled draft
// still needs its qualifying media; upload project-owned media and retry.
if (publication.status === 400) {
  const bytes = await readFile(new URL('../evaluation-media/prado-front.jpeg', import.meta.url));
  const reservation = expect(await call(`${api}/media/reserve`, 'POST', {vehicleId: primary.vehicleId, mimeType: 'image/jpeg'}, owner), 201, 'Fleet media reserves');
  expect(await call(reservation.uploadUrl, 'POST', bytes, {Authorization: owner.Authorization, apikey: reservation.apiKey, 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.length)}), 200, 'Fleet media uploads');
  expect(await call(`${api}/media/finalize`, 'POST', {mediaId: reservation.id, byteSize: bytes.length, width: 736, height: 981}, owner), 200, 'Fleet media finalizes');
  publication = await call(`${api}/v2/vehicles/${primary.vehicleId}/publication`, 'POST', {action: 'publish'}, owner);
}
expect(publication, 200, 'Fleet vehicle publishes through readiness gate');
const discovery = expect(await call(`${api}/v2/vehicles/discoverable`), 200, 'Public rental discovery loads');
const listing = discovery.find((item) => item.vehicleId === primary.vehicleId || item.vehicle?.id === primary.vehicleId);
check(listing?.type === 'FOR_HIRE' && listing.eligibility?.requestable === true, 'Fleet vehicle is discoverable and requestable');
check(!/latitude|longitude|accuracyMeters|operationalLocation|phone|service_role|pickupLocation|destinationLocation/.test(JSON.stringify(listing)), 'Fleet public payload preserves privacy');

const start = new Date(Date.now() + 310 * 86400000).toISOString();
const end = new Date(Date.now() + 313 * 86400000).toISOString();
const rental = expect(await call(`${api}/rentals`, 'POST', {
  listingId: listing.id, requestId: randomUUID(), startDate: start, endDate: end,
  transportNeed: {schemaVersion: 1, purpose: 'FAMILY_OR_GROUP', passengerCount: 5, driverPreference: 'WITH_DRIVER', longDistance: false, returnTrip: true},
  pickupLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Mikocheni', city: 'Dar es Salaam'},
  destinationLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Kunduchi', city: 'Dar es Salaam'},
}, renter), 201, 'Renter creates Fleet vehicle request');
const incoming = expect(await call(`${api}/owner/workspaces/${fleet.id}/rentals`, 'GET', undefined, owner), 200, 'Fleet workspace reads its request');
check(incoming.some((item) => item.id === rental.id && item.vehicleId === primary.vehicleId), 'Fleet request retains correct vehicle association');
check([403, 404].includes((await call(`${api}/owner/workspaces/${workspaces.find((item) => item.id !== fleet.id).id}/rentals/${rental.id}/approve`, 'PATCH', {}, owner)).status), 'Other selected workspace cannot act on Fleet rental');

for (const [action, status] of [['approve', 'APPROVED'], ['ready', 'READY_FOR_PICKUP'], ['start', 'ACTIVE'], ['complete', 'COMPLETED']]) {
  const updated = expect(await call(`${api}/owner/workspaces/${fleet.id}/rentals/${rental.id}/${action}`, 'PATCH', {}, owner), 200, `Fleet lifecycle ${action}`);
  check(updated.status === status, `Fleet lifecycle reaches ${status}`);
}
const renterCopy = (expect(await call(`${api}/rentals`, 'GET', undefined, renter), 200, 'Renter Trips reloads')).find((item) => item.id === rental.id);
check(renterCopy?.status === 'COMPLETED', 'Renter and Fleet operator agree on completion');
check(JSON.stringify(renterCopy.transportNeed) === JSON.stringify(rental.transportNeed), 'Fleet lifecycle preserves immutable TransportNeed snapshot');

for (const item of created) {
  const paused = await call(`${api}/v2/vehicles/${item.vehicleId}/publication`, 'POST', {action: 'pause'}, owner);
  assert.ok([200, 409].includes(paused.status), `Fleet cleanup pause failed: ${paused.status}`);
}
console.log('PASS Cleanup: controlled Fleet vehicles paused; completed rental, workspace, accounts and media retained as evaluation evidence.');
console.log(`Sprint 4.4 hosted Fleet checks: ${passed} passed, 0 failed. Credentials were not printed.`);
