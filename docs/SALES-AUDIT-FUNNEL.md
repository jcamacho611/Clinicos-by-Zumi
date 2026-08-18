# Klinikos Clinic Operating Analysis Sales Funnel

Status: `CURRENT COMMERCIAL OPERATING GUIDE`
Date: 2026-08-18

This document describes the current clinic-entry sales funnel. It supersedes the old public `$750–$5,000 Operational Audit` ladder and older `Private Workflow Demo / Founding Evaluation` public naming.

The internal compatibility keys `operational_audit`, `private_workflow_demo`, `founding_clinic_evaluation`, and `founding_clinic_program` may remain in code and historical evidence. They are not the current public product names.

## Objective

Make a new sales associate capable of qualifying an independent clinic, identifying real operating pain, selling the correct paid entry offer, collecting payment truthfully, and handing the buyer into the next Klinikos step without inventing ROI, compliance, integration, clinical, payment, or activation claims.

## Current commercial ladder

| Step | Offer | Current anchor | Purpose |
| --- | --- | --- | --- |
| 1 | **Clinic Operating Analysis** | **$500 one time** | Paid analysis of operating friction, fragmentation, follow-through, and opportunity; the only public self-directed clinic checkout entry in the current funnel. |
| 2 | **Implementation Blueprint** | **$1,500 one time** | Deeper implementation planning and scoped system design after the analysis/human review; 100% credit-forward rule applies when the clinic proceeds under current terms. |
| 3 | **Founding Clinic Implementation** | **from $8,000** | Implementation/provisioning program after fit, scope, and human review. |
| 4 | **Klinikos Core** | **$995/mo** | Core recurring clinic operating system. |
| 5 | **Klinikos Growth** | **$1,995/mo** | Deeper revenue, network, automation, and intelligence. |
| 6 | **Klinikos Scale** | **$3,995/mo** | Multi-provider/location operating scale. |
| 7 | **Klinikos Enterprise** | **Custom** | Contracted enterprise scope/governance/integrations. |

Server-owned definitions in `src/lib/commercial/klinikos-commercial.ts` are authoritative for current prices and credit-forward language.

## Funnel

`Prospect → Decision maker → Guided operating map → Qualify → Find pain → Quantify clinic-reported facts → Sell $500 Clinic Operating Analysis → Persist buyer/clinic reservation → Create server-owned checkout intent → Preferred verified payment rail → Verify/reconcile payment evidence → Perform analysis → Human-reviewed recommendation → Blueprint / implementation decision → recurring software decision → activation only after its own qualifying payment and production gates`

Do not skip directly from “checkout page opened” or “browser returned” to “paid.”

Do not skip directly from the `$500` analysis payment to production software activation. The Clinic Operating Analysis purchases the analysis only.

## Public conversion law

The public Operating Analysis funnel has one paid checkout choice: **Clinic Operating Analysis — $500**.

The Implementation Blueprint, Founding Clinic Implementation, and recurring plans may be explained and priced publicly, but they are later decisions after analysis/human review. Do not make them competing checkout choices inside the `$500` intake when their exact commercial scope and payment path have not been established.

The guided `/sales` experience can organize self-reported operating signals before the buyer enters the persisted intake. The persisted `/private-demo#reserve` intake is where clinic/contact data and the selected `$500` commercial intent are saved before checkout creation.

## Founder / product positioning

Klinikos exists because clinic operators can pay for many disconnected systems and still lose time, follow-through, visibility, coordination, and revenue through fragmentation.

The sales story is not “another dashboard.”

The story is:

> Klinikos makes fragmented healthcare work visible, coordinated, and easier to act on from one operating ecosystem.

The product is broader than an EHR, CRM, staffing marketplace, billing app, education product, or AI assistant.

## Associate rules

1. Reach an owner, administrator, practice manager, or other legitimate decision maker.
2. Ask permission to understand the clinic before pitching a solution.
3. Collect clinic scale: locations, providers, staff, approximate monthly encounters where known.
4. Collect economics only as clearly labeled clinic-reported facts/bands: revenue band, insurance mix, billing arrangement, known leakage, approximate technology spend.
5. Map technology fragmentation: EHR/PM, scheduling, phone, CRM, billing, fax, communications, payments, automation/intelligence, and other major subscriptions.
6. Identify the largest operating frustration and any after-hours administrative burden.
7. Ask about missed calls, no-shows, referrals, labs/results, claims/denials, intake, follow-up, staffing/capacity, patient communication, and other relevant workflows.
8. Do not manipulate inputs to force qualification.
9. When the clinic is a fit, sell the **$500 Clinic Operating Analysis** as a real paid engagement, not a fake “free consultation.”
10. If the buyer is ready, use the current system checkout path rather than inventing a payment method or price.
11. Do not promise Blueprint, Founding Clinic acceptance, recurring software activation, production activation, integration availability, or a guaranteed implementation date before the applicable review.
12. Do not promise savings or revenue the evidence does not support.

## Clinic Operating Analysis output framework

### CUT

Identify potentially redundant or unnecessary operating/software cost, clearly distinguishing verified facts from estimates.

### CAPTURE

Identify revenue/work already generated but at risk of being lost through missed follow-up, scheduling, referral, billing-readiness, communication, or administrative breakdown.

### GROW

Identify supported opportunities such as reactivation, unused capacity, better referral flow, eligible cash-pay services, or improved operational throughput where relevant.

### ORGANIZE

Map workflow ownership, task queues, referrals, results, claims readiness, patient coordination, documents, capacity, and accountability gaps.

### ASSIST

Identify where deterministic automation and governed Klinikos Intelligence can reduce manual burden while preserving human review and policy boundaries.

Every financial datum or conclusion must be labeled as one of:

- **VERIFIED**
- **CLINIC-REPORTED**
- **ESTIMATED**
- **UNKNOWN**

Never present an estimate as observed fact.

## Analysis disposition

The completed analysis should lead to a clear human-reviewed next-step recommendation, for example:

- not a current fit;
- solve a limited issue first;
- proceed to Implementation Blueprint;
- proceed to Founding Clinic implementation review;
- proceed toward an appropriate recurring plan after implementation scope is established.

The disposition is not permission to bypass payment, security, clinical, credential, privacy, integration, or production-readiness gates.

## Checkout and payment truth

The current `$500` Clinic Operating Analysis flow:

1. persists the clinic and buyer reservation server-side;
2. keeps the internal selected-offer compatibility key bound to the `$500` analysis;
3. creates a server-owned commercial checkout intent using the trusted product and amount;
4. chooses the payment rail server-side:
   - **Stripe is preferred only when both live Checkout credentials and the signed live webhook secret are configured**;
   - otherwise the existing **GoDaddy paylink/manual-reconciliation path** remains the truthful fallback;
5. exposes the resulting secure checkout URL only after the intent exists;
6. waits for signed Stripe server evidence or authorized manual reconciliation;
7. marks payment truth only when the evidence matches the intended provider/product/amount/currency/organization/environment rules;
8. purchases the analysis only. Production software remains a separate commercial and production-readiness decision.

A browser redirect/return is not payment proof.

The `$1,500`, `$8,000+`, and recurring plan values must not be routed through the `$500` checkout merely because a payment rail is available. Exact-value checkout or human-scoped commercial handling is required for those offers.

## Credit-forward rule

Use the exact server-owned commercial language. Current public anchors include credit-forward terms for the Clinic Operating Analysis and Implementation Blueprint when the clinic proceeds within the applicable 30-day window and qualifying implementation conditions.

Do not invent a credit rule that differs from current code/contract terms.

## Activation law

**Paid analysis ≠ software activation.**

Recurring Klinikos access may activate only from the correct recurring commercial product/payment evidence and only within the entitlements that purchase establishes. Payment never activates or overrides PHI approval, clinical authority, credential eligibility, integrations, record release, claims submission, security review, or other independent production gates.

First-login Living Home is therefore part of the later activated software journey, not the `$500` analysis checkout return.

## Required product and compliance guardrails

Do not describe Klinikos as:

- HIPAA compliant merely because the code contains privacy/security controls;
- a certified EHR unless that status has actually been achieved and verified;
- connected live to labs, payers, clearinghouses, eRx/EPCS, credentialing sources, telemedicine, communications, payments, payouts, or other vendors unless the exact production environment proves it;
- an autonomous diagnosis, prescribing, treatment, credential approval, record release, claim submission, payment approval, or eligibility system;
- a source of guaranteed ROI, revenue, savings, insurance approval, implementation outcome, or patient outcome.

Approved status language includes:

- Built / Ready;
- Partially built;
- Manual fallback;
- Adapter ready / Configurable;
- Pending connection;
- Blocked;
- Roadmap.

## What is already built for this funnel

The repo already contains substantial infrastructure that older versions of this document listed as future work:

- guided deterministic operating-map experience;
- persisted sales reservation/intake state;
- server-owned commercial pricing and checkout intents;
- live Stripe Checkout connector with mode checks and signed-webhook verification path;
- GoDaddy/manual-reconciliation fallback;
- payment-evidence and entitlement separation;
- role/tenant controls around sales data;
- commercial activation/provisioning architecture;
- audit/event records;
- Clinic Operating Analysis / Blueprint / implementation / recurring plan definitions;
- DB-backed commercial and activation journeys.

Do not re-plan these as if they do not exist. Inspect the current implementation and improve the smallest remaining gap.

## Next sales-system priorities

Prioritize work that increases truthful conversion and handoff quality:

1. preserve guided-map context into the persisted intake so a buyer does not have to repeat information unnecessarily;
2. make operator follow-up and pipeline state obvious without exposing backend jargon;
3. attach analysis deliverables and human approval to the paid buyer record;
4. implement exact-value checkout/reconciliation for Blueprint and later recurring plans only when those self-service transitions are intentionally approved;
5. connect CRM/email/voice only under reviewed provider/privacy terms;
6. measure source → operating map → reservation → checkout created → verified paid analysis → completed analysis → blueprint → implementation → recurring conversion;
7. capture real customer evidence and case studies without fabricating ROI;
8. keep variable vendor/API cost visible so margins are based on measured economics.

## One-sentence sales principle

**Sell the real problem, collect the real payment, deliver the real next step, and never let the sales story outrun what Klinikos can truthfully activate.**
