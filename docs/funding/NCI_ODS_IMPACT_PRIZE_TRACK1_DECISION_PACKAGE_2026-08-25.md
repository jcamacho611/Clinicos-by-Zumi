# NCI ODS Impact Prize — Track 1 Decision Package

**Prepared:** 2026-08-25
**Opportunity:** NCI Office of Data Sharing Impact Prize
**Track:** Track 1 — Research Output Sharing and Reuse Ideas
**Current truth state:** `ELIGIBILITY CHECKING`
**Submission deadline:** 2026-10-05, per current official NCI announcement
**Prize truth:** $200,000 total prize purse; $20,000 Grand Prize, per current official NCI announcement

## Why this lane is worth pursuing

NCI explicitly accepts ideas in Track 1 and defines eligible research outputs broadly enough to include data, software, tools, methods, protocols, models, clinical-trial results, biospecimens, and other resources that advance scientific knowledge and benefit the cancer research community.

Klinikos already has legitimate architectural work around synthetic-data-first training, privacy boundaries, interoperability, FHIR-oriented exchange, provenance/evidence, human review, and responsible AI. This package proposes a cancer-research-output reuse idea using those capabilities without claiming that Klinikos currently has an NCI award, cancer-center customer, cancer dataset, clinical validation, or measured cancer outcome.

## Proposed submission concept

### Working title

**Klinikos Cancer Research Reuse Bridge: Responsible, Interoperable Reuse of Shared Cancer Research Outputs**

### Core idea

Create a reusable workflow and reference implementation that helps organizations turn openly shareable NCI-funded cancer research outputs into privacy-conscious, interoperable, human-reviewable learning and operational artifacts without confusing research evidence with clinical authority.

The concept would combine:

1. **Research-output intake and provenance** — retain source, version, permitted-use context, transformation history, and evidence references.
2. **Interoperability normalization** — map suitable structured outputs into FHIR-oriented or other standards-aligned representations where technically appropriate rather than inventing proprietary data silos.
3. **Synthetic transformation for education and testing** — generate or curate non-PHI/synthetic derivatives for workflow simulation, software testing, workforce education, and responsible-AI evaluation when source rights and scientific meaning permit it.
4. **Human-review checkpoints** — AI-generated summaries, mappings, or derived artifacts remain proposals until a qualified human reviewer accepts the relevant transformation for its intended research/education context.
5. **Truth labels** — clearly distinguish original research output, transformed output, synthetic derivative, model-generated interpretation, and human-reviewed artifact.
6. **Reusable evaluation templates** — provide repeatable checks for provenance completeness, interoperability, privacy risk, hallucination/unsupported-claim detection, and reproducibility.
7. **Community-oriented reuse package** — publish the reusable method, documentation, example schemas, and non-sensitive demonstration assets in a form designed to reduce friction for future researchers, educators, and builders.

## Problem statement

Cancer research increasingly produces valuable data, software, models, methods, and other outputs, but practical reuse can still be slowed by fragmentation, inconsistent metadata, privacy concerns, incompatible formats, unclear provenance, and difficulty distinguishing original evidence from AI-generated interpretation.

The proposed Klinikos approach is not to create another closed repository. It is to provide a governed reuse layer that preserves source attribution and authority while making selected shared outputs easier to translate into interoperable, reproducible, privacy-conscious downstream research, software-testing, and training workflows.

## Proposed impact

If developed and validated, the idea could help:

- reduce the work required to understand and operationalize reusable cancer research outputs;
- improve provenance and reproducibility when outputs are transformed or summarized;
- make responsible use of synthetic derivatives easier for testing and workforce education;
- create clearer boundaries between research evidence, generated interpretation, and clinical decision authority;
- make standards-aligned outputs easier to connect with other research and healthcare systems;
- provide reusable templates that other organizations can adapt rather than rebuilding governance from scratch.

These are intended impacts, not claimed achieved outcomes.

## Technical approach

### A. Source and rights-aware intake

For each research output, record at minimum:

- authoritative source and persistent identifier where available;
- output type;
- version/date;
- access class and known permitted-use constraints;
- attribution/citation requirements;
- transformation lineage;
- reviewer and review state for any derived artifact.

### B. Interoperability layer

Where appropriate to the source material, map structured concepts into standards-aligned representations. FHIR is a candidate for healthcare-relevant exchange, but the method must preserve the original research meaning and must not force non-clinical research outputs into an inappropriate clinical schema.

### C. Synthetic-data and safe-learning layer

Use synthetic or non-PHI representations when the purpose is education, workflow testing, AI evaluation, or demonstration. No patient data is claimed or required for the initial concept demonstration.

### D. Responsible-AI review layer

AI may assist with organization, mapping, critique, and transformation proposals, but it cannot silently become the authority for:

- source truth;
- scientific validity;
- patient consent;
- clinical diagnosis/treatment;
- regulated credentialing;
- data-use permission.

### E. Reuse evidence

A reusable evidence package should make it possible to answer:

- Where did this output come from?
- What changed?
- Was the derivative synthetic, transformed, summarized, or merely linked?
- What human review occurred?
- What limitations remain?
- Can another team reproduce the transformation?

## Candidate demonstration scope

A safe initial demonstration could use only openly available NCI cancer research outputs with clearly documented access/reuse conditions. The demonstration would avoid controlled-access data unless and until all required approvals exist.

Candidate output classes may include:

- public data dictionaries or metadata;
- openly reusable software/tools;
- public methods/protocols;
- open-access example datasets or derived public research outputs;
- publicly documented FHIR/cancer interoperability artifacts where applicable.

Specific datasets/tools must be selected only after rights/access verification; this document does not assert that any particular controlled dataset may be reused.

## Commercialization / sustainability relevance

Klinikos's broader healthcare operating-system architecture gives the idea a credible sustainability path: reusable research-output governance can connect to interoperability, workforce education, responsible AI, and implementation tooling. The prize concept, however, should be evaluated on its contribution to cancer research-output sharing and reuse, not on inflated platform-market claims.

## Current evidence available

Verified project-level capabilities relevant to this idea include:

- synthetic-data-first EDU/workforce design;
- privacy/security boundaries and human-review authority rules;
- interoperability/FHIR-oriented architecture;
- AI-output critique and verification workflows;
- provenance/evidence-oriented company and product governance.

Do **not** claim in the submission unless separately evidenced:

- NCI-funded research results;
- cancer-center customers or partners;
- clinical outcome improvements;
- cancer-specific validation;
- access to controlled NCI data;
- FDA clearance or clinical-decision authority;
- completed deployment of this exact cancer-reuse concept.

## Decision-ready checklist

### Completed autonomously

- [x] Confirm current official NCI announcement is open through 2026-10-05.
- [x] Confirm current official prize purse: $200,000 total; $20,000 Grand Prize.
- [x] Confirm Track 1 accepts research-output sharing/reuse ideas.
- [x] Confirm eligible output concept is broader than raw datasets and includes software/tools/methods/models and other research outputs.
- [x] Draft a truthful Track 1 concept aligned with existing Klinikos capabilities.
- [x] Define non-claims to prevent accidental fabrication.
- [x] Prepare program-fit question for NCI ODS.

### Must be verified before submission

- [ ] Exact participant/entity eligibility under the official competition rules.
- [ ] Whether an entity, individual, or team is the preferred/allowed applicant form for this exact Track 1 submission.
- [ ] Citizenship/residency requirements for each required participant, if any.
- [ ] Exact IP/rights and federal-prize certifications.
- [ ] Exact required fields, character/page limits, attachments, and submission portal workflow.
- [ ] Selection of any specific NCI research output used in the example, including access and reuse rights.
- [ ] Final applicant/team roster and factual roles.

### Human-only final gate

Do not transmit the final prize submission until the authorized applicant has reviewed and accepted any participant eligibility, IP/rights, federal-prize, legal, or other binding certifications required by the submission portal.

## Program-fit question sent to NCI ODS

Ask whether a Track 1 idea centered on provenance-preserving, interoperability-oriented, privacy-conscious reuse of NCI-funded cancer research outputs — including synthetic derivatives for testing/education and explicit human review of AI-assisted transformations — is within the intended scope, assuming the eventual demonstration uses only outputs whose reuse rights have been verified.

## Source of truth

Use the current official NCI Office of Data Sharing / NCI Genomic Data Commons competition announcement and the official competition rules/portal as the controlling authority. If any detail in this package conflicts with the live rules, the live rules win.
