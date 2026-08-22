# Public Zumi durable quota contract

Status: production safety boundary for anonymous paid inference.

Public Zumi may remain conversational without a model, but paid anonymous inference must not be authorized by browser-controlled IP headers or a process-local counter.

## Required production flow

```text
visitor
  -> trusted edge/shared quota authority
  -> durable atomic quota decision
  -> on allow: inject secret attestation header
  -> Klinikos /api/zumi/public
  -> verify attestation
  -> bounded public intelligence provider
```

The application accepts paid public inference only when both of these operator settings are present:

- `PUBLIC_ZUMI_DURABLE_QUOTA_MODE=verified_edge`
- `PUBLIC_ZUMI_DURABLE_QUOTA_ATTESTATION_SECRET=<at least 32 random characters>`

The trusted edge/data-layer quota authority must inject the configured secret as:

`X-Klinikos-Public-Zumi-Quota-Attestation`

Do not expose this secret to browser JavaScript, public environment variables, client bundles, logs, analytics, or user-visible responses.

## What counts as a durable quota authority

Use a shared authority whose counters survive application restarts and are shared across all serving instances, for example an edge-provider rate limiter, Redis/KV atomic counter, or equivalent durable service.

The authority must determine client identity from its own trusted network boundary. Klinikos must not treat caller-supplied `X-Forwarded-For` or `X-Real-IP` as paid-inference authorization.

## Fail-closed behavior

If the durable quota authority is absent, unavailable, rejects the request, or fails to attach the exact attestation, `/api/zumi/public` returns a non-success response before provider selection. Public clients then use their deterministic stateful fallback and do not spend provider money.

The existing process-local Zumi rate limit remains defense-in-depth only. It is not evidence that a paid anonymous request is permitted.

## Verification before enabling

Prove all of the following in the deployed environment:

1. spoofed forwarding headers cannot obtain an attestation;
2. repeated requests hit the shared quota across more than one app instance;
3. an app restart does not reset the shared quota;
4. an unavailable quota backend causes public provider inference to fail closed;
5. the attestation secret never reaches the browser or logs;
6. allowed requests still preserve public Zumi input bounds, privacy/clinical/confidentiality interception, no-store provider behavior, and zero authenticated tools.

Do not set `PUBLIC_ZUMI_DURABLE_QUOTA_MODE=verified_edge` merely because an edge/CDN exists. Set it only after the quota and attestation path above is actually deployed and tested.
