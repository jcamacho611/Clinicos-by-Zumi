# Twilio Patient SMS Security Re-anchor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-anchor the missing patient-SMS security controls from stale PR #150 onto current `main` while preserving current commercial variable-cost funding authority and current inbound signed-webhook behavior.

**Architecture:** Keep `sms-policy.ts`, tenant scoping, same-origin mutation checks, the current variable-cost rail registry, and the existing outbound port as shared authorities. Add a small deterministic template/quiet-hours policy; strengthen the Twilio adapter and tenant routing evidence; restore patient-controlled Twilio Verify; and replace the latent arbitrary-body patient send contract with a template-only governed send that must pass consent, phone possession, production, routing, time, and commercial funding gates.

**Tech Stack:** Next.js App Router, TypeScript, Prisma/PostgreSQL, Vitest, Twilio REST/Verify APIs.

**Spec:** `docs/TWILIO_SMS_PRODUCTION_RUNBOOK.md` from #150 is historical source material; current authority is `docs/KLINIKOS_SUPREME_ARCHITECTURE_CANON.md`, current `main`, and Twilio's current official API/webhook documentation.

## Global Constraints

- No PHI or clinical SMS in this tranche.
- No arbitrary user/staff supplied patient-SMS body.
- Staff cannot grant marketing SMS or clinical SMS permission.
- Phone possession is separate from consent.
- Routing configuration is not provider verification.
- Provider verification is not production authorization.
- Existing `tenantVariableSpendFundingReady(variableCostRailPolicy("patient_sms"))` remains mandatory.
- Inbound webhook signature validation is not weakened or rewritten here.
- No production/live claim without controlled provider evidence.
- No schema migration is required for this tranche; routing/verification evidence uses existing JSON/audit stores.

---

### Task 1: Fixed non-PHI templates and quiet-hours policy

**Files:**
- Create: `src/lib/communications/sms-templates.ts`
- Create/modify: `tests/sms-template-policy.test.ts`

**Interfaces:**
- Produces `PatientSmsTemplateId`, `patientSmsTemplate(id)`, `isIanaTimeZone(zone)`, and `evaluateSmsQuietHours({ timeZone, now })`.
- Templates are server-owned, fixed text, `phiApproved: false`, and map only to transactional/operational classes.

- [ ] Write failing tests proving unknown template rejection, no marketing/clinical template, IANA timezone validation, 09:00 inclusive, 20:00 exclusive, and invalid timezone fail-closed.
- [ ] Execute the pure tests/logic and confirm RED against current main because the module does not exist.
- [ ] Add the minimal deterministic implementation.
- [ ] Execute focused GREEN assertions.
- [ ] Commit only the template policy and tests.

### Task 2: Twilio transport + tenant routing provider proof

**Files:**
- Modify: `src/lib/communications/twilio.ts`
- Modify: `src/lib/communications/twilio-integration.ts`
- Modify: `src/app/api/integrations/twilio/sms-routing/route.ts`
- Create: `src/app/api/integrations/twilio/sms-routing/verify/route.ts`
- Modify/add: `tests/twilio-communications.test.ts`, `tests/twilio-inbound-routing-contract.test.ts`

**Interfaces:**
- `sendTwilioSms({ to, body, from?, messagingServiceSid?, env? })` accepts explicit tenant sender + Messaging Service and validates AC/SK/MG/PN/VE/VA shapes where applicable.
- `verifyTwilioSmsRouting({ senderPhone, messagingServiceSid, env? })` proves ownership + sender-pool membership through Twilio.
- `TwilioSmsRoutingConfig` gains `timeZone`, `providerVerifiedAt`, `providerPhoneNumberSid`, `providerMessagingServiceSid`.
- Any routing edit clears provider-verification evidence.
- Verification endpoint is same-origin + integration-manage protected and returns `productionSendingAuthorized:false`.

- [ ] Add RED contract cases for invalid exact SID shapes, routing edit invalidation, provider proof requirement, and timezone.
- [ ] Confirm current-main behavior fails those contracts.
- [ ] Implement the minimal adapter/routing changes with request timeouts and advisory-lock serialization for sender assignment.
- [ ] Execute focused GREEN assertions for pure parsing/state transitions; keep provider network calls unclaimed without credentials.
- [ ] Commit.

### Task 3: Patient-controlled phone-possession verification

**Files:**
- Create: `src/app/api/portal/phone-verification/route.ts`
- Modify: `src/lib/communications/patient-sms-service.ts`
- Add/modify: `tests/portal-phone-verification-contract.test.ts`, `tests/patient-sms-service-contract.test.ts`

**Interfaces:**
- Portal session determines organization/patient/account; caller never supplies another patient/org/phone.
- Verification target is the patient's current normalized chart phone.
- Start limit 5/hour; check limit 8/15 minutes using audit evidence.
- Code is never persisted.
- `recordPatientPhoneVerification` accepts only governed source `twilio_verify` in the restored path.
- Verification is recorded only when Twilio returns `status === "approved"` with valid provider evidence.

- [ ] Add RED source/behavior contracts for session-bound identity, same-origin mutation, rate limits, no code storage, and approved-only recording.
- [ ] Confirm route is absent/current contract fails.
- [ ] Implement route + minimal service typing.
- [ ] Execute focused deterministic checks where possible.
- [ ] Commit.

### Task 4: Template-only governed patient send with all gates

**Files:**
- Modify: `src/lib/communications/patient-sms-service.ts`
- Modify: `src/lib/communications/outbound.ts`
- Modify: `.env.example`
- Modify/add: `tests/patient-sms-service-contract.test.ts`, `tests/sms-template-policy.test.ts`, `tests/twilio-communications.test.ts`

**Interfaces:**
- Replace the latent `sendAuthorizedPatientSms({ body, ... })` contract with `sendAuthorizedPatientSmsTemplate({ templateId, ... })`.
- Required gates, in order: approved fixed non-PHI template; tenant patient; current SMS consent/suppression policy; current phone possession matches current chart phone; explicit `KLINIKOS_SMS_PRODUCTION_ENABLED=true`; configured tenant sender + Messaging Service + timezone + inbound STOP routing; current provider verification matching routing; quiet-hours pass; current patient-SMS commercial funding ready; outbound provider acceptance returns real SID.
- Outbound port accepts optional `sender` and `messagingServiceSid`, but no other domain can infer patient authorization from transport success.

- [ ] Add RED contract asserting arbitrary-body export is absent and every gate exists.
- [ ] Confirm current-main service fails because arbitrary body send exists and hardened gates are absent.
- [ ] Implement minimal service/port changes while preserving the current variable-cost funding gate.
- [ ] Execute focused GREEN source/pure assertions.
- [ ] Update `.env.example` with `KLINIKOS_SMS_PRODUCTION_ENABLED=""` and truthful comments.
- [ ] Commit.

### Final verification / review

- [ ] Compare branch to current main for unrelated changes.
- [ ] Adversarially review tenant scope, consent/possession separation, provider proof invalidation, PHI boundaries, and financial-spend gate.
- [ ] Run focused pure Node assertions for deterministic modules.
- [ ] Run repository release gate only when a runner/dependency environment is available; do not infer green from focused tests.
- [ ] Keep PR draft while GitHub Actions has `runner_id:0` / `steps:null` or until an equivalent exact-head full release gate executes.
