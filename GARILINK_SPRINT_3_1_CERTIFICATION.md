# GariLink Sprint 3.1 certification

## Scope

Renter Home and typed transport-need entry only. No database migration, Edge Function change, matching-policy change, or owner-flow change was required.

## UX acceptance matrix

| Scenario | Evidence | Result |
| --- | --- | --- |
| Need-first Home hierarchy | Typed need composer precedes supporting rental inventory | PASS |
| All canonical purposes | Eleven `TransportPurpose` values rendered in three understandable groups | PASS |
| Progressive passenger input | Passenger count appears only for non-cargo purposes | PASS |
| Progressive cargo input | Weight, volume, and covered-body controls appear only for cargo purposes | PASS |
| Hidden state hygiene | Passenger/cargo values are cleared when switching domains | PASS |
| Driver and journey preferences | Canonical driver preference, return trip, and long-distance fields retained | PASS |
| User-driven location | No permission request on render; device lookup requires a tap | PASS |
| Manual fallback | City-area picker available without location permission | PASS |
| No raw coordinates | Search UI presents area labels only | PASS |
| Dominant action | “Find vehicles” is the primary filled CTA | PASS |
| Typed handoff | `DiscoverySearchIntent` carries `TransportNeed` + `SearchLocation` | PASS |
| Server-authoritative matching | Existing matched-discovery repository remains the only matching implementation | PASS |
| Rental-only supporting inventory | Home and need-led Explore catalogue use `FOR_HIRE` | PASS |
| Owners retain renter access | Home route remains independent of owner workspace routes | PASS |

## Responsive and accessibility evidence

Widget coverage exercises 320, 390, and 600 logical-pixel widths and 200% text scale. Purpose choices wrap, the content is vertically scrollable, selected semantics are explicit, and standard Material controls provide accessible touch targets.

## Hosted authority evidence

Sprint 3.1 does not change the hosted API. `npm run certify:phase1` completed against the hosted environment with **61 passed, 0 failed**. It directly proved passenger and covered-cargo matching, suitable/requestable AVAILABLE behavior, BUSY/UNAVAILABLE/MAINTENANCE non-requestability, server-side stale submission rejection, FOR_SALE exclusion, public payload privacy, workspace isolation, immutable rental snapshots, signed media, pause/disappear, and republish/reappear.

## Regression

- `dart format --set-exit-if-changed lib test`: PASS, clean.
- `flutter analyze --no-pub`: PASS, no issues.
- `flutter test --no-pub --concurrency=1`: PASS, 118/118.
- `npm test`: PASS, 94/94.

The default concurrent Flutter invocation became non-progressing under the Windows test runner without reporting a failed assertion. Running the same complete suite serially produced a definitive clean exit and all 118 tests passed; the newly changed transport-need file also passed independently (12/12).

## Deployment

Flutter-only implementation. No Supabase schema or Edge Function deployment is expected or permitted by this scope.

## Fixture disposition

No new hosted fixture was created by the Home implementation. The hosted certification script paused the controlled passenger and cargo vehicles, cancelled active certification requests, and retained controlled accounts, approved media, and evidence for future team validation.

## Verdict

All Sprint 3.1 implementation, responsive, regression, and hosted-authority gates are satisfied.
