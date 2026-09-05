# WAVE 0 — LIVE TRUTH

**Status:** SUBORDINATE EVIDENCE SNAPSHOT — NOT A CANON
**Verified:** 2026-09-05 by direct API and repository inspection
**Baseline:** `main@799612bff2932f95d56e6b4dce56ca3167f60513` (re-measured 2026-09-05; the
earlier `dd385aba` measurement is superseded — every count below was re-run, not carried over)
**Re-verify trigger:** any claim below is stale the moment `main` moves. Re-measure before use.

Every line here was measured, not recalled. Where something was not measured in this
session it says so explicitly.

## Repository

| Fact | Value | How verified |
|---|---|---|
| Repository | `jcamacho611/Clinicos-by-Zumi` | — |
| `main` HEAD | `799612bf` | `git rev-parse origin/main` |
| Visibility | **PUBLIC** (`private: false`) | GitHub API, 2026-09-05 |
| `main` protection | **NONE** (`protected: false`, required checks off) | GitHub API, 2026-09-05 |
| Open PRs | 20+ | GitHub API |
| Routes | 106 `page.tsx` on `main`; 107 on this branch (`/ecosystem/universe`) | repository walk |
| Theme literals | **2,735** across `src` css/ts/tsx | `grep -ohE '#[0-9a-fA-F]{3,8}'` |
| Stylesheets in `src/app` | **12** — 9 global, 3 route-scoped CSS Modules | `find src/app -name '*.css'` |
| Token authority | `src/app/design-tokens.css`, reached only via `globals.css:2` `@import` | grep |
| Override layers above the token layer | **6** | `src/app/layout.tsx:8-13` import order |
| Literals inside those 6 layers | **268** | per-file `grep -ohE '#[0-9a-fA-F]{3,8}'` |
| `!important` inside those 6 layers | **281** | per-file `grep -o '!important'` |

**The 2,206 literal ceiling quoted in older documents is stale.** The current `main`
baseline is **2,735**; the W1 merge raised it. Any "count did not increase" gate must
ratchet from 2,735.

**Disclosure — this package's own branch raises it to 2,739.** Branch
`claude/whop-portal-grid-marketplace-wdw811` adds four literals:
`#f0aaa3 #6f4a4b #a84d55 #c2a6a6`, all of them **token definitions inside
`src/app/design-tokens.css`** — the one file where a hex value is not a violation. Zero
literals were added to a component. Stated here rather than left for someone else to find:
a ratchet gate that counts files indiscriminately will flag this branch, and it should be
answered with this line, not with a suppression.

## CI — corrected

Older documents across this repository asserted that GitHub Actions receives no runner and
therefore CI evidence cannot exist. **That premise is false as of 2026-09-05.**

| Fact | Value |
|---|---|
| Total workflow runs | 2,464 |
| Runs on `main` | 401 |
| Last 8 `main` runs | all `success` (2026-09-02 → 09-03) |
| PR runs 2394–2433 | executed to real conclusions, including genuine test failures |

Runners are allocated and jobs execute to completion. This is reliable, not intermittent.
The discipline survives the correction: **a run that executed no steps is infrastructure
evidence, not a pass, and mergeable-state is not CI-green.**

## The override stack — measured

`src/app/layout.tsx` imports eight global stylesheets in this order:

```
 7  globals.css              ← @imports design-tokens.css (the token authority)
 8  cinematic-global.css              183 literals · 135 !important
 9  cinematic-legacy-overrides.css     50 literals ·  17 !important
10  cinematic-command-overrides.css    13 literals ·   9 !important
11  cinematic-home-overrides.css       12 literals ·  41 !important
12  experience-convergence.css          1 literal  ·  15 !important
13  unicorn-experience.css              9 literals ·  64 !important
14  accessibility.css                   9 literals ·   6 !important
```

Lines 8–13 are the six override layers: **268 hardcoded literals and 281 `!important`
declarations loading after the tokens they overrule.** `accessibility.css` (line 14) is a
concern layer, not a theme override, and is counted separately.

The three route-scoped CSS Modules (`billing`, `current-visit`, `front-desk` Black Label)
carry a further 14 literals and 76 `!important` declarations, scoped to their routes.

This is the mechanism behind the 2,735 literal count and the unreachable Marble material.
Deleting lines 8–13 is a prerequisite, not a cleanup task.

## Living Reality runtime — what actually exists

Merged at `6c399ae1` (P01 + P16):

```
src/lib/living-reality/reality-projection.ts          the canonical contract
src/lib/living-reality/member-reality-projection.ts
src/lib/living-reality/public-path-reality-projection.ts
src/lib/living-reality/runtime-mode.ts                FULL / BALANCED / PRECISION
src/components/living-reality/{canvas,layer,scene}.tsx
scripts/security/{browser-confidentiality-gate,security-evidence-gate}.mjs
scripts/verify-living-reality-browser.mjs
```

Dependencies on `main`: `react@19.1.1`, `next@15.5.22`, `three@0.185.1`,
`@react-three/fiber@9.7.0`, `@types/three@0.185.4`. **`@react-three/drei` is not installed
and is not required.**

## The canonical graph — an uncomfortable measured fact

`canonicalEcosystemGraph` contains **66 capabilities**. Measured distribution:

| Implementation state | Count |
|---|---|
| `PARTIAL` | 56 |
| `EXTERNAL_CONNECTION_REQUIRED` | 6 |
| `BUILT_NEEDS_VERIFICATION` | 2 |
| `LEGAL_REVIEW_REQUIRED` | 1 |
| `DESIGNED` | 1 |
| **`LIVE_VERIFIED`** | **0** |

Strategy: 39 `NOW`, 19 `NEXT`, 7 `CONNECT`, 1 `PARTNER`.

**Thirty-nine capabilities declare intent "Now" and not one is verified live.** That gap is
the reason intent and reality are rendered as separate facts everywhere in the product, and
it is the single most important number in this document for anyone writing a lender,
investor or customer claim.

## P0 items

1. **Repository is public.** `evidencePaths` in the canonical graph point at
   `src/lib/grid/eligibility.ts` and peers. The browser disclosure boundary stops that
   reaching a marketing page's visitors; it does nothing about the repository being public.
   Classify `PUBLIC_REFERENCE_CODE` vs `PROPRIETARY_CROWN_JEWEL_CODE` before more
   crown-jewel logic lands. Check forks, mirrors, CI and deploy assumptions before changing
   visibility — it is not a toggle.
2. **`main` is unprotected.** No required checks, no required review. For a company pursuing
   enterprise healthcare procurement this is a governance defect.
3. **Fixed-tier pricing is still active in code.** Core/Growth/Scale remains enforced in the
   public pricing page, README, Canons, Zumi context, product catalog, checkout/activation
   rules, admin UI, Stripe projection and MVP tests, while newer commercial law retires it.
   That contradiction belongs in its own convergence tranche — see `07`.
4. **Production PHI remains BLOCKED.** P01/P16 success for spatial projection does not imply
   HIPAA compliance, clinical authority, payment authority or external vendor readiness.

## Not measured in this session

- Cold-start latency. A ~25.45s homepage vs 0.578s health response was reported earlier.
  **Not re-verified here.** Re-measure warm TTFB, cold TTFB, FCP/LCP, host state, timestamp
  and deploy SHA before acting or quoting it. If a sleeping instance is still adding tens of
  seconds to first paint, it is a P0 growth defect and cheap to fix.
- Live Stripe state — see `07`.
- Browser QA of the CSS `perspective` / `preserve-3d` stage on Safari and at 390px.

## What is a strategic hypothesis, not truth

The schools/placement wedge, the attach-rate arithmetic, the Texas job projections and the
Authority Passport moat are **hypotheses**. They may be good ones. They are not verified
facts and must never be presented as current performance.

---
_Generated by [Claude Code](https://claude.ai/code)_
