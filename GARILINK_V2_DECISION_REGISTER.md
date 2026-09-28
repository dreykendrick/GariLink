# GariLink V2 Decision Register

## Confirmed

- GariLink is rental and transport access, not vehicle sales.
- Renters have free platform access; workspace subscription is the future owner
  monetization model.
- Rental settlement occurs outside GariLink.
- An account can rent and participate in owner/fleet workspaces.
- Individual owners and fleet operators are both first-class workspace users.
- Vehicle discovery must eventually account for suitability, availability and
  proximity; precise locations and contact data need protection.

## Recommended (requires confirmation)

- Preserve `gl_listings` internally during transition and evolve it into the
  discoverable rental profile rather than renaming tables immediately.
- Use publication state plus operational availability, not one overloaded enum.
- Use relational query-critical vehicle fields plus versioned category-specific
  JSONB capabilities.
- Add PostGIS only in a dedicated geospatial migration after privacy rules and
  query requirements are approved.
- Adopt `REQUESTED/ACCEPTED/ARRANGED/ACTIVE/COMPLETED` with rejection and
  cancellation branches; map existing states compatibility-first.
- Make subscriptions workspace-owned and all entitlement decisions server-side.
- Compute and snapshot estimates server-side; keep payment and settlement out
  of the platform ledger.

## Open

- Subscription plans, price, grace period and vehicle limits.
- Rental pricing formula, distance source, driver and minimum-charge rules.
- Supported categories, cargo constraints, vehicle documents and verification.
- Mandatory/optional driver and self-drive rules by category.
- Location storage precision, service-area method and disclosure timing.
- Scheduling horizon, cancellation, no-show and completion confirmation.
- Post-acceptance contact mechanism and retention/audit requirements.
- Fleet member role matrix and organization verification.
