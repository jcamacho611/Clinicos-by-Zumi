# Klinikos Living Home Server Authority Boundary Design

Status: APPROVED FOR IMPLEMENTATION
Date: 2026-08-25
Baseline: `main@7082d31312cf654675831b9abadf62bb975583d1`

## 1. Purpose

Move authenticated Living Home proprietary orchestration and Path-runtime decision logic out of browser-executable Client Components while preserving the already-shipped Marble/Obsidian Living Home experience, current domain authorities, current Path persistence, current role/tenant boundaries, and current Zumi truth rules.

Current `src/components/clinic/living-home.tsx` is a Client Component that runtime-imports `@/lib/orchestration/intent-engine` and `@/lib/orchestration/path-engine`, and `src/components/clinic/living-home-operations.tsx` also resolves Path runtime in the client. That contradicts the frontend trade-secret/server-boundary canon, which requires proprietary routing/orchestration logic to execute server-side and send only minimum-necessary presentation data to the browser.

The user-visible outcome remains:

`WHAT NEEDS TO HAPPEN? → ZUMI → MATERIALIZED WORK → PATH → OBJECT / ACTION`

The internal authority flow becomes:

`BROWSER INPUT → AUTHENTICATED SERVER COMMAND → AUTHORIZATION / INTENT / PATH / GUIDANCE → SAFE LIVING HOME DTO → BROWSER`

## 2. Alignment with concurrent repository work

This tranche is intentionally dependency-aligned with current work rather than competitive with it.

### Completed dependency

PR #321 restored governed continuous production deployment and checksum-pinned additive migration handling. This tranche does not alter release machinery, Prisma history, Render configuration, or migration policy.

The later executive operating snapshot on current main is governance-only and has no runtime overlap with this tranche.

### Active lanes explicitly not owned by this tranche

- #319 / #320: capital, bankability and company capital registers
- #294: EDU / Workforce institutional upgrade
- #282 / #281: universal Account / lifelong identity
- #263: universal protected entry/access gateway
- #262: governed patient SMS
- #264: generated legal documents
- #257: Zumi durable memory / reviewed knowledge
- #256: universal obligation / unfinished-work projection
- #254: Network invitation continuity
- #253 / #252 / #250 / #249 / #251: Grid, transaction, trust and interoperability lanes

This tranche does not change those authorities or schemas. It creates a clean authenticated presentation boundary those projections can feed later.

## 3. Architecture

### 3.1 Preserve the rich client shell

Living Home remains interactive in the browser for:

- composer text and voice input;
- selected object / selected Path presentation;
- animation and phase presentation;
- Marble / Obsidian behavior;
- inline expansion and focus;
- transient request state;
- rendering server-provided safe presentation objects.

The browser does not need to know how Klinikos decides which Path, surface, blocker, routing rule, or proprietary orchestration logic applies.

### 3.2 Add one authenticated Living Home command boundary

Create:

`POST /api/living-home/command`

Input:

- user-entered `text` only;
- no caller-supplied `pathId` used as the source of Path selection;
- no caller-supplied organization/tenant/role context.

Server flow:

1. resolve authenticated clinic session;
2. enforce the current task/work permission without widening role authority;
3. resolve user intent server-side;
4. if a simple authorized surface lookup is appropriate, return a safe `surface` response;
5. if clarification is required, return a safe `clarification` response;
6. if a governed Path applies, create it through the existing Path repository;
7. derive runtime and guidance server-side;
8. project only minimum-necessary presentation data;
9. return a `LivingHomeCommandView`.

Existing `/api/paths` remains intact for callers that already provide a governed `pathId`; this tranche does not redefine that shared API.

### 3.3 Server-owned initial Path projection

The dashboard Server Component already loads active Path snapshots and guidance. Instead of passing raw snapshots that require client-side runtime resolution, it projects active Paths into safe `LivingHomePathView` objects before serialization.

The initial client receives presentation truth, not decision machinery.

## 4. Presentation contracts

### 4.1 `LivingHomePathView`

Minimum useful fields:

- `instanceId`
- `pathId`
- `title`
- `goal`
- `progressPercent`
- `state`: `needs_you | waiting | needs_review | blocked | ready | done | active`
- `stateLabel`
- `reason`
- `blockers[]` with user-safe title/explanation/ownership language
- `nextActionLabel`
- `nextActionHref`
- optional safe destination key where needed for visual placement

Excluded:

- internal Path definition nodes not needed for display;
- private predicates;
- candidate rules;
- scoring or confidence heuristics;
- repository/audit internals;
- unauthorized domain evidence.

### 4.2 `LivingHomeCommandView`

Discriminated result:

- `kind: "path" | "surface" | "clarification" | "blocked" | "unavailable"`
- `message`
- optional `path: LivingHomePathView`
- optional safe `surface` with label/href
- optional clarification prompt

No raw orchestration output is returned.

## 5. Truth and authority rules

1. Existing clinical, billing, Grid, EDU, identity, patient, financial and external-integration stores remain authoritative.
2. The command route uses authenticated server session and current tenant context.
3. Browser state can never establish authorization, eligibility, completion, credential truth, payment truth, clinical authority, or Path progression.
4. Zumi/provider availability remains truthfully represented; deterministic command mode remains valid when a model provider is unavailable.
5. A simple question that maps to a known authorized surface may return that surface without fabricating a Path.
6. Unknown or ambiguous intent returns clarification instead of inventing a route.
7. Existing Path creation semantics remain authoritative.
8. No schema or migration is required.
9. No feature flag is required unless implementation reveals a rollout hazard.
10. The browser confidentiality gate must pass with no Client Component runtime dependency reaching the confidential orchestration namespace.

## 6. User experience preservation

The user should not perceive this as a redesign. Existing unicorn Living Home principles remain:

- premium Marble / Obsidian Living Home;
- truthful operating context;
- composer as primary outcome entry;
- phase progression that reflects real request work rather than timers;
- materialized Path/work stage;
- role-aware operational truth;
- mobile/tablet recomposition;
- reduced-motion support;
- no fake activity, fake revenue, fake availability or fake completion.

The only visible improvements should be safer and more consistent command handling and fewer opportunities for client/server divergence.

## 7. Error and degraded behavior

### Authentication lost

Return `401`; client explains that the session needs to be restored and must not replay consequential creation automatically after reauthentication without a deliberate retry.

### Authorization denied

Return `403`; provide a safe explanation without disclosing inaccessible data.

### Intent ambiguous

Return `kind=clarification`; preserve the user's statement in local visual transcript but do not create a Path.

### Path creation failure

Return a safe unavailable/error result; do not show a created Path.

### Model provider unavailable

The deterministic server command path remains usable where the current product already supports it. Do not imply model execution occurred.

### Domain dependency unavailable

Return partial/degraded truth only when server evidence supports that classification. Never convert missing dependencies into empty-success states.

## 8. Security / privacy impact

Risk reduced:

- proprietary intent rules no longer execute in browser bundles;
- Path-runtime decision logic no longer needs browser delivery;
- future Zumi materialized-interface work receives a safe server projection seam;
- presentation DTOs create an explicit minimum-necessary disclosure boundary.

No new PHI collection or persistence is introduced.

No new identity or authorization model is introduced.

## 9. Commercial / customer impact

This is primarily a trust, architecture and maintainability prerequisite, but it supports the active company value loop by making the flagship authenticated experience safer to expose to clinics and enterprise evaluators.

It also reduces future implementation friction because unfinished-work, Revenue Integrity, Grid, EDU and other cross-domain projections can feed one server-owned Living Home presentation layer instead of each leaking domain machinery into the browser.

## 10. Acceptance evidence

Required before merge:

1. `living-home.tsx` has no runtime import from `@/lib/orchestration`.
2. `living-home-operations.tsx` has no runtime import from `@/lib/orchestration`.
3. Browser confidentiality gate passes transitively.
4. Valid clinic operational intent resolves and creates the same governed Path class through the server command endpoint.
5. Unknown intent returns clarification and creates no Path.
6. Surface lookup returns a safe destination and creates no Path.
7. Unauthorized request fails before Path creation.
8. Tenant context comes from server session, never request body.
9. Command DTO does not contain rule arrays, Path definitions, private predicates or raw session internals.
10. Initial active Paths are server-projected and still show progress, blockers and next-action truthfully.
11. Existing Marble/Obsidian Living Home source contract remains intact.
12. Existing role distinctions, including MA/LPN/RN authority, are not modified.
13. No Prisma/schema/migration diff.
14. Focused tests, type-check, lint, build, browser confidentiality/security gate and relevant Living Home regression tests execute on the exact implementation head where infrastructure permits.
15. Immediately before merge, compare against latest `main` and active PR changed-file ownership again.

## 11. Expected implementation footprint

Create:

- `src/lib/home/living-home-view-model.ts`
- `src/lib/home/living-home-presentation.ts`
- `src/app/api/living-home/command/route.ts`
- focused regression tests

Modify narrowly:

- `src/app/(platform)/dashboard/page.tsx`
- `src/components/clinic/living-home.tsx`
- `src/components/clinic/living-home-operations.tsx`

Do not modify:

- Prisma schema/migrations;
- release/migration scripts changed by #321;
- identity/account internals owned by #281/#282;
- access/legal gateway owned by #263;
- EDU Workforce implementation owned by #294;
- universal obligation implementation owned by #256;
- Grid fee/trust/liquidity authorities;
- clinical authority or Current Visit state.

## 12. Follow-on dependency order

After this tranche is merged and re-baselined:

1. re-anchor/salvage universal unfinished-work projection from #256 onto current main;
2. project that work into role-aware Living Home;
3. continue Golden Current Visit wiring using already-merged clinical-role/Clinical Change improvements;
4. continue Revenue Integrity progression;
5. connect Operating Map acquisition/value loop;
6. expand high-value public capability discovery;
7. add richer materialized Zumi action surfaces over the same server presentation boundary.

## 13. Decision

**BUILD.**

This change is a security and architecture prerequisite, aligns with current P0, does not duplicate active lanes, preserves the shipped customer experience, requires no migration, and creates the reusable projection boundary needed by the next unfinished-work and role-aware Living Home tranches.