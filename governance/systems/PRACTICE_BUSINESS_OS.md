# Practice Business OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P1/P2/P3

## Purpose

Extend Klinikos beyond charting into the day-to-day business operations that determine whether a practice grows, wastes money, underuses capacity or depends on unnecessary software/vendors.

## Primary owner questions

- **Where am I losing time or money?**
- **What should I work on today?**
- **Which systems am I paying for that Klinikos could replace?**
- **Which rooms/providers are underused?**
- **Which leads/patients need follow-up?**
- **Which vendors/services should we keep, connect, renegotiate or replace?**

## Subsystems

- software stack inventory/replacement
- CRM/growth connection
- operational workflow map
- capacity utilization
- rooms/equipment/resources
- staff/workforce needs
- vendor/procurement registry
- inventory/supply basics where appropriate
- practice-launch workflow
- med-spa/cash-pay business operations
- business-performance reporting

## Frontend surfaces

- owner Living Home
- stack map
- vendor spend view
- capacity view
- resource utilization
- lead/follow-up summary
- software replacement recommendations
- practice launch checklist
- procurement/business services

## Domain authority

Practice Business OS owns business/operational configuration, vendor-stack records, resource-utilization projections and business recommendations. Financial OS owns actual Klinikos payment truth; external accounting/bank systems remain authoritative for their own data unless integrated.

## Backend services

- PracticeProfileService
- SoftwareStackService
- VendorRegistryService
- CapacityAnalyticsService
- ResourceUtilizationService
- PracticeLaunchService
- ProcurementNeedService
- BusinessOpportunityEngine
- StackReplacementEngine
- BusinessPerformanceProjection

## Software Stack Replacement Engine

Inventory each current vendor/system:

- vendor
- function
- monthly/annual cost if supplied/verified
- contract/renewal date
- users
- current workflow
- integration dependencies
- pain
- replacement classification

Classify:

- KEEP
- CONNECT
- ABSTRACT
- CONTROL
- MIGRATE
- REPLACE

Show potential savings only from customer-supplied/verified costs and approved pricing.

## Practice launch

Potential future path:

`ENTITY/ORGANIZATION READY → BRAND/SITE → SERVICES → STAFF → SCHEDULING → FORMS/CONSENT → CARE → PAYMENTS → COMMUNICATIONS → BILLING/REVENUE → GRID → TRAINING → GO-LIVE`

Do not provide unqualified legal/clinical-practice advice as automatic setup. Surface required professional/legal steps and external dependencies.

## Capacity

Use Scheduling/Grid evidence to show:

- provider time
- rooms/chairs
- equipment
- appointment capacity
- underutilization
- shortages

Potential opportunity must be labeled estimated/potential until fulfilled.

## Procurement/business services

Potential Grid-connected categories:

- billing
- credentialing
- compliance
- IT/security
- accounting/bookkeeping
- marketing
- recruiting
- translation
- supplies/equipment
- implementation services

Legal/financial/referral categories require category policy.

## Med spa / cash-pay

Support configured services, packages/memberships, deposits/payments, consult conversion, follow-up/reactivation, room/chair/provider capacity and appropriate clinical documentation without forking the platform.

## Commands/events

Commands: add/update vendor, record cost, classify replacement, create procurement need, create capacity opportunity, start practice launch, mark launch requirement complete.

Events: SoftwareVendorRecorded, StackReplacementRecommended, CapacityOpportunityDetected, ProcurementNeedCreated, PracticeLaunchStarted, PracticeLaunchReady.

## Zumi

May explain stack costs, prepare replacement plan, identify idle capacity, prepare procurement/Grid demand and guide practice launch. It may not fabricate savings or recommend regulated corporate/legal structure as fact.

## Economics

Supports paid assessments, implementation, recurring software, Grid/business-services revenue and retention through measurable stack savings.

## Tests

- cost provenance
- proposed vs verified savings
- stack classification
- capacity evidence
- Grid handoff
- practice-launch gating
- med-spa entitlement/configuration

## Definition of done

A practice owner can understand the software/services/resources they use, where operational capacity is wasted, what Klinikos could truthfully replace or connect and what approved action should happen next.