# KLINIKOS Data Authority Matrix

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Prevent duplicate systems of record by declaring which domain owns authoritative state and which domains may only project/reference it.

| Data / State | Authoritative owner | Typical consumers | Critical rule |
|---|---|---|---|
| Person/account identity | Platform Kernel / Identity | all domains | one identity, many contexts |
| Organization/location hierarchy | Platform Kernel / Enterprise | all domains | scope every tenant-sensitive object |
| Membership/role | Platform Kernel / Enterprise | all domains | role != clinical authority |
| Profession/license/credential evidence | Identity/Trust + authoritative external source | Care, Grid, Enterprise, EDU | profile != verified credential |
| Privilege/assignment/delegation | Identity/Trust | Care, Grid, Enterprise | effective/contextual authority |
| Patient identity/chart | Care OS | Patient, Revenue, Payer, Zumi | patient identity never public Grid identity |
| Reusable patient intake | Patient OS | Care after reconciliation | patient update does not silently overwrite chart truth |
| Encounter/clinical evidence | Care OS | Revenue, Patient, Payer, Research, Zumi | AI memory is not clinical truth |
| Clinical Change | Care OS derived from structured evidence | Current Visit, Patient if released, Research | derived and provenance-backed |
| BodyMap history | Care OS | Current Visit, Research | immutable/versioned history |
| Appointment/scheduling | Care OS | Living Home, Grid capacity, Patient | Grid does not overwrite schedule |
| Order/referral/result review state | Care OS | Patient, Revenue, Integration, Zumi | result existence != provider review |
| External diagnostic result | external diagnostic source + Care persisted evidence | Care, Patient, Research | preserve source/version/correction |
| Coverage/eligibility response | Revenue OS + payer evidence | Care readiness, Patient, Payer | timestamp/source limitations explicit |
| Authorization | Revenue OS + payer evidence | Care, Scheduling, Patient | approval scope/expiration explicit |
| Coding decision | Revenue OS with clinical evidence/human decision | Claims, Care projection | AI suggestion != final coding authority |
| Claim | Revenue OS | Financial, Payer, Living Home | claim status from authoritative evidence |
| Denial/appeal | Revenue OS | Living Home, Zumi | payer response preserved |
| Payment/settlement | Financial OS + provider/bank evidence | Revenue, Customer Success | redirect != payment |
| Product offer/price | Financial OS Offer Registry | Digital Business, Sales, Product | page cannot invent price |
| Product entitlement | Financial/Enterprise authoritative contract evidence | Platform Kernel, product domains | UI visibility != entitlement security |
| CRM lead/prospect | Digital Business/CRM | Sales, analytics | B2B CRM separate from patient clinical record |
| Patient communication preference/consent | Patient/Communication domains | Communications, Care | channel/consent enforced |
| Communication delivery | Communications + external provider evidence | CRM, Patient, Care | sent != delivered without evidence |
| Grid demand/resource | Grid | Living Home, Network, Analytics | patient identity excluded from public supply/demand |
| Grid eligibility | Grid using Identity/Trust evidence | matching/ranking | eligibility before ranking |
| Grid transaction financial state | Financial OS | Grid | payment does not create eligibility |
| Network relationship | Network | Grid, Care coordination, EDU | relationship != data permission |
| EDU curriculum/assessment | EDU | Identity, Grid, Enterprise | completion != licensure |
| EDU completion evidence | EDU | Identity/Trust, Grid | label exact evidence type |
| Enterprise hierarchy/policy | Enterprise | all domains | parent org access not automatic |
| Integration lifecycle/exchange | Integration Hub | all domains | adapter state truth explicit |
| Product analytics | Data Platform | Product/Growth | not clinical/financial authority |
| Security telemetry | Platform Operations/Trust | Security/SRE | no unnecessary PHI |
| Control/assurance evidence | Trust/Assurance | Enterprise, public Trust | document does not create control |
| Migration/import job state | Implementation/Migration | source domains, CS | imported domain fact becomes source-domain authority only after acceptance/reconciliation |
| AI memory | Zumi/Memory | Zumi | context only, never source truth |
| Research/benchmark derivation | Research/Data Platform | enterprise/payer/public aggregate outputs | methodology/version/authorization required |

## Conflict rule

When two sources disagree:

1. preserve provenance
2. identify each source's authority and effective date
3. create reconciliation work when ambiguity matters
4. do not choose by last-write-wins convenience
5. do not let AI resolve factual conflict without an authorized deterministic/human process

## DTO rule

Public/browser DTOs contain only the minimum fields needed for the experience. Raw ORM models and sensitive internal objects are not frontend contracts.
