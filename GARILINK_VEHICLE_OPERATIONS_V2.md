# GariLink Vehicle Operations V2

My Vehicles is scoped to the authoritative selected workspace. Fleet workspaces use “My fleet”; Individual and unknown modes use “My vehicles.” There is no unsafe “All workspaces” action scope.

Each vehicle card keeps publication and operational availability distinct and displays:

- vehicle image and identity
- category and availability
- Draft/Live/Paused/Archived publication presentation
- setup ready/incomplete state based on category and media
- pricing configured/unconfigured from Pricing Policy V1
- authoritative requestability
- photo, availability, edit, and publication actions

Card actions wrap on narrow screens. Media remains private/signed, exact operating location remains owner-private, and category/capability validation remains server authoritative. Create/edit forms retain the existing V2 draft, category-aware capability, location, pricing, and media architecture. Errors are mapped through `userFacingError`.

Collections currently load one workspace’s full inventory and filter publication tabs locally. This is bounded for current launch scale but server pagination remains a future large-fleet improvement. No per-card route or price-estimate calls, polling, or automatic gallery prefetch were added.

