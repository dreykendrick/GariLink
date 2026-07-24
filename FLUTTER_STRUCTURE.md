# GariLink Flutter Directory Structure Guide

This guide details the directory structure, file organization rules, and module conventions for the GariLink Flutter codebase.

## 1. Top-Level Folder Layout

```text
lib/
  ├── core/             # Framework-wide shared utilities and singletons
  │     ├── errors/     # Exceptions and error mapping
  │     ├── navigation/ # GoRouter configurations and path mappings
  │     ├── services/   # Storage, APIs, configurations, and core singletons
  │     └── theme/      # Material Theme configurations and design tokens
  │
  ├── shared/           # Core elements shared across multiple features
  │     ├── domain/     # Core domain entities and value objects
  │     ├── data/       # Common database mappers or storage models
  │     └── widgets/    # Reusable custom UI components (AppButton, etc.)
  │
  └── features/         # Domain feature slices (Self-contained vertical directories)
        ├── authentication/
        ├── marketplace/
        ├── rentals/
        ├── vehicles/
        └── profile/
```

---

## 2. Feature Folder Slice Layout

Every vertical slice under `features/` must adhere to the following layer structure:

```text
feature_name/
  ├── domain/
  │     ├── entities/      # Pure Dart domain data structures
  │     ├── repositories/  # Repository interfaces (Contracts)
  │     └── usecases/      # Use-case business logic classes
  │
  ├── data/
  │     ├── datasources/   # Remote REST / Local DB clients
  │     ├── models/        # JSON serialization DTOs inheriting from entities
  │     └── repositories/  # Repositories implementing domain interfaces
  │
  └── presentation/
        ├── pages/         # Full page screens
        ├── providers/     # State managers, async notifiers, state classes
        └── widgets/       # Screen-specific modular widgets
```

---

## 3. Directory Conventions

1.  **Strict Isolation**: A feature slice must never import presentation widgets directly from another feature slice. It can only consume domain entities or share functionality via components placed in the `lib/shared/` directory.
2.  **DTO vs Entity**: Data sources and repositories must exclusively interact with `Models` (DTOs) for incoming and outgoing operations. Repository implementations are responsible for mapping Models to Entities before passing them up to Use-cases or Providers.
3.  **Snake Case**: All directories and file names must use snake_case formatting.
