# Zumi on Cloudflare Workers AI

This document describes the Cloudflare Workers AI inference rail for Zumi. It does not
replace the governed Zumi gateway. It is one provider adapter behind that gateway.

## What this adds

- A named `cloudflare` Zumi provider.
- Native `fetch` against Cloudflare's OpenAI-compatible chat-completions endpoint.
- No OpenAI SDK, Cloudflare SDK, or duplicate model gateway inside the Next.js app.
- Cloudflare AI Gateway routing via `cf-aig-gateway-id`, defaulting to `default`.
- Metadata-only AI Gateway logging by default: the adapter sends
  `cf-aig-collect-log-payload: false`, preserving usage/model/status/cost/duration metadata
  while instructing Cloudflare not to persist raw request or response payloads in AI Gateway logs.
- Existing Zumi admission, redaction, audit, metering, kill switch, and human-review
  rules remain in force.

## Required configuration

Set these values in the deployment secret store, never in source control:

```text
ZUMI_PROVIDER=cloudflare
ZUMI_CLOUDFLARE_ACCOUNT_ID=<cloudflare-account-id>
ZUMI_CLOUDFLARE_API_TOKEN=<scoped-workers-ai-token>
ZUMI_CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct-fast
```

Optional:

```text
ZUMI_CLOUDFLARE_GATEWAY_ID=default
```

Leaving the gateway ID blank is equivalent to `default` in the adapter. Cloudflare can
create that default gateway on first use. The token should be scoped to the Cloudflare
account and AI permissions required by the deployment. Do not expose it to the browser.

The previously documented `@cf/meta/llama-3.1-8b-instruct` model was deprecated by
Cloudflare on 2026-05-30. Do not use it as the production default. The `-fast` variant
remains active at this update; model availability is an external dependency and must be
re-verified before future provider/model changes.

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

`ProviderResult.costMicroUsd` remains `0` for this adapter because Workers AI usage and
free-tier allowances are not safely derivable from the chat-completions token counts in
the application response. This must not be interpreted as a promise that Cloudflare
usage is always free.

Klinikos should treat Cloudflare as a low-cost inference rail and enforce spend at the
provider/account layer until a trustworthy per-request billing signal is available to
the gateway. AI Gateway metadata logging remains useful for measuring model, token,
status, duration, and provider-side cost without retaining raw prompt/completion bodies.

## Activation checklist

1. Create or select the Cloudflare account used for Klinikos infrastructure.
2. Enable Workers AI.
3. Create a scoped Workers AI / AI Gateway API token.
4. Copy the account ID.
5. Choose and test an active model identifier in Cloudflare.
6. Add the required environment variables to the production secret store.
7. Keep `ZUMI_PHI_EGRESS_APPROVED` blank unless a separate approved PHI posture exists.
8. Leave the gateway ID blank/use `default`, or explicitly select a reviewed gateway.
9. Run the Zumi gateway tests and the Cloudflare adapter tests.
10. Exercise a non-PHI Zumi request and confirm provider/model/outcome audit metadata.
11. Confirm AI Gateway retains metadata but not raw request/response payloads.
12. Verify provider-side rate/spend controls before scaling traffic.
13. Only then promote the provider connection as production-live.

## Rollback

Set `ZUMI_DISABLED=1` to stop Zumi at the deployment level, or select another explicitly
configured provider with `ZUMI_PROVIDER`. Zumi never silently substitutes an unnamed
provider when an explicit provider is unavailable.
