# Twilio webhook validation temporary security exception

**Status:** TEMPORARY, BOUNDED EXCEPTION

**Owner:** Klinikos engineering

**Review / expiration date:** 2026-09-18

This document does not claim the current custom validator is preferable to Twilio's maintained Node SDK. Twilio recommends its server-side SDK validation helpers because webhook parameters and provider behavior can evolve. Klinikos should migrate to the maintained SDK once the dependency and lockfile can be introduced through a fully executed install/test/build gate.

## Exception scope

The exception applies only to:

`POST /api/webhooks/twilio/sms`

It does not approve a general-purpose Twilio validator for voice, Verify callbacks, JSON webhooks, arbitrary query strings, or future Twilio products.

The approved boundary is intentionally narrower than Twilio's general webhook surface:

- production requires one canonical HTTPS origin from `NEXT_PUBLIC_APP_URL`;
- the route has a fixed path and does not depend on user-controlled query parameters;
- only `application/x-www-form-urlencoded` is accepted;
- request bodies are bounded to 64 KiB before processing;
- duplicate form keys are rejected before signature validation;
- `X-Twilio-Signature` is required and validated against the exact canonical public URL;
- the signed `AccountSid` must equal the configured platform `TWILIO_ACCOUNT_SID`;
- the destination sender must resolve to exactly one tenant integration;
- provider `MessageSid` replay is serialized before state mutation;
- inbound message body content is not persisted in communications audit metadata;
- clinical/PHI SMS remains separately blocked.

## Compatibility evidence

`tests/twilio-webhook-security.test.ts` contains Twilio's published HMAC-SHA1 request-validation example:

- URL: `https://example.com/myapp.php?foo=1&bar=2`
- Auth Token: `12345`
- documented POST parameters: `CallSid`, `Caller`, `Digits`, `From`, `To`
- documented expected signature: `L/OH5YylLD5NRKLltdqwSvS0BnU=`

The test also proves payload tampering and URL tampering fail validation.

The route-level contract separately requires the canonical URL, content type, bounded body, duplicate-key rejection, account match, tenant resolution, and empty TwiML response.

## Why this exception is bounded

Twilio's maintained Node SDK handles a wider and evolving compatibility surface, including URL normalization variants and multi-value form behavior. Klinikos intentionally does not claim parity with all of those cases.

The current SMS webhook avoids those unsupported cases by contract. If the webhook gains query parameters, accepts JSON, supports another Twilio product, permits duplicate parameters, or changes its canonical URL construction, this exception is automatically invalid and the SDK migration becomes a blocker before deployment.

## Exit criteria

Replace the custom validator with Twilio's maintained server-side validator when all of the following can be completed together:

1. add a pinned/reviewed `twilio` dependency;
2. regenerate `package-lock.json` through npm rather than hand-editing it;
3. run `npm ci` from the regenerated lockfile;
4. run type-check, lint, unit tests, MVP journeys, production build, and startup smoke;
5. keep the published Twilio vector and adversarial route tests;
6. rerun controlled production STOP/START webhook proof;
7. remove this exception or replace it with a normal dependency-review record.

If those exit criteria are not complete by **2026-09-18**, production SMS must remain disabled unless an authorized security review explicitly renews this exception with a new rationale and date.
