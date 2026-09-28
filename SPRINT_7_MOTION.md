# Sprint 7 — Motion, microinteractions, and perceived performance

## Motion inventory

The Sprint 6 inventory of 36 UI surfaces was reviewed against 21 recurring interaction patterns: peer navigation, forward navigation, modal presentation, card presses, button loading, save/unsave, Hero entry, gallery entry, gallery paging, image loading, skeleton replacement, pull-to-refresh, search debounce, filter selection, filter application, authentication progression, rental submission, rental lifecycle mutations, listing/media mutations, empty/error recovery, and success feedback.

High-value work focused on forward navigation, stable button state, optimistic save/rollback, photography transitions, gallery counters, real upload state, and authoritative mutation feedback. Platform-default sheet/dialog motion and Material ripple behavior were retained because custom replacements would add complexity without improving comprehension. Decorative dashboard, looping, bounce, particle, blur, and demo-only animation were classified as unnecessary.

## Motion system

- Four durations: instant 80 ms, short 160 ms, standard 240 ms, emphasized 360 ms.
- Three curves: immediate feedback, standard ease-in/out cubic, and emphasized fast-out/slow-in.
- All new implicit and route motion resolves to zero duration when `MediaQuery.disableAnimations` is active.
- Peer bottom-navigation destinations remain transition-free to preserve immediacy and tab state.
- Forward auth, vehicle, saved-listing, and rental task routes share a subtle 3.5% horizontal movement plus fade.
- Existing Hero tags remain stable and photography remains the only cross-screen Hero content.

## Interaction changes

- Shared buttons keep label and dimensions stable while the leading icon transitions to truthful loading state.
- Marketplace and detail save actions update optimistically, acknowledge selection with restrained haptics, block duplicates, and roll back on repository failure.
- Vehicle images use short cache-image fade-in and instant placeholder fade-out, both disabled under reduced-motion settings.
- Gallery counters transition without moving the surrounding badge; page and zoom physics remain native.
- Media cover selection updates immediately, then confirms with haptic and inline copy only after repository success; failure restores the previous order.
- Upload progress continues to represent actual transferred bytes and is never simulated.
- Dialog and bottom-sheet motion remains platform appropriate and consistent through the Sprint 6 theme.

## Performance and accessibility

Only transform and opacity transitions were introduced. There are no new blur filters, continuously running controllers, particle effects, artificial delays, or large repaint animations. All animation remains supplementary to text, icons, loading indicators, status labels, and live-region feedback.

Physical-device validation remains required for frame pacing on low-end Android hardware, OEM reduced-motion behavior, haptic intensity, TalkBack announcements during optimistic save/rollback, and Hero geometry with real remote images.
