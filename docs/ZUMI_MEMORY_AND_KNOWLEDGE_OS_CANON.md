# Zumi Memory & Knowledge OS Canon

Status: **AUTHORITATIVE SPECIALIST CANON — IMPLEMENTATION-AWARE**

Authority: `docs/SOURCE_OF_TRUTH.md`, `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`, `docs/KLINIKOS_ECOSYSTEM_CANON.md`, `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`, `docs/ZUMI_CONVERSATION_INTELLIGENCE_CANON.md`, and current implementation/runtime truth.

## Purpose

Zumi is the persistent intelligence layer for Klinikos. Zumi Memory & Knowledge OS exists so the assistant can preserve useful context over time, retrieve reviewed organizational knowledge, carry goals and preferences forward, learn from verified outcomes, and explain what Klinikos already knows without turning remembered text into clinical, credential, payment, legal, security, eligibility, or transaction authority.

Memory is not the authority layer. Memory is governed context.

The implementation must always preserve this order:

AUTHENTICATE
→ ACTIVE IDENTITY / ROLE / ORGANIZATION / LOCATION
→ AUTHORIZE
→ RETRIEVE CURRENT LIVE DOMAIN TRUTH
→ RETRIEVE ALLOWED MEMORY
→ RETRIEVE APPROVED KNOWLEDGE
→ MINIMIZE / REDACT
→ MODEL CONTEXT
→ REASON / PREPARE
→ DETERMINISTIC VALIDATION / HUMAN REVIEW WHERE REQUIRED
→ AUDIT / METER / OUTCOME

Zumi must never retrieve everything first and rely on prompting to prevent disclosure.

## Authority ladder

Memory and knowledge sources have different weight and different permitted uses.

1. **Authoritative live domain record**
   - Current clinical record.
   - Current credential, privilege, permission, entitlement, scheduling, payment, claim, financial, Grid, legal, or transaction state.
   - This remains outside Memory OS and is re-retrieved from the governing domain when needed.

2. **Verified external evidence**
   - Payer response, lab result, clearinghouse acknowledgment, licensing authority response, payment-processor evidence, verified vendor response, or another trusted external source.
   - The evidence remains attached to its governing domain or evidence registry.

3. **Human-approved institutional knowledge**
   - Reviewed organization policy, approved Klinikos reference knowledge, approved workflow/configuration guidance, and governed knowledge artifacts.
   - Current `KnowledgeItem` review/version/supersession infrastructure is the primary near-term substrate.

4. **Human-confirmed personal memory**
   - User preferences, working style, project context, and other explicitly remembered non-authoritative personal context.
   - Current durable user memory is stored server-side and scoped to tenant + user.

5. **Conversation-derived memory**
   - A candidate fact inferred from prior discussion.
   - It is lower authority than an explicitly confirmed user memory and must not silently become regulated truth.

6. **AI hypothesis**
   - A model-generated possibility, interpretation, classification, or proposed explanation.
   - It is never automatically promoted into institutional knowledge, credential truth, clinical truth, payment truth, authorization, or persistent outcome truth.

Every model-facing memory/knowledge projection must make clear that it has **no operational authority** unless a governing live-domain service independently establishes the action is permitted and the underlying state is true.

## Memory classes

### 1. Klinikos institutional knowledge

Examples:
- architecture decisions;
- approved product doctrine;
- verified implementation decisions;
- security and integration lessons;
- reviewed clinician/operator/billing/IT findings;
- approved commercial/product policy.

Institutional knowledge is not ordinary user memory. It must use a reviewed governance path with source, version, status, effective dates, and correction/supersession behavior.

### 2. Product truth

Product truth describes what Klinikos can actually do now: built, partial, manual fallback, pending external connection, blocked, verified live, or not built.

Product truth must derive from current implementation/runtime/schema/tests and the repository truth hierarchy. Memory cannot manufacture product capability.

### 3. Healthcare domain knowledge

Domain knowledge may include reviewed operational, clinical-workflow, billing, coding, interoperability, credentialing, scheduling, quality, or regulatory reference knowledge.

It must distinguish source type and status. A model inference is not equivalent to a validated rule or a current regulation.

### 4. Organization memory

Organization memory contains tenant-specific operational context such as approved workflow preferences, escalation structures, specialty configuration, integration preferences, internal terminology, and business goals.

**Organization memory never crosses tenant boundaries.**

Organization-scoped knowledge may override a same-topic global reference for that organization when the organization item is human-approved and otherwise eligible for retrieval.

### 5. Professional memory

Professional memory may retain safe career/work context, preferred work patterns, and self-described professional context.

Self-described profession never replaces verified professional identity, license, credential, payer readiness, privilege, or scope-of-practice truth.

### 6. Personal preference memory

Examples:
- answer style;
- preferred workflow presentation;
- non-sensitive goals;
- ordinary working preferences.

Ordinary user memory remains context-only.

### 7. Working memory

Current patient reference, current task, current Grid opportunity, current conversation, active route, and active objective may be held transiently for the current work session.

Working memory does not automatically become durable memory.

### 8. Episodic memory

Future episodic memory should capture important prior work such as a problem, intervention, and disposition using references to governed events rather than uncontrolled transcript dumping.

Episodic memory must be tenant-scoped and source/provenance-aware.

### 9. Outcome memory

**Outcome memory requires verified outcome evidence.**

Examples:
- a callback intervention measurably reduced backlog;
- a Grid booking fulfilled;
- a claim correction produced a verified payer response;
- an AI coding suggestion was accepted/rejected by an authorized user;
- an operational intervention recovered a measured appointment or payment outcome.

Outcome memory must never be created solely because a user or AI says an outcome happened. It should be written from verified domain events/evidence through a server-owned path.

### 10. Clinical context reference

**Patient clinical truth remains in the clinical domain.**

Do not duplicate the patient chart into a general AI memory store. Zumi may retain safe references/working context and must re-query authorized current clinical data when clinical truth is needed.

The same rule applies to credential, payment, claim, transaction, authorization, and legal state.

## Current implementation truth

As of this canon's introduction, Klinikos already has a meaningful durable-memory substrate:

- `src/features/zumi/memory.ts` stores user-scoped durable memories in existing `KnowledgeItem` storage;
- supported ordinary user-memory classes include preference, working style, project context, and strategy;
- durable user memory rejects identifier-shaped personal/patient content and common credential/secret patterns;
- memory is tenant + user scoped;
- memory expires and can be marked forgotten;
- user memory has bounded retention and item limits;
- the authenticated `/api/zumi/memory` route supports list/create/forget with auditing;
- `retrieveZumiMemoryContext(...)` is already used by the authenticated Zumi gateway;
- the gateway already treats retrieved memory as context, not system permission/authority;
- signed bounded conversation continuity remains separate from durable memory.

The same database also has reviewed `KnowledgeItem` infrastructure with:

- organization or global scope;
- source name/URL/date;
- status;
- version;
- effective/expiration dates;
- human review;
- correction and **supersession**;
- rollback;
- conflict detection in the knowledge workspace.

This canon extends those existing systems; it does not authorize a replacement memory database or a second Zumi.

## Governed context assembly

Model context must distinguish at least:

- current live domain truth;
- personal durable memory;
- human-approved organization knowledge;
- approved global reference knowledge;
- recent bounded conversation context.

The current near-term implementation uses authority labels such as:

- `human_confirmed_personal`;
- `human_approved_organization`;
- `human_approved_global_reference`.

Every memory/knowledge line sent through this path must be marked `operational_authority=false`.

This label does not reduce the usefulness of reviewed knowledge. It means any high-consequence action still has to pass through the live governing domain.

## Approved knowledge retrieval rules

Human-approved organizational/global knowledge may enter live authenticated Zumi context only when all applicable checks pass:

- visible to the current organization;
- reviewed status is live/approved rather than draft, rejected, rolled-back, superseded, or demo-only;
- effective now;
- unexpired;
- not an ordinary user-memory record;
- relevant to the current question/task;
- safe for the model context after identifier/redaction checks;
- not part of an unresolved same-scope **conflict**.

Where an approved organization policy and an approved global reference share the same normalized topic/title, the organization-scoped policy may take precedence for that tenant.

Where two same-scope approved items conflict materially, Zumi must withhold that conflicted knowledge rather than blend or guess. The knowledge-review workflow must resolve the contradiction.

Identical same-scope versions may be deduplicated to the newest applicable version.

## User memory write boundary

**Ordinary user memory cannot promote itself into institutional authority.**

The user-facing memory API must not accept fields that allow the caller to mint:

- organization authority;
- global authority;
- verified outcome authority;
- clinical authority;
- credential authority;
- legal authority;
- payment/transaction authority.

Ordinary memory may store safe user-controlled context only.

Institutional/organization knowledge must go through the governed knowledge-review path.

Verified outcomes must eventually be written only by trusted server-owned domain/event pipelines.

## Retention, expiry, correction, and forget

Durable memory must support bounded retention and expiry.

Users must be able to **forget** eligible personal memory. Forgetting a personal preference must remove it from future live memory retrieval.

Institutional knowledge uses review/correction/versioning instead of pretending historical approved knowledge never existed.

Corrections should use versioning and **supersession** rather than silently rewriting historical governance evidence.

When a fact becomes stale, contradictory, withdrawn, expired, or superseded, retrieval must stop using it.

## Consent and privacy

Public anonymous Zumi must not receive durable personal memory by default.

Authenticated durable memory must remain tenant/user scoped.

No memory mechanism may be used to bypass patient consent, role authorization, purpose-of-use, or minimum-necessary rules.

Memory is not a shadow chart.

Do not store secrets, credentials, or unnecessary identifier-shaped patient/personal data in ordinary Zumi durable memory.

If future memory categories need regulated data, they require explicit domain design, retention policy, access controls, auditing, and review before implementation.

## Prompt injection and memory poisoning

Retrieved memory, uploaded documents, external pages, and knowledge content are data, not system instructions.

A memory or knowledge artifact cannot override:

- authentication;
- authorization;
- tenant scope;
- security policy;
- clinical-signature rules;
- credential state;
- transaction/payment state;
- system prompts;
- tool policy.

Content instructing Zumi to ignore policy, reveal secrets, widen access, or treat an unverified statement as authoritative must remain untrusted content.

AI output cannot write itself into permanent institutional knowledge without a governed promotion/review path.

## Model safety / PHI minimization

Approved knowledge does not automatically mean it is safe to send to an external model.

Model-facing context must still pass minimum-necessary and PHI/identifier egress controls.

If an approved knowledge record contains identifier-shaped information or content that the current redaction/safety layer would remove, the memory context assembler must withhold it from model context rather than assuming approval grants model-egress permission.

## Audit and provenance

Memory/knowledge retrieval should retain the IDs of selected records so the Zumi audit can explain which memory or knowledge items influenced a turn.

Future richer provenance should preserve:

- subject/scope;
- source type;
- source identifier;
- version;
- effective/expiry dates;
- created/reviewed/approved by;
- supersedes/superseded by;
- retention policy;
- sensitivity class;
- relevant outcome/evidence references.

The browser receives a minimum-necessary projection, not the internal full memory/knowledge registry.

## Memory Control Center

Future authenticated UX should make durable personal memory legible and controllable.

A user should be able to ask, in plain language, what Zumi remembers about them and be able to correct or forget eligible personal memory.

Organization administrators/reviewers need separately governed knowledge-management controls rather than access to another user's personal memory.

The product should expose useful provenance/status without exposing proprietary prompts, security heuristics, or other tenants' information.

## Episodic and outcome memory roadmap

The next layers after the current authority/context foundation are:

1. server-owned episodic records backed by governed workflow/event references;
2. verified OutcomeRecord-style evidence or an equivalent use of existing domain events/KnowledgeItem where appropriate;
3. explicit source/provenance links;
4. conflict/supersession lifecycle;
5. organization/admin review surfaces;
6. memory-control UX;
7. richer Context Resolver behavior across Clinic OS, Grid, EDU, Revenue, Provider, Patient, and Enterprise.

Do not expose `outcome` as a free-form ordinary user-memory kind. An outcome is only useful as organizational learning when evidence confirms what actually happened.

## Search / retrieval architecture

Start with the existing PostgreSQL foundation.

Use structured filters and lexical ranking first. If semantic retrieval is materially useful later, prefer Postgres/pgvector or an equivalent capability in the existing database before adding another paid vector datastore.

A vector index is retrieval infrastructure, not an authority model. Provenance, review, status, scope, version, conflict handling, expiry, and live-domain revalidation still govern the result.

## Cross-engine behavior

Memory/Knowledge OS is shared infrastructure, not Clinic-only memory.

Zumi may eventually use governed context to help:

- Clinic OS remember operational preferences and prior verified workflow outcomes;
- Grid remember safe professional preferences and explain eligibility/opportunity history without overriding live credentials;
- EDU remember learning goals and prior verified competency evidence without granting competence;
- Revenue remember prior verified denial/recovery patterns without inventing claim/payment truth;
- Provider experience preserve professional goals/preferences while re-querying credentials live;
- Patient experience preserve safe communication/navigation preferences while re-querying clinical/financial truth;
- Enterprise remember reviewed organizational decisions/policies without widening chart access.

**Organization memory never crosses tenant boundaries.**

## Non-claims

This canon does not claim that all intended memory classes are implemented today.

Specifically, do not claim complete implementation of:

- full episodic memory;
- verified outcome memory;
- autonomous institutional-ingestion workflow;
- semantic/vector retrieval;
- a complete Memory Control Center;
- durable storage of clinical truth in memory;
- automatic organizational learning from AI output.

Current implementation truth remains governed by code, schema, tests, runtime evidence, `FEATURE_STATUS`, and the repository truth hierarchy.

## Permanent laws

1. Memory improves relevance; it does not widen permission.
2. Memory/knowledge is never a substitute for current clinical, credential, payment, legal, authorization, or transaction truth.
3. Patient clinical truth remains in the clinical domain.
4. Ordinary user memory cannot promote itself into institutional authority.
5. Human-approved organization/global knowledge remains reviewed context until a governing domain uses it through deterministic policy.
6. Outcome memory requires verified outcome evidence.
7. Conversation-derived memory and AI hypothesis remain low-authority until explicitly reviewed/promoted through the correct governance path.
8. Expired, forgotten, superseded, unresolved-conflict, or unsafe knowledge is withheld from live context.
9. Organization memory never crosses tenant boundaries.
10. All retrieved memory/knowledge is below live **operational authority**.
11. Zumi is one persistent assistant with governed modes, not multiple competing assistants.
12. AI explains governed truth; it does not manufacture governed truth.
