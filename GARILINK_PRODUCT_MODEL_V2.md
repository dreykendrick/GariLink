# GariLink Product Model V2

## 1. Product definition and non-goals

GariLink V2 is a two-sided vehicle rental and transport-access platform. It
helps a renter find an available, suitable vehicle near a trip or transport
need, then request it from its individual owner or fleet operator. GariLink V1
does not collect, escrow, distribute, or commission rental settlement. It may
show an estimate; owner and renter arrange actual settlement outside GariLink.

It is not a vehicle sale, dealership classified-ad, or e-commerce product.

## 2. Personas and business model

An authenticated account may be both a renter and a workspace member. A renter
uses discovery free of charge. An individual owner has one or a few vehicles;
a fleet operator has a workspace with multiple vehicles and future members.
The future revenue model is a workspace-owned subscription with plans and
server-authoritative entitlements such as vehicle or active-vehicle limits.
Prices, plans, payment provider and enforcement date are open decisions.

## 3. Workspace model

`Workspace` remains the tenant boundary. V2 presents type as `INDIVIDUAL_OWNER`
or `FLEET_OPERATOR` while retaining a transitional mapping from existing types.
One account can own or manage several workspaces and can rent independently.
`OWNER`, `MANAGER`, `MEMBER`, and `VIEWER` are usable foundations; only OWNER
and MANAGER should mutate vehicles or rental operations until a future reviewed
role matrix says otherwise. Subscription ownership belongs to the workspace,
not an individual member.

## 4. Vehicle and capability model

The canonical vehicle is owned by a workspace and has identity (category,
make, model, year, optional reference/registration subject to privacy), media,
operational availability, rental configuration, location/service area and
capabilities. Existing `gl_vehicles.specs` is a useful transition field.

Use a hybrid model: stable, query-critical fields such as category and
availability become relational columns; constrained category-specific details
live in a versioned `capabilities` JSONB document with a validated schema.
This avoids hundreds of nullable truck/car fields while preserving PostgreSQL
indexing for discovery. A later normalized capability table is only warranted
for frequent cross-vehicle capability filtering that JSONB indexes cannot serve.

Vehicle categories initially need to cover sedan, hatchback, SUV, minivan, van,
pickup, small/medium/heavy truck and cargo vehicle. Capabilities can express
passenger capacity, cargo suitability, payload/volume/dimensions, open/covered
body, self-drive/with-driver modes and supported transport uses. Applicability
is category-specific; ordinary cars do not require cargo dimensions.

## 5. Transport need, location and availability

`TransportNeed` is a request-time, immutable snapshot: purpose; pickup and
destination; requested time/window; passenger count; cargo type/weight/
dimensions when relevant; and notes. Context-sensitive UI should solicit only
the needed fields.

Location must distinguish public discovery area from exact owner location,
pickup and destination. Recommend PostGIS later, with a coarse public point or
geohash/service-area for discovery and exact data disclosed only to authorized
request participants at the appropriate lifecycle stage. Existing county is a
useful coarse transitional filter; it is insufficient for nearby discovery.

Publication and availability are separate. Proposed publication states:
`DRAFT`, `PUBLISHED`, `PAUSED`, `ARCHIVED`. Proposed operational availability:
`AVAILABLE`, `BUSY`, `UNAVAILABLE`, `MAINTENANCE`. A vehicle must be published
and AVAILABLE to be discoverable; accepted/active date conflicts also exclude
it for the requested interval.

## 6. Rental request, lifecycle and estimate

Extend the existing rental request with transport-need snapshot, pickup,
destination, requested date/time, estimated distance, estimate components and
agreed/off-platform amount when later needed. The client supplies intent; the
server validates availability and computes protected estimates.

Recommended lifecycle: `REQUESTED -> ACCEPTED -> ARRANGED -> ACTIVE ->
COMPLETED`; `REQUESTED -> REJECTED|CANCELLED`; and `ACCEPTED|ARRANGED ->
CANCELLED`. Renter creates/cancels only before the agreed cut-off. Authorized
owner workspace members accept/reject and progress operations. Completion and
cancellation policy are open. `UNDER_REVIEW` can be retained transiently only
if it has an operational meaning. Existing `APPROVED` maps to ACCEPTED and
`READY_FOR_PICKUP` maps to ARRANGED during a controlled migration.

Pricing remains an estimate, not payment: `minimum/base amount + distance
component + future transparent rules`. Store a versioned estimate snapshot on
the request. Configuration may begin per vehicle with optional workspace or
category defaults later; formula, taxes, driver charges and applicability are
open.

## 7. Contact, discovery and journeys

Before acceptance, expose workspace identity only; protect phone, exact
location and route details. After acceptance, provide explicit, audited contact
actions for the participating renter and authorized workspace actors. Messaging
is not part of this phase.

Future discovery is deterministic: renter location + TransportNeed -> published
and available candidate vehicles -> capability/service-area filtering ->
distance and estimate -> transparent ranking by availability, suitability,
proximity and estimate relevance. Weights are intentionally undecided.

Renter: discovery -> need -> compare -> inspect -> request -> status ->
authorized contact handoff. Individual owner: subscribe later -> add/configure
vehicle -> availability -> receive/act on requests. Fleet: workspace -> member
operations -> vehicle availability overview -> request routing -> subscription
entitlements.

## 8. Canonical terminology

| Current | V2 user-facing term | Treatment |
|---|---|---|
| Buyer/customer | Renter | Rename user-facing; retain customer_id transitionally |
| Seller/dealer | Vehicle owner / fleet operator | Rename contextually |
| Seller workspace | Owner workspace / fleet workspace | Rename user-facing |
| Marketplace | Vehicle discovery / Available vehicles | Rename user-facing |
| Listing | Vehicle / vehicle profile | Repurpose; internal listing can remain temporarily |
| Inventory | My vehicles / Fleet | Rename user-facing |
| For sale / sale price / buy / purchase | None | Remove from rental product concepts |
| For hire / rental request / saved vehicles | Available for rent / Rental request / Saved vehicles | Keep or refine |

## 9. Architecture reuse decisions

Keep Supabase Auth/session verification, Flutter/Riverpod/Dio/GoRouter,
workspaces/memberships, signed private media, image workflow, saved records,
server RPC/RLS boundary, idempotency, rental conflict exclusion and owner
actions. Repurpose `gl_listings` as transitional discoverability/rental profile.
Refactor search, listing creation, user copy, vehicle configuration and rental
input. Migrate sale-only enum/price/status semantics, availability, location,
capabilities, transport need and subscriptions in later expand-first sprints.

## 10. Known unknowns and founder decisions

Exact categories; self-drive versus driver rules; verification/documents;
subscription plans/prices; pricing formula; service area; scheduled rentals;
cancellation/completion; contact-handoff mechanism; location precision; fleet
member roles; and permitted cargo/transport uses remain decisions requiring
founder confirmation. No unresolved item is implemented by this document.
