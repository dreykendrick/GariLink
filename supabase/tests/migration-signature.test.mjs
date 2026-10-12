import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

test('capability validator replacements preserve PostgreSQL input argument names', () => {
  const directory = new URL('../migrations/', import.meta.url);
  const signatures = [];
  for (const file of readdirSync(directory).filter((name) => name.endsWith('.sql')).sort()) {
    const sql = readFileSync(new URL(file, directory), 'utf8');
    const match = sql.match(/create\s+(?:or\s+replace\s+)?function\s+garilink_private\.validate_vehicle_capabilities\s*\(\s*([^)]*)\)/i);
    if (match) signatures.push([file, match[1].replace(/\s+/g, ' ').trim()]);
  }
  assert.equal(signatures.length, 4);
  for (const [file, signature] of signatures) assert.equal(signature, 'category text, value jsonb', file);
});
