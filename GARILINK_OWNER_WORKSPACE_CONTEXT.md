# GariLink Owner Workspace Context

## Authority and model

`operatorWorkspaceContextProvider` is the single Flutter owner-context source. It loads only workspaces returned by the authenticated `/workspaces` contract, exposes the available list and one selected `OperatorWorkspace`, and never grants authorization. PostgreSQL RPCs, `workspace_access`, RLS, and Storage policies remain authoritative for every read and mutation.

`WorkspaceBusinessMode` is typed as `individual`, `fleet`, or `unknown`. The backend emits `businessMode`; an unknown future value produces neutral “Owner workspace” presentation and never crashes or elevates access.

## Initialization

- Zero authorized workspaces: no selection; Owner Home displays setup guidance.
- One workspace: selected automatically.
- Multiple workspaces: the first authoritative API result is the deterministic fallback.
- A requested ID is accepted only while it remains in the authorized list; stale/removed IDs fall back safely.

The selected ID is session memory only. Sensitive workspace details are not persisted locally.

## Switching and async safety

Home, My Vehicles, and Rental Requests all consume the same selected context. Workspace collections use Riverpod families keyed by workspace ID. Switching A to B changes the provider identity read by the UI; a late A result remains cached only under A and cannot overwrite B. Mutations retain their server-authorized vehicle/listing/workspace paths.

`refreshOperatorWorkspace` invalidates workspaces, listings, selected workspace collections, and rental summaries deliberately. No polling is used.

## Contract

Migration `20260923000000_owner_workspace_context_and_availability_policy.sql` extends `garilink_private.workspace_json` with `businessMode` while preserving all prior fields and revocations.

