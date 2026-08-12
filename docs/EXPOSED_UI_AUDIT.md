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
| Navigation | authenticated app | Feature registry in normal staff nav | Internal implementation concept exposed to ordinary users | HIDE | Keep route available only to authorized internal use; remove it from normal navigation and Home discovery | Corrected |
| Navigation | authenticated app | User-facing routes missing from normal discovery | EDU, knowledge, remote monitoring, care-team, passport, capacity, provider-network, injury, access, identity, and other implemented paths were difficult to find | WIRE | Use role-aware navigation with plain-language labels and descriptions | Corrected |
| Home | `/dashboard` | Product discovery | Users had to know which sidebar or URL contained a capability | WIRE | Add a role-aware launch directory for all appropriate clinic, network, Grid, learning, revenue, and organization pathways | Corrected |
| Public Home | `/` | Product pathways | Grid and EDU existed as substantial product paths but were easy to miss from the main site | WIRE | Keep the public Home pathway section linking Clinic, Grid, Education, Private Demo, Founding Clinics, and About | Corrected |
| Grid gateway | `/grid` | Offer/enrollment choices | Several visible seller/location choices pointed at specialized enrollment routes that are not built | REDIRECT | Route every current offer type through the working universal `/grid/join` enrollment path until specialized flows exist | Corrected |
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
- Home is a discovery surface: every appropriate user-facing pathway that exists in code should be reachable directly or through a clearly named gateway without exposing backend/admin machinery.
- Navigation remains role-aware. Discoverability never overrides authorization.
- This file must be updated as corrections land.
