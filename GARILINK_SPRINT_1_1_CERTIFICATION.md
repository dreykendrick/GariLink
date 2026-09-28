# Sprint 1.1 certification

## Executive summary
TransportNeed is integrated into booking and authorized historical rental views. Hosted valid, invalid, legacy, privacy, retry, approval and cancellation checks passed. Final Flutter analyzer and full test suite completed successfully.

## Implementation and deployment
The optional booking purpose selector builds a typed TransportNeed, progressively showing cargo or passenger fields, driver preference and return trip. Invalid numeric inputs block submission. RentalRepository sends it in the original creation request; RentalRetryRequest includes the need in its retry identity.

RentalSummary deserializes the persisted response. TransportNeedSummary is shared by renter ('What you requested') and owner ('Transport requirements') details. Legacy null snapshots do not render a section. Unsupported schema versions and malformed optional field types are omitted safely.

Hosted project: yvcdkmsfuakjflmuatgz. Migration ledger verified through 20260915040000. This pass deployed 20260915020000 (immutability and serializer compatibility), 20260915030000 (strict validation), and 20260915040000 (historical retry compatibility). No resets or history repairs occurred.

The pre-existing snapshot serializer had removed nested listing and deposit fields. The forward migration restores them. The earlier validator allowed missing required keys and unchecked cargo values; these are now rejected. The earlier snapshot column had no immutability enforcement; a trigger now blocks changes.

## API contract
Existing Edge rental routes forward the JSON body to PostgreSQL and return authorized RPC responses. No Edge change or deployment was needed. Public discovery does not serialize rentals. Hosted health returned status ok.

## Hosted evidence
`node scripts/certify_transport_need.mjs`: 77 checks passed, 0 failed, exit 0. Covers five valid purpose variants and legacy omission, 15 malformed input cases, identical retry identity, conflicting retry rejection, authorized owner/renter reads, wrong-workspace access and action rejection, anonymous rejection, approval/cancellation snapshot equality, and public discovery privacy.

A separate hosted transaction attempted direct snapshot mutation; the immutability trigger rejected it with controlled SQLSTATE 22023. The probe transaction rolled back. Test rentals were cancelled after approval; accounts retained. Script-created passwords remain undisclosed and may be reset through legitimate admin tooling for team access.

## Regression evidence
| Command | Result | Exit |
| --- | --- | --- |
| npm test (supabase) | 63 passed, 0 failed, 0 skipped | 0 |
| dart format --set-exit-if-changed lib test | 97 files, 0 changed | 0 |
| flutter analyze --no-pub | No issues found | 0 |
| flutter test --no-pub | 89 passed, 0 failed; no skips reported | 0 |

Seven focused Flutter tests cover malformed snapshots, nested round-trip, changed-intent retry identity, owner and renter historical detail views, human-readable presentation and progressive cargo-input validation. The dropdown widget test emits a non-fatal text-hit-test warning; its purpose selection and input assertions pass. No tests were skipped to obtain these results.

UI evidence is automated widget coverage, not physical-device acceptance. Hosted evidence exercises the actual API/database, not mocks. API unit tests independently verify transport requirement forwarding and sanitized database errors.

## Privacy and lifecycle
No public rental snapshot endpoint was added. Snapshot reads remain under existing renter/workspace RPC authorization. Direct immutable snapshot updates are prohibited. Local form editing creates a new value and cannot alter a stored rental; approval and cancellation preserve it.

## Documentation and deferred work
See GARILINK_TRANSPORT_NEED_DOMAIN.md for taxonomy, schema, compatibility, privacy, UI behavior and future capability mapping. Location permissions, coordinates, service areas, PostGIS, maps, nearby queries, scoring/ranking, routing, pricing, subscriptions, payments and contact handoff remain deferred.

## Sprint 1.2 readiness and confidence
READY for the next domain sprint. Engineering confidence estimates, not measured production-readiness percentages: backend contract 95%, Flutter integration 90%, intent UI 90%, security confidence 92%, hosted certification 95%, overall Sprint 1.1 93%. Remaining uncertainty concerns physical-device usability and future integrations, not outstanding Sprint 1.1 implementation.

SPRINT 1.1: COMPLETE
