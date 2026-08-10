# Klinikos Exposed UI Audit

This registry tracks major authenticated and public product surfaces that are visible to users. Each item is classified and corrected deliberately so Klinikos does not expose dead controls, misleading demo states, legacy branding, or unnecessary visual noise.

| Surface | Route | Element | Problem | Classification | Action | Status |
|---|---|---|---|---|---|---|
| Patients | `/patients` | Add patient | Previously rendered as a decorative button with no action | WIRE | Link to protected `/patients/new` flow | Corrected |
| Front desk | `/front-desk` | Create patient | Decorative control | WIRE | Link to protected `/patients/new` flow | Open |
| Front desk | `/front-desk` | Book visit | Decorative control | WIRE | Link to scheduling workflow | Open |
| Front desk | `/front-desk` | Callback controls | Synthetic callback queue can look live and phone buttons have no provider-backed action | MARK DEMO / VENDOR BLOCKED | Label synthetic state and disable or wire only after approved communications connection | Open |
| Front desk | `/front-desk` | Readiness checklist | Decorative action | REDESIGN | Replace with real patient/appointment readiness workflow | Open |
| Patients | `/patients` | All patients / Risk & care gaps | Buttons currently do not filter | WIRE | Add real client-side/server filtering or remove | Open |
| Network command | `/network` | Page layout | Excessive card/bento structure and technical/demo language | REDESIGN | Convert to compact stats strip, tabs, relationship table, handoff queue, capacity, activity | Open |
| Network command | `/network` | Legacy Clinicos/ClinicOS copy | Legacy user-facing brand language | RENAME | Replace user-facing legacy brand with Klinikos while preserving compatibility identifiers | Open |
| Navigation | authenticated app | Feature registry in normal staff nav | Internal implementation concept exposed to ordinary users | HIDE | Restrict to admin/system roles | Open |
| Navigation | authenticated app | Legacy ClinicOS labels | Legacy user-facing brand | RENAME | Use Klinikos | Corrected |
| Patient creation | `/patients/new` | New patient form | Missing workflow before hardening pass | KEEP / SECURE | Protected route, RBAC, validation, tenant-derived organization, duplicate check, audit | Corrected |
| Patient API | `/api/patients` | POST mutation | Missing create endpoint before hardening pass | SECURE | Auth + RBAC + tenant-scoped audited creation | Corrected |
| Integrations | `/integrations` | Technical connector terminology | Normal staff can be exposed to implementation language | REDESIGN | Translate to user language except admin/debug details | Open |
| Capability registry | `/capabilities` | Start free | Conflicts with current selective implementation model | REMOVE / RENAME | Replace with qualification CTA | Open |
| Public site | `/` and public sales surfaces | Free/no-credit-card/self-service language | Conflicts with founding clinic implementation model | REMOVE / RENAME | Use qualification-led funnel and truthful implementation offer | Open |
| Entire app | all exposed screens | Static/demo metrics | Some synthetic values can be mistaken for live production data | MARK DEMO | Make every synthetic value explicit, derive from data, or remove | Open |

## Operating rules

- Every exposed control must be real, intentionally disabled with a reason, hidden, or removed.
- Every demo/synthetic value must be labeled or removed.
- Normal clinic staff should not see implementation jargon unless it is necessary to their role.
- User-facing ClinicOS/Clinicos/Zumi references should be converted to Klinikos unless an internal compatibility identifier must remain unchanged.
- Cards are not the default layout primitive. Tables, lists, timelines, split panes, calendars, maps, drawers, and queues should be preferred based on workflow.
- This file must be updated as corrections land.
