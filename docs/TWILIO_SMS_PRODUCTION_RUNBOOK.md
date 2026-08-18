# Klinikos Twilio SMS Production Runbook

**Status:** production SMS remains fail-closed until every required proof below is complete.

This document is operational truth, not evidence that Twilio is live, registered, HIPAA-approved, or configured in any deployment.

## Current product boundary

Klinikos currently models Twilio as a **platform-managed account with tenant-assigned sender routing**. Bring-your-own Twilio accounts are not a current production capability.

The patient SMS rail permits only server-owned fixed **non-PHI** templates. There is no arbitrary patient SMS body parameter. There is no production marketing template. The staff workflow cannot create marketing permission. Clinical or PHI-bearing SMS is blocked independently of consent state.

Phone possession verification and messaging permission are separate and **both are required** for a patient send. A patient-facing Twilio Verify ceremony is now **BUILT** in the authenticated patient portal. Verification evidence is recorded only after Twilio reports the submitted code as approved and must match the patient's current normalized phone number. This code existence is not a live-provider claim until the deployed ceremony is exercised.

Recipient STOP suppression is authoritative. START/UNSTOP removes suppression only; it does not invent transactional, operational, marketing, or clinical permission.

## Code gates that must remain in force

- `KLINIKOS_SMS_PRODUCTION_ENABLED` is blank/false by default.
- Patient sends require exact message-class permission.
- Patient sends require verification evidence for the exact current normalized phone number.
- Patient phone possession verification is initiated and completed by the authenticated patient portal against the current chart phone; no staff “mark verified” shortcut exists.
- The staff workflow can create transactional/operational permission only from documented patient verbal authorization. Staff documentation can record denial/revocation but cannot manufacture permission.
- Marketing grants and marketing sends are blocked until a dedicated patient-facing written communication-consent ceremony and reviewed production template policy exist.
- Tenant sender, Messaging Service SID, signed inbound routing, provider routing verification, and an IANA timezone must exist before a patient send can proceed.
- Provider routing verification must prove the sender belongs to the platform Twilio account and the configured Messaging Service; editing routing invalidates that evidence.
- Canonical patient sends include both the tenant `From` sender and tenant `MessagingServiceSid` so the outbound message remains associated with the governed Messaging Service.
- Ordinary product SMS is held outside the Klinikos 09:00-20:00 organization-local product window. Jurisdiction-specific policy may only narrow this guardrail.
- Inbound callbacks require the canonical `NEXT_PUBLIC_APP_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, form encoding, bounded request size, valid Twilio signature, matching signed AccountSid, and unique tenant sender resolution.
- Inbound patient-phone resolution uses the same conservative normalization expression indexed by migration `20260818114500_patient_sms_phone_lookup_index`; duplicate shared numbers remain valid data. STOP/START suppression is endpoint-scoped across matching patients, while ordinary inbound text fails closed unless exactly one patient matches.
- Provider `MessageSid` processing is serialized before state mutation and durable replay evidence is recorded.
- Inbound message bodies and verification codes are not persisted to communication audit metadata.

## Required private deployment values

Never paste values into issues, pull requests, chat, screenshots, or Klinikos browser forms.

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_AUTH_TOKEN` for inbound signature verification only
- `TWILIO_VERIFY_SERVICE_SID` for the patient phone-possession ceremony
- canonical production `NEXT_PUBLIC_APP_URL`
- `KLINIKOS_SMS_PRODUCTION_ENABLED` remains false/blank until release proof is complete

`TWILIO_MESSAGING_SERVICE_SID` may remain available only for other controlled non-tenant fallback seams. The canonical patient rail does not infer tenant routing from that global value.

Tenant routing metadata belongs in the organization Integration record and is configured through Klinikos Connections:

- tenant-assigned E.164 sender
- tenant Messaging Service SID
- IANA timezone
- inbound-enabled state
- non-secret provider verification evidence for the current sender/service pair

No Twilio API/Auth secret belongs in the tenant routing UI.

## External/operator release checklist

Do not set `KLINIKOS_SMS_PRODUCTION_ENABLED=true` until all of these have documentary evidence:

1. The production Twilio account and restricted outbound API key exist and are held only in the approved secret store.
2. A Twilio Verify Service exists and `TWILIO_VERIFY_SERVICE_SID` is present only in the approved server secret store.
3. The exact production inbound URL shown by Klinikos is configured in Twilio; no alternate host or redirect is used for signature validation.
4. The tenant sender and Messaging Service are recorded through Connections.
5. The Klinikos **Verify with Twilio** routing action proves that the sender is owned by the configured platform account and belongs to the configured Messaging Service.
6. The sender remains assigned to only one Klinikos organization.
7. Required messaging registration, sender registration, campaign registration, or equivalent provider/carrier requirements applicable to the deployment are complete.
8. Advanced Opt-Out or the reviewed equivalent STOP/START behavior is configured for the Messaging Service used by the patient rail.
9. The tenant IANA timezone is recorded and reviewed.
10. A controlled authenticated patient uses the deployed portal ceremony to request a Twilio Verify code on the **current chart phone**, enters the code, receives provider `approved` evidence, and the stored normalized phone evidence matches exactly. A database edit or staff assertion is not verification.
11. The required transactional or operational SMS permission is recorded independently from the verification event.
12. A fixed non-PHI template is sent to the controlled verified recipient using both the tenant sender and Messaging Service.
13. Twilio returns a real MessageSid and Klinikos records provider evidence without storing message content in audit metadata.
14. The controlled recipient sends STOP. The signed callback reaches the exact production webhook and Klinikos records suppression for the correct tenant and shared endpoint where applicable.
15. A second ordinary send attempt is blocked while suppression is active.
16. The recipient sends START or another provider-supported resume command. Klinikos removes suppression but does **not** create any missing message-class permission.
17. Replay the same signed provider event or otherwise exercise duplicate delivery. The state transition remains idempotent.
18. Exercise a wrong signature, wrong AccountSid, wrong tenant sender, wrong Messaging Service, duplicate ordinary-message patient phone, stale/mismatched phone verification, failed/incorrect verification code, excessive Verify attempts, and outside-quiet-hours attempt. Each fails closed.
19. Apply and verify migration `20260818114500_patient_sms_phone_lookup_index` in the target database; do not infer migration success from source control alone.
20. Review audit evidence and provider logs together; no redirect, credential presence, configured badge, or provider-routing verification alone is accepted as proof of message delivery.
21. Complete the dependency/security release review below and confirm the temporary validator exception has not expired.
22. Perform keyboard, screen-reader, zoom, and mobile browser QA for the patient verification and staff communications controls.
23. Only after these checks pass may an authorized operator enable `KLINIKOS_SMS_PRODUCTION_ENABLED=true`.

## Dependency/security status

The current inbound signature primitive is intentionally isolated in `src/lib/communications/twilio-webhook.ts`. Klinikos still prefers migration to Twilio's maintained server SDK validator when the dependency can be introduced with a genuinely regenerated/tested lockfile.

A **temporary bounded engineering security exception** is recorded at `docs/security/TWILIO_WEBHOOK_VALIDATION_EXCEPTION.md`. The exception is tracked by P0 issue **#160** and expires/requires explicit review on **2026-09-18**.

Do not edit `package.json` without a matching lockfile generated through npm merely to satisfy the SDK migration checkbox.

## Verification ceremony status

The authenticated patient-portal Twilio Verify ceremony is **BUILT**:

- patient and organization are derived from the authenticated portal session;
- the destination is the current normalized chart phone, not a caller-supplied number;
- start/check attempts are bounded and audited;
- verification codes are sent to Twilio Verify but not persisted in Klinikos audit/database metadata;
- only provider status `approved` records possession evidence;
- provider verification references must match Twilio Verify SID shape before they are accepted as evidence;
- possession evidence does not grant any messaging permission.

It remains **PENDING LIVE PROOF** until the exact deployed ceremony is exercised against the configured Twilio Verify Service.

## Marketing-consent blocker

A generic signed form, network data-sharing consent, or staff-entered evidence string is **not** treated as marketing-SMS permission. Marketing remains blocked until Klinikos has a purpose-specific patient-facing communication-consent ceremony, evidence model, withdrawal flow, and reviewed marketing template policy.

## PHI / healthcare boundary

Completing this runbook does **not** authorize PHI over SMS. Clinical or PHI-bearing SMS remains blocked until the exact infrastructure, provider products, contracts/BAA posture, minimum-necessary content policy, security controls, and healthcare compliance review are separately approved and implemented.

## Truth states

- **BUILT** — code exists.
- **PENDING CONNECTION** — code exists but external configuration/proof is incomplete.
- **PENDING LIVE PROOF** — the intended deployed flow exists but has not been exercised with authoritative provider/runtime evidence.
- **OPERATOR-REPORTED CONFIGURED** — an operator says a secret/account setting exists; runtime proof still required.
- **VERIFIED LIVE** — the exact deployed workflow was exercised with provider evidence and audit evidence.
- **BLOCKED** — a required safety, contractual, external, or infrastructure gate is unresolved.

Twilio patient SMS is not **VERIFIED LIVE** merely because credentials, a sender, a webhook URL, a Verify Service, or provider-routing evidence exists.
