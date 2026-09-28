# GariLink V2 Renter Experience

## 1. Product mental model

GariLink helps a renter describe a real transport need, find an authoritatively suitable nearby rental vehicle, request it, and follow the rental lifecycle. A request is not a confirmed rental, payment, reservation, or active trip.

## 2. Home

Home begins with “I need transport.” It collects a typed `TransportNeed` and a safe search location, then opens Explore with a `DiscoverySearchIntent`. The intent is mutable discovery context, not rental history.

## 3. Transport Need

Passenger and cargo requirements use the versioned TransportNeed model. Flutter gathers the intent; the server validates it and performs suitability decisions. Flutter never calculates a percentage match.

## 4. Search Location

Search location establishes discovery proximity only. It is not silently reused as the rental pickup, destination, or pricing route. Public discovery exposes safe locality, never exact owner/vehicle coordinates.

## 5. Matching

Matched discovery sends the typed need and search origin to the authoritative matching endpoint. It returns canonical suitability, reason codes, availability, requestability, and discovery distance. Old provider generations are discarded when intent changes.

## 6. Discovery

Matched results explain verified fit. General Explore remains browsing and does not claim suitability without a match. `FOR_SALE` inventory is excluded from V2 rental discovery and rental creation.

## 7. Vehicle Detail

A matched `DiscoverySelection` carries the authoritative suitability context into detail. Direct detail entry remains truthful and does not claim “matches your trip.” Current availability and requestability remain server-owned.

## 8. Rental Request

Booking receives vehicle identity plus matched intent where available. Direct entry safely gathers missing requirements. Dates, explicit pickup, destination, and notes are validated. Submission uses a stable request ID so an exact retry resolves to the same rental.

## 9. Pricing behavior

Estimates are server-calculated snapshots. Discovery proximity never becomes pricing distance. Pricing route distance is pickup-to-destination only. Input changes invalidate the preview, and stale responses cannot replace newer intent. At submission, the server recalculates current policy. `PRICING_NOT_CONFIGURED`, `ROUTE_UNAVAILABLE`, and network failures never become zero, Free, straight-line fallback, or a fabricated amount.

## 10. Request success

Success says “Request sent.” It means the authoritative state is `REQUESTED`; it does not mean accepted, reserved, paid, or active. The primary continuation is Trips.

## 11. Trips

Trips groups authenticated renter records into Upcoming, Active, and Past trips. Each card shows vehicle identity, dates, pickup locality when recorded, renter-safe status, and the stored estimate or an explicit unavailable state.

## 12. Lifecycle

The authoritative progression is:

`REQUESTED / UNDER_REVIEW → APPROVED → READY_FOR_PICKUP → ACTIVE → COMPLETED`

`REJECTED` and `CANCELLED` are terminal alternatives. The renter can cancel only `REQUESTED`, `UNDER_REVIEW`, or `APPROVED`. Refresh, app resume, and post-mutation invalidation fetch current server state; the product does not claim real-time updates.

## 13. Historical snapshots

After creation, TransportNeed, pickup, destination, and pricing estimate are immutable rental history. Trips and Rental Detail read these stored snapshots and never reconstruct them from current search state, vehicle configuration, or pricing policy.

## 14. Privacy

Public surfaces exclude exact coordinates, rental snapshots, private owner identity, phone, email, address, operational notes, and credentials. Authorized rental details expose the renter’s own pickup/destination snapshot. No contact-release contract is present.

## 15. Degraded states

Discovery, detail, estimate, submission, and Trips use safe errors and recovery. Missing/expired images use non-blocking fallbacks. Uncertain rental submission is resolved by authoritative idempotency. Stale availability or publication is rejected at submission.

## 16. Responsive and accessibility model

Core cards and journeys support 320 px, 390 px, and 600 px layouts and enlarged text. Status is communicated by words and icons, not color alone. Images have bounded decoding and fallbacks; primary controls have meaningful labels and touch targets.

## 17. Deferred functionality

Payments, checkout, wallet, escrow, refunds, contact release, chat, phone/WhatsApp integration, reviews, ratings, KYC, maps, live tracking, subscriptions, AI recommendations, and a `FOR_SALE` renter experience are outside Phase 3.

## Integration map

```text
TransportNeed + SearchLocation       mutable renter intent
          ↓
DiscoverySearchIntent                ephemeral navigation/search state
          ↓
authoritative match                  current server result
          ↓
DiscoverySelection                   current verified selection context
          ↓
Vehicle Detail                       current public vehicle/requestability
          ↓
Rental Request                       renter intent + authoritative estimate
          ↓
rental creation                      authoritative idempotent mutation
          ↓
immutable snapshots                  historical need/location/pricing
          ↓
Trips → Rental Detail                authenticated rental history
```
