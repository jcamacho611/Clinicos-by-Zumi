# Klinikos Universe Pricing Fabric — Design

**Date:** 2026-09-02  
**Status:** approved design / implementation candidate  
**Governing authority:** `docs/KLINIKOS_MASTER_CANON.md`  
**Implementation truth:** current verified `main` and exact-head CI

## 1. Objective

Stripe must represent the economics of the **whole Klinikos operating network**, not just a clinic SaaS price page.

The pricing system must simultaneously:

- maximize adoption and network liquidity;
- create low-friction self-serve revenue;
- preserve premium clinic and enterprise economics;
- fund variable AI/API/communications/integration cost before Klinikos incurs it;
- support individual professionals as they progress from participant to independent business owner;
- support EDU, workforce, institutions, employers and resource owners;
- preserve Grid marketplace optionality without turning regulated care, referrals, credentials, clinical authority or PHI access into purchasable goods;
- keep every price versioned and classified so a target/scenario cannot silently become an active public promise.

## 2. Commercial ladder

The default lifecycle is:

`FREE IDENTITY / LIQUIDITY → PAID ACCELERATION → PROFESSIONAL BUSINESS → ORGANIZATION / CLINIC → ENTERPRISE / INSTITUTION → USAGE / MARKETPLACE EXPANSION`

A participant may move through several of these layers over time. Klinikos should capture more value as it creates more economic leverage, not by charging merely for presence.

## 3. Commercial states

Every Stripe-backed offer is classified as one of:

- `ACTIVE_PUBLIC` — approved, priced, and eligible for public/self-serve presentation.
- `ACTIVE_PRIVATE` — approved commercial anchor, but sold only through an authenticated, quoted, account-specific, or sales-led flow.
- `TARGET` — strategic pricing candidate allowed in sandbox/planning but not a production promise.

Non-purchasable universe classes never enter the Stripe catalog:

- person identity;
- credential truth;
- clinical authority;
- patient referral routing;
- PHI permissions;
- legal/policy clearance;
- eligibility itself.

Payment may fund a tool or entitlement, but it never overrides policy, scope, credential, consent, jurisdiction, tenant, clinical, privacy, claims, or record-release authority.

## 4. Individual / professional ladder

### Free Grid participation — $0

Purpose: maximize supply, density and discovery. Basic profile, credentials/claims display where authorized, availability, search, receive/decline offers.

### Grid Pro — $49/month — `ACTIVE_PUBLIC`

For people using Grid regularly. Adds saved availability/search, operating history, better workflow tooling and premium matching/productivity features. Payment must never buy eligibility.

### Grid Pro+ — $129/month — `ACTIVE_PUBLIC`

Replaces the ambiguous `$99–149/month` range with one self-serve anchor. For independent professionals managing their own book across multiple locations. Adds multi-site availability, client/rebooking continuity, agreement/payout history and more advanced operating tools.

### Professional Business — $249/month — `ACTIVE_PRIVATE`

A missing monetization layer between an independent professional and a full clinic organization. Designed for professionals who bring their own demand and need business infrastructure: customer/client continuity, scheduling, business operations, invoicing/payment visibility, resource/room orchestration, business analytics, advanced Zumi and launch/growth tooling.

This tier does **not** sell prescribing authority, clinical supervision, product custody, a professional corporation, a medical license, legal services, or permission to practice.

### Professional Launch Setup — $499 one-time — `ACTIVE_PRIVATE`

A bounded platform onboarding/setup service for a professional moving from worker to independent operator. It may configure Klinikos tools, workflow, profile, catalog, scheduling, documents and operating setup. Third-party filing, legal, accounting, insurance and regulatory costs remain separate.

## 5. Grid organization ladder

### Organization Free — $0

Free to publish approved capacity and receive eligible demand. This protects marketplace liquidity.

### Organization Pro — $299/month — `ACTIVE_PUBLIC`

For standalone organizations using Grid as an operating channel: offers, reservations, obligations, settlement records and priority operational tooling.

Qualifying Clinic OS subscriptions may bundle or credit this entitlement so Klinikos does not double-charge a clinic for the same capability.

### Organization Scale — $999/month — `TARGET`

For multi-location facilities, diagnostic networks, schools, employers, staffing/resource organizations and other higher-volume Grid participants requiring centralized rules, multiple locations, advanced reporting, API/integration capacity and operating controls.

This remains target pricing until entitlement and buyer-surface implementation are proven.

## 6. EDU ladder

### Klinikos EDU — free

Route mapping, basic simulation and progress record. Free entry feeds the workforce flywheel.

### EDU Plus — $29/month — `ACTIVE_PUBLIC`

A single self-serve anchor replacing the `$19–39/month` range. Full simulation library, competency tracking and placement-readiness tooling. Education evidence is not a license.

### Courses — $49–199/course

Course price remains item-specific; there is no universal Stripe price because content, instructor economics and depth vary. Individual courses receive their own versioned Stripe Prices when published.

### Pathway — $299 one-time — `ACTIVE_PUBLIC`

A default self-serve anchor within the existing `$199–499` range for a multi-step progression. A pathway may map requirements, simulation, evidence and readiness; it does not guarantee placement or create regulated-work eligibility.

### Institutional cohort seat — $200/learner — `ACTIVE_PRIVATE`

A private per-seat anchor for workforce boards, employers, colleges, schools and contracted cohorts. Program-specific scope, instructor time, custom content and public-procurement terms may alter the final quote.

### Institutional platform / workforce command — `TARGET / custom`

Recurring institution-wide EDU + placement + Grid + reporting configurations should remain sales-led until institution entitlements, reporting and implementation scope are fully productized.

## 7. Clinic / organization operating subscriptions

Preserve approved anchors:

- Clinic Operating Analysis — $500 one-time.
- Implementation Blueprint — $1,500 one-time.
- Founding Clinic Implementation — from $8,000.
- Klinikos Core — $995/month or $10,149/year.
- Klinikos Growth — $1,995/month or $20,349/year.
- Klinikos Scale — $3,995/month or $40,749/year.
- Klinikos Enterprise — custom.

Do not add a cheap `Launch` clinic tier merely to create another SKU. The $500 analysis / $1,500 blueprint already provide a lower-friction entry without weakening recurring positioning or increasing support burden on underpriced customers.

## 8. Add-ons and customer-funded cost

Approved/private anchors:

- Zumi Intelligence Plus — from $350/month.
- Revenue OS — from $750/month + from $2,500 setup.
- Network — from $300/month + from $1,000 setup.
- Premium connections — quoted per connection.

Prepaid usage packs:

- $250
- $500
- $1,000
- $2,500

Usage packs fund approved AI, voice, SMS, email, maps, document processing, storage, integration or other variable-cost buckets only after included allowances are exhausted. They are not unrestricted stored-value wallets and do not authorize arbitrary vendor spend.

## 9. Grid transaction economics

Do not encode a universal marketplace percentage in Stripe.

The existing server-owned resource-class policy remains authoritative:

- spaces/rooms — proposed capped percentage;
- equipment — proposed capped percentage;
- permitted products/supplies — proposed lower capped percentage;
- education — proposed capped percentage;
- non-clinical services — proposed capped percentage;
- professional/clinical staffing — proposed fixed fee, pending legal review;
- regulated clinical services — no transaction percentage under current policy;
- patient referrals — no transaction fee under current policy.

No fee-bearing Grid class becomes active merely because a Stripe Connect rail exists. Legal/policy clearance and a separately activated server policy are required.

## 10. Stripe architecture

### Self-serve

Use Stripe-hosted Checkout or governed Payment Links for approved low-complexity purchases. Prefer in-app server-owned Checkout when entitlement activation depends on authenticated identity/organization context.

### Recurring subscriptions

Use stable Stripe lookup keys, not hard-coded Price IDs as the commercial identity. Price changes create a new version while preserving historical evidence.

### Enterprise / sales-led

Use Quotes, Invoices and Subscription Schedules. Large implementation and institutional deals should not be forced through public one-click links.

### Customer lifecycle

Use Customer Portal for eligible self-service subscription management; keep product entitlement truth in Klinikos. Revenue recovery should use Stripe Smart Retries/automatic card updates plus Klinikos-owned status/evidence handling.

### Connect

Treat two money flows separately:

1. **SaaS payments for a clinic's own customers:** prefer connected-account direct charges when Klinikos later enables merchant payment acceptance.
2. **Grid marketplace settlement:** use Connect only for resource classes whose legal/policy/settlement model is cleared. Do not let Connect architecture decide healthcare legal structure.

## 11. Stable Stripe lookup-key law

Stripe-backed prices use stable semantic lookup keys such as:

`klinikos_<commercial_key>_<billing>_v1`

A changed amount creates `v2`; old prices remain historical rather than silently mutated.

Metadata must include at minimum:

- Klinikos commercial key;
- pricing version;
- classification;
- billing model;
- intended buyer class when useful.

## 12. Public-link law

A public link is allowed only when all are true:

- the price is `ACTIVE_PUBLIC`;
- the user can understand exactly what is purchased without negotiation;
- payment does not imply regulated authority;
- required identity/organization context can be obtained safely;
- post-payment behavior is truthful.

Static links may collect money automatically. They must not claim automatic entitlement activation when the current webhook/identity path cannot safely prove who should receive the entitlement.

## 13. Strategic surfaces deliberately not priced yet

The following are monetizable future surfaces but remain `TARGET`, custom, or usage-based until product/evidence is strong enough:

- enterprise/network intelligence;
- employer/workforce command;
- institution-wide EDU/placement operating systems;
- advanced credential-monitoring services;
- premium integrations and connector maintenance;
- network/API access;
- data/benchmark products using appropriately de-identified/aggregated data;
- international/cross-border network services;
- financing/capital services where licensing or referral rules may apply.

The absence of a public price is intentional. It preserves pricing power and avoids creating regulated or contractual obligations before the product and evidence support them.

## 14. Success criteria

The implementation is successful when:

1. one server-owned registry describes the broader pricing fabric;
2. free/non-purchasable classes cannot appear in Stripe-backed offers;
3. active/public vs private/target state is explicit;
4. current clinic anchors remain unchanged;
5. Grid Pro+, EDU Plus and Pathway have single default anchors instead of ambiguous ranges;
6. variable-cost execution has prepaid pack anchors;
7. Stripe sandbox contains matching versioned products/prices;
8. public Payment Links exist only for appropriate self-serve offers;
9. live-mode activation is performed only against the existing/authorized Klinikos live merchant account, not a duplicate account created for convenience;
10. GitHub exact-head verification passes before merge.
