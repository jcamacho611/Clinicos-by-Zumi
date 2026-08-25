# KLINIKOS Public Route Gap Audit

Date: 2026-08-25
Baseline: `main@5eb1bda23c4053093f4e11d351298ffe1c7131ea`
Status: VERIFIED AGAINST CURRENT REPOSITORY ROUTES/SITEMAP

## 1. Finding

Klinikos currently has substantially more product capability than it exposes through dedicated public discovery routes.

Current `src/app/sitemap.ts` contains the following public paths:

- `/`
- `/about`
- `/how-it-works`
- `/capabilities`
- `/ecosystem`
- `/pricing`
- `/trust`
- `/founding-clinic`
- `/operational-audit`
- `/sales`
- `/start`
- `/grid`
- `/grid/browse`
- `/grid/pricing`
- `/edu`

Additionally, `src/app/capabilities/page.tsx` currently permanently redirects `/capabilities` to `/how-it-works`.

Therefore the current site does **not** yet provide dedicated public discovery for many major market-recognized capabilities that already exist in some form in the product architecture or are explicit final-form requirements.

## 2. High-priority public discovery gaps

At minimum, public information architecture must explicitly evaluate dedicated discovery for:

### Core clinical / EHR

- EHR / EMR
- practice management
- Current Visit
- clinical documentation
- AI medical scribe / ambient documentation
- Clinical Change
- BodyMap

### Telemedicine / scheduling / patient

- telemedicine
- medical scheduling
- patient portal
- digital intake
- forms / consent / e-sign
- secure messaging

### Insurance / coding / revenue

- insurance eligibility
- prior authorization
- medical coding
- medical billing
- revenue-cycle management
- revenue integrity
- claims
- clearinghouse connectivity
- denial management
- payment posting
- patient payments

### Diagnostics / coordination

- lab workflow
- imaging workflow
- referrals
- medication management

### Operations / growth

- front desk automation
- AI receptionist / contact center
- healthcare CRM
- missed-call recovery
- rebooking/reactivation
- inventory
- practice launch

### Network / workforce

- healthcare jobs
- shifts/per-diem
- provider network
- professional credentialing
- healthcare services marketplace
- medical office/room capacity
- clinical placements
- preceptors

### Specialty

- No-Fault
- Workers' Compensation
- med spa
- weight management
- targeted high-value specialty solution pages

### Enterprise / ecosystem

- enterprise healthcare software
- interoperability
- payer operations
- population health
- value-based care
- healthcare security/trust
- developer platform
- remote monitoring/devices
- research/outcomes
- public-health/government workflows

## 3. Important distinction

This audit does **not** mean every proposed route should be published immediately.

A route should become indexable only when:

- it contains substantive useful content;
- the product claim is truthful;
- current implementation/integration state is clearly represented;
- the page does not become thin SEO spam;
- the CTA maps to a real next action;
- no protected/confidential information is exposed.

The gap is that these categories have not been systematically evaluated/represented publicly, not that 100 empty pages should be created overnight.

## 4. Canonical remediation system

The remediation is governed by:

- `governance/KLINIKOS_PUBLIC_DISCOVERY_SEO_AND_CATEGORY_TAXONOMY.md`
- `governance/KLINIKOS_CROSS_CUTTING_CAPABILITY_FABRIC.md`
- `src/lib/public-capability-registry.ts`
- `tests/public-capability-registry.test.ts`

Every material public-site tranche should reconcile current routes against that registry and close high-value gaps in dependency order.

## 5. Telemedicine as proof

Current product canon already treats telemedicine as part of clinical encounters, provider workflows and scheduling. The public route map does not currently expose a dedicated telemedicine acquisition page.

The correct future public telemedicine story is the complete workflow:

`DISCOVER / BOOK → SCHEDULE → VERIFY → INTAKE → CONSENT → INSURANCE / AUTHORIZATION → VIDEO → CURRENT VISIT → DOCUMENTATION → ORDERS / REFERRALS → CODING → CLAIM / PAYMENT → INSTRUCTIONS → FOLLOW-UP`

This illustrates why cross-cutting capabilities cannot be buried under one generic Platform or EHR page.

## 6. Exit condition

The public-discovery gap is progressively closed when:

- major capability records are reconciled against actual routes;
- the highest-value missing public pages exist with substantive content;
- sitemap/canonical/internal-link architecture reflects them;
- specialty/persona pages cross-link appropriately;
- Zumi understands those buyer intents;
- analytics captures discovery-to-conversion;
- pages preserve truthful feature/integration status.
