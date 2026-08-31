# Klinikos Document Authority Inventory

Date: 2026-08-29
Status: CONSOLIDATION CONTROL — SUBORDINATE TO `docs/KLINIKOS_MASTER_CANON.md`
Branch baseline: `docs/luxe-master-canon-reconciliation-20260829@193bc0ca95f0f0acc9f22e6e350fc5f53dfac7af`

## Purpose

This inventory exists to remove ambiguity without deleting accepted Klinikos knowledge.

After the universal consolidation program, exactly one narrative document may hold supreme company/product authority:

`docs/KLINIKOS_MASTER_CANON.md`

Every other non-code artifact must be classified as one of:

- `IMPLEMENTATION_CONTRACT`
- `EVIDENCE_REGISTER`
- `SPECIALIST_REFERENCE`
- `HISTORICAL_RETIRED`

A file name containing `CANON`, `MASTER`, `FINAL`, `GOVERNING`, `BLUEPRINT`, `SOURCE OF TRUTH`, or `OPERATING SYSTEM` does not grant authority. Authority comes only from the Master Canon and Authority Map.

## Classification rules

| Class | Meaning | May redefine Master Canon? |
|---|---|---:|
| `MASTER_CANON` | Sole governing company/product architecture and business truth | N/A — this is the authority |
| `IMPLEMENTATION_CONTRACT` | Machine/execution contract implementing Canon decisions | No |
| `EVIDENCE_REGISTER` | Current-state facts, metrics, opportunities, verification, operating evidence | No |
| `SPECIALIST_REFERENCE` | Detailed domain guidance expanding a Canon decision | No |
| `HISTORICAL_RETIRED_CANDIDATE` | Prior governing/final/master artifact whose unique accepted content must be migrated before retirement | No |
| `HISTORICAL_RETIRED` | Superseded provenance after migration verification | No |

## A. Supreme authority

| Path | Existing signal | Classification | Required action |
|---|---|---|---|
| `docs/KLINIKOS_MASTER_CANON.md` | `ACTIVE - SOLE PRODUCT / ARCHITECTURE / BUSINESS / EXPERIENCE AUTHORITY` | `MASTER_CANON` | Expand to sole company + product operating constitution; never create peer authority |
| `docs/KLINIKOS_AUTHORITY_MAP.yaml` | Machine-readable authority map | `IMPLEMENTATION_CONTRACT` | Update alongside Canon; explicitly classify all subordinate families |

## B. Explicit duplicate / predecessor authority candidates

| Path | Existing signal / overlap | Classification | Required migration action |
|---|---|---|---|
| `docs/CLINICOS_MASTER_CANON.md` | Older misspelled-name master canon coexists beside authoritative `KLINIKOS_MASTER_CANON.md` | `HISTORICAL_RETIRED_CANDIDATE` | Diff for unique accepted decisions; merge forward; retire/remove stale authority references |
| `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` | Previous master product/engineering specification referenced by older agent bootstrap | `HISTORICAL_RETIRED_CANDIDATE` | Extract unique requirements into Master Canon or specialist contracts |
| `docs/SOURCE_OF_TRUTH.md` | Older source-of-truth naming | `HISTORICAL_RETIRED_CANDIDATE` | Migrate any still-valid truth-routing rules into Authority Map/Master Canon; remove competing name |
| `docs/KLINIKOS_ARCHITECTURE_INDEX.md` | Prior architecture routing/index | `HISTORICAL_RETIRED_CANDIDATE` or `IMPLEMENTATION_CONTRACT` after rewrite | Convert to subordinate index only if still useful; otherwise retire |
| `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md` | Declares `TOP-LEVEL FINAL-FORM TARGET ARCHITECTURE` | `HISTORICAL_RETIRED_CANDIDATE` | Merge unique ecosystem/application/cross-engine content into Master Canon + typed graph |
| `governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md` | Declares `GOVERNING FINAL-FORM ECOSYSTEM BOUNDARY` | `HISTORICAL_RETIRED_CANDIDATE` | Merge full universe actors/resources/sectors/expansion logic into Master Canon |
| `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` | Declares `GOVERNING COMPANY-BUILDING ARCHITECTURE` | `HISTORICAL_RETIRED_CANDIDATE` | Merge functions/cadence/value loops/revenue architecture into company constitution section |
| `governance/KLINIKOS_FINAL_FORM_BUSINESS_PLAN.md` | Final-form business-plan framing | `HISTORICAL_RETIRED_CANDIDATE` | Extract unique business model/market/commercial/capital decisions; then retire as governing artifact |
| `governance/KLINIKOS_HYPERSCALE_PLATFORM_STRATEGY.md` | Broad platform-scale strategic authority language | `HISTORICAL_RETIRED_CANDIDATE` | Merge accepted scale/economic-flow/partner/build-buy laws into Canon; retain only provenance if redundant |
| `governance/KLINIKOS_AI_OPERATED_DIGITAL_BUSINESS.md` | Company automation/AI operating architecture overlaps company constitution | `HISTORICAL_RETIRED_CANDIDATE` / future `SPECIALIST_REFERENCE` | Merge permanent laws upward; retain detailed AI-business runbook only if it adds implementation detail |
| `docs/COMPETITOR_INTELLIGENCE_AND_SIMPLICITY_CANON.md` | Uses `CANON` for competitive/product simplicity | `HISTORICAL_RETIRED_CANDIDATE` / future `SPECIALIST_REFERENCE` | Merge permanent competitive/simplicity laws upward; rename/reclassify if specialist detail remains |
| `docs/CINEMATIC_PRODUCT_REALIZATION_MAX_SCOPE.md` | Max-scope product/design direction | `HISTORICAL_RETIRED_CANDIDATE` / future `SPECIALIST_REFERENCE` | Reconcile unique visual/experience laws into Black Label section; retire any independent product authority |

## C. Agent / execution control files

These may control *how* work is executed but may not redefine what Klinikos is.

| Path | Classification | Required action |
|---|---|---|
| `AGENTS.md` | `IMPLEMENTATION_CONTRACT` | Point to Master Canon first; keep universal execution instructions subordinate |
| `CLAUDE.md` | `IMPLEMENTATION_CONTRACT` | Replace legacy 40+ document authority reading order with Master-Canon-first classified reading order |
| `CODEX.md` | `IMPLEMENTATION_CONTRACT` | Master-Canon-first bootstrap; preserve tool/runtime execution guidance |
| `SYMPHONY.md` | `IMPLEMENTATION_CONTRACT` | Preserve commercial/funding execution lane; no product authority |
| `docs/KLINIKOS_MULTI_AGENT_EXECUTION_CONTROL.md` | `IMPLEMENTATION_CONTRACT` | Preserve execution ownership/conflict controls; explicitly subordinate |
| `governance/KLINIKOS_OPERATING_NETWORK_IMPLEMENTATION_AUTHORIZATION_2026-08-26.md` | `IMPLEMENTATION_CONTRACT` / later historical execution approval | Preserve authorization provenance; cannot supersede current Canon |
| `governance/KLINIKOS_COMPANY_EXECUTION_CONTROL_PLANE.md` | `IMPLEMENTATION_CONTRACT` | Keep stage/owner/action machinery after migrating permanent company laws upward |
| `governance/KLINIKOS_COMPANY_STAGE_GATES.md` | `IMPLEMENTATION_CONTRACT` | Keep measurable stage gates; Canon owns stage philosophy |
| `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md` | `IMPLEMENTATION_CONTRACT` | Preserve decision-review mechanism; Canon owns governing business laws |
| `src/lib/company-operating-canon.ts` | `IMPLEMENTATION_CONTRACT` | Rename conceptually in docs as machine-readable operating contract; keep code path unless refactor justified |
| `src/lib/company-execution-control-plane.ts` | `IMPLEMENTATION_CONTRACT` | Machine implementation of company stages/registries, subordinate to Canon |
| `governance/product-truth-registry.json` | `IMPLEMENTATION_CONTRACT` | Reconcile identifiers to Master Canon; never treat registry as parallel narrative authority |
| `src/lib/feature-registry-canon.ts` | `IMPLEMENTATION_CONTRACT` | Preserve feature machine contract; rename only if change cost justified; Canon remains authority |
| `src/lib/public-capability-registry.ts` | `IMPLEMENTATION_CONTRACT` | Preserve public-discovery capability contract |
| `src/lib/paths/catalog.ts` | `IMPLEMENTATION_CONTRACT` | Expand into tested lifecycle route implementation beneath Canon |

## D. Product/domain specialist references

These remain useful only as deep domain detail. Their governing headers must eventually say they are subordinate.

| Path | Classification | Canon relationship |
|---|---|---|
| `docs/CLINIC_OS_CANON.md` | `SPECIALIST_REFERENCE` | Clinic operations detail beneath Master Canon |
| `docs/GRID_CANON.md` | `SPECIALIST_REFERENCE` | Grid detail; Master Canon owns Grid role and universal exchange law |
| `docs/EDU_CANON.md` | `SPECIALIST_REFERENCE` | EDU detail; Master Canon owns learner/workforce architecture |
| `docs/ZUMI_CANON.md` | `SPECIALIST_REFERENCE` | Zumi detail; deterministic authority/OpenAI direction owned by Master Canon |
| `docs/FINANCIAL_OS_CANON.md` | `SPECIALIST_REFERENCE` | Financial/RCM detail beneath Master Canon money truth |
| `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` | `SPECIALIST_REFERENCE` | Current Visit/clinical detail beneath Master Canon |
| `docs/KLINIKOS_COMMERCIAL_CANON.md` | `SPECIALIST_REFERENCE` | Commercial execution detail; current approved offer/pricing truth must reconcile upward |
| `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` | `SPECIALIST_REFERENCE` | Pricing/economics detail; cannot silently override Master Canon |
| `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` | `SPECIALIST_REFERENCE` | Browser/server/DTO and trade-secret detail |
| `docs/FRONTEND_EXPERIENCE_CANON.md` | `SPECIALIST_REFERENCE` | UX implementation/detail beneath plain-language and Black Label laws |
| `docs/SECURITY_ARCHITECTURE.md` | `SPECIALIST_REFERENCE` | Security architecture implementation detail |
| `docs/CLINICAL_SAFETY.md` | `SPECIALIST_REFERENCE` | Clinical safety rules/controls |
| `governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md` | `SPECIALIST_REFERENCE` | Legal/access/identity/IP execution detail; Master Canon owns protected-entry/trust laws |
| `governance/KLINIKOS_CLINICIAN_CUSTOMER_PATIENT_EXPERIENCE_CANON.md` | `SPECIALIST_REFERENCE` | Deep role/customer/patient experience reference |
| `governance/KLINIKOS_CROSS_CUTTING_CAPABILITY_FABRIC.md` | `SPECIALIST_REFERENCE` / `IMPLEMENTATION_CONTRACT` | Reconcile cross-cutting capabilities into canonical graph; keep detailed fabric if useful |
| `governance/KLINIKOS_ZUMI_EXPERT_INTELLIGENCE_STANDARD.md` | `SPECIALIST_REFERENCE` | Evidence/research/AI quality standard |
| `governance/KLINIKOS_PUBLIC_DISCOVERY_SEO_AND_CATEGORY_TAXONOMY.md` | `SPECIALIST_REFERENCE` | Public discovery/SEO/category implementation detail |
| `governance/KLINIKOS_WEBSITE_PRICING_AND_CONVERSION_BLUEPRINT.md` | `SPECIALIST_REFERENCE` | Website conversion implementation; not company pricing authority |
| `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md` | `SPECIALIST_REFERENCE` / historical design evidence | Preserve current accepted design details that Master Canon references |
| `docs/CUSTOMER_FUNDED_ACCESS_MODEL.md` | `SPECIALIST_REFERENCE` | External usage/customer-funded economics detail, subject to current pricing authority |

## E. Current-state and operating evidence

These tell us what is true/observed, not what Klinikos must become.

| Path / family | Classification | Notes |
|---|---|---|
| `docs/KLINIKOS_CURRENT_PROJECT_STATE.md` | `EVIDENCE_REGISTER` | Refresh before current implementation claims |
| `docs/FEATURE_STATUS.md` | `EVIDENCE_REGISTER` | Feature-state evidence only |
| `docs/EXTERNAL_DEPENDENCY_MATRIX.md` | `EVIDENCE_REGISTER` | External integration/dependency status |
| `docs/PRODUCTION_ENVIRONMENT_TRUTH.md` | `EVIDENCE_REGISTER` | Production/runtime truth |
| `docs/ROUTE_REGISTRY_STATUS.md` | `EVIDENCE_REGISTER` | Route implementation status |
| `docs/BRANCH_LEDGER.md` | `EVIDENCE_REGISTER` | Branch/PR state |
| `governance/KLINIKOS_EXECUTIVE_OPERATING_SNAPSHOT_2026-08-25.md` | `EVIDENCE_REGISTER` / historical snapshot | Date-bound operating evidence; never current without refresh |
| `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md` | `EVIDENCE_REGISTER` | Company evidence/control registers |
| `governance/KLINIKOS_PRODUCTION_AND_ENTERPRISE_READINESS.md` | `EVIDENCE_REGISTER` + specialist checklist | Current readiness claims require evidence refresh |
| `governance/KLINIKOS_UNICORN_OPPORTUNITY_REGISTER.md` | `EVIDENCE_REGISTER` | Opportunity hypotheses/priorities, not automatic roadmap authority |
| `docs/COMPETITIVE_INTELLIGENCE_2026-08-20.md` | `EVIDENCE_REGISTER` | Date-bound market/competitive research |
| `docs/ADVERSARIAL_BUYER_AUDIT_2026-08-18.md` | `EVIDENCE_REGISTER` | Buyer/adversarial review evidence |
| `docs/funding/**` | `EVIDENCE_REGISTER` family | Applications, grant opportunities, execution status, capital evidence |
| `docs/business/funding/**` | `EVIDENCE_REGISTER` family | Funding/application/outreach evidence; never equal capital won |
| `docs/edu/kentucky-ai-workforce/**` | `EVIDENCE_REGISTER` + specialist proposal family | RFP/proposal/personnel evidence; contract status must remain truthful |

## F. Route / journey documents

| Path | Classification | Required action |
|---|---|---|
| `docs/ROUTE_REGISTRY.md` | `IMPLEMENTATION_CONTRACT` | Becomes the human-readable detailed lifecycle implementation contract referenced by Master Canon |
| `docs/MVP_JOURNEYS.md` | `EVIDENCE_REGISTER` / historical implementation snapshot | Reconcile accepted journey detail into Route Registry; retire as authority |
| `docs/BUILD_STATUS_2026_FOUNDING_CLINIC_PLAN.md` | `EVIDENCE_REGISTER` / historical implementation plan | Preserve first-clinic evidence; no final architecture authority |
| `docs/APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md` | `SPECIALIST_REFERENCE` / historical design evidence | Preserve accepted discovery/UX decisions only where still current |

## G. Specs and implementation plans

All files under these families are subordinate by definition:

| Family | Classification | Rule |
|---|---|---|
| `docs/superpowers/specs/**` | `SPECIALIST_REFERENCE` / approved design provenance | Specs elaborate approved changes; accepted permanent decisions must merge upward into Master Canon |
| `docs/superpowers/plans/**` | `IMPLEMENTATION_CONTRACT` / execution plan | Plans direct implementation but cannot override Master Canon |
| `docs/superpowers/specs/2026-08-29-klinikos-universal-healthcare-universe-company-constitution-design.md` | `SPECIALIST_REFERENCE` / approved design | Governs this consolidation implementation only until accepted content is absorbed into Master Canon |
| `docs/superpowers/plans/2026-08-29-klinikos-universal-canon-consolidation.md` | `IMPLEMENTATION_CONTRACT` | Active execution plan for consolidation |
| `docs/superpowers/specs/2026-08-29-luxe-to-master-canon-reconciliation-design.md` | `HISTORICAL_RETIRED_CANDIDATE` after migration | Narrower approved design preserved as detail provenance; superseded in scope by universal design |
| `docs/superpowers/plans/2026-08-29-klinikos-luxe-canon-full-stack-reconciliation.md` | `HISTORICAL_RETIRED_CANDIDATE` after migration | Narrower plan superseded by universal consolidation plan |
| `docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md` | `SPECIALIST_REFERENCE` | Important prior architecture; merge unique laws upward and retain as provenance/reference |
| `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md` | `SPECIALIST_REFERENCE` | Important experience/Grid/profile architecture source; cannot override Master Canon |
| `docs/superpowers/plans/2026-08-27-klinikos-zero-context-master-build-handoff.md` | `HISTORICAL_RETIRED_CANDIDATE` | Execution handoff, not current authority |

## H. Required cleanup invariants

1. `docs/KLINIKOS_MASTER_CANON.md` is the only document allowed to declare supreme/final governing company+product authority.
2. `docs/CLINICOS_MASTER_CANON.md` cannot survive as a second active master.
3. `docs/SOURCE_OF_TRUTH.md` cannot survive with language implying parallel product authority.
4. `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md`, `governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md`, and `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` cannot retain independent governing status after their unique content is migrated.
5. Specialist files may remain detailed but must state Master Canon precedence.
6. Evidence snapshots never override verified current code/runtime.
7. Execution plans/specs never become hidden product authority.
8. All agent bootstrap files must start from the Master Canon/Authority Map rather than legacy multi-document authority chains.
9. Any newly created narrative document must declare one of the allowed subordinate classes unless it is an amendment to the Master Canon itself.
10. A duplicate cannot be deleted until the migration matrix proves its unique accepted content has a destination.

## I. Directory-family defaults

These defaults reduce future ambiguity, but an explicit contradictory header must still be repaired:

- `docs/funding/**`, `docs/business/funding/**` → `EVIDENCE_REGISTER`
- dated audits/snapshots/status reports → `EVIDENCE_REGISTER`
- `docs/superpowers/specs/**` → `SPECIALIST_REFERENCE` / design provenance
- `docs/superpowers/plans/**` → `IMPLEMENTATION_CONTRACT`
- executable TypeScript registries/control planes → `IMPLEMENTATION_CONTRACT`
- clinical/security/legal detailed docs → `SPECIALIST_REFERENCE`
- old prompts/final/master/handoff snapshots superseded by Master Canon → `HISTORICAL_RETIRED`

## J. Task-2 conclusion

The repository already contained a correct conceptual precedence rule in the newer Authority Map, but file naming and legacy headers still expose multiple apparent authorities. The most dangerous collision is the coexistence of `docs/KLINIKOS_MASTER_CANON.md` and `docs/CLINICOS_MASTER_CANON.md`, compounded by several `FINAL`, `GOVERNING`, `MASTER`, and `SOURCE_OF_TRUTH` artifacts.

The next consolidation tasks must therefore migrate content before cleanup, then enforce one authority mechanically through references and tests.
