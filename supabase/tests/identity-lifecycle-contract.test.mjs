// Static contract regressions, NOT PostgreSQL/Storage runtime certification.
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const sql=readFileSync(new URL('../migrations/20261021000000_person_identity_review_lifecycle.sql',import.meta.url),'utf8');
test('identity lifecycle retains closed collection and private trusted authority',()=>{
  assert.doesNotMatch(sql,/create\s+policy|approved_policy\s*=\s*true|grant\s+.*\s+to\s+service_role/i);
  assert.match(sql,/identity_validation_receipts enable row level security/);
  assert.match(sql,/identity_operation_replays enable row level security/);
  assert.match(sql,/identity_reviewer_authority_events enable row level security/);
  assert.match(sql,/identity_reviewer_authority_events_immutable/);
  assert.match(sql,/verification_append_only/);
  assert.match(sql,/from public,anon,authenticated,service_role/);
});
test('reviewer qualification is append-only, trusted and checked twice',()=>{
  assert.match(sql,/create function garilink_private\.identity_reviewer_authority\(/);
  assert.match(sql,/create function garilink_private\.identity_reviewer_qualified\(/);
  assert.equal((sql.match(/not garilink_private\.identity_reviewer_qualified\(/g)||[]).length,2);
  assert.match(sql,/event_code in \('GRANTED','REVOKED'\)/);
  assert.match(sql,/Conflicting retry/);
  assert.doesNotMatch(sql,/grant execute on function garilink_private\.identity_reviewer_authority/);
});
test('submit and review derive ordinary actor and guard revision, scope and provenance',()=>{
  assert.equal((sql.match(/actor uuid:=garilink_private.require_user\(false\)/g)||[]).length,2);
  for(const fragment of ['c.subject_id<>actor','c.subject_id=actor','a.revoked_at is not null','a.expires_at<=now()',
    'c.revision<>expected_revision','c.policy_version<>expected_policy','prior.payload<>p','identity_evidence_ready(c.id)',
    'd.sha256=r.sha256','d.size_bytes=r.size_bytes','d.object_path=r.object_path']) assert.ok(sql.includes(fragment),fragment);
});
test('expiry repair is forward-only and production eligibility remains denied',()=>{
  assert.match(sql,/Preparation repair target missing/);
  assert.match(sql,/IDENTITY_EXPIRED/);
  assert.match(sql,/'eligible',false/);
  assert.doesNotMatch(sql,/drop\s+(table|function)|truncate|delete\s+from/i);
});
