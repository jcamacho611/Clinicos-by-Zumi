# Public Zumi product truth

Public Zumi is a bounded conversational front door to Klinikos. It may answer general product questions and help a visitor find the next useful Klinikos route. It is not an authenticated clinic workspace.

The browser must never imply that public Zumi can open patient records, inspect a tenant, execute clinic work, make regulated decisions, or use the same authority available after sign-in.

When model-backed public intelligence is available, it improves conversation quality inside this public ceiling. When it is unavailable or a turn crosses a privacy/clinical boundary, the experience degrades to deterministic public guidance. The UI must remain useful without pretending a model executed.

Authenticated Zumi remains the governed operating intelligence for signed-in Klinikos users and keeps its existing session, RBAC, tenant, policy, audit, metering, entitlement, and tool boundaries.
