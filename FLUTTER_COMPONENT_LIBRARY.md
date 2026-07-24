# GariLink Reusable UI Component Library

This guide documents the design system and reusable widgets available in `lib/shared/widgets/`. These widgets must be used throughout the application to maintain design consistency and speed up screen development.

## 1. Reusable Widgets

### AppButton
An animated button supporting primary, secondary, loading, and disabled states.
*   **Path**: [app_button.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/app_button.dart)
*   **Parameters**:
    *   `text` (`String`): Button label.
    *   `onPressed` (`VoidCallback?`): Tap callback; if null, disables the button.
    *   `variant` (`AppButtonVariant`): `primary` (blue bg), `secondary` (grey bg), or `outline` (transparent).
    *   `isLoading` (`bool`): Replaces label with a spinner.
    *   `icon` (`IconData?`): Custom icon displayed to the left of the label.

### AppTextField
Custom styled input fields with form validation and password visibility toggle.
*   **Path**: [app_text_field.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/app_text_field.dart)
*   **Parameters**:
    *   `labelText` (`String`): Field header label.
    *   `hintText` (`String?`): Placeholder input prompt.
    *   `controller` (`TextEditingController?`): Form controller.
    *   `validator` (`String? Function(String?)?`): Input validator logic.
    *   `isPassword` (`bool`): Toggles obfuscation eye toggler.

### AppCard
Elevated or flat borders layout container aligning elements cleanly.
*   **Path**: [app_card.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/app_card.dart)
*   **Parameters**:
    *   `child` (`Widget`): Nested child element.
    *   `padding` (`EdgeInsetsGeometry?`): Outer margin padding (defaults to 16).
    *   `backgroundColor` (`Color?`): Container background color override.
    *   `onTap` (`VoidCallback?`): Tap interaction callback.

### StatusBadge
Colored label reflecting standard lifecycle status values.
*   **Path**: [status_badge.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/status_badge.dart)
*   **Color Rules**:
    *   `success` (Green): `ACTIVE`, `APPROVED`, `COMPLETED`, `AVAILABLE`.
    *   `warning` (Amber): `PENDING`, `DRAFT`, `PAUSED`.
    *   `error` (Red): `REJECTED`, `CANCELLED`, `REVOKED`, `SUSPENDED`.

### AppLoading & AppSkeleton
Skeletons and loading indicators.
*   **Path**: [app_loading.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/app_loading.dart) and [app_skeleton.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/app_skeleton.dart)
*   `AppSkeleton.cardList()` provides a default vertical lists shimmer representation for listing details or request feeds.

### Avatar
Standard user circular avatar with fallback support.
*   **Path**: [avatar.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/avatar.dart)
*   **Fallback**: Displays initials fallback characters inside a primary-themed circle if the image fails to load or is null.

### EmptyState & ErrorState
Placeholders for empty or failed data states.
*   **Path**: [empty_state.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/empty_state.dart) and [error_state.dart](file:///C:/Users/kibaj/.gemini/antigravity/scratch/GariLink/mobile_flutter/lib/shared/widgets/error_state.dart)
*   `ErrorState` includes a centered "Try Again" outline button with retry callback handler.
