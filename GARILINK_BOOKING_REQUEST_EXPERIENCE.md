# GariLink booking and rental-request experience

## Audit

The certified request engine already provided server revalidation, atomic TransportNeed/location/pricing snapshots, current-policy recalculation, immutable history, and request-id idempotency. The old Flutter page did not communicate that rigor well: it started with a large editable TransportNeed form, did not reassure the renter which vehicle was selected, did not explicitly validate pickup before submission, offered limited estimate guidance, and used inconsistent “Request rental” wording.

## UX model

The page is a rental-request flow, not checkout or instant booking. Its hierarchy is selected vehicle, dates, pickup/destination, preserved transport need, optional notes, authoritative estimate, concise review, explanation, and “Send rental request.” Copy explains that the owner must review the request and no payment is taken in GariLink.

## Dates

The existing exclusive-end calendar-day semantics are preserved. Flutter performs obvious future-date and ordering checks for usability; the server remains authoritative. Changing month or dates invalidates the visible estimate.

## Locations and privacy

Pickup is manually enterable and required before submission. Destination remains optional under the current contract but becomes required by the authoritative estimate state when distance pricing needs it. No permission prompt, map, Places integration, owner coordinates, private address, or route-provider metadata is introduced. Location edits invalidate the estimate.

## Transport need

Matched discovery carries the typed `TransportNeed` through Vehicle Detail into this flow. It is displayed as a read-only summary and sent unchanged to rental creation instead of being requested again. Direct entry exposes the existing typed form because no authoritative need context exists.

## Estimate states

The existing state machine remains authoritative: ESTIMATED, INCOMPLETE_INPUT, PRICING_NOT_CONFIGURED, ROUTE_UNAVAILABLE, network/error, and unsupported policy. Successful estimates display only server-returned total and components. Unconfigured pricing and route unavailability never become zero or a fabricated distance and do not block an otherwise valid request.

## Invalidation and async safety

Date, pickup, destination, and listing changes invalidate visible estimates. The existing generation guard prevents late estimate A from replacing newer estimate B. TransportNeed is not currently an estimate endpoint input; it remains part of the atomic rental snapshot.

## Submission authority and idempotency

The UI disables submission while pending, but the real guarantee is the existing payload-derived UUID request key and server idempotency. Submission sends listing, dates, TransportNeed, pickup, destination, and notes once through the authoritative rental RPC. The server revalidates publication, availability, conflicts, authentication, and current pricing and creates all snapshots atomically.

## Success, errors, and retry

Success is shown only after authoritative creation and says “Request sent,” followed by navigation to Trips. Retry retains form inputs and the same request key for an unchanged payload, protecting response-loss retries. User-facing failures remain sanitized and do not expose database or provider details.

## Deferred features

Payments, checkout, escrow, maps, Places, route visualization, chat, contact reveal, reviews, ratings, live tracking, Trips redesign, and owner-dashboard redesign remain out of scope.
