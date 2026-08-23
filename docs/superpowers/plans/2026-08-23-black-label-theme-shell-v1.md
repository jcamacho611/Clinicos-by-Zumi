# Black Label Theme + Shell V1 Implementation Plan

Status: **IMPLEMENTED ON PR #272, EXECUTABLE RELEASE GATE BLOCKED BY GITHUB ACTIONS RUNNER NON-EXECUTION**

**Goal:** Reconcile the valuable parts of PR #240 into current `main` as the first production Black Label tranche: one System/Light/Dark appearance authority, real Marble/Obsidian semantic materials, and an authenticated shell/workspace that consumes them without creating a parallel theme or shell.

**Spec:** `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md`

## Final architecture decision

- Keep the existing atmosphere infrastructure, root layout, `AppShell`, brand assets, routes and authorization.
- Customer-facing appearance is exactly `system | light | dark`.
- System follows `prefers-color-scheme`, superseding PR #240's older local-time Auto behavior.
- Internal `dawn/day/golden/night` atmosphere names remain only for compatibility; explicit Light resolves to Marble/day and Dark/System-dark resolve to Obsidian/night.
- `/` remains reference-locked to Obsidian.
- Existing `grid-marble-surface` is reused as the compatibility scope at the page-content boundary. No second provider is introduced.
- The existing authenticated workspace and sticky header already consume `--mode-background` / `--mode-header`; they inherit Marble/Obsidian through the shared token substrate.
- The left navigation rail and Explore Klinikos command surface intentionally remain Obsidian command material in both appearances. This is a Black Label material choice, not an incomplete light conversion.
- `AccountPreferences` is part of this tranche because it previously implemented a second System/Light/Dark adapter that mapped System back to time-of-day Auto. It now uses the same storage/resolver contract as the global appearance control.

## Global invariants

- Appearance never changes authorization, clinical state, payment truth, Grid eligibility, credential authority, audit behavior or integration truth.
- No `ThemeProvider2`, `BlackLabelTheme`, parallel shell, Grid theme, EDU theme, Zumi clone or asset authority.
- Legacy `auto/dawn/day/golden/night` storage migrates safely.
- Production Orbital K, wordmark and rose assets remain authoritative.
- Newly touched helper copy remains at or above the approximately 12px Black Label floor.
- Touched controls preserve the existing ~44px target convention where practical.

## Implemented files

### Theme authority
- `src/lib/design/atmosphere.ts`
  - `klinikosAppearancePreferences = ["system", "light", "dark"]`
  - `normalizeAppearancePreference`
  - `atmosphereForAppearance`
  - OS preference bootstrap
  - legacy migration
  - `/` Obsidian lock
  - page-content Marble scope

### Semantic materials
- `src/app/design-tokens.css`
  - distinct Black Label Obsidian and warm Marble material blocks
  - shared `--k-*` semantic variables
  - design-system surfaces/text/borders/shadows resolve through the active material system
  - `--text-micro` raised to `.75rem`

### Global appearance control
- `src/components/design/klinikos-atmosphere.tsx`
  - System / Light / Dark only
  - live OS preference listener
  - presentation-only copy
  - accessible modal semantics
  - root Marble scope toggle

### Root surface
- `src/app/layout.tsx`
  - default preference `system`
  - shared `klinikos-theme-surface` at `#klinikos-page-content`

### Settings convergence
- `src/components/clinic/account-preferences.tsx`
  - removes duplicate local-time theme implementation
  - uses shared resolver/storage contract
  - consumes semantic Black Label materials
  - removes obsolete Dawn/Golden customer copy

### Regression contracts
- `tests/klinikos-theme-system.test.ts`
- `tests/black-label-shell-theme.test.ts`

The shell contract intentionally verifies that:
- workspace/header inherit `--mode-*` theme variables;
- existing role-aware navigation, KlinikosWordmark and Explore modal remain intact;
- the Obsidian command rail stays intentional;
- no parallel shell/provider is created.

## PR / dependency status

Replacement PR: **#272 — `feat(design): Black Label System/Marble/Obsidian theme foundation`**

PR #272 explicitly supersedes PR #240 but **PR #240 must remain open/history-preserved until #272 is safely merged**.

## Executable release gate

Required before merge:

```bash
npx prisma validate
npx tsc --noEmit
npx vitest run tests/klinikos-theme-system.test.ts tests/black-label-shell-theme.test.ts tests/black-label-design-contract.test.ts
npm run lint
npm run build
```

Then browser QA:
- `/` remains Obsidian;
- authenticated route is Marble in Light/System-light;
- authenticated route is Obsidian in Dark/System-dark;
- no wrong-theme flash;
- desktop + mobile appearance control;
- visible keyboard focus;
- 390px no horizontal overflow.

## Current blocker evidence

Exact PR #272 head at first gate: `4a70c59c76bee7b123a8204b20c69008c5e808df`.

GitHub Actions Quality run `32664530215`:
- attempt 1: `verify` and `deploy-contract` both `steps:null`;
- failed jobs were manually re-run once;
- attempt 2 again produced `steps:null` for both jobs;
- no checkout, dependency install, Prisma validation, TypeScript, tests, lint, build or deploy-contract step executed;
- combined commit statuses are empty.

Issue #158 has been updated with this fresh reproduction. PR #272 remains draft. This production tranche must **not** be merged solely because GitHub reports it mergeable.

Alternate executable paths checked in this session:
- connected Vercel app exposes no teams/projects;
- host filesystem contains no repo checkout;
- host git cannot reach GitHub/network and has no GitHub CLI.

## Next action

Restore an executable lane, run the exact-head gate above, then:
1. mark #272 ready;
2. squash-merge exact verified head;
3. verify new `main` SHA;
4. close #240 as superseded while preserving branch/history;
5. start the next Black Label production vertical from verified main: **Current Visit + Object Stage / Clinical Change**.
