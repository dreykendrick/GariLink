# GariLink Vehicle Availability Policy V1

## Independent states

Publication (`DRAFT`, `PUBLISHED`, `PAUSED`, `ARCHIVED`) determines public discovery. Manual availability (`AVAILABLE`, `BUSY`, `UNAVAILABLE`, `MAINTENANCE`) expresses current operator intent. Rental lifecycle does not overwrite manual availability.

## Requestability rule

A vehicle is requestable only when every existing eligibility condition passes, manual availability is `AVAILABLE`, and it has no committed rental in `APPROVED`, `READY_FOR_PICKUP`, or `ACTIVE`.

This resolves the identified contradiction: manual `AVAILABLE` plus a committed rental is still not requestable. The response includes `blockedByCommittedRental` so clients can explain the authoritative reason. A committed rental does not silently replace `UNAVAILABLE` or `MAINTENANCE`, and completion does not blindly restore `AVAILABLE`; the owner must make that operational decision.

Future date-aware multi-booking may refine the coarse committed-rental guard. Policy V1 deliberately prioritizes truthful launch behavior over accepting potentially conflicting requests.

## Security

Availability mutation remains an authenticated, workspace-authorized vehicle update. Flutter selection is not an authorization boundary.

