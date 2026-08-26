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

1. ~~**Wrong palette at the token layer.**~~ **CORRECTED — this was wrong.**
   `design-tokens.css` declares `[data-klinikos-ds]` twice, and the *second* block wins
   on source order. It already overrides the primitives with Black Label values:
   `--aegean-500` is `#b9575b` (wine), `--cyan-500` is `#e6817b` (ember), `--gold-500` is
   `#efaaa1`. The Zumi status colours were never rendering blue/cyan/gold.

   The real defect is that the token *names* do not describe what they render, which is
   what produced this wrong reading in the first place — and almost certainly why the
   newer palette was hardcoded around the file as hex instead of resolving through it.
   Fixed 2026-08-26: the winning block is marked, and `--bl-*` aliases now name each
   value for what it is.

2. ~~**The direction was never tokenized.**~~ **DONE 2026-08-26.** All 63 hardcoded hex
   literals across the eight stylesheets now resolve through `--bl-*` tokens. Values
   identical, so no visual change. `data-klinikos-ds` sits on `<html>`, so every var()
   resolves everywhere.

3. ~~**`ZumiOrb` defaults to `size = 240`.**~~ **OVERSTATED — corrected 2026-08-26.**
   The default is misleading but not rendered: every call site passes an explicit small
   size (104 in Living Home, 72 in /design-system, 34/32/30 across the public surfaces).
   Nothing renders at 240. Worth changing the default so the design system stops
   advertising a size the product never uses, but it is not a live §3 violation.

4. **The rose is the dominant identity.** §20 says it may remain historical reference but
   must not dominate. It is a full-bleed hero background in `cinematic-home-overrides.css`
   and `unicorn-experience.css`, plus `components/brand/rose-atmosphere.tsx` across
   surfaces. (That component's own comments already argue for restraint.) Partly reduced
   2026-08-26: the dead `.reference-strip-art` wide-rose strip went with the unreachable
   CSS. The hero rose remains.

6. **THE BIG ONE — `src/components/ui` is generic Tailwind, and it is what the app
   renders.** Imported by 90 files vs 16 for `ds`. `Button` uses `bg-sky-600`,
   `bg-slate-950`, `bg-rose-600`; `Badge` offers `slate | sky | teal | amber | rose |
   violet`. That is the "generic blue healthcare SaaS design" §20 explicitly rules out,
   and it covers most of the product — while `ds`, the on-brand set, covers very little.

   So the convergence is not "merge two similar libraries". It is: the design system is
   correct and barely used; the primitives in real use are off-brand.

   Repointing them changes pixels in 90 files. It should not ship without a human looking
   at the result — a wrong pairing here produces unreadable buttons that no test catches.
   Only the focus ring moved (2026-08-26): declared once for every button, visible only on
   keyboard focus, now on the theme-aware `--k-accent`.

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
- **Visual verification IS possible — use a local server, not the live site.** The
  headless browser cannot reach klinikos.io through the session egress proxy
  (`ERR_CONNECTION_RESET`, and the proxy logs no failure for it, so the reset is below
  the proxy). But `no_proxy` covers localhost, so:

      npm run dev                      # .env is present; the public pages need no extra env
      # then drive Chromium at http://127.0.0.1:3000 with
      # --proxy-server=direct:// --proxy-bypass-list=* --no-sandbox

  This is strictly better than screenshotting production anyway: it renders the working
  branch. Chromium is at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`, driven via
  `playwright-core` (resolve it from the repo root — it is CommonJS, so `require`, not a
  named ESM import).
- Note the proxy port changes between container restarts. Read `$HTTPS_PROXY`; never
  hardcode it.
- Preview grading for a real design sync is therefore unblocked.
