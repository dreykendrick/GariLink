export async function provisionEvaluationUsers({ env = process.env, fetchImpl = fetch } = {}) {
  const confirm = env.GARILINK_EVALUATION_CONFIRM?.trim();
  if (confirm !== 'CREATE_CONTROLLED_TEST_USERS') {
    throw new Error('Refusing to provision users without the explicit evaluation confirmation.');
  }
  const url = requiredFrom(env, 'SUPABASE_URL').replace(/\/$/, '');
  const serviceKey = requiredFrom(env, 'SUPABASE_SERVICE_ROLE_KEY');
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) {
    throw new Error('SUPABASE_URL must be an HTTPS Supabase project URL.');
  }
  const accounts = [
    account(env, 'BUYER', 'Team', 'Buyer'),
    account(env, 'SELLER', 'Team', 'Seller'),
  ];
  const headers = { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'Content-Type': 'application/json' };
  const usersResponse = await fetchImpl(`${url}/auth/v1/admin/users?per_page=1000`, { headers });
  if (!usersResponse.ok) throw new Error(`Unable to inspect evaluation users (HTTP ${usersResponse.status}).`);
  const existing = (await usersResponse.json()).users ?? [];
  const results = [];
  for (const item of accounts) {
    let user = existing.find((candidate) => candidate.email?.toLowerCase() === item.email.toLowerCase());
    if (!user) {
      const response = await fetchImpl(`${url}/auth/v1/admin/users`, {
        method: 'POST', headers,
        body: JSON.stringify({ email: item.email, phone: item.phone, password: item.password,
          email_confirm: true, phone_confirm: true,
          user_metadata: { firstName: item.firstName, lastName: item.lastName, evaluationAccount: true } }),
      });
      if (!response.ok) throw new Error(`Unable to create ${item.role.toLowerCase()} evaluation user (HTTP ${response.status}).`);
      user = await response.json();
      results.push({ role: item.role, id: user.id, state: 'created' });
    } else {
      if (user.phone !== item.phone.replace(/^\+/, '') || !user.phone_confirmed_at) {
        const response = await fetchImpl(`${url}/auth/v1/admin/users/${user.id}`, {
          method: 'PUT', headers,
          body: JSON.stringify({ phone: item.phone, phone_confirm: true }),
        });
        if (!response.ok) throw new Error(`Unable to confirm ${item.role.toLowerCase()} evaluation phone (HTTP ${response.status}).`);
      }
      results.push({ role: item.role, id: user.id, state: 'existing' });
    }
  }
  for (const item of accounts) {
    const response = await fetchImpl(`${url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { apikey: serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: item.email, password: item.password }),
    });
    const session = response.ok ? await response.json() : null;
    if (!session?.access_token || !session?.refresh_token) {
      throw new Error(`${item.role} evaluation user could not authenticate through the normal password flow.`);
    }
    const result = results.find((candidate) => candidate.role === item.role);
    result.authenticated = true;
  }
  return results;
}

function requiredFrom(env, name) {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function account(env, prefix, firstName, lastName) {
  const email = requiredFrom(env, `EVALUATION_${prefix}_EMAIL`).toLowerCase();
  const password = requiredFrom(env, `EVALUATION_${prefix}_PASSWORD`);
  const phone = requiredFrom(env, `EVALUATION_${prefix}_PHONE`);
  if (!email.includes('@') || password.length < 12 || !/^\+255[67]\d{8}$/.test(phone))
    throw new Error(`${prefix} credentials do not meet evaluation safety requirements.`);
  return { role: prefix, email, phone, password, firstName, lastName };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  provisionEvaluationUsers()
    .then((results) => console.log(`Evaluation users ready and authenticated: ${results.map((x) => `${x.role.toLowerCase()} ${x.state}`).join(', ')}. Credentials and sessions were not printed.`))
    .catch((error) => { console.error(error.message); process.exitCode = 1; });
}
import { pathToFileURL } from 'node:url';
