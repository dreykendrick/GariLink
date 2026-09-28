# GariLink Vehicle Detail experience

## Audit

The prior detail screen behaved like a listing-data page. Price appeared before decision context, legacy year/mileage/fuel metadata dominated the page, features duplicated capability information, pickup locality came from legacy fields, and the primary action said “Book now.” Although the client fetched V2 discovery data, it retained only eligibility and availability and discarded category, capabilities, public locality, and safe pricing context.

## Decision hierarchy

The renter experience now follows a deliberate sequence: gallery, truthful vehicle identity, matched suitability context, availability, why the vehicle fits, pricing policy, privacy-safe operating area, available specifications, safe operator identity, and a persistent request action. Empty fields are omitted instead of rendered as placeholders.

## Authority boundaries

Flutter does not calculate suitability, availability, requestability, distance, or a rental estimate. The suitability banner is shown only when a matching `DiscoverySelection` for the same listing arrives from discovery. “Why this fits” translates server reason codes and validated capabilities. Direct links omit suitability claims.

## Gallery and media

The gallery uses the existing signed-media URLs, `PageView`, a visible position indicator, bounded image decoding, loading placeholder, and stable no-media/broken-media fallback. It does not expose storage paths or prefetch an unbounded gallery.

## Capability priority

Passenger intent emphasizes passenger capacity, driver preference, self-drive, and long-distance support. Cargo intent emphasizes payload, cargo body, and server-confirmed cargo requirements. Specifications show only fields present in the public capability contract.

## Availability and CTA

The authoritative availability value is explained independently of requestability. AVAILABLE and otherwise eligible vehicles expose one dominant “Request this vehicle” action. BUSY, UNAVAILABLE, MAINTENANCE, sale, and ineligible states remain disabled with truthful explanatory copy.

## Pricing

Pricing Policy V1 remains distinct from a trip estimate. A configured duration component is presented as a per-day policy component; complex configured policy says pricing is calculated during booking; missing policy says to confirm with the owner. Vehicle Detail never calls the estimate endpoint and never shows a trip total.

## Location and privacy

Only `publicLocality` is rendered as “Operates around …”. Exact coordinates, street addresses, private owner details, storage paths, operational notes, and rental snapshots are not displayed. No map was added.

## Responsive and accessibility behavior

The content uses bounded gallery media, adaptive specification columns, text-wrapping rows, and a CTA bar that stacks on compact widths. Tests exercise 320, 390, and 600 logical pixels at 200% text. Semantic headings, image descriptions, suitability, pricing, availability, and action labels provide a natural reading order without duplicate gallery announcements.

## Performance

Vehicle Detail performs the existing listing fetch plus the existing public V2 projection lookup. It adds no route, map, estimate, review, payment, chat, or tracking request. Images use the existing cache and a bounded decode width.

## Explicitly deferred

Payments, chat, maps, live tracking, reviews, ratings, address autocomplete, Google Routes activation, booking redesign, trips redesign, and owner-dashboard redesign remain outside Sprint 3.3.
