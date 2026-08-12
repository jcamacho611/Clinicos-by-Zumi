# Klinikos Architecture Index

**Version:** `2026-08-12.1`
**Status of this document:** current-state audit + gap map + build sequence. Measured against the repository on the date above, not against any brief.

> This index is one of the three governing documents named in the Master Build Directive §1, alongside `CLINICOS_MASTER_CANON.md` (product intent) and `KLINIKOS_CONSTITUTION.md` (cross-system invariants). Where they disagree, the repository is the truth about what exists; the Canon is the truth about what is intended.

---

## 0. How to read this

Every capability below carries a measured status, not an aspiration:

| Status | Meaning |
| --- | --- |
| `BUILT` | Exists, is reachable, is exercised by tests or a verified journey |
| `PARTIAL` | Exists and works for some paths; named gaps below |
| `FOUNDATION` | Data model and rules exist; no complete workflow through it |
| `PLACEHOLDER` | Named in code or UI; no implementation behind it |
| `NOT BUILT` | Does not exist |
| `BLOCKED` | Cannot be completed without a vendor, contract, or legal decision |

No row says `CONNECTED`, `LIVE`, `SECURE`, or `COMPLIANT`. Those are claims about the world, not about code, and they are made in `EXTERNAL_DEPENDENCY_MATRIX.md` only where evidence exists.

---

## 1. Measured shape of the repository

| Measure | Count |
| --- | --- |
| Page routes (`page.tsx`) | 67 |
| API routes (`route.ts`) | 160 |
| Library modules (`src/lib/**/*.ts`) | 153 |
| React components | 100 |
| Prisma models | 184 |
| Prisma enums | 6 |
| Schema lines | 4,498 |
| Committed migrations | 45 |
| Test files | 52 |

Feature-registry self-assessment (`src/lib/feature-registry-canon.ts`):

| Declared status | Count |
| --- | --- |
| FOUNDATION | 39 |
| DEMO | 16 |
| GOVERNED | 6 |
| VENDOR_DEPENDENT | 3 |
| CONNECTED | 3 |
| PLANNED | 1 |

**Three capabilities out of sixty-eight are declared connected.** The registry is honest, and the honest reading is that Klinikos today is a large, well-modelled foundation with a small number of live paths through it.

Code that actually crosses the network to a third party, in the entire repository:

- `src/lib/communications/outbound.ts` — Resend email
- `src/lib/legal/access-verification.ts` — Resend email
- `src/features/zumi/adapters/anthropic.ts` — Anthropic Messages API (currently refused at the gate; see §4)
- Inbound only: `src/app/api/whop/webhook/route.ts` — Whop Standard Webhooks

Everything else described as an integration is a catalog entry, an adapter contract, or a rules module with no live counterparty.

---

## 2. The twenty-two engines (Directive §3), measured

| # | Engine | Status | Where it lives | What is actually missing |
| --- | --- | --- | --- | --- |
| 1 | Universal Identity | `PARTIAL` | `src/lib/auth/*` | **One user = one organization.** See §3 — this is the root gap |
| 2 | Organizations / Tenancy | `PARTIAL` | `Organization` model | Flat. No hierarchy, no departments, no regions |
| 3 | Relationships / Memberships | `NOT BUILT` | — | No membership join model. Role is a string column on `User` |
| 4 | Authorization / Policy | `PARTIAL` | `src/lib/auth/rbac.ts` | RBAC over 38 resources × 5 actions. No ABAC, no relationship-, consent-, credential-, purpose-, or jurisdiction-awareness |
| 5 | Consent / Delegation | `FOUNDATION` | 2 models | No delegation, no guardian/proxy, not consulted by authorization |
| 6 | Credentials / Eligibility | `FOUNDATION` | 3 models + `credentialing-rules.ts` | Credentials are stored; contextual eligibility ("this activity, this place, this time") is not computed |
| 7 | Event Engine | `NOT BUILT` | 16 per-domain `*Event` tables | No shared envelope, no outbox, no bus, no subscriptions, no retries, no DLQ. Each domain invented its own log |
| 8 | Workflow / Automation | `PARTIAL` | `src/lib/operations/*`, `workflow-rules.ts` | Follow-up loop is a real state machine with truthful states. Nothing else is |
| 9 | Intelligence Gateway | `BUILT` (gated) | `src/features/zumi/*` | Single entry point, admission policy, redaction, metering, audit. Refuses all egress pending BAA — correctly |
| 10 | Grid Resource Exchange | `FOUNDATION` | 5 models | Two-sided listing/request. Not a composition engine. See §5 |
| 11 | Connector Runtime | `FOUNDATION` | `src/lib/connectors/*` | 30-connector catalog with readiness gates. No installation, credential, sync-job, or webhook runtime |
| 12 | Financial Ledger | `NOT BUILT` | `Invoice`, `GridPayout` | No canonical ledger. Money meaning lives in per-domain columns |
| 13 | Payments Orchestration | `PARTIAL` | `src/lib/commerce/*` | Whop one-time + subscription paths work end to end. Stripe is catalog-only |
| 14 | Communications | `PARTIAL` | `src/lib/communications/outbound.ts` | Email real; SMS deliberately absent and says so. PHI blocked at the rail |
| 15 | Documents / Storage | `FOUNDATION` | 5 models + `document-storage.ts` | No object-storage backend configured |
| 16 | Search / Discovery | `NOT BUILT` | — | No permission-aware search layer |
| 17 | Notifications | `NOT BUILT` | — | — |
| 18 | Audit / Provenance | `PARTIAL` | `AuditLog` | Written on sensitive commerce and AI paths. No permission/consent/credential basis fields |
| 19 | Analytics | `FOUNDATION` | growth + network rules | Computed from transactional tables directly |
| 20 | Configuration / Entitlements | `BUILT` | `provisioning-rules.ts`, `whop-entitlements.ts` | Modules derived from purchase, never asserted |
| 21 | Security | `PARTIAL` | rate-limit, RBAC, encryption helper | No secrets rotation, WAF, dependency scanning, SBOM, access review |
| 22 | Observability | `FOUNDATION` | `ReliabilityEvent`, `system-health-rules.ts` | No instrumentation, dashboards, or alerts |

---

## 3. The root gap: identity cannot hold more than one relationship

This is the single most consequential finding, and it sits at the top of the dependency order.

```prisma
model User {
  organizationId String   // required scalar FK — exactly one
  roleKey        String   // exactly one role
}
```

The Directive's first two laws are ONE IDENTITY (a person holds many healthcare roles) and ONE RELATIONSHIP MODEL (relationships are first-class). The schema permits neither. A person is a row inside one organization with one role, so:

- A clinician who works at two clinics needs two accounts with two email addresses.
- A student who becomes a contractor and later an owner cannot carry their identity forward.
- A patient who is also a provider elsewhere is two unrelated people.
- Context switching (Directive §26) has nothing to switch between.

This is not theoretical. It has already produced a workaround in shipped code: `attachBuyerToTenant()` in `src/lib/provisioning/provisioning-service.ts` **refuses** to attach a buyer whose email already belongs to another organization, because the schema gives it nowhere to put the second relationship. A real person buying a GRID pass after working at a clinic is turned away by design.

Every engine downstream inherits the limitation. Authorization cannot be relationship-aware when there is one relationship. Grid cannot have multi-role participants. Education cannot move a student to a professional. Consent cannot express delegation between two identities that do not exist separately.

**Nothing above line 4 of the dependency order can be built correctly until this is fixed.**

---

## 4. Where implementation conflicts with the Canon

Directive §1 requires these to be named rather than silently resolved.

| # | Conflict | Detail |
| --- | --- | --- |
| 1 | Two governing product documents disagree | `CLINICOS_MASTER_CANON.md` defines the product as a multi-clinic EMR / interoperability network. `SOURCE_OF_TRUTH.md` defines it as an AI-native healthcare OS with GRID and a Growth Engine. The Directive defines a third, broader thing: a composable healthcare operating ecosystem. Three definitions, no stated precedence |
| 2 | Canon names capabilities the schema cannot support | LifeChart, Care Constellation, ClosedLoop Referrals, Health Passport and Consent Wallet all presume multi-organization identity and consent-aware authorization. Neither exists |
| 3 | Canon's 14 completion gates are not enforced | No capability is currently blocked from being marked complete by a gate check. The registry is self-declared |
| 4 | Voice-first contract vs. reality | The Canon says voice is first-class; the implementation is a browser-speech demo adapter, correctly labelled as such |
| 5 | Grid definition | The Directive requires a generalized resource-composition engine; the repository has a two-sided service-listing marketplace. Not a defect — a scope gap that must be planned, not patched |
| 6 | AI is gated off | Zumi refuses all egress because no BAA exists with any model provider. This is the Constitution working as intended, but it means every AI-dependent capability in the Canon is `BLOCKED`, not `PLANNED` |

None of these should be resolved by code. They are product decisions. The one that blocks work now is #1.

---

## 5. Grid: measured against the canonical model (Directive §10)

**None of the twenty-one canonical Grid models exist.** What exists:

| Present | Role today |
| --- | --- |
| `GridServiceListing` | A provider or location advertises a service |
| `GridRequest` | A clinic asks for one |
| `GridRequestEvent` | Per-request status log |
| `GridPayout` | Payout record |
| `CapacityListing` | Room/chair capacity |

This models exactly one shape: one buyer, one seller, one service. The Directive's requirement is multi-party composition — `UNIVERSITY + STUDENT + PRECEPTOR + SITE`, or `PATIENT + CLINICIAN + FACILITY + RESOURCE + TIME + CONSENT + PAYMENT`. A two-sided table cannot express a four-slot requirement, so this is a rebuild behind an adapter, not a migration.

The existing marketplace is real revenue surface and must keep working while the composition engine is built beside it (Directive §63).

---

## 6. Dependency-ordered build sequence

Adjusted from Directive §65 for what the repository actually contains. Each step is gated on the one above it.

| # | Step | State | Why it is here |
| --- | --- | --- | --- |
| 0 | **Resolve the source-of-truth conflict** | Blocked on owner | Three product definitions cannot all govern. One decision, no code |
| 1 | **Identity: Membership model** | Not started | `User` × `Organization` × role becomes a first-class `Membership`. Everything below depends on it |
| 2 | **Organizations: hierarchy** | Not started | Parent/child so network → region → facility → location is expressible |
| 3 | **Relationships: first-class** | Not started | Employment, contracting, patient-provider, guardian, supervision, care team |
| 4 | **Authorization: relationship- and credential-aware** | Not started | Extend `rbac.ts` rather than replace it; add relationship, consent, credential, jurisdiction, purpose |
| 5 | **Audit: decision basis** | Partial | Record *why* an action was permitted, not only that it was |
| 6 | **Credentials: contextual eligibility** | Foundation exists | `isEligible(person, activity, place, time)` as one function |
| 7 | **Event engine: envelope + outbox** | Not started | One envelope, one outbox, retries, DLQ. Collapse the 16 ad-hoc event tables behind it |
| 8 | **Workflow engine** | Partial | Generalize the follow-up state machine into a reusable engine |
| 9 | **Grid resource model** | Rebuild | Participant, Resource, Capability, Requirement, Availability, Demand |
| 10 | **Composition templates + matching** | Not started | The multi-party engine. Deterministic; AI may rank, never qualify |
| 11 | **Offer → Agreement → Booking** | Not started | State machines with truthful states |
| 12 | **Financial ledger** | Not started | Canonical meaning of money, independent of Whop or Stripe |
| 13 | **Payments orchestration** | Partial | Whop works; generalize behind the ledger |
| 14 | **Connector runtime** | Foundation | Installations, credentials, sync jobs, webhooks, health |
| 15 | **Domain compositions** | Ongoing | Clinic, patient, provider, education, network built on the above |
| 16 | **Analytics separation** | Later | Only once events are real |

**Steps 1–4 are the whole near-term programme.** They are invisible to a customer and they unblock everything else.

---

## 7. Current revenue path (Directive §54) — do not break it

The only path in the repository that takes money and delivers something is:

```
/entry → Whop checkout → signed webhook → AccessPayment settled
       → human review → provisioning → organization + user + subscription
       → activation email → sign-in
```

It is the subject of PR #11 and is verified end to end against Postgres. It depends on none of steps 1–16 and must keep working through all of them. Treat it as the regression suite for identity work: if a purchase still provisions a workspace after the Membership migration, the migration was done correctly.

---

## 8. Register of required architecture outputs (Directive §64)

| # | Output | Status |
| --- | --- | --- |
| 1 | Current-state architecture | `BUILT` — §1, §2 of this document |
| 2 | Target architecture | `NOT BUILT` — blocked on §6 step 0 |
| 3 | Gap map | `BUILT` — §2, §3, §5 |
| 4 | Dependency graph | `BUILT` — §6 |
| 5 | Build sequence | `BUILT` — §6 |
| 6 | Migration map | `NOT BUILT` |
| 7 | Database architecture | `PARTIAL` — schema exists, no written architecture |
| 8 | API contracts | `NOT BUILT` — 160 routes, no canonical contract doc |
| 9 | Event catalog | `NOT BUILT` |
| 10 | Workflow catalog | `PARTIAL` — follow-up loop documented in code |
| 11 | Grid model | `NOT BUILT` — §5 states the gap only |
| 12 | Security model | `PARTIAL` — `KLINIKOS_CONSTITUTION.md` §4 |
| 13 | AI architecture | `BUILT` — `docs/ZUMI.md` + `src/features/zumi/*` |
| 14 | Integration framework | `PARTIAL` — `EXTERNAL_DEPENDENCY_MATRIX.md` |
| 15 | Financial model | `NOT BUILT` |
| 16 | Frontend information architecture | `PARTIAL` — `EXPOSED_UI_AUDIT.md`, `ROUTE_ACTION_AUDIT.md` |
| 17 | Test architecture | `PARTIAL` — 52 suites, no written architecture |
| 18 | Infrastructure model | `PARTIAL` — `render.yaml` |
| 19 | Business operations model | `PARTIAL` — `SALES-AUDIT-FUNNEL.md` |
| 20 | Regulatory dependency register | `PARTIAL` — `EXTERNAL_DEPENDENCY_MATRIX.md`, `CLINICAL_SAFETY.md` |
| 21 | Technical-debt register | `NOT BUILT` |
| 22 | Assumptions | `BUILT` — §9 |
| 23 | Unknowns | `BUILT` — §9 |
| 24 | Current implementation truth | `BUILT` — this document |

---

## 9. Assumptions and unknowns

**Assumptions made in this audit**

- The repository is the truth about what exists; briefs are intent.
- The feature registry's self-declared statuses are accurate. Spot checks agreed with it.
- `main` and the PR #11 branch are the only active lines of work.

**Unknowns that block real decisions**

- Which of the three product definitions governs (§4 #1).
- Whether any BAA is in progress with a model provider. Until one exists, every AI capability is `BLOCKED`, not merely unbuilt.
- Whether the `/contractor`, `/location-owner`, `/seller` portals are intended to exist. They are named as `portalPath` values on purchasable products and have no routes.
- Whether Grid's first live vertical is the aesthetic-service composition or shift coverage. The two need different composition templates first.
- Real customer count. The build sequence assumes zero to few; if clinics are live, migration work in steps 1–3 needs a backfill plan and a maintenance window.

---

## 10. Maintenance

This document is regenerated, not edited in place, whenever step 0–4 of §6 completes or the engine table in §2 changes status. A status that moves to `BUILT` must cite the test or verified journey that proves it.
