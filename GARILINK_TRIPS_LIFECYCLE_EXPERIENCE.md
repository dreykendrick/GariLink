# GariLink Trips and Rental Lifecycle Experience

## Authoritative lifecycle

GariLink uses the existing server lifecycle. The renter UI does not invent states or transitions.

| Backend state | Renter label | Section | Meaning / next step |
| --- | --- | --- | --- |
| `REQUESTED` | Waiting | Upcoming | Sent but unconfirmed; owner must review. |
| `UNDER_REVIEW` | In review | Upcoming | Owner is considering the request. |
| `APPROVED` | Accepted | Upcoming | Dates accepted; owner prepares the vehicle. |
| `READY_FOR_PICKUP` | Ready | Upcoming | Vehicle marked ready; follow agreed pickup arrangements. |
| `ACTIVE` | In progress | Active | Rental is underway; follow return arrangements. |
| `COMPLETED` | Completed | Past trips | Terminal historical record. |
| `REJECTED` | Declined | Past trips | Owner could not accept; renter may explore alternatives. |
| `CANCELLED` | Cancelled | Past trips | Request was cancelled. |

`EXPIRED` remains a compatibility presentation for old records. An unknown value is shown as “Status unavailable”; raw enum text is never the primary user experience.

The supported transition chain is `REQUESTED/UNDER_REVIEW → APPROVED → READY_FOR_PICKUP → ACTIVE → COMPLETED`. Rejection is available from an open review state. Renter cancellation is available only for `REQUESTED`, `UNDER_REVIEW`, and `APPROVED`.

## Information architecture

Trips is one refreshable lifecycle page, grouped into Upcoming, Active, and Past trips. This replaces four competing tabs and keeps declined, cancelled, and completed records in one honest history section. A card shows vehicle identity, dates, pickup locality when recorded, renter-friendly status, status explanation, and the immutable estimate snapshot or an explicit unavailable message.

The detail page contains current status, what happens next, rental dates, authoritative historical estimate, pickup and destination snapshots, TransportNeed snapshot, pickup note, and rejection reason. No fabricated event timestamps or decorative timeline are shown because the API does not provide lifecycle-event history.

## Truth and privacy boundaries

- Estimate text is historical and explicitly not a payment or final-charge claim.
- A null/non-estimated snapshot never becomes zero and never falls back to current listing price.
- Pickup, destination, TransportNeed, and price use the rental snapshots returned by the server.
- Renter details do not reveal the private owner phone, email, exact private address, or internal data.
- Communication/contact handoff, payments, reviews, and ratings are not implied.
- Refresh is pull-to-refresh, the visible refresh action, and app-resume invalidation. No real-time claim is made.

## Direct entry and async behavior

Rental details currently open from an authenticated rental object returned by the renter list API. The app does not expose a standalone rental-detail URL, so an arbitrary unauthenticated ID cannot be rendered or used to cross account boundaries. A true deep-link route is deferred until an authorized get-by-ID contract exists.

Riverpod owns each list request generation; invalidation discards obsolete provider generations. Mutation buttons are disabled while cancellation is in flight, and the list is invalidated after both success and failure so the server remains authoritative.

## Media, accessibility, and performance

Vehicle media uses cached network images with bounded decode width, stable 88–96 px frames, loading placeholders, and error fallbacks. Cards expose meaningful semantics, status never depends on color alone, controls have text labels, and layouts were exercised at narrow width with enlarged text.

## Deferred boundaries

Standalone rental deep links, event-history timestamps, live subscriptions, owner contact release, messaging, payments, reviews, ratings, and device-level screen-reader validation remain outside Sprint 3.5.
