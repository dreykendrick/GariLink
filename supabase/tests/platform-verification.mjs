import { spawnSync } from 'node:child_process';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const check = (condition, label) => { if (!condition) throw new Error(label); };
// Approved synthetic one-pixel PNG, no person/document/customer content.
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=', 'base64');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const privateRestDenial = r => (r.status === 406 && r.data?.code === 'PGRST106') ||
  ([401,403].includes(r.status) && r.data?.code === '42501');
const storagePolicyDenial = r => [400,403].includes(r.status) &&
  (r.data?.code === '42501' || /row.level security|permission denied/i.test(r.data?.message ?? '') ||
    (r.status === 403 && ['AccessDenied','Unauthorized'].includes(r.data?.error)));
// Accept concealed not-found ONLY for the exact seeded object whose admin
// presence/content is independently rechecked. Not a blanket 404 PASS.
const concealedObjectDenial = r => [400,404].includes(r.status) &&
  (r.data?.code === 'NoSuchKey' || /^object (not found|does not exist)\.?$/i.test(r.data?.message ?? ''));

// Testable orchestrator, not a hosted provisioning tool. Exact loopback guard
// applies even when imported. Never echo credentials, sessions or HTTP bodies.
export async function certifyClosedPlatform(config, fetchImpl = fetch) {
  check(config.API_URL === 'http://127.0.0.1:54321' &&
    !!config.ANON_KEY && !!config.SERVICE_ROLE_KEY, 'Disposable local API configuration required');
  const created = [];
  const resources = new Set();
  const fixturePath = `${randomUUID()}/${randomUUID()}`;
  let primaryFailure = null;
  let assertions = 0;
  const assert = (value, label) => { check(value, label); assertions++; };
  async function request(path, {method = 'GET', token, admin = false, body, binary = false, raw = false, extra = {}} = {}) {
    const key = admin ? config.SERVICE_ROLE_KEY : config.ANON_KEY;
    const response = await fetchImpl(`${config.API_URL}${path}`, {
      method, headers: {apikey: key, Authorization: `Bearer ${token ?? key}`,
        ...(body !== undefined ? {'Content-Type': binary ? 'image/png' : 'application/json'} : {}), ...extra},
      ...(body !== undefined ? {body: binary ? body : JSON.stringify(body)} : {}),
      signal: AbortSignal.timeout(10000),
    });
    let data = null;
    try {
      data = raw && response.status === 200 ? Buffer.from(await response.arrayBuffer()) : await response.json();
    } catch { /* No body logging. */ }
    return {status: response.status, data};
  }
  async function fixtureIntact() {
    const result = await request(`/storage/v1/object/authenticated/verification-private/${fixturePath}`, {admin:true,raw:true});
    return result.status === 200 && Buffer.isBuffer(result.data) && digest(result.data) === digest(png);
  }
  try {
    const bucket = await request('/storage/v1/bucket/verification-private', {admin:true});
    assert(bucket.status === 200 && bucket.data?.id === 'verification-private' && bucket.data.public === false &&
      bucket.data.file_size_limit === 5242880 && bucket.data.allowed_mime_types?.includes('image/png'),
      'Required private constrained bucket must exist before negative tests');
    resources.add(fixturePath);
    const seed = await request(`/storage/v1/object/verification-private/${fixturePath}`, {
      method:'POST',admin:true,binary:true,body:png,
    });
    assert(seed.status >= 200 && seed.status < 300, 'Synthetic Storage service fixture creation must succeed');
    assert(await fixtureIntact(), 'Synthetic object must exist with exact content before negatives');
    const anonymous = await request('/rest/v1/rpc/garilink_verification_requirements', {
      method: 'POST', body: {action: 'SELF_DRIVE_REQUEST'},
    });
    assert([401,403].includes(anonymous.status) && anonymous.data?.code === '42501',
      'Anonymous advisory must be denied by function privilege, not setup failure');
    const anonymousObject = await request(`/storage/v1/object/authenticated/verification-private/${fixturePath}`);
    assert(storagePolicyDenial(anonymousObject) || concealedObjectDenial(anonymousObject),
      'Anonymous access to known private fixture must be denied');
    const accounts = [];
    for (let index = 0; index < 2; index++) {
      const email = `kyc-ci-${randomUUID()}@example.invalid`;
      const password = randomBytes(32).toString('base64url');
      const user = await request('/auth/v1/admin/users', {method:'POST', admin:true,
        body:{email,password,email_confirm:true}});
      check(user.status >= 200 && user.status < 300 && uuid.test(user.data?.id), 'Controlled local account creation failed');
      created.push(user.data.id);
      const session = await request('/auth/v1/token?grant_type=password', {
        method:'POST', body:{email,password},
      });
      assert(session.status === 200 && !!session.data?.access_token &&
        session.data?.user?.id === user.data.id, 'Normal local email/password authentication required');
      const token = session.data.access_token;
      accounts.push({id:user.data.id,token});
      const me = await request('/auth/v1/user', {token});
      assert(me.status === 200 && me.data?.id === user.data.id, 'Session identity must match controlled actor');
    }
    for (const {id,token} of accounts) {
      const live = await request('/auth/v1/user', {token});
      assert(live.status === 200 && live.data?.id === id, 'Live ordinary session required before negative tests');
      for (const action of ['WITH_DRIVER_REQUEST','SELF_DRIVE_REQUEST','VEHICLE_PUBLICATION','DRIVER_ACTIVATION','WORKSPACE_AUTHORITY']) {
        const result = await request('/rest/v1/rpc/garilink_verification_requirements', {
          method:'POST',token,body:{action},
        });
        assert(result.status === 200 && result.data?.action === action &&
          result.data.gateEnabled === false && result.data.collectionEnabled === false &&
          result.data.allowed === null && result.data.reasonCode === 'POLICY_NOT_ACTIVATED',
          'Policy must remain inactive and never grant approval');
        assert(Object.keys(result.data).every(key => ['action','policyVersion','gateEnabled',
          'collectionEnabled','allowed','reasonCode','evaluatedAt','requirementKeys'].includes(key)),
          'Advisory response must not leak private fields');
        if (action === 'WITH_DRIVER_REQUEST') {
          assert(JSON.stringify(result.data.requirementKeys) === '["identity","contact"]',
            'With-driver renter must not require a licence');
        }
      }
      for (const action of ['UNKNOWN', null]) {
        const invalid = await request('/rest/v1/rpc/garilink_verification_requirements', {
          method:'POST',token,body:{action},
        });
        assert(invalid.status === 400 && invalid.data?.code === '22023', 'Unknown/null action must be rejected');
      }
      for (const table of ['verification_cases','verification_documents','verification_review_assignments','verification_decisions']) {
        const read = await request(`/rest/v1/${table}?select=*`, {
          token,extra:{'Accept-Profile':'garilink_private'},
        });
        assert(privateRestDenial(read), 'Private reviewer/subject records require explicit privilege/schema denial');
        const write = await request(`/rest/v1/${table}`, {
          method:'POST',token,body:{subject_id:id,state:'APPROVED'},
          extra:{'Content-Profile':'garilink_private'},
        });
        assert(privateRestDenial(write), 'Private direct approval/assignment writes require explicit privilege/schema denial');
      }
      const path = `${randomUUID()}/${randomUUID()}`;
      resources.add(path); // Cleanup even if an unexpected upload succeeds.
      const upload = await request(`/storage/v1/object/verification-private/${path}`, {
        method:'POST',token,binary:true,body:png,
      });
      assert(storagePolicyDenial(upload), 'End-user synthetic upload must be denied by policy');
      const overwrite = await request(`/storage/v1/object/verification-private/${fixturePath}`, {
        method:'PUT',token,binary:true,body:png,extra:{'x-upsert':'true'},
      });
      assert(storagePolicyDenial(overwrite) || concealedObjectDenial(overwrite), 'Known private object overwrite must be denied');
      const read = await request(`/storage/v1/object/authenticated/verification-private/${fixturePath}`, {token});
      assert(storagePolicyDenial(read) || concealedObjectDenial(read), 'Known private object must not yield bytes');
      const sign = await request(`/storage/v1/object/sign/verification-private/${fixturePath}`, {
        method:'POST',token,body:{expiresIn:30},
      });
      assert(storagePolicyDenial(sign) || concealedObjectDenial(sign), 'Known private object must not yield a signed URL');
      const remove = await request('/storage/v1/object/verification-private', {
        method:'DELETE',token,body:{prefixes:[fixturePath]},
      });
      assert(storagePolicyDenial(remove) || concealedObjectDenial(remove) ||
        (remove.status === 200 && Array.isArray(remove.data) && remove.data.length === 0),
        'Known private object deletion must be denied or remove zero objects');
      assert(await fixtureIntact(), 'Synthetic private object must remain unchanged after ordinary-user attempts');
    }
    return {assertions, users:accounts.length};
  } catch (error) {
    primaryFailure = error instanceof Error ? error : new Error('Platform request failed');
    throw primaryFailure;
  } finally {
    let failed = false;
    if (resources.size) {
      try {
        const removed = await request('/storage/v1/object/verification-private', {
          method:'DELETE',admin:true,body:{prefixes:[...resources]},
        });
        if (removed.status !== 200 || !Array.isArray(removed.data)) failed = true;
        for (const path of resources) {
          const absent = await request(`/storage/v1/object/authenticated/verification-private/${path}`, {admin:true});
          if (!concealedObjectDenial(absent)) failed = true;
        }
      } catch { failed = true; }
    }
    for (const id of created) {
      try {
        const result = await request(`/auth/v1/admin/users/${id}`, {method:'DELETE',admin:true});
        if (result.status < 200 || result.status >= 300) failed = true;
      } catch { failed = true; }
    }
    if (failed && primaryFailure) {
      primaryFailure.message += ' (controlled local resource/account cleanup also failed)';
    } else {
      check(!failed, 'Controlled local resource/account cleanup failed');
    }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  check(process.env.GITHUB_ACTIONS === 'true' && process.env.GARILINK_DISPOSABLE_KYC === 'true',
    'Explicitly disposable GitHub runner only');
  const status = spawnSync('npx', ['--yes','supabase@2.114.0','status','-o','json'], {encoding:'utf8'});
  check(status.status === 0, 'Local Supabase status failed');
  const result = await certifyClosedPlatform(JSON.parse(status.stdout));
  console.log(`PASS: real closed-platform boundaries; ${result.assertions} assertions; ${result.users} controlled email sessions; synthetic objects and accounts cleaned`);
}
