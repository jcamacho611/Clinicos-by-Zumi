# Encounter-Linked Vitals Truth / Staff Handoff V1 Plan

**Goal:** Replace the Current Visit's totally unavailable handoff state with a truthful partial staff handoff when persisted encounter-linked vitals exist, without inventing intake data or changing the schema.

**Architecture:** Reuse the existing Prisma `Vital` table already present in production. Add a server-only organization/patient/encounter-scoped repository that emits a minimum-necessary browser DTO. Extend the pure Current Visit projection to treat encounter vitals as a partial handoff. Keep medication reconciliation, screenings, body maps, and other intake explicitly unavailable until their own persisted domains exist.

**No migration in this slice.**

## Tasks

- [ ] Add failing model tests proving a persisted encounter vital yields `staffHandoff.status = "partial"` while no vital remains `not_available`.
- [ ] Add a browser-safe `PatientVital` DTO and server-only scoped repository.
- [ ] Add contract tests proving vital lookup is scoped by organization + patient + encounter and returns only minimum necessary fields.
- [ ] Load the latest encounter vital on the Current Visit server page and pass it to the editor.
- [ ] Render actual measured values inside Staff handoff without calling the handoff complete.
- [ ] Preserve all encounter lifecycle, coding, audit, signature, Zumi, and external-connection truth boundaries.
- [ ] Reconcile latest main/open PRs before merge.
- [ ] Run exact-head CI if infrastructure executes; otherwise preserve the infrastructure limitation explicitly and run focused isolated checks.

## Explicitly out of scope

- vital capture/write API
- fake demo fallback
- patient-chart Vitals tab rewrite if it cannot be safely patched through the available connector
- medication/allergy reconciliation persistence
- screenings/questionnaires
- body maps
- clinical change graph
- ambient scribe
