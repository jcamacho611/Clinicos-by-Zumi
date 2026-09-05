# Klinikos One-Shell Customer Convergence Design

**Date:** 2026-09-02  
**Status:** Approved founder direction translated into implementation design  
**Authority:** Subordinate to `docs/KLINIKOS_MASTER_CANON.md`, current verified implementation truth, and `docs/KLINIKOS_UNIVERSAL_FRONTEND_AND_USER_OUTCOMES_CANON.md`  
**Scope:** `klinikos.io` public entry, person/member experience, clinic/organization app, patient portal presentation, company/founder application, Zumi presence, context switching, navigation, theme, customer language, privacy boundaries, and cross-application continuity

---

## 1. Purpose

Klinikos must feel like **one product**, even though it contains many applications, authorization domains, workflows, and commercial surfaces.

The permanent customer-facing model is:

> **ONE KLINIKOS → ONE DURABLE PERSON IDENTITY → ONE DESIGN/SHELL GRAMMAR → MANY GOVERNED APPLICATIONS → ONE ZUMI IDENTITY → ROLE/CONTEXT-APPROPRIATE EXPERIENCE.**

This does **not** mean one database table, one session cookie, one universal permission set, one giant page, or one superuser. It means the human experiences continuity while the backend preserves strict authority boundaries.

The complexity belongs to Klinikos, not to the person using Klinikos.

---

## 2. Root-cause audit: hidden issues found in current `main`

### 2.1 Shell fragmentation — P0 experience architecture

Current implementation has multiple independent shell/chrome implementations:

- clinic/organization users render through `src/components/clinic/app-shell.tsx`;
- free Person/member users render through `src/components/living-universe/universe-shell.tsx`;
- patient users render through `src/components/portal/portal-dashboard.tsx`;
- public routes have their own header/utility/Zumi presentation authority.

Different authorization realms are correct. Different product identities are not.

**Correction:** preserve the independent auth/authority domains, but converge them onto one shared **Klinikos shell frame and interaction grammar**. Each realm supplies a server-projected shell contract rather than inventing its own branding, chrome, theme vocabulary, navigation grammar, and assistant treatment.

### 2.2 Internal architecture leaks into customer language — P0 comprehension

The member surface currently exposes terms such as:

- `Five-plane lens`;
- canonical plane names;
- `One person · governed paths`;
- `Your living context`;
- `Person profile`;
- `governed` / `claim` / `authority` language in first-order copy.

These are valuable internal concepts but violate the frontend law that a normal user should not have to understand the five-plane architecture, graph model, policy engines, evidence semantics, or state machines merely to get value.

**Correction:** canonical plane IDs and truth semantics remain in server/domain projections, but customer-facing copy becomes outcome-oriented. Advanced X-Ray/evidence views may expose deeper semantics deliberately and with plain-language explanations.

### 2.3 One identity is not yet one active-context experience — P0 product/security

The durable `Person`, organization membership, location assignment, relationship, and evidence foundations exist. `resolvePersonExperienceContext()` already supports explicit organization/location/purpose selection and correctly refuses to infer authority. However, the clinic `ClinicSession` and its shell are still bound to one organization and one clinic role.

**Correction:** migrate incrementally. Do not rewrite auth. Add a validated **Experience Context projection** alongside legacy clinic sessions, then adopt it in shell presentation and context switching. Existing organization-bound clinic login remains compatible until the migration is complete.

### 2.4 Context switching can become a cross-tenant leak if treated as a dropdown — P0 security

Switching organization/location/role/purpose is a security event, not cosmetic state.

A safe switch must:

1. submit the requested context to the server;
2. resolve the Person against active membership/location relationships;
3. re-run deterministic authorization inputs;
4. rotate or refresh the active session/context identifier as appropriate;
5. invalidate client caches scoped to the previous context;
6. cancel or discard pending mutations/drafts that cannot safely cross context;
7. clear object selection, notifications, search results, and Zumi conversational context that are tenant/object scoped;
8. redirect to a destination permitted in the new context;
9. write an audit/security event where policy requires it.

Never carry PHI or organization-private state from Context A into Context B because React/client state survived navigation.

### 2.5 One identity must not collapse safe authentication realms — P0 privacy

The patient portal intentionally has separate patient-auth/session governance. The company/founder plane must also remain separate from ordinary clinic-tenant authority.

**Correction:** `one identity` means one durable Person graph where relationships can be linked when legitimately established. It does **not** mean an employee session automatically becomes a patient session, or a Klinikos corporate founder session becomes a customer-clinic superadmin session.

Patient, clinic, member, and company authority must remain separately governed even if future identity linking improves continuity.

### 2.6 Founder Command must not be implemented as `clinic_owner++` — P0 authority

The existing clinic RBAC describes authority inside a customer organization. Klinikos corporate/founder authority is a different domain.

**Correction:** Company/Command must use a corporate authority namespace and corporate data boundary. A software-company founder does not receive customer PHI simply because they own Klinikos. Customer support/access requires a separate audited support/break-glass mechanism with explicit reason, scope, duration, and tenant boundary.

### 2.7 Zumi can become a cross-context disclosure channel — P0 AI/privacy

There should be one Zumi identity, but not one unscoped conversation memory.

**Correction:** every Zumi interaction receives explicit server-projected context:

- auth realm;
- Person/account identifier;
- organization/location/purpose where applicable;
- active object;
- allowed tools/capabilities;
- minimum-necessary evidence;
- conversation scope identifier.

On context switch, tenant/object-sensitive Zumi state must reset or be re-authorized before reuse. Zumi may remember safe personal preferences where policy allows, but it must never carry Clinic A PHI/private operations into Clinic B or a public/member context.

OpenAI/model providers remain intelligence providers behind the Klinikos server boundary. They do not own Klinikos authorization or canonical state.

### 2.8 Theme/material authority is only partially converged — P1 design system

The main design-token substrate supports Marble/light and Obsidian/dark, but several shells and surfaces still hard-code Obsidian values. Current PR work is converging the clinic shell; the member shell still hard-codes a separate dark environment and fake text mark.

**Correction:** every shared shell/chrome surface consumes semantic tokens. Surface-specific density/composition is allowed; route/application-specific brand fragmentation is not.

Customer appearance remains `System / Light / Dark`.

- Light/System-light → Marble operational expression.
- Dark/System-dark → Obsidian operational expression.
- Public hero/cinematic moments may have controlled presentation rules but cannot create a second theme system.

### 2.9 Brand identity is inconsistent — P1 trust

Member currently renders a hand-built `K` treatment instead of the canonical Klinikos brand component. Patient portal leads with the clinic organization rather than a coherent Klinikos/organization relationship.

**Correction:** shared shell branding uses the approved `KlinikosWordmark`/orbital mark. Tenant/organization identity appears as context, not as a replacement product brand.

For patient-facing experiences, the organization remains prominent because it is the patient's care relationship, but Klinikos appears consistently and quietly as the platform identity where appropriate.

### 2.10 Navigation has a nested-route authorization/presentation defect — P0 discoverability

`navigation-experience.ts::canOpen()` currently reduces every nested destination to its first URL segment. This is correct for `/grid/workspace` because Grid uses a top-level `grid` workspace rule, but it is wrong for routes with explicit nested rules such as `/owner/founding-program` and `/admin/sales`.

**Correction:** resolve the **longest explicit workspace rule matching the path**, then fall back to the top-level segment. Navigation visibility remains presentation only; destination authorization still revalidates server-side.

### 2.11 Product taxonomy must not become permanent navigation — P1 usability

The founder direction names large application families such as Clinic, Money, Network, Learn, Grid, Company, and Zumi. These are useful product/marketing concepts, but forcing the same five labels on every role would make daily work slower.

**Correction:** one shell grammar, **role/action-first primary navigation**.

Examples:

- provider: Home / Today / Patients / Care / Results;
- front desk: Home / Today / Patients / Follow-up / Tasks;
- biller: Home / Money / Readiness / Follow-up / Tasks;
- clinic owner: Home / Today / Money / Network or Grid / Team;
- free member: Home / Opportunities / Learn / Profile or relevant next actions;
- patient: Home / Appointments / Forms or Care / Messages / Account;
- company founder: Home / Company / Product / Pipeline / Money / Risk, projected through a corporate authority domain.

Broader application families remain discoverable through Explore/search/Zumi/contextual links. The user does not need to navigate product architecture.

### 2.12 Public → authenticated continuity is part of the shell, not marketing handoff — P1 activation

A visitor may begin with a public intent. Safe non-sensitive intent should survive signup/login and become a first useful action after authentication. Raw prompts, PHI, patient identifiers, secrets, or unbounded free text must not be persisted as generic continuation state.

Use bounded, typed, expiring server-revalidated intent continuity and existing same-origin safe-return semantics.

### 2.13 Client cache keys and object state need context scope — P0 data isolation

Any future client cache/store/query key containing tenant data must include the active security context or be destroyed on context transition. This applies to:

- search;
- notifications;
- patient lists;
- Grid private workspace data;
- billing;
- Zumi retrieval/context;
- active object/inspector;
- drafts;
- optimistic mutations.

No global store may preserve customer-private objects across organization switches unless the stored value is explicitly person-owned and safe across those contexts.

### 2.14 Deep links need safe context resolution — P1 continuity/security

A deep link to a protected object must never leak whether an object exists when the active context cannot access it.

If the Person has a legitimate alternative context that may access the destination, Klinikos may offer a generic `Switch context to continue` flow without revealing sensitive object details before authorization.

### 2.15 Company telemetry must be separated from customer record access — P0 trust

Company Command may consume product telemetry, commercial state, GitHub state, payment state, support health, and aggregated customer operational indicators where contracts/policy permit. It must not become a backdoor global patient-record browser.

Use minimum-necessary, aggregated, de-identified, or explicitly authorized projections depending on purpose.

### 2.16 External connector evidence is not canonical authority — P1 truth

GitHub, Outlook/email, Stripe, finance sources, EHRs, and other systems provide evidence. Their objects do not automatically become Klinikos truth.

Examples:

- email ≠ opportunity stage;
- Stripe product ≠ sellable entitlement;
- payment redirect ≠ payment;
- GitHub mergeable ≠ deployed/live;
- balance observation ≠ audited financial statement;
- external professional listing ≠ verified professional authority.

Normalize evidence first; then let deterministic domain rules derive the current state.

### 2.17 Public repository visibility conflicts with the crown-jewel protection strategy — P0 company/IP

Current repository metadata reports public visibility. The repository also contains substantial architecture, governance, product, commercial, and proprietary implementation material.

This is incompatible with a strategy that relies on keeping crown-jewel source/logic/documentation confidential unless public release is intentional and all sensitive material has been deliberately excluded.

**Required founder/security decision:** either make the repository private and preserve necessary deployment/integration access, or formally define a public/open-source boundary and move crown-jewel material to private repositories. Do not assume server-side browser boundaries protect source code that is itself publicly readable in GitHub.

---

## 3. One shell does not mean one chrome layout

The shared architecture is a **shell frame + server-projected shell contract**, not one giant component that renders identical navigation everywhere.

### 3.1 Shared frame responsibilities

Create/reuse a common shell grammar responsible for:

- canonical Klinikos brand treatment;
- appearance/material semantics;
- active context identity;
- primary navigation presentation;
- Explore/global search entry;
- Zumi access mode;
- attention/notification entry where supported;
- account/profile menu;
- responsive/mobile chrome;
- skip/focus landmarks;
- safe-area handling;
- route-transition continuity.

### 3.2 Shell projection

Conceptual contract:

```ts
export type KlinikosShellProjection = {
  realm: "person" | "clinic" | "patient" | "company";
  identity: {
    displayName: string;
    avatarLabel?: string;
  };
  context: {
    label: string;
    detail?: string;
    switchable: boolean;
  };
  navigation: Array<{
    href: `/${string}`;
    label: string;
    icon: string;
  }>;
  exploreAvailable: boolean;
  appearanceAvailable: boolean;
  zumi: {
    mode: "global" | "inline" | "route_owned" | "unavailable";
    prompt?: string;
  };
  attention?: {
    count: number;
    label: string;
  };
};
```

This is presentation only. It does not grant authority.

### 3.3 Realm-specific projection

**Person/member**  
Focus: next useful action, opportunities, learning, profile/evidence. No organization is fabricated.

**Clinic/organization**  
Focus: role-derived daily work. Organization/location/purpose context is explicit.

**Patient**  
Focus: appointments, forms, released information, messages, payments/account. Patient auth remains isolated. No clinic internal operations.

**Company/founder**  
Focus: company/product/revenue/capital/risk evidence. Separate corporate authority. No implicit customer PHI access.

---

## 4. Customer language law

The visible surface uses ordinary action language. Internal terms remain in code/evidence views where appropriate.

| Internal | Normal customer language |
|---|---|
| five planes | hidden; optionally `Views` in advanced exploration |
| healthcare universe plane | Connections |
| economic/resource plane | Opportunities / Needs & resources |
| lifecycle plane | Journey / Next steps |
| operating infrastructure plane | Activity / Work |
| compounding business plane | Growth / Outcomes |
| Person | You / Profile |
| organization membership | Your role at [organization] |
| context selection | Switch workspace / Working as |
| claim state | Not verified yet / Information you added |
| verification state | Verified / In review / Not verified |
| authority | What you can do |
| eligibility | Ready / Requirements remaining |
| orchestration | hidden |
| policy engine | hidden |
| Grid eligibility engine | hidden |
| evidence graph | Why you're seeing this |
| path engine | Next steps / Plan |
| command graph | hidden |
| AI tool routing | hidden |

`governed`, `deterministic`, `projection`, `canonical`, `tenant`, `ORM`, `plane`, `state machine`, and similar architecture language should not appear in first-order customer copy unless the user is explicitly in an advanced technical/evidence view.

---

## 5. Zumi: one identity, scoped intelligence

There is one branded Zumi, but presence is projected by route and realm.

### 5.1 Modes

- `global`: shell composer/presence is appropriate;
- `inline`: intelligence belongs beside a specific object/action;
- `route_owned`: the route has its own Zumi experience; global duplicate is suppressed;
- `unavailable`: no AI access in that context.

### 5.2 Authority boundary

`USER → KLINIKOS AUTH/CONTEXT → MINIMUM NECESSARY DATA/TOOLS → ZUMI/MODEL → STRUCTURED PROPOSAL → KLINIKOS POLICY/AUTHORITY → HUMAN APPROVAL WHERE REQUIRED → SERVER ACTION → AUDIT`

No model response becomes canonical payment, credential, clinical, legal, eligibility, or organization authority by itself.

### 5.3 Conversation scoping

Every sensitive conversation is scoped to a context key such as:

`realm + person + organization? + location? + purpose + activeObject?`

Context changes must not silently reuse incompatible sensitive history.

---

## 6. Context switching design

### 6.1 Display

The shell may show a compact control such as:

`Brooklyn Family Medicine · Practice owner ▾`

or:

`Working as: RN · Location A ▾`

The control shows only legitimate contexts already known to the Person/account.

### 6.2 Server action

Conceptual flow:

`REQUESTED CONTEXT → LOAD PERSON CONTEXT → VERIFY ACTIVE MEMBERSHIP/ASSIGNMENT → RESOLVE PURPOSE → ISSUE/ROTATE ACTIVE CONTEXT → AUDIT → SAFE DESTINATION`

### 6.3 Unsafe transition handling

If a page has a meaningful unsaved draft, do not silently switch. Offer:

- Stay here;
- Save/draft if supported;
- Discard and switch.

For consequential clinical/financial work, the domain workflow owns draft semantics; the shell must not invent a generic autosave guarantee.

---

## 7. Navigation resolution law

Persistent navigation is 3–5 destinations for most roles, no more than 7.

`canOpen()` must resolve nested routes using the longest explicit workspace authority key before falling back to a top-level family key.

Examples:

- `/grid/workspace` → fallback `grid` rule when no more-specific rule exists;
- `/owner/founding-program` → explicit `owner/founding-program` rule;
- `/admin/sales` → explicit `admin/sales` rule.

Explore/search may expose deeper authorized capabilities but must use the same production predicate rather than restating authorization.

---

## 8. Visual design law

### 8.1 One material system

Use semantic Klinikos tokens everywhere.

No new shell should hard-code its own complete palette.

- Marble: sustained operational/light expression;
- Obsidian: dark expression;
- same typography, geometry, motion law, focus language, brand assets, and interaction grammar.

### 8.2 Application-specific composition, not application-specific branding

- Living Home: calm, adaptive, action-first;
- Current Visit: clinically dense and quiet;
- Grid: spatial/discovery-oriented;
- Billing: financial precision;
- EDU: guided/editorial;
- Patient: warm, low-cognitive-load;
- Command: executive evidence/decision density.

They may differ in composition and density but remain unmistakably Klinikos.

### 8.3 Canonical branding

Use the real Klinikos brand component/asset. Do not substitute a text `K` or route-specific pseudo-logo when approved assets already exist.

---

## 9. Mobile law

Mobile is not the desktop shell compressed.

Default to:

- 3–4 bottom or compact primary destinations where appropriate;
- one dominant object/action;
- Explore/search and Zumi as global affordances;
- drawers/sheets for secondary inspector/context;
- 44px minimum consequential targets;
- keyboard/focus semantics for attached keyboards;
- 200% zoom support;
- no hover-only information;
- safe-area support;
- no horizontal tables for core actions without an equivalent stacked presentation.

---

## 10. Error, empty, blocked, and unknown states

Customer language must distinguish:

- `Nothing needs attention`;
- `No data yet`;
- `Not connected`;
- `We couldn't load this`;
- `You don't have access`;
- `Switch workspace to continue`;
- `This needs verification`;
- `This action requires review`.

Unknown is never displayed as zero.

A connector failure does not erase last verified evidence; show freshness and stale state when safe.

---

## 11. Measurement

The one-shell program is successful only if it improves outcomes, not merely consistency.

Track per realm where privacy permits:

- time to first useful action;
- navigation depth to common tasks;
- context-switch success/failure;
- wrong-context/denied-route events;
- abandoned signup→first-value rate;
- Zumi action follow-through;
- mobile task completion;
- support requests caused by navigation/comprehension;
- accessibility defects;
- shell/theme drift regressions.

Do not place PHI or sensitive free text in analytics events.

---

## 12. Implementation waves

### Wave 0 — Immediate correctness

1. Fix nested route presentation resolution with RED→GREEN tests.
2. Remove first-order five-plane/internal architecture language from the member surface while preserving canonical IDs underneath.
3. Replace fake member brand mark with canonical Klinikos branding.
4. Move member shell colors onto existing semantic tokens.

### Wave 1 — Shared shell frame

Extract/reuse shared shell primitives without rewriting business routes:

- brand;
- identity/account control;
- context slot;
- navigation slot;
- Explore slot;
- Zumi slot/mode;
- appearance slot;
- responsive chrome.

Clinic `AppShell` and member `UniverseShell` adopt the same frame first.

### Wave 2 — Secure active-context switching

Add server-resolved Person→membership/location/purpose switching with compatibility for existing clinic sessions. Add cache/Zumi/object invalidation and negative cross-tenant tests.

### Wave 3 — Patient presentation convergence

Adopt the same design/chrome grammar in the patient realm while preserving the separate patient authentication/session and minimum-necessary released-record boundary.

### Wave 4 — Public→identity continuity

Finish bounded safe intent continuity from public gateway into signup/login/member or permitted organization destination.

### Wave 5 — Company/Founder Command

Only after corporate authority exists. Build Command as a private application in the shared shell. Do not attach it to clinic-owner RBAC or create global customer-record visibility.

---

## 13. Required tests

### Shell/customer language

- member surface does not render `Five-plane lens`, canonical plane names as first-order navigation, `Person profile`, or `governed paths`;
- canonical plane IDs remain in the projection/data layer;
- approved Klinikos brand component is present;
- shell chrome uses semantic theme tokens rather than a second palette;
- System/Light/Dark affects member + clinic shared chrome consistently.

### Navigation

- `/owner/founding-program` resolves the explicit nested workspace rule;
- `/admin/sales` resolves the explicit nested workspace rule;
- `/grid/workspace` continues to inherit the top-level Grid rule;
- unauthorized links never appear merely because they share a prefix;
- direct route authorization still revalidates independently.

### Context switching

- cannot select an organization without an active membership;
- ambiguous membership fails closed;
- location requires a valid active assignment;
- new context does not carry prior-org domain links;
- prior-org client cache/search/active object/Zumi scope is invalidated;
- deep-link fallback does not reveal protected object existence;
- consequential unsaved work prevents silent switch.

### Zumi

- route-owned Zumi suppresses duplicate global Zumi;
- no cross-organization conversation context reuse;
- model/tool access receives minimum-necessary server projection;
- AI cannot grant authority.

### Patient/company separation

- patient session never inherits clinic/company privileges;
- company/founder authority does not imply customer chart access;
- support access is separately audited and time/scope bound if implemented.

### Accessibility/responsive

- landmarks, skip link, visible focus;
- 44px targets;
- mobile recomposition;
- 200% zoom;
- reduced motion;
- screen-reader context-change announcement;
- context switch returns focus meaningfully.

---

## 14. Explicit non-goals

Do not:

- merge patient and employee auth merely for cosmetic `one identity` claims;
- create a second theme provider;
- create a second Zumi;
- create a new route tree for each application family;
- turn product taxonomy into a mega-menu;
- give the company founder an undocumented superadmin role over customer PHI;
- persist whole Outlook/email conversations into product memory by default;
- copy personal financial records into Klinikos corporate storage without an explicit requirement and data policy;
- expose hidden prompts, ranking weights, policy logic, or security heuristics to the browser;
- fabricate activity to make Living Home feel populated;
- change repository visibility without a deliberate founder/security decision and deployment-impact review.

---

## 15. Release definition

No wave is complete at `code written` or `PR merged`.

Required evidence:

`DESIGN → RED TEST → IMPLEMENT → FOCUSED GREEN → FULL QUALITY → SECURITY CHECK → BROWSER QA → MOBILE/200% ZOOM → MERGE → DEPLOYED SHA → VERIFIED RUNTIME`

For shell changes, browser QA must cover at minimum:

- public root and one public child route;
- `/member`;
- `/dashboard` for clinic owner;
- one provider route;
- one billing route;
- patient portal;
- context-change state when implemented;
- Marble/System-light;
- Obsidian/Dark;
- mobile;
- keyboard-only flow.

---

## 16. Final experience target

A normal person should be able to use Klinikos for months without learning the words `plane`, `projection`, `orchestration`, `tenant`, `eligibility engine`, `policy engine`, or `domain repository`.

They should know only:

- who they are acting as;
- where they are working;
- what matters now;
- what Klinikos knows;
- what is still unverified/blocked;
- what they can do next;
- why a consequential action requires review;
- where to ask Zumi for help.

That is the Apple-level outcome: not decorative minimalism, but **radical simplification produced by disciplined hidden architecture**.
