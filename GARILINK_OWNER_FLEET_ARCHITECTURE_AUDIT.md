# GariLink Owner and Fleet Architecture Audit

## Current architecture

GariLink already has one suitable operator foundation: an authenticated user acts through one or more workspaces; workspaces own physical vehicles, publications, media, pricing policies, and rental requests. Individual and Fleet should remain modes of this shared model—not separate authentication, vehicle, or rental systems.

```text
Authenticated account
  → accessible workspace
    → business_mode: INDIVIDUAL | FLEET
      → vehicles (physical assets)
        → listing/publication
        → media, location, availability, capabilities, pricing
      → workspace rentals
        → approve/reject/ready/start/complete
```

## Workspace model

`gl_workspaces.owner_id` identifies the account owner. `gl_workspace_members` permits multiple active workspaces per account and multiple members per workspace. Roles are `OWNER`, `MANAGER`, `MEMBER`, and `VIEWER`; only owner/manager can pass `workspace_access(..., true)`. Active members can read. Workspace creation is idempotent and adds the creator as OWNER.

All sensitive tables revoke direct public/anon/authenticated table access. Security-definer RPCs call `require_user` and `workspace_access`. Vehicle, publication, pricing, location, media, inbox, and lifecycle mutations are path/object scoped back to a workspace. Storage policies additionally verify the media record, workspace relationship, actor, and storage path.

Flutter supports a workspace dropdown in My Vehicles and Incoming Requests, but has no shared selected-workspace state. Dashboard uses the first returned workspace; therefore mode switching is partial rather than a coherent certified workspace session. My Vehicles can show “All workspaces,” which is useful for overview but inappropriate as an action scope unless each action remains bound to its listing—which it currently does.

## Business mode

`business_mode` is a non-null checked column with `INDIVIDUAL` and `FLEET`; default is `INDIVIDUAL`, with migration backfill derived from legacy workspace type. It is currently metadata only. `workspace_json` does not serialize it, `WorkspaceSummary` does not model it, and Flutter cannot use it. No persona-specific behavior should be added until this contract gap is corrected forward-only.

## Personas and journeys

### Individual owner

```text
Sign in → create/select individual workspace → add first vehicle
→ identity/category/capabilities/media/location/pricing
→ set availability → publish → review request
→ approve/reject → ready → active → complete
```

The interface should emphasize one clear next action, first-vehicle readiness, incoming requests, and current rental operation—not enterprise metrics.

### Fleet/company operator

```text
Sign in → select fleet workspace → operational overview
→ filter many vehicles by publication/availability/readiness
→ configure vehicle → review volume of requests by vehicle
→ progress rentals through the shared lifecycle
```

Fleet needs scalable organization and workspace identity. Staff/driver assignment and analytics are not currently supported and must not be implied.

## Owner surfaces

- **Owner Dashboard:** real counts are derived from loaded listings and rentals. Useful foundation, but it uses the first workspace, raw status text, raw errors, and does not distinguish persona. KEEP/ADAPT.
- **My Vehicles:** supports workspace filter, publication tabs, availability mutation, edit, media, publish/pause/archive. Strong foundation. Cards need clearer readiness/pricing/requestability hierarchy and fleet-scale filtering. KEEP/ADAPT.
- **Create/Edit Vehicle:** uses the V2 draft/update APIs, category-aware capabilities, availability, media path, and Pricing Policy V1. It still inherits listing-oriented naming and is a long form. KEEP/ADAPT.
- **Incoming Requests:** workspace-selectable, supports request groups, snapshots, approve/reject and lifecycle actions. Strong operational foundation, but raw owner status presentation and list scalability need work. KEEP/ADAPT.
- **Menu:** accurately labels team, subscription, payouts, and business profile as unavailable. KEEP placeholders only when they remain visibly unavailable.
- **Analytics:** hardcoded earnings, booking counts, percentages, and USD values. It is not backed by authoritative data and must remain inaccessible, then be removed or replaced in a later scoped sprint. REMOVE/DEFER.

## Vehicle, publication, and operations

`gl_vehicles` is the physical asset. `gl_listings` is its publication/discovery layer. Owner copy should say Vehicle, My Vehicles/Fleet, Published, Paused, and Draft while retaining internal listing identifiers and APIs.

Publication and availability are orthogonal:

| Publication | Availability | Discoverable | Requestable |
| --- | --- | --- | --- |
| Published | AVAILABLE | Yes | Yes when all other eligibility passes |
| Published | BUSY | Yes | No |
| Published | UNAVAILABLE | Per current discovery rules, visible where eligible | No |
| Published | MAINTENANCE | Per current discovery rules, visible where eligible | No |
| Paused/Draft/Archived | Any | No | No |

Availability is manually controlled. Rental acceptance does not automatically derive BUSY, and completion does not automatically restore AVAILABLE. This can permit operational contradictions such as ACTIVE plus manually AVAILABLE. It is not a security defect, but is a HIGH correctness/UX design decision for Phase 4. Do not silently add automation until explicit rules are approved.

## Capabilities, media, location, and pricing

Category-aware UI distinguishes passenger capacity from cargo payload/body configuration and shares server validation. Media uses private Storage, reserve/upload/finalize, validation, cover ordering, reorder/delete, signed/public-safe serialization, and workspace authorization. Operating location is owner-private except coarse public locality.

Pricing Policy V1 is per vehicle, versioned, integer TZS, and supports base, minimum, per-day, and per-route-kilometre components. Owner form explains that estimates are not payments and route distance is distinct from discovery distance. The form is functional but needs a clearer configured/unconfigured summary and explanation of renter-visible effects.

## Request and lifecycle architecture

Owner inbox uses immutable renter snapshots: TransportNeed, pickup, destination, and authoritative pricing estimate. Actions are `approve`, `reject`, `ready`, `start`, and `complete`. Overlapping approvals are protected by the database; invalid transitions return safe conflicts. Owner and renter read the same snapshots. Owner cards need the centralized lifecycle presentation or a dedicated owner mapping rather than raw enum conversion.

## Privacy and security boundaries

- Owner inbox is workspace-scoped.
- Cross-workspace vehicle, pricing, location, media, request, and lifecycle mutations are denied.
- Anonymous mutations are denied.
- Public DTOs exclude exact location, private rental snapshots, contact data, and operational fields.
- Owner sees renter contact only inside the authorized owner rental-detail view; no broader contact-release feature exists.
- Error sanitization is strong in the API, but several Flutter owner pages use `error.toString()`, risking technical copy exposure from unexpected client errors. Route these through `userFacingError` in implementation work.

## Subscription readiness

Workspace-scoped resources and `business_mode` form a suitable Phase 5 enforcement boundary. No plans, entitlements, billing state, or enforcement exist. Existing capability rows are authorization capabilities, not subscriptions. Do not conflate them.

## Performance and scale

Repository endpoints aggregate owner listings and workspace rentals, avoiding per-card vehicle calls. Risks: all-workspace listings are loaded together; dashboard derives counts client-side; signed media can scale with inventory; no pagination exists; provider invalidation can reload broad collections; and 50+ vehicle UX lacks filters/search. These are MEDIUM scale risks, not evidence of current N+1 RPC behavior.

## Responsive and accessibility findings

Owner pages use responsive rows/grids and scrollable lists but lack dedicated 320/390/600 and 200% test coverage. Potential risks include dashboard two-column statistics, action rows, long workspace names, request action pairs, long forms, and media controls. Status must not rely on color; availability/publication controls need explicit semantics and minimum touch targets.

## Terminology classification

| Term/path | Classification | Action |
| --- | --- | --- |
| `listing`, `marketplace` repository/API names | Internal/API compatibility | Keep |
| `gl_listings`, `askingPrice`, `FOR_SALE` | Database compatibility/sale-specific | Keep isolated |
| “Publish this listing”, “marketplace”, “Customers” in owner UI | User-facing legacy | Adapt in Phase 4 |
| Seller migration/file names | Historical compatibility | Keep |
| Analytics earnings/booking demo | Dead legacy/fabricated | Remove or isolate |
| Team, Subscription, Payout menu | Deferred product | Keep explicitly disabled or hide |

## Reuse matrix

Percentages are approximate engineering estimates based on inspected domain logic, authorization, and current UI—not file-name similarity.

| Component | Current state | Reuse | Change | Risk | Phase 4 action |
| --- | --- | ---: | ---: | --- | --- |
| Authentication | Production Supabase sessions | 95% | 5% | Low | Keep |
| Workspace tenancy | Strong owner/member RPC boundary | 90% | 10% | Low | Keep, expose mode |
| Business mode | Stored/validated, not serialized | 55% | 45% | Medium | Contract + UI adaptation |
| Workspace switching | Per-page partial selection | 45% | 55% | High | Shared workspace context |
| Vehicle domain | Physical asset separated | 95% | 5% | Low | Keep |
| Publication | V2 publish/pause plus legacy archive | 85% | 15% | Medium | Normalize owner UX |
| Capabilities | Server and category-aware form | 90% | 10% | Low | Refine |
| Media | Secure complete pipeline | 90% | 10% | Low | Polish/test |
| Operating location | Private exact, public locality | 90% | 10% | Low | Polish |
| Availability | Authoritative mutation/eligibility | 75% | 25% | High | Fast control + lifecycle rules |
| Pricing | Policy V1 complete | 85% | 15% | Medium | Summary and guidance |
| Owner dashboard | Real basic counts | 55% | 45% | Medium | Adapt by persona |
| My Vehicles | Functional operations | 75% | 25% | Medium | Scale/readiness polish |
| Create/Edit | Functional V2 form | 75% | 25% | Medium | Rental-first steps/copy |
| Request inbox/detail | Functional snapshots/actions | 80% | 20% | Medium | Status and density polish |
| Accept/reject/lifecycle | Authoritative and protected | 95% | 5% | Low | Reuse |
| Owner navigation | Role-based but no explicit mode switch | 60% | 40% | Medium | Adapt |
| Responsive/accessibility | Shared system, sparse owner tests | 60% | 40% | Medium | Harden |
| Security/RLS | Strong RPC and Storage boundaries | 95% | 5% | Low | Preserve/test |
| Error handling | API sanitized; UI inconsistent | 65% | 35% | Medium | Centralize copy |
| Subscription readiness | Workspace boundary only | 35% | 65% | Medium | Preserve for Phase 5 |

## Gap register

| ID | Area | Current → desired | Persona | Severity | Type | Sprint | Dependency |
| --- | --- | --- | --- | --- | --- | --- | --- |
| P4-01 | Workspace mode | Stored but absent from DTO/UI → authoritative persona context | Both | High | Architecture | 4.2 | Forward API/serializer change |
| P4-02 | Workspace selection | First/per-page selection → shared selected workspace with invalidation | Fleet | High | Correctness/UX | 4.2 | Provider architecture |
| P4-03 | Availability lifecycle | Manual state permits contradictions → explicit approved operational rules | Both | High | Correctness | 4.2 | Product decision + server tests |
| P4-04 | Analytics | Fabricated USD metrics route → removed/isolated until authoritative | Both | High | Correctness | 4.2 | None |
| P4-05 | Owner errors | `toString()` surfaced → centralized safe copy | Both | High | Security/UX | 4.2 | Existing AppException |
| P4-06 | Owner onboarding | Empty prompt without complete setup journey → guided workspace/first vehicle | Individual | High | UX | 4.2 | Business mode contract |
| P4-07 | Fleet scale | Broad list/tabs → search/filter/state organization | Fleet | Medium | Performance/UX | 4.2 | Shared workspace context |
| P4-08 | Request status | Raw enum-derived copy → owner lifecycle presentation | Both | Medium | UX | 4.3 | Existing lifecycle |
| P4-09 | Request density | Core facts available but cards omit need/location detail | Both | Medium | UX | 4.3 | Existing snapshots |
| P4-10 | Pricing clarity | Form works but summary weak → configured state and renter impact | Both | Medium | UX | 4.2 | Policy V1 |
| P4-11 | Team UI | Roles exist but no membership management → classify/defer | Fleet | Medium | Deferred product | Later | Invitation/security design |
| P4-12 | Responsive tests | Sparse operator coverage → 320/390/600/200% tests | Both | Medium | UX | 4.2–4.3 | Test fixtures |
| P4-13 | Terminology | Listing/marketplace/customer residue → rental-first owner copy | Both | Low | Terminology | 4.2–4.3 | No API rename |
| P4-14 | Pagination | Whole collections → bounded pagination when scale demands | Fleet | Medium | Performance | 4.4 or later | API contract |
| P4-15 | Subscriptions | No enforcement → workspace-level future architecture | Both | Deferred | Deferred product | Phase 5 | Business model |

