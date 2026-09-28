# GariLink renter Home experience

## Product intent

Home starts with the renter's job, not a vehicle catalogue. The primary path is:

`Home → transport purpose → relevant requirements → search area → Find vehicles → authoritative V2 matching`

The implementation reuses `TransportNeed` schema version 1, `SearchLocation`, and the existing `/v2/vehicles/match` repository. It introduces no alternate matching or rental domain.

## Information architecture

- The greeting identifies the signed-in person, but remains visually subordinate.
- “What do you need transport for?” is the dominant task.
- Purpose choices are grouped as personal/passenger, delivery/goods, and business/long-distance.
- Only relevant requirement controls appear after a purpose is chosen.
- Passenger values are cleared when switching to cargo; cargo values and covered-body selection are cleared when switching to passenger.
- Location is requested only after user interaction. Device location is optional.
- “Choose an area” is a first-class fallback using clearly labelled Tanzanian city-centre search areas; coordinates are never shown to the renter.
- “Find vehicles” transfers typed discovery criteria into Explore and invokes the existing server-authoritative matcher.
- Available rental inventory remains below the task entry surface as supporting discovery, not the primary product definition.

## Canonical purpose mapping

All eleven canonical purposes are represented without aliases: `PERSONAL_TRIP`, `CITY_TRAVEL`, `FAMILY_OR_GROUP`, `AIRPORT_TRANSFER`, `PARCEL_DELIVERY`, `SMALL_CARGO`, `MOVING_GOODS`, `BUSINESS_TRANSPORT`, `REGIONAL_CARGO`, `HEAVY_CARGO`, and `LONG_DISTANCE`.

## Location and privacy

The screen never requests permission during render. Device lookup occurs only after “Use my location.” Manual area selection uses `PLACE_SELECTION`, explains that matching is centred on the selected city, and retains precise pickup capture for the later booking flow. Public UI never displays raw latitude/longitude.

## Navigation contract

`DiscoverySearchIntent` is an ephemeral navigation object containing a canonical `TransportNeed` and `SearchLocation`. Explore initializes its matching panel from this object and restricts the supporting catalogue query to `FOR_HIRE`. A selected matched result continues to use `DiscoverySelection`, preserving need, search location, and server suitability into details and booking.

## Accessibility and responsive behavior

Purpose controls expose button and selected semantics, controls wrap rather than assume a fixed width, fields remain scrollable, location actions retain normal Material touch targets, and the form is covered at 320, 390, and 600 logical pixels plus 200% text scale.

## Deliberate deferrals

This sprint does not redesign Explore results, add maps or geocoding, alter matching rules, change pricing, add payments, or change owner workspace behavior.
