# GitHub `main` Branch Protection

**Status:** `MANUAL_ADMIN_ACTION_REQUIRED`  
**Observed:** 2026-09-03T09:10:54Z  
**Repository:** `jcamacho611/Clinicos-by-Zumi`  
**Branch:** `main`

## What is true now

Fresh GitHub repository reads during P00 showed:

- `main` reported `protected: false`;
- the repository ruleset collection returned no active rulesets;
- the connected GitHub capability did not expose a write operation for branch protection/rulesets;
- therefore required checks are **not** currently enforced at the repository branch-policy layer.

This document is evidence of a control gap and its required remediation. It is **not** evidence that protection is enabled.

## Required target control

An authorized GitHub administrator must configure `main` so that ordinary production changes satisfy all of the following before merge:

1. Changes flow through pull requests rather than ordinary direct pushes to `main`.
2. `Quality / verify` is required when GitHub exposes that exact check name.
3. `Quality / deploy-contract` is required when GitHub exposes that exact check name.
4. Required checks must pass against the merge candidate/exact head required by the repository's chosen protection mode.
5. Force pushes are disabled.
6. Branch deletion is disabled.
7. Stale approval/status behavior is configured so old evidence cannot silently authorize a changed candidate.
8. Administrators and maintainers do not silently bypass release truth. Any emergency bypass must use an explicitly documented break-glass process with actor, reason, exact SHA, compensating verification, and follow-up evidence.
9. If the selected GitHub ruleset supports requiring the branch to be up to date before merge, enable it unless merge-queue semantics provide equivalent exact-candidate protection.

## GitHub UI action

Using a repository administrator account:

1. Open repository **Settings**.
2. Open **Rules → Rulesets** (preferred) or **Branches → Branch protection rules** if rulesets are unavailable on the repository plan.
3. Create or edit a rule targeting the default branch `main`.
4. Require pull requests.
5. Require status checks and select the live check names produced by the current `Quality` workflow, including `Quality / verify` and `Quality / deploy-contract` when selectable.
6. Block force pushes and branch deletion.
7. Configure bypass actors to the minimum necessary set; do not grant routine bypass.
8. Save/activate the rule.

## Verification required after operator action

P00 may change this file from `MANUAL_ADMIN_ACTION_REQUIRED` only after fresh GitHub evidence proves enforcement. Minimum evidence:

- repository/branch API reports `main` protected or an active ruleset targeting `main`;
- the active rule requires pull requests;
- the actual current Quality check names are required;
- force-push/deletion settings are verified;
- the evidence date and exact repository state are recorded here.

Until those checks are observed, the truthful state remains `MANUAL_ADMIN_ACTION_REQUIRED`.

## Why this matters

Klinikos already has strong exact-head CI, migration, confidentiality, browser, and production-host verification. Without repository-level enforcement, those checks can exist without being mandatory for every merge. Branch protection closes that governance gap; documentation alone does not.
