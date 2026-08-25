# Network OS Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P3

## Purpose

Preserve useful governed relationships created through Grid, care coordination, EDU and enterprise operations so repeat interaction becomes easier without turning relationships into automatic data access.

## Product principle

> **Grid discovers. Network preserves.**

## Relationship classes

- clinic ↔ provider
- clinic ↔ clinic
- clinic ↔ lab
- clinic ↔ imaging center
- clinic ↔ business-service vendor
- employer ↔ professional
- school ↔ preceptor/site
- organization ↔ educator/training provider
- enterprise ↔ subsidiary/location/partner

## Frontend surfaces

- trusted relationships
- invitations
- preferred partners
- relationship detail
- shared purpose
- recent governed activity
- repeat booking/referral/workflow shortcuts
- relationship health/verification state

## Domain authority

Network owns relationship state, purpose and trust evidence references. It does not own patient-record permissions, credential truth or payments.

## Backend services

- RelationshipService
- NetworkInvitationService
- NetworkPurposeService
- PreferredPartnerService
- TrustEvidenceProjection
- RelationshipPolicyEngine
- NetworkActivityService
- NetworkGraphProjection

## Canonical data

NetworkRelationship, RelationshipParty, RelationshipType, Purpose, Invitation, Preference, TrustEvidenceReference, ActivityReference, RelationshipStatus.

## Core lifecycle

`DISCOVERY → INTRODUCTION → PURPOSE → APPROVAL → ACTIVE RELATIONSHIP → REPEAT INTERACTION → SUSPEND/END`

## Commands

- invite relationship
- accept/decline
- set approved purpose
- mark preferred partner where allowed
- suspend/end relationship
- request repeat interaction through owning domain

## Events produced

NetworkInvitationCreated, NetworkRelationshipCreated, NetworkRelationshipUpdated, NetworkRelationshipSuspended, PreferredPartnerChanged, RepeatInteractionRequested.

## Events consumed

GridFulfillmentCompleted, ReferralRelationshipSuggested, EDUPlacementCompleted, OrganizationVerified, CredentialStateChanged, DisputeResolved.

## Zumi

May suggest saving a successful relationship, find existing trusted relationships for a new need and route repeat activity. It may not grant record access or fabricate trust.

Autonomy: L0-L2; relationship acceptance generally human/organization controlled.

## Permissions/privacy

Relationship visibility is scoped by organization/user context. Patient-specific relationships must remain inside clinical/referral authority rather than public/general Network exposure.

## Customer value

Reduces repeated sourcing, onboarding and coordination friction.

## Monetization

Primarily increases retention, Grid repeat economics and enterprise value. Future premium network-management tools may be monetized.

## Network effect

Every successful governed interaction can reduce friction for the next one, creating a compounding relationship graph.

## Tests

- relationship != permission
- tenant visibility
- invitation acceptance
- preferred partner policy
- relationship suspension
- Grid fulfillment handoff
- no patient-data leakage

## Definition of done

A successful cross-party interaction can become an explicit governed relationship that supports faster repeat action while preserving independent authorization, credential and privacy controls.