# Klinikos Legal Access Foundation

Status: `ENGINEERING FOUNDATION / LEGAL LANGUAGE PENDING TARGETED REVIEW`

This document describes the shippable legal-access foundation. It is implementation truth, not a claim that drafted agreements are attorney-approved or enforceable in every jurisdiction.

## Objective

Protected Klinikos access can be conditioned on affirmative execution of the exact applicable agreement version without placing intentionally public marketing/SEO content behind a contract wall.

Klinikos now distinguishes two legal-access layers.

### Universal protected entry

`PUBLIC DISCOVERY → ENTER KLINIKOS → ENTRY AGREEMENT → PRESENTATION → REACH END → ACKNOWLEDGMENTS → CLICKWRAP ELECTRONIC ACCEPTANCE → ANONYMOUS SERVER EVIDENCE → SIGNUP / LOGIN → AUTHENTICATED IDENTITY BINDING → PROTECTED INTERACTIVE ACCESS`

### Additional authenticated agreements

`AUTHENTICATED RELATIONSHIP → APPLICABLE ADDITIONAL AGREEMENT → PRESENTATION → REACH END → ACKNOWLEDGMENTS → ELECTRONIC SIGNATURE → SERVER VERIFICATION → EVIDENCE → ROLE / PRODUCT / TRANSACTION ACCESS`

Public marketing pages remain outside the protected-entry hard gate. The patient portal remains a separate governed patient-access path rather than being forced through a proprietary evaluation/confidentiality contract merely to reach the patient's own authorized records.

## Current protected-entry contract

The universal entry document introduced by the 2026-08-23 gateway tranche is:

- key: `klinikos-protected-entry-confidentiality-esign`
- version: `2026.08.23.1`
- scope: protected interactive entry + confidentiality/restricted-use covenant + clickwrap electronic-acceptance intent + AI/healthcare/Grid truth boundaries
- execution model: anonymous exact-version/hash clickwrap evidence, followed by authenticated identity binding after valid credentials

The previously implemented authenticated baseline document remains preserved:

- key: `klinikos-global-terms-confidentiality-esign`
- version: `2026.08.18.1`
- scope: authenticated protected-product terms + confidentiality covenant + typed electronic-signature intent
- role-aware additional acknowledgments for professional/contractor roles

Published versions are immutable. The 2026.08.18.1 text is not silently mutated to support the new clickwrap flow.

Neither document is a substitute for a BAA, DPA, negotiated MSA, Grid Participant Agreement, professional addendum, organization addendum, seller agreement, medical/treatment consent, HIPAA authorization, payment evidence, credential verification, or other relationship-specific document.

## Runtime configuration

Legal enforcement is intentionally OFF unless explicitly enabled.

Required factual configuration before execution:

- `KLINIKOS_LEGAL_ENTITY_NAME`
- `KLINIKOS_GOVERNING_LAW`
- `KLINIKOS_LEGAL_FORUM`
- `KLINIKOS_LEGAL_CONTACT_EMAIL`
- `KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED=true` only after controlled protected-entry production proof
- `LEGAL_GATE_ENFORCEMENT_ENABLED=true` only when the legacy/additional authenticated gate is deliberately required and separately proven

The product fails closed instead of inventing a contracting entity, governing law, forum, persistent acceptance record, or agreement state.

## Public discovery versus protected interaction

Public pages may describe Klinikos, expose intentionally public educational information, support SEO, allow bounded public Zumi guidance, and provide public Trust/Pricing/How-It-Works content.

`ENTER KLINIKOS` is the governed transition from anonymous discovery into non-public interactive experiences. Protected/private demos, authenticated Grid participation, professional workflows, Clinic OS, private EDU workspaces, and other restricted experiences should converge through this transition rather than accumulating direct-login bypasses.

Public information is public. Contractual confidentiality supplements technical secrecy and does not retroactively convert intentionally public information into a trade secret.

## Anonymous entry acceptance and identity binding

The entry ceremony deliberately occurs before authentication.

The browser receives a short-lived server-signed presentation token containing only the anonymous entry-session identifier and exact agreement identity. The browser must reach the end of the agreement container before the server will exchange that token for reviewed evidence.

After all required acknowledgments are affirmatively selected, the server persists an anonymous acceptance using the existing legal evidence store with:

- exact document key/version/hash;
- exact canonical snapshot;
- presentation/reached-end/acknowledgment/acceptance timestamps;
- affirmative acknowledgment map;
- `signatureMethod = clickwrap`;
- anonymous entry-session identifier;
- idempotency key;
- trusted request-boundary IP/user-agent metadata when available;
- `userId = NULL` and `organizationId = NULL` until authentication succeeds.

The browser then receives only a short-lived HttpOnly accepted-entry token. Browser localStorage/sessionStorage is never contractual authority.

After successful credential authentication, Klinikos atomically binds that acceptance to the persistent user and organization identity and records a `legal.entry.bound_to_identity` event. If identity binding fails, the newly created authenticated session is revoked and protected access is denied.

An anonymous clickwrap record does not claim notarization, advanced identity proofing, qualified signature status, organization authority, credential verification, clinical authorization, payment, or settlement.

## Authentication versus entitlement

`getAuthenticationSession()` answers only whether the user currently has a valid authenticated Klinikos session.

When the universal entry gate is enabled, `getClinicSession()` and `requireClinicSession()` additionally require a current bound protected-entry acceptance. This provides defense in depth against direct login/API bypass and against stale sessions created before the entry gate was activated.

When the universal entry gate is disabled, the legacy authenticated agreement gate can continue to operate independently through `LEGAL_GATE_ENFORCEMENT_ENABLED`.

This separation matters because legal routes, logout, account recovery, agreement history, and controlled reauthentication may need authentication even while protected product entitlement is blocked.

## Agreement integrity

Published agreement versions are frozen by:

- document key;
- semantic/date version;
- exact canonical text snapshot;
- SHA-256 content hash.

If source text changes without a new version, the agreement registry refuses to silently replace the published version.

Historical acceptance stores the exact snapshot and hash executed by the participant. A later Terms update does not rewrite earlier evidence.

## Review interaction

The system deliberately does **not** claim that scrolling proves a human read or understood every word. It proves a documented presentation/review interaction before acceptance controls unlocked.

Anonymous entry presentation/review tokens bind:

- anonymous entry-session ID;
- document key;
- document version;
- document SHA-256;
- presentation timestamp;
- reached-end timestamp after review.

Authenticated agreement presentation/review tokens additionally bind the authenticated user/session/organization context.

## Affirmative assent

No required checkbox is pre-selected.

Entry acknowledgments cover:

- agreement acceptance;
- confidentiality/restricted use;
- electronic clickwrap-signature intent;
- AI authority boundaries.

The entry agreement explicitly states that clicking `Agree & Enter Klinikos` is intended as electronic acceptance of the exact version presented.

The legacy authenticated ceremony may continue to use typed signature and role-aware professional/Grid acknowledgments where that document remains applicable.

## Acceptance evidence

The execution record uses the existing `access_gate_acceptances` evidence table and records, where appropriate:

- authenticated user and organization after binding;
- email after binding;
- agreement key/version/hash;
- exact document snapshot;
- presentation/reached-end/acknowledgment/signature timestamps;
- affirmative acknowledgment map;
- signature method;
- anonymous entry session and/or authenticated session evidence;
- idempotency key;
- IP/user-agent evidence where supplied by the trusted request boundary;
- source route/status;
- supersession evidence when a duplicate current acceptance already exists.

Executed agreement evidence is intentionally not cascade-deleted with an unrelated user or organization lifecycle event.

## Server authority

The browser never establishes `accepted=true` or entitlement.

For protected entry the server re-checks:

- current configured agreement;
- exact document hash/version/key;
- presented/reviewed token integrity and expiration;
- required acknowledgments;
- idempotency;
- persisted anonymous acceptance;
- accepted-entry cookie integrity;
- valid credential authentication before identity binding;
- exact active acceptance before protected-session authorization.

Only server-persisted evidence and governed session checks establish protected access.

## Idempotency and replay

The final entry acceptance carries a UUID idempotency key.

Repeated submission of the same execution attempt may return the already-bound evidence only when it matches the same anonymous entry session/document. Reusing the key for different legal evidence is rejected.

After authentication, a current acceptance already bound to the same user/organization/document may supersede the new anonymous duplicate rather than creating conflicting active evidence.

## Signed copies and Agreement Center

Authenticated typed-signature agreements retain the existing signed-PDF flow.

The universal entry clickwrap is not represented as a typed-signature certificate. A future authenticated agreement center may expose an appropriate reproducible clickwrap execution record once the presentation format and legal review are finalized.

`/legal/agreements` remains available through the authentication-only session so a signer can retrieve historical contract evidence even when a future agreement requires reacceptance.

The organization admin legal view remains tenant-scoped and intentionally omits unnecessary signature contents and exact signed document snapshots.

## Confidentiality boundary

Contractual confidentiality supplements technical secrecy; it does not replace it.

Klinikos must continue enforcing:

`BROWSER INTENT → AUTHENTICATED SERVER CAPABILITY → SERVER POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY DTO → BROWSER`

Hidden prompts, proprietary Grid algorithms, ranking weights, internal margin/fee logic, trust/anti-gaming logic, credentials, security heuristics, restricted infrastructure details, unnecessary PHI/PII, and other crown-jewel implementation details remain server-side.

## Migration strategy

`20260818182000_legal_access_foundation` already adds immutable agreement-version/event evidence and extends the existing access-gate evidence table with the columns required for anonymous entry and later identity binding.

The universal entry v1 therefore does **not** add another legal table or a competing schema migration.

The SQL-backed evidence structures should still be synchronized into the canonical Prisma data model before a future Prisma-generated migration is allowed to treat them as removable drift. Engineers must not generate a destructive migration that drops these legal evidence tables/columns.

## Production rollout — universal entry

Do not enable `KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED` merely because the branch exists.

Required rollout order:

1. merge a verified current branch;
2. confirm `20260818182000_legal_access_foundation` is deployed without destructive drift;
3. configure the factual contracting entity;
4. configure counsel-reviewed governing law/forum;
5. obtain targeted legal review of the `2026.08.23.1` clickwrap language and presentation;
6. prove public marketing/SEO remains reachable without acceptance;
7. prove direct professional/staff login redirects to `/access` when enforcement is enabled;
8. prove patient portal access remains on its separate governed path;
9. prove presented-token → reached-end → acknowledgment → anonymous acceptance evidence;
10. prove stale/mismatched/expired token rejection;
11. prove accepted cookie is HttpOnly/SameSite and cannot substitute for persisted evidence;
12. prove wrong credentials do not bind acceptance;
13. prove valid credentials atomically bind acceptance to the user/organization;
14. prove a binding failure revokes the newly created auth session;
15. prove protected pages/APIs reject an authenticated but unbound session;
16. prove existing users can re-enter and reauthenticate without a redirect loop;
17. verify mobile, keyboard, screen-reader, zoom, and reduced-motion behavior;
18. verify exact agreement version/hash evidence from database records;
19. only then enable `KLINIKOS_ENTRY_GATE_ENFORCEMENT_ENABLED=true` in production.

## Planned subsequent slices

- universal free person-level signup after the shared lifelong-identity foundation is reconciled;
- Zumi first-run `What brings you to Klinikos?` activation and progressive profile composition;
- Grid Participant Agreement;
- Professional Participation Addendum;
- Organization Addendum;
- seller/commerce agreement classes;
- Clinic MSA / Order / SOW stack;
- DPA;
- BAA;
- stronger e-sign / countersignature adapter where needed;
- regional addenda and international agreement applicability;
- structured reacceptance/material-change policy UI;
- legal evidence export/legal hold controls.

## Source standard

The legal drafting architecture must continue to be validated against authoritative sources. Current baseline research includes the U.S. E-SIGN Act, HHS business-associate contract requirements, EU eIDAS, and EU consumer unfair-terms requirements. Source research informs drafting but is not a substitute for fact- and jurisdiction-specific professional legal review.
