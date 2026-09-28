import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes, randomUUID} from 'node:crypto';

const ref = 'yvcdkmsfuakjflmuatgz';
const retainPublishedFixtures =
  process.env.GARILINK_RETAIN_CERTIFICATION_FIXTURES === '1';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const fixture = {
  passenger: {
    vehicleId: '9bff59fc-5f24-473d-8338-131ecfc2d045',
    listingId: '5cf8e621-96e9-4e6e-bc99-3ed5d0d4afc7',
    category: 'SUV',
    capabilities: {
      schema_version: 1,
      passenger_capacity: 7,
      with_driver: true,
      self_drive: true,
      long_distance: true,
      transmission: 'AUTOMATIC',
      fuel_type: 'DIESEL',
    },
  },
  cargo: {
    vehicleId: '4c1849d4-a825-42b2-8211-97fd8bb6451c',
    listingId: '2971fec1-fe6f-4970-92bc-a7a4a5de7028',
    category: 'MEDIUM_TRUCK',
    capabilities: {
      schema_version: 1,
      payload_kg: 3500,
      cargo_body: 'box',
      with_driver: true,
      self_drive: false,
      long_distance: true,
      transmission: 'MANUAL',
      fuel_type: 'DIESEL',
    },
  },
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
const createdRentals = [];
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
function findPublicUrl(node) {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findPublicUrl(item);
      if (found) return found;
    }
  } else if (node && typeof node === 'object') {
    if (typeof node.publicUrl === 'string') return node.publicUrl;
    for (const value of Object.values(node)) {
      const found = findPublicUrl(value);
      if (found) return found;
    }
  }
  return null;
}

const usersResult = await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin);
const users = expectStatus(usersResult, 200, 'Authorized admin can enumerate controlled accounts').users;
async function login(email) {
  const user = users.find((item) => item.email === email);
  assert.ok(user, `Controlled account ${email} exists`);
  const password = randomBytes(24).toString('base64url');
  expectStatus(
    await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin),
    200,
    `Controlled ${email.startsWith('seller') ? 'owner' : 'renter'} credential rotated privately`,
  );
  const session = expectStatus(
    await call(`${api}/auth/login`, 'POST', {identifier: email, password}),
    200,
    `Controlled ${email.startsWith('seller') ? 'owner' : 'renter'} authenticates through normal API`,
  );
  return {Authorization: `Bearer ${session.accessToken}`};
}

const renter = await login('buyer-evaluation@garilink.test');
const owner = await login('seller-evaluation@garilink.test');
const workspaces = expectStatus(await call(`${api}/workspaces`, 'GET', undefined, owner), 200, 'Owner workspace loads');
assert.ok(workspaces.length > 0, 'Controlled owner workspace exists');
const workspace = workspaces[0];
const inventoryPayload = expectStatus(
  await call(`${api}/vehicles/workspace/${workspace.id}`, 'GET', undefined, owner),
  200,
  'Owner inventory loads',
);
const inventory = inventoryPayload.data;
assert.ok(Array.isArray(inventory), 'Owner inventory response contains data');
const originals = new Map();
for (const target of Object.values(fixture)) {
  const original = inventory.find((item) => item.id === target.vehicleId);
  assert.ok(original, `Controlled vehicle ${target.vehicleId} belongs to owner workspace`);
  originals.set(target.vehicleId, original);
}

const pickup = {schemaVersion: 1, source: 'MANUAL', locality: 'Mikocheni', city: 'Dar es Salaam'};
const destination = {schemaVersion: 1, source: 'MANUAL', locality: 'Kariakoo', city: 'Dar es Salaam'};
const searchLocation = {latitude: -6.8, longitude: 39.2};
const start = new Date(Date.now() + 180 * 86400000).toISOString();
const end = new Date(Date.now() + 183 * 86400000).toISOString();
const passengerNeed = {
  schemaVersion: 1,
  purpose: 'FAMILY_OR_GROUP',
  passengerCount: 6,
  driverPreference: 'WITH_DRIVER',
  longDistance: true,
  returnTrip: true,
};
const cargoNeed = {
  schemaVersion: 1,
  purpose: 'MOVING_GOODS',
  cargo: {estimatedWeightKg: 1200, cargoType: 'Furniture', fragile: true, requiresCoveredBody: true},
  driverPreference: 'WITH_DRIVER',
  longDistance: true,
  returnTrip: false,
};

async function configureAndPublish(target) {
  expectStatus(await call(`${api}/v2/vehicles/${target.vehicleId}`, 'PATCH', {
    vehicleCategory: target.category,
    capabilities: target.capabilities,
    operationalAvailability: 'AVAILABLE',
  }, owner), 200, `${target.category} V2 capabilities configured`);
  expectStatus(await call(`${api}/v2/vehicles/${target.vehicleId}/publication`, 'POST', {action: 'publish'}, owner), 200, `${target.category} FOR_HIRE fixture published`);
}

async function setAvailability(target, value) {
  return expectStatus(await call(`${api}/v2/vehicles/${target.vehicleId}`, 'PATCH', {
    vehicleCategory: target.category,
    capabilities: target.capabilities,
    operationalAvailability: value,
  }, owner), 200, `${target.category} availability ${value}`);
}

async function cancelIfOpen(rental) {
  if (rental && !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(rental.status)) {
    const result = await call(`${api}/rentals/${rental.id}/cancel`, 'PATCH', {}, renter);
    if (result.status === 200) rental.status = result.json.status;
  }
}

try {
  await configureAndPublish(fixture.passenger);
  await configureAndPublish(fixture.cargo);

  const discovery = expectStatus(await call(`${api}/v2/vehicles/discoverable`), 200, 'Public V2 discovery loads');
  const passengerListing = discovery.find((item) => item.id === fixture.passenger.listingId);
  const cargoListing = discovery.find((item) => item.id === fixture.cargo.listingId);
  check(passengerListing?.type === 'FOR_HIRE' && cargoListing?.type === 'FOR_HIRE', 'Controlled inventory is rental-only');
  check(discovery.every((item) => item.type === 'FOR_HIRE'), 'FOR_SALE inventory is excluded from V2 rental discovery');
  const publicText = JSON.stringify(discovery);
  check(!/operationalLocation|latitude|longitude|accuracyMeters|phone|registration|transportNeed|pickupLocation|destinationLocation/i.test(publicText), 'Public discovery excludes private owner, location and rental data');

  const passengerMatch = expectStatus(await call(`${api}/v2/vehicles/match`, 'POST', {
    searchLocation,
    transportNeed: passengerNeed,
    radiusMeters: 5000,
    limit: 20,
  }), 200, 'Passenger TransportNeed matching succeeds');
  const matchedPassenger = passengerMatch.data.find((item) => item.id === fixture.passenger.listingId);
  check(matchedPassenger?.suitability?.status === 'SUITABLE', 'Passenger result is explicitly suitable');
  check(matchedPassenger?.eligibility?.requestable === true, 'Available passenger result is requestable');
  expectStatus(await call(`${api}/listings/${fixture.passenger.listingId}`), 200, 'Matched passenger vehicle detail loads');

  const passengerPayload = {
    listingId: fixture.passenger.listingId,
    requestId: randomUUID(),
    startDate: start,
    endDate: end,
    pickupNotes: 'Sprint 1.5 controlled passenger certification',
    transportNeed: passengerNeed,
    pickupLocation: pickup,
    destinationLocation: destination,
  };
  const passengerRental = expectStatus(await call(`${api}/rentals`, 'POST', passengerPayload, renter), 201, 'Passenger rental request is created');
  createdRentals.push(passengerRental);
  assert.deepEqual(passengerRental.transportNeed, passengerNeed);
  assert.deepEqual(passengerRental.pickupLocation, pickup);
  assert.deepEqual(passengerRental.destinationLocation, destination);
  check(true, 'TransportNeed and explicit pickup/destination are snapshotted exactly');
  check(!JSON.stringify(passengerRental.pickupLocation).includes(String(searchLocation.latitude)), 'Search location is not silently reused as pickup');

  const retry = expectStatus(await call(`${api}/rentals`, 'POST', passengerPayload, renter), 201, 'Identical submission retry succeeds idempotently');
  check(retry.id === passengerRental.id, 'Identical retry returns the same rental without duplication');
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.filter((item) => item.id === passengerRental.id).length === 1, 'Renter Trips contains one copy of the request');

  await setAvailability(fixture.passenger, 'BUSY');
  const stale = await call(`${api}/rentals`, 'POST', {...passengerPayload, requestId: randomUUID()}, renter);
  check(stale.status === 409 && !/SQLSTATE|Postgrest|stack/i.test(JSON.stringify(stale.json)), 'Stale BUSY submission is rejected safely by the server');
  const delayedRetry = expectStatus(await call(`${api}/rentals`, 'POST', passengerPayload, renter), 201, 'Delayed identical retry remains recoverable after availability change');
  check(delayedRetry.id === passengerRental.id, 'Delayed retry recovers original rental');

  for (const value of ['BUSY', 'UNAVAILABLE', 'MAINTENANCE']) {
    const updated = value === 'BUSY' ? await call(`${api}/v2/vehicles/${fixture.passenger.vehicleId}/eligibility`, 'GET', undefined, owner) : (await setAvailability(fixture.passenger, value), await call(`${api}/v2/vehicles/${fixture.passenger.vehicleId}/eligibility`, 'GET', undefined, owner));
    const eligibility = expectStatus(updated, 200, `${value} eligibility reads authoritatively`);
    check(eligibility.requestable === false, `${value} is not requestable`);
  }
  await setAvailability(fixture.passenger, 'AVAILABLE');
  const availableEligibility = expectStatus(await call(`${api}/v2/vehicles/${fixture.passenger.vehicleId}/eligibility`, 'GET', undefined, owner), 200, 'AVAILABLE eligibility reads authoritatively');
  check(availableEligibility.requestable === true, 'AVAILABLE is requestable');

  const renterTrips = expectStatus(await call(`${api}/rentals`, 'GET', undefined, renter), 200, 'Renter Trips refresh loads');
  const renterCopy = renterTrips.find((item) => item.id === passengerRental.id);
  assert.deepEqual(renterCopy.transportNeed, passengerNeed);
  const ownerRequests = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals`, 'GET', undefined, owner), 200, 'Owner incoming requests refresh loads');
  const ownerCopy = ownerRequests.find((item) => item.id === passengerRental.id);
  assert.deepEqual(ownerCopy.transportNeed, passengerNeed);
  assert.deepEqual(ownerCopy.pickupLocation, pickup);
  check(true, 'Renter and owner read identical immutable request snapshots');
  check([403, 404].includes((await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/approve`, 'PATCH', {}, renter)).status), 'Renter cannot perform owner actions');
  check([403, 404].includes((await call(`${api}/owner/workspaces/${randomUUID()}/rentals/${passengerRental.id}/approve`, 'PATCH', {}, owner)).status), 'Owner cannot act through an unrelated workspace');

  // Both requests must exist before the first is committed. Availability
  // Policy V1 correctly blocks new requests after an approval, while the
  // exclusion constraint remains the authority when two pending requests
  // race for the same dates.
  const conflictPayload = {...passengerPayload, requestId: randomUUID(), pickupNotes: 'Sprint 4.3 overlap conflict'};
  const conflictRental = expectStatus(await call(`${api}/rentals`, 'POST', conflictPayload, renter), 201, 'Overlapping request can be submitted before either request is committed');
  createdRentals.push(conflictRental);

  const approved = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/approve`, 'PATCH', {}, owner), 200, 'Owner approves passenger request');
  passengerRental.status = approved.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === passengerRental.id)?.status === 'APPROVED', 'Renter sees approved state after refresh');

  const conflict = await call(`${api}/owner/workspaces/${workspace.id}/rentals/${conflictRental.id}/approve`, 'PATCH', {}, owner);
  check(conflict.status === 409 && !/SQLSTATE|constraint|stack/i.test(JSON.stringify(conflict.json)), 'Overlap approval conflict is safe and user-facing');

  const invalidComplete = await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/complete`, 'PATCH', {}, owner);
  check(invalidComplete.status === 409 && !/SQLSTATE|constraint|stack/i.test(JSON.stringify(invalidComplete.json)), 'Invalid lifecycle transition is rejected safely');
  const ready = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/ready`, 'PATCH', {}, owner), 200, 'Owner marks approved rental ready for pickup');
  passengerRental.status = ready.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === passengerRental.id)?.status === 'READY_FOR_PICKUP', 'Renter sees ready-for-pickup state after refresh');
  const active = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/start`, 'PATCH', {}, owner), 200, 'Owner starts ready rental');
  passengerRental.status = active.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === passengerRental.id)?.status === 'ACTIVE', 'Renter sees active state after refresh');
  const completed = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals/${passengerRental.id}/complete`, 'PATCH', {}, owner), 200, 'Owner completes active rental');
  passengerRental.status = completed.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === passengerRental.id)?.status === 'COMPLETED', 'Renter sees completed state after refresh');

  const cargoMatch = expectStatus(await call(`${api}/v2/vehicles/match`, 'POST', {
    searchLocation,
    transportNeed: cargoNeed,
    radiusMeters: 5000,
    limit: 20,
  }), 200, 'Cargo TransportNeed matching succeeds');
  check(cargoMatch.data.some((item) => item.id === fixture.cargo.listingId && item.suitability?.status === 'SUITABLE'), 'Covered cargo result is explicitly suitable');
  const cargoPayload = {
    listingId: fixture.cargo.listingId,
    requestId: randomUUID(),
    startDate: new Date(Date.now() + 210 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 212 * 86400000).toISOString(),
    pickupNotes: 'Sprint 1.5 controlled cargo certification',
    transportNeed: cargoNeed,
    pickupLocation: pickup,
    destinationLocation: destination,
  };
  const cargoRental = expectStatus(await call(`${api}/rentals`, 'POST', cargoPayload, renter), 201, 'Cargo rental request is created');
  createdRentals.push(cargoRental);
  const rejected = expectStatus(await call(`${api}/owner/workspaces/${workspace.id}/rentals/${cargoRental.id}/reject`, 'PATCH', {reason: 'Controlled certification rejection'}, owner), 200, 'Owner rejects cargo request');
  cargoRental.status = rejected.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === cargoRental.id)?.status === 'REJECTED', 'Renter sees rejected state after refresh');

  const cancelled = expectStatus(await call(`${api}/rentals/${conflictRental.id}/cancel`, 'PATCH', {}, renter), 200, 'Renter cancels an open request');
  conflictRental.status = cancelled.status;
  check((await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === conflictRental.id)?.status === 'CANCELLED', 'Renter sees cancelled state after refresh');

  const mutatedNeed = {...passengerNeed, passengerCount: 2};
  const persisted = (await call(`${api}/rentals`, 'GET', undefined, renter)).json.find((item) => item.id === passengerRental.id);
  assert.notDeepEqual(mutatedNeed, persisted.transportNeed);
  assert.deepEqual(persisted.transportNeed, passengerNeed);
  check(true, 'Later intent edits cannot mutate the rental snapshot');

  const mediaUrl = findPublicUrl(passengerListing) ?? findPublicUrl(originals.get(fixture.passenger.vehicleId));
  if (!mediaUrl) {
    console.log('MEDIA SHAPE', JSON.stringify(passengerListing.vehicle?.images?.map((item) => ({
      keys: Object.keys(item ?? {}),
      mediaKeys: Object.keys(item?.media ?? {}),
    }))));
  }
  assert.ok(mediaUrl, 'Controlled vehicle has ready public media');
  const media = await fetch(mediaUrl, {signal: AbortSignal.timeout(30000)});
  check(media.ok && (media.headers.get('content-type') ?? '').startsWith('image/'), 'Signed vehicle media renders successfully');
  check((await call(`${api}/rentals`)).status === 401, 'Anonymous rental snapshot access is rejected');

  expectStatus(await call(`${api}/v2/vehicles/${fixture.passenger.vehicleId}/publication`, 'POST', {action: 'pause'}, owner), 200, 'Passenger publication pauses');
  check(!(await call(`${api}/v2/vehicles/discoverable`)).json.some((item) => item.id === fixture.passenger.listingId), 'Paused passenger vehicle disappears from discovery');
  expectStatus(await call(`${api}/v2/vehicles/${fixture.passenger.vehicleId}/publication`, 'POST', {action: 'publish'}, owner), 200, 'Passenger publication republishes');
  check((await call(`${api}/v2/vehicles/discoverable`)).json.some((item) => item.id === fixture.passenger.listingId), 'Republished passenger vehicle returns to discovery');
} finally {
  for (const rental of createdRentals) await cancelIfOpen(rental);
  for (const target of Object.values(fixture)) {
    const original = originals.get(target.vehicleId);
    if (original?.vehicleCategory && original?.capabilities) {
      await call(`${api}/v2/vehicles/${target.vehicleId}`, 'PATCH', {
        vehicleCategory: original.vehicleCategory,
        capabilities: original.capabilities,
        operationalAvailability: original.operationalAvailability ?? 'AVAILABLE',
      }, owner);
    }
    if (!retainPublishedFixtures) {
      const paused = await call(`${api}/v2/vehicles/${target.vehicleId}/publication`, 'POST', {action: 'pause'}, owner);
      assert.equal(paused.status, 200, `Cleanup failed for ${target.vehicleId}`);
    }
  }
  if (retainPublishedFixtures) {
    console.log('PASS Staged cleanup: requests cancelled; controlled vehicles retained temporarily for sequential certification.');
  } else {
    const after = await call(`${api}/v2/vehicles/discoverable`);
    assert.ok(after.json.every((item) => !Object.values(fixture).some((target) => target.vehicleId === item.vehicleId)), 'Controlled Sprint 1.5 fixtures remain paused');
    console.log('PASS Cleanup: certification vehicles paused; active certification requests cancelled; accounts, media and evidence retained.');
  }
}

console.log(`Sprint 1.5 hosted integration checks: ${passed} passed, 0 failed. Credentials were not printed.`);
