# Klinikos Legal Defense Stack Design

Status: APPROVED PRODUCT/ENGINEERING DESIGN — COUNSEL REVIEW REQUIRED BEFORE PRODUCTION RELIANCE
Date: 2026-08-27

## 1. Objective

Klinikos shall maintain a layered legal-defense architecture designed to make obligations, prohibited conduct, evidence, consequences, remedies, survival, and enforcement pathways explicit while avoiding provisions that are so overbroad or punitive that they undermine enforceability.

The governing principle is:

> **Every prohibited act must map to a defined contractual consequence, evidence path, survival rule, and remedy.**

The legal-defense system must operate together with technical controls. Contract language alone is not the security perimeter.

## 2. Architecture

Klinikos will use a layered defense stack instead of one undifferentiated agreement.

### Layer A — Public Website Terms

Covers public use of klinikos.io and public materials, including:

- Klinikos intellectual-property ownership;
- permitted-use license;
- anti-scraping and anti-bot restrictions;
- unauthorized automation and data extraction;
- reverse engineering and circumvention to the extent enforceable;
- security abuse;
- impersonation and credential abuse;
- misuse of branding, screenshots, media, or public product materials;
- unauthorized AI/model ingestion or training using protected Klinikos materials;
- warranty and public-demo disclaimers;
- suspension/termination rights;
- evidence preservation;
- indemnity, liability, and dispute provisions subject to counsel review.

### Layer B — Confidential Access & Intellectual Property Agreement

Affirmative clickwrap is mandatory before access to protected demos, investor or partner materials, proprietary documentation, non-public pricing/margins, technical architecture, implementation details, unreleased features, Grid mechanics, Zumi orchestration, data rooms, source/system information, or other confidential/proprietary material.

This agreement shall prohibit direct and indirect:

- unauthorized disclosure;
- copying, reproduction, mirroring, archiving, or derivative development;
- competitive use of Confidential Information;
- reverse engineering, decompiling, disassembling, probing, endpoint enumeration, or architecture extraction except where a non-waivable law expressly permits it;
- scraping, crawling, bulk extraction, systematic recording, or systematic benchmarking;
- prompt extraction, model extraction, hidden-instruction extraction, workflow extraction, or unauthorized training/ingestion into AI or machine-learning systems;
- security-control circumvention;
- authentication or authorization bypass;
- access-token, credential, invitation, or account sharing;
- unauthorized screenshots, video, audio, exports, downloads, datasets, or reproductions of protected materials;
- use of protected information to build, advise, finance, validate, market, procure, accelerate, or otherwise benefit a competing or substitutive product or service;
- unauthorized filing or pursuit of intellectual-property rights derived from protected information;
- circumvention of protected non-public introductions and opportunities;
- concealment, destruction, falsification, or spoliation of evidence relating to suspected breach;
- assistance, direction, inducement, financing, facilitation, enablement, conspiracy, or knowing benefit from another person's prohibited conduct.

## 3. Protected Information

The definition of Confidential Information must be broad enough to protect the actual Klinikos asset while preserving standard exclusions.

Protected categories include, when non-public or disclosed under circumstances reasonably indicating confidentiality:

- source code, object code, schema, migrations, APIs, infrastructure, deployment patterns, security architecture, internal tooling;
- Zumi prompts, orchestration, routing, policies, memory architecture, agent logic, model-selection logic, hidden instructions, evaluation methods, safety controls, and system behavior;
- Grid eligibility, ranking, matching, transaction, anti-abuse, verification, trust, pricing, and orchestration logic;
- algorithms, scoring systems, heuristics, internal metrics, data models, event models, graphs, taxonomies, ontologies, workflows, and business rules;
- designs, prototypes, screenshots, interaction systems, unreleased UI, research, specifications, roadmaps, product strategy, launch strategy, and implementation plans;
- pricing, discounts, margins, costs, financial models, forecasts, budgets, fundraising materials, investor materials, customer economics, and internal commercial terms;
- customer, prospect, partner, provider, investor, institution, vendor, and referral information not publicly available;
- non-public contracts, negotiations, opportunities, introductions, and business relationships;
- proprietary healthcare operating methods, specialty workflows, implementation methods, integration maps, configuration systems, training systems, and commercialization methods;
- trade secrets and other information qualifying for protection under applicable law.

Standard exclusions must include information proven by contemporaneous evidence to have been:

- lawfully known without confidentiality duty before disclosure;
- independently developed without use of Confidential Information;
- lawfully received from a third party without confidentiality restriction;
- public through no breach;
- required to be disclosed by valid legal process, subject to the compelled-disclosure procedure where legally permitted.

## 4. Breach Classification

### Class I — Material Breach

Examples include credential sharing, unauthorized recording/export, prohibited automation, use-restriction violations, and failure to return or destroy protected material after lawful demand.

### Class II — Serious Confidentiality / IP Breach

Examples include disclosure of non-public architecture, competitive use of confidential information, systematic extraction, unauthorized AI ingestion/training, circumvention of protected introductions, unauthorized derivative exploitation, and facilitating another party's prohibited use.

### Class III — Severe Protected-Asset Breach

Reserved for intentional or reckless conduct involving core protected assets or the security perimeter, including:

- theft, misappropriation, or commercial exploitation of trade secrets;
- unauthorized source-code or repository acquisition;
- deliberate authentication/authorization circumvention;
- extraction of internal prompts, models, orchestration, ranking, matching, security, or other high-value confidential systems for commercial exploitation;
- mass extraction or exfiltration;
- deliberate credential or access-token compromise;
- malicious concealment, destruction, or falsification of evidence;
- organized, financed, directed, or facilitated breach by multiple actors;
- deliberate use of protected information to create or accelerate a competing/substitutive product;
- conduct causing a material security incident or material compromise of protected systems or data.

## 5. Remedies Architecture

The contract must make the following categories explicit, cumulative to the extent legally allowed, and subject to no-double-recovery rules:

- immediate suspension or termination of access;
- revocation of credentials, sessions, tokens, invitations, and protected-resource grants;
- return, deletion, destruction, or certification of destruction of protected materials;
- preservation of relevant evidence;
- temporary, preliminary, and permanent injunctive relief where available;
- specific performance where available;
- actual direct damages proven by evidence;
- unjust enrichment and disgorgement where legally available;
- reasonable forensic, investigation, containment, restoration, credential-rotation, remediation, notification, and incident-response costs caused by breach where legally recoverable;
- reasonable attorneys' fees, expert fees, court costs, and enforcement expenses where contract and applicable law allow;
- statutory, copyright, trademark, patent, computer-misuse, and trade-secret remedies where applicable;
- termination of licenses or evaluation rights;
- suspension or permanent removal from protected Klinikos programs, Grid, demos, partner programs, data rooms, or confidential-access programs;
- referral to appropriate authorities when legally required or appropriate.

The contract must prohibit duplicate recovery for the same injury.

## 6. Liquidated Damages

Klinikos shall not use arbitrary fines or punishment clauses. Any liquidated-damages provision must be tied to specifically defined breach categories where actual loss is difficult to estimate at contracting time, supported by a contemporaneous rationale showing a reasonable estimate of anticipated harm, expressly non-penal, and subject to no-double-recovery rules.

No implementation shall hardcode a $25,000, $50,000, $75,000, or other preset liability amount as production-approved merely because a number appears in strategy discussion. Exact triggers and amounts remain counsel-review dependent.

## 7. Anti-Circumvention

Anti-circumvention must protect non-public relationships and opportunities actually introduced or materially developed through Klinikos without attempting to prohibit ordinary lawful competition. It must include carve-outs for documented pre-existing relationships, independently sourced opportunities proven without use of protected information, and public-market relationships not introduced through Klinikos.

## 8. Survival

- Ordinary contractual confidentiality: defined survival period established in the final agreement.
- Trade secrets: protected for so long as they legally retain trade-secret status.
- Accrued payment/enforcement obligations: survive as applicable.
- IP ownership, misuse restrictions, dispute provisions, evidence-preservation duties, and remedies survive to the extent their nature requires and applicable law permits.

## 9. Attempt / Facilitation Rule

A prohibited act includes directly or indirectly attempting, requesting, directing, inducing, financing, facilitating, assisting, enabling, conspiring in, or knowingly benefiting from conduct that would constitute a prohibited act if performed directly by the user, subject to applicable intent standards.

## 10. Mandatory Legal Carve-Outs

The documents must preserve legally required or strategically necessary exceptions, including valid compelled disclosure, lawful reporting to agencies/regulators, applicable whistleblower protections, applicable trade-secret whistleblower immunity notices, non-waivable statutory rights, independent development, lawful prior knowledge, and authorized security research under an explicit written safe-harbor program if Klinikos later creates one.

## 11. Clickwrap and Evidence

Protected access must follow this sequence:

1. user requests a protected resource;
2. server determines required legal documents/current versions;
3. access remains denied until affirmative acceptance;
4. agreement text is presented or readily accessible;
5. checkbox is unchecked by default;
6. user performs an unambiguous `I AGREE AND CONTINUE` action;
7. server records acceptance evidence;
8. server verifies acceptance applies to the current required version/content hash;
9. access grant is created;
10. protected resource becomes available.

Required acceptance evidence, subject to privacy law and minimization, includes acceptance event ID, document key/version/effective date/content hash, authenticated user ID where applicable, organization/context, signatory authority where applicable, protected destination/resource, timestamp, acceptance action, request/session correlation evidence, IP/user-agent evidence where appropriate, and superseded-version/revocation state.

Evidence records must not silently mutate when terms change. New material terms require a new version and, when appropriate, reacceptance.

## 12. Technical Enforcement

Legal defense must be backed by server-side proprietary logic, authentication/authorization, least privilege, protected-resource middleware, rate limiting/abuse controls, secure download handling, audit logging, acceptance-evidence storage, source-map/client-bundle leakage controls, secret management, incident evidence preservation, access revocation, and immutable/versioned legal-document records.

## 13. Repository Integration

Implementation must extend the current architecture rather than create a parallel system. Primary existing artifacts are:

- `governance/KLINIKOS_ACCESS_IDENTITY_AGREEMENTS_IP_TRUST_CANON.md`
- `docs/legal/LEGAL_DOCUMENT_SUITE.md`
- `src/lib/legal/document-registry.ts`
- `/legal/*` legal routes
- current `/access` flow

Implementation must strengthen `website_terms` and `access_terms`, add severe-breach/remedies architecture, add version/content-hash/evidence requirements, add or extend reusable protected-resource agreement gating, preserve `counselReviewRequired: true`, and preserve `productionApproved: false` until licensed counsel approval is actually recorded.

## 14. Testing Requirements

Tests must prove protected content cannot be accessed without current required acceptance; unchecked/default state cannot create acceptance; old-version acceptance cannot satisfy a new materially required version; acceptance binds to content hash/version; access can be revoked; unauthenticated users cannot spoof acceptance evidence; clients cannot set `productionApproved` or `counselReviewRequired`; definitions remain server authoritative; and proprietary implementation details are not exposed in client bundles beyond necessary agreement presentation text.

## 15. Counsel Review Gate

Before production reliance, licensed counsel should review governing law/venue, arbitration/class waiver if used, limitation of liability, indemnity, fee shifting, liquidated damages, anti-circumvention duration/scope, restrictive-covenant implications, consumer/business-user distinctions, clickwrap presentation and assent evidence, applicable computer-access statutes, trade-secret definitions/immunity notice, privacy requirements, and international-user implications if enabled.

## 16. Final Rule

> **Klinikos legal protection must be clear enough that a legitimate user understands the boundary, specific enough that a court can understand the breach, evidenced enough that Klinikos can prove assent and misconduct, and technically enforced enough that the contract is not the only thing standing between the company and the loss of its protected assets.**
