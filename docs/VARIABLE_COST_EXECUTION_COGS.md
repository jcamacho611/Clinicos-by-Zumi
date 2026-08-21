# Klinikos Variable-Cost Execution and COGS Control

Status: `CURRENT-MAIN ADOPTION MAP`
Evidence checked: 2026-08-20 America/New_York

## Economic invariant

A production feature that can create third-party variable cost must not silently spend
Klinikos money and hope to recover it later.

The intended execution sequence is:

`policy + authorization -> price/estimate truth -> reserve customer-backed funds -> provider side effect -> provider acceptance evidence -> actual-cost reconciliation -> settle reservation`

Provider rejection or a thrown request releases the reservation. Provider acceptance does
**not** turn the estimate into `actualCostCents`.

The existing commercial ledger already supports reservation, release, later settlement,
allowances, prepaid funds and bounded customer-authorized overage. The missing work is
adoption by each real variable-cost execution path.

## Current adoption matrix

| Rail / capability | Current execution truth | Cost unit | Customer-funded adoption | Next action |
| --- | --- | --- | --- | --- |
| Cloudflare Workers AI | Token usage returned by provider; explicit current-model rates now required | micro-USD from tokens | Provider cost visible to Zumi cognition budget; full tenant commercial-ledger bridge remains separate | Reconcile provider/model usage into tenant cost-to-serve reporting |
| OpenAI Responses | Token cost estimator exists; optional web-search rate can still be separately configured | micro-USD per token + tool call | Provider result exposes estimated cost; do not default paid tools to zero | Keep every enabled paid tool rate explicit and dated |
| Twilio patient SMS | Real provider side effect exists | SMS segments; destination/carrier fees vary | **First funded tenant execution path in this branch** | Configure conservative cents/segment; later reconcile invoice/billing evidence |
| Twilio Verify | Real provider side effect exists | verification attempt / destination dependent | Not yet customer-funded | Add a separate identity-verification reservation policy before scaling use |
| Resend email | Real provider side effect exists | pooled plan + sub-cent overage economics | Not yet customer-funded | Do **not** force through whole-cent per-message settlement; add batch/sub-cent allocation first |
| OpenFreeMap / browser geolocation | Core map path does not require a Klinikos API credential | shared/fixed infrastructure | No per-request customer reservation needed for current core map | Keep paid enrichment optional |
| Paid geocoding/routing | Optional / pending connection | provider request / route / geocode | Not yet live | Reserve from `maps` bucket before any future paid call |
| Eligibility / claims | Adapters/connectors exist; production external connection remains gated | transaction/API unit | Not yet live | Reserve from `eligibility`/`integrations` before production transaction |
| Telemedicine video | External production rail pending | minutes/participants/provider plan | Not yet live | Define cost contract before connection; use `telemedicine` bucket |
| Production object storage | External production storage pending | GB-month, operations, egress | Not yet live | Meter tenant storage and reconcile shared fixed + variable COGS |
| Stripe customer payments | Payment rail, not ordinary optional feature spend | processor transaction economics | Separate payment-evidence architecture | Record processor economics separately; never confuse payment verification with feature allowance |
| Grid payout settlement | Pending external payout rail | payout/processor economics | Separate marketplace financial policy | Keep platform fee, processor cost, payout and refund/dispute economics distinct |

## Twilio SMS reservation policy

The code intentionally does not hardcode retail provider pricing. Production must set:

```text
KLINIKOS_TWILIO_SMS_RESERVATION_CENTS_PER_SEGMENT=<positive integer cents>
```

The reservation estimator treats every message as Unicode for funding purposes:

- up to 70 characters -> one segment;
- longer messages -> 67 characters per concatenated segment.

This can over-reserve GSM-7 traffic, which is acceptable for a pre-execution funding
hold. It must never be presented as the provider invoice.

### Current public provider evidence, checked 2026-08-20

Twilio U.S. SMS pricing currently lists a base outbound SMS price of `$0.0083` per
segment for long code, toll-free and short-code traffic, before carrier fees. Carrier
fees vary and Twilio explicitly says prices can change. A 2-cent reservation per segment
is therefore a defensible **current U.S. operational buffer**, but it remains an operator
configuration, not a source-code constant.

Primary source:
- https://www.twilio.com/en-us/sms/pricing/us

## Why email is not wired through the same whole-cent reservation yet

Resend's current public Pro/Scale overage rate is `$0.90 / 1,000` emails, or `$0.0009`
per email before considering the fixed monthly plan. Reserving one whole cent per message
would overstate marginal overage by more than an order of magnitude and would create
false customer shortfalls.

Primary source checked 2026-08-20:
- https://resend.com/pricing/

Before tenant email is commercially gated per message, Klinikos should implement one of:

1. **batch reservation** (for example, reserve per 1,000-message block);
2. **sub-cent internal accounting** for low-unit-cost rails;
3. **fixed-plan allocation** where a shared monthly plan is apportioned to tenants by a
   documented accounting policy, with overage handled separately.

Do not call a monthly fixed plan `actual per-message cost`.

## Reconciliation states

Every variable provider execution should resolve to one of these economic states:

- `not_executed`: policy, funding or configuration blocked the call;
- `released_after_non_acceptance`: provider did not accept the request and the hold was released;
- `pending_actual_cost`: provider accepted; customer funds remain reserved until trustworthy cost evidence exists;
- `settled`: provider/invoice evidence produced defensible actual cost;
- `settled_with_overrun`: actual cost exceeded reserved + available customer-backed funding; commercial account requires review.

## Rollout order

1. Patient SMS, because organization/actor context and consent gates already exist.
2. Twilio Verify, after cost policy and ownership (clinic vs platform acquisition/security expense) are decided.
3. Eligibility/claims when production transaction rails are connected.
4. Paid maps/geocoding only when real Grid density justifies the expense.
5. Telemedicine once the exact vendor/contract/pricing unit is selected.
6. Email only after sub-cent/batch cost accounting exists.
7. Storage after a production storage provider and tenant-metering policy are verified.

## Guardrails

- Unknown provider cost is `UNKNOWN`, never zero.
- A free tier or shared credit does not make one tenant request free unless an explicit
  allocation policy says so.
- Authorization, PHI policy, consent, licensing, credentialing and clinical safety run
  before commercial funding where applicable. Payment never overrides safety.
- Commercial funding cannot prove delivery, clinical completion, payout or legal
  eligibility.
- Retry keys must be caller-supplied operation IDs, not derived from mutable text or PHI.
- Provider references may be used for reconciliation, but PHI must not be added to
  payment/provider cost metadata merely for accounting convenience.
