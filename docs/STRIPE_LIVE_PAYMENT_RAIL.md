# KLINIKOS — STRIPE LIVE PAYMENT RAIL

Status: `IMPLEMENTED IN REPOSITORY / EXTERNAL VERIFICATION PENDING`
Updated: `2026-08-17 America/New_York`

## Purpose

This rail gives Klinikos a direct processor path for server-owned one-time commercial checkout without weakening Financial OS truth.

The invariant remains:

`CHECKOUT REDIRECT != PAYMENT`

and:

`INTERNAL LEDGER STATE != EXTERNAL MONEY MOVEMENT`

## Current live chain

`SERVER-OWNED PRODUCT / PRICE`
→ `commercial_checkout_intent`
→ Stripe hosted Checkout Session
→ customer card payment
→ signed `checkout.session.completed` webhook
→ raw-body HMAC verification
→ live/test mode verification
→ server-owned amount/currency/product/mode re-check
→ idempotent `commercial_payment_events` evidence
→ existing Klinikos activation/reconciliation policy

A browser success or cancel return never creates payment evidence.

## Public webhook endpoint

```text
POST https://klinikos.io/api/webhooks/stripe
```

The Render fallback hostname may route to the same application, but the canonical Stripe production endpoint should use the canonical Klinikos domain when production routing is healthy.

## Stripe Workbench configuration

For the first live one-time rail, subscribe only to:

```text
checkout.session.completed
```

Do not select all events.

The endpoint secret shown by Stripe is stored only in the production secret environment as:

```text
STRIPE_WEBHOOK_SECRET
```

The live API secret is:

```text
STRIPE_SECRET_KEY
```

Optional explicit test-mode values are separate:

```text
STRIPE_TEST_SECRET_KEY
STRIPE_TEST_WEBHOOK_SECRET
```

Never commit or print the values.

## Live/test separation

- public commercial checkout never silently falls back to a test secret;
- the webhook verifies against separately configured live/test signing secrets;
- a signed event's `livemode` value must match the signing-secret mode;
- the originating Klinikos checkout intent stores its processor mode;
- processor evidence cannot satisfy an intent whose stored mode differs.

## Server-owned pricing

The customer/browser does not submit a trusted price to Stripe. The Checkout Session uses the price from the Klinikos commercial product catalog. The webhook then re-loads the originating server-owned checkout intent and requires exact amount and currency equality before payment evidence can apply.

## Privacy

Stripe metadata uses opaque Klinikos checkout correlation state and a non-clinical commercial product key only. Do not place patient identifiers, diagnoses, clinical details, credential documents, or other PHI in Stripe metadata/descriptions.

Buyer email may be provided to Stripe Checkout for the commercial purchase. Patient clinical data is not part of this commercial rail.

## Fallback behavior

Stripe becomes the primary one-time checkout rail only when both live API authentication and the live webhook signing secret are configured.

Until then, Klinikos keeps the existing exact-value GoDaddy/manual reconciliation flow for the Clinic Operating Analysis. This avoids accepting a payment through an automated processor path that Klinikos cannot prove.

Recurring Clinic OS subscription checkout remains on its existing flow until Stripe subscription lifecycle events, renewal, failure, cancellation, and entitlement policy are completed as a separate coherent slice.

## External completion gate

Repository implementation does not make Stripe `VERIFIED LIVE`.

Before that status is used, prove all of the following against the deployed production application:

1. the live Stripe account is active;
2. `STRIPE_SECRET_KEY` is the live secret in Render;
3. Workbench has the canonical webhook endpoint registered;
4. `STRIPE_WEBHOOK_SECRET` is the corresponding live endpoint secret in Render;
5. the deployed `/api/webhooks/stripe` endpoint accepts a correctly signed live event;
6. a small controlled real payment creates Stripe evidence in Klinikos;
7. the payment amount/currency/product match the originating server-owned checkout intent;
8. a browser return alone does not mark the purchase paid;
9. a duplicate event remains idempotent;
10. refund/cancellation policy is reviewed before broader automated entitlement use.

Stripe Connect/marketplace payouts remain a separate external dependency and must not be inferred from customer-payment success.
