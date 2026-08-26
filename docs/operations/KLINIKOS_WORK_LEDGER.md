# Klinikos Work Ledger

_Last reconciled: 2026-08-26_

## Current main

`fa3da16695aac0a60cf0c4b3fdab36c17b14a98a`

Current main remains the repository integration authority. Production identity must be verified independently before any `live` claim.

## Current production / deployment truth

A production SHA is **not asserted in this ledger** until a deployment health/release source proves it. Render and GitHub Actions have recently had compute/runner constraints in active work; merged code must not be equated with deployment.

## Active PRs material to Final-Form convergence

### #353 — confidential access agreement

Purpose: counsel-review draft for protected investor, partner, demo, roadmap and data-room access. It is documentation/legal drafting only and is not production-approved clickwrap.

Concurrency rule: reuse the agreement architecture after legal approval; do not invent a second investor/confidential-access agreement in the frontend rebuild.

### #328 — zero-cost Vercel production failover

Purpose: deployment failover path while Render/GitHub compute is constrained.

Concurrency rule: frontend branches must not claim deployment solely because code merges. Release identity and smoke proof remain separate.

### #325 — Living Home server authority

Purpose: move authenticated Living Home proprietary intent/path logic out of browser-executable components while preserving minimum-necessary client projections.

Concurrency rule: do not create a second authenticated path engine or reintroduce proprietary routing logic to the browser.

### #294 — Workforce evaluator-proof infrastructure

Purpose: canonical Workforce configuration, DOL-aligned learning projection, fail-closed evidence chain, evaluator-safe Healthcare demo, EDU -> Grid consent boundary and public Workforce proof.

Concurrency rule: preserve the merged five-pathway vocabulary and do not build a separate Kentucky product.

### #293 — operating network architecture

Purpose: define Klinikos as one operating ecosystem and Workforce as an EDU configuration.

Concurrency rule: current Final-Form frontend direction extends this architecture rather than replacing it.

### #282 — universal Account / free-member backend

Purpose: universal Account layer, free-member signup/re-login, protected-entry binding and legacy staff compatibility.

Concurrency rule: do not create another public-account identity store. Future signup/remodel work must reconcile this branch before implementation.

### #281 — lifelong identity foundation

Purpose: additive Person / OrganizationMembership / LocationAssignment foundation while preserving legacy clinic authority.

Concurrency rule: self-reported identity and new relationships may not widen existing clinical/tenant authority.

### #263 — universal protected entry gateway

Purpose: governed transition from public Klinikos into protected interactive product experiences, with progressive agreement layering.

Concurrency rule: this PR currently touches `src/components/marketing/public-living-gateway.tsx`; Final-Form Tranche 1 must not modify that file.

### #264 — generated legal document foundation

Purpose: review-gated generated legal documents without replacing existing tenant legal acceptance evidence.

Concurrency rule: generated documents remain counsel-review / governed lifecycle artifacts, not automatic production terms.

### #262 — governed patient SMS security

Purpose: fixed non-PHI patient SMS, consent/suppression/phone-possession separation and fail-closed funding/production controls.

Concurrency rule: no frontend remodel may imply patient SMS is live unless deployment/economic/provider proof exists.

### #257 — Zumi memory and reviewed knowledge

Purpose: governed durable personal memory and approved knowledge projection.

Concurrency rule: memory is context, not clinical/credential/payment/eligibility/legal authority.

### #256 — universal obligation projection

Purpose: project what still needs to happen across existing authoritative task/referral domains without creating another workflow store.

Concurrency rule: Final-Form home may consume projections later; do not duplicate obligations.

### #254 — network invitation continuity

Purpose: accepted invitation -> governed relationship setup without automatic chart/trust authority.

Concurrency rule: referral/growth UX must preserve explicit relationship approval.

### #253 — public reviewed Grid resource detail

Purpose: public discover -> understand -> authenticated governed request.

Concurrency rule: public Grid detail remains a safe conversion path; listing does not equal authorization.

### #252 — Grid liquidity metrics

Purpose: deterministic demand/offer/reservation/fulfillment metrics without a fake proprietary score.

Concurrency rule: future network analytics should reuse these metrics.

### #251 — interoperability lifecycle truth

Purpose: canonical external-integration lifecycle where connected != production verified.

Concurrency rule: frontend status copy must use this distinction.

### #250 — transaction policy fabric

Purpose: shared commercial vocabulary over existing Grid economics without activating new settlement behavior.

Concurrency rule: price/fee presentation must not create processor or settlement authority.

### #249 — governed trust projection

Purpose: shared trust signals over existing Grid evidence.

Concurrency rule: no second trust store.

### #240 — Marble / Obsidian theme system

Purpose: truthful Auto / Light / Dark presentation using Marble and Obsidian.

Concurrency rule: presentation may change atmosphere but never authority.

## Current Final-Form branch

`feat/final-form-frontend-truth-20260826`

Purpose: repository truth convergence + universal public path catalogue + first progressive-disclosure homepage layer.

This branch intentionally avoids identity, protected-entry, clinical, payment, Prisma and Grid-authority changes.

## Current product truth gaps

- Public messaging is still primarily clinic-buyer oriented while the approved Final-Form architecture is broader: one healthcare operating network with multiple governed participant paths.
- The repository has many strong domain implementations and active branches, but no single persistent work ledger previously showed their relationship.
- Current feature registry uses older delivery vocabulary that is useful but not sufficient to distinguish merged, deployed and production-verified truth.
- Universal Account/identity and protected-entry work exist in active PRs and must be reconciled before the public signup/verification experience is rebuilt.
- Public Zumi already routes intent server-side, but the site does not yet visibly teach the full spectrum of supported participant paths without reverting to a product-menu wall.
- Public and authenticated surfaces are not yet fully visually converged under one Final-Form experience.

## Security / authority gaps to watch

- Never let public path metadata become authorization.
- Never infer organization ownership from a domain email alone.
- Never infer regulated professional authority from email or AI.
- Never let payment create authority.
- Never let Grid discovery imply clinical suitability.
- Never let training completion imply licensure or employment eligibility.
- Never ship proprietary routing/policy engines to the browser.

## Revenue / network gaps

- Individual identity, student/professional profiles, organization verification, contextual referrals and universal `I NEED / I HAVE` participation are not yet one seamless acquisition funnel.
- The network flywheel exists across Grid/EDU/operations conceptually and in pieces of code, but the first-visit and return-user experiences do not yet make that compounding value obvious.
- Organization monetization must be layered after free participant liquidity, not before it.

## Next 10 highest-value actions

1. Land repository product-truth canon and universal front-end design in an isolated PR.
2. Add public-safe universal path catalogue with explicit truth states and no authority effect.
3. Add the first progressive-disclosure path section to the root page without modifying protected-entry-owned `PublicLivingGateway`.
4. Reconcile latest main and open PR overlap before merge.
5. Reconcile #263 protected entry with #281/#282 identity/account before rebuilding signup.
6. Implement claims -> verification -> relationship -> authority UI for business, student and professional paths.
7. Converge Zumi-assisted `I NEED / I HAVE` drafting into existing Grid persistence instead of a new marketplace.
8. Rebuild authenticated Living Home return experience around current obligations, matches, verification gaps and domain projections.
9. Converge public EDU, Grid, Patient, clinic and enterprise surfaces into the same Black Label / Marble / Obsidian system.
10. Run global truth, security, responsive, accessibility, performance, build and deployment verification before production-live claims.

## Definition of ledger maintenance

Update this file after any material change to:

- main SHA
- production/release evidence
- PR ownership
- product truth state
- major security blocker
- major commercial blocker
- next highest-value action.
