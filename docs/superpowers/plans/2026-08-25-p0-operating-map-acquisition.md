# P0 Operating Map Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the current free continuity check into a shareable no-PHI Operating Map that demonstrates Klinikos value, qualifies buyer pain, and routes a visitor into the existing real sales/payment path without creating a second CRM or inventing financial analysis.

**Architecture:** Extract the current browser-only gap-selection logic from `landing-funnel.tsx` into a reusable `OperatingMap` domain + component. Add a canonical public `/operating-map` route for SEO/sharing, then let `/klinikos` and homepage CTAs route to it. The map remains deterministic and visitor-input-only; its commercial CTA reuses `POST /api/sales/reservations` and the existing server-owned checkout architecture.

**Tech Stack:** Next.js public routes, React, TypeScript, existing Black Label tokens/components, Vitest, current sales reservation and commercial offer modules.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- No PHI, patient names, MRNs, diagnoses, claim numbers, production credentials, or clinical free text in Operating Map input.
- No claim that the tool analyzed a clinic’s systems; it knows only what the visitor selected.
- No personalized dollar-loss estimate in P0 unless a later calculator has explicit user-provided inputs and clearly labeled math.
- Reuse server-owned commercial products/prices and `POST /api/sales/reservations`.
- Do not create a second lead database, payment authority, or price source.
- Maintain Marble/Obsidian Black Label design and mobile/accessibility standards.
- Canonical public copy remains sourced from approved messaging/config where shared messaging already exists.

---

### Task 1: Extract the Operating Map domain from the current continuity check

**Files:**
- Create: `src/lib/commercial/operating-map.ts`
- Create: `tests/operating-map-model.test.ts`
- Modify later: `src/components/marketing/landing-funnel.tsx`

**Interfaces:**

```ts
export const OPERATING_MAP_GAPS = [
  "recall_follow_up",
  "referral_closure",
  "result_acknowledgment",
  "prior_authorization",
  "no_show_recovery",
  "intake_consent",
  "charge_claim_readiness",
  "coverage_staffing",
  "idle_capacity",
] as const;

export type OperatingMapGapKey = typeof OPERATING_MAP_GAPS[number];

export interface OperatingMapFinding {
  key: OperatingMapGapKey;
  label: string;
  engine: "Clinic OS" | "Care" | "Billing" | "Grid";
  observation: string;
  firstLook: string;
  externalBoundary: string | null;
}

export function buildOperatingMap(gaps: OperatingMapGapKey[]): OperatingMapFinding[];
```

- [ ] **Step 1: Write failing deterministic mapping tests**

Example:

```ts
expect(buildOperatingMap(["referral_closure"])).toEqual([
  expect.objectContaining({
    label: "Referral closure",
    engine: "Clinic OS",
    firstLook: expect.stringContaining("acknowledgment"),
  }),
]);
```

Prove duplicate keys de-duplicate, unknown runtime input is rejected by parser, and zero selections return an empty map rather than a fake diagnosis.

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/operating-map-model.test.ts
```

- [ ] **Step 3: Move existing `GAPS` / `GAP_ROUTES` meaning into the domain module**

Preserve the current truth boundary: it is a deterministic restatement of visitor selections.

- [ ] **Step 4: Verify GREEN**

- [ ] **Step 5: Commit**

```bash
git add src/lib/commercial/operating-map.ts tests/operating-map-model.test.ts
git commit -m "feat(growth): define deterministic Klinikos Operating Map"
```

### Task 2: Build the reusable Black Label Operating Map component

**Files:**
- Create: `src/components/marketing/operating-map.tsx`
- Create: `src/components/marketing/operating-map.module.css` if scoped CSS is needed.
- Create: `tests/operating-map-experience.test.ts`

**Interfaces:**
- Consumes selected setting + `OperatingMapGapKey[]`.
- Produces selection → map → findings → commercial CTA.

- [ ] **Step 1: Write failing experience contract test**

Required copy hierarchy:

```text
Map where work is getting lost
No patient data needed
What you told us
What Klinikos would inspect first
What stays external
Review this with Klinikos
```

Prohibited copy:

```text
We found $X
Guaranteed savings
Your clinic is losing
HIPAA certified
```

- [ ] **Step 2: Implement three-stage experience**

Stage 1: organization setting / optional scale band.

Stage 2: operational pain selection.

Stage 3: Operating Map result.

Use a visual workflow/ledger, not a generic card grid. Each finding needs an accessible text equivalent.

- [ ] **Step 3: Add progressive plain-language output**

Example output:

```text
REFERRAL
Sent → acknowledged → scheduled → consulted → closed

You selected: Referral loops do not always close.
Klinikos would look first at referrals with no recorded acknowledgment or next owner.
```

Do not claim stages are actually broken at the visitor’s clinic.

- [ ] **Step 4: Verify keyboard/mobile/200% zoom/reduced motion**

- [ ] **Step 5: Commit**

### Task 3: Add canonical `/operating-map` public route and SEO

**Files:**
- Create: `src/app/operating-map/page.tsx`
- Test: `tests/operating-map-seo.test.ts`
- Modify sitemap/route metadata files according to existing repository conventions.

**Interfaces:**
- Public route, no auth required.

- [ ] **Step 1: Write SEO route contract**

Metadata must include a human-readable title/description, canonical `/operating-map`, and indexability unless current SEO policy says otherwise.

Suggested title:

```text
Klinikos Operating Map | Find where clinic work gets stuck
```

Suggested description:

```text
Map common clinic workflow breaks across intake, referrals, follow-up, revenue and capacity without sharing patient data.
```

Do not add unproven structured-data claims such as ratings/customers/results.

- [ ] **Step 2: Implement route using the reusable component**

Use existing Public Trust footer / brand shell components where appropriate; do not create a second marketing visual system.

- [ ] **Step 3: Update sitemap/internal links**

- [ ] **Step 4: Verify**

```bash
npm test -- tests/operating-map-seo.test.ts tests/operating-map-experience.test.ts
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/operating-map src/components/marketing tests
git commit -m "feat(growth): publish the Klinikos Operating Map"
```

### Task 4: Replace duplicated continuity-check logic on `/klinikos`

**Files:**
- Modify: `src/components/marketing/landing-funnel.tsx`
- Modify: `src/app/klinikos/page.tsx` only if props/copy need adjusting.
- Test: existing marketing/commercial truth tests plus new Operating Map tests.

**Interfaces:**
- `/klinikos` may embed a compact Operating Map or link into canonical `/operating-map` while preserving pricing/persona sections.

- [ ] **Step 1: Remove local `GAPS` / `GAP_ROUTES` authority**

There must be one mapping source in `operating-map.ts`.

- [ ] **Step 2: Preserve existing commercial pricing source**

Do not move prices into the Operating Map component. Current `klinikos-commercial` remains commercial source of truth.

- [ ] **Step 3: Verify free-vs-paid language**

The free Operating Map must never look like the paid Operating Analysis deliverable. Keep a clear boundary:

```text
Operating Map: public self-guided continuity map based on your selections.
Paid Operating Analysis: human-reviewed commercial service with deeper workflow review.
```

- [ ] **Step 4: Verify and commit**

### Task 5: Make Operating Map the primary acquisition CTA where evidence supports it

**Files:**
- Modify: `src/lib/brand/canonical-messaging.ts` only through deliberate canonical copy decision.
- Modify: `src/components/marketing/public-living-gateway.tsx` or current homepage CTA surface.
- Modify: public product/marketing surfaces that currently use generic “start” CTA.
- Test: homepage/public messaging tests.

**Interfaces:**
- Primary CTA target becomes `/operating-map` for clinic-owner acquisition paths; Grid/EDU/persona-specific paths retain their own appropriate CTAs.

- [ ] **Step 1: Write CTA mapping test before copy changes**

Prove clinic operations intent reaches Operating Map while Grid/EDU access intent still reaches its correct domain.

- [ ] **Step 2: Use one approved CTA phrase**

Recommended test candidate:

```text
Map my clinic
```

or

```text
See where work gets stuck
```

Do not globally change the company tagline in the same PR. CTA testing and category messaging are separate decisions.

- [ ] **Step 3: Verify public Zumi deterministic routing still sends relevant questions correctly**

- [ ] **Step 4: Commit**

### Task 6: Route qualified Operating Map completion into existing sales reservation flow

**Files:**
- Modify: `src/components/marketing/operating-map.tsx`
- Modify: `src/lib/repositories/sales-demo-repository.ts` only if its existing input schema needs a bounded optional `operatingMapContext` field.
- Modify: `src/app/api/sales/reservations/route.ts` only through existing repository/service contracts.
- Test: sales reservation tests + `tests/operating-map-sales-handoff.test.ts`.

**Interfaces:**
- Commercial handoff may include non-PHI context:

```ts
{
  source: "operating_map",
  settingKey: "independent_practice_owner",
  gapKeys: ["referral_closure", "charge_claim_readiness"]
}
```

- [ ] **Step 1: Write privacy/input test**

Server accepts only enumerated setting/gap keys. It rejects arbitrary free-text clinical data in this field.

- [ ] **Step 2: Preserve reservation/payment behavior**

Existing sales reservation remains the saved lead. Existing checkout service remains price/payment authority. Operating Map context is qualification metadata only.

- [ ] **Step 3: Implement CTA**

After map completion:

```text
Review this with Klinikos
```

opens the current sales/reservation flow preloaded only with safe map selections, never patient/clinical data.

- [ ] **Step 4: Verify payment truth**

Map completion does not create payment, entitlement, organization activation, or guaranteed analysis.

- [ ] **Step 5: Commit**

### Task 7: Acquisition proof states

**Files:**
- Modify: Operating Map component.
- Test: `tests/operating-map-experience.test.ts`.

- [ ] **Step 1: Add truthful empty/partial/completed states**

Empty: ask for one selection.

Partial: show selected operating areas, not diagnosis.

Completed: show map + what Klinikos would inspect + CTA.

Error: preserve the completed map in browser state and state that commercial handoff failed; never make the visitor redo the map if avoidable.

- [ ] **Step 2: Add share/print only if output contains no sensitive entered free text**

P0 should prefer a stable client-side summary/print view rather than server-persisting anonymous diagnostic responses unnecessarily.

- [ ] **Step 3: Verify and commit**

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile latest public-site work**

- [ ] **Step 2: Run**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

- [ ] **Step 3: Browser QA**

Check public `/`, `/klinikos`, `/operating-map` at 390/768/1024/1440/1920, Marble/Obsidian where applicable, keyboard, 200% zoom, reduced motion.

- [ ] **Step 4: PR commercial non-claims**

State clearly that the Operating Map is a no-PHI self-guided map based on visitor input, not a financial audit, system integration, or guaranteed ROI result.
