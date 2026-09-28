# GariLink discovery experience

## Matched and general discovery

Matched discovery is entered with `DiscoverySearchIntent` and explains the renter's purpose, relevant requirements, and coarse search area before showing server-confirmed suitable vehicles. Direct Explore remains a safe rental-only catalogue and does not claim suitability without a `TransportNeed`.

## Information hierarchy

Each matched card prioritizes signed cover media, legitimate vehicle identity, authoritative discovery distance, requestability, relevant capability, truthful pricing status, category, and public locality. The whole card is the primary route to Vehicle Detail.

## Discovery context

The header summarizes only decision-relevant intent: purpose, passenger count or cargo weight, covered-body requirement, and labelled search area. Need and area can be edited in place. Updated intent starts a new authoritative match and resets the radius.

## Suitability and capabilities

The server remains the only suitability authority. Flutter explains a `SUITABLE` result with validated public capability values or known reason codes; it never calculates suitability or displays a score. Passenger needs prioritize passenger capacity. Cargo needs prioritize payload, cargo volume, and body type.

## Distance semantics and privacy

Distance is the server-returned, rounded SearchLocation-to-operational-location distance. It is formatted only as metres or kilometres “away.” It is not trip distance, live GPS, or pricing input. Exact coordinates and private operational addresses are never rendered.

## Availability and requestability

Availability and requestability remain distinct. Requestable vehicles receive a requestable treatment. BUSY, UNAVAILABLE, MAINTENANCE, and unknown states use their authoritative labels and never become actionable through client inference.

## Pricing

Cards read only Pricing Policy V1 public summaries. A positive duration component is labelled a “daily component,” not a trip total. Configured complex policies say price is calculated during booking; missing policy says to confirm with the owner. Legacy asking price and discovery distance are never used as rental estimates.

## Media and performance

Only the cover asset is loaded per card through the existing signed-media path. Cards use a stable 16:9 region, bounded 720-pixel decode cache, loading placeholder, fallback, and Hero continuity. Gallery assets are not prefetched.

## States and async safety

Matched loading preserves the discovery context. Empty geography and nearby-but-unsuitable states remain distinct and can expand radius. Errors retain intent and offer retry. `FutureBuilder` is keyed to the current request, and widget intent updates reset search radius and replace the active future, preventing an old result from becoming the current presentation.

## Sorting, filtering, pagination, and refresh

General catalogue sorting and bounded lazy lists remain intact. Renter Explore is fixed to `FOR_HIRE`; sale selection was removed. Matched results retain the server's distance-first deterministic order. No client ranking, price ranking, or duplicate matching path was added.

## Accessibility and responsive behavior

Cards expose a concise semantic summary, meaningful image description, textual availability, and a single primary interaction. Layouts support 320, 390, and 600 logical pixels and 200% text without horizontal overflow.

## Map decision

No map is added. The list is the clearer decision surface at current product maturity and avoids fake pins, exact-location leakage, new SDK complexity, and a Google dependency.

## Sprint boundary

Sprint 3.2 does not redesign Vehicle Detail or booking. `DiscoverySelection` continues carrying the authoritative need, search location, and suitability to those existing screens. Full detail hierarchy belongs to Sprint 3.3.
