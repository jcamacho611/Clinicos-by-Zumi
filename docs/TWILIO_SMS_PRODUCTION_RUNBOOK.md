# Klinikos Twilio SMS Production Runbook

**Status:** production SMS remains fail-closed until every required proof below is complete.

This document is operational truth, not evidence that Twilio is live, registered, HIPAA-approved, or configured in any deployment.

## Current product boundary

Klinikos currently models Twilio as a **platform-managed account with tenant-assigned sender routing**. Bring-your-own Twilio accounts are not a current production capability.

The patient SMS rail permits only server-owned fixed **non-PHI** templates. There is no arbitrary patient SMS body parameter. There is no production marketing template. Clinical or PHI-bearing SMS is blocked independently of consent state.

Phone possession verification and messaging permission are separate. Recipient STOP suppression is authoritative. START/UNSTOP removes suppression only; it does not invent transactional, operational, marketing, or clinical permission.

## Code gates that must remain in force

- `KLINIKOS_SMS_PRODUCTION_ENABLED` is blank/false by default.
- Patient sends require exact message-class permission.
- Marketing grants require patient-written evidence, but no marketing send template exists.
- Tenant sender, signed inbound routing, and an IANA timezone must exist before a patient send can proceed.
- Ordinary product SMS is held outside the Klinikos 09:00-20:00 organization-local product window. Jurisdiction-specific policy may only narrow this guardrail.
- Inbound callbacks require the canonical `NEXT_PUBLIC_APP_URL`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, form encoding, bounded request size, valid Twilio signature, matching signed AccountSid, unique tenant sender resolution, and unique tenant patient resolution.
- Inbound message bodies are not persisted to communication audit metadata.

## Required private deployment values

Never paste values into issues, pull requests, chat, screenshots, or Klinikos browser forms.

- `TWILIO_ACCOUNT_SID`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_AUTH_TOKEN` for inbound signature verification only
- `TWILIO_VERIFY_SERVICE_SID` only if Verify is used
- optional `TWILIO_MESSAGING_SERVICE_SID` for non-tenant fallback seams
- canonical production `NEXT_PUBLIC_APP_URL`

Tenant routing metadata belongs in the organization Integration record and is configured through Klinikos Connections:

- tenant-assigned E.164 sender
- optional non-secret Messaging Service SID consistency identifier
- IANA timezone
- inbound-enabled state

## External/operator release checklist

Do not set `KLINIKOS_SMS_PRODUCTION_ENABLED=true` until all of these have documentary evidence:

1. The production Twilio account and restricted outbound API key exist and are held only in the approved secret store.
2. The exact production inbound URL shown by Klinikos is configured in Twilio; no alternate host or redirect is used for signature validation.
3. The tenant sender is actually owned/routable by the configured platform Twilio account and is assigned to only one Klinikos organization.
4. Required messaging registration, sender registration, campaign registration, or equivalent provider/carrier requirements applicable to the deployment are complete.
5. The tenant IANA timezone is recorded and reviewed.
6. A fixed non-PHI template is sent to a controlled test recipient from the tenant-assigned sender.
7. Twilio returns a real MessageSid and Klinikos records provider evidence without storing message content in audit metadata.
8. The controlled recipient sends STOP. The signed callback reaches the exact production webhook and Klinikos records suppression for the correct patient and tenant.
9. A second ordinary send attempt is blocked while suppression is active.
10. The recipient sends START or another provider-supported resume command. Klinikos removes suppression but does **not** create any missing message-class permission.
11. Replay the same signed provider event or otherwise exercise duplicate delivery. The state transition remains idempotent.
12. Exercise a wrong signature, wrong AccountSid, wrong tenant sender, duplicate patient phone, and outside-quiet-hours attempt. Each fails closed.
13. Review audit evidence and provider logs together; no redirect, credential presence, or UI badge is accepted as proof of delivery.
14. Perform the dependency/security release review described below.
15. Only after these checks pass may an authorized operator enable `KLINIKOS_SMS_PRODUCTION_ENABLED=true`.

## Dependency/security release blocker

The current inbound signature primitive is intentionally isolated in `src/lib/communications/twilio-webhook.ts` and accepts all signed form parameters. Twilio recommends using its maintained server SDK for webhook validation because provider parameters and validation behavior can evolve.

**Before general production SMS is enabled**, regenerate the dependency lockfile in a controlled engineering environment and either:

- replace the isolated custom signature primitive with the maintained official Twilio server SDK validator, then rerun the adversarial webhook tests; or
- document and approve a security exception with vendor-compatible test vectors and a named owner/review date.

Do not edit `package.json` without a matching lockfile change merely to satisfy this checkbox.

## PHI / healthcare boundary

Completing this runbook does **not** authorize PHI over SMS. Clinical or PHI-bearing SMS remains blocked until the exact infrastructure, provider products, contracts/BAA posture, minimum-necessary content policy, security controls, and healthcare compliance review are separately approved and implemented.

## Truth states

Use these terms consistently:

- **BUILT** — code exists.
- **PENDING CONNECTION** — code exists but external configuration/proof is incomplete.
- **OPERATOR-REPORTED CONFIGURED** — an operator says a secret/account setting exists; runtime proof still required.
- **VERIFIED LIVE** — the exact deployed workflow was exercised with provider evidence and audit evidence.
- **BLOCKED** — a required safety, contractual, external, or infrastructure gate is unresolved.

Twilio patient SMS is not **VERIFIED LIVE** merely because credentials, a sender, or a webhook URL exist.
