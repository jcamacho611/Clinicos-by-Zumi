# KLINIKOS — PRODUCTION ENVIRONMENT TRUTH

Status: `AUTHORITATIVE RUNTIME-CONFIGURATION INDEX`
Updated: `2026-08-17 America/New_York`
Repository baseline: `main@a111ae4ec4c5dfc02bd2b4d376a5a1a60acffdc9`

This file records what is known about production environment configuration without storing or exposing secret values.

## Truth rules

1. `.env.example` is a configuration contract, not proof that a value exists in production.
2. Repository code, CI, or an adapter does not prove an external service is live.
3. `OPERATOR-REPORTED CONFIGURED` means the founder reported that the value was placed in Render; it still requires runtime verification before the related capability may be called `VERIFIED LIVE`.
4. Never commit secret values, API tokens, signing secrets, passwords, private keys, or webhook secrets.
5. Never print secret values in logs, PRs, screenshots, reports, or Codex output.
6. PHI remains fail-closed unless the exact vendor, contract/BAA posture, workload, model/environment, security configuration, and governing Klinikos gate are independently approved.
7. Browser redirect/return state is never payment evidence.

## Current production environment inventory

| Capability | Environment variables / evidence | Current truth | Next gate |
| --- | --- | --- | --- |
| Application/database runtime | `DATABASE_URL`, `AUTH_SECRET`, seed/demo credentials were previously present in the Render service UI; exact values are secret | `OPERATOR-REPORTED / PREVIOUSLY OBSERVED PRESENT` | Continue runtime health, auth, backup, and security verification |
| Stripe live API access | `STRIPE_SECRET_KEY` | `OPERATOR-REPORTED CONFIGURED WITH LIVE-MODE SECRET` on 2026-08-16 | Current candidate uses it only when the signed live-webhook secret is also configured; do not call the rail verified live until an actual payment is exercised |
| Stripe test API access | `STRIPE_TEST_SECRET_KEY` | Founder reported deployment after instruction to preserve the test credential separately; do not rely on it unless runtime/config verification confirms presence | Test mode is explicit and cannot fall back into the live checkout or webhook path |
| Stripe test webhook verification | `STRIPE_TEST_WEBHOOK_SECRET` | `PENDING / OPTIONAL FOR EXPLICIT TEST-MODE WORK` | Register a separate Stripe test-mode endpoint only when end-to-end test-mode webhook work is needed; never reuse the live signing secret |
| Stripe webhook verification | `STRIPE_WEBHOOK_SECRET` | Endpoint code is `BUILT IN CURRENT CANDIDATE`; production secret remains `PENDING` | Register `https://klinikos.io/api/webhooks/stripe` for only the supported live events, store its signing secret only in Render, then exercise signature/idempotency/amount/currency/mode evidence |
| Stripe Connect / Grid payouts | `STRIPE_CONNECT_CLIENT_ID` plus Connect platform configuration | `PENDING` | Platform onboarding, legal/commercial review, connected-account flow, payout evidence/reconciliation |
| Stripe publishable key | No current required production variable in the existing server-owned payment contract | `NOT REQUIRED YET` | Add a dedicated public variable only if/when Stripe.js/Elements requires it; never expose `sk_...` |
| Cloudflare Workers AI | `ZUMI_PROVIDER=cloudflare`; `ZUMI_CLOUDFLARE_ACCOUNT_ID`; `ZUMI_CLOUDFLARE_API_TOKEN`; model configured as `@cf/meta/llama-3.1-8b-instruct-fast`; gateway ID may remain blank and use gateway `default` | `OPERATOR-REPORTED CONFIGURED`; PR #110 hardening merged; live inference still requires runtime proof | Run deliberate non-PHI production inference test and verify provider/model/failure behavior |
| Zumi PHI egress | `ZUMI_PHI_EGRESS_APPROVED` | `OFF / MUST REMAIN FALSE OR BLANK` | Separate vendor/BAA/security/workload approval before any PHI egress |
| Google Maps richer Grid path | `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | `PENDING CONFIGURATION` | Create/restrict Google Cloud project/keys, enable only required APIs, create Map ID, verify browser/server restrictions |
| Grid keyless maps/geolocation | Browser Geolocation API + OpenStreetMap fallback | `BUILT` | Continue privacy-reduced public coordinates and exact server-side eligibility; do not invent travel time |
| Twilio communications / verification | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | `PENDING CONFIGURATION` | Create account/project, select number/Verify service, A2P registration for US messaging where applicable, BAA/approved PHI posture before PHI |
| Transactional email | `RESEND_API_KEY` | `PENDING CONFIGURATION` | Domain verification, sending identity, privacy/PHI posture and adapter verification |
| Healthcare transactions | `STEDI_API_KEY`, `STEDI_MODE` | `SANDBOX CONTRACT EXISTS IN REPO; PRODUCTION PENDING` | BAA/enrollment/production credentials for eligibility/claims |
| Object storage | `OBJECT_STORAGE_*` | `PENDING PRODUCTION STORAGE` | Choose approved encrypted storage, IAM, retention, backups, BAA posture if PHI |
| Production database HIPAA posture | Neon project | Last inspected Neon project setting reported HIPAA mode disabled | Resolve before production PHI approval; do not infer compliance from application code |

## Stripe activation law

The production live Stripe secret being present means only that the server can potentially authenticate to Stripe. It does **not** mean the application has a verified live payment journey.

Required live-money chain:

`SERVER-OWNED PRODUCT / AMOUNT → STRIPE CHECKOUT OR PAYMENT INTENT → CUSTOMER PAYMENT → SIGNED STRIPE WEBHOOK / APPROVED PROCESSOR EVIDENCE → IDEMPOTENT PAYMENT-EVIDENCE RECORD → ENTITLEMENT / BOOKING POLICY → AUDIT / RECONCILIATION`

The current candidate implements dynamic-method Stripe-hosted Checkout for the one-time Clinic Operating Analysis, raw-body signature verification, pending and asynchronous completion/failure evidence, byte-identical replay enforcement, amount/currency/tenant/live-mode correlation, out-of-order refund truth, and a truthful payment-return page through the shared Financial OS. It deliberately keeps using the GoDaddy/manual-reconciliation path until the live webhook signing secret is configured.

Repository and CI evidence do not establish live settlement. The Stripe rail remains `BUILT / PENDING CONNECTION`, not `VERIFIED LIVE`, until the candidate is deployed, the live endpoint is registered, the Render signing secret is configured, and one intentional live-mode payment plus signed webhook is observed and reconciled.

## Communications law

Twilio is intended to provide the external communications rail for capabilities such as:

- appointment confirmations and reminders;
- follow-up and no-show recovery messages;
- Grid opportunity/offer/reservation notifications;
- staff/provider alerts;
- two-way SMS where product policy permits;
- account/phone verification through Twilio Verify;
- future voice/telephony workflows where separately approved.

Do not place diagnoses, detailed clinical information, or unnecessary PHI in ordinary SMS/voice payloads. PHI-capable use requires the correct contractual/security posture and minimum-necessary message design.

## Maps law

Google Maps is an enhancement, not a Grid launch blocker. Existing browser geolocation + OpenStreetMap fallback remains usable without Google credentials.

Google configuration is for richer production mapping, markers, geocoding/Places/routing when justified by real supply and customer usage. Browser keys must be origin-restricted; server keys must be restricted by API and appropriate server controls. Public map coordinates remain privacy-reduced.

## Required agent behavior

At the beginning of environment-dependent work, Codex/agents must read:

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
3. `docs/PRODUCTION_ENVIRONMENT_TRUTH.md`
4. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
5. `.env.example`
6. the relevant specialist canon and implementation/tests

Agents must classify every external capability as one of:

`BUILT`, `OPERATOR-REPORTED CONFIGURED`, `MANUAL FALLBACK`, `ADAPTER READY`, `PENDING CONNECTION`, `BLOCKED`, or `VERIFIED LIVE`.

Never upgrade `OPERATOR-REPORTED CONFIGURED` to `VERIFIED LIVE` without actual runtime evidence.
