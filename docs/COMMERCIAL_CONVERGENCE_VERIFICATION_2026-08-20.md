# Commercial Convergence Verification — 2026-08-20

Branch: `codex/commercial-convergence-2026-08-20`
Base reviewed: `9ee420c0fadf182af0c0d49ef97b6967aef9c836`

## Market evidence incorporated

- Caduceus evaluator feedback: the public website did not make the value proposition or product clear enough without a deck.
- Current official competitor anchors reviewed: Practice Fusion, CharmHealth, athenahealth.
- Current repository evidence: authenticated contrast cleanup is green locally according to latest main commit; remaining public Grid accessibility cluster is separate.
- Current Grid transaction evidence: transaction state machine exists, but no active platform fee policy is shipped by default; a zero demo policy has been used rather than inventing a real fee.

## Changes on this branch

1. Add a plain-language first product-definition section before public Zumi.
2. Change homepage metadata from abstract "healthcare operating infrastructure" to "AI-native clinic operating system."
3. Preserve the existing public Zumi conversation/routing implementation intact.
4. Add a test contract that product explanation must precede public Zumi.
5. Add a public Grid pricing policy derived from existing canonical subscription anchors.
6. Remove the public Grid universal 10% transaction-fee claim.
7. Add pricing tests that reject a universal percentage and require resource-class policy language.
8. Establish `docs/KLINIKOS_COMMERCIAL_CANON.md` for category, pricing boundaries, competitor anchors, Stack Savings Engine, Grid economics, and truth rules.

## Verification limitations

Repository-hosted CI has a known account/runner/billing condition in recent project history where jobs can fail before checkout with no executable steps. This branch therefore does not claim CI-green status merely from commit creation.

Before merge, run the repository release gate in an environment where commands actually execute. At minimum verify:

- type check;
- lint;
- unit tests, including `tests/public-product-definition.test.ts` and `tests/pricing-truth.test.ts`;
- production build;
- browser QA at mobile and desktop widths;
- homepage first-viewport comprehension;
- public Grid pricing rendering and contrast;
- no new dead links or horizontal overflow.

## Remaining known commercial work

- Remove or formally deprecate the old unused `gridCommercialModel` export in `klinikos-commercial.ts` so stale fee language cannot be revived accidentally.
- Converge `gridCommercialRule` and `/klinikos` funnel copy onto the new public policy.
- Build the Clinic Stack Savings Engine with evidence classes and cost-to-serve inputs.
- Build the internal cost-to-serve model before changing clinic subscription anchors.
- Complete current primary-source competitor matrix beyond the initial anchors.
- Finish public Grid accessibility cluster and visually verify populated states.
- Add structured feedback capture and funnel analytics where missing.

## Merge rule

Do not merge this branch solely because the messaging direction is strategically correct. Merge after executable tests/build and visual QA confirm the new first fold and pricing surfaces do not regress accessibility, layout, routing, or commercial truth.
