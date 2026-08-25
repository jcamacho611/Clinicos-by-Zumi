# Identity, Credential & Trust OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P1/P3

## Purpose

Represent one evolving person across education, employment, contracting, clinical practice, ownership and network participation while keeping identity, self-description, professional authority, credential evidence, privilege and trust distinct.

## Permanent laws

- Identity != role.
- Role != profession.
- Profession != license.
- License != privilege.
- Profile != verified credential.
- Membership != clinical authority.
- Payment != eligibility.
- Relationship != permission.

## Lifelong identity path

`STUDENT → PROFESSIONAL → EMPLOYEE → CONTRACTOR → SPECIALIST → PRECEPTOR → OWNER → EMPLOYER → EDUCATOR`

One person can occupy multiple contexts simultaneously.

## Frontend surfaces

- personal/professional profile
- organization memberships
- credential wallet
- verification status
- expiring requirements
- assignments
- supervision/delegation
- privileges
- Grid eligibility explanation
- enterprise access review

## Plain-language states

- Verified
- Verification pending
- Needs review
- Expires soon
- Expired
- Not required for this role
- Not eligible yet
- Organization approval needed

Never show a "verified" badge without evidence.

## Domain authority

Identity/Trust owns person/account linkage, professional profile, credential evidence, verification lifecycle, assignments/privileges, supervision/delegation relationships and trust projections. External licensing/credential sources remain authoritative for their own facts.

## Backend services

- IdentityService
- ProfessionalProfileService
- MembershipService
- CredentialService
- VerificationService
- PrivilegeService
- AssignmentService
- DelegationService
- SupervisionService
- ExclusionCheckService
- TrustProjectionService
- CredentialExpirationEngine
- AccessReviewService

## Canonical data

Person, Account, ProfessionalProfile, OrganizationMembership, Profession, Role, License/CredentialEvidence, VerificationRecord, Privilege, Assignment, Delegation, SupervisionRelationship, ExclusionEvidence, TrustSignal, EffectiveDateRange.

## Credential evidence

Each credential/verification should capture:

- type
- issuer/source
- identifier where appropriate
- jurisdiction
- scope
- issued/effective/expiration dates
- verification method
- verifiedAt
- evidence/provenance
- current status
- organization/location applicability

## External sources

Potential adapters include:

- NPPES/NPI
- state professional licensing sources
- OIG exclusion sources
- SAM where appropriate
- payer enrollment/credentialing sources
- organization-uploaded primary/secondary evidence

No source is marked connected until current integration evidence supports it.

## Commands

- create/update self-described profile
- submit credential evidence
- request verification
- approve/reject organization-specific evidence where policy permits
- grant/revoke assignment/privilege
- establish/end supervision/delegation
- run exclusion/expiration check

## Events produced

ProfessionalProfileUpdated, CredentialSubmitted, CredentialVerified, CredentialRejected, CredentialExpired, PrivilegeGranted, PrivilegeRevoked, AssignmentActivated, AssignmentEnded, DelegationCreated, DelegationEnded, ExclusionFlagRaised, AccessReviewRequired.

## Events consumed

EDU completion evidence, organization membership changes, Grid requirement evaluations, enterprise policy, external verification responses.

## Zumi

May explain missing requirements, prepare verification requests, summarize evidence and alert on expiration. It cannot decide licensure/credential truth solely from model output.

Autonomy: L0-L2 for interpretation/preparation; deterministic verified-source updates may be L4 when provenance and matching are reliable.

## Permissions/privacy

- sensitive identifiers minimized in browser/logs
- organization can view only evidence relevant to legitimate purpose/relationship
- professional controls appropriate public profile fields
- public Grid projection excludes unnecessary credential identifiers
- access reviews/audit for consequential verification/privilege actions

## Trust model

Trust may combine verified evidence, fulfillment history and relationship evidence, but proprietary weights remain server-side. Trust score must not become a substitute for eligibility.

## Customer value

Reduces repeated credential collection, makes eligibility explainable and creates a lifelong professional identity/network asset.

## Monetization

Supports Grid, Enterprise, onboarding and optional premium professional/verification products. Avoid monetization that creates false incentives to "buy" verification.

## Tests

- identity/authority separation
- effective-date/expiration
- tenant/organization visibility
- evidence provenance
- Grid eligibility consumption
- supervision/delegation boundaries
- exclusion handling
- no public sensitive identifier leakage

## Definition of done

A person can maintain one identity across multiple professional/organizational contexts, while every consequential authority decision can point to explicit role/assignment/credential/privilege evidence rather than a generic profile flag.