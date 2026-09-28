# GariLink Sprint 1.2 Certification

The hosted Supabase project `yvcdkmsfuakjflmuatgz` is deployed through migration `20260916020000_location_serialization_protection.sql` and the current `garilink-api` Edge Function.

The controlled hosted certification completed 95 checks. It proved owner location save and readback, rejection of unrelated mutations and invalid location payloads, safe public locality projection, absence of exact coordinates and rental snapshots from discovery, atomic pickup/destination persistence, renter and owner access to authorized rental snapshots, lifecycle immutability, idempotent retries, and cancellation of controlled test rentals.

Final local checks: `npm test` passed 72/72; `dart format --set-exit-if-changed lib test` passed; `flutter analyze --no-pub` passed; `flutter test --no-pub` passed 91/91. PostGIS remains deferred to Sprint 1.3.

SPRINT 1.2: COMPLETE
