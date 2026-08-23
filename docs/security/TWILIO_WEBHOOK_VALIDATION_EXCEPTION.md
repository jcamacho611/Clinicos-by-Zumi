# Twilio webhook validation temporary security exception

**Status:** TEMPORARY, BOUNDED EXCEPTION

**Owner:** Klinikos engineering

**Review / expiration date:** 2026-09-18

This document does not claim the current custom validator is preferable or equivalent to Twilio's maintained Node SDK. Twilio recommends its server-side SDK validation helpers because webhook parameters and provider behavior can evolve. Klinikos must migrate to the maintained SDK once the dependency and lockfile can be introduced through a fully executed install/test/build gate.

## Exception scope

The exception applies only to:

`POST /api/webhooks/twilio/sms`

It does not approve a general-purpose Twilio validator for voice, Verify callbacks, JSON webhooks, arbitrary query parameters, or future Twilio products.

The approved boundary is intentionally narrow:

- production requires one canonical HTTPS origin from `NEXT_PUBLIC_APP_URL`;
- the route has a fixed path;
- only `application/x-www-form-urlencoded` is accepted;
- request bodies are streamed and capped at 64 KiB;
- duplicate form keys are rejected before signature validation;
- `X-Twilio-Signature` is required and validated against the exact canonical public URL;
- the signed `AccountSid` must equal configured platform `TWILIO_ACCOUNT_SID`;
- `MessageSid` must be a valid Twilio SMS/MMS SID shape;
- the destination sender must resolve to exactly one tenant integration;
- provider `MessageSid` replay is serialized before state mutation;
- inbound message body content is not persisted in communications audit metadata;
- clinical/PHI SMS remains separately blocked.

## Compatibility evidence

`tests/twilio-webhook-security.test.ts` preserves Twilio's published HMAC-SHA1 request-validation example and also proves URL/body tampering fail validation.

Route-level contracts separately require canonical URL construction, content type, bounded body, duplicate-key rejection, AccountSid match, tenant resolution, and empty TwiML behavior.

## Why this exception is bounded

Twilio's maintained SDK owns a wider and evolving compatibility surface. Klinikos intentionally does not claim parity with every future parameter/URL/provider behavior.

If the SMS webhook gains query parameters, accepts JSON, supports another Twilio product, permits duplicate parameters, or changes its canonical URL construction, this exception is automatically invalid and the SDK migration becomes a blocker before deployment.

## Exit criteria

Tracked by P0 issue **#160**. Replace the custom validator with Twilio's maintained server-side validator when all of the following can be completed together:

1. add a pinned/reviewed `twilio` dependency;
2. regenerate `package-lock.json` through npm rather than hand-editing it;
3. prove `npm ci` from the regenerated lockfile;
4. replace the isolated custom validator with the maintained SDK validator;
5. run Prisma validation/migrations, type-check, lint, unit tests, MVP journeys, production build, and startup smoke;
6. keep the published Twilio vector and adversarial route tests;
7. rerun controlled production STOP/START webhook proof;
8. remove this exception or replace it with normal dependency/security-review evidence.

If those exit criteria are not complete by **2026-09-18**, production SMS must remain disabled unless an authorized security review explicitly renews this exception with a new rationale and date.
