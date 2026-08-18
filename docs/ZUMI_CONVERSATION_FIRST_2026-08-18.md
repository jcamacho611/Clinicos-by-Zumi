# Zumi conversation-first product law

Date: 2026-08-18
Status: implemented product decision

## Decision

Zumi talks first and routes second.

A user is allowed to simply have a conversation. Greetings, acknowledgements, simple questions, and ambiguous opening turns must not be converted into internal route classifications, workflow diagnostics, capability matrices, or governance explanations.

Routing, authorization, provider selection, tool planning, PHI controls, and human-review policy remain underneath the experience. They are system responsibilities, not ordinary user interface.

## Public Living Home

The public Living Home remains safe and non-clinical. It may converse in a lightweight way and guide a visitor toward the correct public, patient, or authenticated doorway, but it does not open private clinic records or execute work.

The public surface must not pretend a deterministic response is model reasoning. It must also not expose the deterministic router as the personality of Zumi.

Until a separately governed public-model path has runtime, privacy, abuse, retention, cost, and sensitive-data approval, public guidance remains bounded and private Zumi inference remains behind authenticated Klinikos controls.

## Authenticated Zumi

Authenticated Zumi is the full governed conversational assistant. The existing mounted conversation, recent-turn continuity, provider gateway, authorization, memory, voice, research, and trusted-action architecture remain intact.

The default visible experience is now:

`USER MESSAGE → ZUMI ANSWER → OPTIONAL CONTEXTUAL NEXT ACTION → CONTINUE TALKING`

Not:

`USER MESSAGE → MODE BAR → ORCHESTRATION TRACE → BLOCKER MATRIX → ROUTE REGISTRY → USER`

Advanced modes, response preferences, speech, autonomy, and memory remain available behind preferences instead of competing with the conversation.

## UI law

Ordinary conversation must not permanently expose:

- provider readiness;
- route registry terminology;
- orchestration traces;
- candidate tools;
- authorization internals;
- human-review boilerplate;
- PHI boilerplate on every turn;
- capability availability matrices;
- debug states.

Contextual next actions may appear when they materially help the user. Sources may appear when evidence was actually used. Deep operational and readiness detail belongs in appropriate Trust, admin, audit, or settings surfaces.

## Safety non-regression

This simplification does not weaken:

- authentication;
- tenant isolation;
- RBAC;
- patient identity boundaries;
- PHI egress policy;
- provider selection;
- tool authorization;
- payment truth;
- credential and eligibility policy;
- human approval for consequential actions;
- audit and metering.

Complex backend. Simple frontend.
