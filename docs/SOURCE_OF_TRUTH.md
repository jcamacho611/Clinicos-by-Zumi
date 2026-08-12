# Klinikos by Zumi — Authoritative Source of Truth

**Repository:** `jcamacho611/Clinicos-by-Zumi`  
**Production domain:** `https://klinikos.io`  
**Primary branch:** `main`  
**Product name:** **Klinikos by Zumi**  

> This document is the governing product, architecture, engineering-process, and delivery source of truth for Klinikos. When older prompts, status notes, route descriptions, or implementation documents conflict with this file, this file wins unless it is explicitly amended by the owner and committed here.

---

## 1. Product definition

Klinikos is an **AI-native healthcare operating system**. It is not merely a website, chatbot, CRM, marketplace, or integration wrapper.

Its purpose is to progressively replace replaceable clinic software while integrating the external rails that clinics cannot reasonably replace, including laboratories, imaging, payers, clearinghouses, e-prescribing/pharmacy, payments, credentialing/government systems, maps, and cloud infrastructure.

The long-term product includes:

- clinic operating system / practice management
- EHR-oriented clinical workflows
- patient and provider portals
- scheduling
- CRM and revenue recovery
- staff workflow and task execution
- telemedicine workflow
- billing readiness
- document management
- referrals and results tracking
- GRID provider / contractor / location marketplace capabilities
- Growth Engine for customer acquisition and conversion
- EDU where strategically justified
- Zumi as the central intelligence and action layer

The product must not become a thin collection of disconnected modules.

---

## 2. Zumi is the operating layer

Zumi is not a decorative chatbot attached to Klinikos.

Zumi is the intelligence, orchestration, automation, navigation, context, and action layer.

The intended experience is:

1. The human states intent.
2. Klinikos gathers existing context.
3. Zumi reasons within its authority.
4. Klinikos prepares or performs safe work.
5. Humans review only what actually requires humans.
6. Exceptions rise to the correct person.
7. Everything else disappears into the background.

Zumi must act through controlled tools and governed services, not arbitrary database writes.

Representative tool categories include:

- find patient
- retrieve schedule
- create or update appointment
- prepare or send authorized communications
- retrieve or create tasks
- prepare chart content
- retrieve results
- identify missing documents
- prepare follow-up
- identify revenue opportunities
- query GRID
- generate reports

Every Zumi tool must have:

- authorization
- tenant isolation
- input validation
- audit logging
- confirmation policy
- failure handling
- idempotency where relevant
- safety classification

---

## 3. Automation-first interaction law

For every workflow, use this hierarchy:

1. Can Klinikos retrieve the information automatically?
2. Can it infer or generate the answer safely?
3. Can Zumi conversationally collect the missing information?
4. Can Klinikos execute automatically within granted authority?
5. If confirmation is needed, ask for the smallest meaningful confirmation.
6. Use structured fields/forms only when genuinely required.

Do not ask users for information Klinikos already knows.

Do not default to form-heavy CRUD workflows.

---

## 4. Healthcare exception and human-required work

Automation must not override human judgment where human judgment is legally, clinically, ethically, or operationally required.

Human review remains required for, among other things:

- clinical diagnosis and treatment decisions
- consent and attestations where required
- clinical signatures
- credential approval
- controlled-substance decisions
- legal/regulatory decisions
- high-risk or irreversible actions
- uncertain AI output
- decisions outside configured clinic authority

Patient-facing communication may later support clinic-configured automation levels, but default policy must remain conservative until explicitly configured and safe.

Conceptual action policies:

- `AUTO_ALLOWED`
- `CONFIRM_REQUIRED`
- `HUMAN_REQUIRED`
- `BLOCKED`

No action may be reported as executed unless it actually occurred.

---

## 5. UX and design law

Klinikos must not look or behave like:

- a generic CRUD admin template
- an endless card grid
- a feature encyclopedia
- a developer console
- a collection of forms
- unrelated prototypes
- a documentation site presented as a product

GRID is a product capability, **not** the universal visual design language.

Prefer:

- priorities
- timelines
- command surfaces
- work queues
- contextual panels
- conversations
- concise summaries
- actions
- exceptions
- progressive disclosure

The product should feel premium, calm, intelligent, clinical without being sterile, and unmistakably unified.

### Owner experience

The owner landing experience should answer:

- what happened
- what matters
- what needs attention
- what is blocked
- what is costing money
- what Klinikos already handled
- what requires the owner
- what should happen next

### Front desk

Prioritize:

- today’s patients
- scheduling
- communications
- intake and insurance exceptions
- follow-up

### Provider

Prioritize:

- patient context
- encounters
- documents
- orders/results
- reviews/tasks

### Billing

Prioritize:

- eligibility
- claims
- balances
- denials
- recoverable revenue

### Admin

Prioritize:

- users
- permissions
- integrations
- compliance
- configuration
- audit
- provisioning

### Patient experience

Patient workflows should also be automation-first. Reuse known information, avoid repetitive forms, support conversational scheduling where appropriate, and make status/next action clear.

---

## 6. Public website and sales experience

The public website is a sales experience, not a feature registry.

A buyer must quickly understand:

- what Klinikos is
- what fragmented software it intends to replace
- what Zumi changes
- what daily clinic operation becomes
- what is real today
- what requires activation or integration
- how to purchase/start

Public routes must not expose unfinished breadth merely because the underlying code exists.

Routes/features must be classified as one of:

- production-functional
- demo-functional
- intentionally unavailable
- remove/delete

No dead buttons.

No UI-only CTA may be presented as functional.

Synthetic/demo data must always be clearly labeled.

---

## 7. Growth Engine lifecycle

The desired commercial lifecycle is:

AI finds prospects → qualifies → researches/enriches → personalized outreach → demo → objection handling → follow-up → self-service close → payment → provisioning → Zumi onboarding → operational Zumi serves clinic → retention/expansion/referrals.

This is two linked systems:

1. **Growth Engine** before payment
2. **Clinic OS + Zumi** after payment

Do not scale automated prospecting until the destination is genuinely sellable.

Lead states:

- `NEW`
- `ENGAGED`
- `PRICING_VIEWED`
- `AUDIT_INTEREST`
- `CHECKOUT_STARTED`
- `PAID`
- `ONBOARDING`
- `ACTIVE`
- `LOST`

Payment is a state transition, not merely access to a page.

Required lifecycle:

`PAYMENT VERIFIED → ORGANIZATION PROVISIONED → BUYER IDENTITY ATTACHED → SUBSCRIPTION/ENTITLEMENTS → ZUMI ACTIVATED PER PLAN → ONBOARDING → OPERATIONAL CLINIC`

Browser redirects are never proof of payment.

---

## 8. AI architecture and cost discipline

“Build our own AI” does **not** mean prematurely training a foundation model from scratch.

Klinikos should first own the high-value control layer:

- orchestration
- memory/context
- healthcare workflow intelligence
- tool system
- permissions
- retrieval
- evaluation
- model routing
- cost optimization
- domain data structures
- automation logic

Use an AI gateway and workload routing:

- deterministic code for deterministic tasks
- inexpensive/smaller models for routine classification, extraction, low-risk summaries, intent recognition
- advanced models for complex reasoning
- humans for high-risk/clinical/regulatory decisions

Open-weight, self-hosted, fine-tuned, distilled, or domain-specific models should be evaluated later only when measured cost/privacy/latency/control benefits justify them.

No direct model-provider calls scattered throughout UI code.

PHI must not be sent to a model provider until contractual, BAA, deployment, and technical gates permit it.

---

## 9. Programming languages and technical direction

Use the best-fit language for each subsystem. Do not force one language across the entire product, and do not rewrite stable code merely for language preference.

Current recommended direction:

- Web/UI/browser: **TypeScript + React/Next.js**
- Core web APIs: **TypeScript/Node.js**
- Database: **PostgreSQL**
- ORM currently: **Prisma**
- Zumi AI orchestration: **Python is a strong candidate when extraction becomes justified**
- AI evaluation / data processing: **Python**
- Background jobs: **TypeScript and/or Python depending service ownership**
- Healthcare interoperability: **TypeScript or Python initially**
- Selective Go/Rust: only when there is a demonstrated performance, reliability, concurrency, or security need
- Infrastructure as code later: Terraform/OpenTofu + YAML
- Analytics: SQL + Python

Architecture should remain a **modular monolith first**, with clear service/module ownership boundaries. Do not prematurely introduce Kubernetes or unnecessary microservices.

A future dedicated Python Zumi service is appropriate when the AI boundary is mature enough to justify extraction.

---

## 10. Engineering operating model

### Audits

Product/repo audits are run by ChatGPT in the planning/review loop. Paid implementation agents should not spend their cycles rediscovering the repository unless a narrow implementation-specific inspection is necessary.

### Implementation agents

Claude/Codex are implementation/review tools, not the source of product truth.

General workflow:

1. Source-of-truth review
2. One vertical milestone selected
3. Implementation
4. Automated tests
5. Browser/visual verification
6. PR review
7. ChatGPT audit
8. Correction pass
9. CI green
10. Merge
11. Only then begin next vertical milestone

### Concurrency

Avoid broad parallel development.

- One integration owner controls the main integration path.
- Other sessions use isolated branches/worktrees and explicit non-overlapping file ownership.
- **Never have two sessions modifying Prisma schema/migrations concurrently.**
- Schema changes are sequential and reviewed.
- Do not run multiple autonomous agents across shared architecture without a defined merge order.

### Vertical slices

Stop building horizontally.

A feature is not complete because:

- a route renders
- a Prisma model exists
- a component exists
- unit tests pass
- an adapter exists

A workflow is complete when the intended authorized user can accomplish the actual outcome end-to-end.

Status vocabulary:

- `CONCEPT`
- `UI/SHELL`
- `FUNCTIONAL`
- `INTEGRATED`
- `PRODUCTION-READY`

---

## 11. Required product acceptance discipline

Every important milestone must include:

- Prisma/schema validation where relevant
- type-check
- lint
- tests
- production build
- migration validation where relevant
- browser verification
- desktop and mobile review
- console-error review
- dead-control review
- tenant/authorization review
- honest synthetic/live labeling

A green build alone is never visual/product acceptance.

Every visible control must be:

- functional
- intentionally disabled with a clear reason
- hidden
- removed

---

## 12. Current first sellable vertical strategy

The immediate strategy is not to abandon the full vision. It is to sequence it.

### Vertical Slice 1

**Paid Clinic Activation + AI Command Center**

Target journey:

Public discovery → purchase/activation → clinic provisioning → intelligent onboarding → owner command center → real patient/appointment workflow → automated follow-up → owner sees result → Zumi surfaces next action.

PR #11 is the active implementation vehicle for this slice.

### Next milestone after PR #11 lands

**ZERO-DATA CLINIC → FIRST OPERATING PATIENT**

Target journey:

Onboarding complete → Zumi asks what the clinic wants to do → add/import first patient with minimal manual entry → patient context created → first appointment booked → automation watches it → command center updates automatically.

Do not begin this milestone until PR #11 is genuinely merged cleanly.

---

## 13. PR #11 verified history and lessons

PR #11 initially implemented:

- owner command center
- upcoming-appointment risk automation
- prepared patient follow-up
- guided onboarding
- Anthropic adapter boundary
- `/capabilities` removal/redirect
- payment/provisioning infrastructure already present on the branch

The correction process surfaced several important defects. These are now part of permanent engineering memory because they demonstrate failure modes future agents must avoid.

### Defects discovered during review

1. New referred prospects could fail to receive referral attribution.
2. Paid onboarding could enter human review with no approval transition.
3. A newly paid buyer could receive a provisioned organization without being attached to a usable account.
4. Patient messages could be marked `executed` without actual delivery.
5. Resolved appointment risks could remain stale in the command center.
6. Access email verification could report success without writing `verifiedEmailAt`.
7. Failed Whop webhooks could be acknowledged on retry without reprocessing.
8. A new provider payment reference could prevent fallback matching to the intended open payment.
9. Checkout return could accept a same-tier Whop membership belonging to a different email.
10. Concurrent follow-up sweeps could create orphan duplicate tasks.
11. A migration could fail against representative legacy data even though schema validation passed.
12. A supposedly small referral fix accidentally replaced a much larger service and broke exports/types, proving that narrow fixes must preserve the full file contract.

### Permanent lessons

- Never trust a “green” local report without CI and review.
- Never replace an entire service when a surgical patch is sufficient.
- Payment, identity, entitlement, provisioning, and login must be tested as one seam.
- `executed` means an operation actually occurred.
- Idempotency must account for retries after partial failure, not only duplicates after success.
- Concurrent sweeps require transactional/unique-safe behavior.
- Migrations must be tested against representative existing data, not only empty databases.
- Review threads are part of acceptance, not administrative noise.

---

## 14. Current PR #11 correction state

As of the latest correction work in this thread, the active PR branch is:

`claude/whop-portal-grid-marketplace-wdw811`

Key fixes pushed include:

- access verification persists `verifiedEmailAt`
- referral first-touch attribution correction
- paid onboarding admin approve/reject transition
- payment webhook fallback matching when external reference is new
- retry-aware Whop webhook delivery handling
- checkout-return identity matching
- follow-up risk reconciliation
- atomic action/task creation
- patient-message truthfulness (no fake executed state)
- paid-buyer organization/user linkage
- secure account activation token + `/api/auth/activate`
- restoration of the full Growth Engine service contract after a too-broad referral edit caused CI type failures

The latest correction commit discussed in this thread is `75fcaed10e32ab0da76d8e390c674c02335677e8`.

A fresh GitHub Quality workflow was running after that commit. **Do not assume PR #11 is merge-ready solely from this document. Always check the current PR, current review threads, and current CI before merging.**

---

## 15. External / environment gates

Known environment/vendor gates may include:

- `ANTHROPIC_API_KEY`
- `ZUMI_ANTHROPIC_MODEL`
- `WHOP_WEBHOOK_SECRET`
- real communications connector credentials
- healthcare-vendor contracts/BAAs/enrollment where applicable

Absence of an external credential must fail closed and be represented truthfully as pending/blocked, not faked as functional.

`ZUMI_ANTHROPIC_MODEL` is intentionally required configuration. Do not reintroduce a guessed hard-coded default model identifier.

No BAA may be claimed unless it actually exists.

---

## 16. Repository truth vs conversation history

Conversation history is useful context, but the repository must be the durable operational memory.

When a major product decision is made, update this file or an explicitly linked canonical document in the same repository.

Future agents should begin by reading:

1. `docs/SOURCE_OF_TRUTH.md`
2. current PR description and review threads
3. relevant code/tests

Do not infer the current product definition from scattered old branches, old prompts, or outdated route docs.

---

## 17. Amendment rule

This document is intentionally strong to prevent architecture drift.

It may be amended when the owner changes direction or evidence proves a better architecture is required.

Any material amendment should state:

- what changed
- why it changed
- which workflows are affected
- whether migrations/data changes are required
- whether previous guidance is superseded

Do not silently violate this document in implementation.

---

## 18. Final product principle

The ultimate Klinikos experience should feel less like operating software and more like having an extraordinarily capable healthcare operations team embedded inside the clinic.

**The human states intent. Klinikos gathers context. Zumi reasons within authority. Klinikos prepares work. Automation performs what is safe and permitted. Humans review what actually requires humans. Exceptions rise to the correct person. Everything else disappears into the background.**
