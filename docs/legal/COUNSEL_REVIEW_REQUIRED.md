# Klinikos Counsel Review Required

Status: `TARGETED REVIEW QUEUE`

Purpose: concentrate paid professional review on the highest-risk questions after Klinikos has already prepared the architecture, facts, drafts, and implementation evidence. This is not a generic instruction to “ask a lawyer.”

## P0 — Before enforcing the first production agreement

### P0.1 Contracting legal entity

**Question:** What exact person/entity is the contracting party for the first production Klinikos Terms, and has any relevant IP/contract right actually been assigned to that entity?

**Why it matters:** Historical agreements must identify the party that truly existed and held the relevant rights at execution. A future entity cannot be treated as if it already owned rights that were never assigned.

**Current implementation:** `KLINIKOS_LEGAL_ENTITY_NAME` is deliberately required and blank by default.

**Needed professional:** startup/corporate + technology-transactions counsel.

### P0.2 Governing law and forum

**Question:** What governing law/forum should control the initial U.S. B2B Klinikos agreement given the final corporate structure and actual operations?

**Why it matters:** The application refuses to invent these provisions.

**Current implementation:** `KLINIKOS_GOVERNING_LAW` and `KLINIKOS_LEGAL_FORUM` are required before execution.

**Needed professional:** U.S. commercial/technology-transactions counsel.

### P0.3 Baseline B2B limitation of liability and indemnity

**Question:** Is the drafted B2B cap, excluded-damages structure, carveout approach, and business-user indemnity commercially and legally appropriate for the first paying clinic/service relationships?

**Why it matters:** Over-aggressive clauses can lose enforceability; under-protective clauses can create material company exposure.

**Needed professional:** SaaS/technology-transactions counsel with healthcare experience.

### P0.4 Consumer/patient separation

**Question:** Which public/patient users, if any, will be treated as consumers under the first launch jurisdictions and what provisions must be removed/replaced for them?

**Why it matters:** The current Global Terms contain explicit consumer savings language but are not a complete jurisdiction-specific consumer addendum.

**Needed professional:** consumer + privacy counsel for launch jurisdictions.

### P0.5 Electronic-record consumer consent mechanics

**Question:** If Klinikos uses electronic records to satisfy a legal requirement to provide information to a U.S. consumer in writing, does the exact launch flow require the additional E-SIGN consumer disclosures, hardware/software notice, affirmative electronic-record consent, paper-copy/withdrawal procedure, or other workflow?

**Why it matters:** Ordinary B2B clickwrap/signature design is not necessarily sufficient for every consumer written-record requirement.

**Needed professional:** U.S. electronic-commerce/consumer counsel.

## P0 — Before production PHI

### P0.6 BAA form and role determination

**Question:** For each clinic service, is Klinikos acting as a business associate, subcontractor business associate, or in another role, and does the final BAA include all required provisions and accurately describe actual services/subprocessors?

**Why it matters:** Ordinary Terms are not a substitute for a required BAA.

**Needed professional:** HIPAA/healthcare privacy counsel.

### P0.7 DPA/controller-processor allocation

**Question:** What controller/processor/business/service-provider roles apply to the initial clinic product and what DPA/SCC/UK transfer terms are required for the actual launch footprint?

**Needed professional:** privacy/data-protection counsel.

## P0 — Before monetizing regulated Grid clinical transactions

### P0.8 Fee splitting / referral / anti-kickback / corporate-practice analysis

**Question:** For each proposed clinical Grid transaction type, can Klinikos charge a percentage, fixed fee, subscription, lead fee, facility fee, or other amount without violating applicable federal/state referral, fee-splitting, anti-kickback, professional-practice, or corporate-practice restrictions?

**Why it matters:** One universal marketplace percentage must not be assumed lawful for healthcare professional services.

**Needed professional:** healthcare regulatory counsel in each launch state.

### P0.9 Contractor / employment classification

**Question:** For each provider relationship, do the actual control, scheduling, equipment, pricing, exclusivity, supervision, and economic facts support the intended classification?

**Why it matters:** Contract labels do not override employment law.

**Needed professional:** employment counsel in each launch state.

### P0.10 Professional-practice / scope / supervision rules

**Question:** For each professional/service/location combination, what license, scope, prescribing/purchasing, supervision, facility, consent, and ownership rules are hard eligibility requirements?

**Needed professional:** healthcare regulatory/licensure counsel for the applicable profession and state.

## P1 — Before broad U.S. consumer launch

Review by launch state:

- automatic-renewal / negative-option rules;
- cancellation mechanisms;
- consumer refund rights;
- arbitration/class-waiver rules if later proposed;
- consumer-health privacy statutes;
- comprehensive privacy statutes;
- biometric/genetic protections if applicable;
- medical/health-data breach rules;
- telehealth-specific obligations;
- minors/guardian contracting;
- marketing/SMS/email rules;
- contractor restrictions/non-solicitation/non-circumvention enforceability.

Do not generate confident 50-state answers without authoritative research and controlled review.

## P1 — Before international commercial launch

For each actual country/region, validate:

- contracting entity and local establishment implications;
- B2B vs consumer Terms;
- electronic-signature level required for the transaction;
- privacy/controller/processor status;
- international transfer mechanism;
- cookie/tracking consent;
- renewal/cancellation/refund rights;
- required language/translations;
- mandatory forum/consumer remedies;
- healthcare marketplace/professional restrictions;
- taxes and invoicing where contractually relevant.

A region remains `RESEARCH REQUIRED` or `COUNSEL REQUIRED` until the real launch facts have been reviewed.

## P2 — Before enterprise scale

- enterprise MSA negotiation playbook;
- security exhibit;
- enterprise SLA/service-credit framework;
- cyber-insurance alignment;
- data-retention/legal-hold schedule;
- incident-notification allocation;
- subprocessor/change notice strategy;
- qualified/advanced electronic-signature requirements for selected jurisdictions;
- countersignature authority matrix;
- procurement-specific accessibility commitments.

## P2 — Before enhanced Private Access NDA use

Review:

- exact confidentiality duration for non-trade-secret information;
- high-risk private-demo/source-code restrictions;
- permitted recipients;
- residuals clause (if any);
- limited non-circumvention for B2B introductions;
- trade-secret safeguards;
- jurisdiction-specific restrictive-covenant rules;
- whether any liquidated-damages clause is appropriate.

No punitive “fine” should be inserted merely because a founder wants a large deterrent number.

## P3 — Optimization

- trademark/brand portfolio coordination;
- IP-chain-of-title audit;
- patent strategy for truly patentable inventions;
- international entity/subsidiary optimization;
- sophisticated arbitration architecture;
- alternative dispute mechanisms;
- enterprise data-room agreements;
- M&A diligence package.

## Current engineering blockers versus legal blockers

### Engineering can proceed without counsel

- immutable agreement versions;
- SHA-256 document hashing;
- authentication/entitlement separation;
- scroll-to-end interaction;
- unchecked affirmative acknowledgments;
- typed electronic signature ceremony;
- server-side validation;
- idempotency;
- tenant isolation;
- signed copy generation;
- historical retrieval;
- audit/event evidence;
- fail-closed routing/API enforcement;
- reacceptance architecture.

### Must not be represented as legally approved until reviewed

- final contracting entity;
- final governing law/forum;
- B2B liability/indemnity language;
- consumer addenda;
- BAA/DPA;
- regulated Grid compensation models;
- professional/contractor classification;
- jurisdiction-specific restrictive covenants;
- arbitration/class waivers;
- international consumer terms.
