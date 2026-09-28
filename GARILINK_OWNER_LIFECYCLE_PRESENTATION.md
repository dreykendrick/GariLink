# GariLink Owner Lifecycle Presentation

This mapping is presentation only. It does not define or authorize server transitions.

| Backend state | Owner title | Explanation / next step | Presented action | Terminal | Renter-language difference |
|---|---|---|---|---:|---|
| `REQUESTED` | New rental request | Review dates and requirements, then decide | Accept / Decline | No | Owner acts; renter waits |
| `UNDER_REVIEW` | Request under review | The request is waiting for an operator decision | Accept / Decline | No | Owner decides; renter awaits decision |
| `APPROVED` | Request accepted | Dates are reserved; prepare the vehicle | Mark ready for pickup | No | Renter is told the owner accepted |
| `READY_FOR_PICKUP` | Vehicle ready for pickup | Start only when handover occurs | Start rental | No | Renter is given pickup guidance |
| `ACTIVE` | Rental in progress | Complete after vehicle return | Complete rental | No | Renter is given return guidance |
| `COMPLETED` | Rental completed | Retained as history | None | Yes | Both see completed history |
| `REJECTED` | Request declined | Cannot progress | None | Yes | Renter is guided to other vehicles |
| `CANCELLED` | Request cancelled | Customer cancellation is recorded | None | Yes | Renter may create a new request |
| Unknown | Status unavailable | Refresh before acting | None | Safe fallback | No raw enum is shown |

The centralized implementation is `ownerRentalStatusPresentation`. It supplies label, title, explanation, next step, semantic color/icon, queue group, and presentation action. The backend remains authoritative for every transition, conflict, role, and workspace check.

