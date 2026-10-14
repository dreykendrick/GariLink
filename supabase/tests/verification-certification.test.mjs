import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { certifyClosedPlatform } from './platform-verification.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
test('synthetic PNG fixture has valid chunk CRCs and one-pixel content', () => {
  const value = read('./platform-verification.mjs').match(/Buffer.from\('([^']+)', 'base64'\)/)[1];
  const script = `import base64,struct,zlib,sys
b=base64.b64decode(sys.stdin.read()); assert b[:8]==bytes([137,80,78,71,13,10,26,10])
p=8; chunks={}
while p<len(b):
 l=struct.unpack('>I',b[p:p+4])[0]; t=b[p+4:p+8]; d=b[p+8:p+8+l]
 assert zlib.crc32(t+d)==struct.unpack('>I',b[p+8+l:p+12+l])[0]
 chunks[t]=d; p+=12+l
assert p==len(b) and struct.unpack('>II',chunks[b'IHDR'][:8])==(1,1)
assert len(zlib.decompress(chunks[b'IDAT']))==5 and b'IEND' in chunks
`;
  const result = spawnSync(process.env.GARILINK_SQL_PYTHON || 'python', ['-c',script], {input:value,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});
test('fixture actor checks do not require Auth schema privileges', () => {
  for (const name of ['identity','workspace','marketplace','rental','pricing','media','email-auth','verification-closed']) {
    assert.doesNotMatch(read(`./${name}-assertions.sql`), /\bauth\.(uid|jwt)\s*\(/i, name);
  }
  const fixture = read('./identity-fixture.sql');
  assert.doesNotMatch(fixture, /grant\s+usage\s+on\s+schema\s+auth/i);
  assert.match(fixture, /request_actor_matches[\s\S]*security invoker[\s\S]*current_setting\('request.jwt.claims',true\)/);
  assert.match(fixture, /exception when invalid_text_representation then return false/);
  for (const name of ['rental','media','pricing']) {
    assert.match(read(`./${name}-assertions.sql`), /pg_temp.request_actor_matches\(/);
  }
});
test('composition retains seven suites and distinct closed-verification stage within rollback', () => {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./run-ci-sql.mjs', import.meta.url)), '--print'],
    {encoding:'utf8',maxBuffer:8*1024*1024});
  assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/^BEGIN;/);
  assert.match(result.stdout,/ROLLBACK;\s*$/);
  for (const name of ['identity','workspace','marketplace','rental','pricing','media','email-auth','verification-closed']) {
    assert.equal(result.stdout.split(`BEGIN SQL SUITE: ${name}'`).length,2,name);
    assert.equal(result.stdout.split(`PASS SQL SUITE: ${name}'`).length,2,name);
  }
  assert.match(result.stdout,/verification_collection_closed/);
  assert.match(read('./run-ci-sql.mjs'), /GITHUB_ACTIONS[\s\S]*GARILINK_DISPOSABLE_SQL/);
});
test('platform certification refuses non-local targets before network calls', async () => {
  let calls = 0;
  await assert.rejects(certifyClosedPlatform({API_URL:'https://example.invalid',ANON_KEY:'test',SERVICE_ROLE_KEY:'test'},
    async () => { calls++; }), /Disposable local/);
  assert.equal(calls,0);
});

function mockPlatform({allowUpload = false, unrelatedUpload = null, missingBucket = false, cleanupFailure = false} = {}) {
  let next = 0;
  const accounts = new Map();
  const calls = [];
  const objects = new Map();
  const respond = (status,data) => new Response(Buffer.isBuffer(data) ? data : JSON.stringify(data), {status});
  const fetch = async (url, options) => {
    const path = new URL(url).pathname;
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    calls.push({path,method:options.method,authorization:options.headers.Authorization});
    if (path === '/auth/v1/admin/users') {
      const id = `11111111-1111-4111-8111-${String(++next).padStart(12,'0')}`;
      accounts.set(body.email,id);
      return respond(200,{id});
    }
    if (path.startsWith('/auth/v1/admin/users/')) return respond(200,{});
    if (path === '/auth/v1/token') {
      const id = accounts.get(body.email);
      return respond(200,{access_token:`session-${id}`,user:{id}});
    }
    if (path === '/auth/v1/user') return respond(200,{id:options.headers.Authorization.slice('Bearer session-'.length)});
    if (path.includes('/rpc/')) {
      if (options.headers.Authorization === 'Bearer test-anon') return respond(401,{code:'42501'});
      if (!body.action || body.action === 'UNKNOWN') return respond(400,{code:'22023'});
      return respond(200,{action:body.action,gateEnabled:false,collectionEnabled:false,allowed:null,
        reasonCode:'POLICY_NOT_ACTIVATED',requirementKeys:['identity','contact']});
    }
    if (path.startsWith('/rest/')) return respond(406,{code:'PGRST106'});
    if (path === '/storage/v1/bucket/verification-private') {
      return missingBucket ? respond(404,{message:'Bucket not found'}) :
        respond(200,{id:'verification-private',public:false,file_size_limit:5242880,allowed_mime_types:['image/png']});
    }
    if (path.startsWith('/storage/')) {
      const admin = options.headers.Authorization === 'Bearer test-admin';
      if (options.method === 'DELETE') {
        if (!admin) return respond(200,[]);
        if (cleanupFailure) return respond(500,{});
        const removed = body.prefixes.filter(p => objects.has(p)).map(name => ({name}));
        for (const p of body.prefixes) objects.delete(p);
        return respond(200,removed);
      }
      const object = path.split('verification-private/')[1];
      if (options.method === 'GET') {
        return admin && objects.has(object) ? respond(200,objects.get(object)) : respond(400,{message:'Object not found'});
      }
      if (path.includes('/sign/')) return respond(400,{message:'Object not found'});
      if (!admin && unrelatedUpload) return respond(unrelatedUpload.status,unrelatedUpload.body);
      if (!admin && !allowUpload) return respond(400,{statusCode:'403',error:'Unauthorized',message:'new row violates row-level security policy'});
      objects.set(object,Buffer.from(options.body));
      return respond(200,{});
    }
    throw new Error('Unexpected mock endpoint');
  };
  return {fetch,calls};
}
const local = {API_URL:'http://127.0.0.1:54321',ANON_KEY:'test-anon',SERVICE_ROLE_KEY:'test-admin'};
test('platform orchestration uses ordinary sessions for negatives and cleans both accounts', async () => {
  const mock = mockPlatform();
  const result = await certifyClosedPlatform(local,mock.fetch);
  assert.equal(result.users,2);
  assert.equal(result.assertions,65);
  const negative = mock.calls.filter(c => c.path.startsWith('/storage/') || c.path.startsWith('/rest/'));
  assert.ok(negative.some(c => c.authorization.startsWith('Bearer session-')));
  assert.ok(mock.calls.filter(c => c.path.startsWith('/rest/')).every(c => c.authorization !== 'Bearer test-admin'));
  assert.ok(mock.calls.filter(c => c.method === 'PUT' || c.path.includes('/sign/'))
    .every(c => c.authorization.startsWith('Bearer session-')));
  const posts = mock.calls.filter(c => c.method === 'POST' && c.path.startsWith('/storage/v1/object/'));
  assert.equal(posts.filter(c => c.authorization === 'Bearer test-admin').length,1);
  assert.equal(posts.filter(c => c.authorization.startsWith('Bearer session-') && !c.path.includes('/sign/')).length,2);
  assert.equal(mock.calls.filter(c => c.method === 'DELETE' && c.path.startsWith('/auth/v1/admin/users/')).length,2);
});
test('unexpected Storage acceptance fails certification and still cleans accounts', async () => {
  const mock = mockPlatform({allowUpload:true});
  await assert.rejects(certifyClosedPlatform(local,mock.fetch), /upload must be denied by policy/);
  assert.equal(mock.calls.filter(c => c.method === 'DELETE' && c.path.startsWith('/auth/')).length,2);
});
for (const unrelatedUpload of [
  {status:400,body:{message:'Invalid MIME type'}},
  {status:404,body:{message:'Bucket not found'}},
  {status:403,body:{message:'Invalid JWT'}},
  {status:503,body:{message:'Service unavailable'}},
]) {
  test(`unrelated Storage ${unrelatedUpload.status} failure is not authorization evidence`, async () => {
    const mock = mockPlatform({unrelatedUpload});
    await assert.rejects(certifyClosedPlatform(local,mock.fetch), /upload must be denied by policy/);
    assert.equal(mock.calls.filter(c => c.method === 'DELETE' && c.path.startsWith('/auth/')).length,2);
  });
}
test('missing bucket fails preflight before any user negatives', async () => {
  const mock = mockPlatform({missingBucket:true});
  await assert.rejects(certifyClosedPlatform(local,mock.fetch), /bucket must exist/);
  assert.equal(mock.calls.filter(c => c.path.startsWith('/auth/')).length,0);
});
test('synthetic resource cleanup failure fails certification', async () => {
  const mock = mockPlatform({cleanupFailure:true});
  await assert.rejects(certifyClosedPlatform(local,mock.fetch), /resource\/account cleanup failed/);
  assert.equal(mock.calls.filter(c => c.method === 'DELETE' && c.path.startsWith('/auth/')).length,2);
});
test('cleanup failure preserves the earliest causal authorization failure', async () => {
  const mock = mockPlatform({allowUpload:true,cleanupFailure:true});
  await assert.rejects(certifyClosedPlatform(local,mock.fetch),
    /upload must be denied by policy.*cleanup also failed/);
  assert.equal(mock.calls.filter(c => c.method === 'DELETE' && c.path.startsWith('/auth/')).length,2);
});
