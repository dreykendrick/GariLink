# GariLink Vehicle Suitability Engine

## Purpose

Suitability V1 answers whether a nearby, discoverable rental vehicle can meet an explicit `TransportNeed`. It is deterministic, server-authoritative, and explainable. It is not a recommendation model, an LLM, a route planner, or a price estimator.

## Version and status model

Every result includes `matchingVersion: 1` and one of:

- `SUITABLE`: every explicit hard requirement is verified and met.
- `UNSUITABLE`: one or more explicit hard requirements are verified and fail.
- `CANNOT_VERIFY`: no requirement is proven false, but at least one explicit requirement lacks verified capability data.

Primary matched discovery returns `SUITABLE` results only. Generic nearby discovery remains available for renters who want to browse without matching.

## Capability audit

| TransportNeed | Vehicle capability | Rule | Policy |
| --- | --- | --- | --- |
| `passengerCount` | `passenger_capacity` | capacity >= requested | hard |
| `cargo.estimatedWeightKg` | `payload_kg` | payload >= requested | hard |
| `cargo.requiresCoveredBody` | `cargo_body` | `COVERED`, `ENCLOSED`, `BOX`, `BOX_TRUCK`, or `VAN` | hard |
| `driverPreference=WITH_DRIVER` | `with_driver` | true | hard |
| `driverPreference=SELF_DRIVE` | `self_drive` | true | hard |
| `longDistance=true` | `long_distance` | true | hard |
| `cargo.estimatedVolumeM3` | none in V1 | no fabricated volume | cannot verify |

`ANY` driver preference does not disqualify a vehicle. Vehicle category is not used as a substitute for verified capabilities.

## Reasons and renter copy

Stable machine-readable reasons include `PASSENGER_CAPACITY_OK`, `INSUFFICIENT_PASSENGER_CAPACITY`, `PAYLOAD_CAPACITY_OK`, `INSUFFICIENT_PAYLOAD_CAPACITY`, `COVERED_CARGO_SUPPORTED`, `COVERED_CARGO_REQUIRED`, driver/self-drive, and long-distance equivalents. Flutter maps these to plain language such as “Seats your group” and never displays raw reason codes.

## Nearby integration and privacy

`POST /v2/vehicles/match` takes mutable discovery `TransportNeed`, exact `SearchLocation` coordinates, and bounded nearby controls. PostgreSQL first uses the PostGIS radius filter and existing discovery rules, then evaluates each bounded candidate. It returns public listing data, rounded geodesic distance, coarse locality, availability/requestability, and suitability only. It never exposes operational coordinates, the geography point, private owner data, rental snapshots, or private notes.

Distance remains straight-line proximity only. It is not route distance, ETA, mileage, or a rental price input.

## Ranking and future versioning

V1 deliberately has no opaque score. Results are hard-filtered to `SUITABLE`, then ordered by distance and stable listing ID. A future matching version must be added alongside V1 semantics rather than silently changing these rules.

## Scope deferred

Cargo volume capabilities, suitability preferences/scoring, road routes, ETA, pricing, maps, subscriptions, payments, contact handoff, and live tracking are intentionally deferred.
