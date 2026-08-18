# Luxe lead payment evidence

Status: **MANUAL RECONCILIATION READY / STRIPE PROCESSOR ADAPTER READY / PUBLIC DEPOSIT CHECKOUT OFF BY DEFAULT**

This capability connects Luxe acquisition attribution to collected money without confusing estimated opportunity, booking state, redirect success, or browser state with payment evidence.

## Money states

Klinikos keeps these concepts distinct:

```text
estimated opportunity
!= booked estimated value
!= manually reconciled collected revenue
!= processor-verified collected revenue
```

The acquisition dashboard may sum manual reconciliation and processor verification into **Collected with evidence**, but it must always preserve the split.

## Atomic evidence ledger

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

The same metadata is copied to the Stripe PaymentIntent. No clinical details, diagnosis, chart data, medical history, card data, or raw patient record is sent for correlation.

A Stripe event becomes processor evidence only after:

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

## Public deposit activation

Immediate public deposit checkout is deliberately **disabled by default**.

Required configuration:

- `STRIPE_SECRET_KEY` — live `sk_live_` or restricted `rk_live_` key
- `STRIPE_WEBHOOK_SECRET` — live `whsec_` endpoint signing secret
- `LUXE_MEDI_JOURNEY_SECRET` — existing opaque acquisition journey encryption key
- `LUXE_MEDI_STRIPE_DEPOSIT_CENTS` — positive server-owned integer cents, currently bounded to $1.00–$10,000.00
- `LUXE_MEDI_STRIPE_DEPOSIT_PUBLIC_ENABLED=true` — explicit business approval before the public inquiry success state exposes checkout
- `LUXE_MEDI_STRIPE_DEPOSIT_LABEL` — optional customer-facing Stripe line-item label

Do not enable immediate public deposit collection merely because Stripe is technically configured. Luxe should first decide the business rule for when a customer is allowed to pay relative to availability/booking confirmation and refund operations.

## Redirect truth

Stripe's success/cancel URL returns to:

`/luxe/consult?deposit=returned`

That query parameter is presentation context only and can be forged. The page therefore says only that the customer returned from secure checkout and that Klinikos will wait for signed processor evidence.

The redirect can never set:

`paymentStatus = processor_verified`

Only the signed webhook evidence path can do that.

## Lead timeline

Manual reconciliation appends:

`payment_reconciled_manual`

Processor verification appends:

`payment_verified_processor`

Processor metadata explicitly preserves:

- evidence ID
- Stripe event ID
- processor reference
- amount/currency
- processor-verification truth
- booking-verification = false
- whether manual evidence was upgraded
- booking-verification task reference

## Audit

Every manual reconciliation records the user actor.

Every processor verification records a system actor and includes the evidence/event correlation required to explain why the payment state changed.

Raw Stripe webhook bodies are not copied into the Luxe lead evidence table or lead-event metadata.

## Attribution analytics

The Luxe acquisition operations view reads collected revenue from the atomic evidence ledger and attributes it through the existing lead acquisition fields:

```text
payment evidence
→ lead
→ first-touch source
→ campaign
→ service interest
```

The view reports:

- manual reconciled revenue
- processor-verified revenue
- total collected with evidence
- evidence-backed revenue by source
- evidence-backed revenue by campaign
- evidence-backed revenue by service

It does not calculate ROAS until real ad spend is connected.

## UI

Authorized managers can open **Record payment evidence** on a lead inside:

`/luxe-medi/acquisition`

The form intentionally asks for reconciliation evidence rather than presenting a generic “mark paid” toggle.

When public Stripe deposits are explicitly enabled, the hosted Luxe inquiry success state may display the server-owned deposit amount and route through the server-created Stripe Checkout Session.

## Other processors

GoDaddy/Square adapters should write to the same evidence ledger with:

```text
verificationMethod = processor_verification
processorVerified = true
```

only after authentic provider-side evidence is validated.

A success-page redirect, booking email, customer statement, screenshot-free browser flag, or GoDaddy Conversations booking notification is not processor verification.

## Current boundary

This feature does not:

- issue refunds
- settle provider payouts
- prove a clinical service occurred
- prove an appointment occurred
- replace the financial/general ledger
- store payment-card data
- automatically enable public deposits

It exists to establish truthful acquisition-to-revenue evidence while keeping booking, payment, fulfillment, and clinical authority separate.
