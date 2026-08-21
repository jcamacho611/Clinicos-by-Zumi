# Klinikos ICP and Pricing Evidence — 2026-08-20

Status: `DATED COMMERCIAL EVIDENCE — NOT A PRICE AUTHORITY`

This document records current public competitor anchors and the pricing implications they create for Klinikos. It does **not** change server-owned prices, claim competitor feature equivalence, or authorize a discount.

## Primary-source anchors checked

| Vendor | Public price observed | Public source | Important comparison caveat |
| --- | ---: | --- | --- |
| Practice Fusion | Starts at **$199/provider/month** with annual commitment | https://www.practicefusion.com/pricing/ | Certified EHR-oriented product with e-prescribing, labs/imaging paths and other EHR capabilities Klinikos should not claim to replace today. |
| CharmHealth | **$200/provider/month** fixed provider plan; also free and encounter-based options | https://www.charmhealth.com/ehr/ehr-pricing-us.html | EHR + practice management + billing product. Low-volume economics can be far below Klinikos Core. |
| eClinicalWorks | **$449/provider/month** EHR-only; **$599/provider/month** EHR + practice management | https://www.eclinicalworks.com/products-services/pricing/ | Includes mature clinical/EHR functions and has no startup cost on the published plans. |
| Tebra | Standard physician **$599/provider/month Practice Essentials**; **$799/provider/month Practice Automation**. Low-volume physician starts at $349/$399. | https://www.tebra.com/pricing/overview | Tebra already markets an all-in-one/operating-system story and bundles EHR, billing, telehealth and patient-experience capabilities. |

Sources were checked on 2026-08-20. Re-verify before using them in external materials.

## What the numbers do and do not mean

Klinikos Core is currently **$995/month per location**. It is not rational to compare that number with a $199 EHR seat as though both products replace the same things.

It is equally irrational to claim that every separate clinic-software bill disappears under Klinikos. Current repository truth still has external or transition dependencies for areas including production SMS, PHI-capable external AI, object storage, telehealth transport, clearinghouse/payer transactions, e-prescribing, labs and other regulated networks.

Therefore the commercial comparison must have four columns:

1. current clinic spend;
2. spend that current Klinikos scope can credibly replace after implementation;
3. spend that must remain connected or remain during transition;
4. Klinikos subscription + implementation + customer-funded external usage.

No fifth column may contain invented recovered revenue or staff-time savings.

## Provider-count lens

For orientation only, a flat $995/location is equivalent to:

- 1 provider: $995/provider/month;
- 2 providers: $497.50/provider/month;
- 3 providers: $331.67/provider/month;
- 4 providers: $248.75/provider/month;
- 5 providers: $199/provider/month;
- 8 providers: $124.38/provider/month;
- 10 providers: $99.50/provider/month.

This does **not** mean Klinikos replaces the competitor EHR. It means the per-location architecture becomes economically easier to explain as provider count rises, while per-provider competitors scale linearly.

## ICP implication

### Stronger Core candidates

Prioritize clinics where several of these are true:

- multiple providers/staff share one location;
- practice-management, forms, CRM, task/follow-up and document workflows are currently fragmented;
- the owner has poor visibility into unfinished work;
- referral/follow-up/no-show/revenue queues have named operational pain;
- the clinic pays for several separate non-EHR operating tools;
- the clinic values one operating layer even while its certified EHR and regulated external networks remain connected;
- staff handoffs and work ownership create meaningful operating complexity;
- the buyer can identify a measurable implementation outcome beyond “buy software.”

### Harder Core candidates

Treat these as qualification challenges, not targets to force through the funnel:

- solo or very small clinics with a cheap bundled EHR/PM stack;
- clinics whose only stated problem is charting;
- buyers expecting Klinikos to replace eRx, payer networks, labs or a certified EHR immediately;
- clinics unable to identify either meaningful fragmented software spend or a measurable operational problem;
- price-sensitive low-volume practices already served by free/usage-based products.

For these clinics, lowering price automatically can create bad-margin customers and churn without fixing the fit problem.

## Pricing decision framework

Do not change Core from $995 merely because one example clinic has less than $995 of currently replaceable software spend.

Evaluate price through three boundaries:

### 1. Cost floor

Klinikos subscription + customer-funded usage must cover measured infrastructure, AI, communications, transactions, support and delivery economics at the required gross margin.

### 2. Alternative-cost boundary

What does the specific clinic currently spend on the stack Klinikos can **actually** replace, not on every tool it owns?

### 3. Customer-value ceiling

What measurable operational value is created beyond software consolidation? This can support price only after it is evidenced for that clinic. Examples may include reduced unresolved follow-up, shorter queue age, fewer unowned tasks, better referral closure or improved capacity utilization. Do not translate these into dollars without evidence.

## Recommended commercial rule

**Do not use one public price to force every clinic into the same economic story.**

Keep the public anchor simple. Qualify the buyer. Use the Clinic Stack Savings analysis to determine whether the deal is:

- a software-consolidation fit;
- an operating-value case that requires deeper analysis;
- or not a good Klinikos customer at the current stage.

A truthful “not a fit yet” result protects retention, gross margin and brand trust better than a discount used to rescue a bad ICP.

## Strategic implication versus Tebra

Tebra already uses “operating system” language and has mature EHR/billing/patient-experience scope. Klinikos cannot win by repeating `all-in-one + AI + operating system`.

The sharper wedge remains:

- unfinished work stays visible;
- responsibility has an owner;
- waiting-on-others is explicit state;
- external capacity can route through Grid;
- Zumi operates inside governed workflow rather than as a detached chatbot;
- the operating layer can coexist with external clinical networks that should not be falsely “replaced.”

That differentiation must become measurable product behavior, not marketing language alone.
