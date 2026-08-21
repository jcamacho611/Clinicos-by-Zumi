# Public Zumi browser contract

The browser may receive only:

- the safe public conversation resolution
- whether a model generated the answer
- whether public intelligence was available for the turn
- a coarse degraded boolean

It must not receive provider/model identifiers, token counts, cost, redaction details, hidden system instructions, internal policy state, tool configuration, tenant context, or authenticated workspace data.
