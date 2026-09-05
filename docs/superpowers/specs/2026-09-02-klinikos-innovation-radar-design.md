# Klinikos Innovation Radar Design

Status: `FOUNDER-APPROVED ARCHITECTURE — SUBORDINATE TO docs/KLINIKOS_MASTER_CANON.md`
Date: 2026-09-02
Baseline at approval: `main@16f0824db888a9887eb3e9d0a304eb802cc58cb7`

## 1. Purpose

Klinikos must stay current with meaningful advances in healthcare operations, AI, software architecture, interoperability, security, payments, workforce, education, product design, distribution, and commercial models without allowing every new idea to destabilize the product or silently become Canon.

The **Innovation Radar** is the governed intake/review system for new ideas and external developments.

It answers:

> **What changed outside or inside Klinikos, does it materially improve the company/product, what evidence supports it, and should it become part of the Canon/build roadmap?**

## 2. Permanent law

Innovation follows:

`DISCOVER → VERIFY → COMPARE → SCORE → WATCH / REJECT / PROPOSE → FOUNDER/COUNCIL DECISION → CANON MERGE-FORWARD IF ACCEPTED → IMPLEMENT → VERIFY → MEASURE`.

The Radar is not autonomous product authority.

It may discover, summarize, compare, score, recommend, and prepare a Canon delta. It may not silently:

- change product law;
- change pricing;
- activate a new regulated feature;
- adopt a vendor;
- change security posture;
- disclose trade secrets;
- create external commitments;
- merge code;
- claim that a discovered capability is implemented.

## 3. Scope

Candidate domains:

- `PRODUCT`
- `CLINICAL_WORKFLOW`
- `GRID_NETWORK`
- `EDU_WORKFORCE`
- `AI_INTELLIGENCE`
- `SOFTWARE_ARCHITECTURE`
- `INTEROPERABILITY`
- `SECURITY_PRIVACY`
- `PAYMENTS_FINANCIAL`
- `COMMERCIAL_PRICING`
- `DISTRIBUTION_GROWTH`
- `ENTERPRISE_PROCUREMENT`
- `REGULATORY_POLICY`
- `INFRASTRUCTURE_COST`

## 4. Candidate lifecycle

```ts
export const innovationCandidateStates = [
  "DISCOVERED",
  "VERIFICATION_REQUIRED",
  "VERIFIED",
  "WATCH",
  "PROPOSED",
  "APPROVED",
  "REJECTED",
  "IMPLEMENTING",
  "IMPLEMENTED_NEEDS_VERIFICATION",
  "LIVE_VERIFIED",
  "MEASURED",
  "SUPERSEDED",
] as const;
```

A candidate never moves directly from `DISCOVERED` to `APPROVED` without source/evidence review.

`APPROVED` means the product/company decision has been accepted, not that code is built.

## 5. Scoring

Each candidate may receive a 0-5 score on:

- customer value;
- revenue potential;
- defensibility/moat;
- network-effect leverage;
- strategic fit with the five-plane Klinikos architecture;
- time-to-value;
- implementation cost;
- operating cost;
- technical complexity;
- security/privacy risk;
- healthcare/regulatory risk;
- external dependency risk;
- reversibility/options value.

Scores are evidence-backed advisory inputs, not decision authority.

The Radar should also compute two human-readable outputs:

- `expectedUpside`: `LOW | MEDIUM | HIGH | TRANSFORMATIVE`
- `executionBurden`: `LOW | MEDIUM | HIGH | EXTREME`

## 6. Required evidence

Every candidate preserves:

- source system/type/reference;
- observed date;
- concise source-derived claim;
- source freshness/review date;
- affected Klinikos Canon sections/nodes;
- affected current implementation paths where known;
- external dependencies;
- legal/security gates;
- whether the idea is already present, partially present, contradictory, or genuinely new.

Web/connector/research results remain evidence, not authority.

## 7. Comparison against current Klinikos

Before a candidate is proposed, the Radar compares it to:

- current Master Canon;
- Engineering Blueprint;
- canonical ecosystem graph;
- current `main` implementation;
- open PR ownership;
- verified runtime/external connection evidence;
- current commercial authority where pricing/business model is affected.

Classification:

```ts
export const innovationRelationshipStates = [
  "ALREADY_CANONICAL",
  "ALREADY_IMPLEMENTED",
  "PARTIALLY_IMPLEMENTED",
  "NEW_COMPATIBLE",
  "NEW_REQUIRES_CANON_CHANGE",
  "CONFLICTS_WITH_CANON",
  "SUPERSEDED_BY_CURRENT_DIRECTION",
] as const;
```

This prevents agents from repeatedly rediscovering old ideas and calling them innovation.

## 8. Decision record

A founder/council decision must preserve:

- `APPROVE | WATCH | REJECT | MODIFY`;
- actor identity;
- decision time;
- rationale;
- approved scope;
- affected Canon section(s);
- required implementation consequence;
- commercial/security/legal conditions;
- superseded decision when applicable.

Accepted innovation is merged forward into the existing Master Canon and Engineering Blueprint. The Radar does not become a competing Canon.

## 9. Zumi role

Zumi may:

- summarize discoveries;
- identify overlap with current Klinikos;
- score candidates;
- show tradeoffs;
- produce a recommended decision;
- prepare the Canon delta and implementation consequences;
- surface stale assumptions.

Zumi may not:

- promote a candidate to `APPROVED` without authorized decision evidence;
- claim an approved candidate is built;
- bypass security/legal requirements;
- expose crown-jewel internals to external research providers.

## 10. Company Command projection

Command should expose a compact Innovation view:

- candidates requiring verification;
- highest-upside verified candidates;
- approved-but-unimplemented decisions;
- implementation candidates with open PR conflicts;
- stale assumptions that need re-review;
- measured wins/losses after adoption.

The view is a projection; source records/evidence remain authoritative.

## 11. Cadence

The architecture supports both event-driven discoveries and scheduled research, but the application itself must not pretend it is continuously monitoring the world unless an actual scheduled/connected research job exists.

Recommended operating cadence once an authorized scheduler exists:

- weekly product/AI/architecture scan;
- monthly healthcare interoperability/security/regulatory scan;
- ad hoc scan when a major vendor/platform/relevant standard changes;
- immediate candidate creation from high-quality clinician/customer/engineering feedback.

## 12. Acceptance criteria

The Radar is successful when:

- the same old idea is detected as already canonical instead of reintroduced as new;
- an unsupported blog/social claim cannot become an approved product decision;
- a genuinely better technology can be captured with evidence and compared to current architecture;
- acceptance produces an explicit Canon/build consequence;
- rejection/watch preserves rationale so the company does not re-litigate the same decision endlessly;
- approved innovation is never confused with implemented/live functionality;
- Company Command can show what innovation decisions are waiting, adopted, or proven.