# GariLink Location & Privacy Domain (Sprint 1.2)

GariLink distinguishes mutable search origin, rental pickup, optional destination, vehicle operational location, service area, owner private address, and public approximate locality. Exact coordinates are never part of public discovery; public clients receive only `publicLocality`/city/region.

Locations use schema version 1 and controlled sources: `DEVICE`, `MANUAL`, `PLACE_SELECTION`, `OWNER_CONFIGURED`, and `SYSTEM_DERIVED`. Coordinates and accuracy are nullable, range-validated server-side, and manual entry is always supported. Device permission is optional and must be requested only from an explicit location action; no background tracking or live telemetry exists.

Vehicle operational location is independent from an owner address and is stored privately in `gl_vehicles.operational_location`; `public_locality` is a coarse projection. Rental pickup and destination snapshots are additive nullable fields and must be immutable once created. Existing vehicles/rentals remain valid with NULL locations.

Owners edit the operational area from the vehicle editor. The editor saves through the scoped vehicle-location API and reloads the hosted value before confirming success. SearchLocation is a mutable renter preference, while pickup and destination are immutable rental snapshots. Rental list/detail serializers expose those snapshots only to the renter and authorized workspace; public discovery exposes only `publicLocality`.

PostGIS and nearby ranking are intentionally deferred until Sprint 1.3; this sprint establishes validation, privacy boundaries, and typed exchange only.

Sprint 1.3 enables PostGIS for a private geography point derived from `operational_location`. Nearby discovery returns only rounded geodesic distance and public locality; exact coordinates remain private. Road distance, routing, and pricing remain out of scope.
