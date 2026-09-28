# Sprint 4 — Complete rental experience

Completed 2026-09-12.

## Architecture

Rental truth remains in Supabase. `gl_rentals` stores immutable daily-rate and total snapshots. Security-definer RPCs derive the customer from the verified JWT, scope owner actions to a writable workspace, lock rows during transitions, and use a PostgreSQL exclusion constraint to prevent overlapping approved/ready/active rentals.

## Customer journey

Hire-only listings lead to a date-based request flow. Past and invalid ranges are blocked, rate/day/total are shown without invented fees, and the interface explains that availability is finalized by owner approval. A stable request UUID makes an unchanged timeout retry idempotent. Only an authoritative response opens the confirmation, which explicitly says the request is not yet approved. My Rentals provides categorized history, details, status meaning, captured price, notes, rejection reason, and confirmed cancellation.

## Owner journey

The workspace-scoped inbox prioritizes pending requests and separates approved, in-progress, and closed records. Cards open a complete request view with vehicle, customer, dates, total and status. Approval now requires a contextual confirmation. Rejection requires a reason. Ready, start and complete actions follow the backend lifecycle. Successful actions and failed stale actions trigger targeted provider invalidation.

## Safety and privacy

- Pending requests may overlap; a second overlapping approval fails atomically.
- Repeated target transitions are idempotent only where the RPC explicitly permits them; stale/invalid transitions return a sanitized conflict.
- Customer cancellation is path-scoped and server-authorized.
- Owner APIs expose only transaction-required customer name and phone; no tokens, auth metadata, unrelated profile data, or private workspace metadata.
- Customer responses do not include owner membership or private workspace records.

## Evidence

- Flutter analyzer: PASS, no issues.
- Flutter tests: PASS, 46/46 (5 dedicated rental experience tests).
- Supabase API tests: PASS, 46/46 (6 rental route/security tests plus SQL assertion source).
- Fresh debug APK: PASS, 183,249,154 bytes.
- SHA-256: `B1CF529673A443DC827814633B1CB5E22107FB4983F17FB9BD4813F3F80C9AE7`.

## External gates

Physical-device calendar, small-screen and TalkBack checks remain release QA. Local SQL assertions remain blocked until the isolated PostgreSQL service is available or the hosted database password is supplied; the assertion suite covers snapshots, idempotency, ownership, overlap rejection and lifecycle transitions.
