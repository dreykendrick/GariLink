# GariLink environments and secrets

GariLink currently supports development and production. No staging environment is claimed.

| Name | Component/location | Owner/supplier | Required |
| --- | --- | --- | --- |
| `API_BASE_URL` | Flutter `--dart-define` | Release operator | Optional; production-safe HTTPS default exists |
| `APP_ENV` | Flutter `--dart-define` | Release operator | Set to `production` for release |
| `GARILINK_KEYSTORE_FILE` | Protected build environment | Company | Signed release |
| `GARILINK_KEYSTORE_PASSWORD` | Protected build environment | Company | Signed release |
| `GARILINK_KEY_ALIAS` | Protected build environment | Company | Signed release |
| `GARILINK_KEY_PASSWORD` | Protected build environment | Company | Signed release |
| `BEEM_API_KEY` | Supabase Edge Function secret | Company/Beem | Live SMS |
| `BEEM_SECRET_KEY` | Supabase Edge Function secret | Company/Beem | Live SMS |
| `BEEM_SENDER_ID` | Supabase Edge Function secret | Company/Beem | Live SMS |
| `SEND_SMS_HOOK_SECRET` | Supabase secret/Auth hook | Supabase/company | Signed SMS hook |
| Supabase built-in keys/URL | Supabase managed function secrets | Supabase | API/functions |
| Monitoring DSN/config | Protected build/deployment environment | Company | Crash monitoring |
| `SEED_*_PASSWORD` | Local development environment only | Developer | Legacy local seed only |

Release builds reject local or non-HTTPS API endpoints. Android production cleartext is
disabled. Never put service-role keys, Beem secrets, monitoring credentials, database
passwords, signing passwords, OTPs, or private tokens in Flutter source or documentation.

