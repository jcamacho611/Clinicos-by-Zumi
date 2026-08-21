# Zumi on Cloudflare Workers AI

This document describes the Cloudflare Workers AI inference rail for Zumi. It does not
replace the governed Zumi gateway. It is one provider adapter behind that gateway.

## What this adds

- A named `cloudflare` Zumi provider.
- Native `fetch` against Cloudflare's OpenAI-compatible chat-completions endpoint.
- No OpenAI SDK, Cloudflare SDK, or duplicate model gateway inside the Next.js app.
- Cloudflare AI Gateway routing via `cf-aig-gateway-id`, defaulting to `default`.
- Metadata-only AI Gateway logging by default via `cf-aig-collect-log-payload: false`.
- Explicit current-model cost rates so Cloudflare usage enters the same micro-USD spend accounting used by Zumi's bounded cognition loop.
- Existing Zumi admission, redaction, audit, metering, kill switch, and human-review rules remain in force.

## Required configuration

Set these values in the deployment secret store, never in source control:

```text
ZUMI_PROVIDER=cloudflare
ZUMI_CLOUDFLARE_ACCOUNT_ID=<cloudflare-account-id>
ZUMI_CLOUDFLARE_API_TOKEN=<scoped-workers-ai-token>
ZUMI_CLOUDFLARE_MODEL=<exact-active-workers-ai-model-id>
ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS=<current-model-input-rate>
ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS=<current-model-output-rate>
```

Optional:

```text
ZUMI_CLOUDFLARE_GATEWAY_ID=default
```

Leaving the gateway ID blank is equivalent to `default` in the adapter. Cloudflare can
create that default gateway on first use. Do not expose the API token to the browser.

Model availability is an external dependency. Verify the exact selected model against
Cloudflare's current model catalog before deployment. Do not silently substitute a model
because an old example identifier stopped working.

## Runtime contract

The adapter calls:

```text
POST https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/ai/v1/chat/completions
```

with an Authorization bearer token, `cf-aig-gateway-id`,
`cf-aig-collect-log-payload: false`, and the configured Workers AI model identifier.
Cloudflare's OpenAI-compatible endpoint is intentionally used so the adapter remains
small and provider-neutral.

The payload-log suppression header is defense in depth, not a PHI approval mechanism.
Zumi's own admission/redaction and provider-governance boundaries remain authoritative.

## Safety and healthcare boundary

Connecting Workers AI does **not** enable PHI processing.

The adapter declares `baaOnFile: false`, so the existing `phiEgressPermitted` policy
continues to fail closed even if `ZUMI_PHI_EGRESS_APPROVED=1` is accidentally set.
Klinikos must not weaken this merely to make the model connection live.

Before any future PHI use, the deployment would need a separately reviewed legal,
contractual, security, retention, logging, access-control, incident-response, and
infrastructure posture appropriate to the intended healthcare data flow.

## Cost truth

Cloudflare Workers AI is not universally free, and a provider adapter that returns
`costMicroUsd: 0` for every call would bypass the same cost signal used by Zumi's
bounded deep-cognition loop and internal usage accounting.

The deployment therefore supplies the selected model's current input/output rates as
**integer micro-USD per one million tokens**. The adapter multiplies those rates by the
token counts returned with the request and records the result in `ProviderResult.costMicroUsd`.

Important rules:

1. Do not hardcode Cloudflare retail rates in application source. Pricing and model availability change.
2. Verify the selected model's current official rates when configuring or changing the model.
3. Leave the rate variables blank rather than pretending an unknown rate is zero. Provider selection then fails closed as `not_configured`.
4. Do not allocate an account-wide free daily allowance, promotional credit, or negotiated discount to an individual request unless the billing system can attribute it truthfully.
5. The application value is a conservative marginal-cost signal, not a replacement for provider invoices and account-level reconciliation.
6. If Cloudflare changes its billing unit away from a token-equivalent model for the selected model, update the adapter rather than forcing a false token conversion.

Cloudflare's official Workers AI pricing page was re-checked on 2026-08-20 and remained
model-specific. Re-check the provider source before every production rate change.

## Activation checklist

1. Create or select the Cloudflare account used for Klinikos infrastructure.
2. Enable Workers AI.
3. Create a scoped Workers AI / AI Gateway API token.
4. Copy the account ID.
5. Choose and test an active model identifier in Cloudflare.
6. Verify that exact model's current official input/output pricing.
7. Convert the current per-million-token USD rates to integer micro-USD and set both rate variables.
8. Add all required environment variables to the production secret store.
9. Keep `ZUMI_PHI_EGRESS_APPROVED` blank unless a separate approved PHI posture exists.
10. Leave the gateway ID blank/use `default`, or explicitly select a reviewed gateway.
11. Run the Zumi gateway tests and the Cloudflare adapter tests.
12. Exercise a non-PHI Zumi request and confirm provider/model/token/cost/outcome audit metadata.
13. Confirm AI Gateway retains metadata but not raw request/response payloads.
14. Compare application-estimated usage with Cloudflare account billing for a controlled test period.
15. Verify provider-side rate/spend controls before scaling traffic.
16. Only then promote the provider connection as production-live.

## Rollback

Set `ZUMI_DISABLED=1` to stop Zumi at the deployment level, or select another explicitly
configured provider with `ZUMI_PROVIDER`. Zumi never silently substitutes an unnamed
provider when an explicit provider is unavailable.
