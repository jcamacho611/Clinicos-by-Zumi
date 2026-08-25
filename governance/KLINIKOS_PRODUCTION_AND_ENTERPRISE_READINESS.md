# KLINIKOS Production & Enterprise Readiness

Status: GOVERNING PROFESSIONAL SOFTWARE-STUDIO STANDARD
Date: 2026-08-25

## 1. Purpose

Final-form Klinikos must be operable as serious healthcare software, not merely demonstrable.

The founder should not need to know to ask for every professional engineering requirement. Agents must proactively identify, record, prioritize and implement the invisible capabilities required to securely deploy, operate, recover, support and scale the product.

## 2. Maturity states

For every capability distinguish:

- DESIGNED
- IMPLEMENTED
- INTEGRATED
- TESTED
- DEPLOYED
- PRODUCTION VERIFIED
- ENTERPRISE READY

A route, mock, adapter or passing unit test does not equal production readiness.

## 3. Definition of production ready

A supported capability requires:

`VISIBLE UI → COMPREHENSIBLE STATE → IDENTITY/CONTEXT → AUTHORIZATION → DOMAIN AUTHORITY → REAL DATA/EXTERNAL EVIDENCE → PERSISTENCE/EVENT → TRUTHFUL RESULT → AUDIT/RECONCILIATION → NEXT ACTION`

and appropriate:

- migrations
- failure states
- security review
- accessibility
- monitoring
- support/runbook
- rollback/forward-fix plan

## 4. Environment separation

Maintain clear separation for:

- local development
- automated tests
- CI
- preview
- staging where justified
- production

Do not use production PHI casually in lower environments.

## 5. Multi-tenant security

Test cross-tenant isolation for:

- reads
- writes
- search
- exports
- documents/files
- analytics
- Zumi retrieval/tools
- Grid/private resources
- admin actions
- APIs

Never treat a client-supplied tenant ID as authorization.

## 6. Identity and authorization

Authentication may include appropriate password security, verification, MFA, secure recovery/session controls and enterprise SSO when required.

Authorization considers applicable:

- organization
- location
- relationship
- role
- profession
- license/credential
- privilege
- assignment
- delegation/supervision
- purpose
- consent
- patient relationship
- break-glass state
- effective time

Admin authority is not automatic clinical authority.

## 7. Threat model

Continuously review:

- XSS
- CSRF
- SSRF
- injection
- IDOR/object authorization
- mass assignment
- file upload/path traversal
- webhook spoofing/replay
- API abuse/rate limits
- bot/credential attacks
- secret exposure
- supply-chain/dependency risk
- browser bundle/source-map disclosure
- cache/log/analytics leakage

## 8. PHI/PII data map

For sensitive data document:

- source
- purpose
- tenant
- storage
- access
- processors/subprocessors
- logs/analytics
- export/release
- retention/deletion
- backups

No accidental PHI in public URLs, SEO metadata, marketing analytics, email subjects, ordinary SMS or diagnostics.

## 9. Encryption and secrets

Use mature encryption in transit/at rest where applicable.

No hardcoded production secrets. Maintain appropriate secret storage, access and rotation.

## 10. Audit and evidence

Consequential actions require durable evidence, including where relevant:

- record access/change
- signatures/addenda
- consent/release
- permission/admin changes
- AI-assisted consequential workflow
- financial/payment/reconciliation
- Grid eligibility/transaction
- external integration transmission/status

Audit logs should be useful without becoming uncontrolled PHI dumps.

## 11. Clinical-safety engineering

For consequential clinical workflows define:

- evidence source
- human/professional authority
- AI role
- review/signature
- correction/amendment
- failure/escalation
- audit

AI never silently promotes uncertainty into clinical fact.

## 12. AI security and governance

Test Zumi for:

- prompt injection
- malicious files/content
- tool escalation
- cross-tenant leakage
- PHI leakage
- secret extraction
- policy bypass
- hallucinated product/integration/payment/clinical state
- unauthorized writes

Tool authorization remains deterministic and independent of model confidence.

## 13. Database engineering

Maintain:

- constraints/foreign keys
- indexes/query review
- transaction boundaries
- concurrency/idempotency
- pagination
- safe migrations
- data-quality/reconciliation tooling

Migrations are versioned, testable and must preserve existing data unless a reviewed migration explicitly changes it.

## 14. Backups and disaster recovery

Define and test:

- backup frequency
- retention
- encryption
- restore procedure
- restore testing
- Recovery Point Objective (acceptable data-loss window)
- Recovery Time Objective (acceptable restoration window)

A backup not restore-tested is unproven.

## 15. Business continuity

Plan for failures of:

- application/hosting
- database
- identity
- AI provider
- payment processor
- clearinghouse/payer connection
- lab/imaging interface
- communications
- telehealth
- storage
- DNS

Use queues/retries/reconciliation where appropriate. External outages must not silently lose work.

## 16. Observability

Build appropriate:

- structured logs with PHI minimization
- metrics
- traces where useful
- uptime/synthetic checks
- database monitoring
- queue/job monitoring
- webhook/payment monitoring
- integration health
- latency/performance
- cost anomalies
- error tracking

## 17. Reliability and alerts

Define internal service objectives for critical paths before contractual SLAs.

Critical alerts need owner + runbook.

Prioritize:

- outage
- security event
- database/backup failure
- critical integration failure
- reconciliation failure
- queue backlog
- resource exhaustion
- severe error-rate spike

## 18. Incident response

Use severity-based response with:

- detection
- containment
- impact assessment
- evidence preservation
- recovery
- root cause
- corrective actions
- customer/legal/compliance communication where required

Maintain separate privacy/security breach response.

## 19. Release governance

Before consequential release run appropriate:

- schema/migration checks
- typecheck
- lint
- unit/domain/integration tests
- tenant-isolation/security negatives
- clinical safety tests
- production build
- route/browser smoke
- mobile/accessibility
- bundle confidentiality review

Protect production-critical branches after reliable required checks are operational.

## 20. Feature flags / rollback

Use governed flags for risky/experimental/customer-specific rollout where appropriate.

Every major release must answer how it can be rolled back or forward-fixed, including database compatibility.

## 21. Golden end-to-end journeys

Maintain repeatable/automated verification for:

- organization/account activation
- patient registration
- appointment/intake
- Current Visit/signature
- orders/results
- coding/revenue readiness
- payment
- Grid demand/fulfillment
- EDU participant/instructor
- enterprise admin

Test failure and partial states, not only success.

## 22. Performance and scale

Audit:

- client bundle
- page/server latency
- N+1/slow queries
- payload size
- AI latency/cost
- background-job throughput
- large data/pagination

Run realistic load tests before claiming scale.

Model 10, 100, 1,000, 10,000+ organizations and identify scale triggers rather than prematurely introducing complexity.

## 23. Queues / background processing

Use for appropriate integrations, documents, AI, notifications, analytics, imports/exports and reconciliation.

Require:

- idempotency
- retries
- visibility
- dead-letter/reconciliation path

## 24. API / webhook engineering

APIs need auth, authorization, validation, pagination, limits, errors, observability and version strategy.

Webhooks need signature validation, replay defense, idempotency, evidence and reconciliation.

## 25. Integration lifecycle

Canonical internal objects + replaceable adapters.

States may include:

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

`CONNECTED` is not `PRODUCTION VERIFIED`.

## 26. Design-system governance

Marble/Obsidian remains one governed system covering typography, spacing, semantic state, controls, forms, tables, dialogs, navigation, charts, object stages, responsive behavior and accessibility.

No page-specific visual drift.

## 27. Public website professional standard

Audit:

- brand consistency
- navigation/information architecture
- copy
- responsiveness
- performance
- accessibility
- legal/trust surfaces
- forms/CTAs
- SEO/social metadata
- 404/500/loading/error states

No fake logos/testimonials/traction. No placeholders/dead buttons.

## 28. Trust center

Build toward truthful public enterprise trust information:

- security overview
- privacy
- subprocessors
- data protection
- responsible AI
- accessibility
- status/availability where mature
- security contact

Never publish controls not implemented.

## 29. Enterprise procurement readiness

Prepare truthful answers/evidence for:

- ownership/company details
- hosting/data location
- access control
- backups/DR
- incident response
- BAA/DPA capability
- subprocessors
- insurance
- vulnerability management
- uptime/reliability
- deployment/change control
- penetration-test strategy/results when completed
- retention/deletion/export
- SSO
- integrations/APIs
- support/SLA model

## 30. Security assurance roadmap

Progressively build evidence toward relevant commercial assurance such as HIPAA security-program maturity, penetration testing and SOC 2 readiness/audit when justified. Do not claim completion before independent evidence exists.

## 31. Support/customer success

Design professional:

- support intake/priority
- safe diagnostics
- engineering/security/privacy/clinical escalation
- onboarding
- training
- first-value tracking
- adoption/value evidence
- renewal/expansion risk

Support role does not automatically grant broad PHI access.

## 32. Migration/onboarding

Make deployment repeatable:

- organization/locations
- staff/providers/roles
- services/configuration
- data import/mapping
- integrations
- validation/reconciliation
- training/go-live checklist

Migration difficulty is a sales blocker and must be treated as product infrastructure.

## 33. Vendor/subprocessor risk

Track critical providers for:

- purpose/data
- contract/BAA/DPA
- security/privacy review
- reliability
- lock-in/exit path
- portability
- fallback

Provider abstraction reduces concentration risk.

## 34. Email/domain professionalism

Maintain domain/DNS/TLS and appropriate SPF/DKIM/DMARC, transactional reputation, bounce/suppression handling and owned role-based contacts.

## 35. Cost/FinOps

Track direct variable cost by tenant/value event where practical:

- AI
- messages/voice
- maps
- verification
- storage/bandwidth
- payment fees
- integration
- support

Detect abnormal spend and bound expensive usage.

## 36. Founder-invisible checklist

Agents proactively identify missing:

- security controls
- tests
- indexes
- backups/restores
- monitoring/alerts
- runbooks
- incident response
- rate limits
- idempotency
- rollback
- migration safety
- accessibility
- legal/trust surfaces
- support paths
- analytics privacy
- data retention/export
- vendor risk
- procurement evidence
- load/performance testing

The absence of a founder request is never permission to omit professional engineering requirements.

## 37. Enterprise-ready definition

Enterprise readiness progressively means:

- strong tenant isolation
- enterprise identity
- auditable actions
- security/privacy program
- reliability evidence
- data governance
- migration/onboarding discipline
- support/escalation
- procurement documents
- contract/entitlement model
- integration governance
- backup/DR evidence
- tested scale/performance

A large UI is not enterprise readiness.
