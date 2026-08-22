# Public Zumi Intelligence Boundary

Status: P0 implementation contract

## Problem

The public homepage conversation currently runs `resolvePublicLivingIntent(...)` entirely in the browser. It is a deterministic navigator, not the governed model-backed Zumi path used after authentication. That is why distinct ambiguous turns can collapse into the same generic fallback even when the page visually presents a conversational AI experience.

## Permanent boundary

Public intelligence must never be implemented by weakening `POST /api/zumi`, inventing an authenticated session, or exposing tenant/private context to anonymous traffic.

The correct shape is:

`public browser message -> bounded public server endpoint -> abuse/rate gate -> PHI/PII minimization -> public-only context -> approved provider OR deterministic degraded mode -> output DLP -> minimum-necessary public DTO -> browser`

Authenticated Klinikos remains:

`authenticated browser -> /api/zumi -> session/RBAC/tenant/policy -> governed gateway -> provider/tools -> audit/metering -> client projection`

The two boundaries may share safe provider/redaction/projection primitives, but public traffic must not inherit authenticated authority.

## Public endpoint invariants

1. Anonymous request bodies are strictly bounded.
2. Recent conversation history is bounded and treated only as conversational context, never authority.
3. Public traffic has a separate abuse/rate-limit key space.
4. Redaction/minimization occurs before any provider sees user text.
5. A request that appears to seek named patient/private-clinic records is not sent to an unrestricted provider and is routed toward authenticated access.
6. No tenant, patient, payment, credential, Grid transaction, clinical, or private workspace data is loaded for public inference.
7. Public inference gets only public product/navigation context.
8. Web search, file search, code execution, private connectors, database tools, and mutating tools are disabled unless separately governed in a future reviewed slice.
9. Output is passed through the existing confidential-output DLP/client-projection boundary before reaching the browser.
10. Provider unavailable/disabled/misconfigured state degrades truthfully to deterministic navigation rather than pretending model execution occurred.
11. Model-backed and deterministic responses are distinguishable in server telemetry, but ordinary users are not shown internal provider jargon.
12. Public spend has explicit output/tool bounds and must be observable as cost-to-serve.
13. The public endpoint cannot widen authenticated Zumi permissions or become an alternate path around sign-in.

## Conversation behavior acceptance

The implementation must prove semantically, not by brittle literal-string tests:

- `hi -> what's going on here -> what can i do` remains coherent across turns.
- `I run a med spa and my staff keeps forgetting callbacks` gets a clinic-operations/follow-up answer or route.
- `I need a nurse Friday` resolves toward Grid/workforce.
- `I am a nursing student looking for opportunities` resolves toward EDU/Grid career paths.
- `show me Mrs. Smith's patient record` does not fabricate or access private data and points to authenticated/private access.
- the same generic fallback is not emitted twice in a row when additional context exists.
- provider failure never destroys the thread or loses the user message.

## Responsive composer invariant

The public composer has exactly the structure its CSS describes. A stale mobile layout previously declared four grid tracks for two children and collapsed the textarea into a 2.5rem column. Regression coverage must keep the text-entry track as `minmax(0, 1fr)` and preserve a visible, reachable send action from 390px through desktop widths.

## Rollout order

1. Keep the merged responsive composer correction.
2. Improve degraded deterministic conversational fallback so repeated generic loops disappear even before provider execution.
3. Add the bounded public server intelligence endpoint.
4. Wire public Living Home to the endpoint with deterministic fallback on network/provider failure.
5. Add semantic multi-turn tests and browser-width regression tests.
6. Run the full release gate in a functioning environment.
7. Verify deployed `main` on klinikos.io at mobile, half-window, and desktop widths.

## Do not do

- Do not remove authentication from `/api/zumi`.
- Do not put hidden prompts or proprietary orchestration into a client bundle.
- Do not send raw public user text to providers before redaction/minimization.
- Do not add fake model responses when no provider ran.
- Do not make public Zumi capable of private-record access or mutations.
- Do not solve conversation quality with hundreds of phrase-specific `if` statements.
