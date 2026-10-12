import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python',
  [fileURLToPath(new URL('./audit-function-signatures.py', import.meta.url))],
  { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
assert.equal(result.status, 0, `PostgreSQL AST audit requires pglast==7.10: ${result.stderr}`);
const registry = JSON.parse(result.stdout);

test('all canonical PostgreSQL replacement signatures remain compatible', () => {
  assert.ok(registry.migration_count >= 32);
  assert.ok(registry.events.length > Object.keys(registry.final).length);
  assert.deepEqual(registry.errors, []);
});

test('named V2 RPC contracts agree with reviewed Edge API arguments', () => {
  const expected = {
    'public.garilink_v2_update_vehicle(uuid,jsonb)': ['vehicle_id', 'patch'],
    'public.garilink_v2_vehicle_eligibility(uuid)': ['vehicle_id'],
    'public.garilink_v2_set_publication(uuid,text)': ['vehicle_id', 'action'],
    'public.garilink_v2_update_vehicle_location(uuid,jsonb)': ['target_vehicle_id', 'location'],
    'public.garilink_v2_vehicle_location(uuid)': ['p_vehicle_id'],
    'garilink_private.validate_vehicle_capabilities(text,jsonb)': ['category', 'value'],
  };
  for (const [identity, names] of Object.entries(expected)) {
    assert.deepEqual(registry.final[identity].parameters.map((p) => p.name), names, identity);
  }
});

test('canonical functions have no accidental overloads or hidden drops', () => {
  const byName = new Map();
  for (const event of registry.events) {
    if (!byName.has(event.name)) byName.set(event.name, new Set());
    byName.get(event.name).add(event.identity);
  }
  for (const [name, signatures] of byName) assert.equal(signatures.size, 1, name);
  assert.equal(registry.dependencies.filter((d) => d.kind === 'DROP FUNCTION').length, 0);
});
