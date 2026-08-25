# Klinikos System Blueprints

Status: GOVERNING DOMAIN-BLUEPRINT INDEX

Implementation agents must read the blueprint for every domain touched by a change. Current code remains implementation truth; these documents describe final-form ownership and acceptance.

| System | Blueprint | Primary phase |
|---|---|---|
| Platform Kernel + Living Home | `PLATFORM_KERNEL_AND_LIVING_HOME.md` | P0 |
| Universal Entry & Opportunity Network | `UNIVERSAL_ENTRY_AND_OPPORTUNITY_NETWORK.md` | P0/P1/P3 |
| Care OS | `CARE_OS.md` | P0/P1 |
| Patient OS | `PATIENT_OS.md` | P1/P2 |
| Revenue Integrity OS | `REVENUE_OS.md` | P0/P1/P2 |
| Financial OS | `FINANCIAL_OS.md` | P0/P2 |
| Zumi Runtime | `ZUMI_RUNTIME.md` | P0/P1/P2 |
| Grid Exchange | `GRID_EXCHANGE.md` | P0/P2/P3 |
| Network OS | `NETWORK_OS.md` | P3 |
| EDU + Workforce | `EDU_WORKFORCE_OS.md` | P2/P3 |
| Identity/Credential/Trust | `IDENTITY_CREDENTIAL_TRUST_OS.md` | P1/P3 |
| Payer/Population/VBC | `PAYER_VALUE_BASED_CARE_OS.md` | P4 |
| Pharmacy/Remote Care | `PHARMACY_AND_REMOTE_CARE_OS.md` | P3/P4 |
| Diagnostic Network | `DIAGNOSTIC_NETWORK_OS.md` | P1/P2/P3 |
| Communications/CRM/Contact Center | `COMMUNICATIONS_CRM_CONTACT_CENTER.md` | P1/P2 |
| Practice Business OS | `PRACTICE_BUSINESS_OS.md` | P1/P2/P3 |
| Enterprise OS | `ENTERPRISE_OS.md` | P3/P4 |
| Digital Business + Website | `DIGITAL_BUSINESS_AND_WEBSITE.md` | P0/P1 |
| Integration Hub | `INTEGRATION_HUB.md` | P0/P2/P3 |
| Data/Intelligence Platform | `DATA_INTELLIGENCE_PLATFORM.md` | P0/P3/P4 |
| Implementation/Migration/Customer Success | `IMPLEMENTATION_MIGRATION_CUSTOMER_SUCCESS.md` | P0/P2 |
| Trust/Assurance | `TRUST_ASSURANCE_OS.md` | P0/P3/P4 |
| Platform Ops/SRE/DevSecOps | `PLATFORM_OPERATIONS_SRE_DEVSECOPS.md` | P0 onward |
| Research/Outcomes/Benchmarking | `RESEARCH_OUTCOMES_AND_BENCHMARKING.md` | P3/P5 |
| Developer/Partner Ecosystem | `DEVELOPER_PARTNER_ECOSYSTEM.md` | P5 |

## Cross-cutting growth law

Also read `../KLINIKOS_CAPABILITY_COMPOUNDING_ENGINE.md` for every substantial product capability. No major feature is allowed to remain a dead-end when it can safely create acquisition, activation, expansion, Grid/Network, customer-value, evidence or partner value.

## Reading rule

A feature that crosses systems must read every owning blueprint plus the relevant `governance/interfaces/` contracts before implementation. No system may reach into another system's tables merely because both live in the same repository.
