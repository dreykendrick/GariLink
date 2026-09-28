# GariLink Sprint 2.3 Certification

## Scope and result

Sprint 2.3 implements authoritative Rental Price Estimate V1 and immutable rental price snapshots. Provider-independent engineering is complete. Live route-dependent activation remains blocked because `GOOGLE_ROUTES_API_KEY` is not configured; no live Google evidence is claimed and Sprint 2.2 remains incomplete.

## Production changes

- Applied hosted migration `20260922030000_rental_price_estimate_v1.sql` to `yvcdkmsfuakjflmuatgz` through `supabase db push --linked`.
- Deployed only the `garilink-api` Edge Function with the matching estimate orchestration; hosted version **19** is `ACTIVE`.
- Hosted health returned HTTP **200** with the expected Supabase backend status.
- Migration history confirms local and remote `20260922030000` are aligned.
- No NestJS deployment, database reset, auth bypass, or secret exposure occurred.

## Domain certification

| Area | Evidence | Result |
| --- | --- | --- |
| Route-independent exact estimate | 3 days: base 25,000 + duration 240,000 = TZS 265,000 | PASS |
| Component breakdown | Base, duration, distance, minimum adjustment exact integers | PASS |
| Determinism | Repeated monetary output identical | PASS |
| Missing pricing | Explicit `PRICING_NOT_CONFIGURED`, no amount | PASS |
| Date boundary | 366 days accepted; 367 rejected | PASS |
| Client authority | Client totals and route distance rejected | PASS |
| Provider absent | `ROUTE_UNAVAILABLE`, no geodesic fallback or amount | PASS |
| Trusted RouteResult | Controlled 12,500 m produced exact TZS 283,750 | PASS |
| Atomic rental snapshot | Created rental stored exact TZS 265,000 snapshot | PASS |
| Snapshot immutability | Policy changed; renter and owner retained original amount | PASS |
| Idempotency | Exact retry returned original rental and snapshot | PASS |
| Current-policy preview | Later preview changed to TZS 295,000 without history rewrite | PASS |
| Legacy behavior | Legacy totals and nullable snapshots remain compatible | PASS |
| Sale exclusion | Public V2 discovery contained only `FOR_HIRE` | PASS |

Hosted estimate certification: **46 passed, 0 failed**.

## Security and privacy

- Estimate preview requires a valid Supabase/GariLink session.
- Public clients cannot invoke the authoritative calculation RPC.
- The Edge layer supplies the authenticated actor and the server-generated RouteResult.
- Listing visibility, ownership, and current requestability are rechecked by PostgreSQL.
- Public discovery continues to exclude owner-private data and rental snapshots.
- Credentials and sessions were never printed.

## Regression evidence

- Supabase/API: `npm test` — **94 passed, 0 failed, 0 skipped**.
- Sprint 2.2 provider-independent hosted routing: **9 passed, 0 failed**.
- Sprint 2.1 hosted pricing: **36 passed, 0 failed**.
- Sprint 2.3 hosted estimates: **46 passed, 0 failed**.
- Flutter focused pricing model: **6 passed, 0 failed**.
- Flutter formatter: clean, exit 0.
- Flutter analyzer: no issues, exit 0.
- Full Flutter suite: **111 passed, 0 failed, 0 skipped**, exit 0. The definitive run used `--concurrency=1` after the initial parallel runner stalled while compiling the next test file; the serial run completed every test file normally.

## Controlled fixture disposition

The certification rental was cancelled. Both controlled evaluation vehicles were paused after the run. The established distance-aware Phase 2 pricing policy was restored. Controlled accounts and non-secret certification evidence were retained for future team testing.

## Live-provider gates not claimed

- Secure Google Routes key configuration
- Sprint 2.2 live Google route proof
- Live pickup-to-destination distance entering Pricing V1
- Live route-dependent estimate
- Live route-dependent request-time snapshot

These are external activation gates, not replaced with synthetic production claims.
