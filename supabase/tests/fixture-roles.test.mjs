import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

test('SQL fixture writes use admin while Storage insert uses application policy', () => {
  const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python',
    [fileURLToPath(new URL('./audit-fixture-roles.py', import.meta.url))], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const audit = JSON.parse(result.stdout);
  assert.deepEqual(audit.errors, []);
  assert.equal(audit.mutations.filter((m) => m.suite === 'rental' && m.table === 'public.gl_vehicles').length, 2);
  assert.ok(audit.mutations.some((m) => m.table === 'storage.objects' && m.role === 'authenticated'));
});
test('stand-in grants only authenticated Storage USAGE without broader privileges', () => {
  const fixture = readFileSync(new URL('./identity-fixture.sql', import.meta.url),'utf8');
  const script = `import json,sys
from pglast.parser import parse_sql_json
tree=json.loads(parse_sql_json(sys.stdin.read()))
print(json.dumps([s['stmt']['GrantStmt'] for s in tree['stmts'] if 'GrantStmt' in s['stmt']]))`;
  const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python', ['-c',script],
    {input:fixture,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const grants = JSON.parse(result.stdout);
  const schema = grants.filter(g => g.objtype === 'OBJECT_SCHEMA');
  assert.equal(schema.length,1,'exactly one fixture schema grant');
  assert.deepEqual(schema[0].objects,[{String:{sval:'storage'}}]);
  assert.deepEqual(schema[0].privileges,[{AccessPriv:{priv_name:'usage'}}]);
  assert.equal(schema[0].grantees.length,1);
  assert.equal(schema[0].grantees[0].RoleSpec.rolename,'authenticated');
  assert.equal(schema[0].is_grant,true);
  assert.equal(schema[0].grant_option ?? false,false);
  assert.doesNotMatch(fixture,/\bgrant\s+(all|create|bypassrls)\b/i);
  const media = readFileSync(new URL('./media-assertions.sql', import.meta.url),'utf8');
  for (const privilege of ['USAGE','CREATE']) assert.match(media,new RegExp(`has_schema_privilege\\(current_user,'storage','${privilege}'\\)`));
  assert.match(media,/not has_schema_privilege\(current_user,'auth','USAGE'\)/);
  assert.match(media,/not r.rolsuper and not r.rolbypassrls/);
  assert.match(media,/Expected cross-workspace Storage upload denied/);
  assert.match(media,/Expected private verification upload denied/);
});
