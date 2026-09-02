# Klinikos Professional Experience Matrix

**Status:** design contract · evidence-based defect inventory + screen matrix
**Base:** `main@16f0824d`
**Lane:** Claude (experience realization). No server, schema, commercial, or entitlement changes.
**Supersedes nothing.** Reconciles upward into the Master Canon; creates no parallel authority.

---

## 0. Why this document exists, and what it corrects

The founder asked for "every role × every major state × Marble/Obsidian × desktop/tablet/mobile
× Zumi behavior." Taken literally that is 12 roles × ~18 states × 2 materials × 5 breakpoints ≈
**2,160 cells**. A matrix that size is not a design contract; it is a spreadsheet nobody reads,
and it would encode a false claim — that a role is a design axis.

It is not. In this repository a role is a **projection onto a shared surface**
(`primaryNavigationForRole`, `src/lib/navigation-experience.ts`), and a material is a **property
of a token set**, not a second product. So the tractable factoring is:

| Requested axis | Real status in this codebase | Treatment here |
|---|---|---|
| Role | Projection over shared surfaces | **Filter**, not a multiplier |
| Surface | 106 route files, ~30 real destinations | **The unit of design** |
| State | Genuinely distinct per surface | **Enumerated once per surface** |
| Marble / Obsidian | One token set, two value tables | **Property**, verified by test |
| Breakpoint | Recomposition rule, not a redesign | **Rule**, stated once |
| Zumi | Four surfaces, one capability model | **Mode**, declared per surface |

That collapses ~2,160 cells to **~30 surfaces × states** — a list a person can actually hold,
and one that maps 1:1 onto Screen Experience Contracts the CLAUDE.md completion gate already
requires.

---

## 1. Measured defect inventory

Every number below was counted on `main@16f0824d`. None is an impression.

### 1.1 The finding that reframes the whole audit

The external audit says *"Light mode is essentially absent"* and *"Full Light / Dark / System
theme architecture"* is needed.

**The theme architecture is already built and is correct.** `src/lib/design/atmosphere.ts`
exposes exactly `system | light | dark`, resolves `system` against `prefers-color-scheme`,
normalizes legacy `dawn/day/golden/night` values, and ships an inline bootstrap that prevents
theme flash. `src/app/design-tokens.css` defines a complete Marble value table beside the
Obsidian one.

The defect is not a missing feature. It is this:

> **2,206 hardcoded hex literals across 130 `.tsx` files.**

A literal cannot respond to a theme. Marble is not absent — it is *unreachable*, because the
surfaces paint themselves Obsidian directly and never ask the token layer. Every "dark-on-dark,"
"low contrast," and "no light mode" observation in the audit is a downstream symptom of that one
count.

This matters commercially: "build a light mode" reads as a quarter of work. "Convert literals to
existing tokens, surface by surface, with a test that keeps them out" is a mechanical, testable,
parallelizable task that is already 89 literals done (`app-shell.tsx`, PR #505 — which brings main's 2,206 to 2,117).

Worst concentrations (literal occurrences, not lines):

| Literals | File |
|---|---|
| 122 | `src/app/legal/accept/LegalAcceptanceClient.tsx` |
| 102 | `src/app/edu/(lab)/demo-kit/page.tsx` |
| 95 | `src/components/clinic/zumi-presence.tsx` |
| 89 | `src/components/clinic/app-shell.tsx` — **converged in PR #505** |
| 82 | `src/app/edu/(lab)/programs/[pathway]/page.tsx` |
| 78 | `src/components/clinic/medications-workspace.tsx` |
| 50 | `src/app/edu/(lab)/programs/page.tsx` |
| 45 | `src/components/marketing/ecosystem-flywheel.tsx` |
| 45 | `src/app/(platform)/paths/[pathId]/page.tsx` |

Nine files carry 708 of the 2,206 — **32% of the debt in 7% of the affected files.** The
convergence is therefore front-loaded, not evenly spread, which is what makes the wave plan in
§7 cheap to start.

This metric is enforced, not tracked by hand: `tests/theme-literal-ratchet.test.ts` fails when
the count rises. It was mutation-tested — adding a single literal moved it from 2,206 to 2,207
and failed the guard — so a passing ratchet is evidence rather than decoration.

### 1.2 "Tiny content on huge screens," measured

| Breakpoint prefix | Occurrences |
|---|---|
| `sm:` | 895 |
| `lg:` | 481 |
| `xl:` | 228 |
| `md:` | 118 |
| `2xl:` | 23 |

The product is designed **upward from mobile and stops at laptop**. `2xl:` — the only ultrawide
affordance — appears 23 times against 895 for `sm:`, a 39:1 ratio.

Compounding it, the dominant content ceiling is `max-w-3xl` (**124 uses**), which is 768px. On a
1920px monitor that is 40% of the viewport carrying the content and 60% carrying nothing. The
audit's "content is tiny in the middle of huge screens" is precisely `max-w-3xl` × low `2xl:`
coverage. `max-w-[1500px]` (53 uses) is the correct existing pattern and should become the
default for operational surfaces.

### 1.3 Production reachability

The audit reports a 503. From this environment, `klinikos.io` is worse than a 503:

```
https://www.klinikos.io/            000  25.0s (timeout, no response)
https://www.klinikos.io/api/health  000  25.0s
https://www.klinikos.io/login       000  25.0s
control: https://example.com        200  0.37s
control: https://api.github.com     200  0.24s
```

Egress from this environment is healthy; the two controls prove it. Klinikos returns nothing at
all. **This is not proof of a total outage** — a WAF or geo rule could be dropping this egress
IP, which is a different problem from a down deploy, and a 503 (audit) and a timeout (here) are
different failure modes. It is enough to classify production reachability as
**UNVERIFIED — investigate before any release claim**, and it belongs to the platform lane, not
this one.

### 1.4 What the audit says is missing but is already built

Reported as absent, verified present. Building these again would be waste:

- **System/Light/Dark model** — `src/lib/design/atmosphere.ts`, with flash prevention.
- **Role-projected navigation** — `primaryNavigationForRole` caps at five permission-filtered
  destinations; `canOpen` resolves nested routes to their governing workspace rule.
- **Command surface** — `⌘K` "Explore Klinikos" modal exists in `app-shell.tsx` with correct
  `role="dialog" aria-modal="true"` semantics.
- **Semantic token layer** — 25 `--k-*` tokens, each defined once per material.
- **Four Zumi surfaces** — `zumi-command-shell`, `zumi-presence`, `zumi-operating-map`,
  `public-zumi-site-control`.

The gap is **convergence and density**, not absence. That is a materially cheaper and more
credible position than the audit's framing, and it should be stated plainly to any evaluator.

---

## 2. Design laws this matrix enforces

1. **A literal colour is a defect.** Colour resolves through `--k-*` or it does not ship.
2. **Role filters; it never forks.** One surface, projected. A second role-specific screen for
   the same object is a bug.
3. **Material changes atmosphere, never architecture.** If Marble and Obsidian differ in layout,
   affordance, or information, that is a defect.
4. **Breakpoint recomposes; it never truncates.** Small screens reorder and stack. They do not
   drop information the person is accountable for.
5. **Every state is designed, or the surface is unfinished.** Loading, empty, no-result, error,
   offline, unauthorized, blocked, pending, degraded.
6. **Capability state is truthful.** `AVAILABLE · SETUP REQUIRED · CONNECTION REQUIRED ·
   SANDBOX · LIVE · DEGRADED · UNAVAILABLE`. Never imply a connection that does not exist.
7. **Zumi prepares; the server authorizes.** Zumi may draft, explain, rank and stage. It may
   never convert its own suggestion into authority.

---

## 3. The surface matrix

**Legend.**
Density: `E` editorial (marketing/explanatory) · `O` operational (dense, table/inspector) ·
`F` focused (single-task, form/decision).
Zumi: `—` none · `P` public explain-and-draft · `D` dock · `I` inline record-aware ·
`W` workspace.
Status: `EXISTS` · `PARTIAL` · `PROPOSED` · `REQUIRES BACKEND`.

### 3.1 Public / pre-identity

| Surface | Density | Ceiling | Zumi | Distinct states beyond default | Status |
|---|---|---|---|---|---|
| `/` Living Home | E | 1500 | P | loading, zumi-unavailable | PARTIAL |
| `/how-it-works`, `/capabilities`, `/ecosystem` | E | 1240 | P | — | EXISTS |
| `/pricing`, `/grid/pricing` | E | 1500 | P | quote-only offer, sandbox-price notice | PARTIAL |
| `/trust`, `/legal/*` | E | 1240 | — | document-unavailable | EXISTS |
| `/grid/browse`, `/grid/browse/[listingId]` | O | 1500 | P | empty, no-result, listing-withdrawn | PARTIAL |
| `/edu` public discovery | E | 1500 | P | empty, enrollment-closed | PARTIAL |
| `/signup`, `/start`, `/access`, `/activate` | F | 560 | P | validating, taken, invite-expired, blocked | PARTIAL |
| `/login`, `/portal/login` | F | 460 | — | invalid, locked, MFA, session-expired, org-lookup-failed | **PARTIAL — priority** |

**Login is the single highest-leverage public surface.** It is the first authenticated
impression, the audit calls it out explicitly, and it is small enough to finish completely.
Required: password visibility toggle, recovery path, password-manager compatibility
(`autocomplete` attributes), accessible error association (`aria-describedby`), visible focus,
explicit disabled-reason, and a clinic-code lookup that **must not disclose organization
existence** to an unauthenticated caller.

### 3.2 Authenticated shell

| Surface | Density | Ceiling | Zumi | Distinct states | Status |
|---|---|---|---|---|---|
| AppShell chrome | — | fluid | D | context-switching, degraded, offline | **EXISTS — tokens converged (PR #505)** |
| `/dashboard` Living Home | O | 1500 | D | loading, empty, partial, blocked | PARTIAL |
| `⌘K` Explore Klinikos | F | 720 | — | no-result, permission-filtered | EXISTS |
| Appearance control | F | — | — | system-resolved | EXISTS |

Shell invariants: organization, location, and active context are **persistently visible**; a
server-resolved context change **clears prior-context data before paint** (context switch is a
security event); navigation shows at most five destinations, permission-filtered.

### 3.3 Operational surfaces

| Surface | Density | Ceiling | Zumi | Distinct states | Status |
|---|---|---|---|---|---|
| `/encounters/[encounterId]` Current Visit | O | fluid split | I | loading, unsigned, blocked, co-sign-required, degraded-source | PARTIAL |
| `/patients/[patientId]` | O | 1500 | I | loading, restricted, merged-record | PARTIAL |
| `/front-desk` | O | fluid | D | empty-day, offline | PARTIAL |
| `/provider` | O | 1500 | D | no-assignment | PARTIAL |
| `/billing` Financial OS | O | fluid | I | loading, no-exception, blocked-from-billing, denial, reconciliation-pending | PARTIAL |
| `/cases/[caseType]/[caseId]` | O | 1500 | I | pending, blocked | PARTIAL |
| `/patients/new` | F | 720 | — | validating, duplicate-candidate | EXISTS |

Current Visit and Financial OS are the two surfaces where **density is the product**. Both are
`max-w-3xl`-class today and both must move to a fluid split-pane with an inspector rail.

### 3.4 Grid

| Surface | Density | Ceiling | Zumi | Distinct states | Status |
|---|---|---|---|---|---|
| `/grid/workspace` | O | fluid | D | empty, no-eligible-supply | PARTIAL |
| `/network/map`, `/grid/locations` | O | fluid map | D | loading, no-coverage, **never-fabricated pins** | PARTIAL |
| `/grid/opportunities`, `/grid/requests` | O | 1500 | D | empty, ineligible-with-reason, expired | PARTIAL |
| `/grid/needs/new` | F | 720 | W | draft, incomplete-requirements, policy-blocked | PARTIAL |
| `/grid/needs/[demandId]/matches` | O | fluid | I | no-match, eligibility-failed | PARTIAL |
| `/grid/providers`, `/grid/services`, `/grid/resources` | O | 1500 | D | empty, unverified-supply | PARTIAL |
| `/grid/payouts`, `/grid/transactions` | O | 1500 | I | pending, disputed, settlement-pending | PARTIAL |
| `/grid/trust`, `/grid/availability`, `/grid/handoffs` | O | 1500 | D | expiring-credential, lapsed | PARTIAL |

Grid law, restated as a design rule: **an ineligible result is never silently ranked lower — it
is excluded, and the reason is shown.** Eligibility precedes ranking on the screen exactly as it
does on the server.

### 3.5 EDU

| Surface | Density | Ceiling | Zumi | Distinct states | Status |
|---|---|---|---|---|---|
| `/edu/dashboard` | O | 1500 | D | no-enrollment | PARTIAL |
| `/edu/courses`, `/edu/courses/[courseId]` | E/O | 1500 | I | locked, prerequisite-unmet | PARTIAL |
| `/edu/programs/*` | E | 1500 | P | **-52/-29 literals; heaviest debt** | PARTIAL |
| `/edu/lab/[assignmentId]`, `/edu/scenarios` | F | fluid | W | in-progress, submitted, graded | PARTIAL |
| `/edu/competencies`, `/edu/certificates`, `/edu/completions` | O | 1500 | I | pending-review, **never-implies-licensure** | PARTIAL |
| `/edu/grading`, `/edu/cohorts`, `/edu/sessions` | O | fluid | D | empty-queue | PARTIAL |
| `/edu/programs/[pathway]` placement | O | 1500 | I | **unverified-school/program (#512)** | REQUIRES BACKEND |

Every EDU evidence surface must carry the standing disclaimer boundary: education evidence is
never licensure, certification authority, scope of practice, guaranteed employment, or
guaranteed Grid eligibility.

### 3.6 Ownership, admin, Zumi

| Surface | Density | Ceiling | Zumi | Distinct states | Status |
|---|---|---|---|---|---|
| `/settings`, `/[workspace]` | F | 900 | D | saving, conflict, unsaved-changes | PARTIAL |
| `/owner/founding-program`, `/founding-clinic` | E | 1240 | D | application-pending | PARTIAL |
| `/admin/*` (11 routes) | O | fluid | D | unauthorized, empty | PARTIAL |
| `/zumi` workspace | F | fluid | W | thinking, needs-confirmation, unavailable, capability-denied | PARTIAL |
| `/paths`, `/paths/[pathId]` | O | 1500 | D | blocked-step | PARTIAL |

---

## 4. State vocabulary — designed once, reused everywhere

Rather than restating states per surface, each surface above names only what is **distinct**.
These are the shared defaults every surface inherits and must render:

| State | Rule |
|---|---|
| `loading` | Skeleton in the destination's own shape. Never a spinner over a blank ground. |
| `empty` | Explains the reason and offers the action that would populate it. |
| `no-result` | Distinct from `empty`: the filter matched nothing; offer to widen it. |
| `error` | What failed, whether it is retryable, who to contact. Never a stack trace. |
| `offline` | Read-only with an explicit banner; writes queue or refuse, never silently drop. |
| `unauthorized` | States that authority is missing without disclosing what exists. |
| `blocked` | Names the specific unmet requirement and its owner. |
| `pending` | Names what is being waited on and the expected resolution path. |
| `degraded` | An external dependency is down; product still works, truthfully labelled. |
| `ai-unavailable` | Zumi is down. The surface remains fully operable without it. |

The last row is a law: **no surface may become unusable because Zumi is unavailable.**

---

## 5. Zumi capability model

Four surfaces, one model. Zumi's modes differ in placement and context, never in authority.

| Mode | Placement | Context | May do | May never do |
|---|---|---|---|---|
| **Public (P)** | Marketing, discovery | None beyond session | Explain, understand intent, build unsaved drafts | Persist, act, read any tenant data |
| **Dock (D)** | Persistent shell panel | Person + org + location + role | Summarize, navigate, draft, stage governed actions | Execute a consequential action without confirmation |
| **Inline (I)** | Inside a record | The record + its authority | Explain this record, surface change, prepare next step | Alter authoritative clinical or financial truth |
| **Workspace (W)** | Full surface | Multi-step task | Compose a plan across steps | Grant itself authority to complete one |

**Action classification** — every Zumi-proposed action carries exactly one:
`INFORMATION` · `NAVIGATION` · `DRAFT` · `RECOMMENDATION` · `REVERSIBLE` · `CONSEQUENTIAL`.

`CONSEQUENTIAL` (clinical signature, claim submission, external send, payment or payout,
publishing governed professional service, regulated order, altering authoritative clinical data)
follows exactly: **PREPARE → SHOW → HUMAN CONFIRMATION WITH REQUIRED AUTHORITY → SERVER
EXECUTION → VERIFIED RESULT → AUDIT.** There is no path from a Zumi suggestion to a completed
consequential action that does not pass through server-resolved authority.

**Response rendering.** Zumi returns structured components, not prose, whenever a structure
exists: action card, status card, task list, form, table, timeline, person, resource, Grid match,
claim summary, placement, appointment, document, comparison, warning, approval request,
navigation. Prose explains; structure enables action. "Who can cover Friday?" returns eligible
people — not a paragraph about finding them.

**Confidentiality (non-negotiable).** The browser never receives hidden prompts, model routing,
ranking weights, anti-gaming logic, fraud/trust internals, or security topology. Zumi's reasoning
chain is server-side; the person sees the conclusion and the evidence, never the mechanism.

---

## 6. Breakpoint recomposition rule

One rule, five widths. Not five designs.

| Width | Rule |
|---|---|
| 375 | Single column. Inspector becomes a sheet. Table becomes cards. Nav becomes a bar. |
| 768 | Two columns where a natural pair exists. Inspector still a sheet. |
| 1024 | Primary + inspector rail. Tables gain real columns. |
| 1440 | Full composition: nav + primary + inspector. **Operational ceiling `1500px`.** |
| 1920+ | Rail widens, primary gains columns or a third pane. **Content never merely centres.** |

Editorial surfaces keep a reading measure (`1240px`); they are the one legitimate use of a
narrow ceiling on a wide screen. `max-w-3xl` on an **operational** surface is a defect.

---

## 7. Execution order

Each wave is one PR, one purpose, with the guard test that keeps the defect from returning.

| Wave | Work | Guard |
|---|---|---|
| **W0** ✅ | AppShell literal convergence (89 → 0) | `tests/shell-theme-convergence.test.ts` (PR #505) |
| **W1** | Login + portal login finished completely | a11y + state assertions on the auth surfaces |
| **W2** | Current Visit + Financial OS literals → tokens; `max-w-3xl` → fluid split | per-surface no-hex guard |
| **W3** | Grid surfaces: literals, eligibility-reason display, map empty states | eligibility-before-rank render test |
| **W4** | EDU: the -52/-29/-67 literal files; licensure-boundary copy | no-hex guard + boundary-copy assertion |
| **W5** | `2xl:` recomposition across operational ceilings | ceiling-policy test |
| **W6** | Zumi response-component system + action classification | classification exhaustiveness test |

Repo-wide literal count is the single tracking metric: **2,206 → 0.** It is objective, monotone,
and each wave moves it measurably.

---

## 8. Boundaries — what this lane will not do

Per the ownership law, this document **stops at the interface** for:

- **Commercial / Stripe / entitlement convergence** — owned by PRs #517, #519, #498, #514.
- **School/program verification schema (#512)** — reserved for Codex; requires migration.
- **Production reachability** — platform lane; evidence recorded in §1.3.
- **Grid ranking weights, Zumi prompts, fraud logic** — server-only, by §37/§46.

Where a surface state above requires server truth that does not exist yet (`unverified-school`,
`settlement-pending`, `capability-denied`), the surface renders a **truthful blocked state**. It
does not fabricate the data, and it does not hide the gap.

---

## 9. Open contradiction requiring founder resolution

Not a design question, but found while grounding this document, and it will corrupt the
commercial registry if it is merged either way by accident:

| Source | Professional Pro price | Lookup keys |
|---|---|---|
| Handoff §18 ("I corrected an important pricing mistake") | **$49/mo · $499/yr** | `..._pro_monthly_v3` / `_annual_v3` |
| Stripe sandbox implementation report | **$39/mo · $399/yr** | (v2-era) |
| `main@16f0824d` — `grid-economics.ts:188` | `grid_pro` = **$4,900 cents = $49** | not yet Stripe-mapped |

Two of the three agree on **$49**, and main already encodes it. The handoff explicitly states the
$39/$399 prices "were retired." The implementation report listing $39 is therefore either stale
or the retirement did not complete in the sandbox. **Nothing in `main` is wrong today** —
`product-catalog.ts` does not yet carry a professional price at all, so there is still time.

This is flagged, not fixed: the commercial registry is another lane's active tranche.

---

*Frontend lane. No server, schema, commercial, or entitlement behaviour changed by this
document.*
