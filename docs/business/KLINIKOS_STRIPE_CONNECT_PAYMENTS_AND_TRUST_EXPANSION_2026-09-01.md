# Klinikos Stripe Connect, Payments & Trust Expansion — 2026-09-01

Status: `SANDBOX TARGET / SUBORDINATE TO MASTER CANON`

This specialist commercial supplement closes two monetization gaps discovered during the universe-wide Stripe review:

1. Klinikos can eventually monetize payment infrastructure provided to organizations through Stripe Connect without treating medical professional fees as a universal marketplace commission.
2. Klinikos can monetize credential/trust operations software without making credential truth, licensure, scope, or eligibility purchasable.

---

## 1. Klinikos Payments

Stripe sandbox product created:

`Klinikos Payments`

Classification: `TARGET_PRIVATE`

No fixed public Price is attached because the correct economics depend on the merchant/payment model and final Connect configuration.

### SaaS payment use case

When a clinic, practice, professional business, school, or other approved organization uses Klinikos software to accept payment from its own customer, the natural Stripe Connect design is a SaaS-platform flow using the connected business as the merchant of record where appropriate.

Potential Klinikos economics may include:

- application fee per transaction;
- platform pricing/processing markup where supported;
- recurring payments-feature subscription;
- payment-operations premium capability;
- instant-payout or other value-added financial feature economics where available and commercially appropriate;
- reconciliation/Financial OS subscription value.

This revenue is compensation for payment technology and operating infrastructure. It must not be described as a percentage of a clinical professional fee merely because the underlying business happens to provide healthcare.

### Marketplace payment use case

Grid may eventually use a different Connect charge architecture for permitted marketplace transactions:

- destination charge when one connected supplier receives proceeds automatically and no hold/split behavior is required;
- separate charges and transfers when one buyer payment must be split, held, or settled independently across permitted recipients;
- no marketplace payment rail for a resource class until the server policy classifies the transaction as permitted.

The platform must not assume one charge type for all Grid objects.

### Two-lane law

`CLINIC / MERCHANT CUSTOMER PAYMENT` and `GRID MARKETPLACE PAYMENT` are different commercial/payment contexts even if both use Stripe Connect.

Do not collapse them into one fee model.

---

## 2. Clinical-fee boundary

Klinikos should be aggressive about payment monetization while remaining precise about what is being monetized.

Potentially legitimate economic layers include:

- payment acceptance software;
- booking infrastructure;
- merchant dashboard/reconciliation;
- nonclinical room/equipment marketplace economics;
- business-service marketplace economics;
- professional software subscriptions;
- organization subscriptions;
- education;
- implementation;
- customer-funded usage;
- permitted marketplace transfer economics.

Do not automatically use:

- percentage of every medical professional fee;
- patient referral commission;
- prescriber referral commission;
- product resale commission for regulated drugs/devices;
- pay-for-credential status;
- pay-to-rank above hard eligibility.

Those categories require specific legal/policy support before implementation.

---

## 3. Proposed Connect architecture

### Clinic/business SaaS rail

Target pattern:

`KLINIKOS APP → CONNECTED BUSINESS → DIRECT CUSTOMER CHARGE → STRIPE PAYMENT EVIDENCE → KLINIKOS FINANCIAL OS`.

Preferred principles:

- connected business is merchant of record for its own customer sale where the model supports it;
- use modern Connect account configuration;
- use embedded onboarding/components rather than rebuilding country-specific onboarding from scratch;
- use Stripe-owned pricing/loss liability when using the recommended SaaS direct-charge model unless a later negotiated platform-pricing strategy justifies otherwise;
- Klinikos may collect an application/platform fee when permitted and economically justified;
- platform may add Radar for Platforms for additional monitoring;
- financial truth remains `charge ≠ payment ≠ payout ≠ settlement`.

### Grid marketplace rail

Target pattern:

`BUYER → KLINIKOS MARKETPLACE CHECKOUT → POLICY-ELIGIBLE CONNECTED RECIPIENT(S) → TRANSFER / PAYOUT`.

Principles:

- connected recipients must be eligible for transfers before money movement;
- platform bears the applicable marketplace risk/liability for destination/separate-charge models;
- Radar/platform risk controls required from launch;
- transfer is not proof that the underlying healthcare service was clinically authorized;
- Grid policy decides whether the resource class may use this rail at all.

---

## 4. Monetization experiments for Klinikos Payments

These are `SCENARIO`, not current public pricing.

### Option A — software-only

Organizations pay normal Klinikos subscription; Klinikos does not add transaction fee initially.

Use when payment capability is primarily a retention/feature wedge.

### Option B — flat platform fee

A small fixed application fee per successful payment.

Advantages:
- less likely to look economically tied to the professional service amount;
- simple customer explanation;
- predictable unit economics.

### Option C — percentage processing/platform markup

A bounded percentage or platform-pricing rule on merchant transactions where the legal/commercial model supports it.

Advantages:
- scales with payment volume;
- strong Financial OS revenue expansion.

Risks:
- must be clearly payment-technology economics;
- healthcare fee-splitting/professional-fee issues must be separated from the payment rail;
- card mix, processor fees, disputes, geography, and merchant risk affect margin.

### Option D — hybrid

Subscription includes a payment allowance or preferred rate, then higher-volume merchants move to negotiated platform pricing.

This is likely the strongest long-term enterprise model.

---

## 5. Trust & Credential Operations

Stripe sandbox product created:

`Klinikos Trust & Credential Operations`

Sandbox pricing target:

- **$399/month**;
- **$4,070/year**;
- **$1,500 starting setup**.

Classification: `TARGET_TEST`.

### What the customer pays for

- workforce credential inventory;
- expiration visibility;
- evidence/document organization;
- requirement mapping;
- role/site readiness views;
- missing-evidence work queues;
- renewal reminders;
- organization-level monitoring;
- audit preparation;
- deterministic eligibility inputs where authoritative source evidence exists;
- Zumi explanation/summarization around the deterministic state.

### What payment never buys

- a license;
- a credential;
- a favorable verification outcome;
- scope of practice;
- clinical authority;
- Grid hard eligibility;
- organization approval;
- supervision authority;
- immunity from disciplinary facts.

### Strategic packaging

Trust & Credential Operations may be:

- a standalone organization plan for employers/workforce programs;
- included in higher Clinic tiers;
- attached to Placement OS;
- attached to Grid Employer Access;
- included in Enterprise;
- bundled with implementation when credential operations are a major buyer pain.

Do not double charge without a clear packaging rule.

---

## 6. Additional monetization gaps to preserve for later testing

The following deserve future experiments but should not be promoted yet:

### EDU creator economy

Potential model:
- free creator entry;
- creator operating subscription;
- permitted revenue share on course sales;
- institutional licensing.

Gate: content-quality, credential-language, instructor authority, marketplace economics, and moderation policy.

### API / integration partner economy

Potential model:
- partner subscription;
- per-connection setup;
- usage-based API economics;
- enterprise connector agreements.

Gate: stable external API, security model, rate limits, support economics, developer terms, and disclosure/IP strategy.

### Instant-payout / financial convenience economics

Potential future value for eligible connected accounts if Stripe product availability and platform economics support it.

Gate: Connect account configuration, payout eligibility, user disclosure, economics, and financial-services policy.

### Patient premium

Potential optional consumer utility subscription for convenience/intelligence features, but **do not charge for basic access to the network or make healthcare access dependent on a premium plan**.

Gate: real patient-facing value, privacy/PHI readiness, consumer-protection review, and product evidence.

### Private compute / dedicated intelligence

Already represented as a quote-only sandbox target. No fixed recurring price until measured infrastructure economics exist.

---

## 7. Permanent payment law

> **Klinikos should monetize money movement where Klinikos genuinely provides payment infrastructure, but money must never buy clinical authority, credential truth, referral priority, or permission that law/policy controls.**

> **Use Stripe to move and reconcile money. Use Klinikos policy engines to decide whether the underlying action is allowed.**
