# GariLink Android device QA checklist

Record device model, Android version, app build/version, network type, date, and
PASS/FAIL evidence for every row. Use test accounts and redact secrets.

## Clean install and authentication

- [ ] Clean install opens splash once, then onboarding without blank frames.
- [ ] Back/skip/next work at 320dp width and 1.0x, 1.5x, and 2.0x text scale.
- [ ] Register with `07XXXXXXXX`, `2557XXXXXXXX`, and `+2557XXXXXXXX` inputs.
- [ ] Invalid, expired, reused, and incorrect OTPs show recoverable messages.
- [ ] Resend is unavailable during the 60-second cooldown and rate limits are clear.
- [ ] Background/kill/relaunch on OTP screen restores the pending phone safely.
- [ ] Login shows the registered name, not the phone number, after success.
- [ ] Airplane mode, slow network, and backend timeout stop loading and allow retry.
- [ ] Logout clears access to protected routes; relaunch stays signed out.
- [ ] Login again and relaunch restore the correct account without cross-account data.

## Marketplace and owner workflow

- [ ] Search loading, populated, empty, error, retry, and detail navigation work.
- [ ] Broken/missing vehicle images show a stable fallback without layout shift.
- [ ] Profile edit persists after refresh and relaunch.
- [ ] Create the first workspace and private vehicle draft; duplicate taps create once.
- [ ] Validation survives keyboard open/close and rotation; fields remain after failure.
- [ ] Owner inventory refreshes and never shows another workspace's records.
- [ ] Publish/pause/archive states update and remain correct after relaunch.
- [ ] When media is enabled: select, compress, upload, retry, reorder, replace, delete.
- [ ] When rentals are enabled: submit, conflict, cancel, approve/reject, ready/start/
      complete, and verify overlapping confirmed dates are impossible.

## Accessibility, layout, and performance

- [ ] TalkBack announces every icon-only control, field error, loading state, and result.
- [ ] Touch targets are usable; focus order follows visual order.
- [ ] No clipping/overflow at 320x568, 360x800, 412x915, and landscape.
- [ ] Bottom navigation/FAB never covers content or keyboard actions.
- [ ] Contrast is readable in the supported theme and disabled state is not color-only.
- [ ] Cold start, first search, scrolling, image loading, and navigation feel responsive.
- [ ] No repeated network calls occur while a screen remains idle.
- [ ] No phone, OTP, token, password, or provider credential appears in release logs.

## Sprint 8 device matrix

Run the complete buyer journey and the complete owner journey on each row. Record
the device model, Android version, RAM class, display/font scaling, build SHA-256,
and a short screen recording or timestamped PASS/FAIL note.

- [ ] Small phone: approximately 320dp wide; test 1.0x, 1.5x, and 2.0x font.
- [ ] Standard phone: 360–390dp wide; test default and largest practical font.
- [ ] Wide/high-density phone: 412dp or wider; test display scaling and gesture nav.
- [ ] Lower/mid-range device: profile build; record startup, a 100-item marketplace
      scroll, detail opening, five gallery swipes, inventory scroll, and memory warnings.

For every device verify login, OTP/resend, Home, Explore/search/filter, a long vehicle
card, vehicle detail/gallery, save/rollback, rental request/detail, seller dashboard,
listing form, and media manager. Open the keyboard on every form, focus the last field,
submit a long validation error, and confirm the CTA/error can be reached without manual
keyboard dismissal.

## Sprint 8 accessibility matrix

- [ ] TalkBack: traverse each critical flow without touch exploration; record duplicate,
      missing, ambiguous, or out-of-order announcements.
- [ ] Confirm vehicle images, favorite state, gallery position, rental/listing status,
      upload failure, retry, cover selection, icon-only actions, and loading are announced.
- [ ] Enable Remove animations and confirm optional transitions collapse while every
      state change remains understandable.
- [ ] At 200% font and increased display size, confirm no price digit, rental total,
      primary action, status meaning, OTP control, or dialog action is lost.

## Sprint 8 connectivity and interruption matrix

- [ ] Wi-Fi baseline: complete buyer and owner showcase journeys.
- [ ] Mobile data: repeat search, save, rental request, and one media upload.
- [ ] Throttled/weak network: verify retained context, truthful progress, timeout copy,
      retry, stable image placeholders, and no duplicate mutation.
- [ ] Connection loss/recovery: interrupt search, save, rental request, and upload;
      ensure no false success and retry succeeds once connectivity returns.
- [ ] Background/resume during OTP cooldown, search, save, rental submission, and upload;
      confirm no stale navigation, cross-account data, or post-dispose UI update.
- [ ] Force-stop/relaunch with a valid session, expired session, pending verification,
      and signed-out state; confirm routing remains correct without login flicker.

## Release artifact

- [ ] Install the production-signed release build from a clean state.
- [ ] Verify package `ke.co.garilink.garilink_mobile`, version code, icon, and label.
- [ ] Verify the certificate fingerprint matches the backed-up release/upload identity.
- [ ] Repeat the critical auth, search, owner, and logout journeys on the release build.
- [ ] Confirm the signed build connects only to the production HTTPS API and contains no
      localhost, emulator-host, test OTP, mock-data, or internal diagnostic behavior.
- [ ] Verify an upgrade from the last distributed build preserves the expected session and
      user data; repeat clean install separately.
- [ ] Trigger one controlled non-sensitive monitoring event and verify environment, version,
      build number, and absence of PII/secrets before enabling rollout alerts.
- [ ] Verify the production health endpoint returns success and a request ID, then exercise
      a controlled authenticated request, real Beem OTP, signed vehicle image, and upload.
