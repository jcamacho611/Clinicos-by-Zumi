# Autonomous pricing implementation prompt

Act as principal commercial systems engineer, healthcare SaaS monetization architect, marketplace economist, revenue operator, product counsel-aware engineer, UX conversion lead, and QA owner for Klinikos.

Objective: finish the pricing/gating rollout defined by `KLINIKOS_PRICING_AND_GATING_MASTER_DIRECTIVE.md`, using `src/lib/commercial/klinikos-commercial.ts` as the canonical public pricing source and the customer-funded access architecture as the server-side economic safety boundary.

Do not stop at planning. Inspect the current repository before every change. Preserve newer architecture. Work on a branch. Do not merge until the current exact head is green and production baseline risk is understood.

Tasks:
1. Inventory every public and authenticated route containing pricing, trial, free, checkout, subscription, plan, upgrade, billing, Grid fee, implementation, audit, or payment language.
2. Replace contradictory hardcoded public prices with canonical imports/shared components.
3. Link `/pricing` from appropriate public navigation without cluttering the interface.
4. Align `/founding-clinic`, `/sales`, and `/start` to the analysis -> blueprint -> implementation -> subscription funnel.
5. Verify the existing GoDaddy paylink product/amount before attaching a product-specific claim. If unverifiable, label checkout generically and preserve a human reconciliation step.
6. Do not represent recurring billing, automated provisioning, or automated marketplace payouts as complete unless the connected processor and webhook path prove them complete.
7. Complete persisted subscription/allowance/prepaid/reservation/usage/overage concepts if missing, using integer minor units and idempotent auditable transitions.
8. Wire reservation-before-spend into every production variable-cost provider boundary that currently exists: Zumi/model egress, voice, SMS, maps, document processing, eligibility, premium data, and other external cost paths. If a provider path is not implemented, do not invent it.
9. Add reason-specific commercial denial results and upgrade/top-up UI. Never offer payment for a governance-blocked action.
10. Enforce capacity/location/seat/usage limits server-side.
11. Implement Grid Pro entitlements and resource-class transaction fee configuration only to the degree the current billing infrastructure can truthfully support. Do not fabricate recurring subscription activation.
12. Keep Grid transaction economics configurable; never hardcode 10% as universal for regulated/professional work.
13. Add margin observability hooks using existing ledger/event architecture where available.
14. Add tests from the master directive, including adversarial proof that vendor calls cannot happen after a failed funding reservation.
15. Run dependency install, Prisma generate/validate, typecheck, lint, tests, production build, and relevant browser smoke tests.
16. Report external blockers precisely. A blocker is not permission to fake completion; use a safe manual fallback or pending state where the product architecture allows it.

Commercial truth hierarchy:
product/safety policy -> authentication -> tenant -> RBAC -> commercial subscription/payment -> entitlement -> funded usage -> connector readiness -> execution -> metering/reconciliation -> audit.

Never weaken a higher gate to make a lower gate pass.

Success means a buyer sees coherent pricing, can enter the correct paid funnel, production paid access is server-enforced, variable costs cannot run unfunded, Grid economics are configurable and legally reviewable, and no public surface promises capabilities the backend cannot actually deliver.
