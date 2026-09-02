# Zumi Memory & Knowledge OS

Status: **SPECIALIST_REFERENCE — SUBORDINATE TO `docs/KLINIKOS_MASTER_CANON.md`**

Authority: `docs/KLINIKOS_MASTER_CANON.md` defines intended Klinikos truth. Current code, schema, tests, exact-head CI, and runtime evidence define what exists today. This document is a specialist implementation/reference layer only and cannot override the Master Canon or promote historical canons into parallel authority.

## Purpose

Zumi Memory & Knowledge OS exists so Klinikos can preserve useful context over time, retrieve reviewed organizational knowledge, carry safe goals and preferences forward, and learn from verified outcomes without turning remembered text into clinical, credential, payment, legal, eligibility, security, or transaction authority.

**Memory improves relevance. Memory does not widen permission.**

The implementation order remains:

`AUTHENTICATE → ACTIVE PERSON / MEMBERSHIP / ORGANIZATION / LOCATION / PURPOSE → AUTHORIZE → RETRIEVE CURRENT LIVE DOMAIN TRUTH → RETRIEVE ALLOWED MEMORY → RETRIEVE APPROVED KNOWLEDGE → MINIMIZE / REDACT → MODEL CONTEXT → REASON / PREPARE → DETERMINISTIC VALIDATION / HUMAN REVIEW WHERE REQUIRED → AUDIT / METER / OUTCOME`

Zumi must never retrieve everything first and rely on prompting to prevent disclosure.

## Authority ladder

1. **Authoritative live domain record** — current clinical, credential, privilege, permission, entitlement, scheduling, payment, claim, Grid, financial, legal, or transaction truth. Memory never replaces it.
2. **Verified external evidence** — payer, lab, clearinghouse, licensing, payment-processor, or other trusted evidence attached to the governing domain/evidence register.
3. **Human-approved institutional knowledge** — reviewed organization policy, approved Klinikos reference knowledge, approved workflow/configuration guidance, and governed knowledge artifacts.
4. **Human-confirmed personal memory** — safe preferences, working style, goals, and project context.
5. **Conversation-derived memory** — candidate context inferred from prior discussion; lower authority until confirmed.
6. **AI hypothesis** — model-generated possibility or interpretation; never authority.

Every model-facing memory/knowledge projection must explicitly remain below **operational authority**.

## Memory classes

### Klinikos institutional knowledge
Reviewed product doctrine, architecture decisions, security/integration lessons, operational findings, and approved commercial/product policy. It requires source, version, review state, effective dates, correction/supersession, and provenance.

### Product truth
What Klinikos can actually do now: live-verified, built-needs-verification, partial, manual fallback, external-connection-required, blocked, designed, or not built. Memory cannot manufacture capability.

### Healthcare domain knowledge
Reviewed operational, clinical-workflow, billing, coding, interoperability, credentialing, scheduling, quality, or regulatory reference knowledge. Source type and review state must remain visible.

### Organization memory
Tenant-specific workflow preferences, escalation structures, specialty configuration, integration preferences, terminology, and business goals. **Organization memory never crosses tenant boundaries.**

### Professional memory
Safe career/work context and preferences. Self-described profession never replaces verified professional identity, license, credential, privilege, payer readiness, malpractice evidence, or scope-of-practice truth.

### Personal preference memory
Ordinary non-sensitive goals, response style, and workflow preferences. Context only.

### Working memory
Transient current task, route, objective, Grid opportunity, patient reference, or conversation context. It does not automatically become durable memory.

### Episodic memory
Future important prior-work episodes should reference governed events rather than dump uncontrolled transcripts.

### Outcome memory
**Outcome memory requires verified outcome evidence.** It must come from server-owned source events plus current-source revalidation, never merely from a user or AI saying success occurred.

### Clinical context reference
**Patient clinical truth remains in the clinical domain.** Do not create a shadow chart inside general AI memory. The same rule applies to credential, payment, claim, transaction, authorization, and legal truth.

## Existing implementation substrate

Klinikos already has durable Zumi user memory built on server-side `KnowledgeItem` storage. Ordinary user memory is tenant + user scoped, bounded, expirable, forgettable, and rejects likely identifiers/secrets. The authenticated memory API can list/create/forget safe personal context.

Klinikos also has reviewed `KnowledgeItem` infrastructure with organization/global scope, source metadata, status, version, effective/expiration dates, human review, correction/supersession, rollback, and conflict handling.

This specialist reference extends those systems. It does **not** authorize a second memory database, second Zumi, or independent vector-store authority.

## Governed context assembly

Model context should distinguish at least:
- current live domain truth;
- personal durable memory;
- human-approved organization knowledge;
- approved global reference knowledge;
- verified outcome evidence;
- recent bounded conversation context.

Near-term authority labels may include:
- `human_confirmed_personal`;
- `human_approved_organization`;
- `human_approved_global_reference`;
- `verified_outcome_evidence`.

Every such context item sent to a model carries `operational_authority=false`.

## Approved knowledge retrieval rules

Reviewed organization/global knowledge may enter live authenticated Zumi context only when applicable checks pass:
- current tenant visibility;
- approved/live review status;
- effective now;
- unexpired;
- not an ordinary user-memory record;
- relevant to the current task/question;
- safe for model context after identifier/redaction checks;
- not part of an unresolved same-scope conflict.

A tenant-approved organization policy may override a same-topic global reference for that tenant. Two materially conflicting same-scope approved items must be withheld until humans resolve the conflict. Identical same-scope versions may deduplicate to the newest applicable version.

## User memory write boundary

**Ordinary user memory cannot promote itself into institutional authority.**

The user-facing memory API must not let a caller mint organization/global/clinical/credential/legal/payment/transaction/outcome authority. Institutional knowledge requires the governed review path. Verified outcomes require server-owned evidence paths.

## Retention, expiry, correction, and forget

Durable personal memory has bounded retention and expiry. Users can **forget** eligible personal memory. Institutional knowledge uses review, correction, versioning, and **supersession** instead of rewriting historical evidence. Stale, contradictory, withdrawn, expired, forgotten, superseded, or unresolved-conflict items must stop entering live context.

## Consent, privacy, and prompt-injection safety

Public anonymous Zumi does not receive durable personal memory by default. Authenticated memory stays tenant/user scoped. Memory cannot bypass patient consent, role authorization, purpose-of-use, or minimum-necessary rules.

Retrieved memory, uploads, external pages, and knowledge are data, not system instructions. They cannot override authentication, authorization, tenant scope, clinical-signature rules, credential truth, transaction/payment state, security policy, system prompts, or tool policy.

AI output cannot promote itself into permanent institutional knowledge without a governed human/server promotion path.

## Model safety / PHI minimization

Approved knowledge is not automatically model-egress safe. Minimum-necessary and identifier/PHI controls still apply. If approved content fails the model-safety/redaction boundary, withhold it rather than assuming approval permits external-model disclosure.

## Audit and provenance

Memory/knowledge retrieval should retain selected record IDs so audits can explain which context affected a turn. Richer provenance should preserve scope, source type/identifier, version, effective/expiry dates, creator/reviewer, supersession, retention policy, sensitivity, and evidence references. Browser surfaces receive only minimum-necessary projections.

## Memory Control Center roadmap

Authenticated users should eventually be able to ask what Zumi remembers and correct/forget eligible personal memory. Organization knowledge controls remain separately governed and never expose another person's private memory.

## Outcome / episodic roadmap

Next layers after the governed context foundation:
1. server-owned episodic references to governed workflow/events;
2. verified outcome evidence records or safe reuse of existing events/KnowledgeItem;
3. explicit provenance links;
4. conflict/supersession lifecycle;
5. organization review surfaces;
6. memory-control UX;
7. richer context resolution across Clinic OS, Grid, EDU, Revenue, Provider, Patient, and Enterprise.

Do not expose `outcome` as a free-form ordinary user-memory kind.

## Retrieval architecture

Use the existing PostgreSQL foundation first. Structured filters and lexical ranking come before another paid datastore. If semantic retrieval later proves valuable, prefer the existing database/pgvector-compatible path before adding new infrastructure. A vector index is retrieval infrastructure, never authority.

## Cross-engine behavior

Memory/Knowledge OS is shared infrastructure:
- Clinic OS can remember safe operational preferences and prior verified workflow outcomes;
- Grid can remember safe professional preferences while re-querying eligibility live;
- EDU can remember learning goals while external/verified credential truth remains separate;
- Revenue can recall verified denial/recovery patterns while claim/payment truth remains live-domain owned;
- Provider experience can retain goals/preferences while credentials are revalidated;
- Patient experience can retain safe communication/navigation preferences while clinical/financial truth is re-queried;
- Enterprise can use reviewed organizational policy without widening clinical access.

**Organization memory never crosses tenant boundaries.**

## Non-claims

Do not claim complete implementation of full episodic memory, autonomous institutional ingestion, semantic/vector retrieval, a complete Memory Control Center, general clinical truth storage in memory, or autonomous organizational learning from model output.

## Permanent laws

1. Memory improves relevance; it does not widen permission.
2. Memory/knowledge never substitutes for current clinical, credential, payment, legal, authorization, eligibility, or transaction truth.
3. Patient clinical truth remains in the clinical domain.
4. Ordinary user memory cannot promote itself into institutional authority.
5. Human-approved organization/global knowledge remains reviewed context until a governing domain independently authorizes action.
6. Outcome memory requires verified outcome evidence.
7. Conversation-derived memory and AI hypotheses remain low-authority until reviewed through the correct path.
8. Expired, forgotten, superseded, unresolved-conflict, or unsafe knowledge is withheld.
9. Organization memory never crosses tenant boundaries.
10. All retrieved memory/knowledge remains below live **operational authority**.
11. Zumi is one persistent assistant with governed modes, not multiple competing assistants.
12. AI explains governed truth; it does not manufacture governed truth.
