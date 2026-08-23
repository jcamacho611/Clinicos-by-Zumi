# KLINIKOS — SUPREME ARCHITECTURE CANON

Version: `2026-08-22.1`
Status: `SUPREME PRODUCT / ARCHITECTURE LAW BELOW CURRENT IMPLEMENTATION TRUTH`

This canon reconciles the existing Klinikos canons, the accepted 2026-08-22 professional findings, clinical convergence, Grid, EDU, Zumi, Financial OS, gateway/freemium, enterprise, trust/safety, interoperability, pricing-fabric, invisible-complexity, distribution, and final-form ecosystem direction into one architecture.

It does not make an unbuilt capability built, an unverified connector live, a legal theory enforceable, a clinical action authorized, a credential valid, or a payment settled. Current code/schema/migrations/tests/exact-head CI and verified runtime evidence remain the highest authority for what exists now.

---

## 1. Canonical hierarchy

When sources conflict, use this order:

1. current repository implementation, schema, migrations, tests, exact-head CI, verified runtime and externally verified production evidence;
2. `docs/SOURCE_OF_TRUTH.md`;
3. **this Supreme Architecture Canon** for cross-domain architecture and permanent product law;
4. `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` for accepted expert findings, provenance, rationale and reusable implications;
5. `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` for Current Visit and clinical convergence detail;
6. specialist canons for Grid, Zumi, EDU, Clinic OS, Financial OS, Portal/Role, pricing, security/client-server boundaries and design;
7. `docs/FEATURE_STATUS.md` for implementation status;
8. `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external connection status;
9. journey, recovery and implementation plans;
10. historical canons and legacy briefs as preserved reasoning only.

No specialist canon may contradict this document. Specialist canons remain authoritative inside their domain only where this canon delegates detail or is silent.

### Canon reconciliation rule

Useful historical reasoning is preserved before supersession. Old documents are amended with a status note or retained as historical context rather than silently deleted when they contain rationale, evidence, migration history or rejected alternatives worth preserving.

---

## 2. Master Product Law

**KLINIKOS is one governed healthcare operating ecosystem.**

It is not reducible to an EHR, EMR, clinic-management app, CRM, marketplace, staffing product, LMS, AI assistant, billing tool, patient portal or commerce site.

Those are capability classes and contextual experiences over a shared healthcare substrate.

Canonical product thesis:

> Klinikos is the governed operating, intelligence, relationship, clinical, execution, economic, learning and capacity infrastructure for the healthcare lifecycle.

The system connects:

`DISCOVERY → INTENT → IDENTITY → TRUST → ELIGIBILITY → CONNECTION → AGREEMENT → TRANSACTION / WORKFLOW → FULFILLMENT → OUTCOME → RECONCILIATION → LONGITUDINAL RELATIONSHIP`

Permanent implementation direction:

**ONE REPO · ONE SHARED SUBSTRATE · ONE IDENTITY FABRIC · ONE AUTHORIZATION FOUNDATION · ONE EVENT FOUNDATION · ONE AUDIT FOUNDATION · ONE FINANCIAL TRUTH · ONE HEALTHCARE RELATIONSHIP GRAPH · MANY CONTEXTUAL EXPERIENCES.**

---

## 3. Shared Substrate Law

Clinic OS, Current Visit, Grid, EDU, Care, Commerce, Healthcare Business OS, Network, Financial OS, enterprise experiences and Zumi must reuse shared primitives rather than recreate them.

Shared substrate concerns include:

- person/account/identity assurance;
- organization/legal entity/location/department;
- relationships/memberships/assignments;
- profession/capability/credentials/privileges/supervision;
- authorization/purpose/consent;
- patient/coverage/financial-case truth;
- resources/availability/capacity/scheduling;
- obligations/tasks/workflow completion;
- clinical records/components/change/evidence;
- catalogs/listings/services/products;
- demand/opportunities/transactions/fulfillment;
- payment/obligation/settlement/reconciliation;
- trust/reputation/verification/incidents;
- education/competency/placement;
- configuration/entitlements/pricing policy;
- events/audit/provenance;
- integrations/outbox/inbox/reconciliation;
- governed memory/knowledge/intelligence.

Domain-specific state remains domain-specific when its semantics are materially different. Shared primitives provide identity, relationships, lifecycle, policy, events and evidence; they do not flatten clinical notes, grades, claims, credentials and payments into one generic table.

---

## 4. Identity Law

**One real person must be capable of remaining one Klinikos person for decades.**

Do not create separate identities merely because the same person is a student, employee, RN, provider, contractor, Grid participant, seller, owner, educator, preceptor, organization representative or patient in another governed context.

Canonical conceptual layers:

- `Person` — durable human identity anchor;
- `Account` — authentication/access identity;
- `ProfileProjection` — audience-specific projection, never a second identity;
- `ParticipantContext` — current governed role in a product/economic context;
- `Relationship` — effective-dated relationship to an organization, location, program, person or resource;
- `ProfessionalIdentity` — profession/capability claims and governed evidence;
- `PatientContext` — protected clinical identity/context, never automatically public or Grid-visible.

Existing `User`, `PortalAccount`, `Provider`, patient and Grid participant models may remain during migration. They become adapters/projections around the canonical identity fabric rather than permanent competing identity systems.

### Profile projections

The same person may have:

1. private identity projection;
2. organization-facing projection;
3. network/Grid projection;
4. intentionally public projection;
5. separately governed patient projection.

No projection grants authority merely by displaying a claim.

---

## 5. Organization Law

An organization is a durable legal/operating identity with effective-dated relationships to locations, departments, people, resources, contracts, programs and network memberships.

Organization lifecycle states may include:

`REFERENCED → UNCLAIMED → CLAIM_PENDING → CLAIMED → VERIFIED → CUSTOMER`

with separate paused/suspended/closed states where needed.

Claiming an organization does not prove every factual claim about it and never grants rights to patient, employee or financial data without separate authorization.

Enterprise networks may contain multiple legal entities and tenants. Do not flatten them into one tenant when legal, contractual, privacy, billing or data-separation boundaries require separation.

---

## 6. Authority Law

**Identity, role, profession and credential are different facts.**

A regulated or sensitive action must be authorized from the relevant combination of:

`IDENTITY + ACTIVE ACCOUNT + TENANT/ORG + LOCATION + ROLE + PROFESSION + CAPABILITY + RELATIONSHIP + ASSIGNMENT + PURPOSE + CREDENTIAL + PRIVILEGE + SUPERVISION/DELEGATION + CONSENT + EFFECTIVE DATE + POLICY`

No UI state, public profile, Grid listing, EDU completion, AI recommendation, owner title, payment status or uploaded credential may bypass server authority.

The browser is never authorization authority.

---

## 7. Trust, Verification and Reputation Law

Truth states must distinguish at minimum:

`SELF_ASSERTED · DOCUMENT_SUPPLIED · VERIFICATION_PENDING · EXTERNALLY_VERIFIED · ORGANIZATION_CONFIRMED · PRIVILEGE_GRANTED · EXPIRED · SUSPENDED · REVOKED · CONTEXTUALLY_ELIGIBLE`

These are not interchangeable.

`VERIFIED` must always be scoped: verified **what**, by **whom**, from **which source**, for **which effective period**, and for **which purpose**.

Reputation begins with evidence such as completed transactions, response reliability, cancellations, no-shows, fulfillment, repeat relationships, credential freshness, disputes, incidents and reviewed feedback.

Reputation never substitutes for professional eligibility, clinical authority or payment truth.

Sponsored placement or money may never purchase eligibility.

---

## 8. Healthcare Relationship Graph Law

Klinikos should expose graph semantics while using relational PostgreSQL unless scale/query evidence justifies a separate graph database.

Canonical node classes include:

- Person;
- Organization;
- LegalEntity;
- Location;
- Department;
- Program/Cohort;
- PatientContext;
- FinancialCase;
- Credential/Privilege Evidence;
- Resource/Capacity;
- Listing/Catalog item;
- Demand/Opportunity;
- Encounter/Episode;
- Transaction;
- Order/Result;
- Obligation;
- Configuration/Policy;
- External Counterparty/Connector where useful.

Representative edges include:

`member_of`, `employed_by`, `contracted_by`, `assigned_to`, `located_at`, `owns`, `operates`, `teaches`, `learns_at`, `precepts`, `supervises`, `credentialed_for`, `privileged_at`, `enrolled_with`, `available_at`, `provides`, `needs`, `refers_to`, `serves`, `fulfills`, `pays`, `owes`, `trained_by`, `customer_of`, `partner_of`.

Every consequential relationship must support provenance, effective dates, status/history and privacy classification.

Graph queries are projections over governed relational truth. Zumi may query only edges and attributes the current identity/context is authorized to access.

---

## 9. Data Law

Relational PostgreSQL remains the primary transactional system of record now.

Use normalized durable domain records for consequential truth; use JSON only for bounded extensibility where the schema does not carry authority-critical semantics.

Every important state should answer:

- what is true;
- when it became true;
- who/what asserted it;
- source/provenance;
- effective interval;
- superseded/revoked state;
- applicable tenant/context;
- evidence reference where required.

Do not duplicate authoritative clinical truth into uncontrolled AI memory, browser state, analytics payloads or marketplace profiles.

---

## 10. Event Law

Klinikos uses one event foundation with domain-owned event schemas.

Events describe facts that occurred; they are not uncontrolled commands and do not become a PHI broadcast bus.

Every consequential domain should emit minimum-necessary, versioned, attributable events suitable for workflow continuation, reconciliation, analytics and audit.

Where external delivery or durable asynchronous processing matters, use outbox/inbox semantics with idempotency and replay safety.

---

## 11. Audit Law

Audit is a shared foundation, not a feature.

Consequential reads/writes/transitions should preserve appropriate actor, tenant, context, timestamp, action, target, source, relevant prior/new state references, evidence and reason.

Audit logs are append-oriented and protected from ordinary destructive mutation.

Clinical signing, amendments, patient release, credential decisions, organization claims, eligibility, Grid offers/acceptance, payment evidence, payouts, refunds, configuration changes, break-glass access, AI-assisted consequential work and external reconciliation all require attributable audit where applicable.

---

## 12. Configuration Law

Customer and specialty customization is versioned configuration, not source-code divergence.

Canonical inheritance:

`BASE KLINIKOS → PRODUCT/POLICY PACK → SPECIALTY PACK → ORGANIZATION OVERRIDE → LOCATION OVERRIDE`

Configuration objects must preserve version, scope, effective dates, provenance, approval state and supersession.

Historical records retain the configuration/template version that governed them at the time.

---

## 13. No-Customer-Fork Law

A customer's workflow difference is not sufficient justification for a code fork.

Prefer:

- configuration;
- rules/policies;
- templates/components;
- adapter boundaries;
- feature entitlements;
- extension points;
- governed custom modules.

True custom code must remain explicitly scoped, commercially priced, tested and designed for possible productization without contaminating core architecture.

---

## 14. Specialty Law

Specialties are governed packs over common clinical primitives.

Canonical composition:

`KLINIKOS CLINICAL CORE + SPECIALTY PACK + ORGANIZATION CONFIG + LOCATION OVERRIDE`

Specialty packs may define components, questionnaires, body-map behavior, templates, default orders, close-visit requirements, reports and workflow defaults.

They may never override authentication, tenant isolation, professional authority, signed-record immutability, payment truth or external-connection truth.

---

## 15. Clinical Law

**Current Visit is the primary clinician convergence experience.**

Canonical journey:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

Supporting modules remain authoritative domain work queues; Current Visit receives governed projections rather than creating duplicate clinical state.

Clinical records are versioned and attributable. Signed/finalized history is never silently rewritten.

AI is assistive. It does not diagnose, prescribe, sign, release, establish findings, finalize coding, submit claims or close clinical work without governing deterministic/human authority.

---

## 16. Clinical Change Law

Klinikos should make longitudinal change a first-class structured capability:

`INITIAL → PRIOR → CURRENT`

The Clinical Change Graph derives from evidence-linked structured facts, not model-generated narrative.

Zumi may explain or summarize a deterministic change set. It may never manufacture the underlying change because it appears clinically plausible.

---

## 17. Closed-Loop Order and External Work Law

An order or external request is incomplete until downstream evidence supports its lifecycle.

Canonical clinical external-work shape:

`ORDERED → TRANSMITTED → TRANSPORT_ACK → BUSINESS_ACCEPTED → SCHEDULED/ACCESSIONED → PERFORMED/COLLECTED → RESULTED → REVIEWED → PATIENT/REQUESTER NOTIFIED → RESOLVED/RECONCILED → CLOSED`

Not every order type uses every state, but transport, acceptance, fulfillment, result/review and closure must never be collapsed merely for visual convenience.

---

## 18. Obligation and Workflow Completion Law

Klinikos needs a shared semantic layer for unresolved obligations without erasing domain-specific records.

Canonical obligation semantics:

`EXPECTED → OWNED → ACCEPTED/ACKNOWLEDGED → IN_PROGRESS → FULFILLED → VERIFIED → RECONCILED → CLOSED`

with blocked, cancelled, expired, disputed and reopened variants where applicable.

An obligation may project from a clinical order, referral, result review, form, authorization, claim follow-up, credential renewal, EDU requirement, Grid fulfillment, customer implementation task or financial obligation.

This shared layer powers “what still needs to happen?” without replacing the authoritative source record.

---

## 19. Grid Law

Grid is the universal healthcare relationship, resource, capacity, opportunity, matching and transaction network inside Klinikos.

The human language is:

**I NEED** and **I HAVE**.

Grid is not limited to staffing.

It may govern allowed classes of people/work, professional services, rooms/space, facilities, equipment/capacity, diagnostic capacity, business services, products/supplies, education, placements/preceptors, organizations, referrals and other approved resource classes.

Hard eligibility always precedes ranking.

---

## 20. Commerce and Listing Law

Commerce OS is not a second marketplace. It is the catalog/listing/transaction capability layer used by Grid and business experiences.

Use the smallest coherent model:

- `Participant` / seller/buyer context;
- `CatalogItem` / `Listing` as a market-facing projection of a resource, service, product, capacity or opportunity;
- `Demand`;
- `Capability` / `Requirement`;
- `Availability/Capacity`;
- `EligibilityCheck`;
- `Match`;
- `Offer/Quote`;
- `Agreement`;
- `Reservation/Booking/Order` as policy-specific commitment forms;
- `Transaction`;
- `Fulfillment`;
- `FinancialObligation`;
- `Payment/Settlement Evidence`;
- `Dispute/Incident`;
- `ReputationEvent`.

Do not create separate parallel transaction engines for space, workforce, education, services and products.

Policy classes specialize the shared engine.

Initial policy classes:

`SPACE_RENTAL`, `BUSINESS_SERVICE`, `EDUCATION`, `PRODUCT`, `WORKFORCE`, `PROFESSIONAL_SERVICE`, `CARE_DISCOVERY`, `REFERRAL`, `DIAGNOSTIC_CAPACITY`, `OTHER_ALLOWED_CLASS`.

Regulated classes fail closed if an explicit policy is absent.

---

## 21. Transaction Law

A consequential transaction is a deterministic state machine.

Generic shape:

`DISCOVERY/DEMAND → ELIGIBILITY → MATCH/SELECTION → OFFER/QUOTE → ACCEPTANCE → AGREEMENT → RESERVATION/ORDER/BOOKING → PAYMENT CONDITION → FULFILLMENT/DELIVERY → OBLIGATION RECONCILIATION → SETTLEMENT/PAYOUT → CLOSED`

Policy classes may omit or reorder allowed steps but must define the transition law explicitly.

Acceptance is not booking. Booking is not fulfillment. Internal obligation is not payment. Payment is not settlement. Settlement is not automatically platform revenue recognition.

---

## 22. Financial Truth and Payment Law

Financial OS is the single economic-truth substrate.

Use integer cents and versioned server-owned policy.

Browser return, query parameters, client state or UI labels never establish payment, entitlement, refund, payout or settlement.

Processor/webhook/API evidence or an approved auditable manual reconciliation path establishes external money state.

Clinical billing/claims and marketplace/commercial money may use different domain workflows but share evidence, obligation, amount, policy, event and reconciliation semantics where appropriate.

---

## 23. Pricing Law and Pricing Fabric

Klinikos must not have one universal take rate.

Pricing is a server-owned, versioned policy fabric keyed by product, plan, transaction policy class, party, geography/jurisdiction where permitted, contract, effective date and entitlement context.

The engine must support:

- free;
- subscription;
- percentage fee;
- fixed fee;
- buyer fee;
- seller fee;
- listing fee;
- promotion fee;
- processing pass-through/fee;
- usage/metered fee;
- no platform fee;
- contract override.

It must also support allowances, entitlements, coupons, discounts, promotions, enterprise contracts, grandfathering, price versioning and margin reporting.

For every economic class measure:

`GMV`, platform revenue, processor fees, direct COGS, seller/provider proceeds, refunds, support burden, fraud/chargeback exposure and regulatory/legal risk.

Public pricing remains simple even when internal pricing is sophisticated.

Potential healthcare fee-splitting, anti-kickback, corporate-practice, referral, staffing/employment and similar regulatory questions require counsel before activation. Architecture must support `NO_PLATFORM_FEE` and alternate lawful monetization rather than assuming a percentage is permitted.

---

## 24. EDU Law

EDU is the education, simulation, competency-evidence and career-progression engine.

Canonical route:

`LEARN → PRACTICE/SIMULATE → EVIDENCE → HUMAN REVIEW → COMPETENCY EVIDENCE → COMPLETION → PLACEMENT → CREDENTIAL EVIDENCE → GRID ELIGIBILITY ONLY WHEN POLICY PERMITS → WORK → EXPERIENCE → CONTINUING EDUCATION`

EDU evidence never silently becomes licensure, professional authority, privileges, employment eligibility or clinical authority.

Placement uses Grid rather than creating a second marketplace.

---

## 25. Zumi Law

**Zumi is Klinikos Intelligence, not a chatbot and not domain authority.**

Zumi understands:

- who the user is;
- active context;
- current goal/intent;
- relevant authorized state;
- authoritative source hierarchy;
- incomplete requirements/blockers;
- available governed capabilities;
- next allowed actions.

Zumi may interpret, retrieve, summarize, explain, route, prepare, preview and invoke approved tools/actions through server-controlled capabilities.

Zumi may never become authority for identity, tenant isolation, RBAC, credential validity, privileges, eligibility, clinical signing, medication authority, payment, settlement, legal acceptance or security policy.

### Memory authority hierarchy

1. authoritative live Klinikos data;
2. verified external evidence;
3. human-approved institutional knowledge;
4. human-confirmed personal memory/preferences;
5. conversation-derived memory;
6. AI hypothesis.

Lower levels never silently override higher levels.

Clinical truth stays in clinical repositories and is retrieved when authorized rather than duplicated indiscriminately into AI memory.

---

## 26. Zumi Action Law

The universal interaction increasingly begins with:

> **WHAT DO YOU NEED?**

Natural language is converted into structured intent, active context, missing requirements and governed capability routes.

High-consequence action should support:

`INTENT → ACTION PREVIEW → AUTHORIZATION/POLICY → EXPLICIT APPROVAL WHEN REQUIRED → EXECUTION → RESULT EVIDENCE → AUDIT → REVERSAL/RECOVERY PATH WHERE POSSIBLE`

Tool/action definitions are server-owned and typed. Retrieved content, model output and tool results are data, not instructions or authority.

---

## 27. Frontend Simplicity Law

**BACKEND COMPLEXITY MAY INCREASE. FRONTEND PERCEIVED COMPLEXITY MUST DECREASE.**

The user must not understand the module graph to operate Klinikos.

Primary UX principles:

- outcome-first;
- role/context-adaptive;
- progressive disclosure;
- 1–3 obvious decisions for ordinary major actions;
- no irrelevant dashboard-card walls;
- no giant universal navigation menu;
- deterministic status clearly distinguished from AI explanation;
- same action language across desktop/tablet/mobile;
- WCAG-oriented keyboard, focus, contrast, motion and semantic support;
- System/Light/Dark presentation is a preference, never product authority.

Living Home remains the adaptive operating front door. Current Visit remains the provider clinical convergence surface. Grid remains I NEED / I HAVE.

---

## 28. Navigation and Context Law

Navigation adapts to active person, account, organization, location, role, task and permissions.

Context switching is explicit and server-authorized.

A route existing does not imply that every user should see it.

The system should surface the smallest useful next set of actions and preserve access to deeper expert workspaces without forcing module hunting.

---

## 29. Search and Discovery Law

Search is a unified intent/discovery layer over authorized data and public network projections, not an excuse to leak private records.

Organic relevance and sponsored placement remain distinguishable.

Sponsorship may affect discovery ordering only inside allowed policy; it may never purchase professional eligibility, credential state, clinical appropriateness or safety clearance.

Public SEO pages use intentionally public projections only.

---

## 30. Healthcare Business OS and Enterprise Law

Klinikos must support lifecycle progression:

`INDIVIDUAL → INDEPENDENT PROFESSIONAL → BUSINESS → CLINIC → MULTI-LOCATION → NETWORK → HEALTH SYSTEM → INSTITUTION`

Healthcare Business OS reuses Grid/Commerce/CRM/scheduling/payments/analytics/team/resource primitives rather than creating another application silo.

Enterprise capabilities may include hierarchy, locations, departments, teams, RBAC, SSO/SCIM, central credentialing, contracting, configuration governance, multi-entity reporting, integration management and network/workforce/capacity analytics.

Separate legal entities retain separate legal/data/financial boundaries where required.

---

## 31. Interoperability Law

Klinikos canonical domain models remain internal application truth. External vendors and standards live behind adapters.

Potential standards include FHIR/US Core, SMART, HL7 v2, X12, DICOM/DICOMweb, NCPDP, REST, webhooks, SFTP and vendor-specific interfaces as appropriate.

Canonical integration lifecycle:

`DOMAIN OUTBOX → ADAPTER → EXTERNAL DELIVERY → TRANSPORT ACK → BUSINESS ACK/RESPONSE → INBOX → VALIDATION/NORMALIZATION → DOMAIN EVENT → RECONCILIATION`

Required capabilities include idempotency, retries, dead-letter/manual-reconciliation paths, external identifiers, mapping/versioning, provenance and monitoring.

---

## 32. External Integration Truth Law

Never call an integration live because code, credentials, an adapter or a sandbox exists.

Canonical statuses:

`PLANNED → CONTRACT_PENDING → CREDENTIALS_PENDING → SANDBOX → CONNECTED → UAT → CONTROLLED_PRODUCTION → PRODUCTION_VERIFIED`

plus `DEGRADED`, `DISABLED` and `BLOCKED`.

`PRODUCTION_VERIFIED` requires actual controlled evidence in the intended production environment.

External contractual, licensing, BAA, enrollment, certification and security requirements remain independent gates.

---

## 33. Privacy Law

Collect, use, expose and retain the minimum information necessary for the authorized purpose.

Patient identities never automatically become public Grid profiles.

Public marketplace/network projections are deliberate projections, not raw account, employee, credential, patient or organization records.

Cross-tenant, cross-role and cross-context access must fail closed.

Sensitive external egress requires the exact provider/workload approval and contractual/security posture appropriate to that data.

---

## 34. Trade-Secret and Server-Boundary Law

Anything that must remain confidential remains server-side.

The browser is an inspectable disclosure environment.

Server-confidential by default includes secrets/credentials, Zumi hidden directives, proprietary orchestration/ranking/trust/risk/fraud logic, private economic/margin formulas, unreleased strategy, privileged security detail and unnecessary PHI/PII.

The browser receives minimum-necessary DTO/view-model projections.

Clickwrap or labels do not transform public information into a trade secret. Legal trade-secret protection depends on actual secrecy and reasonable protective conduct.

---

## 35. Trust and Safety Law

Trust & Safety is shared infrastructure across accounts, organizations, credentials, listings, opportunities, transactions, reviews, AI/tool use and payments.

The platform must support, as justified by risk:

- reporting and blocking;
- rate limits and anti-automation controls;
- identity/account takeover defenses;
- verification workflows;
- risk signals and fraud holds;
- payment/payout holds;
- listing/opportunity review;
- moderation queues;
- evidence preservation;
- suspension/limitation;
- appeals and reinstatement;
- incident investigation;
- anti-collusion/review-manipulation protections;
- prompt-injection/tool-exfiltration defenses;
- PHI/data-exfiltration protections.

Risk scores are decision-support signals unless an explicit policy makes a deterministic threshold authoritative. They do not silently become clinical, credential or legal authority.

---

## 36. Legal Gateway Law

Legal terms are versioned contracts/policies tied to audience and product context, not one universal clickwrap.

Potential layers include public terms, account terms, acceptable use/code of conduct, Grid terms, seller/business terms, professional terms, organization terms, commerce terms, EDU terms, Clinic OS contracts, privacy notices, BAAs where applicable, enterprise MSA/order forms and product-specific agreements.

Execution/acceptance evidence and version history must be preserved.

Do not claim enforceability or legal sufficiency without appropriate counsel review.

---

## 37. Distribution and Network-Effect Law

Growth should emerge naturally from useful relationships:

- professional → clinic;
- clinic → staff;
- employee → coworker;
- student → school;
- school → student/preceptor/site;
- clinic → referral partner;
- buyer → seller;
- seller → customer;
- organization → vendor/location/partner.

Invitations must carry bounded, revocable context and may not bypass authorization.

Marketplace liquidity is measured by the probability and speed of satisfying real demand under actual eligibility, geography, time, price and capacity constraints—not raw signup counts.

---

## 38. Moat Law

Klinikos should not depend on model exclusivity. Assume general AI models become commoditized.

Defensible layers include:

1. Healthcare Relationship Graph;
2. Clinical Change Graph;
3. Healthcare Execution/Obligation Graph;
4. Revenue Integrity/Reconciliation Graph;
5. Configuration/Policy Graph;
6. Evidence/Provenance Graph;
7. verified longitudinal outcome and network-performance evidence;
8. integrations, operational history and switching costs created by real workflow completion.

Data moat must arise from permissioned product use and better service, not exploitative collection.

---

## 39. Strategic Simplification Law

Do not build a capability merely because it sounds impressive.

Before adding a subsystem prove:

`USER VALUE + ECONOMIC VALUE + ARCHITECTURAL FIT + NETWORK/RETENTION VALUE + BUILD/BUY/PARTNER LOGIC + LEGAL/SECURITY FEASIBILITY + DEPENDENCY ORDER`.

Delete or hide a frontend concept when a stronger backend can remove a user decision.

Examples of capabilities that should generally remain backend concepts rather than primary navigation include entitlement resolution, policy engines, transaction state machinery, trust scoring, orchestration registries, configuration inheritance and reconciliation queues unless a specialist operator actually needs to inspect them.

---

## 40. Deployment Truth Law

Repository success, CI success and production success are separate facts.

Do not claim production deployment until the exact intended SHA is independently verified in production with the relevant health/user journey evidence.

If CI fails before checkout, record it as infrastructure failure, not code-test failure. Continue independent work only where it can be safely verified by another path and never label the unexecuted exact head green.

---

## 41. Migration Law

Migration follows:

`PRESERVE → UNDERSTAND → ADAPT → HARDEN → GENERALIZE → EXTEND`.

No big-bang rewrite.

The first convergence program is:

1. canon/source-of-truth reconciliation;
2. additive Person/relationship/organization-membership identity substrate behind existing auth;
3. authorization convergence over relationships/profession/effective dates;
4. Current Visit + encounter-specific staff handoff;
5. structured clinical components + Clinical Change Graph;
6. universal obligation/completion semantics;
7. Grid/Commerce transaction-policy convergence;
8. pricing fabric/entitlement/metering convergence;
9. integration outbox/inbox/reconciliation platform;
10. Trust & Safety shared infrastructure;
11. enterprise/network configuration;
12. Zumi durable governed memory/action registry after authoritative substrates are stable.

Each tranche must preserve compatibility through adapters and migrations until all consumers move safely.

---

## 42. Canon disposition

### Remain authoritative as specialist detail

- `KLINIKOS_CLINICAL_CONVERGENCE_CANON.md`
- `GRID_CANON.md`
- `ZUMI_CANON.md`
- `EDU_CANON.md`
- `CLINIC_OS_CANON.md`
- `FINANCIAL_OS_CANON.md`
- `PORTAL_AND_ROLE_CANON.md`
- `KLINIKOS_PRICING_AND_MONETIZATION_CANON.md`
- `FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md`
- current design/reference canons

### Remain authoritative for evidence/rationale below this canon

- `KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md`
- `KLINIKOS_ECOSYSTEM_CANON.md`

### Must be amended to reference this canon

- `SOURCE_OF_TRUTH.md`
- `KLINIKOS_ARCHITECTURE_INDEX.md`
- `AGENTS.md`
- future domain canons when their precedence text conflicts.

### Historical/subordinate

Older master prompts, previous “master canon” documents, planning estimates and stale architecture briefs remain historical reasoning unless explicitly promoted into this canon or a current specialist canon.

No historical file may override current implementation truth or this architecture hierarchy merely because it is longer or more detailed.

---

## 43. Category definition

**What Klinikos is now:** a broad governed healthcare operating-platform foundation with real clinical, operational, Grid, EDU, financial and intelligence primitives, plus incomplete external rails and incomplete shared identity convergence.

**What Klinikos should become:** the healthcare execution and relationship operating network—a governed system that understands identity, authority, context, capacity, obligations, care, transactions, money and outcomes across the healthcare lifecycle while making the human experience progressively simpler.

**Why this is larger:** the value is no longer one clinic application. It is continuity across people, organizations, care, work, education, resources and economic relationships.

**What remains permanent:** deterministic authority, truthful state, one shared substrate, Current Visit, Clinical Change, Grid I NEED/I HAVE, EDU evidence boundaries, Zumi-as-intelligence-not-authority, financial evidence, server-confidential proprietary logic, no customer forks, and invisible complexity.

**What changes:** domain modules become increasingly service layers; identity becomes cross-organization and lifelong; Grid becomes the economic/relationship exchange; Commerce becomes a shared transaction capability; pricing becomes policy-driven; trust becomes shared infrastructure; integration becomes a durable reconciliation platform; and the UI increasingly presents intent, next action and completion instead of architecture.