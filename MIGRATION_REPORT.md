# GariLink Mobile Client Migration Report (Phase A)

This report details the accomplishments, packaging decisions, design principles, and risk analysis for Phase A of the GariLink mobile client migration from React Native to Flutter.

---

## 1. Accomplished Work (Phase A)

*   **Initialized Project**: Created the new Flutter application inside the `mobile_flutter` subfolder, targeting iOS and Android platforms with the package identifier `ke.co.garilink.app`.
*   **Established Core Layout**: Set up Clean Architecture directories covering `lib/core`, `lib/shared`, and `lib/features`.
*   **Design Tokens Porting**: Fully implemented colors, typography mappings, card border radiuses, spacing parameters, and shadow assets in `tokens.dart` and `app_theme.dart`.
*   **GoRouter Setup**: Created `app_router.dart` defining route paths, a custom shell router for bottom tab representation, and token redirect validation checks.
*   **API Client Implementations**: Implemented the custom `Dio` client `api_client.dart` containing request bearer token injection, automated JWT refresh via `/auth/refresh` on 401 response, connection timeouts, and domain exception mapping.
*   **Storage Wrapper**: Designed the secure storage service wrapping `flutter_secure_storage` and `shared_preferences`.
*   **Reusable Component Library**: Created 9 core design system widgets in `shared/widgets/` to ensure visual layout consistency and high code reuse.

---

## 2. Core Package Selection & Rationale

We selected the following package ecosystem for the GariLink Flutter client:

| Package | Purpose | Rationale |
| :--- | :--- | :--- |
| `flutter_riverpod` | State Management | Compile-safe, testable state management with provider overrides and dependency injection support. Bypasses the boilerplate of Bloc while being far safer than Provider or GetX. |
| `go_router` | Routing | Official Material-backed declarative routing. Supports ShellRoute nested tab routing and redirection guards out-of-the-box. |
| `dio` | HTTP Client | Powerful network helper supporting custom request/response interceptors, request queuing/retries, and progress listeners (crucial for silent JWT token refresh). |
| `flutter_secure_storage` | Local Keychain | Platform-secure hardware-backed credentials storage (Android Keystore, iOS Keychain) for storing sensitive access/refresh tokens. |
| `shared_preferences` | Local Preferences | Non-secure key-value storage for local user UI configurations and caching settings. |
| `google_fonts` | Typography | Imports the premium `Inter` font family dynamically, matching GariLink web aesthetics without inflating the initial asset payload. |
| `shimmer` | Skeleton Loader | Provides elegant shimmer loading placeholders. |
| `flutter_svg` | Vector Graphic Rendering | Renders SVG files natively, keeping asset bundle size extremely small. |

---

## 3. Migration Risk Assessment

### Mismatch in Keystore / Keychain Access
*   **Risk**: If the user has a prior React Native build installed on their device and upgrades to the Flutter build, `flutter_secure_storage` may fail to read credentials set by React Native's `expo-secure-store` due to namespace differences.
*   **Mitigation**: The auth store initialization catches storage exceptions, clears invalid data, and gracefully forces a logout/Welcome page redirect rather than crashing.

### Different Route Layout Namespaces
*   **Risk**: Expo Router ignores route group parenthesis (e.g. `(tabs)/explore` is mapped to `/explore`), while simple Flutter routers might fail on custom routes.
*   **Mitigation**: GoRouter has been configured with flat paths (`/explore`, `/manage`, `/saved`) to maintain route alignment with the backend redirects.

### Compilation Path / Memory Constraints
*   **Risk**: Low host system memory (7GB RAM) and limited C: drive disk space can cause build compilation failures.
*   **Mitigation**: Cleaned up the React Native build caches to recover C: drive space, and limited compiler concurrency where necessary.
