# GariLink Phase 4 Owner/Fleet Architecture

Status: certified and frozen on 2026-09-27.

## Authority model

An authenticated account may belong to zero, one, or several workspaces. The selected workspace is explicit application state; every protected vehicle, pricing, publication, and rental operation is also authorized server-side against its workspace. Selection is navigation context, never an authorization substitute.

`businessMode` is authoritative workspace metadata. `PERSONAL` workspaces resolve to `INDIVIDUAL`; `FLEET_OWNER`, `RENTAL_COMPANY`, and `LOGISTICS` resolve to `FLEET`. Both modes share the same domain and security contracts. Fleet changes presentation and scale, not tenancy architecture.

## Owner product

Owner Home summarizes the selected workspace. My Vehicles/Fleet owns the vehicle workflow: draft, category and typed capabilities, private media, operational location, Pricing Policy V1, manual availability, readiness, publication, pause, and archive where supported. Publication and availability are separate. Public requestability is calculated by the server from publication, availability, readiness, and committed-rental conflicts.

Incoming Requests is workspace-scoped. Its deterministic sections are needs-attention, upcoming, active, and history. Official actions are approve/reject, ready, start, and complete. Server state is authoritative; stale details become non-actionable after a workspace switch and late responses cannot replace the current workspace.

## Rental integrity

Rental creation snapshots TransportNeed, pickup, destination, and an authoritative price estimate when available. Lifecycle changes do not rewrite snapshots or historical price. Vehicle descriptive identity is still read from the current vehicle record; an immutable vehicle-identity snapshot is a documented non-blocking limitation.

Google Routes remains the only route-distance source for distance pricing. When unavailable, no straight-line substitute or fabricated estimate is produced. Off-platform payment remains separate from estimates.

## Security and privacy

RLS/RPC authorization enforces workspace membership and role. Renter, unrelated-workspace, and anonymous owner actions are denied. Public payloads omit exact operational coordinates, protected rental locations, private account data, secrets, and raw Storage paths. Vehicle media remains private and is rendered with signed URLs.

## Refresh and invalidation

Workspace identity is provider-owned. Workspace changes invalidate workspace-scoped summaries, inventory, requests, and details. Request tokens/context checks discard late responses. Mutations refresh server truth and conflicts are shown as safe user messages.

## Phase 5 boundary

Phase 4 supplies a stable `Account → Workspace → businessMode → Vehicles` foundation. Phase 5 may add `Workspace → Subscription → Plan → Entitlements`, but must preserve workspace authorization, vehicle ownership, publication/requestability, rental pricing, snapshots, and renter/owner lifecycle contracts.

Deferred: subscriptions, payments, payouts, escrow, contact/chat, realtime push, KYC, reviews, drivers/dispatch, live tracking/maps, fleet analytics, maintenance scheduling, and sophisticated large-fleet pagination.
