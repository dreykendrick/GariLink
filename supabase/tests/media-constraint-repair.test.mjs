import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const folder = new URL('../migrations/',import.meta.url);
const name = '20261014000000_vehicle_media_constraint_qualification.sql';
const sql = readFileSync(new URL(name,folder),'utf8');
test('media qualification is ordered after its dependencies with PostgreSQL-valid scoped deferral', () => {
  const files = readdirSync(folder).filter(f => f.endsWith('.sql')).sort();
  for (const dependency of ['20261009000000_email_first_preparation_access.sql',
    '20261012000000_verification_closed_foundation.sql']) {
    assert.ok(files.includes(dependency));
    assert.ok(files.indexOf(name)>files.indexOf(dependency));
  }
  const command = sql.match(/qualified_command constant text := '([^']+)'/)[1];
  const script = `import json,sys
from pglast.parser import parse_sql_json
data=json.loads(sys.stdin.read())
tree=json.loads(parse_sql_json(data['migration']))
command=json.loads(parse_sql_json(data['command']))
print(json.dumps({'kinds':[list(s['stmt'])[0] for s in tree['stmts']],
 'command':command['stmts'][0]['stmt']['ConstraintsSetStmt']}))`;
  const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python',['-c',script],
    {input:JSON.stringify({migration:sql,command}),encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const parsed = JSON.parse(result.stdout);
  assert.deepEqual(parsed.kinds,['TransactionStmt','DoStmt','TransactionStmt']);
  assert.equal(parsed.command.deferred,true);
  assert.equal(parsed.command.constraints.length,1);
  assert.equal(parsed.command.constraints[0].RangeVar.schemaname,'public');
  assert.equal(parsed.command.constraints[0].RangeVar.relname,'gl_vehicle_media_position_unique');
  assert.match(sql,/pg_get_functiondef\(before_function.oid\)/);
  assert.match(sql,/revised:=replace\(definition,original_command,qualified_command\)/);
  assert.match(sql,/Expected exactly one original constraint command/);
  for (const field of ['proargnames','proargtypes','proallargtypes','proargmodes',
    'prorettype','prosecdef','proconfig','proacl','proowner']) {
    assert.ok(sql.includes(`after_function.${field} is distinct from before_function.${field}`),field);
  }
  assert.match(sql,/after_function.proargdefaults::text is distinct from before_function.proargdefaults::text/);
  assert.doesNotMatch(sql,/\b(drop|grant|revoke)\s+(function|all|execute|usage)\b/i);
});
test('only identified historical RPCs use unqualified deferral; actual catalog and operations have SQL regressions', () => {
  const historical = '20260912010000_vehicle_media.sql';
  for (const file of readdirSync(folder).filter(f => f.endsWith('.sql') && f !== name)) {
    const commands = [...readFileSync(new URL(file,folder),'utf8').matchAll(/\bset\s+constraints\s+([\w.]+)\s+deferred\s*;/gi)];
    if (file === historical) {
      assert.equal(commands.length,2);
      assert.ok(commands.every(m => m[1] === 'gl_vehicle_media_position_unique'));
    } else assert.equal(commands.filter(m => !m[1].includes('.')).length,0,file);
  }
  assert.match(sql,/'public.garilink_reorder_vehicle_media\(uuid,uuid\[\]\)'/);
  assert.match(sql,/'public.garilink_vehicle_media_delete\(uuid\)'/);
  const runtime = readFileSync(new URL('./media-assertions.sql',import.meta.url),'utf8');
  assert.match(runtime,/pg_get_functiondef\(target::regprocedure\)/);
  assert.equal([...runtime.matchAll(/set constraints public.gl_vehicle_media_position_unique immediate;/g)].length,2);
  for (const label of ['Expected duplicate ordering rejected','Expected incomplete ordering rejected',
    'Expected cross-workspace reorder denied','Expected cross-workspace deletion denied',
    'deleting cover compacts remaining image to position zero','no duplicate vehicle-position pair survives']) {
    assert.ok(runtime.includes(label),label);
  }
});
