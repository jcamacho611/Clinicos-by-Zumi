# 10 — THE CONNECTION PROMPT
## How everything connects. Paste this when the task is wiring, not building.


**Status:** SUBORDINATE BUILD DOCUMENT — NOT A CANON. Subordinate to `docs/KLINIKOS_MASTER_CANON.md` and to current code/runtime evidence.  
**Scope:** ecosystem graph and connection runbook.  
**Precedence:** `01.5_RECONCILIATION_OVERRIDE.md` wins on every point it addresses.

```
DOCUMENT_VERSION: 2026-09-05.1
STATUS:           ACTIVE
READ ORDER:       01 → 01.5 → 10 → the task
PURPOSE:          Two kinds of connection. Part A connects the PRODUCT to itself
                  (the canonical ecosystem graph). Part B connects the SYSTEM to
                  the world (domain, hosting, database, payments, edge, repo).
```

**The law that governs this whole document.** The canonical ecosystem graph
connects the five planes. **It is not a sixth plane and it is not another source
of truth.** It is the edge set. If you find yourself giving the graph its own
authority, its own store, or its own version of a Person, stop — you are building
the thing this document exists to prevent.

---

# PART A — THE CANONICAL ECOSYSTEM GRAPH

## A0 · WHAT THE GRAPH IS

```
NODES  = objects that already exist in the five planes
EDGES  = governed, typed, directional relationships between them
GRAPH  = the projection surface that lets one question cross planes
```

The graph never stores a fact that a plane already owns. It stores **that a
relationship exists, of what type, under whose authority, with what evidence, and
until when.** Ask the plane for the fact. Ask the graph for the connection.

## A1 · THE UNIVERSAL PATTERN — every edge in the system is an instance of this

```
IDENTITY → RELATIONSHIP → AUTHORITY → NEED/RESOURCE → ELIGIBILITY → MATCH
→ ACTION → EVIDENCE → OBLIGATION → MONEY → OUTCOME → REPUTATION → MEMORY
→ NEXT ACTION
```

Before adding any new connection, locate it on this chain. If it does not sit on
the chain, you are probably adding a shortcut that skips an authority check —
which is exactly how `MATCH` silently becomes `ELIGIBILITY`.

## A2 · THE SPINE — the dependency chain, in build order

```
Canonical five-plane graph
  → Person / Membership / Relationship substrate
    → Resume / CareerArtifact
      → EDU Placement
        → Preceptor / Site / School approval
          → auditable placement hours + evidence
            → external professional requirements
              → verified professional projection
                → Grid work opportunity
                  → financial / clinic / network compounding
```

**Do not rebuild completed foundations.** Verify each link against the repo before
assuming it is missing. The most common failure in this program is an agent
rebuilding `Person` because it could not find it in ninety seconds.

## A3 · THE CONNECTION TABLE — what connects to what, and through which law

| From | To | Edge type | The law on that edge |
|---|---|---|---|
| Person | Organization | `OrganizationMembership` | membership ≠ authority; role carries the authority |
| Person | Person | `PersonRelationship` | cross-org relationships need both orgs' boundaries respected |
| Person | Location | `LocationAssignment` | assignment ≠ privilege at that location |
| Person | Credential | claim → evidence → verification | **CLAIM ≠ VERIFICATION**, three distinct states, never collapsed |
| Person | CareerArtifact | self-authored | **RESUME ≠ VERIFIED CREDENTIAL** |
| CareerArtifact | EDU evidence | attestation + review | **EDU COMPLETION ≠ LICENSE** |
| EDU evidence | Placement | requirement satisfaction | **MATCH ≠ APPROVAL** — four parties must approve |
| Placement | Hours/Evidence | auditable, versioned | **COMPLETION ≠ LICENSE** |
| Hours | External requirement | mapping, never assertion | Klinikos never verifies a license itself |
| Verified professional | Grid eligibility | hard gate | **ELIGIBILITY PRECEDES RANKING**, always |
| Grid eligibility | Grid offer | composition engine | multi-party requirements resolved together |
| Grid offer | Agreement → Booking | consent + authority | **PAYMENT ≠ AUTHORITY** |
| Booking | Fulfillment → Evidence | outcome escrow | connected ≠ fulfilled |
| Evidence | Obligation → Payout | reconciliation | settlement is its own state, gated separately |
| Any action | Audit | append-only | audit is not optional and not sampled |
| Any object | Zumi context | retrieval, minimized, redacted | **AI ≠ AUTHORITY** |
| Any object | RealityProjection | server-composed | **NO PHI in the spatial projection, any route** |

## A4 · THE EDGE CONTRACT — what every edge must carry

```
edgeId
fromRef            plane + type + id
toRef              plane + type + id
edgeType           from the enumerated set — never a free string
authoritySource    who established this: system · organization · person · verification body
evidenceRef        what proves it, or explicitly NONE
establishedAt
validUntil         or null with a documented reason
tenantScope        which organization(s) may traverse this edge
disclosureClass    public · member · organization · clinical · restricted
supersededBy       nullable
auditRef
```

**An edge with `evidenceRef: NONE` may never satisfy an eligibility check.** It
may inform, suggest, or display. It may not authorize. This single rule prevents
most of the ways this architecture could hurt someone.

## A5 · TRAVERSAL LAW

1. **Traversal is authorized per hop, not per query.** A user authorized to see
   node A does not thereby see everything one edge away from A.
2. **Cross-tenant traversal is denied by default** and must be explicitly granted
   by a relationship both tenants can see.
3. **Disclosure narrows monotonically.** A traversal may never return a node at a
   broader disclosure class than the narrowest hop it passed through.
4. **Depth is bounded.** Unbounded graph walks are a denial-of-service and a
   privacy leak wearing the same shirt.
5. **Failed authorization is silent about existence.** "You cannot see this" and
   "this does not exist" must be indistinguishable to the caller.

## A6 · HOW THE GRAPH REACHES THE SCREEN

```
REQUEST + ACTOR CONTEXT
  → authorization
    → bounded traversal
      → minimization (drop everything the screen does not need)
        → redaction (PHI never enters the spatial payload)
          → deterministic composer
            → RealityProjection
              → LivingRealityLayer (3D)  +  semantic DOM twin (authority)
```

Zumi may propose a `ZumiPresentationProposal` — a line, a requested Reality,
requested focus ids, a lens, suggested queries, draft actions. **It may never
return a projection.** The server validates the proposal, performs its own
retrieval under its own authorization, and the deterministic composer builds the
projection. Stripping fields from a model-authored projection does not stop a
model from hallucinating a well-typed node.

## A7 · THE FORBIDDEN CONNECTIONS

Never connect:

- resume → verified credential (any automatic path)
- payment → any authority, eligibility, approval or PHI access
- AI output → any final clinical, legal, financial or credentialing decision
- one canvas → two disclosure contexts without a full clearing between them
- a patient → any public projection
- ranking weights, attention scores, anti-gaming logic or risk heuristics → the browser
- an organization → another organization's data without a mutually visible relationship
- a Grid match → an eligibility conclusion
- a school approval → a site approval (four parties, four separate approvals)

## A8 · DISCLOSURE-ENVELOPE CLEARING — the connection that must be *broken*

Clear projection state, renderer state, focus, labels and buffers on **every one**
of these: logout · login · Person switch · organization switch · role-context
switch · crossing between public and authenticated · any privilege change.

**Security beats continuity.** A visually seamless transition that carries the
previous authority's state forward is a breach with good easing.

---

# PART B — THE INFRASTRUCTURE CONNECTION RUNBOOK

**Scope discipline.** These are separate tranches. Do not combine them into one
PR. A DNS change and a Stripe change failing together is an afternoon of
guessing which one broke.

## B1 · DOMAIN → HOSTING

Canonical public domain: **`https://klinikos.io`**
Deployment target and fallback: **`https://zumi.onrender.com`**

```
1. In the hosting provider, add both custom domains:
      klinikos.io
      www.klinikos.io
2. In DNS, create exactly what the provider issues — do not guess an IP:
      A     @      <provider-issued apex address>
      CNAME www    zumi.onrender.com
3. Set the environment variable:
      NEXT_PUBLIC_APP_URL = https://klinikos.io
4. Update, in place and by SHA, never by force-create:
      README.md · .env.example · payment return URLs · docs
```

**Verify, and record what you measured:**
```bash
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://klinikos.io
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://www.klinikos.io
curl -s -o /dev/null -w "%{http_code} %{time_total}s\n" https://klinikos.io/api/health
```
Cold TTFB must be **under 2 seconds**. If it is not, the paid instance tier is not
live and nothing else on this page matters yet — see `06_WAVE_0_TRUTH.md`.

**A redirect is not a connection.** If the apex only redirects to `www`, say so
plainly rather than reporting the apex as live.

## B2 · REPOSITORY → CI → DEPLOY

```
GITHUB → CI → BUILD → MIGRATIONS → RUNTIME → /api/health → klinikos.io → LOGIN → LIVING HOME
```

Find the **first** failing link and fix that one. Do not fix links downstream of a
break; they are not broken, they are unreachable.

Required on `main` before any of this is trustworthy: PR-only changes · required
CI · required security gates · required review · no force push · recorded deploy
SHA. All four are currently absent — that is a Wave 0 item, not a nice-to-have.

## B3 · DATABASE

```bash
npm run db:validate      # schema is coherent
npm run db:generate      # client matches schema
npm run db:migrate:deploy
```

Laws on every database connection tranche: **additive migrations preferred** · no
destructive rewrite without separate approval · follow the production migration
manifest/hash policy · preserve audit and history · **fail closed on ambiguity** ·
preserve tenant isolation. A migration that cannot roll forward cleanly on a
fresh database is not done.

## B4 · PAYMENTS

The connection direction is fixed and it is the opposite of the intuitive one:

```
KLINIKOS COMMERCIAL TRUTH
  → approved offer
    → approved payable line items
      → payment provider
        → processor event
          → VERIFIED webhook
            → PaymentEvidence
              → reconciliation
                → Klinikos entitlement decision
                  → audit
```

**The provider is a rail, never an authority.** It does not define price, product,
entitlement, organization authority or clinical authority.

Before any commercial statement: **query live Stripe.** Never infer revenue from a
Price object, a Product object, a test-mode object, a checkout URL, or a
PaymentIntent that did not settle. **A redirect is not a payment.**

Webhook handling is idempotent, signature-verified, and replay-safe — a duplicate
delivery must produce exactly one entitlement. Test that explicitly; it is the
single most common production defect in this category.

`PRICE ≠ QUOTE ≠ CONTRACT ≠ INVOICE ≠ PAYMENT ≠ ENTITLEMENT ≠ PAYOUT ≠
SETTLEMENT ≠ RECONCILIATION.` Nine states. Collapsing any two is a bug that
becomes a legal problem.

**No PHI to any payment provider. Ever.** Not in metadata, not in a description,
not in a line item, not in a customer name field.

## B5 · EDGE / CDN / WAF

Connect for TLS, caching, and DDoS protection. Before enabling anything:

- confirm it does not cache an authenticated response — verify with a real
  authenticated request, not by reading the config;
- confirm it does not strip the headers auth depends on;
- confirm the health endpoint stays reachable and uncached;
- confirm a WAF rule is not the thing producing an intermittent 503 before
  blaming the application.

## B6 · EXTERNAL HEALTHCARE RAILS

For labs, imaging, payer, eligibility, eRx, credentialing, identity and
communications:

```
PARTNER API → ALTERNATE APPROVED PARTNER → STANDARD INTERFACE → MANUAL-BUT-TRUTHFUL WORKFLOW
```

Every connector tracks: tenant ownership · connection status · credential storage ·
health check · sandbox vs live mode · cost · **BAA requirement** · PHI permission ·
audit trail · retry behavior · graceful fallback.

**Never fabricate an integration because the preferred one is unavailable.**
`CONNECTED ≠ PRODUCTION VERIFIED`, and a manual workflow that says it is manual is
worth more than an automated one that lies.

## B7 · AI PROVIDERS

Provider-neutral by architecture. `TASK CLASSIFICATION → APPROVED FALLBACK MODEL →
EXPLICIT CAPABILITY DEGRADATION → TRUTHFUL RESULT`. **No provider outage may
silently widen authority** — when the model is unavailable, the deterministic
server rules still decide, and the UI says the assistant is degraded rather than
quietly doing less.

---

# PART C — THE CONNECTION CHECKLIST

Report every line with its measured result, not its expected one:

- [ ] `origin/main` SHA recorded, and it is the SHA you built
- [ ] apex and `www` both resolve; **times recorded**
- [ ] cold TTFB under 2s, measured
- [ ] `/api/health` green from the public domain
- [ ] `NEXT_PUBLIC_APP_URL` set and reflected in a rendered page
- [ ] README, `.env.example` and docs updated **in place by SHA**
- [ ] `main` protected; CI required; deploy SHA recorded
- [ ] migrations apply cleanly to a **fresh** database
- [ ] webhook signature verified; duplicate delivery produces one entitlement
- [ ] no PHI in any payment payload — verified by inspecting a real payload
- [ ] edge layer does not cache authenticated responses — verified by request
- [ ] every external connector labeled `SANDBOX` or `LIVE`, honestly
- [ ] disclosure envelope clears on all seven authority-change events
- [ ] `npm run test` · `test:mvp` · `governance:traceability` · `security:check` green on the exact head
- [ ] `Quality / verify` and `Quality / deploy-contract` green on that same SHA

**Any unchecked line is reported as unchecked.** A connection runbook that reports
success it did not measure is worse than no runbook, because the next person
trusts it.
