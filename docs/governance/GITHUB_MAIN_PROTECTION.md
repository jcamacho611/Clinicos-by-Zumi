# GitHub `main` Protection Contract

**Authority:** operational governance evidence; subordinate to the Master Canon.  
**Current enforcement state:** `MANUAL_ADMIN_ACTION_REQUIRED`  
**Observed at:** `2026-09-03T09:26:34Z`  
**Repository:** `jcamacho611/Clinicos-by-Zumi`  
**Branch:** `main`

## Current verified state

Live GitHub repository evidence observed during P00 execution shows:

- branch `main` reports `protected: false`;
- branch protection metadata in the branch payload reports `enabled: false` and required-status enforcement `off` with no required checks;
- repository rulesets endpoint returns an empty collection (`[]`);
- direct `GET /repos/jcamacho611/Clinicos-by-Zumi/branches/main/protection` returned `403 Resource not accessible by integration`, so this connected integration cannot independently inspect protected-rule details through that endpoint;
- the existing `Quality` workflow is real and executes `verify` and `deploy-contract`, but GitHub branch-level policy does **not currently require** those checks before `main` can change;
- `main` was observed at `7eb82612e1c7a8089daded85642da4fdf4b427d4` during this evidence refresh.

A strong CI workflow is not the same as enforced branch protection. This document is evidence and an operator contract; it does not claim the repository setting has been changed.

## Required target state

`main` must be governed so that ordinary changes arrive through pull requests and cannot bypass release truth.

Required controls:

1. Require pull requests before merge to `main`.
2. Require the repository's exact Quality checks before merge. At minimum, require the check runs corresponding to `Quality / verify` and `Quality / deploy-contract` if GitHub exposes those exact names in the repository rules UI.
3. Require the current PR head to satisfy the required checks; stale green results from an earlier head are not release evidence.
4. Disable force pushes to `main`.
5. Disable deletion of `main`.
6. Do not allow administrators to silently bypass required release truth. Any emergency bypass must follow a documented break-glass process with actor, reason, exact SHA, evidence, rollback plan, and retrospective review.
7. Configure stale-approval/status behavior using the strongest repository-supported settings that do not create a deadlock for the current team size.
8. Preserve the existing Quality workflow; protection must enforce it, not replace or weaken it.

## Live evidence

Evidence sources for this observation:

- `/repos/jcamacho611/Clinicos-by-Zumi/branches/main` → `protected: false`, protection disabled, required-status enforcement off;
- `/repos/jcamacho611/Clinicos-by-Zumi/rulesets` → `[]`;
- `/repos/jcamacho611/Clinicos-by-Zumi/branches/main/protection` → `403 Resource not accessible by integration`.

The `403` is an integration-access limitation, not evidence that protection exists. The branch payload and empty ruleset result are the evidence for the current unprotected state.

## Operator action required

The connected GitHub capability used during P00 can read branch/ruleset state but does not expose an administrative branch-protection/ruleset write action. Therefore the repository setting remains an external administrative action.

In GitHub repository settings, create a branch protection rule or repository ruleset targeting `main` with the controls above. Select the actual check names shown by GitHub for the current `Quality` workflow rather than guessing names from documentation.

After the setting is applied, P00 must re-query the `main` branch and repository ruleset/protection evidence. Only then may this document move from `MANUAL_ADMIN_ACTION_REQUIRED` to an enforced/verified state.

## Break-glass evidence contract

If a true emergency requires an authorized bypass after protection is enabled, record:

- incident or emergency identifier;
- actor and authorization;
- reason ordinary PR flow could not be used;
- before SHA and resulting SHA;
- exact tests/security checks that were or were not available;
- production impact;
- rollback SHA/plan;
- post-event review and corrective action.

Emergency authority is not ordinary release authority.
