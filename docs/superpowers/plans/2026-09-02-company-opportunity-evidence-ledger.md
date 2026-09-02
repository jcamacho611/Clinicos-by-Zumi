# Company Opportunity Evidence Ledger Implementation Plan

> **Execution note:** This is a subordinate implementation plan. The Master Canon and Master Engineering Blueprint remain authoritative. Execute task-by-task with TDD and verification before completion.

**Goal:** Add the first durable, first-party Klinikos Company Compounding evidence rail so externally discovered opportunities, sourced claims, lifecycle transitions, award state, contract state, and cash state remain separate, platform-scoped, reviewable, and truth-classified.

**Architecture:** Extend the modular monolith with one company-opportunity aggregate and append-only evidence/event records. Restrict it to the configured Klinikos platform organization plus a new Company OS permission that customer-clinic roles do not receive. Reuse the existing six-class truth taxonomy, Organization tenant anchor, RBAC, AuditLog, and Prisma transaction patterns. Do not reuse the patient/booking-specific `Lead` aggregate. Do not link broad MessageThread, Document, or Task workspaces until those substrates have explicit company-purpose access scopes and filtered readers.

**Technology:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Zod, Vitest.

---

## Scope and permanent boundaries

This tranche implements only:

- company opportunity persistence;
- evidence attachment and supersession;
- append-only state transition history;
- first-party platform-organization scope and Company OS authorization;
- independent qualification, provider, delivery, response, submission, award, contract, and cash rails;
- tenant-safe server APIs;
- a truthful minimum DTO and tests.

This tranche does not implement:

- Outlook ingestion or provider sending;
- a procurement dashboard;
- contract signature or payment settlement;
- legal approval;
- promotion of email conversations into qualified pipeline;
- MessageThread, Document, or Task linking before purpose-scoped access exists;
- a second CRM, task, message, document, legal, or audit store;
- public/browser access to company intelligence.

Truth rules:

```text
OBSERVED THREAD != PIPELINE
PROVIDER ACCEPTED != DELIVERED
DELIVERED != RESPONSE RECEIVED
RESPONSE RECEIVED != APPLICATION SUBMITTED
APPLICATION SUBMITTED != AWARD
AWARD != CONTRACT
CONTRACT != IMPLEMENTATION
CONTRACT != CASH RECEIVED
```

An imported Outlook summary may create a `DISCOVERED` opportunity with an `ACTUAL` evidence item asserting only that a source/thread was observed. Any inferred commercial fit remains `ASSUMPTION` or `TARGET`. Truth class belongs to each claim/evidence item, never to the whole opportunity. Qualification, award, executed contract, and cash each require their own authoritative evidence.

## Task 1: Lock the truth taxonomy and state-transition contract

**Files:**

- Modify: `src/lib/company/symphony-opportunity-types.ts`
- Modify: `src/lib/company-execution-control-plane.ts`
- Create: `src/lib/company/company-opportunity-contract.ts`
- Test: `tests/company-opportunity-contract.test.ts`
- Modify: `tests/company-execution-control-plane.test.ts`

### Step 1: Write failing contract tests

Test that:

- the single canonical truth taxonomy is exactly `ACTUAL | CONTRACTED | PIPELINE | ASSUMPTION | SCENARIO | TARGET`;
- lifecycle stage and claim truth are separate axes;
- default discovery has qualification and every downstream rail unproven;
- provider, delivery, response, submission, award, contract, and cash each use explicit states including failure/revocation/dispute where applicable;
- the legal stage graph blocks jumps, backwards transitions, and cash-as-workflow;
- evidence qualification validates source authority, verification, fingerprint, expiry/revocation, and type-specific required fields;
- observed email/source evidence cannot alone qualify pipeline, award, contract, or cash;
- Company OS requires the configured platform organization and explicit Company OS permission;
- aggregate version is required for compare-and-swap transitions.

Run:

```bash
npm test -- --run tests/company-opportunity-contract.test.ts tests/company-execution-control-plane.test.ts
```

Expected: RED because the company opportunity contract and canonical taxonomy reuse do not yet exist.

### Step 2: Implement the minimum domain contract

Create Zod-backed constants/types for:

- opportunity workflow stages;
- source/evidence types;
- evidence disposition and supersession state;
- independent qualification/provider/delivery/response/submission/award/contract/cash rails;
- transition commands;
- evidence qualification rules.

Extract the existing Symphony six-class taxonomy into one shared company-truth module and import it from both callers. Repoint the stale `CompanyTruthClass` alias without changing the separate metric evidence-basis axis. Do not reuse Symphony's communication/execution states as the procurement lifecycle.

### Step 3: Prove GREEN

Run the focused tests again. Expected: GREEN.

## Task 2: Add additive persistence and migration evidence

**Files:**

- Modify: `prisma/schema.prisma` only for the Organization back-relation and explicit Company OS RBAC support
- Create: `prisma/migrations/20260902090000_company_opportunity_evidence_ledger/migration.sql`
- Create: `prisma/migrations/20260902090000_company_opportunity_evidence_ledger/production-release.json`
- Test: `tests/company-opportunity-schema.test.ts`
- Test: `tests/migration-safety.test.ts` if the repository's current migration contract requires registration there

### Step 1: Write failing schema tests

Require:

- `CompanyExternalOpportunity` belongs to exactly one configured platform Organization and carries an aggregate version;
- source identity is idempotent within the tenant;
- lifecycle stage and each downstream truth rail are separate columns; the aggregate has no truth class;
- `CompanyOpportunityEvidence` carries claim-scoped truth, stable source IDs, fingerprint, locator, observation/verification/approval/review/expiry/revocation/supersession fields, and type-specific contract/cash evidence fields;
- `CompanyOpportunityEvent` is append-only by application contract and has a tenant-scoped idempotency key;
- `CompanyOpportunityEvidence.supersedesEvidenceId` has an evidence-preserving self-reference;
- MessageThread, Document, and Task are unchanged until purpose-scoped access exists;
- no cascade from opportunity deletion destroys evidence/event history.

Run:

```bash
npm test -- --run tests/company-opportunity-schema.test.ts
```

Expected: RED.

### Step 2: Add Prisma models and relations

Add:

```text
Organization
  -> CompanyExternalOpportunity[]

CompanyExternalOpportunity
  -> CompanyOpportunityEvidence[]
  -> CompanyOpportunityEvent[]
```

Use database CHECK constraints for closed state sets in addition to TypeScript schemas. Bind actor/owner/verifier references where a canonical user exists. Preserve counterparty contact minimization: do not persist raw email bodies, arbitrary event metadata, secrets, or PHI in this aggregate.

### Step 3: Write the additive SQL migration and manifest

The migration must:

- create only new tables, indexes, constraints, and the Organization relation;
- add no destructive data rewrite;
- use `ON DELETE RESTRICT` or `SET NULL` where evidence/history must survive;
- add tenant-scoped uniqueness for source imports and event idempotency;
- add indexes for tenant/stage/deadline/review queries.

Generate the manifest checksum from the exact migration bytes only after schema validation, the empty-database migration chain, focused database tests, and human diff review prove the SQL additive and release-safe. Do not pre-authorize automatic production deployment while the migration is still changing.

### Step 4: Validate schema and migration

Run:

```bash
npx prisma format
npm run db:generate
npm run db:validate
npm test -- --run tests/company-opportunity-schema.test.ts
```

Expected: GREEN.

## Task 3: Implement the tenant-safe repository

**Files:**

- Create: `src/lib/repositories/company-opportunity-repository.ts`
- Test: `tests/company-opportunity-repository.db.test.ts`
- Test: `tests/company-opportunity-repository.test.ts`

### Step 1: Write failing repository tests

Cover:

- create/list/get are restricted to the configured platform organization and explicit Company OS permission;
- duplicate source import is idempotent only when the semantic payload matches;
- a source collision with different semantics fails closed;
- Outlook/attachment summary sources default to `DISCOVERED` and cannot self-promote;
- evidence is never updated in place; correction supersedes prior evidence;
- expired/revoked/corrected evidence cannot qualify a transition, while history remains;
- transitions require legal adjacency, qualifying evidence, and the expected aggregate version;
- opportunity update, event, and AuditLog append commit in one transaction;
- cross-tenant and non-platform access returns the same safe not-found/forbidden contract;
- event idempotency is tenant-bound;
- no method exposes update/delete for historical evidence or events.

Run:

```bash
npm test -- --run tests/company-opportunity-repository.test.ts tests/company-opportunity-repository.db.test.ts
```

Expected: RED.

### Step 2: Implement repository commands

Implement:

- `createCompanyOpportunity`;
- `listCompanyOpportunities`;
- `getCompanyOpportunity`;
- `appendCompanyOpportunityEvidence`;
- `transitionCompanyOpportunity`;
- `recordCompanyOpportunitySymphonyOutcome` for independent provider/delivery outcome evidence only.

Every command takes identity and organization only from the authenticated server session, requires Company OS permission plus the configured platform slug, uses compare-and-swap and a Prisma transaction for consequential state/event/audit changes, and returns a minimum DTO. No broad communication/document/task substrate is used in this tranche.

### Step 3: Prove GREEN

Run the focused unit and disposable-Postgres repository tests. Expected: GREEN.

## Task 4: Expose authenticated server capabilities

**Files:**

- Create: `src/app/api/company/opportunities/route.ts`
- Create: `src/app/api/company/opportunities/[opportunityId]/route.ts`
- Create: `src/app/api/company/opportunities/[opportunityId]/evidence/route.ts`
- Create: `src/app/api/company/opportunities/[opportunityId]/transition/route.ts`
- Create: `src/lib/company/company-opportunity-api.ts`
- Test: `tests/company-opportunity-api.test.ts`
- Test: `tests/company-opportunity-api-auth.test.ts`

### Step 1: Write failing API contract tests

Require:

- authenticated Company OS capability plus exact configured platform organization;
- organization identity comes only from the server session;
- `Cache-Control: no-store`;
- input schemas reject unknown states, unsafe/fetchable URLs, raw message bodies, arbitrary metadata, oversized fields, and client-supplied organization IDs;
- response DTOs omit internal evidence payloads, document storage details, and private policy metadata;
- missing and cross-tenant records have the same response;
- list uses bounded cursor pagination;
- all mutations require same-origin protection;
- detail and list responses cannot be reached by non-platform clinic administrators or broad message/document readers.

Run:

```bash
npm test -- --run tests/company-opportunity-api.test.ts tests/company-opportunity-api-auth.test.ts
```

Expected: RED.

### Step 2: Implement the routes

Keep route handlers thin: authenticate, authorize, validate, call repository, serialize minimum DTO, return no-store. Do not add frontend routes, provider connectors, or generic message/document/task linkage in this tranche.

### Step 3: Prove GREEN

Run the focused API tests. Expected: GREEN.

## Task 5: Integration, synchronization, and release verification

**Files:**

- Modify only current status/dependency evidence if the implementation is verified and the repository's synchronization contract requires it.
- Do not change the Master Canon unless implementation exposes a genuine contradiction; this tranche implements already-approved Company Compounding law.

### Step 1: Run focused regression

```bash
npm test -- --run \
  tests/company-opportunity-contract.test.ts \
  tests/company-opportunity-schema.test.ts \
  tests/company-opportunity-repository.test.ts \
  tests/company-opportunity-repository.db.test.ts \
  tests/company-opportunity-api.test.ts \
  tests/company-opportunity-api-auth.test.ts \
  tests/symphony-runtime-recovery.test.ts \
  tests/symphony-outbound-approval.test.ts \
  tests/company-execution-control-plane.test.ts
```

### Step 2: Run exact-tree gates

```bash
git diff --check
npm run db:generate
npm run db:validate
npm run type-check
npm run lint
npm test
npm run security:check
npm run verify:code
```

Run the repository's disposable-PostgreSQL migration and MVP journey gates on the exact final tree. Never point these commands at production.

### Step 3: Inspect the final diff

Confirm:

- no duplicate CRM/message/document/task/legal system;
- no public/browser proprietary company-intelligence leak;
- no PHI or raw email body storage;
- no email-conversation-to-pipeline shortcut;
- no provider/delivery/response/submission/contract/cash collapse;
- no award/contract collapse and no cash workflow stage;
- Company OS data is unreachable outside the configured platform organization;
- no fake customer, contract, award, partner, financing, revenue, or readiness claim;
- no overlap with the active Living Universe frontend tranche.

### Step 4: Commit, push, and open a draft PR

Use a truthful commit such as:

```text
feat(company): add opportunity evidence ledger
```

Push normally. Open a draft PR against the current `main`. Record the exact head and inspect exact-head GitHub Quality. Do not merge until the frontend merge train and this PR's exact-head checks/review establish a safe order.

## Follow-up sequence after this tranche

1. Company opportunity workbench UI over these APIs.
2. Outlook/Graph ingestion that stores message IDs/headers/thread relationships and attachment hashes, never truth upgrades from summaries.
3. Procurement requirement/deadline/submission workbench.
4. Scenario consistency for Texas/capital/workforce assumptions.
5. Counterparty security and disclosure-release workflows.
6. Versioned member legal acceptance after the Living Universe visual tranche lands and approved legal artifacts exist.
