# KLINIKOS

Klinikos is a multi-tenant healthcare operating ecosystem for clinics, providers, staff, patients, healthcare organizations, learners, and network participants.

The repository name `Clinicos-by-Zumi` is legacy. The public product/company brand is **Klinikos**. **Zumi** is **Klinikos Intelligence**, a subsystem inside Klinikos rather than the parent brand.

Canonical public identity: **https://klinikos.io**

The Render hostname is infrastructure only. It is not the product name or public identity.

## Product model

Klinikos is broader than a conventional EHR or CRM. The architecture includes:

- **Clinic OS** — patients, scheduling, encounters, documents, forms, labs, imaging, medications, tasks, cases, referrals, revenue workflows, owner/front-desk/provider workspaces, and operational actions.
- **Grid** — a generalized healthcare opportunity/resource/capacity exchange for professionals, work, spaces, products, equipment, services, organizations, education, referrals, and other governed resources.
- **Network** — partner relationships, referrals, handoffs, capacity, minimum-necessary sharing controls, and recoverable external/manual fallbacks.
- **Klinikos EDU** — synthetic virtual-clinic learning, scenarios, submissions, grading, cohorts, and readiness direction.
- **Klinikos Intelligence (Zumi)** — provider-neutral governed interpretation/reasoning, research/tool boundaries, egress controls, human-review rules, and auditable usage.
- **Commercial activation** — server-owned offers, checkout intents, verified payment evidence/reconciliation, subscription/entitlement activation, customer-funded variable usage, and organization provisioning.
- **Living Home** — conversation/goal-first front door that hides backend orchestration vocabulary and surfaces the next useful action.
- **Patient portal** — a separate patient identity/session with patient-scoped information and release-gated clinical content.

## Current customer-facing convergence

As of the verified 2026-08-14 merged baseline:

- the public `/` experience is a continuous **conversation-first Living Home** with truthful Understanding → Preparing → Ready interface states and safe multi-turn context;
- the patient portal uses the shared Klinikos/Aegean design system, prioritizes one `Next for you`, and preserves the separate patient authorization boundary;
- Grid exposes a universal **I NEED / I HAVE Exchange Field**, explicit opt-in browser geolocation, real Haversine radius matching, real-only public inventory, and an interactive OpenStreetMap fallback that works without Google credentials;
- authenticated Living Home remains role-aware and progressively reveals deeper Clinic OS, Grid, Network, EDU, and operational work.

Implementation truth lives in `docs/FEATURE_STATUS.md`.

## Current commercial anchors

Commercial values are server-owned in `src/lib/commercial/klinikos-commercial.ts`.

| Offer | Current public anchor |
| --- | --- |
| Clinic Operating Analysis | $500 one time |
| Implementation Blueprint | $1,500 one time |
| Founding Clinic Implementation | from $8,000 |
| Klinikos Core | $995/mo |
| Klinikos Growth | $1,995/mo |
| Klinikos Scale | $3,995/mo |
| Klinikos Enterprise | Custom |

The $500 Clinic Operating Analysis can open the configured GoDaddy paylink only **after** Klinikos creates a server-owned checkout intent. A browser redirect or return URL never means paid. Payment evidence and entitlement are separate facts.

## Important truth and safety status

Code alone does not establish regulatory, contractual, external-connection, or operational approval.

Do not claim that Klinikos is:

- a certified EHR;
- HIPAA compliant merely because the code has privacy/security controls;
- connected to a lab, payer, clearinghouse, e-prescribing network, credentialing source, payment/payout rail, or other external healthcare service unless that exact production connection is verified;
- allowed to send PHI to an AI provider unless the exact provider, contract/BAA, configuration, workload, and deployment approval permit it;
- moving marketplace payouts when only a financial obligation or internal ledger state exists;
- automatically verifying provider licenses or malpractice coverage against an external authority when only internal review exists.

Manual-but-truthful is acceptable. Fake automation is not.

## Capability status vocabulary

- **Built / Ready** — implemented and verified against real internal state.
- **Partially built** — useful path exists but named gaps remain.
- **Manual fallback** — real workflow, human performs the external step.
- **Adapter ready / Configurable** — internal contract exists; external production connection is not verified.
- **Pending connection** — credentials, vendor enrollment, contract, BAA, or production approval is missing/unverified.
- **Blocked** — cannot truthfully proceed until an external condition is resolved.
- **Roadmap / Not built** — not implemented.

## Security law

Security and clinical/financial truth are deterministic system concerns. Intelligence does not widen them.

Non-negotiable boundaries include authentication/revocable sessions, tenant isolation, RBAC/resource authorization, minimum-necessary access and consent, credential/eligibility policy, financial/payment state, human approval for defined consequential actions, PHI egress controls, prompt-injection/tool-exfiltration defense, auditability, and step-up/risk controls where required.

No prompt, model output, uploaded document, connector result, webpage, or user-supplied role claim may override those boundaries.

## Klinikos Intelligence / Zumi

Desired cognition loop:

`UNDERSTAND → IDENTIFY UNKNOWN → RETRIEVE → PLAN → CHOOSE TOOLS → RESEARCH → COMPUTE → CROSS-CHECK → CHALLENGE → REPAIR → ANSWER → LEARN METHOD`

The web is an external library, not a trusted authority or a place to store private Klinikos context.

PHI/sensitive redaction must happen before planner, router, memory, tool, or provider consumption. Sending PHI to an external model remains separately gated by provider approval and the required contractual/configuration/deployment controls.

## Grid law

Grid is not a staffing-only marketplace. Generalized primitives include participants/capabilities, resources, demand, requirements, availability, matches, offers, reservations, financial obligations, fulfillment, disputes, incidents, and reputation/evidence.

Hard eligibility precedes ranking. Money is stored in integer cents. Browser state does not establish settlement. Concurrent reservations must fail safely without partial state.

Current public discovery uses real reviewed/published inventory only. Browser geolocation follows explicit user action. When valid coordinates and a radius exist, exact-radius eligibility uses real Haversine distance and may cross state boundaries. Public coordinate precision is reduced. The app must not fabricate nearby listings or markers to make an empty market appear populated.

See `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md` and `docs/MARKETPLACE_DESIGN_RESEARCH.md`.

## Frontend law

The backend can be complex. The customer experience should not expose that complexity unnecessarily.

Users should primarily see what they are trying to accomplish, what needs attention, what is happening, the next useful action, progress, real blockers, and where to continue.

Backend concepts such as orchestration engines, capability registries, Path IDs, entitlements, and policy engines are implementation language unless a specialist/admin surface genuinely needs them.

The visual direction is spacious, editorial, premium, architectural, Aegean/obsidian/cyan/gold, responsive, and accessibility-aware. Motion explains state change rather than decorating the screen.

## Deployment contract

Canonical Render commands:

```bash
# Build
npm ci --include=dev --ignore-scripts && npm run render:build

# Start
npm start
```

`render.yaml` defines `/api/health` as the health check. `.node-version` pins the repository Node contract.

**Do not build or run migrations on every runtime wake.** The deploy path installs dependencies, generates Prisma, applies reviewed migrations, and builds Next.js. Runtime starts the already-built application only.

The `deploy-contract` CI job executes the production host's install/build/start contract. A green repository build does not prove that the newest `main` is already deployed externally.

## Verification baseline

The exact final Grid MVP candidate `740721959cbd3aa180763ebc772580e14c076ad0` passed:

- Prisma validation and generation;
- **51/51 migrations** against a fresh PostgreSQL database;
- strict TypeScript;
- ESLint;
- automated tests;
- **10/10 DB-backed MVP journeys**;
- production Next.js build;
- production startup smoke;
- exact deploy-contract.

It merged to `main` as `4b2a5dc89f3dae7a175b2f8eda9f83f866b77de6`.

The exact final public Living Home candidate also passed the full Quality gate before merge.

These checks prove repository candidates, not external deployment completion.

## MVP journeys

Run the complete journey suite against disposable PostgreSQL:

```bash
npm run test:mvp
```

The runner currently covers fresh deploy, commercial payment truth, paid activation/provisioning, clinic operations, Grid transaction, Grid trust/problem handling, Zumi governed reasoning/egress, tenant isolation, role routing, and failure/recovery/concurrency.

See `docs/MVP_JOURNEYS.md` for the proof contract.

## Local development

Requirements: Node.js 20.19.4 (repository pin), npm 10+, PostgreSQL 15+.

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

Use synthetic/test data unless the deployment has explicitly passed required production privacy, security, contractual, infrastructure, and operational gates.

## Common commands

```bash
npm run dev
npm run type-check
npm run lint
npm test
npm run test:mvp
npm run db:validate
npm run db:generate
npm run db:migrate:deploy
npm run build
npm start
```

## Canonical documentation

Start here:

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/FEATURE_STATUS.md`
3. `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md`
4. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
5. `docs/MVP_JOURNEYS.md`
6. `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`
7. `docs/MARKETPLACE_DESIGN_RESEARCH.md`
8. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
9. Constitution/Master Canon for deeper historical/permanent scope where they do not conflict with current truth.