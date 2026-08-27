# KLINIKOS — JOURNEY-STAGE DESIGN ACCEPTANCE CANON

Version: `2026-08-27.1`
Status: `AUTHORITATIVE FRONTEND / UX ACCEPTANCE LAW`

This canon converts the founder-approved journey-stage design package into repository law.

It governs **how each stage should feel and what the interface must communicate**. It does not override runtime truth, security/authorization law, domain authority, or specialist clinical/financial/identity rules.

The product-wide law remains:

> **The complexity belongs to Klinikos, not to the person using Klinikos.**

## 1. Design-system authority

### Marble

Light mode.

- warm ivory / bone / limestone surfaces;
- graphite text;
- restrained oxblood / rose accent;
- clinical work should generally prefer Marble where a bright, calm surface improves judgment.

### Obsidian

Dark mode.

- near-black / black-cherry / oxblood-shadow depth;
- warm ivory text;
- ember / wine accent;
- never generic AI purple or hospital cyan as primary identity.

### Living Edge

Living Edge is the **scarce rose/ember attention signal**.

Use it only for meaningful attention, active consequential work, unresolved important state, or critical context. If everything glows, nothing matters.

### Forbidden visual defaults

Do not use:

- generic hospital blue as brand identity;
- stock smiling-doctor hero imagery;
- stock-photo gradients;
- neon;
- glass morphism everywhere;
- purposeless floating animation;
- giant KPI-card walls as the default authenticated experience;
- a new logo authority or AI-generated brand mark.

## 2. Universal first-viewport law

Every material screen should answer as much as the context requires, with priority on these questions:

1. **WHERE AM I?**
2. **WHY AM I HERE?**
3. **WHAT MATTERS?**
4. **WHAT CAN I DO?**
5. **WHAT HAPPENS NEXT?**

Authenticated operating surfaces additionally make **WHAT CHANGED?** and **WHAT NEEDS ME?** easy to resolve.

## 3. Stage 1 — Public routes / problem entry

The visitor may have arrived from search, referral, campaign, Grid share, invitation, comparison route, or direct navigation. They are skeptical and have seen generic healthcare-software marketing before.

### The page must

- answer the specific problem represented by the route in the first viewport;
- use the H1 as a problem answer, not an abstract tagline;
- provide one concise credibility statement;
- make Zumi available without behaving like an aggressive pop-up;
- show value before making `Schedule a demo` the dominant action;
- keep primary navigation bounded to approximately five high-value items;
- preserve the same hierarchy on mobile;
- use touch targets of at least 44px.

### The page must not

- open with a generic `AI-powered healthcare platform` claim;
- bury the user's problem under feature catalogs;
- block the first viewport with consent/UI chrome unrelated to the requested value;
- force the visitor to understand Klinikos's internal module taxonomy.

### Typography

- large, confident sentence-case H1;
- supporting text readable at a glance;
- no long feature paragraphs before the value proposition lands.

### Zumi entry

Zumi should feel closer to a premium intent/search experience than a corner chatbot widget.

## 4. Stage 2 — Zumi conversation

The first conversational impression must communicate:

> **This system understands me.**

Not:

> Please select from the following options.

### Visual behavior

- clean conversational surface;
- prose when prose helps;
- structured interface when structure helps;
- never a wall of text by default;
- quick starts as tappable suggestions/chips where useful;
- Zumi must not visually imitate ChatGPT;
- Zumi must not look like a generic customer-support bubble;
- Zumi is Klinikos Intelligence.

### Motion

- fast, restrained response appearance;
- no theatrical loading behavior;
- reduced-motion settings are honored.

### Living Edge

Use only when Zumi surfaces something that genuinely requires attention.

### Mobile

- conversation is a first-class full-screen experience;
- keyboard must not obscure the active input or critical content;
- composer remains usable above the keyboard.

## 5. Stage 3 — Value preview before signup

The user has not created an account. Klinikos is proving relevance before asking for persistence.

The interface must communicate:

> **This is already useful for you specifically.**

### Acceptance

- use real interface elements in an explicitly previewed/public-safe state;
- do not substitute a marketing screenshot for product value;
- do not blur the useful result simply to manufacture a paywall;
- allow content to appear calmly rather than animating from multiple directions;
- when persistence/authentication becomes necessary, explain that boundary in one sentence with one clear CTA;
- locked state is calm, not punitive.

Preview state must use the same underlying design system as live state.

## 6. Stage 4 — Account creation

The user has decided Klinikos is worth continuing.

The interface should communicate:

> **This is quick, and we will continue from where you already were.**

### Acceptance

- ask only the information required for the next useful action;
- prefer one clear field/group at a time when it reduces cognitive load;
- do not display a demoralizing seven-step onboarding wizard when context already resolves most questions;
- SSO may be available but must not make a third-party identity brand the primary visual identity;
- legal agreement is visible and honest, not hidden in tiny gray text;
- labels remain visible after focus;
- inline errors explain exactly what to fix;
- mobile inputs use the correct keyboard/input mode;
- forward motion is subtle and stable.

## 7. Stage 5 — Identity claims

The user is telling Klinikos who they are. This is a **trust moment**, not merely a form moment.

The experience should communicate:

> **We can accept your claim as context. We verify authority when the action requires it.**

### Acceptance

- claimed identities/relationships should be visually intentional and understandable;
- explain each relationship/claim in plain language;
- do not make the user feel they are filling a government form unless a regulated verification step actually requires that formality;
- unverified is neutral;
- verified is calm and confident;
- pending does not look like failure;
- claims never visually masquerade as verified authority.

## 8. Stage 6 — First Grid participation

This is a critical activation moment. The person should feel:

> **I am now participating in something real.**

### Acceptance

- the first `I NEED` or `I HAVE` object receives meaningful visual weight;
- submission must not feel like a form disappearing into a void;
- immediately show the truthful state of what Klinikos is doing with it;
- when a relevant result exists, surface it immediately;
- if no match exists, explain that the need/supply state is active and what happens next;
- do not invent a timeline if one is not known.

### Grid cards

Show only the information necessary to make the next decision, such as:

- person/resource/organization label;
- role or resource class;
- location/availability where relevant;
- governing verification/match signal when truthful;
- one dominant next action.

Do not turn ordinary cards into dense pseudo-table rows.

### Mobile

Use swipe or stacked presentation only when it improves comprehension. Never create accidental horizontal scrolling.

## 9. Stage 7 — Active Experience / Living Home

The user is now returning to Klinikos as an operating environment.

The surface should answer without requiring a query:

- **Where am I?**
- **What matters?**
- **What changed?**
- **What needs me?**
- **What should I do next?**

### Acceptance

- not a wall of KPI cards;
- not a 40-item permanent navigation tree;
- context-aware primary navigation remains bounded;
- work surfaces appear when context requires them;
- Zumi is a control plane, not a decorative sidebar;
- one genuinely critical unresolved item may receive Living Edge attention;
- everything else remains calm;
- notifications must be specific and actionable, for example `3 patients have unreviewed results`, not `3 notifications`;
- role/context transitions should feel deliberate and secure, not like an unrelated application reload.

## 10. Stage 8 — Current Visit

Current Visit is the highest-priority provider-facing clinical screen.

It must communicate:

> **Everything needed for this encounter is organized here, without unnecessary clutter.**

### Continuous workspace

- one continuous encounter workspace;
- Patient Snapshot compact, scannable, immediately relevant, and above the fold where layout permits;
- `What Changed` is a visual comparison, not a wall of copied notes;
- deltas receive emphasis;
- unchanged state becomes visually quieter;
- `Today` remains visually distinct from historical context;
- staff handoff is visually distinct from provider-authored clinical documentation;
- Zumi assistance is present but nonintrusive;
- a provider must be able to complete the encounter without using Zumi if they choose.

### Clinical documentation

- structured fields where structure matters;
- narrative where narrative matters;
- do not use a generic textarea as a substitute for a clinical tool;
- do not over-structure narrative care merely to make the UI look sophisticated.

### Body map

When implemented and clinically governed:

- professional and medically appropriate;
- not cartoonish;
- precise region/laterality interaction;
- previous findings visible but visually quieter than current findings;
- underlying clinical versioning/provenance rules remain authoritative.

### Coding

- coding support follows documentation rather than interrupting the visit;
- AI/model-generated possibilities remain visibly labeled `suggested`;
- evidence/provenance should be available where technically supported;
- provider/coder may accept, edit, or reject according to authority;
- suggestion never visually becomes final billing truth by itself.

### Device law

- tablet/iPad is a first-class encounter surface;
- mobile is secondary but functional;
- desktop remains efficient for complex documentation.

### Clinical color

Marble is generally preferred for bright clinical work. Obsidian remains supported. Living Edge is reserved for genuinely consequential items, not routine completion decoration.

## 11. Stage 9 — Organization operating surface

The owner/administrator should understand:

> **Here is where the organization stands. Here is what needs attention. Here is what Klinikos found.**

### Acceptance

- unresolved work before vanity metrics;
- operational signals in plain language;
- charts only where a trend is actually the answer;
- Zumi available for free-form operational questions;
- examples of useful statements include:
  - `4 visits closed without billing readiness.`
  - `2 staffing needs remain unfilled this week.`
  - `3 referrals have no response after 7 days.`

### Klinikos 10 invitation

When the organization meets commercial/fit criteria, Klinikos 10 appears as a premium considered moment, not a popup/banner.

The surface should explain, in plain language:

- why the organization qualifies;
- what Klinikos already knows from authorized context;
- what the founding implementation changes;
- what happens next;
- what is free/network value versus paid operating implementation.

## 12. Stage 10 — EDU

The learner should feel:

> **My learning is becoming real professional progress. I know what I have proven and what comes next.**

### Acceptance

- learning path is meaningful, not merely a checklist;
- competency evidence carries professional weight without pretending to be licensure;
- Grid opportunity preview becomes visible as evidence/eligibility permits;
- connection between learning and opportunity is explicit;
- instructor presence/authority remains clear;
- Zumi never impersonates the instructor or credentialing authority.

## 13. Stage 11 — Grid professional view

A professional looking for opportunity should feel:

> **These opportunities fit what I actually bring, and I can act without starting over.**

### Acceptance

- opportunity cards provide enough information to make a real decision;
- show role/resource type, location, time/date, compensation context where lawful/available, and match/eligibility state where truthful;
- not a generic job-board list;
- expression of interest/application should reuse existing identity and evidence rather than forcing another full profile form;
- verification requirements appear before the person invests unnecessary effort;
- availability/calendar context appears when relevant.

## 14. Stage 12 — Patient experience

The patient should understand:

> **Here is what I need to do next, and here is what is happening with my care.**

### Acceptance

- simplest appropriate surface;
- do not expose clinic operational complexity unless the patient needs it;
- prioritize next appointment, next action, outstanding forms, relevant result/review state, referrals, tele-visit access, communication, and payment where applicable;
- plain language over codes/system terminology;
- actions should generally be one clear tap/click away;
- accessibility must be tested, not merely claimed.

## 15. Universal state design law

### Empty

An empty state explains:

- what is absent;
- why that matters, if relevant;
- the one best path to create/resolve it.

Never a generic gray panel plus sad icon.

### Error

Every error tells the user:

- what happened, in safe language;
- whether their work was preserved;
- what they can do next.

Avoid generic `Something went wrong` when more truthful safe context exists.

### Loading

- use local skeleton/progress states where useful;
- avoid full-page blocking spinners for ordinary work;
- never imply completion before governing state confirms it.

### Partial / unavailable / blocked / unauthorized

These are distinct states and must remain visually distinct when the backend exposes the distinction.

## 16. Interaction and accessibility law

- visible focus treatment on every interactive control;
- touch targets at least 44px;
- color is never the sole communication channel;
- motion is purposeful and reduced-motion aware;
- if removing an animation would not reduce comprehension, remove it;
- typography hierarchy remains coherent across public, clinical, owner, Grid, EDU and patient contexts;
- the product should feel like one Klinikos system even when information density differs;
- keyboard, pointer and touch paths must all remain usable;
- responsive acceptance includes 390px mobile through large desktop and 200% zoom for relevant surfaces.

## 17. Brand assets

Use the approved Klinikos brand assets already governed by the repository.

Do not create:

- another wordmark;
- another Orbital K authority;
- AI-generated brand marks;
- per-module logos that fragment Klinikos.

## 18. Screen acceptance relationship

A design is not accepted because it resembles a mockup.

A production screen must survive:

- real authorization/context;
- truthful real or clearly synthetic data;
- loading/empty/partial/error/blocked/unauthorized states;
- responsive layout;
- Marble and Obsidian;
- accessibility;
- governed action wiring;
- client/server confidentiality law.

The design canon describes the **experience requirement**. Runtime/domain canons determine what the interface is permitted to claim and do.

## 19. Commercial journey relationship

The design journey is inseparable from the commercial journey:

`PROBLEM ENTRY → ZUMI → VALUE PREVIEW → ACCOUNT TRIGGER → IDENTITY / CLAIM → VERIFY WHEN NEEDED → GRID PARTICIPATION → RESULT / RELATIONSHIP → ORGANIZATION VALUE → KLINIKOS 10 → CLINIC OS / CURRENT VISIT / TELEMEDICINE / REVENUE → RETENTION → NETWORK EXPANSION`

Klinikos 10 does not precede the universal journey. It is the natural premium organizational conversion after Klinikos has already created and understood enough value.

## 20. Merge blockers

A frontend change is blocked from merge if it:

- replaces Marble/Obsidian with a conflicting new theme authority;
- overuses Living Edge until attention hierarchy disappears;
- forces role selection when existing context already resolves the next question;
- asks for signup before showing safely available value without a governing reason;
- sends a user to an empty dashboard when a first useful object/result can be created;
- makes Current Visit a tab forest rather than a continuous encounter;
- creates a second telemedicine chart;
- turns Zumi into a generic chat widget;
- uses AI-generated clinical/coding output as final truth;
- hides pending/unverified states behind success styling;
- introduces inaccessible controls, sub-44px touch targets, invisible focus, or color-only state;
- creates fake data, fake integration success, fake Grid liquidity, fake payment state, or fake customer proof for visual completeness;
- creates a new logo or incompatible module-specific design system.

## 21. North star

The interface should increasingly make the user feel:

> **Klinikos already understands the context, has organized what matters, and knows the next legitimate step.**
