# Klinikos Document Authority Inventory

Initial deterministic scan: 2026-08-29
Remediation checkpoint: 2026-08-30
Status: `CONSOLIDATION CONTROL — SUBORDINATE TO docs/KLINIKOS_MASTER_CANON.md`
Audit base: `19ebfe5a`
Scope: root Markdown, `docs/**`, `governance/**`, relevant canon/registry/control-plane source, and the authority map.

## Purpose and governing classification law

This inventory exists to remove ambiguity without deleting accepted Klinikos knowledge.

After consolidation, exactly one narrative document may hold supreme company/product authority:

`docs/KLINIKOS_MASTER_CANON.md`

Every other non-code artifact must be classified as an `IMPLEMENTATION_CONTRACT`, `EVIDENCE_REGISTER`, `SPECIALIST_REFERENCE`, `HISTORICAL_RETIRED_CANDIDATE` pending migration proof, or `HISTORICAL_RETIRED` after that proof. A file name containing `CANON`, `MASTER`, `FINAL`, `GOVERNING`, `BLUEPRINT`, `SOURCE OF TRUTH`, or `OPERATING SYSTEM` does not grant authority.

Permanent cleanup invariants:

- `docs/CLINICOS_MASTER_CANON.md` cannot survive as a second active master.
- `docs/SOURCE_OF_TRUTH.md` cannot retain parallel product authority.
- Predecessor ecosystem/universe/company documents cannot retain independent governing status after their unique content is migrated.
- Header/read-path repair must remove ambiguity without deleting accepted Klinikos knowledge.
- A retirement candidate remains preserved until the migration matrix and inbound-reference review prove a safe destination.

## Reading this register

This is a document-level inventory, not a directory-family classification. Every row records a source inspected during the deterministic scan that either declares authority, is named by an agent read instruction, carries product/business/architecture requirements, or is an executable authority/registry contract. Dated application, proposal, audit, and evidence packets that do not make product authority claims are listed individually in the evidence appendix so they cannot become an untracked authority by filename.

`MASTER_CANON` is the only class permitted to institute current product, architecture, business, or experience law. `IMPLEMENTATION_CONTRACT` implements or routes decisions; `EVIDENCE_REGISTER` records bounded facts or source material; `SPECIALIST_REFERENCE` explains a domain beneath the Master Canon; `HISTORICAL_RETIRED_CANDIDATE` has governing-looking or predecessor content that must be migrated before it can become historical provenance. No row authorizes deletion or retirement in this task.

**Inbound key.** `AGENTS-5..9` means the exact conditional read instruction in `AGENTS.md:13-19`; `AGENTS-domain` means its final “corresponding specialist canon” instruction. `CLAUDE-R<n>` means the numbered legacy required-reading list in `CLAUDE.md:47-89`. `INDEX` and `SOT` preserve the conflicting read/precedence instructions found by the original 2026-08-29 scan; their presence is historical evidence of the remediation target, not an endorsement or a claim that the conflict still exists. `None found` means no direct bootstrap/read instruction was found by that scan; normal links from domain documentation may still exist.

## Authority and predecessor records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/KLINIKOS_MASTER_CANON.md` | `ACTIVE — SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY` | Current integrated Klinikos constitution and intended architecture | All narrative product, company, and experience material | Sole precedence, merge-forward protocol, stable decisions | `MASTER_CANON` | Retain as sole narrative authority; amend only through governed convergence | `SOT`, `INDEX`, referenced by `AGENTS.md`; current Authority Map primary | Header; §§0.1–0.4; Authority Map `master_canon` |
| `docs/KLINIKOS_AUTHORITY_MAP.yaml` | Machine-readable authority map | Typed implementation-facing precedence and invariants | Master Canon; executable registries | Machine-readable source/status/authority constraints | `IMPLEMENTATION_CONTRACT` | Retain; update only with Canon changes | Referenced in Master Canon and consolidation material | YAML `master_canon` and `authority` keys |
| `docs/CLINICOS_MASTER_CANON.md` | `AUTHORITATIVE`; “MASTER SOURCE OF TRUTH” | Older product/architecture master | Master Canon, Constitution, ecosystem and specialist canons | Earlier universal primitives and legacy terminology | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; migrate unique accepted content before header/read-path remediation | `SOT`, `INDEX` historical predecessor chain | Header declares conflict with sole Canon |
| `docs/KLINIKOS_CONSTITUTION.md` | `AUTHORITATIVE COMPANION` to old master | Earlier constitutional primitives | Master Canon §§ identity, authority, events, finance, safety | Twenty concise constitutional laws and engine inventory | `HISTORICAL_RETIRED_CANDIDATE` | Map unique laws upward, then retain as provenance/reference | Directly names `CLINICOS_MASTER_CANON`; no current bootstrap read | Header and constitutional-laws section |
| `docs/SOURCE_OF_TRUTH.md` | `AUTHORITATIVE` | Legacy product-law and read-routing document | Master Canon and Architecture Index | Older wiring, ecosystem, design and commercial routing | `HISTORICAL_RETIRED_CANDIDATE` | Preserve pending migration; remove competing authority language later | `AGENTS.md:11`, `CLAUDE-R3`, `INDEX` precedence #2 | Header and §§1–13 |
| `docs/KLINIKOS_ARCHITECTURE_INDEX.md` | `AUTHORITATIVE INDEX` | Legacy navigation/read-order index | Source of Truth, specialist canons, older designs | Historical ordered reading chain | `HISTORICAL_RETIRED_CANDIDATE` | Rework only after this audit to subordinate navigation | `AGENTS.md:11`, `CLAUDE-R2` | Header; precedence/read-order sections |
| `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` | Master product/engineering specification | Older comprehensive product-engineering source | Master Canon, feature registry, routes | Predecessor detail requiring migration trace | `HISTORICAL_RETIRED_CANDIDATE` | Extract unique requirements into Master Canon or specialist contracts; preserve provenance | `CLAUDE-R1` | Filename/header and CLAUDE read instruction |
| `docs/KLINIKOS_PRODUCT_AND_WEBSITE_MASTER_SCOPE.md` | Master-scope language | Product/site breadth and public-surface requirements | Master Canon, public-discovery and commercial records | Scope framing and website inventory | `HISTORICAL_RETIRED_CANDIDATE` | Extract accepted unique scope into Canon/route contracts | None found | Header/status scan and direct reference count 1 |
| `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md` | `TOP-LEVEL FINAL-FORM TARGET ARCHITECTURE` | Earlier final ecosystem handoff | Master Canon; ecosystem/universe/control-plane records | Cross-engine target inventory | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; migrate unique accepted detail | `CLAUDE-R35` | Header; legacy read list |
| `governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md` | `GOVERNING FINAL-FORM ECOSYSTEM BOUNDARY` | Earlier universe/expansion architecture | Master Canon, Ecosystem Canon, blueprint | Actor/resource/sector expansion map | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; migrate accepted universe detail | `CLAUDE-R37` | Header; legacy read list |
| `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` | `GOVERNING COMPANY-BUILDING ARCHITECTURE` | Company function, cadence and control design | Master Canon company sections; company registry | Company operating cadence | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; merge permanent law upward | `CLAUDE-R24` | Header; companion implementation plan |
| `governance/KLINIKOS_FINAL_FORM_BUSINESS_PLAN.md` | `GOVERNING STRATEGY INPUT` | Proposed business/market/capital thesis | Master Canon business architecture; commercial records | Proposed economics and capital framing | `HISTORICAL_RETIRED_CANDIDATE` | Keep as proposal evidence pending explicit adoption | `CLAUDE-R23` | Header explicitly limits unverified economics |
| `governance/KLINIKOS_HYPERSCALE_PLATFORM_STRATEGY.md` | `GOVERNING LONG-RANGE STRATEGY INPUT` | Long-range scale and partner strategy | Master Canon scale/economic direction | Hyperscale hypotheses | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as strategic provenance; migrate accepted laws | `CLAUDE-R34` | Header |
| `governance/KLINIKOS_AI_OPERATED_DIGITAL_BUSINESS.md` | `GOVERNING STRATEGY INPUT` | Website-led AI-operated business model | Master Canon/Zumi/public discovery | Digital-business execution detail | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; retain only as specialist runbook after migration | `CLAUDE-R33` | Header |
| `governance/KLINIKOS_FINAL_FORM_CONTROL_PLANE.md` | `GOVERNING EXECUTION CONTROL` | Customer-mode, go-to-market and operating execution model | Master Canon, Final Business Plan, company control plane | Overlay/full-Klinikos modes and land/prove/deploy loop | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; map accepted execution laws to Canon/contracts | `CLAUDE-R21`; direct reference count 1 | Header; §§1–5 |
| `governance/KLINIKOS_SOURCE_LOCKED_REQUIREMENTS.md` | `GOVERNING INPUT REGISTER` | Traceability register for direct user, professional, canonical-feature and discovery needs | Feature registry, clinical/experience requirements | Requirement IDs, sources, dispositions and acceptance evidence | `IMPLEMENTATION_CONTRACT` | Retain as subordinate traceability contract; align wording later | `CLAUDE-R22`; direct reference count 3 | Header; registry schema and `DOC-*` records |

## Specialist product, experience, Grid, and Zumi records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/GRID_CANON.md` | `AUTHORITATIVE SPECIALIST CANON` | Grid domain model and policy | Master Canon Grid law | Demand/supply, eligibility/matching detail | `SPECIALIST_REFERENCE` | Retain, explicitly subordinate on later remediation | `AGENTS-domain`; `CLAUDE-R9`; `SOT`; `INDEX` | Header and read lists |
| `docs/GRID_LOCATION_PROVIDER_CANON.md` | `AUTHORITATIVE SPECIALIST CANON` | Provider-neutral map/geolocation and degraded-mode rules | Grid Canon and Master Canon privacy/cost law | MapLibre/OpenFreeMap stack, geolocation consent, Haversine/OSM fallback | `SPECIALIST_REFERENCE` | Retain as Grid technical specialist; no authority escalation | `AGENTS-domain`; direct reference count 1 | Header; Decision, Degradation, Acceptance |
| `docs/GRID_DISCOVERY_GEOLOCATION_AND_MVP_SPEC.md` | MVP spec | Grid discovery/location implementation design | Grid/location canon | MVP route and acceptance detail | `IMPLEMENTATION_CONTRACT` | Retain as implementation provenance | `AGENTS-domain` by subject | Filename/header scan |
| `docs/GRID_TRANSACTION_FLOW.md` | No supreme claim | Grid transaction workflow | Grid Canon/Financial OS | Transaction state sequence | `SPECIALIST_REFERENCE` | Retain beneath domain canons | `AGENTS-domain` by subject | Header/workflow content |
| `docs/KLINIKOS_ASSURANCE_AND_EXPERT_GRID_CANON.md` | `CANDIDATE SPECIALIST CANON — IMPLEMENTATION FOUNDATION` | Rules & Evidence, Quality Guardian and Expert Grid design | Master Canon authority/security; clinical/quality rules | Versioned rule/evidence model and bounded persisted-quality adapter | `SPECIALIST_REFERENCE` | Retain as candidate specialist; never treat candidate as current product law | `AGENTS-domain`; `SOT`; direct reference count 3 | Header; §§1–6 |
| `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` | Specialist canon | Current Visit and clinical convergence law | Master Canon clinical convergence | Encounter/handoff/change/composition detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-9`; `CLAUDE-R7`; `SOT`; `INDEX` | AGENTS explicit mandatory read |
| `docs/CLINIC_OS_CANON.md` | `AUTHORITATIVE SPECIALIST CANON` | Clinic operating engine detail | Master Canon/clinical convergence | Clinic workflows and governed operations | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain`; `CLAUDE-R8`; `SOT`; `INDEX` | Header |
| `docs/PORTAL_AND_ROLE_CANON.md` | `AUTHORITATIVE SPECIALIST CANON` | Identity/context/portal separation | Master Canon identity/authority | Patient/staff session and role-context UI boundaries | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain`; `SOT`; `INDEX`; direct reference count 4 | Header; §§1–8 |
| `docs/PATIENT_PORTABILITY_CANON.md` | Canon status | Patient-directed portability architecture | Clinical/portal/privacy law | Export/transfer/import phases and patient direction | `SPECIALIST_REFERENCE` | Retain subordinate; treat delivery rails as future unless verified | `AGENTS-domain` by subject; direct reference count 1 | Header; phased plan |
| `docs/KLINIKOS_ECOSYSTEM_CANON.md` | Ecosystem canon | Ecosystem/lifecycle/wiring direction | Master Canon ecosystem law | Cross-engine composition detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE`/`SOT`/`INDEX`; direct reference count 6 | Header and legacy precedence |
| `docs/KLINIKOS_EXPERIENCE_ENVELOPE_AND_ZUMI_DATA_GOVERNANCE.md` | Governance/canon status | Experience-envelope and data-boundary design | Master Canon experience/security/Zumi | Envelope selection and data-governance constraints | `SPECIALIST_REFERENCE` | Retain subordinate | Direct reference count 1 | Header and data-governance sections |
| `docs/KLINIKOS_PRODUCT_CONTROL_AND_COMPREHENSION_CANON.md` | Repository-wide canon | Persistent Zumi, public UX, comprehension and SEO law | Master Canon experience/Zumi; frontend boundary | Shell consistency, indexing, plain-language controls | `SPECIALIST_REFERENCE` | Retain subordinate; high-priority read remains valid | `AGENTS-7`; direct reference count 3 | Header and AGENTS § persistent Zumi law |
| `docs/ZUMI_CONVERSATION_INTELLIGENCE_CANON.md` | `AUTHORITATIVE SPECIALIST CANON` | Conversation understanding, continuity and degraded behavior | Master Canon Zumi law; Master Prompt | Useful-turn/degraded mode/context inheritance rules | `SPECIALIST_REFERENCE` | Retain subordinate; high-priority read remains valid | `AGENTS-8`; direct reference count 2 | Header; §§1–6; AGENTS Zumi law |
| `docs/ZUMI_MASTER_PROMPT.md` | `canonical prompt design reference` | Prompt-design behavioral reference | Zumi Canons and runtime implementation | Copyable governed intelligence loop | `SPECIALIST_REFERENCE` | Retain as non-runtime reference; do not expose as client contract | Direct reference count 1 | Header; opening runtime caveat |
| `docs/ZUMI_CANON.md` | Specialist canon | Zumi domain architecture | Master Canon/Zumi conversation canon | General Zumi domain detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain`; `CLAUDE-R11`; `SOT`; `INDEX` | Header/read lists |
| `docs/ZUMI.md` | Product document | Zumi product notes | Zumi canons | Historical/product context | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; reconcile any unique accepted direction | None found | Filename/content scan |
| `docs/ZUMI_AMBIENT_INTELLIGENCE.md` | No authority claim | Ambient-intelligence design | Zumi/experience references | Ambient interaction ideas | `SPECIALIST_REFERENCE` | Retain as detail | None found | Header scan |
| `docs/ZUMI_BRAND_LANGUAGE.md` | Brand reference | Zumi language/copy guidance | Master Canon brand rule | Copy vocabulary | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Header scan |
| `docs/ZUMI_CUSTOMER_PRODUCT_CONTEXT.md` | Product context | Customer-facing Zumi context | Zumi/product canons | Customer positioning | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Header scan |
| `docs/ZUMI_CONVERSATION_FIRST_2026-08-18.md` | Dated design | Conversation-first design evidence | Conversation intelligence canon | Earlier design rationale | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance | None found | Dated filename/header |
| `docs/PUBLIC_ZUMI_INTELLIGENCE_BOUNDARY.md` | Boundary document | Anonymous/public Zumi safety boundary | Frontend boundary; conversation canon | Public-safe scope | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-8` by subject | Header scan |
| `docs/PUBLIC_ZUMI_SECURITY_NOTES.md` | Security notes | Public Zumi threat/control notes | Security/Frontend boundary | Security implementation notes | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-5`, `AGENTS-8` by subject | Header scan |
| `docs/PUBLIC_ZUMI_DURABLE_QUOTA.md` | Quota contract | Public Zumi quota behavior | Zumi/public security | Durable quota constraints | `IMPLEMENTATION_CONTRACT` | Retain with implementation evidence | `AGENTS-8` by subject | Header scan |
| `docs/PUBLIC_ZUMI_IMPLEMENTATION_VERIFICATION.md` | Verification | Public Zumi evidence | Feature/external evidence | Test and verification record | `EVIDENCE_REGISTER` | Retain as evidence only | None found | Filename/header |
| `docs/KLINIKOS_DESIGN_AND_WIRING_CANON.md` | `AUTHORITATIVE EXPERIENCE DIRECTION` | Frontend visual, Living Home and wiring direction | Master Canon experience; frontend experience/design evidence | Reference-locked visual/wiring rules | `SPECIALIST_REFERENCE` | Retain subordinate; resolve authority adjective later | `AGENTS-domain`; `CLAUDE-R16`; `SOT`; `INDEX`; direct reference count 7 | Header; §§1–2 |
| `docs/FRONTEND_EXPERIENCE_CANON.md` | Experience canon | UX implementation reference | Master Canon/product-control/design canon | Frontend interaction detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-5`; `CLAUDE-R16`; `INDEX` | Header/read lists |
| `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` | Repository-wide canon | Confidential server execution and DTO disclosure boundary | Master Canon security; Security Architecture | Browser/server non-authority and disclosure rules | `SPECIALIST_REFERENCE` | Retain subordinate; mandatory topical read remains valid | `AGENTS-5`; `CLAUDE-R15`; `SOT`; `INDEX` | AGENTS confidentiality law |
| `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` | Design-package authority | Historical supplied-design evidence | Design & Wiring / approved reference | Package provenance | `EVIDENCE_REGISTER` | Retain as evidence, not product law | `INDEX` historical reference | Header and Master Canon design citation |
| `docs/APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md` | `AUTHORITATIVE VISUAL REFERENCE NOTES` | Reference-frame notes | Design & Wiring/Black Label | Page-by-page visual composition | `SPECIALIST_REFERENCE` | Retain as accepted design detail; subordinate | `SOT`; `INDEX` | Header says complements Design & Wiring |
| `docs/DESIGN_SYSTEM.md` | Design system | UI tokens/components guidance | Design canons | Shared design-system detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain` by subject | Header scan |
| `docs/SCREEN_EXPERIENCE_RELEASE_GATE.md` | Release gate | Screen-contract acceptance criteria | Master Canon SCREEN decision | Screen readiness gate | `IMPLEMENTATION_CONTRACT` | Retain | `AGENTS-domain` by subject | Header scan |
| `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md` | Design handoff | Black Label implementation detail | Design canons | Handoff scope | `SPECIALIST_REFERENCE` | Retain as design provenance | `CLAUDE-R19` | Header/read list |
| `docs/KLINIKOS_BLACK_LABEL_PRODUCTION_INTEGRATION_MAP_2026-08-23.md` | Integration map | Black Label production wiring | Design/wiring canon | Integration mapping | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header scan |
| `docs/CINEMATIC_PRODUCT_REALIZATION_MAX_SCOPE.md` | `AUTHORITATIVE EXECUTION DIRECTIVE` | Earlier maximum visual/product scope | Master Canon, Design & Wiring, Black Label | Broad cinematic target language | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; migrate accepted law before reclassification | None found | Header declares directive |
| `docs/PIXEL_REFERENCE_RECONSTRUCTION.md` | Reference reconstruction | Design comparison work | Approved design evidence | Reconstruction details | `EVIDENCE_REGISTER` | Retain as evidence | None found | Header scan |
| `docs/PIXEL_REFERENCE_RECONSTRUCTION_PASS.md` | Reconstruction pass | Design verification record | Pixel reference | Pass-specific findings | `EVIDENCE_REGISTER` | Retain as evidence | None found | Dated/pass header |

## Business, security, finance, route, and operating records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/EDU_CANON.md` | Specialist canon | EDU domain law | Master Canon workforce architecture | Learning/competency detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain`; `CLAUDE-R10`; `SOT`; `INDEX` | Header/read lists |
| `docs/KLINIKOS_EDU_PRODUCT_SPEC.md` | Product spec | EDU product requirements | EDU Canon | Product-level EDU detail | `IMPLEMENTATION_CONTRACT` | Retain | `AGENTS-domain` by subject | Header scan |
| `docs/edu/KLINIKOS_EDU_SPEC.md` | EDU spec | Nested EDU specification | EDU Canon/product spec | Detailed EDU scope | `IMPLEMENTATION_CONTRACT` | Retain; reconcile duplication later | `AGENTS-domain` by subject | Header/path scan |
| `docs/FINANCIAL_OS_CANON.md` | Specialist canon | Financial/RCM domain law | Master Canon finance law | Ledger/claim/reconciliation detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-domain`; `CLAUDE-R12`; `SOT`; `INDEX` | Header/read lists |
| `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` | Pricing canon | Pricing/economics direction | Master Canon commercial architecture | Entitlement/price detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-5`; `CLAUDE-R14`; `INDEX` | Header/read list |
| `docs/KLINIKOS_COMMERCIAL_CANON.md` | Commercial canon | Commercial execution guidance | Pricing/Business Plan | Offer/GT-M detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R13` | Header/read list |
| `docs/CUSTOMER_FUNDED_ACCESS_MODEL.md` | `FOUNDATION IMPLEMENTED / FULL BILLING INTEGRATION PARTIAL` | Variable-cost commercial boundary | Pricing/financial canons | Customer-funded usage model | `SPECIALIST_REFERENCE` | Retain; status claims require evidence | `AGENTS-5` by subject | Header |
| `docs/VARIABLE_COST_EXECUTION_COGS.md` | Cost document | Usage/cost execution guidance | Customer-funded access model | COGS assumptions | `EVIDENCE_REGISTER` | Retain as cost evidence | None found | Header scan |
| `docs/KLINIKOS_ICP_PRICING_EVIDENCE_2026-08-20.md` | Dated evidence | ICP/pricing research | Pricing canon | Research findings | `EVIDENCE_REGISTER` | Retain | None found | Date/status filename |
| `docs/MICRO_UNIT_COMMERCIAL_LEDGER_RFC.md` | RFC | Proposed unit-economics contract | Financial/commercial canons | RFC detail | `IMPLEMENTATION_CONTRACT` | Retain as proposal until adopted | None found | RFC title |
| `docs/FINANCIAL_OS_CANON.md` | Specialist canon | Financial operational law | Master Canon financial law | Financial lifecycle detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R12` | Header |
| `docs/LUXE_PAYMENT_EVIDENCE.md` | Payment evidence | Dated payment/integration facts | Production/financial truth | Endpoint/payment proof | `EVIDENCE_REGISTER` | Retain as historical evidence | None found | Filename/header |
| `docs/ROUTE_REGISTRY.md` | Registry | Human-readable lifecycle routes | Master Canon route law | Route contract inventory | `IMPLEMENTATION_CONTRACT` | Retain and validate against code | `SOT`/`INDEX` route references | Header |
| `docs/ROUTE_REGISTRY_STATUS.md` | Status register | Route implementation state | Route Registry | Current route status | `EVIDENCE_REGISTER` | Retain, refresh with code | None found | Header |
| `docs/ROUTE_ACTION_AUDIT.md` | Audit | Route/action audit findings | Route Registry | Audit evidence | `EVIDENCE_REGISTER` | Retain | None found | Header |
| `docs/MVP_JOURNEYS.md` | Journeys | Historical end-to-end proof contracts | Route Registry | Journey snapshots | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; migrate still-active acceptance contracts | `INDEX` | Legacy index precedence |
| `docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md` | `CURRENT RELEASE STATUS + HISTORICAL POINTER` | Founding-clinic status/history | Feature Status | Earlier release snapshot | `EVIDENCE_REGISTER` | Retain as dated evidence | None found | Header declares pointer |
| `docs/FEATURE_STATUS.md` | Feature status | Capability-state assertions | Code/tests/runtime | Feature inventory | `EVIDENCE_REGISTER` | Retain; never outrank verified implementation | `SOT`; `INDEX` | Header and Master Canon truth order |
| `docs/EXTERNAL_DEPENDENCY_MATRIX.md` | External dependency matrix | External rail/connectivity state | Production truth | Dependency gates | `EVIDENCE_REGISTER` | Retain | `AGENTS-6`; `SOT`; `INDEX` | AGENTS explicit read |
| `docs/PRODUCTION_ENVIRONMENT_TRUTH.md` | Production truth | Verified/configured production state | External matrix/runtime evidence | Environment claim classes | `EVIDENCE_REGISTER` | Retain | `AGENTS-6` | AGENTS explicit read |
| `docs/BRANCH_LEDGER.md` | Final branch ledger | Repository/branch recovery evidence | Git history | Branch provenance | `EVIDENCE_REGISTER` | Retain | `AGENTS.md:19`; `SOT`; `INDEX` | Header/AGENTS |
| `docs/RECOVERY_AND_COMPLETION_ROADMAP.md` | Roadmap | Recovery sequencing | Branch ledger/status | Planned recovery work | `IMPLEMENTATION_CONTRACT` | Retain as plan, not product law | `SOT`; `INDEX` | Header/read lists |
| `docs/KLINIKOS_KNOWLEDGE_TO_ARCHITECTURE_LEDGER.md` | Ledger | Cross-domain learning translation | Master Canon and evidence | Observation-to-primitive traceability | `IMPLEMENTATION_CONTRACT` | Retain subordinate; no product-law override | `SOT`; `INDEX` | Legacy documents claim higher role; Master Canon precedence controls |
| `docs/KLINIKOS_ORCHESTRATION_ENGINES.md` | Engine document | Orchestration engine inventory | Master Canon engines | Engine decomposition | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Header scan |
| `docs/SECURITY_ARCHITECTURE.md` | Security architecture | Security implementation guidance | Frontend boundary/Master Canon | Security controls detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-5`; `CLAUDE-R17` | Header/read list |
| `docs/CLINICAL_SAFETY.md` | Safety boundary | Automation safety constraints | Master Canon clinical safety | Allowed/prohibited automation | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R18` | Header/read list |
| `docs/EXPOSED_UI_AUDIT.md` | Audit | Browser exposure review | Frontend boundary | Audit findings | `EVIDENCE_REGISTER` | Retain | `AGENTS-5` by subject | Header scan |
| `docs/SALES-AUDIT-FUNNEL.md` | Funnel document | Sales/audit funnel design | Commercial/public discovery | Funnel steps | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Header scan |
| `docs/MARKETPLACE_DESIGN_RESEARCH.md` | Research | Marketplace design research | Grid Canon | Market design evidence | `EVIDENCE_REGISTER` | Retain | None found | Header scan |
| `docs/COMPETITIVE_INTELLIGENCE_2026-08-20.md` | `current external market evidence` | Dated competitive research | Competitor/simplicity canon | External market findings | `EVIDENCE_REGISTER` | Retain as dated evidence | None found | Header |
| `docs/COMPETITOR_INTELLIGENCE_AND_SIMPLICITY_CANON.md` | `AUTHORITATIVE PRODUCT / GTM GUIDANCE` | Competitor classification and simple-product guidance | Master Canon, commercial/public UX | Outbound guardrails | `SPECIALIST_REFERENCE` | Retain subordinate; remediate authority adjective later | `AGENTS.md` competitive law | Header and AGENTS competitive section |
| `docs/ADVERSARIAL_BUYER_AUDIT_2026-08-18.md` | Dated audit | Buyer/accessibility/engineering critique | Current product evidence | Audit findings | `EVIDENCE_REGISTER` | Retain | None found | Header |
| `docs/DECISIONS_2026-08-16.md` | `CURRENT DECISION RECORD` | Historical decision record | Master Canon stable decisions | Dated decisions/provenance | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; map accepted decisions to Canon | None found | Header |
| `docs/LUXE_ACQUISITION_BRIDGE.md` | Bridge | Legacy acquisition/brand bridge | Master Canon brand | Legacy transition context | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance | None found | Header/path |
| `docs/LUXE_HOSTED_CONVERSION.md` | Conversion | Legacy hosted conversion notes | Product/route docs | Historical conversion detail | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance | None found | Header/path |
| `docs/LUXE_RECOVERY_REVIEW.md` | Recovery review | Legacy recovery evidence | Branch/recovery docs | Review findings | `EVIDENCE_REGISTER` | Retain as historical evidence | None found | Header/path |

## Governance and company-control records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md` | `GOVERNING ACCESS / CONTRACT / TRUST ARCHITECTURE` | Access, contract, identity and IP controls | Master Canon identity/security | Detailed access/trust controls | `SPECIALIST_REFERENCE` | Retain subordinate; remediate governing header later | `CLAUDE-R43` | Header |
| `governance/KLINIKOS_CLINICIAN_CUSTOMER_PATIENT_EXPERIENCE_CANON.md` | `SOURCE-LOCKED EXPERIENCE AUTHORITY` | Professional/customer/patient acceptance requirements | Source-locked register; experience canons | Feedback-derived acceptance detail | `SPECIALIST_REFERENCE` | Retain as traceable specialist reference | `CLAUDE-R36` | Header |
| `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md` | `GOVERNING COMPANY-TRUTH CONTROL SYSTEM` | Company operational registers | Company execution control plane | Register definitions | `IMPLEMENTATION_CONTRACT` | Retain, align with code registry | `CLAUDE-R26` | Header |
| `governance/KLINIKOS_COMPANY_EXECUTION_CONTROL_PLANE.md` | `GOVERNING COMPANY EXECUTION ARCHITECTURE` | Company action/stage/owner machinery | Company OS/Control Registers | Execution-control workflow | `IMPLEMENTATION_CONTRACT` | Retain; header is remediation target | `CLAUDE-R28` | Header |
| `governance/KLINIKOS_COMPANY_STAGE_GATES.md` | `GOVERNING COMPANY MATURITY / CLAIMS / CAPITAL DISCIPLINE` | Company maturity and claim gates | Company control plane | Measurable stage criteria | `IMPLEMENTATION_CONTRACT` | Retain; header is remediation target | `CLAUDE-R29` | Header |
| `governance/KLINIKOS_CROSS_CUTTING_CAPABILITY_FABRIC.md` | `GOVERNING PRODUCT + PUBLIC-DISCOVERY ARCHITECTURE` | Capability taxonomy across surfaces | Master Canon/capability registry | Cross-cutting capability mapping | `SPECIALIST_REFERENCE` | Retain subordinate; migrate permanent taxonomy | `CLAUDE-R38` | Header |
| `governance/KLINIKOS_EXECUTIVE_OPERATING_SNAPSHOT_2026-08-25.md` | `CURRENT-STATE EXECUTIVE HANDOFF` | Dated executive state snapshot | Company registers/status | Snapshot facts | `EVIDENCE_REGISTER` | Retain as date-bound evidence | None found | Header |
| `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md` | `GOVERNING MULTI-DISCIPLINE DECISION REVIEW` | Review workflow | Company execution control | Decision-review checks | `IMPLEMENTATION_CONTRACT` | Retain; header is remediation target | `CLAUDE-R27` | Header |
| `governance/KLINIKOS_OPERATING_NETWORK_IMPLEMENTATION_AUTHORIZATION_2026-08-26.md` | `EXECUTED GOVERNANCE DECISION` | Authorization provenance for a design | Operating-network design and Master Canon | Bounded approved decision | `EVIDENCE_REGISTER` | Retain as executed decision evidence; does not create product law | `CLAUDE-R5`; `INDEX` | Header |
| `governance/KLINIKOS_PRODUCTION_AND_ENTERPRISE_READINESS.md` | `GOVERNING PROFESSIONAL SOFTWARE-STUDIO STANDARD` | Readiness checklist/standard | Production truth/security | Enterprise readiness detail | `SPECIALIST_REFERENCE` | Retain subordinate; claims require evidence | `CLAUDE-R31` | Header |
| `governance/KLINIKOS_PUBLIC_DISCOVERY_SEO_AND_CATEGORY_TAXONOMY.md` | `GOVERNING PUBLIC DISCOVERY ARCHITECTURE` | SEO/discovery taxonomy | Product-control canon/public capability registry | Taxonomy detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R39` | Header |
| `governance/KLINIKOS_PUBLIC_ROUTE_GAP_AUDIT_2026-08-25.md` | `VERIFIED AGAINST CURRENT REPOSITORY ROUTES/SITEMAP` | Dated public-route audit | Route registry/SEO taxonomy | Audit results | `EVIDENCE_REGISTER` | Retain as evidence | None found | Header |
| `governance/KLINIKOS_UNICORN_OPPORTUNITY_REGISTER.md` | `GOVERNING DISCOVERY BACKLOG` | Opportunity backlog/scoring | Company strategy | Opportunity hypotheses | `EVIDENCE_REGISTER` | Retain as backlog evidence; no roadmap authority | `CLAUDE-R32` | Header |
| `governance/KLINIKOS_WEBSITE_PRICING_AND_CONVERSION_BLUEPRINT.md` | `GOVERNING PUBLIC WEBSITE / COMMERCIAL EXPERIENCE` | Website conversion design | Pricing/commercial/public discovery | Conversion experience detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R40` | Header |
| `governance/KLINIKOS_ZUMI_EXPERT_INTELLIGENCE_STANDARD.md` | `GOVERNING INTELLIGENCE QUALITY STANDARD` | Intelligence/research quality standard | Zumi canons | Evidence-quality detail | `SPECIALIST_REFERENCE` | Retain subordinate | `CLAUDE-R42` | Header |
| `governance/product-truth-registry.json` | JSON registry | Machine-readable product-truth records | Feature/capability registries | Audited-record schema | `IMPLEMENTATION_CONTRACT` | Retain; never a peer narrative authority | Referenced by inventory/implementation | JSON schemaVersion/records |
| `docs/governance/KLINIKOS_CANON_MIGRATION_MATRIX.md` | Migration matrix | Destination tracking for canon content | This inventory/provenance ledger | Migration completion evidence | `IMPLEMENTATION_CONTRACT` | Retain and use before retirement | Consolidation task materials | Header/path |
| `docs/governance/KLINIKOS_PROVENANCE_RECONCILIATION_LEDGER.md` | Reconciliation ledger | Provenance and reconciliation history | Migration matrix/inventory | Source-to-destination evidence | `EVIDENCE_REGISTER` | Retain | Consolidation task materials | Header/path |
| `docs/governance/KLINIKOS_DOCUMENT_AUTHORITY_INVENTORY.md` | Consolidation control | This authority audit | Authority map/migration matrix | Per-document classification and inbound evidence | `IMPLEMENTATION_CONTRACT` | Retain; update only through audit | Consolidation Task 2 output | This file |

## Executable canon, registry, and control-plane records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `src/lib/company-operating-canon.ts` | Source “canon” naming | Machine-readable company functions/cadences | Company OS/control documents | Typed company operating data | `IMPLEMENTATION_CONTRACT` | Retain; code does not establish narrative product authority | `CLAUDE-R25` | CLAUDE and source filename |
| `src/lib/company-execution-control-plane.ts` | Control-plane module | Typed stage/register/brief contract | Governance company control plane | Executable company controls | `IMPLEMENTATION_CONTRACT` | Retain | `CLAUDE-R30`; CLAUDE:180 calls it machine-readable authority | Source/CLAUDE |
| `src/lib/feature-registry-canon.ts` | Registry “canon” naming | Product-scope source registry | Source-locked requirements/Master Canon | Feature IDs and implementation status | `IMPLEMENTATION_CONTRACT` | Retain; source material must map to product truth | `CLAUDE-R6`; Source-Locked Requirements | Source and governance reference |
| `src/lib/public-capability-registry.ts` | Capability registry | Public-discovery capability data | SEO/capability fabric | Public capability projection | `IMPLEMENTATION_CONTRACT` | Retain | `CLAUDE-R41` | Source/read list |
| `src/lib/operating-network-canon.ts` | Source “canon” naming | Machine operating-network invariants | Master Canon/operating-network design | Typed invariants | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/experience-envelope-canon.ts` | Source “canon” naming | Experience-envelope selection contract | Experience Envelope document | Typed experience context | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/brand/canonical-messaging.ts` | Canonical messaging | Brand/copy implementation data | Master Canon brand language | Typed messaging constants | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/orchestration/engine-registry.ts` | Engine registry | Engine metadata/route composition | Orchestration Engines/route registry | Typed engine list | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/screen-experience-route-registry.ts` | Route registry | Screen/route execution data | Screen release gate/route registry | Typed route contracts | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/grid/participant-registry.ts` | Participant registry | Grid participant contract | Grid/Portal canons | Typed participant data | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/commercial/variable-cost-rail-registry.ts` | Cost rail registry | Variable-cost policy data | Customer-funded/COGS docs | Typed rail contract | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/legal/document-registry.ts` | Document registry | Legal-document contract | Legal docs | Typed legal-doc inventory | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/repositories/feature-registry-repository.ts` | Registry repository | Registry persistence adapter | Feature registry canon | Repository behavior | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |
| `src/lib/sales/canonical-display.ts` | Canonical display | Sales display projection | Commercial/public docs | Presentation mapping | `IMPLEMENTATION_CONTRACT` | Retain | None found | Source filename |

## Supporting business, legal, design, and evidence records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/business/KLINIKOS_VENTURE_SCALE_OPERATING_PACKAGE_2026-08-24.md` | Dated operating package | Venture-scale proposal/package | Business Plan/company strategy | Package-specific content | `EVIDENCE_REGISTER` | Retain as dated business evidence | `CLAUDE-R20` | Dated filename/read list |
| `docs/business/KLINIKOS_ACTIVE_NON_DILUTIVE_OPPORTUNITIES_2026-08-25.md` | Dated opportunities | Funding opportunity register | Funding evidence | Opportunity facts | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/business/KLINIKOS_DECISION_MAKER_FIRST_OUTREACH_REGISTER_2026-08-25.md` | Register | Outreach evidence | Commercial strategy | Contact/outreach tracking | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/business/KLINIKOS_SBA_FUNDING_CONTROL_PLANE_2026-08-25.md` | Control plane | SBA application workflow | Funding evidence | Submission control detail | `IMPLEMENTATION_CONTRACT` | Retain as bounded funding workflow | None found | Filename |
| `docs/business/corporate/KLINIKOS_BANKING_AND_BORROWING_AUTHORITY_DRAFT_2026-08-25.md` | Draft | Corporate authorization draft | Company governance | Draft terms | `EVIDENCE_REGISTER` | Retain; not executed authority | None found | Filename/status |
| `docs/business/corporate/KLINIKOS_BYLAWS_DRAFT_2026-08-25.md` | Draft | Corporate bylaws draft | Corporate records | Draft legal text | `EVIDENCE_REGISTER` | Retain; counsel/execution required | None found | Filename/status |
| `docs/business/corporate/KLINIKOS_CORPORATE_BOOK_READINESS_2026-08-25.md` | Readiness | Corporate-book checklist | Corporate drafts | Readiness evidence | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/business/corporate/KLINIKOS_CORPORATE_IDENTITY_RECONCILIATION_2026-08-25.md` | Reconciliation | Corporate identity reconciliation | Master Canon brand | Corporate identity evidence | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/business/corporate/KLINIKOS_ORGANIZATIONAL_CONSENTS_DRAFT_2026-08-25.md` | Draft | Organizational-consent draft | Corporate governance | Draft approvals | `EVIDENCE_REGISTER` | Retain; not executed authority | None found | Filename/status |
| `docs/business/corporate/KLINIKOS_STOCK_LEDGER_AND_ISSUANCE_DRAFT_2026-08-25.md` | Draft | Stock issuance draft/ledger | Corporate records | Draft cap-table data | `EVIDENCE_REGISTER` | Retain; not executed authority | None found | Filename/status |
| `docs/legal/PRODUCT_VISION_CANON.md` | Product vision canon | Legal/product vision statement | Master Canon | Legacy vision detail | `HISTORICAL_RETIRED_CANDIDATE` | Preserve; map accepted vision content upward | None found | Canon filename |
| `docs/legal/COMMERCIAL_PACKAGING_AND_PRODUCT_STRATEGY.md` | Strategy | Legal/commercial packaging guidance | Commercial/Pricing canons | Packaging detail | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Filename |
| `docs/legal/LEGAL_ACCESS_FOUNDATION.md` | Foundation | Access/legal foundation | Access/Identity Trust canon | Legal detail | `SPECIALIST_REFERENCE` | Retain subordinate | None found | Filename |
| `docs/legal/LEGAL_DOCUMENT_SUITE.md` | Suite | Legal-document inventory | Legal registry | Document suite mapping | `IMPLEMENTATION_CONTRACT` | Retain | None found | Filename |
| `docs/legal/VENDOR_REGULATORY_GATES.md` | Gates | Vendor/regulatory gating | Production/enterprise readiness | Gate detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-6` by subject | Filename |
| `docs/legal/COUNSEL_REVIEW_REQUIRED.md` | Review gate | Counsel-review tracker | Legal docs | Review flags | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/legal/KLINIKOS_COMPLIANCE_READINESS_REPORT.md` | Readiness report | Compliance evidence | Production readiness | Dated readiness facts | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/legal/LEGAL_ACCESS_VERIFICATION_2026-08-18.md` | Verification | Legal/access verification evidence | Access canon | Dated findings | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/clinical/BODY_MAP_CHANGE_FOUNDATION.md` | Foundation | Body-map clinical change design | Clinical convergence | Body-map detail | `SPECIALIST_REFERENCE` | Retain subordinate | `AGENTS-9` by subject | Filename |
| `docs/design/black-label-v2/README.md` | README | Black Label package entry point | Design canons | Package navigation | `SPECIALIST_REFERENCE` | Retain | None found | Path |
| `docs/design/black-label-v2/IMPLEMENTATION_NOTES.md` | Notes | Design implementation notes | Design handoff | Implementation detail | `IMPLEMENTATION_CONTRACT` | Retain | None found | Path |
| `docs/design/black-label-v2/QUALITY_GATE.md` | Quality gate | Design acceptance gate | Screen release gate | Package gate | `IMPLEMENTATION_CONTRACT` | Retain | None found | Path |
| `docs/design/black-label-v2/CORRECTIONS_2026-08-23.md` | Corrections | Dated correction record | Design evidence | Corrections | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/design/black-label-v2/MERGE_NOTE.md` | Merge note | Historical merge evidence | Design package | Merge facts | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/design/black-label-v2/PR_SUMMARY.md` | PR summary | Historical change summary | Design package | PR facts | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/finance/RD_ENGINEERING_EVIDENCE_CHECKLIST_2026-08-24.md` | Checklist | R&D evidence checklist | Financial/corporate evidence | Claim-support detail | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/ops/PRODUCTION_MIGRATION_RECONCILIATION_2026-08-23.md` | Dated reconciliation | Migration evidence | Production truth | Earlier snapshot | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/ops/PRODUCTION_MIGRATION_RECONCILIATION_2026-08-25.md` | Dated reconciliation | Migration evidence | Production truth | Later snapshot | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/ops/RENDER_MCP_PRODUCTION_OPERATIONS_2026-08-25.md` | Operations | Deployment operations runbook | Production truth | Runbook detail | `IMPLEMENTATION_CONTRACT` | Retain | `AGENTS-6` by subject | Filename |
| `docs/ops/RENDER_RELEASE_RETRY_2026-08-25.md` | Retry record | Release incident/retry evidence | Production operations | Retry history | `EVIDENCE_REGISTER` | Retain | None found | Filename |
| `docs/runtime-evidence/STRIPE_LIVE_ENDPOINT_2026-08-18.md` | Runtime evidence | Stripe endpoint verification evidence | Production/payment truth | Endpoint-specific proof | `EVIDENCE_REGISTER` | Retain | None found | Path |

## Plans, specifications, and bounded proposal records

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/superpowers/specs/2026-08-29-klinikos-universal-healthcare-universe-company-constitution-design.md` | `APPROVED ARCHITECTURAL DESIGN — IMPLEMENTATION / CONSOLIDATION PENDING` | Design source for current consolidation | Master Canon/Authority Map | Universe/company design inputs | `SPECIALIST_REFERENCE` | Retain as consolidation design provenance | Consolidation plan | Header |
| `docs/superpowers/plans/2026-08-29-klinikos-universal-canon-consolidation.md` | Implementation plan | Current consolidation task plan | This inventory/migration matrix | Ordered task execution | `IMPLEMENTATION_CONTRACT` | Retain until plan closes | Current task | Header |
| `docs/superpowers/specs/2026-08-29-luxe-to-master-canon-reconciliation-design.md` | `APPROVED DESIGN — ... PENDING IMPLEMENTATION` | Narrower prior reconciliation design | Universal consolidation design | Luxe-specific input | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance; universal plan supersedes scope | Prior reconciliation plan | Header |
| `docs/superpowers/plans/2026-08-29-klinikos-luxe-canon-full-stack-reconciliation.md` | Implementation plan | Narrower full-stack reconciliation plan | Universal consolidation plan | Prior task sequencing | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance | Prior reconciliation work | Header |
| `docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md` | `APPROVED ARCHITECTURAL DESIGN` | Operating-network parent architecture | Master Canon operating-network law | Design dependencies/invariants | `SPECIALIST_REFERENCE` | Retain as design provenance; no independent authority | `CLAUDE-R4`; `INDEX` | Header |
| `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md` | `PROPOSED ARCHITECTURAL DESIGN` | Universal experience design | Master Canon/experience envelope | Proposed experience model | `SPECIALIST_REFERENCE` | Retain as proposal/provenance | `INDEX` | Header |
| `docs/superpowers/specs/2026-08-26-klinikos-final-form-path-execution-map.md` | `PROPOSED ARCHITECTURAL COMPANION SPEC` | Path execution design | Route registry/universal experience spec | Path model | `IMPLEMENTATION_CONTRACT` | Retain as proposed contract | None found | Header |
| `docs/superpowers/specs/2026-08-27-klinikos-legal-defense-stack-design.md` | Approved design; counsel review required | Legal-defense design | Legal/access docs | Layered legal controls | `SPECIALIST_REFERENCE` | Retain; no production reliance absent counsel evidence | None found | Header |
| `docs/superpowers/specs/2026-08-24-unicorn-living-home-design.md` | Design | Dashboard experience design | Design/experience canons | Living Home slice | `SPECIALIST_REFERENCE` | Retain as provenance | None found | Header |
| `docs/superpowers/specs/2026-08-23-edu-delivery-evidence-chain-design.md` | Design | Institutional EDU delivery design | EDU Canon | Evidence-chain detail | `SPECIALIST_REFERENCE` | Retain | None found | Header |
| `docs/superpowers/specs/2026-08-23-kentucky-ai-workforce-edu-design.md` | Design | Kentucky configuration design | EDU Canon/proposal evidence | Reusable institutional constraints | `SPECIALIST_REFERENCE` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-27-klinikos-zero-context-master-build-handoff.md` | Master build handoff | Prior implementation handoff | Master Canon | Historical operating context | `HISTORICAL_RETIRED_CANDIDATE` | Preserve as provenance | None found | Header |
| `docs/superpowers/plans/2026-08-26-operating-network-tranche-a-truth-and-distribution.md` | Implementation plan | Operating-network tranche plan | Operating-network design | Tranche scope | `IMPLEMENTATION_CONTRACT` | Retain as historical plan | None found | Header |
| `docs/superpowers/plans/2026-08-25-klinikos-company-operating-system.md` | Implementation plan | Company OS implementation plan | Company OS/code registry | Historical implementation sequence | `IMPLEMENTATION_CONTRACT` | Retain as plan provenance | None found | Header |
| `docs/superpowers/plans/2026-08-25-company-execution-control-plane.md` | Implementation plan | Control-plane implementation plan | Company control-plane/code | Historical task plan | `IMPLEMENTATION_CONTRACT` | Retain as plan provenance | None found | Header |
| `docs/superpowers/plans/2026-08-24-unicorn-living-home.md` | Implementation plan | Living Home plan | Design/route docs | Historical implementation sequence | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-23-edu-delivery-evidence-chain.md` | Implementation plan | EDU evidence-chain plan | EDU design | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-23-kentucky-ai-workforce-edu.md` | Implementation plan | Kentucky EDU plan | EDU design/proposal | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-23-body-map-persistence-v1.md` | Implementation plan | Body-map plan | Clinical/body-map reference | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-23-black-label-theme-shell-v1.md` | Implementation plan | Theme shell plan | Design handoff | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-22-current-visit-convergence-v1.md` | Implementation plan | Current Visit plan | Clinical convergence | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-22-customer-experience-platform-convergence.md` | Implementation plan | Customer experience plan | Experience docs | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |
| `docs/superpowers/plans/2026-08-22-vitals-truth-handoff-v1.md` | Implementation plan | Vitals/handoff plan | Clinical convergence | Historical plan | `IMPLEMENTATION_CONTRACT` | Retain | None found | Header |

## Dated funding and workforce material individually classified as evidence

The following scanned files contain applications, proposal artifacts, candidate/provider material, or dated outreach/evidence. They may supply facts to a future decision but do not institute product/company authority; each is `EVIDENCE_REGISTER`, disposition **retain as bounded evidence**, inbound **None found**, evidence **dated path/header**.

| Path | Declared status | Actual purpose | Overlap | Unique content | Proposed class | Disposition | Inbound references / current read instruction | Evidence |
|---|---|---|---|---|---|---|---|---|
| `docs/funding/GRANTS_INCENTIVES_LIVE_CONTROL_REGISTER_2026-08-25.md` | Dated register | Grants control facts | Funding records | Opportunity statuses | `EVIDENCE_REGISTER` | Retain | None found | Dated header |
| `docs/funding/JLABS_STARTUP_HEALTH_EXECUTION_UPDATE_2026-08-27.md` | Dated update | JLABS execution evidence | Funding records | Program-specific facts | `EVIDENCE_REGISTER` | Retain | None found | Dated header |
| `docs/funding/NCI_ODS_IMPACT_PRIZE_TRACK1_DECISION_PACKAGE_2026-08-25.md` | Decision package | NCI package evidence | Funding records | Submission detail | `EVIDENCE_REGISTER` | Retain | None found | Dated header |
| `docs/business/funding/AWS_ACTIVATE_FOUNDERS_APPLICATION_EXECUTION_2026-08-27.md` | Application | Application evidence | Funding records | Provider-specific material | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_2027_ELIGIBILITY_OVERRIDE_2026-08-26.md` | Eligibility record | Eligibility evidence | Funding records | Program exception | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_2027_EXACT_FORM_EXECUTION_PACKET_2026-08-25.md` | Execution packet | Form evidence | Funding records | Exact form payload | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_2027_FINAL_EXECUTION_DELTA_2026-08-26.md` | Final delta | Submission delta evidence | Funding records | Program delta | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_2027_LIVE_TERMS_CONFLICT_2026-08-26.md` | Terms conflict | Terms evidence | Funding records | Conflict record | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_AUSTRALIA_COMMERCIALISATION_PATHWAY_2026-08-26.md` | Pathway | Program research | Funding records | Australia pathway | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/BBFH_MEDICAL_ALLEY_APPLICATION_WORKING_PACKAGE_2026-08-25.md` | Working package | Application evidence | Funding records | Medical Alley content | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/CANCERX_2027_APPLICATION_EXECUTION_2026-08-26.md` | Application | Application evidence | Funding records | CancerX content | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/CANCERX_2027_FIT_CALL_BRIEF_2026-08-25.md` | Call brief | Fit evidence | Funding records | Fit analysis | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/KIVA_US_0_PERCENT_LOAN_APPLICATION_EXECUTION_2026-08-27.md` | Application | Loan application evidence | Funding records | Kiva details | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/KLINIKOS_CANONICAL_APPLICATION_PROFILE_2026-08-25.md` | Application profile | Reusable application source material | Funding records | Profile answers | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/KLINIKOS_CAPITAL_OUTREACH_EXECUTION_2026-08-26.md` | Outreach | Capital outreach evidence | Funding records | Outreach state | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/KLINIKOS_EXTERNAL_APPLICATION_DISCLOSURE_REGISTER_2026-08-27.md` | Disclosure register | External disclosure facts | Funding/legal records | Disclosure trace | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/LAWRENCE_MA_PRE_SUBMISSION_QUALIFICATION_GATE_2026-08-26.md` | Qualification gate | Submission eligibility evidence | Funding records | Gate result | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/LAWRENCE_MA_YOUTH_AI_WORKFORCE_RFP_EXECUTION_2026-08-26.md` | RFP execution | Proposal evidence | Funding/workforce records | RFP response | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/MEDICAL_ALLEY_DIRECT_FORM_DISCOVERY_2026-08-28.md` | Discovery | Form discovery evidence | Funding records | Form facts | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/MEDICAL_ALLEY_DISCLOSURE_TERMS_REVIEW_2026-08-27.md` | Terms review | Disclosure evidence | Funding/legal records | Terms review | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/MEDICAL_ALLEY_INNOVATION_SHOWCASE_APPLICATION_PACKAGE_2026-08-25.md` | Application package | Application evidence | Funding records | Showcase materials | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/MEDICAL_ALLEY_PRESENTER_FORM_EXECUTION_2026-08-26.md` | Form execution | Submission evidence | Funding records | Form payload | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/MEDICAL_ALLEY_PUBLIC_SAFE_SUBMISSION_PAYLOAD_2026-08-27.md` | Submission payload | Public-safe submission evidence | Funding/security records | Redacted payload | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/NSF_SBIR_PROJECT_PITCH_SUBMISSION_READY_2026-08-26.md` | Submission ready | Pitch evidence | Funding records | Pitch state | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/NSF_SBIR_PROJECT_PITCH_WORKING_PACKAGE_2026-08-25.md` | Working package | Pitch source material | Funding records | Pitch draft | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/TECHSTARS_AI_HEALTH_BALTIMORE_APPLICATION_WORKING_PACKAGE_2026-08-25.md` | Working package | Application evidence | Funding records | Techstars draft | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/business/funding/TECHSTARS_NORTHWESTERN_HEALTHCARE_APPLICATION_DELTA_2026-08-25.md` | Application delta | Application evidence | Funding records | Delta | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/MASTER_PROPOSAL_AND_DEMO_PROMPT.md` | Master proposal/prompt | Kentucky proposal source material | EDU design | Proposal/prompt detail | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/MASTER_PROPOSAL_PRODUCT_PROMPT.md` | Master proposal/prompt | Product proposal source material | EDU design | Proposal/prompt detail | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/IMPLEMENTATION_AND_CONTINGENCY_PLAN.md` | Plan | Proposal delivery evidence | EDU proposal | Contingency detail | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/MEASUREMENT_AND_REPORTING_PLAN.md` | Plan | Proposal measurement evidence | EDU proposal | Measurement detail | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/PRICING_MODEL.md` | Pricing model | Proposal pricing evidence | EDU/commercial | Proposal price detail | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/RFP_COMPLIANCE_MATRIX.md` | Compliance matrix | RFP evidence | EDU proposal | Requirement trace | `EVIDENCE_REGISTER` | Retain | None found | Header/path |
| `docs/ZUMI_CLOUDFLARE.md` | Integration notes | Cloudflare/Zumi integration guidance | Zumi/security architecture | Provider-specific setup detail | `IMPLEMENTATION_CONTRACT` | Retain; never proof of live integration | `AGENTS-6`, `AGENTS-8` by subject | Header/path |
| `docs/legal/INTERNAL_COST_PLANNING.md` | Internal planning | Cost assumptions and planning | COGS/financial evidence | Internal estimates | `EVIDENCE_REGISTER` | Retain as non-production evidence | None found | Header/path |
| `docs/edu/kentucky-ai-workforce/ACCESSIBILITY_AND_ACCOMMODATION_DELIVERY_GATE.md` | Delivery gate | Accessibility proposal evidence | EDU proposal | Accommodation gate | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/APPENDIX_B_PRICING_RESPONSIVENESS_GATE.md` | Pricing gate | Proposal pricing evidence | EDU proposal | Price responsiveness | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/APPENDIX_B_WORKING_PRICE_SCHEDULE_2026-08-26.md` | Working schedule | Proposal pricing evidence | EDU proposal | Price schedule | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/APPENDIX_C_REFERENCE_REBUILD_STRATEGY_2026-08-25.md` | Rebuild strategy | Proposal support evidence | EDU proposal | Reference strategy | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/COHORT_SIZE_AND_DELIVERY_CAPACITY.md` | Capacity plan | Proposal capacity evidence | EDU proposal | Cohort assumptions | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/COMPLETION_YIELD_AND_ATTRITION_ECONOMICS_GATE.md` | Economics gate | Proposal economics evidence | EDU proposal | Attrition/yield assumptions | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/EMPLOYER_FEEDBACK_AND_CURRICULUM_IMPROVEMENT_PLAN.md` | Improvement plan | Proposal feedback evidence | EDU proposal | Curriculum plan | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/EXPERIENCED_PARTNER_CANDIDATE_REGISTER_2026-08-25.md` | Candidate register | Partnership evidence | EDU proposal | Candidate list | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/FINAL_PRE_DEADLINE_QUESTION_CONTROL_2026-08-26.md` | Question control | Submission evidence | EDU proposal | Question log | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/GERARD_REFERENCE_EVIDENCE_FOLLOWUP_2026-08-27.md` | Evidence follow-up | Proposal evidence | EDU proposal | Reference follow-up | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/IP_SCHEDULE.md` | IP schedule | Proposal/legal source material | EDU/legal docs | IP schedule | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/KENTUCKY_PRIME_CAPACITY_REGISTER_2026-08-25.md` | Capacity register | Proposal capacity evidence | EDU proposal | Prime-capacity data | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/OCCUPATIONAL_PATHWAY_OUTLINES.md` | Pathway outlines | Proposal curriculum evidence | EDU proposal | Pathway detail | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/ORGANIZATIONAL_EXPERIENCE_AND_CAPACITY_NARRATIVE_2026-08-27.md` | Capacity narrative | Proposal evidence | EDU proposal | Narrative | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/PERSONNEL_OUTREACH_EXECUTION_LOG_2026-08-25.md` | Execution log | Outreach evidence | EDU proposal | Outreach log | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/PLATFORM_ACCESS_DISCLOSURE_GATE.md` | Disclosure gate | Proposal access evidence | EDU/legal docs | Disclosure gate | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/PRICING_RECOMMENDATION_2026-08-23.md` | Recommendation | Proposal pricing evidence | EDU proposal | Pricing recommendation | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/PRIME_QUALIFICATION_DECISION_GATE.md` | Qualification gate | Proposal evidence | EDU proposal | Qualification decision | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/PROPOSAL_STAFFING_CORRECTION_2026-08-26.md` | Correction | Proposal staffing evidence | EDU proposal | Staffing correction | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/Q21_TEAMING_FALLBACK_REGISTER_2026-08-25.md` | Fallback register | Proposal teaming evidence | EDU proposal | Fallback detail | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/QUALIFICATION_AND_PERSONNEL_EVIDENCE_REGISTER_2026-08-25.md` | Evidence register | Qualification evidence | EDU proposal | Personnel source facts | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/QUALIFICATION_EVIDENCE_PACKAGE.md` | Evidence package | Qualification evidence | EDU proposal | Package contents | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/README_QUALIFICATION_UPDATE_2026-08-25.md` | Update readme | Qualification update evidence | EDU proposal | Update summary | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/REPRESENTATIVE_MATERIALS.md` | Materials | Proposal evidence | EDU proposal | Representative material | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/SCWDB_POSTED_QA_CAPTURE_DELTA_2026-08-22.md` | QA capture | RFP evidence | EDU proposal | Q&A delta | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/SCWDB_QA_CAPTURE_2026-08-24_Q19_Q24.md` | QA capture | RFP evidence | EDU proposal | Q&A record | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/SCWDB_QA_CAPTURE_2026-08-25_Q25_Q42.md` | QA capture | RFP evidence | EDU proposal | Q&A record | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/SCWDB_QA_CAPTURE_2026-08-27_Q65_Q68.md` | QA capture | RFP evidence | EDU proposal | Q&A record | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/SCWDB_QA_EXECUTION_LOCK_2026-08-26.md` | Execution lock | Submission evidence | EDU proposal | Lock record | `EVIDENCE_REGISTER` | Retain | None found | Dated path |
| `docs/edu/kentucky-ai-workforce/SCWDB_RECORD_RETENTION_AND_AUDIT_GATE.md` | Audit gate | Proposal evidence | EDU proposal | Retention gate | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/SKEPTICAL_EVALUATOR_SCORECARD.md` | Scorecard | Proposal-review evidence | EDU proposal | Evaluation criteria | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/STATEWIDE_DELIVERY_AND_RAPID_RESPONSE_GATE.md` | Delivery gate | Proposal evidence | EDU proposal | Delivery gate | `EVIDENCE_REGISTER` | Retain | None found | Path |
| `docs/edu/kentucky-ai-workforce/TEAM_AND_CREDIBILITY_NARRATIVE.md` | Narrative | Proposal evidence | EDU proposal | Team narrative | `EVIDENCE_REGISTER` | Retain | None found | Path |

## Deterministic completeness and discrepancies

The audit scan found **230** Markdown/YAML/JSON/text candidates containing an authority/status marker across the required roots. The rows above individually cover every root/top-level product document, every `governance/` document, all `docs/governance/` documents, every specialist/design/legal/business/plan/specification document, every relevant `src/lib/*canon*`, `*registry*`, `*authority*`, and `*control-plane*` file, plus all funding/workforce candidates flagged by the scan.

Material discrepancies found by the original scan, with 2026-08-30 remediation state:

1. **REPAIRED IN THE PR #367 CANDIDATE:** agent bootstrap files, `SOURCE_OF_TRUTH.md`, and `KLINIKOS_ARCHITECTURE_INDEX.md` now route through Master Canon → Authority Map → existing Master Engineering Blueprint → verified implementation/runtime evidence.
2. **PARTIAL / CONTROLLED:** the six highest-risk predecessor files listed below now declare historical/subordinate status. Other retained specialist/historical files may still contain governing-looking words, but the Authority Map limits them and later retirement requires destination/inbound-reference proof.
3. **PENDING SAFE-RETIREMENT REVIEW:** `KLINIKOS_CONSTITUTION.md` and other predecessor references remain preserved until their unique accepted content and inbound links are reconciled.
4. **PRESERVATION CONFIRMED:** no predecessor was deleted. Header/read-path remediation changed authority, not historical content ownership.

### 2026-08-30 remediated predecessor set

- `docs/CLINICOS_MASTER_CANON.md` → `HISTORICAL_SUBORDINATE_REFERENCE`;
- `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` → `HISTORICAL_SUBORDINATE_REFERENCE`;
- `docs/SOURCE_OF_TRUTH.md` → `HISTORICAL_SUBORDINATE_REFERENCE` and current-chain pointer;
- `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md` → `HISTORICAL_SUBORDINATE_REFERENCE`;
- `governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md` → `HISTORICAL_SUBORDINATE_REFERENCE`;
- `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` → `HISTORICAL_SUBORDINATE_REFERENCE`;
- `docs/KLINIKOS_ARCHITECTURE_INDEX.md` → `SUBORDINATE_NAVIGATION_INDEX`.

The existing Master Engineering Blueprint absorbed the rev3 architecture-to-code corrections in place. This is an implementation-contract update, not a new source of truth or a sixth plane.

All later consolidation work must migrate accepted unique content before cleanup, then enforce the one-authority chain mechanically through references and tests.

## Task-2 self-review

- [x] One structured nine-field row per potentially authoritative document, including every specifically required file.
- [x] Root, docs, governance, and relevant executable canon/registry/control-plane sources scanned.
- [x] `MASTER`, `CANON`, `GOVERNING`, `FINAL`, `BLUEPRINT`, `OPERATING SYSTEM`, `SOURCE OF TRUTH`, `CONSTITUTION`, `STRATEGY`, and `PLAN` naming/status signals recorded or classified.
- [x] Inbound/bootstrap read instructions and legacy conflicts recorded without treating them as valid precedence.
- [x] Every row uses an allowed proposed class and a non-destructive disposition.
