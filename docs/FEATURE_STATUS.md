# Klinikos feature status

The point of this document is that no other document, page, or demo has to be
trusted. If something here is labelled BUILT and it does not work, that is a defect in
this file as much as in the code.

Last verified: 2026-08-11, on branch `claude/whop-portal-grid-marketplace-wdw811`.

## Status vocabulary

| Label | Meaning |
| --- | --- |
| **BUILT** | Implemented, tested, and working against real internal state. |
| **PARTIALLY BUILT** | Some paths work; named gaps remain. |
| **ADAPTER READY** | The interface, safety rules, and failure behaviour exist. No external service is connected, and the code says so rather than pretending. |
| **BLOCKED** | Cannot proceed in code. Waiting on a contract, credential, approval, or decision outside this repository. |
| **NOT BUILT** | Does not exist. |

## A note on branches

PRs #7, #8 and #9 are merged. `main` builds: the Prisma schema is restored and carries
183 models, and the quality workflow (type-check, lint, tests, production build) runs on
every pull request.

Active work continues on `claude/whop-portal-grid-marketplace-wdw811`, which carries the
paid-access layer, the connector architecture, the Growth Engine, and payment-driven
provisioning on top of `main`.

## Zumi — the AI layer

| Capability | Status | Notes |
| --- | --- | --- |
| Admission policy (prohibition, catalog, tenant, permission, entitlement, availability) | **BUILT** | Pure and fully tested. `src/features/zumi/policy.ts` |
| Prohibited-capability list | **BUILT** | Nine capabilities refused before any other check. No flag unlocks them. |
| Governed recommendation contract | **BUILT** | Evidence required; tier-derived human review; failing output dropped, not repaired. |
| Egress redaction | **BUILT** | Scrub, drop sensitive keys, re-check, abandon on survival. Scrubs responses too. |
| Provider registry + health states | **BUILT** | Fails closed. Kill switch. No silent substitution. |
| Usage metering + AI audit (`ZumiInvocation`) | **BUILT** | Written on every path including refusals. Stores no prompt text or output. |
| Entitlement resolution | **BUILT** | From `ClinicSubscription.modules`; expired windows do not entitle. |
| `GET`/`POST /api/zumi` | **BUILT** | Body cannot name an organization, role, entitlement, or review posture. |
| **A model provider** | **ADAPTER READY** | No adapter registered. Every request refuses with 503 and "Pending Connection". |
| PHI to a model provider | **BLOCKED** | Requires an executed BAA *and* `ZUMI_PHI_EGRESS_APPROVED`. Redaction is not a substitute. |
| Streaming responses | **NOT BUILT** | |
| Retry policy | **NOT BUILT** | Retrying an un-idempotent governed call needs a decision, not a default. |
| Live provider health probing | **NOT BUILT** | `HEALTHY`/`DEGRADED` are declared but never assigned. |
| Prompt evaluation harness | **NOT BUILT** | Output structure is enforced; reasoning quality is not measured. |

Full detail: `docs/ZUMI.md`.

## Klinikos EDU — Virtual Clinic Lab

| Capability | Status | Notes |
| --- | --- | --- |
| Data model + migration (16 models) | **BUILT** | `20260810160000_klinikos_edu_foundation` |
| Safety boundaries (synthetic-data labels, credential disclaimer, AI limits) | **BUILT** | One module; retyped disclaimers drift. `src/lib/edu/edu-safety.ts` |
| Student-facing scenario projection | **BUILT** | `projectScenarioForStudent` is the only function permitted to build a student view. Drops the answer key, expected sequence, critical misses, instructor notes, AI prompts, and the `isProblem` / `requiresEscalation` flags. |
| Roles, navigation, session shape | **BUILT** | |
| Public `/edu` landing | **BUILT** | Under copy law. |
| Lab surfaces (dashboard, courses, cohorts, scenarios, grading, competencies, settings) | **PARTIALLY BUILT** | Read paths render from the model. The scenario run console is wired end to end; the instructor grading surface is not — grading works over the API only. |
| Scenario run console (student UI) | **BUILT** | Start, record actions, attach evidence, hand in. Server refusals are shown as written rather than replaced with a generic error. |
| Submission lifecycle + student write path (`POST /api/edu/submissions`) | **BUILT** | Start, append-only evidence timeline, evidence attachment, submit. Ownership checked for every role, so an instructor cannot do a student's work. Lateness recorded, never blocked. |
| Grading + release (`POST /api/edu/grades`) | **BUILT** | Separate route from the student path, so no student-reachable handler can write a grade. A total that disagrees with its criterion breakdown is rejected. An assistant may assess but not release. A released grade is not silently overwritten. |
| Student view of a grade | **BUILT** | An unreleased grade is not partially visible. Release discloses whether an AI draft informed it. |
| Competency marking and certificates | **NOT BUILT** | Models exist; no write path. |
| EDU AI features | **ADAPTER READY** | Gated on the Zumi gateway; inert and labelled Pending Connection. |
| LTI 1.3 / institutional SSO | **BLOCKED** | Needs credentials and a school agreement. |
| FERPA review | **BLOCKED** | Outside code. |

Spec: `docs/KLINIKOS_EDU_PRODUCT_SPEC.md`.

## GRID

| Capability | Status | Notes |
| --- | --- | --- |
| Public marketplace discovery (`/grid/browse`, listing detail) | **BUILT** | Filters, facets counted against every *other* filter, verified-first sort, availability. |
| Verification presentation rules | **BUILT** | "In review" requires an actual submission — the malpractice column default no longer flatters an untouched draft. |
| Marketplace synthetic-data notice | **BUILT** | Listings are demonstration data and say so on every card. |
| Operator GRID workspaces (requests, providers, locations, services, availability, payouts) | **PARTIALLY BUILT** | Surfaces and APIs exist; payouts do not move money. |
| Contractor enrollment | **PARTIALLY BUILT** | `/grid/join` exists; `/grid/join/contractor`, `/location`, `/seller` do not. |
| Admin credential verification queue | **PARTIALLY BUILT** | Human review workflow exists; no external verification source. |
| Provider licence verification against state boards | **BLOCKED** | Needs a vendor or board access. |
| Malpractice verification | **BLOCKED** | Needs a verification partner. |
| Marketplace payouts | **BLOCKED** | Needs Stripe Connect credentials and platform terms. |
| Maps / geocoding / routing | **ADAPTER READY** | Key surface exists; no key configured. |

## Payments and access

| Capability | Status | Notes |
| --- | --- | --- |
| Whop webhook: signature verification, append-only ledger, idempotent redelivery | **BUILT** | Fails closed with no secret configured. Rejected deliveries are recorded without the unauthenticated payload. |
| Access payment intent, server-controlled pricing | **BUILT** | The schema deliberately excludes `amountCents` — the original shape would have let a buyer set their own price. |
| Entitlement evaluation | **BUILT** | Revoked, expired, and grace states are distinct; an expired window does not entitle whatever the status column says. |
| Payment-driven provisioning | **BUILT** | Verified webhook → organization → subscription → modules → onboarding. Idempotent on the payment's own identity, per-step state so a failed run resumes, and connections plus regulated review are left blocked with the reason attached rather than faked complete. |
| Post-purchase status (`/welcome`) | **BUILT** | Reads from the signed-in session, never a query string. Shows blocked steps as blocked. |
| Operational Audit checkout | **BUILT** | Wired to the payment link, details captured before checkout opens. Opening the page is never treated as payment. |
| Automatic audit payment confirmation | **NOT BUILT** | The paylink has no webhook back to Klinikos, so audit payments are reconciled by a person. |
| Whop production credentials | **BLOCKED** | No `WHOP_WEBHOOK_SECRET`, so the webhook rejects everything and nothing provisions. |
| Stripe | **ADAPTER READY** | Keys declared in `.env.example`; nothing connected. |

## Platform surfaces

| Capability | Status |
| --- | --- |
| Auth, sessions, RBAC across 38 resources | **BUILT** |
| Multi-tenant isolation by `organizationId` | **BUILT** |
| Authorization contract test over every API method | **BUILT** |
| Patients, appointments, encounters, documents, forms, labs, imaging, medications, tasks, cases, referrals, network | **PARTIALLY BUILT** — surfaces and rules exist; several are read-heavy |
| Design system (OKLCH tokens, DS primitives, Zumi orb) | **BUILT** — adherence enforced by test |
| Design law (surface classification, motion budget, copy law) | **BUILT** — enforced by test over governed public surfaces |
| Command Center, Inbox, Follow-up engine, Revenue Recovery, Operating Map, Owner Brief, Command Palette, Notifications, Automations, Feature flags | **NOT BUILT** |
| Migrating existing surfaces onto `DsSurface` + DS primitives | **PARTIALLY BUILT** — new surfaces only |

## Growth Engine — the pre-payment half

| Capability | Status | Notes |
| --- | --- | --- |
| Public conversion site | **BUILT** | `/`, `/how-it-works`, three `/solutions/*`, `/zumi`, `/demo`, `/pricing`, `/operational-audit`, `/contact`, `/referral/:code`, `/welcome`. All registered under copy law. |
| Zumi demonstration and guided tour | **BUILT** | Scripted, fixed content. No input field, no AI-gateway call, no account created. |
| First-party intent tracking | **BUILT** | Closed event enum, prospect resolved from a cookie rather than the request body. No third-party tracker or pixel. |
| Lead capture | **BUILT** | No free-text field anywhere in the schema, so the form cannot carry PHI. Phone optional. |
| Lead scoring and bands | **BUILT** | Each event type counts once; return visits score; an abandoned checkout is never penalised. Priority list capped at twelve. |
| Follow-up sequences | **BUILT (rules)** | Lifecycle, timing, supersession, and unsubscribe are implemented and tested. **No sender is wired** — see below. |
| Sending follow-up email | **ADAPTER READY** | Needs Resend (or an approved vendor) with a verified sending domain. Nothing sends today. |
| Referral attribution and commission | **BUILT (rules)** | First-touch, 90-day window, integer basis points floored, unpayable until settled. Partner admin surfaces are **NOT BUILT**. |
| Founder acquisition dashboard | **BUILT** | Gated on `sales:manage`. Pipeline is a stated floor, not a forecast. |
| Public endpoint rate limiting | **PARTIALLY BUILT** | Per-process and in-memory. Under horizontal scale the effective limit multiplies by instance count and resets on deploy. A shared store is required before it is a security control. |

## Connector architecture

| Capability | Status | Notes |
| --- | --- | --- |
| Five-axis classification (gateway, integration, ownership, economics, readiness) | **BUILT** | Nine independent readiness gates; an unspecified gate is false. |
| Connector catalog | **BUILT** | Every connector carries its concrete external gate. |
| Any connector actually live | **BLOCKED** | All nine gates are false on every connector, and a test asserts none reports production- or PHI-usable. |

## Claims this product does not make

None of the following are true, and no surface may state otherwise:

- Klinikos is **not** a certified EHR.
- Klinikos is **not** HIPAA compliant by virtue of its code. Compliance is a
  deployment, contractual, and operational property.
- No lab, clearinghouse, eligibility, e-prescribing, or payer integration is live.
- No provider licence or malpractice credential is verified against an external
  source. Verification state shown in GRID reflects human review inside Klinikos only.
- A marketplace listing is not a Klinikos endorsement.
- No payment is verified by a browser redirect.

## External dependencies that cannot be resolved in code

AI provider contract and BAA · Whop credentials · Stripe and Stripe Connect ·
Render deployment and GoDaddy DNS for klinikos.io · school agreements and FERPA
review for EDU · LTI 1.3 / SSO credentials · lab, clearinghouse, and eligibility
vendor credentials · counsel review of credential and verification wording ·
accessibility audit · logo vector.

Detail: `docs/EXTERNAL_DEPENDENCY_MATRIX.md`.
