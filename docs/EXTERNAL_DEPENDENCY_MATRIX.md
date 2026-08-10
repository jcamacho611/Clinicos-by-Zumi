# Klinikos External Dependency Matrix

This document is the operating inventory for external APIs, networks, vendors, credentials, contracts, BAAs, cost ownership, and connection status. It is intentionally explicit so Klinikos can replace unnecessary software bills while connecting the external healthcare relationships that cannot be replaced by an EHR.

## Status vocabulary

- **Live** — production connection is implemented, configured, verified, and approved for the stated use.
- **Sandbox-ready** — code/configuration can use a vendor sandbox, but production use is not yet approved.
- **Configurable** — adapter/configuration surface exists or can be wired with credentials, but production verification is incomplete.
- **Planned** — vendor/contract/adapter work remains.

## Dependency matrix

| Klinikos capability | Preferred provider / rail | Alternatives | Sandbox | PHI | BAA / contract gate | Customer can connect existing account | Who should bear variable cost | Current implementation status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI Gateway / Copilot | OpenAI | Anthropic, Azure OpenAI, Google Gemini | Yes | Potentially | Required before PHI workloads | Yes, where provider supports a safe organization/project connection | Prefer customer-owned or priced into Klinikos Intelligence | Configurable |
| Secondary AI routing | Anthropic | OpenAI, Google, Azure | Yes | Potentially | Required before PHI workloads | Yes | Prefer customer-owned or priced into intelligence | Planned |
| GRID map rendering | Google Maps Platform | Mapbox, Azure Maps | Yes | Avoid PHI in map payloads | Standard vendor/security review | Usually platform-owned for shared GRID experience | Klinikos COGS, recovered in subscription/GRID economics | Configurable |
| GRID geocoding / Places | Google Places + Geocoding | Mapbox, HERE | Yes | Avoid PHI where possible | Standard vendor/security review | Usually platform-owned | Klinikos COGS, recovered in plan | Configurable |
| GRID distance / routing | Google Routes / Route Matrix | Mapbox Matrix, HERE Routing | Yes | Avoid PHI where possible | Standard vendor/security review | Usually platform-owned | Klinikos COGS, recovered in plan | Configurable |
| Payments | Stripe | Adyen, Square | Test mode | Keep PHI out of metadata | Commercial/security review | Yes | Clinic/payment transaction | Configurable |
| Marketplace payouts | Stripe Connect | Adyen for Platforms | Test mode | Keep PHI out of metadata | Commercial/security review | Platform + connected accounts | Transaction economics / platform fee | Planned |
| SMS / Voice | Twilio | Callura, Telnyx, other HIPAA-capable vendor | Yes | Yes | BAA and approved configuration required | Yes | Prefer clinic-owned connection or recover in plan | Configurable |
| AI voice workflows | Callura or reviewed voice vendor | Twilio + voice AI stack | Vendor dependent | Yes | BAA and vendor security review required | Vendor dependent | Prefer embedded commercial agreement / clinic plan | Planned |
| Transactional email | Resend or approved email vendor | SendGrid, SES | Yes | Potentially | PHI email blocked until approved vendor terms/BAA | Sometimes | Klinikos or customer connection depending deployment | Configurable |
| Eligibility 270/271 | Stedi | Availity / clearinghouse alternatives | Yes | Yes | BAA, enrollment and production credentials required | Often yes | Prefer clinic transaction cost or included allowance | Sandbox-ready |
| Claims 837 | Stedi | Availity / clearinghouse alternatives | Yes | Yes | BAA, enrollment and production credentials required | Often yes | Clinic transaction cost or included allowance | Sandbox-ready |
| Claim status 276/277 | Stedi | Clearinghouse alternatives | Yes | Yes | BAA / enrollment | Often yes | Clinic transaction cost or included allowance | Sandbox-ready |
| ERA 835 | Stedi | Clearinghouse alternatives | Yes | Yes | BAA / enrollment | Often yes | Clinic transaction cost or included allowance | Sandbox-ready |
| Payer directory | Stedi / payer directories | CMS/payer data | Yes | No | Vendor terms | N/A | Negligible / plan | Sandbox-ready |
| NPI / taxonomy | CMS NPPES | Licensed credentialing datasets | Public | No | Public API terms | N/A | No meaningful variable cost expected | Configurable |
| Medicare patient-authorized claims | CMS Blue Button | Other payer APIs | Yes | Yes | CMS app approval / OAuth controls | Patient-authorized | No separate Klinikos markup by default | Planned |
| CPT reference data | AMA licensed CPT content | Authorized coding vendors | Vendor dependent | No by itself | License required | No | Allocate licensing cost into coding/revenue product economics | Planned |
| ICD-10-CM / HCPCS references | Official/licensed reference sources | Coding vendors | Public/licensed depending source | No | License/terms review | No | Klinikos COGS | Planned |
| E-prescribing / EPCS | Vendor/network TBD | Surescripts-connected vendors | Vendor dependent | Yes | Certification, contracts, BAA and identity controls | Clinic relationship may be reusable | Clinic or Klinikos plan depending contract | Planned |
| Lab orders / results | Quest, Labcorp, BioReference and/or intermediary | Other labs / interface vendors | Vendor dependent | Yes | Contract, BAA, interface certification/credentials | Existing clinic relationships should be reused | Clinic relationship; Klinikos handles interface | Planned |
| Imaging / radiology | HL7/FHIR/PACS adapters | Interface intermediary | Vendor dependent | Yes | Contract / BAA / credentials | Existing clinic relationships should be reused | Clinic relationship; Klinikos handles interface | Planned |
| Telemedicine video | Daily or equivalent HIPAA-capable vendor | Zoom for Healthcare, Twilio Video alternatives | Yes | Yes | BAA / HIPAA configuration | Usually not necessary | Klinikos COGS recovered in subscription/usage | Planned |
| Provider license verification | State boards + credentialing vendor | Nursys / commercial credentialing vendors where applicable | Varies | Limited | Vendor/state terms | N/A | Klinikos COGS or credentialing fee | Planned |
| Malpractice verification | Document + verification partner | Carrier verification / manual review | Varies | Yes | Vendor/security review | Existing carrier evidence | Clinic/GRID economics | Planned |
| Fax | HIPAA-capable fax vendor TBD | Existing clinic fax service | Varies | Yes | BAA required | Yes where supported | Prefer existing clinic account or usage pass-through | Planned |
| E-signatures | Native Klinikos signing + approved vendor when required | DocuSign / Adobe Sign | Varies | Yes | BAA/security/legal review where PHI is present | Sometimes | Klinikos plan or clinic-owned connection | Planned |
| Object storage | Production cloud object storage | Cloud provider alternatives | N/A | Yes | BAA / encryption / access controls | No | Klinikos infrastructure COGS | Planned / current encrypted DB fallback exists |
| Monitoring / observability | Vendor TBD | Sentry, Datadog, cloud-native tooling | N/A | Logs must avoid PHI | BAA if PHI could be present; prefer PHI-minimized telemetry | No | Klinikos infrastructure COGS | Planned |
| Enterprise SSO | OIDC/SAML provider | Microsoft Entra ID, Google Workspace | Yes | Identity data | Security review | Yes | Clinic or enterprise plan | Planned |

## Operating rules

1. **Klinikos is the EHR and operating system.** Existing EHR connections are for migration, interoperability, transition, or unavoidable ecosystem access, not as the primary system of record.
2. **Replace every unnecessary bill. Connect every necessary external relationship.** Labs, payers, pharmacies, payment networks, identity networks, and communication rails may remain external while the clinic experiences them through Klinikos.
3. **No secret values belong in this repository.** Secrets live only in approved environment/secret stores.
4. **No PHI leaves Klinikos for a connector until that connector is explicitly approved for PHI.** A configured key does not equal production approval.
5. **Sandbox and production are separate states.** Sandbox readiness must never be presented as a live production integration.
6. **Customer-owned accounts should be reused when that lowers total clinic cost and the provider safely supports it.** The user-facing experience should say “Connect your existing account,” not expose API terminology unnecessarily.
7. **Platform-owned services should be chosen when shared infrastructure is operationally safer or produces a better unified product.** Their cost becomes Klinikos COGS and must be included in pricing economics.
8. **Every variable-cost connector must eventually write to the Klinikos cost ledger** by tenant, feature, vendor and usage unit so pricing and margins are based on actual economics.
9. **BAAs, contracts, licenses, OAuth scopes, API credentials, production enrollment and security review are independent gates.** A feature becomes live only after every required gate is satisfied.

## Immediate backend sequence

1. Central connector catalog and environment schema.
2. Connector health/status service with no secret disclosure.
3. AI Gateway provider abstraction and usage ledger.
4. Google Maps/Places/Routes server/client boundary for GRID.
5. Stedi sandbox adapter for eligibility/claims flows.
6. Stripe test adapter and webhook verification.
7. Communications adapter with approved vendor selection.
8. Vendor/BAA registry and PHI permission gates.
9. Customer connection onboarding for reusable vendor relationships.
10. Pricing engine consumes actual connector + AI cost data.
