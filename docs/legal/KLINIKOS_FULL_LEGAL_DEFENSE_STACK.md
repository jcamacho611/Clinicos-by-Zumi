# KLINIKOS Full Legal Defense Stack

Status: DRAFT FOR COUNSEL REVIEW — NOT PRODUCTION-APPROVED
Version: 2026-08-27.1

> **Every prohibited act must map to a defined contractual consequence, evidence path, survival rule, and remedy.**

## Stack order

### Layer 1 — Public Website Terms

Protect public surfaces through ownership notices, limited-use terms, anti-scraping and anti-bot restrictions, prohibited security abuse, anti-impersonation, unauthorized automation restrictions, unauthorized AI ingestion/training restrictions, appropriate disclaimers, suspension rights, evidence preservation and counsel-reviewed liability/dispute provisions.

### Layer 2 — Protected Access / Confidentiality / IP

Before private demos, investor or partner materials, data rooms, unreleased features, non-public pricing, architecture, Grid mechanics, Zumi internals, technical documentation or other protected resources, require affirmative versioned acceptance of the Confidential Access, Intellectual Property, Trade Secret & Restricted Use Agreement.

Canonical draft:

`docs/legal/KLINIKOS_CONFIDENTIAL_ACCESS_AND_IP_AGREEMENT_DRAFT.md`

### Layer 3 — Role and product agreements

Use additional reviewed documents where the relationship requires them:

- Acceptable Use Policy;
- Klinikos Intelligence / AI terms;
- Grid Marketplace Terms;
- Grid Provider Terms;
- Grid Clinic / Location Terms;
- Clinic MSA;
- Implementation SOW;
- DPA / Security Addendum;
- BAA where required;
- EDU institution / learner terms;
- employment / contractor / contributor confidentiality and IP assignment;
- investor or partner data-room terms where justified.

### Layer 4 — Technical enforcement

Contract rights do not replace technical controls. Enforce protected boundaries through authentication, authorization, legal gates, server-side proprietary logic, tenant isolation, secure session handling, rate limits, anti-enumeration, audit, access revocation, safe download handling, source-map/client-bundle leakage checks, secret management and incident response.

## Breach classes

### Class I — Material Breach

Examples include unauthorized recording/export, prohibited automation, credential sharing, misuse outside authorized purpose, or failure to return/destroy protected information under a valid requirement.

### Class II — Serious Confidentiality / IP Breach

Examples include disclosure of non-public architecture, systematic extraction, unauthorized AI ingestion or training, competitive use of Confidential Information, protected-opportunity circumvention, derivative commercial exploitation, or facilitation of another party's prohibited conduct.

### Class III — Severe Protected-Asset Breach

Examples include intentional or reckless trade-secret theft, unauthorized source/repository acquisition, deliberate auth/security bypass, mass extraction or exfiltration, hidden-prompt/model/orchestration/ranking extraction for exploitation, deliberate credential compromise, malicious evidence destruction, coordinated breach, deliberate protected-information use to accelerate a competitor, or material compromise of protected systems/data.

## Indirect conduct

A prohibited act includes, subject to applicable intent standards, directly or indirectly attempting, requesting, directing, inducing, financing, facilitating, assisting, enabling, conspiring in or knowingly benefiting from prohibited conduct.

## Remedies

Subject to applicable law and no-double-recovery requirements, available remedies may include:

- immediate suspension or termination;
- credential/session/token/invitation revocation;
- return, deletion or destruction;
- evidence preservation;
- injunctive/equitable relief;
- specific performance where available;
- proven actual damages;
- restitution, unjust enrichment and disgorgement where available;
- reasonable forensic, containment, credential-rotation, restoration, remediation, notification and incident-response costs caused by breach where legally recoverable;
- attorneys' fees, expert fees, costs and enforcement expenses where contract and law allow;
- statutory and IP/trade-secret remedies where applicable;
- termination of evaluation, license, Grid, partner or data-room access;
- referral to appropriate authorities where legally appropriate or required.

No double recovery is permitted for the same injury.

## Liquidated damages

No arbitrary punitive amount is production-approved. Any liquidated-damages clause must be tied to a specific hard-to-measure breach, represent a reasonable estimate of anticipated harm rather than punishment, avoid duplicate recovery and receive licensed-counsel approval for the actual facts and governing law.

## Trade-secret immunity notice

Worker, contractor and consultant confidentiality forms must include or lawfully cross-reference the applicable 18 U.S.C. § 1833(b) immunity notice. Protected reporting and sealed-filing rights cannot be contracted away.

## Evidence chain

Protected execution should record, as legally appropriate:

- agreement key/version/effective date;
- SHA-256 content hash;
- signer identity;
- signer capacity;
- organization context;
- authority representation;
- required acknowledgments;
- presentation/review evidence;
- signature method;
- signed timestamp;
- protected destination/source route;
- request/session correlation data;
- IP/user-agent metadata where lawful;
- historical/superseded version relationship.

The server, not the browser, remains authoritative for the current agreement, version, hash and acceptance state.

## Production gate

No legal document becomes `productionApproved: true` merely because it was drafted, committed, rendered or electronically accepted in a test environment.

Licensed counsel must approve the final relationship-specific provisions requiring legal judgment, including liability caps, indemnity, fee shifting, governing law/forum, arbitration/class/jury waivers if used, liquidated damages, anti-circumvention scope/duration, worker restrictions, privacy/healthcare requirements, consumer treatment and international use.
