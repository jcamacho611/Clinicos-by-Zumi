# Klinikos Internal Cost Planning

Source: founder planning materials imported into the repository. These are directional estimates, not vendor quotes, audited budgets, or guaranteed costs. Revalidate against current vendor pricing before relying on them for contracts or forecasts.

## Planning ranges by product stage

| Product stage | Low / month | Medium / month | High / month |
|---|---:|---:|---:|
| Demo only, fake data | $75 | $175 | $350 |
| Starter Med Spa CRM | $250 | $600 | $1,100 |
| Clinic Ops Basic | $700 | $1,300 | $2,200 |
| Clinic Ops Pro | $1,200 | $2,400 | $4,000 |
| AI Workflow Pro | $1,800 | $3,500 | $6,500 |
| Contractor Nurse / Injector Network | $900 | $2,000 | $4,500 |
| Clinic OS + Contractor Network | $2,500 | $5,000 | $9,500 |
| Multi-Location Growth | $4,500 | $9,000 | $18,000 |
| Enterprise / Custom | $10,000 | $25,000 | $60,000+ |

## Working assumptions

For a serious live clinic configuration, an earlier planning baseline assumed approximately $1,200-$3,500/month per clinic before founder compensation, profit, implementation labor or sales commissions.

For a clinic + contractor network configuration, an earlier planning baseline assumed approximately $2,500-$6,000/month.

These figures must be challenged against actual architecture and usage before pricing decisions because some earlier planning grouped compliance/security and support reserves into large placeholders rather than vendor-specific line items.

## Cost categories to track in production

1. Cloud infrastructure
2. Database
3. File/object storage
4. Backups and recovery
5. Logging/monitoring/error tracking
6. Authentication/security
7. AI usage
8. SMS/voice/email
9. Payment processing
10. Healthcare transaction vendors
11. Lab/radiology/eRx vendor costs
12. Maps/geocoding/routes
13. Marketplace/KYC/payout costs
14. Compliance tooling and security assessment
15. Customer support/operations
16. Demo/sandbox environments
17. Contractor/provider-network verification costs
18. Legal/counsel reserve

## Unit economics requirement

Klinikos should maintain an internal cost ledger by tenant, location and major feature so pricing can be based on real COGS rather than guesses.

Recommended dimensions:
- organizationId
- locationId
- billing period
- provider/vendor
- feature/category
- quantity
- unit cost
- total cost
- pass-through flag
- included allowance
- overage
- estimated vs invoiced

## Commercial principle

Internal operating cost is not the same thing as customer price. Customer pricing should account for:
- displaced software spend
- customer value/savings
- implementation complexity
- support burden
- vendor COGS
- risk/compliance burden
- gross margin target

Do not publicly quote these internal planning ranges as verified operating cost.
