# Public Zumi risk register

## Known remaining risks before production scale

- The current in-process anonymous rate limiter is defense-in-depth, not a shared distributed quota.
- Pattern-based PII/PHI detection is deliberately conservative but cannot prove arbitrary free text is de-identified.
- Provider-side retention behavior depends on the configured provider adapter/contract and must remain appropriate for the public non-sensitive use case.
- Public inference cost is observable in server logs but does not yet have a dedicated anonymous durable cost ledger.
- Model quality must be verified against real public product questions after deployment; code wiring alone is not proof of useful intelligence.

## Controls already in the slice

- separate anonymous endpoint, no authenticated session inheritance
- strict request/history/body limits
- same-site origin allowlist as defense-in-depth
- public-specific rate key
- private-record interception before inference
- clinical-advice interception before inference
- identifier redaction plus fail-closed behavior before provider call
- no optional provider tools
- bounded output tokens and timeout
- confidential-output DLP before browser response
- no provider/model/cost/redaction internals in DTO
- deterministic fallback on provider failure
- duplicate client submissions blocked while a turn is pending
