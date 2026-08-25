# P0 Analytics and Conversion Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Measure the approved P0 funnel and product value loop with first-party, allowlisted, PHI-safe evidence so Klinikos can improve acquisition, activation, product value, pricing, and investor/customer proof without turning analytics into a shadow patient record.

**Architecture:** Reuse existing authoritative business/payment/audit events wherever they already exist. Add a small first-party `ProductInteractionEvent` store only for interaction/value events that cannot be reliably derived from existing authorities. Event names and metadata are allowlisted; no generic free-form analytics payloads. Commercial reporting joins or aggregates sources at read time instead of duplicating payment truth.

**Tech Stack:** Prisma/PostgreSQL, Next.js route handlers/server actions, TypeScript, React instrumentation, Vitest, existing DemoReservationEvent/payment/audit truth.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Analytics is not authorization, billing, clinical truth, completion authority, or payment evidence.
- Never send/store patient name, MRN, DOB, diagnosis, clinical note text, claim number, result content, or arbitrary page URL containing sensitive identifiers.
- Do not duplicate authoritative payment status into analytics as if analytics were evidence.
- Public analytics accepts only enumerated event names and bounded enumerated/coarse metadata.
- Authenticated product events may record organization/user opaque IDs, but no patient ID in P0 analytics.
- Do not install a third-party analytics SDK into authenticated clinical surfaces in this plan.
- Respect current consent/privacy policy and do not create fingerprinting behavior.

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

export type P0EventContext = {
  source: "public" | "living_home" | "current_visit" | "billing" | "grid";
  role?: "clinic_owner" | "administrator" | "provider" | "front_desk" | "biller" | "case_manager" | "clinical_staff";
  operatingMapSetting?: "independent_owner" | "practice_manager" | "provider" | "clinical_staff" | "multi_site" | "student";
  operatingMapGapCount?: number;
  actionDomain?: "appointment" | "path" | "encounter" | "revenue" | "grid";
};
```

- [ ] **Step 1: Write failing allowlist tests**

Prove arbitrary event names, `patientId`, `mrn`, `diagnosis`, `note`, `url`, `claimNumber`, and arbitrary metadata keys are rejected.

Example:

```ts
expect(() => parseP0ProductEvent({
  name: "current_visit_opened",
  context: { source: "current_visit", patientId: "p-1" },
})).toThrow();
```

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/p0-event-taxonomy.test.ts
```

- [ ] **Step 3: Implement strict runtime parser**

Use strict schemas. Numeric counts must be bounded and coarse; no free-form text.

- [ ] **Step 4: Verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add src/lib/analytics/p0-events.ts tests/p0-event-taxonomy.test.ts
git commit -m "feat(analytics): define PHI-safe P0 event taxonomy"
```

### Task 2: Add first-party interaction-event persistence

**Files:**
- Create: `prisma/models/product-interaction-event.prisma`
- Create: `prisma/migrations/<timestamp>_product_interaction_events_v1/migration.sql`
- Create: `src/lib/repositories/product-interaction-event-repository.ts`
- Create: `tests/product-interaction-event-repository.test.ts`

**Interfaces:**

Recommended schema fields:

```text
id
occurredAt
name
source
organizationId nullable
userId nullable
anonymousSessionId nullable
role nullable
context JSON (validated bounded enum/count object only)
```

Do not store pathname, referrer, user agent, IP, patient ID, arbitrary payload, or raw text unless a later privacy review explicitly approves a separately justified field.

- [ ] **Step 1: Write failing repository tests**

Prove strict parser runs before persistence; anonymous event cannot invent organization/user IDs; authenticated event IDs come from server session, not client payload; context is bounded.

- [ ] **Step 2: Implement schema + migration**

Index by `(name, occurredAt)`, `(organizationId, occurredAt)`, and `anonymousSessionId` only if required for public funnel sequencing. Keep retention policy documented.

- [ ] **Step 3: Implement server-only append repository**

```ts
export async function recordAuthenticatedProductEvent(session: ClinicSession, event: ParsedP0ProductEvent): Promise<void>;
export async function recordAnonymousProductEvent(sessionId: string, event: ParsedP0ProductEvent): Promise<void>;
```

No update/delete API in ordinary product code; retention deletion may exist in a dedicated administrative/privacy path later.

- [ ] **Step 4: Disposable migration proof**

- [ ] **Step 5: Verify + commit**

```bash
npx prisma validate
npm test -- tests/product-interaction-event-repository.test.ts tests/p0-event-taxonomy.test.ts
git add prisma src/lib/repositories/product-interaction-event-repository.ts tests
git commit -m "feat(analytics): persist first-party product interaction events"
```

### Task 3: Add bounded event ingestion routes

**Files:**
- Create: `src/app/api/analytics/public-event/route.ts`
- Create: `src/app/api/analytics/product-event/route.ts`
- Create: `tests/p0-event-routes.test.ts`
- Reuse existing public rate-limit/request-metadata utilities, but do not persist IP/user-agent as product analytics.

**Interfaces:**
- Public route: anonymous-session cookie + strictly public event subset (`operating_map_*`).
- Authenticated route: current clinic session + strictly authenticated event subset.

- [ ] **Step 1: Write failing abuse/privacy tests**

Prove:

- public endpoint rejects authenticated-only events;
- authenticated endpoint rejects public fake organization/user identifiers;
- unknown metadata is rejected;
- body size is bounded;
- public endpoint rate limits repeated abuse;
- responses use no-store.

- [ ] **Step 2: Implement anonymous session**

Use a random opaque first-party ID with bounded expiry, not fingerprinting. Cookie should be appropriate for a first-party analytics session and contain no identity information.

- [ ] **Step 3: Implement routes**

Do not accept event time from client as authority beyond optional bounded client timestamp; server `occurredAt` is canonical persistence time.

- [ ] **Step 4: Verify and commit**

### Task 4: Instrument the Operating Map acquisition funnel

**Files:**
- Modify: `src/components/marketing/operating-map.tsx`
- Test: `tests/operating-map-analytics.test.ts`

**Interfaces:**
- Emits once-per-session/interaction events:
  - started;
  - completed;
  - commercial CTA clicked.

- [ ] **Step 1: Write failing instrumentation contract**

Assert event payload contains only:

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

Do not send selected gap labels as arbitrary text; if later useful, add enumerated keys deliberately after privacy/analysis review.

- [ ] **Step 2: Implement non-blocking first-party event send**

Analytics failure must not block the Operating Map result or commercial CTA.

- [ ] **Step 3: Verify and commit**

### Task 5: Instrument authenticated P0 value events

**Files:**
- Modify minimal event call sites in Living Home, Current Visit, Billing, Grid clinic-signal handoff.
- Create: `src/lib/analytics/client-product-events.ts` if a small browser helper is useful.
- Test: `tests/p0-product-event-instrumentation.test.ts`.

**Interfaces:**
- Emit only the allowlisted coarse event/context.

- [ ] **Step 1: Instrument `living_home_opened` and `needs_action_item_opened`**

No patient/action source ID in analytics. `actionDomain` only.

- [ ] **Step 2: Instrument `current_visit_opened`**

Do not send encounterId/patientId. The source-domain audit still carries clinical provenance; analytics only knows a Current Visit was opened.

- [ ] **Step 3: Instrument governed lifecycle milestone**

Prefer recording `current_visit_ready_for_review` server-side when the real transition succeeds, rather than a button click.

- [ ] **Step 4: Instrument `revenue_review_opened`**

No claimId, patientId, amount, payer, denial reason.

- [ ] **Step 5: Instrument `grid_draft_opened_from_clinic_signal`**

Only when the existing Clinic OS → Grid draft route is actually opened.

- [ ] **Step 6: Verify and commit**

### Task 6: Build a first-party P0 funnel/evidence reader

**Files:**
- Create: `src/lib/repositories/p0-funnel-repository.ts`
- Create: `src/lib/analytics/p0-funnel.ts`
- Create: `tests/p0-funnel-repository.test.ts`
- Do not expose this publicly by default.

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

Where possible:

- interaction counts come from ProductInteractionEvent;
- reservations come from DemoReservation / DemoReservationEvent authoritative data;
- verified payments come from payment evidence/Financial OS authority, not analytics;
- do not copy authoritative payment state into ProductInteractionEvent simply to make querying easier.

- [ ] **Step 1: Write failing aggregation tests**

Seed/mocks with analytics click count different from verified payment count and prove payment summary uses authoritative payment source.

- [ ] **Step 2: Implement bounded date-window reader**

Require an explicit time window, default at UI layer rather than unbounded DB scans.

- [ ] **Step 3: Verify and commit**

### Task 7: Create internal commercial evidence surface only if an existing admin/sales surface is authoritative

**Files:**
- Prefer extending an existing authenticated sales/admin workspace rather than creating a new dashboard route.
- Test exact chosen route/component.

- [ ] **Step 1: Inspect current Sales/Admin workspace at implementation time**

If a real internal sales workspace exists and is authorization-gated, add a compact P0 funnel section there. If no suitable surface exists, keep the repository/reporting API internal in this tranche rather than building a new admin product solely for metrics.

- [ ] **Step 2: Show ratios only when denominator is nonzero**

Examples:

```text
Operating Map completion: 7 / 12
Commercial CTA: 3 / 7
Verified paid: 1 / 3 reservations
```

Never label click → reservation or reservation → paid as “conversion” without the exact numerator/denominator/time window visible.

- [ ] **Step 3: Commit if a surface was legitimately extended**

### Task 8: Retention/privacy documentation

**Files:**
- Modify relevant privacy/security/analytics documentation.
- Add `docs/analytics/P0_EVENT_TAXONOMY.md` if no authoritative analytics doc exists.

- [ ] **Step 1: Record event allowlist, prohibited fields, retention owner, and deletion policy**

- [ ] **Step 2: Record source-of-truth rule**

Analytics can report interactions. It cannot override PaymentEvidence, encounter status, Grid fulfillment, EDU completion, or other domain truth.

- [ ] **Step 3: Commit**

### Task 9: Final verification and PR

- [ ] **Step 1: Reconcile all P0 branches**

- [ ] **Step 2: Run**

```bash
npx prisma generate
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

Also run disposable migration proof.

- [ ] **Step 3: Privacy-negative browser/network review**

Inspect requests from Operating Map, Living Home, Current Visit, Billing, and Grid signal handoff. Confirm no sensitive IDs/text appear in analytics payloads.

- [ ] **Step 4: PR non-claims**

State that analytics measures interactions and selected value events; it does not prove customer outcomes, revenue recovery, retention, CAC, LTV, or market traction until enough real cohort evidence exists.
