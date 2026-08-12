# Klinikos Pricing + Monetization + Gating Master Directive

## Mission
Build Klinikos commercial architecture to maximize durable lifetime value without blocking adoption, creating misleading access claims, fronting unbounded vendor costs, or allowing payment to bypass healthcare governance.

The product is not a commodity $99 SaaS dashboard. Klinikos combines implementation, recurring operating software, customer-funded variable usage, premium modules, integrations, Grid network economics, and enterprise contracts.

## Commercial doctrine
1. Monetize outcomes, implementation, recurring access, expansion, usage, transactions, and enterprise complexity separately when they create distinct value or cost.
2. Keep the first paid decision easy: $500 Clinic Operating Analysis. Credit it forward when the buyer proceeds quickly so it feels like the first step of implementation rather than a sunk consulting fee.
3. Never give a broad production free trial that can create PHI, connector, AI, communications, eligibility, or other vendor expense. Unpaid demo access must be synthetic and capped.
4. Production access requires confirmed commercial state. External variable-cost work requires funded allowance, prepaid balance, or bounded authorized overage before vendor execution.
5. Payment never overrides authentication, tenant scope, RBAC, credentialing, clinical policy, privacy, consent, fee-splitting rules, or human-review requirements.
6. Keep Grid supply acquisition cheap. Charge for premium tools and successful value creation rather than forcing every participant into a subscription before network liquidity exists.
7. Public pricing should be simple enough to understand in under a minute. Internal pricing logic can be sophisticated.
8. Preserve provider neutrality. Customer buys Klinikos outcomes and allowances, not a specific infrastructure vendor.

## Canonical clinic funnel
Public site -> Pricing / See if your clinic qualifies -> $500 Clinic Operating Analysis -> $1,500 Implementation Blueprint when needed -> implementation proposal -> implementation payment -> recurring subscription activation -> add-ons / usage / expansion.

Credits:
- $500 analysis: 100% credit toward blueprint or qualifying implementation when proceeding within 30 days.
- $1,500 blueprint: 100% credit toward qualifying implementation when proceeding within 30 days.
- Credits are commercial concessions, not cash refunds, and remain subject to human review and written terms.

## Clinic plan architecture
### Klinikos Core — $995/month
Implementation from $8,000.
Target: independent/small clinics.
Core operations, scheduling/front desk, tasks/follow-up, forms/documents, baseline Zumi, owner operating view.

### Klinikos Growth — $1,995/month
Implementation from $12,500.
Target: growing multi-provider clinics.
Adds Revenue workflows, Network/referrals, advanced automation, expanded Zumi allowance, priority implementation support.

### Klinikos Scale — $3,995/month
Implementation from $20,000.
Target: multi-provider/multi-location groups.
Adds multi-location controls, expanded reporting, higher allowances, advanced integration planning, named operating review.

### Klinikos Enterprise — custom
Implementation from $30,000.
Target: large groups, institutions, networks, complex governance/integration requirements.

Annual contracts may be offered at approximately 15% below twelve monthly payments when strategically useful. Do not automatically discount implementation or pass-through vendor costs.

## Add-ons and expansion
- Zumi Intelligence Plus: from $350/month plus customer-funded usage above allowance.
- Revenue OS: from $750/month; setup from $2,500.
- Network: from $300/month; setup from $1,000.
- Premium integrations: quoted per connection; setup, recurring connection, and pass-through charges can be distinct.
- Usage packs: prepaid, server-metered, non-authorizing beyond purchased scope.
- Extra locations, capacity, storage, high-volume communications, enterprise identity, migration, and specialized workflows: expansion pricing, not silently absorbed into base plans.

## Grid launch economics
Network liquidity comes first.

### Professional
- Basic verified profile: $0
- Pro: $39/month
- Launch midpoint completed-transaction platform fee: 10%, subject to resource-class policy and legal review.

### Facility
- Join/list basic eligible capacity: $0
- Facility Pro: $99/month
- Launch midpoint completed-booking platform fee: 10%, subject to resource-class policy and legal review.

### Seller
- Join/basic eligible listing: $0
- Seller Pro: $49/month
- Launch midpoint completed-transaction platform fee: 10%, subject to resource-class policy and legal review.

Do not hardcode 10% as a universal healthcare fee. The server must support class-specific percentage fees, flat/minimum fees, processor recovery, refunds, negotiated enterprise terms, and zero-fee classes where law or strategy requires them. Clinical/professional fee splitting requires counsel review before launch in each applicable structure/jurisdiction.

## Gate placement law
Commercial checks belong server-side at consequential execution boundaries, not merely in buttons.

### Subscription gate
Core authenticated production workspaces require active qualifying subscription/contract state, except explicit synthetic demo or approved pre-sale environments.

### Entitlement gate
Modules/add-ons require the purchased entitlement even if the organization has a valid subscription.

### Variable-cost gate
Before AI, voice, SMS, maps, OCR/document processing, eligibility, premium data, external telemedicine, or other variable-cost vendor execution:
1. product/safety policy passes;
2. auth/tenant/RBAC passes;
3. subscription + entitlement passes;
4. reserve funded allowance/prepaid/authorized overage atomically;
5. call vendor;
6. meter actual cost;
7. reconcile reservation;
8. audit.

### Connector gate
Paid entitlement is not proof of a connected integration. Required contract, credential, BAA, configuration, and readiness checks must independently pass.

### Capacity gate
Seats, providers, locations, storage, high-volume usage, Grid listings, and other contracted capacity must be enforced server-side.

### Transaction gate
Grid offers/bookings/reservations/fulfillment/payout transitions re-check eligibility, capacity, payment/funding, and policy at the consequential transition.

## Upgrade UX
Never return a generic paywall when a specific reason is known. Distinguish:
- payment required
- subscription inactive
- upgrade required
- add-on required
- included allowance exhausted
- prepaid funds required
- bounded overage exhausted
- connection/contract pending
- governance/policy blocked

Never show a purchase CTA for an action that remains prohibited after payment.

## Pricing placement
Use the canonical commercial module as the source of truth. Public surfaces should consume it rather than duplicating dollar strings.
Required surfaces:
- /pricing: clinic plans + implementation + add-ons + annual option + audit entry point
- /founding-clinic: analysis -> blueprint -> implementation progression
- /grid/pricing: Professional / Facility / Seller entry + Pro + transaction economics
- /sales and /start: route to the correct paid or qualification step
- authenticated billing/settings: current plan, allowances, prepaid funds, add-ons, usage, upgrade/top-up actions
- feature execution boundaries: server-side gates with reason-specific upgrade responses
- integration catalog: included/add-on/setup/recurring/pass-through/contract/BAA/readiness state

## Margin protection
Track contribution margin by organization and product surface: subscription revenue, implementation, add-ons, transaction fees, usage packs, vendor/API cost, communications, AI, infrastructure allocation, payment costs, refunds/disputes, integration cost, support/implementation load.
Do not lower price because a competitor is cheaper if Klinikos is replacing multiple products or operational labor. Sell the economic outcome.

## Evidence used for V1 positioning
Market research in August 2026 shows a wide spectrum: Jane publishes low-cost practice-management subscriptions, while DrChrono uses quote-based tiering and paid/metered add-ons; NexHealth packages multiple modules and quote-based pricing; athenahealth explicitly aligns pricing with collections; Zocdoc removes marketplace subscription friction and charges on new-patient bookings. Klinikos should therefore avoid copying one competitor and instead combine high-value clinic subscriptions/implementation with low-friction Grid entry and success-linked network economics.

## Engineering acceptance tests
1. No production variable-cost vendor call can occur without a successful customer-backed reservation unless an explicit zero-cost/internal provider path applies.
2. Payment cannot bypass safety, RBAC, tenant, credential, consent, or clinical governance.
3. Expired/inactive subscription fails closed for paid production modules.
4. Module entitlement is distinct from subscription status.
5. Exhausted allowance falls through to prepaid then bounded overage; otherwise blocks before vendor execution.
6. Demo is synthetic/capped and cannot silently become live production.
7. Paid integration still reports pending until external readiness passes.
8. Grid transaction fee is calculated server-side by resource class.
9. Grid verification cannot be purchased around.
10. All public price strings come from canonical commercial configuration where practical.
11. Annual discount does not apply to implementation/pass-through costs unless explicitly configured.
12. Refund/credit logic is explicit and auditable.

## Operator rule
Do not broaden product scope while commercial activation, production deployment, checkout evidence, entitlement enforcement, or end-to-end paid fulfillment is broken. Revenue path reliability outranks another feature.
