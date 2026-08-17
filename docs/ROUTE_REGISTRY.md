# Klinikos route registry

Status: `IMPLEMENTATION TRUTH INDEX`

A **route** is a product journey that crosses Klinikos engines. A **page** is a surface a route step lands on. Pages are implementation detail; routes are the product.

This document describes the registry that **exists in the repository today**. It is not a roadmap. A journey that is not in `src/lib/paths/catalog.ts` is not a route, however desirable it may be.

## Where the registry lives

| Concern | Module |
| --- | --- |
| Route definitions and their steps | `src/lib/paths/catalog.ts` |
| Phrase → route resolution (deterministic, no model) | `src/lib/orchestration/intent-engine.ts` |
| Step state for a started route | `src/lib/orchestration/path-engine.ts` |
| Next governed step, blockers, and owner | `src/lib/orchestration/path-guidance-engine.ts` |
| Persistence of a started route | `src/lib/orchestration/path-persistence-repository.ts` |
| Entry surface | `src/components/clinic/living-home.tsx` |

`POST /api/paths` starts a route. Living Home resolves the typed request through the intent engine, starts the route, and renders the resolved next step in place.

## Routes that exist today

| Route id | Audience | Engines it crosses | Steps |
| --- | --- | --- | --- |
| `find-extra-work` | professional | provider → network → grid | profile → credentials → availability → matches → work and payment |
| `become-grid-ready` | learner | edu → network → grid | goal → learning → competency → readiness → grid |
| `fill-staffing-need` | clinic | grid | need → matches → availability → confirm |
| `fix-referral-leakage` | operations | referrals → tasks → patient-navigation → network | diagnose → ownership → follow-up → network → closure |

Three of the four already cross more than one engine, which is what makes them routes rather than links. `fill-staffing-need` stays inside Grid today; that is a real limitation, not a description of the target.

## What the registry is checked against

`tests/route-registry.test.ts` enforces the properties that make a route trustworthy. Each check exists because the corresponding defect was actually observed:

1. **Every step lands on a surface that exists.** `/grid/transactions` is the terminal step of two routes and returned a 500 in production-mode browser QA while every unit test stayed green.
2. **Every route's own stated intent examples resolve back to it.** Three routes advertised phrasings — "Find coverage for Friday", "Find me weekend healthcare work", "What do I need to learn next" — that the intent engine did not match, so typing the product's own example into Living Home produced a clarification request instead of the route.
3. **No step sends a signed-in person to a public marketplace entry.** `/grid` renders signed-out chrome with a "Sign in" button; `/grid/workspace` is the authenticated Grid home.
4. **Route ids and step ids are unique**, and every route has at least one step a person can open.

`tests/raw-sql-table-names.test.ts` guards the defect class that broke `/grid/transactions`: every Prisma model here is `@@map`ped to a snake_case table, so raw SQL naming the model compiles and type-checks but throws `42P01` at runtime.

## Adding a route

A route may be added when all of the following are true. Anything short of this produces a journey that dead-ends on a person.

- every step's `href` resolves to a real page;
- the role the route is written for can actually reach those pages under `canAccessWorkspace`;
- at least one phrase in `intentExamples` resolves to the route through `resolveIntentDeterministically`;
- no step points at a public marketplace entry page;
- the guidance engine can state a next step and name the owner of any blocker.

Adding phrases to `intent-engine.ts` widens what Living Home can route. Adding a route whose steps are not yet built does not; it produces a journey that fails at the step that does not exist.

## Deliberate limits

- **Intent resolution is deterministic.** No model chooses a route. Klinikos Intelligence may explain, draft, or research; route selection, eligibility, and authorization stay deterministic. This is why the Living Home composer keeps working on a deployment with no model provider configured.
- **A route does not widen authority.** Reaching a step still passes the route guard, RBAC, tenant scoping, and eligibility rules. A route is a description of a journey, never a grant.
- **Steps are not claims about the outside world.** A step landing on a Grid or billing surface says the surface is reachable, not that an external connector, payer, clearinghouse, or payout rail is live. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` remains authoritative for those.
