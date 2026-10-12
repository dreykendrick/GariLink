import { spawnSync } from 'node:child_process';

// Read ONLY ephemeral local CLI output. Never print keys or write credential files.
if (process.env.GITHUB_ACTIONS !== 'true') throw new Error('Disposable CI only');
const status = spawnSync('npx', ['--yes', 'supabase@2.114.0', 'status', '-o', 'json'], { encoding: 'utf8' });
if (status.status !== 0) throw new Error('Local Supabase status failed');
const config = JSON.parse(status.stdout);
if (config.API_URL !== 'http://127.0.0.1:54321' || !config.ANON_KEY) {
  throw new Error('Unexpected local Supabase API configuration');
}
const response = await fetch(`${config.API_URL}/auth/v1/health`, {
  headers: { apikey: config.ANON_KEY }, signal: AbortSignal.timeout(10000),
});
if (!response.ok) throw new Error(`Local Auth health failed: ${response.status}`);
console.log('PASS: local Supabase Auth health (not email/token lifecycle certification)');
