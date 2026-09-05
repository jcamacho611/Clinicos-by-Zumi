# 11 — THE FRONTEND PROMPT
## Paste this for any visual, component, shell, copy-in-UI or accessibility work.


**Status:** SUBORDINATE BUILD DOCUMENT — NOT A CANON. Subordinate to `docs/KLINIKOS_MASTER_CANON.md` and to current code/runtime evidence.  
**Scope:** visual, component, shell, copy and accessibility work.  
**Precedence:** `01.5_RECONCILIATION_OVERRIDE.md` wins on every point it addresses.

```
DOCUMENT_VERSION: 2026-09-05.1
STATUS:           ACTIVE
READ ORDER:       01 → 01.5 → 11 → 05 (language) → the task
RELATIONSHIP TO 02: 02 builds the 3D RUNTIME (scene graph, cameras, primitives,
                    performance tiers). 11 governs EVERYTHING THE USER SEES —
                    including the 2D surfaces, the shell, the DOM twin, states,
                    responsive behavior and accessibility. When both apply, 01.5
                    wins over both.
```

---

# PART 0 — THE THREE SENTENCES THAT DECIDE EVERY FRONTEND ARGUMENT

1. **The server owns truth. The frontend projects it.** No component computes an
   authority, an eligibility, a price or a permission. If a component needs to
   know whether something is allowed, the server already said so and the
   component renders that answer.
2. **The semantic DOM is the authority; 3D is the projection.** Every essential
   task must be completable with the canvas absent. Not degraded-but-present —
   *absent*.
3. **Nothing decorative earns a frame.** Every visual effect encodes meaning or
   it is deleted.

---

# PART 1 — TOKEN AUTHORITY

## 1.1 There is exactly one token authority, and it is in the repo

Find it before writing a single color. It is a CSS custom-property layer
(`design-tokens.css` or its current equivalent — **discover it, do not assume the
filename**). That file is the authority.

**Do not:**
- create a second token file, a theme object, a Tailwind config palette, or a
  `colors.ts` that duplicates it;
- hardcode a hex value in a component, ever, including "just this once for the
  gradient";
- add an override stylesheet above the token layer.

**The override layers are the disease.** `06_WAVE_0_TRUTH.md` records nine
stylesheets in `src/app`, five of them override layers sitting above the token
layer — that is the mechanism producing thousands of hardcoded theme literals and
an unreachable light mode. Deleting the override layers is a prerequisite for
this system to work at all, not a cleanup task for later.

## 1.2 Two materials, one vocabulary

**OBSIDIAN** — black, void, black cherry, oxblood, smoke glass, wine, rose
illumination. **MARBLE** — warm ivory, bone, limestone, quartz, graphite, with
rose/oxblood detail.

They are not "dark mode and light mode." They are two materials that must define
**the same semantic token names**. Every component references semantics:

```
surface · surface-raised · surface-sunken · border-quiet · border-active
text-primary · text-secondary · text-quiet · text-inverse
accent · accent-quiet · accent-strong
state-ok · state-attention · state-critical · state-blocked · state-pending
```

A component that mentions a *color* rather than a *role* is broken in the other
material. This is checkable and should be checked by a test, not by looking.

## 1.3 The rose

The rose is the primary emotional and spatial motif. It is procedural, it is
singular, and it is quiet. It never spins forever (see §5.2). Approved brand
assets — orbital K, wordmark, wide rose, centered rose — are **used as produced**.
Never a CSS approximation, never a substitute SVG, never a screenshot crop, never
a black rectangle around a transparent asset.

---

# PART 2 — TYPOGRAPHY

One display family, one text family, one mono. **The repo's current families are
the authority** — read them before proposing a change, and if you propose one,
propose it as a change to the token layer, not as a local override.

Rules that hold regardless of which families are current:

- **One display scale.** Restraint at the top of the page is what makes the page
  read as expensive. Two competing display sizes reads as a template.
- **Left-aligned by default.** Centered body copy is a marketing tell.
- **Measure 60–75 characters.** Full-bleed paragraphs are unreadable at 1440px.
- **Numbers are tabular** wherever they are compared, stacked, or in a table.
- **Mono is for identifiers, code, SHAs and states** — never for prose because it
  looked technical.
- **No text below 14px**, anywhere, including labels and captions.

---

# PART 3 — LAYOUT AND THE SHELL

## 3.1 One shell

There is one authenticated shell and one public shell, and they share the token
layer, the type scale, the motion policy and the accessibility contract. **Do not
build a third shell for a new Reality.** A Reality is a row in a registry, not a
new application.

## 3.2 The grid

Content sits on a consistent spacing scale drawn from tokens. No magic numbers.
If you need `13px`, either the scale is wrong (fix the scale) or the design is
wrong (fix the design).

## 3.3 Density

Clinical surfaces are dense on purpose. Marketing surfaces are spacious on
purpose. Do not import marketing spacing into a chart review — a physician with
fourteen minutes does not want generous whitespace, they want the next fact.

## 3.4 The precision workspace

`PRECISION_MODE` is a first-class surface, not a fallback. It is DOM-heavy, low
motion, maximum legibility, and **it is where authorized PHI lives**. The spatial
projection never carries PHI on any route, including clinical ones.

---

# PART 4 — COMPONENT LAW

## 4.1 Every interactive component declares five states

```
DEFAULT · HOVER/FOCUS · ACTIVE · DISABLED (with a reason) · LOADING
```

**A disabled control that does not say why is a bug**, not a style choice. See
`05_LANGUAGE_BOOK.md` §10 for the exact sentences.

## 4.2 Every data surface declares five states

```
LOADING · EMPTY · PARTIAL · ERROR · DENIED
```

- **EMPTY** is the most important copy in the product. It is never "0 results."
  When there is no supply, it is the Demand Escrow flow.
- **PARTIAL** must say what is missing. Silently showing three of seven is a lie
  of omission.
- **DENIED** must be indistinguishable from "does not exist" to an unauthorized
  caller. Never "you don't have permission to see Patient Smith."
- **ERROR** says what failed and what the user can do. Never a stack trace, never
  a code alone, never "something went wrong."

## 4.3 Forbidden components

No dead buttons · no fake progress · no placeholder handlers · no fake checkout ·
no raw IDs in the UI · no backend jargon (`tenant`, `entity`, `payload`, `enum
value`) · no unfinished technical labels · no unstyled default pages · no
horizontal overflow at any width · no console errors.

Each of these came from a real tester finding. They are requirements, not polish.

## 4.4 Never render an unverified thing as verified

A badge, a checkmark, a green dot and the word "verified" are all the same claim.
Render them only from a server-provided verification state — never from the
presence of an upload, a payment, a match, or a completed course.

---

# PART 5 — MOTION

## 5.1 The motion policy is separate from the performance mode

```
PERFORMANCE:  FULL_REALITY | BALANCED_REALITY | PRECISION_MODE
MOTION:       FULL_MOTION  | REDUCED_MOTION   | STATIC_COMPOSITION
```

They are **two independent axes**. A capable machine with `prefers-reduced-motion`
gets `FULL_REALITY` + `REDUCED_MOTION`. There is no fourth performance mode called
`STATIC` — that conflation is explicitly corrected in `01.5`.

## 5.2 The idle law

```
frameloop = "demand"
```

Animations are **event-bounded**. Never set `state.invalidate = false`. **Target
idle draw calls: 0.**

Forbidden outright: an endlessly rotating rose · crawling dashed edges · ambient
particles · camera drift · any loop that runs when nothing happened.

A laptop fan spinning up on a static page is a product defect, and on a clinical
device it is a battery problem someone else pays for.

## 5.3 Motion values

One duration and one easing, from the token layer, applied consistently. Motion
communicates causality — *this happened because you did that* — and nothing else.
If a motion does not answer "what just changed and why," delete it.

## 5.4 Reduced motion is not "less pretty"

Under `REDUCED_MOTION`, transitions become instant state changes, not slower
animations. Under `STATIC_COMPOSITION`, the composition is arranged rather than
animated into place, and it must be legible as a still image.

---

# PART 6 — RESPONSIVE

## 6.1 390px is a requirement, not a breakpoint

**A user at 390px must complete a meaningful task.** Not view a summary — complete
a task. Test with a real task: submit intake, accept a shift, review a result.

Mobile deliberately reduces spatial complexity, navigation depth, motion and data
density. It is a different information architecture, not a narrower one.

## 6.2 Overflow

**The page body never scrolls horizontally, at any width.** Wide content — tables,
diagrams, code, timelines — scrolls inside its own `overflow-x: auto` container
with a visible affordance.

## 6.3 Verify by measuring

```
390 × 844   ·  768 × 1024  ·  1280 × 800  ·  1920 × 1080  ·  200% zoom
```
Report the measurement, not the intention.

---

# PART 7 — ACCESSIBILITY

**3D must never become an accessibility tax.** This is a product law, not a
compliance checkbox.

- **Keyboard**: every action reachable, visible focus, logical order, no traps,
  and a skip link that actually skips.
- **Semantic HTML first.** ARIA patches semantics; it does not create them. A
  `div` with `role="button"` is a worse button.
- **Screen readers**: the DOM twin carries the same objects, relationships and
  actions as the canvas — same substance, different representation.
- **200% zoom**: no loss of function, no clipped content, no overlap.
- **No WebGL**: the site works. Fully. This is tested, not assumed.
- **Contrast**: verified against tokens in both materials, including the
  disabled and quiet states people forget.
- **Motion**: `prefers-reduced-motion` honored, and honored as §5.4 describes.
- **Focus after navigation**: moves to the new content, announced.

---

# PART 8 — THE CANVAS AND THE DOM TWIN

## 8.1 They render from one payload

Both the canvas and the DOM twin consume the **same** server-composed
`RealityProjection`. Two renderers, one truth. If the canvas can show something
the DOM cannot, the DOM is incomplete and that is a bug in the DOM, not a feature
of the canvas.

## 8.2 What the client is allowed to receive

Attention arrives as `AttentionLevel = 'normal' | 'elevated' | 'critical'` plus a
plain-language reason. **Raw scores, weights, gravity values and formulas never
leave the server.** A numeric `gravity: 0..1` in a client payload is the exact
mistake `01.5` was written to correct — it leaks ranking internals to anyone with
devtools.

## 8.3 Selection is a typed intent, not a mutation

A click on a spatial object emits a typed presentation intent — `FOCUS_OBJECT`,
`INSPECT_OBJECT`, `OPEN_ROUTE`, `CHANGE_LENS`, `CHANGE_TIME_VIEW`, camera
controls. The intent vocabulary **structurally excludes** payment, signing,
diagnosis, prescription, credential verification, hiring, claim submission and
organization authorization. Those are not client intents in any mode.

## 8.4 Canvas survival and clearing

The canvas survives route navigation within one disclosure envelope. It is
**fully cleared** — projection, renderer state, focus, labels, buffers — on
logout, login, Person switch, organization switch, role-context switch, any
public↔authenticated crossing, and any privilege change.

**One canvas is not one disclosure context.** Security beats continuity.

---

# PART 9 — COPY IN THE INTERFACE

`05_LANGUAGE_BOOK.md` is binding. The frontend-specific rules:

- **Plain language.** A clinician should never meet a word that exists only
  because of how the backend is organized.
- **Every number carries a truth class** where a user could mistake a model for a
  measurement.
- **Synthetic data is labeled in the same visual field**, not in a footnote. If a
  demo shows `JANE DOE`, `DEMO DATA` is on the screen.
- **Never claim what is not true**: not verified, not compliant, not live, not
  connected, not paid, not settled.
- **Error copy names the next action.** "We couldn't reach the lab. Your order is
  saved and we'll retry — nothing was lost."

---

# PART 10 — DEFINITION OF DONE (FRONTEND)

A frontend change is done when **all** of these are true and evidenced:

- [ ] renders correctly in **both** materials, from tokens, with zero hardcoded colors
- [ ] all five interactive states, disabled states state their reason
- [ ] all five data states, empty state is the honest one
- [ ] keyboard-complete; visible focus; no traps
- [ ] screen-reader-complete; the DOM twin carries the same objects and actions
- [ ] 200% zoom: no loss of function
- [ ] 390 × 844: a meaningful task completes; **no horizontal body scroll**
- [ ] `prefers-reduced-motion` honored per §5.4
- [ ] WebGL disabled: the surface works fully
- [ ] **idle draw calls = 0** — measured, not assumed
- [ ] no console errors or warnings
- [ ] no raw IDs, no backend jargon, no dead controls
- [ ] no PHI in any spatial payload — verified by inspecting the payload
- [ ] no ranking internals, scores or weights in any client payload
- [ ] disclosure envelope clears on all seven authority-change events
- [ ] screenshots at all five widths, in both materials, attached to the PR
- [ ] `npm run lint` · `type-check` · `test` green on the exact head

**"It looks right on my machine" is not on this list and never will be.** Every
line here is measurable, and the report says what was measured.

---

# PART 11 — WHAT TO BUILD FIRST WHEN THE TASK IS VAGUE

When handed "make the frontend better," do these in order and stop for approval
after the audit:

1. **Audit the token layer.** Count hardcoded colors. Count stylesheets above the
   token layer. Report both numbers. This is the highest-leverage frontend work in
   the repository and it is not close.
2. **Delete the override stylesheets.** One PR, tests, screenshots in both
   materials.
3. **Make light mode reachable.** It is currently unreachable; that is a token
   architecture failure, not a missing feature.
4. **Fix the empty states.** They are the most-seen screens in an empty network
   and the most-neglected.
5. **Fix 390px.** Measure first; fix the worst task.
6. **Then, and only then**, anything visual and new.

Steps 1–5 make every future frontend change cheaper. Anything built before them
is built on the thing that needs replacing.
