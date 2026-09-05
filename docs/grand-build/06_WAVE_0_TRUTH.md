# WAVE 0 — LIVE TRUTH

**Status:** SUBORDINATE EVIDENCE SNAPSHOT — NOT A CANON
**Verified:** 2026-09-05 by direct API and repository inspection
**Baseline:** `main@dd385aba249a7c6dd53f2baedb98b48ca6b3bb65`
**Re-verify trigger:** any claim below is stale the moment `main` moves. Re-measure before use.

Every line here was measured, not recalled. Where something was not measured in this
session it says so explicitly.

## Repository

| Fact | Value | How verified |
|---|---|---|
| Repository | `jcamacho611/Clinicos-by-Zumi` | — |
| `main` HEAD | `dd385aba` | `git rev-parse origin/main` |
| Visibility | **PUBLIC** (`private: false`) | GitHub API, 2026-09-05 |
| `main` protection | **NONE** (`protected: false`, required checks off) | GitHub API, 2026-09-05 |
| Open PRs | 20+ | GitHub API |
| Routes | 106 `page.tsx` | repository walk |
| Theme literals | **2,735** across `src` css/ts/tsx | `grep -ohE '#[0-9a-fA-F]{3,8}'` |

**The 2,206 literal ceiling quoted in older documents is stale.** The current baseline is
2,735; the W1 merge raised it. Any "count did not increase" gate must ratchet from 2,735.

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
