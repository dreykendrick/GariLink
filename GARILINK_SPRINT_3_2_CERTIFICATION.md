# GariLink Sprint 3.2 Certification

## Status

COMPLETE

## Objective

Turn generic matched rows into an understandable renter-focused discovery experience while preserving all server authority.

## Starting baseline

Sprint 3.1 complete; Flutter 118, backend 94, Phase 1 61, and Phase 2 certification suites green.

## Discovery audit

The matched panel used text-only `ListTile` rows. It omitted cover media, validated capability values, public locality, category, and Pricing Policy summary despite those fields already existing in the public payload.

## Legacy marketplace residue

General Explore allowed `FOR_SALE`; renter Explore is now fixed to `FOR_HIRE`. Internal class names remain for compatibility but sale language is absent from the renter filter surface.

## Matched vs general discovery

Matched mode shows need context and authoritative suitability. Direct general mode remains rental-only and makes no suitability claim.

## Discovery context

Purpose, relevant requirement, and coarse area are visible with edit controls.

## Vehicle card architecture

One tappable card with cover, identity, distance, requestability, relevant capability, safe pricing, category/locality, and “View vehicle.”

## Suitability, distance, availability, pricing, and privacy

Presentation uses only returned suitable status, capabilities, rounded distance, eligibility, availability, and public pricing summary. No scores, client matching, client distance, trip estimate, exact coordinates, contact data, or invented trust signal exist.

## Navigation and async safety

`DiscoverySelection` remains unchanged. Updated typed intent resets radius and starts a replacement future; the active FutureBuilder is keyed by request identity.

## Responsive and accessibility

Automated passenger/cargo/BUSY card coverage includes 320, 390, 600 pixels and 200% text, semantics, missing media, and one primary interaction.

## Map decision

NOT APPLICABLE — deliberately omitted for clarity, privacy, performance, and scope.

## Database and deployment changes

None expected. This is a Flutter presentation sprint.

## Evidence

AUTOMATED — formatter clean; analyzer clean; Flutter 124/124; backend 94/94.

HOSTED — Phase 1 61/61; Pricing 36/36; routing provider-independent 9/9; estimates 46/46; Phase 2 resilience 68/68.

## Information hierarchy

INSPECTION — cover, identity, distance and requestability lead; category/locality, relevant capability and safe pricing follow; one detail action closes the card.

## Vehicle identity

INSPECTION — uses public make/model with listing-title fallback. No trim, registration, rating, or vehicle fact is invented.

## Media presentation

AUTOMATED — signed cover path, fixed aspect ratio, bounded cache decode and missing-image fallback are retained.

## Need-relevant capabilities

AUTOMATED — passenger cards show passenger capacity; cargo cards prioritize payload and volume/body values.

## Distance presentation

AUTOMATED/HOSTED — only the server-returned rounded discovery distance is formatted. Exact coordinates are absent from rendered text and public hosted responses.

## Availability / requestability

AUTOMATED/HOSTED — AVAILABLE/requestable and BUSY/non-requestable presentations pass; UNAVAILABLE and MAINTENANCE authority pass through Phase 1.

## Pricing presentation

AUTOMATED/HOSTED — configured daily component, complex booking-calculated state, and unconfigured owner-confirmation state are truthful. No asking price or discovery-distance pricing is used.

## Owner / fleet identity

NOT APPLICABLE — current matched public DTO does not expose a dedicated safe operator display identity. No private workspace field is inferred.

## Trust signals

INSPECTION — no ratings, match percentage, verified-owner claim, rental count, or reputation signal was invented.

## Navigation to Vehicle Detail

AUTOMATED — the full card has one primary tap action and passes the correct listing identity.

## DiscoverySelection preservation

AUTOMATED — existing typed need, location, and authoritative suitability handoff remains unchanged.

## Sorting

INSPECTION — matched results retain server distance-first deterministic order; general rental catalogue keeps existing sorting.

## Filtering

AUTOMATED — direct renter Explore is fixed to `FOR_HIRE`; sale selection is removed and rental type is treated as the non-removable baseline.

## Search-intent editing

AUTOMATED — need editing and city-area/device-location editing reuse typed state and trigger authoritative search.

## Loading state

AUTOMATED — context remains visible while a bounded progress indicator is shown.

## Empty state

AUTOMATED — no-nearby and nearby-but-unsuitable states remain distinct with 25 km expansion.

## Error / offline state

AUTOMATED — retry retains intent/radius and technical exceptions are not displayed. No cached result is presented as current availability.

## Pagination / refresh

INSPECTION — matched calls remain server-bounded to 20 and deterministic; general list remains lazy. Radius/intent changes replace rather than append cards.

## Async intent safety

AUTOMATED/INSPECTION — active futures are identity-keyed; updated widget intent resets radius and installs a replacement future, so stale completion cannot become the active result.

## Performance

INSPECTION — one bounded cover decode per card, no gallery prefetch, map SDK, route call, per-card estimate, or client calculation was added.

## Security / privacy

HOSTED/AUTOMATED — no coordinates, owner contact data, private address, operational notes, snapshots, storage path, provider detail, or credential appears.

## Hosted passenger scenario

HOSTED PASS — controlled passenger match was suitable and requestable; non-matching inventory remained excluded.

## Hosted cargo scenario

HOSTED PASS — controlled covered-cargo match passed and passenger-only inventory was not substituted.

## Hosted availability scenario

HOSTED PASS — AVAILABLE, BUSY, UNAVAILABLE and MAINTENANCE authoritative behavior passed.

## Hosted privacy scenario

HOSTED PASS — public discovery privacy inspection passed.

## Phase 1 regression

HOSTED — 61 passed, 0 failed.

## Sprint 2.1 regression

HOSTED — 36 passed, 0 failed.

## Sprint 2.2 regression

HOSTED — 9 passed, 0 failed. Live Google routing was not claimed.

## Sprint 2.3 regression

HOSTED — 46 passed, 0 failed.

## Sprint 2.4 regression

HOSTED — 68 passed, 0 failed.

## Sprint 3.1 regression

AUTOMATED/HOSTED — Home/need/location tests passed and Phase 1 confirmed the resulting hosted match contract.

## Backend regression

AUTOMATED — 94 passed, 0 failed, 0 skipped.

## Flutter regression

AUTOMATED — 124 passed, 0 failed; analyzer clean; formatter clean.

## Controlled fixture cleanup

HOSTED — certification rentals cancelled, vehicles restored then paused, pricing policy restored, accounts/media/evidence retained.

## Documentation

`GARILINK_DISCOVERY_EXPERIENCE.md` and this certification record are complete.

## Deferred items

Vehicle Detail redesign, booking redesign, maps, address autocomplete, reviews, live tracking, payments, and Google route activation remain out of scope.

## Known non-blocking issues

Physical Android smoke testing was not performed because `flutter devices` exposed only Windows and web targets. City-area editing remains centre-based until a later approved place-search capability.

## Sprint verdict

All mandatory engineering, hosted, responsive, accessibility, privacy, and regression gates passed.
