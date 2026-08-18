# Stripe live webhook endpoint evidence — 2026-08-18

Status: `EXTERNAL STRIPE ENDPOINT VERIFIED / RENDER SIGNING SECRET PENDING`

This evidence file records only non-secret production facts. It intentionally does not contain or reproduce the Stripe endpoint signing secret.

## Stripe account

- Account display name: `KLINIKOS.IO`
- Production account-level webhook endpoint exists in live mode.
- Endpoint status: `enabled`
- URL: `https://www.klinikos.io/api/webhooks/stripe`
- Description: `Klinikos production customer-payment evidence`
- Connect-wide delivery: disabled. This is the customer-payment account endpoint, not the Grid connected-account/payout webhook.
- The endpoint was changed from the non-`www` hostname after production evidence showed that hostname redirects to `www`. Stripe documents 3xx webhook responses as failed deliveries and instructs operators to configure the resolved destination directly.

## Enabled events

The endpoint is subscribed to exactly the events supported by the merged Klinikos customer-payment evidence rail:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `checkout.session.async_payment_failed`
- `payment_intent.payment_failed`
- `charge.refunded`

No wildcard/all-events subscription was used.

## Repository side

Current `main` contains `src/app/api/webhooks/stripe/route.ts`. The route:

- requires configured live webhook verification before accepting evidence;
- requires a `Stripe-Signature` header;
- verifies the untouched raw request body;
- is intentionally live-only;
- rejects test-mode events from the production endpoint;
- normalizes only supported evidence types;
- records evidence through the shared commercial/Financial OS repository rather than treating browser return state as payment truth.

## Remaining activation gate

The Stripe-side endpoint is no longer pending. The remaining customer-payment activation sequence is:

1. store the endpoint's live signing secret in Render as `STRIPE_WEBHOOK_SECRET` without exposing it in source control, chat, logs, screenshots, or PR text;
2. redeploy/restart the production application so the runtime sees the variable;
3. verify the deployed application is the current webhook-capable `main`;
4. initiate one controlled low-risk real Clinic Operating Analysis payment through the server-owned Checkout path;
5. confirm Stripe reports successful delivery to the final `www` endpoint without a redirect;
6. confirm Klinikos records idempotent processor evidence with exact amount/currency/tenant/session/live-mode correlation;
7. verify browser return alone never marks payment paid;
8. perform a controlled refund and verify refund evidence updates truth without triggering Grid payout state.

Until steps 1–8 are proven, customer payment is `BUILT + STRIPE ENDPOINT VERIFIED + RUNTIME SIGNING SECRET/TRANSACTION PROOF PENDING`, not `VERIFIED LIVE`.

## Separate Stripe Connect gate

This endpoint does not prove or activate marketplace/provider payouts. Stripe Connect onboarding, connected-account lifecycle, fulfillment/dispute policy, payout evidence, reconciliation, and any Connect webhook requirements remain a separate production dependency.
