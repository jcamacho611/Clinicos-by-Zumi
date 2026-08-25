# Enterprise OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P3/P4

## Purpose

Make Klinikos deployable across large organizations, health systems, multi-location groups, payers, institutions and enterprise networks without weakening tenant isolation, authorization or product simplicity.

## Personas

- enterprise executive
- enterprise admin
- security/procurement
- regional/location admin
- department/service-line leader
- IT/integration admin
- customer success/support

## Primary questions

- **Where is this organization out of policy, performance or capacity?**
- **Who is allowed to do what, where, and why?**
- **Which integrations, locations or teams need attention?**

## Frontend surfaces

- organization hierarchy
- locations/departments/service lines
- delegated administration
- enterprise Living Home
- policy/configuration
- entitlements/contracts
- SSO/identity setup
- access reviews
- integrations
- audit/security evidence
- enterprise analytics
- support/implementation status

## Domain authority

Enterprise OS owns hierarchy, enterprise configuration/policy, delegated administration, contract entitlement projections, access-review workflows and enterprise integration governance. It does not override clinical/professional authority or domain-specific truth.

## Backend services

- OrganizationHierarchyService
- EnterprisePolicyEngine
- DelegatedAdminService
- EnterpriseEntitlementService
- SSOService
- SCIMService when justified
- DomainVerificationService
- EnterpriseAccessReviewService
- IntegrationGovernanceService
- EnterpriseAuditService
- SecurityEvidenceService
- EnterpriseReportingService
- ContractEntitlementService
- EnterpriseSupportService

## Canonical data

Organization, ParentChildRelationship, Facility, Location, Department, ServiceLine, Team, EnterprisePolicy, DelegatedAdminAssignment, IdentityProviderConnection, AccessReview, ContractEntitlement, EnterpriseIntegrationPolicy, SecurityEvidenceReference, SupportTier.

## Hierarchy

Support parent/subsidiary/facility/location/department/service-line/team relationships without assuming all customers need the deepest hierarchy.

Scope configuration and permissions to the smallest appropriate boundary.

## Enterprise identity

Support appropriate:

- OIDC
- SAML
- domain verification
- delegated admin
- session policies
- MFA policies
- SCIM/provisioning when commercially justified

Enterprise identity extends platform identity; it does not replace it.

## Contract entitlements

Map commercial agreement to:

- products
- locations
- usage
- support tier
- term/effective dates
- optional features
- integration allowances

Do not implement entitlement as UI hiding.

## Commands

- create/update hierarchy
- configure enterprise policy
- configure identity provider
- delegate/revoke admin
- initiate access review
- configure integration policy
- activate contract entitlement from authoritative commercial evidence

## Events produced

EnterpriseHierarchyChanged, EnterprisePolicyChanged, DelegatedAdminChanged, SSOConfigured, AccessReviewRequired, AccessReviewCompleted, ContractEntitlementChanged, EnterpriseIntegrationPolicyChanged.

## Events consumed

Financial/contract activation, Identity membership/credential state, Trust/Assurance evidence, Integration Hub health, support/customer-success state.

## Zumi

May explain enterprise configuration, summarize multi-location issues, prepare access reviews, identify integration/policy gaps and route owners. It cannot grant unauthorized privileges or invent contract rights.

Autonomy: L0-L3; deterministic low-risk reporting/status operations may be L4 after explicit policy.

## Procurement requirements

Enterprise buying paths should be able to answer truthfully:

- who owns/operates Klinikos
- data hosting/location
- tenant isolation
- access control
- backups/DR
- incident response
- BAA/DPA process
- subprocessors
- cyber/Tech E&O when obtained
- vulnerability management
- uptime/monitoring evidence
- deployment/change control
- penetration-test status when real
- retention/deletion/export
- SSO
- integration/API capabilities
- support model

## Security

- strong hierarchical authorization
- no parent-org data bleed by assumption
- access review/audit
- SSO fail-safe/recovery
- least privilege
- privileged admin controls
- enterprise configuration versioning

## Customer value

Centralizes governance across many locations without forcing every employee to learn enterprise complexity.

## Monetization

Custom annual enterprise agreements, implementation/migration, premium support, integrations, advanced governance and analytics.

## Tests

- hierarchy scoping
- delegated admin boundaries
- SSO/member mapping
- entitlement server enforcement
- access-review lifecycle
- parent/subsidiary isolation
- integration governance
- enterprise audit

## Definition of done

A multi-location enterprise can manage hierarchy, identity, entitlements, integrations and policy with explicit scope and audit while ordinary users still experience simple role-appropriate workflows.