# Klinikos External Dependency Matrix

Status: `AUTHORITATIVE EXTERNAL-TRUTH INDEX`
Updated: 2026-08-17 America/New_York
Repository baseline at update: `main@cc6162c9349e2ade8ec8a27cdd08a05296fb70a2`

This is the operating inventory for services, APIs, healthcare networks, credentials, contracts, BAAs, cost ownership, and production-connection truth.

The purpose is to replace unnecessary clinic software with native Klinikos capability where practical while connecting external relationships that application code cannot truthfully replace.

## Status vocabulary

- **Built** — Klinikos-side workflow/interface is implemented.
- **Credential created / runtime unverified** — an external credential exists but complete deployment/runtime evidence is still missing.
- **Manual fallback** — the Klinikos workflow is real, but an authorized human performs the external step.
- **Adapter ready / Configurable** — an internal adapter/configuration boundary exists; production connection is not verified.
- **Sandbox-ready** — usable in a non-production environment once sandbox credentials/configuration are supplied.
- **Pending connection** — credentials, enrollment, provider setup, contract, BAA, or production approval remains.
- **Blocked** — code cannot truthfully finish the production capability until an external gate is resolved.
- **Verified live** — use only after the exact production environment has been independently checked; never infer this from code presence or repository CI.

## Current dependency matrix

| Klinikos capability | Current/preferred rail | PHI posture | External gates | Variable-cost owner | Current truth |
| --- | --- | --- | --- | --- | --- |
| Public application hosting | Render | PHI depends on production approval/configuration | Hosting account, environment secrets, production security/BAA posture where required | Klinikos infrastructure | **Verified service health in demo mode on 2026-08-16; newest deployed SHA and PHI posture remain unverified** |
| Public domain / DNS | GoDaddy + `klinikos.io` | No PHI by DNS itself | DNS/TLS/domain account | Klinikos | **`www.klinikos.io/api/health` returned HTTP 200 through Cloudflare/Render on 2026-08-16; newest deployed SHA remains unverified** |
| GitHub Actions quality/deploy gates | GitHub Actions | Repository/code metadata only | GitHub billing/account spending allowance | Klinikos infrastructure | **Blocked before job startup on 2026-08-17 by GitHub account billing/spending-limit state; this is not a code-test failure** |
| Clinic Operating Analysis checkout | Live Stripe-hosted Checkout when fully configured; GoDaddy exact-value fallback remains | Keep PHI out of Stripe/checkout metadata | Stripe live webhook endpoint registration/secret and controlled live exercise | Buyer/clinic | **Stripe hosted Checkout code merged in PR #117; GoDaddy/manual fallback preserved; external live verification pending** |
| Commercial payment verification | Signed Stripe webhook evidence or authorized manual reconciliation | Keep PHI out of processor metadata and persisted webhook payloads | Deployed endpoint, signing secret, runtime evidence, account/security review | Buyer/clinic transaction | **Shared evidence/activation model + signed Stripe webhook implementation merged; external live verification pending** |
| Direct card/payment processor | Stripe | Keep PHI out of metadata | Live API secret operator-reported configured; webhook registration/signing secret, deploy/runtime proof, and real payment exercise remain | Clinic/transaction economics | **BUILT / OPERATOR-REPORTED LIVE KEY / PENDING EXTERNAL CONNECTION — not verified live** |
| Stripe live webhook | `POST /api/webhooks/stripe` | Raw body verified; persisted evidence is bounded identifier/status truth | Register only the five supported events and store the live endpoint secret in Render | Klinikos infrastructure | **Merged in PR #117; live signing secret/runtime event proof still pending** |
| Stripe explicit test rail | Separate test API + webhook secrets | No production settlement truth | Deliberate test-mode selection and separate endpoint secret | Klinikos infrastructure | **Built contract; runtime configuration optional/pending; cannot silently satisfy live flow** |
| Grid marketplace payouts | Stripe Connect or equivalent platform rail | Keep PHI out of payout metadata | Platform terms, connected-account onboarding, credentials, legal/commercial review, fulfillment/dispute policy | Transaction economics/platform fee | **Pending connection** |
| AI Gateway / Klinikos Intelligence | Provider-neutral; Cloudflare Workers AI, approved OpenAI configuration, or self-hosted provider as configured | PHI prohibited unless exact provider/workload is approved | Provider account, approved model/config, contract/BAA where needed, PHI egress approval | Prefer plan allowance/customer-funded measured usage | **Gateway and Cloudflare adapter built; operator-reported configured; deliberate non-PHI production inference proof still required** |
| Public web research/tooling | Approved research-capable provider/tool | Public data only by default | Tool/provider configuration and policy | Klinikos or customer-funded intelligence usage | **Architecture built; external availability environment-specific** |
| Grid browser geolocation | Browser Geolocation API | Raw visitor location should not become public inventory/analytics by default | User permission + secure HTTPS context | No direct API COGS | **Built: explicit opt-in only** |
| Grid primary interactive map | MapLibre GL JS + OpenFreeMap | Public-display-safe coordinates only; public resource coords privacy-reduced | Public CDN/tile availability; no Klinikos API credential required | Minimal/shared infrastructure | **Built and merged in PR #114; Google billing is not required for core Grid** |
| Grid emergency map fallback | OpenStreetMap embed | Avoid PHI; public resource coords privacy-reduced | Public OSM availability/terms | Minimal/shared infrastructure | **Built fallback** |
| Optional geocoding / reverse geocoding / routing | Geoapify or another reviewed provider | Avoid PHI unless separately approved | API credential, provider/security review, usage/economics controls | Customer-funded allowance or Klinikos COGS when justified | **Optional / Pending connection; absence does not break Grid map/geolocation/Haversine matching** |
| Optional Google Maps path | Google Maps Platform | Avoid PHI | Google billing/project/keys only if a future Google-specific capability is justified | Customer-funded allowance or Klinikos COGS | **Optional adapter only; NOT a launch dependency** |
| SMS delivery | Twilio Messaging Service via restricted API-key auth | PHI blocked unless exact HIPAA/BAA posture is approved | `AC` account + restricted `SK` credential + `MG` Messaging Service/sender + applicable US messaging/A2P requirements | Prefer clinic-owned or priced allowance | **Server-side sender code merged in PR #119; restricted API key created/operator-reported; Messaging Service/runtime delivery proof pending** |
| Phone verification | Twilio Verify via restricted API-key auth | Identity/contact data; no clinical content by design | Restricted API key + `VA` Verify Service + controlled verification proof | Klinikos or plan allowance | **Start/check adapter merged in PR #119; Verify Service/runtime proof pending** |
| Twilio inbound webhook signatures | Twilio master Auth Token when an inbound webhook is implemented | Depends on webhook purpose | Build inbound webhook + retain master token only where signature validation requires it | Klinikos/clinic | **Not required by current outbound API-key rail** |
| Twilio PHI messaging / voice | Approved HIPAA-capable Twilio relationship or other reviewed rail | Potential PHI | BAA/security/product eligibility, consent, minimum-necessary policy | Prefer clinic-owned or priced allowance | **Blocked / fail-closed until approved** |
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

Current merged paid-entry truth is:

`server-owned intent/amount → Stripe-hosted Checkout when live API + live webhook verification are configured OR GoDaddy fallback → signed Stripe evidence OR authorized manual evidence → product policy / reconciliation`

A redirect back to Klinikos is never payment evidence. The production Stripe route is live-only and rejects signed test-mode events. The merged rail handles the supported Checkout success/pending/failure/refund evidence through the shared Financial OS. Grid payouts are separately gated: financial obligation, fee calculation, reservation, fulfillment, or customer payment do not prove external payout settlement.

Supported production Stripe events for the current rail are:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.refunded`

## Maps and location rule

The current Grid core works without Google credentials:

- MapLibre + OpenFreeMap is the primary interactive map path;
- explicit browser geolocation is built;
- OpenStreetMap embed is the emergency fallback;
- only real reviewed/published supply creates inventory markers;
- Haversine radius matching uses stored coordinate truth where available;
- public coordinates remain privacy-reduced;
- Geoapify or another reviewed provider may later enrich geocoding/routing without becoming eligibility authority;
- Google is optional and must not block launch.

Do not describe straight-line distance as travel time and do not invent coordinates, routes, ETAs, or supply.

## Communications rule

The merged Twilio outbound REST contract is:

`TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET`

SMS additionally requires `TWILIO_MESSAGING_SERVICE_SID`. Verify additionally requires `TWILIO_VERIFY_SERVICE_SID`. The master Auth Token is not ordinary outbound authentication.

A configured sender does not authorize PHI. PHI-bearing SMS/voice remains fail-closed until the exact account/product is eligible, the required BAA/security posture is approved, consent/policy is defined, and message content is minimum necessary.

## Production database/security infrastructure note

The production Prisma migration failure from 2026-08-12 was recovered and no unresolved failed migration remained when the production database was last inspected. Migration 53 for Stripe payment truth is merged. The Stripe candidate recorded successful local populated-legacy migration/journey evidence before merge.

GitHub Actions could not independently rerun the post-convergence exact-head gates on 2026-08-17 because GitHub refused jobs before startup due the account billing/spending-limit state. Restore Actions billing/allowance and rerun current-main schema, migration, type, lint, test, MVP, production build/start and deploy-contract gates. Do not describe the infrastructure refusal as a code test failure.

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

1. restore GitHub Actions billing/allowance and rerun exact-head quality/deploy gates on current main;
2. independently verify the newest Render deployment SHA, domain, login and primary user journeys;
3. register the live Stripe webhook endpoint, configure the signing secret, and exercise one controlled real payment plus refund while preserving the GoDaddy/manual fallback;
4. finish Twilio Messaging Service/Verify service setup and run controlled non-PHI SMS/verification tests;
5. run a deliberate non-PHI production Zumi/Cloudflare inference proof;
6. connect Stripe Connect only when Grid payout onboarding/legal/policy is ready;
7. add geocoding/routing only when real Grid supply makes it valuable;
8. connect communications for PHI only after the exact approved contractual/security posture exists;
9. advance eligibility/claims rails for clinics that need them;
10. connect lab/imaging/eRx and other regulated clinical networks only with real clinic/vendor agreements;
11. add customer connection onboarding and per-tenant usage/cost metering around variable-cost rails.
