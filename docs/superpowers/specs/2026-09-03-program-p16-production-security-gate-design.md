# P16 — Security / Privacy / Legal / IP / Production PHI Gate — Design

**Date:** 2026-09-03  
**Status:** FOUNDER-DIRECTED W0/W1 SUBORDINATE DESIGN — review gate before implementation  
**Base audited:** `main@e8f79a5e2419cc24b54f08aba9c44522c9a94784`  
**Authority:** subordinate to the Master Canon, Master Engineering Blueprint, merged Master Execution Engine, P00 truth governance, and current verified implementation truth.  
**Program:** `P16` / `W0`, continuous through every release wave  
**Dependencies:** `P00`  
**Runs in parallel with:** P01, P02, and every later user/data-facing program

## 1. Security decision

P16 makes security a **release authority boundary**, not a documentation exercise.

Permanent law:

> **Real PHI is not enabled, and Klinikos does not claim production PHI readiness, merely because screens, schemas, encryption settings, or an AI provider exist. Production PHI readiness requires independently verified technical, operational, vendor, contractual, recovery, and legal evidence appropriate to the exact deployed environment.**

P16 is designed to protect enterprise value, customer trust, IP, and future healthcare distribution while avoiding performative compliance spend before it is needed.

## 2. What already exists

The current repository already contains meaningful security substrate that must be reused rather than replaced:

- authentication/session and server-owned authorization patterns;
- tenant/context boundaries in domain logic;
- audit foundations;
- deterministic Zumi admission/policy/redaction/audit/cost controls;
- fail-closed PHI egress concepts and provider adapter requirements;
- existing browser confidentiality gate;
- server environment taint gate;
- API disclosure gate;
- exact-head Quality workflow;
- fresh-database migration verification;
- production build/start contract;
- browser interaction and release-evidence capture;
- Master Canon / Zumi Canon rules separating AI intelligence from authority;
- versioned legal acceptance rail;
- external dependency/evidence documentation;
- P00 traceability and release governance.

Current repository search did **not** establish an implemented passkey/MFA/WebAuthn rail. P16 therefore treats stronger authentication as a current-state item requiring explicit verification rather than assuming it exists.

P00 also recorded two relevant current truths:

- `main` branch policy is not currently enforced by GitHub branch protection/rulesets and remains `MANUAL_ADMIN_ACTION_REQUIRED`;
- dependency installation reported three pre-existing high-severity advisories; they were deliberately not force-upgraded without compatibility evidence.

These are P16 risk inputs, not grounds for fake “secure” or “insecure” absolutes.

## 3. Selected architecture: evidence-backed fail-closed gate

P16 introduces one security evidence model that answers two different questions without conflating them:

1. **What security controls are actually implemented and verified?**
2. **Is this exact environment authorized for the specific data/use case being claimed?**

The system must never infer the second merely from the first.

Target conceptual flow:

`CONTROL REQUIREMENT → IMPLEMENTATION STATE → TECHNICAL EVIDENCE → EXTERNAL/VENDOR EVIDENCE → LEGAL/CONTRACT EVIDENCE → ENVIRONMENT EVIDENCE → RELEASE DECISION`

## 4. Production PHI gate states

P16 may use an internal operational evidence projection with states such as:

- `NOT_EVALUATED`
- `BLOCKED`
- `PARTIAL`
- `TECHNICAL_EVIDENCE_GREEN`
- `EXTERNAL_EVIDENCE_REQUIRED`
- `LEGAL_REVIEW_REQUIRED`
- `PRODUCTION_APPROVAL_REQUIRED`
- `PRODUCTION_VERIFIED`
- `DEGRADED_OR_REVOKED`

These are **security/release evidence states**, not new product/company law and not substitutes for P00 implementation states.

`PRODUCTION_VERIFIED` is valid only for a named environment, data class, capability, provider/rail where relevant, and evidence timestamp.

A provider being callable in sandbox never upgrades production PHI state.

## 5. Security evidence register

P16 should create a machine-readable evidence register during implementation planning, reusing P00 traceability rather than inventing another Canon.

Each control record should include:

- control ID;
- control family;
- applicable environment(s);
- data class / risk class;
- implementation state;
- strategy disposition (`REUSE / EXTEND / CONNECT / PARTNER / BUILD NEW` where useful);
- technical evidence refs;
- operational evidence refs;
- external/vendor evidence refs;
- contract/legal evidence refs;
- owner;
- last verified timestamp;
- next verification/expiry where applicable;
- blocker/revocation reason;
- customer-facing claim allowed, if any.

No field may be populated with “compliant” as a substitute for evidence.

## 6. Gate families

### 6.1 Identity, authentication, and session security

Required evidence areas:

- password/session security where password auth exists;
- secure cookie attributes;
- session fixation resistance;
- logout/revocation behavior;
- account recovery controls;
- brute-force/rate controls;
- stronger authentication for privileged/PHI-capable roles as required by risk;
- MFA/passkey implementation state truth;
- privileged account inventory and least privilege;
- break-glass access design and audit where clinical emergency access is later required.

P16 must not claim MFA/passkey protection before the rail is actually implemented and verified.

### 6.2 Tenant, context, RBAC/ABAC, and resource authorization

This is a release-blocking domain for clinical/enterprise use.

Tests must prove denial, not only success:

- user A cannot access tenant B by ID substitution;
- same Person switching contexts recomputes authorization;
- organization admin does not inherit chart authority;
- role label does not create professional/clinical authority;
- stale membership/permission is rejected;
- revoked relationship is rejected;
- resource endpoints authorize the resource, not merely the route;
- background jobs/tools respect tenant/context scope;
- caches never cross user/tenant boundaries;
- exports/downloads are independently authorized;
- 3D/P01 projections cannot receive hidden unauthorized nodes.

### 6.3 PHI/PII data classification and minimum necessary

P16 establishes explicit data classes and propagation rules so “sensitive” is not an informal adjective.

At minimum distinguish:

- public;
- internal business confidential;
- personal/PII;
- PHI/clinical sensitive;
- credentials/secrets;
- crown-jewel proprietary logic.

Every new external connector, browser projection, analytics stream, AI context, log, export, file, and cache is evaluated against data class + minimum necessary.

### 6.4 Browser / frontend confidentiality

Existing gates remain mandatory and are extended where gaps are found.

Forbidden browser exposure includes:

- server secrets/credentials;
- hidden prompts;
- proprietary orchestration/ranking/anti-gaming logic;
- internal risk weights;
- confidential pricing/margin logic;
- raw ORM/domain objects where a DTO suffices;
- unnecessary PHI/PII;
- private evidence references not needed for the task;
- source maps or errors that reveal sensitive internals when production policy forbids them;
- sensitive values in localStorage/sessionStorage/IndexedDB without explicit approved design.

P01 canvas/scene graphs are browser surfaces and receive no special exemption.

### 6.5 Zumi / external AI PHI egress

Current canon already requires intelligence ≠ authority and fail-closed PHI egress.

For any PHI-capable external inference rail, P16 requires evidence for the **exact provider/model/environment**:

- technical adapter state;
- approved model/endpoint configuration;
- minimum-necessary/redaction policy;
- contract/BAA where required;
- data retention/training terms appropriate to intended use;
- approved secret/configuration handling;
- deterministic PHI-egress gate;
- human-review/authority boundaries;
- audit record;
- outage/fallback behavior;
- production deployment evidence.

Existing `ZUMI_PHI_EGRESS_APPROVED=1`-style configuration is a necessary control where used, but an environment flag alone is never sufficient evidence.

### 6.6 Database, encryption, and data persistence

Required evidence:

- production database identity and isolation;
- TLS in transit;
- encryption at rest evidence from the actual hosting/provider configuration;
- migration safety;
- least-privilege DB credentials;
- no production credentials in client/build artifacts;
- backup behavior;
- restore proof;
- retention/deletion requirements;
- environment separation;
- test/synthetic data policy;
- production-data access auditing where applicable.

Do not infer encryption/backup from provider marketing copy alone when exact environment proof can be obtained.

### 6.7 Files and uploads

Any upload path capable of carrying PHI or untrusted files requires a quarantine pipeline before broad production use.

Design requirements:

`UPLOAD → SIZE/TYPE VALIDATION → QUARANTINE → MALWARE/CONTENT SAFETY SCAN AS APPROPRIATE → CLASSIFICATION → AUTHORIZED STORAGE → ACCESS CONTROL → AUDIT → RETENTION/DELETION`

If malware scanning is not implemented, the state is explicit `NOT_BUILT` / `CONNECT` / `PARTNER`; the UI must not imply files are scanned.

Prefer low-cost open-source/self-hosted or already-provided scanning capability when operationally sound. Do not add a recurring vendor solely for a checkbox if a safe cheaper option meets requirements.

### 6.8 Network edge, WAF, and rate limiting

Required analysis/evidence:

- TLS termination;
- public endpoint rate limiting;
- abuse controls;
- security headers;
- request/body limits;
- origin/CSRF controls;
- bot/credential-stuffing defenses appropriate to exposure;
- WAF/edge capability of the actual production hosting path;
- DDoS/provider protection evidence where relevant.

Do not claim WAF protection unless the current deployment actually routes through the asserted control.

### 6.9 Secrets and configuration

Requirements:

- no secrets in repository/client bundles;
- environment separation;
- least-privilege credentials;
- documented secret ownership;
- rotation/revocation procedure;
- rotation evidence for high-risk secrets when required;
- no broad long-lived admin credentials where scoped credentials are possible;
- leaked/compromised secret response runbook.

### 6.10 Dependency, SBOM, SAST, and supply-chain security

P16 must investigate the three pre-existing high-severity npm advisories from P00 without automatically using a force upgrade.

Required workflow:

1. capture exact advisory/package/dependency path;
2. determine runtime vs dev/build exposure;
3. determine whether patched compatible versions exist;
4. create targeted RED/regression coverage if behavior can be affected;
5. upgrade minimally where safe;
6. run full exact-head Quality/deploy-contract;
7. document any accepted residual risk with reason and expiry/owner.

Security tooling should favor existing CI and low-cost/open-source capabilities. The implementation plan should evaluate native package audit/SBOM output, GitHub-supported scanning available to the repository, and narrowly justified OSS tooling before introducing paid scanners.

### 6.11 Logging, audit, telemetry, and observability

Logs are part of the data boundary.

Required:

- no secrets in logs;
- minimum-necessary PHI in logs, preferably none by default;
- request/error correlation without dumping sensitive bodies;
- security-relevant authentication/authorization events where appropriate;
- audit event integrity for consequential actions;
- safe production errors;
- alert ownership/escalation for material failures;
- retention policy appropriate to log class;
- third-party telemetry receives no unnecessary PHI/crown-jewel data.

### 6.12 Backup, restore, disaster recovery

A backup setting is not restore evidence.

P16 requires:

- documented backup source/schedule/retention for the exact production datastore;
- access controls around backups;
- restoration procedure;
- tested restore to an isolated verification environment;
- evidence of data integrity after restore;
- recovery ownership;
- RPO/RTO targets classified as targets until measured;
- periodic re-test cadence appropriate to risk.

No customer-facing resilience claim exceeds measured evidence.

### 6.13 Incident response

Minimum operating system:

- severity taxonomy;
- detection/report intake;
- containment;
- evidence preservation;
- credential/session revocation;
- customer/legal notification decision path;
- recovery;
- post-incident review;
- corrective-action tracking;
- security contact ownership.

Run at least a tabletop/game-day against representative high-risk scenarios before claiming mature production operations.

### 6.14 Vendor / subprocessor / BAA / DPA / legal evidence

External service capability is not legal authorization.

For each vendor touching regulated/sensitive data, capture:

- exact service/product;
- intended data classes;
- role/use;
- contract status;
- BAA/DPA status where applicable;
- retention/training/subprocessor terms where relevant;
- region/environment configuration;
- security documentation/evidence;
- termination/export/deletion path;
- owner/renewal date.

P16 never fabricates a signed BAA, certification, or security attestation.

### 6.15 Legal/product claim boundary

P16 does not itself declare Klinikos “HIPAA compliant,” “certified,” “SOC 2 compliant,” or legally production-ready.

It may state precise verified controls and readiness gaps. Broader compliance/contract claims require appropriate legal/compliance evidence and, where applicable, external assessment.

## 7. PHI production decision function

A PHI-bearing capability may be marked `PRODUCTION_VERIFIED` only when all **applicable** gate families are evidence-green for the exact environment and no blocking legal/external requirement remains.

Examples of blockers:

- unresolved tenant isolation failure;
- unknown production database/backup state;
- required BAA not executed;
- AI PHI egress not approved;
- missing secure upload quarantine for a feature that accepts untrusted PHI files;
- critical/high exploitable dependency with no accepted mitigation;
- sensitive browser disclosure;
- unverified privileged access path;
- no recovery path for the relevant datastore;
- red exact-head release evidence.

The gate is fail-closed: unknown required evidence remains unknown/blocking rather than silently passing.

## 8. P01 true-3D security integration

P16 treats the Living Reality runtime as a new browser disclosure surface.

Required P01 reviews:

- scene projection DTO minimization;
- no hidden unauthorized nodes/edges;
- no private object data embedded in textures/assets;
- no PHI in canvas telemetry/screenshots beyond explicit authorized use;
- no proprietary weights/policy in client geometry/layout logic;
- no authority decisions made by raycast/client state;
- WebGL errors/context dumps do not leak private data;
- third-party 3D libraries do not add unreviewed telemetry/network calls;
- dependency/supply-chain review for new rendering packages.

## 9. P02 growth/security integration

Required P02 reviews:

- anonymous raw prompts treated as potentially sensitive;
- no raw prompt in URL/local browser storage/analytics;
- continuation token tamper/expiry/replay handling;
- no open redirect;
- same-origin controls;
- signup/session fixation protection;
- account enumeration resistance;
- public rate limiting and AI cost controls;
- continuation cannot widen authority after auth;
- cross-user continuation isolation.

## 10. Branch/release governance

P00 proved the repository's code-level Quality gates are strong but GitHub `main` branch protection/ruleset enforcement remains an external manual action.

P16 carries this as an operational risk until an authorized repository administrator applies and verifies:

- PR requirement;
- exact Quality status requirements;
- force-push protection;
- deletion protection;
- tightly controlled break-glass/bypass.

Documentation must not be represented as active GitHub enforcement.

## 11. Threat model priorities

P16 prioritizes existential/high-impact failure classes:

1. cross-tenant or cross-context data exposure;
2. unauthorized clinical/financial/organization action;
3. PHI leakage to browser/AI/vendor/telemetry/logging;
4. credential/session compromise;
5. insecure upload/malware path;
6. secret exposure;
7. destructive or unrecoverable database event;
8. dependency/supply-chain compromise;
9. prompt injection/tool misuse widening authority;
10. fake or unsupported compliance/production claims;
11. compromised external connector/webhook;
12. denial/abuse causing cost or availability failure.

Controls are sequenced by risk reduction and commercial leverage, not by the desire to collect badges.

## 12. Adversarial testing matrix

The implementation plan must create negative tests for representative actors and objects, including:

- anonymous visitor;
- authenticated Person;
- professional claim without verification;
- verified professional where applicable;
- organization member;
- organization admin;
- clinical user;
- patient/caregiver context;
- internal/company admin;
- Zumi/tool context;
- external integration/webhook.

Test dimensions:

- wrong tenant;
- wrong Person;
- wrong organization/location;
- stale membership;
- revoked permission;
- guessed sequential/random object ID;
- cache reuse;
- export/download;
- bulk/list endpoint;
- search/autocomplete;
- file access;
- webhook replay;
- tool/AI request;
- context switch;
- browser projection.

Every denial must be safe and non-disclosing.

## 13. AI/prompt-injection safety

P16 requires tests proving malicious content cannot instruct Zumi to:

- reveal hidden prompts;
- reveal secrets;
- bypass tenant or resource authorization;
- self-verify credentials;
- submit/sign/settle regulated actions;
- change payment truth;
- override clinical governance;
- exfiltrate unrelated records;
- call unauthorized tools;
- convert untrusted retrieved content into system authority.

AI output remains a candidate/recommendation unless a deterministic authorized system performs the action.

## 14. Release evidence

For each P16 implementation tranche, required applicable evidence includes:

- P00 traceability valid;
- security source gates green;
- targeted adversarial tests green;
- full unit/integration suite green;
- PostgreSQL journeys green where affected;
- typecheck/lint green;
- production build/start green;
- browser disclosure inspection where affected;
- dependency audit evidence;
- exact candidate SHA;
- exact-head Quality/deploy-contract green;
- production runtime evidence before any production claim;
- external/legal evidence separately attached/referenced where required.

`MERGED ≠ DEPLOYED ≠ PRODUCTION VERIFIED ≠ PHI AUTHORIZED`.

## 15. Cost discipline

P16 must maximize security per dollar.

Default sequence:

1. eliminate insecure behavior in application architecture;
2. use existing deterministic gates and CI;
3. use native hosting/database security correctly;
4. use free/open-source scanning and testing where operationally sufficient;
5. automate evidence collection;
6. buy specialized services only when risk, contract, scale, or enterprise sales requirements justify them.

Avoid prematurely purchasing compliance theater, duplicate security platforms, or expensive tooling that does not close a concrete blocker.

Where external attestation/certification becomes commercially necessary, P16 should prepare the evidence substrate first so paid audit hours are minimized.

## 16. Commercial consequence

P16 is a revenue enabler because it:

- removes enterprise procurement blockers;
- protects clinical/customer adoption;
- lowers breach/incident downside;
- protects Klinikos IP and proprietary orchestration;
- supports larger contracts and institutional integrations;
- makes security questionnaire/BAA/DPA/vendor review faster because evidence is organized;
- prevents false claims that could destroy trust or create legal exposure.

Security spend is therefore prioritized by **risk reduction + deal enablement + evidence reuse**.

## 17. Definition of done for the P16 design

Ready for implementation planning when:

- PHI production state is evidence-backed and fail-closed;
- current controls are reused rather than rewritten;
- tenant/context authorization is treated as adversarially testable;
- P01 canvas and P02 public intent are included in the threat model;
- AI PHI egress requires exact provider/environment/contract evidence;
- backup restore is distinguished from backup configuration;
- upload scanning state cannot be faked;
- dependency advisories have a safe remediation workflow;
- branch protection gap remains truthful/manual until externally fixed;
- legal/compliance marketing claims are separated from technical evidence;
- cost discipline is explicit.

## 18. North star

> **Klinikos should become easier to trust as it becomes more powerful: every sensitive capability earns production authority through evidence, every unknown fails closed, and security compounds into enterprise value instead of becoming an expensive afterthought.**
