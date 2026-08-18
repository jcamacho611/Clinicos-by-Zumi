# Luxe lead payment evidence

Status: **MANUAL RECONCILIATION READY / PROCESSOR VERIFICATION ADAPTER PENDING**

This capability connects Luxe acquisition attribution to collected money without confusing estimated opportunity, booking state, or redirect success with payment evidence.

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

## Lead timeline

A successful evidence insert also appends a lead event:

`payment_reconciled_manual`

and updates the lead workflow `paymentStatus` to:

`manual_reconciled`

The authoritative amount remains the evidence ledger row. The lead status string is workflow context, not the financial ledger.

## Audit

Every manual reconciliation records:

- user actor
- lead
- evidence ID
- lead event ID
- provider
- external reference
- amount
- evidence source
- verification method
- processor-verification truth

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

The UI warns against placing sensitive payment credentials in the note.

## Processor verification next

Future GoDaddy/Square/Stripe adapters should write to the same evidence ledger with:

```text
verificationMethod = processor_verification
processorVerified = true
```

only after authentic provider-side evidence is validated.

A success-page redirect, booking email, customer statement, screenshot-free browser flag, or GoDaddy Conversations booking notification is not processor verification.

## Current boundary

This feature does not:

- move money
- issue refunds
- settle provider payouts
- prove a clinical service occurred
- prove an appointment occurred
- replace the financial/general ledger
- store payment-card data

It exists to establish truthful acquisition-to-revenue evidence while the authoritative payment connectors are still being wired.
