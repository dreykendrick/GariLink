# Changelog

All notable changes to the GariLink project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-20
### Phase 1 - Foundation & Architecture Release

### Added
- **Monorepo Structure**: NestJS Backend and React Native (Expo) Mobile application initialized.
- **Clean Architecture & DDD Engine**: Implemented `shared/` kernel with `AggregateRoot`, `Entity`, `ValueObject`, and `Result` abstractions.
- **Database Schema**: Comprehensive Prisma models for users, sessions, workspaces, vehicles, marketplace listings, and verifications.
- **Identity Module**: Complete authentication flow including JWT handling, password hashing, active session management, and RBAC/ABAC capability mapping.
- **Workspace & Organization Modules**: Multi-tenant architecture allowing users to belong to multiple business workspaces with granular role-based permissions (`OWNER`, `MANAGER`, `STAFF`).
- **Vehicle Module**: Core asset domain completely decoupled from the marketplace. Handles specifications, location, tracking status, and lifecycle constraints.
- **Marketplace Module**: Consumer-facing listing domain for pricing, negotiation flags, and customer inquiries on available vehicles.
- **Media Module**: Extensible Ports and Adapters architecture for media storage. Included a functional local file storage provider.
- **Security Protocols**: Global Exception Filters to mask internal errors, advanced JWT Strategies, and strict `@RequireCapabilities` / `WorkspaceOwnershipGuard` endpoints.
- **Mobile Design System**: Theme tokens configured (Dark Mode) for colors, typography, and spacing.
- **Mobile Navigation**: Scaffolding for Expo Router including protected routes and tab navigation (`Home`, `Explore`, `Saved`, `Profile`).

### Changed
- Refactored `WorkspaceMember` status checking from loose booleans (`isActive`) to strict Enums (`status: 'ACTIVE' | 'SUSPENDED' | 'LEFT'`).
- Renamed the outdated `prisma/seed.ts` to `seed.old.ts` due to fundamental architectural shifts in the database schema.

### Security
- Passwords are strictly hashed via `bcrypt` before persistence.
- Complete isolation between tenant data enforced at the Database and Application layers via `workspaceId` relationship enforcement.
