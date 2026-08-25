# Klinikos P0 Value Loop Design

**Date:** 2026-08-25  
**Status:** APPROVED DESIGN BASELINE, NOT IMPLEMENTATION TRUTH  
**Repository baseline:** `main@cdd425d8c6d468047a4c3f42b8fb5d26939be26e`

## 1. Goal

Build the smallest product sequence that simultaneously improves commercial conversion, physician value, clinic operating clarity, revenue proof, customer acquisition, and long-term platform architecture without creating a parallel app or weakening authority boundaries.

The approved P0 value loop is:

`PUBLIC OPERATING MAP`
→ `QUALIFIED / PAID COMMERCIAL ENTRY`
→ `ROLE-AWARE LIVING HOME`
→ `UNFINISHED-WORK PROJECTION`
→ `GOLDEN CURRENT VISIT`
→ `CLINICAL CHANGE / BODYMAP`
→ `REVENUE-INTEGRITY CONTINUATION`
→ `EVIDENCE / ANALYTICS`

P0 is not “build all of Klinikos.” It is the shortest compounding loop from buyer comprehension to measurable product value.

## 2. Current truth that controls this design

At the approved baseline:

- `main` is `cdd425d8c6d468047a4c3f42b8fb5d26939be26e`.
- `main` branch protection and required status checks are disabled.
- GitHub Actions has repeatedly failed before checkout because jobs are not receiving runners; local verification is not hosted-CI proof.
- `.github/workflows/quality.yml` already identifies the runner condition as account-level and contains the `verify` and `deploy-contract` jobs. Do not weaken it to make a badge green.
- authenticated Living Home currently value-imports `@/lib/orchestration/intent-engine` and `@/lib/orchestration/path-engine` into client code, while the public routing engine has already been moved server-side.
- Current Visit exists and preserves encounter draft/review/sign/lock/addendum authority.
- Current Visit already renders Patient Snapshot, truthful unavailable `What changed`, partial Staff Handoff from vitals/medication reconciliation, note sections, coding, audit, and Close Visit.
- immutable `BodyMapVersion` / `BodyMapFinding` persistence and a deterministic BodyMap comparator are merged on main; Current Visit authoring/composition for `INITIAL → PREVIOUS → TODAY` is not complete.
- `close-visit-resolution.ts` already defines governed slots for coding, orders/results, AI review, attestations, and charge readiness.
- canonical claim-level revenue truth already exists through `revenue-integrity-path.ts` / `revenue-integrity-repository.ts`.
- Clinic OS → Grid already detects truthful operational signals without auto-publishing them.
- public `/klinikos` already contains a browser-only free Clinic continuity check. It is useful but is not yet the canonical Operating Map acquisition product.
- current commercial payment/sales architecture already separates checkout redirect from verified payment evidence.
- commercial execution remains the near-term business bottleneck.

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
- charge/payment/revenue realization from a potential review item;
- credential/licensure from profile, education, or self-description.

### 3.3 Authority law

A projection may aggregate and explain truth. It may not become a second authority store.

P0 preserves authoritative repositories for encounters, appointments, Paths, referrals/results/forms where used, finance, Grid, EDU, identity, audit, and payment evidence.

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
2. move authenticated deterministic intent and Path runtime evaluation out of client bundles;
3. return strict minimum-necessary intent and Path-presentation DTOs;
4. confirm/repair GitHub Actions runner availability without weakening `quality.yml`;
5. reconcile stale/open clinical, EDU, identity, and architecture PRs;
6. after hosted checks reliably execute, require `Quality / verify` and `Quality / deploy-contract` on protected `main` through GitHub branch/ruleset settings.

Branch protection is not marked complete until repository metadata confirms it.

### 4.2 P0.1 Universal unfinished-work projection

Introduce a browser-safe read-only `NeedsActionItem`.

It is not a task database and is never directly completed by a user.

```ts
export type NeedsActionState = "needs_you" | "waiting" | "needs_review" | "blocked" | "ready";
export type NeedsActionDomain = "appointment" | "path" | "encounter" | "revenue" | "grid";

export interface NeedsActionItem {
  id: string;
  domain: NeedsActionDomain;
  ownerLabel: string | null;
  title: string;
  reason: string;
  state: NeedsActionState;
  urgency: "routine" | "soon" | "urgent";
  dueAt: string | null;
  action:
    | { kind: "href"; href: string }
    | { kind: "focus_appointment"; appointmentId: string }
    | null;
}
```

Browser DTO intentionally omits organization ID, patient ID, evidence refs, capability IDs, policy/ranking internals, and raw domain objects.

Initial projector sources:

1. appointment readiness currently implemented by Living Home `attentionReasons`;
2. server-produced Path guidance.

Later P0 source adapters add:

3. Current Visit/encounter blockers where evidence is safe for that role;
4. Revenue Review for roles with billing read;
5. Grid capacity/work signals when the source signal is already authorized.

A source-domain state change causes the item to change/disappear. There is no `completeNeedsAction()` API.

### 4.3 P0.2 Role-aware Living Home

Dashboard composes and groups the projection on the server.

Representative grouping:

**Owner**
- Needs attention
- Money to review
- Capacity
- Waiting

**Provider**
- Next clinical work
- Needs review
- Waiting

**Front desk**
- Patients not ready
- Waiting

**Biller**
- Payment blockers
- Money to review
- Waiting

The frontend never displays `NeedsAction`, path IDs, capability IDs, internal rule codes, or evidence refs as customer copy.

### 4.4 P0.3 Golden Current Visit

Golden Current Visit remains the existing encounter route/lifecycle.

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

1. append-only encounter-specific Staff Handoff evidence;
2. V1 authoring fail-closed to existing `provider` and `clinical_staff` roles, without pretending a generic role proves MA/LPN/RN profession;
3. deterministic BodyMap composition for `INITIAL / PREVIOUS / TODAY` using merged immutable persistence, the existing prior-finalized-encounter selector, and the existing comparator;
4. Current Visit visual integration of longitudinal BodyMap change;
5. coding remains human-reviewed/evidence-linked;
6. close-visit evaluation consumes governed evidence only.

Golden synthetic case:

```text
Initial: left shoulder pain 8
Previous: left shoulder pain 6
Today: left shoulder pain 6 + new dizziness
```

Expected deterministic change:

```text
8 → 6 = severity improved
6 → 6 = unchanged
new dizziness = finding added
```

No omission becomes resolution.

### 4.5 P0.4 Revenue-integrity continuation

P0 does not attempt autonomous claims or full RCM replacement.

Existing canonical claim progression remains:

`PERFORMED`
→ `DOCUMENTED`
→ `CODED`
→ `CLAIM READY`
→ `SUBMITTED`
→ `ACCEPTED`
→ `ADJUDICATED`
→ `PAID`
→ `RECONCILED`.

P0 adds one high-confidence **pre-claim** review condition:

> a finalized encounter has a human-reviewed superbill with non-empty diagnosis/procedure evidence, but no ClaimDraft in the same organization is linked to the encounter/superbill.

This creates:

```text
Billing path may need review
```

with `amountCents = null` unless another authoritative source provides an amount.

P0 also projects existing claim-level facts such as missing coding and open denials through the same safe `RevenueReviewItem` vocabulary.

Required language:

- Billing path may need review
- Needs review
- Open denial
- Amount under review

Prohibited unless independently proven:

- lost revenue
- recovered revenue
- guaranteed recovery

Revenue Review feeds Billing and, for roles with billing-read permission, Living Home.

### 4.6 P0.5 Public Operating Map

The Operating Map converts the existing continuity check into a canonical public acquisition product.

Input is strict enumeration only:

**Setting**
- independent practice owner
- practice manager/administrator
- provider
- clinical staff
- multi-site operator
- student/newly licensed

**Pain areas**
- recall/follow-up
- referral closure
- result acknowledgment
- prior authorization
- no-show recovery
- intake/consent
- charge/claim readiness
- coverage/staffing
- idle rooms/chairs

No patient data, arbitrary clinical free text, production credentials, diagnoses, or claim data.

Output:

- a workflow map for each selected area;
- exactly what the visitor selected;
- what Klinikos would inspect first;
- what remains externally authoritative;
- a commercial next action.

It never claims Klinikos actually inspected the clinic.

Canonical route: `/operating-map`.

Homepage clinic-acquisition CTA target: `/operating-map`, candidate CTA locked in the P0 plan as **Map my clinic**. Existing `/operational-audit` remains a separate paid/commercial path.

Commercial handoff reuses `POST /api/sales/reservations`; payment/price/activation truth remains server-owned.

### 4.7 P0.6 Evidence and analytics

P0 uses first-party allowlisted product interaction events only where the event cannot be derived from an authoritative source.

Interaction taxonomy:

- Operating Map started/completed/commercial CTA clicked;
- Living Home opened;
- unfinished-work item/group interaction;
- Current Visit opened;
- real ready-for-review transition value event;
- Revenue Review opened;
- Grid draft opened from an actual Clinic OS signal.

Sales reservations are read from DemoReservation/DemoReservationEvent truth. Verified payments are read from Financial OS/payment evidence. Analytics does not copy those states and pretend to be authority.

P0 analytics payloads contain no patient/encounter/claim IDs, PHI, diagnosis, note text, claim number, arbitrary URL, IP address, user-agent, or referrer. Authenticated event identity is derived from the server clinic session.

## 5. UX / Black Label requirements

P0 uses the current shared Marble / Obsidian system, not a second theme.

Required verification:

- 390 / 768 / 1024 / 1440 / 1920 widths;
- 200% zoom;
- visible keyboard focus;
- reduced motion;
- consequential controls around 44px minimum target;
- plain-language states;
- no generic KPI/card wall;
- operative density for Current Visit/front desk/billing;
- contemplative density for public acquisition and high-level Living Home.

## 6. Commercial acceptance criteria

P0 must create measurable evidence for:

`VISITOR`
→ `OPERATING MAP`
→ `COMMERCIAL NEXT STEP`
→ `RESERVATION / VERIFIED PAYMENT WHEN REAL`
→ `IMPLEMENTATION`
→ `FIRST PRODUCT VALUE`
→ `RECURRING / EXPANSION WHEN REAL`.

No stage may be marked complete from intent, click, redirect, or estimate alone.

## 7. Explicitly deferred from P0

Preserve on the roadmap, but do not make dependencies of this loop:

- nationwide Grid liquidity;
- live marketplace payout settlement;
- percentage economics for regulated clinical/referral transactions;
- every specialty pack;
- autonomous coding/claims submission;
- full payer/clearinghouse automation;
- unrestricted universal free-member rollout before abuse/security gates;
- full enterprise SSO/SCIM expansion;
- white-label platform;
- developer marketplace;
- every possible AI agent;
- every external lab/imaging/EHR connector.

## 8. Dependency order

Implement in this sequence unless newest-main reconciliation proves a hard conflict:

1. `docs/superpowers/plans/2026-08-25-p0-release-control-and-confidentiality.md`
2. `docs/superpowers/plans/2026-08-25-p0-universal-work-projection-and-living-home.md`
3. `docs/superpowers/plans/2026-08-25-p0-golden-current-visit-and-clinical-change.md`
4. `docs/superpowers/plans/2026-08-25-p0-revenue-integrity-continuity.md`
5. `docs/superpowers/plans/2026-08-25-p0-operating-map-acquisition.md`
6. `docs/superpowers/plans/2026-08-25-p0-analytics-and-conversion-evidence.md`

Isolated branches may proceed after the interfaces they depend on are locked, but merge order must preserve the authority graph.

## 9. P0 success test

P0 is not done because six PRs merge.

It is done only when an end-to-end truthful demonstration proves:

1. a public visitor completes the no-PHI Operating Map and can take a real commercial next step;
2. an activated clinic owner sees real authorized unfinished work in Living Home;
3. a provider opens the Golden Current Visit and sees persisted longitudinal evidence, not demo inference;
4. the Golden BodyMap case produces deterministic expected change;
5. a reviewed-coding-without-claim condition becomes a Revenue Review item with no invented dollar amount;
6. creating the legitimate source-domain follow-up changes/removes the projection;
7. consequential actions remain tenant-scoped, authorized, auditable, and evidence-backed;
8. authenticated Living Home ships no `intent-engine` or `path-engine` implementation to the browser;
9. sales/payment/product analytics preserve their separate authorities and emit no inappropriate PHI.
