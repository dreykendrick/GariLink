# GariLink Phase 4 Feature Freeze

Effective 2026-09-27 after Sprint 4.4 certification.

The following contracts are frozen:

- selected-workspace context and server-side workspace authorization;
- authoritative `INDIVIDUAL` / `FLEET` business-mode semantics;
- Owner Home and My Vehicles/Fleet information architecture;
- V2 vehicle category, capabilities, media, location, and Pricing Policy V1 configuration;
- separate publication and manual operational-availability models;
- server-authoritative readiness, discovery, requestability, and committed-rental protection;
- workspace-scoped owner rental queue and lifecycle actions;
- renter/owner lifecycle convergence and immutable request/pricing snapshots;
- privacy, private Storage, signed-media, and safe-error boundaries.

Frozen does not prohibit defect, security, accessibility, or performance fixes. It means later phases must not casually fork, weaken, or redesign these contracts. Any intentional contract change requires explicit product scope, migration strategy, regression coverage, and renter/owner compatibility review.

Phase 5 functionality is not present in this freeze.
