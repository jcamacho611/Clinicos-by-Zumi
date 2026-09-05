# KLINIKOS GRAND BUILD PACKAGE — START HERE

**Status:** SUBORDINATE BUILD PACKAGE — NOT A CANON
**Authority:** subordinate to `docs/KLINIKOS_MASTER_CANON.md`, the Master Engineering Blueprint, `docs/KLINIKOS_AUTHORITY_MAP.yaml`, and current code/runtime evidence.
**Package version:** 2026-09-05.3 — twelve documents (supersedes the seven-document v1 and its ZIP)
**Baseline verified at:** `main@799612bff2932f95d56e6b4dce56ca3167f60513`

This package exists so the founder does not have to re-paste large prompts into every
session. It is **operating instruction for agents**, not product or company law.

## Precedence — where this package sits

`docs/KLINIKOS_EXECUTION_INDEX.md` §1 defines the authority stack. This package is **not a
slot in it.** It is subordinate operating instruction that sits *below* every slot:

```
1  Master Canon                    docs/KLINIKOS_MASTER_CANON.md
2  Canonical engineering blueprint docs/superpowers/specs/2026-08-29-...blueprint.md
3  Verified implementation evidence code · schema · tests · exact-head CI · runtime
4  Execution control               AGENTS.md · MULTI_AGENT_EXECUTION_CONTROL ·
                                   governance/...COUNCIL_AND_CAPABILITY_ROUTING_PROTOCOL
5  Machine traceability            governance/KLINIKOS_EXECUTION_TRACEABILITY.json
6  Program specs and plans
7  Evidence registers and snapshots
8  Historical / provenance artifacts
─────────────────────────────────────────────────────────────────────────────────
   docs/grand-build/**             ← this package. Loses to all eight.
```

Concretely: the Master Canon wins on product and company law. Current code and runtime
evidence win on what *is currently built*. The governance protocol wins on the council
roster and capability routing (see `03`). This package wins on nothing — it is a way of
working, kept in the repository so it survives the end of a chat session.

**This package must never become a second Master Canon.** If a statement here starts
reading like instituted law rather than operating instruction, that statement belongs in
the Canon or nowhere.

## Verification provenance — read this before trusting a SHA

The founder's own index for this package carries the caveat that **no SHA in it was
verified by its author.** That caveat is correct for the documents as received: `08`–`11`
were authored outside this repository and their repository claims are assertions until
measured.

This file is the exception, and only in one direction: every SHA, count and CI claim in
`00`, `06` and `07` was measured in-session against the repository and the GitHub API on
the date stated, and each carries how it was verified. That is a claim about **the moment
of measurement, not about now.** `main` moved four times during the authoring of this
package (`16f0824d → 6c399ae1 → 234ada4a → dd385aba → 799612bf`). Every measured claim is
stale the moment `main` moves again.

**Rule: re-measure before you rely on any number in this package.** Where an inherited
claim has already been measured and found wrong, the document carries a marked
**CORRECTION** block rather than a silent rewrite — see `11` §1.1 and `06`.

## The twelve documents

| # | File | Who reads it | When |
|---|---|---|---|
| 00 | `00_START_HERE.md` | the founder | now |
| 01 | `01_GRAND_BUILD_CONSTITUTION.md` | every agent, always first | every session |
| 01.5 | `01.5_RECONCILIATION_OVERRIDE.md` | every agent, second | every session |
| 02 | `02_LIVING_REALITY_BUILD_PROMPT.md` | the implementing agent | to build the Living Reality |
| 03 | `03_COUNCIL_PACK.md` | one council at a time | when attacking a domain |
| 04 | `04_AGENT_HANDOFF.md` | any engineering agent | every task |
| 05 | `05_LANGUAGE_BOOK.md` | anyone writing UI copy | every screen |
| 06 | `06_WAVE_0_TRUTH.md` | the founder | before anything ships |
| 07 | `07_MONEY_AND_STRIPE.md` | anyone making a commercial claim | before any pricing statement |
| 08 | `08_VISION.md` | anyone scoping | the anti-compression master scope ledger |
| 09 | `09_PERSONAS.md` | any agent adopting a role | operating and human personas |
| 10 | `10_CONNECTION_PROMPT.md` | wiring work | the ecosystem graph and connection runbook |
| 11 | `11_FRONTEND_PROMPT.md` | any visual change | token authority and frontend Definition of Done |

## How to use it

**To build:** hand an agent `01`, then `01.5`, then `02`. The agent runs discovery and
stops. Approve the lane. Then it builds R1 → R7, RED before GREEN, one PR at a time,
never on `main`.

**To attack a business problem:** `01` → `01.5` → the one council from `03` that owns it.

**To hand off any task:** `01` → `01.5` → `04` → the task.

**For visual work:** `01` → `01.5` → `11`. **For wiring:** `01` → `01.5` → `10`.
**For scope questions:** `08`. **To adopt a role:** `09`.

## Execution sequence — CORRECTED

An earlier revision of this package said `R1–R3 ships without any canvas → R4–R7 the canvas`.
**That is false.** The Living Reality canvas already exists on `main`: P01/P16 merged at
`6c399ae1`, and `three@0.185.1` + `@react-three/fiber@9.7.0` are production dependencies.

The waves are therefore **evolution tranches**, not greenfield construction:

```
WAVE 0  — LIVE TRUTH RECONCILIATION       (see 06)
R1      — CONTRACT EVOLUTION              (extend RealityProjection, do not replace)
R2      — TOKEN / MATERIAL CONVERGENCE    (one Obsidian/Marble authority)
R3      — SEMANTIC / PRECISION CONVERGENCE (one DOM authority, no duplicate twin)
R4      — EXISTING RUNTIME HARDENING      (tiers, idle halt, WebGL2 detection)
R5      — LIVING REALITY BEHAVIOR LAYER   (Active Object, camera, attention, time)
R6      — PUBLIC VALUE + DEMAND ESCROW + FUR
R7      — GRID + CURRENT VISIT SPATIAL PROJECTION
```

The existing canvas survives all seven waves. Nothing here authorizes a second runtime.

## What this package will not do

It will not create another Master Canon. It will not restate product law that already lives
in the Canon. It will not carry pricing, revenue, traction or security claims that have not
been verified on the date of the claim — see `06` and `07`.

---
_Generated by [Claude Code](https://claude.ai/code)_
