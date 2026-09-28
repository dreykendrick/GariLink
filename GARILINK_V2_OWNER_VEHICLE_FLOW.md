# GariLink V2 Owner Vehicle Flow

## Scope

Sprint 0.3 activates V2 rental supply without changing the physical-asset and
publication split: `gl_vehicles` is the owner asset; `gl_listings` is its
`FOR_HIRE` publication. A workspace is the tenancy boundary for both.

## Owner flow

1. An authorized workspace member with listing capabilities opens **My vehicles**.
2. **Add vehicle** creates a private, rental-first `FOR_HIRE` draft.
3. The owner supplies identity, a controlled V2 category, and category-aware
   capabilities. The server accepts only schema version 1 and its allowlisted
   fields.
4. The existing private media manager uploads, orders, sets cover, retries and
   deletes vehicle media; it is not duplicated for V2.
5. The owner sets operational availability independently from publication:
   `AVAILABLE`, `BUSY`, `UNAVAILABLE`, or `MAINTENANCE`.
6. The publication action invokes server-side readiness validation. A V2
   publication needs category, valid capabilities and at least one ready image.
7. Published, valid `FOR_HIRE` vehicles are returned by public V2 discovery.
   Only `AVAILABLE` vehicles are requestable.

## Legacy upgrade

Legacy vehicles retain the conservative `UNAVAILABLE` default and are excluded
from V2 discovery until an owner selects a category and saves supported
capabilities. They are upgraded in place; no delete/recreate migration is
required.

## Security boundary

The Edge API forwards owner operations only to authenticated RPCs. RPCs resolve
the vehicle workspace from the database, check membership and capabilities, and
never trust a Flutter workspace identifier for mutation. V2 public discovery
returns listing-safe identity, publication, public capabilities and signed
media only; it does not return contacts, registration/private notes, addresses,
routes, or service credentials.

## Fleet and individual workspaces

The same APIs use vehicle workspace tenancy, so an individual can manage a
small vehicle set and a fleet can manage many vehicles without cross-workspace
access. Workspace switching remains a UI selection, never an authorization
override.

## Deferred

Location, maps, transport needs and matching, distance pricing, subscriptions,
contact handoff, and the final WOW visual pass remain outside this sprint.
