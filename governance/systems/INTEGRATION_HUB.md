# Integration Hub Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P2/P3

## Purpose

Make external systems replaceable, observable adapters so Klinikos owns the workflow and canonical internal state even when authoritative external rails remain necessary.

## Permanent law

> **The customer operates Klinikos. Klinikos operates the adapters.**

Never make a vendor-specific object the universal domain model.

## Core infrastructure

- AdapterRegistry
- ConnectionRegistry
- CredentialVault
- Outbox
- Inbox
- WebhookGateway
- RetryEngine
- DeadLetterQueue
- MappingEngine
- ReconciliationEngine
- ProvenanceService
- IntegrationHealthService
- CircuitBreaker
- RateLimitGovernor
- Version/CapabilityRegistry
- Sandbox/UAT/Production environment state

## Connection lifecycle

Use explicit truthful states:

- planned
- contracting/setup pending
- credentials pending
- sandbox
- connected
- UAT
- controlled production
- production verified
- degraded
- disabled

`CONNECTED` does not mean `PRODUCTION VERIFIED`.

## Adapter categories

- EHR/EMR
- FHIR/SMART
- HL7 v2
- payer/eligibility/authorization
- clearinghouse/X12
- lab
- imaging/PACS/DICOM/DICOMweb
- pharmacy/eRx
- payments
- telemedicine/video
- SMS
- email
- voice
- fax
- identity/credential verification
- government/public data
- accounting/enterprise systems
- device/remote monitoring

## Canonical pattern

`DOMAIN COMMAND → INTERNAL OUTBOX → ADAPTER → EXTERNAL SYSTEM → ACKNOWLEDGMENT/RESPONSE → INBOX → MAPPING/VALIDATION → DOMAIN EVENT → RECONCILIATION`

Do not have random route handlers call vendors directly when a durable integration path is required.

## Adapter contract

Each adapter records:

- adapter ID
- provider/vendor
- capability
- environment
- data classes handled
- credentials source
- request/response schema
- mapping version
- timeout/retry policy
- idempotency strategy
- webhook verification
- rate limit
- health check
- current lifecycle state
- reconciliation behavior
- owner
- contract/BAA/DPA requirements where applicable

## Provenance

Every imported external fact should retain source/provider, external identifier, observed/received time, mapping version and evidence sufficient for reconciliation.

## Reconciliation

Uncertain states become explicit work.

Examples:

- request sent, acknowledgment missing
- duplicate webhook
- unknown code
- payer response cannot match patient/coverage
- result cannot match order
- remittance cannot match claim
- external vendor says success but local persistence failed

Never silently discard.

## Security

- credentials server-side/secret manager
- webhook signature verification
- replay protection
- strict input validation
- SSRF protections for configurable endpoints
- outbound allowlists where appropriate
- PHI-minimized logs
- tenant/connection scoping
- encrypted transport
- least-privilege vendor accounts

## Observability

Track per integration:

- last success/failure
- latency
- backlog
- retry count
- dead-letter count
- reconciliation count
- rate-limit state
- credential expiration
- provider outage/degradation

## Zumi

May explain integration status, prepare setup/checklists, surface failed exchanges and route reconciliation work. It must not claim a connection is live without Integration Hub evidence.

## Customer value

Eliminates portal hopping, reduces vendor lock-in and makes switching providers less disruptive.

## Economics

Supports integration setup fees, recurring connector fees, enterprise plans and future provider arbitrage where lawful/contractually allowed.

## Tests

- adapter contract conformance
- idempotency
- duplicate/out-of-order messages
- signature/replay security
- retry/dead-letter
- mapping versions
- cross-tenant connection isolation
- provider degradation
- reconciliation
- truthful lifecycle state

## Definition of done

A supported external workflow can be sent, acknowledged, retried, mapped, persisted, reconciled and monitored through a replaceable adapter with evidence and without exposing vendor complexity to the end user.