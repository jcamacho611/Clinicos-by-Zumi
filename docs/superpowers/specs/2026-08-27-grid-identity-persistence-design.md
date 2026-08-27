# Grid Identity Persistence Design

## Goal

Preserve a person's Grid intent across authentication and allow an existing Klinikos person/account to add a Grid professional relationship without creating a duplicate person or weakening current tenant/session authority.

## Scope

This slice covers three connected behaviors:

1. Public Grid discovery remains account-free. A login prompt appears only when the person attempts a persistence or consequential action such as creating a provider need.
2. The action that triggered authentication survives the round trip. After successful sign-in, the person lands on the authenticated Grid persistence surface with the safe public context necessary to continue.
3. Grid contractor enrollment can attach a new professional relationship to an existing Klinikos account only after the server has proof that the authenticated session belongs to that exact legacy user. Email equality alone never authorizes an identity attachment.

## Non-goals

- No automatic organization switching.
- No automatic role switching.
- No authorization derived from universal identity relationships.
- No bypass of credential, malpractice, human review, or production-compliance gates.
- No conversion of patient portal identities into organization users.
- No PHI in public Grid continuation state.
- No broad account-merging engine in this slice.
- No password reset or password replacement as a side effect of Grid enrollment.

## Existing authority boundary

Legacy `User.organizationId` and `User.roleKey` remain authoritative for authentication sessions. Universal identity records provide relationship context only. This slice may create or reuse universal person and relationship records, but it must not use them to grant tenant access, switch organizations, elevate permissions, or mutate an existing authenticated session.

The legacy `Provider.userId` relationship is one-to-one. An existing user may already be linked to a provider in their current organization, so a new Grid application in another review organization must not seize or overwrite that one-to-one link. For an existing account, the new pending Grid provider record remains unbound from `Provider.userId`; the universal organization relationship is the cross-context identity link until a separately reviewed active-context authorization design exists. A brand-new contractor account may continue using the existing legacy `User` to `Provider` link because that account is created specifically for that Grid organization.

## Public-to-authenticated continuation

A public listing can provide a safe `returnTo` path that points directly at `/grid/needs/new` and carries only non-sensitive marketplace context such as:

- `kind=provider`
- `listingId=<public listing id>`

The existing `safeReturnTo` gate remains the sole same-origin validator. The authenticated Grid need page resolves the listing id server-side and uses current public listing metadata to seed an editable draft. The URL must not carry patient data, private provider data, authorization state, or untrusted serialized objects.

If the listing is gone, unpublished, or otherwise unavailable after sign-in, the page opens a normal blank provider need instead of trusting stale URL state.

## Existing-user contractor enrollment

### Proof of account control

Typing an email address is not proof that the applicant controls that account. Therefore:

- an unauthenticated public enrollment may create a new account only when the normalized email does not already belong to a legacy Klinikos user;
- if that email already exists, the public enrollment must fail closed without attaching any relationship to the existing user;
- the enrollment page should tell people who already have Klinikos accounts to sign in first;
- after sign-in, the server accepts existing-user relationship attachment only when the validated authentication session user id and normalized session email match the existing legacy user and submitted email;
- an authenticated user cannot submit a different email to create or attach another identity.

For an authenticated existing account, the form binds the email to the session and does not request or replace the existing password.

### Relationship creation

When a matching authenticated legacy user submits Grid contractor enrollment:

- do not create another `User`;
- do not overwrite the existing user's organization, role, password credential, status, or sessions;
- resolve or create that user's universal `Person` compatibility record;
- create the pending Grid provider/profile against the approved Grid review organization without taking over an existing `Provider.userId` link;
- create a universal organization relationship with the legacy user id and the pending provider id as provenance;
- keep the relationship, provider, credentials, malpractice evidence, availability, and Grid-specific access pending human approval;
- do not make the existing user's current authenticated session a contractor session.

For a brand-new email, the current compatibility behavior may continue to create a pending contractor legacy user and linked provider, but it must also ensure the universal person and relationship foundation exists so future relationships attach to the same person context.

## Identity collision safety

Email lookup locates the legacy account but never proves control of it. Existing-account reuse requires a matching validated session.

This slice does not merge two existing users, portal accounts, or contradictory person records. The compatibility resolver considers the deterministic legacy-person id, `legacy_user` source reference, and existing memberships for the legacy user. If those signals resolve to more than one person, enrollment fails closed for human review rather than silently relinking identity.

Universal relationship creation is idempotent for the same legacy user, target organization, and relationship type. A duplicate contractor application for the same person and review organization is rejected before another provider/application record is created.

## Data flow

### Public Grid request

1. User browses Grid and opens a public provider listing.
2. User clicks request.
3. If unauthenticated, the link goes to `/login?returnTo=<safe /grid/needs/new path>`.
4. Login validates the same-origin return path and authenticates normally.
5. The authenticated need page resolves the public listing by id.
6. It seeds only allowed marketplace fields into `GridNeedComposer`.
7. User reviews or edits and explicitly submits before any demand is persisted.

### Public contractor enrollment for a new person

1. Public form validates the application and requires a password.
2. Repository confirms the review organization is available for the current public enrollment mode.
3. Repository confirms the normalized email does not already belong to a legacy user.
4. Repository creates the pending contractor user and linked pending provider.
5. Repository ensures the compatibility person, baseline membership, and pending Grid applicant relationship exist.
6. Human review remains required before account activation or regulated opportunity eligibility.

### Contractor enrollment for an existing user

1. User signs in through the normal authentication flow.
2. Grid enrollment binds the email to the validated session and does not collect a replacement password.
3. API passes only the validated session identity to the repository as proof of account control.
4. Repository resolves the review organization and the normalized legacy user.
5. Repository verifies session user id and email match that exact legacy user.
6. Repository rejects an existing Grid applicant relationship for the same review organization.
7. Repository creates the pending provider/profile without modifying the existing user's legacy organization, role, status, password, provider link, or sessions.
8. Repository ensures a compatible universal person context and creates the pending Grid applicant organization relationship with provider provenance.
9. Account/session authority remains unchanged until a later approved active-context workflow explicitly changes it.

## Error handling

- Unsafe `returnTo`: reject via existing `safeReturnTo` behavior.
- Missing or unpublished listing after login: open a blank provider need with a non-blocking message.
- Existing email submitted without a matching authenticated session: fail closed and direct the person to normal sign-in, without attaching identity.
- Authenticated session email or user mismatch: deny the attachment.
- Existing user with incompatible universal identity mapping: return a conflict requiring human review.
- Existing Grid applicant relationship for the same user and review organization: reject the duplicate rather than creating another provider.
- Review organization unavailable or production-ineligible: preserve current fail-closed behavior.

## Testing

1. Unit/contract tests prove the listing request builds a direct authenticated persistence return path.
2. `safeReturnTo` tests prove the new route remains same-origin and rejects external variants.
3. Grid need-page tests prove listing context is re-resolved server-side and no serialized object is trusted from the URL.
4. Identity repository tests prove one compatible person is reused, ambiguous mappings fail closed, and relationship creation never updates legacy user or session authority.
5. Enrollment tests prove unauthenticated existing-email submissions do not attach relationships.
6. Enrollment tests prove a matching authenticated existing user is reused without changing `organizationId`, `roleKey`, password credential, status, existing provider link, or active sessions.
7. Enrollment tests prove authenticated email/user mismatch fails closed.
8. New-user enrollment tests prove a password is still required and the compatibility identity foundation is created.
9. Duplicate application cases fail closed.
10. Full Quality and deploy-contract jobs must remain green.
