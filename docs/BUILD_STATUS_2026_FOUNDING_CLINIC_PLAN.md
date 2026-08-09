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

## Verification required before this slice is complete

- apply the reviewed migration to the configured PostgreSQL demonstration database
- run the non-destructive sales demo seed
- run Prisma validation and generation
- run strict TypeScript validation
- run all Vitest suites, including sales safety and authorization coverage
- run the Next.js production build
- verify public intake, scenario persistence, admin pipeline, recap review, owner visibility, and cross-tenant denial at runtime
- inspect the public pages on desktop and mobile
- deploy to Render and verify `https://zumi.onrender.com`

## Next build slice

The next ordered slice is the Grid MVP:

1. credential-aware provider profiles with hidden legal identity fields
2. provider verification lifecycle and renewal tracking
3. service listings with medical-review, consent, deposit, and location controls
4. provider availability and on-call records
5. clinic space, room, and chair listings
6. controlled service-request lifecycle with safety flags, required documents, consent, payment status, and audit events
7. premium `/grid`, provider, location, service, availability, request, and administration surfaces
8. synthetic provider, clinic, location, credential, and request data

Experience tiers will support pricing display only. They will not imply clinical superiority without verified credentials and lawful scope. The Grid will not claim live medical booking until production review, credential verification, consent, payment, and legal gates are complete.
