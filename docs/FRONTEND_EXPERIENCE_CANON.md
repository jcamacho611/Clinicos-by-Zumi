# Klinikos Frontend Experience Canon

Status: authoritative product/design/implementation contract  
Updated: 2026-08-30

For the full role-by-role, route-by-route, surface-by-surface frontend contract, read `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`. This file remains the compact operational law; the universal canon expands it and controls when an older visual reference conflicts with the newer approved healthcare-first direction.

## Product law

Klinikos may be complex underneath. The default user experience must be calm above.

**Complexity underneath. Clarity above. Intelligence everywhere. One best next move.**

The user should discover Klinikos power by accomplishing work, not by being shown every module at login.

## Shell law

- Persistent primary navigation is role-derived and generally limited to 4–7 destinations; current implementation caps clinic roles at 5.
- RBAC remains authoritative. Hiding navigation never grants or revokes authorization.
- Full authorized capability remains available through **Explore Klinikos**, contextual links, routes, and governed workflows.
- Do not simultaneously render a mega top nav, full module sidebar, subnav, dashboard-card wall, and assistant panel.
- Advanced/system configuration belongs under deliberate administration/settings navigation.

### Role examples

- Clinic owner: Home, Today, Money, Grid, Team.
- Front desk: Home, Today, Patients, Follow-up, Tasks.
- Provider: Home, Today, Patients, Care, Results.
- Biller: Home, Money, Readiness, Follow-up, Tasks.
- Quality: Home, Quality, Patients, Review, Referrals.
- Patient: Home, Appointments, Forms, Messages, Account.
- Learner: Home, Learn, Practice, Progress, Opportunities.

These are presentation defaults, not authorization shortcuts.

## Structured briefing law

Natural-language briefing copy is a presentation of structured server-owned state. It is never a database.

Correct model:

`SERVER TRUTH -> structured attention item -> briefing sentence + count/badge + next action`

Incorrect model:

`briefing sentence -> parse number -> badge`

A briefing item should, where applicable, carry stable structured fields such as:

- kind;
- count;
- severity/state;
- record identifiers or governed query reference;
- due state;
- evidence/provenance summary;
- next action;
- href/action contract.

Counts must come from the same source that produced the visible meaning. Do not scrape prose.

## Living Home

Home is an adaptive operational briefing, not a traditional KPI dashboard and not a five-plane architecture diagram.

Default Home should prioritize:

1. one primary priority or an honest all-clear state;
2. approximately 2–4 meaningful attention items;
3. small opportunity/context area when real;
4. the ambient Klinikos composer.

Do not lead with metrics that do not change what the user should do.

Prefer:

- `2 patients need intake before today's appointments.`
- `3 closed visits are blocked by documentation.`
- `18 room hours are unused this week.`

Over:

- `Patients: 18`
- `Tasks: 14`
- `Capacity: 73%`

No data theater. If nothing needs a person, say so calmly.

## Zumi / ambient intelligence

Zumi is Klinikos' intelligence source and governed orchestration layer, but normal UI should not repeatedly announce that architecture.

- Zumi is not a normal module destination.
- Do not require `Open Zumi` before asking for help.
- The global composer is available throughout authorized Klinikos surfaces.
- Visible language should generally be `Ask`, `Ask Klinikos`, or context-specific outcome language.
- Internal identity may remain Zumi for code, audit, orchestration, provider policy, and governance.
- Current route, active role, active organization, and authorized screen state may inform the conversation.
- Conversation continuity should survive normal navigation.
- Expanding conversation changes presentation, not authority or identity.
- Text present + send control = send. Empty composer may focus/expand the existing conversation.
- No AI theater: do not fake model processing, personalization, execution, or completion.

## Progressive disclosure

For every page ask:

- What does this role need now?
- What needs judgment/action now?
- What can wait until requested?
- What only matters to an administrator/expert?

If 70% of visible information can be hidden without preventing the next correct action, move it deeper rather than deleting the capability.

## Visual system — current operational direction

### Light clinical default

Normal authenticated healthcare work is **light-first**.

Use:

- white / pearl / mist clinical canvases;
- graphite / deep slate typography;
- restrained healthcare teal, sage, and medical-blue interaction/information accents;
- precise success / attention / risk states;
- strong negative space;
- subtle hairlines/elevation;
- approved orbital mark and wordmark where useful;
- typography and hierarchy as the primary visual structure.

Recommended working palette is defined in `KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`.

This is not permission to recreate generic hospital-blue or generic enterprise SaaS UI. Klinikos remains distinctive through typography, composition, behavior, brand assets, contextual intelligence, and restraint.

### Brand accents

Oxblood, deep burgundy, dusty rose, rose ash, ember, and muted/antique gold remain available as signature accents. They do not need to fill every product surface.

### Dark mode

Obsidian/black-cherry/oxblood remains available as optional dark mode and for selected public/premium/system presentation contexts.

Dark mode must not become:

- neon;
- cyberpunk;
- game-like;
- a glowing command center;
- an architecture poster;
- a permanent constellation/network visualization behind routine work.

## Luxury definition

Luxury means restraint, spacing, typography, precision, calm motion, honest state, and high-quality interaction.

Luxury does not mean more glow, more cards, more gradients, more borders, or more animation.

## Brand atmosphere contract

Brand atmosphere is subordinate to product clarity.

**The interface itself is the signature.**

No decorative motif is permanent and no page requires a flower, rose, orb, network illustration, stock image, or other decorative object merely to look like Klinikos.

Existing rose assets remain reusable historical/optional brand material, not a product requirement. Use them only when they improve hierarchy or atmosphere without competing with the user's work.

Prefer **order emerging from complexity** through spacing, typography, hierarchy, restrained state-driven motion, and progressive disclosure rather than visible architecture diagrams or decorative network clutter.

### Public / Living premium surfaces

- Let the product interaction, useful answer, and next action carry the page before atmosphere.
- Motion must be tied to real state, navigation, focus, or comprehension rather than continuous spectacle.
- Decorative depth may be used sparingly when it does not reduce readability, performance, or layout stability.
- Do not replace the retired mandatory rose with another mandatory decorative gimmick.

### Operational surfaces

- The work owns the screen.
- Use quiet geometry, hierarchy, spacing, and contextual state before imagery.
- Clinical, billing, Grid, EDU, and administrative workspaces must remain readable under sustained daily use.
- Five-plane/system architecture belongs in an explicit System X-Ray / architecture presentation, not the normal user's dashboard.

### Accessibility

- Decorative assets are decorative and receive no meaningless screen-reader narration.
- `prefers-reduced-motion` disables non-essential motion while preserving state and meaning.
- Decoration must never be the sole carrier of status, action, hierarchy, or eligibility.

## Current Visit contract

Current Visit is the provider-facing clinical convergence surface.

Target sequence:

`Patient Snapshot → What Changed → Staff Handoff → Today → Clinical → Assessment & Plan → Orders & Results → Documentation & Coding → Close Visit`

The first viewport should answer:

- Who is this patient?
- Why are they here?
- What changed?
- What did staff already do?
- What requires my judgment?

Structured longitudinal change is deterministic truth. AI may summarize but may not invent it.

## Grid design contract

Grid expresses universal healthcare demand/capacity through **I NEED / I HAVE** and governed matching.

Users should not need marketplace taxonomy before stating intent.

### Decision order

1. what it is;
2. eligibility;
3. availability;
4. location/distance;
5. trust/requirements;
6. terms;
7. price;
8. action.

**ELIGIBILITY BEFORE RANKING** remains a system law. Price must not visually outrank eligibility.

### Map

- Real MapLibre + OpenFreeMap map, never a drawn placeholder.
- Real reviewed coordinates only.
- List and markers share selection.
- Geolocation is permission-driven.
- No fake pins.
- Unpinned city/state/service-area inventory stays explicitly unpinned.
- Desktop grants the map meaningful space.
- Mobile defaults to results with deliberate Map/Results switching.
- Critical decision information remains available in the accessible list; no result exists only as a marker.
- If primary map tiles/runtime fail, show an honest unavailable/fallback state. Never draw a fake replacement map.

## Grid transaction truth

Keep state-machine complexity underneath while presenting only the current relevant state.

Never collapse these truths:

`MATCH != OFFER != ACCEPTANCE != RESERVATION != PAYMENT != BOOKING != FULFILLMENT != FINANCIAL OBLIGATION != SETTLEMENT`

Likewise:

- `BOOKING != FULFILLMENT`
- `FINANCIAL OBLIGATION != SETTLEMENT`
- `REDIRECT != PAYMENT`

After work time passes, do not auto-claim fulfillment. Ask for governed evidence/human confirmation where required.

## Money / Billing

Lead with what money needs action, not a wall of accounting charts.

Examples:

- documentation blocking revenue;
- balances ready for follow-up;
- items ready for human claim review;
- revenue-recovery opportunities backed by real records.

Estimated booked/lost opportunity value must never be labeled collected/recovered cash without payment evidence.

## Quality / Assurance

The normal user experiences the outcome of the Assurance system, not the rules engine.

Prefer:

`Quality — 2 things need review.`

with plain-language evidence gaps/next actions.

Deeper authorized expert views may expose rules, evidence, provenance, effective windows, monitoring, and human-review state.

The same visual grammar must generalize to Revenue, Authorization, Referral, Credential, Compliance, Inventory, Workforce, EDU, and Security assurance families.

## Expert Grid

When internal capability is insufficient, show the problem and governed route to qualified help.

Do not expose matching weights, hidden capability registries, or proprietary rules.

Expert discovery/match never grants patient data. Engagement/access remains gated by purpose, conflict, agreement evidence, scope, minimum necessary, authorization, and review.

## EDU

EDU should feel like progression, not LMS navigation overload.

`learn -> practice -> demonstrate -> human review -> placement -> authority/credential checks -> eligible opportunity`

Training/completion evidence never independently grants licensure, clinical privileges, employment eligibility, or automatic Grid eligibility.

Human competency determination must be visually and semantically distinct from AI assistance.

## Network / Referrals

Lead with relationship completion and stalled work, not directory size.

A referral is not successful merely because it was created. Surface missing receiving-provider/appointment/result/closure states truthfully.

## Insights

Conclusions first, charts second.

Prefer:

- `Saturday capacity is consistently unused.`
- `Follow-up completion improved.`
- `Three visit types repeatedly arrive with incomplete intake.`

Then provide `See why` and supporting evidence.

## Communications

Communication should be contextual to patients, appointments, tasks, Grid transactions, and workflows where possible.

Truth states include:

- permission required;
- phone verified/unverified;
- opted out;
- transport unavailable;
- prepared;
- sending;
- provider-confirmed state;
- failed.

Never display delivered/sent truth without appropriate provider evidence. Phone possession verification is not messaging consent. Clinical/PHI messaging remains separately gated.

## Connections

Do not collapse:

`credentials present -> configured -> provider verified -> authorized for workload -> production proven`

into one green check.

## Legal

Agreement surfaces should be calm and evidence-oriented. Signing terms does not independently create payment truth, provider eligibility, clinical authority, PHI access, Grid eligibility, or fulfillment.

## Patient portal

The patient portal is dramatically simpler than the staff product.

Primary concepts should generally remain around Home, Appointments, Forms, Messages, Account.

Do not expose clinic architecture, internal quality engines, revenue operations, or admin systems to patients.

## Error / loading / empty states

- Translate infrastructure failures into human meaning.
- Maintain layout/context during loading.
- Avoid giant skeleton-card walls.
- Honest empty states may say `Everything important is handled right now.`
- Technical detail belongs in internal diagnostics, not normal UI.

## Accessibility

Every major surface must be designed/tested for:

- keyboard-only use;
- logical focus order;
- visible focus;
- semantic labels and landmarks;
- status/error announcements;
- 200% zoom;
- 320px+ reflow;
- non-color state communication;
- reduced motion;
- usable target sizes;
- modal/dialog focus management;
- accessible alternative to spatial/map interactions.

## Mobile

Do not shrink the desktop sidebar.

Use deliberate role-aware mobile navigation and screen composition. Grid map/list should switch intentionally rather than compressing both. Expanded conversation may use most of the viewport while remaining the same Zumi conversation/context.

## Page test

Within approximately five seconds a user should understand:

- where they are;
- what matters;
- what to do next.

Within approximately thirty seconds they should understand:

- what Klinikos has handled;
- what still requires them;
- how to get more detail;
- how to ask Klinikos for help.

## Buyer test

A clinic owner should think:

`This organizes my business.`

not:

`I need training to understand this software.`

## Anti-regression rules

Do not merge frontend work that reintroduces any of the following without an explicit product decision:

- video-game aesthetics;
- neon/cyberpunk clinical UI;
- dark-first requirement for routine healthcare operations;
- five-plane architecture maps as normal dashboards;
- giant ecosystem balls/orbits on operational screens;
- 8+ permanent primary destinations for a normal role;
- sidebar exposure of every authorized module;
- duplicate full-product directories on Home;
- KPI-card walls as the default Living Home;
- Zumi as a separate normal module;
- visible `Klinikos Intelligence` marketing inside routine authenticated work;
- drawn/fake Grid maps or pins;
- price before eligibility;
- badge counts parsed from prose;
- fake unread/activity/AI/payment/provider states;
- visual role switchers that bypass authenticated role/context truth;
- mandatory decorative motifs that compete with the user's work;
- micro-text used to compensate for excessive information density.

## Implementation handoff required per major surface

Document:

- user role;
- active context;
- user goal;
- expected successful outcome;
- primary action;
- required server state;
- minimum data;
- optional data;
- empty/loading/error/permission states;
- manual fallback;
- external dependency;
- mobile behavior;
- accessibility behavior;
- ambient Zumi context;
- audit/financial consequence where applicable;
- next useful route.
