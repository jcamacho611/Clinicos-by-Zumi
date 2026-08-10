# Klinikos Vendor & Regulatory Gates

Status: engineering/vendor onboarding tracker. This is not a legal opinion. Vendor terms, BAAs, eligibility and product availability must be confirmed before production activation.

| Capability | Preferred provider/source | Production prerequisites | PHI posture | Customer-facing status until complete |
|---|---|---|---|---|
| GRID maps / places / geocoding / routes | Google Maps Platform | Cloud project, restricted keys, enabled APIs, billing, server/browser separation | Do not send PHI or patient medical intent through ordinary Maps workflows | Setup required |
| Marketplace payments/payouts | Stripe + Stripe Connect | Platform account, Connect config, webhook secret, test/live review, account onboarding | Keep PHI out of Stripe metadata | Setup required |
| SMS/Voice | Twilio | Approved account/product configuration, credentials, BAA if PHI-bearing use | PHI blocked until approved HIPAA/BAA posture | Pending connection |
| Transactional email | Resend or approved alternative | Domain authentication, API key, deliverability config | Default non-PHI | Connection available / Setup required |
| Eligibility / claims / ERA | Stedi | Sandbox account, API credentials, BAA/production enrollment and payer setup as needed | ePHI only after approved BAA posture | Sandbox / Pending production |
| Telemedicine | Daily or approved alternative | HIPAA-eligible plan/configuration, BAA, API key | PHI only in approved configuration | Pending connection |
| Medicare beneficiary claims data | CMS Blue Button | Sandbox app, OAuth credentials, CMS production approval | Patient-authorized | Sandbox / Pending production |
| NPI / taxonomy | CMS NPPES | Public API integration | Public data, no PHI | Connection available |
| Exclusion screening | HHS OIG LEIE | Scheduled dataset ingestion/checking | Public data | Connection available |
| Federal exclusion screening | SAM.gov | API key/account if API used | Public data | Setup required |
| State license verification | State boards / licensed data vendor | State-by-state source mapping / licenses or agreements | Professional/public data | Pending source |
| Malpractice verification | carrier evidence / credentialing vendor | Provider authorization, source rules, vendor contract if automated | Sensitive professional data | Human review required |
| E-signatures | approved vendor | Vendor selection, contract, security review, BAA if PHI-bearing | Depends on payload | Vendor blocked |
| Secure file storage | approved cloud/object store | server-side encryption, access controls, signed URLs, backups, BAA if PHI | PHI blocked until approved | Pending production review |
| Labs | Quest / Labcorp / BioReference / intermediary | commercial agreement, interface credentials, testing, BAA/data-use requirements | PHI | Vendor blocked |
| Radiology | facility/PACS/interface vendor | contracts, interface testing, HL7/FHIR/DICOM approach | PHI | Vendor blocked |
| eRx / EPCS | certified/approved prescribing vendor | vendor selection, contracts, identity proofing, state/federal requirements, controlled-substance rules | PHI/high risk | Vendor blocked |
| Clearinghouse/payer | Stedi or other clearinghouse | enrollment, agreements, trading-partner setup | PHI | Vendor blocked until enrolled |

## Universal connector gate

No connector may be marked production-ready merely because credentials exist.

Required checks:

1. tenant ownership of connector configuration
2. credential presence in server-side secret storage
3. sandbox/live state
4. vendor contract status
5. BAA status where applicable
6. PHI permitted flag
7. minimum-necessary data mapping
8. health check
9. retry/fallback behavior
10. audit logging
11. error redaction
12. customer-facing truthful status

## GRID-specific gates

GRID should not activate real paid clinical bookings until the following are operationally approved:

- role-specific marketplace agreements
- provider identity/credential workflow
- license and malpractice verification process
- suspension/expiration controls
- location/facility verification process
- scope/supervision review workflow appropriate to jurisdiction/service
- refund/cancellation/dispute rules
- Stripe Connect test/live onboarding and payout rules
- incident/adverse-event workflow
- insurance requirements
- prohibited-services rules
- PHI-safe map/search architecture
- data-minimization rules between customer, provider and location partner

## Status language

Use:
- Connected
- Setup required
- Sandbox
- Pending production
- Vendor blocked
- BAA required
- Human review required
- Requires counsel review

Avoid:
- HIPAA compliant
- fully verified
- approved provider
- guaranteed eligibility
- guaranteed payment
unless the exact claim is supported by production evidence and appropriate authority.
