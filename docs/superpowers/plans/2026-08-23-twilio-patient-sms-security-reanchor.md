# Twilio Patient SMS Security Re-anchor Implementation Plan

> **For agentic workers:** this plan has been executed incrementally using test-first/source-contract checks. Full exact-head repository CI remains mandatory before merge.

**Goal:** Re-anchor the valuable patient-SMS security controls from stale PR #150 onto current `main` without importing its stale history, while preserving current tenant, consent, PHI, commercial funding, and webhook authorities.

**Architecture:** Keep current-main SMS policy, tenant scoping, same-origin mutation guard, commercial variable-cost registry, and outbound port as shared authorities. Patient SMS is a fixed-template, non-PHI, multi-gate rail. Phone possession, messaging permission, provider routing proof, economic authority, and production enablement remain separate facts.

**Tech stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Vitest, Twilio REST/Verify APIs.

## Global constraints

- No PHI or clinical patient SMS in this tranche.
- No arbitrary staff/user-supplied patient-SMS body.
- No staff-created marketing or clinical SMS grant.
- Phone possession is separate from messaging permission.
- Routing configuration is separate from provider verification.
- Provider verification is separate from production authorization.
- Provider credentials never establish customer funding.
- `KLINIKOS_SMS_PRODUCTION_ENABLED` remains false/blank by default.
- Current `patient_sms` micro-funding authority remains fail-closed.
- Current `phone_verification` economics remain fail-closed while ownership/funding is unresolved.
- No production/live claim without deployed provider + audit evidence.

---

## Task 1 — Fixed non-PHI templates and quiet-hours policy

- [x] Added failing/contract coverage for unknown templates, no marketing/clinical template, IANA timezone validation, and 09:00–20:00 local boundary.
- [x] Added `src/lib/communications/sms-templates.ts`.
- [x] Added server-owned transactional/operational templates only.
- [x] Added deterministic timezone/quiet-hours policy.
- [x] Focused deterministic template/time assertions passed.

## Task 2 — Twilio transport and tenant routing provider proof

- [x] Hardened exact Twilio SID/credential evidence shapes.
- [x] Added explicit tenant sender + Messaging Service transport.
- [x] Added request timeouts and malformed-provider-evidence rejection.
- [x] Added serialized tenant sender assignment.
- [x] Added IANA timezone to tenant routing.
- [x] Added provider proof of sender ownership + Messaging Service membership.
- [x] Routing edits invalidate prior provider proof.
- [x] Verification refuses stale proof if routing changes during provider call.
- [x] Provider proof explicitly returns `productionSendingAuthorized:false`.
- [x] Raw provider verification identifiers remain server-side.
- [x] Omitted Messaging Service/timezone values preserve existing server-side configuration so the browser does not need raw existing provider IDs.
- [x] Focused mocked-provider adapter assertions passed.

## Task 3 — Patient-controlled phone-possession verification

- [x] Added authenticated portal Verify route.
- [x] Portal session binds organization, patient, account, and destination.
- [x] Caller cannot select another patient/org/phone.
- [x] Start/check mutations require same origin.
- [x] Attempt reservations are rate-limited and serialized.
- [x] Verification codes are never persisted.
- [x] Only Twilio `approved` + valid `VE...` evidence can record possession.
- [x] Possession is tied to current normalized chart phone.
- [x] Possession never creates SMS permission.
- [x] Current unresolved `phone_verification` economics block provider calls before Twilio invocation.
- [x] Patient UI receives only a `fundingReady` boolean, masked phone, and verification state.
- [x] Paid Verify action disables while funding is unresolved and can become usable when policy is legitimately activated.

## Task 4 — Template-only governed patient send

- [x] Removed the governed arbitrary-body patient-SMS export.
- [x] Added `sendAuthorizedPatientSmsTemplate({ templateId, ... })`.
- [x] Gate order covers template, tenant patient, permission/suppression, current phone possession, production switch, tenant routing, provider proof, quiet hours, commercial funding, and provider acceptance.
- [x] Outbound transport carries tenant sender + Messaging Service without becoming authorization authority.
- [x] Current `patient_sms` commercial micro-funding fail-closed behavior from main is preserved.
- [x] `.env.example` documents the production switch as a final gate, not a live-state claim.

## Task 5 — Inbound Twilio HTTP trust boundary discovered during adversarial review

- [x] Require configured inbound Auth Token + valid AccountSid.
- [x] Require form-urlencoded requests.
- [x] Stream and cap request body at 64 KiB.
- [x] Reject duplicate form keys.
- [x] Require canonical HTTPS production URL.
- [x] Validate signature before tenant resolution/mutation.
- [x] Require signed AccountSid match.
- [x] Require strict SMS/MMS MessageSid shape.
- [x] Preserve fail-closed tenant/patient ambiguity, replay locking, START-without-consent, and no-body-persistence behavior.
- [x] Restore Twilio's published signature-validation vector plus URL/body-tamper regression coverage.
- [x] Restore dedicated same-origin mutation regression coverage.

## Task 6 — Normalized patient-phone lookup and intake consistency discovered during review

- [x] Added additive non-unique expression index migration `20260823010000_patient_sms_phone_lookup_index`.
- [x] Query expression matches index expression exactly.
- [x] Preserved duplicate/shared phone numbers as valid data; application fails closed on ambiguous ordinary inbound matches.
- [x] Applied migration on disposable Neon branch cloned from production parent.
- [x] Verified index existence and planner compatibility with exact application lookup.
- [x] Deleted disposable Neon branch; production database untouched.
- [x] Added canonical new-patient phone normalization: U.S. 10-digit → E.164, explicit international `+` preserved, ambiguous non-U.S. bare numbers rejected, blank allowed.

## Task 7 — Governed operator, patient, and staff UI discovered during review

- [x] Added `/integrations/twilio` permission-gated routing page.
- [x] Added governed routing panel with safe boolean provider state and no direct provider calls/secrets.
- [x] Added `/portal/verify-phone` patient-controlled verification page.
- [x] Added visible authenticated portal entry point.
- [x] Patient UI shows masked phone only and truthful funding readiness.
- [x] Added staff SMS permission/suppression panel on current patient chart while preserving newer vitals support.
- [x] Staff panel uses `consents` read/update RBAC.
- [x] Staff API projection is minimum-necessary: masked phone, current verification boolean/time/source, suppression, and reduced permission evidence.
- [x] Full normalized phone, Twilio Verify SID, actor IDs, evidence-reference strings, and inbound event IDs are not needed by the staff browser projection.
- [x] Staff cannot clear STOP suppression, grant marketing, grant clinical SMS, or manufacture a grant from staff-only documentation.

## Task 8 — Security governance / production truth

- [x] Restored bounded custom-validator exception at `docs/security/TWILIO_WEBHOOK_VALIDATION_EXCEPTION.md`.
- [x] Confirmed P0 issue #160 remains open as the maintained-Twilio-SDK exit gate.
- [x] Exception expires/requires explicit review on 2026-09-18.
- [x] Added current-main production runbook with current migration ID and current economic blockers.
- [x] Runbook does not claim Twilio, Verify, messaging registration, PHI, or production sending is live.

## Final verification / review

- [x] Compared branch to current main repeatedly; no stale #150 commit history was imported.
- [x] Adversarially reviewed tenant scope, consent/possession separation, provider-proof invalidation, PHI boundaries, financial-spend gate, API evidence minimization, and inbound HTTP trust boundary.
- [x] Performed focused deterministic/template/Twilio-adapter assertions and disposable Neon migration proof.
- [ ] Run full exact-head release gate: Prisma generate/validate, clean migration chain, type-check, lint, full tests, DB-backed journeys, production build, security check, startup/health.
- [ ] Execute deployed controlled Twilio routing → Verify → fixed non-PHI send → STOP → blocked resend → START → replay proof after economic/provider prerequisites are legitimately ready.
- [ ] Replace temporary custom webhook validator with maintained Twilio SDK per #160 before the exception deadline, unless explicitly reviewed/renewed.
- [ ] Keep PR draft while GitHub Actions remains unable to provision a runner (`runner_id:0` / `steps:null`) or until equivalent exact-head release evidence exists.

## Current truth

The branch is a **current-main security re-anchor**, not a production-live claim. Production remains intentionally fail-closed at multiple independent layers, including the production switch and current variable-cost economic policies.
