# Zumi Intelligence Runtime Blueprint

Status: GOVERNING DOMAIN BLUEPRINT
Phase: P0/P1/P2

## Purpose

Provide one governed intelligence identity that can understand intent, assemble authorized context, prepare work, invoke real domain tools, monitor outcomes and explain results without becoming the final authority for regulated or consequential truth.

## Product promise

Zumi should progressively feel like an intelligent operations team embedded in Klinikos.

Not merely chat.

Operating loop:

`OBSERVE → UNDERSTAND → PREPARE → VALIDATE → ROUTE → EXECUTE WHEN AUTHORIZED → MONITOR → RECONCILE → ESCALATE → EXPLAIN`

## User-facing identity

One Zumi entry across public and authenticated experiences. Internal specialized capabilities are invisible unless useful to explain.

## Internal capability families

- Front Desk Agent
- Insurance Agent
- Authorization Agent
- Clinical Preparation Agent
- Ambient Scribe
- Coding Agent
- Revenue Agent
- Referral Agent
- Grid Agent
- EDU Agent
- Sales Concierge
- Qualification Agent
- Operating Map Agent
- Proposal Agent
- CRM Agent
- Onboarding Agent
- Customer Success Agent
- Support Agent
- Webmaster/SEO Agent
- Enterprise Operations Agent

## Runtime components

- IntentRouter
- ContextAssembler
- AuthorityResolver
- PolicyEngine
- ToolRegistry
- AgentOrchestrator
- WorkflowPlanner
- EvidenceResolver
- ModelRouter
- MemoryResolver
- HumanApprovalService
- CostGovernor
- EvaluationEngine
- PromptRegistry
- AIAuditService
- SafeStructuredResponseBuilder

Reconcile names with current Zumi implementation before adding new abstractions.

## Autonomy levels

### L0 Observe

Read and explain authorized state.

### L1 Recommend

Suggest a next action with evidence.

### L2 Prepare

Prepare a draft, packet, structured action or proposed change.

### L3 Execute after approval

Authorized user reviews and explicitly approves before real domain mutation.

### L4 Pre-authorized autopilot

Only for low-risk, deterministic, reversible/observable operations that the organization explicitly enabled.

Examples may include eligibility checks, status polling, routine reminders, CRM stage updates from deterministic evidence, retry/reconciliation and readiness summaries.

### L5 Prohibited autonomy

Zumi must not independently become final authority for:

- diagnosis
- treatment decision
- prescription authority
- clinical signature
- patient consent
- professional licensure/credential truth
- high-risk clinical decisions
- unauthorized payment/settlement
- legal attestation

## Tool contract

Every Zumi tool declares:

- tool ID
- owning domain
- description
- input schema
- output schema
- required context
- authorization rule
- PHI sensitivity
- autonomy ceiling
- whether human approval is required
- idempotency behavior
- audit requirements
- timeout/retry policy
- failure copy
- cost class

Zumi never mutates a database directly when a domain service owns the action.

## Public Zumi

Public mode may:

- explain Klinikos
- route to public pages
- build Operating Map from non-PHI answers
- qualify buyer
- explain approved pricing/offers
- answer public product/security questions from approved sources
- create approved CRM lead state

Public mode must refuse/redirect:

- patient-record retrieval
- diagnosis/prescribing
- private prompts/source code
- secrets
- internal pricing/margin logic
- security heuristics
- private customer data

## Authenticated Zumi

Context includes active user, organization/location, role/profession/assignment, patient/case only when authorized, product entitlements, consent/purpose, and source-domain evidence.

Context is assembled server-side and minimized.

## Morning autopilot

Where configured, evaluate:

- today's/tomorrow's appointments
- intake/forms
- coverage eligibility
- authorization
- staff coverage
- rooms/equipment
- telemedicine readiness
- results requiring review
- open referrals
- unsigned documentation
- revenue blockers
- integration health

Output an executive brief such as:

**24 patients are ready. Four things need attention. I prepared everything I safely could.**

## End-of-day autopilot

Check:

- incomplete encounters
- unsigned notes
- unresolved orders/results/referrals
- coding review
- claim/revenue blockers
- callbacks
- expiring authorizations
- payment/reconciliation exceptions
- next-day readiness

## Ambient clinical assistance

Flow:

`CONSENT → AUDIO/DICTATION → TRANSCRIPTION → CONCEPT/EVIDENCE EXTRACTION → DRAFT NOTE → MISSING INFORMATION → CODING CANDIDATES → PROVIDER REVIEW → SIGNATURE`

Preserve provenance. Never invent physical findings, diagnoses, orders, laterality or review events.

## Memory

Memory is context, not authority.

Memory types should distinguish:

- user preference
- organization preference
- prior workflow context
- approved knowledge
- task history

Clinical/financial truth always resolves from authoritative domains rather than memory.

## Model/provider routing

Allow multiple AI providers/models where useful. Route by quality, latency, cost, privacy obligations, availability and task risk.

Use deterministic logic when AI is unnecessary.

## Safety/evaluation suites

Maintain evals for:

- hallucination
- unsupported product/integration claims
- clinical overreach
- coding overreach
- unsupported revenue claims
- cross-tenant leakage
- PHI leakage
- prompt injection
- malicious documents/content
- tool escalation
- unauthorized write attempts
- stale memory
- cost/latency
- evidence grounding

## Cost governance

Measure cost per successful value event rather than messages alone.

Examples of value events:

- readiness issue identified/resolved
- authorization prepared
- referral closure advanced
- note draft accepted/reviewed
- claim exception prepared
- Grid demand prepared
- Operating Map completed
- customer onboarding step completed

Bound expensive free usage.

## Commands/events

Zumi primarily invokes domain commands and records AI orchestration/audit events such as ZumiIntentResolved, ZumiActionPrepared, ZumiApprovalRequested, ZumiToolExecuted, ZumiActionFailed, ZumiValueEventRecorded.

## Security

- prompts/tool policies server-side
- no browser tool secrets
- deterministic authorization independent of model confidence
- minimum-necessary context
- prompt-injection defenses for external content
- tool allowlists
- output validation
- audit consequential actions

## Failure states

- model/provider unavailable
- tool unavailable
- authorization denied
- evidence insufficient
- approval required
- source system degraded
- action uncertain/reconciliation needed

Always degrade honestly.

## Customer value

Reduces clerical work and navigation while making advanced workflows usable by ordinary staff.

## Monetization

Included allowance, premium automation, usage-based AI/voice/document processing and enterprise licensing. Usage pricing must preserve gross margin and avoid surprise bills.

## Tests

- tool authorization
- autonomy ceilings
- prompt injection
- tenant isolation
- structured output validation
- evidence grounding
- public/private boundary
- approval workflow
- idempotent tool execution
- provider failure/fallback
- cost guardrails

## Definition of done

Zumi can move a real authorized workflow from user/system intent to a validated domain action and truthful evidence-backed result without bypassing the owning system or creating unsupported facts.