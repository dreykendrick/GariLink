# Architecture Decisions & Constraints (Phase 1 → Phase 2)

As GariLink transitions from Phase 1 (Foundation) to Phase 2, the following architectural decisions, assumptions, and constraints are **FROZEN** and must not be altered without explicit justification and impact analysis.

## 1. Immutable Architectural Decisions
- **Monolithic Bounded Contexts**: The backend is a NestJS monolith segmented strictly by Bounded Contexts (Modules). Direct module-to-module database queries are forbidden. Modules must communicate via domain services or exposed use cases.
- **Data Isolation via Workspaces**: The `Workspace` is the ultimate boundary of ownership. `User`s do not own `Vehicle`s directly; `User`s belong to a `Workspace`, and the `Workspace` owns the `Vehicle`. This enables seamless multi-tenancy for dealerships and organizations.
- **Asset Decoupling**: A `Vehicle` is a physical, long-lived asset. A `Listing` is a temporal marketplace representation of that vehicle. They must remain physically separate tables and domain aggregates. A Vehicle can exist without a Listing, but a Listing cannot exist without a Vehicle.
- **Clean Architecture Enforcement**: All business logic must reside in the `domain` (Entities/Value Objects) or `application` (Use Cases) layers. The `presentation` (Controllers) and `infrastructure` (Prisma Repositories) layers must remain strictly decoupled and ignorant of business rules.
- **Exception Handling**: Internal errors must never leak to the client. The `GlobalExceptionFilter` intercepts all domain `AppError` instances and converts them to safe HTTP responses.

## 2. Architectural Assumptions
- **Storage Strategy**: We assume the current `LocalMediaStorageProvider` will be seamlessly hot-swappable with an S3 implementation via the `IMediaStoragePort` before production. No local-storage-specific hacks should exist in the presentation layer.
- **Authentication**: JWT is the absolute source of truth for sessions. The `Session` entity in the database exists for revocation and audit purposes only; every API request must rely entirely on the stateless JWT payload for basic routing.

## 3. Known Technical Debt (Carried into Phase 2)
- **Database Seeding**: The `prisma/seed.ts` file was disabled (`seed.old.ts`) due to schema evolution. A robust seeding framework is required early in Phase 2 to unblock mobile UI testing.
- **Pagination Strategy**: The platform currently uses `skip`/`take` (OFFSET) pagination. This will eventually become a performance bottleneck on the `Vehicle` and `Listing` tables and must be migrated to Cursor-based pagination.
- **Frontend DRY Principles**: The React Native application currently uses inline `StyleSheet` objects heavily. A refactor into a strict UI component library (`/src/components`) is pending.
- **Search Capabilities**: `VehicleSearchAdapter` relies on PostgreSQL `LIKE` queries. For true marketplace performance, a dedicated search engine (Elasticsearch/Meilisearch) should eventually fulfill the `IVehicleSearchPort`.

## 4. Guidelines for Phase 2 Work
1. **Extend, Do Not Modify**: When adding new features (e.g., Rentals, Fleet Tracking), build *on top* of the existing `Vehicle` and `Workspace` domains. Do not alter their core schemas unless it is mathematically impossible to proceed otherwise.
2. **Strict Typings**: No `any` types. All DTOs must be strictly validated via `class-validator`.
3. **Keep Mobile Dumb**: The React Native app should handle presentation and user input only. All complex business logic (e.g., profile completion percentages, capability auto-approvals) must remain in the backend.
