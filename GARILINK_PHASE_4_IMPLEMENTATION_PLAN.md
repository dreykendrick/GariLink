# GariLink Phase 4 Implementation Plan

## Recommended sprint structure

### Sprint 4.2 — Workspace Context, Owner Home, and Vehicle Operations

- expose and model `business_mode`
- introduce one shared selected-workspace context with safe invalidation
- guided owner/workspace/first-vehicle entry
- adapt dashboard for Individual versus Fleet density without separate domains
- remove/isolate fabricated Analytics
- replace owner raw errors with safe copy
- refine My Vehicles, availability, pricing summary, publication readiness, and rental-first terminology
- add responsive/accessibility tests

### Sprint 4.3 — Rental Request and Lifecycle Operations

- owner-specific centralized status presentation
- request inbox organization and vehicle association
- snapshot-rich request detail
- approve/reject conflict recovery
- Ready/Active/Complete operational guidance
- explicit availability/lifecycle behavior after product decision
- multi-workspace action-scope tests

### Sprint 4.4 — Phase 4 Integration and Certification

- Individual owner end-to-end certification
- Fleet workspace/multi-vehicle certification
- workspace switching and provider invalidation
- vehicle/media/location/pricing/publication/availability continuity
- request conflict and lifecycle authorization
- scale, responsive, accessibility, security, privacy, fixture cleanup, and Phase 3 regression

Team-member management should remain deferred unless explicitly pulled into Phase 4 with its own authorization and invitation scope. Subscriptions remain Phase 5.

## Implementation order

1. Forward-only workspace DTO/API support for `businessMode`.
2. Typed Flutter workspace model and shared selected-workspace provider.
3. Provider scoping/invalidation for dashboard, vehicles, and requests.
4. Remove fabricated/dead operator surfaces and sanitize owner errors.
5. Adapt Owner Home and My Vehicles for persona and scale.
6. Clarify availability-versus-rental operational rules.
7. Refine request inbox/detail and lifecycle presentation.
8. Add focused owner/fleet responsive and authorization tests.
9. Hosted integration and full regression.

## Do not rebuild

- authentication/session architecture
- workspace, vehicle, listing, rental, media, location, or pricing tables
- TransportNeed, matching, estimate, or rental engines
- RLS/security-definer authorization boundary
- media pipeline and private Storage policies
- publication/readiness and lifecycle RPCs
- shared design system

## Adapt

- workspace serialization and selection
- role-based navigation into explicit operator context
- dashboard hierarchy
- My Vehicles readiness and scale
- create/edit copy and progressive structure
- owner pricing summary
- request status/detail presentation
- error/loading/empty states
- responsive/accessibility coverage

## New, bounded work

- shared selected-workspace state
- explicit Individual/Fleet presentation policy
- operational availability/lifecycle policy after product approval
- owner-specific lifecycle presentation
- Phase 4 certification fixtures/tests

## Dependencies

- Product decision on manual versus lifecycle-derived availability
- Forward migration/serializer update for `business_mode`
- Controlled Individual and Fleet workspaces for certification
- Existing Supabase project and normal authentication
- Phase 3 contracts remain frozen

## Phase 4 definition of done

- Individual owner can onboard, add/configure/publish and operate a vehicle simply.
- Fleet operator can select a workspace and manage multiple vehicles and requests without stale cross-workspace data.
- Publication and availability remain distinct and truthful.
- Pricing, location, media, capabilities, requests, snapshots, conflicts, and lifecycle remain authoritative.
- No fabricated revenue, subscriptions, staff, contact, or payment behavior.
- Workspace and media isolation remain certified.
- Owner surfaces pass responsive/accessibility and complete regression.
