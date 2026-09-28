import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const configuredVehicle = '9bff59fc-5f24-473d-8338-131ecfc2d045';
const unconfiguredVehicle = '4232f9ca-d05d-4e2b-a975-c3c4b71b2728';
const independent = {policyVersion: 1, currency: 'TZS', baseChargeMinor: 25000,
  minimumChargeMinor: 50000, durationRateMinorPerDay: 80000};
const dependent = {...independent, distanceRateMinorPerKilometer: 1500};
const keys = JSON.parse(execFileSync('supabase',
  ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'],
  {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}));
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(service, 'Authorized project service credential available');
const admin = {apikey: service, Authorization: `Bearer ${service}`};

async function call(url, method = 'GET', body, headers = {}) {
  const response = await fetch(url, {method, headers: {'Content-Type': 'application/json', ...headers},
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000)});
  const text = await response.text(); let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = {message: text}; }
  return {status: response.status, json};
}
let passed = 0;
function check(value, label) { assert.ok(value, label); console.log(`PASS ${label}`); passed += 1; }
function expectStatus(result, status, label) {
  assert.equal(result.status, status, `${label}: HTTP ${result.status} ${JSON.stringify(result.json)}`);
  check(true, label); return result.json;
}
function safeFailure(result, statuses, label) {
  check(statuses.includes(result.status) && !/SQLSTATE|Postgrest|stack|google|api.?key|constraint/i.test(JSON.stringify(result.json)), label);
}
function iso(days) { return new Date(Date.now() + days * 86400000).toISOString(); }
const users = expectStatus(await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin), 200,
  'Controlled accounts can be resolved through authorized admin tooling').users;
async function login(email, role) {
  const user = users.find((item) => item.email === email); assert.ok(user, `Controlled ${role} exists`);
  const password = `${randomBytes(24).toString('base64url')}#9aA`;
  expectStatus(await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin), 200,
    `${role} credential rotated without disclosure`);
  const session = expectStatus(await call(`${api}/auth/login`, 'POST', {identifier: email, password}), 200,
    `${role} authenticates normally`);
  return {Authorization: `Bearer ${session.accessToken}`};
}
const owner = await login('seller-evaluation@garilink.test', 'Owner');
const renter = await login('buyer-evaluation@garilink.test', 'Renter');
const workspace = expectStatus(await call(`${api}/workspaces`, 'GET', undefined, owner), 200, 'Owner workspace loads')[0];
const inventory = expectStatus(await call(`${api}/vehicles/workspace/${workspace.id}`, 'GET', undefined, owner), 200,
  'Controlled owner inventory loads').data;
const configured = inventory.find((item) => item.id === configuredVehicle);
const unconfigured = inventory.find((item) => item.id === unconfiguredVehicle);
assert.ok(configured && unconfigured, 'Controlled Phase 2 vehicles exist');
const rentals = [];

async function configure(vehicle, availability = 'AVAILABLE') {
  expectStatus(await call(`${api}/v2/vehicles/${vehicle.id}`, 'PATCH', {vehicleCategory: vehicle.vehicleCategory ?? 'SUV',
    capabilities: vehicle.capabilities, operationalAvailability: availability}, owner), 200,
  `${vehicle.id === configuredVehicle ? 'Configured' : 'Unconfigured'} vehicle availability ${availability}`);
}
async function publish(vehicle) {
  expectStatus(await call(`${api}/v2/vehicles/${vehicle.id}/publication`, 'POST', {action: 'publish'}, owner), 200,
    `${vehicle.id === configuredVehicle ? 'Configured' : 'Unconfigured'} vehicle published`);
}
function payload(listingId, offset, note) {
  return {listingId, requestId: randomUUID(), startDate: iso(offset), endDate: iso(offset + 3), pickupNotes: note,
    transportNeed: {schemaVersion: 1, purpose: 'FAMILY_OR_GROUP', passengerCount: 2,
      driverPreference: 'WITH_DRIVER', longDistance: false, returnTrip: false},
    pickupLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Mikocheni', city: 'Dar es Salaam'},
    destinationLocation: {schemaVersion: 1, source: 'MANUAL', locality: 'Kariakoo', city: 'Dar es Salaam'}};
}
async function create(body, label) {
  const rental = expectStatus(await call(`${api}/rentals`, 'POST', body, renter), 201, label); rentals.push(rental); return rental;
}

try {
  await configure(configured); await configure(unconfigured); await publish(configured); await publish(unconfigured);
  const discovery = expectStatus(await call(`${api}/v2/vehicles/discoverable`), 200, 'Public rental discovery loads');
  const configuredListing = discovery.find((x) => x.vehicleId === configuredVehicle || x.vehicle?.id === configuredVehicle);
  const unconfiguredListing = discovery.find((x) => x.vehicleId === unconfiguredVehicle || x.vehicle?.id === unconfiguredVehicle);
  assert.ok(configuredListing && unconfiguredListing, 'Controlled listings are discoverable');
  check(discovery.every((x) => x.type === 'FOR_HIRE'), 'FOR_SALE is excluded from V2 rental discovery');
  check(!/pricingEstimate|pickupLocation|destinationLocation|transportNeed|latitude|longitude|phone|service_role/i.test(JSON.stringify(discovery)),
    'Public discovery contains no private rental, route, owner or credential data');

  await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', independent, owner);
  const intent = {listingId: configuredListing.id, startDate: iso(180), endDate: iso(183),
    pickupLocation: {latitude: -6.7924, longitude: 39.2083}, destinationLocation: {latitude: -6.8161, longitude: 39.2804}};
  const preview = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', intent, renter), 200,
    'Scenario 1 route-independent preview succeeds without routing');
  check(preview.status === 'ESTIMATED' && preview.finalEstimatedAmountMinor === 265000,
    'Scenario 1 exact estimate is TZS 265,000');
  const estimatedRental = await create(payload(configuredListing.id, 180, 'Phase 2 route-independent'),
    'Scenario 1 route-independent rental succeeds');
  check(estimatedRental.pricingEstimate?.finalEstimatedAmountMinor === 265000, 'Scenario 1 authoritative snapshot stored');
  const myEstimated = (await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((x) => x.id === estimatedRental.id);
  const ownerEstimated = (await call(`${api}/owner/workspaces/${workspace.id}/rentals`, 'GET', undefined, owner)).json.find((x) => x.id === estimatedRental.id);
  check(myEstimated?.pricingEstimate?.finalEstimatedAmountMinor === 265000 &&
    ownerEstimated?.pricingEstimate?.finalEstimatedAmountMinor === 265000, 'Scenario 1 renter and owner see identical snapshot');

  const noPriceIntent = {...intent, listingId: unconfiguredListing.id, startDate: iso(190), endDate: iso(193)};
  const noPrice = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', noPriceIntent, renter), 200,
    'Scenario 2 unconfigured estimate returns product state');
  check(noPrice.status === 'PRICING_NOT_CONFIGURED' && noPrice.finalEstimatedAmountMinor == null,
    'Scenario 2 no fake or zero estimate');
  const noPricePayload = payload(unconfiguredListing.id, 190, 'Phase 2 unconfigured pricing');
  const noPriceRental = await create(noPricePayload, 'Scenario 2 rental remains requestable without pricing');
  check(noPriceRental.pricingEstimate == null, 'Scenario 2 null snapshot recorded intentionally');

  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', dependent, owner), 200,
    'Distance pricing enabled for degraded-mode scenario');
  const routeUnavailable = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...intent,
    startDate: iso(200), endDate: iso(203)}, renter), 200, 'Scenario 3 route-provider outage is contained');
  check(routeUnavailable.status === 'ROUTE_UNAVAILABLE' && routeUnavailable.finalEstimatedAmountMinor == null,
    'Scenario 3 provider outage creates no fake amount');
  const degradedPayload = payload(configuredListing.id, 200, 'Phase 2 provider unavailable');
  const degradedRental = await create(degradedPayload, 'Scenario 3 rental infrastructure remains operational');
  check(degradedRental.pricingEstimate == null, 'Scenario 3 degraded request stores null snapshot');
  const degradedRetry = expectStatus(await call(`${api}/rentals`, 'POST', degradedPayload, renter), 201,
    'Scenario 7 no-estimate exact retry succeeds');
  check(degradedRetry.id === degradedRental.id && degradedRetry.pricingEstimate == null,
    'Scenario 7 retry returns same rental and same null snapshot');

  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', independent, owner), 200,
    'Route-independent policy restored for policy-change scenarios');
  const oldPreview = expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...intent,
    startDate: iso(210), endDate: iso(213)}, renter), 200, 'Scenario 4 initial preview succeeds');
  check(oldPreview.finalEstimatedAmountMinor === 265000, 'Scenario 4 initial preview value captured');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH',
    {...independent, durationRateMinorPerDay: 90000}, owner), 200, 'Scenario 4 owner changes policy');
  const changedPayload = payload(configuredListing.id, 210, 'Phase 2 stale preview protection');
  const changedRental = await create(changedPayload, 'Scenario 4 request recalculates current policy');
  check(changedRental.pricingEstimate?.finalEstimatedAmountMinor === 295000,
    'Scenario 4 stale preview is not persisted');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', independent, owner), 200,
    'Scenario 5 policy changes after rental');
  const historicalRenter = (await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((x) => x.id === changedRental.id);
  const historicalOwner = (await call(`${api}/owner/workspaces/${workspace.id}/rentals`, 'GET', undefined, owner)).json.find((x) => x.id === changedRental.id);
  check(historicalRenter?.pricingEstimate?.finalEstimatedAmountMinor === 295000 &&
    historicalOwner?.pricingEstimate?.finalEstimatedAmountMinor === 295000, 'Scenario 5 historical snapshot remains immutable for both roles');
  const changedRetry = expectStatus(await call(`${api}/rentals`, 'POST', changedPayload, renter), 201,
    'Scenario 6 response-loss style exact retry succeeds');
  check(changedRetry.id === changedRental.id && changedRetry.pricingEstimate?.finalEstimatedAmountMinor === 295000,
    'Scenario 6 same rental and snapshot returned after policy change');

  for (const state of ['BUSY', 'UNAVAILABLE', 'MAINTENANCE']) {
    await configure(configured, 'AVAILABLE');
    expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...intent, startDate: iso(220), endDate: iso(223)}, renter), 200,
      `Preview obtained before ${state}`);
    await configure(configured, state);
    safeFailure(await call(`${api}/rentals`, 'POST', payload(configuredListing.id, 220, `Phase 2 ${state}`), renter), [409],
      `Current ${state} authority rejects stale-estimate submission`);
  }
  await configure(configured, 'AVAILABLE');
  expectStatus(await call(`${api}/v2/rentals/estimate`, 'POST', {...intent, startDate: iso(230), endDate: iso(233)}, renter), 200,
    'Preview obtained before publication pause');
  expectStatus(await call(`${api}/v2/vehicles/${configuredVehicle}/publication`, 'POST', {action: 'pause'}, owner), 200,
    'Scenario 10 publication paused');
  safeFailure(await call(`${api}/rentals`, 'POST', payload(configuredListing.id, 230, 'Phase 2 paused'), renter), [404, 409],
    'Scenario 10 paused listing rejects stale-estimate submission');
  await publish(configured);

  const saleSearch = expectStatus(await call(`${api}/listings?type=FOR_SALE&limit=10`), 200, 'Legacy sale search loads');
  const sale = saleSearch.data?.[0];
  if (sale?.id) {
    safeFailure(await call(`${api}/v2/rentals/estimate`, 'POST', {...intent, listingId: sale.id}, renter), [404],
      'Scenario 11 FOR_SALE estimate is rejected');
    safeFailure(await call(`${api}/rentals`, 'POST', payload(sale.id, 240, 'Phase 2 sale rejection'), renter), [404],
      'Scenario 11 FOR_SALE rental is rejected');
  } else console.log('NOT APPLICABLE Scenario 11: no published controlled FOR_SALE fixture exists. Rental-only discovery exclusion remains proven.');
  check((await call(`${api}/v2/rentals/estimate`, 'POST', intent)).status === 401,
    'Scenario 12 anonymous estimate is denied');
  safeFailure(await call(`${api}/v2/rentals/estimate`, 'POST', intent, owner), [403, 404],
    'Scenario 12 owner cannot estimate own vehicle');
  const routeNullHistory = (await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((x) => x.id === degradedRental.id);
  check(routeNullHistory && routeNullHistory.pricingEstimate == null, 'Scenario 13 null snapshot serializes safely in Trips');
  check(!/pricingEstimate|pickupLocation|destinationLocation|transportNeed|latitude|longitude/i.test(
    JSON.stringify((await call(`${api}/v2/vehicles/discoverable`)).json)), 'Scenario 14 public discovery still hides private snapshots and locations');
  const match = expectStatus(await call(`${api}/v2/vehicles/match`, 'POST', {searchLocation: {
    latitude: -6.7924, longitude: 39.2083},
    transportNeed: {schemaVersion: 1, purpose: 'FAMILY_OR_GROUP', passengerCount: 2,
      driverPreference: 'WITH_DRIVER', longDistance: false, returnTrip: false}, radiusMeters: 50000, limit: 20}), 200,
  'Scenario 15 Phase 1 matched discovery remains healthy');
  check(Array.isArray(match.data), 'Scenario 15 matching response remains canonical');
} finally {
  for (const rental of rentals) {
    if (!['CANCELLED', 'REJECTED', 'COMPLETED'].includes(rental.status)) await call(`${api}/rentals/${rental.id}/cancel`, 'PATCH', {}, renter);
  }
  await call(`${api}/v2/vehicles/${configuredVehicle}/pricing`, 'PATCH', dependent, owner);
  for (const vehicle of [configured, unconfigured]) {
    await configure(vehicle, 'AVAILABLE');
    const paused = await call(`${api}/v2/vehicles/${vehicle.id}/publication`, 'POST', {action: 'pause'}, owner);
    assert.ok([200, 409].includes(paused.status), `Cleanup pause failed: ${vehicle.id}`);
  }
  console.log('PASS Cleanup: certification rentals cancelled, vehicles available but paused, Phase 2 policy restored.');
}
console.log(`Sprint 2.4 hosted Phase 2 checks: ${passed} passed, 0 failed. Credentials were not printed.`);
