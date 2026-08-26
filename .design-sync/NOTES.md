# design-sync notes

## Status: blocked before first sync, on purpose

`/design-sync` was run 2026-08-26. Nothing was uploaded. The reason is not a tooling
failure — it is that syncing the current design system would push the outgoing visual
direction into Claude Design, where every future design would be built from it.

## Repo shape

- **Not** a design-system repo: `private: true`, no `main`/`module`/`exports`, no
  `files`, no workspaces, no Storybook, no `dist/`. Builds as a Next.js app.
- There is still a real syncable surface: `src/components/ds/index.tsx` — a single
  self-contained barrel exporting `DsSurface`, `Badge`, `Button`, `Card`, `Input`,
  `ZumiOrb`, plus typed variant unions (`zumiStates`, `badgeTones`, `buttonVariants`,
  `buttonSizes`). No `next/` imports, no `"use client"`, no server-only. Bundles
  standalone, so `shape: "package"` is correct when a sync does happen.
- `src/components/ui/` is a second, thinner primitive set (Badge, Button, Card, Input,
  shadcn-style). Imported by 90 files vs 16 for `ds`. `/design-system` documents `ds`.

**Scope decision (founder, 2026-08-26):** combine both sets and converge them toward the
current direction, with full authority to build and design. So the sync target is a
*converged* set that does not yet exist — not either existing set as-is.

## Remote project — NOT adopted

`Klinikos Design System` — `e03aaae6-a303-44e8-9181-a90afd1a2747`, owned, type
`PROJECT_TYPE_DESIGN_SYSTEM`, last updated 2026-08-10.

It is **not empty and not ours**: it has `_ds_bundle.js`, `_ds_manifest.json`,
`styles.css`, `components/core/` (Badge, Button, Card, Input, ZumiOrb), `tokens/`, and
hand-authored `ui_kits/marketing/`, `ui_kits/product-app/`, `uploads/`, `assets/logo.png`,
`SKILL.md`, `github.md`. There is **no `_ds_sync.json`**, so it was not produced by this
tool and carries no sync anchor.

Syncing into it would delete `ui_kits/`, `uploads/`, `assets/` and the docs — the
converter does not produce those. The founder was asked and did not pick a target, so per
the operating constitution §57 the safest reasonable assumption applies: **do not
destroy.** `projectId` stays null. Nothing was written or deleted remotely.

When a sync does run, the choice is still open: fresh project (non-destructive) or
explicit re-adoption of the above with the deletions understood.

## Why the current system should not be synced yet

Measured against the operating constitution:

1. **Wrong palette at the token layer.** `design-tokens.css` primitives are
   aegean/cyan/gold — the "generic blue healthcare SaaS" look §20 rules out. Worse, the
   Zumi status colors resolve to it: `--status-observing: var(--aegean-500)`,
   `--status-mapping: var(--cyan-500)`, `--status-analyzing: var(--gold-500)`. Those
   drive `Badge` tones and `ZumiOrb` states — the two most visible components.

2. **The direction was never tokenized.** The newer palette ships as raw hex: 61
   occurrences across all eight stylesheets the root layout loads. A token change
   propagates nowhere. (Partly addressed: `--bl-*` tokens added 2026-08-26 carrying the
   exact shipped hexes, so the direction now has a source. Migration of the 61 hardcoded
   values is not done.)

3. **`ZumiOrb` defaults to `size = 240`** and is documented as "the signature
   intelligence structure". §3 says Zumi must not be a floating orb the user opens; the
   interaction is "Ask Klinikos". The app already moved — `tests/public-living-home.test.ts`
   asserts the home composer uses `ZumiSendGlyph` and *not* `<ZumiOrb state="observing" />`.
   The design system did not follow.

4. **The rose is the dominant identity.** §20 says it may remain historical reference but
   must not dominate. It is a full-bleed hero background in `cinematic-home-overrides.css`
   and `unicorn-experience.css`, plus `components/brand/rose-atmosphere.tsx` across
   surfaces. (That component's own comments already argue for restraint.)

5. **Three live positioning lines.** Site: "The operating system for running a clinic".
   Constitution §1: "Klinikos. The clinic operations ecosystem, powered by Zumi" — marked
   do-not-rewrite. Earlier canon: "operating ecosystem for healthcare".

## Order of work before a sync is worth running

1. Converge `ds` + `ui` into one canonical set (founder-approved scope).
2. Repoint `--status-*` off aegean/cyan/gold onto `--bl-*`.
3. Resolve `ZumiOrb`'s role — demote to a small state indicator, or retire it in favour
   of the `ZumiSendGlyph` pattern already shipping.
4. Migrate the 61 hardcoded hexes onto tokens.
5. Then sync — and author `.design-sync/conventions.md` from what the build proves.

## Environment

- `DesignSync` works from this session (`list_projects`, `get_project`, `list_files` all
  returned). No auth barrier.
- Headless browser cannot reach klinikos.io through the session egress proxy
  (`ERR_CONNECTION_RESET`), so live visual verification is unavailable here. Audits are
  HTML/CSS-level via curl. Preview grading will need a working browser path.
