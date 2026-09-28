# GariLink team evaluation guide

This APK is the real debug application connected to the hosted GariLink Supabase
backend. It contains no alternate demo UI, master OTP, or authentication bypass.

## Install

1. Obtain `mobile_flutter/build/app/outputs/flutter-apk/app-debug.apk` from the
   controlled team share.
2. Allow installation from that trusted source, install, and open GariLink.
3. If replacing an older debug build, first try an in-place upgrade so session and
   migration behaviour are exercised. Clear app data only when testing a fresh user.

## Obtain evaluation credentials

Controlled account identifiers:

- Buyer: `buyer-test@garilink.co.tz`
- Seller: `seller-test@garilink.co.tz`

Both accounts have been provisioned and verified through the normal Supabase
email/password session flow. Obtain their current passwords from Dustan through the
team's approved private credential channel; passwords are not stored in this repository.

The project administrator sets the following variables locally or in an approved
secret runner; values must never be committed or sent in a bug report:

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GARILINK_EVALUATION_CONFIRM`,
`EVALUATION_BUYER_EMAIL`, `EVALUATION_BUYER_PASSWORD`,
`EVALUATION_SELLER_EMAIL`, `EVALUATION_SELLER_PASSWORD`.

Set `GARILINK_EVALUATION_CONFIRM=CREATE_CONTROLLED_TEST_USERS`, then run
`npm run provision:evaluation-users` from `supabase`. The tool is idempotent,
requires administrator credentials, confirms the users, and never prints passwords.
Share credentials using the team's password manager. The login screen accepts the
evaluation email and password through the normal Supabase password flow.

After first seller login, use the actual owner onboarding flow to create the seller
workspace. Create listings and upload project-owned evaluation photography through
the real media manager; do not use copyrighted listing URLs. No public showcase
inventory has been fabricated by this sprint.

## Buyer checklist

- Launch, onboarding, login, Home and Explore
- Search, filters and sorting
- Open a vehicle, gallery, save and unsave
- Submit a rental request and inspect its price and status
- Review Saved, Rentals and Profile

## Seller checklist

- Owner onboarding, workspace and dashboard
- Inventory filters and actions
- Create a listing and validate required fields
- Upload photos, select cover, reorder, delete and retry
- Save draft, review, publish, edit, pause and resume
- Inspect and act on rental requests

## Expected external limitations

- Production SMS/OTP delivery through Beem is pending.
- The evaluation APK uses debug signing; production signing is pending.
- Production crash monitoring and backup restoration validation are pending.

## Report a problem

Record: screen; steps; expected result; actual result; severity; screenshot or video;
device model; Android version; network type; and approximate time.

- P0: cannot continue, data loss, privacy, or security risk
- P1: major workflow broken
- P2: noticeable defect or poor experience
- P3: cosmetic or minor polish

Never include passwords, OTPs, access tokens, phone numbers, or private customer data.
