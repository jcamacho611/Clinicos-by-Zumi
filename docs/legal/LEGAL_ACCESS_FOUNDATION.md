# Klinikos Legal Access Foundation

Status: `ENGINEERING FOUNDATION / LEGAL LANGUAGE PENDING TARGETED REVIEW`

This document describes the first shippable legal-access foundation. It is implementation truth, not a claim that the drafted agreement is attorney-approved or enforceable in every jurisdiction.

## Objective

Protected Klinikos access can be conditioned on affirmative execution of the exact applicable agreement version.

Canonical flow:

`AUTHENTICATION → APPLICABLE AGREEMENT → PRESENTATION → REACH END → ACKNOWLEDGMENTS → ELECTRONIC SIGNATURE → SERVER VERIFICATION → EVIDENCE → PROTECTED ACCESS`

Public marketing pages remain outside the hard gate unless a future private-access mode deliberately changes that policy.

## Current first-slice contract

The first implemented document is:

- key: `klinikos-global-terms-confidentiality-esign`
- version: `2026.08.18.1`
- scope: baseline protected-product terms + confidentiality covenant + electronic-signature intent
- role-aware additional acknowledgments for professional/contractor roles

This baseline document is not a substitute for a BAA, DPA, negotiated MSA, Grid Participant Agreement, professional addendum, organization addendum, medical/treatment consent, HIPAA authorization, or other relationship-specific document.

## Runtime configuration

The legal gate is intentionally OFF unless explicitly enabled.

Required factual configuration before execution:

- `KLINIKOS_LEGAL_ENTITY_NAME`
- `KLINIKOS_GOVERNING_LAW`
- `KLINIKOS_LEGAL_FORUM`
- `KLINIKOS_LEGAL_CONTACT_EMAIL`
- `LEGAL_GATE_ENFORCEMENT_ENABLED=true` only after controlled production proof

The product fails closed instead of inventing a contracting entity, governing law, forum, or persistent acceptance record.

## Authentication versus entitlement

`getAuthenticationSession()` answers only whether the user currently has a valid authenticated Klinikos session.

`getClinicSession()` and `requireClinicSession()` additionally enforce the current protected-product agreement when the gate is enabled.

This separation matters because a user whose agreement is pending still needs to be able to:

- view/sign the agreement;
- download historical signed copies;
- sign out;
- use legitimate recovery or support paths.

Protected product pages and APIs continue to rely on the governed clinic session and therefore fail closed when the current required agreement is missing.

## Agreement integrity

Published agreement versions are frozen by:

- document key;
- semantic/date version;
- exact canonical text snapshot;
- SHA-256 content hash.

If source text changes without a new version, the agreement registry refuses to silently replace the published version.

Historical acceptance stores the exact snapshot and hash executed by the signer. A later Terms update does not rewrite earlier evidence.

## Review interaction

The browser must reach the end of the actual agreement scroll container before asking the server to issue a reviewed token.

Server-signed presentation/review tokens bind:

- session ID;
- user ID;
- organization ID;
- document key;
- document version;
- document SHA-256;
- presentation timestamp;
- reached-end timestamp.

The system deliberately does **not** claim that scrolling proves a human read or understood every word. It proves a documented presentation/review interaction before the signature controls unlocked.

## Affirmative assent

No required checkbox is pre-selected.

Base acknowledgments cover:

- agreement acceptance;
- confidentiality/restricted use;
- electronic-signature intent;
- AI authority boundaries.

Professional roles add a professional-truth acknowledgment. Contractors add Grid transaction-truth acknowledgment.

The final typed signature must normalize to the legal name entered by the signer. An organization representative must also provide a title and affirm authority to bind the organization.

The native typed signature is not represented as notarization, advanced identity proofing, or a qualified electronic signature.

## Acceptance evidence

The execution record extends the pre-existing `access_gate_acceptances` evidence table and records, where appropriate:

- authenticated user and organization;
- email;
- legal name;
- signing capacity/title;
- country/region;
- agreement key/version/hash;
- exact document snapshot;
- presentation/reached-end/acknowledgment/signature timestamps;
- affirmative acknowledgment map;
- signature method;
- session identifier;
- idempotency key;
- IP/user-agent evidence where supplied by the trusted request boundary;
- source route/status.

Executed agreement evidence is intentionally not cascade-deleted with an unrelated user or organization lifecycle event.

## Server authority

The browser never establishes `accepted=true`.

The server re-checks:

- authenticated session;
- current configured agreement;
- exact document hash;
- reviewed-token session binding;
- required acknowledgments;
- signature/legal-name match;
- organization-authority requirements;
- idempotency.

Only then is acceptance persisted.

## Idempotency and replay

The final signing request carries a UUID idempotency key.

Repeated submission of the same execution attempt returns the already-bound evidence when it matches the same signer/document. Reusing the key for different legal evidence is rejected.

A separately indexed current user/document/version record prevents duplicate active executions of the same exact agreement.

## Signed copy

An authenticated signer can retrieve only their own executed agreement through the signed-PDF route.

The generated PDF contains:

- the exact stored agreement snapshot;
- agreement/version/hash;
- signer identity and capacity;
- execution timestamp;
- acceptance identifier;
- signature method;
- affirmative acknowledgments;
- execution certificate language.

The PDF does not claim notarization, qualified-signature status, professional verification, payment evidence, or healthcare authorization.

## Agreement Center

`/legal/agreements` remains available through the authentication-only session so an existing signer can retrieve historical contract evidence even when a future agreement requires reacceptance.

The organization admin legal view is tenant-scoped and intentionally omits signature contents and exact signed document snapshots.

## Confidentiality boundary

Contractual confidentiality supplements technical secrecy; it does not replace it.

Klinikos must continue enforcing:

`BROWSER INTENT → AUTHENTICATED SERVER CAPABILITY → SERVER POLICY / PROPRIETARY ENGINE → MINIMUM-NECESSARY DTO → BROWSER`

Hidden prompts, proprietary Grid algorithms, internal margin logic, credentials, security heuristics, restricted infrastructure details, and other crown-jewel implementation details remain server-side.

## Migration strategy

`20260818182000_legal_access_foundation` adds immutable agreement-version/event evidence and extends the existing access-gate evidence table using forward-only SQL.

The current implementation intentionally avoids importing the stale schema from the older NDA-generator branch. That older branch diverged materially from current `main` and must not be merged as a schema replacement.

The new SQL-backed evidence structures should be synchronized into the canonical Prisma data model before a future Prisma-generated migration is allowed to treat them as removable drift. Until that sync is completed, engineers must not generate a destructive migration that drops the legal evidence tables/columns.

## Production rollout

Do not enable the enforcement flag merely because the code exists.

Required rollout order:

1. merge a verified current branch;
2. deploy the legal migration;
3. configure the factual contracting entity;
4. configure counsel-reviewed governing law/forum;
5. run controlled persistent test accounts;
6. prove unsigned protected-page denial;
7. prove unsigned protected-API denial;
8. prove full scroll/acknowledgment/signature ceremony;
9. prove access after valid execution;
10. download the exact signed PDF and verify its hash/version;
11. prove old agreement history survives a test reacceptance;
12. verify login/logout behavior for an unsigned authenticated user;
13. verify mobile, keyboard, screen-reader, and zoom behavior;
14. only then set `LEGAL_GATE_ENFORCEMENT_ENABLED=true` in production.

## Planned subsequent slices

- enhanced Private Access NDA gate;
- Grid Participant Agreement;
- Professional Participation Addendum;
- Organization Addendum;
- Clinic MSA / Order / SOW stack;
- DPA;
- BAA;
- stronger e-sign / countersignature adapter;
- regional addenda and international agreement applicability;
- draw-signature option if retained after legal/privacy review;
- structured reacceptance/material-change policy UI;
- legal evidence export/legal hold controls.

## Source standard

The legal drafting architecture must continue to be validated against authoritative sources. Current baseline research includes the U.S. E-SIGN Act, HHS business-associate contract requirements, EU eIDAS, and EU consumer unfair-terms requirements. Source research informs drafting but is not a substitute for fact- and jurisdiction-specific professional legal review.
