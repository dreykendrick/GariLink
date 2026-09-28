import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {writeFile} from 'node:fs/promises';
import {homedir} from 'node:os';
import {join} from 'node:path';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const keys = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}));
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

function expect(result, status, label) {
  assert.equal(result.status, status, `${label}: HTTP ${result.status} ${JSON.stringify(result.json)}`);
  console.log(`PASS ${label}`);
  return result.json;
}

const users = expect(await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin), 200, 'Controlled accounts enumerate').users;
async function prepareLogin(email, label) {
  const user = users.find((item) => item.email === email);
  assert.ok(user, `${label} controlled account exists`);
  const password = `${randomBytes(24).toString('base64url')}#9aA`;
  expect(await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin), 200, `${label} credential rotates privately`);
  const session = expect(await call(`${api}/auth/login`, 'POST', {identifier: email, password}), 200, `${label} authenticates normally`);
  return {email, password, headers: {Authorization: `Bearer ${session.accessToken}`}};
}

const renter = await prepareLogin('buyer-evaluation@garilink.test', 'Renter');
const owner = await prepareLogin('seller-evaluation@garilink.test', 'Owner');
const workspaces = expect(await call(`${api}/workspaces`, 'GET', undefined, owner.headers), 200, 'Owner workspaces load');
assert.ok(workspaces.some((item) => item.businessMode === 'INDIVIDUAL'), 'Individual workspace exists');
assert.ok(workspaces.some((item) => item.businessMode === 'FLEET'), 'Fleet workspace exists');

const targets = [
  {id: '9bff59fc-5f24-473d-8338-131ecfc2d045', category: 'SUV', capabilities: {schema_version: 1, transmission: 'AUTOMATIC', fuel_type: 'DIESEL', self_drive: true, with_driver: true, passenger_capacity: 7}},
  {id: '4c1849d4-a825-42b2-8211-97fd8bb6451c', category: 'MEDIUM_TRUCK', capabilities: {schema_version: 1, transmission: 'MANUAL', fuel_type: 'DIESEL', self_drive: false, with_driver: true, payload_kg: 3500, cargo_body: 'box', long_distance: true}},
];

const minePayload = expect(await call(`${api}/listings/mine`, 'GET', undefined, owner.headers), 200, 'Owner inventory loads');
const mine = Array.isArray(minePayload) ? minePayload : minePayload.data;
const fleetListing = mine.find((item) => item.title === 'Phase 4 Fleet Fortuner — Evaluation Only');
if (fleetListing?.vehicleId) {
  targets.push({id: fleetListing.vehicleId, category: 'SUV', capabilities: {schema_version: 1, transmission: 'AUTOMATIC', fuel_type: 'DIESEL', self_drive: true, with_driver: true, passenger_capacity: 7}});
}

for (const target of targets) {
  expect(await call(`${api}/v2/vehicles/${target.id}`, 'PATCH', {
    vehicleCategory: target.category,
    capabilities: target.capabilities,
    operationalAvailability: 'AVAILABLE',
  }, owner.headers), 200, `${target.category} demo vehicle is AVAILABLE`);
  expect(await call(`${api}/v2/vehicles/${target.id}/publication`, 'POST', {action: 'publish'}, owner.headers), 200, `${target.category} demo vehicle publishes`);
}

const discovery = expect(await call(`${api}/v2/vehicles/discoverable`), 200, 'Hosted demo discovery loads');
const ready = discovery.filter((item) => targets.some((target) => target.id === (item.vehicleId ?? item.vehicle?.id)) && item.eligibility?.requestable === true);
assert.equal(ready.length, targets.length, 'Every prepared demo vehicle is discoverable and requestable');

const credentialPath = join(homedir(), 'GariLink-Team-Demo-Credentials-2026-09-27.txt');
await writeFile(credentialPath, [
  'GariLink controlled team-demo credentials',
  'Do not commit or share outside the authorized team.',
  `Renter email: ${renter.email}`,
  `Renter password: ${renter.password}`,
  `Owner email: ${owner.email}`,
  `Owner password: ${owner.password}`,
  '',
].join('\r\n'), {encoding: 'utf8', mode: 0o600});

console.log(`PASS ${ready.length} controlled demo vehicles are published, available and requestable.`);
console.log(`PASS Credentials saved locally outside the repository: ${credentialPath}`);
console.log('Credentials and privileged keys were not printed.');
