# P0 Universal Work Projection and Living Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give authenticated Klinikos users one truthful, role-aware view of unfinished work without creating a second task/workflow authority.

**Architecture:** Introduce a read-only `NeedsActionItem` presentation model and a server-only projector over existing authoritative inputs. Start with appointment readiness and Path guidance, then let later P0 plans add close-visit and revenue sources through the same interface. Dashboard loads the projection server-side and Living Home renders plain-language groups without understanding source-domain internals.

**Tech Stack:** Next.js server components, React client presentation, TypeScript, Vitest, existing RBAC/session/appointment/Path repositories.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Depends on P0 release-control/confidentiality work or must be reconciled with it before merge.
- `NeedsActionItem` is a projection, never mutable authority.
- No `completeNeedsAction()` API or table is permitted in P0.
- The source domain decides completion; projection recomputation reflects it.
- Role/tenant filtering happens server-side.
- Do not expose path IDs, capability IDs, private rules, ranking weights, or broad ORM records to the browser.
- Use plain-language state labels.
- Preserve existing appointment, Path, Grid, EDU, and launch flows.

---

### Task 1: Define browser-safe `NeedsActionItem`

**Files:**
- Create: `src/lib/home/needs-action.ts`
- Create: `tests/needs-action-contract.test.ts`

**Interfaces:**
- Produces:

```ts
export const NEEDS_ACTION_STATES = ["needs_you", "waiting", "needs_review", "blocked", "ready", "done"] as const;
export type NeedsActionState = typeof NEEDS_ACTION_STATES[number];

export const NEEDS_ACTION_DOMAINS = ["appointment", "path", "referral", "result", "form", "encounter", "revenue", "grid"] as const;
export type NeedsActionDomain = typeof NEEDS_ACTION_DOMAINS[number];

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

- [ ] **Step 1: Write the contract test**

```ts
import { describe, expect, it } from "vitest";
import { isNeedsActionItem } from "@/lib/home/needs-action";

describe("NeedsActionItem", () => {
  it("accepts a minimum-necessary work projection", () => {
    expect(isNeedsActionItem({
      id: "appointment:apt-1:intake",
      domain: "appointment",
      sourceId: "apt-1",
      organizationId: "org-1",
      patientId: "patient-1",
      ownerLabel: "Front desk",
      title: "Intake is incomplete",
      reason: "Required intake is incomplete.",
      state: "needs_you",
      urgency: "soon",
      dueAt: null,
      href: "/patients/patient-1",
      evidenceRef: "appointment:apt-1:formsComplete=false",
    })).toBe(true);
  });
});
```

Also prove invalid `domain`, invalid `state`, or blank evidence/title are rejected by the helper/schema implementation.

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/needs-action-contract.test.ts
```

- [ ] **Step 3: Implement browser-safe type + runtime validation**

Use an existing runtime-schema pattern if available. Do not import server-only modules.

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- tests/needs-action-contract.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/home/needs-action.ts tests/needs-action-contract.test.ts
git commit -m "feat(home): define unfinished-work projection"
```

### Task 2: Project appointment readiness server-side

**Files:**
- Create: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-appointment-projection.test.ts`
- Modify later: `src/components/clinic/living-home-operations.tsx` to stop being the sole owner of appointment-attention logic.

**Interfaces:**
- Consumes: `Appointment[]`, current `ClinicRole`, organization ID.
- Produces: `projectAppointmentNeedsAction(...) => NeedsActionItem[]`.

```ts
export function projectAppointmentNeedsAction(input: {
  organizationId: string;
  role: ClinicRole;
  appointments: Appointment[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write failing tests for current truthful reasons**

Cover these existing rules from `attentionReasons`:

```ts
expect(items.map((item) => item.reason)).toContain("Required intake is incomplete.");
expect(items.map((item) => item.reason)).toContain("Coverage has not been verified.");
expect(items.map((item) => item.reason)).toContain("Confirmation still needs to be recorded.");
```

Also prove:

- cancelled appointment creates no work item;
- payment due is not exposed to a role that cannot see it;
- each item has deterministic `appointment:<id>:<reason-key>` identity;
- no extra patient fields are copied into the item.

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/needs-action-appointment-projection.test.ts
```

- [ ] **Step 3: Implement projector**

Keep reason keys explicit:

```ts
function itemId(appointmentId: string, reason: "confirmation" | "no_show" | "intake" | "coverage" | "balance") {
  return `appointment:${appointmentId}:${reason}`;
}
```

Use the existing role visibility rules exactly; do not broaden them.

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- tests/needs-action-appointment-projection.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/home/needs-action-projection.ts tests/needs-action-appointment-projection.test.ts
git commit -m "feat(home): project appointment readiness into unfinished work"
```

### Task 3: Project Path guidance without exposing Path machinery

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-path-projection.test.ts`
- Read: `src/components/clinic/path-next-action.tsx`
- Read: `src/lib/orchestration/path-guidance-engine.ts`

**Interfaces:**
- Consumes existing presentation-safe `PathGuidanceView[]` and active path snapshots already loaded server-side.
- Produces path-derived `NeedsActionItem[]`.

```ts
export function projectPathNeedsAction(input: {
  organizationId: string;
  guidance: PathGuidanceView[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write failing state-mapping tests**

Expected mappings:

```ts
blocked          -> blocked
review_required  -> needs_review
waiting          -> waiting
available        -> ready
completed        -> done
```

A completed path may be omitted from the active “needs attention” grouping, but the projector must be deterministic and test that decision.

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/needs-action-path-projection.test.ts
```

- [ ] **Step 3: Implement projection**

Use `guidance.reason`, `guidance.href`, safe owner/blocker labels already present in `PathGuidanceView`. Do not import `path-engine` into the browser or put hidden runtime state in the item.

- [ ] **Step 4: Verify GREEN**

```bash
npm test -- tests/needs-action-path-projection.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/home/needs-action-projection.ts tests/needs-action-path-projection.test.ts
git commit -m "feat(home): project Path guidance into unfinished work"
```

### Task 4: Add role-aware server grouping

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-groups.test.ts`

**Interfaces:**
- Produces:

```ts
export type NeedsActionGroupKey =
  | "needs_attention"
  | "clinical_work"
  | "patients_not_ready"
  | "payment_blockers"
  | "money_to_review"
  | "waiting"
  | "capacity";

export interface NeedsActionGroup {
  key: NeedsActionGroupKey;
  label: string;
  items: NeedsActionItem[];
}

export function groupNeedsActionForRole(role: ClinicRole, items: NeedsActionItem[]): NeedsActionGroup[];
```

- [ ] **Step 1: Write role grouping tests**

Prove at minimum:

```ts
expect(ownerGroups.map((group) => group.label)).toContain("Needs attention");
expect(frontDeskGroups.map((group) => group.label)).toContain("Patients not ready");
expect(providerGroups.map((group) => group.label)).toContain("Next clinical work");
expect(billerGroups.map((group) => group.label)).toContain("Payment blockers");
```

Do not create empty groups unless the UI deliberately uses them as an all-clear state.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement deterministic grouping**

Grouping is presentation policy only; it does not change item authority/state.

- [ ] **Step 4: Verify GREEN**

- [ ] **Step 5: Commit**

```bash
git commit -am "feat(home): group unfinished work by role"
```

### Task 5: Load `NeedsAction` from the dashboard server component

**Files:**
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/living-home-operations.tsx`
- Test: `tests/living-home-needs-action.test.ts`

**Interfaces:**
- Dashboard produces `needsActionGroups` from already-authorized server data.
- Living Home receives `needsActionGroups: NeedsActionGroup[]`.

- [ ] **Step 1: Write failing source/behavior test**

Assert dashboard imports and calls the projector after appointments + path guidance are loaded, and `LivingHome` accepts `needsActionGroups`.

- [ ] **Step 2: Verify RED**

```bash
npm test -- tests/living-home-needs-action.test.ts
```

- [ ] **Step 3: Wire server projection**

Conceptually:

```ts
const needsAction = [
  ...projectAppointmentNeedsAction({
    organizationId: session.organizationId,
    role: session.role,
    appointments: livingAppointments,
  }),
  ...projectPathNeedsAction({
    organizationId: session.organizationId,
    guidance: pathGuidance,
  }),
];
const needsActionGroups = groupNeedsActionForRole(session.role, needsAction);
```

Pass only the grouped projection to the client.

- [ ] **Step 4: Replace duplicated appointment attention presentation carefully**

`LivingHomeOperations` may continue using full appointment records for schedule/ribbon/focus panel, but its “Needs you” exception list should consume the canonical projection or a shared pure reason function. Do not let two different rule implementations diverge.

- [ ] **Step 5: Verify**

```bash
npm test -- tests/needs-action-contract.test.ts tests/needs-action-appointment-projection.test.ts tests/needs-action-path-projection.test.ts tests/needs-action-groups.test.ts tests/living-home-needs-action.test.ts
npm run type-check
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/app/'(platform)'/dashboard/page.tsx src/components/clinic/living-home.tsx src/components/clinic/living-home-operations.tsx src/lib/home tests
git commit -m "feat(home): make Living Home role-aware around unfinished work"
```

### Task 6: Black Label operating presentation

**Files:**
- Modify: existing Living Home scoped styles/components only.
- Test: `tests/living-home-needs-action.test.ts`

**Interfaces:**
- Consumes `NeedsActionGroup[]`.
- Produces calm role-specific operating sections.

- [ ] **Step 1: Lock copy in the test**

Required ordinary-user labels:

```text
Needs attention
Next clinical work
Patients not ready
Payment blockers
Waiting
```

Prohibit rendered/internal copy:

```text
NeedsAction
sourceDomain
pathId
capabilityId
blocked_by_policy
```

- [ ] **Step 2: Implement presentation**

Use progressive disclosure. Primary group gets visual authority; secondary groups remain compact. Maintain current Marble/Obsidian tokens. Do not introduce a second dashboard-card system.

- [ ] **Step 3: Browser/accessibility QA**

Verify 390, 768, 1024, 1440, 1920 and 200% zoom. Keyboard must reach every actionable item. Empty state must read as an intentional all-clear or truthful “nothing loaded,” not a blank panel.

- [ ] **Step 4: Commit**

```bash
git commit -am "feat(home): present unfinished work as Black Label operating state"
```

### Task 7: Extension contract for later P0 sources

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Test: `tests/needs-action-extension-contract.test.ts`

**Interfaces:**
- Produces pure adapter signatures later plans will implement:

```ts
export interface NeedsActionSourceAdapter<T> {
  project(input: T): NeedsActionItem[];
}
```

Do not introduce a plugin framework if ordinary exported functions are sufficient. The test should simply prove adding `encounter` or `revenue` domain items does not require client changes.

- [ ] **Step 1: Write failing extension test**

Create a sample revenue item and prove `groupNeedsActionForRole("biller", ...)` puts it in `Payment blockers` / `Money to review` according to the final grouping design.

- [ ] **Step 2: Implement only the minimum type/group support**

No revenue query here; the revenue plan owns evidence generation.

- [ ] **Step 3: Verify all focused tests**

- [ ] **Step 4: Commit**

```bash
git commit -am "refactor(home): make unfinished-work projection extensible"
```

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile latest main and release-control branch**

- [ ] **Step 2: Run**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

- [ ] **Step 3: Manual role matrix**

Verify clinic owner, provider, front desk, biller, administrator, and at least one role without patient-record permission.

- [ ] **Step 4: PR non-claims**

State explicitly:

- no second task authority;
- no complete universal-domain projection yet;
- no revenue-review source until the later P0 revenue plan;
- no new clinical authority;
- no fake “money lost/recovered” values.
