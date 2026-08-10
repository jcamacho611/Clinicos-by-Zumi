# Klinikos by Zumi — build plan

This document organizes every standing directive into one sequence. Where directives
overlap or conflict, this file is the reconciliation, and it defers to the Master Build
Directive on architecture and to "prioritize what makes the most money and sells the
easiest" on ordering.

It is a plan, not a status report. `docs/FEATURE_STATUS.md` is the status report, and
it is the only document permitted to say what is built.

## The thesis in one line

Replace the fragmented software a clinic should no longer need. Connect the healthcare
rails it cannot replace. Use Zumi to turn the result into an operating environment.

## Two connected systems

Klinikos is two AI systems that meet at a payment.

```
        KLINIKOS GROWTH ENGINE                    KLINIKOS CLINIC OS
        (AI sells Klinikos)                       (Zumi runs the clinic)
                  │                                        │
  find prospects ─┤                                        ├─ what needs attention
  qualify ────────┤                                        ├─ who needs follow-up
  personalize ────┤                                        ├─ what revenue is leaking
  demonstrate ────┤          ══ PAYMENT ══                 ├─ which appointments are at risk
  handle objections┤         the dividing line             ├─ what tasks are overdue
  recover checkout─┤                                       ├─ what changed this week
                  │                                        │
                  └──────── provision · entitle · onboard ─┘
                                        │
                        retention → expansion → referral
                                        │
                                        └──────────► more customers
```

**The boundary is absolute.** Before payment a prospect interacts with the Growth
Engine — marketing, a scripted demonstration, safe demo data. Operational Zumi is not
a lead magnet and is never reachable without a verified entitlement. This is already
enforced: `admitZumiRequest` refuses on entitlement with a 402 before any model is
consulted.

## Ordering

The Master Build Directive's priority list and "most money, easiest sell" agree more
than they conflict. Where they diverge, safety and tenant isolation still win — a
breach is not a revenue trade.

| # | Stream | Why here |
| --- | --- | --- |
| 0 | Patient safety, data integrity, tenant isolation | Never traded for anything below it |
| 1 | **Growth Engine** — public site, pricing, Operational Audit, paywall, lead capture, intent scoring, founder dashboard | Sells easiest and earns first. The Operational Audit already has a live payment destination, so it is revenue available with no vendor gate. |
| 2 | **Payment-driven provisioning** — verified webhook → subscription → entitlement → onboarding | Nothing above #1 is real revenue until this is idempotent and auditable |
| 3 | **Zumi post-sale** — the operational capabilities a customer paid for | This is what the money bought |
| 4 | **Core practice operations** — the workflows that make Klinikos worth keeping | Retention |
| 5 | **Revenue recovery** — the feature clinics can measure a return on | Easiest expansion sell |
| 6 | **Connections** — customer-owned relationships | Removes Klinikos cost and unlocks regulated rails |
| 7 | **Interoperability** — labs, imaging, payers, eRx | Longest external lead time, so start the paperwork early and build to the boundary |
| 8 | **GRID expansion** | Second revenue engine |
| 9 | **Migration from existing EHRs** | Required to displace an incumbent, not to win the first customers |

## Stream 1 — the Growth Engine

Public routes, no account required, no usable Zumi interface:

```
/  /how-it-works  /solutions/medical-spa  /solutions/primary-care
/solutions/independent-clinic  /zumi  /pricing  /demo
/operational-audit  /contact  /referral/:code
```

- **`/zumi`** sells Zumi without giving it away: a scripted clinic scenario resolving
  into the corresponding dashboard. No live chat box, no model call, no free trial.
- **`/demo`** is a guided seven-step tour on fixed demo data. The visitor advances
  through it; they cannot issue their own commands.
- **`/pricing`** is built around buying. A named price and a Get Started for the entry
  product; "Talk to Klinikos" only for genuinely custom implementation.
- **`/operational-audit`** is a purchasable product priced server-side from reported
  scale via `auditPriceForAnswers`.

Behind it: lead capture without a mandatory phone number, a lifecycle status
(`NEW → ENGAGED → PRICING_VIEWED → AUDIT_INTEREST → CHECKOUT_STARTED → PAID →
ONBOARDING → ACTIVE → LOST`), intent events, lead scoring, automated follow-up
sequences, referral attribution, and a founder dashboard that surfaces the handful of
prospects worth a personal call.

**Design law applies in full.** These are marketing surfaces, so Nolan governs and
narrative motion is permitted — but copy law, the token set, and the DS primitives are
not relaxed. Each new public route joins `GOVERNED_PUBLIC_SURFACES` so the copy-law
test covers it.

## Stream 2 — payment-driven provisioning

```
plan selected → checkout → VERIFIED WEBHOOK → subscription → entitlements
→ native features on → platform connectors provisioned → onboarding
→ customer-owned connections requested → regulated rails enter approval
→ Zumi receives tenant context and plan limits
```

A browser redirect is never proof of payment. Provisioning must be idempotent,
retry-safe, auditable, tenant-scoped, and recoverable from partial failure.

## Connector architecture

Implemented in `src/lib/connectors/`. Five independent axes, because collapsing them
is how a product claims a capability it does not have.

**Gateways** — `UI → Klinikos service → gateway → adapter → vendor`. Nothing above a
gateway holds a vendor SDK.

```
AI · Location · Payment · Communication · Healthcare Transaction
Clinical Network · Credentialing · Document · Telehealth
```

**Integration class** — how the wiring works: `server_only` (the default; browser →
Klinikos → vendor, never browser → vendor with a secret), `browser_and_server` (one
documented exception: Google Maps JS), `webhook_driven`, `oauth_authorized`,
`regulated_network`.

**Ownership** — `klinikos_owned`, `clinic_owned`, `patient_authorized`,
`regulated_network`. Patient-authorized is separate because a clinic cannot consent on
a patient's behalf.

**Economics** —

| Class | Meaning | Examples |
| --- | --- | --- |
| A — platform | Klinikos' own infrastructure. Metered by tenant, recovered in pricing. | AI, Maps, storage, infrastructure |
| B — customer-owned | The clinic's existing relationship. Klinikos connects it, does not buy it. | Labs, imaging, clearinghouse, their Twilio |
| C — activate after sale | Cost waits until a customer needs the feature. | Telehealth, e-sign, background checks |

Governing principle: **revenue should precede avoidable variable cost.**

**Readiness** — nine independent gates: `configured`, `sandbox_ready`,
`contract_complete`, `baa_complete`, `security_review_complete`, `enrollment_complete`,
`production_credentials`, `phi_approved`, `production_live`.

An unspecified gate is false. Production requires five of them; PHI additionally
requires enrollment, an explicit PHI approval, and — where the vendor needs one — an
executed BAA. **Every connector in the catalog currently has all nine gates false**, and
a test asserts that none reports as live or PHI-usable. Flipping a gate is a deliberate
act that accompanies real paperwork.

## Replace vs. integrate

**Replace** (native Klinikos, this is where subscription value comes from): patient
registry · demographics · provider profiles · encounters · clinical documentation ·
charting · problem lists · orders and results workflow · longitudinal record ·
documents · consent · audit history · patient timeline · scheduling (provider,
location) · reminders · cancellations · waitlists · intake · forms · insurance capture
· staff assignment · tasks · follow-up queues · referral tracking · case workspaces ·
front-desk command center · billing readiness · claim preparation · payment tracking ·
revenue recovery · no-show and lead recovery · reporting · leads and pipelines ·
med-spa CRM · campaigns · retention · secure messaging · portals · telemedicine front
end · inventory · GRID marketplace workflow.

**Integrate** (do not recreate): laboratories · imaging and radiology · payer and
clearinghouse rails · pharmacy and e-prescribing networks · payment and card networks ·
government and credential sources.

The test for any new capability: *can Klinikos reasonably replace this?* If yes, build
it natively. If it is an unavoidable external rail, integrate it and make it feel
native — the front desk should see `Results → Pending → Received → Provider Review →
Patient Notified`, never "go to Quest".

## Standing constraints

These are not negotiable by any later directive:

- No capability may be described as certified, compliant, production-ready, or approved
  before it is. No HIPAA-compliance claim from code alone.
- No fake integration presented as live. No canned response standing in for an
  unconfigured vendor.
- No PHI to any connector merely because credentials exist.
- No client-supplied organization id, price, entitlement, role, or payment status.
- No browser redirect as payment verification.
- Public routes must not solicit PHI.
- No secrets in source control; no PHI or secrets in logs.
- Zumi never diagnoses, prescribes, decides treatment, interprets a result as final,
  guarantees coverage, or acts autonomously on records, claims, credentials, or care.
- Where an external gate blocks completion, build everything up to the boundary and
  document the exact remaining gate.

## External gates nothing in code can clear

AI provider contract and BAA · Stripe account and webhook secret · Whop credentials ·
Google Cloud billing with restricted keys · Resend domain verification · Twilio account
and BAA · Stedi account, BAA, and per-payer enrollment · lab and imaging agreements plus
interface certification · e-prescribing vendor certification and EPCS identity proofing
· CMS Blue Button application approval · SAM.gov API key · object storage BAA · e-sign
vendor selection · Daily HIPAA plan and BAA · Render deployment and GoDaddy DNS for
klinikos.io · school agreements and FERPA review for EDU · counsel review of credential
and verification wording · accessibility audit · logo vector.

Each is recorded against its connector in `src/lib/connectors/catalog.ts` as
`externalGate`, so the blocker is attached to the thing it blocks rather than living
only here.
