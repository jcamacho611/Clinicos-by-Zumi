# The Klinikos Constitution

**Version:** `2026-08-12.1`

> Cross-system invariants. The Master Canon governs *what* Klinikos is; this governs *how every part of it must behave*. A change that violates an article here is wrong even when it satisfies a requirement elsewhere, and the correct response is to raise the conflict rather than to weaken the article.
>
> Each article states the rule, then the defect that produced it. The defects are real and are cited to the code that fixed them, because an invariant nobody has paid for is a preference.

---

## Article 1 — One identity

A person is one identity for as long as they interact with healthcare. They may hold many roles, in many organizations, simultaneously, and may change roles without becoming a new person.

Nothing may create a parallel identity for a new application, portal, or marketplace.

**Current state: violated.** `User.organizationId` is a required scalar and `User.roleKey` is a single string. See `KLINIKOS_ARCHITECTURE_INDEX.md` §3. The consequence is already visible in `provisioning-service.ts`, which refuses to attach a buyer whose email belongs to another organization because there is nowhere to record the second relationship.

## Article 2 — One organization model

One generalized organization supports clinics, spas, hospitals, networks, universities, labs, pharmacies, insurers and facilities, hierarchically, while remaining usable by a single-provider office.

## Article 3 — Relationships are first-class

Employment, contracting, patient-provider, student-school, guardian-dependent, supervision, care team, referral, payer-provider and marketplace relationships are records, not columns. Authorization reads them.

## Article 4 — Authorization answers the whole question

Authentication asks who you are. Authorization asks who may do what, to which resource, for which purpose, under which organization, because of which relationship, consent, credential, jurisdiction and time boundary.

Two rules admit no exception:

1. **Tenant scope is derived from the session, never from the request.** A client-supplied `organizationId` is an input to be checked, never a fact to be trusted.
2. **AI is never a superuser.** It holds strictly less authority than the person invoking it.

*Defect that produced this:* the marketplace payment queue had no tenant scope at all. Any clinic owner with `sales:manage` read every buyer's email and payment reference. The repository-wide isolation scan missed it because the scan looks for an `organizationId` set from the wrong source — and this query had none.

**Standing consequence:** a tenant-scoped model queried with *no* `organizationId` must fail the isolation scan. That gap is still open.

## Article 5 — One event language

A meaningful change becomes a domain event with one envelope: id, type, version, source, actor, organization, subject, timestamp, correlation id, causation id, payload, PHI classification, minimum-necessary indicator.

Domains communicate through governed contracts, not by reading each other's tables.

**Current state: not built.** Sixteen per-domain `*Event` tables exist with no shared envelope, outbox, or delivery guarantee.

## Article 6 — Events say what happened; workflows say what happens next

Any workflow with real-world consequence carries explicit states, idempotency, retries, failure handling, escalation, human approval where required, and audit.

*Defect that produced this:* the follow-up loop marked an action `executed` when it had written a row. Nothing had been sent. The states now distinguish prepared, awaiting confirmation, awaiting connection, awaiting delivery, sending, failed — and only a provider reference proves delivery.

## Article 7 — One ledger truth

External processors move money. Klinikos records what the money *means*. No processor is the canonical business ledger. Money is integer minor units; never a float.

## Article 8 — One audit truth

A sensitive action records who, what, when, organization, role, the basis on which it was permitted, the systems involved, and the before/after state.

A human decision is marked as one. A machine decision must never be indistinguishable from a person's.

## Article 9 — Truthful state

**A database write is not a real-world outcome.** This is the article most often violated and the one that costs the most.

| Never means | Unless |
| --- | --- |
| A saved credential means `CONNECTED` | A real exchange with the counterparty succeeded |
| A generated message means `DELIVERED` | A provider accepted it and returned a reference |
| A checkout means `SETTLED` | A signed webhook or a person confirmed it |
| A discovered candidate means `ELIGIBLE` | Deterministic eligibility passed |
| An AI recommendation means `EXECUTED` | A person authorized it |
| `portalAccessStatus: granted` means access exists | An organization, account and subscription were created |

*Defects that produced this article, all found on one pull request:* Twilio credentials read as "we can send" when no code sent; approved Founding Clinic buyers marked `granted` with no workspace behind it; refunds that never reversed the payment they were refunds of, leaving access granted after the money went back.

**Rule of construction:** when a status column and the world disagree, the column is wrong. Provision first, then grant.

## Article 10 — One intelligence gateway

Every model call enters through one gateway that owns tenant scoping, permission and entitlement checks, redaction, timeout, output validation against a governed contract, metering, and an audit record on every path including refusal. No module holds a provider SDK.

**PHI may not leave for a model provider unless a BAA is executed with that provider *and* the deployment is approved for it.** Both conditions, enforced as an admission gate, defaulting to no.

*Defect that produced this:* the PHI check existed, was correct, and was never used as a gate — it decorated a refusal message. Credentials plus a model name were enough to start sending. Redaction was standing in for the control and cannot do that job: the rules match identifier *shapes*, and a patient's name in clinical prose has no shape to match.

Differentiate ASK / ANALYZE / PREPARE / RECOMMEND / EXECUTE. Consequential actions require a person. AI may rank, explain and interpret intent; it may never override deterministic eligibility.

## Article 11 — One connector framework

Integrations are declarations — definition, installation, credential, sync job, webhook, mapping, retry, status, health, revocation — not bespoke code per vendor. A connector declares whether it may carry PHI, and the answer is asked about *the connector that will carry the message*, never about its category.

*Defect that produced this:* the patient-messaging gate asked whether *any* communication connector was approved for PHI. Approving Twilio would have unblocked messages that still left over Resend, which declares it does not carry PHI.

## Article 12 — One Grid resource model

Grid is the healthcare resource orchestration layer, not staffing. It is multi-party: an opportunity may require a patient, a clinician, a facility, equipment, a time and a consent simultaneously. Model composition, not buyer-versus-seller.

Eligibility is deterministic and precedes every offer.

## Article 13 — One design system

The frontend does not mirror the backend. A user sees what they need to do, never the event bus, the policy engine, FHIR, X12 or a model router. Context switches between roles are visually unmistakable and leak nothing across the boundary.

## Article 14 — Fail closed, and say so

An unconfigured capability reports *Pending Connection* and does nothing. It never falls back to a canned response that makes a demo look live.

A refusal states which of the missing conditions to fix. "Not connected" and "you may not do this" are different answers and must not be substituted for one another.

## Article 15 — No fabricated compliance

Klinikos does not claim HIPAA compliance, certification, or a BAA that does not exist. Capabilities are classified: SAFE TO BUILD, REQUIRES CONFIGURATION, REQUIRES VENDOR, REQUIRES BAA, REQUIRES LEGAL REVIEW, REQUIRES CLINICAL GOVERNANCE, REQUIRES CERTIFICATION, DO NOT IMPLEMENT YET.

A legal page states its true status. It does not invent terms to avoid a 404.

## Article 16 — Patient safety is not security

Safety is governed separately. For any safety-critical workflow: hazard → prevention → detection → review → escalation → recovery → audit.

Named hazards include wrong patient, wrong provider, wrong organization, wrong facility, stale information, expired credentials, missed result, missed referral, wrong Grid match, incorrect AI action, duplicate booking, failed communication, failed integration.

Clinical policy is owned by clinicians. Engineers and marketplace support staff never make a clinical-policy decision silently.

## Article 17 — Migrations are committed, additive, and deployed

Schema changes ship as committed migration files applied with `migrate deploy`. Never `db push` against a real database. `migrate diff` against the schema must be empty before merge. New columns are nullable or defaulted; a constraint added to a populated table is `NOT VALID` so it governs new writes without a retroactive scan that fails the deploy.

## Article 18 — Compilation is not completion

A capability is complete when it is tested, authorized, audited, reachable, and verified against a real database or a real journey — not when it type-checks.

Tests assert the *property the defect violated*, not the shape of the fix, so a future change that reintroduces the defect differently still fails.

## Article 19 — Do not rewrite what works

The repository contains real, working functionality and one real revenue path. New abstractions arrive alongside the old ones with adapters, and migration is incremental. Folder aesthetics are never a reason to move code.

## Article 20 — Cost is a constraint, not an afterthought

Assume limited capital. Prefer managed services and free tiers; classify every recurring cost as FREE NOW, CHEAP NOW, PAY AFTER REVENUE, or ENTERPRISE LATER. Do not build infrastructure because it looks sophisticated.

---

## Amendment

Articles are amended by the owner, in this file, with the reason recorded. An article is never weakened to make a test pass or a deadline hold. If an article blocks necessary work, that is the article doing its job, and the conflict goes to the owner.
