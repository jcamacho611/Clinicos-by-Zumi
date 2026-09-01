# Klinikos Living Universe Wave A — Person-First Free Entry Implementation Plan

> **For coding agents:** execute this plan with Superpowers TDD discipline. Do not wholesale-merge stale auth/frontend branches. Reuse current `main` first, then selectively recover only compatible implementation from historical PRs.

**Goal:** Turn the currently merged Living Universe design into the first real production tranche: a person can enter Klinikos free without a fabricated organization, preserve only safe public intent, reach a real authenticated person-level Living Home, and continue into Grid discovery while legacy clinic authentication remains unchanged. The public root must stop behaving like a long marketing document and become the interactive Klinikos gateway.

**Base truth at plan creation:** `main@7178c015c8c5e8137a83f5ea1a9bc0753b790149` (includes merged PR #432).

**Authority:** `docs/KLINIKOS_MASTER_CANON.md` → `docs/superpowers/specs/2026-08-31-klinikos-living-universe-entry-grid-design.md` → current verified code/runtime.

**Architecture:** Add an organization-agnostic `Account` authentication principal linked 1:1 to the existing lifelong `Person`. Keep `ClinicSession` and all organization-bound repositories authoritative for clinic work. Add a separate person-level session and a narrow authentication-principal resolver rather than widening `ClinicSession.organizationId` into nullable state. Public entry continuity is a typed, bounded, expiring server-revalidated hint only; raw prompts/PHI never become generic URL/client-storage authority. The first member surface is a truthful Living Universe entry built only from persisted Person/Account state plus existing public-safe Grid/Path projections.

**Selective-recovery source:** PR #360 (`feat/final-form-onboarding-release-20260827`) contains compatible Account/session/signup work, but is stale and must **not** be merged/cherry-picked wholesale. Review each recovered file against current `main`; port semantics into new current-main files/migrations and preserve newer Person/CareerArtifact/Placement/Grid work.

**No-go rules:** no synthetic organization, no second Person table, no second Grid, no patient public profile, no automatic professional verification, no free→eligibility shortcut, no authority from role claims, no raw PHI in continuation state, no Current Visit rewrite, no fake activity/metrics, no weakening legal/migration/security gates.

---

## Task 1 — Lock the RED contract for person-first authentication

**Create:**
- `tests/living-universe-free-entry.test.ts`

**Read/Reuse:**
- `src/lib/auth/types.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/return-to.ts`
- `prisma/models/universal-identity.prisma`
- PR #360 tests as historical acceptance evidence only

**RED assertions:**
1. schema has one `Account` linked to existing `Person`, not Organization;
2. `AccountSession` is account/person scoped and contains no organization/clinic role authority;
3. a free account can authenticate without creating Organization / OrganizationMembership / LocationAssignment;
4. `ClinicSession` remains organization-required and current clinic login remains first-authority for legacy clinic credentials;
5. person-level authentication cannot satisfy `requireClinicSession()` or organization-bound repository signatures;
6. claimed role/purpose is context/evidence only and cannot be stored as verified authority;
7. no patient/PHI authority is introduced.

**Expected RED:** Account/session implementation is absent on current `main`.

Commit the test before production code.

---

## Task 2 — Add the additive Account persistence substrate

**Create:**
- `prisma/models/universal-account.prisma`
- `prisma/migrations/20260901203000_universal_account_foundation/migration.sql`

**Modify:**
- `prisma/models/universal-identity.prisma`

**Recover selectively from #360:**
- `Account`
- `AccountCredential`
- `AccountSession`
- `LegacyUserAccountLink`
- neutral `AccountEvent`

**Current-main corrections:**
- preserve current `Person.relationships` and `Person.careerArtifacts` relations;
- add only Account-related relations;
- use snake_case mapped table names consistent with repo law;
- migration must be additive, foreign-keyed to `people`, and not touch legacy `users`, `auth_credentials`, or `auth_sessions` destructively;
- do not backfill ambiguous emails into authority. Any compatibility backfill must fail closed on duplicate/ambiguous identity.

**Verification target:** Prisma schema validates; full migration chain applies to an empty PostgreSQL database; old clinic auth rows remain valid.

---

## Task 3 — Build person-level credentials and session without diluting ClinicSession

**Create:**
- `src/lib/auth/account-types.ts`
- `src/lib/auth/account-token.ts`
- `src/lib/auth/account-credentials.ts`
- `src/lib/auth/account-repository.ts`
- `src/lib/auth/account-session.ts`

**Modify only if needed:**
- `src/lib/auth/session.ts`

**Interfaces:**
```ts
export type PersonAccountSession = {
  sessionId: string;
  accountId: string;
  personId: string;
  email: string;
  displayName: string;
  expiresAt: number;
};

export type AuthenticationPrincipal =
  | { kind: "clinic"; session: ClinicSession }
  | { kind: "person"; session: PersonAccountSession };
```

**Rules:**
- use a separate cookie/token issuer+audience for person account sessions;
- a clinic token must not validate as a person token and vice versa;
- if a legacy-linked Account is ambiguous/inconsistent with clinic identity, fail closed rather than degrade to a free identity with hidden clinic privilege;
- person session validation must re-read active Account + active Person and revocation/expiry state;
- `getClinicSession()` / `requireClinicSession()` semantics remain unchanged;
- add a new `getAuthenticationPrincipal()` only where a route truly permits either rail.

**TDD:** extend `tests/living-universe-free-entry.test.ts` to prove cross-token rejection and no organization authority widening.

---

## Task 4 — Add safe free signup and login fallback

**Create:**
- `src/lib/auth/free-member-signup.ts`
- `src/app/api/auth/signup/route.ts`
- `src/app/signup/FreeSignupClient.tsx`
- `src/app/signup/page.tsx`

**Modify:**
- `src/app/api/auth/login/route.ts`
- `src/app/login/page.tsx`
- `.env.example` only if a rollout flag remains necessary

**Reuse:**
- existing password hashing/security utilities;
- existing request metadata / abuse controls where available;
- `safeReturnTo` for route continuity;
- current legal registry and acceptance flow, without inventing production approval.

**Rules:**
- clinic credentials are checked before person-account fallback when an email is tied to a current clinic user;
- signup transaction creates only Person + Account + AccountCredential + neutral AccountEvent (and exact legal evidence only if the current legal registry genuinely permits it);
- no Organization, membership, provider, patient, Grid eligibility, EDU completion, payment, or clinic workspace is created;
- duplicate normalized identity/email ambiguity fails closed;
- feature flag defaults off if current legal/release readiness still requires staged rollout.

**RED tests:**
- free signup succeeds with zero organization rows;
- legacy clinic email cannot be silently duplicated as an unrelated free Person;
- weak password rejected;
- free session cannot open `/dashboard` through clinic authorization;
- safe return path preserved only after successful auth.

---

## Task 5 — Add bounded, expiring public intent continuity

**Create:**
- `src/lib/auth/entry-intent.ts`
- `tests/living-universe-intent-continuity.test.ts`

**Modify:**
- `src/components/marketing/public-living-gateway.tsx`
- signup/login handoff as required

**Contract:**
```ts
export type EntryIntent = {
  version: 1;
  kind: "grid_need" | "grid_have" | "career" | "education" | "organization" | "general";
  destination: string;
  geography?: { city?: string; state?: string };
  publicResourceId?: string;
  expiresAt: number;
};
```

**Rules:**
- signed/server-validated or otherwise integrity-protected;
- short TTL;
- same-origin destination via existing `safeReturnTo` semantics;
- no raw public prompt, diagnosis, patient identifier, clinical free text, secrets, or unbounded arbitrary metadata;
- reject PHI-like/sensitive candidates rather than attempting to preserve them;
- replay/expiry must never execute a consequential action; at most restore editable discovery context.

**RED tests:**
- ordinary `I need an RN in Brooklyn` can preserve kind/geography/destination without raw prompt;
- public resource ID can be carried and re-fetched server-side;
- PHI-like patient/diagnosis text is not serialized;
- expired/tampered token fails closed;
- external/`//` return paths rejected.

---

## Task 6 — Replace the root marketing document with the interactive gateway

**Modify:**
- `src/app/page.tsx`
- `src/components/marketing/public-living-gateway.tsx`
- `tests/public-living-home.test.ts`

**Remove from root composition (do not necessarily delete components repo-wide):**
- `<ProductEvidenceSection />`
- `<EcosystemHierarchy />`

**Keep:**
- SEO structured data;
- `PublicLivingGateway` as the dominant application entry;
- a minimal trust/legal footer only if it does not turn the page back into a stacked brochure;
- current Black Label cinematic composition and accessible Zumi conversation.

**Product behavior:**
- first viewport remains `WHAT NEEDS TO HAPPEN?` / Zumi-led intent;
- Zumi result can transition into free signup/login with bounded intent continuity;
- public Grid/EDU/open-safe destinations remain immediately usable when login is not required;
- no module picker/card wall is added;
- no fake activity, fake clinic, fake network or fake testimonials.

**RED source contract:** root page fails while static evidence/hierarchy sections remain mounted; passes only when the root is the interactive gateway rather than a marketing document.

---

## Task 7 — Build the first person-level Living Universe surface

**Create:**
- `src/app/member/page.tsx`
- `src/components/living-universe/universe-shell.tsx`
- `src/components/living-universe/object-stage.tsx`
- `src/components/living-universe/plane-lens.tsx`
- `src/components/living-universe/inspector.tsx`
- `src/components/living-universe/action-dock.tsx`
- `tests/living-universe-member-home.test.ts`

**Reuse:**
- canonical five-plane graph labels/contracts;
- public-safe Grid discovery/resource detail links already on `main`;
- existing Paths only where they can be projected without organization-only `ClinicSession` assumptions;
- existing Zumi public/member-safe capability, never hidden clinical/organization data.

**Initial active object for a new free member:** their own Person/profile/network entry state.

**Exactly five lenses:**
1. Healthcare Universe
2. Economic & Resource
3. Lifecycle
4. Operating Infrastructure
5. Compounding Business

**Rules:**
- lenses alter presentation only, never authority;
- Inspector shows claimed/verified distinction and only authorized minimum-necessary evidence;
- ActionDock presents only actions the current person can lawfully attempt; consequential actions revalidate on server routes;
- new account is non-empty only because real next steps exist (complete profile, enter Grid discovery, follow a relevant Path/EDU route), never via synthetic KPIs;
- mobile Inspector is a drawer/sheet pattern, not removed content.

**RED tests:** exactly five lenses; no six-plane vocabulary; no fake metrics; no clinic org projection for a person without membership; no patient data; free status does not assert Grid eligibility.

---

## Task 8 — Connect free member entry to native Grid discovery

**Modify minimally:**
- `src/app/grid/browse/page.tsx` only if authentication continuity requires it;
- public Grid detail/request handoff only where needed.

**Do not replace:**
- `GridLiveMap`
- MapLibre/OpenFreeMap
- existing Grid demand/resource/eligibility engines
- reviewed public-resource projection

**Acceptance:**
- person can browse public-safe Grid without subscription;
- selected reviewed resource continues to existing public detail;
- if a governed request requires clinic/org authority, the UI explains the missing context rather than granting it;
- if an ordinary person-level Grid action is allowed by policy, that policy remains deterministic and server-owned;
- no ranking of ineligible regulated candidates.

This is a continuity/wiring task, not a new Grid implementation.

---

## Task 9 — Route/screen-contract and browser-confidentiality convergence

**Modify:**
- `src/lib/screen-experience-route-registry.ts`
- Screen Experience Contracts only if a genuinely new person-level family cannot be represented truthfully by an existing contract.

**Tests:**
- new `/signup` and `/member` pages resolve to exactly one contract;
- person-level member UI is not misclassified as organization-admin/clinic-owner authority;
- browser boundary forbids Prisma/server-only authority modules in Client Components;
- no raw ORM IDs, hidden ranking/policy details, legal hashes, secret/env internals or rate-limit implementation are serialized.

---

## Task 10 — Full verification and browser acceptance

Run on the exact branch head:

```bash
npm ci --ignore-scripts
npm run security:check
npm run db:generate
npm run db:validate
# clean disposable PostgreSQL
npx prisma migrate deploy
npm run type-check
npm run lint
npm test -- --run
npm run verify:release
```

If `verify:release` already subsumes steps, retain the explicit focused RED/GREEN evidence and then use the canonical release gate.

**Browser QA:**
- desktop 1440
- tablet
- mobile 390
- keyboard-only
- screen reader landmarks/labels
- reduced motion
- 200% zoom

Journeys:
1. `/` → ask Zumi → public-safe route;
2. `/` → safe protected/free intent → signup/login → `/member` with bounded context restored;
3. new free member → five-plane member Living Universe → Grid discovery;
4. free member attempts clinic route → denied/redirected, no fabricated organization;
5. existing clinic user login → existing clinic Living Home/dashboard unchanged;
6. PHI-like public prompt → no sensitive continuity token/state;
7. Grid geolocation denial → discovery remains usable.

Do not call the tranche complete from source tests alone.

---

## Task 11 — PR and merge law

Create one current-main PR from `feat/living-universe-wave-a-20260901`.

PR must state:
- selective recovery from #360, not wholesale merge;
- Account/Person authentication is additive;
- legacy ClinicSession remains authoritative for clinic work;
- free ≠ verified/eligible/authorized;
- root page converted from stacked brochure to interactive gateway;
- no Current Visit rewrite;
- no second Grid/identity engine;
- exact migration + tests + browser evidence;
- production is separately verified; merge does not mean deployed/customer-visible.

Before merge:
1. fetch current `main` again;
2. reconcile without force/resetting other work;
3. rerun exact-head Quality;
4. inspect reviews/threads;
5. stop if current production/release gates expose a new blocker;
6. merge only the verified exact candidate.

After merge, continue with separate plans/PRs for:
- Wave B deeper free Grid eligibility/need-have execution;
- Wave C authenticated clinic Living Home `ObjectStage / Inspector / ActionDock` convergence;
- Wave D native Grid spatial interaction refinements.

**Never make A–D one giant unreviewable PR.**
