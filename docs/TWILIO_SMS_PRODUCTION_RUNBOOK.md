# Klinikos Twilio SMS Production Runbook

**Status:** BLOCKED / PENDING LIVE PROOF. Production patient SMS remains fail-closed until every required proof below is complete.

This document is operational truth, not evidence that Twilio is live, registered, HIPAA-approved, funded, or configured in any deployment.

## Current product boundary

Klinikos models Twilio as a platform-managed account with tenant-assigned sender routing. Bring-your-own Twilio accounts are not a current production capability.

The canonical patient SMS rail permits only server-owned fixed **non-PHI** transactional/operational templates. There is no arbitrary patient SMS body parameter, no production marketing template, and no clinical/PHI SMS rail.

Phone possession and messaging permission are separate. The authenticated patient portal contains a patient-controlled Verify ceremony, but the current `phone_verification` economic policy remains unresolved; therefore provider Verify calls are blocked before Twilio invocation until ownership/funding is explicitly approved. Code existence is not live-provider proof.

Recipient STOP suppression is authoritative. START/UNSTOP removes suppression only; it does not invent transactional, operational, marketing, or clinical permission.

## Current code gates

- `KLINIKOS_SMS_PRODUCTION_ENABLED` is blank/false by default.
- Patient sends accept a server-owned template ID, not a caller-authored body.
- Clinical/PHI and marketing patient SMS remain blocked.
- Exact message-class permission is required.
- Current phone-possession evidence must match the patient's current normalized chart phone and valid Twilio Verify provider evidence.
- Staff can document transactional/operational permission only from patient verbal authorization. Staff documentation alone can deny/revoke but cannot manufacture a grant.
- Recipient suppression blocks ordinary sends and staff cannot clear provider-driven suppression from the chart.
- Tenant sender, Messaging Service, signed inbound routing, IANA timezone, and current provider routing proof are required.
- Routing edits invalidate prior provider proof.
- Provider routing proof is not production authorization.
- Ordinary product SMS is held outside 09:00–20:00 tenant-local time.
- `patient_sms` variable-cost execution remains blocked until durable micro-unit customer funding/reconciliation is actually ready.
- `phone_verification` provider calls remain blocked while its cost owner/funding mode is unresolved.
- Inbound callbacks require canonical HTTPS URL, matching AccountSid, form encoding, streamed 64 KiB maximum body, unique form keys, valid signature, strict MessageSid shape, and unique tenant resolution.
- Inbound provider events are replay-protected before mutation and inbound body content is not stored in communications audit metadata.

## Patient/contact data rules

New patient phone values are canonicalized at intake:

- common U.S. 10-digit formatting becomes E.164 `+1...`;
- explicit international `+country-code` intent is preserved;
- ambiguous non-U.S. bare numbers are rejected rather than country-guessed;
- blank remains allowed.

Inbound lookup uses the same normalization expression backed by additive migration:

`20260823010000_patient_sms_phone_lookup_index`

The index is intentionally non-unique because shared household/contact numbers may be valid data. Application resolution fails closed when multiple patients match an ordinary inbound source number.

## Required private deployment values

Never paste real values into issues, pull requests, chat, screenshots, or browser forms.

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_AUTH_TOKEN` for inbound signature validation
- `TWILIO_VERIFY_SERVICE_SID` for the patient possession ceremony once its economic policy is authorized
- canonical production `NEXT_PUBLIC_APP_URL`
- `KLINIKOS_SMS_PRODUCTION_ENABLED` remains false/blank until release proof is complete

Tenant routing metadata belongs in the organization Integration record and contains only non-secret routing/evidence state. Current operator surface: `/integrations/twilio`.

## External/operator release checklist

Do not set `KLINIKOS_SMS_PRODUCTION_ENABLED=true` until all applicable items have authoritative evidence:

1. Production Twilio account and restricted outbound API key exist only in approved secret storage.
2. The exact production inbound callback URL is configured with no redirect/canonical-host mismatch.
3. Tenant sender and Messaging Service are configured through the governed routing surface.
4. **Verify with Twilio** proves current sender ownership and Messaging Service membership.
5. Sender is assigned to only one Klinikos organization.
6. Required carrier/provider messaging registration is complete for the intended traffic.
7. Advanced Opt-Out or reviewed equivalent STOP/START behavior is configured for the governed Messaging Service.
8. Tenant IANA timezone is recorded and reviewed.
9. Migration `20260823010000_patient_sms_phone_lookup_index` is deployed and verified in the target database.
10. The `phone_verification` economic owner/funding policy is explicitly resolved before any paid Verify provider call is enabled.
11. A controlled authenticated patient requests and completes Verify on the **current chart phone**; provider returns valid approved evidence and no code is persisted.
12. Transactional/operational SMS permission is recorded independently from phone possession.
13. Durable `patient_sms` micro-funding reservation/reconciliation authority is proven; provider credentials do not substitute for funding.
14. A fixed non-PHI template is sent using the tenant sender and Messaging Service.
15. Twilio returns a real valid MessageSid and Klinikos records provider evidence without storing message content in audit metadata.
16. The controlled recipient sends STOP; the signed callback records suppression in the correct tenant.
17. A second ordinary send attempt is blocked while suppressed.
18. Recipient sends START/UNSTOP; suppression is removed but missing permission is not invented.
19. Replay/duplicate callback evidence is exercised and remains idempotent.
20. Wrong signature, wrong AccountSid, wrong tenant sender/service, ambiguous patient phone, stale phone verification, failed code, excessive Verify attempts, and quiet-hours attempts each fail closed.
21. Audit evidence and provider evidence are reviewed together; credentials/configuration badges are never treated as delivery proof.
22. The temporary webhook-validator exception is still valid or P0 issue #160 is completed with the maintained Twilio SDK validator.
23. Keyboard, screen-reader, zoom, and mobile-browser QA are completed for operator, staff-consent, and patient-verification surfaces.
24. Only after these checks pass may an authorized operator enable `KLINIKOS_SMS_PRODUCTION_ENABLED=true`.

## Database proof already completed for this branch

The normalized-phone index migration was applied to a disposable Neon branch cloned from the production parent. The index existed with the expected expression and the exact application lookup could use it. The temporary branch was deleted afterward. **Production was not modified.** This is migration compatibility evidence, not production-deployment evidence.

## Dependency/security status

The current inbound signature primitive remains isolated in `src/lib/communications/twilio-webhook.ts`. Klinikos prefers Twilio's maintained server SDK validator once the dependency can be introduced with a genuinely regenerated/tested lockfile and full engineering gate.

The temporary bounded exception is documented at `docs/security/TWILIO_WEBHOOK_VALIDATION_EXCEPTION.md`, tracked by P0 issue **#160**, and expires/requires explicit review on **2026-09-18**.

Do not hand-edit `package-lock.json` merely to satisfy the SDK migration checkbox.

## Truth states

- **BUILT** — code exists.
- **PENDING CONNECTION** — external configuration/evidence is incomplete.
- **PENDING LIVE PROOF** — intended deployed flow exists but has not been exercised with authoritative runtime/provider evidence.
- **BLOCKED** — a required safety, financial, contractual, dependency, or infrastructure gate is unresolved.
- **VERIFIED LIVE** — the exact deployed workflow was exercised with provider and audit evidence.

Twilio patient SMS is not **VERIFIED LIVE** merely because credentials, a sender, a Verify Service, a green UI state, routing proof, or this code exists.
