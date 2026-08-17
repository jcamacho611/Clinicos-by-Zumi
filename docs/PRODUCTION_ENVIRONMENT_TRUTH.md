# KLINIKOS — PRODUCTION ENVIRONMENT TRUTH

Status: `AUTHORITATIVE RUNTIME-CONFIGURATION INDEX`
Updated: `2026-08-17T00:44:00-04:00`
Repository baseline: `main@527110de0e5732d7e2c74cbec13e31398de1c058`

This file records what is known about production environment configuration without storing or exposing secret values.

## Truth rules

1. `.env.example` is a configuration contract, not proof that a value exists in production.
2. Repository code, CI, or an adapter does not prove an external service is live.
3. `OPERATOR-REPORTED CONFIGURED` means the founder reported that the value was placed in Render; it still requires runtime verification before the related capability may be called `VERIFIED LIVE`.
4. `CREDENTIAL CREATED / RUNTIME UNVERIFIED` means the external vendor credential was created, but this document has no independent evidence that every required production variable is present in Render or that the adapter has succeeded at runtime.
5. Never commit secret values, API tokens, signing secrets, passwords, private keys, or webhook secrets.
6. Never print secret values in logs, PRs, screenshots, reports, or agent output.
7. PHI remains fail-closed unless the exact vendor, contract/BAA posture, workload, model/environment, security configuration, and governing Klinikos gate are independently approved.
8. Browser redirect/return state is never payment evidence.

## Current production environment inventory

| Capability | Environment variables / evidence | Current truth | Next gate |
| --- | --- | --- | --- |
| Application/database runtime | `DATABASE_URL`, `AUTH_SECRET`, seed/demo credentials were previously present in the Render service UI; exact values are secret | `OPERATOR-REPORTED / PREVIOUSLY OBSERVED PRESENT` | Continue runtime health, auth, backup, and security verification |
| Stripe live API access | `STRIPE_SECRET_KEY` | `OPERATOR-REPORTED CONFIGURED WITH LIVE-MODE SECRET` on 2026-08-16 | Build/verify real Stripe checkout + webhook evidence before calling direct processor flow live |
| Stripe test API access | `STRIPE_TEST_SECRET_KEY` | Founder reported deployment after instruction to preserve the test credential separately; do not rely on it unless runtime/config verification confirms presence | Add explicit test-mode use only where needed; production code must never silently fall back to test mode |
| Stripe webhook verification | `STRIPE_WEBHOOK_SECRET` | `PENDING` | Implement webhook endpoint, register live endpoint in Stripe, store `whsec_...` only in Render, verify signatures/idempotency/events |
| Stripe Connect / Grid payouts | `STRIPE_CONNECT_CLIENT_ID` plus Connect platform configuration | `PENDING` | Platform onboarding, legal/commercial review, connected-account flow, payout evidence/reconciliation |
| Stripe publishable key | No current required production variable in the existing server-owned payment contract | `NOT REQUIRED YET` | Add a dedicated public variable only if/when Stripe.js/Elements requires it; never expose `sk_...` |
| Cloudflare Workers AI | `ZUMI_PROVIDER=cloudflare`; `ZUMI_CLOUDFLARE_ACCOUNT_ID`; `ZUMI_CLOUDFLARE_API_TOKEN`; model configured as `@cf/meta/llama-3.1-8b-instruct-fast`; gateway ID may remain blank and use gateway `default` | `OPERATOR-REPORTED CONFIGURED`; PR #110 hardening merged; live inference still requires runtime proof | Run deliberate non-PHI production inference test and verify provider/model/failure behavior |
| Zumi PHI egress | `ZUMI_PHI_EGRESS_APPROVED` | `OFF / MUST REMAIN FALSE OR BLANK` | Separate vendor/BAA/security/workload approval before any PHI egress |
| Google Maps richer Grid path | `GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | `PENDING CONFIGURATION / OPTIONAL` | Google is not required for Grid launch; use only as a future paid adapter if justified |
| Grid keyless maps/geolocation | Browser Geolocation API + current OSM fallback; OpenFreeMap/MapLibre convergence is being handled separately | `BUILT BASELINE` | Continue privacy-reduced public coordinates and exact server-side eligibility; do not invent travel time |
| Twilio restricted API authentication | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET` | `CREDENTIAL CREATED / RUNTIME UNVERIFIED` — founder reported creating the restricted `SK...` API key on 2026-08-17; secret value is intentionally not recorded | Place the required variable values in Render if not already present; never paste them into chat/repo/logs; verify a controlled non-PHI call |
| Twilio Messaging Service | `TWILIO_MESSAGING_SERVICE_SID` | `PENDING` unless independently configured | Create/select an approved Messaging Service and complete US sender/A2P requirements where applicable before outbound production SMS |
| Twilio Verify | `TWILIO_VERIFY_SERVICE_SID` | `PENDING` unless independently configured | Create Verify service and run controlled phone-possession verification test |
| Twilio inbound webhook validation | `TWILIO_AUTH_TOKEN` | `NOT REQUIRED FOR CURRENT OUTBOUND API-KEY AUTH`; runtime presence unverified | Add only if an inbound Twilio webhook is implemented and needs Twilio signature validation; do not use as the normal outbound REST credential |
| Twilio PHI messaging | Contract/security/BAA posture plus message-content policy | `BLOCKED / FAIL-CLOSED` | Approve exact HIPAA-capable account/product configuration and minimum-necessary messaging before PHI-bearing SMS/voice |
| Transactional email | `RESEND_API_KEY` | `PENDING CONFIGURATION` | Domain verification, sending identity, privacy/PHI posture and adapter verification |
| Healthcare transactions | `STEDI_API_KEY`, `STEDI_MODE` | `SANDBOX CONTRACT EXISTS IN REPO; PRODUCTION PENDING` | BAA/enrollment/production credentials for eligibility/claims |
| Object storage | `OBJECT_STORAGE_*` | `PENDING PRODUCTION STORAGE` | Choose approved encrypted storage, IAM, retention, backups, BAA posture if PHI |
| Production database HIPAA posture | Neon project | Last inspected Neon project setting reported HIPAA mode disabled | Resolve before production PHI approval; do not infer compliance from application code |

## Stripe activation law

The production live Stripe secret being present means only that the server can potentially authenticate to Stripe. It does **not** mean the application has a verified live payment journey.

Required live-money chain:

`SERVER-OWNED PRODUCT / AMOUNT → STRIPE CHECKOUT OR PAYMENT INTENT → CUSTOMER PAYMENT → SIGNED STRIPE WEBHOOK / APPROVED PROCESSOR EVIDENCE → IDEMPOTENT PAYMENT-EVIDENCE RECORD → ENTITLEMENT / BOOKING POLICY → AUDIT / RECONCILIATION`

Until the webhook/evidence chain is implemented and verified, current manual GoDaddy/Stripe reconciliation paths remain manual-but-truthful rather than automated settlement truth.

## Communications law

Twilio is intended to provide the external communications rail for capabilities such as:

- appointment confirmations and reminders;
- follow-up and no-show recovery messages;
- Grid opportunity/offer/reservation notifications;
- staff/provider alerts;
- two-way SMS where product policy permits;
- account/phone verification through Twilio Verify;
- future voice/telephony workflows where separately approved.

The current preferred outbound authentication pattern is:

`TWILIO_ACCOUNT_SID + TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET`

A Messaging Service SID is additionally required for the first-party SMS sender implementation. The Twilio master Auth Token is not the normal outbound REST credential and should remain isolated to functions that actually require it, such as future inbound webhook-signature validation.

Do not place diagnoses, detailed clinical information, or unnecessary PHI in ordinary SMS/voice payloads. PHI-capable use requires the correct contractual/security posture and minimum-necessary message design.

## Maps law

Google Maps is an enhancement, not a Grid launch blocker. Existing browser geolocation + keyless mapping remains usable without Google credentials.

The current direction is a provider-neutral primary free mapping path with optional paid/geocoding/routing providers only when justified by real product need and customer-funded economics. Public map coordinates remain privacy-reduced.

## Required agent behavior

At the beginning of environment-dependent work, Codex/agents must read:

1. `docs/SOURCE_OF_TRUTH.md`
2. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`
3. `docs/PRODUCTION_ENVIRONMENT_TRUTH.md`
4. `docs/EXTERNAL_DEPENDENCY_MATRIX.md`
5. `.env.example`
6. the relevant specialist canon and implementation/tests

Agents must classify every external capability as one of:

`BUILT`, `CREDENTIAL CREATED / RUNTIME UNVERIFIED`, `OPERATOR-REPORTED CONFIGURED`, `MANUAL FALLBACK`, `ADAPTER READY`, `PENDING CONNECTION`, `BLOCKED`, or `VERIFIED LIVE`.

Never upgrade a credential/configuration claim to `VERIFIED LIVE` without actual runtime evidence.
