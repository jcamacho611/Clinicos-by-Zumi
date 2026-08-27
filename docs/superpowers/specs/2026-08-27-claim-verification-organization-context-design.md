# Klinikos Claim → Verification → Organization Context Design

Status: `FOUNDER-APPROVED DESIGN — WRITTEN SPEC PENDING FINAL HUMAN REVIEW`
Date: 2026-08-27
Parent plan: `docs/superpowers/plans/2026-08-27-supreme-convergence-implementation-plan.md`
Parent slice: Slice 3 — Claim → verification → organization context

## 1. Purpose

Klinikos needs a durable way for a person to say:

- “I am this professional.”
- “I work with or represent this organization.”
- “I own, manage, staff, supply, teach for, refer to, or otherwise relate to this organization.”

That assertion must create useful network context without silently granting regulated eligibility, protected tenant access, organizational authority, or professional verification.

The governing lifecycle is:

`IDENTITY → CLAIM → EVIDENCE → VERIFICATION → ENTITLEMENT → AUTHORITY`

Each stage is distinct. Later stages may depend on earlier stages, but no earlier stage implies a later one.

The design must preserve the current repository rule that legacy `User.organizationId`, `User.roleKey`, credentials, provider linkage, and authenticated session remain present authority until a separately tested authorization-context migration replaces them.

## 2. Problem in the current implementation

The repository already has several strong primitives:

- `Person` and `OrganizationMembership` provide additive universal identity and relationship context.
- Existing-account Grid enrollment now requires exact authenticated proof of control before attaching a relationship.
- Provider credentialing tracks pending, verified, rejected, exception, renewal, and primary-source evidence state.
- Grid eligibility evaluates regulated activity deterministically by activity, jurisdiction, credential, malpractice, facility privilege, and time window.
- Resource publication and regulated work already have human-review gates.

But external organization/space enrollment still contains an early compatibility shortcut: it creates a brand-new active `Organization`, active legacy `User`, password credential, and contractor tenant at enrollment time. That shortcut conflates four different statements:

1. a person wants a Grid identity;
2. a person says an organization exists;
3. a person says they represent that organization;
4. the person is authorized to act inside that organization’s protected Klinikos tenant.

Those are not equivalent.

Likewise, a professional assertion is not the same as a verified credential, and a verified credential is not universal permission to perform every activity.

## 3. Non-negotiable invariants

### 3.1 Claim is not verification

A claim is a recorded assertion by an authenticated or newly created identity. It may be truthful, mistaken, stale, disputed, fraudulent, incomplete, or awaiting evidence.

A claim alone must never be displayed or consumed as verified fact.

### 3.2 Verification is not entitlement

Verification answers a bounded question such as “the submitted organization-domain evidence was accepted” or “this professional credential completed the configured verification process.”

Verification does not automatically make a person eligible for every Grid action, clinical action, financial action, or tenant action.

### 3.3 Entitlement is not authority context

An entitlement is permission for a specific capability under deterministic policy, for example being eligible to perform a declared Grid activity in a specific jurisdiction and facility window.

Current tenant/session authority remains separately controlled by the current auth/RBAC system. A relationship claim or universal membership must not rewrite the active organization or role.

### 3.4 Existing authority must not be silently mutated

For an existing user, claim creation must not change:

- `User.organizationId`;
- `User.roleKey`;
- `User.status`;
- password/auth credential;
- existing one-to-one `Provider.userId` linkage;
- current session organization;
- current session role;
- active sessions.

### 3.5 Email equality is not proof of control

Existing-account claim attachment requires a validated server-side session that resolves to the exact legacy user identity. A submitted email address alone can never authorize relationship attachment.

### 3.6 Claims fail closed when identity is ambiguous

If compatibility signals resolve one legacy user to multiple universal `Person` records, or otherwise produce conflicting identity mappings, claim creation must stop and require human review.

### 3.7 Regulated work remains governed by existing specialist gates

Professional claims must not replace credentialing or Grid eligibility. Organization claims must not replace facility verification, production-compliance review, credentialing, legal agreements, payment truth, or other specialist authority.

## 4. Chosen architecture

Add a first-class `RelationshipClaim` lifecycle between universal identity and verified organization/professional relationship state.

Do not use `OrganizationMembership` itself as the claim record. Membership remains a relationship/context projection. A dedicated claim record is necessary because the system must preserve the difference between:

- what the person asserted;
- what evidence was supplied;
- what has been verified;
- what relationship projection exists;
- what action is permitted;
- what tenant/session authority exists.

Do not migrate authentication to multi-organization memberships in this slice. That is a later authorization-context project and would expand the blast radius across the entire application.

## 5. Core domain model

### 5.1 `RelationshipClaim`

A new durable model records the assertion itself.

Required conceptual fields:

- `id`
- `personId`
- `legacyUserId` when a legacy account exists
- `claimType`
- `targetType`
- `targetOrganizationId` when claiming an existing Klinikos organization
- `targetProviderId` when applicable
- `claimedOrganizationName` for a new/unresolved organization presence
- `claimedRoleKey` or relationship role label when relevant
- `lifecycleStatus`
- `verificationStatus`
- `sourceType`
- `sourceReference`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `rejectionReason` or bounded review note
- timestamps

The precise Prisma names may be adjusted to existing repository naming conventions during implementation, but the semantic separation is mandatory.

### 5.2 Claim types

Initial allowlisted claim types should be intentionally small:

- `organization_owner`
- `organization_admin`
- `organization_staff`
- `professional_identity`
- `organization_partner`

Additional relationship types such as educator, supplier, referral partner, payer, or facility operator should be added only when a real governed workflow requires them.

### 5.3 Target types

Initial target types:

- `existing_organization`
- `new_organization_presence`
- `professional_profile`

A target type is not a permission level.

### 5.4 Lifecycle and verification state

Do not encode “verified” in two competing state fields.

`lifecycleStatus` describes whether this claim record is currently live:

- `active`
- `withdrawn`
- `superseded`

`verificationStatus` describes the bounded verification workflow:

- `submitted`
- `evidence_required`
- `in_review`
- `verified`
- `rejected`

A withdrawn or superseded claim cannot advance verification. A rejected claim stays rejected unless a new/superseding claim is deliberately created under policy. `reviewedAt`, `reviewedBy`, and review/rejection detail record the verification action rather than creating a second claim lifecycle.

## 6. Organization claim flows

### 6.1 Existing organization claim

Journey:

`SIGNED-IN PERSON → SELECT/RESOLVE ORGANIZATION → ASSERT RELATIONSHIP → CLAIM RECORDED → EVIDENCE/REVIEW → VERIFIED RELATIONSHIP → SEPARATE AUTHORITY GRANT WHEN GOVERNED`

Rules:

1. The user must have a validated non-demo session unless a deliberately approved demo path is being exercised in a synthetic environment.
2. The claim must be bound to the session’s exact legacy user and universal `Person`.
3. The organization is resolved server-side by ID or another bounded public identifier. Do not trust a serialized organization object from the client.
4. Creating the claim does not add the user to the organization’s protected tenant session.
5. A contextual/pending `OrganizationMembership` may be projected only if its type/status makes its non-authoritative nature explicit.
6. Protected organization data remains inaccessible until the existing auth/RBAC authority layer independently grants access.
7. Duplicate active equivalent claims should be idempotently returned or rejected deterministically; they must not create parallel conflicting claims.
8. Conflicting claims or existing incompatible relationships require human review.

### 6.2 New organization presence

A new organization presence exists so Grid can represent supply/demand and build network value before a full Klinikos tenant is justified.

Journey:

`PERSON → NAME/LOCATION/BASIC ORGANIZATION FACTS → UNVERIFIED GRID PRESENCE → CLAIM → OPTIONAL NEED/HAVE/RESOURCE → REVIEW/PUBLICATION GATES → VERIFIED RELATIONSHIP LATER`

Rules:

1. Creating a presence must not be presented as proving legal ownership, employment, licensure, or authorization.
2. The presence may hold public-safe Grid metadata and pending Need/Have/resource records.
3. A resource may still require human review before publication/bookability.
4. A presence must not automatically become a fully privileged Clinic OS tenant.
5. If compatibility requires a backing `Organization` row because existing Grid resources are organization-scoped, that row is a network-presence compatibility container, not evidence of verified organizational authority.
6. Any compatibility organization must carry an explicit Grid-presence classification. If a newly created identity needs that row as its legacy session anchor, the user remains a restricted Grid/contractor role. The presence row may be technically active for resource/session compatibility, but neither its existence nor active status means verified organization authority or Clinic OS onboarding.
7. Existing authenticated users must not have their current tenant/session switched merely because they create a presence. For a brand-new identity, a compatibility presence may be the baseline organization required by the legacy auth schema, but protected owner/admin/clinical/financial capabilities remain denied until separately provisioned.
8. Conversion from free presence to protected organization tenant is a separate governed action with explicit authority provisioning.

### 6.3 Existing user versus new user

Existing user:

- authenticate first;
- reuse exact identity;
- no password replacement;
- no authority mutation;
- claim/presence is attached as contextual relationship only.

New user:

- may create one identity when persistence requires it;
- strong password required at repository boundary;
- may use an explicitly classified Grid presence as the legacy baseline session anchor only when current schema requires an organization row;
- remains on a restricted Grid/contractor role, never implicit owner/admin authority;
- universal `Person`, baseline relationship, and claim are created transactionally;
- claim still begins unverified unless independently verified evidence exists.

## 7. Professional claim flow

Professional identity should share the same claim vocabulary but must reuse existing provider/credentialing infrastructure.

Journey:

`PERSON → PROFESSIONAL CLAIM → PROVIDER/APPLICATION CONTEXT → CREDENTIAL EVIDENCE → HUMAN/PRIMARY-SOURCE VERIFICATION → ACTIVITY-SPECIFIC GRID ELIGIBILITY`

Rules:

1. `professional_identity` claim records the assertion.
2. Provider/credential records remain the operational credentialing system of record.
3. A professional claim does not set `Provider.verificationStatus = verified`.
4. Existing provider credential transitions remain the verification authority.
5. Grid activity eligibility remains the consequential decision engine for regulated work.
6. Verified identity is not equivalent to verified license.
7. Verified license is not equivalent to current malpractice coverage.
8. All three are still insufficient when facility privilege, jurisdiction, scope, or engagement-window requirements fail.

## 8. Evidence model

This slice does not need a new general document platform if existing document/evidence primitives can support the claim.

Evidence must be referenced, not duplicated into audit metadata.

Examples of acceptable evidence references may include:

- existing Klinikos document IDs;
- domain/email challenge result IDs;
- organization-admin invitation/approval records;
- provider credential evidence document IDs;
- bounded manual-review source references.

A domain/email challenge is evidence, not automatically proof of ownership or authority unless a future explicit policy declares it sufficient for a specific bounded verification question.

Secrets, full credential numbers where unnecessary, raw uploaded document contents, passwords, tokens, and private evidence payloads must never be copied into audit metadata or continuation URLs.

Evidence acceptance does not itself determine tenant authority.

## 9. Verification and human review

Every claim must answer four questions independently:

1. What did the claimant assert?
2. What evidence supports it?
3. What bounded fact did a reviewer or deterministic verifier establish?
4. What capability, if any, did policy grant afterward?

For organization claims, the first implementation should favor explicit human review over speculative automated ownership inference.

For professional claims, use the existing credentialing transitions and primary-source verification fields.

A claimant may never verify their own claim merely because they are the claimant. Organization-claim review must use an explicitly allowlisted reviewer policy resolved from current RBAC/system scope or a separately established authorized organization representative. The target organization relationship being claimed cannot itself bootstrap reviewer authority.

Reviewer actions must be audited with actor, timestamp, claim ID, bounded outcome, and evidence reference. Audit logs must not contain evidence contents or secrets.

## 10. Relationship projection

`OrganizationMembership` remains useful as the universal relationship projection after or during claim review, but its status and type must communicate truth.

Examples:

- pending organization claim → `organization_claimant` + `pending_verification`
- verified organization relationship → `organization_owner`, `organization_admin`, or `organization_staff` + `verified`
- Grid contractor applicant → existing `grid_contractor_applicant` + `pending_approval`

A membership is not automatically a tenant session grant. Consumers that need protected authorization must continue to use current auth/RBAC authority until a future multi-context authorization migration explicitly adopts memberships.

## 11. Grid free-value behavior

The value-first product rule requires that verification not be demanded before any useful network value exists.

Allowed before organizational verification, subject to public-safety and review policy:

- create/maintain an unverified organization presence;
- create draft Grid Need/Have/resource state;
- view public Grid information;
- receive non-sensitive matching/discovery value;
- prepare evidence or claim information.

Not allowed merely because a claim exists:

- view protected tenant records;
- act as organization owner/admin in Clinic OS;
- publish regulated capacity without required review;
- perform regulated professional work;
- approve credentials;
- create financial/clinical truth on behalf of the claimed organization;
- impersonate the organization publicly as verified.

## 12. UX semantics

The UI must never use wording that collapses the lifecycle.

Preferred vocabulary:

- “Create an organization presence” for a new network presence.
- “Claim this organization” for asserting a relationship to an existing presence/organization.
- “Claim submitted” after assertion.
- “Evidence needed” when more proof is required.
- “Under review” during verification.
- “Verified relationship” only after the configured verification succeeds.
- “Access granted” only when protected authority is separately provisioned.

Avoid:

- “Your organization is verified” when only the user identity is known;
- “You now own/manage this organization” after claim submission;
- “Account created = organization approved”;
- badges that visually imply licensure or authority from an unverified claim.

## 13. API and repository boundaries

The implementation should prefer focused repositories instead of extending the older external enrollment writer into another authority layer.

Recommended boundaries:

### `relationship-claim-repository`

Responsibilities:

- validate exact session identity for existing accounts;
- resolve one universal `Person`;
- create/idempotently return claims;
- detect conflicts;
- create pending relationship projection where appropriate;
- create review task/audit provenance;
- never mutate current session authority.

### organization-presence repository/path

Responsibilities:

- create/reuse unverified network organization presence;
- attach claim/provenance;
- create initial Grid Need/Have/resource draft/review state;
- prevent presence creation from being interpreted as Clinic OS onboarding.

### credentialing repository

Remains authority for professional credential verification.

### Grid eligibility

Remains authority for consequential regulated activity eligibility.

## 14. Duplicate and conflict semantics

The system must fail closed or behave idempotently rather than silently merge conflicting truth.

Cases:

- same person + same target + same active claim type → idempotent return where safe;
- same person + same target + incompatible active claim roles → review/conflict;
- different people claiming ownership/admin of same organization → both may exist as claims, but neither claim alone receives tenant authority; surface to review;
- existing organization matched ambiguously by user-entered name → do not guess; require explicit selection or create a clearly separate unverified presence pending deduplication;
- one legacy user resolving to multiple `Person` records → stop and require identity review;
- claim target deleted/suspended → claim cannot advance to verified/authorized state.

## 15. Security and privacy

- No raw evidence contents in URL state.
- No auth/session object serialized into URLs or browser-owned continuation data.
- No email-only account attachment.
- No client-provided `personId`, `legacyUserId`, reviewer identity, verification outcome, entitlement, or authority is trusted.
- Server re-resolves target organization/person/claim state before mutation.
- Claim review endpoints require appropriate RBAC and organization/system scope.
- Existing tenant isolation remains authoritative.
- Public organization-presence responses expose only public-safe fields.
- No PHI is required for this slice.

## 16. Audit requirements

Required durable audit events should include, using repository naming conventions:

- claim submitted;
- claim evidence referenced;
- claim review started/requested;
- claim verified;
- claim rejected;
- claim withdrawn/superseded;
- organization presence created;
- relationship projection created/updated;
- authority provisioning, if it occurs later, as a separate event.

Every claim audit must make it possible to reconstruct that a claim was an assertion and not proof at submission time.

## 17. TDD acceptance contracts

Implementation must begin RED.

Minimum regression contracts:

### Identity / authority

1. Existing user can submit a claim only when the validated session proves that exact user.
2. Email equality without a session cannot attach a claim to an existing user.
3. Existing user organization, role, status, password credential, provider link, and active session are unchanged by claim submission.
4. Ambiguous universal identity fails closed.

### Organization claim

5. Existing organization claim creates pending claim/review state but no protected tenant authority.
6. A claimant cannot read protected data from the target organization merely because the claim exists.
7. Duplicate equivalent claim is deterministic/idempotent; conflicting claim state is surfaced for review.
8. Verification transition is separately authorized and audited, and claimant self-verification is rejected.

### New organization presence

9. A new presence is explicitly unverified and cannot masquerade as a verified operational clinic.
10. Existing authenticated user can create a presence without switching current tenant/session authority.
11. New user still requires a strong password when a new identity must be created and receives only restricted Grid/contractor authority on any compatibility session anchor.
12. Initial Grid resource/Need/Have state remains draft or human-reviewed according to existing policy.

### Professional claim

13. Professional claim does not set credential or provider verification to verified.
14. Credential verification continues through the existing credentialing authority.
15. Even a verified professional remains ineligible when activity-specific Grid requirements fail.

### Security

16. Claim APIs ignore/reject client attempts to supply authoritative user/person/reviewer/verification/entitlement fields.
17. No raw evidence contents or secrets appear in audit metadata or continuation URLs.
18. Production/non-demo paths remain fail-closed where the current Grid safety model requires explicit production review.

## 18. Migration and compatibility strategy

This is additive.

Do not rewrite historical users, providers, organizations, or memberships wholesale in this slice.

Existing external Grid participant accounts remain valid compatibility records. New claim-aware paths should progressively stop creating privileged legacy tenants merely because a person asserted a relationship.

If the current `GridResourceRecord.organizationId` requirement forces an `Organization` row for an unverified presence, create/reuse a clearly marked network-presence compatibility organization. Do not treat that row’s existence or `status=active` as verified organizational authority. If the current schema cannot express that safely, add the minimum explicit presence classification/status necessary rather than relying on convention alone.

A newly created identity may use that compatibility organization as its legacy auth anchor only with the restricted Grid/contractor role. Existing authenticated identities keep their existing legacy organization/session anchor.

No backfill may infer ownership or verification from existing email/name equality.

## 19. Out of scope for this slice

- replacing legacy authentication with membership-based multi-organization sessions;
- generalized legal-entity verification across every jurisdiction;
- automated corporate-registry proof;
- automated NPI/licensure integrations not already configured;
- Klinikos 10 commercial qualification;
- full Clinic OS tenant onboarding;
- organization billing/subscription conversion;
- PHI-bearing organization workflows;
- broad social graph/following features;
- unrelated provider credentialing redesign.

## 20. Definition of done

Slice 3 is complete only when:

1. claims are durably distinct from verification, entitlement, and authority;
2. existing-account claims require exact proof of control;
3. organization claims never silently switch tenant/session authority;
4. a new organization can receive free Grid network value as an explicitly unverified presence;
5. professional claims reuse existing credentialing and activity-specific Grid eligibility;
6. duplicate/ambiguous states fail closed or idempotently resolve by declared rules;
7. audit evidence preserves provenance without secrets;
8. all focused tests, full tests, migrations/schema validation, type-check, lint, security gates, PostgreSQL MVP journeys, production build/start, and exact-head CI pass;
9. changed public/client-visible claim surfaces receive responsive/accessibility/browser acceptance;
10. PR #361 remains draft until the broader convergence scope is separately approved for review/merge.
