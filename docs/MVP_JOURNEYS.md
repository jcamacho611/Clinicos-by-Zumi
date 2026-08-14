# MVP journeys

A journey is not a unit test. It runs real Klinikos repositories/services against a real PostgreSQL database with real sessions so authorization, tenant scoping, lifecycle rules, payment truth, and concurrency are exercised instead of mocked.

A passing journey means the exact behavior asserted was observed through the real persistence path. A failing journey means the implementation, test, assumption, documentation, or environment must be investigated before anything is weakened merely to make the check green.

## Why these exist

Journeys have found defects that ordinary tests did not expose, including:

- migrations that referenced Prisma model names instead of mapped PostgreSQL table names, making a fresh deploy impossible while unit tests stayed green;
- `SELECT pg_advisory_xact_lock(...)` being issued through a Prisma raw-query path that attempted to deserialize PostgreSQL `void`, preventing Grid reservations;
- an operations loop that resolved work without writing the expected audit record;
- PHI/sensitive redaction happening too late, after another Zumi consumer had already read the raw question;
- contention tests that initially refused both requests for an ordinary already-booked reason instead of actually proving the concurrency lock.

## Running the complete suite

Use a disposable PostgreSQL database.

```bash
export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/klinikos_mvp"
export DIRECT_DATABASE_URL="$DATABASE_URL"
export AUTH_SECRET="replace-with-any-32-plus-character-local-test-secret"

npm run test:mvp
```

The runner is `scripts/mvp/run-all.mjs`. It invokes each real journey through `tsx` with the server-only stub path required for running server modules outside a Next.js build. Do not globally alias `server-only` in the application tsconfig; that would weaken the real server/client boundary.

Each journey owns its fixtures, cleans up after itself where applicable, and exits non-zero on failure.

## Current automated journeys

The current runner executes **10** journeys in this order:

| Order | File | Proves |
| --- | --- | --- |
| 1 | `fresh-deploy-journey.ts` | An empty PostgreSQL database can receive every committed migration, the required tables exist, `migrate deploy` is idempotent, first real work succeeds, and restarted code can read persisted state. |
| 2 | `commercial-journey.mts` | Checkout/payment evidence and entitlement are separate facts; unverified evidence cannot activate service; verified evidence can be reconciled idempotently; browser-return truth is insufficient. |
| 3 | `activation-journey.mts` | A paid buyer can progress through verified commercial evidence, subscription/entitlement, organization provisioning, role/session setup, and first useful Klinikos entry without treating payment alone as authorization. |
| 4 | `operations-journey.mts` | Appointment/operational risk produces real work, no unavailable communication connector is falsely represented as having sent anything, human resolution closes the action, and the lifecycle is audited. |
| 5 | `grid-journey.mts` | Need → match/offer → acceptance → reservation → fulfillment/financial state respects eligibility and ownership; reservations cannot precede acceptance or be duplicated. |
| 6 | `grid-trust-journey.mts` | Disputes and safety incidents are distinct governed records, both can hold a reservation, duplicates/cross-tenant misuse are refused, and resolution language never invents payout/suspension facts. |
| 7 | `zumi-journey.ts` | Zumi degrades truthfully when a provider is unavailable; deterministic prohibitions and RBAC survive provider availability; founder breadth does not widen authorization; PHI does not cross an unapproved boundary; unevidenced governed recommendations are dropped. |
| 8 | `tenant-isolation-journey.mts` | Adversarial tenant A cannot read or mutate tenant B patient/list/audit/commercial/Grid state; tenant A cleanup does not damage tenant B. |
| 9 | `role-routing-journey.ts` | Owner/admin/front desk/provider/clinical/case/viewer/patient/Grid/student roles reach useful allowed surfaces while route guards/session audiences prevent privilege crossover. |
| 10 | `failure-recovery-journey.ts` | Retries, duplicate requests, interrupted flows, and simultaneous reservations fail safely; a scarce resource gets one winner; the loser leaves no partial state; an idempotent retry returns the same durable result. |

## What is not fully automated here

Production readiness is not a single journey because some facts live outside the repository: deployment host state, DNS/TLS, BAAs/contracts, external vendor credentials, real settlement/payouts, production monitoring, and independent browser/device behavior.

Browser/mobile QA is therefore still a separate release gate even though responsive code is covered by build/tests.

Likewise, a green journey does not establish regulatory compliance or that an external vendor connection is production-approved.

## Journey-writing rules

### 1. Do not allow a check that never exercised the thing it claims to prove

A Zumi PHI assertion once passed against zero provider payloads because the request was refused before egress. Assert that the measured event actually occurred. Report an inconclusive scenario rather than a false pass.

### 2. Beware duplicate module graphs

`tsx` can load `.mts` and imported `.ts` modules through different module graphs. A journey that mutates a module-level registry may need to live in `.ts` so the code under test observes the same registry instance.

### 3. A refusal for the wrong reason is not proof

Concurrency tests need fresh fixtures. Two failures caused by an already-booked resource do not prove locking or race safety.

### 4. Manual-but-truthful beats fake automation

If an external connector is not configured, the journey should prove a recoverable manual/Pending Connection state rather than mock a success and call it production behavior.

### 5. AI is not the source of deterministic state

Zumi may reason, draft, research, or recommend. Authentication, tenant, eligibility, credential, consent, payment, transaction, safety, and audit truth remain deterministic Klinikos state.

### 6. Do not weaken clinical-data retention just to simplify cleanup

No cascade-delete shortcut should be added merely for test convenience. Retention, archive, legal hold, export, anonymization, and deletion require explicit policy.

## Verification baseline

On 2026-08-14, the exact final Grid MVP candidate (`740721959cbd3aa180763ebc772580e14c076ad0`) passed **all ten journeys** together with Prisma generation/validation, **51/51 fresh PostgreSQL migrations**, TypeScript, lint, the automated test suite, production build, production startup smoke, and the exact deploy-contract. It merged into `main` as `4b2a5dc89f3dae7a175b2f8eda9f83f866b77de6`.

The exact final public Living Home candidate (`4f6d5f464f8ce85f15ce1a6ae9548105f058e950`) also passed the full Quality gate before merging as `2b570dd912633290f63cb7e412b56e3c7d107c7b`.

These checks prove the repository candidates. They do not by themselves prove that the newest `main` commit has completed deployment on the external production host.