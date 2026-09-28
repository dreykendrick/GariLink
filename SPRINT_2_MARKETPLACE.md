# Sprint 2 marketplace showcase

## Audit findings

The previous feed used real listing data, but its location, price, body-style,
and filter controls were decorative. Sort was not interactive, prices were
rendered inconsistently, a heart icon had no behavior, Home and Explore
duplicated card implementations, and details rendered absent specifications as
N/A. Loading was dominated by spinners and the feed did not preserve its
scroll state deliberately.

## Implemented architecture

MarketplaceQuery is the immutable, value-equal contract shared by Riverpod
search state and the repository. It contains only filters supported by the
hosted RPC: query, sale/hire type, county, price range, transmission, fuel,
pagination, and authoritative sort. Search is debounced by 350 milliseconds.

The hosted garilink_search_listings RPC now validates every input, searches
listing and vehicle identity fields, filters vehicle specifications, and applies
stable server-side sorting for newest, price, model year, and mileage. Public
visibility continues to be enforced before filtering.

Home and Explore use one real-data VehicleCard. It provides a bounded cached
cover image, sale/hire label, title, location, year, mileage, consistently
formatted price, press feedback, semantics, missing-media fallback, and a
stable Hero tag. Explore uses a one- or two-column lazy grid depending on width,
retains scroll/search state, supports pull-to-refresh, and has skeleton,
contextual empty, and recoverable error states.

Saved vehicles use the existing database/RPC domain. Save and unsave are
explicit operations, optimistic changes roll back on failure, and authenticated
users have a real Saved Vehicles screen linked from Profile. Anonymous save
attempts lead to sign-in.

Vehicle details now use the shared price and value formatters, hide absent
optional data, present specifications as responsive cards, show genuine
workspace identity and verification, integrate the gallery Hero transition,
offer functional saved state, and expose rental booking only for hire listings.

## Privacy and performance

Marketplace API responses remove private Storage paths after generating
one-hour signed URLs. Unknown filters are rejected before reaching PostgreSQL.
The feed uses lazy slivers, bounded image decode caching, stable card dimensions,
debounced calls, value-equal provider keys, and retained scroll state.

## Validation snapshot — 2026-09-12

- Hosted marketplace migration: applied successfully.
- Edge Function: deployed successfully.
- Hosted supported search/sort: HTTP 200.
- Hosted unsupported sort: HTTP 400.
- Flutter formatting: 80 files.
- Flutter analyzer: no issues.
- Flutter tests: 41/41.
- Supabase Edge Function tests: 43/43.
- Fresh debug APK: PASS, 174.74 MiB, SHA-256
  8F354D111454843A8E2B61CCB8ACE4ECAF6322216BAA67813B4ED32849D657E9.
- Physical-device visual, performance, and TalkBack review remains in the
  release QA backlog.
