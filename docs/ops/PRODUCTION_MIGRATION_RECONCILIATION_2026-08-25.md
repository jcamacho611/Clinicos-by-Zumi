# Production Migration Reconciliation — 2026-08-25

Status: **SUPERSEDED AS THE PRIMARY PATH — RETAINED AS THE FALLBACK AND AS THE RECORD OF
PRODUCTION STATE**

This runbook is written for a human operator with production database credentials. No
agent may execute it, and no agent may set `KLINIKOS_ALLOW_MIGRATION_DEPLOY` to force
the deploy past the gate.

## Update — what changed after this was written

Render no longer requires a human to apply these four migrations by hand. A governed
approval path now exists: `scripts/render-build.mjs` builds first, reads migration
status, and applies a pending migration automatically **only** when that migration
carries an approved, checksum-matched `production-release.json` and contains no
destructive SQL. Everything else still fails closed.

That path did not restore deploys on its own. Only one of the four pending migrations
carried an approval manifest, and the gate validates *every* pending migration before it
applies any, so it refused each build — production stayed on `43511f78`. All four
migrations are now approved and replay-safe, and
`tests/production-migration-policy.test.mjs` asserts approval coverage against the real
repository so a future pending migration cannot silently reintroduce the freeze.

**The normal path is now: merge to `main` → Render builds → approved additive migrations
apply → deploy.** Sections 3–7 below remain the correct procedure when a migration is
*not* eligible for automatic approval — anything destructive, anything altering an
existing table, or any state where §3's decision gate stops you. Section 2's pending set
and risk analysis remain the record of production state as observed on 2026-08-25, and
`prisma/migrations/production-baseline.json` records the last migration observed applied.

---

## 1. The problem

Production is serving commit `43511f78` (2026-08-23) and is **287 commits behind
`origin/main`** (`cdd425d8`). The live release predates the entire Living Home
redesign (#307) and every change merged since.

### Why deploys stopped

Render deploys on `autoDeployTrigger: commit`, independent of GitHub Actions, so the
broken CI is not the cause.

Commit `12ce20e4` (*"fix(release): stop Render from auto-applying production
migrations"*) replaced Render's automatic `prisma migrate deploy` with a **verify-only
gate** in `scripts/render-build.mjs`. On Render (`RENDER === "true"`) the build now:

1. runs `next build` — this succeeds
2. runs `prisma migrate status`
3. if status is non-zero, prints *"Render will not apply database migrations
   automatically…"* and exits non-zero
4. the deploy fails and Render continues serving the last good build

**That gate landed after the currently-live release.** Verified:
`git merge-base --is-ancestor 12ce20e4 43511f78` returns false. The running build
predates its own gate.

### Why it is a deadlock

The gate requires production migration history to be current before it will deploy,
but the only mechanism that *applied* migrations was the auto-deploy the gate removed.
Nothing can apply them through the normal path, so nothing can deploy.

`PRODUCTION_MIGRATION_RECONCILIATION_2026-08-23.md` anticipated exactly one
reconciliation merge to apply the first three migrations. That merge appears never to
have deployed before the gate closed behind it. The fourth migration is not covered by
that approval at all.

---

## 2. The pending migration set

| # | Migration | Lines | Covered by 08-23 approval? |
|---|---|---|---|
| 1 | `20260823023000_universal_identity_foundation` | 142 | Yes |
| 2 | `20260823043800_edu_workforce_delivery_evidence` | 104 | Yes |
| 3 | `20260823053000_edu_knowledge_assessment_evidence` | 39 | Yes |
| 4 | `20260823200000_body_map_persistence_v1` | 84 | **No — new approval required** |

### Risk assessment — verified by reading every statement

**All four migrations are purely additive. There are zero destructive operations.**

Verified counts of `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, `DELETE FROM`, and
`ALTER COLUMN … TYPE` across all four files: **0**.

| Statement type | Count | Notes |
|---|---|---|
| `CREATE TABLE` | 10 | All new tables |
| `CREATE INDEX` | 26 | Includes 2 unique |
| `CREATE TYPE` | 3 | Body-map enums |
| `ALTER TABLE` | 4 | **All `ADD CONSTRAINT … FOREIGN KEY`** |
| `INSERT` | 2 | Backfill, `ON CONFLICT (id) DO NOTHING` |

Tables created: `people`, `organization_memberships`, `location_assignments`,
`body_map_versions`, `body_map_findings`, plus the EDU tables.

**Critically:** all four `ALTER TABLE` statements add foreign keys to tables created
*within the same migration set*. **No pre-existing production table is modified.**

The two `INSERT` statements backfill from existing data (both contain `SELECT`) and
carry `ON CONFLICT ("id") DO NOTHING`, making them idempotent and safe to re-run.

**Risk classification: LOW.** Additive-only, no existing table altered, no data
destroyed, backfills idempotent.

### Known prior-state caveat

The 08-23 reconciliation recorded that the EDU workforce and knowledge-assessment
tables **already existed physically in production** from earlier controlled work, while
being absent from `_prisma_migrations`. If that is still true, migrations 2 and 3 may
fail on `CREATE TABLE` unless they are written `IF NOT EXISTS` or the history is
resolved as already-applied. **Step 3 below detects this before any write.**

---

## 3. Pre-flight — read-only, no writes

Run against production with a **read-only** connection if one is available.

```bash
# 1. Confirm which migrations Prisma considers pending.
DATABASE_URL="$PROD_READONLY_URL" npx prisma migrate status
```

```sql
-- 2. Confirm recorded migration history.
SELECT migration_name, finished_at, applied_steps_count, rolled_back_at
FROM   _prisma_migrations
ORDER  BY started_at DESC
LIMIT  20;

-- 3. Detect the physical-table-without-history condition described above.
SELECT table_name
FROM   information_schema.tables
WHERE  table_schema = 'public'
AND    table_name IN (
         'people','organization_memberships','location_assignments',
         'body_map_versions','body_map_findings'
       )
ORDER  BY table_name;

-- 4. Confirm no migration is stuck half-applied.
SELECT migration_name, started_at, finished_at
FROM   _prisma_migrations
WHERE  finished_at IS NULL;
```

**Decision gate:**

- Query 4 returns rows → **STOP.** A failed migration must be resolved deliberately
  before anything else. Do not proceed.
- Query 3 returns tables that query 2 shows no history for → the prior-state caveat
  applies. Resolve those specific migrations as already-applied
  (`prisma migrate resolve --applied <name>`) **only after** confirming column-by-column
  that the physical structure matches the committed migration. Do not guess.
- Otherwise → proceed to §4.

---

## 4a. Disposable-database proof — already performed

Performed on 2026-08-25 against a throwaway PostgreSQL 16 cluster, not production.

- `prisma migrate deploy` applied all 62 migrations from empty, including the four that
  are pending in production. **No errors.**
- `prisma migrate status` then reported *Database schema is up to date!*
- The identity migration was replayed a second time by hand to test the idempotency it
  was rewritten for. Every `CREATE` reported *already exists, skipping*, both guarded
  constraint blocks succeeded, and both backfills reported `INSERT 0 0`. **Zero errors.**
  That is the property that matters if production already holds some of these objects:
  the migration converges instead of failing mid-set and recording a failed migration.
- Orphan check on `organization_memberships` returned 0.

This does not replace §4 below. It proves the migration set is sound and replay-safe on
a real PostgreSQL; it says nothing about the *specific state of production*, which is
what §3 exists to establish. Run §3 and §4 against a copy of production before §5.

---

## 4. Disposable-branch proof — required before touching production

Do not apply to production first. Prove the exact sequence against a throwaway copy.

```bash
# Create a disposable branch of production (Neon branch, or restore a snapshot
# into a scratch database). Never point this at production itself.
export DISPOSABLE_URL="postgres://…/disposable_verify"

# Replay the exact repository sequence.
DATABASE_URL="$DISPOSABLE_URL" npx prisma migrate deploy

# Confirm the ledger is clean afterwards.
DATABASE_URL="$DISPOSABLE_URL" npx prisma migrate status
```

**Post-replay verification:**

```sql
-- Identity backfill sanity — compare against pre-replay counts.
SELECT (SELECT count(*) FROM users)                    AS users,
       (SELECT count(*) FROM people)                   AS people,
       (SELECT count(*) FROM organization_memberships) AS memberships,
       (SELECT count(*) FROM location_assignments)     AS assignments;

-- No orphans.
SELECT count(*) AS orphan_memberships
FROM   organization_memberships m
LEFT   JOIN people p ON p.id = m."personId"
WHERE  p.id IS NULL;

-- Body-map structures present.
SELECT count(*) AS body_map_constraints
FROM   information_schema.table_constraints
WHERE  table_name IN ('body_map_versions','body_map_findings');
```

**Pass condition:** `migrate status` reports history current, zero orphans, and no
row-count regression in any pre-existing table.

**Then delete the disposable branch.**

---

## 5. Production application

Only after §3 and §4 pass.

```bash
# Take or confirm a restorable backup / point-in-time recovery position FIRST.
# Record the exact timestamp and how to restore to it.

DATABASE_URL="$PROD_DIRECT_URL" npx prisma migrate deploy
DATABASE_URL="$PROD_READONLY_URL" npx prisma migrate status   # expect: up to date
```

Use the **direct** (non-pooled) connection for migration, not a pooled URL.

Expected runtime is short: these are `CREATE` statements on new tables plus index
builds, with no rewrite of any existing table. No extended lock on live tables is
expected, because no live table is altered.

---

## 6. Redeploy and verify

Once migration history is current, trigger a Render deploy of `origin/main`.

The build should now reach:

> `Klinikos production migration history is current. No database migration was executed by Render.`

and exit 0.

**Verification:**

```bash
curl -s https://www.klinikos.io/api/health | jq .
```

**Pass condition:** `release.commit` equals the deployed `origin/main` SHA, and
`status` is `ok`. Anything still reporting `43511f78` means the deploy did not
succeed — check the Render build log for the migration-status line.

Then smoke-test: homepage, login, Living Home, a clinic route, Grid, and the patient
portal.

---

## 7. Rollback position

Because the set is additive-only, application rollback is straightforward: the
previous release does not reference the new tables, so it continues to run against the
migrated database unchanged.

- **Application rollback:** redeploy the prior commit. Safe — old code ignores new
  tables.
- **Schema rollback:** not required, and not recommended. Dropping the new tables would
  destroy the identity backfill. Restore from the §5 recovery point only in the event
  of genuine corruption.

---

## 8. Follow-up — close the deadlock permanently

Applying these four migrations restores deploys **once**. The structural deadlock
remains: the next merged migration recreates it.

Options, in preference order:

1. **A reviewed migration workflow that runs outside the Render build** — a deliberate,
   human-triggered job that applies approved migrations, after which Render's verify-only
   gate passes naturally. This preserves the gate's intent (no silent auto-migration)
   without freezing the pipeline.
2. **A release checklist item** requiring migration reconciliation before merging any
   PR that adds a migration.

Do **not** resolve it by reverting to automatic migration on every Render build. The
gate exists for a real reason.

---

## 9. Non-permissions

This runbook does **not** authorize: destructive schema changes, `prisma db push`
against production, manual insertion into `_prisma_migrations`, migration file deletion,
seeding production, copying production data into a demo environment, or any data
mutation unrelated to these four migrations.

---

## 10. Evidence to record on completion

- pre-flight `migrate status` output
- disposable-branch replay result and verification query output
- backup / recovery point timestamp
- production `migrate deploy` output
- post-migration `migrate status` output
- `/api/health` before and after, showing the commit change
- smoke-test result
- operator name and completion timestamp
