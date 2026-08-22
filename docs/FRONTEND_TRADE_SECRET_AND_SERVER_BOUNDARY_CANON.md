# KLINIKOS — FRONTEND TRADE-SECRET & SERVER-BOUNDARY CANON

Version: `2026-08-18.1`
Status: `AUTHORITATIVE SECURITY / ARCHITECTURE LAW`

## 1. Purpose

This document defines a permanent Klinikos engineering boundary:

> **Anything that must remain confidential must remain server-side.**

The browser is an untrusted execution and disclosure environment. Assume every authenticated or unauthenticated user can inspect, record, decompile, replay, diff, automate, and retain everything delivered to their device.

This rule protects two different things at the same time:

1. user, patient, organization, security, and operational confidentiality; and
2. Klinikos proprietary implementation knowledge, including confidential algorithms, rules, prompts, orchestration logic, security controls, commercial logic, and unreleased strategy.

This engineering canon supports reasonable confidentiality measures. It does not by itself guarantee that any particular information satisfies every legal element of trade-secret status; legal protection also depends on the nature of the information, actual secrecy, access controls, contracts, conduct, and applicable law.

## 2. Permanent trust model

Treat the following as inspectable by the recipient whenever they are delivered to a browser:

- HTML;
- JavaScript and CSS bundles;
- React Client Component code;
- serialized React Server Component payloads;
- hydration data;
- API responses;
- GraphQL/FHIR responses;
- WebSocket/SSE payloads;
- DOM attributes and hidden elements;
- browser caches;
- localStorage, sessionStorage, and IndexedDB;
- JavaScript-readable cookies;
- source maps;
- client logs and console output;
- public assets;
- public environment values;
- static JSON/manifests;
- frontend feature flags;
- network requests and response timing;
- browser error payloads.

Minification, bundling, disabled UI controls, hidden DOM, obfuscation, route secrecy, or a private GitHub repository are **not** browser secrecy boundaries.

The architectural default is:

`BROWSER INTENT / INPUT → AUTHENTICATED SERVER CAPABILITY → SERVER-SIDE POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

Do not invert that model by sending proprietary decision logic to the browser and asking the browser to compute the result.

## 3. Information classification

### 3.1 Public / intentionally client-visible

Examples:

- approved public marketing copy;
- public pricing intentionally published to that user;
- public documentation intentionally released;
- approved branding/assets;
- user-visible results and status;
- user-safe explanations;
- permitted next actions;
- public program citations where lawful;
- resource/profile information explicitly approved for marketplace visibility;
- intentionally public environment values.

Public visibility must still respect authorization, privacy, licensing, and truthful-product rules.

### 3.2 Authorized confidential user/organization data

Examples:

- patient information;
- staff information;
- organization operational data;
- claims, billing, quality, credential, referral, task, document, and audit state;
- expert-engagement information;
- financial and settlement state.

The browser may receive only the minimum information needed for the authorized user experience. Authorization does not mean unlimited disclosure.

### 3.3 Klinikos confidential proprietary information

Keep server-side unless an explicit reviewed disclosure decision exists:

- Zumi system prompts, hidden directives, safety prompts, orchestration instructions, evaluator prompts, internal memory-selection policy, and private tool instructions;
- proprietary ranking, matching, recommendation, routing, prioritization, trust, risk, anti-abuse, fraud, safety, economic, or reputation algorithms;
- internal weights, scores, coefficients, thresholds, heuristics, feature engineering, and derived signals;
- Rules & Evidence implementation logic, internal predicates, private evidence-evaluation methods, proprietary derived rules, private rule packages, and licensed measure content beyond permitted display;
- internal authorization decision machinery beyond user-safe reasons;
- private pricing formulas, margins, commissions, unit economics, unpublished tiers, discount logic, customer-acquisition logic, investor strategy, unpublished partnerships, and private commercial forecasts;
- unreleased product roadmap, private product strategy, private customer/prospect lists, competitive strategy, acquisition strategy, and unpublished market research;
- private infrastructure topology, private deployment details, secret operational runbooks, red-team notes, exploit details, detection heuristics, privileged maintenance capabilities, and private threat models where disclosure would materially assist attack;
- internal source code not intentionally shipped to the client;
- privileged debug/admin functionality;
- connector credentials and configuration details beyond safe readiness state.

### 3.4 Secrets and credentials

Never intentionally expose to the browser, repository history, logs, docs, issues, PR text, fixtures, screenshots, or client telemetry:

- API keys;
- database URLs/passwords;
- OAuth client secrets;
- private signing keys;
- encryption keys;
- webhook secrets;
- SMTP secrets;
- provider secrets;
- cloud credentials;
- deployment credentials;
- private certificates/keys;
- access tokens;
- session-signing secrets.

If a credential is discovered in a client-visible or committed location, treat it as compromised and rotate/revoke according to incident policy. Removing it from the current file alone is insufficient.

## 4. Server-only law

Use server-side modules for confidential execution. In Next.js, prefer:

- Server Components where appropriate;
- Route Handlers;
- Server Actions where appropriate and authorized;
- server-only repositories/services;
- policy engines;
- DTO/view-model builders;
- internal event processors;
- private connector adapters.

Use `import "server-only";` for modules that must never enter a client bundle whenever technically appropriate.

Client Components should receive only the data they need to render and act.

Sensitive/proprietary domains that default to server-only execution include:

- Zumi master directives and policy;
- orchestration engines;
- Rules & Evidence;
- Quality Guardian and other Assurance engines;
- Grid eligibility and ranking;
- Expert Grid eligibility/trust/conflict logic;
- financial calculations and private pricing logic;
- credential and authorization policy;
- security/risk evaluation;
- connector credentials/configuration;
- private analytics and opportunity scoring;
- internal audit/provenance logic.

## 5. Presentation DTO law

Do not serialize raw ORM/database/domain objects to the browser by default.

Every sensitive or proprietary domain should expose explicit presentation contracts/view models containing only approved fields.

Representative examples:

- `QualityGuardianView`;
- `QualityGapView`;
- `PatientSummaryView`;
- `GridMatchView`;
- `ExpertNeedView`;
- `ExpertEngagementView`;
- `RevenueSignalView`;
- `CredentialStatusView`;
- `AuthorizationStatusView`;
- `TrustedNextActionView`.

A presentation DTO may include:

- user-facing title/status;
- safe identifier where needed;
- authorized display values;
- safe explanation;
- due/urgency state;
- permitted actions;
- href/action token if appropriate;
- public citation/source label where permitted.

It should exclude unless explicitly required:

- internal weights;
- rule predicates;
- private evidence refs;
- hidden scoring features;
- private audit metadata;
- raw provider payloads;
- internal authorization structure;
- complete session objects;
- private notes;
- secrets;
- proprietary algorithm parameters;
- unnecessary PHI/PII;
- unreleased business information.

## 6. React Server Component serialization law

Server Component source stays server-side, but values passed into Client Components can serialize to the browser.

Therefore every server-to-client prop boundary is a disclosure boundary.

Before passing props into a Client Component, inspect whether the object contains:

- session internals;
- raw user/provider/organization records;
- internal rule definitions;
- private orchestration state;
- evidence references;
- raw audit metadata;
- connector configuration;
- internal risk scores;
- confidential commercial logic.

Pass a deliberately shaped DTO instead of a broad object.

## 7. Zumi confidentiality law

The browser must not receive Zumi hidden operating instructions.

Keep server-side:

- master/system prompts;
- hidden directives;
- chain-of-thought/private reasoning;
- internal safety and security prompts;
- tool-selection rules;
- prompt-injection defenses;
- proprietary orchestration rules;
- private canonical architecture excerpts used only as internal context;
- private business directives;
- provider credentials;
- private connector metadata.

Browser-visible Zumi results should be projected to:

- answer/output approved for the user;
- safe sources;
- safe next actions;
- safe blockers;
- approved capability/readiness state;
- user-safe explanations;
- minimum necessary operational state.

Never return trusted orchestration internals wholesale merely because they already exist in a server object.

## 8. Rules & Evidence / Assurance confidentiality law

Rule execution is server authority.

The client may receive the user-facing result, for example:

- `open gap`;
- `review required`;
- `due soon`;
- `missing document`;
- `eligible / not currently eligible`;
- a safe reason;
- a permitted next action.

The client should not receive complete confidential rule packages, implementation predicates, proprietary evidence logic, licensed content beyond permitted use, scoring weights, hidden exclusions, or internal source details unless a reviewed product/legal requirement explicitly permits it.

AI prose never establishes rule satisfaction. Deterministic policy and governed evidence remain authoritative.

## 9. Grid and Expert Grid confidentiality law

Grid may explain a match without disclosing the complete ranking system.

Client-visible match information may include approved profile/resource data, price shown to that user, availability, eligibility badges, safe reasons, and permitted next actions.

Keep private:

- internal ranking weights;
- anti-gaming rules;
- trust/risk heuristics;
- rejected-candidate internals;
- private demand from another organization;
- hidden marketplace economics;
- private fee/margin calculations;
- patient data not separately authorized;
- confidential evidence documents.

A match does not grant data access.

Required sequence remains:

`NEED → MATCH → TERMS / AGREEMENTS / CONFLICT CHECKS → AUTHORIZATION → SCOPED ACCESS → WORK`

## 10. API response minimization law

Every API response is a disclosure surface.

For each response field ask:

> Does the authorized browser actually need this field to render the current experience or perform the permitted action?

If no, omit it.

Never use raw entity serialization as a convenience shortcut for sensitive domains.

Prefer schema-validated response projections.

Particular scrutiny applies to:

- `/api/zumi/*`;
- patient endpoints;
- quality/assurance endpoints;
- billing/revenue endpoints;
- insurance/prior-authorization endpoints;
- Grid/Expert Grid endpoints;
- document endpoints;
- provider/credential endpoints;
- admin/status/configuration endpoints;
- analytics endpoints.

## 11. Authorization and tenant law

Frontend visibility controls are UX only, never security.

Server-side reads/writes must derive and enforce, as applicable:

- authenticated identity;
- active organization/tenant;
- role;
- permission;
- resource ownership;
- purpose;
- consent/release state;
- engagement scope;
- credential/eligibility state;
- minimum necessary data scope.

Prefer server-derived `session.organizationId` over a browser-supplied organization identifier when the session already establishes authority.

Cross-tenant access fails closed unless a specific governed cross-organization route exists.

## 12. Environment-variable law

Separate server and public configuration explicitly.

- secrets must not use `NEXT_PUBLIC_*`;
- public environment values must be allowlisted intentionally;
- never spread `process.env` into client-visible objects;
- never return environment values from diagnostics;
- `.env.example` is a names/configuration contract, not a secret store;
- no real secret values belong in fixtures, docs, screenshots, issues, PR descriptions, or committed examples.

Add regression tests/secret scanning where practical.

## 13. Source-map law

Production source maps that reveal proprietary source are not public assets by default.

If source maps are needed for observability:

- upload them privately to the approved monitoring service;
- prevent public serving/download;
- ensure tokens/PHI are not embedded;
- verify production `*.map` URLs are not publicly retrievable unless explicitly intended.

## 14. Error and diagnostic law

User-facing production errors must not expose:

- stack traces;
- repository paths;
- SQL;
- database schema/table details;
- internal filenames;
- environment/configuration;
- secrets;
- provider payloads;
- hidden prompts;
- private rules;
- infrastructure topology.

Return a safe message and correlation/request identifier where useful. Keep detailed diagnostics server-side under governed access.

Health/status endpoints expose only the minimum operational state necessary for the intended audience.

Debug, preview, diagnostic, internal, test, seed, sandbox, maintenance, and admin routes require explicit review and authorization; route obscurity is not protection.

## 15. Logging and telemetry law

Do not log confidential payloads for convenience.

Browser console logging must not contain:

- patient/PHI data;
- full API responses;
- prompts/rules;
- secrets;
- auth/session internals;
- private financial information;
- raw provider responses;
- private expert evidence.

Server logs also follow minimum necessary principles.

Third-party telemetry, analytics, session replay, crash reporting, chat widgets, and advertising must be reviewed for sensitive-data egress before use.

Do not send PHI or confidential Klinikos proprietary information to an analytics vendor merely because the SDK is installed.

## 16. Client-storage and cookie law

Do not put secrets, hidden prompts, proprietary algorithms, or unnecessary PHI in localStorage/sessionStorage/IndexedDB.

Authentication/session material should use secure server-side session design and appropriate cookie controls, including `HttpOnly`, `Secure`, and suitable `SameSite` policy where applicable.

## 17. Cache law

Sensitive authenticated responses must not become shared/public cache entries.

Use appropriate private/no-store behavior for sensitive user-specific/healthcare responses and audit Next.js caching semantics carefully.

Never allow one tenant's private server-rendered/API state to be reused for another tenant through an incorrect shared cache key.

## 18. CORS / CSRF / origin law

State-changing endpoints must not rely on frontend controls alone.

Use restrictive CORS and request-origin defaults. Do not use wildcard credentialed CORS.

Review CSRF/origin protections for sensitive route handlers/server actions and verify webhook signatures on external inbound event paths.

## 19. Security-header law

Maintain appropriate defense-in-depth headers, including as applicable:

- Content-Security-Policy;
- Strict-Transport-Security;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- frame restrictions / `frame-ancestors`.

Do not weaken core application behavior merely to optimize a scanner score, but document necessary exceptions.

## 20. Static/public asset law

Everything under a public static asset path is assumed downloadable.

Do not place private material in public assets, including:

- internal docs;
- source backups;
- database exports;
- client lists;
- private PDFs;
- private JSON/CSV;
- `.env` files;
- private keys/certificates;
- logs;
- SQL dumps;
- ZIP archives containing private source/data;
- source maps unless intentionally public.

Audit extensions such as `.zip`, `.bak`, `.old`, `.sql`, `.csv`, `.json`, `.env`, `.pem`, `.key`, `.log`, and `.map` before release.

## 21. Internal documentation law

Repository documentation may guide server behavior or developers, but private docs must not become frontend assets automatically.

Search for and review runtime/client imports from private documentation/prompt/architecture/legal directories.

Private source-of-truth documents are not automatically public product documentation.

## 22. Proprietary business-logic law

When logic contributes to Klinikos competitive advantage, default to:

**browser = input + approved result**

**server = algorithm**

This includes:

- Grid ranking;
- Expert Grid matching;
- Quality prioritization;
- workflow selection;
- opportunity/revenue scoring;
- clinic risk signals;
- trust/reputation calculations;
- private dynamic pricing;
- anti-fraud/abuse logic;
- recommendation ranking;
- route composition.

Explain the user-relevant reason for a result without revealing enough detail to reconstruct proprietary weighting or abuse defenses.

## 23. Feature-flag and unreleased-feature law

Do not ship confidential unreleased implementations to client bundles and rely only on a false/hidden frontend feature flag.

If a feature is confidential or unauthorized, gate it server-side and avoid sending its implementation/data to the browser.

Client flags may control presentation but are not confidentiality or authorization boundaries.

## 24. Dependency and supply-chain law

Minimize third-party browser dependencies because each dependency increases attack, data-egress, and disclosure surface.

Maintain a lockfile, dependency/security review, and automated update/security tooling where useful and affordable.

Review package install/build scripts and third-party SDKs for unexpected telemetry or secret handling.

## 25. Secret scanning and repository hygiene

Use automated secret scanning where available and practical.

Search for committed:

- private keys;
- high-entropy tokens;
- credentials;
- `.env` values;
- cloud secrets;
- real patient/customer data.

Do not print discovered secret values in CI logs or issue text.

If a secret was committed historically, treat history exposure as part of the incident. Rotation/revocation generally matters more than merely rewriting the current file.

## 26. Browser/bundle inspection gate

For material releases involving proprietary logic or sensitive data, inspect the production client output for accidental disclosure.

Search browser-delivered assets/payloads for high-risk strings/patterns such as:

- master prompt fragments;
- private canon headings;
- database URLs;
- provider credentials;
- internal pricing formulas;
- internal rule definitions;
- secret-shaped strings;
- private architecture content;
- internal evidence refs;
- patient identifiers in marketplace/public payloads.

Add automated regression checks for known high-risk disclosures where practical.

## 27. Minimum security test matrix

Material work should add or preserve tests for relevant risks, including:

- tenant isolation;
- unauthorized role access;
- server-only confidential modules;
- safe DTO projection;
- no patient IDs/evidence refs in marketplace demand;
- no raw rule definitions in client responses;
- Zumi hidden-context filtering;
- public environment allowlist;
- production error sanitization;
- authenticated response no-store behavior;
- expired/invalid expert authorization;
- cross-tenant expert access denial;
- sensitive endpoint authorization;
- secret-shaped browser-payload regressions;
- public/static asset leakage where practical.

## 28. Assurance / Quality Guardian / Expert Grid application

The Assurance architecture must follow this confidentiality boundary:

`PRIVATE OPERATIONAL DATA / EVENT`
→ `SERVER-SIDE RULES & EVIDENCE`
→ `SERVER-SIDE ASSURANCE / QUALITY GUARDIAN`
→ `SERVER-SIDE AUTHORIZATION / NEXT-ACTION GOVERNANCE`
→ `SAFE ZUMI PROJECTION`
→ `MINIMUM-NECESSARY UI DTO`

If external expert capacity is required:

`SAFE NEED`
→ `GRID MATCH`
→ `TERMS / CONFLICT / AGREEMENT EVIDENCE`
→ `SCOPED AUTHORIZATION`
→ `MINIMUM-NECESSARY DATA ROOM`
→ `EXPERT WORK`
→ `EVIDENCE / REVIEW / OUTCOME`

No marketplace match, model suggestion, frontend state, or payment event independently grants sensitive data access.

## 29. UI law

The frontend should reveal operational truth, not internal machinery.

Preferred owner experience:

- what requires attention;
- why it matters in user-safe language;
- who owns it;
- when it is due;
- what action is available;
- what is blocked/review-required;
- what has been resolved.

Do not force users to understand hidden algorithms, internal engine names, prompt architecture, scoring weights, or infrastructure details to use Klinikos.

## 30. Review checklist for every new frontend feature

Before merging a client-visible feature, answer:

1. What data reaches the browser?
2. Why is each field necessary?
3. Does any Client Component receive a broader object than needed?
4. Does any API serialize raw ORM/domain state?
5. Is proprietary logic running client-side unnecessarily?
6. Are secrets/public env values correctly separated?
7. Could logs/errors reveal private information?
8. Could caching cross user/tenant boundaries?
9. Does a frontend flag incorrectly act as security/confidentiality control?
10. Does the feature expose enough scoring/rule detail to reconstruct proprietary logic?
11. Does third-party telemetry receive sensitive data?
12. Are authorization and tenant scope enforced server-side?
13. Are user-safe explanations sufficient without revealing the algorithm?
14. Has production bundle/payload exposure been reviewed where risk warrants it?

Any unacceptable answer is a merge blocker unless an explicitly documented exception is approved.

## 31. Completion law

For work that changes a server/client boundary, completion requires more than a successful render.

As applicable, verify:

- TypeScript;
- lint;
- tests;
- Prisma/schema/migration safety;
- production build;
- authorization;
- tenant isolation;
- no-store/cache behavior;
- response minimization;
- browser/client bundle inspection;
- secret scanning;
- error sanitization;
- relevant browser/mobile behavior.

If CI cannot execute, do not call the change verified-green. Record the exact blocker and leave the candidate truthfully unverified.

## 32. Permanent architecture law

Klinikos engineering must preserve this separation:

**AUTHORIZATION PROTECTS ACCESS.**

**SERVER BOUNDARIES PROTECT CONFIDENTIAL IMPLEMENTATION AND SECRETS.**

**MINIMUM-NECESSARY DTOs LIMIT DISCLOSURE.**

**DETERMINISTIC ENGINES PROTECT GOVERNED TRUTH.**

**ZUMI ORCHESTRATES BUT DOES NOT WIDEN AUTHORITY.**

**HUMANS RETAIN JUDGMENT WHERE POLICY REQUIRES IT.**

**THE FRONTEND PRESENTS APPROVED RESULTS; IT DOES NOT CONTAIN THE COMPANY'S SECRET SAUCE.**

Every future agent, engineer, contractor, implementation, refactor, design conversion, integration, and product surface must treat this canon as a repository-wide constraint, not an optional security enhancement.
