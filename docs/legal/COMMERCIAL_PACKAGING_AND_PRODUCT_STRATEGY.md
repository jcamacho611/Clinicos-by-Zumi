# Klinikos Commercial Packaging & Product Strategy

This document translates the product/commercial direction into a packaging framework for implementation, sales, marketing, and engineering. Pricing remains subject to testing and customer-specific configuration. Internal operating-cost assumptions are planning estimates, not guaranteed costs.

## Core positioning

Klinikos is one platform with multiple sellable operating systems:

### Klinikos Core OS
Base implementation for clinic operations.

Includes:
- patient registration
- patient chart/workflow
- scheduling
- front desk
- encounters
- users/roles/permissions
- tasks
- documents/forms
- multi-location foundations
- operational reporting
- baseline intelligence

Commercial anchor:
- Founding Clinic Implementation: $8,000
- recurring pricing should be qualified/configured rather than presented as one universal public price

Planning recurring ranges:
- solo/small clinic: $750-$1,250/month
- medium clinic: $1,500-$2,500/month
- multi-location: custom

### Klinikos Revenue OS
Includes:
- billing work queues
- claim readiness
- insurance / eligibility workflows
- claims / denials / aging
- payment tracking
- underpayment and revenue leakage review
- revenue recovery
- RCM intelligence

Planning ranges:
- implementation add-on: $3,000-$8,000
- recurring: $750-$3,000+/month

Alternative packaged offer:
- Revenue Recovery setup: $2,500
- recurring: $750/month
- any success-fee model requires legal/commercial review and should be calculated only on verified recovered revenue under a compliant arrangement

### Klinikos Network
Includes:
- partner directory
- referrals
- governed handoffs
- closed-loop tracking
- capacity
- diagnostic/specialist relationships
- consent/sharing controls
- manual fallback workflows

Planning ranges:
- setup: $1,000-$3,000
- recurring: $300-$1,000/month

Network participation may later be partially subsidized to strengthen network effects.

### Klinikos Intelligence
Sell outcomes, not tokens or generic AI access.

Outcomes may include:
- morning briefing
- missing information detection
- revenue leakage detection
- referral risk
- summaries
- follow-up prioritization
- communication drafts
- coding review support
- operational recommendations
- schedule optimization

Planning:
- baseline intelligence included in Core
- Intelligence Plus: $250-$500/month
- enterprise/custom usage pricing as appropriate

### Clinic Operating Analysis
Planning price: $500.

Deliverables:
- current-system inventory
- workflow analysis
- software-spend review
- fragmentation map
- revenue-leakage opportunities
- consolidation opportunities
- recommended Klinikos configuration

May be credited toward implementation when commercially appropriate.

### Implementation Blueprint
Planning price: $1,500.

May include:
- migration map
- integration plan
- workflows
- roles
- automation design
- deployment plan

May be credited toward implementation when commercially appropriate.

### Founding Clinic Implementation
Anchor price: $8,000.

Intended scope:
- operating analysis
- workflow mapping
- configuration
- implementation plan
- migration planning
- integrations planning
- AI workflow setup
- revenue workflow setup
- training / launch
- founding clinic relationship

## GRID as a distinct business line

GRID should operate as a differentiated marketplace/network experience on Klinikos infrastructure, not as another generic sidebar feature.

### GRID Provider
For independent healthcare professionals where legally permitted and appropriately structured.

Possible launch model:
- basic profile: $0
- Pro: $29-$49/month
- marketplace transaction fee on completed paid activity

Potential Pro benefits:
- higher visibility
- advanced availability
- analytics
- immediate lead notifications
- expanded service radius
- priority matching

### GRID Clinic / Location
For clinics/locations monetizing rooms, chairs, equipment or capacity.

Possible model:
- $49-$149/month
- transaction fee where applicable

Potential monetizable inventory/capacity:
- rooms
- chairs
- approved equipment
- available appointment capacity
- services

### Marketplace economics
Planning transaction fee:
- approximately 7%-15%
- 10% is a reasonable testing midpoint, subject to payments costs, insurance, disputes, refunds, acquisition costs and marketplace liquidity

Example:
- $600 transaction
- 10% platform fee = $60 gross platform revenue before payment costs and any required splits

Do not launch a real clinical marketplace fee/split structure without counsel review for fee-splitting, corporate-practice, anti-kickback, professional-practice, tax and marketplace rules where applicable.

## Specialty editions

Specialty editions should be configuration presets, not separate codebases:
- Klinikos Primary Care
- Klinikos Med Spa
- Klinikos Injury / No-Fault
- Klinikos Diagnostic
- Klinikos Behavioral Health
- Klinikos Urgent Care

Presets may change:
- workflows
- forms
- terminology
- queues
- integrations
- reports
- templates

## Design / UX packaging rule

One page should have one dominant work surface.

Preferred patterns:
- Patients -> Data Table
- Schedule -> Calendar
- Encounters -> Editor
- Billing -> Work Queue
- Messages -> Inbox + Thread
- Network -> Relationship Table + Handoff Queue
- GRID -> Map/List Split
- Documents -> Library + Preview
- Labs -> Results Inbox
- CRM -> Funnel / Opportunity Queue
- Settings -> Navigation + Forms

Reduce:
- oversized heroes in authenticated areas
- decorative gradient circles
- giant rounded containers
- nested cards
- repetitive stat-card rows
- excessive whitespace
- pills for ordinary information
- cards where rows, tabs, tables, drawers or detail inspectors are better

Cards should mainly be reserved for:
- isolated alert
- compact summary
- contextual AI suggestion
- configuration decision
- preview
- unusual decision state

## Design primitives

Use these as the authenticated-app foundation:
1. Command Header
2. Stats Strip
3. Filter Bar
4. Data Table
5. Work Queue
6. Split View
7. Timeline
8. Detail Inspector
9. Context Drawer
10. AI Intelligence Rail

## Commercial funnel

Public marketing shell -> See if your clinic qualifies -> proprietary access / analysis -> Clinic Operating Analysis -> implementation proposal -> $8,000 Founding Clinic Implementation -> recurring configuration.

Do not publicly position Klinikos as a $99 self-service SaaS product or universal free trial.

## Planning customer-value ranges

| Customer type | Planning implementation | Planning recurring |
|---|---:|---:|
| Solo/small practice | $8,000 | $750-$1,250/mo |
| 3-8 provider clinic | $8,000-$15,000 | $1,500-$3,000/mo |
| Multi-location | $15,000-$30,000 | $3,000-$7,500/mo |
| Large/custom group | $25,000+ | $5,000-$15,000+/mo |

These are planning ranges, not promises or universal public prices.

## Core product simplification principle

The platform can internally support dozens of domains, but ordinary users should not experience it as dozens of products.

Front desk should feel:
"Here is my day, who needs something, what Klinikos already handled, and what I need to do next."

Provider should feel:
"Here is my clinical queue and what requires my judgment."

Owner should feel:
"Here is what is happening, what is leaking money, what is at risk, and what deserves my attention."

That principle should govern future route, navigation and design decisions.
