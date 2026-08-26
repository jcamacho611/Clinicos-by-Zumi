# Klinikos Active Experience Envelope, Screen Truth, Zumi, and AI Data Governance

Status: CANONICAL ARCHITECTURE PRIORITY

Legal status: COUNSEL REVIEW REQUIRED for agreement language, privacy notices, PHI processing, consent mechanics, and jurisdiction-specific implementation.

## 1. Purpose

Klinikos is universal underneath and specific to the individual on top.

The platform may contain Care, Grid, Network, EDU, Money, patient experiences, clinical/EHR capabilities, telemedicine, referrals, integrations, enterprise administration, identity, trust, audit, and many other systems. A user must never receive the whole platform merely because those capabilities exist.

Every active user-facing screen must be generated inside an Active Experience Envelope and must resolve to a Screen Experience Contract.

A screen is not considered production complete merely because its component renders or its route is protected. It must declare:

- what is visible by default;
- what is intentionally hidden;
- what can be discovered;
- what can be promoted;
- what eligibility rules apply;
- what entitlement rules apply;
- what authority rules apply;
- what data may be projected to the screen;
- what minimum-necessary limits apply;
- what actions are available;
- what Zumi may read;
- what Zumi may infer;
- what Zumi may recommend;
- what Zumi may prepare as a draft;
- what Zumi may execute through authorized tools;
- what Zumi is forbidden to do;
- what data classes may enter AI processing;
- what data classes may not enter AI processing;
- the permitted processing purpose;
- the applicable agreement or processing basis;
- the PHI gate;
- the model-training rule;
- audit and provenance requirements;
- the commercial-targeting boundary;
- denied, blocked, loading, empty, and error behavior;
- mobile behavior; and
- accessibility behavior.

If an active user-facing route cannot resolve to one of these contracts, the production release is blocked until the route is classified or an explicit reviewed exception is approved.

## 2. The Active Experience Envelope

Signup is the first context-resolution event. It is not permanent classification.

The Active Experience Envelope is continuously recomputed from the current authorized context. Relevant inputs include:

1. identity;
2. active relationship;
3. active organization;
4. active location;
5. role;
6. verified credentials;
7. authority and delegation;
8. current purpose;
9. entitlements;
10. current intent;
11. current workflow;
12. current resource or work object;
13. authorized patient or case context;
14. network state;
15. temporal context;
16. jurisdiction;
17. policy; and
18. risk state.

The envelope produces only the surface the person needs now:

- primary workspace;
- primary action;
- primary navigation;
- allowed secondary capabilities;
- minimum-necessary data projection;
- allowed actions;
- Zumi tools;
- notifications;
- contextual promotions;
- verification requests;
- blocked states;
- context switches; and
- audit requirements.

The same identity may therefore have completely different experiences in different contexts without creating separate accounts.

## 3. State Separation

The following states must never be collapsed:

EXISTS
!= DISCOVERABLE
!= PROMOTED
!= ELIGIBLE
!= ENTITLED
!= AUTHORIZED
!= VISIBLE DATA
!= ACTIONABLE NOW

A capability may exist in Klinikos without being shown to a user.

A capability may be discoverable without being promoted.

A capability may be promoted because it appears useful without the user being eligible to perform its regulated action.

A user may be eligible without the organization having purchased the required capability.

An organization may be entitled while a particular individual lacks authority.

A user may be authorized to a workspace but only to a narrow projection of data within it.

A user may be authorized and entitled but still have no actionable work at that moment.

This separation is required for simplicity, privacy, security, commercial truth, and clinical safety.

## 4. Promotion, Entitlement, and Authority

### Promotion

Promotion answers:

> What should Klinikos teach, suggest, or surface because it is likely to help this person now?

Promotion can be driven by non-sensitive intent, lifecycle stage, operational friction, previously chosen goals, and appropriately governed activity.

Promotion never grants access or truth.

### Entitlement

Entitlement answers:

> What capability has this person or organization been granted under a free tier, purchase, subscription, program, contract, invitation, or other commercial rule?

Entitlement is not authority.

### Authority

Authority answers:

> What may this person actually do in this context on this resource for this purpose?

Authority may depend on identity, organization, location, relationship, role, credential, privilege, assignment, delegation, patient relationship, consent, jurisdiction, policy, purpose, and time.

Authority is server-side and deterministic. Zumi may explain authority but may not manufacture it.

## 5. Zumi Is a Governed Intelligence Layer

Zumi is expected to be present throughout Klinikos without becoming a separate chatbot application.

Every screen contract must declare six distinct Zumi modes.

### Read

Zumi may read only data already permitted by the Active Experience Envelope and the screen contract.

The model does not receive the entire account, organization, chart, Grid graph, or company dataset merely because those systems exist.

### Infer

Zumi may infer non-authoritative working hypotheses such as:

- likely intent;
- missing workflow step;
- possible operational blocker;
- documented change needing review;
- likely learning gap;
- possible Grid fit after deterministic eligibility; or
- likely next action.

An inference remains an inference. It cannot silently become an authoritative fact.

### Recommend

Zumi may recommend an action that is inside the user's permitted universe.

Recommendations must not override hard eligibility, patient-safety rules, credential rules, payment truth, organization authority, or security policy.

### Prepare Draft

Zumi may prepare drafts where the screen contract permits it, including:

- messages;
- documentation drafts;
- summaries;
- application text;
- handoff notes;
- implementation plans;
- education feedback; or
- billing follow-up drafts.

A draft must remain distinguishable from a signed, submitted, sent, completed, settled, verified, or otherwise authoritative state.

### Execute Through Authorized Tools

Zumi may invoke a governed tool only when the action is allowed by server-side policy and any required confirmation or human authority has been satisfied.

Tool invocation never changes the source of authority.

### Forbidden

Across Klinikos, Zumi may never:

- grant itself or a user authority;
- manufacture verified facts;
- bypass deterministic eligibility;
- override server-side permissions;
- invent clinical findings;
- invent payment or settlement state;
- convert a claim into a verified credential;
- silently cross organization contexts;
- silently expand the data scope;
- sign clinical documentation;
- create professional licensure or privilege;
- make a pending financial state appear settled; or
- use sensitive clinical information for generic commercial targeting.

## 6. AI Service Processing Is Purpose-Limited, Not Blanket Consent

Klinikos must not rely on a vague statement such as:

> By using Klinikos, you agree that all of your data may be sent to AI.

That is not the intended architecture.

The correct model is purpose-limited service processing.

Where an AI-supported capability is used, the system must be able to identify:

- the requested service purpose;
- the data class;
- the minimum data reasonably necessary;
- the screen and active context;
- the agreement or notice governing the processing;
- the approved subprocessor or model rail;
- whether PHI is allowed;
- whether a BAA or other healthcare agreement is required;
- the actor;
- the timestamp; and
- relevant output/tool provenance.

Ordinary service acceptance does not grant an unrestricted right for general-purpose model training.

The default rule is:

**General-purpose provider model training on user/customer data is not permitted by default.**

If a future optional training or research program is ever offered, it requires separate, explicit, lawful opt-in with its own purpose, data classes, retention, withdrawal, and jurisdictional terms. Consent must not be inferred from ordinary product use.

## 7. PHI and Healthcare Data

Public Zumi is not a PHI entry point.

PHI-capable AI processing is allowed only in an explicitly approved healthcare workflow that satisfies the applicable contractual, security, vendor, policy, and legal gates.

Depending on the facts, that may include:

- organization service agreement;
- BAA where legally required;
- approved AI vendor/subprocessor configuration;
- permitted healthcare purpose;
- authenticated and authorized user;
- patient or case context;
- minimum-necessary data projection;
- screen contract that explicitly permits that data class; and
- any additional notice or consent required for the specific activity, such as recording or transcription.

The presence of a model API does not create HIPAA compliance.

The presence of an accepted Terms of Use document does not replace a BAA.

The presence of patient data in the database does not mean it is permitted in every AI rail.

## 8. Operational Personalization Is Not Commercial Targeting

Klinikos may need sensitive data to perform an authorized healthcare workflow. That does not make the same data valid marketing context.

Examples of permitted operational use may include:

- identifying an assigned result that needs provider review;
- preparing a draft note from authorized encounter evidence;
- reminding a patient about an authorized form;
- identifying a billing-documentation blocker; or
- assisting with an authorized referral workflow.

Those facts must not automatically become signals for generic upsell, advertising, or product promotion.

The default rule is:

**Clinical and PHI context is not commercial-targeting context.**

Product promotion should instead use appropriate non-sensitive signals such as expressed business intent, organization-level operational friction where permitted, current entitlement, lifecycle state, requested capability, or public acquisition context.

## 9. Screen Truth Examples

### 9.1 Public Visitor

Visible:

- problem-specific public value;
- public-safe proof;
- safe discovery;
- Ask Klinikos;
- next useful action.

Hidden:

- account data;
- patient records;
- organization internals;
- restricted Grid information;
- private product secrets.

Zumi may:

- interpret safe public intent;
- answer using public-safe information;
- route to a relevant problem page;
- recommend signup when persistence or governed action would create value.

Zumi may not:

- accept PHI as an approved workflow;
- imply clinical authority;
- expose protected information;
- silently carry raw sensitive prompts into URLs or unrelated systems.

### 9.2 Signup

Visible:

- only the information needed for the next step;
- why Klinikos needs it;
- the applicable agreement and AI-processing notice;
- the relevant next experience.

Hidden:

- the entire application catalog;
- irrelevant role questions;
- private organization workspaces;
- systems that are not yet relevant.

Signup seeds an experience. It does not permanently classify the user.

### 9.3 Registered Nurse at Clinic A

When working as a clinic employee, the envelope can contain:

- RN relationship;
- Clinic A organization;
- assigned location;
- assigned shift;
- patient-care purpose;
- permitted clinical scope.

Visible may include:

- Today;
- assigned patients;
- tasks;
- care coordination;
- permitted handoff tools.

Hidden may include:

- Clinic A owner financial configuration;
- unrelated patients;
- enterprise administration;
- unrelated EDU administration;
- another organization's patient data.

Zumi may summarize assigned work and prepare permitted drafts. It may not use the nurse's professional role to gain cross-patient or cross-organization access.

### 9.4 Same RN Seeking Weekend Work

The identity is unchanged. The active context changes.

Visible:

- Grid opportunities;
- availability;
- professional profile;
- eligibility blockers;
- relevant training.

Hidden:

- Clinic A patient data;
- Clinic A internal operational information;
- unrelated organization workspaces.

Zumi may help interpret the user's work goal and surface eligible opportunities after hard eligibility. It may not transfer clinical context into Grid ranking.

### 9.5 Same RN Seeking Injector Training

Visible:

- relevant EDU options;
- prerequisite state;
- learning progress;
- career pathway.

Zumi may recommend training based on the user's stated career goal and approved professional profile context. Training completion may not be represented as licensure, credentialing, or scope-of-practice authority.

### 9.6 Same Person Opening a Practice

The person may claim an organization relationship. That claim is not ownership authority.

Visible before verification:

- claim state;
- required evidence;
- verification progress;
- next permitted step.

Visible after appropriate authority is established may expand to:

- owner operating picture;
- team;
- Money;
- Grid;
- entitled clinic operations.

Zumi may help explain the process and promote relevant operating capabilities. It may not approve ownership based on model judgment.

### 9.7 Provider Home

Visible:

- the highest-priority assigned clinical work;
- results requiring review;
- visits needing documentation;
- next provider action;
- Ask Klinikos.

Hidden:

- unrelated patients;
- enterprise configuration;
- unrelated modules;
- raw architecture.

Zumi may surface priority, summarize authorized work, and prepare drafts. It may not sign notes, order, diagnose, prescribe, or expand its own data access.

### 9.8 Current Visit

Visible:

Patient Snapshot
→ What Changed
→ Staff Handoff
→ Today
→ Clinical
→ Assessment & Plan
→ Orders & Results
→ Documentation & Coding
→ Close Visit

The user sees one encounter. The system may coordinate many backend engines.

Zumi may:

- summarize evidence;
- identify documented longitudinal change;
- prepare a structured documentation draft;
- surface missing documentation;
- prepare coding candidates for human review;
- stage authorized workflows.

Zumi may not:

- invent a physical finding;
- invent laterality;
- invent a diagnosis;
- invent a clinical change;
- sign a note;
- autonomously order or prescribe;
- manufacture documentation to support a higher code.

### 9.9 Clinical Handoff

The same patient may produce different data projections for an MA, LPN, RN, and provider.

The system must preserve who performed what work and must not convert broad read access into broad authorship.

Zumi may identify missing preparation or prepare a handoff summary. It may not enlarge scope of practice or attribute one person's work to another.

### 9.10 Biller / Money

Visible:

- Ready / Needs Attention;
- claim state;
- documentation blocker;
- payment or obligation evidence;
- next financial action.

Hidden by default:

- full clinical narrative that is unnecessary for billing purpose;
- clinical authoring controls;
- unrelated patient information.

Zumi may identify documentation gaps and prepare a follow-up or appeal draft. It may not manufacture documentation, finalize clinical authorship, or mark an unverified payment as paid.

### 9.11 Clinic Owner

Visible:

- one operating picture;
- operational priorities;
- money and capacity attention;
- team exceptions;
- Grid and entitled operational capabilities.

Patient-level clinical details remain hidden unless separate role, purpose, and authority justify them.

Being the business owner is not a universal clinical-access token.

### 9.12 Enterprise Admin

Visible:

- hierarchy;
- policy;
- entitlements;
- integrations;
- reliability;
- audit summaries.

Patient-level data remains hidden by default.

Enterprise administration is not clinical authority.

### 9.13 Telemedicine

Telemedicine remains inside the same encounter rather than creating a duplicate chart.

Zumi may use an approved transcript or scribe stream only when the required notice, consent, contractual, and technical gates have been satisfied.

Unconsented audio or video may not silently become AI context.

## 10. Data Scope on Context Switch

A context switch is a security and privacy event, not merely a UI change.

When a user moves from Clinic A to Grid, Clinic B, EDU, a patient relationship, or another organization, Klinikos must recompute:

- navigation;
- entitlements;
- authority;
- data projection;
- Zumi context;
- allowed tools;
- notifications;
- promotions;
- audit requirements.

Cached or previously loaded data from the old context must not remain actionable merely because the browser still possesses it.

## 11. Agreements and Provenance

Where an AI-enabled screen processes user or organization data, the platform must preserve enough evidence to determine the applicable processing basis.

The intended provenance record includes, as applicable:

- agreement key;
- agreement version;
- document hash when signed;
- actor;
- timestamp;
- surface;
- processing purpose;
- data class;
- organization context;
- relevant patient or case context identifier when authorized;
- model/provider/tool provenance; and
- outcome or tool-execution audit reference.

The user-facing agreement language must be understandable. The backend evidence must be precise.

## 12. Agreement Principle

The intended user understanding is approximately:

> When you use a Zumi-powered feature, Klinikos may send the minimum information needed for that feature to approved AI providers and other approved subprocessors so the requested service can work. We do not treat ordinary product acceptance as permission to use all of your information for unrestricted general-purpose AI training. Health information may be processed by AI only in specifically approved healthcare workflows with the required contractual, security, privacy, and authorization controls.

This is an architectural intent statement, not final legal advice or final production terms. Final language and workflow mechanics require qualified legal/privacy review for the applicable jurisdictions and use cases.

## 13. Release Gate

A screen is not production complete unless:

1. it maps to an approved Screen Experience Contract;
2. the Active Experience Envelope can resolve the screen's context;
3. server-side authorization exists for consequential actions;
4. the minimum-necessary data projection is defined;
5. Zumi read/infer/recommend/draft/execute/forbidden boundaries are defined;
6. AI allowed/prohibited data classes are defined;
7. the processing purpose and agreement key are defined;
8. the PHI gate is defined;
9. commercial-targeting boundaries are defined;
10. audit and provenance are defined;
11. blocked, denied, loading, empty, and error states are designed;
12. mobile behavior is designed;
13. accessibility behavior is designed; and
14. tests cover the relevant contract.

Unclassified routes are release blockers, not acceptable silent defaults.

## 14. Implementation Authorities

Machine-readable authorities:

- `src/lib/experience-envelope-canon.ts`
- `src/lib/screen-experience-contracts.ts`
- `src/lib/legal/ai-service-processing-policy.ts`
- `src/lib/operating-network-canon.ts`

Tests:

- `tests/experience-envelope-canon.test.ts`
- `tests/screen-experience-contracts.test.ts`
- `tests/ai-service-processing-policy.test.ts`
- `tests/operating-network-canon.test.ts`

These contracts define platform requirements. Individual screen implementations must progressively be mapped to them and verified before being classified as production complete.
