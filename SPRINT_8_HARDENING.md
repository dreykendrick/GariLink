# Sprint 8 — Responsive, accessibility, and runtime hardening

## Scope and proof level

All 36 meaningful UI surfaces were re-audited by code. Automated stress coverage targets the highest-risk shared marketplace and status components at 320, 390, and 600 logical pixels, 150–200% text, missing imagery, extreme Tanzanian vehicle content, and a 100-record test fixture. No physical frame-rate or memory claim is made.

## Responsive matrix

| Surface | 320px | Standard | Wide | 150% text | Result |
| --- | --- | --- | --- | --- | --- |
| Login | Code review | Existing flow test | Max-width audit | Code review | Keyboard scroll and wrapping actions hardened |
| OTP | Code review | Existing state tests | Max-width audit | Code review | Wrap, scroll and six-digit constraint retained |
| Home | Code review | Existing widget coverage | Code review | Code review | Lazy horizontal lists retained |
| Explore | Automated | Automated | Automated | Automated via card | Natural phone list; bounded wide grid |
| Vehicle card | Automated | Automated | Automated | Automated at 150% | Extreme title/location/price fits |
| Vehicle details | Existing widget test | Existing widget test | Code review | Code review | Sticky CTA and safe area retained |
| Rental request | Existing widget test | Existing widget test | Code review | Code review | Scroll body and inset-aware CTA retained |
| Rental detail | Existing widget test | Existing widget test | Code review | Code review | Wrapping metadata/actions retained |
| Seller dashboard | Code review | Existing owner tests | Code review | Code review | Lazy horizontal workspaces retained |
| Listing form | Code review | Existing owner tests | Code review | Code review | Scrollable form/controller disposal verified |
| Media manager | Existing widget test | Existing widget test | Code review | Code review | Scrollable controls and truthful progress retained |

## Accessibility matrix

| Area | Semantics | Touch target | Large text | Reduced motion | Remaining physical gate |
| --- | --- | --- | --- | --- | --- |
| Vehicle card/image | Named card, image, save | Material 48dp action | 320px/150% passed | Save/image respects setting | TalkBack nested traversal |
| Authentication | Named fields/actions | Text buttons replace gestures | Scroll/wrap hardened | Route motion collapses | TalkBack and OEM keyboard |
| Statuses | Label, icon, status meaning | Informational | 200% passed | Not motion-dependent | TalkBack announcement wording |
| Gallery | Image position and controls | Material icon buttons | Counter remains bounded | Optional motion collapses | Zoom/traversal on device |
| Media | Upload, retry, remove, cover labels | Material controls | Scrollable | State remains textual | Picker/OEM and TalkBack |
| Rentals | Named lifecycle actions/status | Material buttons | Wrapping actions | State remains textual | Live screen-reader order |

## Performance findings

| Area | Finding | Severity | Action |
| --- | --- | --- | --- |
| Marketplace layout | Phone feed forced 144px grid rows | P1 | Fixed with lazy naturally sized SliverList |
| Extreme pricing | Important digits could ellipsize | P1 | Fixed with two-line price policy |
| Marketplace dataset | Public search already bounded to 30 | None | Verified by code review |
| Saved/owner datasets | Endpoints are currently unpaginated | P2 | Documented for growth monitoring |
| Card image decode | Thumbnail decoded at bounded 720px width | None | Verified |
| Detail image decode | Detail image lacked decode bound | P2 | Fixed at 1440px cache width |
| Media thumbnail decode | 126px thumbnail could decode full image | P2 | Fixed at 320px cache width |
| Fullscreen gallery | Lazy PageView and disposed controller | None | Verified; full quality retained for zoom |
| Upload memory | Up to ten compressed byte arrays may coexist | P2 | Bounded by count/6MB each; profile physically |
| Search requests | 350ms timer cancellation plus value-equal query keys | None | Verified |
| Auth refresh | Concurrent refresh is coalesced | None | Existing regression coverage retained |
| Workspace selection | State field mutated during build | P2 | Fixed |
| Rental errors | Raw exception text reached users | P1 | Replaced with recoverable copy |
| Resource lifecycle | Controllers, timer, subscription disposed | None | Verified by static audit |

## Runtime and lifecycle review

- Marketplace queries are immutable and value-equal, limiting accidental family-provider duplication.
- Search timers cancel on replacement and disposal; stale providers cannot replace the current query's visible result.
- Primary Explore state uses keep-alive and page storage, preserving filters and scroll across tab switches.
- All located text, page, animation, debounce, OTP, and auth-subscription resources have disposal/cancellation paths.
- Async UI mutations use mounted/context-mounted checks in the reviewed auth, save, rental, profile, listing, and media paths.
- Startup performs required preferences/secure-session initialization and contains no artificial branding delay.
- Offline mode is not claimed. Failure UI supports retry and keeps layout stable.

## Image and memory review

Cards use bounded thumbnail decoding and cached network images. Detail imagery now requests a bounded decoded width. Media thumbnails request a small decoded width. Fullscreen zoom intentionally retains higher-resolution providers and uses a lazy PageView; its controller is disposed. Upload selection validates originals, strips EXIF during compression, enforces 10-photo and per-file limits, and reports real transferred-byte progress.

## Physical validation

PHYSICAL PERFORMANCE PROFILING: EXTERNALLY REQUIRED

Required evidence includes profile-mode startup, marketplace scroll, detail entry, gallery swipes, owner inventory, image-heavy memory pressure, lifecycle interruption, TalkBack, OEM keyboard behavior, network throttling, and reduced-motion behavior. The executable procedure is in `DEVICE_QA_CHECKLIST.md`.
