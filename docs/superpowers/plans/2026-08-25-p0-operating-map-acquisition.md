# P0 Operating Map Acquisition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the existing free continuity check into a canonical no-PHI Operating Map that demonstrates Klinikos value, qualifies buyer pain, and routes a visitor into the existing real sales/payment path without creating a second CRM or inventing financial analysis.

**Architecture:** Extract the current `GAPS`, `SETTINGS`, and `GAP_ROUTES` from `src/components/marketing/landing-funnel.tsx` into one browser-safe commercial domain module. Build one reusable Operating Map component, publish it at `/operating-map`, use it inside `/klinikos`, and change the homepage clinic-acquisition CTA from `/operational-audit` to `/operating-map`. The commercial CTA reuses `POST /api/sales/reservations`; price/payment authority stays server-side.

**Tech Stack:** Next.js public routes, React, TypeScript, existing Black Label tokens/components, Vitest, `src/app/sitemap.ts`, current sales reservation and commercial offer modules.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- No PHI, patient names, MRNs, diagnoses, claim numbers, production credentials, clinical free text, or arbitrary user prose in Operating Map input.
- The map knows only enumerated visitor selections; it must never claim it inspected the visitor’s software, records, revenue, patients, or workflow history.
- No dollar-loss estimate in P0.
- Reuse server-owned commercial products/prices and `POST /api/sales/reservations`.
- Do not create a second lead database, payment authority, price source, or marketing theme.
- Free Operating Map and paid Operating Analysis remain visibly different products.

---

### Task 1: Extract the canonical Operating Map domain

**Files:**
- Create: `src/lib/commercial/operating-map.ts`
- Create: `tests/operating-map-model.test.ts`
- Modify later: `src/components/marketing/landing-funnel.tsx`

**Interfaces:**

```ts
export const OPERATING_MAP_SETTINGS = [
  "independent_practice_owner",
  "practice_manager_administrator",
  "provider",
  "clinical_staff",
  "multi_site_operator",
  "student_newly_licensed",
] as const;
export type OperatingMapSettingKey = typeof OPERATING_MAP_SETTINGS[number];

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
  workflow: readonly string[];
  observation: string;
  firstLook: string;
  externalBoundary: string | null;
}

export interface OperatingMapResult {
  setting: OperatingMapSettingKey;
  findings: OperatingMapFinding[];
}

export function parseOperatingMapSelection(value: unknown): {
  setting: OperatingMapSettingKey;
  gaps: OperatingMapGapKey[];
};

export function buildOperatingMap(input: {
  setting: OperatingMapSettingKey;
  gaps: OperatingMapGapKey[];
}): OperatingMapResult;
```

- [ ] **Step 1: Write RED mapping/parser tests**

```ts
expect(buildOperatingMap({
  setting: "independent_practice_owner",
  gaps: ["referral_closure"],
}).findings).toEqual([
  expect.objectContaining({
    label: "Referral closure",
    engine: "Clinic OS",
    workflow: ["Sent", "Acknowledged", "Scheduled", "Consulted", "Closed"],
    firstLook: expect.stringContaining("acknowledgment"),
  }),
]);

expect(() => parseOperatingMapSelection({
  setting: "independent_practice_owner",
  gaps: ["referral_closure"],
  patientName: "not allowed",
})).toThrow();
```

Also prove duplicate gap keys de-duplicate and zero gaps produce an empty finding list, not a diagnosis.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/operating-map-model.test.ts
```

- [ ] **Step 3: Implement strict keyed settings/gaps and migrate current labels/routes into this module**

Keep current meaning for the nine existing gaps. Add workflow arrays as presentation structure only.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/operating-map-model.test.ts
git add src/lib/commercial/operating-map.ts tests/operating-map-model.test.ts
git commit -m "feat(growth): define deterministic Klinikos Operating Map"
```

### Task 2: Build the reusable Black Label Operating Map component

**Files:**
- Create: `src/components/marketing/operating-map.tsx`
- Create: `src/components/marketing/operating-map.module.css`
- Create: `tests/operating-map-experience.test.ts`

**Interfaces:**
- `OperatingMap` owns the three-step client interaction but delegates all interpretation to `buildOperatingMap(...)`.

- [ ] **Step 1: Write RED experience contract**

Require:

```text
Map where work gets stuck
No patient data needed
What you told us
What Klinikos would inspect first
What stays external
Review this with Klinikos
```

Prohibit:

```text
We found $
Guaranteed savings
Your clinic is losing
HIPAA certified
```

- [ ] **Step 2: Implement exactly three stages**

1. `About your operation`: one keyed setting.
2. `Where does work get stuck?`: one or more keyed gaps.
3. `Your Operating Map`: workflow rows + first-look explanation + boundary + commercial CTA.

Use one dominant CTA per stage. Each workflow is readable as text; the visual connector is enhancement, not sole meaning.

- [ ] **Step 3: Implement truthful error state**

If commercial handoff later fails, preserve selected setting/gaps and map result in component state. Do not reset the visitor.

- [ ] **Step 4: Verify keyboard/mobile/200% zoom/reduced motion and commit**

```bash
npm test -- tests/operating-map-experience.test.ts
git add src/components/marketing/operating-map.tsx src/components/marketing/operating-map.module.css tests/operating-map-experience.test.ts
git commit -m "feat(growth): build Black Label Operating Map experience"
```

### Task 3: Publish canonical `/operating-map` and SEO entry

**Files:**
- Create: `src/app/operating-map/page.tsx`
- Modify: `src/app/sitemap.ts`
- Modify: `tests/klinikos-product-control-and-seo.test.ts`
- Create: `tests/operating-map-seo.test.ts`

**Interfaces:**
- Public, indexable route with local canonical `/operating-map`.

- [ ] **Step 1: Write RED SEO tests**

Require:

```ts
expect(page).toContain('alternates: { canonical: "/operating-map" }');
expect(page).toContain('title: "Klinikos Operating Map | Find where clinic work gets stuck"');
expect(sitemap).toContain('path: "/operating-map"');
```

Description:

```text
Map common clinic workflow breaks across intake, referrals, follow-up, revenue and capacity without sharing patient data.
```

- [ ] **Step 2: Implement route**

Render the reusable `OperatingMap` plus existing public trust/footer language. Do not add fabricated ratings/reviews/customers to structured data.

- [ ] **Step 3: Add `/operating-map` to the existing sitemap array and SEO-law test**

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/operating-map-seo.test.ts tests/operating-map-experience.test.ts tests/klinikos-product-control-and-seo.test.ts
npm run build
git add src/app/operating-map/page.tsx src/app/sitemap.ts tests
git commit -m "feat(growth): publish the Klinikos Operating Map"
```

### Task 4: Replace duplicated continuity-check authority on `/klinikos`

**Files:**
- Modify: `src/components/marketing/landing-funnel.tsx`
- Create: `tests/landing-funnel-operating-map-source.test.ts`

- [ ] **Step 1: Write RED source-of-truth test**

Assert `landing-funnel.tsx` imports the canonical Operating Map settings/gaps/component and no longer declares local `GAPS`, `SETTINGS`, or `GAP_ROUTES` constants.

- [ ] **Step 2: Replace the local free continuity-check logic with the reusable `OperatingMap` component**

Keep persona and pricing sections unchanged. `src/app/klinikos/page.tsx` continues sourcing price strings from `@/lib/commercial/klinikos-commercial` and `grid-economics`.

- [ ] **Step 3: Add explicit free/paid boundary copy**

```text
Operating Map: a free self-guided map based only on your selections.
Operating Analysis: a paid human-reviewed engagement that goes deeper into your actual workflow.
```

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/landing-funnel-operating-map-source.test.ts tests/operating-map-experience.test.ts
git add src/components/marketing/landing-funnel.tsx tests/landing-funnel-operating-map-source.test.ts
git commit -m "refactor(growth): use one Operating Map across public funnel"
```

### Task 5: Make Operating Map the homepage clinic-acquisition CTA

**Files:**
- Modify: `src/components/marketing/public-living-gateway.tsx`
- Modify: `src/lib/orchestration/public-living-intent.ts`
- Modify: relevant public Zumi routing tests already guarding operational-audit/start intent.
- Create: `tests/homepage-operating-map-cta.test.ts`

- [ ] **Step 1: Write RED homepage CTA test**

Current homepage CTA is `See what Klinikos would replace` → `/operational-audit`. Replace it with exactly:

```text
Map my clinic
```

→ `/operating-map`.

Secondary `See how it works` → `/how-it-works` remains unchanged.

- [ ] **Step 2: Add `/operating-map` to `publicActionPaths`**

- [ ] **Step 3: Route explicit clinic-workflow/operating-map public Zumi intent to `/operating-map` without changing Grid, EDU, patient, sign-in, or paid-audit routes**

The existing `/operational-audit` route remains valid for paid/commercial intent; do not redirect or delete it.

- [ ] **Step 4: Verify and commit**

```bash
npm test -- tests/homepage-operating-map-cta.test.ts tests/public-living-home.test.ts
```

Use the current exact public-routing regression test filename if it has changed on latest main; do not invent a second routing test suite.

### Task 6: Carry safe map context into the existing sales reservation

**Files:**
- Modify: `src/lib/repositories/sales-demo-repository.ts`
- Modify: `src/app/api/sales/reservations/route.ts`
- Modify: `src/components/marketing/operating-map.tsx`
- Create: `tests/operating-map-sales-handoff.test.ts`

**Interfaces:**

Add this optional strict context to the existing public reservation input:

```ts
export interface OperatingMapCommercialContext {
  source: "operating_map";
  settingKey: OperatingMapSettingKey;
  gapKeys: OperatingMapGapKey[];
}
```

- [ ] **Step 1: Write RED parser/privacy tests**

Valid context is accepted. Unknown setting/gap, arbitrary free text, patient fields, or more than nine gaps is rejected.

- [ ] **Step 2: Persist context only as bounded reservation metadata/event metadata**

The DemoReservation remains the lead authority. Do not create a second OperatingMap lead table.

- [ ] **Step 3: Connect `Review this with Klinikos` to the existing reservation flow**

Preload only the setting/gap keys. The visitor still supplies the existing contact/organization fields required by sales intake.

- [ ] **Step 4: Preserve payment truth**

Operating Map completion/reservation creation never equals paid, entitled, provisioned, or guaranteed analysis. Existing checkout logic is unchanged.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/operating-map-sales-handoff.test.ts
```

### Task 7: Final public-experience verification

**Files:** no new planned runtime files.

- [ ] **Step 1: Reconcile latest public-site work**

- [ ] **Step 2: Run fresh evidence**

```bash
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

- [ ] **Step 3: Browser QA**

Check `/`, `/klinikos`, `/operating-map`, `/operational-audit` at 390/768/1024/1440/1920 and 200% zoom. Verify keyboard, focus, reduced motion, empty/partial/completed map, and commercial-handoff failure state.

- [ ] **Step 4: PR non-claims**

State that the Operating Map is a no-PHI self-guided map based on enumerated visitor input, not a financial audit, integration, clinic-record analysis, or guaranteed ROI result.
