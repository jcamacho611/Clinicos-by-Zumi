# Klinikos NDA Generator

Status: internal drafting aid. Not attorney-approved. Not production-approved legal advice.

## Purpose

The admin NDA generator standardizes the intake decisions required before a reusable NDA is prepared. It does not silently treat one state's rules as universal.

Inputs:

- recipient legal name
- recipient entity, when applicable
- recipient state
- relationship type
- permitted purpose
- disclosure level

Outputs:

- recommended legal modules
- disclosure gate
- companion agreement recommendations
- confidentiality term
- limited non-circumvention term
- liquidated-damages drafting targets
- state/jurisdiction warnings
- pre-signature checklist

## Safety invariants

1. An NDA never authorizes PHI access or replaces a BAA.
2. An NDA never automatically grants production credentials, unrestricted source code, private keys, databases, or admin access.
3. The generator never labels a draft attorney-approved unless counsel actually approves the final recipient-specific agreement.
4. A restrictive covenant is not treated as universally enforceable. State-specific review remains a signature gate.
5. Liquidated damages are drafting targets, not guaranteed recoveries, penalties, or fines.
6. Equity, compensation, partnership status, referral commissions, employment, licensing, and authority require separate agreements.
7. Contributions of code, designs, inventions, or other protectable work require appropriate IP chain-of-title documents.
8. Pre-existing recipient relationships remain outside Klinikos ownership unless a separate lawful agreement states otherwise.

## Current default drafting targets

- ordinary confidential information: 5 years after disclosure
- trade secrets: while legally qualifying as trade secrets
- limited non-circumvention: 18 months for specifically introduced opportunities
- Category I liquidated-damages target: $25,000
- Category II target: $50,000
- Category III target: $75,000
- security credential incidents: reasonable documented remediation costs rather than a fixed automatic penalty

All monetary provisions require recipient-specific enforceability review.

## Disclosure levels

### Level 1 — General

Public product description, public website, high-level market discussion, and ordinary introductory materials.

### Level 2 — Confidential strategic

Roadmap, pricing, commercialization strategy, selected architecture, clinic-network/Grid strategy, selected financial and partnership information.

### Level 3 — Restricted

Only separately authorized information with documented need. Signing an NDA alone is insufficient.

## Melissa example

The current default UI intentionally demonstrates a Florida strategic-partner scenario at Level 2. It does not assume Florida automatically controls final governing law or venue; those remain confirmation items before signature.
