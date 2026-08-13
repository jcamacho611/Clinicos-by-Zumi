# Klinikos External Dependency Matrix

This is the operating inventory for services, APIs, healthcare networks, credentials, contracts, BAAs, cost ownership, and production-connection truth.

The purpose is twofold:

1. replace unnecessary clinic software bills with native Klinikos capability where practical;
2. connect the external relationships that cannot truthfully be replaced by application code alone.

## Status vocabulary

- **Built** — the Klinikos-side workflow/interface is implemented.
- **Manual fallback** — the Klinikos workflow is real, but an authorized human performs the external step.
- **Adapter ready / Configurable** — an internal adapter/configuration boundary exists; production connection is not verified.
- **Sandbox-ready** — the provider can be used in a non-production environment once sandbox credentials/configuration are supplied.
- **Pending connection** — credentials, enrollment, provider setup, contract, BAA, or production approval remains.
- **Blocked** — code cannot truthfully finish the production capability until an external gate is resolved.
- **Verified live** — use only after the exact production environment has been independently checked; never infer this label from code presence.

## Current dependency matrix

| Klinikos capability | Current/preferred rail | PHI posture | External gates | Variable-cost owner | Current truth |
| --- | --- | --- | --- | --- | --- |
| Public application hosting | Render | PHI depends on production approval/configuration | Hosting account, environment secrets, production security/BAA posture where required | Klinikos infrastructure | **Built deploy contract; external deployment must be verified** |
| Public domain / DNS | GoDaddy + `klinikos.io` | No PHI by DNS itself | DNS/TLS/domain account | Klinikos | **Canonical identity configured by product law; verify DNS/TLS externally** |
| Clinic Operating Analysis checkout | GoDaddy paylink | Keep PHI out of checkout payload | Active paylink/account; reconciliation evidence | Buyer/clinic | **Built checkout intent + configured external paylink; settlement truth remains separate** |
| Commercial payment verification | Current manual evidence/reconciliation; future processor/webhook/API verification | Keep PHI out of processor metadata | Evidence source, account access, processor contract as applicable | Buyer/clinic transaction | **Built internal evidence/activation model; manual fallback available** |
| Direct card/payment processor | Stripe or equivalent | Keep PHI out of metadata | Production account, webhook/API credentials, security/commercial review | Clinic/transaction economics | **Adapter ready / Pending connection** |
| Grid marketplace payouts | Stripe Connect or equivalent platform rail | Keep PHI out of payout metadata | Platform terms, connected-account onboarding, production credentials, legal/commercial review | Transaction economics/platform fee | **Pending connection** |
| AI Gateway / Klinikos Intelligence | Provider-neutral; OpenAI/Anthropic/Azure/Gemini/self-hosted as approved | PHI prohibited unless exact provider/workload is approved | Provider account, contract/BAA where required, approved model/configuration, `ZUMI_PHI_EGRESS_APPROVED` for PHI use | Prefer plan allowance/customer-funded measured usage | **Gateway built; exact production provider status is environment-specific and must be verified** |
| Public web research/tooling | Approved research-capable provider/tool | Public data only by default | Provider/tool configuration and policy | Klinikos or customer-funded intelligence usage | **Architecture built / production tool availability environment-specific** |
| Grid map rendering | Google Maps Platform or replaceable map provider | Avoid PHI | API key, billing/project controls, vendor/security review | Klinikos COGS recovered in Grid/plan economics | **Adapter ready; visitor geolocation UI works without fabricating listings** |
| Geocoding / Places / routing | Google Places/Geocoding/Routes or alternative | Avoid PHI | API key/project controls/vendor review | Klinikos COGS or bounded usage allowance | **Pending/configurable** |
| SMS / voice | Twilio, Telnyx, or approved HIPAA-capable rail | Potential PHI | BAA and approved configuration before PHI | Prefer clinic-owned or priced usage allowance | **Adapter/config surfaces; Pending connection** |
| AI voice | Reviewed voice vendor or composed stack | Potential PHI | BAA/security review/model/voice vendor terms | Customer-funded/plan usage | **Pending connection** |
| Transactional email | Approved email provider | Potential PHI | PHI-specific vendor terms/BAA where required | Klinikos or clinic-owned | **Configurable / Pending connection** |
| Fax | HIPAA-capable fax provider or clinic-owned fax | Yes | BAA/credentials/vendor review | Prefer existing clinic account or pass-through usage | **Manual fallback / Pending connection** |
| Eligibility 270/271 | Stedi / clearinghouse alternative | Yes | BAA, payer enrollment, production credentials | Clinic transaction cost or plan allowance | **Sandbox-ready / Pending production connection** |
| Claims 837 | Stedi / clearinghouse alternative | Yes | BAA, enrollment, production credentials | Clinic transaction cost or plan allowance | **Sandbox-ready / Pending production connection** |
| Claim status 276/277 | Stedi / clearinghouse alternative | Yes | BAA/enrollment | Clinic transaction cost | **Sandbox-ready / Pending production connection** |
| ERA 835 | Stedi / clearinghouse alternative | Yes | BAA/enrollment | Clinic transaction cost | **Sandbox-ready / Pending production connection** |
| Payer directory | Stedi / CMS / payer data | Usually no PHI | Terms/licensing | Low COGS/plan | **Configurable** |
| NPI / taxonomy | CMS NPPES | No PHI | Public API/data terms | Minimal | **Configurable** |
| Medicare patient-authorized claims | CMS Blue Button | Yes | CMS app approval/OAuth/security | Usually no separate markup by default | **Pending connection** |
| CPT content | AMA-licensed source/vendor | No PHI by itself | License | Klinikos/revenue product economics | **Blocked pending license** |
| ICD-10-CM / HCPCS references | Official/licensed sources | No PHI by itself | Terms/license where applicable | Klinikos COGS | **Configurable/planned depending source** |
| E-prescribing / EPCS | Certified Surescripts-connected vendor | Yes | Certification, identity proofing, contract, BAA, production credentials | Clinic/plan depending contract | **Blocked/Pending connection** |
| PDMP | State/vendor-specific | Yes | State enrollment/credentialing/legal requirements | Clinic/plan | **Pending connection** |
| Labs | Quest, Labcorp, BioReference, intermediary/interface vendor | Yes | Existing clinic relationship, BAA, interface certification/credentials | Prefer clinic relationship; Klinikos handles interface | **Pending connection** |
| Imaging/radiology/PACS | HL7/FHIR/PACS/interface vendor | Yes | Contract/BAA/credentials | Prefer clinic relationship; Klinikos handles interface | **Pending connection** |
| Telemedicine video | Daily, Zoom for Healthcare, or approved alternative | Yes | BAA/HIPAA configuration | Klinikos COGS recovered in plan/usage | **Pending connection** |
| Provider license verification | State boards, Nursys, credentialing vendor as applicable | Limited sensitive data | Vendor/state terms and access | Klinikos COGS or credentialing fee | **Pending connection** |
| Malpractice verification | Carrier evidence + verification partner | Yes/personal data | Vendor/security review | Clinic/Grid economics | **Manual review today; external verification pending** |
| E-signature beyond native workflow | DocuSign/Adobe/approved vendor where needed | Yes | BAA/security/legal review | Plan or clinic-owned | **Native signing built; external rail pending where required** |
| Object storage | BAA-appropriate cloud object storage | Yes | BAA, encryption, IAM, retention/backups | Klinikos infrastructure | **Pending production storage; encrypted DB fallback exists** |
| Monitoring/observability | Sentry/Datadog/cloud-native or approved alternative | Logs should avoid PHI | Vendor terms/BAA if needed, telemetry minimization | Klinikos infrastructure | **Pending production selection/verification** |
| Enterprise SSO | OIDC/SAML via Entra/Google/IdP | Identity data | Enterprise IdP/security configuration | Enterprise/clinic plan | **Pending connection** |
| EDU LTI 1.3 / institutional SSO | School LMS/IdP | Student identity/education data | Institution agreement, credentials, privacy review | Institution/contract economics | **Pending connection** |

## AI Gateway rule

The provider-neutral gateway, admission policy, usage/audit ledger, context routing direction, and egress controls are internal Klinikos capability.

A provider being technically callable is **not** enough to mark PHI-capable inference live.

PHI use requires all of the following for the exact workload:

1. approved provider/model/environment;
2. executed BAA/contract where required;
3. appropriate security/configuration;
4. explicit deployment approval;
5. `ZUMI_PHI_EGRESS_APPROVED` or the successor deterministic gate;
6. minimum-necessary data and approved tool/provider scope.

Redaction reduces exposure. It does not substitute for those gates.

## Payment rule

The current public `$500` Clinic Operating Analysis flow uses a configured GoDaddy paylink after Klinikos persists a server-owned checkout intent.

The external checkout page is a rail, not the system of record for Klinikos entitlement.

`checkout intent → external payment attempt → verified/manual evidence → activation decision`

A redirect back to Klinikos is never sufficient payment evidence.

Grid payouts are separately gated. A financial obligation, fee calculation, or completed reservation must not be presented as payout settlement until the actual payout rail confirms it.

## Maps rule

Browser geolocation may center the Grid experience around a visitor without an external geocoding call.

Published resources appear only when real reviewed inventory exists and has sufficient geographic information. Klinikos must not generate fake nearby listings to make an empty market look active.

## Operating rules

1. **Replace unnecessary software. Connect unavoidable external relationships.** Labs, payers, pharmacies, payment networks, identity networks, communications rails, and regulated data/content providers may remain external while the clinic experiences them through Klinikos.
2. **No secret values belong in the repository.** Secrets live in approved environment/secret stores.
3. **No PHI leaves Klinikos for a connector until that exact connector/workload is approved for PHI.** A configured key is not production approval.
4. **Sandbox and production are different states.** Never market sandbox readiness as a production connection.
5. **Reuse customer-owned accounts when doing so safely reduces clinic cost.** The UX should say “Connect your existing account” rather than forcing users to understand API vocabulary.
6. **Use platform-owned services when shared infrastructure is operationally safer or produces a better unified product.** Their cost becomes Klinikos COGS.
7. **Variable-cost usage must be measured.** Tenant, feature, provider/vendor, unit count, and cost bucket should feed the usage/cost ledger so pricing is evidence-based.
8. **BAA, contract, license, OAuth scope, API credential, enrollment, and security approval are independent gates.** A capability is externally live only when every required gate is satisfied.
9. **Manual-but-truthful is acceptable. Fake automation is not.**
10. **External connection state never overrides RBAC, tenant isolation, consent, credentialing, safety, clinical, financial, or record-release rules.**

## Immediate external-dependency sequence

Prioritize connections by revenue and operational leverage rather than by novelty:

1. verify production hosting/domain after each main release;
2. keep GoDaddy checkout + evidence reconciliation reliable for the paid entry offer;
3. connect the production Zumi provider only under the correct data/contract posture;
4. productionize the map/geocoding boundary only as real Grid supply makes it valuable;
5. connect payment processor/payout rails when recurring subscriptions and Grid settlement require them;
6. connect communications with a reviewed PHI posture;
7. advance eligibility/claims rails for clinics that need them;
8. connect lab/imaging/eRx and other regulated clinical networks only with actual clinic/vendor agreements;
9. add customer connection onboarding and per-tenant cost metering around every variable-cost rail.
