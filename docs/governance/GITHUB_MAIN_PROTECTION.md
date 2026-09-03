# GitHub `main` Protection Contract

Status: `MANUAL_ADMIN_ACTION_REQUIRED`  
Observed: `2026-09-03`  
Repository: `jcamacho611/Clinicos-by-Zumi`

## Current verified state

GitHub repository evidence observed during P00 execution shows:

- branch `main` reports `protected: false`;
- repository rulesets endpoint returns an empty collection (`[]`);
- the existing `Quality` workflow is real and executes `verify` and `deploy-contract`, but GitHub branch-level policy does **not currently require** those checks before `main` can change.

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

## Operator action required

The connected GitHub capability used during P00 can read branch/ruleset state but does not expose an administrative branch-protection/ruleset write action. Therefore the repository setting remains an external administrative action.

In GitHub repository settings, create a branch protection rule or repository ruleset targeting `main` with the controls above. Select the actual check names shown by GitHub for the current `Quality` workflow rather than guessing names from documentation.

After the setting is applied, P00 must re-query both the `main` branch and repository rulesets/branch-protection evidence. Only then may this document move from `MANUAL_ADMIN_ACTION_REQUIRED` to an enforced/verified state.

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
