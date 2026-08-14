# KLINIKOS

Klinikos is a multi-tenant healthcare operating ecosystem for clinics, providers, staff, patients, healthcare organizations, and network participants.

The repository name `Clinicos-by-Zumi` is legacy. The public product and company brand is **Klinikos**. **Zumi** is **Klinikos Intelligence**, a subsystem inside Klinikos rather than the parent brand.

Canonical public identity: **https://klinikos.io**

The Render hostname is infrastructure only. It is not the product name or public identity.

## Product model

Klinikos is broader than a conventional EHR or CRM. The current architecture includes:

- **Clinic OS** — patients, scheduling, encounters, documents, forms, labs, imaging, medications, tasks, cases, referrals, revenue workflows, owner/front-desk/provider workspaces, and operational actions.
- **Grid** — a generalized healthcare opportunity, resource, capacity, and transaction exchange for professionals, work, rooms/chairs, services, equipment, organizations, training capacity, and other governed resources.
- **Network** — partner relationships, referrals, handoffs, capacity, minimum-necessary sharing controls, and recoverable manual delivery fallbacks.
- **Klinikos EDU** — synthetic virtual-clinic learning, scenarios, submissions, grading, cohorts, and readiness workflows.
- **Klinikos Intelligence (Zumi)** — provider-neutral governed reasoning, routing, research/tool boundaries, egress controls, human-review rules, and auditable usage.
- **Commercial activation** — server-owned offers, checkout intents, verified payment evidence, subscription/entitlement activation, customer-funded variable usage, and provisioning boundaries.
- **Living Home** — role-aware, goal-first front door that hides backend orchestration vocabulary and surfaces the next useful action.

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

Klinikos contains substantial production-oriented architecture, but code alone does not establish regulatory, contractual, or operational approval.

Do not claim that Klinikos is:

- a certified EHR;
- HIPAA compliant merely because the code has privacy/security controls;
- connected to a lab, payer, clearinghouse, e-prescribing network, credentialing source, or other external healthcare rail unless that exact production connection is verified;
- allowed to send PHI to an AI provider unless the provider, BAA/contract, configuration, and explicit deployment approval all permit it;
- moving marketplace payouts when only a financial obligation or ledger state exists;
- automatically verifying provider licenses or malpractice coverage against an external authority when only internal human review exists.

Manual-but-truthful is acceptable. Fake automation is not.

## Capability status vocabulary

Use these labels consistently in product and engineering documentation:

- **Ready / Built** — implemented and verified against real internal state.
- **Partially built** — a useful path exists but named gaps remain.
- **Manual fallback** — the workflow is real but a human performs the external step.
- **Adapter ready / Configurable** — the internal contract exists but the external connection is not verified live.
- **Pending connection** — code may be ready, but credentials, vendor enrollment, contract, BAA, or production approval is missing.
- **Blocked** — cannot truthfully proceed until an external dependency is resolved.
- **Roadmap / Not built** — not implemented yet.

## Security law

Security and clinical/financial truth are deterministic system concerns. AI does not widen them.

The non-negotiable boundaries include:

- authentication and revocable sessions;
- tenant isolation;
- RBAC and resource-level authorization;
- minimum-necessary access and consent;
- credential and eligibility policy;
- financial/payment state;
- human approval for defined consequential actions;
- PHI egress controls;
- prompt-injection/tool-exfiltration defense;
- auditability;
- step-up/risk controls where required.

No prompt, model output, uploaded document, connector result, webpage, or user-supplied role claim may override those boundaries.

## Zumi / Klinikos Intelligence

Zumi follows a provider-neutral gateway and governed cognition model. The desired loop is:

`UNDERSTAND → IDENTIFY UNKNOWN → RETRIEVE → PLAN → CHOOSE TOOLS → RESEARCH → COMPUTE → CROSS-CHECK → CHALLENGE → REPAIR → ANSWER → LEARN METHOD`

The web is an external library, not a trusted authority or a place to store private Klinikos context.

PHI redaction must happen before any planner, router, memory, tool, or provider consumer sees the question. Sending PHI to an external model remains separately gated by provider approval and the required contractual/deployment controls.

## Grid law

Grid is not a staffing-only marketplace. Its backend primitives are generalized around participants, capabilities, resources, demand, requirements, availability, matches, offers, reservations, bookings, transactions, financial obligations, fulfillment, disputes, incidents, and reputation.

Hard eligibility is evaluated before ranking. Money is stored in integer cents. Browser state does not establish settlement. Concurrent reservations must fail safely without partial state.

The public map may start from the visitor's actual location when permission is granted. It must not fabricate marketplace inventory or synthetic nearby pins to make an empty market appear populated.

## Frontend law

The backend can be complex. The customer experience should not expose that complexity unnecessarily.

Users should primarily see:

- what they are trying to accomplish;
- what needs attention;
- what is happening;
- the next useful action;
- progress;
- any real blocker;
- where to continue.

Backend concepts such as orchestration engines, capability registries, path state machines, entitlements, and policy engines are implementation language unless a specialist/admin surface genuinely needs them.

The frontend includes a global Aegean atmosphere system. `Auto` follows browser-local time across Dawn, Day, Golden Hour, and Night; users can also persist a manual presentation preference. Appearance never changes permissions or product behavior.

## Deployment contract

Production deployment is intentionally split into build-time work and runtime work.

Canonical Render commands:

```bash
# Build command
npm ci --include=dev --ignore-scripts && npm run render:build

# Start command
npm start
```

`render.yaml` also defines `/api/health` as the health check.

**Do not build or run migrations on every runtime wake.** The deploy path installs dependencies, generates Prisma, applies reviewed migrations, and builds Next.js. Runtime starts the already-built application only.

The `deploy-contract` CI job runs the production host's install/build/start contract directly so configuration drift is caught before merge.

Production status must be verified from the actual deployed service; a green repository build alone does not prove that the newest `main` commit is live.

## Verification baseline

The frontend/commercial convergence candidate merged as PR #66 after the exact candidate passed:

- Prisma validation and generation;
- all 50 committed migrations against a fresh PostgreSQL database;
- strict TypeScript;
- ESLint;
- **547 tests across 71 test files**;
- **10 DB-backed MVP journeys**;
- production Next.js build;
- production startup smoke;
- exact Render deploy-contract.

The last full verification baseline recorded in canonical documentation remains `main` commit `0299240e71d81cab9c885f4225925b1173fc8058`. This product-and-marketplace documentation review inspected `main` at `a8821523d60f11ad863572df5493d84a6a944410`; it does not claim a newer full-suite verification baseline.

## MVP journeys

Run the complete journey suite against a disposable PostgreSQL database:

```bash
npm run test:mvp
```

The runner currently executes:

1. fresh deploy;
2. commercial payment truth;
3. paid activation/provisioning;
4. clinic operations;
5. Grid transaction;
6. Grid trust/problem handling;
7. Zumi governed reasoning/egress;
8. tenant isolation;
9. role routing;
10. failure/recovery/concurrency.

See `docs/MVP_JOURNEYS.md` for the contract each journey proves.

## Local development

Requirements: Node.js 20+, npm 10+, PostgreSQL 15+.

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

Use synthetic/test data unless the deployment has explicitly passed the required production privacy, security, contractual, infrastructure, and operational gates.

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

Start here, in this order:

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md`
3. `docs/MARKETPLACE_DESIGN_RESEARCH.md`
4. `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md`
5. `docs/prompts/CONTINUE_GRID_TO_MVP_PROMPT.md` when handing the Grid MVP to an implementation agent
6. `docs/FEATURE_STATUS.md`
7. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
8. `docs/MVP_JOURNEYS.md`
9. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
10. `docs/CLINICOS_MASTER_CANON.md` for deeper historical/permanent scope where it does not conflict with current truth

Priority Zero and the feature registry represent permanent scope direction, not a claim that every external integration or capability is already live.
