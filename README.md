# ClinicOS by Zumi

ClinicOS is a premium, multi-tenant EMR and clinic-operating-system foundation for community practices. This repository contains an offer-first organization onboarding flow, isolated clinic workspaces, a connected synthetic sales demo, and a PostgreSQL-backed operating model.

Official public deployment target: [https://zumi.onrender.com](https://zumi.onrender.com). The existing Render service is the canonical Clinicos URL going forward. Keep the synthetic-data-only and not-production-ready warnings below in place until the security and compliance gates are complete.

## Important safety status

This is an engineering foundation and demonstration environment. It is **not** a certified EHR, production clinical system, HIPAA-compliant deployment, clearinghouse, lab interface, diagnostic tool, or substitute for professional clinical judgment.

- Use fake data only.
- AI may summarize, classify, draft, route, and detect missing information.
- AI may not diagnose, prescribe, interpret results as a final answer, decide treatment, guarantee coverage, or release protected records.
- Emergency, lab, medication, clinical, and coverage-guarantee messages are routed to human review.
- Quest, Labcorp, BioReference, radiology, FHIR/SMART, HL7, X12, telemedicine, payments, voice/SMS, and email appear only as explicit roadmap integrations.

## Product surfaces

- Private Workflow Demo & Cost Review sales engine with public `/demo`, `/private-demo`, `/founding-clinic`, and `/sales` routes; server-controlled $500, $1,500, and $8,000 offers; credit-forward disclosure; synthetic scenario generation; a human-reviewed recap lifecycle; tenant-owned `/admin/sales` and `/owner/founding-program` workspaces; and manual payment fallback
- PostgreSQL-backed Grid demonstration with public `/grid/join` independent-contractor enrollment, nurse/injector credentials and malpractice review, mobile/chair/partner-location preferences, on-call availability, admin approval, accept/counter/decline booking decisions, manual payout estimates, bounded Zumi guidance, hidden admin identity fields, cross-organization request states, dual-tenant audit receipts, and authenticated `/grid/*` plus `/admin/grid` workspaces
- Governed Network Command with relationship-aware partner profiles, visual clinic constellation, integration/capacity/manual-fallback signals, consent- and agreement-bound handoff preparation, connected/manual/fax/Direct delivery states, recipient actions, append-only dual-organization events, and authenticated `/network`, `/network/map`, `/network/handoffs`, `/network/directory`, and `/admin/network` workspaces
- PostgreSQL-backed Zumi Workflow Copilot shared by `/ai-assistants` and `/voice-assistant`, with typed or push-to-talk input, same-page processing and results, deterministic local safety/routing rules, optional tenant-owned synthetic patient context, confidence and provenance, review tasks, urgent holds, human approval/rejection receipts, and execution blocked at every stage
- Offer-first public landing page and self-service organization launch with clinic type, primary location, owner credential, tenant-specific roles and permissions, trial modules, default appointment types, pending connector records, onboarding settings, signed session creation, and audit/activity receipts
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
- Claim Readiness workspace with explainable coding preparation, denial intelligence, human review, and no-autonomous-submission guardrails
- Luxe Medi Studio with service catalog, consultation capture, provider-reviewed treatment plans, manual session tracking, promotion drafts, package and membership context, consent/forms, before-and-after custody, and inventory context
- PostgreSQL-backed no-fault and workers' compensation case rooms with organization-isolated profiles, policy/employer and injury facts, diagnosis and form status, human-reviewed updates, owner tasks, case-linked document custody, required packet checklists, readiness state machine, manual PDF packet export, patient-level billing context labeled as non-attributed, and full case audit history; external carrier, attorney, form, payer, and clearinghouse delivery remains `Pending Connection`
- Quality measures, care gaps, and outreach
- Secure-message, task, and escalation workspaces
- Same-page Zumi workflow command surface with synthetic-data acknowledgment and visible review state
- Patient portal preview
- Integration roadmap and organization audit settings
- Network Command, Care Constellation, and purpose-bound clinic connections
- Live connected-clinic directory with organization, location, department, facility, provider, relationship, sharing-agreement, integration-health, and failed-delivery views; connection requests and receiving-clinic approval are audited and never imply chart access
- Human-reviewed master patient identity, source-chart locator, consent ledger, and immediate consent revocation
- Closed-loop Referral Relay with clinical orders, consent-bound connected delivery, truthful fax/Direct/manual fallbacks, receiving-clinic actions, consultation return, delivery recovery, tasks, escalations, and dual-clinic audit receipts
- Diagnostic Capacity Exchange and Injury Episode Room
- Live Health Passport and Consent Wallet workspace with tenant-filtered chart-derived refresh, explicit human confirmation, category-level defaults, emergency access preference, consent visibility, and audit receipts
- Universal Intake Passport workspace with reusable patient-confirmed fields, versioned confirmation, patient selection, and manual intake fallback
- Live Care Constellation responsibility-transfer queue with tenant-filtered handoffs, receiving-clinician acknowledgment, clarification, resolution, escalation, task completion, urgent human review, notifications, and audit receipts
- Live Capacity Exchange request flow with verified listing reads, tenant-filtered patient selection, appointment-request holds, manual-confirmation tasks, and audit receipts
- Live Patient Navigation workflow with safety classification, administrative draft generation, human review, urgent escalation, and tenant-filtered appointment/referral context; drafts remain blocked from send
- Live Provider Consultation Marketplace with credential snapshots, connected-clinic checks, provider request/accept/schedule/close transitions, responsible-provider tasks, and manual adapter boundaries
- Voice-first Zumi Copilot with editable browser transcript, typing fallback, no stored audio, and production speech marked `Pending connection`
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

The seed creates the authenticated owner `nadja@example.test`, the approved synthetic GRID contractor `tiffany.grid@example.test`, and a separate synthetic patient portal account for `maya.thompson@example.test` at clinic code `brooklyn-family-medicine`. Staff and contractor accounts use `CLINICOS_SEED_ADMIN_PASSWORD`; set it and a different `CLINICOS_SEED_PATIENT_PASSWORD` to strong values before running the seed. The patient password falls back to the admin seed password only for backwards-compatible local seeding. The demo seed is destructive and must never be run against a database containing real records. Development-only fallback authentication is forcibly disabled when `NODE_ENV=production` and can also be disabled locally with `DEMO_AUTH=false`.

## Environment variables

| Variable | Required now | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | For Prisma | PostgreSQL connection string |
| `DIRECT_DATABASE_URL` | Production migrations | Direct, non-PgBouncer PostgreSQL connection used by Prisma CLI migrations to avoid advisory-lock retention; may equal `DATABASE_URL` for ordinary PostgreSQL |
| `NEXT_PUBLIC_APP_URL` | Recommended | Canonical application URL |
| `AUTH_SECRET` | Production | At least 32 random characters used to sign HTTP-only sessions |
| `DOCUMENT_ENCRYPTION_KEY` | Production | Base64- or hex-encoded 32-byte AES-256-GCM key for the encrypted database document fallback; rotate only through a reviewed re-encryption procedure |
| `CLINICOS_SEED_ADMIN_PASSWORD` | Seed only | Initial fake clinic-owner password; must be 12+ characters and not the placeholder |
| `CLINICOS_SEED_PATIENT_PASSWORD` | Seed only | Initial synthetic patient-portal password; use a different 12+ character value |
| `CLINICOS_SALES_ORGANIZATION_SLUG` | No | Sales-owner tenant for public demo reservations; defaults to `clinicos-by-zumi` |
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
npm run db:seed:sales-demo # non-destructive synthetic sales workspace seed after the sales migration
npm run build        # production build
npm start            # production server
```

## API foundation

- `GET /api/health` returns service and demo-mode health.
- `POST /api/onboarding/organizations` validates and rate-limits public workspace creation, then atomically creates the organization, location, departments, owner credential, roles, permissions, trial, defaults, pending connectors, settings, and audit receipts before issuing a signed session.
- `POST /api/sales/reservations` rate-limits and validates a public no-PHI clinic intake, ignores all client tenant selection, assigns the configured ClinicOS sales owner, persists server-controlled pricing, and generates a deterministic synthetic scenario with an append-only event and audit receipt.
- `GET /api/sales/reservations` returns only reservations managed by the authenticated user's organization and requires the sales-read permission; transition, scenario, recap, and recap-review routes enforce sales update/manage permissions, organization ownership, lifecycle rules, manual payment truth, and human review.
- `GET /api/sales/founding-program` returns only reservations linked to the authenticated owner organization or exact authenticated owner email; it never lists the platform-wide pipeline.
- `POST /api/auth/login` verifies credentials, rate-limits failures, and issues a signed HTTP-only session.
- `POST /api/auth/logout` revokes database sessions and clears the browser cookie.
- `POST /api/portal/auth/login` authenticates an organization-scoped patient account using a patient-only token audience, database session, lockout counter, and separate HTTP-only cookie.
- `POST /api/portal/auth/logout` revokes only the patient portal session and records a patient-visible access event.
- `GET /api/portal/me` ignores client-supplied patient identifiers and returns only the authenticated patient's organization-filtered appointments, forms, released documents/results/instructions, balances, approved portal messages, and portal access history.
- Staff navigation, workspace rendering, and every staff API method now share an explicit role/resource/action contract. Newly denied API actions write an `authorization.denied` audit event without exposing cross-tenant resource existence.
- `GET /api/patients` requires authentication and queries PostgreSQL with the session organization ID in every patient and related-record filter.
- `GET /api/appointments` returns only the signed-in organization's schedule.
- `PATCH /api/appointments/:appointmentId/status` enforces forward-only scheduling lifecycle transitions and writes an audit event.
- `GET /api/encounters` returns tenant-scoped encounter, SOAP, coding, and audit data.
- `POST /api/encounters` creates a tenant-scoped encounter draft only after validating the patient, provider, location, and optional appointment inside the signed-in organization.
- `PATCH /api/encounters/:encounterId` autosaves draft-only structured documentation.
- `PUT /api/encounters/:encounterId/coding` replaces draft-only ICD-10 and CPT/HCPCS entries, synchronizes draft superbill context, and records an audit receipt.
- `POST /api/encounters/:encounterId/addenda` lets authorized signers append an immutable signed clarification to a locked note without changing the original.
- `POST /api/encounters/:encounterId/transition` submits a complete draft for review or signs and permanently locks a reviewed note.
- `POST /api/workflows/classify` requires authentication and applies deterministic safety-routing rules.
- `GET|POST /api/copilot/runs` returns tenant-scoped Copilot history or creates a synthetic-demo-only administrative run after AI/voice permission checks; it persists the classification, blocked draft, review task, optional urgent escalation, provenance, run events, and audit receipt without executing a downstream action.
- `POST /api/copilot/runs/:runId/review` requires AI-update permission and records an authorized human approval or rejection while leaving patient messages, claims, referrals, records, payments, and appointments unexecuted.
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
- `GET|POST /api/care-handoffs` returns or creates tenant-scoped responsibility transfers; `POST /api/care-handoffs/:handoffId/transition` supports acknowledged, clarification, resolved, rejected, and explicitly escalated states with human notes, linked tasks, notifications, and audit receipts.
- `GET /api/tasks` and `GET /api/escalations` return tenant-scoped operational queues; their transition routes require human notes, update linked records, and record audit history instead of silently completing clinical work.
- `GET|POST /api/capacity-exchange` returns tenant-filtered capacity listings and creates a requested appointment hold plus a staff confirmation task; it never claims that a slot is booked before the clinic confirms the appointment lifecycle.
- `GET|POST /api/patient-navigation` returns tenant-filtered navigation context or creates a safety-checked administrative draft; `POST /api/patient-navigation/:draftId/review` records human approval/rejection while keeping the draft blocked from send.
- `GET|POST /api/provider-consultations` returns connected, credential-aware provider consultation context or creates a request; `POST /api/provider-consultations/:consultationId/transition` records accept, decline, schedule, and close decisions with audit receipts and manual fallback boundaries.
- `GET|POST /api/knowledge` returns tenant-filtered governed sources or creates a draft; review and correction routes record approval, rejection, rollback, versioning, citations, conflict warnings, and knowledge-access audit receipts.
- `GET|POST /api/remote-monitoring` returns tenant-filtered observations or records a consent-confirmed manual/adapter-ready reading; the review route records provider review, rejection, escalation tasks, and audit receipts without autonomous interpretation.
- `GET|POST /api/inventory` returns tenant-filtered catalog and custody history, creates tracked items, and records receipt, adjustment, procedure-use, waste, transfer, recall, and reconciliation transactions with low-stock tasks and audit receipts.
- `GET|POST /api/provider-network/credentials` returns tenant-filtered provider authority profiles, creates credential and facility-privilege review records, and `/api/provider-network/credentials/:credentialId/transition` plus `/api/provider-network/privileges/:privilegeId/transition` record human verification, rejection, exception, renewal, grant, suspension, and expiration decisions with renewal tasks and audit receipts.
- `POST /api/grid/enroll` rate-limits public synthetic contractor enrollment, creates a pending contractor account plus nurse/injector provider, license, malpractice, availability, task, and audit records, and keeps login blocked until human approval. `GET /api/grid` returns a role-filtered GRID command context; `/api/grid/me`, credential and malpractice review routes, request transitions, and payout transitions enforce self-service versus administrator boundaries. Contractors may accept, counter, or decline only their own requests. Payouts are estimates with manual approval/payment references—not processor transfers or guarantees. Zumi guidance is deterministic administrative guidance and does not verify credentials, decide clinical scope, or promise work.
- `GET /api/network/command` returns the signed-in clinic's relationship-aware partner map and only authorized inbound handoffs; `POST /api/network/handoffs` prepares a minimum-necessary synthetic handoff after relationship, sharing-agreement, purpose, category, consent, patient, and human-confirmation checks; and `POST /api/network/handoffs/:handoffId/transition` enforces sender-versus-recipient lifecycle actions, truthful delivery labels, fallback work queues, dual-organization events, and audit receipts.
- `GET|POST /api/crm` returns the signed-in organization's lead pipeline, follow-up queue, lead-linked communications, and revenue-recovery metrics, or creates an audited lead with an optional patient link and follow-up task. `POST /api/crm/leads/:leadId/transition` records contact, booking, loss, reactivation, completion, and follow-up lifecycle changes; `POST /api/crm/leads/:leadId/messages` records tenant-bound SMS, email, phone, website, social, or internal follow-up notes through the manual adapter fallback.
- `GET|POST /api/system-health` returns tenant-scoped live checks, integration status, retryable failures, queue counts, audit/activity history, and persisted reliability events, or creates an incident, maintenance, deployment, backup, or service-status event. `POST /api/system-health/events/:eventId/transition` records acknowledge, resolve, and reopen decisions; `POST /api/system-health/integration-events/:eventId/retry` queues a reviewed adapter retry without claiming delivery success.
- `GET|POST /api/network/record-requests` and the connected-care decision/read/revoke routes require role permission, an active relationship, sharing agreement, active consent, purpose/category coverage, and an auditable access grant. Break-glass remains a narrow, time-limited, separately audited exception.
- `GET /api/network/directory` returns only the participating-clinic directory and signed-in organization's integration/error queue; `POST /api/network/connections` creates a purpose-limited relationship request, while `POST /api/network/connections/:connectionId/transition` restricts approval, suspension, and restoration to the correct organization administrator boundary and writes dual-organization audit receipts.
- `GET|POST /api/network/invitations` returns the signed-in organization's outbound and inbound participation invitations, coverage gaps, referral/adoption insight, and growth audit history, or creates a known-organization invitation or manual external-partner application. `POST /api/network/invitations/:invitationId/transition` records verify, accept, reject, cancel, suspend, and restore decisions with tenant checks and dual-organization audit receipts; accepting participation does not silently grant chart access.
- `GET|POST /api/care-teams` returns only Care Team Rooms owned by or actively joined by the current organization, or creates a patient-linked room with a human-review shared plan. Member, room, and secure-message routes require explicit care-team permissions, active network relationships for cross-clinic members, membership acceptance, minimum-necessary access, and audit receipts; external clinical adapters remain manual/fallback-ready.
- `POST /api/care-teams/:roomId/members` invites a connected organization, while `POST /api/care-teams/:roomId/members/:memberId/transition` records acceptance, removal, and reinstatement. `POST /api/care-teams/:roomId/messages` records tenant-owned secure team messages linked to the patient and room; `POST /api/care-teams/:roomId/transition` closes or reopens the room with a human note.
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
- `GET|POST /api/coding` returns tenant-filtered claim readiness assessments or creates a blocked, explainable coding recommendation draft over an existing claim draft. `POST /api/coding/:draftId/review` records an authorized human approval or rejection; no code, claim, coverage, appeal, or submission decision is made automatically.
- `GET|POST /api/luxe-medi` returns the signed-in organization's Luxe Medi catalog and operating context or creates a consultation lead, treatment plan, manual treatment session, or administrator-owned promotion draft. Treatment plans remain blocked until provider review; no treatment eligibility, prescribing, appointment, or outcome decision is automated.
- `POST /api/luxe-medi/treatment-plans/:planId/transition` requires an active provider identity for eligibility-review approval or rejection, enforces approval before activation, and writes an audit receipt for every transition.
- `POST /api/luxe-medi/sessions/:sessionId/transition` records human completion, cancellation, or rescheduling with tenant checks and source-review notes; external calendar and mobile-care delivery remain manual fallbacks.
- `GET|POST /api/cases` returns the authenticated organization’s no-fault and workers compensation portfolio or opens a patient-bound case room with a default checklist and owner task. Claim numbers are unique within each organization and case type.
- `GET|PATCH /api/cases/:caseType/:caseId` returns a tenant-filtered room or records a reviewed case update with a required note. Cross-tenant identifiers resolve as not found.
- Case task routes create assigned follow-through and record complete, cancel, and reopen transitions. Case packet routes create type-specific requirements, prevent readiness shortcuts, record checklist evidence, generate a manual-only state, require human approval, and export a checksum-labeled PDF that explicitly confirms no external transmission occurred.

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

Migration `20260718181500_case_room_operations` adds case policy, diagnosis, NF/C-4, work-return, authorization, denial, appeal, task evidence/completion, and packet generation/approval fields; tenant-scoped claim uniqueness and patient-case indexes support the live no-fault and workers compensation rooms.

Migration `20260809131500_private_demo_sales_engine` adds tenant-owned demo reservations, fully synthetic scenario records, human-reviewed recap drafts, append-only sales events, strict price/lifecycle/payment checks, and organization ownership indexes for the founding-clinic sales engine.

Migration `20260809210000_grid_provider_marketplace` extends provider, credential, availability, and location records for the Grid; adds service listings, controlled cross-organization requests, and append-only request events; and enforces provider, verification, listing, availability, request, consent, deposit, payment, and lifecycle integrity in PostgreSQL.

Migration `20260810010000_grid_contractor_enrollment` connects a contractor account to one provider profile, stores human-reviewed license and malpractice evidence, supports on-call preferences and counter-proposed request times, adds the manual GRID payout ledger, and registers the least-privilege contractor role for existing organizations. Public enrollment remains synthetic-data-only while the organization is in demo mode.

Migration `20260809231500_network_partner_handoffs` extends connected-clinic relationships with partner-profile, service, capacity, integration, consent-category, and fallback metadata; evolves care handoffs into destination-aware governed deliveries; adds append-only dual-organization handoff events; safely backfills legacy responsibility transfers; and enforces exact handoff, delivery, and relationship states in PostgreSQL.

The Luxe Medi slice adds organization-scoped `luxe_services`, `luxe_treatment_plans`, `luxe_treatment_sessions`, and `luxe_promotions` records. It intentionally uses manual scheduling and payment/package adapters until external vendors are configured, while keeping provider review, consent, document custody, inventory, lead, and payment sources connected.

Patient, appointment, encounter, connected-care directory/access, master identity, consent, referral, partner handoff, laboratory, imaging, document, form, medication, and injury-case reads are implemented through server-only Prisma repositories. Every local base and related query requires `organizationId`; cross-organization identity scans require an active demographic-sharing agreement, cross-organization clinical reads revalidate the relationship, agreement, consent, grant, purpose, categories, role, and time at read time, and connected referral and partner-handoff sends revalidate the relationship, agreement, and patient consent at transmission. Authorized inbound handoffs repeat those checks at read time and expose minimum-necessary workflow context rather than a chart. API responses are marked private/no-store where appropriate. Appointment transitions, encounter draft/review/sign-lock mutations, identity decisions, consent changes, network directory/relationship/access actions, referral and partner handoffs, laboratory transitions, imaging transitions, medication reconciliation and prescribing actions, document custody actions, form completion/signature/review/lock actions, and case/task/packet actions use guarded filters, lifecycle checks, explicit human gates, and audit records. The chart, dashboard, front desk, provider panel, schedule, encounter worklist, access controls, identity resolution, Network Command, Referral Relay, Laboratory Relay, Radiology Command Lane, Medication Command, Document Airlock, Intake Runway, and no-fault/workers compensation room consume those repositories. Remaining modules still need the same repository boundary. Before production use, add database-level row security or equivalent defense in depth, immutable external audit storage, BAA-reviewed object storage and managed KMS/HSM key rotation beyond the size-limited encrypted database fallback, backups, disaster recovery, retention/destruction workflows, and formal migration review.

The current identity foundation includes bcrypt password credentials, signed eight-hour HTTP-only cookies, database-backed revocable session records, role permission definitions, login lockout fields, and a WebAuthn/passkey credential model. Passkey challenge endpoints, MFA enrollment, recovery, and a production distributed rate limiter remain future security work.

## Render deployment

The included `render.yaml` describes the web service. Before creating a production deployment:

1. Create a managed PostgreSQL database.
2. Set pooled `DATABASE_URL` for application traffic and direct, non-PgBouncer `DIRECT_DATABASE_URL` for Prisma migrations. They may be identical for a standard PostgreSQL host.
3. Run the committed migrations with `npm run db:migrate:deploy`; never use `db push` in production. Prisma CLI prefers `DIRECT_DATABASE_URL` and falls back to `DATABASE_URL` only when no direct URL is configured.
4. Set `NEXT_PUBLIC_APP_URL` to the public HTTPS URL. When it is omitted on Render, canonical links fall back to Render's built-in `RENDER_EXTERNAL_URL`.
5. Generate a unique `AUTH_SECRET` with at least 32 random characters and keep `DEMO_AUTH=false`.
6. Generate and store a unique 32-byte `DOCUMENT_ENCRYPTION_KEY`; never reuse it across environments or rotate it without re-encrypting stored payloads.
7. Seed the first database user using a temporary `CLINICOS_SEED_ADMIN_PASSWORD`, then rotate/remove the seed value from the service environment.
8. Confirm `/api/health` responds successfully and `/dashboard` redirects unauthenticated requests to `/login`.
9. Keep all optional vendor credentials unset until contracts, BAAs, consent, security review, and real integrations are complete.

Render build command (the root `postinstall` script generates Prisma Client and builds Next.js so the legacy `zumi` service's existing `npm install` command also remains compatible):

```bash
npm ci
```

Render start command:

```bash
npm start
```

The startup runner applies committed migrations when `DATABASE_URL` is configured and refuses to start if that migration fails. Without `DATABASE_URL`, it serves only the public synthetic demonstration shell so the canonical site remains reachable; authenticated and persisted workflows remain unavailable until PostgreSQL is connected.

For a custom domain, add the domain in the Render service, copy the supplied DNS record into the DNS provider, wait for verification, and set `NEXT_PUBLIC_APP_URL=https://your-domain.example`.

## Production gates that are not complete

- Passkey challenge endpoints, MFA, recovery codes, session-management UI, and a distributed login rate limiter
- Authorization enforcement for modules beyond the currently protected patient, appointment, encounter, workflow, connected-care access, master identity, consent, referral, laboratory, imaging, document, and form routes
- Structured vitals, review-of-systems and physical-exam builders, template/smart-phrase administration, co-signature completion, and database-backed modules beyond the currently connected repositories
- BAA-backed infrastructure and formal HIPAA security/privacy program
- BAA-reviewed private object storage, managed KMS/HSM key custody, key rotation/re-encryption automation, malware scanning, and larger-file streaming beyond the current AES-256-GCM encrypted 10 MB database fallback
- Live BAA-backed Quest, Labcorp, BioReference, hospital-lab, HL7 v2, and FHIR laboratory adapters; ClinicOS currently provides the native workflow, adapter contract, integration event ledger, and safe manual/document fallbacks without claiming electronic connectivity
- Live BAA-backed imaging facility, hospital radiology, DICOM/PACS, HL7, and FHIR adapters; ClinicOS currently provides the native imaging workflow, adapter contract, authorization and delivery controls, event ledger, source-document fallback, and provider release gates without claiming electronic connectivity
- Payer, clearinghouse, production e-prescribing and EPCS, formulary, PDMP, drug-interaction, and telemedicine integrations; the medication workflow currently exposes an adapter-ready contract, deterministic exact-match source warnings, manual, print, and fax fallback, a sandbox eRx demonstration, and a fail-closed EPCS boundary without claiming production connectivity
- Production Stripe/Square payment webhooks and patient-facing checkout completion; current billing is a connected, tenant-filtered manual workflow with tokenized payment-link creation, explicit adapter status, reconciliation, refund controls, and audit receipts.
- Patient portal account invitations/recovery, MFA/passkeys, authorized proxies, self-service scheduling, form completion, secure messaging, refill/referral requests, payments, exports/corrections, public assignment tokens, live email/SMS delivery, qualified electronic-signature vendors, identity-proofing adapters, and automated reminders; password authentication and same-patient released-record viewing are now connected through a separate patient principal and audit boundary
- Approved, BAA-reviewed production speech transcription; current push-to-talk uses the browser speech adapter with synthetic demo data only and stores no audio
- Clinical terminology services and validated quality-measure logic
- Certification, legal review, threat model, penetration test, accessibility audit, and clinical safety validation

The three original `zumi-server-*.js` files remain preserved as historical Zumi source snapshots and are not imported into ClinicOS.
