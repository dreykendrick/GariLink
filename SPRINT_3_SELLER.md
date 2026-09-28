# Sprint 3 — Seller, workspace, and listing management

Completed on 2026-09-12 against Supabase project `yvcdkmsfuakjflmuatgz`.

## Delivered

- Owner home uses real workspace-scoped listing and rental counts; the unsupported revenue KPI was removed.
- Inventory supports explicit workspace filtering, All/Live/Paused/Draft segmentation, real media, pricing, and readable status labels.
- Existing listings can be reopened and partially edited without replacing media, ordering, or cover selection.
- Create/edit forms provide numbered vehicle and listing sections, field validation, appropriate numeric keyboards, retained form state after failures, and a review confirmation.
- Publishing provides an explicit buyer-visibility confirmation and blocks locally without a ready photo; the database remains authoritative through the existing READY-media trigger.
- Pausing/resuming uses existing lifecycle transitions. Archiving is non-destructive and now requires confirmation.
- Sprint 1 media management remains the single upload, retry, reorder, cover, and delete implementation.
- A new `garilink_update_listing` RPC validates an allowlist, locks the listing, checks workspace write membership and capabilities, rejects terminal listings, and updates listing/vehicle data atomically.
- `PATCH /listings/{id}` authenticates online and delegates authorization to the RPC. The path ID is authoritative.

## Deployment and verification

- Migration `20260912030000_seller_management.sql`: applied successfully in the hosted SQL editor.
- `garilink-api`: deployed successfully to the hosted project.
- Hosted anonymous PATCH probe: HTTP 401.
- Edge API tests: 44/44 passed.
- Flutter tests: 41/41 passed.
- Flutter analyzer: no issues.
- Fresh debug APK: `mobile_flutter/build/app/outputs/flutter-apk/app-debug.apk`.

## Deferred external validation

- Physical Android and TalkBack review remains an external release gate.
- Local SQL assertion execution remains unavailable until the isolated PostgreSQL test service is running or the Supabase database password is provided. The seller-management SQL assertion source is checked in.
