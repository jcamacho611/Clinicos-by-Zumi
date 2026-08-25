# Klinikos P0 Value Loop Design

**Date:** 2026-08-25  
**Status:** APPROVED DESIGN BASELINE, NOT IMPLEMENTATION TRUTH  
**Repository baseline:** `main@cdd425d8c6d468047a4c3f42b8fb5d26939be26e`

## 1. Goal

Build the smallest product sequence that simultaneously improves commercial conversion, physician value, clinic operating clarity, revenue proof, customer acquisition, and long-term platform architecture without creating a parallel app or weakening existing authority boundaries.

The approved P0 value loop is:

`PUBLIC OPERATING MAP`
→ `PAID / QUALIFIED COMMERCIAL ENTRY`
→ `ROLE-AWARE LIVING HOME`
→ `UNIVERSAL UNFINISHED-WORK PROJECTION`
→ `GOLDEN CURRENT VISIT`
→ `CLINICAL CHANGE / BODYMAP`
→ `REVENUE-INTEGRITY CONTINUATION`
→ `EVIDENCE / ANALYTICS`

P0 is not “build all of Klinikos.” It is the shortest compounding loop from buyer comprehension to measurable product value.

## 2. Current truth that controls this design

At the approved baseline:

- `main` is `cdd425d8c6d468047a4c3f42b8fb5d26939be26e`.
- `main` branch protection and required status checks are disabled.
- hosted GitHub Actions has repeatedly failed before execution because jobs are not receiving runners; local verification therefore cannot be represented as hosted-CI proof.
- authenticated Living Home still imports `@/lib/orchestration/intent-engine` and `@/lib/orchestration/path-engine` into a client component, despite the public routing engine having already been moved server-side.
- Current Visit exists and already preserves encounter draft/review/sign/lock/addendum authority.
- Current Visit already renders Patient Snapshot, a truthful unavailable `What changed` state, partial Staff Handoff from vitals/medication reconciliation, note sections, existing coding, audit, and Close Visit presentation.
- persisted immutable `BodyMapVersion` / `BodyMapFinding` evidence exists on `main`; authoring UI and longitudinal INITIAL/PREVIOUS/TODAY composition are not yet complete.
- `close-visit-resolution.ts` already defines governed evaluation slots for coding, orders/results, AI review, attestations, and charge readiness.
- Clinic OS → Grid bridge already detects truthful operational signals without automatically publishing them.
- public marketing already includes a browser-only free `Clinic continuity check`; it is not yet the full Operating Map acquisition product described here.
- commercial execution remains the near-term business bottleneck; this design must improve the path from visitor → qualified buyer → paid work → first value → recurring value.

## 3. Product laws

### 3.1 Complexity law

> THE COMPLEXITY BELONGS TO KLINIKOS, NOT TO THE USER.

Backend domains remain separate authorities. Frontend experiences converge them around the user’s job.

### 3.2 Truth law

No UI may infer:

- payment from redirect;
- external integration success from internal state;
- clinical resolution from omission;
- provider review from result existence;
- patient notification from provider review;
- charge/payment/revenue realization from a potential opportunity;
- credential/licensure from profile, education, or self-description.

### 3.3 Authority law

A projection may aggregate and explain truth. It may not become a second authority store.

P0 must preserve authoritative repositories for encounters, tasks, referrals, results, forms, finance, Grid, EDU, identity, audit, and payment evidence.

### 3.4 Frontend law

Each major role should answer one dominant question:

- **Owner:** What needs attention, who owns it, and where may we be losing time, money, or capacity?
- **Provider:** What changed, what matters, and what do I need to decide?
- **Front desk:** Who is not ready and what do I need to do?
- **Biller:** Where did legitimate payment stop?
- **Patient:** What do I need to do next?
- **Professional/Grid participant:** What am I eligible for and what should I do next?
- **Student:** What do I need to complete next and what can it unlock?

## 4. P0 architecture

### 4.1 P0.0 Release control and browser confidentiality

Before broad product expansion:

1. preserve exact-head release verification;
2. resolve the authenticated browser disclosure of `intent-engine` / `path-engine` by moving deterministic resolution/runtime work behind server capabilities or projecting only minimum-necessary DTOs;
3. repair/confirm hosted CI runner availability without weakening tests;
4. enable branch protection only after required checks are reliable enough not to deadlock development;
5. reconcile stale/open clinical, EDU, identity, and architecture PRs so no competing authority or duplicate migration is accidentally merged.

### 4.2 P0.1 Universal unfinished-work projection

Introduce a read-only projection named `NeedsAction`.

It is not a new task database.

```ts
export type NeedsActionState = "needs_you" | "waiting" | "needs_review" | "blocked" | "ready" | "done";

export type NeedsActionDomain =
  | "appointment"
  | "path"
  | "referral"
  | "result"
  | "form"
  | "encounter"
  | "revenue"
  | "grid";

export interface NeedsActionItem {
  id: string;
  domain: NeedsActionDomain;
  sourceId: string;
  organizationId: string;
  patientId: string | null;
  ownerLabel: string | null;
  title: string;
  reason: string;
  state: NeedsActionState;
  urgency: "routine" | "soon" | "urgent";
  dueAt: string | null;
  href: string | null;
  evidenceRef: string;
}
```

Rules:

- no raw ORM objects;
- no private ranking weights;
- no new mutable lifecycle;
- stable deterministic IDs derived from domain + source ID;
- every item names its source/evidence;
- role filtering occurs server-side before DTO delivery;
- PHI is minimum necessary for the current authenticated experience;
- a source-domain state change makes the projection disappear or change; users never manually “complete” the projection itself.

Initial P0 sources should be deliberately narrow:

1. current appointment readiness already represented by `attentionReasons`;
2. Path guidance blockers / review / waiting states;
3. close-visit blockers / escalations from governed Current Visit evaluation;
4. one revenue-integrity exception type once its server-side evidence source exists.

Do not ingest every domain in the first PR.

### 4.3 P0.2 Role-aware Living Home

Living Home consumes server-produced `NeedsActionItem[]` and presents a role-specific operating picture.

Owner grouping:

- Needs attention
- Money to review
- Capacity
- Team / waiting

Provider grouping:

- Next clinical work
- Needs review
- Waiting

Front desk grouping:

- Patients not ready
- Waiting on patient
- Waiting on outside party

Biller grouping:

- Payment blockers
- Coding/review blockers
- Waiting on payer/external rail, when real evidence exists

Frontend does not expose `NeedsAction`, path IDs, capability IDs, state-machine names, or internal rule names.

### 4.4 P0.3 Golden Current Visit

The Golden Current Visit remains the existing encounter route and lifecycle.

Target sequence:

`Patient Snapshot`
→ `What Changed`
→ `Staff Handoff`
→ `Today`
→ `Clinical`
→ `Assessment & Plan`
→ `Orders & Results`
→ `Documentation & Coding`
→ `Close Visit`

P0 clinical additions:

1. persisted encounter-specific staff handoff for a bounded set of fields, preserving profession/role authority;
2. deterministic BodyMap composition for `INITIAL / PREVIOUS / TODAY` from immutable persisted versions;
3. deterministic Clinical Change projection for BodyMap + selected already-structured domains, not AI inference;
4. Current Visit visual integration of BodyMap and change evidence;
5. evidence-linked coding support remains suggestions/human-reviewed only;
6. close-visit evaluation consumes real governed evidence where available.

The Golden Case is No-Fault/MSK because it stress-tests longitudinal symptoms, functional change, BodyMap, treatment progression, case context, documentation, coding, and financial continuation without requiring a separate specialty app.

### 4.5 P0.4 Revenue-integrity continuation

P0 does not attempt autonomous claims or full RCM replacement.

It proves the universal financial continuity model:

`PERFORMED`
→ `DOCUMENTED`
→ `CODE SUPPORTED`
→ `CHARGE EXPECTED`
→ `CHARGE PRESENT`

The first supported exception is:

> a governed service/encounter event exists, the configured rule says a charge is expected, and no corresponding charge record/evidence is present.

This creates a **Revenue Review Item**, never a recovered-revenue claim.

Required user language:

- “May need review”
- “Charge not found”
- “Evidence incomplete”

Prohibited language:

- “Recovered” unless actually collected and reconciled
- “Lost revenue” unless evidence proves loss
- “Guaranteed revenue”

Revenue Review feeds the `NeedsAction` projection for owner/biller roles.

### 4.6 P0.5 Public Operating Map

The public Operating Map expands the existing free continuity check into a useful no-PHI acquisition experience.

Input remains deliberately non-sensitive:

- organization setting;
- operational pain areas;
- optional rough scale bands such as locations/providers/staff, only when commercially useful;
- no patient data;
- no production credentials;
- no diagnosis/claim data.

Output:

- selected workflow map;
- where continuity may be breaking based only on visitor answers;
- what Klinikos would inspect first;
- what Klinikos could handle;
- what must remain external;
- next commercial action.

The map must clearly label any estimate or hypothesis as such.

Primary CTA: `Review this with Klinikos` or the currently approved equivalent from canonical messaging tests.

The Operating Map should route into the existing governed sales/commercial path rather than creating a second CRM/payment system.

### 4.7 P0.6 Evidence and analytics

Analytics must measure the entire P0 value loop without sending PHI to inappropriate third parties.

Required commercial events:

- public page viewed;
- Operating Map started;
- Operating Map completed;
- commercial CTA clicked;
- sales reservation/intake started;
- checkout intent created;
- independently verified payment;
- implementation started;
- first product value event;
- recurring conversion when/if real.

Required product value events:

- NeedsAction surfaced;
- NeedsAction source resolved;
- Current Visit opened;
- Current Visit reaches governed ready-for-review/signature milestone;
- revenue review item surfaced/resolved;
- Grid draft created from an actual Clinic OS signal.

Analytics event payloads must use coarse identifiers or internal opaque IDs and must not contain patient name, DOB, MRN, diagnosis, free-text note content, claim number, or other unnecessary PHI.

## 5. UX / Black Label requirements

P0 uses the current shared Marble / Obsidian system.

No second theme framework.

Requirements:

- 390 / 768 / 1024 / 1440 / 1920 responsive checks;
- 200% zoom;
- visible keyboard focus;
- reduced-motion support;
- minimum consequential control target approximately 44px;
- plain-language state labels;
- no dashboard card wall;
- operative density for Current Visit / front desk / billing;
- contemplative density for public acquisition and high-level Living Home.

## 6. Commercial acceptance criteria

P0 is commercially successful only when it creates evidence for this sequence:

`VISITOR`
→ `UNDERSTANDS KLINIKOS`
→ `USES OPERATING MAP`
→ `TAKES COMMERCIAL NEXT STEP`
→ `PAYS / ENTERS QUALIFIED SALES PATH`
→ `RECEIVES IMPLEMENTATION`
→ `REACHES FIRST PRODUCT VALUE`
→ `EXPANDS / CONVERTS TO RECURRING VALUE`.

No stage may be marked complete from intent alone.

## 7. Explicitly deferred from P0

Preserve on the roadmap, but do not make them dependencies for this value loop:

- nationwide Grid liquidity;
- live marketplace payout settlement;
- percentage economics for regulated clinical/referral transactions;
- every specialty pack;
- autonomous coding/claims submission;
- full payer/clearinghouse automation;
- unrestricted universal free-member rollout before abuse/security gates;
- all enterprise SSO/SCIM features;
- white-label platform;
- developer marketplace;
- every possible AI agent;
- every external lab/imaging/EHR connector.

## 8. Dependency order

Implementation plans execute in this order unless a current-main reconciliation proves a safer order:

1. `2026-08-25-p0-release-control-and-confidentiality.md`
2. `2026-08-25-p0-universal-work-projection-and-living-home.md`
3. `2026-08-25-p0-golden-current-visit-and-clinical-change.md`
4. `2026-08-25-p0-revenue-integrity-continuity.md`
5. `2026-08-25-p0-operating-map-acquisition.md`
6. `2026-08-25-p0-analytics-and-conversion-evidence.md`

Some tasks can proceed in isolated branches after interfaces are locked, but merge order must preserve the dependency graph.

## 9. P0 success test

P0 is not done because six PRs merge.

It is done when a truthful end-to-end demonstration can show:

1. a public visitor understands the problem and completes the Operating Map;
2. the visitor can enter a real commercial next step;
3. an activated clinic owner sees actual unfinished work in Living Home;
4. a provider opens one Golden Current Visit and sees real longitudinal evidence, not demo claims;
5. a real governed financial gap becomes a truthful Revenue Review item;
6. the underlying source state can be resolved and the projection updates;
7. each consequential action remains tenant-scoped, authorized, auditable, and evidence-backed;
8. no proprietary routing/policy engine needs to ship to the browser to create the experience;
9. the funnel and product value events can be measured without inappropriate PHI leakage.
