# KLINIKOS SOURCE OF TRUTH

Version: `2026-08-12.2`
Status: `AUTHORITATIVE`

This file is the first document to read before changing Klinikos.

When product language, older repository names, design files, branches, screenshots, prior briefs, or legacy copy conflict with this file, this file governs unless a later explicitly-authoritative source-of-truth update supersedes it.

## Master brand

**The product and ecosystem are named KLINIKOS.**

Retired public-brand constructions include:

- `Klinikos by Zumi`
- `Powered by Zumi`
- any wording that presents Zumi as the parent company, master product, or umbrella brand

The existing GitHub repository name `Clinicos-by-Zumi` is a legacy repository identifier only. It does not define current product branding.

## Zumi identity

**Zumi is the governed intelligence subsystem inside Klinikos.**

Zumi may be named inside the product when referring specifically to the intelligence experience, agent/orchestration capability, assistant surface, research/memory system, or internal intelligence gateway.

Zumi is not the master brand and must not replace the Klinikos name on navigation, titles, pricing, company identity, or ecosystem positioning.

Canonical relationship:

> Klinikos is the operating ecosystem. Zumi is Klinikos Intelligence.

## Product definition

Klinikos is a healthcare operating system and ecosystem whose shared primitives can support clinics, providers, patients, Grid, education, organizations, networks, revenue-cycle operations, communications, integrations, resource exchange, and future legitimate healthcare domains.

Grid is the universal healthcare resource and opportunity exchange layer inside Klinikos.

Zumi is the intelligence layer that helps interpret intent, retrieve evidence, organize context, research permitted public information, propose workflows, summarize operational state, and coordinate tools under Klinikos authorization and safety controls.

## Intelligence law

Zumi must become more useful over time without becoming an uncontrolled autonomous authority.

The preferred learning architecture is cumulative retrieval and distillation rather than uncontrolled self-modification:

1. Converse.
2. Retrieve trusted existing knowledge.
3. Research missing public information when permitted.
4. Preserve source evidence and timestamps.
5. Distill reusable knowledge capsules.
6. Retrieve those capsules in later conversations.
7. Re-validate stale or contested knowledge.
8. Measure answer quality and cost.
9. Improve prompts, routing, retrieval, and workflows through reviewed changes.

Zumi may propose actions and learn reusable non-PHI knowledge, but deterministic Klinikos services remain authoritative for permissions, money, clinical workflow state, credentials, settlement, and other consequential system truth.

## Internet-learning boundary

Public-web research must be separated from protected-health-information workflows.

Never send PHI into a web-search tool.
Never treat search results as verified clinical truth merely because a model found them.
Every retained external claim should preserve source URL/domain, capture time, confidence/provenance, and freshness policy where applicable.

High-risk clinical, legal, credentialing, financial, and compliance conclusions require authoritative sources and/or human review according to domain policy.

## Cost law

Klinikos should not require a dedicated AI server to make Zumi useful.

Prefer:

- stateless/serverless application code
- provider-hosted model inference
- provider-hosted conversation state where policy permits
- low-cost retrieval/vector storage
- existing Postgres where appropriate
- scheduled or on-demand research jobs
- compact distilled memory instead of replaying entire histories
- model routing by task difficulty
- strict usage budgets and customer-funded variable-cost gates

Do not build expensive custom model training infrastructure until measured product demand proves it necessary.

## Canon hierarchy

Read these with this file:

1. `docs/CLINICOS_MASTER_CANON.md` — broad product/ecosystem architecture (legacy filename, current Klinikos content)
2. `docs/KLINIKOS_CONSTITUTION.md` — reusable platform laws
3. `docs/CUSTOMER_FUNDED_ACCESS_MODEL.md` — variable-cost and paywall rules
4. `docs/ZUMI.md` — current intelligence gateway implementation notes
5. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` — integration truth

If older documents still contain retired brand wording, interpret them under this file and correct them when touched.

## Final identity

**KLINIKOS** is the brand.
**Grid** is the healthcare resource exchange.
**Zumi** is Klinikos Intelligence.
