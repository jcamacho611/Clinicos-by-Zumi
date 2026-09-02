# Klinikos One-Shell Wave 0 Immediate Correctness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct immediate customer-facing one-shell defects on current `main`: nested route resolution, internal architecture language leaking into the free-member UI, noncanonical member branding, and a hard-coded member palette that ignores the shared Marble/Obsidian material system.

**Architecture:** Preserve all current authentication and domain boundaries. This wave changes only presentation policy and the free-member presentation projection/components. Canonical plane IDs stay server/domain-owned, while a browser-safe presentation mapper translates them into ordinary customer-facing views. Existing semantic design tokens and the canonical Klinikos brand component are reused; no second theme, identity, Grid, or Zumi system is introduced.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind utility classes, semantic CSS custom properties from `src/app/design-tokens.css`, Vitest, existing Klinikos navigation/RBAC infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-02-klinikos-one-shell-customer-convergence-design.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains the sole product/architecture/business/experience authority.
- `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md` governs human-facing presentation under the Master Canon.
- Current verified implementation truth outranks this plan.
- Do not change patient, clinic, Person-account, or company authorization boundaries in Wave 0.
- Do not create a second shell/runtime/theme/Zumi/identity system.
- Do not expose canonical five-plane architecture as first-order customer navigation.
- Canonical plane IDs remain available in server/domain projections for governed reasoning and future advanced/X-Ray presentations.
- Use existing semantic tokens; do not introduce a new complete palette.
- Use the approved `KlinikosWordmark`/`KlinikosMark`; do not create another text-letter logo.
- No production code before a failing test for the behavior being changed.
- Navigation visibility is presentation only; protected destinations continue to revalidate authorization independently.
- Preserve the member repository's minimum-necessary boundary: do not join patient, clinical, billing, private organization, or private Grid records into the free Person home.

---

## File Structure

### New

- `src/lib/design/member-view-language.ts` — browser-safe mapping from canonical plane IDs/internal statuses to ordinary member-facing labels/descriptions/status copy. It owns presentation vocabulary only.
- `src/lib/design/member-view-language.test.ts` — direct RED→GREEN tests for that vocabulary and for the absence of architecture jargon.

### Modified

- `src/lib/navigation-experience.ts` — resolve nested workspace rules by longest explicit authority key before top-level fallback.
- `src/lib/navigation-experience.test.ts` — prove nested explicit rules and Grid fallback behavior.
- `src/lib/member/member-home-repository.ts` — preserve canonical IDs/truth but project ordinary member-facing profile, timeline, inspector and action copy.
- `src/components/living-universe/universe-shell.tsx` — canonical brand, semantic material tokens, ordinary context language.
- `src/components/living-universe/plane-lens.tsx` — customer-facing `Views`, no visible five-plane numbering/internal architecture labels, semantic tokens.
- `src/components/living-universe/object-stage.tsx` — ordinary profile/status/view language and semantic tokens.
- `src/components/living-universe/inspector.tsx` — `Why you're seeing this`, `What's confirmed`, `Before you act`; semantic tokens.
- `src/components/living-universe/action-dock.tsx` — shared semantic material tokens.
- `tests/living-universe-member-home.test.ts` — preserve canonical projection integrity while rejecting architecture jargon in rendered customer HTML.

---

### Task 1: Fix nested route presentation resolution

**Files:**
- Modify: `src/lib/navigation-experience.test.ts`
- Modify: `src/lib/navigation-experience.ts`

**Interfaces:**
- Consumes: `workspaceAccessRules` and `canAccessWorkspace(role, workspace)` from `src/lib/auth/workspace-authorization.ts`.
- Produces: `workspaceKeyForHref(href: string): string` as the single presentation-resolution helper used by `canOpen()`.

- [ ] **Step 1: Write failing tests for explicit nested rules and family fallback**

Add to `src/lib/navigation-experience.test.ts`:

```ts
it("uses the longest explicit workspace rule for nested destinations before family fallback", () => {
  expect(canOpen("clinic_owner", "/owner/founding-program")).toBe(true);
  expect(canOpen("clinic_owner", "/admin/sales")).toBe(true);
  expect(canOpen("provider", "/owner/founding-program")).toBe(false);
  expect(canOpen("provider", "/admin/sales")).toBe(false);
});

it("keeps nested Grid destinations governed by the top-level Grid rule when no explicit child rule exists", () => {
  expect(canOpen("contractor", "/grid/workspace")).toBe(true);
  expect(canOpen("contractor", "/grid/opportunities")).toBe(true);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx vitest run src/lib/navigation-experience.test.ts
```

Expected: the explicit nested-rule test fails because current `canOpen()` resolves `/owner/founding-program` to `owner` and `/admin/sales` to `admin` instead of their explicit rules.

- [ ] **Step 3: Implement longest-explicit-rule resolution**

Modify `src/lib/navigation-experience.ts` to import `workspaceAccessRules` and add:

```ts
export function workspaceKeyForHref(href: string) {
  const segments = href.split("/").filter(Boolean);
  for (let length = segments.length; length > 0; length -= 1) {
    const candidate = segments.slice(0, length).join("/");
    if (candidate in workspaceAccessRules) return candidate;
  }
  return segments[0] ?? "";
}

export function canOpen(role: ClinicRole, href: string) {
  if (href === "/edu") return true;
  return canAccessWorkspace(role, workspaceKeyForHref(href));
}
```

Do not create local copies of authorization rules.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npx vitest run src/lib/navigation-experience.test.ts tests/role-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/navigation-experience.ts src/lib/navigation-experience.test.ts
git commit -m "fix(frontend): resolve nested workspace presentation authority"
```

---

### Task 2: Create the member-facing view-language boundary

**Files:**
- Create: `src/lib/design/member-view-language.test.ts`
- Create: `src/lib/design/member-view-language.ts`

**Interfaces:**
- Consumes: `CanonicalPlaneId` from `src/lib/ecosystem/canonical-ecosystem-graph.ts`.
- Produces:
  - `memberViewForPlane(id: CanonicalPlaneId): MemberViewPresentation`
  - `memberStatusLabel(status: string): string`

Use exactly:

```ts
export type MemberViewPresentation = {
  label: "Connections" | "Opportunities" | "Journey" | "Activity" | "Growth";
  description: string;
};
```

- [ ] **Step 1: Write the failing presentation-vocabulary tests**

Create `src/lib/design/member-view-language.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canonicalEcosystemGraph } from "@/lib/ecosystem/canonical-ecosystem-graph";
import { memberStatusLabel, memberViewForPlane } from "@/lib/design/member-view-language";

const forbidden = /plane|projection|orchestration|tenant|state machine|governed/i;

describe("member view language", () => {
  it("maps all five canonical plane IDs to ordinary customer-facing views", () => {
    const labels = canonicalEcosystemGraph.planes.map((plane) => memberViewForPlane(plane.id).label);
    expect(labels).toEqual(["Connections", "Opportunities", "Journey", "Activity", "Growth"]);
  });

  it("keeps architecture jargon out of first-order descriptions", () => {
    for (const plane of canonicalEcosystemGraph.planes) {
      const view = memberViewForPlane(plane.id);
      expect(view.description).not.toMatch(forbidden);
    }
  });

  it("translates internal member statuses into calm customer language", () => {
    expect(memberStatusLabel("person_present")).toBe("Available");
    expect(memberStatusLabel("discovery_available")).toBe("Available");
    expect(memberStatusLabel("profile_started")).toBe("In progress");
    expect(memberStatusLabel("claims_present")).toBe("In progress");
    expect(memberStatusLabel("context_claimed")).toBe("In progress");
    expect(memberStatusLabel("account_connected")).toBe("Ready");
    expect(memberStatusLabel("not_projected")).toBe("Not available yet");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npx vitest run src/lib/design/member-view-language.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the minimal mapping**

Create `src/lib/design/member-view-language.ts`:

```ts
import type { CanonicalPlaneId } from "@/lib/ecosystem/canonical-ecosystem-graph";

export type MemberViewPresentation = {
  label: "Connections" | "Opportunities" | "Journey" | "Activity" | "Growth";
  description: string;
};

const views: Record<CanonicalPlaneId, MemberViewPresentation> = {
  healthcare_universe: {
    label: "Connections",
    description: "See the people and organizations connected to what you are trying to do.",
  },
  economic_resource: {
    label: "Opportunities",
    description: "See relevant work, services, learning, space, and other available resources.",
  },
  lifecycle: {
    label: "Journey",
    description: "See where you are now and the next useful step toward your goal.",
  },
  operating_infrastructure: {
    label: "Activity",
    description: "See the account activity and systems supporting your current next step.",
  },
  compounding_business: {
    label: "Growth",
    description: "See completed progress that can support future opportunities and outcomes.",
  },
};

const statuses: Record<string, string> = {
  person_present: "Available",
  discovery_available: "Available",
  profile_started: "In progress",
  claims_present: "In progress",
  context_claimed: "In progress",
  account_connected: "Ready",
  not_projected: "Not available yet",
};

export function memberViewForPlane(id: CanonicalPlaneId) {
  return views[id];
}

export function memberStatusLabel(status: string) {
  return statuses[status] ?? "Available";
}
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```bash
npx vitest run src/lib/design/member-view-language.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/design/member-view-language.ts src/lib/design/member-view-language.test.ts
git commit -m "feat(frontend): add member-facing view language"
```

---

### Task 3: Replace member architecture jargon with customer-facing projection copy

**Files:**
- Modify: `tests/living-universe-member-home.test.ts`
- Modify: `src/lib/member/member-home-repository.ts`

**Interfaces:**
- Consumes: canonical plane IDs/status from the existing member projection and `memberViewForPlane()`.
- Produces: the existing `MemberHomeProjection` shape with customer-facing labels/descriptions/copy; no schema/auth change.

- [ ] **Step 1: Change the rendered-home test first**

Replace the rendered canonical-title expectation with two separate guarantees:

```ts
it("preserves canonical plane identity in the projection while rendering customer-facing view language", () => {
  const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
  expect(projection.lenses.map((lens) => lens.id)).toEqual(canonicalEcosystemGraph.planes.map((plane) => plane.id));
  for (const label of ["Connections", "Opportunities", "Journey", "Activity", "Growth"]) {
    expect(html).toContain(label);
  }
  for (const plane of canonicalEcosystemGraph.planes) {
    expect(html).not.toContain(`>${plane.label}<`);
  }
});
```

Add:

```ts
it("keeps first-order member copy free of internal architecture vocabulary", () => {
  const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
  expect(html).not.toMatch(/Five-plane|Person profile|governed paths|Active object|Current lens/i);
  expect(html).toContain("Your profile");
  expect(html).toContain("Why you’re seeing this");
});
```

Update the local `projection` fixture to use the same customer-facing labels the production repository will produce while preserving canonical `id` values.

- [ ] **Step 2: Run the member test and verify RED**

Run:

```bash
npx vitest run tests/living-universe-member-home.test.ts
```

Expected: FAIL because current rendered components still expose internal architecture copy.

- [ ] **Step 3: Update the server projection copy without widening data access**

In `src/lib/member/member-home-repository.ts`:

- import `memberViewForPlane`;
- delete the internal `PLANE_DESCRIPTIONS` presentation map;
- build each lens from the canonical plane ID plus `memberViewForPlane(plane.id)`;
- keep existing `lensStatus()` internal states;
- keep all existing minimum-necessary database selections;
- use these object/timeline/inspector strings:

```ts
object: {
  id: "person-profile",
  title: "Your profile",
  kind: "Profile",
  state: hasClaims ? "Profile in progress" : "Account active",
  summary: hasClaims
    ? "Keep your information and supporting evidence together while Klinikos shows what can be used now and what still needs verification."
    : "Your Klinikos account is ready. Explore opportunities, learning, and next steps without being assigned a role you did not choose.",
  claimStatus: hasClaims ? "claimed" : "unverified",
  authorityNotice: "Information you add does not automatically verify a professional role, organization relationship, patient relationship, or eligibility for a regulated activity.",
},
timeline: {
  before: "You created your Klinikos account.",
  now: hasClaims
    ? "Your profile includes information or evidence that may still need verification."
    : "Your account is active and ready for the next step you choose.",
  next: requestedPath
    ? `Continue ${requestedPath.title} from the first available step.`
    : "Explore opportunities, learning, or the next step that matters to you.",
},
inspector: {
  eyebrow: "Why you’re seeing this",
  title: "What Klinikos can confirm",
  body: "This view uses only your account and profile information that is appropriate for this experience.",
  evidence,
  authority: [
    "Your account does not by itself verify a professional role or organization relationship.",
    "Some opportunities require additional verification before you can act.",
    "Zumi can explain and prepare next steps, but required approvals stay with the appropriate people and systems.",
  ],
},
```

Rename evidence strings into ordinary language:

- `Active person-owned account` → `Your Klinikos account is active`;
- `Email verification evidence is recorded` → `Your email is verified`;
- `Email verification evidence is not recorded` → `Email verification is not complete`;
- career/relationship messages must avoid `claim state`, `authority`, `governed` in visible text.

Update actions to:

```ts
{ id: "grid", label: "Find opportunities", href: "/grid", description: "Tell Klinikos what you need or have." },
{ id: "edu", label: "Learn & grow", href: "/edu", description: "Explore learning and development opportunities." },
{ id: "home", label: "Home", href: "/member", description: "Return to your Klinikos home." },
```

Keep requested Path continuation semantics and route allowlisting unchanged.

- [ ] **Step 4: Run repository/member tests**

Run:

```bash
npx vitest run tests/living-universe-member-home.test.ts src/lib/design/member-view-language.test.ts
```

Expected: component-language assertions may still fail until Task 4; server projection assertions must be correct.

- [ ] **Step 5: Commit the server projection/test-fixture portion only if its focused assertions are green**

If component copy still blocks the same test, leave the working tree uncommitted until Task 4 rather than weakening the test.

---

### Task 4: Converge the member shell presentation onto Klinikos branding, language and semantic materials

**Files:**
- Modify: `src/components/living-universe/universe-shell.tsx`
- Modify: `src/components/living-universe/plane-lens.tsx`
- Modify: `src/components/living-universe/object-stage.tsx`
- Modify: `src/components/living-universe/inspector.tsx`
- Modify: `src/components/living-universe/action-dock.tsx`
- Modify: `tests/living-universe-member-home.test.ts`

**Interfaces:**
- Consumes: existing `MemberHomeProjection`, `memberStatusLabel()`, `KlinikosWordmark`, existing semantic CSS variables.
- Produces: same component/export signatures; no caller changes beyond copy/theme behavior.

- [ ] **Step 1: Extend failing rendered-output tests for canonical brand + semantic material**

Add to `tests/living-universe-member-home.test.ts`:

```ts
it("uses canonical Klinikos branding and shared semantic materials", () => {
  const html = renderToStaticMarkup(createElement(UniverseShell, { projection }));
  expect(html).toContain("data-klinikos-approved-wordmark");
  expect(html).not.toContain(">K</span>");
  expect(html).toContain("var(--k-work-bg)");
  expect(html).toContain("var(--k-text)");
});
```

- [ ] **Step 2: Run and verify RED**

```bash
npx vitest run tests/living-universe-member-home.test.ts
```

Expected: FAIL because current member shell uses a fake `K` mark and hard-coded dark colors.

- [ ] **Step 3: Update `UniverseShell`**

- import `KlinikosWordmark`;
- replace the fake boxed `K` + text treatment with canonical `KlinikosWordmark href="/member"`;
- first-order context label becomes `Your Klinikos home`;
- secondary copy becomes `What matters now, based on the information available to you.`;
- replace the fixed dark background/text/borders with semantic variables such as:
  - `bg-[var(--k-work-bg)]`;
  - `text-[var(--k-text)]`;
  - `border-[var(--k-line)]`;
  - `bg-[var(--k-public-surface)]`;
  - `text-[var(--k-muted)]`;
  - `text-[var(--k-accent)]`;
- preserve `data-member-living-universe` and person object identifier attributes;
- preserve logout behavior.

- [ ] **Step 4: Update `PlaneLens`**

- import `memberStatusLabel`;
- `aria-label="Choose a view"`;
- no visible numeric 01–05 circle;
- no `Five-plane` copy;
- display `lens.title` (already customer-facing after Task 3) and translated status;
- style entirely from semantic variables;
- preserve `activeLens` canonical ID and `onSelect` behavior.

- [ ] **Step 5: Update `ObjectStage`**

- `Active object ·` → remove; show `object.kind` only as a quiet eyebrow;
- `Claimed information · not verified authority` → `Information added · verification may still be needed`;
- `Seen through {lens.title}` → `{lens.title} view`;
- style from semantic variables;
- preserve `data-active-plane` and `data-living-object-id` for internal/test semantics.

- [ ] **Step 6: Update `Inspector`**

- desktop `aria-label="Why you're seeing this"`;
- mobile control `Why you're seeing this` instead of `Open Inspector`;
- `Current lens` → `Current view`;
- `Evidence` → `What's confirmed`;
- `Authority` → `Before you act`;
- style from semantic variables;
- preserve the minimum-necessary evidence/authority arrays and canonical active-plane data attribute.

- [ ] **Step 7: Update `ActionDock`**

Use semantic variables for border/background/text/accent; retain route allowlisting, sticky positioning and minimum 44px controls.

- [ ] **Step 8: Run the full member slice and verify GREEN**

```bash
npx vitest run tests/living-universe-member-home.test.ts src/lib/design/member-view-language.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit Tasks 3–4 together**

```bash
git add \
  src/lib/member/member-home-repository.ts \
  src/components/living-universe/universe-shell.tsx \
  src/components/living-universe/plane-lens.tsx \
  src/components/living-universe/object-stage.tsx \
  src/components/living-universe/inspector.tsx \
  src/components/living-universe/action-dock.tsx \
  tests/living-universe-member-home.test.ts
git commit -m "fix(frontend): simplify member Living Home presentation"
```

---

### Task 5: Regression, security and browser acceptance

**Files:**
- Test existing files only unless a verified failure demonstrates a missing regression contract.

**Interfaces:**
- Consumes: exact branch head after Tasks 1–4.
- Produces: release evidence; no product behavior.

- [ ] **Step 1: Run focused regression suites**

```bash
npx vitest run \
  src/lib/navigation-experience.test.ts \
  tests/role-navigation.test.ts \
  src/lib/design/member-view-language.test.ts \
  tests/living-universe-member-home.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run type and lint gates**

```bash
npm run type-check
npm run lint
```

Expected: PASS except only explicitly documented pre-existing warnings.

- [ ] **Step 3: Run confidentiality/security gates**

```bash
npm run security:check
```

Expected: all repository confidentiality/disclosure gates pass.

- [ ] **Step 4: Run the full repository release/quality lane used by current `main`**

Use the repository's current Quality commands/scripts rather than inventing a reduced substitute. At minimum, verify fresh PostgreSQL migration validation where CI provides it, full tests, production build/start, and current release-contract scripts.

Expected: no new failure attributable to this wave.

- [ ] **Step 5: Browser QA `/member` in both materials**

Verify real browser behavior at:

- desktop 1440px, Marble/System-light;
- desktop 1440px, Obsidian/Dark;
- mobile 390px;
- true 200% browser zoom;
- keyboard-only.

Acceptance:

- canonical Klinikos brand renders without fake `K` replacement;
- customer sees `Connections / Opportunities / Journey / Activity / Growth`, not five-plane architecture;
- no `Person profile`, `governed paths`, `Active object`, `Current lens`, or `Five-plane` text;
- `Why you're seeing this` is reachable on mobile;
- all next actions remain route-allowlisted;
- no cross-domain private data is newly exposed;
- System/Light/Dark visibly changes member chrome through shared semantic tokens;
- focus remains visible and meaningful;
- no horizontal page overflow at 390px or 200% zoom.

- [ ] **Step 6: Refresh branch against latest `main` and rerun affected gates**

Do not merge a stale branch over current shell/presentation work. Reconcile with any merged route-presentation or material-convergence PR file-by-file.

- [ ] **Step 7: Commit only verified fixes caused by refresh conflicts/regressions**

Use a scoped commit message describing the actual reconciliation.

---

## Self-Review

### Spec coverage

Wave 0 covers the immediate-correctness items from the approved design:

- nested route presentation resolution;
- first-order member jargon removal;
- canonical member branding;
- shared semantic material use;
- preservation of canonical IDs and privacy boundaries.

The following are intentionally deferred to their own independently testable plans because they are separate security/application programs:

- shared shell-frame extraction;
- secure active-context/session switching;
- patient-shell convergence;
- public-intent continuity completion;
- corporate/founder Command authority and UI.

### Placeholder scan

No `TBD`, `TODO`, `implement later`, `similar to`, or undefined-code-step placeholders are permitted in this plan.

### Type consistency

- `MemberHomeProjection` remains unchanged structurally.
- `MemberPlaneLensProjection.id` remains `CanonicalPlaneId`.
- `memberViewForPlane()` receives `CanonicalPlaneId`.
- `workspaceKeyForHref()` returns the workspace key consumed by existing `canAccessWorkspace()`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-02-one-shell-wave-0-immediate-correctness.md`.

Recommended execution: **Subagent-Driven**, with a fresh reviewer gate per task. If executing inline instead, use the `superpowers:executing-plans` workflow and preserve RED→GREEN evidence for every production change.
