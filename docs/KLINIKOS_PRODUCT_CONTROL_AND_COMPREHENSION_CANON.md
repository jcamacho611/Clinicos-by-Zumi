# KLINIKOS — PRODUCT CONTROL, COMPREHENSION, DISCLOSURE & GROWTH CANON

Version: `2026-08-20.1`
Status: `AUTHORITATIVE REPOSITORY LAW`

This canon exists to prevent repeated drift in four areas that directly determine whether Klinikos becomes understandable, trustworthy, usable, defensible, and commercially scalable: the persistent Zumi control, browser/server confidentiality, product comprehension, and public search/discovery.

If older documentation conflicts with this canon on these subjects, this canon controls until the older document is deliberately reconciled.

## 1. Product hierarchy

- **Klinikos is the master product and brand.**
- **Zumi is Klinikos Intelligence and the persistent personal operating assistant inside Klinikos.**
- **Grid is the healthcare resource/opportunity/capacity network.**
- **Klinikos EDU is the learning and advancement system.**
- Zumi is not a separate company, separate permission system, separate database authority, or disconnected chatbot widget.

The product must be explainable to a new visitor in plain language before asking that visitor to understand internal architecture.

## 2. Zumi is the persistent control plane for human intent

On authenticated Klinikos surfaces, Zumi is the persistent natural-language control for the application.

Canonical interaction:

`USER INTENT → PERSISTENT ZUMI CONTROL → GOVERNED SERVER INTELLIGENCE → AUTHORIZED ROUTE / ANSWER / PREPARED ACTION → USER CONFIRMATION OR WORKSPACE`

Required experience:

1. every authenticated application page exposes the same Zumi control through the persistent shell;
2. the control is reachable by keyboard and pointer and has an accessible name that identifies Zumi and the action;
3. the shell control opens or continues the same mounted Zumi conversation rather than creating a second assistant instance;
4. text entered into the shell control becomes a turn in that same conversation;
5. a compact mobile control is functionally equivalent to the desktop control;
6. `Ctrl/Cmd + J` opens the same assistant;
7. `/zumi` expands the same conceptual assistant into a dedicated workspace rather than creating a competing intelligence product;
8. trusted internal navigation should preserve conversation continuity while the authenticated shell remains mounted;
9. page-specific context may shape Zumi's prompt and suggestions, but it must not create page-specific assistant personalities or disconnected AI islands;
10. decorative Zumi marks must not be presented as unexplained controls. If a Zumi visual is interactive, its purpose must be obvious and accessible.

The send/control affordance is the primary interaction iconography for Zumi. Avoid random duplicate launchers that compete with the shell control or make the user guess which Zumi is authoritative.

## 3. Zumi coordinates the app; it does not become authority

"Controls the app" means Zumi can understand intent, explain state, navigate, retrieve authorized context, prepare actions, and coordinate governed workflows.

It does **not** mean Zumi may override deterministic authority.

Zumi never independently widens or replaces:

- authentication;
- tenant isolation;
- RBAC/resource authorization;
- credential/eligibility rules;
- consent/release rules;
- clinical governance;
- safety holds;
- payment, settlement, entitlement, or transaction truth;
- required human review.

The governing pattern is:

`ZUMI PROPOSES / COORDINATES → DETERMINISTIC SYSTEM CHECKS → AUTHORIZED HUMAN OR SYSTEM ACTION → PERSISTED TRUTH`

## 4. Public Zumi is useful but bounded

The public Klinikos surface may use a bounded public Zumi conversation for product explanation, navigation, Grid/EDU discovery, general workflow discussion, and conversion assistance.

Public Zumi must remain structurally separate from authenticated clinic authority.

It must not:

- open or search private patient/clinic records;
- inherit tenant context;
- execute authenticated tools;
- establish payment, credential, eligibility, clinical, or transaction truth;
- request PHI or unnecessary PII;
- expose internal prompts, ranking, orchestration, security, anti-abuse, pricing/margin, or trade-secret logic.

When a request requires private authority, public Zumi explains the boundary and routes the person to the appropriate authenticated entry point.

## 5. Confidentiality and browser disclosure law

Assume everything delivered to a browser can be inspected, copied, replayed, automated, decompiled, diffed, retained, and shared.

If information must remain confidential, it stays server-side.

Canonical boundary:

`BROWSER INTENT → SERVER CAPABILITY → SERVER POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY PRESENTATION DTO → BROWSER`

Do not intentionally expose to the browser unless a reviewed user-facing requirement truly needs it:

- hidden/system prompts;
- internal reasoning or chain-of-thought;
- private canonical context;
- provider credentials/configuration;
- internal provider/model selection details;
- secret feature flags;
- proprietary routing/ranking/matching weights;
- risk, anti-abuse, fraud, or trust heuristics;
- private pricing, margin, settlement, or cost formulas;
- raw ORM/domain records;
- unnecessary confidence scores, assumptions, internal state-machine values, or debug metadata;
- private roadmap/business strategy;
- unnecessary PHI/PII.

A browser response should contain only the answer, explanation, permitted status, safe evidence/source references where appropriate, and permitted next actions required by the user experience.

Minification, obfuscation, hidden DOM, disabled controls, private repositories, source-map settings, and client-side feature flags are not confidentiality controls.

## 6. Product comprehension law

A first-time visitor or new clinic user should not need a pitch deck, founder explanation, or architecture diagram to understand what to do.

Public first-fold requirements:

- say what Klinikos is in plain language;
- state the practical job it performs;
- show the primary clinic/buyer path;
- make Zumi immediately understandable as the intelligence inside Klinikos;
- preserve a clear path to Grid, EDU, trust, pricing, and sign-in without presenting them as four unrelated companies;
- avoid jargon where a clinic owner would need to translate it;
- never invent traction, savings, integrations, certifications, customers, outcomes, or regulatory status.

Authenticated experience requirements:

- use role-relevant navigation;
- resume the user's work instead of presenting module catalogs whenever possible;
- prefer one obvious next action over multiple equal-weight controls;
- progressively disclose advanced configuration;
- keep page titles, empty states, buttons, errors, and Zumi guidance in plain operational language;
- preserve keyboard access, responsive layout, readable contrast, meaningful labels, and visible focus.

If a user repeatedly needs training to find a core action, treat that as a product defect, not a documentation problem.

## 7. SEO and public discovery law

SEO serves comprehension and qualified acquisition; it must never be used to expose private surfaces or stuff keywords into confusing copy.

Permanent rules:

1. canonical public messaging comes from the shared public messaging source rather than drifting copies;
2. root/site metadata must describe the actual product in plain language;
3. public pages may be indexed only when they contain useful public content;
4. authenticated, patient-private, admin, setup, API, and operational workspaces are `noindex` and excluded from the public sitemap;
5. `robots.txt` is defense-in-depth for crawling, not an access-control mechanism;
6. canonical URLs must be page-correct; never set the homepage as the inherited canonical for every route;
7. structured data must contain only truthful public claims and must not invent reviews, customers, awards, certifications, prices, or medical authority;
8. titles and descriptions should answer what the page is and why a qualified visitor should care before adding brand language;
9. public internal links should form a coherent product graph: product → how it works → pricing/trust → Grid/EDU/clinic conversion paths;
10. measure search acquisition, qualified conversion, activation, and retention rather than raw traffic alone.

## 8. Growth and unicorn execution law

Klinikos should compound through connected product loops rather than disconnected features.

Primary compounding loop:

`DISCOVERY → CLEAR VALUE → ZUMI-GUIDED INTENT → QUALIFIED ROUTE → ACTIVATION → OPERATIONAL VALUE → REPEAT USE → EXPANSION → GRID/EDU/NETWORK PARTICIPATION → MORE VALUE`

Engineering prioritization should favor work that improves one or more of:

- time to first useful outcome;
- activation rate;
- weekly retained operational use;
- revenue recovery or measurable administrative efficiency where evidence exists;
- paid conversion and expansion;
- Grid liquidity and successful governed fulfillment;
- EDU-to-opportunity progression;
- referral/network effects;
- cost-to-serve and gross-margin truth;
- security, trust, and enterprise readiness.

Do not optimize vanity feature count. Remove duplicate controls, dead pages, fake automation, conflicting pricing, jargon, and disconnected journeys when they reduce comprehension or trust.

## 9. Merge blockers

A change is not merge-ready if it introduces any of the following without a reviewed exception:

- a core authenticated page with no persistent access to the canonical Zumi assistant;
- a second disconnected Zumi/chat implementation presented as authoritative;
- decorative controls that look actionable but do nothing;
- private/proprietary implementation details serialized to the browser without a user-facing need;
- private/authenticated pages added to public sitemap/indexing;
- globally inherited homepage canonical URLs;
- public metadata that materially contradicts canonical messaging;
- inaccessible Zumi send/open controls;
- hidden or misleading payment/clinical/credential/automation state;
- new jargon that reduces comprehension of an existing plain-language path.

## 10. Acceptance

The product-control experience is coherent when a user can move across authorized Klinikos workspaces and always have one recognizable, accessible Zumi assistant available to ask, understand, navigate, and prepare the next step without losing governance or conversation continuity.

The public product is coherent when a stranger can answer, without external explanation:

1. What is Klinikos?
2. Who is it for?
3. What problem does it solve?
4. What is Zumi?
5. What should I do next?
6. What can the public site safely do, and what requires sign-in?

The growth system is coherent when discovery, product comprehension, Zumi-guided activation, operational value, monetization, and network expansion reinforce one another without weakening security or truth.