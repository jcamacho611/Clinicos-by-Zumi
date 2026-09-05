# Legal Access Foundation Verification — 2026-08-18

Status: engineering evidence only; not legal approval and not production deployment evidence.

## Repository evidence

PR #170 implements the first signed protected-access agreement foundation. `LEGAL_GATE_ENFORCEMENT_ENABLED` remains disabled by default. The final contracting entity, governing law, and forum remain explicit configuration/counsel gates.

The branch has been re-anchored onto current main as concurrent non-overlapping work landed. At the latest recorded re-anchor, main was `2eaf4e9287cee7e40a035aec632c24fd4ade5fc3` and the branch was behind main by zero commits. Re-check this before merge because main can continue moving.

## GitHub Actions truth

As of 2026-08-18, exact-head GitHub Actions runs were rejected before runner startup: both `verify` and
`deploy-contract` returned `steps: null` and no job logs. No executable CI pass is claimed from those
runs. **Correction, 2026-09-05:** that condition is resolved — Actions allocates runners and executes
jobs to completion (401 `main` runs and 2,464 total; the eight most recent `main` runs all succeeded).
This paragraph describes the August 2026 state of those specific runs, not current CI capability.

## Disposable Neon validation

A temporary child branch of the ClinicOS Production Neon project was created solely to validate the forward-only legal evidence migration. The LWA project was not used or modified.

The migration successfully created/extended:

- `legal_agreement_versions`
- `legal_agreement_events`
- `access_gate_acceptances`

The expected legal evidence columns and indexes were verified, including the active user + organization + agreement-version uniqueness boundary and idempotency-key uniqueness.

Synthetic non-PHI evidence then verified:

- exactly one synthetic agreement version could be registered;
- duplicate idempotency evidence remained one acceptance;
- duplicate active acceptance for the same user + organization + agreement version remained one acceptance;
- the same synthetic signer could separately execute the same agreement version for a second organization;
- a legal agreement event could be recorded.

The disposable branch was deleted after verification. No migration was applied to the production branch.

## Source-level hardening after database validation

The source-level adversarial review additionally corrected:

- a stale runtime reference to a nonexistent `verifiedEmailAt` database column;
- organization binding in idempotency validation;
- race-safe agreement-version registration;
- race-safe/idempotent final acceptance;
- atomic signature/acceptance legal-event creation;
- explicit same-origin checks for legal review/signature POST endpoints;
- duplicate event creation on replay/retry.

## Remaining merge gate

Do not enable production legal enforcement until executable repository CI (or an equivalent trusted local build/test run) has actually run, the migration is deployed, controlled persistent accounts complete the unsigned → review → sign → access journey, signed PDF/hash retrieval is verified, and the factual legal configuration has been approved.
