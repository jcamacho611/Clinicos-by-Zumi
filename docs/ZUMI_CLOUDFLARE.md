# Zumi on Cloudflare Workers AI

This document describes the Cloudflare Workers AI inference rail for Zumi. It does not
replace the governed Zumi gateway. It is one provider adapter behind that gateway.

## What this adds

- A named `cloudflare` Zumi provider.
- Native `fetch` against Cloudflare's OpenAI-compatible chat-completions endpoint.
- No OpenAI SDK, Cloudflare SDK, or duplicate model gateway inside the Next.js app.
- Cloudflare AI Gateway routing via `cf-aig-gateway-id`, defaulting to `default`.
- Metadata-only AI Gateway logging by default via `cf-aig-collect-log-payload: false`.
- Existing Zumi admission, redaction, audit, metering, kill switch, and human-review
  rules remain in force.
- Explicit current-model cost rates so Cloudflare calls participate in the same
  `costMicroUsd` accounting and deep-cognition spend budget as other paid providers.

## Required configuration

Set these values in the deployment secret store, never in source control:

```text
ZUMI_PROVIDER=cloudflare
ZUMI_CLOUDFLARE_ACCOUNT_ID=<cloudflare-account-id>
ZUMI_CLOUDFLARE_API_TOKEN=<scoped-workers-ai-token>
ZUMI_CLOUDFLARE_MODEL=<exact-active-workers-ai-model>
ZUMI_CLOUDFLARE_INPUT_MICRO_USD_PER_M_TOKENS=<current-model-input-rate>
ZUMI_CLOUDFLARE_OUTPUT_MICRO_USD_PER_M_TOKENS=<current-model-output-rate>
```

The two cost variables are **integer micro-USD per one million tokens**. For example,
`45000` means `$0.045 per million tokens`. Populate them from the current official
Cloudflare pricing for the exact selected model and re-check them whenever the model
or provider pricing changes. Do not copy a stale rate from this document into
production.

Optional:

```text
ZUMI_CLOUDFLARE_GATEWAY_ID=default
```

Leaving the gateway ID blank is equivalent to `default` in the adapter. Cloudflare can
create that default gateway on first use. Do not expose the API token to the browser.

Model availability is an external dependency and must be re-verified before future
changes. A model name present in repository history is not proof that Cloudflare still
serves it.

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

Cloudflare publishes model-specific Workers AI pricing and, as of the 2026-08-20
review, also describes an account-level daily free allocation before paid neuron
usage. Those account-wide allocations or credits cannot be truthfully assigned to an
individual request from the chat-completions response alone.

Klinikos therefore records a **conservative marginal request cost** using the exact
model's operator-configured current input/output rates and the token counts returned by
Cloudflare. It deliberately does not subtract an account-wide free allocation from a
single request.

This matters for more than reporting. `ProviderResult.costMicroUsd` is aggregated by
Zumi's cognition loop and compared with `ZUMI_MAX_TURN_COST_MICRO_USD`. Reporting zero
for a paid provider would allow multi-pass cognition to bypass the product's intended
per-turn spend ceiling and would understate tenant cost-to-serve.

The rates are deployment configuration rather than hardcoded constants because:

- Cloudflare pricing is model-specific;
- model availability and rates can change;
- Klinikos can change the selected model without application-code edits;
- old source code must not silently become the billing authority for a new provider
  rate.

Provider/account-level budget alerts remain useful defense in depth. They do not
replace application-level cost metering.

## Activation checklist

1. Create or select the Cloudflare account used for Klinikos infrastructure.
2. Enable Workers AI.
3. Create a scoped Workers AI / AI Gateway API token.
4. Copy the account ID.
5. Choose and test an active model identifier in Cloudflare.
6. Read the current official price for that exact model and convert the input/output
   rates to integer micro-USD per million tokens.
7. Add the required environment variables to the production secret store.
8. Keep `ZUMI_PHI_EGRESS_APPROVED` blank unless a separate approved PHI posture exists.
9. Leave the gateway ID blank/use `default`, or explicitly select a reviewed gateway.
10. Run the Zumi gateway tests and the Cloudflare adapter tests.
11. Exercise a non-PHI Zumi request and confirm provider/model/token/cost/outcome audit
    metadata.
12. Confirm AI Gateway retains metadata but not raw request/response payloads.
13. Confirm the same request cost contributes to the configured Zumi turn budget.
14. Verify provider-side rate/spend controls before scaling traffic.
15. Only then promote the provider connection as production-live.

## Rollback

Set `ZUMI_DISABLED=1` to stop Zumi at the deployment level, or select another explicitly
configured provider with `ZUMI_PROVIDER`. Zumi never silently substitutes an unnamed
provider when an explicit provider is unavailable.
