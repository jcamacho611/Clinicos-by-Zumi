# ClinicOS by Zumi: Founding Clinic Build Status

Status date: 2026-08-09

## Product truth

ClinicOS by Zumi is an engineering foundation and synthetic demonstration environment for a multi-tenant clinic operating system and connected-care network. It is not a certified EHR, production HIPAA deployment, clearinghouse, live laboratory interface, live payer connection, live e-prescribing service, autonomous clinical system, or approved environment for real patient information.

Demo uses synthetic data only. Do not enter real patient information.

## Baseline inspected before this slice

The founding-clinic work began from the existing repository rather than a rebuild. The following sources were inspected:

- `README.md`
- `docs/CLINICOS_MASTER_CANON.md`
- `src/lib/feature-registry-canon.ts`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- all routes under `src/app`
- all APIs under `src/app/api`
- all owned components under `src/components`
- authentication, authorization, lifecycle rules, repositories, and product data under `src/lib`

The pre-change foundation compiled as 113 App Router pages and API routes. Prisma validated, TypeScript passed after the generated Next route types settled, the production build completed, and all 137 existing tests passed across 33 test files.

The Priority Zero canon remains the permanent scope registry: 62 domains and 2,157 capabilities. Priority Zero is a scope promise, not a claim that every capability or vendor connection is live.

## What existed before this slice

### Live in the engineering foundation

- PostgreSQL-backed multi-tenant organizations, locations, users, roles, permissions, sessions, and tenant-scoped repositories
- offer-first organization onboarding and authenticated clinic workspaces
- patient index, chart, scheduling, encounter authoring, SOAP workflow, addenda, and audit records
- patient portal authentication with patient- and organization-scoped released-record reads
- tenant-aware document, form, laboratory, imaging, medication, referral, case, CRM, payment, quality, network, and operational workflow foundations
- explicit manual-fallback and external-connection lifecycle states
- immutable Priority Zero registry architecture

### Demo

- owner, front-desk, and provider workspace presentation
- connected-clinic and referral scenarios using synthetic records
- patient portal experience using a synthetic patient account
- clinic operating dashboards and some operational analytics
- voice-first browser demonstration with typing fallback

### Manual fallback

- external record delivery
- laboratory and imaging order/result exchange
- medication transmission
- payment recording and payment-link handoff
- claim packet preparation and external submission
- patient and partner communications where no reviewed adapter is active

### Pending connection

- Stripe or Square settlement
- Twilio voice and SMS
- Resend email
- Quest, Labcorp, BioReference, radiology, hospital, FHIR, HL7, Direct, HIE, and QHIN connections
- clearinghouse, eligibility, payer, remittance, prior-authorization, eRx, EPCS, PDMP, and telemedicine vendors

### Roadmap

- production passkey and MFA enrollment
- distributed rate limiting
- database row-level security or equivalent defense in depth
- BAA-reviewed object storage and managed key rotation
- external immutable audit storage
- formal backup, disaster recovery, retention, deletion, incident response, and security review
- production patient-data activation

## What this slice adds

### Private Workflow Demo & Cost Review

Status: Live workflow with Demo content and Manual fallback payment handling.

- public `/private-demo` offer page for the $500 Private Workflow Demo & Cost Review
- public `/demo` product demonstration overview
- public `/founding-clinic` evaluation and founding-program disclosure
- public `/sales` clinic qualification and demo intake
- exact $500, $1,500, and $8,000 offer definitions with server-controlled pricing
- credit-forward language for eligible next steps
- explicit synthetic-data acknowledgment and no-PHI guidance
- clinic, contact, systems, estimated software spend, provider/location count, and pain-point intake
- deterministic same-page synthetic scenario preview
- cost-transparency explanation for workflow preparation, controlled environment maintenance, synthetic examples, AI/API usage, and written recommendation
- payment truth: no processor settlement, automatic payout, or confirmed booking is claimed

### Persisted sales operations

Status: Live inside the synthetic engineering environment.

- tenant-owned demo reservation records
- separate ClinicOS sales-owner organization boundary
- synthetic demo scenario records
- draft recap records with mandatory human review
- append-only reservation event timeline
- organization audit logs
- strict reservation and payment lifecycle validation
- public intake rate limiting and server-controlled organization assignment
- owner/administrator-only sales permissions
- authenticated `/admin/sales` command center
- authenticated `/owner/founding-program` clinic pathway view
- non-destructive synthetic sales demo seeder for an already-populated demonstration database

### Safety and truth controls

Status: Live.

- client input cannot supply an organization identifier
- public intake cannot silently create a production clinic workspace
- all scenario patient, appointment, document, referral, result, and revenue examples identify themselves as synthetic
- billing and clinical actions remain blocked from autonomous execution
- demo recap generation creates a draft, not an approved external communication
- recap approval and reservation transitions require authenticated human action and write audit records
- cross-tenant reservation identifiers return not found from the managing sales organization

## What remains Demo, Manual fallback, or Pending connection

The paid-demo workflow does not charge a card. A human qualifies the clinic, records a reviewed manual payment or waiver, and sends any external payment link outside ClinicOS until a reviewed payment adapter is active.

The synthetic scenario builder does not inspect clinic patient records, diagnose problems, estimate guaranteed revenue, or make implementation commitments. It produces a demonstration starting point from business-system inputs.

The recap generator currently uses a deterministic fallback. A future Zumi provider adapter may improve the draft when `AI_KEY` is configured, but the output must remain labeled `AI draft. Review before use.`

## Grid provider-network slice

Status: Live persistence and workflow rules with Demo content. Requires production review for real provider participation, patient use, payments, and care delivery.

This slice adds:

- authenticated `/grid`, `/grid/providers`, `/grid/locations`, `/grid/services`, `/grid/availability`, `/grid/requests`, `/grid/handoffs`, `/grid/founding-network`, and `/admin/grid` routes
- a premium dark Grid command center connected to the existing ClinicOS application shell
- public-safe cross-organization provider directory records with legal names, license numbers, NPI, malpractice carrier, and policy number restricted to authorized users in the owning tenant
- all required provider categories and the `Entry`, `Intermediate`, `Experienced`, and `OG / Master Provider` display tiers
- explicit provider lifecycle states: `draft`, `submitted`, `needs_review`, `verified`, `rejected`, `expired`, and `suspended`
- human-controlled verification transitions backed by credential evidence, current malpractice coverage, tasks, and audit logs
- service listings with transparent price ranges and medical-review, consent, deposit, mobile, clinic, and chair controls
- provider availability with location mode, mobile radius, on-call state, and credential-gated activation
- clinic, room, chair, mobile, and service-location records with credential and insurance requirements
- cross-organization Grid requests with provider, location, credential, consent, deposit, confirmation, completion, cancellation, decline, and escalation states
- append-only request events and audit receipts visible to both the requesting and receiving organization
- synthetic seed providers, credentials, services, locations, availability, requests, human-review tasks, and dual-organization audit events
- a direct connection from the existing `/provider-network` consultation and credentialing workspace into the Grid provider directory

The Grid deliberately does not expose a full chart across organizations. The current request flow is blocked outside demo organizations and shares only synthetic request labels, service intent, safety gates, status, and audit context. It does not automatically approve provider credentials, determine scope, confirm clinical eligibility, settle a deposit, schedule real care, or release records.

The experience tier is pricing-display context only and is not a clinical quality, superiority, or credential claim.

## Claims that must not be made

Do not describe ClinicOS as:

- fully HIPAA compliant
- a certified EHR
- a replacement for every clinic system today
- a live clearinghouse, laboratory, payer, eRx, telemedicine, or payment processor connection
- an autonomous claim-submission system
- an AI diagnostic, prescribing, treatment, eligibility, record-release, or credential-approval system
- a source of guaranteed insurance approval, revenue, return on investment, or patient outcomes

Use the exact labels `Live`, `Demo`, `Manual fallback`, `Pending connection`, `Roadmap`, `Requires production review`, and `Human review required` wherever status could be misunderstood.

## Verification record for the paid-demo slice

- migration `20260809131500_private_demo_sales_engine` is applied to the configured PostgreSQL demonstration database
- all paid-demo seed data, tests, type checks, lint checks, Prisma validation, production build checks, runtime workflows, responsive browser checks, Render logs, and live endpoint checks passed
- Render deployed commit `d325829716a3adc2081b4c03af2f6c93fa2df84f` at `https://zumi.onrender.com`

## Verification record for the Grid slice

- migration `20260809210000_grid_provider_marketplace` is applied to the configured Neon PostgreSQL demonstration database and Prisma reports the database schema as current
- the destructive synthetic demo seed completed and restored the canonical four providers, three services, four availability windows, three marketplace locations, two requests, and four request events
- all 147 tests across 35 files passed, including Grid lifecycle, authorization-declaration, and safety-boundary coverage
- lint, strict TypeScript validation, Prisma validation, production build, and whitespace checks passed; the production build registered every required Grid page and API route
- authenticated runtime checks covered all nine Grid workspaces, own-tenant sensitive-field visibility, cross-tenant sensitive-field redaction, provider submission, controlled request creation, consent/deposit-gated confirmation, append-only events, and audit receipts
- unauthenticated Grid API access returned `401`; unauthenticated Grid workspace access redirected to `/login`
- responsive browser verification confirmed the Grid at a 390 by 844 viewport with full-width layout and no horizontal overflow

## Clinic Network Directory and Partner Handoff slice

Status: Live persistence and governed workflow rules with Demo content. External delivery remains Manual fallback or Pending connection. Real patient use Requires production review.

This slice adds:

- a premium authenticated Network Command at `/network`, `/network/map`, `/network/handoffs`, `/network/directory`, and `/admin/network`
- relationship-aware partner profiles with organization type, locations, departments, facilities, services, accepted referral types, capacity, contact method, integration status, manual fallback, sharing agreement, consent-category requirements, and audit history
- a clinic-centered constellation view with referral and handoff volume, work awaiting action, failed-delivery state, and available capacity
- a controlled composer for referral, capacity, document packet, patient navigation, provider consultation, no-fault packet, imaging, physical-therapy, and med-spa provider handoffs
- relationship, agreement, purpose-of-use, minimum-necessary category, patient-consent, tenant, and human-confirmation validation before a handoff can be prepared
- exact delivery states from `draft` and `ready_to_send` through connected, manual, fax, or Direct queues, receipt, acknowledgment, clarification, scheduling, completion, failure, retry, and cancellation
- source-versus-recipient action enforcement, append-only events visible only to the represented organization, dual-organization audit receipts, and staff tasks for manual delivery fallbacks
- a Grid handoff view that now shows partner organization names, delivery paths, review requirements, and a direct route into the governed Network Command instead of raw user identifiers
- synthetic Metro Diagnostic Collaborative seed data, connected med-spa and diagnostic relationships, agreements, consent, capacity, connected delivery, fax fallback, tasks, and audit receipts

The Network Command does not silently share a chart. Inbound visibility is recalculated from the active relationship, sharing agreement, consent recipient, purpose, categories, and current user at read time. Prepared handoffs contain a minimum-necessary administrative summary and explicitly record that no chart payload was shared.

Connected delivery means a handoff record became visible inside the authorized ClinicOS recipient workspace. Manual, fax, and Direct states do not claim that an external vendor delivered or acknowledged anything. They create recoverable staff work until a human records evidence.

## Verification record for the Network Directory slice

- migration `20260809231500_network_partner_handoffs` is applied to the configured Neon PostgreSQL demonstration database and Prisma reports the schema as current
- the destructive synthetic seed completed and restored canonical partner relationships, agreements, consent, handoffs, events, fallback tasks, and audit receipts
- all 151 tests across 36 files passed, including exact handoff lifecycle and action-boundary coverage
- authenticated runtime checks covered all five network workspaces, source and recipient visibility, connected send, recipient receipt, append-only events, unrelated-tenant denial, and canonical seed restoration
- unauthenticated Network Command API access returned `401`
- lint, strict TypeScript validation, Prisma validation, migration status, whitespace checks, and a clean optimized production build passed
- responsive browser verification at 390 by 844 confirmed full-width layout, no horizontal overflow, labeled form controls, human-review gating, and no browser warnings or errors
- the clean local production server returned `200` from `/api/health`, rendered the partner names and governed Grid link without raw user IDs, returned `401` from the unauthenticated Network Command API, and redirected protected pages to `/login`
- Render deployment verification follows the focused commit and push; this document does not claim that deployment completed before the release exists

## Next build slice

After the Network Directory slice is committed, pushed, and confirmed on Render, the next ordered slice is the Zumi AI Workflow Copilot:

1. same-page typed and browser-voice input with visible processing steps and immediate results
2. bounded administrative intents for task creation, referral preparation, follow-up drafting, missing-information detection, workflow summary, and owner briefing
3. deterministic local fallback when no reviewed AI provider is configured
4. explicit draft, citation/provenance, confidence/limits, and human-review state for every output
5. tool permissions that re-use the current organization, role, patient relationship, consent, and audit boundaries
6. no autonomous diagnosis, prescribing, record release, claim submission, credential approval, patient messaging, or emergency continuation
