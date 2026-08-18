# Klinikos Legal Document Lifecycle

Status: internal architecture contract. This does not make any generated agreement attorney-approved.

## Objective

Turn the jurisdiction-aware generator into a reusable legal-document operating layer without confusing document preparation, legal approval, access authorization, or signature execution.

## Canonical lifecycle

`DRAFT -> NEEDS_REVIEW -> APPROVED_FOR_SIGNATURE -> SENT_FOR_SIGNATURE -> PARTIALLY_SIGNED -> EXECUTED`

Terminal/exception states: `SUPERSEDED`, `VOID`.

Every transition must produce an immutable evidence event. The UI must not silently jump directly from generated draft to executed agreement.

## PDF artifact contract

A final PDF is an artifact of a specific document version, not the source of truth for legal logic. Persist:

- document record ID and document key
- template / registry version
- structured generator input
- selected jurisdiction and relationship modules
- effective date
- signer packet
- rendered timestamp
- stable storage key
- SHA-256 digest of the exact rendered PDF
- supersession link when a later version replaces it

Do not embed PHI, production credentials, secrets, unrestricted source code, or patient databases in NDA artifacts.

## Signature contract

Signature integration must be provider-neutral. A future e-sign connector may send the frozen PDF, but Klinikos must preserve its own internal record of:

- provider envelope/request ID
- recipient identity and email used
- sent/viewed/signed/declined timestamps when supplied
- provider evidence/certificate reference
- hash of the signed artifact
- actor that initiated the request
- final execution state

A provider webhook must be verified before it changes execution state. Never accept an unsigned browser callback as proof of execution.

## Review gates

Before `APPROVED_FOR_SIGNATURE`:

1. legal names and entities complete
2. signer authority confirmed
3. permitted purpose specific
4. governing law and venue intentionally selected
5. jurisdiction-specific restrictive-covenant review complete when applicable
6. liquidated-damages language reviewed for the actual jurisdiction and transaction
7. disclosure level selected
8. required companion agreements identified
9. no NDA is being used as a substitute for a BAA, MSA, contractor/IP assignment, equity agreement, compensation agreement, vendor/security addendum, or production-access approval

## Universal / multi-state design

Keep the core NDA separate from jurisdiction and relationship schedules. Use mandatory-law savings language. Do not default to a non-compete. Restrictive covenants, non-circumvention, liquidated damages, venue, privacy, and data terms remain jurisdiction-sensitive modules.

## Access-control rule

Signing an NDA changes legal-document state. It does not automatically grant Level 2/3 product access, PHI access, source-code access, credentials, secrets, admin access, database access, or production-data access. Those require separate authorization and technical controls.

## Evidence and retention

Preserve creation, revision, review, approval, PDF render, signature request, view, signature, execution, supersession, and void events. Signed artifacts should be immutable and version-addressed. Retention/deletion policy must follow the final corporate/legal policy and applicable law rather than an arbitrary hard-coded period.

## Next implementation slice

1. persist `LegalDocumentRecord` and event rows in the database after schema/migration review
2. implement server-only PDF rendering from a frozen versioned agreement model
3. implement artifact hashing/storage abstraction
4. implement provider-neutral e-sign adapter and verified webhook boundary
5. add admin document vault, revision comparison, resend/void/supersede controls
6. add automated tests proving illegal state transitions and unsigned callbacks cannot create `EXECUTED`
7. add additional document families through the same engine: strategic/referral, contractor + IP assignment, clinic MSA/BAA/SOW, vendor/security, education/institution, Grid provider/location
