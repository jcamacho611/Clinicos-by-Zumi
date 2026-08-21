# Public Zumi cost boundary

Anonymous inference is an acquisition/product-explanation cost, not tenant usage. It must never be charged to a clinic allowance merely because the same provider adapter is used after sign-in.

The public service therefore records provider token/cost telemetry only on the server and exposes none of it to the browser. It does not write anonymous spend into an organization-scoped commercial ledger because there is no truthful organization owner for that cost.

Before materially scaling anonymous inference, add an explicit platform-acquisition budget/alert and a distributed limiter. Do not solve the accounting gap by inventing a tenant, assigning anonymous traffic to a demo clinic, or rounding provider usage into customer charges.
