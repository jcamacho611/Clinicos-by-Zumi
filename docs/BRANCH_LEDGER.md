# KLINIKOS — BRANCH LEDGER

Audit date: `2026-08-16 America/New_York`
Remote: `https://github.com/jcamacho611/Clinicos-by-Zumi.git`
Audited main: `18175eed039aaced6eff49753c260fdceec60dea`

This ledger classifies every remote branch present during the audit plus local-only/divergent work. Classification is an integration decision, not permission to delete a branch. No branch or stash was deleted, rewritten, or force-pushed.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `CANONICAL` | Current merge base and source of integration truth. |
| `ACTIVE_RECOVERY` | Current valuable work to reconcile surgically onto latest main. |
| `RECOVERY_REVIEW` | Contains potentially useful unique work; inspect file-by-file before deciding. |
| `MERGED_PRESERVE` | The relevant PR/content reached main; retain as history, do not merge wholesale. |
| `SUPERSEDED_PRESERVE` | Closed/older/variant work has newer equivalents or conflicts with current canon; keep history only unless a named gap is later recovered. |
| `ARCHIVE_OUT_OF_SCOPE` | Pre-Klinikos or unrelated product history; preserve but never import into Klinikos. |
| `LOCAL_PRESERVE` | Local-only/divergent commits or stash that must not be lost or applied automatically. |

## Canonical and active work

| Ref | SHA | Status | Decision |
| --- | --- | --- | --- |
| `origin/main` | `18175ee` | `CANONICAL` | Current merge base after the exact-head-green neutral Grid fixture migration, stored billing truth, and Zumi/Cloudflare privacy hardening through PR #110. |
| `fix/grid-marble-professional-enrollment-2026-08-16` | `current candidate` | `ACTIVE_RECOVERY` | Restores accessible Marble-mode map contrast and opens the existing professional enrollment path to future healthcare roles while preserving human credential and malpractice review. |
| `origin/claude/whop-portal-grid-marketplace-wdw811` | `f22a5c4` | `ACTIVE_RECOVERY` | Fresh Living Home operating-surface work: truthful phase rail, role-authorized destinations, real counts, inline workspace, and provider-registry correction. Reconcile onto latest main; do not merge the branch wholesale. |

## Local preservation ledger

| Local ref | State | Decision |
| --- | --- | --- |
| `feat/grid-exchange-mvp` at `51f4636` | Two commits ahead of its remote and behind current main; includes `51f4636` and merge commit `8ab2812`. | Preserve. Compare its selected-listing/request-continuity changes against current main before recovering any patch. Never force-push. |
| `claude/whop-portal-grid-marketplace-wdw811` at `321dc35` | Local historical line diverged from force-updated remote. | Preserve as local history; use remote `f22a5c4` as the fresh recovery candidate. |
| `agent/grid-contractor-preserve` at `c9a384a` | Local-only preservation branch. | Preserve; current universal Grid architecture supersedes the narrow workflow as architecture, but evidence may inform neutral provider enrollment. |
| `agent/grid-contractor-finish` at `cbf7c6c` | Tracks old merged contractor work. | Preserve; no new wholesale merge. |
| `main` at `169a883` | Local branch is stale; `origin/main` is canonical. | Do not build from it. Fast-forward only when intentionally switching local main. |
| `stash@{0}` | `preserve/321dc35-pre-grid-exchange-mvp-2026-08-13` | Do not apply, pop, drop, or rewrite during recovery. |

## Recovery-review branches

These branches are not merge candidates as a unit.

| Ref | SHA | Review result |
| --- | --- | --- |
| `origin/agent/architecture-runtime-convergence` | `850d19e` | Closed PR #83. Two documentation/registry commits may contain useful wording, but current source hierarchy and engine registry must win. Review only against a named registry gap. |
| `origin/feat/compliance-gating-foundation` | `9a173b9` | Early email-verification work. Re-evaluate only with the current auth/session architecture and a configured mail rail; no automatic recovery. |
| `origin/feat/ecosystem-wiring-pass-1-rebased` | `928d991` | Temporary current-main alignment ref created during concurrent recovery. It contains no unique implementation beyond merged PR #98 at the audited point; preserve without merging. |

## Merged branches — preserve, do not re-merge

The relevant pull request or equivalent integration reached main. Some refs are no longer ancestors because branches were rebased, force-updated, or carried merge commits; PR history and current implementation are the authority.

```text
origin/agent/brand-truth-klinikos
origin/agent/cinematic-rose-living-home
origin/agent/grid-composition-engine-v2
origin/agent/grid-contractor-finish
origin/agent/grid-financial-settlement
origin/agent/grid-financial-ui
origin/agent/grid-intent-router
origin/agent/grid-transaction-flow
origin/agent/grid-universal-resources
origin/agent/integrate-public-grid-dock
origin/agent/living-home-conversation
origin/agent/pixel-reference-reconstruction
origin/agent/zumi-cortex-security
origin/agent/zumi-everywhere-brand
origin/agent/zumi-jarvis-cortex
origin/agent/zumi-jarvis-cortex-v2
origin/agent/zumi-jarvis-cortex-v3
origin/agent/zumi-jarvis-cortex-v4
origin/agent/zumi-jarvis-cortex-v5
origin/backend/cross-domain-path-events-v3
origin/backend/durable-path-grid-runtime-v2
origin/backend/orchestration-engines-v1
origin/backup/post-emergent-living-home-2026-08-13
origin/backup/pre-emergent-2026-08-13
origin/brand/klinikos-logo-refresh
origin/chore/truth-sync-2026-08-12
origin/ci/deploy-contract-gate
origin/claude/klinikos-mvp-completion
origin/claude/mvp-grid-journey
origin/claude/mvp-operations-journey
origin/claude/mvp-zumi-journey
origin/codex/build-mvp-web-app-local-growth-portal
origin/codex/clinicos-full-emr
origin/commercial/clinic-os-revenue-integration-v2
origin/commercial/customer-funded-access
origin/docs/ecosystem-pricing-design-canon-2026-08-16
origin/docs/klinikos-truth-sync-2026-08-14
origin/feat/commercial-activation-experience
origin/feat/commercial-qualification-convergence
origin/feat/ecosystem-wiring-pass-1
origin/feat/internal-messaging-truth
origin/feat/native-task-creation
origin/feat/schedule-native-wiring
origin/feat/patient-search-wiring
origin/feat/telemedicine-truth-wiring
origin/recovery/repository-truth-convergence-2026-08-16
origin/feat/grid-exchange-mvp
origin/feat/living-home-aegean-briefing
origin/feat/mvp-convergence-frontend
origin/feat/patient-portal-aegean-convergence
origin/feat/pricing-commercial-convergence
origin/feat/verified-first-login-launch
origin/feat/zumi-cloudflare-inference
origin/feature/klinikos-edu-foundation
origin/feature/sales-audit-funnel
origin/feature/zumi-command-experience
origin/fix/brand-assets-404
origin/fix/ecosystem-wiring-truth-2026-08-16
origin/fix/grid-map-location-continuity-2026-08-16
origin/fix/grid-neutral-provider-fixture-2026-08-16
origin/fix/living-home-original-visual-match
origin/fix/living-home-visual-corrections
origin/fix/pin-node-version
origin/fix/prisma-schema-restore
origin/fix/production-asset-cleanup
origin/fix/public-copy-jargon
origin/fix/render-dashboard-compat
origin/fix/render-production-build-deps
origin/fix/transparent-production-assets
origin/fix/zumi-cloudflare-default-gateway
origin/frontend/path-move-signals-v4
origin/grid/final-front-back-completion-v5
origin/grid/post-booking-trust
origin/integration/commercial-ledger-current-main
origin/integration/operational-followup-current-main
origin/mvp/final-completion-v2
origin/orchestration/live-next-action-v6
origin/reconcile/final-grid-design-commercial
origin/ux/home-pathway-discovery-v2
origin/zumi/full-agent-foundation
```

## Superseded or closed branches — preserve as history

These branches are older attempts, closed PRs, intermediate integration lines, or design/workflow variants. Current main contains newer governed equivalents, or the branch conflicts with current canon. Recover only a small named behavior after a current-main comparison and tests.

```text
origin/agent/frontend-cohesion-audit
origin/agent/grid-composition-engine
origin/agent/grid-first-public-entry
origin/agent/klinicos-operating-system-foundation
origin/agent/klinikos-core-foundation
origin/agent/paid-portal-entry-grid
origin/agent/public-grid-entry
origin/agent/zumi-intelligence-foundation
origin/archive/whop-portal-grid-marketplace-pre-rebase
origin/codex/marketplace-website-truth
origin/commercial/pricing-gates-v1
origin/feat/grid-first-convergence
origin/feat/living-home-briefing
origin/grid/complete-front-back
origin/grid/final-front-back-completion
origin/grid/final-front-back-completion-v2
origin/grid/final-front-back-completion-v3
origin/grid/final-front-back-completion-v4
origin/integration/grid-eligibility
origin/integration/grid-zumi-green-v5
origin/integration/pristine-server-zumi
origin/integration/recover-codex-network-context
origin/jcamacho611-patch-1
origin/klinikos-hardening-2026-08-10
origin/mvp/final-completion
origin/reconcile/claude-design-grid-commercial
origin/release/commercial-server-copy-consolidation
origin/release/klinikos-commercial-consolidation-v2
origin/release/klinikos-consolidation-final
origin/release/klinikos-final-integrated
origin/release/klinikos-final-integration
origin/release/klinikos-final-merged
origin/ux/home-pathway-discovery
```

## Out-of-scope archive

These refs predate or are unrelated to the Klinikos product. They are evidence only and must never be imported into the Klinikos application.

```text
origin/archive/jeni-pre-clinicos-20260803
origin/codex/build-mvp-web-app-local-growth-portal-3hty8e
origin/codex/create-app-concepts-for-viral-revenue-generation
```

## Integration order

1. Keep `origin/main` as the only merge base.
2. Finish source-of-truth convergence and status corrections.
3. Merge the focused PR #97 truth-remediation follow-up after exact-head gates.
4. Reconcile `origin/claude/whop-portal-grid-marketplace-wdw811` file-by-file onto latest main.
5. Compare local `51f4636` selected-listing/request-continuity behavior with current main; recover only absent behavior.
6. Review `origin/agent/architecture-runtime-convergence` only after current registry/canon drift is measured.
7. Keep all remaining branches as history unless a specific failing journey names a recoverable behavior.

## Destructive-action rule

No branch deletion, force push, stash mutation, mass merge, history rewrite, or archive import is authorized by this ledger.
