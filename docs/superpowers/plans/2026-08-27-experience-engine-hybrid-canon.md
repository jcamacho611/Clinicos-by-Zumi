# Klinikos Hybrid Experience Engine Canon Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the single Klinikos Master Canon so the protected app always begins with the access/legal gate and sign-in/create-account, then uses authenticated Zumi plus a continuously recomputed Experience Engine to project recognizable role/context experiences without creating permanent persona silos.

**Architecture:** Preserve one durable identity and one Klinikos substrate. Keep explicit experience families for patient, clinical staff, provider, professional/Grid, learner, instructor, institution, clinic owner/operator, billing/revenue, network/enterprise, and partner contexts, but make each family a governed projection selected by the server-resolved Active Experience Envelope rather than a separate app or permanent account type.

**Tech Stack:** Markdown governance documentation, GitHub repository authority model.

**Spec:** `docs/KLINIKOS_MASTER_CANON.md`

## Global Constraints

- `docs/KLINIKOS_MASTER_CANON.md` remains the sole active product/architecture/business/experience authority.
- Literal protected app order is: protected access airlock → sign in/create identity → authenticated Zumi → context/intent resolution → Active Experience Envelope → experience projection.
- Do not introduce a permanent role picker during signup.
- One person may hold multiple simultaneous roles and relationships.
- Persona/role experience families are projections, not independent products or accounts.
- Identity, claim, verification, entitlement, eligibility, and authority remain separate states.
- Zumi interprets and guides; deterministic Klinikos policy/domain systems authorize and execute.
- Existing public discovery may remain outside the protected app where policy permits.

---

### Task 1: Correct the literal protected-entry order

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`

**Interfaces:**
- Consumes: existing `KLINIKOS-UX-001`, protected-access airlock, universal identity law.
- Produces: unambiguous screen/event order used by every future public/authenticated experience implementation.

- [x] Replace the current Zumi-before-account protected sequence with the approved order: airlock → enter → sign in/create identity → preserve entry context → authenticated Zumi → intent/context resolution → claims/verification as required → Active Experience Envelope → experience projection.
- [x] State explicitly that public discovery is separate from protected app entry and does not remove the initial sign-in gate inside the app.
- [x] Remove language implying signup should occur only after an in-app value preview once the user has chosen to enter the protected Klinikos application.
- [x] Preserve return-to/source-route intent across authentication without exposing raw PHI, secrets, or proprietary state in browser-owned continuation data.
- [x] Commit.

### Task 2: Canonize the B + C hybrid experience architecture

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`

**Interfaces:**
- Consumes: Active Experience Envelope and first-class user paths.
- Produces: `KLINIKOS-EXPERIENCE-001`, the governing projection law for all product surfaces.

- [x] Add stable decision `KLINIKOS-EXPERIENCE-001`.
- [x] Define persona-aware experience families as recognizable UX projections with their own information density, dominant objects, actions, navigation emphasis, and Zumi behavior.
- [x] Define the Experience Engine as the server-side resolver that continuously selects/recomposes those projections using identity, role, profession, organization, location, authority, entitlement, purpose, current intent, active object, work state, time, policy, jurisdiction, and risk.
- [x] State that experience families are not independent apps, accounts, permanent personas, or authority grants.
- [x] State that one person may switch contexts and the same role can produce different experiences depending on active work and organization.
- [x] Commit.

### Task 3: Define the Screen Contract standard

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`

**Interfaces:**
- Consumes: Experience Engine output.
- Produces: a mandatory acceptance contract for every current and future route/workspace.

- [x] Require every screen/workspace to declare: audience/context, purpose, dominant object, dominant action, visible data, hidden data, authority/eligibility requirements, Zumi capabilities, density mode, navigation behavior, commercial state, responsive behavior, empty/error/blocked/loading states, audit/evidence consequences, and accessibility behavior.
- [x] Require every first viewport to let the person begin accomplishing the reason they entered that surface.
- [x] Require no page to explain an entire subsystem before allowing the relevant action.
- [x] Require brochure-style Grid/EDU/Clinic routes to converge toward interactive product environments.
- [x] Commit.

### Task 4: Reconcile user-path language with the hybrid model

**Files:**
- Modify: `docs/KLINIKOS_MASTER_CANON.md`

**Interfaces:**
- Consumes: existing patient, professional, clinical staff, provider, clinic, institution, educator, Grid, employer, network paths.
- Produces: explicit starting projection and context-switch behavior for each path.

- [x] Preserve the existing lifecycle paths.
- [x] Add that MA, LPN, RN, NP, PA, physician, biller, coder, front desk, owner, learner, instructor, patient, caregiver/proxy, Grid professional, organization, and network/enterprise users receive distinct experience projections when their active context requires it.
- [x] Add representative context-switch examples, including an RN moving between clinic work, personal Grid, EDU, and owner/operator contexts without creating new identities.
- [x] State that role labels alone never determine full screen access; the Active Experience Envelope and authority decision do.
- [x] Commit.

### Task 5: Verify canon consistency

**Files:**
- Review: `docs/KLINIKOS_MASTER_CANON.md`
- Review: `docs/superpowers/plans/2026-08-27-experience-engine-hybrid-canon.md`

**Interfaces:**
- Produces: a self-consistent canon update with no competing literal entry sequence.

- [x] Search the master canon for contradictory sequences such as Zumi-before-sign-in, signup-only-after-value-preview, permanent persona selection, or separate role-account language.
- [x] Verify the updated order preserves the Agreement Airlock, one universal identity, claim/verification/authority separation, Zumi non-authority, and Active Experience Envelope.
- [x] Verify no requirement creates a second identity/router/authorization system.
- [x] Verify the plan contains no placeholders and all tasks map to the approved decision.
- [x] Commit any consistency fixes.

## Verification result

Verified on branch `docs/experience-engine-hybrid-20260827` after canon update:

- protected app order is airlock → sign in/create identity → authenticated Zumi → Experience Engine;
- public discovery is explicitly outside the protected app identity gate;
- no permanent persona picker is introduced;
- one identity supports many simultaneous roles/relationships;
- experience families are projections selected by the Active Experience Envelope;
- identity, claim, verification, eligibility, entitlement, and authority remain separate;
- Screen Contract law and first-viewport/anti-brochure law are explicit;
- Grid, EDU, Clinic, clinical, patient, revenue, and enterprise experience families remain one Klinikos substrate.