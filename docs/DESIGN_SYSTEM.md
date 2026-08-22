# Klinikos Design System

The frontend contract. One system, applied to every surface — not a set of screens that
happen to share a palette.

The governing law is that the complexity lives in the backend and the simplicity lives
in the frontend. Klinikos runs Clinic OS, Grid, EDU, Care, Billing, Quality, Assurance,
Network, Legal, Communications, Settings, Integrations, Analytics and Zumi. A person
should never have to know that. What they should feel is that the system knows what
matters right now.

The test a new user should fail: concluding "Klinikos has a lot of features". The
reaction we want is "Klinikos seems to know what I need to do."

---

## 1. Primitives

A small vocabulary, used everywhere. If five components say the same thing, they
converge into one of these.

| Primitive | What it is | Where it lives |
|---|---|---|
| **Shell** | Sidebar, top bar, ambient Zumi composer, content column | `src/components/clinic/app-shell.tsx` |
| **Navigation** | The role-derived permanent rail | `src/lib/navigation/role-navigation.ts` |
| **Briefing** | The editorial Home statement: what needs you, what is handled | `src/components/clinic/living-home-operations.tsx` |
| **AttentionItem** | One thing needing attention, with exactly one primary action | `src/lib/home/attention.ts` |
| **TruthState** | How true something is, in nine named stages | `src/lib/design/truth-state.ts` |
| **RoseAtmosphere** | The environmental brand layer, four intensities | `src/components/brand/rose-atmosphere.tsx` |
| **Composer** | The ambient Zumi entry, present on authorized surfaces | `app-shell.tsx` |
| **Map** | Real MapLibre + OpenFreeMap, with honest failure | `src/components/grid/google-grid-map.tsx` |
| **Result** | A Grid result in the fixed information hierarchy | `src/components/grid/` |
| **EmptyState** | "Everything is handled" as a real answer, not a gap | `attention.ts` → `everythingHandled` |

### Component reduction rule

Before adding a component, check whether one of the above already says this. A new
visual treatment needs a reason that is not "this screen is different".

---

## 2. Navigation model

**Permanent destinations: 2–7 per role, named for outcomes.**

The rail this replaced listed every workspace Klinikos owns — eleven groups, roughly
sixty links. The first thing a clinic owner met was the org chart of the software.

Now the rail is derived from `role + permissions`, and everything else stays reachable
under **Explore Klinikos**. Nothing was deleted; it stopped being permanent furniture.

| Role | Permanent rail |
|---|---|
| Clinic owner | Home · Today · Money · Grid · Team · Quality |
| Administrator | Home · Today · Money · Team · Quality · Network |
| Provider | Home · Today · Patients · Care · Results |
| Clinical staff | Home · Today · Patients · Care · Team |
| Front desk | Home · Today · Patients · Follow-up · Team |
| Biller | Home · Money · Claims · Coverage · Recovery |
| Quality | Home · Quality · Patients · Care · Follow-up |
| Case manager | Home · Patients · Cases · Follow-up · Team |
| Contractor | Opportunities · Availability · Grid |
| Viewer | Home |

Two invariants, enforced by `tests/role-navigation.test.ts`:

1. **Never advertise a surface the role cannot open.** Every destination is filtered
   through `canAccessWorkspace` before it renders. A rail assembled by hand drifts out
   of step with RBAC and the person finds out by clicking into a 404.
2. **Outcome words, not module words.** The label vocabulary bans *workspace, module,
   engine, registry, orchestration, console, dashboard, management, admin, config,
   system*.

**Contractor is the case that proves the filter runs.** A contractor is an external Grid
participant holding no clinic-data permission — they cannot open `/dashboard` at all.
Their rail starts at Grid, matching where sign-in already sends them. A test asserts the
rail and the post-login redirect agree, because those are two places answering "where
does this person start" and their drifting apart is invisible until someone signs in.

### Role switching

A role switcher is a **design-preview control only**. Production experience is derived:

```
authenticated identity + active organization + role + permissions + current task
  → experience
```

A person who legitimately holds several roles may get a subtle context switcher. An
ordinary user must never be able to step into a role they do not hold.

---

## 3. Counts and badges — the derivation contract

**Structured server state is the source. The sentence and the badge are both outputs.
Neither reads the other.**

```
structured server state
  ├── count, severity, recordIds, dueState, nextAction
  ├──→ briefingSentence(item)   the sentence a person reads
  └──→ badgeFor(item)           the number on the rail
```

A badge must never scrape a natural-language sentence for its number. It looks harmless
— sentence and badge always agree, because one is made from the other — and then it
fails the way language fails: pluralisation moves the digits, a translated string has
none, "Two patients" stops matching `/\d+/`, and a reworded sentence silently reads zero.

`recordIds` is what makes a count checkable. A count that cannot name its records is an
assertion, not evidence — `attentionItemIsConsistent` requires `count === recordIds.length`.

**Do not surface raw numbers.** Not `Patients 2,934 · Tasks 19 · Capacity 74%`. Translate
into meaning: *2 patients require action. 3 tasks are overdue. 18 room hours are unused.*

---

## 4. Truth states

Nine named stages. The single green check is the enemy.

| Stage | Label | Mark | What it does **not** mean |
|---|---|---|---|
| `not_configured` | Not connected | ○ | — |
| `configured` | Configured | ◐ | Provider has verified nothing |
| `provider_verified` | Provider verified | ◑ | Not yet authorized for a purpose |
| `authorized` | Authorized | ◕ | Nothing has gone through in production |
| `proven_in_production` | Working | ● | — |
| `manual_fallback` | Manual for now | ✎ | No automatic verification behind it |
| `human_review` | Waiting on review | ◉ | Nothing is automatic here |
| `blocked` | Blocked | ⊘ | — |
| `failed` | Did not go through | ✕ | Nothing was recorded as done |

Only `proven_in_production` may be described as live. Every stage carries a **mark** as
well as a tone, so status survives greyscale, colour blindness and forced-colors mode.

**Applied vocabularies:**

- **Payments** — Checkout created → Waiting for payment → Payment processing → Payment
  confirmed → Activation ready. Refund pending / Refund confirmed / Reconciliation
  required are separate. *A browser return is not payment.*
- **Communications** — Allowed · Permission required · Verified phone · Unverified phone
  · Recipient opted out · Transport unavailable · Prepared · Sending · Delivered ·
  Failed. *Never show "Sent" without provider evidence.*
- **Grid** — Offer sent, acceptance, payment authorization, booking, fulfillment and
  settlement are five separate truths and never equate.

---

## 5. The rose

Approved and locked. It is brand atmosphere, not wallpaper — the page should feel like
it moves *through* the rose rather than past an image glued to one section.

One mechanism, four intensities:

| Variant | Drift | Opacity | Use |
|---|---|---|---|
| `living-home` | 0.14 | 1.0 | Large, cinematic, very slow scroll-linked drift |
| `public-funnel` | 0.30 | 0.72 | Follows the composition through sections at ~30% of scroll velocity |
| `transition` | 0.20 | 0.40 | Smaller partial rose between surfaces |
| `workspace` | 0.08 | 0.14 | Mostly atmosphere — cropped petal geometry, no giant flower behind a table |

**Rules:**

- `aria-hidden` + `role="presentation"`, no `alt`. Narrating a background flower on every
  surface is noise.
- `pointer-events: none` throughout.
- `prefers-reduced-motion` removes the parallax and **keeps** the atmosphere. The
  reduced-motion answer to a moving background is a still background, not a blank one.
- One `requestAnimationFrame` write per frame — scroll handlers that write per event
  cause layout thrash on surfaces where this runs beside real work.

---

## 6. Zumi — ambient intelligence

Zumi is not a module and not a separate app.

- **No** permanent navigation item named "Zumi".
- **No** "Open Zumi" control.
- **No** repeated "Klinikos Intelligence" explanation.
- **No** "Klinikos Browser" product metaphor.

**The composer** is present across authorized surfaces, and its placeholder follows
context: *What needs to happen?* (Home) · *Ask about these patients…* · *What do you need
or have?* (Grid) · *Ask about money that needs attention…* · *What should I work on next?*
(EDU). One conversation persists across all of them.

**Send behaviour — the critical interaction:**

```
text present + click  → SEND
text empty   + click  → focus / expand the existing conversation
```

It must never navigate away unexpectedly. `/zumi` changes how the already-mounted
conversation is *presented*; it does not mount a second assistant, which would silently
reset the person's in-flight context. Expansion is presentation only — same conversation,
same context.

---

## 7. Grid

### Information hierarchy — fixed order

```
WHAT IT IS → ELIGIBILITY → AVAILABILITY → DISTANCE/LOCATION → TRUST → PRICE → ACTION
```

**Eligibility can never be visually outranked by price.** This is the one hierarchy rule
that is not negotiable for layout convenience.

### Entry — I need / I have

```
WHAT DO YOU NEED?   [I need…]
WHAT DO YOU HAVE?   [I have…]
```

*"I need an RN Saturday." · "I have a treatment room Tuesdays." · "I provide billing
services."* Klinikos extracts the structure. A person should never have to learn
marketplace taxonomy first.

### Map

Real **MapLibre GL + OpenFreeMap** (`https://tiles.openfreemap.org/styles/liberty`). Pan,
zoom, real coordinates, real markers, fit-to-results, geolocation on permission, and
marker↔list selection sharing.

**Never replace a failed real map with a fake one.** On tile failure:

> Map unavailable right now. Your results are still complete. Distance and location
> remain available below. **[Try map again]**

This is premium *because* it is truthful.

**Map accessibility:** the list is the accessible equivalent of the map. No result may
exist only as a marker — a keyboard or screen-reader user must be able to make the same
Grid decision from the list alone.

### Layout

- **Desktop** — compact result list beside a map that gets meaningful space. Not crushed
  between a sidebar, top filters, secondary nav and floating widgets.
- **< ~1100px** — deliberate list/map switching, not both squeezed.
- **Mobile** — results by default with a clear **Map** toggle. When the map opens it takes
  most of the screen; no simultaneous full detail + nav + drawers + Zumi panel.

### Transaction chain

`need → eligible option → fit → offer → acceptance → reservation → payment state →
booking → fulfillment → obligation → closed`

The person experiences a simple progression. `GridMatchComponent`, `EligibilityCheck #14`,
`TransactionState`, `SuitabilityScore` and `PolicyEngine` stay backend concepts.

After sending an offer: *"Waiting for response. You do not need to stay here. Klinikos
will let you know when something changes."* Do not trap people in a transaction dashboard.

On acceptance, show **only the blocker that actually matters** — payment authorization,
or agreement, or human review — never all possible stages.

**Fulfillment is never automatic.** *"Did this happen?"* — a scheduled time passing is not
evidence that work occurred.

**Issues** separate commercial problems from safety problems. Safety concerns may pause
related activity while a qualified human reviews them. Support must never appear to
practise medicine.

---

## 8. Money

Opens as a question, not an accounting application.

> **MONEY** — $8,420 needs attention.
>
> **Documentation** · 3 closed visits cannot move forward. [Review]
> **Patient balances** · 4 balances ready for follow-up. [Review]
> **Claims** · 2 items ready for human review. [Review]
> **Revenue recovery** · 3 opportunities may be worth following up. [See opportunities]

Detailed accounting lives deeper. Use human meaning at every depth — *"Not ready ·
missing signed documentation"*, never an internal lifecycle code.

---

## 9. Quality / Assurance

The clinic owner experiences the **outcome**; the rules engine stays out of sight.

> **QUALITY** — 2 things need review.
> Diabetes follow-up · Evidence incomplete [Review]
> Documentation follow-up · Human review overdue [Review]

Do **not** lead with Rules engine, Evidence closure, Assurance Monitor, Capability
Registry or Expert Grid. Authorized deeper users may see what is being checked, why it
matters, evidence available and missing, last evaluated, who owns review, next action and
history. Proprietary scoring logic is never displayed.

**Generalization.** Quality is the first visible family; the same grammar later carries
Revenue, Authorization, Referral, Credential, Compliance, Inventory, Workforce, EDU and
Security assurance. Normal users need not learn the word "Assurance" — *"Revenue · 3
things may be leaking money"*, *"Credentials · 2 items expire soon"*.

### Expert Grid

> This requires expertise your organization doesn't currently have available. Klinikos
> can help you find an appropriate specialist. **[Find specialist]**

Access progression is visible and strict: **Matched → Terms agreed → Conflict review →
Purpose confirmed → Agreement complete → Data access: None**. Only then, if genuinely
necessary, *minimum required information requested*.

**An expert never receives patient information because they were matched.** Expert
discovery happens before any data access. Internal matching formulas are never exposed.

---

## 10. EDU

A career environment, not course-management software.

> **YOUR PATH** — RN → Aesthetic practice readiness
> Foundation · Complete → Simulation · In progress → Competency review · Next →
> Placement · Locked → Grid opportunities · Locked

`LEARN → PRACTICE → DEMONSTRATE → REVIEW → PLACEMENT → CREDENTIAL CHECKS → OPPORTUNITY`

**Visible but quiet:** Klinikos training does not itself grant professional licensure or
clinical authority. An educational competency is not a licence.

**Human determination must look different from AI assistance:**

> AI assistance: Summary prepared
> Human determination: **Pending** [Review evidence]

AI may never appear as the final authority. Certificates document training completion and
say so explicitly — they do not establish licensure, privileges or Grid eligibility.

Placement transitions naturally into Grid; a student should not feel they left EDU and
entered an unrelated marketplace.

### Career routes

`STUDENT → LEARNING → COMPETENCY → CREDENTIALS → GRID → OPPORTUNITY → EXPERIENCE →
INDEPENDENCE → PRACTICE → CLINIC OWNER → NETWORK`

Show only where a person is and what comes next — never the whole lifecycle to everyone
at all times.

---

## 11. Other surfaces

**Living Home** — an intelligent morning briefing, not a dashboard. Greeting, the state
of things, attention items each with one action, then the composer.

**Today** — run the workday from one screen: time, person, state, action.

**Patient directory** — search, one useful filter, clean rows. Name · relevant context ·
next state · next action. Do not expose database columns because they exist.

**Patient detail** — answers *who are they, why are they here, what is next*, then
progressively reveals Overview / Timeline / Care / Documents / Billing. Not 14 tabs.

**Care** — actionable work before raw records: results needing review, referrals waiting,
documentation incomplete, follow-up required.

**Network** — relational, not LinkedIn. *Cardiology · 3 connected partners. Behavioral
health · No active partner. [Find one]*

**Referrals** — closure, not counts. *Maria Rodriguez · Cardiology · No appointment
confirmation yet. [Follow up]*

**Insights** — conclusions first, charts second. *"Klinikos noticed: Saturday capacity is
consistently unused."*

**Action Center** — Needs you / Waiting on others / Completed recently. Not another inbox,
and no fake notification counts.

**Communications** — contextual where possible: conversation on the patient, confirmation
on the appointment, discussion on the task, offer communication on Grid. A centre exists
deeper.

**Legal** — calm, not a cockpit. A signed agreement is historical evidence; it never
independently creates provider eligibility, payment, clinical authority, PHI access or
Grid eligibility.

**Settings** — may hold complexity, because the person deliberately entered
administration: Organization · People & access · Connections · Communications · Payments ·
Security · Legal · Data · Brand · Advanced. Never surfaced in daily navigation. Secret
environment-variable *values* are never exposed.

**Patient portal** — dramatically simpler than staff Klinikos. Home · Appointments · Forms
· Messages · Account. Phone verification says quietly: *verifying your phone confirms you
control this number; it does not subscribe you to marketing messages.*

---

## 12. Tokens

**Type scale** — Display · H1 · H2 · H3 · Body · Secondary · Label · Micro.
**Floor: 11px.** No 8px, 9px or 10px interface text anywhere, enforced by
`tests/interface-legibility.test.ts`.

**Spacing** — 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96.

**Radii** — few. Do not round everything at random.

**Borders** — sparingly. **Shadow** — elevation and focus only.

**Colour roles** (never raw names): Background · Surface · Elevated surface · Primary text
· Secondary text · Muted text · Accent · Action · Success · Warning · Critical · Focus ·
Disabled. Every state must be understandable without colour.

---

## 13. States

Every important component designs all of these, not only the happy path:

`DEFAULT · HOVER · FOCUS · ACTIVE · LOADING · EMPTY · ERROR · PARTIAL · SUCCESS ·
DISABLED · PERMISSION BLOCKED · EXTERNAL SETUP REQUIRED · HUMAN REVIEW`

---

## 14. Motion

Motion that teaches nothing is removed on every surface. Narrative motion is permitted on
marketing, where the movement *is* the argument. Inside a workspace, motion may only
report a real state change. The marketplace is confined to acknowledging input.

No AI theatre: no animated thinking dots for their own sake, no fake processing, no
fabricated insights, results, recommendations or automation. Sample-data screens are
clearly marked.

---

## 15. Accessibility

Every screen: keyboard-only operation · logical focus order · visible focus · 200% zoom ·
320px width · screen-reader labels · status announcements · non-colour state · reduced
motion · sufficient contrast · large targets.

Specifics enforced in tests: an 11px type floor; a global skip link to
`#klinikos-page-content`; `:focus-visible` outlines loaded after theme CSS;
`forced-colors: active` support; a global reduced-motion fallback; low-contrast tones
swept out of public marketing surfaces.

---

## 16. Responsive

**Desktop** — controlled max widths and spatial hierarchy. Large monitors get neither a
tiny 500px column adrift in emptiness nor everything stretched edge to edge.

**Tablet** — collapse navigation early enough, protect content width, switch Grid to
deliberate map/list rather than squashing the desktop layout.

**Mobile (390px)** — designed, not shrunk. Home · Today · Patient · Grid results · Grid map
· Booking · Zumi · EDU · Money · Portal. Bottom navigation is role-aware and small:
Home · Today · Grid · Ask · More (patient: Home · Appointments · Forms · Messages · More;
student: Home · Learn · Path · Opportunities · More). Never eight icons.

---

## 17. Per-surface handoff contract

Every major surface documents:

`USER ROLE · USER GOAL · PRIMARY ACTION · REQUIRED SERVER STATE · MINIMUM DATA · OPTIONAL
DATA · EMPTY · LOADING · ERROR · PERMISSION · MANUAL FALLBACK · EXTERNAL DEPENDENCY ·
MOBILE BEHAVIOR · ACCESSIBILITY BEHAVIOR · ZUMI CONTEXT`

Describe required input/output behaviour. Never encode proprietary algorithmic logic into
a design specification.

---

## 18. What must never be claimed

Certified EHR · HIPAA compliant · live lab, payer, clearinghouse or eRx connection ·
externally verified licence or malpractice · real payout settlement · free trial ·
payment inferred from a browser return · fulfillment inferred from a clock.

---

## 19. Backend contracts still required

These surfaces have designed frontend states; the application work behind them is
outstanding.

| Contract | Needed for |
|---|---|
| Structured attention feed per role — count, severity, record ids, due state, next action | Living Home briefing, Action Center, rail badges |
| A dedicated `Today` surface with structured day state | Today |
| Grid offer/acceptance/booking/fulfillment state machine exposed as one progression | Grid transaction chain |
| Processor verification connector | Payment truth beyond manual reconciliation |
| Assurance rules + evidence closure engine | Quality outcomes, generalized assurance families |
| Expert Grid matching and staged access grants | Expert engagement |
| Insights conclusion generation over real operating history | Insights |

Each has its truthful frontend state today — *not configured*, *manual for now*, *waiting
on review* — rather than an invented success.
