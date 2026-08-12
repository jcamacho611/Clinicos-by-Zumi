# Pricing rollout notes

Known truth constraints at branch creation:
- Gmail shows repeated Render deploy failures for current Klinikos mainline commits on 2026-08-12. Do not merge this pricing branch into an unhealthy production baseline without resolving the deploy root cause.
- The repository already has a customer-funded access foundation and GoDaddy payment evidence path.
- A GoDaddy domain-management/DNS/account connector is not available in the current tool surface; only domain search/availability functions are exposed. Do not claim DNS or checkout configuration was changed through GoDaddy here.
- Figma account access is view-only on the available Starter team. Pricing design was therefore implemented in code using the repository's current design law rather than pretending to edit a Figma source file.
- Existing automated recurring billing and multi-party marketplace payout readiness must be verified before selling those states as active.
