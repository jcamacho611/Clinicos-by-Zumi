# KLINIKOS UNIVERSAL FRONTEND & USER OUTCOMES CANON

Status: `AUTHORITATIVE FRONTEND / PRODUCT EXPERIENCE CONTRACT`
Date: `2026-08-30`
Scope: all Klinikos public, authenticated, role-specific, clinical, Grid, EDU, financial, patient, provider, enterprise, administrative, integration, mobile and prototype/Figma surfaces.

This document is the complete design prompt and acceptance contract for the Klinikos frontend. It does not replace implementation truth, security law, clinical truth, Grid eligibility law, financial truth, or specialist domain canons. It defines how those systems are presented to humans and the expected outcome for each major user class.

When this document conflicts with an older cinematic, dark-first, architecture-poster, dashboard-heavy, neon, game-like, or decorative reference, this document controls the current operational frontend direction unless a newer explicit product decision supersedes it.

---

# 0. THE MASTER DESIGN MISSION

Design Klinikos as a category-defining healthcare operating environment that is:

- clinically professional;
- trustworthy;
- calm;
- state-of-the-art;
- luxurious through restraint rather than spectacle;
- minimal above, sophisticated underneath;
- natural and immediately understandable;
- accessible and usable for sustained daily work;
- unmistakably Klinikos without becoming visually theatrical;
- commercially extensible without exposing proprietary logic;
- capable of supporting the full healthcare lifecycle through one coherent system.

The permanent experience law is:

> **COMPLEXITY UNDERNEATH. CLARITY ABOVE. INTELLIGENCE EVERYWHERE. ONE BEST NEXT MOVE.**

And:

> **THE COMPLEXITY BELONGS TO KLINIKOS, NOT TO THE PERSON USING KLINIKOS.**

The frontend must never make a normal user understand the five-plane architecture, graph model, domain repositories, state machines, event buses, financial semantics, policy engines, credential engines, or proprietary matching logic merely to accomplish work.

The system may be extremely complex underneath. The visible experience should feel calm, obvious and human.

---

# 1. WHAT KLINIKOS IS

Klinikos is the governed operating and opportunity infrastructure for the healthcare lifecycle.

It is not merely:

- an EHR;
- an EMR;
- practice management;
- CRM;
- staffing marketplace;
- LMS;
- billing software;
- AI assistant;
- patient portal;
- scheduling software;
- med-spa CRM;
- provider directory;
- analytics dashboard.

The frontend must express one coherent ecosystem connecting:

`IDENTITY → EDUCATION → COMPETENCY → CREDENTIAL → WORK → CARE → OPERATIONS → CAPACITY → TRANSACTIONS → REVENUE → OUTCOMES → LEARNING`

and:

`PATIENT NEED → ACCESS → REGISTRATION → SCHEDULING → INTAKE → ENCOUNTER → DOCUMENTATION → ORDERS → RESULTS → FOLLOW-UP → CODING → CLAIM → PAYMENT → RECONCILIATION → FUTURE CARE`

without presenting these as unrelated products.

Major experience families are:

- Living Home / adaptive front door;
- Clinic OS;
- Care;
- Current Visit;
- Patient experience;
- Provider experience;
- Grid;
- EDU;
- Financial OS / Billing / Revenue Integrity;
- Network / Referrals;
- Insights;
- Identity / Trust / Authority;
- Enterprise Command Center;
- Configuration / Administration;
- Integration Hub;
- Zumi / Klinikos Intelligence;
- developer / API / partner surfaces where authorized.

These are projections of one operating substrate, not separate apps.

---

# 2. PRIMARY VISUAL RESET — HEALTHCARE FIRST

The normal operational Klinikos experience is **light-first and healthcare-first**.

The previous dark, glowing, constellation-heavy, architecture-map direction is retired as the default operational experience. It may survive only as an optional presentation, brand, investor, system-X-ray, launch, or dark-theme treatment where it improves comprehension and does not interfere with healthcare work.

## 2.1 Primary clinical palette

Use a bright, calm clinical canvas with generous white space.

Recommended working tokens:

- `CLINICAL_WHITE #FFFFFF` — primary workspace;
- `PEARL #F8FAF9` — page background / subtle separation;
- `MIST #F1F6F4` — secondary workspace / low-emphasis region;
- `SOFT_SAGE #DDEBE5` — selected supportive state;
- `CLINICAL_TEAL #337A73` — primary healthcare interaction accent;
- `SAGE #73A99A` — calm secondary status / supportive accent;
- `MEDICAL_BLUE #557D9A` — restrained information / link / intelligence accent;
- `GRAPHITE #18343C` — primary text / authority;
- `SLATE #5B6E73` — secondary text;
- `HAIRLINE #DDE5E3` — borders / dividers;
- `SUCCESS #3D8B67`;
- `ATTENTION #B68132`;
- `RISK #C64B4B`.

Brand signatures remain available but are used sparingly:

- antique/muted gold for brand authority and premium identity;
- oxblood / deep burgundy for rare authority, signature, or premium actions;
- dusty rose / rose ash for human warmth and subtle branded detail.

Do not make the product blue-hospital-generic. Do not make it burgundy-everywhere. The Klinikos identity should come from typography, spacing, hierarchy, interaction, brand assets, motion restraint and product behavior.

## 2.2 Dark mode

Dark mode remains supported as an optional **Obsidian** expression, not the mandatory identity of clinical work.

Dark mode should use near-black, graphite, black cherry and restrained warm accents. It must never become cyberpunk, neon, game-like, glowing-dashboard theater, or a systems-architecture poster.

## 2.3 Luxury definition

Luxury means:

- extraordinary typography;
- generous breathing room;
- crisp alignment;
- predictable hierarchy;
- high-quality motion tied to state;
- precise controls;
- graceful empty/loading/error states;
- confidence through simplicity;
- excellent information architecture;
- minimal visual noise;
- polished responsive behavior;
- exceptional accessibility.

Luxury does **not** mean:

- more gradients;
- more glow;
- more glass;
- more cards;
- more rounded containers;
- giant logos;
- animated decorative objects;
- gold everywhere;
- miniature text to fit too much information;
- fake futuristic instrumentation.

---

# 3. BRAND SYSTEM

Use the real Klinikos brand assets where appropriate.

Preferred brand treatment:

- Klinikos wordmark in the primary shell;
- orbital K / crest as compact identity mark;
- `by Zumi` only where current brand law intentionally calls for it; Zumi is not the parent brand;
- historical rose assets only when they genuinely improve atmosphere or hierarchy.

The logo should feel like an institutional signature, not a billboard.

Rules:

- no fake text logos when approved assets exist;
- no giant branding rectangles;
- no overuse of the crest;
- no watermarking every panel;
- no decorative asset may compete with patient care or operational work;
- clinical work owns the screen.

---

# 4. SHELL AND NAVIGATION LAW

Normal users should generally see **4–7 persistent primary destinations**. Do not expose the entire architecture as navigation.

Every authenticated shell must include:

1. Klinikos brand identity;
2. active organization/location/context when relevant;
3. role-derived navigation;
4. global or contextual search where useful;
5. persistent access to Ask Klinikos / Zumi;
6. profile / account / context controls;
7. truthful notification/attention state where it changes action.

Full authorized breadth remains reachable through:

- contextual links;
- the current object;
- Explore Klinikos;
- governed workflows;
- administration/settings for expert functions.

Never simultaneously show:

- mega top navigation;
- full module sidebar;
- local subnav;
- 20-card dashboard;
- permanent assistant panel;
- architecture diagram.

The shell must adapt to the person’s active role and context without altering server authority.

---

# 5. LIVING HOME / ECOSYSTEM DASHBOARD

Living Home is the adaptive front door, not a KPI dashboard and not a five-plane architecture poster.

The top-level question remains:

> **WHAT NEEDS TO HAPPEN?**

For an authenticated user, Home should usually contain:

- one meaningful primary priority or an honest all-clear state;
- approximately 2–4 attention items;
- one contextual opportunity or insight if supported by real state;
- Ask Klinikos;
- role-appropriate next actions.

Example clinic-owner Home:

**Good morning. Three things need your attention.**

- `2 patients still need intake before today’s appointments.` → Review patients
- `3 completed visits are blocked by documentation.` → Resolve blockers
- `Friday afternoon has an uncovered clinical shift.` → Find coverage

Small contextual insight:

- `Saturday capacity has been underused for four weeks.` → See why

No data theater. Do not lead with “Patients 12,842 / Tasks 214 / Utilization 78%” unless a metric directly supports a decision.

The ecosystem itself should be discovered through work. The user should not be forced to understand product taxonomy.

---

# 6. THE KLINIKOS OBJECT STAGE

Introduce a consistent interaction primitive: a primary object can become the center of the workspace while preserving context.

Objects may include:

- patient;
- encounter;
- result;
- order;
- referral;
- claim;
- Grid demand;
- Grid match;
- Grid transaction;
- student;
- provider;
- organization;
- location;
- credential;
- task;
- financial exception.

When an object is on stage:

- show the minimum identity/context required;
- show what changed;
- show unfinished work;
- show current state and next permitted actions;
- preserve access to history/evidence progressively;
- keep Ask Klinikos aware of the active authorized object;
- do not expose internal architecture or unnecessary data.

---

# 7. FRONTEND / BACKEND DIFFERENTIATION

The frontend is experience, not authority.

Required execution boundary:

`USER INTENT / INPUT`
→ `AUTHENTICATED SERVER CAPABILITY`
→ `SERVER-SIDE IDENTITY / TENANT / ROLE / PURPOSE / ELIGIBILITY POLICY`
→ `DOMAIN ENGINE(S)`
→ `AUTHORITATIVE STATE / EVENT / EVIDENCE`
→ `MINIMUM-NECESSARY PRESENTATION DTO`
→ `FRONTEND EXPERIENCE`

The frontend may show:

- status;
- reason in user-safe language;
- evidence summary;
- permitted next actions;
- progress;
- blockers;
- route continuity.

The frontend must not contain or reveal unnecessary:

- proprietary Grid ranking weights;
- hidden Zumi prompts/orchestration;
- fraud/risk heuristics;
- security controls;
- internal pricing/margin formulas;
- unreleased strategy;
- unnecessary PHI/PII;
- raw ORM/domain objects;
- privileged integration details.

Create an optional **System X-Ray** / architecture presentation for authorized design/engineering/investor/enterprise demonstration contexts. It must be visually and permission-semantically separate from normal clinical/operational use.

---

# 8. USER ROUTES AND EXPECTED OUTCOMES

Every major user class must receive a purpose-built route through the same system. These are presentation defaults; server authorization remains authoritative.

## 8.1 Anonymous visitor / prospective buyer

### First experience

`Landing / Living public experience → state problem or explore use case → receive public-safe value → understand next step → create identity / schedule / purchase only when persistence or transaction matters`

### Visible language

- What are you trying to improve?
- What is breaking in your practice?
- What do you need?

### Expected outcome

Within five seconds: understand what Klinikos helps accomplish.

Within thirty seconds: experience useful value without reading a module catalog.

Within a few minutes: reach a clear qualified route such as clinic assessment, Grid discovery, EDU exploration, demo, account creation, or partner contact.

## 8.2 Patient / member

Default navigation:

`Home · Appointments · Forms · Messages · Account`

Possible contextual access to results, payments, instructions or care plans when authorized.

### Route

`Home → next required action → appointment/forms/message/result/payment → confirmation → future care`

### Expected outcome

The patient should always know:

- what is next;
- what they need to complete;
- when/where care occurs;
- whether the clinic needs something from them;
- how to contact the clinic;
- what they owe when payment truth exists.

Never expose internal clinic operations, revenue engines, Grid architecture, staff queues, or administrative machinery.

## 8.3 Caregiver / proxy / guardian

### Route

`Identity → verified relationship / permitted patient context → limited patient actions → audit / expiry`

### Expected outcome

Help the person perform only the actions legitimately delegated to them, with clear indication of whose account/patient context they are acting for.

## 8.4 Front desk

Default navigation:

`Home · Today · Patients · Follow-up · Tasks`

### Primary route

`Home → Today → arrival / registration readiness → missing item resolution → rooming/handoff → next patient`

Secondary:

`Follow-up → callback / reschedule / paperwork request → outcome recorded`

### First viewport

- arrivals/check-ins;
- schedule exceptions;
- registration blockers;
- minimum necessary administrative context;
- assigned follow-up.

### Expected outcome

Front desk can run the day without seeing unnecessary clinical detail and without asking multiple people what needs to happen next.

## 8.5 Medical Assistant

Default navigation:

`Home · Today · Patients · Intake · Tasks`

### Route

`Patient ready → reason for visit → vitals → medications/allergies reconciliation → structured symptoms/screens/body context → unresolved provider questions → handoff`

### Expected outcome

The MA completes delegated intake efficiently, can distinguish patient-reported from staff-observed information, and hands the provider a clear encounter-specific snapshot.

## 8.6 LPN

Default navigation may resemble MA/RN but authority differs.

### Expected outcome

The LPN sees work appropriate to profession, assignment, organization, location and policy. The interface must never imply independent authority simply because a control exists.

## 8.7 RN

Default navigation:

`Home · Today · Patients · Care · Tasks`

### Route

`Assigned patient/work → nursing assessment/delegated workflow → care action → communication/escalation → completion / provider handoff`

### Expected outcome

The RN sees clinically relevant work and escalation needs without physician-only or unrelated administrative noise.

## 8.8 Physician / NP / PA / authorized clinician

Default navigation:

`Home · Today · Patients · Care · Results`

### Core Current Visit route

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

### First viewport answers

- Who is this patient?
- Why are they here?
- What changed?
- What did staff already do?
- What requires my judgment?

### Expected outcome

The clinician practices medicine in one continuous encounter environment without navigating the backend architecture.

Close Visit must show unresolved clinical, order/result, documentation, coding, follow-up, attestation or other required items truthfully.

## 8.9 Biller

Default navigation:

`Home · Money · Readiness · Follow-up · Tasks`

### Route

`Revenue attention → exact stop point → evidence/documentation/coding/claim state → assigned action → updated financial truth`

### Expected outcome

The biller can identify where legitimate revenue stopped moving and what action is required without reverse-engineering the clinical chart.

## 8.10 Coder

Default navigation:

`Home · Coding · Evidence · Review · Tasks`

### Expected outcome

The coder sees code candidates linked to supporting documentation/evidence, correct date-of-service terminology context, gaps requiring human resolution, and a clear human-review state. AI suggestions remain suggestions.

## 8.11 Care coordinator / case manager

Default navigation:

`Home · Patients · Follow-up · Referrals · Tasks`

### Route

`Unfinished care → referral/order/authorization/follow-up state → contact / coordination → evidence of next state → closure when actually complete`

### Expected outcome

No referral, result, follow-up, authorization or longitudinal case progression disappears simply because it was initiated.

## 8.12 Quality / compliance / assurance user

Default navigation:

`Home · Quality · Patients · Review · Referrals`

### Expected outcome

See plain-language evidence gaps and items needing review first. Expert authorized drilldowns can reveal effective windows, provenance, policy/rule references and review history without exposing proprietary engine internals.

## 8.13 Clinic owner / practice manager

Default navigation:

`Home · Today · Money · Grid · Team`

### Route

`Home → highest-value operational issue → responsible workflow → result → trend/opportunity → expansion when justified`

### Expected outcome

The owner should think:

> **This organizes my business.**

They should quickly understand:

- what needs attention;
- who owns it;
- where capacity is unused;
- where revenue is blocked;
- where staffing/resources are insufficient;
- what Klinikos already handled;
- what still requires a human.

Do not grant unrestricted clinical access merely because the person is an owner.

## 8.14 Multi-location / enterprise administrator

Default navigation:

`Home · Network · Sites · Performance · Governance`

### Expected outcome

See cross-location exceptions and organizational patterns rather than drowning in local operational detail.

They should be able to answer:

- which sites need help;
- where capacity exists;
- where performance is slipping;
- which integrations/credentials/configurations are blocking operations;
- where enterprise intervention is required.

## 8.15 Student / learner

Default navigation:

`Home · Learn · Practice · Progress · Opportunities`

### Route

`Learn → practice/simulation → demonstrate → human review → competency evidence → placement → authority/credential checks → eligible opportunity`

### Expected outcome

The learner knows what to learn next, can practice in realistic synthetic environments, receives understandable feedback, sees what has been demonstrated versus merely attempted, and can progress toward legitimate opportunities without the system pretending education grants licensure or clinical authority.

## 8.16 Instructor / preceptor

Default navigation:

`Home · Cohorts · Today · Review · Outcomes`

### Route

`Cohort → learner activity → submitted evidence → rubric/review → human competency decision → next learning/placement state`

### Expected outcome

Manage teaching and review efficiently, identify who needs intervention, and make human decisions clearly distinct from AI assistance.

## 8.17 School / institution administrator

Default navigation:

`Home · Programs · Cohorts · Placements · Outcomes`

### Expected outcome

Understand enrollment, participation, competency evidence, placements, instructors, capacity and outcomes without needing a conventional LMS maze.

## 8.18 Grid individual professional

Default navigation:

`Home · Opportunities · Availability · Profile · Activity`

### Core language

`I NEED` / `I HAVE`

### Route

`Intent → requirements → eligibility → available matches/opportunities → inspect → offer/request → agreement → booking/reservation → fulfillment evidence → financial/reputation consequence`

### Expected outcome

Find only opportunities the person can legitimately pursue, understand why a match is relevant, manage availability, complete governed transactions and build verified professional value over time.

## 8.19 Grid organization / clinic / resource owner

Default navigation:

`Home · Needs · Capacity · Transactions · Organization`

### Expected outcome

Express real demand or unused capacity in ordinary language, receive governed matches, manage offers/agreements/bookings, confirm fulfillment, and understand financial/operational consequences.

## 8.20 Vendor / supplier / healthcare service business

### Expected outcome

Present verified capabilities and availability, receive appropriate demand, respond to governed opportunities, manage agreements/delivery/payment evidence where supported, without receiving unnecessary patient or organization-private data.

## 8.21 Lab / imaging / external clinical partner operations

### Expected outcome

Where partner-facing interfaces exist, surface transport/acceptance/reconciliation exceptions, orders/results requiring operational action, and corrected/amended states without pretending connector transport equals clinical closure.

## 8.22 Developer / integration partner

Default navigation:

`Overview · Credentials/Apps · Documentation · Events · Health`

### Expected outcome

Understand the supported external contract, authenticate appropriately, see truthful environment/connection state, test integrations safely, inspect their own events/errors, and never receive internal proprietary implementation details merely because they integrate.

## 8.23 Internal Klinikos operations / support

### Expected outcome

Support customers through audited, purpose-limited tooling. Internal support capability must not become a universal bypass around tenant, clinical, privacy, payment or credential authority.

---

# 9. CLINIC OS — FULL FRONTEND CONTRACT

Clinic OS is the operational backbone for an organization.

Major experience surfaces include:

- Today / schedule operations;
- patient registry;
- registration / intake readiness;
- tasks / unfinished work;
- follow-up;
- communications;
- documents/forms;
- referrals;
- orders/results operational projections;
- team / assignments;
- location/capacity;
- owner/operator briefing;
- revenue readiness;
- specialty/organization configuration where authorized.

The product must not become a tab forest.

Every surface should prioritize:

1. what requires action now;
2. what state is blocking the next outcome;
3. who owns the action;
4. what can be deferred behind progressive disclosure.

---

# 10. CURRENT VISIT — CLINICAL CONVERGENCE

Current Visit is the provider-facing convergence surface.

## 10.1 Patient Snapshot

Show only high-value context:

- identity/MRN;
- age/DOB;
- allergies;
- medications;
- problems/risk flags;
- relevant coverage/case;
- prior encounter;
- current provider/location.

## 10.2 What Changed

Structured comparison:

`INITIAL → PREVIOUS → TODAY`

Possible dimensions:

- symptoms;
- pain;
- function/ADLs;
- range of motion;
- exam findings;
- therapy progression;
- medication change;
- new evidence;
- work status;
- order/referral/case progression.

AI may summarize deterministic change; it may not invent it.

## 10.3 Staff Handoff

Clearly separate:

- patient-reported;
- staff captured;
- unresolved;
- provider review required.

## 10.4 Today / Clinical

Use appropriate reusable clinical components rather than giant generic text areas wherever structured capture genuinely improves care or evidence.

## 10.5 Orders & Results

Show current relevant lifecycle truth. Never equate result visibility with review or order closure. Corrected/amended results can reopen review.

## 10.6 Documentation & Coding

Evidence-linked, human-review-first.

## 10.7 Close Visit

Show remaining items and exact blockers. Encounter signature does not automatically equal financial completion.

---

# 11. GRID — FULL FRONTEND CONTRACT

Grid is not a staffing page and not a category-card marketplace.

First interaction:

> **WHAT DO YOU NEED?**

or

> **WHAT DO YOU HAVE?**

The user may state intent in ordinary language.

The workspace then becomes the correct resource-exchange experience.

## 11.1 Decision order

1. what it is;
2. eligibility;
3. availability;
4. location/distance;
5. trust/requirements;
6. terms;
7. price;
8. action.

Eligibility before ranking. Price never visually outranks eligibility.

## 11.2 Map/list

When geography matters:

- real map only;
- real reviewed coordinates only;
- list and map share selection;
- no fake pins;
- unpinned inventory is labeled honestly;
- mobile deliberately switches Map / Results rather than compressing both;
- list remains the accessible source of critical information.

## 11.3 Transaction truth

Never collapse:

`MATCH != OFFER != ACCEPTANCE != RESERVATION != PAYMENT != BOOKING != FULFILLMENT != FINANCIAL OBLIGATION != SETTLEMENT`

UI shows the current relevant state, not the entire state machine.

---

# 12. EDU — FULL FRONTEND CONTRACT

EDU must feel like progression, not LMS navigation.

Learner experience centers:

- today/next;
- current program;
- current simulation/practice;
- submissions/evidence;
- feedback;
- competency progression;
- placement/opportunity readiness.

Instructor experience centers:

- cohort;
- today;
- learner exceptions;
- submissions/review;
- rubric;
- human competency decisions.

Institution experience centers:

- programs;
- cohorts;
- instructors;
- participation;
- evidence;
- placements;
- outcomes.

Virtual Clinic Lab should feel like a real synthetic clinic operating environment, not a page describing one.

---

# 13. FINANCIAL OS / BILLING / REVENUE INTEGRITY

Lead with money requiring action.

Core chain:

`PERFORMED → DOCUMENTED → CODED → CHARGE EXPECTED → CHARGE PRESENT → CLAIM READY → SENT → ACCEPTED → ADJUDICATED → PAID → RECONCILED`

The UI should show where the item stopped and who can move it.

Examples:

- Documentation blocking $X of expected revenue;
- Claim rejected — demographic mismatch;
- Patient balance ready for follow-up;
- Charge expected but not present;
- Denial needs human review.

Never label estimated opportunity as collected money.

Redirect is not payment.

---

# 14. NETWORK / REFERRALS

Lead with relationship completion and stalled work.

Referral journey may include:

`created → transmitted → receiving party acknowledged → appointment scheduled → consultation/evidence received → provider reviewed/adopted as appropriate → follow-up/closure`

Do not claim success merely because a referral object was created.

---

# 15. IDENTITY / TRUST / AUTHORITY

The user experience must clearly distinguish:

- self-described identity;
- verified identity;
- organization relationship;
- professional credential;
- role;
- privilege/capability;
- active context;
- eligibility.

Verification should be progressive and proportional to the privilege being unlocked.

A person may be student + RN + employee + Grid participant + educator + clinic owner under one Person identity. The UI changes by active context; the account does not fragment.

---

# 16. ZUMI / ASK KLINIKOS

Zumi is ambient intelligence, not another module users must open first.

Visible language should generally be:

- Ask;
- Ask Klinikos;
- context-specific outcome language.

The composer can exist globally and remain continuous across normal navigation.

Zumi should:

- understand the current route/object when authorized;
- provide value before asking unnecessary questions;
- summarize structured truth;
- explain why something needs attention;
- prepare actions;
- route to governed capabilities;
- maintain useful conversation continuity.

Zumi must not:

- fabricate state;
- become an authorization boundary;
- independently sign clinical work;
- make eligibility/payment/credential truth;
- reveal private prompts or proprietary reasoning;
- simulate “AI activity” when nothing actually happened.

---

# 17. ENTERPRISE COMMAND CENTER

Enterprise surfaces should organize multi-site complexity into a small number of actionable patterns.

Primary sections may include:

- network attention;
- locations/sites;
- workforce/capacity;
- revenue/operational exceptions;
- quality/assurance;
- integrations/readiness;
- governance/configuration.

Do not present 40 charts merely because data exists.

Conclusions first. Evidence second. Charts third.

---

# 18. INTEGRATION HUB

Integration UX must distinguish stages such as:

- not configured;
- configuration present;
- provider/vendor verified;
- sandbox/technical connection;
- UAT validated;
- production authorized;
- production proven;
- degraded;
- action required.

One green check may not collapse all of these.

Operational users should see human meaning and next actions. Expert integration operators may see deeper transport/reconciliation diagnostics when authorized.

---

# 19. CONFIGURATION / ADMINISTRATION

Advanced configuration belongs behind deliberate expert navigation.

Configuration inheritance should be understandable as:

`KLINIKOS CORE → SPECIALTY PACK → ORGANIZATION CONFIG → LOCATION OVERRIDE`

Normal users should experience the configured behavior without seeing the registry machinery.

Administrative surfaces should favor:

- clear scope;
- effective dates;
- inheritance source;
- current/changed state;
- review/approval;
- impact summary;
- audit history.

---

# 20. STATUS, LOADING, EMPTY, ERROR AND PERMISSION STATES

Every major screen must deliberately design:

- empty;
- loading;
- partial data;
- permission denied;
- role/context mismatch;
- external dependency unavailable;
- offline/degraded transport where relevant;
- validation error;
- conflict/reconciliation needed;
- human review required;
- success/complete;
- all-clear.

Rules:

- keep layout/context stable while loading;
- avoid giant skeleton-card walls;
- translate technical failure into human meaning;
- do not fake completion;
- show recovery path when one exists;
- technical detail belongs in diagnostics, not normal UI.

An honest empty state may simply say:

> **Everything important is handled right now.**

---

# 21. COMMUNICATIONS

Communication should be contextual to the underlying patient, appointment, task, Grid transaction, referral or workflow whenever possible.

Truth states include:

- permission required;
- phone verified/unverified;
- opted out;
- prepared;
- sending;
- provider-confirmed sent/delivered state where supported;
- failed.

Phone possession verification is not communication consent. Message preparation is not delivery.

---

# 22. MOBILE

Mobile is not desktop squeezed smaller.

Rules:

- role-aware bottom/top navigation as appropriate;
- first action remains visible;
- no permanently open desktop sidebar;
- Grid uses deliberate Results / Map switching;
- Current Visit prioritizes What Changed, Handoff, Today, unresolved items;
- tables recompose into readable object rows/cards where necessary;
- touch targets approximately 44px;
- forms fit without horizontal scrolling;
- Ask Klinikos can expand substantially while remaining the same conversation/context;
- preserve task continuity between desktop and mobile.

---

# 23. ACCESSIBILITY

Every major surface must be designed and tested for:

- keyboard-only operation;
- logical focus order;
- visible focus;
- semantic headings/landmarks;
- programmatic labels;
- status/error announcements;
- 200% zoom;
- 320px+ reflow;
- non-color status communication;
- reduced motion;
- target sizes;
- modal/dialog focus management;
- accessible alternatives to maps/spatial interactions;
- readable contrast in light and dark themes;
- no decorative-only carrier of important meaning.

Accessibility is a design constraint from the start, not a remediation pass.

---

# 24. INTERACTION AND MOTION

Motion is used only to communicate:

- navigation continuity;
- object selection;
- expansion/collapse;
- change in state;
- completion/progress;
- attention shift;
- understanding of hierarchy.

Do not use continuous ambient movement on operational screens.

Respect `prefers-reduced-motion`.

The most advanced Klinikos interaction should feel smooth because the workspace reorganizes around intent, not because decorative objects animate constantly.

---

# 25. DATA DENSITY

Use three intentional density modes through composition, not user-facing gimmicks:

- **Hospitality / patient** — low density, warm, guided;
- **Operational** — moderate density, action-first;
- **Clinical/financial expert** — higher density where needed, but still structured and breathable.

Do not solve dense information with smaller fonts alone.

---

# 26. LANGUAGE

Use ordinary language wherever clinical/legal precision is not required.

Prefer:

- What needs attention?
- What changed?
- Ready for review
- Missing insurance card
- Waiting for corrected result review
- Claim rejected — address mismatch
- Find coverage
- Review evidence

Avoid exposing architecture language such as:

- graph projection;
- policy engine;
- orchestration plane;
- data mart;
- knowledge node;
- event stream;

unless the authorized user is explicitly in a technical/admin context.

Clinical terminology remains precise where clinically necessary.

---

# 27. COMMERCIAL / UNICORN EXPERIENCE LAW

The product should support multiple legitimate revenue paths without making the interface feel like a sales funnel.

Potential monetization families already recognized by Klinikos include:

- operational analysis / workflow assessment;
- implementation/onboarding;
- recurring Clinic OS;
- enterprise/multi-location;
- Grid organization/professional/transaction economics where lawful;
- EDU individual/institutional economics;
- variable external usage/add-ons;
- premium integrations and services where product canon permits.

Design requirements:

- value before upsell;
- upgrade appears at a real entitlement boundary;
- preserve the user’s current intent through checkout/activation;
- never fake payment/entitlement;
- do not expose internal margin logic;
- do not use dark patterns;
- free participation may be strategically valuable for network density.

The frontend should make Klinikos feel extensible enough for enterprise and network-scale economics while remaining simple for the smallest user.

---

# 28. DEFENSIBILITY / IP / PATENT-SUPPORTING PRODUCT DOCUMENTATION

Design work must not claim that a feature is patented or patentable.

However, the product/design process should preserve potentially distinctive system concepts for later counsel review, including:

- one evolving identity across healthcare career/organization contexts;
- intent-driven recomposition of governed healthcare workspaces;
- cross-domain unfinished-work routing;
- deterministic longitudinal clinical-change presentation;
- multi-party healthcare resource composition in Grid;
- evidence-linked clinical/financial/action projections;
- education → competency → placement → eligibility lifecycle integration;
- clinical-to-financial revenue-integrity continuity;
- governed memory/knowledge applied across roles without becoming authority.

For potentially novel concepts, maintain dated architecture/design records and clearly separate public presentation from confidential implementation details.

Patent/IP strategy remains a legal/counsel workstream, not a frontend claim.

---

# 29. FIGMA / PROTOTYPE EXPECTATION

The canonical Figma system must represent the product meticulously, not as a flowchart poster.

Required artifacts include:

1. visual design tokens / typography / spacing / controls;
2. real brand usage;
3. Living Home light clinical experience;
4. role-specific Homes;
5. Front Desk Today;
6. MA/LPN/RN intake/handoff;
7. Provider Current Visit;
8. Patient chart / patient Object Stage;
9. Results review;
10. Referrals/care coordination;
11. Billing / revenue readiness;
12. Grid I NEED / I HAVE entry;
13. Grid results + real map/list composition;
14. Grid match / offer / transaction states;
15. EDU learner;
16. EDU simulation / Virtual Clinic Lab;
17. EDU instructor;
18. EDU institution;
19. Patient portal;
20. Provider longitudinal workspace;
21. Clinic owner Home;
22. Enterprise Command Center;
23. Identity/verification/profile;
24. Network/referral surfaces;
25. Insights with conclusions first;
26. Integration Hub;
27. Configuration/admin;
28. mobile versions of core routes;
29. loading/error/empty/permission states;
30. System X-Ray / backend architecture presentation separated from normal user UI.

Prototype wiring must let a reviewer click representative journeys rather than inspect disconnected artboards.

At minimum prototype:

### Front desk
`Home → Today → patient blocker → resolve → handoff`

### Staff
`Today → patient → intake → unresolved question → provider handoff`

### Provider
`Today → Current Visit → What Changed → result review → plan → Close Visit`

### Owner
`Home → revenue blocker → responsible workflow → resolved state`

### Grid
`I NEED → requirement → eligible results → inspect → offer/request → booking/next state`

### EDU
`Home → practice → submit evidence → review → progress → opportunity`

### Patient
`Home → required form → appointment → message/account`

### Enterprise
`Home → site exception → evidence → assigned intervention`

---

# 30. ROUTE / SCREEN HANDOFF CONTRACT

For every major route or screen document:

- user role;
- active context;
- user goal;
- expected successful outcome;
- primary action;
- secondary actions;
- required server state;
- minimum data;
- optional/progressive data;
- authorization/eligibility rule family;
- loading state;
- empty state;
- error state;
- permission state;
- external dependency;
- manual fallback;
- mobile behavior;
- accessibility behavior;
- ambient Zumi context;
- audit/financial consequence where applicable;
- next useful route.

A screen is not complete until those states are deliberately designed.

---

# 31. PRODUCT TRUTH / NO UI FICTION

Do not design or implement UI that implies unsupported product truth.

Never fake:

- patients;
- live marketplace supply;
- distance;
- availability;
- result review;
- referral closure;
- credential verification;
- payment;
- payout;
- message delivery;
- integration connectivity;
- AI execution;
- claim acceptance;
- fulfillment;
- quality completion.

Explicit synthetic/demo environments are allowed and must be labeled/governed accordingly.

Every consequential visible state must map to:

- authoritative real data;
- a clearly identified simulated reference state;
- or a truthful unavailable/pending state.

---

# 32. FIVE-SECOND / THIRTY-SECOND TEST

Within approximately five seconds, every normal user should understand:

- where they are;
- what matters;
- what to do next.

Within approximately thirty seconds, they should understand:

- what Klinikos already handled;
- what still requires them;
- how to get more detail;
- how to ask Klinikos for help.

If a screen fails this test, simplify it before adding more capability.

---

# 33. ANTI-REGRESSION RULES

Do not reintroduce without explicit product approval:

- video-game aesthetics;
- neon/cyberpunk clinical UI;
- dark-first requirement for normal healthcare work;
- architecture diagrams as normal dashboards;
- giant ecosystem balls/orbits on operational screens;
- 8+ permanent primary destinations for a normal role;
- all modules exposed in a sidebar;
- KPI-card walls as default Home;
- separate Zumi module required before asking for help;
- fake maps/pins;
- price before eligibility in Grid;
- fake unread/payment/provider/AI states;
- role switchers that bypass authenticated context;
- mandatory rose/flower decoration;
- micro-text to fit excessive data;
- decorative animation that competes with care;
- owner/admin presented as automatic unrestricted clinical authority;
- duplicate identity/domain/financial stores created for visual convenience.

---

# 34. EXPECTED FINAL PRODUCT FEEL

Klinikos should feel like:

- a world-class private healthcare institution;
- a modern clinical operating system;
- a trusted financial/operational instrument;
- an intelligent assistant that understands context;
- a calm workspace people can use all day;
- an enterprise-grade network that still feels simple to an individual user.

It should not feel like:

- a video game;
- a cyber operations center;
- an architecture presentation;
- a generic Bootstrap admin template;
- a hospital-blue legacy portal;
- a collection of acquisitions stitched together;
- a dashboard designed to show off every feature.

The sophistication is proven by how little complexity the user has to manage.

---

# 35. IMPLEMENTATION ORDER

Do not attempt a big-bang visual rewrite.

Recommended dependency order:

1. reconcile source-of-truth visual law;
2. establish design tokens / light clinical foundation / typography;
3. establish shared shell and role navigation;
4. Living Home / role Homes;
5. Today / front desk / staff handoff;
6. Current Visit clinical convergence;
7. patient/provider longitudinal surfaces;
8. Money / revenue readiness;
9. Grid I NEED/I HAVE + list/map + transaction progression;
10. EDU progression + simulation + instructor/institution;
11. owner/enterprise/network/insights;
12. identity/verification/admin/integration expert surfaces;
13. mobile convergence;
14. accessibility hardening;
15. visual/browser acceptance;
16. Figma-to-code parity and component/route documentation.

Each implementation tranche must preserve server authority, truth, tenant isolation, confidentiality and current domain models.

---

# 36. ACCEPTANCE OUTCOME

The universal frontend is successful when representative users can truthfully accomplish their next outcome without learning Klinikos architecture:

- patient completes what is required and understands next care;
- front desk runs arrivals and blockers;
- MA/LPN/RN completes role-appropriate handoff/work;
- provider performs a continuous visit and resolves required clinical work;
- biller/coder moves revenue work from the exact blocker;
- coordinator closes real follow-up/referral loops;
- owner understands and acts on operational/revenue/capacity problems;
- enterprise admin sees network-level exceptions and intervention paths;
- student progresses from learning to evidence and legitimate opportunity;
- instructor/institution manages review and outcomes;
- Grid participant expresses need/capacity and reaches a governed transaction path;
- patient data and private logic remain protected;
- Zumi assists without becoming authority;
- external and financial states remain truthful;
- light clinical professionalism remains the default operational visual language;
- the product is visibly one Klinikos despite many user types and engines.

North star:

> **A calm healthcare frontend above a powerful governed ecosystem: one identity, many legitimate roles, many routes, shared truth, shared trust, shared financial/evidence state, and intelligence that makes the next useful action obvious.**
