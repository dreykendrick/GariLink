# GariLink Owner Rental Operations V2

## Architecture

Owner rental operations reuse the authoritative rental engine. Flutter never writes lifecycle status directly. Every action is scoped by the selected workspace and sent to the existing authenticated `garilink-api` route; PostgreSQL validates membership, current state, and date conflicts.

## Request inbox

The shared Sprint 4.2 workspace context scopes the queue. There is no page-local workspace selection state. Requests are grouped for operator decisions:

- Needs attention: `REQUESTED`, `UNDER_REVIEW` (newest request first).
- Upcoming: `APPROVED`, `READY_FOR_PICKUP` (nearest rental start first).
- Active: `ACTIVE`.
- History: `COMPLETED`, `REJECTED`, `CANCELLED`.

Cards show vehicle identity and secure media, owner-facing status, renter display name from the protected DTO, dates, a concise immutable TransportNeed summary, pickup locality, and the historical estimate or a truthful unavailable state. Fleet operators see vehicle identity before request metadata. No per-card network request, live estimate, or polling is used.

## Request detail

The detail hierarchy is status and next step, vehicle, period, historical estimate, authorized customer details, pickup/destination snapshots, TransportNeed snapshot, notes, and the one valid lifecycle action. Null destination and null estimate remain explicit and safe. `TZS 0` is never substituted for an absent estimate.

Vehicle identity currently comes from the related vehicle/listing serializer rather than a dedicated immutable vehicle-name snapshot. TransportNeed, pickup, destination, and price estimate use their persisted rental snapshots.

## Actions and convergence

`REQUESTED`/`UNDER_REVIEW` expose Accept and Decline. `APPROVED`, `READY_FOR_PICKUP`, and `ACTIVE` expose Mark ready, Start rental, and Complete rental respectively. Terminal states expose no mutation action. Controls are disabled per rental while a mutation is pending.

After every mutation result—success or failure—the workspace rental provider is invalidated. Vehicle/listing state is also invalidated because committed-rental requestability can change. A lost response therefore converges through the next refresh instead of assuming failure or manufacturing local success. Conflict responses receive owner-friendly guidance and never expose SQL details.

## Workspace and authorization

Provider families are keyed by workspace ID, so a late response for Workspace A cannot populate Workspace B. The detail route is opened only from the selected workspace-scoped collection and contains no workspace switch control. All mutations retain both the stable rental ID and its owning workspace ID. Server authorization remains final for owner/manager roles and cross-workspace attempts.

An open detail route also observes the shared workspace context. If the selection changes, the route explains that the request belongs to another workspace and removes every mutation action.

## Privacy and product boundaries

The owner screen renders only identity/contact fields already supplied by the protected owner DTO. It adds no public profile, reveal rule, call/WhatsApp/chat control, or contact expansion. Public discovery remains free of renter identity, request snapshots, private coordinates, and storage paths. Vehicle images continue through the existing signed-media serializer.

The recorded price is labelled an estimate captured with the request. It is not payment, revenue, earnings, settlement, or an invoice. No payment, subscription, map, tracking, realtime, dispatch, driver-management, or fleet-analytics feature was introduced.

