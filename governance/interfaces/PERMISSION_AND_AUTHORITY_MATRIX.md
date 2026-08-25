# KLINIKOS Permission & Authority Matrix

Status: GOVERNING CROSS-DOMAIN CONTRACT
Date: 2026-08-25

## Purpose

Define the dimensions every consequential action must consider so authorization does not collapse into a single role flag.

## Authorization dimensions

Evaluate as applicable:

- authenticated identity
- active organization
- active location
- organization membership
- role
- profession
- license/credential evidence
- privilege
- assignment
- delegation/supervision
- patient relationship
- purpose of use
- consent/authorization
- financial/product entitlement
- data sensitivity
- effective date/time
- break-glass/emergency context

## Persona guidance

### Front desk

Typical authority:

- scheduling
- registration/demographics within policy
- forms/readiness
- operational communications
- coverage collection/status visibility

Not implied:

- clinical diagnosis/editing
- provider signature
- unrestricted chart access
- coding final authority

### MA

Typical authority depends on organization/state policy and assignment. May capture delegated intake/vitals/history elements and prepare handoff. Must not be treated as equivalent to RN/provider authority.

### LPN

Distinct from MA/RN. Authority depends on jurisdiction, organizational policy, assignment and supervision.

### RN

May have broader nursing assessment/workflow authority based on policy/assignment but is not automatically provider/prescribing authority.

### Provider

Clinical authority depends on profession/license, organization membership, location, privilege/assignment and patient relationship. Provider role string alone is insufficient.

### Coder/biller

May access documentation/evidence necessary for coding/revenue work under policy; does not gain clinical edit/signature authority.

### Organization admin/owner

May manage business configuration, staff, entitlements and operations. Ownership/admin does not automatically grant clinical-record access or professional authority.

### Patient

May access/release their permitted information and complete patient actions. May not edit signed professional clinical facts as if they authored them.

### Proxy/caregiver

Access is explicitly scoped, evidenced, effective-dated and revocable.

### Support

Support permissions are scoped to diagnostic need. Employment at Klinikos does not imply unrestricted tenant PHI access.

### Grid professional

Eligibility requires applicable profile/credential/requirement evidence. Payment or subscription cannot create eligibility.

### EDU instructor

May review/score within assigned programs; cannot create licensure or broad organization access.

### Enterprise admin

Delegated administrative scope is explicit and does not automatically inherit clinical authority across subsidiaries/locations.

## Break-glass

If break-glass is supported:

- explicit reason
- narrowly scoped emergency use
- conspicuous audit
- post-event review
- no silent bypass of all authorization

## Server-side rules

1. Never trust a client-supplied role, organization or patient ID without server validation.
2. Never use hidden navigation as security.
3. Search/autocomplete is authorization-sensitive.
4. Export/download requires separate authorization where appropriate.
5. API scopes do not replace resource-level authorization.
6. Zumi tool access is a projection of deterministic authorization, not model confidence.
7. Entitlement controls paid feature access but never grants clinical/professional authority.

## Negative tests required

- user from Org A accesses Org B object ID
- admin attempts provider-only clinical signature
- biller attempts clinical edit
- patient/proxy attempts unreleased result
- expired credential used for Grid eligibility
- enterprise parent attempts unauthorized child-tenant access
- Zumi attempts disallowed tool
- API token with scope attempts unauthorized resource
- client changes organization ID in request
- search suggestion leaks existence of unauthorized patient

## Audit

Consequential permission/authority actions include enough context to understand actor, purpose, scope, target and result without logging unnecessary PHI.
