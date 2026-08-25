# Data & Intelligence Platform Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P3/P4

## Purpose

Make data authority, provenance, quality, analytics and derived intelligence explicit so Klinikos can safely combine clinical, financial, operational, workforce, education and network evidence without creating hidden corruption or privacy leakage.

## Core principles

- Every important field has an authoritative source or explicit derived status.
- Provenance is preserved.
- Derived analytics never silently overwrite source facts.
- Clinical truth, financial truth, operational analytics, marketing analytics, security telemetry and AI working context remain distinct.
- De-identified/aggregated use requires appropriate legal, contractual and technical basis.

## Data classes

- PHI
- PII
- professional credential data
- financial/payment data
- operational business data
- public marketplace data
- education/workforce data
- security telemetry
- product analytics
- marketing attribution
- AI context/memory

## Metadata requirements

For important sensitive/derived data track:

- owning domain
- source/provenance
- tenant
- subject/object
- sensitivity
- purpose
- created/observed/updated time
- effective date if applicable
- version
- correction/amendment behavior
- retention
- release/export rules
- external processor
- quality/confidence where derived

## Platform services

- DataCatalogService
- ProvenanceService
- DataQualityService
- ReconciliationService
- LineageService
- AnalyticsProjectionService
- MetricRegistry
- ExperimentAnalyticsService
- DeidentificationPolicyService
- ExportPolicyService
- RetentionPolicyService
- DataRepairService

## Analytics layers

### Product analytics

User/product behavior without inappropriate sensitive detail.

### Operational analytics

Work queues, completion time, scheduling, integration health, staffing/capacity and organization performance.

### Revenue analytics

Revenue progression and exception metrics sourced from Revenue/Financial OS.

### Clinical/quality analytics

Only validated measures and appropriate authorization. No casual LLM-generated quality metrics.

### Network analytics

Grid liquidity, fill rate, repeat relationships and EDU/workforce movement.

## Metric registry

Every executive/customer metric should define:

- metric ID/name
- purpose
- owner
- source data
- formula/version
- numerator/denominator if applicable
- inclusion/exclusion
- update frequency
- sensitivity
- allowed audiences
- whether estimated/verified/realized

## Customer value evidence

Track outcomes such as time saved, software cost removed, readiness improvement, referral closure, revenue exceptions resolved, capacity utilized, workforce fulfillment and onboarding time.

Label outcomes:

- potential
- estimated
- verified
- realized

Never blur these categories.

## Data conflict/reconciliation

When two authoritative sources disagree, preserve both source records where appropriate and create reconciliation rather than silently choosing based on arrival order.

## AI relationship

Zumi receives minimum-necessary authorized context. AI summaries/embeddings/memory are derived context, not source truth.

Model training/use of customer data requires explicit policy/contract/privacy analysis and must never be assumed.

## De-identified benchmarking

Potential future product only after strong governance. Requirements include defensible de-identification, minimum cohort thresholds, contract rights, re-identification risk review and no patient-level resale model.

## Security/privacy

- strict access by data class/purpose
- encryption
- export audit
- retention/deletion policy
- no PHI in marketing analytics
- no secrets/sensitive data in client telemetry
- query/log minimization

## Performance/scale

Use purpose-built projections/materialized views/warehouse patterns only when evidence justifies them. Avoid running executive analytics directly as expensive scans against transactional clinical tables at scale.

## Tests

- provenance preservation
- metric formula/version
- tenant isolation
- retention/export rules
- derived-vs-authoritative separation
- de-identification policy where implemented
- correction/reconciliation
- analytics privacy

## Definition of done

Every important metric/derived insight can explain where it came from, who may see it, whether it is authoritative or derived and what happens when source data changes or conflicts.