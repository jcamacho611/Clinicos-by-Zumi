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

## Cross-engine bridges

A route is one way engines connect: a person starts it. A **bridge** is the other: one engine notices something the other could act on, without anyone having to re-type it.

### Clinic OS → Grid

`src/lib/ecosystem/clinic-grid-bridge.ts` reads real Clinic OS records and reports what this clinic could take to the network.

| Signal | Direction | Read from |
| --- | --- | --- |
| `coverage_gap` | demand | Scheduled, non-terminal appointments in the next 30 days with no provider on the record |
| `referral_leak` | demand | Open referrals with no destination organization recorded |
| `unused_capacity` | supply | Open capacity listings starting in the future |

Three rules keep the bridge honest, each enforced by `tests/clinic-grid-bridge.test.ts`:

1. **Nothing is posted here.** Detection returns a *draft*. Creating the demand goes through `POST /api/grid/demands`, which enforces RBAC, refuses organizations that have not passed production review, writes the audit record, and emits `grid.demand.created`. Every draft opens as `status: draft`, `visibility: matched_only`. A gap the clinic has not chosen to publish is not a Grid need.

2. **No PHI crosses.** Grid demand records are visible outside the originating organization, so a coverage gap describes the shift — role, window, location — never the patient whose appointment exposed it. The appointment query selects only `startsAt`, `endsAt` and `locationId`; the patient relation is never read, because what is never selected cannot leak. A test asserts this against fixtures carrying a name, MRN, DOB, email, phone and reason for visit. Referral specialty is deliberately omitted from the draft: on a small panel, a specialty plus a count can narrow to a person.

3. **Nothing is invented.** A signal is emitted only when rows were actually counted, and each carries the sentence describing what was counted. No estimated value, no projected fill rate, no "you could earn" figure — money here would be a claim about an outcome nobody has agreed to. A clinic with no gaps sees no section at all.

Reading each signal is governed by the Clinic OS permission for the records behind it, so a role without `appointments:read` never triggers the query. Acting on one additionally needs Grid create rights; a role that can see a gap but not publish is shown the gap without the action rather than a control that would fail.

Each signal that produces a draft links to `/grid/needs/new?from=<signal>`. The link carries **only the signal name** — never the demand. The composer page re-derives the draft from live records on open, so a link cannot carry a forged need into the form, and a gap that closed in the meantime yields an empty form with a plain note rather than a prefill for work nobody needs. An unrecognised signal name is ignored. Prefilled fields stay editable, the form says where they came from, and the demand is created only when a person submits it.

### EDU → Grid

`src/lib/ecosystem/edu-grid-bridge.ts` reads the signed-in learner's own competency determinations and reports what they mean for Grid — and what they do not.

| Signal | Read from |
| --- | --- |
| `placement_ready` | Competency areas an instructor marked achieved |
| `competency_in_progress` | Competency records not yet marked achieved |
| `no_determination_yet` | An enrollment exists but no competency record does |

**One rule dominates this bridge: an educational competency is not a licence.** `CREDENTIAL_DISCLAIMER` states it exactly — a Klinikos EDU credential is not professional licensure, board certification, clinical credentialing, authorisation to practise, or scope-of-practice approval. So the bridge may describe what EDU recorded and may help a learner ask for supervised placement, but it must never convert an education record into Grid eligibility for regulated work. Every placement draft therefore sets `requiresClinicalEligibility: true` and says in its own text that eligibility is verified against real credentials at match. Grid's eligibility enforcement remains the only thing that decides who may do regulated work.

The disclaimer travels on the readiness object itself rather than being left to each caller, so a surface cannot render the encouraging half of this bridge without the limiting half. Competency areas are skills and may travel to Grid; the learner's name, email, institution and cohort do not — who is asking is carried by the demand record's ownership fields. Publishing a placement request needs the ordinary Grid create permission: being a learner does not confer it, and neither does passing an assessment.

Competency determinations are read for the signed-in identity's own enrollments only, matched on email the same way `resolveEduIdentity` scopes EDU.

**Two vocabularies, deliberately.** An instructor's *determination* is `demonstrated` / `needs_development`; the stored *status* is one of `not_assessed`, `developing`, `approaching`, `achieved`, `not_achieved`, fixed by a CHECK constraint in `20260810160000_klinikos_edu_foundation`. They were previously assumed identical and written straight through, so every determination was rejected by PostgreSQL while TypeScript, ESLint and the unit suite stayed green. `competencyStatusForDetermination` maps one to the other and `competencyIsDemonstrated` reads it back; `tests/competency-status-vocabulary.test.ts` derives the legal list from the migration rather than restating it.

Bridge destinations are checked by the same route guard as route steps — `/grid/needs` has no page of its own, and pointing at it produced a 404 that browser QA caught.

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
