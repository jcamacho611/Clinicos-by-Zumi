# Klinikos Exposed UI Audit

Status: `ACTIVE PRODUCT AUDIT`  
Updated: 2026-08-14  
Baseline: `main@4b2a5dc89f3dae7a175b2f8eda9f83f866b77de6`

This registry tracks major public and authenticated surfaces visible to users. Each exposed control must be real, intentionally unavailable with a reason, hidden, or removed. Synthetic/demo state must be clearly labeled.

| Surface | Route | Element | Current truth / problem | Classification | Action / status |
| --- | --- | --- | --- | --- | --- |
| Public Living Home | `/` | Main composer/conversation | Rebuilt as continuous conversation-first surface with deterministic progress and safe follow-up context | KEEP / HARDEN | **Corrected** — preserve minimal screen ownership and truthful progress |
| Public Living Home | `/` | Progress state | Must never imply an external action completed | KEEP / TRUTH | **Corrected** — Understanding / Preparing / Ready are interface-processing states only |
| Public Living Home | `/` | Accessibility/focus | Busy state previously risked swallowing live announcements/focus continuity | KEEP / ACCESSIBILITY | **Corrected** — live region outside busy section, reduced motion respected, composer continues/refocuses |
| Public Living Home | `/` | Product discovery | Marketing/module catalog must not compete with active conversation | HIDE / PROGRESSIVE DISCLOSURE | **Corrected** — relevant destination appears from the conversation |
| Patient sign-in | `/portal/login` | Patient identity boundary | Must remain distinct from clinic staff login | KEEP / SECURE | **Corrected** — Aegean design without auth crossover |
| Patient portal | `/portal` | `Next for you` | Patient should not be shown generic dashboard noise | KEEP / PRIORITIZE | **Corrected** — patient-owned forms, appointment, balance, then all-clear |
| Patient portal | `/portal` | Forms | Staff/provider-owned or already-submitted assignments must not become patient “Needs you” work | SECURE / TRUTH | **Corrected** |
| Patient portal | `/portal` | Released records/messages | Older or long content must remain readable; no silent truncation | ACCESSIBILITY / TRUTH | **Corrected** — full returned records/messages remain accessible |
| Patient portal | `/portal` | Privacy/release language | Operational account data and clinical release gates are different truths | RENAME / TRUTH | **Corrected** |
| Grid | `/grid`, `/grid/browse` | Exchange Field | Need/offer choice must survive typing and not force module selection | KEEP / HARDEN | **Corrected** — explicit I NEED / I HAVE override preserved |
| Grid | `/grid/browse` | Search | First-token-only filtering created misleading broad results | WIRE / TRUTH | **Corrected** — all meaningful terms participate; state name/code aliases supported |
| Grid | `/grid/browse` | Map vs resource ledger | Map and ledger must not disagree about query-matched universal resources | WIRE / CONSISTENCY | **Corrected** |
| Grid | `/grid/browse` | Browser location | Permission must not appear automatically | PRIVACY / CONSENT | **Corrected** — explicit opt-in control |
| Grid | `/grid/browse` | Empty market map | No fake marker/inventory to make market look active | REMOVE / TRUTH | **Corrected** |
| Grid | public map | Map provider | Google configuration must not be implied when unavailable | DEGRADED STATE | **Corrected** — OSM fallback works; Google path remains configuration-dependent |
| Grid | public detail/request | Selected provider continuation | A generic provider request must not be labeled as though the selected listing is reserved/bound | RENAME / TRUTH | **Corrected** — generic request is labeled generic |
| Grid | discovery | Weekday/time phrases | Day names are not yet a structured availability filter | WIRE | **Open** — parse weekday/time into deterministic availability constraints rather than ordinary text |
| Grid | map/ledger | Selected-result focus | Query result truth is aligned; richer bidirectional pin/ledger focus remains incomplete | REDESIGN | **Open** |
| Grid | location controls | Manual city/ZIP/place origin, radius, Search this area | Partial city/state search exists; complete spatial-origin UX not converged | WIRE | **Open** |
| Patients | `/patients` | Add patient | Protected create flow exists | KEEP / SECURE | **Corrected** |
| Front desk | `/front-desk` | Create patient | Previously decorative | WIRE | **Open** — link to protected patient creation if still exposed |
| Front desk | `/front-desk` | Book visit | Decorative/unwired control must not remain exposed | WIRE | **Open** |
| Front desk | `/front-desk` | Callback controls | Synthetic queue/provider-less call controls can look live | MARK DEMO / VENDOR BLOCKED | **Open** — label synthetic and disable/unexpose unbacked calls |
| Front desk | `/front-desk` | Readiness checklist | Decorative action should become real workflow or disappear | REDESIGN | **Open** |
| Patients | `/patients` | All patients / risk filters | Visible controls must actually filter | WIRE | **Open** if still exposed |
| Network | `/network` | Dense card/bento composition | Can feel like backend inventory instead of workflow | REDESIGN | **Open** — prefer relationship table, handoff queue, capacity/activity views |
| Network | `/network` | Legacy Clinicos/ClinicOS copy | Legacy public/customer branding | RENAME | **Open** wherever still exposed |
| Navigation | authenticated | Feature registry/internal architecture | Ordinary staff should not see implementation concepts | HIDE | **Corrected** in normal discovery; keep specialized/internal access governed |
| Authenticated Home | role-aware home | Product discovery | User should not need URLs/module knowledge | KEEP / PROGRESSIVE DISCLOSURE | **Corrected** — deeper areas remain reachable through goal/role-aware navigation |
| Integrations | `/integrations` | Technical connector language | Normal staff may see implementation vocabulary | REDESIGN | **Open** — translate to customer language, retain technical detail for admins/debug only |
| Capability/internal status | `/capabilities` where exposed | “Start free” or architecture-first UI | Conflicts with selective commercial activation and frontend law | REMOVE / RENAME / HIDE | **Open** if still customer-visible |
| Public sales surfaces | public | Free/no-credit-card/self-service language | Conflicts with current paid/qualification-led activation truth | REMOVE / RENAME | **Open** wherever still present |
| Entire app | all exposed screens | Static/demo metrics | Synthetic values can look like live production state | MARK DEMO / DERIVE / REMOVE | **Open ongoing audit** |

## Operating rules

- Every exposed control is real, intentionally disabled with a reason, hidden, or removed.
- Every synthetic/demo value is labeled or removed.
- Normal clinic staff do not see implementation jargon unless necessary to their role.
- User-facing ClinicOS/Clinicos/old parent-brand Zumi language becomes Klinikos unless an internal compatibility identifier must remain.
- Cards are not the default layout primitive. Prefer maps, ledgers, tables, queues, timelines, calendars, drawers, or continuous conversation when they fit the work better.
- Public and authenticated Home surfaces prioritize the current goal instead of listing the whole backend.
- Discoverability never overrides authorization.
- A visible action must not claim booking, payment, verification, delivery, clinical completion, record release, or settlement without the evidence that establishes it.
- Post-deploy browser QA remains necessary even when repository CI is green.

Update this file when an exposed issue is corrected, removed, or newly discovered.