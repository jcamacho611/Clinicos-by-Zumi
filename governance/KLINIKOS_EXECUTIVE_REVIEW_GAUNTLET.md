# KLINIKOS EXECUTIVE REVIEW GAUNTLET

Status: GOVERNING MULTI-DISCIPLINE DECISION REVIEW
Date: 2026-08-25

## 1. Purpose

Klinikos decisions must survive more than one viewpoint. A technically elegant change can still be commercially weak, clinically unsafe, impossible to implement, legally problematic, unaffordable, inaccessible, or irrelevant to customers.

Every material initiative therefore receives a structured review before it becomes a major roadmap commitment, enterprise promise, capital allocation, public claim, or irreversible architecture decision.

## 2. Required review lenses

### CEO / Strategy
Ask:
- Does this strengthen the category position?
- Does it increase durable enterprise value?
- Does it strengthen the active value loop or distract from it?
- What becomes possible after this exists?

### Customer / Buyer
Ask:
- What real problem disappears?
- Is the benefit obvious without technical explanation?
- Would a rational buyer pay, switch, expand, or remain because of it?

### Product
Ask:
- Which user outcome changes?
- Does it preserve source-locked requirements?
- Does it simplify the product or create another isolated surface?

### Clinical / Informatics
Ask where applicable:
- Does this help clinicians practice safely and efficiently?
- Does it preserve professional authority?
- Does it create unsupported inference or alert burden?

### Engineering / Platform
Ask:
- Does this reuse existing authority and primitives?
- What are the data, event, failure, retry, migration, performance, and observability implications?
- Does it create architectural debt or a reusable platform capability?

### Security / Privacy / Trust
Ask:
- What could be exposed, abused, spoofed, escalated, or leaked?
- What tenant, PHI, PII, trade-secret, identity, payment, or AI boundary changes?
- What evidence proves the control works?

### Finance / Treasury
Ask:
- What does this cost to build and operate?
- What is the direct variable cost?
- What is the expected margin effect?
- What capital type should fund it?
- What happens to runway?

### Sales / Commercial
Ask:
- Who buys this?
- What objection does it remove?
- Does it create a new offer, stronger close, expansion, or enterprise path?
- What claim can sales truthfully make after it ships?

### Implementation / Customer Success
Ask:
- Can a customer adopt this without operational disruption?
- What migration, training, configuration, support, and first-value work is required?
- Does it reduce or increase implementation burden?

### Legal / Regulatory
Ask:
- What contract, consent, reimbursement, marketplace, professional-practice, privacy, research, payment, or regulatory rules apply?
- Is legal review a launch gate or can the system be safely designed before final legal approval?

### Grid / Network / Marketplace
Ask:
- Does it create supply, demand, fulfillment, trust, repeat relationships, or liquidity?
- What market cell benefits?
- Does the economic model preserve eligibility and legal boundaries?

### EDU / Workforce
Ask:
- Does this reveal or solve a workforce shortage?
- Can training/evidence create legitimate supply or institutional value?

### Enterprise / Procurement
Ask:
- What would security, IT, procurement, compliance, legal, finance, or operations demand before buying this?
- Does this increase enterprise readiness or create a new procurement blocker?

### Data / Analytics
Ask:
- What evidence will prove success?
- What data authority and provenance exist?
- What should never enter ordinary analytics?

### Capital / Investor
Ask:
- Does this improve recurring revenue, gross margin, retention, distribution, network effects, moat, enterprise expansion, or capital efficiency?
- Is the story supported by evidence or merely architecture?

### Partnerships / Corporate Development
Ask:
- Should we build, buy, partner, license, invest, or ignore?
- Does an external partner bring customers, regulated access, infrastructure, data, distribution, or faster time-to-value?

### Adversarial Investor
Ask:
- Why is this not a feature that an incumbent can copy?
- What evidence says customers care?
- What makes this compound rather than add cost?

### Adversarial Customer
Ask:
- Why would I trust you?
- Why would I switch?
- What happens when it fails?
- What do I still need another vendor for?

### Adversarial Security Reviewer
Ask:
- How would I abuse this?
- What happens with a malicious tenant, compromised user, poisoned AI context, replayed webhook, forged identity, or unexpected integration failure?

## 3. Required decision record

Every major review must record:

- initiative
- user/customer problem
- CURRENT FACTS
- PROPOSED elements
- EXECUTED dependencies
- evidence
- assumptions
- customer benefit
- business benefit
- cost
- revenue/retention/network hypothesis
- architecture impact
- data authority
- security/privacy impact
- clinical impact
- legal/regulatory impact
- implementation/customer-success impact
- partnership alternative
- capital requirement
- reversibility
- primary risks
- mitigation
- acceptance evidence
- decision
- owner
- review date or trigger

## 4. Allowed outcomes

### BUILD
Evidence and dependencies support implementation now.

### MODIFY
The idea is directionally valuable but requires architecture, safety, economics, UX, or scope changes before implementation.

### TEST
Run a bounded experiment/proof with explicit success and stop criteria.

### DEFER
Potentially valuable but not the current dependency.

### PARTNER
External partnership is strategically superior to internal build now.

### BUY
Acquisition/licensing is superior to internal build and merits diligence.

### REJECT
Does not create sufficient customer/strategic value relative to risk/cost.

### STOP
An existing initiative should cease because evidence no longer supports continued investment.

## 5. Priority formula

Use qualitative judgment supported by a scoring aid across:

- customer pain
- customer economic value
- recurring revenue potential
- gross margin
- retention/expansion
- distribution
- network effect
- data/evidence moat
- enterprise value
- regulatory feasibility
- time to value
- implementation burden
- capital requirement
- architecture reuse
- security/safety risk

Do not treat a numeric score as mathematical truth.

## 6. Stay-on-course override

A newly discovered opportunity interrupts active P0 only when it is:

- required for safety/security
- required by a paying/signed customer
- required to activate revenue
- a genuine blocking dependency
- a reusable primitive without which active P0 cannot work correctly

Otherwise record it in the opportunity/decision registers and continue.

## 7. Review standard

The strongest decision is not the biggest idea.

It is the decision that creates the most durable customer and enterprise value per unit of time, capital, risk, complexity, and founder attention while preserving the architecture's ability to compound later.
