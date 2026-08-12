# ZUMI INTELLIGENCE ARCHITECTURE

Status: IMPLEMENTATION FOUNDATION
Date: 2026-08-12

## Identity

Klinikos is the product and master brand.

Zumi is **Klinikos Intelligence**, the governed intelligence subsystem inside Klinikos. Retire `Klinikos by Zumi` and `Powered by Zumi` as product-brand constructions.

## Objective

Build an intelligence layer that becomes more useful over time without requiring Klinikos to own an always-on GPU server or train a foundation model from scratch.

The desired snowball effect is:

CONVERSE
→ REMEMBER THE THREAD
→ RETRIEVE WHAT IS ALREADY KNOWN
→ RESEARCH WHAT IS MISSING
→ DISTILL SOURCED KNOWLEDGE
→ RETAIN IT
→ REUSE IT
→ RECHECK IT WHEN STALE
→ MEASURE QUALITY/COST
→ IMPROVE THE SYSTEM

This is cumulative retrieval and orchestration, not uncontrolled model self-modification.

## Current implementation foundation

### 1. Governed provider gateway

All Zumi model requests remain behind the existing Klinikos gateway controls:

- authentication
- tenant scope
- RBAC
- capability admission
- entitlements
- redaction
- kill switch
- timeout
- audit
- usage metering
- human-review posture

### 2. Multi-turn conversation continuity

The OpenAI Responses adapter can use a previous response ID for multi-turn state.

Klinikos never trusts a raw provider response ID from the browser. It wraps the continuation identifier in a signed token containing:

- organization ID
- user ID
- provider response ID
- issue time
- expiration time

The token is signed with a domain-separated HMAC using `ZUMI_CONVERSATION_SIGNING_SECRET` or the existing application auth secret.

This produces long conversational continuity without a dedicated conversation database or server process.

### 3. Public-web research mode

Web research is a separate capability from clinic-context reasoning.

Hard boundary:

- no PHI in web search
- no operational context passed into a web-search turn
- identifier-shaped questions are refused for web research
- normal redacted Zumi workflows remain available separately

Research can be restricted to authoritative domains on a per-turn or curriculum basis.

### 4. Long-term knowledge retrieval

When `ZUMI_OPENAI_VECTOR_STORE_ID` is configured, Zumi can use file search against retained knowledge capsules.

The knowledge store is intended for reusable, non-PHI public/domain knowledge, not as a replacement for deterministic Klinikos transactional data.

Deterministic services remain authoritative for:

- patient/clinical records
- permissions
- credentials
- money
- reservations
- settlements
- workflow status
- audit truth

### 5. Knowledge capsules

Retained research is compressed into small evidence-bearing units rather than saving arbitrary scraped pages as unquestioned truth.

Each capsule contains:

- topic
- summary
- explicit claims
- confidence per claim
- source URLs
- source domains
- capture timestamp
- tags
- freshness window
- supersession references

A capsule can become stale. Retrieval should favor fresh evidence and re-research time-sensitive claims.

### 6. Curriculum-driven self-study

`config/zumi-learning-curriculum.json` defines rotating study topics.

Initial tracks cover:

- healthcare privacy/security
- interoperability
- provider identity
- revenue-cycle operations
- referrals/care coordination
- labs and imaging interoperability
- patient safety/human factors
- application/API security
- identity protocols
- platform reliability
- PostgreSQL
- healthcare workforce/capacity/economics

The curriculum starts with authoritative sources and can expand over time.

### 7. No-server learning schedule

`.github/workflows/zumi-learning.yml` can run the curriculum through GitHub Actions.

It is intentionally inactive until all required configuration exists:

- provider API key
- vector store ID
- per-run budget
- per-topic reserved budget
- token/search cost configuration

No dedicated AI server is required.

### 8. Budget law

The learning loop cannot spend merely because a schedule fired.

It requires:

- explicit per-run micro-USD budget
- explicit reserved cost per topic
- maximum topics per run
- maximum tool calls
- maximum output tokens

Observed usage is estimated from configured token/tool rates. If observed cost exceeds the run budget, the process stops before another topic.

Production commercial integration should eventually reserve this budget through the customer-funded access system before execution.

## OpenAI implementation path

The current optional adapter uses the Responses API because it can combine:

- natural-language model output
- multi-turn continuation
- web search
- file search/vector retrieval
- usage reporting

Provider-specific implementation stays behind the generic Zumi provider interface so Klinikos can add or switch intelligence suppliers later.

## Retrieval order

A strong default answer path is:

1. Deterministic Klinikos data/tools, if the question is about current system truth.
2. Fresh retained Zumi knowledge capsules.
3. Public authoritative web research when required and permitted.
4. General model reasoning only after evidence retrieval.
5. Human review when policy requires it.

The model should not search the web simply because it can.

## Learning maturity model

### Foundation

- full conversations
- source-backed web research
- vector/file retrieval
- knowledge capsules
- freshness
- cost caps
- audit

### High school

- broader curriculum
- source quality scoring
- deduplication
- contradiction detection
- automatic stale-knowledge refresh
- knowledge taxonomy and prerequisite graph

### College

- domain-specific evaluation suites
- question generation from retained knowledge
- weak-area detection
- adaptive curriculum scheduling
- multi-provider answer comparison
- retrieval quality measurement
- tool-routing optimization

### Graduate / specialist

- deep research jobs
- specialized healthcare operations corpora
- organization-specific non-PHI operating knowledge
- simulation environments
- causal/forecasting models where validated
- reviewed prompt/tool-policy evolution

This maturity language describes system capability growth, not autonomous authority.

## What Zumi must not do

Zumi must not:

- rewrite its own production safety policy without review
- grant itself permissions
- train on PHI through public-web tools
- treat remembered text as current truth without freshness/provenance
- ingest the entire internet indiscriminately
- scrape restricted/private sources without authorization
- autonomously diagnose, prescribe, authorize care, approve credentials, release records, or settle money
- silently increase its own spending limits

## Next build layers

1. Knowledge-store bootstrap command that can create/configure the vector store once provider credentials exist.
2. Retrieval scoring that combines relevance, authority, freshness, and contradiction signals.
3. Knowledge deduplication and supersession.
4. Feedback capture from users and reviewers.
5. Evaluation harness that measures factuality, citation quality, retrieval success, latency, and cost.
6. Adaptive curriculum selection based on measured weak areas rather than calendar rotation alone.
7. Optional realtime voice layer once the text intelligence path is stable and funded.

## North star

Zumi should feel like a single intelligent colleague whose understanding compounds over time, while Klinikos remains the authority that decides what information it may access, what tools it may use, what actions it may propose, what money it may spend, and what a human must approve.
