# Klinikos route registry

Status: `IMPLEMENTATION TRUTH INDEX`

A **route** is a product journey that crosses Klinikos engines. A **page** is a surface a route step lands on. Pages are implementation detail; routes are the product.

This document describes the registry that exists in the repository today. It is not a roadmap.

## Machine authority

The authoritative route catalog is:

`src/lib/paths/catalog.ts`

The authoritative deterministic phrase-to-route resolver is:

`src/lib/orchestration/intent-engine.ts`

The human-readable route list in this document is intentionally **not** duplicated as a hard-coded snapshot anymore. The catalog expanded beyond the original four routes while this prose remained stale. Future agents must derive route count, ids, audiences, engines, steps, intent examples, and openable destinations from the code and its tests rather than treating an old Markdown table as implementation truth.

A journey that is not in `src/lib/paths/catalog.ts` is not a persisted Klinikos Path, however desirable it may be. A deterministic intent rule that is not represented by the Path catalog must be treated as a drift defect rather than silently becoming a second routing authority.

## Where the route system lives

| Concern | Module |
| --- | --- |
| Route definitions and their steps | `src/lib/paths/catalog.ts` |
| Phrase → route resolution, deterministic | `src/lib/orchestration/intent-engine.ts` |
| Public high-level Path → destination projection | `src/lib/orchestration/public-living-intent.ts` |
| Safe public → authenticated continuation metadata | `src/lib/distribution/public-continuation.ts` |
| Step state for a started route | `src/lib/orchestration/path-engine.ts` |
| Next governed step, blockers, and owner | `src/lib/orchestration/path-guidance-engine.ts` |
| Persistence of a started route | `src/lib/orchestration/path-persistence-repository.ts` |
| Authenticated Path API | `src/app/api/paths/route.ts` |
| Public entry surface | `src/components/marketing/public-living-gateway.tsx` |
| Authenticated operating front door | `src/components/clinic/living-home.tsx` |

`POST /api/paths` starts a governed authenticated Path. Public Living Home can understand intent and provide value before unnecessary registration, but public conversation does not silently create a privileged Path, role, organization relationship, credential, payment, or clinical authority.

## Canonical journey law

The operating-network parent architecture defines the value-first order:

`DISCOVER → RECEIVE VALUE → EXPRESS INTENT → CREATE IDENTITY WHEN PERSISTENCE MATTERS → BUILD CLAIMS → VERIFY ONLY WHAT THE NEXT ACTION REQUIRES → ENTER GRID / RELEVANT NETWORK EXPERIENCE → WORK / LEARNING / CONNECTION VALUE → EVIDENCE → RETURN → ORGANIZATION VALUE → PAID OPERATIONS → EXPANSION`

A Path is one governed implementation mechanism inside that lifecycle. The lifecycle is not a requirement for a user to click through a twenty-screen wizard.

## Public-to-authenticated continuation

Public Zumi may project a resolved Path into a high-level public destination such as Grid, EDU, clinic operations, referral follow-up, revenue, or patient access.

When a destination requires staff authentication:

- the browser carries only a bounded destination key and `from=public-zumi` marker;
- raw user-entered healthcare/business/free text is not serialized into the return URL;
- the destination remains same-origin;
- login revalidates the return path;
- reaching the destination still passes normal authentication, RBAC, tenant, purpose, consent, and domain authorization;
- structured continuation metadata never creates role, organization ownership, clinical authority, Grid eligibility, or entitlement.

Patient access remains on the separately governed patient-auth path. Public-safe Grid, EDU, pricing, trust, and other approved surfaces remain low-friction rather than being forced through clinic-staff authentication.

## What the registry is checked against

`tests/route-registry.test.ts` enforces the properties that make a route trustworthy:

1. **Every step lands on a surface that exists.** A route is not complete when its next page 404s or crashes.
2. **Every route's own stated intent examples resolve back to it.** Product copy and deterministic routing may not drift apart.
3. **No signed-in route step sends a person back to a public marketplace entry when an authenticated workspace exists.**
4. **Route ids and step ids are unique**, and every route has at least one step a person can open.
5. **Cross-engine expectations stay explicit** rather than being inferred from page names.

`tests/public-intent-path-coverage.test.ts` additionally guards the public distribution boundary. Every deterministic Path currently recognized by the intent engine must map intentionally to an existing Public Zumi destination class rather than depending on accidental regex fallback.

`tests/raw-sql-table-names.test.ts` guards the raw-SQL naming defect class: Prisma models are mapped to snake_case tables, so model names in raw SQL can compile and then fail at runtime.

## Cross-engine bridges

A route is one way engines connect: a person starts it. A **bridge** is the other: one engine detects something another engine could act on without asking a person to re-type authoritative state.

### Clinic OS → Grid

`src/lib/ecosystem/clinic-grid-bridge.ts` reads governed Clinic OS records and can prepare truthful Grid drafts for real gaps or capacity.

Representative signals include:

- `coverage_gap` → demand;
- `referral_leak` → demand;
- `unused_capacity` → supply.

Bridge laws:

1. **Detection is not publication.** A detected gap remains a draft until an authorized person or approved delegated workflow creates the governed Grid object.
2. **No unnecessary PHI crosses.** A staffing/capacity need describes the resource requirement, not the patient whose workflow exposed it.
3. **Nothing is invented.** Only observed records produce signals; estimated revenue or fill outcomes do not become facts.
4. **Authority is preserved.** Seeing a clinic gap does not automatically grant Grid publication rights.
5. **Links carry identifiers, not authoritative demand truth.** The destination re-derives current state so stale/forged URLs cannot manufacture a need.

### EDU → Grid

`src/lib/ecosystem/edu-grid-bridge.ts` can translate learner evidence into opportunity context without manufacturing professional authority.

Dominant law:

> **Educational competency is not licensure, credentialing, clinical privilege, employment eligibility, or Grid eligibility.**

EDU can contribute evidence. Grid and professional/organization authority systems still determine eligibility for regulated work.

## Adding or changing a route

A route may be added or changed only when the applicable conditions are true:

- every step `href` resolves to a real surface;
- the intended role can reach that surface under existing access policy;
- at least one declared intent example resolves deterministically to the route;
- authenticated steps do not accidentally land on public-only entry surfaces;
- the guidance engine can state the next step and owner of blockers;
- public projection is added when the route should be discoverable from Public Zumi;
- public continuation carries only bounded low-sensitivity metadata;
- external dependency state remains explicit;
- relevant tests are extended.

Adding phrases alone does not create a complete Path. Adding a Path whose steps do not exist creates a broken journey. Adding a public marketing route does not create authorization.

## Deliberate limits

- **Intent resolution is deterministic for route selection.** Zumi may understand, research, draft, or explain; deterministic systems own route selection, eligibility, authorization, and consequential execution.
- **A route does not widen authority.** Reaching a step still passes route guards, RBAC, tenant scoping, eligibility, purpose, consent, and domain policy.
- **Steps are not claims about the outside world.** A step landing on Grid, billing, labs, imaging, payments, or another integration surface does not prove the relevant external rail is live.
- **Public intent is not privileged state.** A public user saying “I am a doctor” or “I own this clinic” is a claim, not verification or authority.
- **Route count comes from code.** Do not copy a count into governance prose unless it is generated and mechanically checked.

See `docs/EXTERNAL_DEPENDENCY_MATRIX.md` for external rail truth and `governance/product-truth-registry.json` for machine-readable capability claim state introduced by the operating-network convergence work.
