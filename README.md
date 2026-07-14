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
- Lab and imaging review queues
- Billing, claims, denials, balances, and insurance verification
- No-fault and workers' compensation case operations
- Quality measures, care gaps, and outreach
- Secure-message, task, and escalation workspaces
- Same-page AI safety-routing simulator
- Patient portal preview
- Integration roadmap and organization audit settings

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

Open `http://localhost:3000`. Authentication, patient charts, scheduling, and encounters require the PostgreSQL database configured by `DATABASE_URL`; the remaining workspaces still use explicit fake demonstration fixtures while their repositories are implemented.

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

[`prisma/schema.prisma`](./prisma/schema.prisma) defines multi-tenant organization, identity, patient, scheduling, clinical, document, lab, imaging, revenue-cycle, insurance, case, quality, communication, AI-governance, audit, settings, integration, and API-key records.

Patient, appointment, and encounter reads are implemented through server-only Prisma repositories. Every base and related query requires `organizationId`, and API responses are marked private/no-store where appropriate. Appointment transitions and encounter draft/review/sign-lock mutations use guarded tenant filters, lifecycle checks, and audit records. The chart, dashboard, front desk, provider panel, schedule, encounter worklist, and editor now consume those repositories. Remaining modules still need the same repository boundary. Before production use, add database-level row security or equivalent defense in depth, immutable external audit storage, encrypted object storage, key management, backups, disaster recovery, retention policies, and formal migration review.

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
- Authorization enforcement for modules beyond the currently protected patient, appointment, encounter, and workflow routes
- Encounter creation, diagnosis/procedure editing, addenda, and database-backed modules beyond patient/scheduling/encounter workflows
- BAA-backed infrastructure and formal HIPAA security/privacy program
- Encryption/key-management controls and private object storage
- Lab, imaging, payer, clearinghouse, e-prescribing, and telemedicine integrations
- Production payment and communication webhooks
- Clinical terminology services and validated quality-measure logic
- Certification, legal review, threat model, penetration test, accessibility audit, and clinical safety validation

The three original `zumi-server-*.js` files remain preserved as historical Zumi source snapshots and are not imported into ClinicOS.
