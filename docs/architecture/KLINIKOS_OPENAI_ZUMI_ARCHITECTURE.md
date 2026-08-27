# KLINIKOS OPENAI-POWERED ZUMI ARCHITECTURE

Version: `2026-08-27.1`  
Status: `AUTHORITATIVE AI ARCHITECTURE`  
Primary intelligence provider: **OpenAI**  
Authority provider: **Klinikos deterministic services, never the model**

## 1. Product law

Zumi is not a chatbot bolted onto Klinikos. Zumi is the governed intelligence/orchestration layer that converts natural-language intent into authorized, inspectable Klinikos work.

OpenAI is the primary intelligence platform behind Zumi. The current provider abstraction remains because resilience, independent evaluation, specialized workloads and commercial leverage require provider independence.

## 2. Existing current-main foundation

Preserve and extend `src/features/zumi/adapters/openai-responses.ts`.

Current capabilities already include:

- OpenAI Responses API invocation;
- runtime-configured model;
- `previous_response_id` continuity;
- file search/vector-store support;
- web search with allowed-domain filtering;
- Code Interpreter opt-in;
- response-storage control;
- source collection;
- tool-usage telemetry;
- token/tool cost accounting;
- `OPENAI_BAA_ON_FILE` configuration state.

Do not replace this with a second OpenAI client unless a bounded requirement cannot be represented through the existing provider architecture.

## 3. Canonical request pipeline

```text
USER INPUT / UI INTENT
        ↓
AUTHENTICATION STATE
        ↓
ACTIVE EXPERIENCE ENVELOPE
        ↓
DATA-CLASSIFICATION + PHI GATE
        ↓
AUTHORIZED CONTEXT BUILDER
        ↓
TASK CLASSIFIER
        ↓
DETERMINISTIC POLICY / ELIGIBILITY
        ↓
ZUMI ORCHESTRATOR
        ↓
MODEL INVOCATION WHEN REASONING ADDS VALUE
        ↓
MODEL RESPONSE / TOOL PROPOSAL
        ↓
TOOL AUTHORIZATION + VALIDATION
        ↓
HUMAN CONFIRMATION WHEN CONSEQUENTIAL
        ↓
DETERMINISTIC DOMAIN EXECUTION
        ↓
VERIFY RESULT
        ↓
AUDIT / PROVENANCE / COST / EVIDENCE
        ↓
INTERFACE MATERIALIZATION + NEXT ACTION
```

## 4. Capability classes

Zumi may:

- READ authorized context;
- INFER non-authoritative meaning;
- EXPLAIN;
- SUMMARIZE;
- COMPARE;
- RECOMMEND;
- PREPARE;
- DRAFT;
- ROUTE;
- invoke already-authorized tools;
- verify tool-result structure;
- materialize useful interface state.

Zumi may never manufacture:

- identity;
- business ownership;
- credential/license validity;
- privileges;
- patient access;
- clinical findings;
- diagnosis/procedure truth;
- provider signature;
- consent;
- payment/settlement;
- Grid eligibility;
- legal acceptance;
- security policy.

## 5. Context builder

Never send raw database dumps to the model. Build purpose-specific context with explicit source metadata.

A context bundle should be conceptually shaped like:

```ts
interface ZumiContextBundle {
  requestId: string;
  taskClass: string;
  userContext: {
    personId?: string;
    organizationId?: string;
    locationId?: string;
    relationshipId?: string;
    purpose?: string;
  };
  authoritySummary: {
    permittedCapabilities: string[];
    forbiddenCapabilities: string[];
  };
  dataClass: 'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'PHI';
  facts: Array<{
    key: string;
    value: unknown;
    source: string;
    truthClass: 'VERIFIED' | 'CLAIM' | 'DERIVED' | 'PUBLIC';
  }>;
  unresolved: string[];
}
```

This is an invariant, not a demand for the exact type name.

## 6. Tool architecture

No unrestricted SQL/database tool.

Tools are capability-specific, for example:

- `patient.getAuthorizedSnapshot`;
- `encounter.getCurrentVisitContext`;
- `encounter.prepareDraftSection`;
- `schedule.getAvailability`;
- `grid.prepareDemand`;
- `grid.getEligibleMatches`;
- `revenue.getExceptions`;
- `edu.getLearnerContext`;
- `communications.prepareMessage`;
- `network.getAuthorizedRelationships`.

Each tool declares:

- JSON input schema;
- bounded output schema;
- authentication requirement;
- required capabilities/permissions;
- tenant/resource scope;
- data class;
- idempotency requirement;
- confirmation requirement;
- audit event;
- retry/failure behavior;
- whether the result may be returned to the model.

## 7. Model routing

Do not permanently encode model marketing names into product architecture. The runtime model map is configuration and must be updateable without rewriting product logic.

Task classes:

### Deterministic only

- authorization;
- credential state;
- payment state;
- eligibility rules;
- pricing math;
- database filtering;
- signature/consent state;
- audit;
- lifecycle transitions.

### Lightweight intelligence

- public product questions;
- navigation/intent normalization;
- simple drafting;
- low-risk summarization.

### High-reasoning intelligence

- complex workflow explanation;
- authorized operational synthesis;
- longitudinal narrative from deterministic change data;
- complex document analysis;
- multi-step plan preparation.

### Realtime / voice

Future approved use for:

- dictation;
- hands-free workflow;
- patient navigation;
- training simulation.

Voice output never becomes signed clinical truth without governed review.

## 8. Public Zumi

Public Zumi is acquisition and utility, not an anonymous tenant session.

It may:

- understand ordinary-language goals;
- explain Klinikos;
- use public-safe product knowledge;
- perform approved public research;
- preview Grid/EDU/public resources;
- carry safe intent through registration.

It may not:

- accept/process PHI;
- expose organization-private data;
- create professional authority;
- invoke authenticated actions;
- persist private memory into a future tenant without explicit binding.

## 9. Authenticated operational Zumi

Authenticated Zumi uses the Active Experience Envelope and may access only purpose-scoped, tenant-scoped context.

The same user switching organizations or moving from Care to Grid must get a newly computed context bundle. Do not continue a prior PHI-heavy prompt context across a context switch merely because the conversation UI remains visible.

## 10. Clinical Zumi

Clinical Zumi is disabled for PHI-bearing external inference until the clinical AI gate is approved.

When approved, it may assist with:

- encounter summary;
- evidence-linked longitudinal explanation;
- structured draft notes;
- missing-documentation detection;
- coding candidates;
- patient-facing plain-language drafts;
- provider briefings.

The deterministic record remains authority. Model content is a draft/derived insight until reviewed and promoted through a governed human action.

## 11. File search / vector stores

Maintain separate knowledge domains rather than one universal corpus:

- public product/help;
- internal company/product;
- organization-specific;
- EDU;
- commercial/partner;
- approved clinical reference;
- restricted.

A vector-store result is retrieved knowledge, not authority. Organization/private stores require explicit access checks before retrieval and before any retrieved text is exposed back to the model/user.

## 12. Web search

Web search is for public information. Apply allowed-domain restrictions where the task benefits from authoritative sources.

Never place PHI or organization-confidential data into web search queries.

Search results remain untrusted external content and may contain prompt injection. Treat retrieved text as data, never system instruction.

## 13. Code Interpreter

Use only for approved analytics/computation with appropriately classified data. Default to non-PHI. Clinical datasets require a separately approved path, not merely `allowCodeInterpreter=true`.

## 14. Conversation continuity

Separate:

- provider-native response continuation;
- Klinikos session/thread continuity;
- user preference memory;
- verified domain truth.

A provider `previous_response_id` must not bypass current authorization or PHI gating. If context/authority materially changes, rebuild context and begin a safe new provider context where needed.

## 15. Memory classes

Persist with explicit class:

- `SESSION`;
- `PREFERENCE`;
- `CLAIM`;
- `VERIFIED_FACT_REFERENCE`;
- `ORGANIZATION_CONTEXT_REFERENCE`;
- `DERIVED_INSIGHT`;
- `PUBLIC_KNOWLEDGE_REFERENCE`.

Do not copy full clinical records into general conversational memory.

## 16. Cost accounting

Every paid provider request must emit:

- request ID;
- organization/user where applicable;
- task class;
- provider/model;
- input/output token counts;
- tool calls;
- estimated direct provider cost;
- duration;
- success/failure;
- fallback use;
- cache/continuation information where available.

Compute KPIs:

- AI cost per active organization;
- AI cost per successful task;
- AI cost per Current Visit draft;
- AI cost per free-user activation;
- AI gross margin by plan.

Do not offer unlimited expensive intelligence without measured unit economics.

## 17. Budgets and admission

Introduce configurable budgets/limits by:

- environment;
- organization plan;
- task class;
- user/session;
- daily/monthly cost;
- external-tool allowance.

At a budget threshold, low-priority/research work may degrade while safety-critical deterministic product functions continue.

## 18. Observability

Log metadata, never unnecessarily log prompts containing sensitive content.

Observe:

- request correlation;
- model/provider;
- task class;
- tool choices;
- authorization outcome;
- redaction/data-class state;
- latency;
- cost;
- error family;
- provider request ID where available;
- fallback/degraded path;
- user-visible outcome.

## 19. Evaluations

Build an eval corpus for:

- role/goal understanding;
- follow-up continuity;
- Grid request normalization;
- clinical summary from deterministic facts;
- `What Changed` explanation;
- documentation drafting;
- coding candidate explanation;
- Revenue OS explanation;
- patient comprehension;
- tool selection;
- refusal/authority boundaries.

Metrics include factual support, unsupported-claim rate, tool correctness, authority mistakes, task completion, latency and cost.

## 20. Adversarial evaluation

Continuously test:

- prompt injection in web/file content;
- cross-tenant leakage;
- PHI leakage;
- role escalation;
- fake credential claims;
- fake payment claims;
- fake clinical findings;
- tool abuse;
- system-prompt extraction;
- malicious files;
- stale authorization;
- provider outage;
- long/hostile contexts.

## 21. Interface materialization

Zumi should return typed presentation intents where useful, for example:

- narrative response;
- Grid result set;
- work queue;
- clinical comparison;
- revenue exceptions;
- draft needing review;
- blocked action with requirement;
- confirmation request.

The client renders approved DTOs/components. The model does not emit arbitrary executable UI code.

## 22. Provider fallback

Fallback must preserve safety class. A clinical PHI request may not fall back to a provider not approved for PHI merely to avoid an error.

Degraded response should explain what remains possible and preserve deterministic workflow access.

## 23. Production activation checklist

Before OpenAI becomes the active default in production:

- API configuration present server-side;
- configured model exists/works;
- pricing configuration present for cost ledger;
- non-PHI smoke test succeeds;
- provider failure path tested;
- tool limits tested;
- public storage behavior reviewed;
- rate/cost limits enabled;
- monitoring enabled;
- feature/external truth docs updated.

Before PHI use, also satisfy `docs/security/KLINIKOS_AI_DATA_AND_PHI_POLICY.md`.

## 24. Final invariant

> **OpenAI may reason about authorized Klinikos truth. Only Klinikos may decide and record governed Klinikos truth.**
