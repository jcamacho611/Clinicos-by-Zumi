# Grid Identity Persistence Design

## Goal

Preserve a person's Grid intent across authentication and allow an existing Klinikos person/account to add a Grid professional relationship without creating a duplicate person or weakening current tenant/session authority.

## Scope

This slice covers two connected behaviors:

1. Public Grid discovery remains account-free. A login prompt appears only when the person attempts a persistence/consequential action such as creating a provider need.
2. The action that triggered authentication survives the round trip. After successful sign-in, the person lands on the authenticated Grid persistence surface with the safe public context necessary to continue.
3. Grid contractor enrollment must not create a second identity for an email that already belongs to a Klinikos user. It must attach the new contractor/provider relationship to the existing universal person context when safe, while preserving the legacy user's organization and role as the current-session authority.

## Non-goals

- No automatic organization switching.
- No automatic role switching.
- No authorization derived from universal identity relationships.
- No bypass of credential, malpractice, human review, or production-compliance gates.
- No conversion of patient portal identities into organization users.
- No PHI in public Grid continuation state.
- No broad account-merging engine in this slice.

## Existing authority boundary

Legacy `User.organizationId` and `User.roleKey` remain authoritative for authentication sessions. Universal identity records provide relationship context only. This slice may create or reuse universal person and relationship records, but it must not use them to grant tenant access, switch organizations, or elevate permissions.

## Public-to-authenticated continuation

A public listing can provide a safe `returnTo` path that points directly at `/grid/needs/new` and carries only non-sensitive marketplace context such as:

- `kind=provider`
- `listingId=<public listing id>`

The existing `safeReturnTo` gate remains the sole same-origin validator. The authenticated Grid need page may resolve the listing id server-side and use public listing metadata to seed a draft. The URL must not carry patient data, private provider data, authorization state, or untrusted serialized objects.

If the listing is gone, unpublished, or otherwise unavailable after sign-in, the page opens a normal blank provider need instead of trusting stale URL state.

## Existing-user contractor enrollment

When Grid contractor enrollment receives an email that already belongs to a legacy Klinikos user:

- do not create another `User`;
- do not overwrite the existing user's organization, role, password, or status;
- resolve or create that user's universal `Person` compatibility record;
- create the Grid provider relationship/profile against the approved Grid review organization while retaining the existing user as the actor/applicant reference;
- create a universal organization relationship that describes the new Grid relationship as relationship context only;
- keep the new provider and any Grid-specific access pending human approval;
- do not make the existing user's current authenticated session a contractor session.

For a brand-new email, the current compatibility behavior may continue to create a pending contractor legacy user, but it must also ensure the universal person/relationship foundation exists so future relationships attach to the same person context.

## Identity collision safety

Email equality is sufficient only to reuse the same legacy `User` record that already owns that exact normalized email. This slice does not merge two existing users, portal accounts, or contradictory person records. If the universal identity layer contains an incompatible or ambiguous mapping for that legacy user, enrollment must fail closed for human review rather than silently relink identity.

## Data flow

### Public Grid request

1. User browses Grid and opens a public provider listing.
2. User clicks request.
3. If unauthenticated, the link goes to `/login?returnTo=<safe /grid/needs/new path>`.
4. Login validates the same-origin return path and authenticates normally.
5. The authenticated need page resolves the public listing by id.
6. It seeds only allowed marketplace fields into `GridNeedComposer`.
7. User reviews/edits and explicitly submits before any demand is persisted.

### Contractor enrollment for an existing user

1. Enrollment schema validates the application.
2. Repository resolves the review organization.
3. Repository looks up the normalized email.
4. If user exists, it reuses that user without mutating current membership authority.
5. Repository ensures a compatible universal person context exists for that legacy user.
6. Repository creates the pending provider/profile, credential evidence, availability, review task, audit event, and universal organization relationship.
7. Account/session authority remains unchanged until a later approved access workflow explicitly changes it.

## Error handling

- Unsafe `returnTo`: reject via existing `safeReturnTo` behavior.
- Missing/unpublished listing after login: open blank provider need with a non-blocking message.
- Existing user with incompatible identity mapping: return a conflict requiring human review.
- Existing provider application for the same user/review organization: fail with a clear duplicate-application conflict rather than creating another provider.
- Review organization unavailable or production-ineligible: preserve current fail-closed behavior.

## Testing

1. Unit/contract tests prove the listing request builds a direct authenticated persistence return path.
2. `safeReturnTo` tests prove the new route remains same-origin and rejects external variants.
3. Grid need-page tests prove listing context is re-resolved server-side and no serialized object is trusted from the URL.
4. Repository tests prove an existing user is reused without changing `organizationId`, `roleKey`, password credential, or status.
5. Repository/identity tests prove a universal relationship is created as context only and no session/tenant switch occurs.
6. Duplicate/incompatible identity cases fail closed.
7. Full Quality and deploy-contract jobs must remain green.
