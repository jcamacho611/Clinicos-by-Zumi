# Klinikos External Dependency Matrix

Status: `AUTHORITATIVE EXTERNAL-TRUTH INDEX`
Updated: 2026-08-17 America/New_York
Repository baseline at update: `main@a111ae4ec4c5dfc02bd2b4d376a5a1a60acffdc9`

This is the operating inventory for services, APIs, healthcare networks, credentials, contracts, BAAs, cost ownership, and production-connection truth.

The purpose is to replace unnecessary clinic software with native Klinikos capability where practical while connecting external relationships that application code cannot truthfully replace.

## Status vocabulary

- **Built** — Klinikos-side workflow/interface is implemented.
- **Manual fallback** — the Klinikos workflow is real, but an authorized human performs the external step.
- **Adapter ready / Configurable** — an internal adapter/configuration boundary exists; production connection is not verified.
- **Sandbox-ready** — usable in a non-production environment once sandbox credentials/configuration are supplied.
- **Pending connection** — credentials, enrollment, provider setup, contract, BAA, or production approval remains.
- **Blocked** — code cannot truthfully finish the production capability until an external gate is resolved.
- **Verified live** — use only after the exact production environment has been independently checked; never infer this from code presence or repository CI.

## Current dependency matrix

| Klinikos capability | Current/preferred rail | PHI posture | External gates | Variable-cost owner | Current truth |
| --- | --- | --- | --- | --- | --- |
| Public application hosting | Render | PHI depends on production approval/configuration | Hosting account, environment secrets, production security/BAA posture where required | Klinikos infrastructure | **Verified service health in demo mode on 2026-08-16; exact deployed SHA and PHI posture remain unverified** |
| Public domain / DNS | GoDaddy + `klinikos.io` | No PHI by DNS itself | DNS/TLS/domain account | Klinikos | **`www.klinikos.io/api/health` returned HTTP 200 through Cloudflare/Render on 2026-08-16; exact deploy SHA remains unverified** |
| Clinic Operating Analysis checkout | Preferred live Stripe-hosted Checkout when fully configured; existing GoDaddy paylink fallback | Keep PHI out of Stripe/checkout metadata | Stripe webhook registration/secret and live exercise; GoDaddy reconciliation remains available | Buyer/clinic | **Stripe Checkout code built in current candidate; GoDaddy checkout/manual fallback preserved** |
| Commercial payment verification | Signed Stripe webhook evidence or authorized manual reconciliation | Keep PHI out of processor metadata and persisted webhook payloads | Deployed endpoint, signing secret, runtime evidence, account/security review | Buyer/clinic transaction | **Shared evidence/activation model built; Stripe signed-webhook code built in current candidate; live verification pending** |
| Direct card/payment processor | Stripe | Keep PHI out of metadata | Live key is operator-reported configured; live endpoint registration, signing secret, security/commercial review, and real payment exercise remain | Clinic/transaction economics | **BUILT / OPERATOR-REPORTED KEY CONFIGURED / PENDING CONNECTION — not verified live** |
| Stripe live webhook | `POST /api/webhooks/stripe` | Raw body is verified; persisted evidence is identifier/status-only | Register only `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `payment_intent.payment_failed`, and `charge.refunded`; store live endpoint secret in Render | Klinikos infrastructure | **Built in current candidate; signing secret pending; no live event yet observed** |
| Grid marketplace payouts | Stripe Connect or equivalent platform rail | Keep PHI out of payout metadata | Platform terms, connected-account onboarding, credentials, legal/commercial review | Transaction economics/platform fee | **Pending connection** |
| AI Gateway / Klinikos Intelligence | Provider-neutral; Cloudflare Workers AI, approved OpenAI configuration, or self-hosted provider as configured | PHI prohibited unless exact provider/workload is approved | Provider account, approved model/config, contract/BAA where needed, PHI egress approval | Prefer plan allowance/customer-funded measured usage | **Gateway and Cloudflare adapter built; production health reported `liveIntegrations: false`, so live inference is not verified** |
| Public web research/tooling | Approved research-capable provider/tool | Public data only by default | Tool/provider configuration and policy | Klinikos or customer-funded intelligence usage | **Architecture built; external availability environment-specific** |
| Grid browser geolocation | Browser Geolocation API | Raw visitor location should not become public inventory/analytics by default | User permission + secure context | No direct API COGS | **Built: explicit opt-in only** |
| Grid keyless map rendering | OpenStreetMap embed/fallback | Avoid PHI; public resource coords are privacy-reduced | Public map availability/terms | Minimal/shared infrastructure | **Built fallback** |
| Grid Google map path | Google Maps Platform | Avoid PHI | API key, map ID, billing/project controls, vendor/security review | Klinikos COGS recovered in Grid/plan economics | **Adapter ready / Pending configuration** |
| Geocoding / Places / travel routing | Google or approved alternative | Avoid PHI unless separately approved | API key/project controls/vendor review | Klinikos COGS or bounded usage allowance | **Pending connection** |
| SMS / voice | Twilio, Telnyx, or approved HIPAA-capable rail | Potential PHI | BAA and approved configuration before PHI | Prefer clinic-owned or priced allowance | **Adapter/config surfaces; Pending connection** |
| AI voice | Reviewed voice vendor or composed stack | Potential PHI | BAA/security/model/vendor terms | Customer-funded/plan usage | **Pending connection** |
| Transactional email | Approved provider | Potential PHI | PHI-specific terms/BAA where required | Klinikos or clinic-owned | **Configurable / Pending connection** |
| Fax | HIPAA-capable provider or clinic-owned fax | Yes | BAA/credentials/vendor review | Prefer existing clinic account/pass-through | **Manual fallback / Pending connection** |
| Eligibility 270/271 | Stedi / clearinghouse alternative | Yes | BAA, payer enrollment, production credentials | Clinic transaction cost/plan allowance | **Sandbox-ready / Pending production connection** |
| Claims 837 | Stedi / clearinghouse alternative | Yes | BAA, enrollment, production credentials | Clinic transaction cost/plan allowance | **Sandbox-ready / Pending production connection** |
| Claim status 276/277 | Stedi / clearinghouse alternative | Yes | BAA/enrollment | Clinic transaction cost | **Sandbox-ready / Pending production connection** |
| ERA 835 | Stedi / clearinghouse alternative | Yes | BAA/enrollment | Clinic transaction cost | **Sandbox-ready / Pending production connection** |
| Payer directory | Stedi / CMS / payer data | Usually no PHI | Terms/licensing | Low COGS/plan | **Configurable** |
| NPI / taxonomy | CMS NPPES | No PHI | Public API/data terms and runtime availability | Minimal | **Built public-evidence adapter; never license or eligibility authority** |
| Federal exclusion pre-screen | HHS OIG LEIE downloadable dataset | No PHI | Public dataset availability/schema/freshness; documented human/OIG online verification remains required | Minimal | **Built bounded/cached exact-NPI pre-screen; not exclusion clearance** |
| Medicare patient-authorized claims | CMS Blue Button | Yes | CMS app approval/OAuth/security | Usually no separate markup by default | **Pending connection** |
| CPT content | AMA-licensed source/vendor | No PHI by itself | License | Klinikos/revenue economics | **Blocked pending license** |
| ICD-10-CM / HCPCS references | Official/licensed sources | No PHI by itself | Terms/license where applicable | Klinikos COGS | **Configurable/planned depending source** |
| E-prescribing / EPCS | Certified Surescripts-connected vendor | Yes | Certification, identity proofing, contract, BAA, credentials | Clinic/plan depending contract | **Blocked / Pending connection** |
| PDMP | State/vendor-specific | Yes | State enrollment/credentialing/legal requirements | Clinic/plan | **Pending connection** |
| Labs | Quest, Labcorp, BioReference, intermediary/interface vendor | Yes | Clinic relationship, BAA, interface certification/credentials | Prefer clinic relationship; Klinikos handles interface | **Pending connection** |
| Imaging / PACS | HL7/FHIR/PACS/interface vendor | Yes | Contract/BAA/credentials | Prefer clinic relationship; Klinikos handles interface | **Pending connection** |
| Telemedicine video | Daily, Zoom for Healthcare, or approved alternative | Yes | BAA/HIPAA configuration | Klinikos COGS recovered in plan/usage | **Pending connection** |
| Provider license verification | State boards, Nursys, credentialing vendor | Limited sensitive data | Vendor/state terms/access | Klinikos COGS or credentialing fee | **Pending connection** |
| Malpractice verification | Carrier evidence + verification partner | Personal/sensitive data | Vendor/security review | Clinic/Grid economics | **Manual review today; external verification pending** |
| E-signature beyond native workflow | DocuSign/Adobe/approved vendor where needed | Yes | BAA/security/legal review | Plan or clinic-owned | **Native signing built; external rail pending where required** |
| Object storage | BAA-appropriate cloud storage | Yes | BAA, encryption, IAM, retention/backups | Klinikos infrastructure | **Pending production storage; internal DB paths do not substitute for storage program truth** |
| Monitoring/observability | Sentry/Datadog/cloud-native or approved alternative | Logs should avoid PHI | Vendor terms/BAA if needed, telemetry minimization | Klinikos infrastructure | **Pending production selection/verification** |
| Enterprise SSO | OIDC/SAML via Entra/Google/IdP | Identity data | Enterprise IdP/security configuration | Enterprise/clinic plan | **Pending connection** |
| EDU LTI 1.3 / institutional SSO | School LMS/IdP | Student/education data | Institution agreement, credentials, privacy review | Institution/contract economics | **Pending connection** |

## AI Gateway rule

A technically callable model is not enough to mark PHI-capable inference live. External PHI use requires the exact approved provider/model/environment, contract/BAA where required, approved security/configuration, deployment approval, deterministic PHI-egress gate, minimum-necessary data, and approved tool/provider scope.

Redaction reduces exposure; it does not replace those gates.

## Payment rule

Current candidate paid-entry truth is:

`server-owned intent/amount → Stripe-hosted Checkout when fully configured OR GoDaddy fallback → signed Stripe evidence OR authorized manual evidence → product policy / reconciliation`

A redirect back to Klinikos is never payment evidence. The production Stripe route is live-only and rejects signed test-mode events. Grid payouts are separately gated: financial obligation, fee calculation, reservation, fulfillment, or customer payment do not prove external payout settlement.

## Maps and location rule

The current Grid MVP can function without Google credentials:

- explicit browser geolocation is built;
- keyless OpenStreetMap is the working fallback;
- only real reviewed/published supply creates inventory markers;
- Haversine radius matching uses stored coordinate truth where available;
- Google map rendering remains an optional adapter path pending actual key/map ID configuration;
- geocoding, Places, travel routing, ETA, and contracted service guarantees remain separate external dependencies.

Do not describe straight-line distance as travel time and do not invent coordinates for unmapped supply.

## Production database/security infrastructure note

The production Prisma migration failure from 2026-08-12 was recovered and no unresolved failed migration remained when the production database was last inspected. The latest repository candidate contains 53 additive migrations; exact-head CI must apply all 53 to fresh PostgreSQL before merge, and the Stripe journey probes migration 53 against populated legacy payment evidence.

The last inspected Neon project setting reported HIPAA mode as disabled. This is an infrastructure configuration fact, not a legal conclusion. Real-PHI production approval remains a separate security/compliance decision and must not be inferred from application code.

## Operating rules

1. Replace unnecessary software; connect unavoidable external relationships.
2. Secrets never belong in the repository.
3. No PHI leaves Klinikos for a connector until that exact connector/workload is approved for PHI.
4. Sandbox and production are distinct states.
5. Reuse customer-owned accounts when safe and cost-effective; hide unnecessary API vocabulary from customers.
6. Use platform-owned shared services when operationally safer or materially better; treat their cost as Klinikos COGS.
7. Meter variable-cost usage by tenant/feature/provider/unit/cost bucket.
8. BAA, contract, license, OAuth scope, API credential, enrollment, and security approval are independent gates.
9. Manual-but-truthful is acceptable. Fake automation is not.
10. External connection state never overrides authorization, tenant isolation, consent, credentialing, safety, clinical, financial, or record-release rules.

## Immediate dependency order

Prioritize external work by revenue and operational leverage:

1. independently verify the newest production deployment/domain/login journey;
2. deploy the Stripe candidate, register the live webhook endpoint, configure the signing secret, and deliberately exercise one real payment while preserving the GoDaddy/manual fallback;
3. connect a production Klinikos Intelligence provider only under the correct data/contract posture;
4. add production geocoding/routing only as real Grid supply makes it valuable;
5. connect processor/payout rails when recurring subscriptions and Grid settlement justify them;
6. connect communications with an approved PHI posture;
7. advance eligibility/claims rails for clinics that need them;
8. connect lab/imaging/eRx and other regulated clinical networks only with real clinic/vendor agreements;
9. add customer connection onboarding and per-tenant usage/cost metering around every variable-cost rail.
