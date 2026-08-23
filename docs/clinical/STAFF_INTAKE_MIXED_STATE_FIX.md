# Staff Intake Mixed-State Truth Fix

This stacked correction protects the governed Current Visit staff-intake handoff from hiding missing required evidence behind a provider-review escalation.

## Invariant

With the current handoff vocabulary:

- required evidence blockers produce `incomplete`;
- if no blockers exist and provider review is required, the handoff produces `needs_provider_review`;
- only a handoff with neither blockers nor escalations produces `ready`.

Provider-review escalation details remain preserved even when the overall handoff is incomplete.

This does not widen staff authority, grant provider authority to staff, persist new clinical state, or claim Current Visit intake completion.
