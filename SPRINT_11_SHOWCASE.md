# Sprint 11 — Showcase polish and team evaluation

Validated on 2026-09-12.

## Completed

- Reviewed the buyer, authentication, seller, inventory, listing, media, rental,
  profile, loading, empty, and error surfaces against the established design system.
- Removed raw unexpected exception output from registration and password recovery.
- Replaced OTP/developer-oriented recovery copy with calm verification language.
- Added a centralized user-facing error boundary and focused tests.
- Added an idempotent, admin-only evaluation-user provisioning tool. It requires an
  explicit confirmation and environment-provided service credential, email addresses,
  and passwords; it never prints passwords and introduces no Flutter bypass.
- Added the team installation guide, buyer/seller walkthroughs, known limitations,
  credential-retrieval process, and severity-based feedback template.
- Built a fresh debug APK with `APP_ENV=production`, so evaluation targets the hosted
  HTTPS Supabase API while retaining debug signing.

## Verification

- Formatting: 89 files; one updated by formatter.
- Flutter analyzer: no issues.
- Flutter tests: 64/64 passed.
- Supabase/API tests: 49/49 passed, including three provisioning safety tests.
- Hosted marketplace query: HTTP 200, but zero public listings returned.
- APK: 183,260,360 bytes (174.77 MiB), SHA-256
  `07608B4472E4E57CDAFE116A790BD992378759BF5BAE167BB74CD8EB72EBC19B`.

## Evaluation account status

The controlled buyer and seller accounts are provisioned in the hosted project. An
idempotent follow-up run verified that both obtain genuine Supabase email/password
sessions. No Flutter authentication bypass exists, and no credentials or sessions
were printed by the tool.

## Unfinished evaluation setup

No controlled listing was created because the hosted project has no approved
project-owned vehicle photography. The public evaluation dataset therefore contains
exactly zero listings. This prevents
honest validation of the core Home → Explore → Vehicle → Gallery journey and means the
sprint cannot yet be declared complete.

To finish: create the seller workspace through the real application and add 10–20 clearly controlled
listings using project-owned photography through the real listing/media workflows.
