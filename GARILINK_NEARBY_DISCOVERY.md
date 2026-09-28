# GariLink Nearby Vehicle Discovery (Sprint 1.3)

Nearby discovery uses a renter SearchLocation with exact coordinates only for a server-side PostGIS query. SearchLocation stays mutable and separate from rental pickup/destination snapshots.

PostGIS is enabled in the `extensions` schema. `gl_vehicles.operational_geog` is a private `geography(Point,4326)` derived from `operational_location` by a database trigger, so owners have one source of truth. A partial GiST index covers only vehicles with a valid point.

`garilink_v2_nearby_vehicles` accepts a latitude, longitude, radius, bounded limit, and offset. Its generic defaults are 10 km, a 500 m minimum, a 100 km maximum, and 20 results with a 50-result maximum. It applies the existing V2 FOR_HIRE, published, workspace, capability, and availability eligibility rules before deterministic distance/id ordering.

Distance is geodesic straight-line proximity, calculated in meters inside PostgreSQL and rounded to the nearest 100 m before it reaches a client. It is neither routing distance nor a billable rental distance. Exact vehicle coordinates, geography values, accuracy, owner address, rental pickup/destination, and transport requirements are never returned by public discovery.

Vehicles without coordinates remain manageable but are not eligible for nearby results. The Flutter Explore panel offers foreground device location and manual locality selection. Locality-only manual input is retained as mutable state and explains that a precise location is needed; no coordinates are invented and no third-party geocoder or map is used.

Sprint 1.4 may consume the safe nearby output for suitability matching. Road distance, ETA, route geometry, pricing, maps, subscriptions, payments, contact handoff, and live tracking remain deferred.
