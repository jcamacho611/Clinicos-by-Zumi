# Commercial rollout checklist

Do not merge pricing into production merely because the page renders.

## Before merge
- TypeScript, lint, tests, Prisma validation/generation, and production build green.
- Confirm current main is deployable; do not stack this PR onto a known broken production baseline.
- Review every public surface for duplicated/contradictory dollar strings.
- Replace duplicate pricing literals with imports from the canonical commercial module where practical.
- Confirm /pricing, /founding-clinic, /sales, /start, /grid/pricing, and checkout language agree.
- Confirm the GoDaddy paylink amount/product actually matches the CTA it is attached to before representing it as a specific purchase.
- Confirm no public claim implies automated recurring billing if only manual/single-payment evidence is connected.

## Server gates
- Active paid production subscription gate.
- Module entitlement gate.
- Variable-cost reservation-before-spend gate.
- Connector readiness/contract/BAA gate.
- Capacity/seat/location gate.
- Grid transaction/payment/eligibility re-check at consequential transitions.
- Reason-specific commercial denial codes.

## Billing state
- Persist plan key and commercial status.
- Persist included allowances.
- Persist prepaid balance.
- Persist bounded overage authorization.
- Persist usage reservations and reconciled usage ledger.
- Persist payment evidence separately from Klinikos-owned entitlement truth.

## Public launch
- Pricing page indexed and linked from primary public navigation.
- Analysis CTA works.
- Qualification/contact fallback works.
- Payment confirmation has a human-operable reconciliation path until automated billing/webhooks are verified.
- Sales scripts and proposals use the same plan names and price anchors.
- Annual discount terms are documented.
- Refund/credit terms are documented.
- Grid Pro subscriptions are not sold until recurring billing can actually provision them.
- Grid percentage/transaction economics receive counsel review before regulated/professional transactions launch.

## Post-launch metrics
Track by source, plan, and cohort:
- analysis purchases
- analysis -> blueprint conversion
- blueprint -> implementation conversion
- implementation close rate
- implementation gross margin
- monthly recurring revenue
- annual prepay share
- add-on attach rate
- Grid supply growth
- Grid transaction conversion
- transaction gross margin
- vendor cost per organization
- Zumi/communications cost per active clinic
- churn / expansion
- support and implementation hours

Price changes should be driven by conversion, value, support burden, and contribution margin rather than competitor imitation.
