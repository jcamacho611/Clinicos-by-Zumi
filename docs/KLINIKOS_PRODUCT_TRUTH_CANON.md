# Klinikos Product Truth Canon

## Purpose

This document defines how Klinikos determines whether a product claim is true. It exists to prevent a recurring failure mode: code, proposals, marketing copy, screenshots and chat history drifting into different versions of reality.

The rule is simple: **a claim may never be stronger than the evidence that supports it.**

## Evidence precedence

When sources conflict, use this order:

1. **Production-verified release evidence** — live behavior tied to a known release identity and durable evidence.
2. **Deployed release identity** — a deployed SHA/ref is known, but the behavior has not yet been fully verified.
3. **Current `main`** — merged repository truth.
4. **Merged feature code** — merged domain implementation that may not yet be deployed.
5. **Verified feature branch** — exact-head executable verification exists, but the work is not merged.
6. **Active implementation branch** — code exists but exact-head verification is incomplete or unavailable.
7. **Approved design/specification** — approved architecture with no claim that implementation exists.
8. **Roadmap** — intended future work.
9. **Concept** — exploratory direction.
10. **Deprecated history** — superseded implementation or documentation.

Chat history, pitch language and old screenshots are never higher authority than the repository and deployment evidence.

## Canonical truth states

### `PRODUCTION_VERIFIED`

The capability is deployed and its relevant live behavior has been verified against a known release identity.

Allowed public wording: `available`, `live`, `works today`, only within the verified scope.

### `DEPLOYED_UNVERIFIED`

A release is deployed, but exact live behavior has not completed the required verification gate.

Do not call the capability production-verified.

### `MERGED_NOT_DEPLOYED`

The implementation is merged to current main but there is no evidence the deployed environment contains that SHA.

Allowed wording: `built into the current codebase`; not `live`.

### `IMPLEMENTED_UNVERIFIED`

Code exists on a branch, but exact-head executable verification is incomplete, blocked or unavailable.

Allowed wording: `implemented on the current development branch`; not `ready`, `green`, `live` or `production`.

### `IN_ACTIVE_DEVELOPMENT`

Work is being implemented or reconciled.

Allowed wording: `in active development`.

### `APPROVED_DESIGN`

Architecture/specification is approved but not implemented.

Allowed wording: `designed`, `planned architecture`.

### `PLANNED`

Roadmap intent only.

### `BLOCKED`

Implementation or release is waiting on an external or internal gate.

### `DEPRECATED`

Superseded. Do not use as current product truth.

## Non-equivalence rules

These distinctions are mandatory:

- `merged != deployed`
- `deployed != production verified`
- `configured != operational`
- `connected != production verified`
- `credentials present != authorized`
- `payment complete != authority granted`
- `enrolled != attended`
- `attended != completed`
- `certificate != licensure`
- `training evidence != employment eligibility`
- `self-reported claim != verified identity`
- `email verified != organization authority`
- `professional email != clinical authority`
- `AI suggestion != human approval`
- `public listing != eligibility or authorization`
- `Grid match != clinical suitability`

## Domain ownership rule

Each consequential fact has one governing source. Cross-product experiences may project or adapt that fact but may not silently create a second authority store.

Examples:

- Clinic permissions remain governed by clinic authorization/RBAC.
- Patient chart data remains governed by patient/clinical domain stores.
- Grid eligibility, resources, offers and reservations remain governed by Grid domain rules.
- EDU attendance/completion remains governed by EDU evidence and instructor authority.
- Payment/settlement remains governed by commerce/payment policy and processor evidence.
- Integration production state remains governed by integration lifecycle evidence.
- Identity claims and future universal relationships must never widen legacy clinical authority by inference.

## Public-claim review

Before shipping any public copy, ask:

1. What exact capability is being claimed?
2. Which repository file/domain owns the capability?
3. What is its current truth state?
4. Is deployment identity known?
5. Has the relevant behavior been verified live?
6. Does the copy accidentally broaden the scope beyond the evidence?
7. Does the copy imply a certification, integration, customer, outcome, credential or regulated authority that is not evidenced?

If any answer is unclear, weaken the claim or remove it until evidence exists.

## Universal-experience truth rule

Klinikos may describe its **architecture and direction** as one healthcare operating ecosystem, but each user-facing action must reflect current availability.

Public path descriptions must distinguish:

- what a visitor can do now;
- what requires governed authentication;
- what exists on an active development branch;
- what is still planned.

A future path may be shown as a direction or waitlist/intake path only when the UI makes the limitation clear.

## Release verification rule

Before anyone says `production ready`, `live`, `verified`, `green`, or equivalent, capture evidence from the relevant release gate. Where GitHub Actions cannot allocate a runner and returns no executed steps, that is **infrastructure unavailable**, not a passing code verdict.

## Maintenance

Update this canon only when the truth model itself changes. Update the work ledger for changing SHAs, PRs and feature state.
