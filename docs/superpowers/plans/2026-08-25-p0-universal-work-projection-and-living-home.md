# P0 Universal Work Projection and Living Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give authenticated Klinikos users one truthful, role-aware view of unfinished work without creating a second task/workflow authority.

**Architecture:** Introduce a browser-safe read-only `NeedsActionItem` and a server-only projector over existing authoritative inputs. Start with appointment readiness and Path guidance. Dashboard composes and role-groups the projection server-side; Living Home renders it without understanding source-domain state machines. Later P0 revenue/clinical plans add new projector functions to the same module.

**Tech Stack:** Next.js server components, React client presentation, TypeScript, Zod, Vitest, existing RBAC/session/appointment/Path repositories.

**Spec:** `docs/superpowers/specs/2026-08-25-klinikos-p0-value-loop-design.md`

## Global Constraints

- Depends on `2026-08-25-p0-release-control-and-confidentiality.md` and must reconcile with it before merge.
- `NeedsActionItem` is a presentation projection, never mutable authority.
- No `NeedsAction` table, completion API, update API, or independent lifecycle is allowed in P0.
- Source-domain change is the only thing that resolves a projected item.
- Role/tenant filtering happens server-side.
- Client DTO contains no organization ID, patient ID, evidence reference, private rule ID, ranking weight, capability ID, or raw ORM row.
- Preserve existing appointment, Path, Grid, EDU, and launch authorities.

---

### Task 1: Define the browser-safe `NeedsActionItem`

**Files:**
- Create: `src/lib/home/needs-action.ts`
- Create: `tests/needs-action-contract.test.ts`

**Interfaces:**

```ts
import { z } from "zod";

export const NEEDS_ACTION_STATES = ["needs_you", "waiting", "needs_review", "blocked", "ready"] as const;
export const NEEDS_ACTION_DOMAINS = ["appointment", "path", "encounter", "revenue", "grid"] as const;

export const needsActionItemSchema = z.object({
  id: z.string().min(1).max(180),
  domain: z.enum(NEEDS_ACTION_DOMAINS),
  ownerLabel: z.string().min(1).max(80).nullable(),
  title: z.string().min(1).max(160),
  reason: z.string().min(1).max(500),
  state: z.enum(NEEDS_ACTION_STATES),
  urgency: z.enum(["routine", "soon", "urgent"]),
  dueAt: z.string().datetime().nullable(),
  action: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("href"), href: z.string().startsWith("/").max(500) }).strict(),
    z.object({ kind: z.literal("focus_appointment"), appointmentId: z.string().min(1).max(120) }).strict(),
  ]).nullable(),
}).strict();

export type NeedsActionItem = z.infer<typeof needsActionItemSchema>;
```

- [ ] **Step 1: Write the RED contract test**

```ts
import { describe, expect, it } from "vitest";
import { needsActionItemSchema } from "@/lib/home/needs-action";

describe("NeedsActionItem", () => {
  it("accepts a minimum-necessary projection", () => {
    expect(needsActionItemSchema.parse({
      id: "appointment:apt-1:intake",
      domain: "appointment",
      ownerLabel: "Front desk",
      title: "Intake is incomplete",
      reason: "Required intake is incomplete.",
      state: "needs_you",
      urgency: "soon",
      dueAt: null,
      action: { kind: "focus_appointment", appointmentId: "apt-1" },
    }).domain).toBe("appointment");
  });

  it("rejects internal evidence fields", () => {
    expect(() => needsActionItemSchema.parse({
      id: "x", domain: "appointment", ownerLabel: null, title: "x", reason: "x",
      state: "needs_you", urgency: "routine", dueAt: null, action: null,
      organizationId: "org-1", patientId: "p-1", evidenceRef: "private-rule:1",
    })).toThrow();
  });
});
```

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/needs-action-contract.test.ts
```

- [ ] **Step 3: Implement the exact strict Zod schema above**

No server-only imports in this module.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/needs-action-contract.test.ts
git add src/lib/home/needs-action.ts tests/needs-action-contract.test.ts
git commit -m "feat(home): define browser-safe unfinished-work projection"
```

### Task 2: Project appointment readiness server-side

**Files:**
- Create: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-appointment-projection.test.ts`
- Modify in Task 5: `src/components/clinic/living-home-operations.tsx`

**Interfaces:**

```ts
export function projectAppointmentNeedsAction(input: {
  role: ClinicRole;
  appointments: Appointment[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write RED tests for the existing `attentionReasons` law**

Require items for incomplete intake, unverified coverage only for currently permitted roles, unrecorded confirmation, no-show follow-up, and visible balance only for currently permitted roles. Cancelled appointments produce no item.

```ts
expect(items.map((item) => item.reason)).toContain("Required intake is incomplete.");
expect(items[0]?.action).toEqual({ kind: "focus_appointment", appointmentId: "apt-1" });
```

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/needs-action-appointment-projection.test.ts
```

- [ ] **Step 3: Move the exact appointment-reason logic out of `living-home-operations.tsx` into the server-safe projector**

Use explicit reason keys `confirmation | no_show | intake | coverage | balance`. Item ID is `appointment:<appointmentId>:<reasonKey>`. Do not copy patient name into the item title if the existing appointment ribbon/focus UI already supplies that context; keep the projection minimum necessary.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/needs-action-appointment-projection.test.ts
git add src/lib/home/needs-action-projection.ts tests/needs-action-appointment-projection.test.ts
git commit -m "feat(home): project appointment readiness into unfinished work"
```

### Task 3: Project Path guidance without exposing Path runtime

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-path-projection.test.ts`
- Reuse: `src/lib/orchestration/path-guidance-engine.ts`

**Interfaces:**

```ts
export function projectPathNeedsAction(input: {
  guidance: PathGuidanceView[];
}): NeedsActionItem[];
```

- [ ] **Step 1: Write RED state-mapping tests**

```text
blocked         -> blocked
review_required -> needs_review
waiting         -> waiting
available       -> ready
completed       -> omitted
```

A Path action is `{ kind: "href", href: guidance.href }`. Browser copy uses `guidance.title/reason`; it never receives path runtime weights/step definitions through this projection.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/needs-action-path-projection.test.ts
```

- [ ] **Step 3: Implement the deterministic mapping above**

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/needs-action-path-projection.test.ts
git add src/lib/home/needs-action-projection.ts tests/needs-action-path-projection.test.ts
git commit -m "feat(home): project Path guidance into unfinished work"
```

### Task 4: Add exact role-aware grouping

**Files:**
- Modify: `src/lib/home/needs-action-projection.ts`
- Create: `tests/needs-action-groups.test.ts`

**Interfaces:**

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

export function groupNeedsActionForRole(
  role: ClinicRole,
  items: NeedsActionItem[],
): NeedsActionGroup[];
```

- [ ] **Step 1: Write RED grouping tests**

Require:

```ts
expect(groupNeedsActionForRole("clinic_owner", ownerItems).map((g) => g.label)).toContain("Needs attention");
expect(groupNeedsActionForRole("front_desk", deskItems).map((g) => g.label)).toContain("Patients not ready");
expect(groupNeedsActionForRole("provider", providerItems).map((g) => g.label)).toContain("Next clinical work");
expect(groupNeedsActionForRole("biller", billerItems).map((g) => g.label)).toContain("Payment blockers");
```

Empty groups are omitted. Unrecognized domain/role combinations fall back to `Needs attention` only when the item was already server-authorized for that role.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/needs-action-groups.test.ts
```

- [ ] **Step 3: Implement deterministic grouping**

Grouping changes presentation only, never item state.

- [ ] **Step 4: Run GREEN and commit**

```bash
npm test -- tests/needs-action-groups.test.ts
git add src/lib/home/needs-action-projection.ts tests/needs-action-groups.test.ts
git commit -m "feat(home): group unfinished work by role"
```

### Task 5: Load the projection in the dashboard server component

**Files:**
- Modify: `src/app/(platform)/dashboard/page.tsx`
- Modify: `src/components/clinic/living-home.tsx`
- Modify: `src/components/clinic/living-home-operations.tsx`
- Create: `tests/living-home-needs-action.test.ts`

- [ ] **Step 1: Write RED source/behavior assertions**

Dashboard must call `projectAppointmentNeedsAction`, `projectPathNeedsAction`, then `groupNeedsActionForRole`, and pass `needsActionGroups` to `LivingHome`.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/living-home-needs-action.test.ts
```

- [ ] **Step 3: Wire server projection**

```ts
const needsActionGroups = groupNeedsActionForRole(session.role, [
  ...projectAppointmentNeedsAction({ role: session.role, appointments: livingAppointments }),
  ...projectPathNeedsAction({ guidance: pathGuidance }),
]);
```

- [ ] **Step 4: Remove duplicate client appointment-reason authority**

`LivingHomeOperations` continues receiving raw appointments for ribbon/focus rendering, but its exception list consumes appointment-domain items from `needsActionGroups`. A `focus_appointment` action calls the existing `focusAppointment(appointmentId)` handler. Delete the local `attentionReasons` rule implementation after all references are moved.

- [ ] **Step 5: Verify and commit**

```bash
npm test -- tests/needs-action-contract.test.ts tests/needs-action-appointment-projection.test.ts tests/needs-action-path-projection.test.ts tests/needs-action-groups.test.ts tests/living-home-needs-action.test.ts
npm run type-check
npm run lint
git add src/app/'(platform)'/dashboard/page.tsx src/components/clinic/living-home.tsx src/components/clinic/living-home-operations.tsx src/lib/home tests
git commit -m "feat(home): make Living Home role-aware around unfinished work"
```

### Task 6: Apply the Black Label operating presentation

**Files:**
- Modify: `src/components/clinic/living-home-operations.tsx`
- Modify: `src/app/unicorn-experience.css`
- Modify: `tests/living-home-needs-action.test.ts`

- [ ] **Step 1: Lock ordinary-user labels and prohibited jargon**

Require `Needs attention`, `Next clinical work`, `Patients not ready`, `Payment blockers`, `Waiting`. Prohibit visible `NeedsAction`, `pathId`, `capabilityId`, `blocked_by_policy`, `evidenceRef`.

- [ ] **Step 2: Render one visually dominant first non-empty group and compact secondary groups**

No generic four-card KPI wall. Use current Marble/Obsidian tokens and Living Edge only for consequential unresolved state.

- [ ] **Step 3: Verify responsive/accessibility states**

390/768/1024/1440/1920, 200% zoom, keyboard, reduced motion, no-items all-clear, one group, multiple groups, long reason text.

- [ ] **Step 4: Commit**

```bash
git add src/components/clinic/living-home-operations.tsx src/app/unicorn-experience.css tests/living-home-needs-action.test.ts
git commit -m "feat(home): present unfinished work as Black Label operating state"
```

### Task 7: Lock the extension boundary for later encounter/revenue/Grid sources

**Files:**
- Modify: `tests/needs-action-groups.test.ts`

- [ ] **Step 1: Add RED/then-GREEN examples using synthetic `encounter`, `revenue`, and `grid` `NeedsActionItem`s**

Prove the existing browser component/grouping contract can accept later source adapters without adding client domain state machines. Revenue item for biller maps to `Payment blockers`/`Money to review`; Grid item for owner maps to `Capacity`; encounter item for provider maps to `Next clinical work`.

- [ ] **Step 2: Change only grouping code if the tests expose a missing mapping**

Do not add revenue/encounter/Grid queries in this plan.

- [ ] **Step 3: Verify and commit**

```bash
npm test -- tests/needs-action-groups.test.ts
git add src/lib/home/needs-action-projection.ts tests/needs-action-groups.test.ts
git commit -m "test(home): lock unfinished-work extension boundary"
```

### Task 8: Final verification and PR

- [ ] **Step 1: Reconcile newest main and release-control branch**

- [ ] **Step 2: Run fresh evidence**

```bash
npx prisma validate
npm run type-check
npm run lint
npm test -- --run
npm run security:check
npm run build
```

- [ ] **Step 3: Manual role matrix**

Verify clinic owner, provider, front desk, biller, administrator, and a role without patient-record permission.

- [ ] **Step 4: PR non-claims**

State: no second task authority; no complete universal-domain projection yet; revenue/encounter/Grid source queries remain owned by later plans; no new clinical authority; no fake money-loss/recovery values.
