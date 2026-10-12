import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('SQL fixture writes use admin while Storage insert uses application policy', () => {
  const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python',
    [fileURLToPath(new URL('./audit-fixture-roles.py', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const audit = JSON.parse(result.stdout);
  assert.deepEqual(audit.errors, []);
  assert.equal(audit.mutations.filter((m) => m.suite === 'rental' && m.table === 'public.gl_vehicles').length, 2);
  assert.ok(audit.mutations.some((m) => m.table === 'storage.objects' && m.role === 'authenticated'));
});
