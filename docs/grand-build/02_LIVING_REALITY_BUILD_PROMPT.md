# 02 — LIVING REALITY BUILD PROMPT

**Status:** SUBORDINATE IMPLEMENTATION GUIDE
**Precedence:** `01.5_RECONCILIATION_OVERRIDE.md` **wins over this document** on every point
it addresses. Read `01` → `01.5` → this.

## Why this file is short

An earlier 1,039-line version of this prompt is preserved in the founder's source material
as a **design playbook**. It is excellent as design thinking and **unsafe as implementation
authority**, because it was written as if the repository were greenfield. Its concrete
instructions have been corrected in `01.5`. Rather than reproduce a document whose commands
contradict the repository, this file states the build in terms that match current code.

**Corrections that supersede the original, permanently:**

| Original said | Truth |
|---|---|
| `three@^0.169`, `@react-three/fiber@^8.17`, add Drei | `three@0.185.1`, R3F `9.7.0`, **no Drei**. R3F 8 requires React 18; this repo is React 19. |
| Create `src/lib/reality/`, `src/components/reality/` | Use existing `src/lib/living-reality/`, `src/components/living-reality/` |
| `gravity: number` on every object | `AttentionLevel` + plain-language `explanation`. Weights stay server-side. |
| `POST /api/reality/projection {reality, objectId, intent}` | Registry-chosen builder; client never selects arbitrary domain access |
| Create `src/styles/reality-tokens.css` with a new palette | Derive from `src/app/design-tokens.css`. One token authority. |
| Bodoni Moda / Archivo / JetBrains Mono | Current typography stands until a measured design comparison |
| `STATIC` as a fourth performance tier | Three performance modes; motion policy is a separate axis |
| `state.invalidate = false` | `frameloop="demand"`; stop calling `invalidate()` |
| Rose rotates at 0.06 rad/s; edges crawl | Bounded animation that settles. Idle = 0 draw calls. |
| Bundle budgets 180 KB / 320 KB | Targets until a baseline is measured, then ratchet |
| Theme literal ceiling 2,206 | **2,735** measured on `main@dd385aba` |

## The one law of this build

```
THE CANVAS RENDERS. THE SERVER DECIDES.
```

The browser never computes eligibility, authority, ranking, pricing, clinical truth,
credential validity, or payment state.

## Non-negotiables

1. Every consequential action completes with the canvas off.
2. No PHI in any scene projection. Ever.
3. No dead controls. If it renders, it works or it says why not.
4. `prefers-reduced-motion` produces a composed static frame, never a blank one.
5. The canvas idles at 0 draw calls when nothing has changed.
6. Never introduce `LivingUniverseV2`, `ObjectStage2`, `Grid2`, or `Zumi2`.

## Pre-flight discovery — run, report, then STOP

```bash
git fetch origin && git rev-parse origin/main && git log --oneline -20 origin/main
grep -rl "living-reality\|RealityProjection" src --include=*.ts --include=*.tsx
grep -oE "#[0-9a-fA-F]{3,8}" -r src --include=*.css --include=*.ts --include=*.tsx | wc -l
node -e "const p=require('./package.json');console.log(p.dependencies.three, p.dependencies['@react-three/fiber'], p.dependencies.react)"
find src/app -name 'page.tsx' | sort
```

Plus open PRs and their file ownership, branch protection, and repository visibility.

Report `/current /reuse /gap /collisions /lane /security /performance /commercial /risk`,
then **wait for lane approval**. Do not implement during discovery.

## Tranches — evolution, not construction

| PR | Ships | Done when |
|---|---|---|
| **R1** Contract evolution | `Disclosure`, `TruthClass`, `AuthorityState`, registry, redactor | Redaction tests green; no second contract |
| **R2** Token/material convergence | One Obsidian/Marble authority; shell + reality tokens derive | Theme swap changes fog and lights with no geometry rebuild; literal count does not increase from 2,735 |
| **R3** Semantic/precision convergence | One DOM control layer, no duplicate twin | Every ActionDock action reachable and invocable with the canvas unmounted |
| **R4** Runtime hardening | Tiers, WebGL2 detection, idle halt | Idle tab: 0 draw calls; canvas survives 5 navigations without context loss |
| **R5** Behavior primitives | Active vs Focused Object, camera grammar, edge taxonomy, attention, time | Unresolved obligations read louder than resolved ones, without perpetual animation |
| **R6** Public value | Demand Escrow + FUR instrumentation | A stranger states a need and gets a truthful watch — no fabricated supply |
| **R7** Grid + Current Visit | Spatial projection over existing substrates | Eligibility precedes ranking server-side; no inferred clinical delta |

## Per-PR gate — all at the exact head SHA

```bash
npm run db:validate && npm run db:generate && npm run lint \
  && npm run type-check && npm test && npm run build && git diff --check
```

Plus browser screenshots in both materials, a 390px mobile capture, reduced motion, 200%
zoom, WebGL2-disabled Precision Mode, an axe report, and the exact-head `Quality / verify`
and `Quality / deploy-contract` jobs.

A green `next build` alone is not done.

## Play-by-play — mandatory

Every major experience is specified frame by frame:

`/FRAME /USER-PERCEPTION /SPATIAL-STATE /DOM /ACTIVE-OBJECT /FOCUSED-OBJECT /RELATIONSHIPS
/CAMERA /ATTENTION /TIME /ZUMI /AUTHORITY /DISCLOSURE /ACTIONS /MUTATIONS /SUCCESS
/INCOMPLETE /DENIED /ERROR /SLOW-NETWORK /WEBGL-FAILURE /PRECISION-MODE /REDUCED-MOTION
/MOBILE /KEYBOARD /SCREEN-READER /AUDIT /ANALYTICS /FUR /KPI /NEXT-FRAME`

Never write "the user opens a dashboard."

## Forbidden

Rendering forms, tables, notes or signatures inside WebGL · a second identity, pricing,
patient, Grid or Zumi system · client-side eligibility, ranking, authority or pricing ·
fabricated supply, deltas or next steps · `localStorage` for anything authoritative · a
disabled control with no reason · merging to `main` without explicit approval · touching LWA.

---
_Generated by [Claude Code](https://claude.ai/code)_
