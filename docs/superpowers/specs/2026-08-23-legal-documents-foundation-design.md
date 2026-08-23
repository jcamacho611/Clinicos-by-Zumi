# Klinikos Legal Documents Foundation — Design

## Purpose

Add a current-main foundation for generated business/legal documents, beginning with NDA preparation, without replacing or weakening the existing static legal-document registry, protected-access gate, tenant-scoped legal acceptance evidence, or current `/admin/legal` execution-evidence view.

This is document-preparation software. It must never represent a generated document as attorney-approved, enforceable, production-approved, or executed merely because the product generated it or a user clicked a button.

## Why stale PR #173 is not replayed

PR #173 is materially behind current main and its admin page would overwrite newer execution-evidence authority. Its lifecycle also contains a dead-end truth bug: a generic state-review warning always blocks `signatureReadiness()`, while the transition graph still permits `NEEDS_REVIEW -> APPROVED_FOR_SIGNATURE`.

The useful concepts are re-designed on current main instead of copied wholesale.

## Existing authorities preserved

- `src/lib/legal/document-registry.ts` remains the registry for versioned static product/legal documents and required audiences.
- `src/lib/legal/legal-access.ts` remains the authority for tenant-scoped acceptance/execution evidence used by the current protected-access gate.
- `/admin/legal` remains the current tenant-scoped acceptance-evidence surface and is not replaced.
- Generated business documents do not grant PHI access, production access, source-code access, credentials, partnership status, equity, payment authority, or clinical authority.

## Scope of this foundation

Build pure, testable domain contracts only. No Prisma migration, e-sign integration, object-storage write, email/send action, or production legal-document execution route is introduced in this tranche.

Initial generated document class: `master_nda`.

### Components

1. **NDA drafting package**
   - Normalizes recipient/jurisdiction input.
   - Produces modules, disclosure-level controls, companion-agreement prompts, drafting targets, and explicit review items.
   - Does not choose final governing law/venue or claim enforceability.
   - Liquidated-damages figures, if present, are labeled drafting targets requiring explicit legal review.
   - PHI, source code, credentials, signing/encryption keys, private databases, and unrestricted production/admin access remain excluded unless a separate lawful authority explicitly exists.

2. **Review-resolution model**
   - Every required review item has a stable key, category, severity, rationale, and `resolved` evidence state.
   - Required categories include at minimum governing law/venue, restrictive-covenant applicability when relevant, liquidated-damages review when present, signer authority, disclosure scope, and companion-agreement dependencies.
   - A document cannot become approved for signature while a required review item is unresolved.
   - Merely generating a warning never equals resolution.

3. **Tenant-scoped lifecycle**
   - Every generated record contains `organizationId`.
   - Statuses: `DRAFT`, `NEEDS_REVIEW`, `APPROVED_FOR_SIGNATURE`, `FROZEN`, `SENT_FOR_SIGNATURE`, `PARTIALLY_SIGNED`, `EXECUTED`, `SUPERSEDED`, `VOID`.
   - Illegal transitions throw.
   - Approval transition checks review resolution and signer authority.
   - Freeze requires a byte-exact artifact hash.
   - Send requires a frozen artifact.
   - Execution requires verified execution evidence tied to the exact current frozen artifact hash.
   - Executed records may only become superseded, not silently edited or voided.

4. **Frozen artifact contract**
   - Server-only SHA-256 hashing of non-empty PDF bytes.
   - Stable storage-key/file-name construction.
   - Artifact includes document id, organization id, version, byte length, SHA-256, and render timestamp.
   - Artifact version/hash is immutable in the domain contract.

5. **Tenant-scoped Legal Vault interface**
   - Persistence-neutral interface only in this tranche.
   - Every read/write operation requires `organizationId` plus document id where applicable.
   - Events and execution evidence are append-only.
   - Status changes use compare-and-set semantics.
   - Destructive delete is absent; use `VOID`/`SUPERSEDED` lifecycle states.
   - Implementations must reject cross-tenant identifiers rather than relying on a caller-supplied document id alone.

## NDA drafting semantics

### Relationship types

`strategic_partner`, `advisor`, `consultant`, `contractor`, `developer`, `clinic`, `clinic_network`, `investor`, `vendor`, `education`, `referral`, `other`.

### Disclosure levels

- **Level 1:** public/high-level material only.
- **Level 2:** selected private commercial/roadmap/architecture information, still excluding crown-jewel access.
- **Level 3:** specifically authorized restricted information only. Level 3 does not itself authorize PHI, secrets, production credentials, unrestricted source code, keys, or database/admin access.

### State/jurisdiction handling

The engine may identify that a recipient jurisdiction makes a clause class require review. It must not claim that a restrictive covenant is enforceable or unenforceable as a final legal conclusion. California/Florida and other state modules are review prompts, not automated legal opinions.

### Drafting targets

Default business drafting targets may include:
- confidentiality: 5 years, with trade-secret survival handled separately by counsel/template terms;
- limited introduced-opportunity non-circumvention: 18 months when the relationship warrants it;
- liquidated-damages target bands: $25,000 / $50,000 / $75,000 only as review-required drafting inputs, never guaranteed penalties or recoveries.

These values are policy defaults for document preparation, not legal conclusions.

## Review items

Each item:

```ts
{
  key: string;
  category: "governing_law_venue" | "restrictive_covenant" | "liquidated_damages" | "signer_authority" | "disclosure_scope" | "companion_agreement" | "privacy_data";
  required: boolean;
  severity: "blocking" | "advisory";
  rationale: string;
  resolution?: {
    outcome: "approved" | "removed" | "revised" | "not_applicable";
    resolvedAt: string;
    resolvedBy: string;
    note?: string;
  };
}
```

A blocking required item is resolved only when a resolution object exists. Status text or warnings do not implicitly resolve it.

## Signer model

A signer packet records role, name, optional title/entity/email, and explicit `authorityConfirmed`.

Approval for signature requires:
- required recipient/purpose/jurisdiction fields;
- every blocking review item resolved;
- at least one Klinikos-side signer and one recipient-side signer unless the document type later defines another required signer matrix;
- authority confirmed for every required signer.

## Artifact and execution evidence

A frozen artifact has a 64-character lowercase SHA-256 digest of exact bytes.

Verified execution evidence includes:
- `kind`: e-sign provider or operator-verified signed artifact;
- `verifiedAt` / `verifiedBy`;
- optional provider event id;
- `signedArtifactSha256`.

`EXECUTED` is allowed only when:
- status is `SENT_FOR_SIGNATURE` or `PARTIALLY_SIGNED`;
- a frozen artifact exists;
- at least one verified execution evidence record has `signedArtifactSha256 === artifact.sha256`.

Any evidence for another version/hash is insufficient.

## Error handling

Fail closed for:
- missing recipient/purpose/jurisdiction;
- unresolved blocking review items;
- unconfirmed signer authority;
- illegal lifecycle transition;
- empty PDF bytes;
- malformed SHA-256;
- execution evidence that does not match the frozen artifact;
- cross-tenant vault operations;
- attempts to mark generated output as production-approved automatically.

## Testing

Test-first contracts cover:
- jurisdiction/disclosure module selection without automated enforceability claims;
- required review-item generation;
- no approval while blockers remain;
- approval after explicit resolutions and signer authority;
- illegal transition rejection;
- immutable artifact hashing and deterministic storage key;
- execution requires exact artifact-hash match;
- generated records always carry organization scope;
- Legal Vault interface requires organization scope on every operation;
- static legal registry/current `/admin/legal` authority is untouched.

## Deferred follow-on

After exact-head release capacity is restored and this pure foundation is reviewed:

1. additive Prisma multi-file schema/migration for generated legal documents/events/artifacts/evidence;
2. organization-scoped repository implementation;
3. server-side PDF rendering using approved templates;
4. approved private object storage with versioned immutable artifacts;
5. e-sign adapter with signed webhook, replay/idempotency, and evidence reconciliation;
6. `/admin/legal/documents` UI composed beside—not replacing—current acceptance evidence;
7. companion agreement generators;
8. counsel-approved template/version governance.

## Non-goals

- No automated legal representation.
- No assertion that an NDA is enforceable.
- No automatic waiver of state-law restrictions.
- No automatic PHI/production/source-code/credential access.
- No destructive replacement of current legal acceptance evidence.
- No database schema changes in this tranche.
