import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const configuredVehicle = '9bff59fc-5f24-473d-8338-131ecfc2d045';
const unconfiguredVehicle = '4232f9ca-d05d-4e2b-a975-c3c4b71b2728';
const routeIndependentPolicy = {policyVersion: 1, currency: 'TZS', baseChargeMinor: 25000,
  minimumChargeMinor: 50000, durationRateMinorPerDay: 80000};
const routeDependentPolicy = {...routeIndependentPolicy, distanceRateMinorPerKilometer: 1500};

const keys = JSON.parse(execFileSync('supabase',
  ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'],
  {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}));
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(service, 'Authorized project service credential is available');
const admin = {apikey: service, Authorization: `Bearer ${service}`};

async function call(url, method = 'GET', body, headers = {}) {
  const response = await fetch(url, {method,
    headers: {'Content-Type': 'application/json', ...headers},
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = {message: text}; }
  return {status: response.status, json};
}
let passed = 0;
function check(condition, label) { assert.ok(condition, label); console.log(`PASS ${label}`); passed += 1; }
function expectStatus(result, status, label) {
  assert.equal(result.status, status, `${label}: HTTP ${result.status} ${JSON.stringify(result.json)}`);
  check(true, label); return result.json;
}
function dateAfter(days) { return new Date(Date.now() + days * 86400000).toISOString(); }
const users = expectStatus(await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin), 200,
  'Authorized admin can enumerate controlled accounts').users;
async function login(email, role) {
  const user = users.find((item) => item.email === email); assert.ok(user, `Controlled ${role} exists`);
  const password = `${randomBytes(24).toString('base64url')}#9aA`;
  expectStatus(await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin), 200,
    `Controlled ${role} credential rotated privately`);
  const session = expectStatus(await call(`${api}/auth/login`, 'POST', {identifier: email, password}), 200,
    `Controlled ${role} authenticates normally`);
  return {id: user.id, headers: {Authorization: `Bearer ${session.accessToken}`}};
}

const owner = await login('seller-evaluation@garilink.test', 'owner');
const renter = await login('buyer-evaluation@garilink.test', 'renter');
const workspaces = expectStatus(await call(`${api}/workspaces`, 'GET', undefined, owner.headers), 200, 'Owner workspace loads');
const workspace = workspaces[0]; assert.ok(workspace?.id, 'Controlled owner workspace exists');
const inventory = expectStatus(await call(`${api}/vehicles/workspace/${workspace.id}`, 'GET', undefined, owner.headers), 200,
  'Owner inventory loads').data;
const configuredOriginal = inventory.find((item) => item.id === configuredVehicle);
const unconfiguredOriginal = inventory.find((item) => item.id === unconfiguredVehicle);
assert.ok(configuredOriginal && unconfiguredOriginal, 'Controlled estimate fixtures belong to owner');

let createdRental;
try {
  for (const vehicle of [configuredOriginal, unconfiguredOriginal]) {
    expectStatus(await call(`${api}/v2/vehicles/${vehicle.id}`, 'PATCH', {
      vehicleCategory: vehicle.vehicleCategory ?? 'SUV', capabilities: vehicle.capabilities,
      operationalAvailability: 'AVAILABLE'}, owner.headers), 200, `${vehicle.id === configuredVehicle ? 'Configured' : 'Unconfigured'} vehicle is available`);
    expectStatus(await call(`${api}/v2/vehicles/${vehicle.id}/publication`, 'POST', {action: 'publish'}, owner.headers), 200,
      `${vehicle.id === configuredVehicle ? 'Configured' : 'Unconfigured'} FOR_HIRE vehicle publishes`);
  }
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', routeIndependentPolicy, owner.headers), 200,
    'Owner sets route-independent Pricing Policy V1');
  const discovery = expectStatus(await call(`${api}/v2/vehicles/discoverable`), 200, 'Hosted V2 discovery loads');
  const configuredListing = discovery.find((item) => item.vehicleId === configuredVehicle || item.vehicle?.id === configuredVehicle);
  const unconfiguredListing = discovery.find((item) => item.vehicleId === unconfiguredVehicle || item.vehicle?.id === unconfiguredVehicle);
  assert.ok(configuredListing && unconfiguredListing, 'Both controlled listings are discoverable');
  check(discovery.every((item) => item.type === 'FOR_HIRE'), 'FOR_SALE is excluded from estimate discovery');

  const baseIntent = {listingId: configuredListing.id, startDate: dateAfter(120), endDate: dateAfter(123),
    pickupLocation: {latitude: -6.7924, longitude: 39.2083},
    destinationLocation: {latitude: -6.8161, longitude: 39.2804}};
  const estimate = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', baseIntent, renter.headers), 200,
    'Authenticated renter previews route-independent pricing');
  check(estimate.status === 'ESTIMATED' && estimate.finalEstimatedAmountMinor === 265000,
    'Three-day estimate is exactly TZS 265,000');
  check(estimate.components.baseChargeMinor === 25000 && estimate.components.durationChargeMinor === 240000 &&
    estimate.components.distanceChargeMinor === 0 && estimate.components.minimumAdjustmentMinor === 0,
    'Authoritative component breakdown is exact');
  check(estimate.routeDistanceMeters == null && estimate.routeCalculationVersion == null,
    'Route-independent estimate contains no fabricated route evidence');
  const repeated = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', baseIntent, renter.headers), 200,
    'Repeated preview succeeds');
  check(repeated.finalEstimatedAmountMinor === estimate.finalEstimatedAmountMinor &&
    JSON.stringify(repeated.components) === JSON.stringify(estimate.components), 'Repeated monetary output is deterministic');
  check((await call(`${api}/v2/rentals/estimate`, 'POST', baseIntent)).status === 401, 'Anonymous estimate access is rejected');
  check((await call(`${api}/v2/rentals/estimate`, 'POST', {...baseIntent, finalEstimatedAmountMinor: 1}, renter.headers)).status === 400,
    'Client final amount is rejected');
  check((await call(`${api}/v2/rentals/estimate`, 'POST', {...baseIntent, routeDistanceMeters: 1}, renter.headers)).status === 400,
    'Client route distance is rejected');
  const unconfigured = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...baseIntent,
    listingId: unconfiguredListing.id}, renter.headers), 200, 'Unconfigured vehicle estimate is explicit');
  check(unconfigured.status === 'PRICING_NOT_CONFIGURED' && unconfigured.finalEstimatedAmountMinor == null,
    'Missing policy never becomes a zero price');
  const boundary = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...baseIntent,
    startDate: dateAfter(140), endDate: dateAfter(506)}, renter.headers), 200, 'Maximum 366-day interval is accepted');
  check(boundary.rentalDays === 366, 'Date boundary preserves exclusive-day semantics');
  check((await call(`${api}/v2/rentals/estimate`, 'POST', {...baseIntent,
    startDate: dateAfter(140), endDate: dateAfter(507)}, renter.headers)).status === 400, 'Over-limit rental interval is rejected');

  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', routeDependentPolicy, owner.headers), 200,
    'Owner enables distance pricing');
  const unavailable = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', baseIntent, renter.headers), 200,
    'Route-dependent preview fails closed without provider activation');
  check(unavailable.status === 'ROUTE_UNAVAILABLE' && unavailable.finalEstimatedAmountMinor == null,
    'Provider absence never falls back to straight-line pricing');
  const authoritative = expectStatus(await call(`${root}/rest/v1/rpc/garilink_calculate_rental_estimate`, 'POST', {
    p_actor_id: renter.id, p_listing_id: configuredListing.id,
    p_start_date: baseIntent.startDate.slice(0, 10), p_end_date: baseIntent.endDate.slice(0, 10),
    p_route_result: {status: 'ROUTE_AVAILABLE', provider: 'CONTROLLED_TEST', routeCalculationVersion: 1,
      routeDistanceMeters: 12500, durationSeconds: 1200}}, admin), 200,
  'Trusted boundary accepts a controlled authoritative RouteResult');
  check(authoritative.finalEstimatedAmountMinor === 283750 && authoritative.routeDistanceMeters === 12500,
    'Distance charge uses exact authoritative meters and integer rounding');

  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', routeIndependentPolicy, owner.headers), 200,
    'Route-independent policy restored for atomic snapshot test');
  const requestId = randomUUID();
  const rentalPayload = {listingId: configuredListing.id, requestId, startDate: baseIntent.startDate,
    endDate: baseIntent.endDate, pickupNotes: 'Sprint 2.3 controlled estimate certification',
    transportNeed: {schemaVersion: 1, purpose: 'FAMILY_OR_GROUP', passengerCount: 2,
      driverPreference: 'WITH_DRIVER', longDistance: false, returnTrip: false},
    pickupLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Mikocheni', city: 'Dar es Salaam'},
    destinationLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Kariakoo', city: 'Dar es Salaam'}};
  createdRental = expectStatus(await call(`${api}/rentals`, 'POST', rentalPayload, renter.headers), 201,
    'Rental creation atomically stores route-independent estimate');
  check(createdRental.pricingEstimate?.finalEstimatedAmountMinor === 265000,
    'Created rental snapshot matches preview exactly');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH',
    {...routeIndependentPolicy, durationRateMinorPerDay: 90000}, owner.headers), 200, 'Owner can change future pricing policy');
  const renterRentals = expectStatus(await call(`${api}/rentals`, 'GET', undefined, renter.headers), 200,
    'Renter can read rental snapshot');
  const renterCopy = renterRentals.find((item) => item.id === createdRental.id);
  check(renterCopy?.pricingEstimate?.finalEstimatedAmountMinor === 265000, 'Policy changes do not mutate renter snapshot');
  const ownerRentals = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals`, 'GET', undefined, owner.headers), 200,
    'Owner can read the same rental snapshot');
  const ownerCopy = ownerRentals.find((item) => item.id === createdRental.id);
  check(ownerCopy?.pricingEstimate?.finalEstimatedAmountMinor === 265000, 'Owner and renter see the same immutable snapshot');
  const retry = expectStatus(await call(`${api}/rentals`, 'POST', rentalPayload, renter.headers), 201,
    'Exact request retry is idempotent after policy change');
  check(retry.id === createdRental.id && retry.pricingEstimate?.finalEstimatedAmountMinor === 265000,
    'Idempotent retry returns the original snapshot');
  const changedPreview = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', baseIntent, renter.headers), 200,
    'New preview uses current policy');
  check(changedPreview.finalEstimatedAmountMinor === 295000, 'Future estimate changes without rewriting history');
  expectStatus(await call(`${api}/rentals/${createdRental.id}/cancel`, 'PATCH', {}, renter.headers), 200,
    'Certification rental is cancelled'); createdRental = null;
} finally {
  if (createdRental) await call(`${api}/rentals/${createdRental.id}/cancel`, 'PATCH', {}, renter.headers);
  await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', routeDependentPolicy, owner.headers);
  for (const vehicleId of [configuredVehicle, unconfiguredVehicle]) {
    const paused = await call(`${api}/v2/vehicles/${vehicleId}/publication`, 'POST', {action: 'pause'}, owner.headers);
    assert.ok([200, 409].includes(paused.status), `Cleanup pause failed for ${vehicleId}: HTTP ${paused.status}`);
  }
  console.log('PASS Cleanup: certification rental cancelled, fixtures paused, Phase 2 pricing policy restored.');
}
console.log(`Sprint 2.3 hosted estimate checks: ${passed} passed, 0 failed. Credentials were not printed.`);
