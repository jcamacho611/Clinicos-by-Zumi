# P0 Analytics and Conversion Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure the approved P0 acquisition and product-value loop with first-party, allowlisted, PHI-safe evidence so Klinikos can improve conversion and product value without creating a shadow patient record.

**Architecture:** Reuse authoritative sales, payment, encounter, Grid, and audit evidence where it already exists. Add one small append-only `ProductInteractionEvent` store only for user-interaction/value events that cannot be derived from those authorities. Event names and context keys are strict allowlists. Reporting joins authoritative payment/sales truth at read time instead of duplicating it into analytics.

**Tech Stack:** Prisma/PostgreSQL, Next.js route handlers, TypeScript, React, Vitest, existing `DemoReservationEvent`, Financial OS/payment evidence, and clinic session authority.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Analytics is not authorization, billing, clinical truth, completion authority, or payment evidence.
- Never persist patient name, MRN, DOB, diagnosis, clinical note text, claim number, result content, patient ID, encounter ID, claim ID, arbitrary pathname/query string, IP address, referrer, or user-agent in P0 product analytics.
- Authenticated events may carry opaque organization/user IDs from the server session because those identify the product account, not patient clinical state.
- Public callers may never supply organization/user IDs.
- Do not install a third-party analytics SDK on authenticated clinical surfaces.
- Do not fingerprint users.
- Product analytics failure must never block clinical, sales, payment, or Grid workflows.

---

### Task 1: Define the P0 event taxonomy and privacy contract

**Files:**
- Create: `src/lib/analytics/p0-events.ts`
- Create: `tests/p0-event-taxonomy.test.ts`

**Interfaces:**

```ts
export const P0_PRODUCT_EVENTS = [
  "operating_map_started",
  "operating_map_completed",
  "operating_map_commercial_cta_clicked",
  "living_home_opened",
  "needs_action_group_viewed",
  "needs_action_item_opened",
  "current_visit_opened",
  "current_visit_ready_for_review",
  "revenue_review_opened",
  "grid_draft_opened_from_clinic_signal",
] as const;

export type P0ProductEventName = typeof P0_PRODUCT_EVENTS[number];

export const P0_EVENT_SOURCES = ["public", "living_home", "current_visit", "billing", "grid"] as const;

export interface P0EventContext {
  source: typeof P0_EVENT_SOURCES[number];
  role?: "clinic_owner" | "administrator" | "provider" | "front_desk" | "biller" | "case_manager" | "clinical_staff";
  operatingMapSetting?: "independent_owner" | "practice_manager" | "provider" | "clinical_staff" | "multi_site" | "student";
  operatingMapGapCount?: number;
  actionDomain?: "appointment" | "path" | "encounter" | "revenue" | "grid";
}
```

- [ ] **Step 1: Write the failing strict-schema test**

```ts
import { describe, expect, it } from "vitest";
import { parseP0ProductEvent } from "@/lib/analytics/p0-events";

describe("P0 event privacy contract", () => {
  it("accepts only the allowlisted event/context shape", () => {
    expect(parseP0ProductEvent({
      name: "operating_map_completed",
      context: { source: "public", operatingMapSetting: "independent_owner", operatingMapGapCount: 3 },
    }).name).toBe("operating_map_completed");
  });

  for (const forbidden of ["patientId", "encounterId", "claimId", "mrn", "diagnosis", "note", "url", "claimNumber"]) {
    it(`rejects ${forbidden}`, () => {
      expect(() => parseP0ProductEvent({
        name: "current_visit_opened",
        context: { source: "current_visit", [forbidden]: "sensitive" },
      })).toThrow();
    });
  }
});
```

- [ ] **Step 2: Run and verify RED**

```bash
npm test -- tests/p0-event-taxonomy.test.ts
```

- [ ] **Step 3: Implement with strict Zod schemas**

`operatingMapGapCount` must be an integer `0..9`. Reject unknown keys with `.strict()`.

- [ ] **Step 4: Run and verify GREEN**

```bash
npm test -- tests/p0-event-taxonomy.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/p0-events.ts tests/p0-event-taxonomy.test.ts
git commit -m "feat(analytics): define PHI-safe P0 event taxonomy"
```

### Task 2: Add append-only first-party interaction-event persistence

**Files:**
- Create: `prisma/models/product-interaction-event.prisma`
- Create: `prisma/migrations/20260825052000_product_interaction_events_v1/migration.sql`
- Create: `src/lib/repositories/product-interaction-event-repository.ts`
- Create: `tests/product-interaction-event-repository.test.ts`

**Interfaces:**

Use this persistence shape:

```prisma
model ProductInteractionEvent {
  id                 String   @id @default(cuid())
  name               String
  source             String
  organizationId     String?
  userId             String?
  anonymousSessionId String?
  role               String?
  context            Json
  occurredAt         DateTime @default(now())

  @@index([name, occurredAt])
  @@index([organizationId, occurredAt])
  @@index([anonymousSessionId, occurredAt])
  @@map("product_interaction_events")
}
```

- [ ] **Step 1: Write failing repository tests**

Mock `db.productInteractionEvent.create` and prove:

```ts
await recordAuthenticatedProductEvent(session, parsedEvent);
expect(create).toHaveBeenCalledWith(expect.objectContaining({
  data: expect.objectContaining({
    organizationId: session.organizationId,
    userId: session.userId,
  }),
}));
```

Also prove public persistence cannot accept organization/user IDs from the request object.

- [ ] **Step 2: Implement exact migration**

Create the table/indexes above. Do not add IP, user-agent, referrer, patient, encounter, or claim columns.

- [ ] **Step 3: Implement server-only append repository**

```ts
export async function recordAuthenticatedProductEvent(
  session: ClinicSession,
  event: ParsedP0ProductEvent,
): Promise<void>;

export async function recordAnonymousProductEvent(
  anonymousSessionId: string,
  event: ParsedP0ProductEvent,
): Promise<void>;
```

No ordinary update/delete repository methods.

- [ ] **Step 4: Prove migration on an approved disposable PostgreSQL/Neon branch**

Run the full fresh migration chain, then verify expected table/indexes exist and production is unchanged.

- [ ] **Step 5: Verify and commit**

```bash
npx prisma generate
npx prisma validate
npm test -- tests/product-interaction-event-repository.test.ts tests/p0-event-taxonomy.test.ts
git add prisma src/lib/repositories/product-interaction-event-repository.ts tests
git commit -m "feat(analytics): persist first-party product interaction events"
```

### Task 3: Add bounded public and authenticated ingestion routes

**Files:**
- Create: `src/app/api/analytics/public-event/route.ts`
- Create: `src/app/api/analytics/product-event/route.ts`
- Create: `tests/p0-event-routes.test.ts`
- Reuse: `src/lib/auth/rate-limit.ts`
- Reuse: `src/lib/auth/session.ts`

**Interfaces:**

Public route permits only:

```text
operating_map_started
operating_map_completed
operating_map_commercial_cta_clicked
```

Authenticated route permits all non-public P0 event names and derives identity from `requireClinicSession()`.

- [ ] **Step 1: Write failing route tests**

Prove public route rejects `current_visit_opened`; product route rejects unauthenticated caller; both reject unknown context keys; both use `Cache-Control: no-store`; public route applies the current public rate limiter.

- [ ] **Step 2: Add first-party anonymous session cookie**

Use a random opaque UUID, `HttpOnly` is **not** required because the browser must send the event and the server can issue/read the cookie automatically; use `Secure` in production, `SameSite=Lax`, path `/`, and a 24-hour max age. Do not derive the value from device/browser characteristics.

- [ ] **Step 3: Implement routes**

Server receipt time is `occurredAt`. Do not trust a client-supplied timestamp as canonical.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/p0-event-routes.test.ts tests/p0-event-taxonomy.test.ts
```

### Task 4: Instrument Operating Map acquisition

**Files:**
- Modify: `src/components/marketing/operating-map.tsx`
- Create: `src/lib/analytics/client-product-events.ts`
- Create: `tests/operating-map-analytics.test.ts`

- [ ] **Step 1: Write the failing payload test**

Expected completed payload:

```ts
{
  name: "operating_map_completed",
  context: {
    source: "public",
    operatingMapSetting: "independent_owner",
    operatingMapGapCount: 3,
  },
}
```

- [ ] **Step 2: Implement a non-blocking helper**

`recordPublicProductEvent(...)` posts to `/api/analytics/public-event`; caught failures are ignored after optional development-only console logging. Never block map rendering or CTA navigation.

- [ ] **Step 3: Emit start, completion, CTA-click exactly once per corresponding interaction**

Do not send selected gap labels or free text.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/operating-map-analytics.test.ts
```

### Task 5: Instrument authenticated P0 value events

**Files:**
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/encounter-editor.tsx`
- Modify: `src/components/clinic/billing-workspace-real.tsx`
- Modify: the existing Clinic OS → Grid draft-opening component identified by `detectClinicGridSignals` / its current action surface.
- Modify: `src/app/api/encounters/[encounterId]/transition/route.ts`
- Create: `tests/p0-product-event-instrumentation.test.ts`

- [ ] **Step 1: Instrument view/open events with coarse context only**

`living_home_opened`, `needs_action_item_opened`, `current_visit_opened`, `revenue_review_opened`, and `grid_draft_opened_from_clinic_signal` may carry `source`, `role`, and `actionDomain`, nothing patient/claim-specific.

- [ ] **Step 2: Instrument the real Current Visit milestone server-side**

After a successful `ready_for_review` transition, append `current_visit_ready_for_review`. Do not record it from the button click.

- [ ] **Step 3: Verify no sensitive identifiers enter the event helper**

```bash
npm test -- tests/p0-product-event-instrumentation.test.ts tests/p0-event-taxonomy.test.ts
```

- [ ] **Step 4: Commit**

### Task 6: Build the first-party P0 funnel reader

**Files:**
- Create: `src/lib/repositories/p0-funnel-repository.ts`
- Create: `src/lib/analytics/p0-funnel.ts`
- Create: `tests/p0-funnel-repository.test.ts`

**Interfaces:**

```ts
export interface P0FunnelSummary {
  windowStart: string;
  windowEnd: string;
  operatingMapStarts: number;
  operatingMapCompletions: number;
  commercialCtaClicks: number;
  reservationsCreated: number;
  verifiedPayments: number;
  currentVisitsOpened: number;
  revenueReviewsOpened: number;
}
```

- [ ] **Step 1: Write failing aggregation tests**

Use mocks where `commercialCtaClicks = 5`, reservations = 2, verified payment evidence = 1. Assert the final summary uses those distinct sources and does not infer paid from clicks/reservations.

- [ ] **Step 2: Implement explicit bounded window query**

Require `{ start: Date; end: Date }`, reject ranges over 366 days, and query:

- interaction counts from `ProductInteractionEvent`;
- reservations from existing `DemoReservation`/`DemoReservationEvent` truth;
- verified payments from the existing Financial OS/payment-evidence repository used by commercial activation.

Do not write payment results back into analytics.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/p0-funnel-repository.test.ts
```

### Task 7: Add P0 evidence to the existing authenticated Sales workspace

**Files:**
- Modify: `src/app/(platform)/admin/sales/page.tsx`
- Modify: the existing Sales workspace component rendered by that route.
- Create: `tests/admin-sales-p0-funnel.test.ts`

- [ ] **Step 1: Write failing authorization/presentation test**

Preserve existing sales workspace authorization. Require date-window label plus raw numerator/denominator around any ratio.

- [ ] **Step 2: Load 30-day P0 summary server-side**

Use `end = new Date()` and `start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)`.

- [ ] **Step 3: Render compact evidence, not vanity cards**

Example:

```text
Operating Map completed: 7 / 12 starts
Commercial next step: 3 / 7 completions
Verified paid: 1 / 3 reservations
Window: last 30 days
```

Only show ratios when denominator > 0.

- [ ] **Step 4: Verify and commit**

### Task 8: Document event and retention law

**Files:**
- Create: `docs/analytics/P0_EVENT_TAXONOMY.md`
- Modify: `docs/SECURITY_ARCHITECTURE.md` to link the analytics boundary and prohibited PHI fields.
- Add/modify the relevant documentation-register test if `docs/SECURITY_ARCHITECTURE.md` is register-governed.

- [ ] **Step 1: Record the exact event allowlist and prohibited fields**

- [ ] **Step 2: Set P0 interaction-event retention to 13 months**

This is an internal product-analytics retention target, subject to later counsel/customer-contract constraints. Explain that domain/audit/payment retention is governed separately and is not shortened by this analytics policy.

- [ ] **Step 3: Record source-of-truth law**

Analytics may report interactions. It cannot override PaymentEvidence, encounter status, Grid fulfillment, EDU completion, or any source-domain record.

- [ ] **Step 4: Commit**

### Task 9: Final verification and PR

- [ ] **Step 1: Reconcile all earlier P0 branches before modifying their event call sites**

- [ ] **Step 2: Run fresh evidence**

```bash
npx prisma generate
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

Also run the full migration chain on a verified disposable database.

- [ ] **Step 3: Run browser/network privacy negatives**

Inspect requests from `/operating-map`, Living Home, Current Visit, Billing, and Clinic OS → Grid. Confirm analytics requests contain none of the prohibited sensitive fields.

- [ ] **Step 4: PR non-claims**

State that P0 analytics measures interactions and selected value events only. It does not prove customer outcomes, revenue recovery, retention, CAC, LTV, or market traction until real cohort evidence exists.
