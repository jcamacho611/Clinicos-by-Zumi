# Klinikos Canon Migration Matrix

Date: 2026-08-29
Status: `IMPLEMENTATION_CONTRACT` — CONSOLIDATION MIGRATION CONTROL
Supreme destination: `docs/KLINIKOS_MASTER_CANON.md`

## Rule

No duplicate/predecessor authority is safe to retire merely because the Master Canon is newer.

A source becomes safe to retire only after:

1. its unique accepted decisions are extracted;
2. each accepted decision has a specific Master Canon destination or tested subordinate contract;
3. inbound references are updated;
4. current implementation/evidence dependencies are preserved;
5. a content-loss review passes.

`SAFE TO RETIRE = YES` therefore means **migration verified**, not “looks redundant.”

## Migration matrix

| Source path | Old authority/status signal | Unique content to preserve | Master Canon destination | Subordinate files retained | References to update | Final class target | Safe to retire now? | Verification required |
|---|---|---|---|---|---|---|---:|---|
| `docs/CLINICOS_MASTER_CANON.md` | Older `MASTER_CANON` naming; direct collision with KLINIKOS Canon | Any still-valid product laws, old scope, historical decisions not yet merged | Authority/Merge-Forward; relevant domain sections | None unless specific implementation detail proves useful | Agent docs, old specs, tests/search references | `HISTORICAL_RETIRED` or delete after archive evidence | NO | Full diff vs `docs/KLINIKOS_MASTER_CANON.md`; zero unique accepted decisions left behind |
| `docs/KLINIKOS_MASTER_PRODUCT_AND_ENGINEERING_SPECIFICATION.md` | Previous master product/engineering spec | Product requirements, domain boundaries, acceptance constraints, integration/security laws | Healthcare Universe; Operating Infrastructure; Engineering laws | Specialist technical references if uniquely detailed | `CLAUDE.md`, architecture index, specs | `HISTORICAL_RETIRED` | NO | Requirement-by-requirement coverage check |
| `docs/SOURCE_OF_TRUTH.md` | Explicit source-of-truth name | Truth hierarchy, implementation-vs-intended truth, conflict-resolution rules | Authority/Truth/Merge-Forward | `docs/KLINIKOS_AUTHORITY_MAP.yaml` | `AGENTS.md`, `CLAUDE.md`, specialist docs | `HISTORICAL_RETIRED` or rewritten redirect note | NO | Authority-map parity and inbound-reference search |
| `docs/KLINIKOS_ARCHITECTURE_INDEX.md` | Architecture precedence/index | Useful document routing, domain ownership, read order | Authority Map / Master Canon references section | Authority Map and specialist index if useful | All agent bootstraps | `IMPLEMENTATION_CONTRACT` if retained as index; otherwise retired | NO | Rebuild read order around Master Canon first |
| `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md` | `TOP-LEVEL FINAL-FORM TARGET ARCHITECTURE` | Final company definition, domains, Zumi orchestration, Care/Patient/Financial/Ops/Grid/EDU/Enterprise topology | Company Definition; Five Planes; Operating Infrastructure; cross-engine architecture | Typed ecosystem graph; specialist domain refs | `CLAUDE.md`, final-form specs/plans | `HISTORICAL_RETIRED` | NO | Map every domain/mandatory companion decision into new Canon/graph |
| `governance/KLINIKOS_ECOSYSTEM_UNIVERSE_AND_EXPANSION_MAP.md` | `GOVERNING FINAL-FORM ECOSYSTEM BOUNDARY` | Universal actors/things/lifecycle; care, patient, professional, org, financial, payer/employer/risk, future expansion grammar | Healthcare Universe Plane; Economic/Resource Plane; Lifecycle Plane; expansion strategy | Typed ecosystem/resource registries | Final blueprint, hyperscale docs, agent instructions | `HISTORICAL_RETIRED` | NO | Sector/resource coverage test including NOW/NEXT/LATER/PARTNER/CONNECT/INTERNALIZE/NEVER_BUILD |
| `governance/KLINIKOS_COMPANY_OPERATING_SYSTEM.md` | `GOVERNING COMPANY-BUILDING ARCHITECTURE` | Company value loop, functions, operating principles, cadences, revenue architecture, finance/legal/partnership/Grid/EDU/enterprise responsibilities | Unicorn Company Constitution; Operating Loop; Executive Council; dashboard/cadence | `src/lib/company-operating-canon.ts`; evidence/control registers | `CLAUDE.md`, executive docs | `HISTORICAL_RETIRED` | NO | Section-by-section company-constitution coverage |
| `governance/KLINIKOS_COMPANY_EXECUTION_CONTROL_PLANE.md` | Execution-control governing language | Company registers, stage/action ownership, Zumi company authority levels, execution sequencing | Company Constitution principles only | File retained as `IMPLEMENTATION_CONTRACT`; `src/lib/company-execution-control-plane.ts` | Agent bootstraps and company runbooks | `IMPLEMENTATION_CONTRACT` | NO header repair pending | Verify no product/company strategy redefinition remains |
| `governance/KLINIKOS_COMPANY_STAGE_GATES.md` | Company stage authority | Evidence requirements for Truth Foundation→Cash Proof→Repeatable Value→Network Proof→Enterprise Proof→Platform Scale | Company maturity/scale section | File retained as `IMPLEMENTATION_CONTRACT` | Company execution docs | `IMPLEMENTATION_CONTRACT` | NO header repair pending | Stage IDs/tests align with Canon; evidence cannot be scenario-only |
| `governance/KLINIKOS_COMPANY_CONTROL_REGISTERS.md` | Control register | Evidence structures for pipeline, cash, partners, risks, execution | Canon references evidence system | Retain file/registers | Company OS links | `EVIDENCE_REGISTER` | N/A — retain | Ensure current claims require date/source/evidence |
| `governance/KLINIKOS_EXECUTIVE_REVIEW_GAUNTLET.md` | Executive review authority | Decision review dimensions for material strategy/capital/pricing/enterprise/irreversible architecture | Initiative Validation/Priority/Capital laws | Retain as `IMPLEMENTATION_CONTRACT` | Company OS, agent guidance | `IMPLEMENTATION_CONTRACT` | NO header repair pending | Canon decision classes reflected; no independent strategy authority |
| `governance/KLINIKOS_FINAL_FORM_BUSINESS_PLAN.md` | Final-form business plan | Market thesis, customer/value model, revenue, GTM, costs, milestones, risk, enterprise-value strategy | Company Definition; Market/ICP; Business Model; Distribution; Capital; Financial Model | Evidence registers and current financial model | Pitch/funding docs and final blueprint | `HISTORICAL_RETIRED` | NO | Unique business decisions reconciled with current approved commercial truth |
| `governance/KLINIKOS_HYPERSCALE_PLATFORM_STRATEGY.md` | Hyperscale strategy | Economic-flow/platform thesis, build-buy-partner/internalize logic, scale/market/network hypotheses | Scale/Unicorn Test; Defensibility; Partner/External Rails; Network effects | Opportunity register / scenario models | Company OS, final blueprint | `HISTORICAL_RETIRED` or `SPECIALIST_REFERENCE` if unique analytical detail remains | NO | Separate scenario hypotheses from instituted product/company law |
| `governance/KLINIKOS_AI_OPERATED_DIGITAL_BUSINESS.md` | AI-operated company architecture | Zumi company operations, automation/delegation, human approval, evidence/update loops | Automation Law; Executive Council; Zumi/OpenAI company role | Detailed runbook may remain `SPECIALIST_REFERENCE` | Company OS, Zumi docs | `SPECIALIST_REFERENCE` after migration or retired if fully redundant | NO | Preserve consequential-action boundaries and avoid duplicate autonomy taxonomy |
| `governance/KLINIKOS_CROSS_CUTTING_CAPABILITY_FABRIC.md` | Cross-cutting architecture | Capabilities spanning apps/domains; integration/discovery/authority/monetization/analytics connections | Operating Infrastructure; canonical ecosystem graph | Retain detailed cross-cutting map if it implements graph | Final blueprint and public registry refs | `SPECIALIST_REFERENCE` / `IMPLEMENTATION_CONTRACT` | NO | Every capability mapped to graph node/edge and Canon owner |
| `governance/KLINIKOS_CLINICIAN_CUSTOMER_PATIENT_EXPERIENCE_CANON.md` | Specialist `CANON` | Role/customer/patient experience detail and simplification patterns | Plain-Language/Experience Engine/Patient-Care sections | Retain deep UX detail | Frontend docs | `SPECIALIST_REFERENCE` | NO header repair pending | State Master Canon precedence; no separate persona authority |
| `governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md` | Specialist `CANON` | Protected entry, agreements, IP/confidentiality, identity/trust execution detail | Protected Entry; Identity/Trust; Security/IP sections | Retain execution/legal detail subject to counsel | Agent/security/frontend docs | `SPECIALIST_REFERENCE` | NO header repair pending | Canon captures permanent law; reference captures implementation/legal detail |
| `governance/KLINIKOS_ZUMI_EXPERT_INTELLIGENCE_STANDARD.md` | Expert intelligence standard | Research/evidence quality, provenance, uncertainty, expert-level synthesis | Zumi/OpenAI; Evidence/Knowledge sections | Retain | Zumi implementation | `SPECIALIST_REFERENCE` | N/A — retain after header check | No domain authority granted to model |
| `governance/KLINIKOS_PUBLIC_DISCOVERY_SEO_AND_CATEGORY_TAXONOMY.md` | Discovery/category plan | Public discovery, SEO/category architecture | Distribution/Public Discovery sections | Retain detailed taxonomy | Website/public capability registry | `SPECIALIST_REFERENCE` | N/A — retain after header check | Public claims remain truthful and non-confidential |
| `governance/KLINIKOS_WEBSITE_PRICING_AND_CONVERSION_BLUEPRINT.md` | Pricing/conversion blueprint | Website offer presentation, conversion objections, CTA flows | Pricing/Commercial philosophy; Distribution | Retain site implementation guidance | Pricing registry/public website | `SPECIALIST_REFERENCE` | NO until current price parity checked | Website cannot become pricing authority |
| `governance/KLINIKOS_PRODUCTION_AND_ENTERPRISE_READINESS.md` | Readiness authority/snapshot | Security/procurement/enterprise readiness gates and evidence | Enterprise/Security principles | Retain current readiness register/checklist | Enterprise/procurement docs | `EVIDENCE_REGISTER` + `SPECIALIST_REFERENCE` | N/A — retain | Every readiness claim source/date verified |
| `governance/KLINIKOS_UNICORN_OPPORTUNITY_REGISTER.md` | Opportunity register | Opportunity hypotheses, strategic scores, future markets | Canon references opportunity-discovery process only | Retain as live `EVIDENCE_REGISTER` | Company execution docs | `EVIDENCE_REGISTER` | N/A — retain | Opportunity != roadmap/actual revenue |
| `governance/KLINIKOS_SOURCE_LOCKED_REQUIREMENTS.md` | Requirement lock | Founder/customer/clinician requirements and non-silent-deletion rule | Anti-Compression/Requirement Traceability | Retain as provenance/evidence register if useful | Agent docs/specs | `EVIDENCE_REGISTER` / `SPECIALIST_REFERENCE` | N/A — retain after header check | Direct requirements trace to Canon/route/tests |
| `docs/COMPETITOR_INTELLIGENCE_AND_SIMPLICITY_CANON.md` | Specialist `CANON` | Competitive learning, simplicity, UX principles | Market/Competitive Intelligence; Plain-Language law | Dated competitor evidence kept separately | Marketing/product strategy refs | `SPECIALIST_REFERENCE` after rename/header or retired if redundant | NO | Separate evergreen law from dated competitor facts |
| `docs/CINEMATIC_PRODUCT_REALIZATION_MAX_SCOPE.md` | Max-scope experience blueprint | Cinematic/Black Label product realization and interaction direction | Black Label Design / Experience Engine | Design handoff/reference | Frontend specs | `SPECIALIST_REFERENCE` | NO | Preserve accepted aesthetic laws without forcing decorative motifs |
| `docs/KLINIKOS_BLACK_LABEL_V2_DESIGN_HANDOFF_2026-08-23.md` | Design handoff | Obsidian/Marble/Black Label detailed design acceptance | Black Label section | Retain design reference | Frontend docs | `SPECIALIST_REFERENCE` | N/A — retain | Current accepted design vs historical visuals distinguished |
| `docs/FRONTEND_EXPERIENCE_CANON.md` | Specialist `CANON` | Frontend layout/interaction/experience laws | Plain Language / Experience / Design | Retain | Frontend components/specs | `SPECIALIST_REFERENCE` | NO header repair pending | Master Canon wins conflicts |
| `docs/FRONTEND_TRADE_SECRET_AND_SERVER_BOUNDARY_CANON.md` | Specialist `CANON` | Browser/server/DTO/crown-jewel boundaries | Security/IP section | Retain | API/frontend/security tests | `SPECIALIST_REFERENCE` | NO header repair pending | Server authority and minimum necessary preserved |
| `docs/CLINIC_OS_CANON.md` | Specialist domain canon | Clinic operations workflows | Clinic OS sections | Retain | Clinic implementation | `SPECIALIST_REFERENCE` | NO header repair pending | No independent product definition |
| `docs/GRID_CANON.md` | Specialist domain canon | Grid resource/match/transaction detail | Grid/Economic Plane | Retain | Grid services/route registry | `SPECIALIST_REFERENCE` | NO header repair pending | Universal Grid role defined only in Master Canon |
| `docs/EDU_CANON.md` | Specialist domain canon | EDU programs/simulation/evidence/workforce | EDU/Lifecycle Plane | Retain | EDU models/routes | `SPECIALIST_REFERENCE` | NO header repair pending | Course/evidence never equals professional authority |
| `docs/ZUMI_CANON.md` | Specialist domain canon | Zumi behavior/orchestration | Zumi/OpenAI | Retain | Zumi provider/policy code | `SPECIALIST_REFERENCE` | NO header repair pending | Deterministic authority preserved |
| `docs/FINANCIAL_OS_CANON.md` | Specialist domain canon | Financial/RCM state detail | Financial OS/RCM | Retain | Financial models/tests | `SPECIALIST_REFERENCE` | NO header repair pending | State distinctions align with Master Canon |
| `docs/KLINIKOS_CLINICAL_CONVERGENCE_CANON.md` | Specialist clinical canon | Current Visit, change graph, orders/results, specialty composition | Patient/Care/Current Visit | Retain | Clinical services/tests | `SPECIALIST_REFERENCE` | NO header repair pending | No second encounter authority |
| `docs/KLINIKOS_COMMERCIAL_CANON.md` | Specialist commercial canon | Offer lifecycle and commercial rules | Business Model/Sales | Retain current commercial detail | Product catalog/pricing code | `SPECIALIST_REFERENCE` | NO | Verify against current active pricing before reclassification |
| `docs/KLINIKOS_PRICING_AND_MONETIZATION_CANON.md` | Specialist pricing canon | Plan/add-on/EDU/Grid economics | Pricing Engine | Retain current pricing detail | `src/lib/commercial/**` | `SPECIALIST_REFERENCE` | NO | Canon governs philosophy; executable registry governs active exact prices under Canon delegation |
| `docs/CUSTOMER_FUNDED_ACCESS_MODEL.md` | Access/cost model | Customer-funded external usage and pass-through economics | Pricing/COGS/Entitlements | Retain if current | Usage/entitlement implementation | `SPECIALIST_REFERENCE` | NO | Verify no outdated price/processor assumptions |
| `docs/superpowers/specs/2026-08-26-klinikos-operating-network-kernel-design.md` | Approved prior architecture | Founder-omission law, free distribution, kernel boundaries, cross-cutting professional requirements | Anti-Compression; Operating Infrastructure; Company/Product laws | Retain as design provenance | New universal spec supersedes scope, not unique laws | `SPECIALIST_REFERENCE` / later historical design provenance | NO | Unique accepted rules copied to Master Canon |
| `docs/superpowers/specs/2026-08-26-klinikos-final-form-universal-experience-design.md` | Approved prior architecture | Identity/experience/Grid/EDU/profile/network interaction detail | Lifecycle/Experience/Grid/Profile | Retain as design provenance | Route/ecosystem registry | `SPECIALIST_REFERENCE` | NO | Ensure exact accepted routes survive |
| `docs/superpowers/specs/2026-08-29-luxe-to-master-canon-reconciliation-design.md` | Approved narrower reconciliation | Student/resume/injector/med-spa/quality detail and anti-compression/plain-language laws | Universal Canon sections | Retain during migration | Universal design supersedes scope | `HISTORICAL_RETIRED` after complete migration | NO | Compare its acceptance criteria against new Canon |
| `docs/superpowers/plans/2026-08-29-klinikos-luxe-canon-full-stack-reconciliation.md` | Narrower implementation plan | Detailed engineering tasks potentially useful to universal plan | N/A — execution detail | Universal plan absorbs applicable tasks | Agent work queue | `HISTORICAL_RETIRED` after task parity verification | NO | Task-by-task parity review |
| `docs/superpowers/specs/2026-08-29-klinikos-universal-healthcare-universe-company-constitution-design.md` | Approved current design | Full five-plane + company constitution target | Entire Master Canon | Retain as implementation design until migration complete | Universal plan | `SPECIALIST_REFERENCE` then historical design provenance | N/A — active design | Master Canon completion criteria match spec |
| `docs/superpowers/plans/2026-08-29-klinikos-universal-canon-consolidation.md` | Active implementation plan | 26-tranche consolidation sequence | N/A | Retain until completion | Agent execution | `IMPLEMENTATION_CONTRACT` | N/A — active | Completion checklist/PR review |

## Additional families

| Family | Migration rule | Final class |
|---|---|---|
| `docs/funding/**` | Preserve actual applications/replies/status; never merge opportunity amounts into Canon as traction | `EVIDENCE_REGISTER` |
| `docs/business/funding/**` | Preserve lender/investor/grant execution evidence; company capital strategy goes in Canon | `EVIDENCE_REGISTER` |
| `docs/edu/kentucky-ai-workforce/**` | Preserve RFP, personnel, submission, curriculum evidence; only general EDU/workforce laws migrate upward | `EVIDENCE_REGISTER` / `SPECIALIST_REFERENCE` |
| dated competitive/security/buyer audits | Preserve findings with dates; evergreen laws migrate upward | `EVIDENCE_REGISTER` |
| old status snapshots / branch summaries | Preserve only as provenance; never current truth without refresh | `HISTORICAL_RETIRED` / `EVIDENCE_REGISTER` depending active need |

## Inbound-reference priorities

The following files/systems are high priority for reference cleanup after migration:

1. `CLAUDE.md` — currently exposes a long legacy required-reading chain.
2. `AGENTS.md`, `CODEX.md`, `SYMPHONY.md`.
3. `docs/KLINIKOS_ARCHITECTURE_INDEX.md`.
4. `docs/SOURCE_OF_TRUTH.md`.
5. `governance/KLINIKOS_FINAL_ECOSYSTEM_MASTER_BLUEPRINT.md` companion-list references.
6. Tests such as canonical-truth drift checks.
7. `governance/product-truth-registry.json` and machine contracts referencing old authorities.
8. Any current plans/specs that instruct agents to treat predecessor documents as parallel governing sources.

## Current retirement decision

At this stage **no major predecessor authority is marked safe to retire**. That is intentional.

Tasks 5–22 must first absorb the accepted company/product/route/security/economic decisions into the Master Canon and tested subordinate contracts. Task 23 then performs small-batch retirement with content-loss and inbound-reference verification.
