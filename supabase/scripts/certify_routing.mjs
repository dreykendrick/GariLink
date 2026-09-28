import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';

const ref = 'yvcdkmsfuakjflmuatgz';
const root = `https://${ref}.supabase.co`;
const api = `${root}/functions/v1/garilink-api`;
const keys = JSON.parse(execFileSync('supabase', ['projects', 'api-keys', '--project-ref', ref, '--reveal', '--output', 'json'], {encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']}));
const service = keys.find((key) => key.name === 'service_role')?.api_key;
assert.ok(service, 'Authorized project credential is available');
const admin = {apikey: service, Authorization: `Bearer ${service}`};

async function call(path, method = 'GET', body, headers = {}) {
  const response = await fetch(path.startsWith('http') ? path : `${api}${path}`, {
    method, headers: {'Content-Type': 'application/json', ...headers},
    body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
  const text = await response.text();
  let json; try { json = text ? JSON.parse(text) : null; } catch { json = {message: text}; }
  return {status: response.status, json};
}
let passed = 0;
function check(value, label) { assert.ok(value, label); console.log(`PASS ${label}`); passed++; }

const usersResponse = await call(`${root}/auth/v1/admin/users?per_page=1000`, 'GET', undefined, admin);
assert.equal(usersResponse.status, 200);
const user = usersResponse.json.users.find((item) => item.email === 'buyer-evaluation@garilink.test');
assert.ok(user);
const password = randomBytes(24).toString('base64url');
assert.equal((await call(`${root}/auth/v1/admin/users/${user.id}`, 'PUT', {password}, admin)).status, 200);
const login = await call('/auth/login', 'POST', {identifier: user.email, password});
assert.equal(login.status, 200);
const auth = {Authorization: `Bearer ${login.json.accessToken}`};
check(true, 'Controlled renter authenticates through normal GariLink API');

const controlled = {
  origin: {latitude: -6.7924, longitude: 39.2083},
  destination: {latitude: -6.8781, longitude: 39.2026},
  travelMode: 'DRIVING',
};
const first = await call('/v2/routes/resolve', 'POST', controlled, auth);
check(first.status === 200 && first.json.status === 'PROVIDER_UNAVAILABLE' && first.json.routeDistanceMeters == null,
  'Hosted valid route fails closed when provider credential is not configured');
const second = await call('/v2/routes/resolve', 'POST', controlled, auth);
check(second.status === 200 && second.json.status === first.json.status,
  'Repeated unconfigured resolution is stable and never fabricates distance');
check(!/google|api.?key|latitude|longitude|routes.googleapis|raw/i.test(JSON.stringify(first.json)),
  'Hosted provider result exposes no vendor details, secrets, coordinates or raw response');

const missing = await call('/v2/routes/resolve', 'POST', {origin: controlled.origin, travelMode: 'DRIVING'}, auth);
check(missing.status === 200 && missing.json.status === 'INCOMPLETE_INPUT' && missing.json.routeDistanceMeters == null,
  'Missing destination is explicit and has no distance');
const invalid = await call('/v2/routes/resolve', 'POST', {...controlled, origin: {latitude: 91, longitude: 39}}, auth);
check(invalid.status === 200 && invalid.json.status === 'INVALID_ROUTE_INPUT' && invalid.json.routeDistanceMeters == null,
  'Malformed coordinate is rejected before provider use');
check((await call('/v2/routes/resolve', 'POST', controlled)).status === 401,
  'Anonymous arbitrary routing is denied');

const discovery = await call('/v2/vehicles/discoverable');
check(discovery.status === 200, 'Phase 1 discovery remains healthy');
check(!/pickupLocation|destinationLocation|operationalLocation|latitude|longitude|routeDistanceMeters/i.test(JSON.stringify(discovery.json)),
  'Public discovery leaks no exact locations or route data');

console.log(`Sprint 2.2 hosted provider-independent checks: ${passed} passed, 0 failed. Live Google route was not claimed.`);
