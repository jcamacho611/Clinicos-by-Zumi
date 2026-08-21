# Public Zumi security notes

The bounded public-intelligence endpoint is intentionally less powerful than authenticated Zumi.

## Public authority ceiling

Anonymous public inference may explain public Klinikos concepts and help a visitor identify a next route. It has no authority to:

- read tenant data
- read patient data
- access authenticated memory
- call clinic tools
- mutate records
- establish eligibility or credentials
- establish payment or settlement truth
- make clinical decisions
- access private documents/files
- execute web/file/code tools

## Privacy posture

Identifier-shaped content is redacted before any provider boundary and causes the public turn to fail closed rather than continuing with the redacted remainder. Private-record and individualized clinical-advice requests are intercepted before provider selection.

This remains conservative rather than claiming de-identification. Pattern redaction cannot prove that arbitrary free text is free of all PHI/PII, so the page continues to tell visitors not to enter patient information.

## Origin and abuse

Origin allowlisting is defense-in-depth only. It is not authentication because non-browser clients can forge Origin. Abuse resistance also relies on bounded input, a public-specific rate-limit key, provider output/tool budgets, and the fact that no private capability exists behind the endpoint.

The current process limiter is not a distributed quota. A production multi-instance deployment should place a shared/edge limiter and spend ceiling in front of this route before materially increasing public traffic.

## Provider truth

If the configured provider cannot run, the route returns the deterministic public navigator instead. The browser is told only that the experience degraded, not which provider, model, price, environment variable, or internal failure caused it.

Provider cost/token metadata is retained server-side only and must never be added to the public response DTO.
