# Render release retry after spend-limit unblock

Date: 2026-08-25

Purpose: record the operator-approved retry of the normal Render deployment path after the Render build-pipeline spend limit was increased from the blocking state documented in issue #318.

This file does not change application behavior, migration policy, database state, hosting authority, or runtime configuration.

Release intent:

- source of truth: current GitHub `main`
- host: Render
- trigger: normal `autoDeployTrigger: commit`
- expected result: Render attempts to deploy the complete current `main` history
- acceptance remains: successful Render build/deploy, governed migration state, `/api/health` release identity, root/login smoke, and production SHA equal to current `main`

Do not interpret this commit alone as evidence that production is live. It exists to create an auditable, meaningful release retry after the account-level Render capacity blocker was changed.
