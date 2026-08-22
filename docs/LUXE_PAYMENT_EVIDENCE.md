# Luxe lead payment evidence

Status: **MANUAL RECONCILIATION READY / STRIPE PAYMENT + REFUND EVIDENCE ADAPTER READY / PUBLIC DEPOSIT CHECKOUT OFF BY DEFAULT**

This capability connects Luxe acquisition attribution to collected money without confusing estimated opportunity, booking state, redirect success, or browser state with payment evidence.

## Money states

Klinikos keeps these concepts distinct:

```text
estimated opportunity
!= booked estimated value
!= deposit checkout started
!= manually reconciled collected revenue
!= processor-verified collected revenue
!= processor-verified refund evidence
```

The acquisition dashboard may sum manual reconciliation and **net** processor verification into **Collected with evidence**, but it must preserve the manual/processor distinction. Signed Stripe refunds reduce processor-collected revenue rather than erasing the original payment record.

## Atomic payment evidence ledger

Migration:

`20260818180000_luxe_lead_payment_evidence`

Table:

`luxe_lead_payment_evidence`

The database enforces a unique key on:

`organizationId + provider + externalReference`

This prevents the same external payment reference from being attributed twice within one clinic even when concurrent requests race.

The evidence row contains:

- organization
- lead
- provider
- external reference
- integer cents
- USD currency
- payment kind
- evidence source
- verification method
- processor-verified boolean
- received timestamp
- actor
- reconciliation note
- created timestamp

No card number, CVV, authentication secret, bank credential, or processor token belongs in this table.

## Refund evidence ledger

Migration:

`20260818224500_luxe_lead_refund_evidence`

Table:

`luxe_lead_refund_evidence`

Refund evidence is intentionally separate from gross payment evidence. Stripe `charge.refunded` reports a cumulative refunded amount on a Charge, so the table has one unique row per:

`organizationId + provider + Charge externalReference`

The row is updated monotonically as the cumulative signed refund amount increases. Replayed/stale events cannot make the refund smaller or create duplicate refund revenue adjustments.

The refund ledger records:

- organization
- lead
- provider
- Charge reference
- related PaymentIntent reference when available
- cumulative refunded integer cents
- USD
- processor verification truth
- evidence source
- received timestamp
- audit note

A refund does **not** delete or rewrite the original payment evidence.

## Manual reconciliation

Authorized clinic owners/administrators can record evidence through:

`POST /api/luxe-medi/leads/:leadId/payment-evidence`

The route requires both:

- `crm:update`
- `luxe_medi:manage`

Current manual evidence requires:

- provider: GoDaddy Payments, Square, Stripe, cash, or other
- external reference
- positive integer amount in cents
- USD
- payment kind
- evidence source
- received timestamp
- explanatory note

The record is stored with:

```text
verificationMethod = manual_reconciliation
processorVerified = false
```

It therefore cannot masquerade as a webhook/processor verification.

## Stripe processor verification

Klinikos can create a server-owned Stripe Checkout Session for a Luxe deposit through:

`POST /api/public/luxe-medi/deposit/checkout`

The route requires the HttpOnly opaque Luxe acquisition journey cookie created after an accepted inquiry. The browser never receives the internal lead ID.

The Checkout Session carries only bounded server-created correlation metadata:

- sale mode = `luxe_deposit`
- opaque encrypted acquisition journey token
- server-owned expected amount in cents
- payment kind = `deposit`

The same metadata is copied to the Stripe PaymentIntent. Stripe copies PaymentIntent metadata to the created Charge as a one-time snapshot, which gives signed refund events the same opaque correlation without adding customer/clinical data to processor metadata.

No clinical details, diagnosis, chart data, medical history, card data, or raw patient record is sent for correlation.

A Stripe payment becomes processor evidence only after:

1. `POST /api/webhooks/stripe` receives the raw request;
2. Stripe's endpoint signature verifies with the configured live webhook secret;
3. the event is live mode;
4. the event is explicitly tagged as a Luxe deposit;
5. the signed amount matches the server-created expected amount metadata;
6. currency is USD;
7. the opaque journey decrypts to a current Luxe lead;
8. the payment outcome is successful.

Successful evidence is written with:

```text
provider = stripe
paymentKind = deposit
evidenceSource = stripe_webhook
verificationMethod = processor_verification
processorVerified = true
```

and the lead workflow payment state becomes:

`processor_verified`

That state proves money evidence only. It does **not** mark:

- booking confirmed
- appointment completed
- treatment eligible
- treatment completed
- provider payout settled

A high-priority booking-verification task remains/gets created so staff still confirms the actual appointment.

## Deposit checkout abandonment recovery

Creating a real Stripe Checkout Session also records:

`deposit_checkout_started`

when the acquisition database is available.

That event is **not payment evidence**. It records:

- Stripe Checkout Session ID
- server-owned deposit amount
- paymentVerified = false
- bookingVerified = false
- current booking state
- a timed human follow-up task

This lets Luxe recover customers who opened checkout but did not complete payment.

Revenue-first failure behavior is deliberate: if recording `deposit_checkout_started` fails after Stripe has already created a valid Checkout Session, Klinikos still redirects the customer to Stripe. Analytics failure must not destroy a legitimate payment opportunity.

## Manual → processor upgrade

A common operational sequence is:

```text
staff sees Stripe payment
→ manually reconciles it
→ signed webhook arrives later
```

The processor adapter does not count the same payment twice. When the existing Stripe reference belongs to the same Luxe lead, the signed webhook upgrades the manual evidence row to processor verification and corrects the amount to the signed processor amount if needed.

If the same Stripe payment reference is already attached to a different lead, automatic attribution stops and requires reconciliation rather than silently moving money between customers.

Concurrent/replayed webhook delivery uses the database unique constraint plus `ON CONFLICT` handling, so one payment cannot become multiple evidence rows through a race.

## Stripe refund verification

Signed `charge.refunded` events carrying the Luxe deposit correlation are routed to the Luxe refund ledger before the generic Klinikos commercial/entitlement rail.

Klinikos verifies:

- signed live event
- explicit Luxe deposit metadata
- valid opaque journey
- Charge currency = USD
- original Charge amount matches the server-owned expected deposit amount
- cumulative refund is positive and not greater than the original amount
- existing processor payment evidence, when already present, belongs to the same lead and amount

A partial refund updates the lead payment workflow state to:

`partially_refunded`

A full refund updates it to:

`refunded`

Neither state automatically marks the booking cancelled. Refund money truth and appointment truth remain separate.

The refund event creates/updates a high-priority human review task and records:

`payment_refund_verified_processor`

Processor refund replay is idempotent. Later `charge.refunded` events with a higher cumulative refund update the existing Charge refund row rather than adding the cumulative amount again.

## Public deposit activation

Immediate public deposit checkout is deliberately **disabled by default**.

Required configuration:

- `STRIPE_SECRET_KEY` — live `sk_live_` or restricted `rk_live_` key
- `STRIPE_WEBHOOK_SECRET` — live `whsec_` endpoint signing secret
- `LUXE_MEDI_JOURNEY_SECRET` — existing opaque acquisition journey encryption key
- `LUXE_MEDI_STRIPE_DEPOSIT_CENTS` — positive server-owned integer cents, currently bounded to $1.00–$10,000.00
- `LUXE_MEDI_STRIPE_DEPOSIT_PUBLIC_ENABLED=true` — explicit business approval before the public inquiry success state exposes checkout
- `LUXE_MEDI_STRIPE_DEPOSIT_LABEL` — optional customer-facing Stripe line-item label

Do not enable immediate public deposit collection merely because Stripe is technically configured. Luxe should first approve the business rule for when payment is allowed relative to availability/booking confirmation and confirm the operating process for refunds/customer support.

## Server-owned return URL

Stripe's success/cancel URL returns to:

`/luxe/consult?deposit=returned`

The origin is normalized through the existing Klinikos server-side checkout return-URL policy, using the configured application origin or the canonical production origin. It does not trust an attacker-controlled Host value as payment authority.

The query parameter is presentation context only and can be forged. The page therefore says only that the customer returned from secure checkout and that Klinikos will wait for signed processor evidence.

The redirect can never set:

`paymentStatus = processor_verified`

Only the signed webhook evidence path can do that.

## Lead timeline

Manual reconciliation appends:

`payment_reconciled_manual`

Processor payment verification appends:

`payment_verified_processor`

Processor refund verification appends:

`payment_refund_verified_processor`

Checkout creation may append:

`deposit_checkout_started`

Processor metadata explicitly preserves the evidence/event correlation and keeps booking verification separate.

## Audit

Every manual reconciliation records the user actor.

Every processor payment/refund verification records a system actor and includes the evidence/event correlation required to explain why payment state changed.

Raw Stripe webhook bodies are not copied into Luxe payment/refund evidence tables or lead-event metadata.

## Attribution analytics

The Luxe acquisition operations view reads gross payment evidence and signed cumulative refund evidence, then attributes **net collected revenue** through the existing lead acquisition fields:

```text
payment evidence
- refund evidence
→ lead
→ first-touch source
→ campaign
→ service interest
```

The view reports:

- manual reconciled revenue
- net processor-verified revenue after signed refunds
- total collected with evidence
- evidence-backed revenue by source
- evidence-backed revenue by campaign
- evidence-backed revenue by service

Processor net revenue is clamped at zero per lead if evidence arrives temporarily out of order; it never invents negative collected revenue.

It does not calculate ROAS until real ad spend is connected.

## UI

Authorized managers can open **Record payment evidence** on a lead inside:

`/luxe-medi/acquisition`

The form intentionally asks for reconciliation evidence rather than presenting a generic “mark paid” toggle.

When public Stripe deposits are explicitly enabled, the hosted Luxe inquiry success state may display the server-owned deposit amount and route through the server-created Stripe Checkout Session.

## Other processors

GoDaddy/Square adapters should write to the same evidence architecture with authenticated processor evidence and their own replay-safe external references.

A success-page redirect, booking email, customer statement, screenshot-free browser flag, or GoDaddy Conversations booking notification is not processor verification.

## Current boundary

This feature does not:

- initiate refunds (it records signed refund evidence after Stripe performs them)
- settle provider payouts
- prove a clinical service occurred
- prove an appointment occurred
- automatically cancel an appointment after a refund
- replace the financial/general ledger
- store payment-card data
- automatically enable public deposits

It exists to establish truthful acquisition-to-revenue evidence while keeping booking, payment, refund, fulfillment, and clinical authority separate.
