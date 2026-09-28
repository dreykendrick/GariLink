# GariLink Phase 5 Handoff

Phase 4 provides a certified workspace foundation: accounts can operate zero or multiple workspaces; each workspace has an authoritative `INDIVIDUAL` or `FLEET` mode; vehicle ownership, publication, pricing, and rental actions are workspace-scoped and server-authorized.

Phase 5 may introduce `Workspace → Subscription → Plan → Entitlements`. Entitlements should be evaluated against the authoritative workspace, not cached UI selection or account-wide assumptions. Fleet and Individual may receive different plan presentation or limits while retaining the same tenancy and vehicle/rental foundations.

Critical separation:

**RENTAL PRICE ≠ OWNER SUBSCRIPTION PRICE**

**RENTER ↔ OWNER RENTAL PAYMENT ≠ OWNER ↔ GARILINK SUBSCRIPTION PAYMENT**

Pricing Policy V1 and rental estimate snapshots belong to the renter/vehicle transaction domain. Subscription price and entitlement history belong to the GariLink/workspace billing domain and must not mutate historical rentals.

Phase 5 must preserve server authorization, RLS, public privacy, signed media, publication readiness, committed-rental requestability, lifecycle transitions, idempotency, and safe error contracts. It must also define upgrade/downgrade timing, entitlement snapshots, grace states, retry/idempotency, webhook authority, and fail-closed behavior before enforcement.

External dependencies still requiring production work include live provider configuration, Android release signing/device QA, Beem production credentials, and crash monitoring. No subscription, checkout, payment, payout, wallet, refund, or entitlement implementation was added in Sprint 4.4.
