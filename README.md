# ClinicOS by Zumi

ClinicOS is a premium, multi-tenant EMR and clinic-operating-system foundation for community practices. This repository contains a connected sales demo and a PostgreSQL-ready data model for Brooklyn Family Medicine and Luxe Medi.

## Important safety status

This is an engineering foundation and demonstration environment. It is **not** a certified EHR, production clinical system, HIPAA-compliant deployment, clearinghouse, lab interface, diagnostic tool, or substitute for professional clinical judgment.

- Use fake data only.
- AI may summarize, classify, draft, route, and detect missing information.
- AI may not diagnose, prescribe, interpret results as a final answer, decide treatment, guarantee coverage, or release protected records.
- Emergency, lab, medication, clinical, and coverage-guarantee messages are routed to human review.
- Quest, Labcorp, BioReference, radiology, FHIR/SMART, HL7, X12, telemedicine, payments, voice/SMS, and email appear only as explicit roadmap integrations.

## Product surfaces

- Owner command center
- Front desk and provider workspaces
- Patient index and longitudinal chart with 16 chart tabs
- Structured encounter and SOAP note editor
- Scheduling and telemedicine readiness
- Forms, signatures, documents, and release controls
- Laboratory order-to-result command center with chart-bound diagnoses and tests, truthful manual delivery, structured result entry, document-bound upload fallback, source abnormal/critical flags, urgent human escalation, provider review, explicit portal release, patient-notification confirmation, follow-up, repeat orders, versioned corrections, provenance, and longitudinal numeric trends
- Imaging review queue
- Billing, claims, denials, balances, and insurance verification
- No-fault and workers' compensation case operations
- Quality measures, care gaps, and outreach
- Secure-message, task, and escalation workspaces
- Same-page AI safety-routing simulator
- Patient portal preview
- Integration roadmap and organization audit settings
- Network Command, Care Constellation, and purpose-bound clinic connections
- Human-reviewed master patient identity, source-chart locator, consent ledger, and immediate consent revocation
- Closed-loop Referral Relay with clinical orders, consent-bound connected delivery, truthful fax/Direct/manual fallbacks, receiving-clinic actions, consultation return, delivery recovery, tasks, escalations, and dual-clinic audit receipts
- Diagnostic Capacity Exchange and Injury Episode Room
- Health Passport and Consent Wallet preview
- Voice-first ClinicOS Copilot with same-screen transcript review and typing fallback
- Searchable, PostgreSQL-backed Priority Zero registry covering 62 domains and 2,143 capabilities

The full non-removable product constitution is documented in [`docs/CLINICOS_MASTER_CANON.md`](./docs/CLINICOS_MASTER_CANON.md) and encoded in [`src/lib/feature-registry-canon.ts`](./src/lib/feature-registry-canon.ts). Priority Zero means permanent scope, not a claim that every integration is live.

## Stack

- Next.js 15 App Router
- React 19 and TypeScript
- Tailwind CSS 4
- shadcn-style owned UI primitives and Radix Tabs
- Framer Motion and Recharts
- Prisma 6 with PostgreSQL
- Zod request validation
- Vitest safety-rule tests

## Local setup

Requirements: Node.js 20+, npm 10+, and PostgreSQL 15+.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate:deploy
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. Authentication, patient charts, scheduling, encounters, connected-care access, identity, consent, referrals, and laboratory workflows require the PostgreSQL database configured by `DATABASE_URL`; workspaces not yet migrated to repositories continue to use explicit fake demonstration fixtures.

The seed creates the authenticated owner `nadja@example.test`. Set `CLINICOS_SEED_ADMIN_PASSWORD` to a strong value before running it. The demo seed is destructive and must never be run against a database containing real records. Development-only fallback authentication is forcibly disabled when `NODE_ENV=production` and can also be disabled locally with `DEMO_AUTH=false`.

## Environment variables

| Variable | Required now | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | For Prisma | PostgreSQL connection string |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical application URL |
| `AUTH_SECRET` | Production | At least 32 random characters used to sign HTTP-only sessions |
| `CLINICOS_SEED_ADMIN_PASSWORD` | Seed only | Initial fake clinic-owner password; must be 12+ characters and not the placeholder |
| `DEMO_AUTH` | Local only | Set `false` to disable the development demo account; ignored in production |
| `AI_KEY` | No | Reserved for a reviewed AI provider integration |
| `TWILIO_ACCOUNT_SID` | No | Future voice/SMS integration |
| `TWILIO_AUTH_TOKEN` | No | Future voice/SMS integration |
| `STRIPE_SECRET_KEY` | No | Future payment integration |
| `STRIPE_WEBHOOK_SECRET` | No | Future payment webhook verification |
| `RESEND_API_KEY` | No | Future transactional email integration |

Do not place secrets in client-side variables or commit `.env` files.

## Commands

```bash
npm run dev          # local development
npm run type-check   # strict TypeScript validation
npm run test         # safety workflow tests
npm run db:validate  # Prisma schema validation
npm run db:generate  # generate Prisma client
npm run db:migrate:deploy # apply reviewed migrations to a configured database
npm run build        # production build
npm start            # production server
```

## API foundation

- `GET /api/health` returns service and demo-mode health.
- `POST /api/auth/login` verifies credentials, rate-limits failures, and issues a signed HTTP-only session.
- `POST /api/auth/logout` revokes database sessions and clears the browser cookie.
- `GET /api/patients` requires authentication and queries PostgreSQL with the session organization ID in every patient and related-record filter.
- `GET /api/appointments` returns only the signed-in organization's schedule.
- `PATCH /api/appointments/:appointmentId/status` enforces forward-only scheduling lifecycle transitions and writes an audit event.
- `GET /api/encounters` returns tenant-scoped encounter, SOAP, coding, and audit data.
- `PATCH /api/encounters/:encounterId` autosaves draft-only structured documentation.
- `POST /api/encounters/:encounterId/transition` submits a complete draft for review or signs and permanently locks a reviewed note.
- `POST /api/workflows/classify` requires authentication and applies deterministic safety-routing rules.
- `GET /api/feature-registry` requires authentication and registry-read permission, then returns the PostgreSQL-backed P0 canon and delivery summary with private/no-store caching.
- `GET|POST /api/identity/matches` lists organization-owned match candidates or runs a deterministic, minimum-necessary scan across connected clinics covered by an active demographic-sharing agreement.
- `POST /api/identity/matches/:matchId/review` requires identity-update permission, an explicit human decision, a reason, and optional field-level reconciliation before linking or separating source charts.
- `GET /api/identity/record-locator?masterPatientId=...` returns only source clinic, MRN, identity status, and verified identifiers for a locally linked master identity; it does not return clinical content.
- `GET|POST /api/consents` lists the tenant consent ledger or captures a signed, recipient-, purpose-, category-, and time-scoped authorization receipt.
- `POST /api/consents/:consentId/withdraw` withdraws authorization and revokes every linked ordinary access grant in the same transaction.
- `GET|POST /api/network/record-requests` and the connected-care decision/read/revoke routes require role permission, an active relationship, sharing agreement, active consent, purpose/category coverage, and an auditable access grant. Break-glass remains a narrow, time-limited, separately audited exception.
- `GET|POST /api/referrals` lists the signed-in clinic's outbound referrals and only transmitted inbound referrals whose relationship, agreement, and patient consent still validate at read time, or creates a tenant-owned clinical order and referral draft after destination, document, relationship, agreement, and consent validation.
- `POST /api/referrals/:referralId/transition` enforces source-versus-receiver lifecycle actions, revalidates connected authority at send/retry, records truthful manual-delivery confirmation, creates failed-delivery escalations and retry tasks, and writes referral events plus audit receipts for each represented clinic.
- `GET /api/labs` returns the signed-in organization only: orders, results, structured items, source documents, providers, adapter readiness, lifecycle events, integration events, and numeric trend series.
- `POST /api/labs/orders` creates a tenant-owned clinical order and laboratory order after validating the patient, provider, encounter, chart diagnoses, tests, and any requested active electronic adapter.
- `POST /api/labs/orders/:labOrderId/transition` enforces draft, readiness, truthful manual/adapter queue, delivery confirmation, collection, failure, retry, and cancellation states while creating delivery tasks, integration events, escalations, and audit receipts.
- `POST /api/labs/results` receives structured manual, patient-document-bound upload, or active-adapter results; holds every result for human review; creates urgent escalations and provider notifications for critical source flags; and never produces clinical interpretation.
- `POST /api/labs/results/:labResultId/transition` requires both provider-signing permission and an active same-organization provider identity for review, portal release, and repeat orders; it keeps review and release separate and supports staff-recorded patient notification and follow-up tasks.
- `POST /api/labs/results/:labResultId/correct` requires the same provider identity gate, preserves the original result, removes obsolete portal visibility, creates a versioned replacement, and routes the correction through mandatory review again.

Authenticated example:

```bash
curl -c /tmp/clinicos.cookies -X POST http://localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"nadja@example.test","password":"YOUR_SEEDED_PASSWORD"}'

curl -X POST http://localhost:3000/api/workflows/classify \
  -b /tmp/clinicos.cookies \
  -H 'content-type: application/json' \
  -d '{"message":"Can someone explain my lab result?"}'
```

## Database architecture

[`prisma/schema.prisma`](./prisma/schema.prisma) defines multi-tenant organization, identity, patient, scheduling, clinical, document, lab, imaging, revenue-cycle, insurance, case, quality, communication, AI-governance, audit, settings, integration, and API-key records. It also includes connected-care network relationships, sharing agreements, master-patient identifiers and matches, access grants, record requests, Care Team Rooms, Injury Episode Rooms, Health Passports, Consent Wallets, Intake Passports, care handoffs, capacity listings, provider consultations, governed knowledge, remote observations, inventory, voice sessions, subscriptions, and immutable feature-registry records.

Migration `20260714225102_priority_zero_connected_care` adds database checks and triggers that reject deletion, downgrade, or mutability changes for Priority Zero registry rows. Delivery status can still advance as implementation evidence is completed.

Migration `20260715000354_master_patient_identity_and_consent` adds source-preserving master identity fields, match snapshots and reconciliation evidence, and enforceable consent recipient, purpose, category, effective-date, expiration, and withdrawal fields.

Migration `20260715033143_closed_loop_referrals` adds order linkage, source and destination identity, authorization, delivery state, attempts, failure recovery, outreach and follow-up fields, the full referral lifecycle, consultation return, provenance, and an append-only referral event ledger.

Migration `20260715034000_closed_loop_referral_integrity` adds cascade-safe referral-event ownership and PostgreSQL constraints for valid referral states, delivery methods and outcomes, priority, authorization, and connected versus external destination requirements.

Migration `20260715035500_referral_outreach_integrity` constrains patient-outreach states and prevents negative referral-delivery attempt counts.

Migration `20260715040657_laboratory_lifecycle` adds complete laboratory order delivery state, structured result provenance, source flags, provider review, release, notification, correction versioning, append-only lab events, general integration events, indexes, foreign keys, and PostgreSQL lifecycle checks.

Migration `20260715041013_laboratory_source_binding` binds laboratory results to their exact source document and integration adapter for organization-scoped provenance validation.

Patient, appointment, encounter, connected-care access, master identity, consent, referral, and laboratory reads are implemented through server-only Prisma repositories. Every local base and related query requires `organizationId`; cross-organization identity scans require an active demographic-sharing agreement, cross-organization clinical reads revalidate the relationship, agreement, consent, grant, purpose, categories, role, and time at read time, and connected referral sends revalidate the relationship, agreement, and patient consent at transmission. API responses are marked private/no-store where appropriate. Appointment transitions, encounter draft/review/sign-lock mutations, identity decisions, consent changes, network reads, referral handoffs, and laboratory order/result transitions use guarded filters, lifecycle checks, and audit records. The chart, dashboard, front desk, provider panel, schedule, encounter worklist, access controls, identity resolution, Referral Relay, and Laboratory Relay consume those repositories. Remaining modules still need the same repository boundary. Before production use, add database-level row security or equivalent defense in depth, immutable external audit storage, encrypted object storage, key management, backups, disaster recovery, retention policies, and formal migration review.

The current identity foundation includes bcrypt password credentials, signed eight-hour HTTP-only cookies, database-backed revocable session records, role permission definitions, login lockout fields, and a WebAuthn/passkey credential model. Passkey challenge endpoints, MFA enrollment, recovery, and a production distributed rate limiter remain future security work.

## Render deployment

The included `render.yaml` describes the web service. Before creating a production deployment:

1. Create a managed PostgreSQL database.
2. Set `DATABASE_URL` as a secret environment variable.
3. Run the committed initial migration with `npm run db:migrate:deploy`; never use `db push` in production.
4. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL.
5. Generate a unique `AUTH_SECRET` with at least 32 random characters and keep `DEMO_AUTH=false`.
6. Seed the first database user using a temporary `CLINICOS_SEED_ADMIN_PASSWORD`, then rotate/remove the seed value from the service environment.
7. Confirm `/api/health` responds successfully and `/dashboard` redirects unauthenticated requests to `/login`.
8. Keep all optional vendor credentials unset until contracts, BAAs, consent, security review, and real integrations are complete.

Render build command:

```bash
npm ci && npm run db:generate && npm run build
```

Render start command:

```bash
npm start
```

For a custom domain, add the domain in the Render service, copy the supplied DNS record into the DNS provider, wait for verification, and set `NEXT_PUBLIC_APP_URL=https://your-domain.example`.

## Production gates that are not complete

- Passkey challenge endpoints, MFA, recovery codes, session-management UI, and a distributed login rate limiter
- Authorization enforcement for modules beyond the currently protected patient, appointment, encounter, workflow, connected-care access, master identity, consent, referral, and laboratory routes
- Encounter creation, diagnosis/procedure editing, addenda, and database-backed modules beyond patient/scheduling/encounter workflows
- BAA-backed infrastructure and formal HIPAA security/privacy program
- Encryption/key-management controls and private object storage
- Live BAA-backed Quest, Labcorp, BioReference, hospital-lab, HL7 v2, and FHIR laboratory adapters; ClinicOS currently provides the native workflow, adapter contract, integration event ledger, and safe manual/document fallbacks without claiming electronic connectivity
- Imaging, payer, clearinghouse, e-prescribing, and telemedicine integrations
- Production payment and communication webhooks
- Approved, BAA-reviewed production speech transcription; current push-to-talk uses the browser speech adapter with synthetic demo data only and stores no audio
- Clinical terminology services and validated quality-measure logic
- Certification, legal review, threat model, penetration test, accessibility audit, and clinical safety validation

The three original `zumi-server-*.js` files remain preserved as historical Zumi source snapshots and are not imported into ClinicOS.
