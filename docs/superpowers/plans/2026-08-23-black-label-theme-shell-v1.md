# Black Label Theme + Shell V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile PR #240 into current `main` as the first production Black Label tranche: one System/Light/Dark appearance authority, real Marble/Obsidian semantic materials, and an authenticated shell that consumes those tokens without creating a parallel theme or shell.

**Architecture:** Keep the existing atmosphere system, brand components, `AppShell`, routes and authorization. Replace customer-facing Dawn/Day/Golden/Night preferences with `system | light | dark`, preserve dawn/day/golden/night only as internal atmospheric names where useful, resolve `system` from `prefers-color-scheme`, lock `/` to Obsidian, and feed both the design-system semantic tokens and authenticated shell from the same `--k-*` material variables. Reuse PR #240's tested migration/token ideas, but supersede its local-time Auto behavior with the later Black Label V2 System law.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS custom properties, `prefers-color-scheme`, Vitest, existing Klinikos design system and AppShell.

**Spec:** `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md`

## Global Constraints

- Customer-facing appearance choices are `System`, `Light`, `Dark`.
- Light = Marble; Dark = Obsidian; System follows `prefers-color-scheme`.
- The public `/` Living Home remains Obsidian reference-locked.
- No `ThemeProvider2`, BlackLabelTheme, parallel shell, Grid theme, EDU theme, or second asset authority.
- Appearance never changes authorization, clinical, financial, eligibility, credential, audit, or integration truth.
- Preserve/migrate legacy stored `auto/dawn/day/golden/night` preferences safely.
- Use the existing production Orbital K, wordmark and rose assets.
- No customer-visible text below the existing approximately 12px Black Label floor in newly touched UI.
- Interactive controls touched by this tranche must preserve the existing 44px target convention where practical.
- CI failure before checkout is recorded as non-execution, not treated as green or red evidence.

---

### Task 1: System / Light / Dark authority

**Files:**
- Modify: `src/lib/design/atmosphere.ts`
- Test: `tests/klinikos-theme-system.test.ts`

**Interfaces:**
- Produces `KlinikosAppearancePreference = "system" | "light" | "dark"`.
- Produces `normalizeAppearancePreference(value)` and `atmosphereForAppearance(preference, prefersDark, referenceLocked)`.
- Keeps internal `KlinikosAtmosphere = "dawn" | "day" | "golden" | "night"` for compatibility, but explicit Light resolves to `day` and Dark/System-dark resolve to `night`.

- [ ] **Step 1: Write the failing tests**

```ts
expect(appearance).toContain('["system", "light", "dark"]');
expect(appearance).toContain('value === "night" ? "dark"');
expect(appearance).toContain('value === "dawn" || value === "day" || value === "golden"');
expect(appearance).toContain('referenceLocked');
expect(appearance).toContain('prefersDark');
expect(appearance).toContain('matchMedia("(prefers-color-scheme: dark)")');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npx vitest run tests/klinikos-theme-system.test.ts`
Expected: FAIL because `main` still exposes `auto/dawn/day/golden/night` and has no System resolver.

- [ ] **Step 3: Implement the minimal authority**

Implement legacy migration:

```ts
export const klinikosAppearancePreferences = ["system", "light", "dark"] as const;

export function normalizeAppearancePreference(value: string | null): KlinikosAppearancePreference {
  if (value === "system" || value === "light" || value === "dark") return value;
  if (value === "night") return "dark";
  if (value === "dawn" || value === "day" || value === "golden") return "light";
  if (value === "auto") return "system";
  return "system";
}

export function atmosphereForAppearance(
  preference: KlinikosAppearancePreference,
  prefersDark: boolean,
  referenceLocked = false,
): KlinikosAtmosphere {
  if (referenceLocked) return "night";
  if (preference === "dark") return "night";
  if (preference === "light") return "day";
  return prefersDark ? "night" : "day";
}
```

Bootstrap must read `matchMedia("(prefers-color-scheme: dark)")`, set `colorScheme`, migrate legacy storage, and never flash Marble on `/`.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npx vitest run tests/klinikos-theme-system.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/design/atmosphere.ts tests/klinikos-theme-system.test.ts
git commit -m "feat(design): make appearance System Marble Obsidian"
```

### Task 2: Semantic Marble / Obsidian materials

**Files:**
- Modify: `src/app/design-tokens.css`
- Test: `tests/klinikos-theme-system.test.ts`

**Interfaces:**
- Consumes atmosphere data attributes from Task 1.
- Produces shared `--k-*` material variables used by existing design-system semantics and `AppShell`.

- [ ] **Step 1: Extend the failing test**

```ts
expect(tokens).toContain("--k-theme-mode:light");
expect(tokens).toContain("--k-theme-mode:dark");
expect(tokens).toContain("--surface-primary:var(--k-public-bg)");
expect(tokens).toContain("--text-primary:var(--k-text)");
expect(tokens).toContain("--line-dark:var(--k-line)");
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run tests/klinikos-theme-system.test.ts`
Expected: FAIL because Day/Golden/Dawn currently share the old dark rose override.

- [ ] **Step 3: Implement semantic materials**

Use the Black Label palette direction:

```css
html:root,
html:root[data-klinikos-atmosphere="night"] {
  --k-theme-mode: dark;
  --k-public-bg: #050303;
  --k-public-surface: #0c0607;
  --k-public-raised: #160b0d;
  --k-text: #f8efed;
  --k-muted: #b89f9b;
  --k-line: rgba(226,139,133,.16);
  --k-accent: #e6817b;
  --k-accent-2: #b9575b;
  --k-premium: #efaaa1;
  --k-shell: #070304;
  --k-work-bg: #090506;
}

html:root[data-klinikos-atmosphere="dawn"],
html:root[data-klinikos-atmosphere="day"],
html:root[data-klinikos-atmosphere="golden"] {
  --k-theme-mode: light;
  --k-public-bg: #f8f4ef;
  --k-public-surface: #fffaf7;
  --k-public-raised: #f2e9e5;
  --k-text: #311d20;
  --k-muted: #765f61;
  --k-line: rgba(84,43,47,.16);
  --k-accent: #a84d55;
  --k-accent-2: #7f2d37;
  --k-premium: #9f5f55;
  --k-shell: #fbf7f2;
  --k-work-bg: #f6f2ed;
}
```

Reconnect `[data-klinikos-ds]` semantic surfaces/text/borders/shadows to `--k-*` tokens instead of hard-coded Obsidian values.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx vitest run tests/klinikos-theme-system.test.ts tests/black-label-design-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/design-tokens.css tests/klinikos-theme-system.test.ts
git commit -m "feat(design): wire Marble and Obsidian material tokens"
```

### Task 3: Appearance controller and root surface

**Files:**
- Modify: `src/components/design/klinikos-atmosphere.tsx`
- Modify: `src/app/layout.tsx`
- Test: `tests/klinikos-theme-system.test.ts`

**Interfaces:**
- Consumes `normalizeAppearancePreference` and `atmosphereForAppearance`.
- Produces the customer-facing System/Light/Dark control and applies Marble compatibility to `#klinikos-page-content` without another provider.

- [ ] **Step 1: Add failing controller tests**

```ts
expect(controller).toContain('label: "System"');
expect(controller).toContain('label: "Light"');
expect(controller).toContain('label: "Dark"');
expect(controller).not.toContain('label: "Dawn"');
expect(controller).not.toContain('label: "Golden hour"');
expect(controller).toContain('matchMedia("(prefers-color-scheme: dark)")');
expect(layout).toContain('className="klinikos-theme-surface"');
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run tests/klinikos-theme-system.test.ts`
Expected: FAIL on current five-option controller and missing root surface class.

- [ ] **Step 3: Implement controller**

Requirements:
- System listens to OS color-scheme changes live.
- `/` remains Obsidian and hides the floating appearance controller as today.
- The dialog copy says presentation only and never implies authorization changes.
- Store only `system|light|dark` after migration.
- Apply/remove existing `grid-marble-surface` at `#klinikos-page-content`.
- Use >=12px helper copy and existing accessible dialog/button patterns.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx vitest run tests/klinikos-theme-system.test.ts tests/black-label-design-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/design/klinikos-atmosphere.tsx src/app/layout.tsx tests/klinikos-theme-system.test.ts
git commit -m "feat(design): expose System Light Dark appearance"
```

### Task 4: Authenticated shell token convergence

**Files:**
- Modify: `src/components/clinic/app-shell.tsx`
- Test: `tests/black-label-shell-theme.test.ts`

**Interfaces:**
- Consumes `--k-shell`, `--k-text`, `--k-muted`, `--k-line`, `--k-accent`, `--k-public-surface`, `--mode-header`.
- Does not change navigation catalog, routes, role checks, Zumi events, or logout behavior.

- [ ] **Step 1: Write failing shell regression**

```ts
expect(shell).toContain("var(--k-shell)");
expect(shell).toContain("var(--k-text)");
expect(shell).toContain("var(--k-muted)");
expect(shell).toContain("var(--k-line)");
expect(shell).not.toContain("bg-[#070304]/98");
expect(shell).not.toContain("text-[#b89f9b]");
expect(shell).toContain('aria-modal="true"');
```

- [ ] **Step 2: Run and verify RED**

Run: `npx vitest run tests/black-label-shell-theme.test.ts`
Expected: FAIL because the existing shell hard-codes Obsidian/rose values throughout.

- [ ] **Step 3: Convert only shared shell chrome**

Replace hard-coded shell/sidebar/header/explore/profile colors with semantic variables while preserving component structure and all real behavior. Do not redesign domain pages in this tranche. Maintain the existing `KlinikosWordmark`, role-aware navigation, Explore Klinikos, Zumi composer, mobile drawer and logout form.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npx vitest run tests/black-label-shell-theme.test.ts tests/klinikos-theme-system.test.ts tests/black-label-design-contract.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/clinic/app-shell.tsx tests/black-label-shell-theme.test.ts
git commit -m "feat(design): converge authenticated shell on Black Label materials"
```

### Task 5: Release gate and PR #240 retirement

**Files:**
- Update: `docs/superpowers/plans/2026-08-23-black-label-theme-shell-v1.md` only if verification discovers a necessary documented deviation.

- [ ] **Step 1: Run exact-branch checks**

```bash
npx prisma validate
npx tsc --noEmit
npx vitest run tests/klinikos-theme-system.test.ts tests/black-label-shell-theme.test.ts tests/black-label-design-contract.test.ts
npm run lint
npm run build
```

Expected: all executable checks PASS. If GitHub Actions fails before checkout, record it separately as infrastructure non-execution.

- [ ] **Step 2: Browser QA**

Verify `/` remains Obsidian; an authenticated route renders Marble in Light/System-light and Obsidian in Dark/System-dark; no flash of incorrect scheme; appearance control works at desktop/mobile; keyboard focus remains visible; 390px shell has no horizontal overflow.

- [ ] **Step 3: Open current-main PR**

PR must state that it supersedes PR #240, preserves its valuable token/migration work, and intentionally changes Auto/local-time to System/OS preference because Black Label V2 is later authority.

- [ ] **Step 4: Close PR #240 as superseded only after the replacement PR is safely merged**

Do not lose its branch/history.

- [ ] **Step 5: Merge exact reviewed head**

Use expected-head SHA. After merge, verify `main` SHA and then begin the next Black Label vertical (Current Visit / Object Stage) from the new substrate.
