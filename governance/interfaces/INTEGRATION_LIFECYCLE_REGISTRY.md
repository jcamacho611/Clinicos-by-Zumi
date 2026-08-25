# KLINIKOS Integration Lifecycle Registry

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Ensure every external connection has an explicit capability, environment, evidence level, owner and lifecycle state so the product never confuses adapter code with production integration.

## Lifecycle states

- `PLANNED`
- `CONTRACTING_OR_SETUP_PENDING`
- `CREDENTIALS_PENDING`
- `ADAPTER_READY`
- `SANDBOX_CONNECTED`
- `UAT`
- `CONTROLLED_PRODUCTION`
- `PRODUCTION_VERIFIED`
- `DEGRADED`
- `DISABLED`
- `RETIRED`

## Required registry fields

- integrationId
- provider/vendor
- category
- capability
- owning Klinikos domain
- adapter implementation path
- environment
- lifecycle state
- data classes handled
- PHI/PII level
- credentials owner/source
- BAA/DPA/contract state where applicable
- mapping/version
- webhook/signature requirements
- polling schedule where applicable
- rate limits
- retries/idempotency
- reconciliation behavior
- last successful verification
- health status
- fallback/manual path
- internal owner
- vendor contact/escalation

## Integration categories

### EHR / interoperability

FHIR, SMART on FHIR, HL7 v2, document exchange, external EHR APIs.

### Payer / revenue

Eligibility, authorization, claim submission/status, remittance, clearinghouse.

### Diagnostic

Labs, imaging/PACS, specialty diagnostics.

### Medication

Pharmacy/eRx, formulary/benefit, medication history, drug knowledge.

### Financial

Payment processor, ACH/bank, invoicing/accounting, marketplace settlement.

### Communications

SMS, email, voice/contact center, fax.

### Telemedicine

Video/session provider.

### Identity / trust

NPPES/NPI, licensing, exclusions, enterprise identity providers.

### Devices

Remote-monitoring/device vendors.

### Enterprise / public

Government/public datasets, workforce reporting, enterprise systems.

## Verification rule

A provider may appear in public/internal integration UI only at the exact supported truth state.

Examples:

- Adapter code present but no credentials → **Adapter ready / setup required**
- Sandbox successful → **Sandbox connected**
- Production credentials and tested transaction → **Controlled production**
- Repeated monitored production evidence and reconciliation proven → **Production verified**

Never infer a higher state from vendor logo, documentation or unused code.

## Runtime behavior

When an integration is degraded or disabled:

- stop unsafe transmissions
- preserve queued/reconcilable work
- show plain-language impact
- identify fallback/manual path
- alert internal owner when material

## Vendor-replacement ladder

Each integration also carries strategy classification:

- CONNECT
- ABSTRACT
- CONTROL
- INTERNALIZE
- REPLACE
- NEVER REPLACE

Classification is reviewed against cost, margin, reliability, control, regulation, customer value and switching risk.

## Initial target register categories

Maintain concrete rows in implementation for current/target vendors such as:

- Stripe/payment processor
- email/SMS/voice/fax providers
- AI providers
- mapping/geolocation providers
- clearinghouse(s)
- Quest/Labcorp/BioReference or other lab partners when actual setup begins
- imaging/PACS providers when actual setup begins
- eRx/pharmacy rail when actual setup begins
- external EHRs such as Epic/athena/eClinicalWorks/MDLand when actual interfaces exist

This document does not claim any named provider is currently production integrated.

## Tests

- lifecycle state cannot advance without required evidence
- production UI reflects registry state
- degraded state produces fallback/reconciliation
- credentials never exposed to browser
- cross-tenant connection isolation
- webhook/replay/idempotency behavior
- strategy classification does not alter runtime truth
