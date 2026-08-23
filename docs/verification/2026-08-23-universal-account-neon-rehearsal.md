# Universal Account Phase 2 — Isolated Neon Migration Rehearsal

Date: 2026-08-23
Status: `ISOLATED PRODUCTION-SHAPED DATABASE EVIDENCE — NOT PRODUCTION DEPLOYMENT`

## Purpose

Verify the additive lifelong identity and Universal Account migrations against a branch cloned from the current production-shaped Neon database without modifying production.

This evidence does not replace Prisma generate/validate, the full fresh migration chain, TypeScript, lint, automated tests, security negatives, build/start smoke, or controlled production rollout proof.

## Environment

- Neon project: `ClinicOS Production` (`autumn-resonance-23654315`)
- Parent branch: `br-ancient-term-atolp7vw`
- Temporary verification branch: `verify-account-phase2-20260823` (`br-rapid-cell-ato3dabp`)
- Production parent was not modified.

## Migration order exercised

1. `20260823023000_universal_identity_foundation`
2. `20260823190000_universal_account_foundation`

The SQL statements represented by those migrations were applied only to the temporary verification branch.

## Row reconciliation results

| Check | Result |
| --- | ---: |
| Legacy users | 5 |
| People | 5 |
| Organization memberships | 5 |
| Accounts | 5 |
| Legacy user → Account links | 5 |
| Legacy credentials | 5 |
| Account credentials | 5 |
| Account backfill events | 5 |
| Orphan memberships | 0 |
| Orphan Accounts | 0 |
| Orphan legacy links | 0 |
| Orphan Account credentials | 0 |
| Person/Account/email identity mismatches | 0 |
| Credential/security-state mismatches | 0 |

Credential equivalence check compared the persisted password hash plus password-changed, must-reset, failed-attempt, and lock-until state. No plaintext credentials were read, reconstructed, logged, or committed.

## Structural checks

- Foreign keys across the new identity/account tables: 9
- Indexes across the new identity/account tables: 30
- Unique Account primary-email index: present
- Unique legacy-user Account-link index: present
- Unique acceptance-binding index: present

The acceptance-binding uniqueness constraint is part of replay/idempotency safety: one protected-entry acceptance cannot be attached to multiple Account identities.

## Authority conclusions

This rehearsal proves the migrations can preserve the current five legacy staff identities and credential state on the cloned production shape while adding the new Person/Account substrate.

It does **not** authorize Account-based Clinic OS access. During Phase 2:

- legacy clinic authentication remains first-authority;
- free-member Account authentication is organization-agnostic;
- copied clinic credentials are migration-equivalence evidence and are excluded from the free-member fallback rail;
- an Account with any legacy clinic link may not downgrade into member authentication;
- member sessions fail closed if a clinic legacy link later appears;
- patient portal authentication remains separately governed;
- free-member signup remains feature-flagged off by default.

## Remaining release gates

The exact reconciled head still requires executable Prisma generate/validate, full fresh migration-chain execution, `verify:account-compatibility`, type-check, lint, focused/full tests, authorization/security negative tests, production build/start/health smoke, and controlled signup/login proof before rollout or merge-ready status.

GitHub Actions failures that occur before checkout with `steps:null` are infrastructure failures and are not code verification evidence.
