# Sprint 1 vehicle media

## Architecture

Vehicle objects live in the private `vehicle-media` bucket at
`{workspace_id}/{vehicle_id}/{media_id}.{jpg|png|webp}`. The server creates the
media ID and exact path; clients cannot choose either value. Metadata is stored
in `gl_vehicle_media`, ordered by a deferrable unique `(vehicle_id, position)`
constraint. Position zero is the single deterministic cover.

The app reserves a pending record through the authenticated Edge Function,
uploads directly to the exact Storage path with the user's JWT, then finalizes
the record only after PostgreSQL verifies the stored object's size and MIME
type. Failed uploads trigger best-effort Storage/database rollback. Pending
reservations older than two hours are reconciled during the next reservation.

Public marketplace responses only contain ready media belonging to published
listings. The private bucket is never exposed directly; the Edge Function adds
one-hour signed URLs to authorized response data.

## Limits

- 10 photos per vehicle.
- JPEG, PNG, or WebP input validated by file signature.
- 20 MiB maximum selected original.
- Client conversion to JPEG, up to 1920 by 1080 target dimensions, quality 86,
  EXIF removed.
- 6 MiB maximum optimized upload, enforced by both client and Storage bucket.

Drafts may be saved without photos. PostgreSQL prevents publication until at
least one ready photo exists.

## Validation snapshot — 2026-09-12

- Hosted migration: applied successfully to `yvcdkmsfuakjflmuatgz`.
- Hosted bucket: private, 6 MiB, JPEG/PNG/WebP allow-list.
- Edge Function: deployed; health 200; anonymous media reservation 401.
- Flutter: analyzer clean; 34/34 tests pass.
- Edge Function: 41/41 tests pass.
- Debug APK: built successfully.
- Local PostgreSQL policy assertions are ready but could not run because the
  isolated development server on port 5433 was unavailable.
- A physical-device, authenticated upload/attack pass still requires the
  product owner's test credentials and attached Android hardware.
