# KLINIKOS — PRODUCTION ENVIRONMENT TRUTH

Status: `AUTHORITATIVE RUNTIME-CONFIGURATION INDEX`
Updated: `2026-08-18 America/New_York`
Repository baseline at authoring: `main@f9ed11d15992b332abf17ee81d24e6ca34b00f17`

This file records what is known about production environment configuration without storing or exposing secret values.

## Truth rules

1. `.env.example` is a configuration contract, not proof that a value exists in production.
2. Repository code, a merged PR, CI, or an adapter does not by itself prove an external service is live.
3. `CREDENTIAL CREATED / RUNTIME UNVERIFIED` means a vendor credential is known to have been created, but the complete production environment and an actual vendor call have not been independently verified.
4. `OPERATOR-REPORTED CONFIGURED` means the founder reported that the value was placed in Render; it still requires runtime evidence before the capability may be called `VERIFIED LIVE`.
5. Never commit, print, log, screenshot, echo, or request secret values through ordinary chat.
6. PHI remains fail-closed unless the exact vendor, contract/BAA posture, workload, environment, security configuration, minimum-necessary policy, and governing Klinikos gate are independently approved.
7. Browser redirect/return state is never payment evidence.
8. An API credential proves only authentication potential. It does not prove message delivery, payment settlement, payout, HIPAA readiness, or production approval.

## Current production environment inventory

| Capability | Environment variables / evidence | Current truth | Next gate |
| --- | --- | --- | --- |
| Application/database runtime | `DATABASE_URL`, `AUTH_SECRET`, seed/demo credentials were previously observed in the Render service UI; exact values are secret | `OPERATOR-REPORTED / PREVIOUSLY OBSERVED PRESENT` | Continue runtime health, auth, backup, deployment-SHA, and security verification |
| Stripe live API access | `STRIPE_SECRET_KEY` | `OPERATOR-REPORTED CONFIGURED WITH LIVE-MODE SECRET` | Keep server-owned Checkout live-only; complete signed live-webhook setup and controlled real-money proof |
| Stripe test API access | `STRIPE_TEST_SECRET_KEY` | Founder reported preserving a separate test credential; runtime presence has not been independently verified | Keep explicit test mode isolated from production; never silently fall back |
| Stripe live webhook verification | `STRIPE_WEBHOOK_SECRET` + `POST /api/webhooks/stripe` | **CODE MERGED / PENDING EXTERNAL CONNECTION** for the established one-time rail. The live endpoint secret and intentional live-event proof remain separate runtime gates | Register the canonical production endpoint in Stripe Workbench, store only its live `whsec_...` in Render, then perform controlled live payment/refund proof |
| Stripe recurring Clinic OS subscriptions | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `KLINIKOS_STRIPE_RECURRING_ENABLED=true` | **BUILT / FEATURE-GATED / NOT VERIFIED LIVE**. Native monthly Checkout, signed `invoice.paid` renewal/activation, failed-invoice no-extension behavior, and signed subscription-deletion revocation are implemented. The explicit recurring gate defaults off | Configure the existing live webhook endpoint for `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted`; deploy the recurring code; run a controlled live subscription proof; only then set the recurring gate true in production |
| Stripe test webhook verification | `STRIPE_TEST_WEBHOOK_SECRET` | `PENDING / OPTIONAL FOR EXPLICIT TEST-MODE WORK` | Configure only for deliberate test-mode webhook work; never reuse the live endpoint secret |
| Stripe Connect / Grid payouts | `STRIPE_CONNECT_CLIENT_ID` plus Connect platform/account configuration | `PENDING CONNECTION` | Finish platform onboarding, connected-account flow, legal/commercial policy, fulfillment gating, payout evidence and reconciliation |
| Stripe publishable key | No public Stripe key is required by the current server-owned hosted Checkout implementation | `NOT REQUIRED` for current rail | Add a public key only if a future Stripe.js/Elements flow actually requires it; never expose an `sk_...` or restricted server key |
| Cloudflare Workers AI | `ZUMI_PROVIDER=cloudflare`, Cloudflare account/token/model variables; PR #110 merged | `OPERATOR-REPORTED CONFIGURED / RUNTIME PROOF STILL REQUIRED` | Run a deliberate non-PHI production inference test and verify provider/model/failure behavior |
| Zumi PHI egress | `ZUMI_PHI_EGRESS_APPROVED` | `OFF / MUST REMAIN FALSE OR BLANK` | Separate vendor/BAA/security/workload approval before any PHI leaves the governed local boundary |
| Grid primary interactive map | MapLibre GL JS + OpenFreeMap | **BUILT / MERGED** in PR #114; no Google or OpenFreeMap API credential required | Verify deployed browser behavior after the newest production deploy; continue CDN/supply-chain hardening when justified |
| Grid browser geolocation | Browser Geolocation API | **BUILT**: explicit user action only; deterministic Klinikos Haversine/radius logic remains authority | Runtime browser/mobile QA on deployed HTTPS surface; preserve permission-denied/unavailable states and public-coordinate reduction |
| Grid OSM fallback | OpenStreetMap embed | **BUILT FALLBACK** | Keep as truthful emergency fallback; do not treat public OSM infrastructure as a guaranteed SLA |
| Optional geocoding/routing | `GEOAPIFY_API_KEY` or another reviewed provider | `OPTIONAL / PENDING CONNECTION` | Connect only when address normalization, routes, travel distance, or Places-like features provide real value; keep Grid core functional without it |
| Google Maps adapter | `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | `OPTIONAL / NOT A LAUNCH DEPENDENCY` | Do not pursue Google billing merely to make Grid work. Enable only if later product economics justify a Google-specific capability |
| Twilio restricted API authentication | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` | **CREDENTIAL CREATED / RUNTIME UNVERIFIED**. Founder reported creating the restricted `SK...` API key; exact values are intentionally not recorded | Ensure required variables are stored only in Render/secret storage and run a controlled non-PHI provider call |
| Twilio outbound SMS implementation | Restricted API key + `TWILIO_MESSAGING_SERVICE_SID` | **CODE MERGED** in PR #119. Runtime sender readiness is still `PENDING` unless an `MG...` Messaging Service and permitted sender are actually configured | Create/select Messaging Service and sender; complete applicable US messaging/A2P requirements; run controlled non-PHI SMS proof |
| Twilio Verify implementation | Restricted API key + `TWILIO_VERIFY_SERVICE_SID` | **CODE MERGED** in PR #119. Runtime Verify service is still `PENDING` unless a `VA...` service is actually configured | Create Verify service and run controlled phone-possession verification proof |
| Twilio master Auth Token | `TWILIO_AUTH_TOKEN` | `NOT REQUIRED FOR CURRENT OUTBOUND API-KEY AUTH` | Supply only when a future inbound Twilio webhook/signature path specifically requires it; do not make it the ordinary outbound REST credential |
| Twilio PHI messaging | Contract/security/BAA posture + minimum-necessary content policy | `BLOCKED / FAIL-CLOSED` | Approve exact HIPAA-capable account/product configuration and BAA/security posture before PHI-bearing SMS or voice |
| Transactional email | `RESEND_API_KEY` | `PENDING CONFIGURATION` | Domain verification, sending identity, runtime proof, and PHI posture where applicable |
| Healthcare transactions | `STEDI_API_KEY`, `STEDI_MODE` | `SANDBOX CONTRACT EXISTS IN REPO / PRODUCTION PENDING` | BAA, payer enrollment/testing, and production credentials for eligibility/claims |
| Object storage | `OBJECT_STORAGE_*` | `PENDING PRODUCTION STORAGE` | Choose approved encrypted private storage, IAM, retention, backup/restore, and BAA posture if PHI |
| Production database HIPAA posture | Neon project | Last inspected setting reported HIPAA mode disabled | Resolve before production PHI approval; do not infer compliance from application code |
| GitHub Actions verification | Repository Actions | `EXECUTING` as of 2026-09-05: runners are allocated and jobs run to completion (verified 2026-09-05: 401 `main` runs and 2,464 total; the eight most recent `main` runs all succeeded, and PR runs 2394-2433 executed to real conclusions including genuine test failures). The August 2026 `steps:null` refusal condition recorded here is resolved. A run that executes no steps remains infrastructure evidence rather than a pass. | Keep recording exact-head run IDs as evidence; do not treat mergeable-state as CI-green |

## Stripe activation law

The existing one-time customer-payment rail uses the official Stripe SDK and the shared Klinikos Financial OS rather than a parallel payment ledger. Its chain remains:

`SERVER-OWNED PRODUCT / AMOUNT → COMMERCIAL CHECKOUT INTENT → STRIPE-HOSTED CHECKOUT → CUSTOMER PAYMENT → SIGNED STRIPE WEBHOOK → LIVE/TEST + TENANT + PRODUCT + AMOUNT + CURRENCY + SESSION/PAYMENT-INTENT CORRELATION → IDEMPOTENT PAYMENT EVIDENCE → PRODUCT POLICY / RECONCILIATION`

The one-time Stripe evidence set includes:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.refunded`

The recurring Clinic OS rail is deliberately separate from the one-time Clinic Operating Analysis connector. It uses server-owned monthly prices and this lifecycle:

`SERVER-OWNED CLINIC PLAN → STRIPE SUBSCRIPTION CHECKOUT → SIGNED invoice.paid → OPAQUE INTENT / STATE / PRODUCT / SUBSCRIPTION / CUSTOMER / AMOUNT / CURRENCY / PERIOD CORRELATION → CLINIC ORGANIZATION SHELL → VERIFIED COMMERCIAL PAYMENT EVIDENCE → SUBSCRIPTION ACTIVATION / RENEWAL → PERIOD ALLOWANCES → OWNER ACTIVATION LINK`

Recurring safety rules:

- `KLINIKOS_STRIPE_RECURRING_ENABLED` defaults off and must not be enabled merely because an `sk_live_...` key exists.
- The recurring webhook endpoint must be configured for `invoice.paid`, `invoice.payment_failed`, and `customer.subscription.deleted` before production enablement.
- Subscription metadata contains only opaque Klinikos correlation references and a product key; it must not contain PHI, clinic free text, or buyer contact data.
- `invoice.paid` is the money event that can activate or renew a monthly entitlement. `checkout.session.completed` alone does not.
- A failed invoice does not create a clinic organization and does not extend the paid period.
- Cancellation/deletion requires signed Stripe subscription evidence correlated to the existing external subscription.
- Unrelated Stripe account invoice/subscription events are acknowledged and ignored rather than causing retry storms.
- A Stripe checkout in `created` state never exposes the manual GoDaddy reconciliation control.
- Payment can activate software entitlement, but it cannot approve PHI, credentials, clinical authority, connectors, or deployment readiness.

The production webhook remains live-only. A browser return, success URL, query string, or Checkout Session creation cannot create payment truth. Stripe Connect payouts remain a separate dependency and cannot outrun customer payment, fulfillment, disputes/holds, or payout policy.

Neither Stripe rail is `VERIFIED LIVE` merely because the code is merged. Runtime verification requires the deployed canonical endpoint, correct live signing secret, intended event subscriptions, and controlled real-money evidence. For recurring billing, prove at least initial subscription payment, activation, a subsequent invoice lifecycle event, failed-payment behavior, and cancellation before calling automated recurring entitlement production-proven.

## Communications law

PR #119 is merged. The preferred Twilio outbound authentication contract is:

`TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET`

Outbound SMS additionally requires `TWILIO_MESSAGING_SERVICE_SID`. Phone-possession verification additionally requires `TWILIO_VERIFY_SERVICE_SID`.

The Twilio master Auth Token is not ordinary outbound authentication. Preserve it only for a capability that actually needs it, such as future inbound webhook-signature validation.

Klinikos may use the communications rail for approved non-PHI workflows such as generic account verification, generic operational notifications, appointment reminders designed under minimum-necessary rules, follow-up/no-show recovery, Grid offer/reservation notifications, and staff alerts. The existence of a Twilio sender does not itself authorize PHI. Do not place diagnoses, detailed treatment information, or unnecessary clinical data in ordinary SMS/voice payloads.

## Maps law

PR #114 is merged. The primary Grid map path is now:

`MapLibre GL JS → OpenFreeMap → explicit Browser Geolocation → Klinikos deterministic distance/eligibility`

No Google billing account or map API key is required for core Grid mapping or geolocation. OpenStreetMap remains the emergency embed fallback. Optional server-side geocoding/routing providers such as Geoapify may be connected later without becoming eligibility authority. Google remains an optional adapter only.

Public resource coordinates remain privacy-reduced. Exact governed coordinates may remain server-side where deterministic matching requires them. Straight-line Haversine distance is not travel time. No map provider may invent inventory, coordinates, routes, distances, or ETAs.

## Living Home / routing convergence law

PR #120 is merged. The approved PR #112 Living Home visual implementation remains authoritative. The stale Claude full-screen visual rewrite was deliberately not revived.

The valuable Claude behavior was recovered into a server-owned operating rail:

- destinations are filtered through role/workspace authorization;
- counts come from persisted work only;
- Grid offers must be live, unexpired and addressed to the active organization;
- open escalations and tasks are counted from stored truth;
- the live opportunity is `null` when nothing real is waiting;
- duplicate Grid/Network launch destinations are de-duplicated;
- the old role-template Opportunity section is suppressed at the dashboard composition boundary so it cannot compete with the real operating rail.

Historical Claude/Codex branches remain preserved for provenance but must not be mass-merged after their valuable behavior has been reconciled into current main.

## Required agent behavior

At the beginning of environment-dependent work, agents must read:

1. `AGENTS.md`
2. `docs/SOURCE_OF_TRUTH.md`
3. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
4. `docs/PRODUCTION_ENVIRONMENT_TRUTH.md`
5. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
6. `.env.example`
7. the relevant specialist canon and implementation/tests

Agents must distinguish at least:

`BUILT`, `CREDENTIAL CREATED / RUNTIME UNVERIFIED`, `OPERATOR-REPORTED CONFIGURED`, `MANUAL FALLBACK`, `ADAPTER READY`, `PENDING CONNECTION`, `BLOCKED`, and `VERIFIED LIVE`.

Never upgrade a credential/configuration claim to `VERIFIED LIVE` without actual runtime evidence. Never downgrade merged current architecture because an older branch or historical document is more detailed.