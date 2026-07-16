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
- Patient index and longitudinal chart with live clinical-domain tabs
- Structured encounter and SOAP note editor
- Scheduling and telemedicine readiness
- Governed Document Airlock with category policy, upload/camera/scan intake, encrypted database fallback, chart/encounter/referral/case links, human review, portal-release approval, immutable versions, expiration, secure preview/print/download, checksum-verified ZIP packets, and custody audit history
- Intake Runway with drag-and-drop multi-section templates, conditional and repeatable fields, immutable version lineage, patient assignments, staff-assisted and paper fallbacks, save/resume, attested submitter/witness/provider signatures, staged human review and correction, renewal/expiration policy, locked PDF generation, patient-copy controls, chart attachment, and custody history
- Laboratory order-to-result command center with chart-bound diagnoses and tests, truthful manual delivery, structured result entry, document-bound upload fallback, source abnormal/critical flags, urgent human escalation, provider review, explicit portal release, patient-notification confirmation, follow-up, repeat orders, versioned corrections, provenance, and longitudinal numeric trends
- Imaging review queue
- Medication Command with source-labeled active and historical records, provider reconciliation, refill intake and review, prescription drafts, exact-match warning provenance, active-provider approval, truthful manual or eRx transmission state, failure recovery, pharmacy readiness, patient-chart history, and append-only custody events
- Billing, claims, denials, balances, and insurance verification
- No-fault and workers' compensation case operations
- Quality measures, care gaps, and outreach
- Secure-message, task, and escalation workspaces
- Same-page AI safety-routing simulator
- Patient portal preview
- Integration roadmap and organization audit settings
- Network Command, Care Constellation, and purpose-bound clinic connections
- Live connected-clinic directory with organization, location, department, facility, provider, relationship, sharing-agreement, integration-health, and failed-delivery views; connection requests and receiving-clinic approval are audited and never imply chart access
- Human-reviewed master patient identity, source-chart locator, consent ledger, and immediate consent revocation
- Closed-loop Referral Relay with clinical orders, consent-bound connected delivery, truthful fax/Direct/manual fallbacks, receiving-clinic actions, consultation return, delivery recovery, tasks, escalations, and dual-clinic audit receipts
- Diagnostic Capacity Exchange and Injury Episode Room
- Live Health Passport and Consent Wallet workspace with tenant-filtered chart-derived refresh, explicit human confirmation, category-level defaults, emergency access preference, consent visibility, and audit receipts
- Universal Intake Passport workspace with reusable patient-confirmed fields, versioned confirmation, patient selection, and manual intake fallback
- Voice-first ClinicOS Copilot with same-screen transcript review and typing fallback
- Searchable, PostgreSQL-backed Priority Zero registry covering 62 domains and 2,157 capabilities, including the incorporated 52-section ClinicOS Master Feature List

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
| `DIRECT_DATABASE_URL` | Production migrations | Direct, non-PgBouncer PostgreSQL connection used by Prisma CLI migrations to avoid advisory-lock retention; may equal `DATABASE_URL` for ordinary PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical application URL |
| `AUTH_SECRET` | Production | At least 32 random characters used to sign HTTP-only sessions |
| `DOCUMENT_ENCRYPTION_KEY` | Production | Base64- or hex-encoded 32-byte AES-256-GCM key for the encrypted database document fallback; rotate only through a reviewed re-encryption procedure |
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
- `GET|POST /api/payments` returns the tenant billing worklist or records a manual payment with a patient-balance snapshot, invoice reconciliation, payment event, and audit receipt.
- `POST /api/payments/links` creates a short-lived, tokenized payment link without putting PHI in the checkout URL; `POST /api/payments/:paymentId/transition` records a reviewed failure or refund.
- `POST /api/payments/memberships` and `POST /api/payments/packages` create paid, auditable med-spa membership and package records using the manual payment fallback until a reviewed processor adapter is active.
- `GET /api/health-passport` returns only the signed-in organization's patient passports, while `POST /api/health-passport` creates a chart-derived snapshot marked `needs_confirmation`; it never represents the snapshot as a diagnosis or autonomous clinical decision.
- `GET|POST /api/consent-wallet` returns or updates patient sharing defaults and emergency-access preference with organization checks and audit receipts; ordinary record sharing still requires the consent ledger and access-grant rules.
- `GET|POST /api/intake-passport` returns or confirms reusable intake fields with version increments, explicit confirmation, tenant checks, and audit receipts; clinic-specific questions and manual forms remain the fallback.
- `GET|POST /api/network/record-requests` and the connected-care decision/read/revoke routes require role permission, an active relationship, sharing agreement, active consent, purpose/category coverage, and an auditable access grant. Break-glass remains a narrow, time-limited, separately audited exception.
- `GET /api/network/directory` returns only the participating-clinic directory and signed-in organization's integration/error queue; `POST /api/network/connections` creates a purpose-limited relationship request, while `POST /api/network/connections/:connectionId/transition` restricts approval, suspension, and restoration to the correct organization administrator boundary and writes dual-organization audit receipts.
- `GET|POST /api/referrals` lists the signed-in clinic's outbound referrals and only transmitted inbound referrals whose relationship, agreement, and patient consent still validate at read time, or creates a tenant-owned clinical order and referral draft after destination, document, relationship, agreement, and consent validation.
- `POST /api/referrals/:referralId/transition` enforces source-versus-receiver lifecycle actions, revalidates connected authority at send/retry, records truthful manual-delivery confirmation, creates failed-delivery escalations and retry tasks, and writes referral events plus audit receipts for each represented clinic.
- `GET /api/labs` returns the signed-in organization only: orders, results, structured items, source documents, providers, adapter readiness, lifecycle events, integration events, and numeric trend series.
- `POST /api/labs/orders` creates a tenant-owned clinical order and laboratory order after validating the patient, provider, encounter, chart diagnoses, tests, and any requested active electronic adapter.
- `POST /api/labs/orders/:labOrderId/transition` enforces draft, readiness, truthful manual/adapter queue, delivery confirmation, collection, failure, retry, and cancellation states while creating delivery tasks, integration events, escalations, and audit receipts.
- `POST /api/labs/results` receives structured manual, patient-document-bound upload, or active-adapter results; holds every result for human review; creates urgent escalations and provider notifications for critical source flags; and never produces clinical interpretation.
- `POST /api/labs/results/:labResultId/transition` requires both provider-signing permission and an active same-organization provider identity for review, portal release, and repeat orders; it keeps review and release separate and supports staff-recorded patient notification and follow-up tasks.
- `POST /api/labs/results/:labResultId/correct` requires the same provider identity gate, preserves the original result, removes obsolete portal visibility, creates a versioned replacement, and routes the correction through mandatory review again.
- `GET /api/imaging` returns only the signed-in organization's order, authorization, delivery, appointment, report, provider-review, portal-release, correction, source-document, adapter, and event state.
- `POST /api/imaging/orders` creates a tenant-owned clinical and imaging order after validating the active patient, provider, optional encounter, chart diagnoses, prior-authorization record, facility, and any requested active electronic adapter.
- `POST /api/imaging/orders/:imagingOrderId/transition` enforces authorization-gated readiness, truthful manual/adapter delivery, human delivery confirmation, appointment scheduling, study completion, failure, retry, cancellation, tasks, escalations, integration events, and audit receipts.
- `POST /api/imaging/results` receives a structured manual report, patient-bound PDF, or active-adapter report only after study completion; holds it from the portal; and creates provider work, urgent human escalation, and notifications without interpreting source content.
- `POST /api/imaging/results/:imagingResultId/transition` keeps provider review and portal release separate, requires both imaging-sign permission and an active same-organization provider identity for each clinical sign-off, and supports patient-notification and follow-up receipts.
- `POST /api/imaging/results/:imagingResultId/correct` preserves the original report, removes obsolete portal visibility, creates a versioned source correction, and sends the replacement through mandatory provider review again.
- `GET|POST /api/documents` returns only the signed-in organization's document policies, current and superseded records, reviews, custody events, access receipts, and link options, or receives a validated file into the encrypted database fallback with patient and workflow binding.
- `POST /api/documents/categories` requires document-management permission and creates an organization-scoped category policy with access, review, retention, and MIME restrictions.
- `POST /api/documents/:documentId/transition` enforces human review, separate portal-release approval, release revocation, locking, archival, and restoration while preserving patient visibility invariants and writing review, event, task, and audit records.
- `POST /api/documents/:documentId/versions` preserves the prior record, removes obsolete portal visibility, creates an encrypted replacement in the same immutable version lineage, and returns the replacement to review.
- `GET /api/documents/:documentId/content?intent=preview|print|download` decrypts only after tenant, role, status, and sensitive-access checks; verifies SHA-256 integrity; disables caching; and logs the exact access intent.
- `POST /api/documents/packet` requires export permission and a stated purpose, verifies every selected encrypted source, logs each disclosure, and returns a size-limited ZIP with a checksum manifest.
- `GET|POST /api/forms` returns only the signed-in organization's template, assignment, submission, review, signature, patient, appointment, and custody state, or creates a validated draft template from the drag-and-drop schema.
- `POST /api/forms/templates/:templateId/transition` publishes a draft or retires an active version; publishing a replacement supersedes the prior active version without mutating submissions already bound to it.
- `POST /api/forms/templates/:templateId/versions` creates a reason-bound draft in the same immutable template lineage.
- `POST /api/forms/assignments` validates the active patient, exact published template version, optional patient-bound appointment/encounter, completion mode, due/expiration dates, and manual or adapter delivery path before creating both assignment and resumable submission.
- `PATCH /api/forms/submissions/:submissionId` saves conditional answers and completion state; changing answers revokes prior valid attestations while preserving signature history and requiring re-signature.
- `POST /api/forms/submissions/:submissionId/sign` stores a SHA-256 attestation receipt bound to signer role, identity, answers, template version, time, and hashed request context; provider signatures also require an active same-organization provider identity.
- `POST /api/forms/submissions/:submissionId/transition` validates required visible fields and signatures, routes staff/provider review and correction, and allows a managing role to generate, encrypt, checksum, lock, attach, audit, and optionally release the final PDF patient copy.
- `POST /api/forms/assignments/:assignmentId/remind` records a delivery task and custody receipt rather than claiming that an unconfigured portal, email, or SMS adapter delivered the reminder.
- `GET /api/forms/submissions/:submissionId/pdf` resolves the locked chart document and inherits tenant, role, decryption, checksum, no-store, and access-intent audit controls from the document service.
- `GET|POST /api/medications` returns the signed-in organization only or creates a source-labeled medication record after validating patient, optional encounter, provider, and pharmacy ownership; provider-entered history also requires the signed-in user's active provider identity.
- `POST /api/medications/reconciliations` creates a chart-bound provider work item over an exact set of patient medications; `POST /api/medications/reconciliations/:reconciliationId/transition` requires provider signing permission and an active provider identity to complete or reopen the attestation.
- `POST /api/medications/refills` captures patient, pharmacy, phone, SMS, staff, or imported requests without approving them; `POST /api/medications/refills/:refillId/transition` separates triage, provider decision, delivery queue, receipt, failure, retry, and completion while writing tasks, integration events, medication events, and audit receipts.
- `POST /api/medications/prescriptions` creates a non-transmitting draft assigned to an active provider; `POST /api/medications/prescriptions/:prescriptionId/transition` requires that exact provider identity for approval, blocks approval on unacknowledged high or urgent warnings, and records truthful manual or adapter delivery state.
- `POST /api/medications/warnings/:warningId/acknowledge` requires provider signing permission, an active provider identity, and a documented reason; deterministic exact-name warnings retain their rule source and evidence and never claim clinical interpretation.

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

Migration `20260715050411_imaging_radiology_lifecycle` adds imaging-order diagnosis, indication, modality, body part, laterality, priority, prior-authorization, facility, delivery, appointment and lifecycle state; source-report document and adapter binding; provider review and release; patient notification; correction versioning; append-only imaging events; indexes; foreign keys; and PostgreSQL integrity checks.

Migration `20260715062500_document_management_lifecycle` safely backfills legacy document lineage and source names, then adds category policy, encrypted fallback payload metadata, chart and workflow links, review and release state, expiration, immutable versioning, append-only custody events, indexes, and PostgreSQL checks for encryption bundles, portal visibility, lineage, source types, review decisions, and release approval.

Migration `20260715070000_forms_esign_lifecycle` adds immutable template version groups, assignments, completion/delivery/expiration state, resumable submission progress, staged staff/provider reviews, correction and approval state, append-only form events, generated-document linkage, attested signer roles and revocation history, partial uniqueness for each valid signer role, foreign keys, indexes, and PostgreSQL checks for form, review, signature, lock, cancellation, and completion invariants.

Migration `20260716060000_forms_signature_integrity` requires every form-submission signature to carry a 64-character SHA-256 attestation receipt and requires provider-role signatures to reference a provider identity.

Migration `20260716080000_medication_pharmacy_lifecycle` expands patient pharmacies and medication provenance, adds medication reconciliation, refill, prescription, warning, and append-only event records, constrains lifecycle and delivery states, enforces the controlled-substance and EPCS boundary, and adds queue, patient-history, warning, and custody indexes.

Patient, appointment, encounter, connected-care directory/access, master identity, consent, referral, laboratory, imaging, document, form, and medication reads are implemented through server-only Prisma repositories. Every local base and related query requires `organizationId`; cross-organization identity scans require an active demographic-sharing agreement, cross-organization clinical reads revalidate the relationship, agreement, consent, grant, purpose, categories, role, and time at read time, and connected referral sends revalidate the relationship, agreement, and patient consent at transmission. API responses are marked private/no-store where appropriate. Appointment transitions, encounter draft/review/sign-lock mutations, identity decisions, consent changes, network directory/relationship/access actions, referral handoffs, laboratory transitions, imaging transitions, medication reconciliation and prescribing actions, document custody actions, and form completion/signature/review/lock actions use guarded filters, lifecycle checks, explicit human gates, and audit records. The chart, dashboard, front desk, provider panel, schedule, encounter worklist, access controls, identity resolution, Network Command, Referral Relay, Laboratory Relay, Radiology Command Lane, Medication Command, Document Airlock, and Intake Runway consume those repositories. Remaining modules still need the same repository boundary. Before production use, add database-level row security or equivalent defense in depth, immutable external audit storage, BAA-reviewed object storage and managed KMS/HSM key rotation beyond the size-limited encrypted database fallback, backups, disaster recovery, retention/destruction workflows, and formal migration review.

The current identity foundation includes bcrypt password credentials, signed eight-hour HTTP-only cookies, database-backed revocable session records, role permission definitions, login lockout fields, and a WebAuthn/passkey credential model. Passkey challenge endpoints, MFA enrollment, recovery, and a production distributed rate limiter remain future security work.

## Render deployment

The included `render.yaml` describes the web service. Before creating a production deployment:

1. Create a managed PostgreSQL database.
2. Set pooled `DATABASE_URL` for application traffic and direct, non-PgBouncer `DIRECT_DATABASE_URL` for Prisma migrations. They may be identical for a standard PostgreSQL host.
3. Run the committed migrations with `npm run db:migrate:deploy`; never use `db push` in production. Prisma CLI prefers `DIRECT_DATABASE_URL` and falls back to `DATABASE_URL` only when no direct URL is configured.
4. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL.
5. Generate a unique `AUTH_SECRET` with at least 32 random characters and keep `DEMO_AUTH=false`.
6. Generate and store a unique 32-byte `DOCUMENT_ENCRYPTION_KEY`; never reuse it across environments or rotate it without re-encrypting stored payloads.
7. Seed the first database user using a temporary `CLINICOS_SEED_ADMIN_PASSWORD`, then rotate/remove the seed value from the service environment.
8. Confirm `/api/health` responds successfully and `/dashboard` redirects unauthenticated requests to `/login`.
9. Keep all optional vendor credentials unset until contracts, BAAs, consent, security review, and real integrations are complete.

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
- Authorization enforcement for modules beyond the currently protected patient, appointment, encounter, workflow, connected-care access, master identity, consent, referral, laboratory, imaging, document, and form routes
- Encounter creation, diagnosis/procedure editing, addenda, and database-backed modules beyond patient/scheduling/encounter workflows
- BAA-backed infrastructure and formal HIPAA security/privacy program
- BAA-reviewed private object storage, managed KMS/HSM key custody, key rotation/re-encryption automation, malware scanning, and larger-file streaming beyond the current AES-256-GCM encrypted 10 MB database fallback
- Live BAA-backed Quest, Labcorp, BioReference, hospital-lab, HL7 v2, and FHIR laboratory adapters; ClinicOS currently provides the native workflow, adapter contract, integration event ledger, and safe manual/document fallbacks without claiming electronic connectivity
- Live BAA-backed imaging facility, hospital radiology, DICOM/PACS, HL7, and FHIR adapters; ClinicOS currently provides the native imaging workflow, adapter contract, authorization and delivery controls, event ledger, source-document fallback, and provider release gates without claiming electronic connectivity
- Payer, clearinghouse, production e-prescribing and EPCS, formulary, PDMP, drug-interaction, and telemedicine integrations; the medication workflow currently exposes an adapter-ready contract, deterministic exact-match source warnings, manual, print, and fax fallback, a sandbox eRx demonstration, and a fail-closed EPCS boundary without claiming production connectivity
- Production Stripe/Square payment webhooks and patient-facing checkout completion; current billing is a connected, tenant-filtered manual workflow with tokenized payment-link creation, explicit adapter status, reconciliation, refund controls, and audit receipts.
- Patient-portal authentication, public assignment tokens, live email/SMS form delivery, qualified electronic-signature vendors, identity-proofing adapters, and automated reminder delivery; current patient completion is staff-assisted inside an authenticated clinic workspace and every external-delivery choice creates a truthful manual fallback task
- Approved, BAA-reviewed production speech transcription; current push-to-talk uses the browser speech adapter with synthetic demo data only and stores no audio
- Clinical terminology services and validated quality-measure logic
- Certification, legal review, threat model, penetration test, accessibility audit, and clinical safety validation

The three original `zumi-server-*.js` files remain preserved as historical Zumi source snapshots and are not imported into ClinicOS.
