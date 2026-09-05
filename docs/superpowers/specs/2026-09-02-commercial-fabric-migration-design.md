# Klinikos Commercial Fabric Migration Design

**Status:** APPROVED DESIGN

## Purpose

Retire the obsolete clinic-only commercial ladder from all active Klinikos authority, product logic, sales logic, customer-facing routes, pricing copy, Zumi customer context, and current operating documentation. Replace it with the governed commercial fabric already established by the latest Klinikos canon.

## Canonical commercial doctrine

Klinikos is one governed operating network. Customer acquisition and monetization must begin from the work that needs to happen, not from a mandatory consulting funnel.

The canonical customer progression is:

`DISCOVERY -> JOIN FREE -> INTENT -> CONTEXT -> FIRST USEFUL RESULT -> ECONOMIC VALUE -> PAID CAPABILITY -> MEASURED OUTCOME -> RETENTION -> EXPANSION`

The canonical operating progression for a customer problem is:

`UNFINISHED WORK -> DETECT -> PRIORITIZE -> ASSIGN / ROUTE -> COMPLETE -> VERIFY -> MEASURE RESULT -> PROVE ECONOMIC VALUE -> EXPAND`

The commercial boundary is:

`FREE PARTICIPATION AND FIRST VALUE -> PAID CAPABILITY FOLLOWS ADDITIONAL ECONOMIC VALUE`

Payment never creates identity, verification, eligibility, professional authority, clinical authority, tenant access, referral priority, or any other governed authority.

## Retired model

The former fixed clinic ladder is retired as an active commercial model. It must not be presented as the canonical customer journey, default sales offer, required sequence, or checkout funnel.

Active code and documentation must not expose the retired offer names, retired fixed entry prices, retired credit-forward sequence, or language that implies every clinic must proceed through the same three-step sales funnel.

Historical records may preserve that a prior commercial model existed only when necessary for provenance, but active authority must describe it generically as a retired legacy commercial ladder rather than reproducing obsolete offer names or prices.

## Replacement commercial architecture

### 1. Outcome-first entry

Every organization enters through an intent/problem/outcome surface. The system identifies the active object, unfinished work, authority requirements, current evidence, economic consequence, and governed next action.

Examples include scheduling leakage, intake failures, referral leakage, unresolved revenue work, communications backlog, capacity mismatch, documentation handoffs, workforce/credential gaps, and other real unfinished work.

### 2. Free first value

Where policy permits, Klinikos should provide a legitimate first useful result before requiring payment. Free participation must be truthful about limits and cannot create regulated authority.

### 3. Server-owned commercial catalog

Paid capability is selected from a governed server-owned catalog based on actual economic value and context. The browser may display offers, but it must not manufacture product identity, price, entitlement, authority, or billing truth.

Offer classes may include recurring organization software, professional plans, Grid/capacity products, EDU/workforce products, trust/credential operations, Zumi usage/intelligence, Revenue OS, Network, implementation/integration services, prepaid usage, enterprise, government, API/network access, and other approved catalog items.

No single clinic-only ladder governs every customer.

### 4. Proof and measured outcome

The commercial motion must record the problem, baseline, intervention/capability, completion evidence, measured result where available, and expansion hypothesis. Expansion is earned by usefulness and evidence, not forced by a predetermined package sequence.

### 5. Progressive disclosure

Sales/customer surfaces disclose only what is necessary for the commercial decision. Source code, hidden prompts, ranking/orchestration logic, security architecture, proprietary routing, margins, and other crown-jewel IP remain restricted.

## Required repository migration

1. Replace the legacy offer objects in `src/lib/commercial/klinikos-commercial.ts` with an outcome-first commercial fabric contract and governed offer-class metadata.
2. Replace demo/sales rules that project the retired ladder.
3. Replace customer-facing copy and CTA behavior on `/sales`, `/operational-audit`, `/founding-clinic`, `/start`, `/private-demo`, login acquisition copy, and other active routes that reference the retired ladder.
4. Replace admin sales qualification language that scores or sells the retired entry product.
5. Update README, Master Canon, Commercial Canon, Financial OS canon, feature/current-state docs, Zumi customer context, governance/company operating docs, legal/commercial strategy docs, and active build plans so they all point to the commercial fabric.
6. Remove active price and credit-forward assertions tied to the retired ladder.
7. Preserve other independently governed prices only where they remain current and are not artifacts of the retired ladder.
8. Add regression tests that fail if retired offer names/prices reappear in active source or current authority docs.
9. Add convergence tests for the new customer progression and server-owned commercial fabric.

## Route behavior

Legacy URLs may remain as compatibility routes if deleting them would break inbound links. When retained, they must render/redirect to the new outcome-first entry experience and must not expose retired commercial semantics.

## Non-goals

- This migration does not invent new customer revenue, deployments, or proof.
- This migration does not create professional or clinical authority through payment.
- This migration does not disclose trade secrets.
- This migration does not require replacing the EHR.
- This migration does not force every commercial product into self-serve checkout.
- This migration does not rewrite immutable Git history.

## Success criteria

- No active source file or current authority document presents the retired clinic ladder as a live product sequence.
- Customer entry is problem/outcome-first and aligned to first useful result plus economic value.
- Paid capability is represented as governed server-owned catalog selection rather than a fixed mandatory funnel.
- Regression tests prevent reintroduction of the retired model.
- Type-check, tests, lint/release verification, and build/CI evidence are green before merge.
