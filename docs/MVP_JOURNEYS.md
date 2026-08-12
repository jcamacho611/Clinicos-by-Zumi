# MVP journeys

A journey is not a unit test. It runs the real repositories and services against a real
PostgreSQL database with real sessions, so authorization, tenant scoping and lifecycle
rules are exercised rather than mocked. A journey passing means a person could do that
thing; a journey failing means either the product is wrong or our understanding of it was.

Journeys have found defects the unit suite could not see, because the unit suite never
touches a database:

- nine migrations referenced Prisma **model** names instead of the mapped **table** names,
  so a fresh deployment was impossible while every test stayed green
- `SELECT pg_advisory_xact_lock(...)` was issued through `$queryRaw`, which cannot
  deserialize a `void` column, so **no Grid reservation could ever be created**
- the follow-up loop wrote zero audit records
- redaction ran too late in the Zumi gateway, so identifiers reached the model provider
  in the system prompt while the user prompt beside it was clean

## Running them

```bash
createdb klinikos_mvp
export DATABASE_URL="postgresql://postgres@127.0.0.1:5432/klinikos_mvp"
export DIRECT_DATABASE_URL="$DATABASE_URL"
export AUTH_SECRET="…any 32+ character value for local runs…"

npx prisma migrate deploy
npm run journey -- scripts/mvp/grid-journey.mts
```

`npm run journey` is `tsx` with `tsconfig.journeys.json`. That config exists for one
reason: journeys import real server modules, and those import `server-only` — a Next.js
compile-time marker that is not an installed package. Next aliases it during a build and
Vitest aliases it during tests, so the journey config aliases it to the same inert stub.
It is deliberately **not** in the base `tsconfig.json`, because mapping `server-only`
there would make `next build` resolve the marker to a no-op and silently disable the
server/client boundary for the whole application.

Each journey creates its own organizations, cleans up after itself, and exits non-zero on
any failed check.

## The journeys

| # | File | Proves |
| --- | --- | --- |
| 1 | `commercial-journey.mts` | Payment evidence and entitlement are separate facts. An unverified event never activates anything; activation needs a membership event *and* a corroborating verified payment; replay is idempotent. |
| 2 | `operations-journey.mts` | Appointment risk is detected deterministically, produces real operational work, and — with no messaging connector — no patient message claims to have been sent. Resolving the real-world cause closes the action. |
| 3 | `grid-journey.mts` | Need → offer → acceptance → reservation. A reservation cannot exist before acceptance, only the recipient may accept, an offer may only name a human-approved resource, and the same offer cannot be reserved twice. |
| 4 | `grid-trust-journey.mts` | Dispute and safety incident are distinct records, both block the reservation, duplicates and cross-tenant disputes are refused, and resolution vocabulary never claims money moved or a participant was suspended. |
| 5 | `zumi-journey.ts` | With no provider, Zumi reports Pending Connection and returns no answer, recommendations or sources. Once connected, prohibitions hold, RBAC is not widened, founder mode widens discussion but not authorization, PHI does not cross the boundary, and unevidenced recommendations are dropped. |
| 6 | `tenant-isolation-journey.mts` | Adversarial. Tenant A cannot read B's patients, lists, audit log or private Grid demand, cannot activate against B, and deleting A leaves B intact. |
| 8 | `role-routing-journey.ts` | Every role reaches a useful product and nothing more. The sidebar, launchpad and route guard all decide access with one function; a Grid participant reaches no clinic workspace; a portal token is worthless as a staff session and the reverse. |
| 9 | `fresh-deploy-journey.ts` | An empty database becomes a working deployment: all migrations apply, the tables the product needs exist, `migrate deploy` is idempotent, empty state reads as empty, first real work succeeds, and a restart finds it still there. |
| 12 | `failure-recovery-journey.ts` | Two simultaneous reservations of one offer produce one booking; a single-capacity resource cannot be double-booked by two concurrent deals; the loser leaves no partial state; a retry returns the same booking; an unanswered offer stays unreservable. |

Journeys 7 (paid clinic activation), 10 (production readiness) and 11 (mobile) are not
yet written.

## Writing one

Three failure modes have caught us out, and each makes a check pass while proving nothing.

**A check that never ran.** The Zumi journey asserted that no identifiers reached the
provider and passed — against zero payloads, because the request had been refused before
egress. Assert that the thing you are measuring actually happened, and report
`INCONCLUSIVE` rather than `PASS` when it did not.

**Two copies of a module.** `tsx` loads `.mts` through the ESM graph and the `.ts` files
it imports through the CJS one. A journey that registers something into a module registry
must be a `.ts` file, or it will register into a copy the code under test never reads.

**A refusal for the wrong reason.** Journey 12's contention check first ran against the
resource an earlier check had already booked, so both concurrent deals were refused for
the ordinary reason that the chair was taken — the check looked like it was proving the
lock and was proving nothing. Contended scenarios need their own fixtures.

When a journey fails, decide *what* is wrong before changing anything — the test, the
implementation, the assumption, or the documentation. Several of these journeys failed
first because the journey was wrong, and the correct fix was to the journey. Do not
weaken the product to make a journey green.
