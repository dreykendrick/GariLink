import assert from 'node:assert/strict';
import test from 'node:test';
import { provisionEvaluationUsers } from '../scripts/create_test_users.mjs';
import { spawnSync } from 'node:child_process';

const base = { GARILINK_EVALUATION_CONFIRM: 'CREATE_CONTROLLED_TEST_USERS', SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'server-only', EVALUATION_BUYER_EMAIL: 'buyer@example.test',
  EVALUATION_BUYER_PASSWORD: 'buyer-password-123', EVALUATION_SELLER_EMAIL: 'seller@example.test',
  EVALUATION_SELLER_PASSWORD: 'seller-password-123', EVALUATION_BUYER_PHONE: '+255710000011',
  EVALUATION_SELLER_PHONE: '+255710000012' };

test('refuses provisioning without explicit confirmation', async () => {
  await assert.rejects(() => provisionEvaluationUsers({ env: { ...base, GARILINK_EVALUATION_CONFIRM: '' }, fetchImpl: async () => assert.fail() }), /Refusing/);
});

test('creates missing users without exposing passwords in the result', async () => {
  const calls = [];
  const result = await provisionEvaluationUsers({ env: base, fetchImpl: async (url, init = {}) => {
    calls.push({ url, init });
    if (calls.length === 1) return new Response(JSON.stringify({ users: [] }), { status: 200 });
    if (String(url).includes('/token?')) return new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), { status: 200 });
    return new Response(JSON.stringify({ id: `user-${calls.length}` }), { status: 200 });
  }});
  assert.deepEqual(result.map((x) => x.state), ['created', 'created']);
  assert.deepEqual(result.map((x) => x.authenticated), [true, true]);
  assert.equal(JSON.stringify(result).includes('password'), false);
  assert.equal(calls.length, 5);
});

test('is idempotent when both users already exist', async () => {
  const result = await provisionEvaluationUsers({ env: base, fetchImpl: async (url) => new Response(JSON.stringify(
    String(url).includes('/token?') ? { access_token: 'access', refresh_token: 'refresh' } : { users: [
      { id: 'buyer', email: base.EVALUATION_BUYER_EMAIL }, { id: 'seller', email: base.EVALUATION_SELLER_EMAIL },
    ] }), { status: 200 }) });
  assert.deepEqual(result.map((x) => x.state), ['existing', 'existing']);
});

test('fails when a provisioned account cannot use the normal password flow', async () => {
  await assert.rejects(() => provisionEvaluationUsers({ env: base, fetchImpl: async (url) => {
    if (String(url).includes('/token?')) return new Response('{}', { status: 400 });
    return new Response(JSON.stringify({ users: [
      { id: 'buyer', email: base.EVALUATION_BUYER_EMAIL }, { id: 'seller', email: base.EVALUATION_SELLER_EMAIL },
    ] }), { status: 200 });
  }}), /could not authenticate/);
});

test('confirms a missing evaluation phone through Admin Auth', async () => {
  const calls = [];
  await provisionEvaluationUsers({ env: base, fetchImpl: async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('/token?')) return new Response(JSON.stringify({ access_token: 'access', refresh_token: 'refresh' }), { status: 200 });
    if (String(url).includes('/admin/users/')) return new Response('{}', { status: 200 });
    return new Response(JSON.stringify({ users: [
      { id: 'buyer', email: base.EVALUATION_BUYER_EMAIL, phone: '', phone_confirmed_at: null },
      { id: 'seller', email: base.EVALUATION_SELLER_EMAIL, phone: base.EVALUATION_SELLER_PHONE.slice(1), phone_confirmed_at: 'now' },
    ] }), { status: 200 });
  }});
  assert.equal(calls.filter((x) => x.url.includes('/admin/users/')).length, 1);
  assert.equal(calls.some((x) => String(x.init.body).includes(base.EVALUATION_BUYER_PHONE)), true);
});

test('the script entry point executes on Windows-compatible paths', () => {
  const result = spawnSync(process.execPath, ['scripts/create_test_users.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: {},
    encoding: 'utf8',
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /explicit evaluation confirmation/);
});
