import { readFile } from 'node:fs/promises';

const needed = (name) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};
const root = needed('SUPABASE_URL').replace(/\/$/, '');
const api = `${root}/functions/v1/garilink-api`;
const sellerEmail = needed('EVALUATION_SELLER_EMAIL');
const sellerPassword = needed('EVALUATION_SELLER_PASSWORD');
const buyerEmail = needed('EVALUATION_BUYER_EMAIL');
const buyerPassword = needed('EVALUATION_BUYER_PASSWORD');
const request = async (url, options = {}, name = 'request') => {
  const response = await fetch(url, options);
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = null; }
  if (!response.ok) throw Object.assign(new Error(`${name} failed (HTTP ${response.status}, database code ${body?.code ?? 'unavailable'}). ${body?.message ?? ''}`.trim()), { status: response.status, body });
  return body;
};
const login = async (email, password, role) => request(`${api}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ identifier: email, password }),
}, `${role} password login`);
const authHeaders = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const dimensions = (bytes) => {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('Certification asset must be JPEG.');
  for (let i = 2; i < bytes.length - 9;) {
    if (bytes[i] !== 0xff) { i++; continue; }
    const marker = bytes[i + 1], length = bytes.readUInt16BE(i + 2);
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))
      return { height: bytes.readUInt16BE(i + 5), width: bytes.readUInt16BE(i + 7) };
    i += 2 + length;
  }
  throw new Error('Certification asset dimensions could not be read.');
};

const seller = await login(sellerEmail, sellerPassword, 'Seller');
const buyer = await login(buyerEmail, buyerPassword, 'Buyer');
assert(seller.accessToken && buyer.accessToken, 'Normal authenticated sessions were not returned.');
const sellerHeaders = authHeaders(seller.accessToken);
const workspaces = await request(`${api}/workspaces`, { headers: sellerHeaders }, 'Owner workspace lookup');
const workspace = workspaces.find((item) => item.name === 'GariLink Evaluation Garage');
assert(workspace?.id, 'Controlled owner workspace is unavailable.');

const capabilities = { schema_version: 1, transmission: 'AUTOMATIC', fuel_type: 'DIESEL', self_drive: true, with_driver: true, passenger_capacity: 7 };
const draft = await request(`${api}/v2/vehicles/drafts`, {
  method: 'POST', headers: sellerHeaders,
  body: JSON.stringify({
    workspaceId: workspace.id, requestId: crypto.randomUUID(),
    title: 'Controlled V2 Toyota Fortuner — Evaluation Only',
    description: 'Controlled internal evaluation rental vehicle. Not customer inventory.',
    county: 'Dar es Salaam', price: 300000,
    vehicle: { make: 'Toyota', model: 'Fortuner', year: 2022, mileage: 24000, type: 'CAR', fuelType: 'DIESEL', transmission: 'AUTOMATIC', condition: 'FOREIGN_USED' },
    vehicleCategory: 'SUV', capabilities, operationalAvailability: 'AVAILABLE',
  }),
}, 'V2 rental draft creation');
const vehicleId = draft.vehicleId ?? draft.vehicle?.id;
assert(vehicleId, 'V2 draft did not return a vehicle ID.');

let gateRejected = false;
try {
  await request(`${api}/v2/vehicles/${vehicleId}/publication`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ action: 'publish' }) }, 'Ready photo gate');
} catch (error) { gateRejected = error.status === 400 && /photo/i.test(error.message); }
assert(gateRejected, 'Publication was not rejected before a ready photo existed.');

let invalidCapabilitiesRejected = false;
try {
  await request(`${api}/v2/vehicles/${vehicleId}`, { method: 'PATCH', headers: sellerHeaders, body: JSON.stringify({ capabilities: { schema_version: 1, payload_kg: -1 } }) }, 'Invalid capabilities');
} catch (error) { invalidCapabilitiesRejected = error.status === 400; }
assert(invalidCapabilitiesRejected, 'Invalid capability payload was accepted.');

const bytes = await readFile(new URL('../evaluation-media/prado-front.jpeg', import.meta.url));
const image = dimensions(bytes);
const reservation = await request(`${api}/media/reserve`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ vehicleId, mimeType: 'image/jpeg' }) }, 'Media reservation');
await request(reservation.uploadUrl, { method: 'POST', headers: { Authorization: `Bearer ${seller.accessToken}`, apikey: reservation.apiKey, 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.length) }, body: bytes }, 'Media upload');
await request(`${api}/media/finalize`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ mediaId: reservation.id, byteSize: bytes.length, width: image.width, height: image.height }) }, 'Media finalization');

try {
  await request(`${api}/v2/vehicles/${vehicleId}/publication`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ action: 'publish' }) }, 'V2 publication');
} catch (error) {
  const anon = process.env.SUPABASE_ANON_KEY;
  if (anon) {
    const response = await fetch(`${root}/rest/v1/rpc/garilink_v2_set_publication`, {
      method: 'POST', headers: { ...sellerHeaders, apikey: anon },
      body: JSON.stringify({ vehicle_id: vehicleId, action: 'publish' }),
    });
    const body = await response.json().catch(() => ({}));
    throw new Error(`V2 publication direct diagnostic: HTTP ${response.status}; code ${body.code ?? 'unavailable'}; ${body.message ?? 'unavailable'}`);
  }
  throw error;
}
const publicDiscovery = await request(`${api}/v2/vehicles/discoverable`, {}, 'Public V2 discovery');
const found = publicDiscovery.find((item) => item.vehicleId === vehicleId || item.vehicle?.id === vehicleId);
assert(found?.type === 'FOR_HIRE', 'Published V2 vehicle was not discoverable as FOR_HIRE.');
assert(!publicDiscovery.some((item) => item.type === 'FOR_SALE'), 'FOR_SALE inventory leaked into V2 discovery.');
assert(!JSON.stringify(found).match(/phone|address|password|service_role/i), 'Private data leaked in public V2 discovery.');

for (const [availability, requestable] of [['AVAILABLE', true], ['BUSY', false], ['UNAVAILABLE', false], ['MAINTENANCE', false]]) {
  await request(`${api}/v2/vehicles/${vehicleId}`, { method: 'PATCH', headers: sellerHeaders, body: JSON.stringify({ operationalAvailability: availability }) }, `${availability} update`);
  const eligibility = await request(`${api}/v2/vehicles/${vehicleId}/eligibility`, { headers: sellerHeaders }, `${availability} eligibility`);
  assert(eligibility.operationalAvailability === availability && eligibility.requestable === requestable, `${availability} requestability is incorrect.`);
}
await request(`${api}/v2/vehicles/${vehicleId}`, { method: 'PATCH', headers: sellerHeaders, body: JSON.stringify({ operationalAvailability: 'AVAILABLE' }) }, 'Availability restore');
await request(`${api}/v2/vehicles/${vehicleId}/publication`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ action: 'pause' }) }, 'V2 pause');
const paused = await request(`${api}/v2/vehicles/discoverable`, {}, 'Discovery after pause');
assert(!paused.some((item) => item.vehicleId === vehicleId || item.vehicle?.id === vehicleId), 'Paused vehicle remained public.');
await request(`${api}/v2/vehicles/${vehicleId}/publication`, { method: 'POST', headers: sellerHeaders, body: JSON.stringify({ action: 'publish' }) }, 'V2 republish');
const republished = await request(`${api}/v2/vehicles/discoverable`, {}, 'Discovery after republish');
assert(republished.some((item) => item.vehicleId === vehicleId || item.vehicle?.id === vehicleId), 'Republished vehicle did not return to discovery.');

let buyerBlocked = false;
try { await request(`${api}/v2/vehicles/${vehicleId}`, { method: 'PATCH', headers: authHeaders(buyer.accessToken), body: JSON.stringify({ operationalAvailability: 'BUSY' }) }, 'Cross-workspace mutation'); }
catch (error) { buyerBlocked = error.status === 403 || error.status === 404; }
assert(buyerBlocked, 'Cross-workspace mutation was not blocked.');

console.log(JSON.stringify({
  ownerLogin: true, buyerLogin: true, workspace: true, draft: true,
  invalidCapabilitiesRejected, readyPhotoGate: true, media: true, publication: true,
  discovery: true, saleExcluded: true, availability: true, pauseRepublish: true,
  workspaceIsolation: true, publicPrivacy: true,
}));
