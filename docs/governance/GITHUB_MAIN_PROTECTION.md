# Klinikos `main` Protection Contract

**Authority:** operational governance evidence; subordinate to the Master Canon.  
**Observed at:** 2026-09-03T11:23:00Z  
**Repository:** `jcamacho611/Clinicos-by-Zumi`  
**Branch:** `main`

## Current enforcement state

`MANUAL_ADMIN_ACTION_REQUIRED`

The live branch response reports `protected: false`, `protection.enabled: false`, and no required status contexts. The repository rulesets endpoint returned an empty array. The dedicated branch-protection endpoint returned `403 Resource not accessible by integration`, so this document does not claim an enforcement capability the connected tooling does not possess.

## Required controls

1. Ordinary changes enter `main` through pull requests.
2. Exact-head Quality checks are required before merge.
3. Required status contexts use the exact Quality workflow job identities observed on P00 CI: `Quality / verify` and `Quality / deploy-contract` (GitHub may display these as workflow/job pairs; re-query the repository after enforcement is configured).
4. Force pushes are disabled.
5. Branch deletion is disabled.
6. Any administrative bypass is treated as break-glass and must be recorded with reason, actor, commit SHA, follow-up verification and remediation.

## Live evidence

- `GET /repos/jcamacho611/Clinicos-by-Zumi/branches/main` observed `main` at `7eb82612e1c7a8089daded85642da4fdf4b427d4` with `protected: false`, protection disabled, and no required checks.
- `GET /repos/jcamacho611/Clinicos-by-Zumi/rulesets` returned `[]`.
- `GET /repos/jcamacho611/Clinicos-by-Zumi/branches/main/protection` returned `403 Resource not accessible by integration`.
- P00 RED Quality run `33749557207` exposed the two existing workflow jobs `verify` and `deploy-contract`; `deploy-contract` passed while `verify` failed only on the intentionally RED P00 governance test.

Documentation is evidence of the intended control contract; it is not branch enforcement.

## Operator action

In GitHub repository settings, create branch protection or a repository ruleset targeting `main` that:

1. requires a pull request before merge;
2. requires the exact Quality `verify` and `deploy-contract` status checks before merge;
3. blocks force pushes;
4. blocks branch deletion;
5. restricts or eliminates bypass, using documented break-glass handling only when operationally necessary.

After an authorized repository administrator applies those settings, re-query the live branch and ruleset endpoints. Change this document to `ENFORCED` only when the API evidence confirms the controls are active and the exact required status contexts match current GitHub reporting.
