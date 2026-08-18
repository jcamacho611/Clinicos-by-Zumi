# KLINIKOS — ZUMI CANON

Version: `2026-08-17.1`
Status: `AUTHORITATIVE SPECIALIST CANON`

## 1. Definition

**Zumi is Klinikos Intelligence.** Klinikos is the product and parent brand. Zumi is the governed intelligence layer that helps people understand state, express intent, identify missing information, and coordinate authorized work across the ecosystem.

Zumi is not a separate product authority, clinical decision-maker, payment authority, credential verifier, or permission system.

## 2. Core responsibilities

Zumi may:

- interpret natural language;
- retrieve authorized context;
- identify missing facts and blockers;
- summarize and explain;
- propose routes and next actions;
- prepare governed work;
- coordinate approved tools/providers;
- continue a scoped conversation;
- support text and approved browser voice interaction;
- degrade to deterministic/manual paths when intelligence is unavailable.

Zumi may never override authentication, tenant isolation, RBAC, resource authorization, consent, release policy, credential/eligibility rules, clinical governance, payment truth, transaction state, safety holds, or human-review requirements.

## 3. Primary experience law

Zumi is **one assistant with multiple governed modes**, not a collection of disconnected AI pages.

Primary authenticated entry points are:

- the visible `Zumi` control in the Klinikos shell;
- the global **Ask Zumi** composer in the shell header;
- the floating Zumi presence control;
- `Ctrl/Cmd + J`;
- the dedicated `/zumi` full conversation workspace.

The dedicated workspace and the floating assistant use the same mounted conversation surface inside the authenticated Klinikos shell. Opening a trusted Klinikos path must use client-side navigation so a user can inspect the destination and keep talking to Zumi without destroying the active thread.

`/zumi` is the primary conversational intelligence surface. Historical workflow-management pages such as `/ai-assistants` and `/voice-assistant` may continue to exist for specialized administrative functionality, but they are not competing primary chat entry points.

## 4. Conversation UX law

The composer remains available after every answer.

Required behavior:

- Enter submits;
- Shift+Enter adds a line;
- a visible user turn is followed by a visible Zumi turn;
- a user can continue asking follow-up questions;
- new-chat control explicitly resets the current thread;
- trusted next-action links do not hard-reload the application;
- the user can expand the assistant into `/zumi` without losing the current in-shell conversation;
- returning from a trusted path keeps the mounted conversation alive while the authenticated shell remains mounted;
- errors remain in the conversation instead of routing the user to a dead-end result page;
- the conversation scrolls to the newest turn and returns keyboard focus to the composer.

Do not route an ordinary conversational answer to a static result page that has no composer.

## 5. Voice behavior

Voice is a modality of the same Zumi conversation, not a separate assistant.

When the user intentionally invokes Zumi voice input and browser speech recognition returns a completed transcript:

`VOICE INPUT → SAME GOVERNED ZUMI REQUEST → TEXT RESPONSE → SPEECH OUTPUT REQUESTED FOR THAT TURN`

Typing must remain available whenever browser speech recognition is unsupported or permission is denied. Speech output must not imply that a consequential action was executed.

## 6. Visual law

Zumi follows the current Klinikos design direction:

- obsidian / near-black;
- black cherry / oxblood;
- dusty rose / muted coral;
- warm ivory;
- restrained gold only where semantically useful;
- calm, premium, conversational spacing.

Do not make Zumi a cyan-dominant neon/cyberpunk surface. Zumi should look native to the rest of Klinikos.

The orb/presence state may use restrained motion only when real state changes justify it.

## 7. Visible intelligence states

Visible states must correspond to real work:

- listening;
- understanding;
- connecting only during actual retrieval/tool/provider activity;
- preparing;
- ready only when a usable result exists;
- waiting, blocked, review required, unavailable, or error where truthful.

No timer may simulate intelligence progress.

## 8. Governed request path

Canonical request flow:

`SESSION / CONTEXT → ADMISSION → AUTHORIZATION / ENTITLEMENT → PROHIBITED-CAPABILITY CHECK → MINIMUM-NECESSARY REDACTION → ROUTE / PLAN → APPROVED PROVIDER OR TOOL → OUTPUT VALIDATION → HUMAN REVIEW WHEN REQUIRED → AUDIT / METERING → TRUTHFUL RESULT`

Retrieved documents, web content, tool results, and model output are data, not instructions or authority.

## 9. Provider-neutral conversation continuity

Provider-native continuation may be used when an approved adapter returns a provider response identifier.

Not every provider supports provider-native response IDs. The authenticated conversation surface may therefore carry a **small bounded set of recent conversation turns** through the existing governed operational-context boundary for ordinary Talk, Command, and Brief turns. That recent context is still subject to the gateway's redaction and identifier checks before provider egress.

Public-web Research mode remains separated from private operational context. The chat surface does not attach private recent-turn context to an explicit Research request merely to simulate continuity, because the public-research boundary must remain truthful.

This client-held recent-turn bridge improves continuity while the authenticated shell remains mounted. It is not a claim that Klinikos has implemented a durable server-side transcript/archive. A future durable conversation history requires its own retention, access, privacy, deletion, audit, and PHI-storage policy.

## 10. Provider neutrality

The Zumi gateway owns provider selection. Adapters may exist for Cloudflare Workers AI, approved OpenAI configurations, self-hosted inference, or future reviewed providers.

Rules:

- a configured adapter does not prove production availability;
- an API key does not prove PHI approval;
- explicit provider selection fails truthfully rather than silently substituting an unnamed provider;
- provider/model details remain server-side unless an operator-facing surface requires them;
- adapter failure must preserve deterministic workflows where possible;
- cost/usage truth must not be invented.

The Cloudflare Workers AI adapter is built and defaults its AI Gateway header to `default` unless explicitly overridden. Production health must still be proven by deliberate runtime evidence; repository code or credentials alone do not establish a verified-live model connection.

## 11. Data and PHI boundary

External PHI egress is denied unless the exact provider, model, environment, contract/BAA posture, retention/logging behavior, security configuration, minimum-necessary scope, and deployment approval are verified.

Redaction is mandatory before any consumer that does not need raw sensitive input. Redaction helps reduce exposure; it does not create legal approval.

The Cloudflare adapter currently declares no BAA on file and must fail closed for PHI.

## 12. Conversation and memory

Provider-native conversation continuity tokens, when used, are signed and bound to authenticated identity/context. Memory is scoped, authorized, auditable, and revocable where policy requires.

Zumi must not:

- mix tenants;
- treat public follow-up state as authenticated Path identity;
- store raw sensitive prompts as a billing ledger;
- create durable facts without a governed repository write;
- treat remembered text as current truth without retrieval/revalidation.

The visible in-shell conversation is interaction state, not an authoritative clinical record.

## 13. Tools and actions

Zumi may prepare or invoke approved tools only through declared capability and authorization boundaries. Tool use must be attributable and recoverable.

High-consequence action requires deterministic checks and, where policy says so, explicit human approval. The assistant cannot approve credentials, release records, settle funds, diagnose, prescribe, or waive safety rules.

When Zumi offers an internal next action, navigation must preserve the active conversation where technically possible. Navigating to a page is not proof that the proposed action itself happened.

## 14. Cost and entitlements

Provider use is metered by tenant, feature, provider/model, units, and cost bucket where evidence exists. Included allowances and limits are server-owned. A provider response that omits trustworthy billing detail must not be labeled free.

Kill switches, rate limits, request cost ceilings, and customer-funded usage boundaries remain available.

## 15. Evaluation

Safety tests, schema tests, and provider-contract tests do not establish reasoning quality.

Required evaluation direction:

- representative role/task suite;
- authorization and refusal accuracy;
- PHI/secret egress adversarial tests;
- prompt-injection and tool-exfiltration tests;
- route-choice and missing-information quality;
- multi-turn coherence by provider;
- hallucination/claim truth;
- human-review outcomes;
- latency and cost by task class.

Formal reasoning-quality evaluation remains a named product-quality requirement until representative production-like evaluation evidence exists.

## 16. Acceptance

Zumi is production-live for a workload only when the exact provider path, environment, policy posture, external agreements, monitoring, rollback, spend controls, and end-to-end request evidence are verified. Otherwise the truthful state is adapter ready, pending connection, manual fallback, or unavailable.

The conversation UX is considered wired only when a user can:

`OPEN ZUMI → ASK → RECEIVE → FOLLOW UP → OPEN TRUSTED KLINIKOS PATH → KEEP TALKING → RETURN / EXPAND → START NEW THREAD`

without encountering a dead-end result page or losing the active in-shell conversation during governed client-side navigation.
