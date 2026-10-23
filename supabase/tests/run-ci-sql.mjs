import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

// Stand-in PostgreSQL logic certification, NOT real Supabase Auth integration.
const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, 'utf8');
const migrations = readdirSync(`${root}migrations`).filter((name) => name.endsWith('.sql')).sort();
if (!migrations.includes('20261009000000_email_first_preparation_access.sql') ||
    !migrations.includes('20261012000000_verification_closed_foundation.sql')) {
  throw new Error('Required email-first or closed verification migration missing');
}
const assertions = ['identity', 'workspace', 'marketplace', 'rental', 'pricing', 'media', 'email-auth'];
export const sql = [
  'BEGIN;',
  'CREATE SCHEMA IF NOT EXISTS extensions;',
  read('tests/identity-fixture.sql'),
  ...migrations.map((name) => read(`migrations/${name}`).replace(/^\s*(begin|commit);\s*$/gim, '')),
  read('tests/request-actor-assertions.sql'),
  ...assertions.flatMap((name) => [
    `select 'BEGIN SQL SUITE: ${name}' as certification_stage;`,
    read(`tests/${name}-assertions.sql`),
    `select 'PASS SQL SUITE: ${name}' as certification_stage;`,
  ]),
  "select 'BEGIN SQL SUITE: verification-closed' as certification_stage;",
  read('tests/verification-closed-assertions.sql'),
  "select 'PASS SQL SUITE: verification-closed' as certification_stage;",
  "select 'BEGIN SQL SUITE: identity-preparation' as certification_stage;",
  read('tests/identity-preparation-assertions.sql'),
  "select 'PASS SQL SUITE: identity-preparation' as certification_stage;",
  "select 'BEGIN SQL SUITE: identity-lifecycle' as certification_stage;",
  read('tests/identity-lifecycle-assertions.sql'),
  "select 'PASS SQL SUITE: identity-lifecycle' as certification_stage;",
  "select 'BEGIN SQL SUITE: identity-evidence' as certification_stage;",
  read('tests/identity-evidence-assertions.sql'),
  "select 'PASS SQL SUITE: identity-evidence' as certification_stage;",
  "select 'BEGIN SQL SUITE: identity-infrastructure' as certification_stage;",
  read('tests/identity-infrastructure-assertions.sql'),
  "select 'PASS SQL SUITE: identity-infrastructure' as certification_stage;",
  'ROLLBACK;',
].join('\n');

if (process.argv.includes('--print')) {
  process.stdout.write(sql);
} else {
  if (process.env.GITHUB_ACTIONS !== 'true' || process.env.GARILINK_DISPOSABLE_SQL !== 'true') {
    throw new Error('Execution allowed only in the explicitly disposable CI job');
  }
  console.log(`Canonical migration count: ${migrations.length}`);
  for (const name of migrations) console.log(`Migration: ${name}`);
  console.log(`SQL assertion files: ${assertions.join(', ')}`);
  const result = spawnSync('psql', ['-X', '-w', '-h', '127.0.0.1', '-p', '5433', '-U', 'postgres', '-d', 'garilink_dev', '-v', 'ON_ERROR_STOP=1'], {
    input: sql, encoding: 'utf8', stdio: ['pipe', 'inherit', 'inherit'],
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
