# 07 — MONEY AND STRIPE

**Status:** SUBORDINATE COMMERCIAL EVIDENCE DOCUMENT — NOT A CANON
**Created:** 2026-09-05
**Live Stripe verified in this session:** **NO** — see "Verification gate" below.

## Stripe law

Stripe is a **payment rail, billing rail, invoice rail, subscription rail and settlement
evidence.**

Stripe is **not** product authority, pricing strategy, clinical authority, organization
authority, or entitlement authority by itself.

```
KLINIKOS COMMERCIAL TRUTH → approved offer → approved payable line items → Stripe
→ processor event → webhook verification → reconciliation
→ Klinikos entitlement/obligation decision → audit
```

Never infer live revenue from a Price object, a Product object, a test-mode object, a
checkout URL, or a PaymentIntent that did not settle.

## Verification gate — read before any commercial statement

**Query live Stripe before making any commercial claim.** This document does not substitute
for that.

### Reported live state — 2026-09-05, account `acct_1U5H0X2K2jlPN40H` (livemode)

| Item | Reported |
|---|---|
| Clinic Operating Analysis — $500 one-time | `price_1U5j3h2K2jlPN40HwHWpxGr6` |
| Operational Audit — $1,500 one-time | `price_1U5uX72K2jlPN40H7j68buow` |
| Workflow Sprint — $3,500 one-time | `price_1U5uhr2K2jlPN40HUdCNjhSr` |
| Active recurring prices | 0 |
| Charges | 0 |
| Subscriptions | 0 |
| Connected accounts | 0 |
| **Revenue** | **$0 `ACTUAL`** |

**This was not re-verified by the agent writing this document** — the Stripe connector was
unavailable at the time. It is recorded as a **dated report from the account owner**, not as
independently verified fact. Truth class: `ASSUMPTION` until re-queried. Re-query before any
lender, investor, customer or internal financial statement.

### The finding that matters most

**Core / Growth / Scale ($995 / $1,995 / $3,995) and the $8,000 implementation exist only in
the README. There is no Stripe product or price behind them.**

That is a public offer the company cannot fulfil at the stated price. It is not a stale
document problem — it is a live commercial exposure, and it is the strongest single argument
for running the commercial convergence tranche before any further marketing.

Three prices are real and chargeable. Everything else advertised is not.

## What must be true before "revenue" is spoken

| Claim | Requires |
|---|---|
| "We have revenue" | settled charges in live mode, reconciled |
| "We have recurring revenue" | active subscriptions with settled invoices |
| "A customer is paying" | a settled payment tied to an approved offer |
| "We have ARR" | recurring revenue × 12, from settled evidence, stated period |
| "We are processing payments" | live-mode processor events, verified webhooks |

Test-mode activity is never evidence of any of these. A Stripe TESTMODE notice about a
recurring price is test activity, not customer billing.

## The active commercial contradiction — P0

The current commercial direction retires any fixed three-plan ladder
(Core / Growth / Scale) in favour of one governed **Pricing Fabric**.

**As of 2026-09-05 the retired ladder is still active in code.** It remains enforced or
described in the public pricing page, README, Master and Commercial Canons, Zumi context,
product catalog, checkout/activation rules, admin UI, Stripe projection and MVP tests.
Multiple open PRs overlap; some preserve the retired ladder, and the retirement attempts do
not yet implement a configuration-based offer contract.

**This is a genuine P0 inconsistency, not a cosmetic remnant.** Strategy says one thing and
the running software says another.

It must be resolved in its own governed convergence tranche — never mixed into a frontend or
renderer PR. Scope mixing is one of the failure patterns this package exists to eliminate.

### Done criteria for that tranche

Repository-wide search must prove: no active Core/Growth/Scale ladder · no current docs
claiming those are the official plans · no Zumi context teaching them as current offers · no
active checkout validator restricted to those keys · no active Stripe projection assuming
those plans · no admin UI rendering them · no tests enforcing the retired model · no public
SEO or website copy selling them · no sales or funding profile treating them as current · no
open PR ambiguously presenting them as authority.

Legacy references may remain **only** for historical evidence or migration integrity, and
must be explicitly marked `HISTORICAL — NON-AUTHORITATIVE — DO NOT USE FOR CURRENT PRICING`.

Do not rewrite published Git history to make prior pricing decisions disappear. History may
exist. It may not remain current authority.

## Pricing Fabric — the target model

Pricing describes the customer's operating configuration, not a box they are forced into:

```
ORGANIZATION BASE + TYPE + LOCATIONS + USERS/PROVIDERS + CAPABILITIES
+ CLINICAL COMPLEXITY + WORKFLOW COMPLEXITY + INTEGRATIONS + ZUMI USAGE
+ DATA/STORAGE + SUPPORT + SLA + IMPLEMENTATION + MIGRATION + VARIABLE SERVICES
+ EXTERNAL VENDOR COSTS + LAWFULLY REVIEWED TRANSACTION ECONOMICS
```

Every offer declares one state: `ACTIVE_PUBLIC` · `ACTIVE_PRIVATE` · `QUOTE_ONLY` ·
`CONTRACTED` · `GRANDFATHERED` · `TARGET` · `SCENARIO` · `POLICY_REVIEW` · `RETIRED`.

Only `ACTIVE_PUBLIC` may be shown as a generally available public price. `QUOTE_ONLY`
contains no invented final price. `TARGET` and `SCENARIO` must never masquerade as live
prices. `RETIRED` is never offered to a new customer.

## Person vs organization

**Person identity is free.** Organization discovery and claim may begin with public-safe
preliminary value. **Organization operational activation is commercial.**

Payment does not create organization authority, identity verification, clinical authority,
credential truth, eligibility, referral ranking, or PHI permission.

## Any historical pricing artifact in this repository

Mark it, in place: `HISTORICAL · NON-AUTHORITATIVE · DO NOT USE FOR CURRENT PRICING`.
A historical financing application may truthfully record what the company represented at the
time. Do not falsify it. But any reusable or current profile must resolve through current
commercial truth.

---
_Generated by [Claude Code](https://claude.ai/code)_
