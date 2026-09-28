# TransportNeed V1 — Sprint 1.1

The renter describes the transport job. This release collects an optional typed intent at the start of booking and stores it in the rental creation transaction. No location, matching, or price calculation is introduced.

## Contract

API uses `transportNeed`; PostgreSQL stores `gl_rentals.transport_need_snapshot`. Required keys are `schemaVersion: 1` and `purpose`. Optional keys: `passengerCount` (integer 1–100), `cargo`, `driverPreference` (ANY/WITH_DRIVER/SELF_DRIVE), boolean `longDistance`/`returnTrip`, and `notes` (up to 1000 characters).

Purposes: PERSONAL_TRIP (Personal trip), CITY_TRAVEL (City travel), FAMILY_OR_GROUP (Family or group travel), AIRPORT_TRANSFER (Airport transfer), PARCEL_DELIVERY (Parcel delivery), SMALL_CARGO (Small cargo), MOVING_GOODS (Moving goods), BUSINESS_TRANSPORT (Business transport), REGIONAL_CARGO (Regional cargo), HEAVY_CARGO (Heavy cargo), LONG_DISTANCE (Long-distance travel).

Cargo purposes require a cargo object and do not accept passengerCount. Other purposes do not accept cargo. Cargo fields: nonnegative numeric estimatedWeightKg/estimatedVolumeM3, cargoType text up to 200 characters, boolean fragile/requiresCoveredBody. Unknown keys and incorrect types are rejected. Empty cargo objects mean the amount is not known yet; no quantity is invented.

## UI and lifecycle

TransportDiscoveryIntent represents replaceable local search state. TransportNeed instances are immutable values. Booking offers purpose selection, applicable numeric fields, driver preference, and return trip. The form validates input before submission and submits the snapshot atomically through the rental repository. Changed requirements generate a new retry key.

RentalSummary parses the stored response into TransportNeed. Both owner and renter use TransportNeedSummary, under Transport requirements / What you requested. Legacy null snapshots hide the section. Malformed or unsupported optional snapshots are omitted rather than inventing requirements.

## Persistence and privacy

Only authorized rental RPCs expose the snapshot via rental_json. Public discovery never uses rental_json. Existing caller verification, workspace authorization, and table privileges apply. A BEFORE UPDATE trigger rejects any changed snapshot, including a null-to-value update. Status transitions preserve the snapshot.

Legacy requests omit transportNeed and store SQL NULL. Historical rentals are not backfilled. Retry comparison normalizes an absent historical transportNeed key to null; changed snapshots on the same request ID are conflicts. TransportNeed remains optional until a future explicit compatibility decision.

The Edge route already forwards the rental body to the authoritative RPC and returns its result with sanitized errors. No Edge deployment is needed for this contract.

## Forward migrations

20260915020000 restores the established nested listing serializer contract and adds snapshot immutability. 20260915030000 closes missing/null/type validation gaps. 20260915040000 preserves retries of pre-TransportNeed requests. Earlier deployed migrations are retained.

## Verification

`npm test` includes API forwarding and sanitization regression. `node scripts/certify_transport_need.mjs` exercises actual hosted PostgreSQL through normal authenticated API calls, including valid/invalid/legacy requirements, retry conflicts, owner approval, cancellation, and privacy. This explicitly authorized evaluation tool rotates controlled test passwords in memory and cancels its test rentals. It must only run against the named evaluation project.

Flutter `test/transport_need_test.dart` covers model round-trip, friendly summary and progressive form validation; the complete existing suite is retained.

## Future capability relationship

passengerCount will compare with passenger_capacity; estimatedWeightKg with the existing payload_kg capability; covered-body requirements with cargo_body; driverPreference with self_drive/with_driver. Volume is a requirement, not a new vehicle capability. Matching and scoring are deferred.

Location permissions, coordinates, service areas, PostGIS, maps, nearby/distance ranking, route intelligence, pricing, subscriptions, payments, and contact handoff remain deferred.
