# Production Migration Reconciliation — 2026-08-23

Status: **APPROVED CONTROLLED PRODUCTION RECONCILIATION**

## Scope

This change intentionally contains no application code or schema change. Its merge is the controlled deployment trigger for the repository's existing Prisma production path after the pending migration set was proven against a disposable Neon branch cloned from current production shape.

Approved pending migrations:

1. `20260823023000_universal_identity_foundation`
2. `20260823043800_edu_workforce_delivery_evidence`
3. `20260823053000_edu_knowledge_assessment_evidence`

## Pre-deployment evidence

Production read-only inspection established:

- all three names were absent from `_prisma_migrations`;
- identity tables were absent;
- the EDU workforce and knowledge-assessment tables already existed physically from prior controlled work;
- the inspected EDU columns, constraints, and indexes matched the committed migration definitions;
- there were no unfinished Prisma migrations;
- the historical Grid migration failure was rolled back and subsequently applied successfully.

A disposable Neon child branch of production was used to replay the exact sequence in repository order.

Identity replay produced:

- 5 existing users;
- 5 people;
- 5 organization memberships;
- 0 location assignments;
- 0 inferred legal names;
- 0 orphan memberships;
- 0 orphan assignments;
- 0 organization mismatches;
- 2 expected identity foreign keys;
- 9 expected identity indexes.

The two EDU migrations then replayed cleanly against the existing physical EDU structures. Post-run verification showed no EDU row changes, with 36 expected EDU constraints and 14 expected EDU indexes present.

The disposable proof branch was deleted after verification.

## Deployment intent

At this point in repository history, Render's production build contract compiles the exact application candidate first and only then runs `prisma migrate deploy`. This merge is intentionally used once to let Prisma apply and record the approved pending migrations through the normal migration engine.

If the production build fails, Prisma migration deployment is not reached and the prior live release remains authoritative.

After production migration history is verified clean, PR #290 is intended to remove automatic production migration deployment from ordinary Render builds and replace it with an explicit migration-approval boundary.

## Non-permissions

This approval does not authorize destructive schema resets, `db push`, manual insertion into `_prisma_migrations`, migration deletion, or unrelated production data mutation.
