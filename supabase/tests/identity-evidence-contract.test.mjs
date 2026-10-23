import {readFileSync} from 'node:fs'; import {test} from 'node:test'; import assert from 'node:assert/strict';
const sql=readFileSync(new URL('../migrations/20261023000000_identity_evidence_transport.sql',import.meta.url),'utf8');
test('collection defaults disabled and policy is versioned',()=>{assert.match(sql,/enabled boolean not null default false/);assert.match(sql,/identity_evidence_policies/);});
test('reservation derives actor and generates opaque path',()=>{assert.match(sql,/require_user\(false\)/);assert.match(sql,/gen_random_uuid\(\)::text\|\|'\/'\|\|gen_random_uuid/);assert.match(sql,/c\.subject_id<>actor/);});
test('inspection, finalization and access ledgers are private and immutable',()=>{for(const n of ['identity_content_inspections','identity_finalization_events','identity_reviewer_access_events']){assert.match(sql,new RegExp(`${n} enable row level security`));assert.match(sql,new RegExp(`${n}_immutable`));} assert.match(sql,/from public,anon,authenticated,service_role/);});
test('trusted inspection and finalization are not service-role callable',()=>{assert.match(sql,/identity_record_inspection[\s\S]*identity_finalize_evidence[\s\S]*from public,anon,authenticated,service_role/);assert.doesNotMatch(sql,/grant execute[\s\S]{0,300}identity_record_inspection/i);});
test('review access rechecks assignment and authority and is five minutes',()=>{assert.match(sql,/a\.revoked_at is not null/);assert.match(sql,/identity_reviewer_qualified\(actor\)/);assert.match(sql,/interval '5 minutes'/);});

test('retention requires explicit policy approval rather than an assumed duration',()=>{
  assert.match(sql,/check\(not approved or retention_seconds is not null\)/);
  assert.match(sql,/make_interval\(secs=>pol.retention_seconds\)/);
  assert.doesNotMatch(sql,/interval '1 day'/);
});
test('reservation rejects null revisions and expired retry authority',()=>{
  assert.match(sql,/expected_revision is null or expected_policy is null/);
  assert.match(sql,/d.state<>'RESERVED' or d.reservation_expires_at<=now\(\)/);
});
test('review is pending-only and excludes applicant',()=>{
  assert.match(sql,/c.subject_id=actor or c.state<>'PENDING_REVIEW'/);
});
