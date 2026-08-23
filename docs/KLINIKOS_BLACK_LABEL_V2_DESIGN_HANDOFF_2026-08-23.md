# KLINIKOS — Black Label V2 Claude Design Handoff

Version: `2026-08-23.1`  
Status: `AUTHORITATIVE AUTHENTICATED EXPERIENCE REFERENCE`  
Production/runtime authority: **No** — current application code, schema, authorization, feature status, integration evidence and release verification remain authoritative for live behavior.

## 1. Provenance

This handoff preserves and completes the Claude Design workspace supplied by the founder on 2026-08-23:

`https://claude.ai/design/p/b846c1b8-35fb-440f-b883-90dc9fd34483?file=Klinikos+Browser.dc.html&via=share`

The supplied design package included `Klinikos Browser.dc.html`, prior Klinikos design iterations, generated design-system tokens/bundle, approved brand assets, interaction/responsive/motion handoff material, and reference screenshots. Claude Design reached its usage limit before final cleanup. The recovered Browser reference was audited and minimally corrected rather than recreated.

Canonical recovered Browser source SHA-256:

`6e471a857cb13ce68d67a29249db5e19825ba0e738df209c92f4dd4bbb626b01`

The exact recovered source is stored losslessly as a Brotli-compressed Base64 audit artifact under:

`docs/design/black-label-v2/Klinikos Browser.dc.html.br.b64.part00` through `part04`.

Use `scripts/restore-black-label-design.mjs` to reconstruct and verify the source.

## 2. Authority relationship

This handoff is the latest authenticated-product visual and interaction reference where it conflicts with older experimental design prose. It **does not** replace:

- `docs/SOURCE_OF_TRUTH.md` for product/runtime truth;
- `docs/KLINIKOS_DESIGN_PACKAGE_AUTHORITY_2026-08-16.md` for the broader design package law;
- `docs/APPROVED_LIVING_HOME_REFERENCE_2026-08-16.md` for the exact first-visit Living Home reference lock;
- current authorization, clinical, financial, credential, eligibility, privacy or integration authority;
- current production code merely because a Design prototype renders an interaction.

The first-visit public Living Home stays reference-locked. Black Label V2 principally advances the **authenticated operating environment**, deeper workspaces, role-aware composition, and the interaction grammar connecting them.

## 3. Black Label V2 north star

The required impression is:

> **This product is quietly more advanced than the software around it.**

Never:

> This product is trying hard to look futuristic.

The product-wide rule remains:

> **The complexity belongs to Klinikos, not to the person using Klinikos.**

The defining behavior is:

> **Intelligence becomes interface.**

When Klinikos has authorized structured truth, Zumi should preferentially materialize the most useful governed interface rather than defaulting to paragraphs of chat.

## 4. Canonical experience grammar

### Quiet power
Luxury comes from proportion, rhythm, typography, material hierarchy, information design, negative space, precision, motion restraint, responsiveness and truthful behavior — never gold gradients, glass everywhere, neon, giant SaaS cards or generic AI-purple styling.

### Adaptive spatial shell
The conceptual depth model is:

`ENVIRONMENT → WORKSPACE → OBJECT STAGE → INSPECTOR → CRITICAL DECISION`

Browser/history correctness remains real. Spatial continuity is an experience layer, not a replacement for routes.

### Object Stage
A consequential object may become the temporary center of the experience, including Patient, Encounter, Claim, Result, Referral, Grid Resource, Grid Demand, Grid Match, Transaction, Professional, Student, Organization, Task, Order or Case.

The Stage answers:

- What is this?
- Why does it matter now?
- What changed?
- What is unresolved?
- What can I do?
- What happens next?

### Narrative data
Prefer operational stories such as:

- `BEFORE → NOW → NEXT`
- `INITIAL → PREVIOUS → TODAY`
- `EXPECTED → ACTUAL → GAP`
- `NEED → ELIGIBLE → AVAILABLE → ACTION`
- `PERFORMED → DOCUMENTED → CODED → CLAIMED → PAID`
- `ORDERED → RESULTED → REVIEWED → INFORMED → CLOSED`
- `LEARN → PRACTICE → EVIDENCE → COMPETENCY → OPPORTUNITY`

### Living Edge
Use scarce rose/ember luminance to indicate meaningful user/system attention. It is a signature accent, not a border around every surface.

## 5. Material and theme law

Authenticated operational appearance remains one coherent customer-facing system:

- Auto / System
- Light = **Marble**
- Dark = **Obsidian**

Do not create `BlackLabelTheme`, `ThemeProvider2`, `LuxuryMode`, a Grid theme, an EDU theme, or another theme hierarchy.

### Obsidian family
Use near-black / black-cherry / oxblood-shadow / raised-wine depth with warm ivory text and restrained dusty-rose / ember attention.

### Marble family
Use warm architectural ivory / bone / limestone surfaces, graphite ink, oxblood authority and subtle rose-quartz contextual selection. Marble is not plain white plus burgundy buttons.

### Later color authority
Where older design-package prose references cyan/Aegean, it must not reintroduce a generic cyan-heavy product identity over this later Black Label direction. Such colors may survive only where a current semantic signal deliberately retains them and where they remain compatible with the present token system. Black-cherry, burgundy, dusty rose, muted coral/ember and warm ivory are the later visual language for the Black Label operating environment.

## 6. Domain-specific expression

Same design DNA, different operating density:

- **Living Home:** cinematic, contemplative, intent-first.
- **Current Visit:** surgical quiet and precision instrumentation.
- **Clinical Change:** `INITIAL → PREVIOUS → TODAY`, evidence-backed and omission-safe.
- **Front Desk:** zero-friction operative density.
- **Billing / Financial OS:** private-banking precision, tabular numerals, exception-first revenue truth.
- **Grid:** architectural cartography, synchronized map + ledger, eligibility before ranking.
- **EDU:** editorial academy progression that converges into authentic simulation UI.
- **Patient:** private hospitality, next-step-first, low cognitive burden.
- **Zumi:** persistent operating intelligence; conversation is a control plane, not the whole interface.

## 7. Recovered Browser corrections

The recovered Claude Design Browser was corrected before preservation:

1. Fixed the self-referential Obsidian success-line token.
2. Rebound Orbital K, wordmark and hero rose references to the production-approved Klinikos asset paths already used by the app.
3. Raised interface text below the approximately 12px design handoff floor.
4. Raised explicit interactive targets and Grid map markers to the 44px target floor used by the handoff.
5. Upgraded `Explore Klinikos` / command palette to an `aria-modal` keyboard-managed surface with focus entry, focus trapping and trigger-focus restoration.
6. Made JavaScript scrolling respect `prefers-reduced-motion` rather than relying only on CSS motion rules.
7. Disabled attachment and voice controls in the design preview rather than presenting no-op controls as live.
8. Routed the profile control to the prototype settings experience instead of leaving it inert.
9. Derived the attention count from the prototype briefing state rather than hard-coding `3`.
10. Preserved the role switcher as an explicit **design-preview-only** control; production roles remain identity/relationship/authorization governed.

These corrections improve the reference; they do not create production capability.

## 8. Production-approved assets

The current application already owns the approved production art paths and should remain the source for implementation:

- `/klinikos-orbital-k-production.png`
- `/klinikos-wordmark-production.png`
- `/klinikos-rose-hero-production.png`
- `/klinikos-rose-wide-production.png`

Do not copy the Claude export's generated asset wrappers into a new production asset system when the governed production assets already exist.

## 9. Generated Claude Design runtime boundary

The Claude Design `_ds` bundle, generated token package and standalone runtime are **reference tooling**, not authority to introduce another application framework.

Production conversion must reuse/reconcile the current Klinikos implementation:

- existing brand components;
- existing rose atmosphere system;
- existing application shell/navigation;
- existing route/auth model;
- existing domain repositories and server-owned DTOs;
- existing audit/security boundaries;
- current Marble/Obsidian theme work, including reconciliation with PR #240 rather than creating another theme stack.

No parallel shell. No parallel Grid. No parallel EDU. No parallel Zumi. No parallel identity, finance, audit or theme authority.

## 10. Truth boundary for prototype data

The Browser reference contains design-preview data and state demonstrations. Those exist to specify hierarchy, motion, density and interaction, not to claim real patients, revenue, payments, credentials, eligibility, results, integrations, attendance, outcomes or marketplace liquidity.

Production implementation must continue to distinguish:

- loading;
- empty;
- partial;
- unavailable;
- blocked;
- review required;
- permission denied;
- external setup required;
- ready;
- verified/completed only when governing evidence exists.

A beautiful false state is worse than an unfinished truthful one.

## 11. Implementation order

Convert the real application through shared primitives and real workflows, not by embedding the prototype wholesale:

1. Reconcile existing Auto / Marble / Obsidian theme work and semantic material tokens.
2. Converge the current authenticated shell/navigation and role/context emphasis.
3. Implement the Black Label Object Stage / inspector primitives where real routes benefit.
4. Living Home authenticated recomposition and Zumi interface-materialization.
5. Current Visit + Clinical Change signature experience.
6. Front Desk operative flow.
7. Billing / Revenue Integrity narrative progression.
8. Grid map + ledger + transaction experience.
9. EDU learner/instructor/simulation expression.
10. Patient portal private-hospitality expression.
11. Random deep-route convergence, state torture tests, mobile and accessibility gates.

The generated Browser reference is the design target during this conversion; current product truth determines what can be wired and claimed.

## 12. Acceptance law

A production screen is not Black Label merely because it looks similar. It must survive:

- real authorization/context;
- truthful real/clearly-synthetic data;
- loading/empty/partial/error/blocked states;
- keyboard, pointer and touch;
- reduced motion;
- Marble and Obsidian;
- 390px mobile through large desktop;
- 200% zoom;
- random deep-route inspection;
- governed action wiring.

The finished experience should increasingly make the user feel:

> **Klinikos knows what needs to happen.**
