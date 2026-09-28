# GariLink Sprint 3.5 Certification

## Scope and implementation

Sprint 3.5 audited and refined the renter Trips and Rental Detail experience without changing the database schema, deployed Edge Function, or authoritative lifecycle. Status presentation is centralized in `rental_status_presentation.dart`; Trips now uses Upcoming, Active, and Past sections; cards and details use the same customer-safe status copy and immutable snapshots.

## Hosted lifecycle evidence

Executed against the hosted GariLink project through normal renter and owner authentication using the controlled certification fixtures.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Request creation and renter visibility | PASS | Request created; Trips returned exactly one copy. |
| Owner acceptance | PASS | Owner approve endpoint returned success. |
| Updated renter state | PASS | Refreshed renter list returned `APPROVED`. |
| Ready for pickup | PASS | Authoritative owner transition; renter refresh returned `READY_FOR_PICKUP`. |
| Active | PASS | Authoritative owner transition; renter refresh returned `ACTIVE`. |
| Completed | PASS | Authoritative owner transition; renter refresh returned `COMPLETED`. |
| Rejected | PASS | Owner rejection; renter refresh returned `REJECTED`. |
| Cancelled | PASS | Renter cancellation; renter refresh returned `CANCELLED`. |
| Invalid transition | PASS | Complete-from-approved rejected with safe 409 response. |
| Snapshot equality | PASS | Owner and renter received identical TransportNeed and pickup snapshots. |
| Snapshot immutability | PASS | Later intent edit did not change the persisted request. |
| Cross-user isolation | PASS | Renter owner-action and unrelated-workspace owner-action rejected. |
| Anonymous access | PASS | Anonymous rental snapshot request returned 401. |
| Public privacy | PASS | Discovery excluded private owner, location, and rental data. |
| Media | PASS | Controlled signed/public vehicle media rendered as an image. |
| Cleanup | PASS | Certification vehicles paused; open requests cancelled; accounts/media/evidence retained. |

Hosted Phase 1 integration result: **70 passed, 0 failed**. No credential or session was printed.

## Final regression

- `npm test`: **94 passed, 0 failed, 0 skipped**, exit 0.
- `dart format --set-exit-if-changed lib test`: **117 files clean**, exit 0.
- `flutter analyze --no-pub`: **No issues found**, exit 0.
- `flutter test --no-pub`: **138 passed, 0 failed**, exit 0.

## UI and widget certification

- Centralized mappings cover every authoritative state and never expose raw status codes as primary copy.
- Detail status and next-step explanations are derived from the same mapping as cards.
- Null price is explicit and never rendered as zero.
- Cancellation is available only in server-supported states and uses request—not payment/booking—language.
- Card rendering passed at 320 px with 140% text in the focused widget test.
- Existing responsive suite remains responsible for the established 390 px, 600 px, and large-text application checks.

## Deployment and data

No migration, schema change, Edge Function deployment, secret change, or NestJS deployment occurred. The existing hosted API was sufficient. The only backend-side change is additional certification-script coverage.

## Known boundaries

- A standalone direct rental deep link is not supported because no authorized get-by-ID API contract exists.
- Lifecycle event timestamps are not available, so no fabricated timeline is shown.
- Updates are refresh-based, not real time.
- Owner contact release, messaging, payment, reviews, and ratings remain deferred.
- Physical Android screen-reader/device smoke remains a release validation gate.
